import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = process.cwd();
const outputRoot = join(root, 'src/content/docs/reference');
const checkOnly = process.argv.includes('--check');
const repoUrl = 'https://github.com/tsumasaki-kurageya/property-management-pdm/blob/main/';
const checkedOn = '2026-07-23';
const read = (path) => readFile(join(root, path), 'utf8');
const sourceLink = (path) => `${repoUrl}${path}`;
const slug = (id) => id.toLowerCase();

function frontmatter({ title, description, sourceFile, sourceVersion = '' }) {
  return [
    '---', `title: ${title}`, `description: ${description}`, `sourceFile: ${sourceFile}`,
    ...(sourceVersion ? [`sourceVersion: ${sourceVersion}`] : []),
    'contentStatus: 原本から自動生成', 'generated: true', `editUrl: ${sourceLink(sourceFile)}`, '---', '',
    ':::note[このページの位置づけ]',
    `分析用原本から自動生成した表示用ページです。内容を変更するときは[原本](${sourceLink(sourceFile)})を更新してください。最終生成確認日：${checkedOn}。`,
    ':::', '',
  ].join('\n');
}

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
      id: task[1], name: task[2].trim(),
      body: section.slice(task.index + task[0].length, taskMatches[taskIndex + 1]?.index ?? section.length).replace(/\n---\s*$/, '').trim(),
    }));
    return { id: match[1], name: match[2].trim(), tasks };
  });
  return { version, areas, tasks: areas.flatMap((area) => area.tasks) };
}

function expandBusinessIds(expression) {
  const ids = [];
  let area = '';
  for (const token of expression.split('、')) {
    const prefix = token.match(/BM-(\d{2})-/);
    if (prefix) area = prefix[1];
    const normalized = token.replace(/^.*?BM-\d{2}-/, '');
    for (const part of normalized.split('・')) {
      const range = part.match(/^(\d{2})〜(?:BM-\d{2}-)?(\d{2})$/);
      if (range) for (let n = Number(range[1]); n <= Number(range[2]); n += 1) ids.push(`BM-${area}-${String(n).padStart(2, '0')}`);
      else if (/^\d{2}$/.test(part)) ids.push(`BM-${area}-${part}`);
    }
  }
  return ids;
}

function parseProcessMappings(markdown) {
  const section = markdown.match(/## 18\. 業務カタログ全件の接続先\n([\s\S]*?)(?=\n## 19\.)/)?.[1] ?? '';
  const mappings = new Map();
  for (const line of section.split('\n').filter((value) => value.startsWith('|'))) {
    const cells = line.split('|').slice(1, -1).map((value) => value.trim());
    if (!cells[1]?.includes('BM-') || !cells[2]?.includes('P')) continue;
    const processes = [...new Set(cells[2].match(/P\d{2}/g) ?? [])];
    for (const id of expandBusinessIds(cells[1])) mappings.set(id, processes);
  }
  return mappings;
}

function parseProcesses(markdown) {
  const matches = [...markdown.matchAll(/^## \d+\. (P\d{2}) (.+)$/gm)];
  return matches.map((match, index) => ({
    id: match[1], name: match[2].trim(),
    body: markdown.slice(match.index + match[0].length, matches[index + 1]?.index ?? markdown.indexOf('\n## 17.', match.index)).trim(),
  })).filter((process) => Number(process.id.slice(1)) <= 12);
}

function parseCriticalBusinesses(markdown) {
  const matches = [...markdown.matchAll(/^### 4\.\d+ (BM-\d{2}-\d{2}) (.+)$/gm)];
  return matches.map((match, index) => ({
    id: match[1], name: match[2].trim(),
    body: markdown.slice(match.index + match[0].length, matches[index + 1]?.index ?? markdown.indexOf('\n## 5.', match.index)).trim(),
  }));
}

async function parseDocumentDirectory(directory) {
  const entries = [];
  async function walk(path) {
    for (const item of await readdir(join(root, path), { withFileTypes: true })) {
      const child = join(path, item.name);
      if (item.isDirectory()) await walk(child);
      else if (item.name.endsWith('.md') && item.name !== 'README.md') {
        const text = await read(child);
        entries.push({ id: item.name.split('_')[0], title: text.match(/^# (.+)$/m)?.[1] ?? item.name, path: child });
      }
    }
  }
  await walk(directory);
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

const narrativeByArea = {
  'BM-01': '/operations/pre-contract-and-specification/', 'BM-02': '/operations/contracts-and-responsibilities/',
  'BM-03': '/operations/startup/', 'BM-04': '/operations/planning-and-unperformed-work/',
  'BM-05': '/field-work/staffing-and-contractors/', 'BM-06': '/field-work/cleaning/',
  'BM-07': '/field-work/hygiene/', 'BM-08': '/field-work/equipment-operation/',
  'BM-09': '/field-work/inspection-and-maintenance/', 'BM-10': '/incidents/abnormality-to-restoration/',
  'BM-11': '/field-work/security-and-disaster-prevention/', 'BM-12': '/incidents/complaints-accidents-and-disasters/',
  'BM-13': '/field-work/records-and-reports/', 'BM-14': '/operations/startup/',
  'BM-15': '/field-work/materials-and-inventory/', 'BM-16': '/operations/additional-work-billing-and-costs/',
  'BM-17': '/variations/statutory-duties/', 'BM-18': '/overview/business-lifecycle/',
};
const profileSources = [
  ['建物用途', 'docs/building-use-profiles.md', '/variations/building-use/'],
  ['管理方式', 'docs/management-operation-profiles.md', '/variations/management-methods/'],
  ['契約役割', 'docs/contract-role-profiles.md', '/variations/contract-layers/'],
  ['オーナー・PM・FM・BM責任分界', 'docs/owner-pm-fm-bm-responsibility-profiles.md', '/variations/responsibility-boundaries/'],
  ['法令義務', 'docs/statutory-duty-profiles.md', '/variations/statutory-duties/'],
];
const outputs = new Map();
const add = (path, content) => outputs.set(join(outputRoot, path), `${content.trim()}\n`);
const anchor = (item) => item.id.toLowerCase();

const catalogMarkdown = await read('docs/building-maintenance-business-catalog.md');
const processMarkdown = await read('docs/04_mappings/business-process-map.md');
const criticalMarkdown = await read('docs/04_mappings/critical-business-analysis.md');
const catalog = parseCatalog(catalogMarkdown);
const processMappings = parseProcessMappings(processMarkdown);
const processes = parseProcesses(processMarkdown);
const criticalBusinesses = parseCriticalBusinesses(criticalMarkdown);
const criticalIds = new Set(criticalBusinesses.map((item) => item.id));
const taskById = new Map(catalog.tasks.map((task) => [task.id, task]));

if (catalog.tasks.length !== 178) throw new Error(`業務件数が178件ではありません: ${catalog.tasks.length}`);
if (taskById.size !== catalog.tasks.length) throw new Error('業務IDが重複しています');
if (processes.length !== 12) throw new Error(`横断プロセスが12件ではありません: ${processes.length}`);
if (criticalBusinesses.length !== 14) throw new Error(`重要業務が14件ではありません: ${criticalBusinesses.length}`);
for (const task of catalog.tasks) if (!processMappings.has(task.id)) throw new Error(`接続先がありません: ${task.id}`);

let catalogIndex = frontmatter({ title: '業務カタログ', description: '18領域・178業務を業務IDと名称から調べる索引です。', sourceFile: 'docs/building-maintenance-business-catalog.md', sourceVersion: catalog.version });
catalogIndex += '# 18領域・178業務\n\n業務IDまたは日本語の業務名をサイト内検索へ入力するか、次の領域から辿ってください。業務の順序は[12横断プロセス](../processes/)で確認できます。\n\n| 領域 | 業務数 | 本文で学ぶ |\n|---|---:|---|\n';
for (const area of catalog.areas) catalogIndex += `| [${area.id} ${area.name}](./${slug(area.id)}/) | ${area.tasks.length} | [解説](${narrativeByArea[area.id]}) |\n`;
catalogIndex += '\n## 検索の例\n\n- 業務ID：`BM-10-02`\n- 業務名：`緊急度を判断する`\n- 領域名：`不具合・修繕管理`\n';
add('business-catalog/index.md', catalogIndex);

for (const area of catalog.areas) {
  let page = frontmatter({ title: `${area.id} ${area.name}`, description: `${area.name}に含まれる${area.tasks.length}業務のリファレンスです。`, sourceFile: 'docs/building-maintenance-business-catalog.md', sourceVersion: catalog.version });
  page += `# ${area.id} ${area.name}\n\n[本文でこの領域を学ぶ](${narrativeByArea[area.id]}) · [18領域へ戻る](../)\n\n## 業務一覧\n\n`;
  page += area.tasks.map((task) => `- [${task.id} ${task.name}](#${anchor(task)})`).join('\n');
  page += '\n\n';
  for (const task of area.tasks) {
    const index = catalog.tasks.indexOf(task);
    const previous = catalog.tasks[index - 1];
    const next = catalog.tasks[index + 1];
    page += `<span id="${anchor(task)}"></span>\n\n## ${task.id} ${task.name}\n\n${task.body}\n\n`;
    page += `**接続するプロセス:** ${(processMappings.get(task.id) ?? []).map((id) => `[${id}](../../processes/${id.toLowerCase()}/)`).join('、')}\n\n`;
    if (criticalIds.has(task.id)) page += `**重要業務分析:** [判断・完了条件を確認](../../critical-businesses/#${anchor(task)})\n\n`;
    const links = [];
    if (previous) links.push(`[前の業務: ${previous.id}](../${slug(previous.id.slice(0, 5))}/#${anchor(previous)})`);
    if (next) links.push(`[次の業務: ${next.id}](../${slug(next.id.slice(0, 5))}/#${anchor(next)})`);
    page += `${links.join(' · ')}\n\n`;
  }
  add(`business-catalog/${slug(area.id)}/index.md`, page);
}

let processIndex = frontmatter({ title: '12横断プロセス', description: '178業務を契約前から更新・終了までの流れで確認する索引です。', sourceFile: 'docs/04_mappings/business-process-map.md', sourceVersion: 'v0.1' });
processIndex += '# 12横断プロセス\n\n領域が「仕事の種類」を示すのに対し、横断プロセスは複数領域を通って仕事が完了する流れを示します。\n\n| ID | プロセス |\n|---|---|\n';
for (const process of processes) processIndex += `| [${process.id}](./${process.id.toLowerCase()}/) | ${process.name} |\n`;
add('processes/index.md', processIndex);
for (const process of processes) {
  let page = frontmatter({ title: `${process.id} ${process.name}`, description: `${process.name}の開始、判断、成果物、接続を確認します。`, sourceFile: 'docs/04_mappings/business-process-map.md', sourceVersion: 'v0.1' });
  page += `# ${process.id} ${process.name}\n\n${process.body}\n\n[12横断プロセスへ戻る](../) · [流れを本文で学ぶ](/overview/business-lifecycle/)\n`;
  add(`processes/${process.id.toLowerCase()}/index.md`, page);
}

let criticalPage = frontmatter({ title: '重要業務14件', description: '判断、例外処理、責任移管、証跡確定に影響する14業務の詳細です。', sourceFile: 'docs/04_mappings/critical-business-analysis.md' });
criticalPage += '# 重要業務14件\n\n頻度順ではなく、業務間の接続、重要判断、例外処理、責任移管、証跡確定、横断性から選定された業務です。\n\n';
criticalPage += criticalBusinesses.map((item) => `- [${item.id} ${item.name}](#${anchor(item)})`).join('\n');
criticalPage += '\n\n';
for (const item of criticalBusinesses) criticalPage += `<span id="${anchor(item)}"></span>\n\n## ${item.id} ${item.name}\n\n${item.body}\n\n[業務カタログで確認](../business-catalog/${slug(item.id.slice(0, 5))}/#${anchor(item)})\n\n`;
add('critical-businesses/index.md', criticalPage);

let profilesPage = frontmatter({ title: '条件差プロファイル', description: '用途、管理方式、契約役割、責任主体、法令による業務差の原本索引です。', sourceFile: 'docs/pages-information-architecture.md' });
profilesPage += '# 条件差プロファイル\n\nプロファイルは178業務を複製するものではなく、同じ業務の適用条件、担当、判断点、引渡し条件がどう変わるかを示します。\n\n| 条件軸 | 本文 | 分析用原本 |\n|---|---|---|\n';
for (const [name, path, narrative] of profileSources) profilesPage += `| ${name} | [解説](${narrative}) | [原本](${sourceLink(path)}) |\n`;
add('profiles/index.md', profilesPage);

const procedures = await parseDocumentDirectory('docs/02_field-procedures');
const checklists = await parseDocumentDirectory('docs/03_checklists');
for (const [kind, title, entries, sourceFile, note] of [
  ['field-procedures', '現場作業手順', procedures, 'docs/02_field-procedures/README.md', '手順は業務理解の具体例であり、個別物件へそのまま適用できる標準手順ではありません。'],
  ['checklists', 'チェックリスト', checklists, 'docs/04_mappings/procedure-to-checklist-map.md', 'チェックリストは実施・確認・証跡の観点を示す例であり、物件固有の仕様や法令条件を置き換えません。'],
]) {
  let page = frontmatter({ title, description: `${title}のID別索引です。`, sourceFile });
  page += `# ${title}\n\n:::caution[利用上の注意]\n${note}\n:::\n\n| ID | 名称 | 原本 |\n|---|---|---|\n`;
  for (const entry of entries) page += `| ${entry.id} | ${entry.title.replace(/^.*?：/, '')} | [Markdown](${sourceLink(entry.path)}) |\n`;
  add(`${kind}/index.md`, page);
}

let sourcesPage = frontmatter({ title: '分析用原本一覧', description: '公開リファレンスの生成元と役割を追跡する一覧です。', sourceFile: 'docs/pages-information-architecture.md' });
sourcesPage += '# 分析用原本一覧\n\n| 表示用リファレンス | 正本 | 更新方法 |\n|---|---|---|\n';
sourcesPage += `| [業務カタログ](../business-catalog/) | [業務カタログ](${sourceLink('docs/building-maintenance-business-catalog.md')}) | 原本更新後に \`npm run generate:reference\` |\n`;
sourcesPage += `| [12横断プロセス](../processes/) | [業務プロセスマップ](${sourceLink('docs/04_mappings/business-process-map.md')}) | 同上 |\n`;
sourcesPage += `| [重要業務14件](../critical-businesses/) | [重要業務分析](${sourceLink('docs/04_mappings/critical-business-analysis.md')}) | 同上 |\n`;
sourcesPage += `| [条件差プロファイル](../profiles/) | 各プロファイル原本 | 索引の対応関係を確認 |\n`;
sourcesPage += `| [現場作業手順](../field-procedures/) | [手順ディレクトリ](${repoUrl}docs/02_field-procedures) | ID・名称を再生成 |\n`;
sourcesPage += `| [チェックリスト](../checklists/) | [チェックリストディレクトリ](${repoUrl}docs/03_checklists) | ID・名称を再生成 |\n`;
add('sources/index.md', sourcesPage);

for (const [path, expected] of outputs) {
  if (checkOnly) {
    const actual = await readFile(path, 'utf8').catch(() => '');
    if (actual !== expected) throw new Error(`生成結果が原本と一致しません: ${relative(root, path)}\nnpm run generate:reference を実行してください`);
  } else {
    await mkdir(join(path, '..'), { recursive: true });
    await writeFile(path, expected);
  }
}
console.log(`${outputs.size}ページを${checkOnly ? '検証' : '生成'}しました（178業務、12プロセス、14重要業務）`);
