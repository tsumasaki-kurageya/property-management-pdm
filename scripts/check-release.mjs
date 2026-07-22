import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const basePath = '/property-management-pdm/';
const siteOrigin = 'https://tsumasaki-kurageya.github.io';
const errors = [];

function walk(directory, extension) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return walk(path, extension);
    return path.endsWith(extension) ? [path] : [];
  });
}

function assert(condition, message) {
  if (!condition) errors.push(message);
}

function outputFileFor(pathname) {
  let route = pathname;
  if (route.startsWith(basePath)) route = route.slice(basePath.length);
  else if (route === basePath.slice(0, -1)) route = '';
  else return null;
  route = decodeURIComponent(route).replace(/^\/+/, '');
  if (!route || route.endsWith('/')) return join(dist, route, 'index.html');
  return join(dist, route);
}

assert(existsSync(dist), 'distがありません。先にnpm run buildを実行してください。');

if (existsSync(dist)) {
  for (const required of [
    '404.html',
    'sitemap-index.xml',
    'pagefind/pagefind.js',
    'pagefind/pagefind-entry.json',
  ]) {
    assert(existsSync(join(dist, required)), `公開成果物がありません: ${required}`);
  }

  const htmlFiles = walk(dist, '.html');
  assert(htmlFiles.length >= 75, `HTMLページ数が想定未満です: ${htmlFiles.length}`);

  for (const file of htmlFiles) {
    const html = readFileSync(file, 'utf8');
    const label = relative(dist, file);

    assert(/<html\b[^>]*lang="ja-JP"/.test(html), `${label}: langがja-JPではありません`);
    assert(
      html.includes(`<link rel="canonical" href="${siteOrigin}${basePath}`),
      `${label}: canonical URLにGitHub Pagesのbase pathがありません`,
    );

    const headings = [...html.matchAll(/<h([1-6])\b[^>]*>/g)].map((match) => Number(match[1]));
    assert(headings.includes(1), `${label}: h1がありません`);
    for (let index = 1; index < headings.length; index += 1) {
      assert(
        headings[index] <= headings[index - 1] + 1,
        `${label}: 見出し階層がh${headings[index - 1]}からh${headings[index]}へ飛んでいます`,
      );
    }

    for (const match of html.matchAll(/<img\b[^>]*>/g)) {
      assert(/\balt=(?:"[^"]*"|'[^']*')/.test(match[0]), `${label}: altのない画像があります`);
    }

    const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
    for (const match of html.matchAll(/<(?:a|link|script|img)\b[^>]*(?:href|src)=(?:"([^"]+)"|'([^']+)')[^>]*>/g)) {
      const url = match[1] ?? match[2];
      if (!url || /^(?:https?:|mailto:|tel:|data:)/.test(url)) continue;

      if (url.startsWith('#')) {
        const anchor = decodeURIComponent(url.slice(1));
        assert(!anchor || ids.has(anchor), `${label}: ページ内アンカーがありません: ${url}`);
        continue;
      }

      if (url.startsWith('/')) {
        assert(url.startsWith(basePath), `${label}: base path外の参照です: ${url}`);
      }

      const publicPath = label === 'index.html'
        ? basePath
        : label.endsWith('/index.html')
          ? `${basePath}${label.slice(0, -'index.html'.length)}`
          : `${basePath}${label.replace(/\.html$/, '/')}`;
      const parsed = new URL(url, `${siteOrigin}${publicPath}`);
      if (parsed.origin !== siteOrigin) continue;
      const target = outputFileFor(parsed.pathname);
      if (!target) continue;
      const targetExists = existsSync(target) || (existsSync(dirname(target)) && statSync(dirname(target)).isDirectory());
      assert(targetExists, `${label}: 公開成果物の参照先がありません: ${url}`);
      if (parsed.hash && existsSync(target) && target.endsWith('.html')) {
        const targetHtml = readFileSync(target, 'utf8');
        const anchor = decodeURIComponent(parsed.hash.slice(1));
        assert(targetHtml.includes(`id="${anchor}"`), `${label}: 参照先アンカーがありません: ${url}`);
      }
    }
  }

  const renderedSite = htmlFiles.map((file) => readFileSync(file, 'utf8')).join('\n');
  assert(renderedSite.includes('starlight-theme-select'), 'ライト／ダークモード選択がありません');
  assert(renderedSite.includes('starlight-menu-button'), 'スマートフォン用メニューボタンがありません');
  assert(renderedSite.includes('site-search'), '全文検索UIがありません');

  const css = readFileSync(join(root, 'src/styles/diagrams.css'), 'utf8');
  assert(css.includes('@media (max-width: 50rem)'), 'スマートフォン向け図解スタイルがありません');
  assert(css.includes('@media print'), '印刷向け図解スタイルがありません');

  console.log(`${htmlFiles.length}ページの公開成果物を検証しました`);
}

if (errors.length > 0) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exitCode = 1;
}
