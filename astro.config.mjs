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
    mermaid({ autoTheme: true, enableLog: false }),
    starlight({
      title: '建物の所有・運営・維持管理業務ガイド',
      description: '建物の所有・投資管理、物件・施設運営、維持管理・実行の業務構造を初学者向けに整理したガイド',
      customCss: ['./src/styles/diagrams.css'],
      locales: { root: { label: '日本語', lang: 'ja-JP' } },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/tsumasaki-kurageya/property-management-pdm' }],
      editLink: { baseUrl: 'https://github.com/tsumasaki-kurageya/property-management-pdm/edit/main/' },
      sidebar: [
        {
          label: 'はじめに',
          items: [
            { label: 'このガイドラインについて', slug: 'introduction' },
            { label: 'ガイドライン全体像', slug: 'introduction/guide-overview' },
            { label: '目的別の読み方', slug: 'introduction' },
            { label: '特定業務の探し方', slug: 'introduction/how-to-use' },
            { label: '初学者向け用語集', slug: 'introduction/glossary' },
          ],
        },
        {
          label: '建物管理業務の全体像',
          items: [
            { label: '所有・運営・維持管理の業務構造', slug: 'management-structure' },
            { label: '関係者と責任分界', slug: 'introduction/people-and-roles' },
            { label: 'ビルメンテナンス会社の役割', slug: 'management-structure/maintenance-execution' },
            { label: '建物管理業務とは', slug: 'introduction/what-is-building-maintenance' },
          ],
        },
        {
          label: 'ビルメンテナンス業務を探す',
          items: [
            { label: '業務エクスプローラー', link: '/explorer/' },
            { label: '18の業務領域', slug: 'overview' },
            { label: '業務カタログ', slug: 'reference/business-catalog' },
            { label: '標準業務ライフサイクル', slug: 'overview/business-lifecycle' },
            { label: '業務プロセスマップ', slug: 'reference/processes' },
            { label: '業務の時間軸と完了状態', slug: 'overview/completion-states' },
          ],
        },
        {
          label: '業務の違いを理解する',
          collapsed: true,
          items: [
            { label: '共通業務と条件差', slug: 'variations' },
            { label: '建物用途による違い', slug: 'variations/building-use' },
            { label: '常駐管理と巡回管理', slug: 'variations/management-methods' },
            { label: '元請けと再委託', slug: 'variations/contract-layers' },
            { label: 'オーナー・AM・PM・FM・BM', slug: 'variations/responsibility-boundaries' },
            { label: '法定業務', slug: 'variations/statutory-duties' },
            { label: '四つの責任主体', slug: 'variations/responsibility-types' },
            { label: '複数条件の重ね合わせ', slug: 'variations/combining-conditions' },
          ],
        },
        {
          label: '業務を詳しく理解する',
          collapsed: true,
          items: [
            { label: '現場業務の共通した進み方', slug: 'field-work' },
            { label: '清掃業務', slug: 'field-work/cleaning' },
            { label: '衛生管理業務', slug: 'field-work/hygiene' },
            { label: '設備管理業務', slug: 'field-work/equipment-operation' },
            { label: '点検・保守業務', slug: 'field-work/inspection-and-maintenance' },
            { label: '警備業務', slug: 'field-work/security-and-disaster-prevention' },
            { label: '人員・協力会社管理', slug: 'field-work/staffing-and-contractors' },
            { label: '資材・在庫管理', slug: 'field-work/materials-and-inventory' },
            { label: '作業結果・報告管理', slug: 'field-work/records-and-reports' },
            { label: '現場作業手順', slug: 'reference/field-procedures' },
          ],
        },
        {
          label: '所有・投資管理',
          collapsed: true,
          items: [
            { label: 'レイヤー概要', slug: 'management-structure/ownership-and-investment' },
            { label: 'オーナー', slug: 'management-structure/ownership-and-investment/owner' },
            { label: 'アセットマネジメント（AM）', slug: 'management-structure/ownership-and-investment/asset-management' },
          ],
        },
        {
          label: '物件・施設運営',
          collapsed: true,
          items: [
            { label: 'レイヤー概要', slug: 'management-structure/property-and-facility-operation' },
            { label: 'プロパティマネジメント（PM）', slug: 'management-structure/property-and-facility-operation/property-management' },
            { label: 'ファシリティマネジメント（FM）', slug: 'management-structure/property-and-facility-operation/facility-management' },
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
          label: '異常と周辺業務',
          collapsed: true,
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
          label: '代表シナリオ',
          collapsed: true,
          items: [
            { label: 'シナリオ一覧', slug: 'management-structure/scenarios' },
            { label: '空調設備の更新', slug: 'management-structure/scenarios/air-conditioning-renewal' },
            { label: '法定不適合の是正', slug: 'management-structure/scenarios/statutory-nonconformity' },
            { label: '災害後の復旧', slug: 'management-structure/scenarios/disaster-recovery' },
          ],
        },
        {
          label: '分析・活用',
          collapsed: true,
          items: [
            { label: 'リファレンスの入口', slug: 'reference' },
            { label: '上位業務とBM業務の接続', slug: 'reference/management-to-bm-map' },
            { label: '重要業務14件', slug: 'reference/critical-businesses' },
            { label: '条件差プロファイル', slug: 'reference/profiles' },
            { label: 'チェックリスト', slug: 'reference/checklists' },
            { label: '分析用原本一覧', slug: 'reference/sources' },
            { label: '図解一覧', slug: 'diagrams' },
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
