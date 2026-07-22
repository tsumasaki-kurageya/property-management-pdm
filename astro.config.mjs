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
            { label: 'ビルメンテナンスとは', slug: 'introduction/what-is-building-maintenance' },
            { label: '関係者と役割', slug: 'introduction/people-and-roles' },
            { label: '初学者向け用語集', slug: 'introduction/glossary' },
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
