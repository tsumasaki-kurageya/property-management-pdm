import { readFile, readdir, stat } from 'node:fs/promises';
import { basename, dirname, extname, join, resolve } from 'node:path';

const docsRoot = resolve('src/content/docs');
const pagesRoot = resolve('src/pages');
const files = [];

async function walk(path) {
  for (const item of await readdir(path, { withFileTypes: true })) {
    const child = join(path, item.name);
    if (item.isDirectory()) await walk(child);
    else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) files.push(child);
  }
}

await walk(docsRoot);

function contentCandidates(base) {
  return extname(base)
    ? [base]
    : [base, `${base}.md`, `${base}.mdx`, join(base, 'index.md'), join(base, 'index.mdx')];
}

function pageCandidates(target) {
  const route = target.replace(/^\/+|\/+$/g, '');
  const base = resolve(pagesRoot, route || 'index');
  return [
    `${base}.astro`,
    `${base}.md`,
    `${base}.mdx`,
    join(base, 'index.astro'),
    join(base, 'index.md'),
    join(base, 'index.mdx'),
  ];
}

const missing = [];
for (const file of files) {
  const markdown = await readFile(file, 'utf8');
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].split('?')[0];
    if (!target || /^(https?:|mailto:)/.test(target)) continue;

    const routeBase = basename(file).startsWith('index.')
      ? dirname(file)
      : join(dirname(file), basename(file, extname(file)));

    const candidates = target.startsWith('/')
      ? [
          ...contentCandidates(resolve(docsRoot, `.${target}`)),
          ...pageCandidates(target),
        ]
      : contentCandidates(resolve(routeBase, target));

    const found = await Promise.all(
      candidates.map((candidate) => stat(candidate).then(() => true).catch(() => false)),
    );
    if (!found.some(Boolean)) missing.push(`${file.replace(`${docsRoot}/`, '')}: ${match[1]}`);
  }
}

if (missing.length) throw new Error(`リンク先が見つかりません:\n${missing.join('\n')}`);
console.log(`${files.length}ページのローカルリンクを検証しました`);
