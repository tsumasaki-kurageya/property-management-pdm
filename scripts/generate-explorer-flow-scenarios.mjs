import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const sourcePath = 'docs/04_mappings/explorer-flow-scenarios.md';
const outputPath = 'src/data/explorer/generated/flow-scenarios.json';
const checkOnly = process.argv.includes('--check');

const markdown = await readFile(join(root, sourcePath), 'utf8');
const rows = markdown
  .split('\n')
  .filter((line) => /^\| BM-\d{2}-\d{2} \|/.test(line))
  .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()));

if (rows.length === 0) {
  throw new Error('代表フローが1件も登録されていません。');
}

const businessIdPattern = /^BM-\d{2}-\d{2}$/;
const seen = new Set();
const scenarios = rows.map(([selectedId, previousId, normalNextId, abnormalNextId]) => {
  for (const [label, id] of [
    ['中心業務', selectedId],
    ['前工程', previousId],
    ['通常後続', normalNextId],
    ['異常時後続', abnormalNextId],
  ]) {
    if (!businessIdPattern.test(id ?? '')) throw new Error(`${label}の業務IDが不正です: ${id ?? ''}`);
  }
  if (seen.has(selectedId)) throw new Error(`中心業務が重複しています: ${selectedId}`);
  seen.add(selectedId);
  return {
    selectedId,
    previousId,
    normalNextId,
    abnormalNextId,
    source: { path: sourcePath },
  };
});

const output = `${JSON.stringify(scenarios, null, 2)}\n`;
const outputFile = join(root, outputPath);

if (checkOnly) {
  const current = await readFile(outputFile, 'utf8').catch(() => '');
  if (current !== output) {
    throw new Error(`代表フロー生成物が正本と一致しません。npm run generate:explorer-flow を実行してください: ${outputPath}`);
  }
  console.log(`Explorer flow scenarios: ${scenarios.length} scenario(s)`);
} else {
  await writeFile(outputFile, output, 'utf8');
  console.log(`Generated ${outputPath}: ${scenarios.length} scenario(s)`);
}
