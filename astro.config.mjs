import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://tsumasaki-kurageya.github.io',
  base: '/property-management-pdm',
  trailingSlash: 'always',
  integrations: [
    mermaid({
      autoTheme: true,
      enableLog: false,
    }),
    starlight({
      title: 'ビルメンテナンス業務ガイド',
      description: 'ビルメンテナンス業務の全体像を初学者向けに整理したガイド',
      locales: {
        root: {
          label: '日本語',
          lang: 'ja-JP',
        },
      },
      social: [
        {
          icon: 'github',
          label: 'GitHub',
          href: 'https://github.com/tsumasaki-kurageya/property-management-pdm',
        },
      ],
      editLink: {
        baseUrl: 'https://github.com/tsumasaki-kurageya/property-management-pdm/edit/main/',
      },
      sidebar: [
        {
          label: 'はじめに',
          items: [
            { label: 'ガイドの読み方', slug: 'introduction' },
          ],
        },
        {
          label: '業務の全体像',
          items: [{ label: '準備中', slug: 'overview' }],
        },
        {
          label: '現場の業務',
          items: [{ label: '準備中', slug: 'field-work' }],
        },
        {
          label: '異常と周辺業務',
          items: [{ label: '準備中', slug: 'incidents-and-operations' }],
        },
        {
          label: '条件による違い',
          items: [{ label: '準備中', slug: 'variations' }],
        },
        {
          label: 'リファレンス',
          items: [{ label: '入口', slug: 'reference' }],
        },
        {
          label: 'このサイトについて',
          items: [{ label: '図解の表示確認', slug: 'about/diagram-support' }],
        },
      ],
    }),
  ],
});
