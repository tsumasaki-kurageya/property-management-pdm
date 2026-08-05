import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

export default defineConfig({
  site: 'https://tsumasaki-kurageya.github.io',
  base: '/property-management-pdm',
  trailingSlash: 'always',
  integrations: [
    react(),
    mermaid({
      autoTheme: true,
      enableLog: false,
    }),
    starlight({
      title: 'ビルメンテナンス業務ガイド',
      description: 'ビルメンテナンス業務の全体像を初学者向けに整理したガイド',
      customCss: ['./src/styles/diagrams.css'],
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
          label: '業務を探索する',
          items: [{ label: '業務エクスプローラー', link: '/explorer/' }],
        },
        {
          label: 'はじめに',
          items: [
            { label: 'ガイドの読み方', slug: 'introduction' },
            { label: '業務ガイドラインの使い方', slug: 'introduction/how-to-use' },
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
          label: '所有・運営・維持管理の業務構造',
          items: [
            { label: '全体構造', slug: 'management-structure' },
            {
              label: '1. 所有・投資管理',
              collapsed: true,
              items: [
                { label: 'レイヤー概要', slug: 'management-structure/ownership-and-investment' },
                { label: 'オーナー', slug: 'management-structure/ownership-and-investment/owner' },
                { label: 'アセットマネジメント（AM）', slug: 'management-structure/ownership-and-investment/asset-management' },
              ],
            },
            {
              label: '2. 物件・施設運営',
              collapsed: true,
              items: [
                { label: 'レイヤー概要', slug: 'management-structure/property-and-facility-operation' },
                { label: 'プロパティマネジメント（PM）', slug: 'management-structure/property-and-facility-operation/property-management' },
                { label: 'ファシリティマネジメント（FM）', slug: 'management-structure/property-and-facility-operation/facility-management' },
              ],
            },
            {
              label: '3. 維持管理・実行',
              collapsed: true,
              items: [
                { label: 'レイヤー概要', slug: 'management-structure/maintenance-execution' },
                { label: 'ビルメンテナンス（BM）', slug: 'management-structure/maintenance-execution/building-maintenance' },
              ],
            },
            {
              label: 'レイヤー間の接続',
              collapsed: true,
              items: [
                { label: '意思決定と責任分界', slug: 'management-structure/connections/decision-and-responsibility' },
                { label: '上位要求からBMへ', slug: 'management-structure/connections/requirements-to-bm' },
                { label: 'BM実績から上位判断へ', slug: 'management-structure/connections/bm-feedback-to-management' },
              ],
            },
            {
              label: '代表シナリオ',
              collapsed: true,
              items: [
                { label: 'シナリオ一覧', slug: 'management-structure/scenarios' },
                { label: '空調設備の更新', slug: 'management-structure/scenarios/air-conditioning-renewal' },
                { label: '法定不適合の是正', slug: 'management-structure/scenarios/statutory-nonconformity' },
                { label: '災害後の復旧', slug: 'management-structure/scenarios/disaster-recovery' },
              ],
            },
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
          items: [
            { label: '共通業務と条件差', slug: 'variations' },
            { label: '建物用途による違い', slug: 'variations/building-use' },
            { label: '常駐・巡回・遠隔監視', slug: 'variations/management-methods' },
            { label: '元請け・再委託先・専門業者', slug: 'variations/contract-layers' },
            { label: 'オーナー・PM・FM・BM', slug: 'variations/responsibility-boundaries' },
            { label: '法令業務の考え方', slug: 'variations/statutory-duties' },
            { label: '四つの責任主体', slug: 'variations/responsibility-types' },
            { label: '複数条件の重ね合わせ', slug: 'variations/combining-conditions' },
          ],
        },
        {
          label: 'リファレンス',
          items: [
            { label: '入口', slug: 'reference' },
            { label: '図解一覧', slug: 'diagrams' },
            { label: '業務カタログ', slug: 'reference/business-catalog' },
            { label: '12横断プロセス', slug: 'reference/processes' },
            { label: '上位業務とBM業務の接続', slug: 'reference/management-to-bm-map' },
            { label: '重要業務14件', slug: 'reference/critical-businesses' },
            { label: '条件差プロファイル', slug: 'reference/profiles' },
            { label: '現場作業手順', slug: 'reference/field-procedures' },
            { label: 'チェックリスト', slug: 'reference/checklists' },
            { label: '分析用原本一覧', slug: 'reference/sources' },
          ],
        },
        {
          label: 'このサイトについて',
          items: [
            { label: '初版の範囲と品質', slug: 'about/initial-release' },
            { label: '図解の表示確認', slug: 'about/diagram-support' },
          ],
        },
      ],
    }),
  ],
});
