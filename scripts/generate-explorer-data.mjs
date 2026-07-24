import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { expandBusinessReferences } from './explorer-business-references.mjs';

const root = process.cwd();
const outputRoot = join(root, 'src/data/explorer/generated');
const checkOnly = process.argv.includes('--check');
const schemaVersion = '2.0.0';
const allowedNodeTypes = new Set([
  'area',
  'business',
  'procedure',
  'artifact',
  'role',
  'standard',
  'lifecycle',
  'process',
]);
const allowedEdgeTypes = new Set([
  'contains',
  'precedes',
  'branches_to',
  'uses',
  'produces',
  'performed_by',
  'approved_by',
  'governed_by',
  'participates_in',
  'related_to',
]);

const sourceTexts = new Map();
const read = async (path) => {
  if (!sourceTexts.has(path)) sourceTexts.set(path, await readFile(join(root, path), 'utf8'));
  return sourceTexts.get(path);
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const normalizeText = (value) => value
  .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
  .replace(/[`*_]/g, '')
  .replace(/<br\s*\/?\s*>/gi, ' ')
  .replace(/\s+/g, ' ')
  .replace(/[。；;]+$/g, '')
  .trim();
const stableId = (prefix, value) => `${prefix}-${sha256(normalizeText(value)).slice(0, 10).toUpperCase()}`;
const slug = (id) => id.toLowerCase();
const unique = (values) => [...new Set(values.filter(Boolean))];

function parseCatalog(markdown) {
  const version = markdown.match(/^# .*? (v[\d.]+)/m)?.[1] ?? '';
  const matches = [...markdown.matchAll(/^### (BM-\d{2}) (.+)$/gm)];
  const areas = matches.map((match, index) => {
    const start = match.index + match[0].length;
    const nextChapter = markdown.indexOf('\n## ', start);
    const end = Math.min(matches[index + 1]?.index ?? markdown.length, nextChapter === -1 ? markdown.length : nextChapter);
    const section = markdown.slice(start, end);
    const taskMatches = [...section.matchAll(/^#### (BM-\d{2}-\d{2}) (.+)$/gm)];
    const tasks = taskMatches.map((task, taskIndex) => ({
      id: task[1],
      name: task[2].trim(),
      body: section
        .slice(task.index + task[0].length, taskMatches[taskIndex + 1]?.index ?? section.length)
        .replace(/\n---\s*$/, '')
        .trim(),
    }));
    return { id: match[1], name: match[2].trim(), tasks };
  });
  const tasks = areas.flatMap((area) => area.tasks);
  assertUniqueIds(areas, '業務領域');
  assertUniqueIds(tasks, '業務');
  return { version, areas, tasks };
}

function parseProcessMappings(markdown, catalog) {
  const section = markdown.match(/## 18\. 業務カタログ全件の接続先\n([\s\S]*?)(?=\n## 19\.)/)?.[1] ?? '';
  const mappings = new Map();
  for (const line of section.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => value.trim());
    const ids = expandBusinessReferences(cells[1] ?? '', catalog, { strict: true });
    const processes = unique((cells[2] ?? '').match(/P\d{2}/g) ?? []);
    for (const id of ids) mappings.set(id, unique([...(mappings.get(id) ?? []), ...processes]));
  }
  return mappings;
}

function assertUniqueIds(items, label) {
  const seen = new Set();
  const duplicates = new Set();
  for (const item of items) {
    if (seen.has(item.id)) duplicates.add(item.id);
    seen.add(item.id);
  }
  if (duplicates.size > 0) throw new Error(`${label}IDが重複しています: ${[...duplicates].join('、')}`);
}

function parseProcessMetadata(markdown) {
  const section = markdown.match(/## 4\. 横断プロセス一覧\n([\s\S]*?)(?=\n## 5\.)/)?.[1] ?? '';
  const metadata = new Map();
  let order = 0;
  for (const line of section.split('\n').filter((value) => /^\| P\d{2} \|/.test(value))) {
    const cells = line.split('|').slice(1, -1).map((value) => normalizeText(value));
    order += 1;
    metadata.set(cells[0], {
      order,
      startTrigger: cells[2] ?? '',
      endState: cells[3] ?? '',
    });
  }
  return metadata;
}

function parseProcesses(markdown, catalog) {
  const matches = [...markdown.matchAll(/^## \d+\. (P\d{2}) (.+)$/gm)];
  const metadata = parseProcessMetadata(markdown);
  const processes = matches
    .map((match, index) => ({
      id: match[1],
      name: match[2].trim(),
      body: markdown
        .slice(
          match.index + match[0].length,
          matches[index + 1]?.index ?? markdown.indexOf('\n## 17.', match.index),
        )
        .trim(),
      ...(metadata.get(match[1]) ?? {}),
    }))
    .filter((process) => Number(process.id.slice(1)) <= 12);
  assertUniqueIds(processes, '横断プロセス');
  const orders = processes.map((process) => process.order);
  if (new Set(orders).size !== orders.length) {
    throw new Error(`横断プロセスの表示順が重複しています: ${orders.join('、')}`);
  }
  const expectedOrders = Array.from({ length: processes.length }, (_value, index) => index + 1);
  if (orders.some((order, index) => order !== expectedOrders[index])) {
    throw new Error(`横断プロセスの表示順が連続していません: ${orders.join('、')}`);
  }
  for (const process of processes) {
    if (!process.order) throw new Error(`横断プロセスの表示順がありません: ${process.id}`);
    process.description = `${process.startTrigger}を契機に開始し、${process.endState}までを扱う。`;
    process.steps = process.id === 'P04'
      ? parseP04ProcessRows(process, catalog)
      : parseOrderedProcessRows(process, catalog);
    if (process.steps.length === 0) throw new Error(`横断プロセスに業務ステップがありません: ${process.id}`);
  }
  return processes.sort((left, right) => left.order - right.order);
}

function parseOrderedProcessRows(process, catalog) {
  const rows = [];
  for (const line of process.body.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => value.trim());
    if (!/^\d+[A-Z]?$/.test(cells[0] ?? '')) continue;
    rows.push({
      order: cells[0],
      id: `${process.id}-${cells[0]}`,
      businessIds: expandBusinessReferences(cells[1] ?? '', catalog, { strict: true }),
      activity: normalizeText(cells[2] ?? ''),
      outputs: normalizeText(cells[3] ?? ''),
      connection: normalizeText(cells[4] ?? ''),
    });
  }
  assertUniqueIds(rows, `${process.id}のステップ`);
  return connectProcessRows(rows);
}

function parseP04ProcessRows(process, catalog) {
  const section = process.body.match(/### 8\.2 領域別の主な流れ\n([\s\S]*?)$/)?.[1] ?? '';
  const rows = [];
  let areaOrder = 0;
  for (const line of section.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => value.trim());
    if (!cells[0] || cells[0] === '領域' || /^-+$/.test(cells[0])) continue;
    areaOrder += 1;
    const areaKey = String(areaOrder).padStart(2, '0');
    const groups = [
      ['PLAN', '計画・条件', cells[1]],
      ['EXECUTE', '実施', cells[2]],
      ['RECORD', '記録・判定', cells[3]],
    ];
    for (let index = 0; index < groups.length; index += 1) {
      const [suffix, phase, expression] = groups[index];
      const id = `${process.id}-${areaKey}-${suffix}`;
      rows.push({
        id,
        order: `${areaOrder}${String.fromCharCode(65 + index)}`,
        businessIds: expandBusinessReferences(expression ?? '', catalog, { strict: true }),
        activity: `${normalizeText(cells[0])}：${phase}`,
        outputs: '',
        connection: index === groups.length - 1 ? normalizeText(cells[4] ?? '') : '',
        nextStepIds: index < groups.length - 1 ? [`${process.id}-${areaKey}-${groups[index + 1][0]}`] : [],
        branches: [],
      });
    }
  }
  assertUniqueIds(rows, `${process.id}のステップ`);
  for (const row of rows) {
    if (row.connection) row.branches = parseConnectionBranches(row.connection, undefined, new Map());
  }
  return rows;
}

function connectProcessRows(rows) {
  const stepIdByOrder = new Map(rows.map((row) => [row.order, row.id]));
  return rows.map((row, index) => {
    const nextRow = rows[index + 1];
    const explicitNextStepIds = unique(
      [...row.connection.matchAll(/(?<!P)(?<!\d)(\d+[A-Z]?)(?!\d)/g)]
        .map((match) => stepIdByOrder.get(match[1]))
        .filter(Boolean),
    );
    const nextStepIds = unique([
      ...(nextRow ? [nextRow.id] : []),
      ...explicitNextStepIds,
    ]);
    return {
      ...row,
      nextStepIds,
      branches: parseConnectionBranches(row.connection, nextRow?.id, stepIdByOrder),
    };
  });
}

function parseConnectionBranches(connection, fallbackStepId, stepIdByOrder) {
  if (!connection || /^\d+[A-Z]?$/.test(connection)) return [];
  const branches = [];
  const withoutBusinessReferences = connection.replace(
    /BM-\d{2}-\d{2}(?:\s*[〜～・、]\s*(?:BM-\d{2}-)?\d{2})*/g,
    '',
  );
  const segments = withoutBusinessReferences
    .split(/[、，,]/)
    .map((value) => normalizeText(value))
    .filter(Boolean);
  for (const segment of segments) {
    const processIds = unique(segment.match(/P\d{2}/g) ?? []);
    const stepOrders = unique(
      [...segment.matchAll(/(?<!P)(?<!\d)(\d+[A-Z]?)(?!\d)/g)].map((match) => match[1]),
    );
    const targetStepIds = stepOrders.map((order) => stepIdByOrder.get(order)).filter(Boolean);
    const label = normalizeText(
      segment
        .replace(/P\d{2}/g, '')
        .replace(/(?<!P)(?<!\d)\d+[A-Z]?(?!\d)/g, '')
        .replace(/(?:又は|または|又|は|から)+/g, '')
        .replace(/^・+|・+$/g, ''),
    ) || segment;
    for (const targetStepId of targetStepIds) branches.push({ label, targetStepId });
    for (const targetProcessId of processIds) branches.push({ label, targetProcessId });
    if (targetStepIds.length === 0 && processIds.length === 0) {
      if (fallbackStepId) branches.push({ label, targetStepId: fallbackStepId });
      else branches.push({ label, terminal: true });
    }
  }
  return branches;
}

function parseCriticalBusinesses(markdown) {
  const matches = [...markdown.matchAll(/^### 4\.\d+ (BM-\d{2}-\d{2}) (.+)$/gm)];
  return matches.map((match, index) => ({
    id: match[1],
    name: match[2].trim(),
    body: markdown.slice(match.index + match[0].length, matches[index + 1]?.index ?? markdown.indexOf('\n## 5.', match.index)).trim(),
  }));
}

function parseKeyValueTable(markdown) {
  const values = new Map();
  for (const line of markdown.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => normalizeText(value));
    if (cells.length < 2 || cells[0] === '項目' || /^-+$/.test(cells[0])) continue;
    values.set(cells[0], cells[1]);
  }
  return values;
}

function parseNamedBulletList(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const section = markdown.match(new RegExp(`\\*\\*${escaped}\\*\\*\\s*\\n([\\s\\S]*?)(?=\\n\\*\\*|\\n#{1,6} |$)`))?.[1] ?? '';
  return section
    .split('\n')
    .map((line) => line.match(/^\s*[-*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .map(normalizeText);
}

function splitItems(value) {
  return unique(
    normalizeText(value)
      .split(/[、，,／/]|および|及び/)
      .map((item) => normalizeText(item.replace(/^(?:主な|必要な)/, '')))
      .filter((item) => item.length >= 2 && item.length <= 80),
  );
}

function extractRoleNames(value) {
  const names = [];
  for (const match of value.matchAll(/(?:^|[、，。])([^、，。]{1,40}?)が/g)) {
    names.push(...match[1].split(/又は|または|・|\/|および|及び/));
  }
  if (names.length === 0) names.push(...value.split(/[、，。]/).slice(0, 3));
  return unique(names.map(normalizeText).filter((name) => name.length >= 2 && name.length <= 40));
}

async function readMarkdownDirectory(directory) {
  const documents = [];
  async function walk(path) {
    for (const item of await readdir(join(root, path), { withFileTypes: true })) {
      const child = join(path, item.name);
      if (item.isDirectory()) await walk(child);
      else if (item.name.endsWith('.md') && item.name !== 'README.md') {
        const markdown = await read(child);
        const title = markdown.match(/^#\s+(.+)$/m)?.[1] ?? item.name;
        const id = title.match(/^(PROC|CHK)-[A-Z]{3}-\d{3}/)?.[0] ?? item.name.split('_')[0];
        documents.push({ id, title: normalizeText(title.replace(`${id} `, '')), path: child, markdown });
      }
    }
  }
  await walk(directory);
  return documents.sort((left, right) => left.id.localeCompare(right.id));
}

function parseProcedureBusinessRelations(markdown, catalog) {
  const section = markdown.match(/## 2\. 業務カタログとの関係\n([\s\S]*?)(?=\n## 3\.)/)?.[1] ?? '';
  const relations = [];
  for (const line of section.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => value.trim());
    if (!(cells[1] ?? '').includes('BM-')) continue;
    const kind = normalizeText(cells[0]);
    for (const id of expandBusinessReferences(cells[1], catalog)) relations.push({ kind, businessId: id });
  }
  return relations;
}

function parseProcedureRoles(markdown) {
  const section = markdown.match(/## 4\. 実施体制\n([\s\S]*?)(?=\n## 5\.)/)?.[1] ?? '';
  const roles = [];
  for (const line of section.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => normalizeText(value));
    if (!cells[0] || cells[0] === '役割' || /^-+$/.test(cells[0])) continue;
    const approval = /責任|管理|選任|承認|判断/.test(cells[0]) || /判断|承認|指示/.test(cells[1] ?? '');
    roles.push({ label: cells[0], description: cells[1] ?? '', edgeType: approval ? 'approved_by' : 'performed_by' });
  }
  return roles;
}

function parseProcedureMaterials(markdown) {
  const section = markdown.match(/## 6\. 必要資料・資機材\n([\s\S]*?)(?=\n## 7\.)/)?.[1] ?? '';
  const items = [];
  for (const line of section.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => normalizeText(value));
    if (!cells[0] || cells[0] === '区分' || /^-+$/.test(cells[0])) continue;
    if (/資料|記録|台帳|図面/.test(cells[0])) items.push(...splitItems(cells[1] ?? ''));
  }
  return unique(items);
}

function parseProcedureEvidence(markdown) {
  const section = markdown.match(/## (?:12|13)\. 記録・証跡\n([\s\S]*?)(?=\n## \d+\.|$)/)?.[1] ?? '';
  const items = [];
  for (const line of section.split('\n')) {
    const bullet = line.match(/^\s*[-*]\s+(.+)$/)?.[1];
    if (bullet) items.push(normalizeText(bullet));
    if (line.startsWith('|')) {
      const cells = line.split('|').slice(1, -1).map((value) => normalizeText(value));
      if (cells[0] && cells[0] !== '項目' && !/^-+$/.test(cells[0])) items.push(cells[0]);
    }
  }
  return unique(items.filter((item) => item.length >= 2 && item.length <= 100));
}

function parseStandards(markdown) {
  const matches = [...markdown.matchAll(/^### 8\.(\d+) (.+)$/gm)];
  return matches.map((match, index) => ({
    id: stableId('STD', match[2]),
    label: normalizeText(match[2]),
    body: markdown.slice(match.index + match[0].length, matches[index + 1]?.index ?? markdown.indexOf('\n## 9.', match.index)).trim(),
    anchor: `8.${match[1]}`,
  }));
}

const lifecycleDefinitions = [
  { id: 'LC-01', label: '要求・契約', description: '顧客要求を業務仕様・見積・契約へ変える', processIds: ['P01'] },
  { id: 'LC-02', label: '立ち上げ', description: '情報・体制・手順を揃えて運用開始可能にする', processIds: ['P02'] },
  { id: 'LC-03', label: '計画・準備', description: '年間・月間・日次計画と作業条件を整える', processIds: ['P03'] },
  { id: 'LC-04', label: '実施・受付', description: '定常業務、顧客依頼、法定業務を実施する', processIds: ['P04', 'P07', 'P08'] },
  { id: 'LC-05', label: '確認・報告', description: '結果確認、品質是正、顧客報告へつなぐ', processIds: ['P05', 'P09'] },
  { id: 'LC-06', label: '復旧・精算', description: '異常復旧と実績・請求・原価を確定する', processIds: ['P06', 'P10'] },
  { id: 'LC-07', label: '改善・更新・終了', description: '分析結果を改善、契約更新又は終了へ反映する', processIds: ['P11', 'P12'] },
];

const standardAreaRules = [
  [/建築基準/, ['BM-09', 'BM-10', 'BM-17']],
  [/消防/, ['BM-09', 'BM-11', 'BM-17']],
  [/衛生/, ['BM-07', 'BM-09', 'BM-17']],
  [/水道/, ['BM-07', 'BM-17']],
  [/電気/, ['BM-08', 'BM-09', 'BM-17']],
  [/フロン|冷媒/, ['BM-08', 'BM-09', 'BM-17']],
  [/浄化槽|排水/, ['BM-07', 'BM-09', 'BM-17']],
  [/労働安全|ボイラー|圧力容器|クレーン/, ['BM-05', 'BM-09', 'BM-17']],
  [/省エネルギー|エネルギー/, ['BM-08', 'BM-18']],
  [/廃棄物|石綿/, ['BM-06', 'BM-10', 'BM-17']],
];

const catalogMarkdown = await read('docs/building-maintenance-business-catalog.md');
const processMarkdown = await read('docs/04_mappings/business-process-map.md');
const criticalMarkdown = await read('docs/04_mappings/critical-business-analysis.md');
const statutoryMarkdown = await read('docs/statutory-duty-profiles.md');
const checklistMappingMarkdown = await read('docs/04_mappings/procedure-to-checklist-map.md');
const catalog = parseCatalog(catalogMarkdown);
const processes = parseProcesses(processMarkdown, catalog);
const processMappings = parseProcessMappings(processMarkdown, catalog);
const processMemberships = new Map(
  [...processMappings].map(([businessId, processIds]) => [businessId, [...processIds]]),
);
for (const process of processes) {
  for (const businessId of unique(process.steps.flatMap((step) => step.businessIds))) {
    processMemberships.set(
      businessId,
      unique([...(processMemberships.get(businessId) ?? []), process.id]),
    );
  }
}
const criticalBusinesses = parseCriticalBusinesses(criticalMarkdown);
const procedures = await readMarkdownDirectory('docs/02_field-procedures');
const checklists = await readMarkdownDirectory('docs/03_checklists');
const standards = parseStandards(statutoryMarkdown);

const nodes = new Map();
const edges = new Map();
const addNode = (node) => {
  if (!allowedNodeTypes.has(node.type)) throw new Error(`未知のノード型です: ${node.type}`);
  const existing = nodes.get(node.id);
  if (existing) {
    if (existing.type !== node.type || existing.label !== node.label) throw new Error(`ノードIDが重複しています: ${node.id}`);
    return existing;
  }
  nodes.set(node.id, node);
  return node;
};
const addEdge = (edge) => {
  if (!allowedEdgeTypes.has(edge.type)) throw new Error(`未知の関係型です: ${edge.type}`);
  const key = `${edge.type}:${edge.from}:${edge.to}`;
  if (!edges.has(key)) edges.set(key, { id: stableId('EDGE', key), ...edge });
};
const addArtifact = (label, sourcePath, kind = 'record') => {
  const normalized = normalizeText(label);
  if (!normalized) return null;
  const id = normalized.match(/^CHK-[A-Z]{3}-\d{3}$/)?.[0] ?? stableId('ART', normalized);
  addNode({ id, type: 'artifact', label: normalized, source: { path: sourcePath }, metadata: { kind } });
  return id;
};
const addRole = (label, description, sourcePath) => {
  const normalized = normalizeText(label);
  if (!normalized) return null;
  const id = stableId('ROLE', normalized);
  addNode({ id, type: 'role', label: normalized, description: normalizeText(description), source: { path: sourcePath } });
  return id;
};

for (const area of catalog.areas) {
  addNode({
    id: area.id,
    type: 'area',
    label: area.name,
    href: `/reference/business-catalog/${slug(area.id)}/`,
    source: { path: 'docs/building-maintenance-business-catalog.md', anchor: slug(area.id) },
    metadata: { taskCount: area.tasks.length },
  });
  for (let index = 0; index < area.tasks.length; index += 1) {
    const task = area.tasks[index];
    addNode({
      id: task.id,
      type: 'business',
      label: task.name,
      description: normalizeText(task.body.split('\n').find((line) => line.trim() && !line.startsWith('**') && !line.startsWith('*')) ?? ''),
      href: `/reference/business-catalog/${slug(area.id)}/#${slug(task.id)}`,
      source: { path: 'docs/building-maintenance-business-catalog.md', anchor: slug(task.id) },
      metadata: { areaId: area.id, catalogOrder: catalog.tasks.indexOf(task) + 1 },
    });
    addEdge({ type: 'contains', from: area.id, to: task.id, source: { path: 'docs/building-maintenance-business-catalog.md' } });
    const next = area.tasks[index + 1];
    if (next) addEdge({ type: 'precedes', from: task.id, to: next.id, label: 'カタログ上の次', source: { path: 'docs/building-maintenance-business-catalog.md' }, metadata: { basis: 'catalog-order' } });
    for (const input of parseNamedBulletList(task.body, '入力')) {
      const artifactId = addArtifact(input, 'docs/building-maintenance-business-catalog.md', 'input');
      if (artifactId) addEdge({ type: 'uses', from: task.id, to: artifactId, source: { path: 'docs/building-maintenance-business-catalog.md' } });
    }
    for (const output of parseNamedBulletList(task.body, '成果物')) {
      const artifactId = addArtifact(output, 'docs/building-maintenance-business-catalog.md', 'output');
      if (artifactId) addEdge({ type: 'produces', from: task.id, to: artifactId, source: { path: 'docs/building-maintenance-business-catalog.md' } });
    }
  }
}

for (const process of processes) {
  addNode({
    id: process.id,
    type: 'process',
    label: process.name,
    href: `/reference/processes/${slug(process.id)}/`,
    source: { path: 'docs/04_mappings/business-process-map.md', anchor: slug(process.id) },
  });
  // 既存UI向けグラフは従来の順序表だけから生成する。
  // 新エクスプローラーは下段で生成する型付き processes.json を利用する。
  const rows = process.id === 'P04'
    ? []
    : process.steps.filter((step) => step.businessIds.length > 0);
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const nextRow = rows[rowIndex + 1];
    if (nextRow) {
      for (const from of row.businessIds) for (const to of nextRow.businessIds) {
        addEdge({ type: 'precedes', from, to, label: process.id, source: { path: 'docs/04_mappings/business-process-map.md' }, metadata: { basis: 'process-map', processId: process.id } });
      }
    }
    for (const targetProcess of unique(row.connection.match(/P\d{2}/g) ?? [])) {
      if (targetProcess === process.id) continue;
      for (const businessId of row.businessIds) addEdge({ type: 'branches_to', from: businessId, to: targetProcess, label: row.connection, source: { path: 'docs/04_mappings/business-process-map.md' } });
    }
    for (const output of splitItems(row.outputs)) {
      const artifactId = addArtifact(output, 'docs/04_mappings/business-process-map.md', 'process-output');
      if (artifactId) for (const businessId of row.businessIds) addEdge({ type: 'produces', from: businessId, to: artifactId, source: { path: 'docs/04_mappings/business-process-map.md' } });
    }
  }
}

for (const task of catalog.tasks) {
  const processIds = processMappings.get(task.id) ?? [];
  for (const processId of processIds) addEdge({ type: 'participates_in', from: task.id, to: processId, source: { path: 'docs/04_mappings/business-process-map.md' } });
}

for (const lifecycle of lifecycleDefinitions) {
  addNode({ id: lifecycle.id, type: 'lifecycle', label: lifecycle.label, description: lifecycle.description, href: '/overview/business-lifecycle/', source: { path: 'src/content/docs/overview/business-lifecycle.md' }, metadata: { processIds: lifecycle.processIds } });
  for (const processId of lifecycle.processIds) addEdge({ type: 'participates_in', from: processId, to: lifecycle.id, source: { path: 'src/content/docs/overview/business-lifecycle.md' } });
}
const lifecycleByProcess = new Map(lifecycleDefinitions.flatMap((stage) => stage.processIds.map((processId) => [processId, stage.id])));
for (const task of catalog.tasks) for (const processId of processMappings.get(task.id) ?? []) {
  const lifecycleId = lifecycleByProcess.get(processId);
  if (lifecycleId) addEdge({ type: 'participates_in', from: task.id, to: lifecycleId, source: { path: 'src/content/docs/overview/business-lifecycle.md' } });
}

for (const item of criticalBusinesses) {
  const values = parseKeyValueTable(item.body);
  const businessNode = nodes.get(item.id);
  if (businessNode?.type === 'business') {
    businessNode.metadata = {
      ...businessNode.metadata,
      startTrigger: values.get('開始契機') ?? '',
      completionCondition: values.get('完了条件') ?? '',
      primaryActivity: values.get('主な活動') ?? '',
      decisionAndException: values.get('主要判断・例外') ?? '',
      actorAndDecisionMaker: values.get('実施主体・判断主体') ?? '',
      relatedBusinessExpression: values.get('後続業務') ?? '',
    };
  }
  for (const input of splitItems(values.get('入力') ?? '')) {
    const artifactId = addArtifact(input, 'docs/04_mappings/critical-business-analysis.md', 'input');
    if (artifactId) addEdge({ type: 'uses', from: item.id, to: artifactId, source: { path: 'docs/04_mappings/critical-business-analysis.md' } });
  }
  for (const output of splitItems(values.get('成果物') ?? '')) {
    const artifactId = addArtifact(output, 'docs/04_mappings/critical-business-analysis.md', 'output');
    if (artifactId) addEdge({ type: 'produces', from: item.id, to: artifactId, source: { path: 'docs/04_mappings/critical-business-analysis.md' } });
  }
  const roleText = values.get('実施主体・判断主体') ?? '';
  for (const roleName of extractRoleNames(roleText)) {
    const roleId = addRole(roleName, roleText, 'docs/04_mappings/critical-business-analysis.md');
    if (!roleId) continue;
    const edgeType = /責任|管理|資格|権限|判断|顧客|所有/.test(roleName) ? 'approved_by' : 'performed_by';
    addEdge({ type: edgeType, from: item.id, to: roleId, source: { path: 'docs/04_mappings/critical-business-analysis.md' } });
  }
}

for (const procedure of procedures) {
  addNode({ id: procedure.id, type: 'procedure', label: procedure.title, source: { path: procedure.path }, metadata: { category: procedure.id.split('-')[1] } });
  const relations = parseProcedureBusinessRelations(procedure.markdown, catalog);
  for (const relation of relations) {
    addEdge({ type: /主業務/.test(relation.kind) ? 'contains' : 'related_to', from: relation.businessId, to: procedure.id, source: { path: procedure.path } });
  }
  for (const role of parseProcedureRoles(procedure.markdown)) {
    const roleId = addRole(role.label, role.description, procedure.path);
    if (roleId) addEdge({ type: role.edgeType, from: procedure.id, to: roleId, source: { path: procedure.path } });
  }
  for (const material of parseProcedureMaterials(procedure.markdown)) {
    const artifactId = addArtifact(material, procedure.path, 'procedure-input');
    if (artifactId) addEdge({ type: 'uses', from: procedure.id, to: artifactId, source: { path: procedure.path } });
  }
  for (const evidence of parseProcedureEvidence(procedure.markdown)) {
    const artifactId = addArtifact(evidence, procedure.path, 'procedure-output');
    if (artifactId) addEdge({ type: 'produces', from: procedure.id, to: artifactId, source: { path: procedure.path } });
  }
}

for (const checklist of checklists) {
  addNode({ id: checklist.id, type: 'artifact', label: checklist.title, source: { path: checklist.path }, metadata: { kind: 'checklist' } });
}
for (const line of checklistMappingMarkdown.split('\n').filter((value) => value.startsWith('|'))) {
  const procedureIds = unique(line.match(/PROC-[A-Z]{3}-\d{3}/g) ?? []);
  const checklistIds = unique(line.match(/CHK-[A-Z]{3}-\d{3}/g) ?? []);
  for (const procedureId of procedureIds) for (const checklistId of checklistIds) {
    if (nodes.has(procedureId) && nodes.has(checklistId)) addEdge({ type: 'produces', from: procedureId, to: checklistId, label: '実行記録', source: { path: 'docs/04_mappings/procedure-to-checklist-map.md' } });
  }
}

for (const standard of standards) {
  addNode({ id: standard.id, type: 'standard', label: standard.label, href: '/variations/statutory-duties/', source: { path: 'docs/statutory-duty-profiles.md', anchor: standard.anchor } });
  const relatedBusinessIds = new Set(expandBusinessReferences(standard.body, catalog));
  for (const [pattern, areaIds] of standardAreaRules) if (pattern.test(standard.label)) {
    for (const areaId of areaIds) for (const task of catalog.areas.find((area) => area.id === areaId)?.tasks ?? []) relatedBusinessIds.add(task.id);
  }
  relatedBusinessIds.add('BM-17-08');
  for (const businessId of relatedBusinessIds) if (nodes.has(businessId)) addEdge({ type: 'governed_by', from: businessId, to: standard.id, source: { path: 'docs/statutory-duty-profiles.md' } });
}

const nodeList = [...nodes.values()].sort((left, right) => left.id.localeCompare(right.id));
const edgeList = [...edges.values()].sort((left, right) => left.id.localeCompare(right.id));
const nodeIds = new Set(nodeList.map((node) => node.id));
for (const node of nodeList) if (!allowedNodeTypes.has(node.type)) throw new Error(`不正なノード型です: ${node.id}`);
for (const edge of edgeList) {
  if (!nodeIds.has(edge.from)) throw new Error(`関係の参照元がありません: ${edge.id} -> ${edge.from}`);
  if (!nodeIds.has(edge.to)) throw new Error(`関係の参照先がありません: ${edge.id} -> ${edge.to}`);
}
if (catalog.areas.length !== 18) throw new Error(`業務領域が18件ではありません: ${catalog.areas.length}`);
if (catalog.tasks.length !== 178) throw new Error(`個別業務が178件ではありません: ${catalog.tasks.length}`);
if (processes.length !== 12) throw new Error(`横断プロセスが12件ではありません: ${processes.length}`);
if (new Set(nodeList.map((node) => node.id)).size !== nodeList.length) throw new Error('生成ノードIDが重複しています');
const degree = new Map(nodeList.map((node) => [node.id, 0]));
for (const edge of edgeList) {
  degree.set(edge.from, degree.get(edge.from) + 1);
  degree.set(edge.to, degree.get(edge.to) + 1);
}
const isolated = [...degree].filter(([, count]) => count === 0).map(([id]) => id);
if (isolated.length > 0) throw new Error(`孤立ノードがあります: ${isolated.join('、')}`);
for (const task of catalog.tasks) {
  const taskEdges = edgeList.filter((edge) => edge.from === task.id || edge.to === task.id);
  if (!taskEdges.some((edge) => edge.type === 'contains' && edge.to === task.id)) throw new Error(`上位領域がありません: ${task.id}`);
}

const processIds = new Set(processes.map((process) => process.id));
for (const [businessId, mappedProcessIds] of processMemberships) {
  if (!nodeIds.has(businessId)) throw new Error(`プロセス索引が未定義の業務を参照しています: ${businessId}`);
  for (const processId of mappedProcessIds) {
    if (!processIds.has(processId)) throw new Error(`プロセス索引が未定義のプロセスを参照しています: ${businessId} -> ${processId}`);
  }
}
for (const process of processes) {
  for (const step of process.steps) {
    for (const businessId of step.businessIds) {
      if (!nodeIds.has(businessId)) throw new Error(`${process.id}が未定義の業務を参照しています: ${step.id} -> ${businessId}`);
    }
    for (const nextStepId of step.nextStepIds) {
      if (!process.steps.some((candidate) => candidate.id === nextStepId)) {
        throw new Error(`${process.id}が未定義の次工程を参照しています: ${step.id} -> ${nextStepId}`);
      }
    }
    for (const branch of step.branches) {
      if (branch.targetStepId && !process.steps.some((candidate) => candidate.id === branch.targetStepId)) {
        throw new Error(`${process.id}が未定義の分岐先工程を参照しています: ${step.id} -> ${branch.targetStepId}`);
      }
      if (branch.targetProcessId && !processIds.has(branch.targetProcessId)) {
        throw new Error(`${process.id}が未定義の分岐先プロセスを参照しています: ${step.id} -> ${branch.targetProcessId}`);
      }
    }
  }
}

const counts = Object.fromEntries([...allowedNodeTypes].map((type) => [type, nodeList.filter((node) => node.type === type).length]));
const sourceHashes = Object.fromEntries([...sourceTexts.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([path, text]) => [path, sha256(text)]));
const manifest = {
  schemaVersion,
  catalogVersion: catalog.version,
  counts: { ...counts, edges: edgeList.length },
  sourceHashes,
};
const businessAreas = catalog.areas.map((area, index) => ({
  id: area.id,
  label: area.name,
  order: index + 1,
  businessIds: area.tasks.map((task) => task.id),
}));
  const processIndex = processes.map((process) => {
  const businessIds = catalog.tasks
    .filter((task) => (processMemberships.get(task.id) ?? []).includes(process.id))
    .map((task) => task.id);
  const entrySteps = process.id === 'P04'
    ? process.steps.filter((step) => step.id.endsWith('-PLAN'))
    : [process.steps.find((step) => step.businessIds.length > 0)].filter(Boolean);
  const exitSteps = process.id === 'P04'
    ? process.steps.filter((step) => step.id.endsWith('-RECORD'))
    : [process.steps.findLast((step) => step.businessIds.length > 0)].filter(Boolean);
  const entryBusinessIds = unique(entrySteps.flatMap((step) => step.businessIds));
  const exitBusinessIds = unique(exitSteps.flatMap((step) => step.businessIds));
  return {
  id: process.id,
  label: process.name,
  order: process.order,
  description: process.description,
  startTrigger: process.startTrigger,
  endState: process.endState,
  lifecycleId: lifecycleByProcess.get(process.id),
  entryBusinessIds,
  exitBusinessIds,
  businessIds,
  steps: process.steps.map((step) => ({
    id: step.id,
    order: step.order,
    businessIds: step.businessIds,
    activity: step.activity,
    outputs: step.outputs,
    connection: step.connection,
    nextStepIds: step.nextStepIds,
    branches: step.branches,
    source: { path: 'docs/04_mappings/business-process-map.md', anchor: slug(process.id) },
  })),
  source: { path: 'docs/04_mappings/business-process-map.md', anchor: slug(process.id) },
  };
});
const processOrder = new Map(processIndex.map((process) => [process.id, process.order]));
const businessIndex = catalog.tasks.map((task) => ({
  businessId: task.id,
  areaId: task.id.slice(0, 5),
  processIds: [...(processMemberships.get(task.id) ?? [])]
    .sort((left, right) => processOrder.get(left) - processOrder.get(right)),
}));
const outputs = new Map([
  ['business-nodes.json', `${JSON.stringify(nodeList, null, 2)}\n`],
  ['business-edges.json', `${JSON.stringify(edgeList, null, 2)}\n`],
  ['business-areas.json', `${JSON.stringify(businessAreas, null, 2)}\n`],
  ['business-index.json', `${JSON.stringify(businessIndex, null, 2)}\n`],
  ['lifecycle-stages.json', `${JSON.stringify(lifecycleDefinitions, null, 2)}\n`],
  ['processes.json', `${JSON.stringify(processIndex, null, 2)}\n`],
  ['manifest.json', `${JSON.stringify(manifest, null, 2)}\n`],
]);

const mismatches = [];
for (const [filename, expected] of outputs) {
  const path = join(outputRoot, filename);
  if (checkOnly) {
    const actual = await readFile(path, 'utf8').catch(() => '');
    if (actual !== expected) mismatches.push(relative(root, path));
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, expected);
  }
}
if (mismatches.length > 0) {
  throw new Error(`エクスプローラー生成データが正本と一致しません:\n${mismatches.map((path) => `- ${path}`).join('\n')}\nnpm run generate:explorer を実行してください`);
}
console.log(`${nodeList.length}ノード・${edgeList.length}関係を${checkOnly ? '検証' : '生成'}しました（18領域、178業務、${procedures.length}手順、${processes.length}プロセス）`);
