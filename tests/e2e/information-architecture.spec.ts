import { expect, test } from '@playwright/test';

const roleBasedSidebarLabels = [
  'はじめに',
  '建物管理業務の全体像',
  'ビルメンテナンス業務を探す',
  '業務の違いを理解する',
  '業務を詳しく理解する',
  '分析・活用',
];

test('トップページから三つの目的別経路を選択できる', async ({ page }) => {
  await page.goto('');
  await expect(page).toHaveTitle(/建物の所有・運営・維持管理業務ガイド/);
  await expect(page.getByRole('heading', { level: 1, name: '建物の所有・運営・維持管理業務ガイド' })).toBeVisible();

  const main = page.getByRole('main');
  await expect(main.getByText('全体像を知る', { exact: true })).toBeVisible();
  await expect(main.getByText('特定の業務を探す', { exact: true })).toBeVisible();
  await expect(main.getByText('業務の違い・詳細を調べる', { exact: true })).toBeVisible();
  await expect(main).toContainText('業務カタログ');
  await expect(main).toContainText('辞書・索引');
});

test('ガイドライン全体像で情報群の役割を把握できる', async ({ page }) => {
  const response = await page.goto('introduction/guide-overview/');
  expect(response?.ok()).toBeTruthy();

  const main = page.getByRole('main');
  await expect(page.getByRole('heading', { level: 1, name: 'ガイドライン全体像' })).toBeVisible();
  for (const label of ['全体像を理解する', '特定業務を探す', '流れ・関係を理解する', '条件による違いを理解する', '個別業務を詳しく理解する', '分析・製品企画に活用する']) {
    await expect(main).toContainText(label);
  }
  await expect(main).toContainText('先頭から読まず、辞書・索引として検索する');
});

test('目的別の読み方に三つの推奨経路を含める', async ({ page }) => {
  await page.goto('introduction/');
  const main = page.getByRole('main');
  await expect(page.getByRole('heading', { level: 1, name: '目的別の読み方' })).toBeVisible();
  await expect(main.getByRole('heading', { name: '1. 全体像を知る' })).toBeVisible();
  await expect(main.getByRole('heading', { name: '2. 特定の業務を探す' })).toBeVisible();
  await expect(main.getByRole('heading', { name: '3. 業務の違い・詳細を調べる' })).toBeVisible();
});

test('サイドバーを情報の役割別に構成する', async ({ page }) => {
  await page.goto('management-structure/');
  const text = (await page.locator('nav[aria-label="メイン"]').allTextContents()).join('\n');
  for (const label of roleBasedSidebarLabels) expect(text).toContain(label);
});

test('主要なサイドメニュー名と遷移先ページタイトルが一致する', async ({ page }) => {
  const cases = [
    {
      path: 'management-structure/maintenance-execution/',
      menu: '3. 維持管理・実行レイヤー',
      heading: '3. 維持管理・実行レイヤー',
    },
    {
      path: 'management-structure/maintenance-execution/building-maintenance/',
      menu: 'ビルメンテナンス（BM）の位置付け',
      heading: 'ビルメンテナンス（BM）の位置付け',
    },
    {
      path: 'variations/responsibility-boundaries/',
      menu: '所有・利用・契約による責任分界の違い',
      heading: '所有・利用・契約による責任分界の違い',
    },
    {
      path: 'field-work/equipment-operation/',
      menu: '設備運転管理',
      heading: '設備運転管理',
    },
  ];

  for (const item of cases) {
    await page.goto(item.path);
    await expect(page.getByRole('heading', { level: 1, name: item.heading })).toBeVisible();
    await expect(page.locator('nav[aria-label="メイン"]')).toContainText(item.menu);
  }
});

test('はじめに配下で同じページを別名で重複表示しない', async ({ page }) => {
  await page.goto('introduction/');
  const nav = page.locator('nav[aria-label="メイン"]');
  await expect(nav.getByText('目的別の読み方', { exact: true })).toHaveCount(1);
  await expect(nav.getByText('このガイドラインについて', { exact: true })).toHaveCount(0);
});

test('既存の主要URLと末尾スラッシュを維持する', async ({ page }) => {
  for (const path of ['overview/', 'field-work/', 'incidents-and-operations/', 'variations/', 'reference/business-catalog/', 'reference/processes/']) {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    expect(new URL(page.url()).pathname.endsWith(`/${path}`)).toBeTruthy();
  }
});
