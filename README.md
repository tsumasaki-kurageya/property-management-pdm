# ビルメンテナンス業務ガイド

ビルメンテナンス業務の分析成果を、初学者が順番に学び、必要な情報を検索できるドキュメントサイトとして公開するためのAstro Starlightプロジェクトです。

## ローカルで確認する

Node.js 22を使用します。

```bash
npm ci
npm run dev
```

表示されたローカルURLをブラウザで開きます。GitHub Pagesと同じリポジトリ配下パスを含めて確認する場合は、`npm run build`後に`npm run preview`を実行します。

## 検証する

```bash
npm run check
npm run build
```

Pull RequestではDocs CIが同じ検証を自動実行します。

## コンテンツを更新する

- サイト本文は `src/content/docs/` にMarkdownまたはMDXで配置します。
- 学習順序とページの責務は `docs/pages-information-architecture.md` を基準にします。
- 既存の `docs/` 配下の分析成果物を正本とし、事実や業務IDを変更するときは正本を先に更新します。
- Mermaid図は `mermaid` 言語指定のコードブロックで記述できます。

## GitHub Pagesを有効にする

1. リポジトリの **Settings → Pages** を開きます。
2. **Build and deployment → Source** で **GitHub Actions** を選択します。
3. mainへ反映すると `Deploy GitHub Pages` ワークフローがサイトを公開します。

公開先は通常 `https://tsumasaki-kurageya.github.io/property-management-pdm/` です。privateリポジトリからのGitHub Pages公開にはGitHub Pro、Team、Enterprise CloudまたはEnterprise Serverが必要です。契約プランと公開範囲は、公開前にSettingsで確認してください。

## 自動化

- Pull Request: 型・コンテンツ検査と本番ビルド
- main更新: ビルド成果物をGitHub Pagesへ自動デプロイ
