import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';

const docsRoot = resolve('src/content/docs');
const files = [];
async function walk(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = join(path, item.name);
    if (item.isDirectory()) await walk(child);
    else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) files.push(child);
  }
}
await walk(docsRoot);

const missing = [];
for (const file of files) {
  const markdown = await readFile(file, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].split('?')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    const routeBase = basename(file).startsWith('index.')
      ? dirname(file)
      : join(dirname(file), basename(file, extname(file)));
    const bases = target.startsWith('/')
      ? [resolve(docsRoot, `.${target}`)]
      : [resolve(dirname(file), target), resolve(routeBase, target)];
    const candidates = bases.flatMap((base) => extname(base) ? [base] : [base, `${base}.md`, join(base, 'index.md')]);
    const found = await Promise.all(candidates.map((candidate) => stat(candidate).then(() => true).catch(() => false)));
    if (!found.some(Boolean)) missing.push(`${file.replace(`${docsRoot}/`, '')}: ${match[1]}`);
  }
}

if (missing.length) throw new Error(`リンク先が見つかりません:\n${missing.join('\n')}`);
console.log(`${files.length}ページのローカルリンクを検証しました`);
