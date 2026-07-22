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
          items: [
            { label: '18の業務領域', slug: 'overview' },
            { label: '契約から改善まで', slug: 'overview/business-lifecycle' },
            { label: '業務の時間軸と完了状態', slug: 'overview/completion-states' },
          ],
        },
        {
          label: '現場の業務',
          items: [
            { label: '現場業務の共通した進み方', slug: 'field-work' },
            { label: '清掃管理', slug: 'field-work/cleaning' },
            { label: '衛生管理', slug: 'field-work/hygiene' },
            { label: '設備運転管理', slug: 'field-work/equipment-operation' },
            { label: '点検・保守管理', slug: 'field-work/inspection-and-maintenance' },
            { label: '警備・防災管理', slug: 'field-work/security-and-disaster-prevention' },
            { label: '人員・協力会社管理', slug: 'field-work/staffing-and-contractors' },
            { label: '資材・在庫管理', slug: 'field-work/materials-and-inventory' },
            { label: '作業結果・報告管理', slug: 'field-work/records-and-reports' },
          ],
        },
        {
          label: '異常と周辺業務',
          items: [
            { label: 'この章の読み方', slug: 'incidents-and-operations' },
            { label: '営業・現地調査・仕様・見積', slug: 'operations/pre-contract-and-specification' },
            { label: '契約と責任分界', slug: 'operations/contracts-and-responsibilities' },
            { label: '管理体制と業務立ち上げ', slug: 'operations/startup' },
            { label: '計画・変更・未実施管理', slug: 'operations/planning-and-unperformed-work' },
            { label: '記録・承認・月次報告', slug: 'operations/records-approval-and-reporting' },
            { label: '追加作業・検収・請求・原価', slug: 'operations/additional-work-billing-and-costs' },
            { label: '点検異常から修繕・引渡しまで', slug: 'incidents/abnormality-to-restoration' },
            { label: '苦情・要望・事故・災害', slug: 'incidents/complaints-accidents-and-disasters' },
          ],
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
