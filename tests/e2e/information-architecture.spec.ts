import { expect, test } from '@playwright/test';

const sidebarLabels = [
  '所有・投資管理',
  '物件・施設運営',
  '維持管理・実行 ― ビルメンテナンス',
  'レイヤー間の接続',
  '代表シナリオ',
];

const bmLabels = ['業務の全体像', '現場の業務', '異常と周辺業務', '条件による違い'];

test('サイト名称とトップページが建物管理業務全体の対象範囲を示す', async ({ page }) => {
  await page.goto('');
  await expect(page).toHaveTitle(/建物の所有・運営・維持管理業務ガイド/);
  await expect(page.getByRole('heading', { level: 1, name: '建物の所有・運営・維持管理業務ガイド' })).toBeVisible();

  const main = page.getByRole('main');
  await expect(main).toContainText('所有・投資管理');
  await expect(main).toContainText('物件・施設運営');
  await expect(main).toContainText('維持管理・実行');
  await expect(main).toContainText('ビルメンテナンス');
});

test('三つの業務レイヤーと横断章をサイドバーに含める', async ({ page }) => {
  await page.goto('management-structure/');
  const text = (await page.locator('nav[aria-label="メイン"]').allTextContents()).join('\n');
  for (const label of sidebarLabels) expect(text).toContain(label);
});

test('BM内部章を維持管理・実行グループの配下に構成する', async ({ page }) => {
  await page.goto('management-structure/maintenance-execution/');
  const details = page.locator('nav[aria-label="メイン"] details');
  let found = false;

  for (let index = 0; index < await details.count(); index += 1) {
    const text = (await details.nth(index).textContent()) ?? '';
    if (!text.includes('維持管理・実行 ― ビルメンテナンス')) continue;
    for (const label of bmLabels) expect(text).toContain(label);
    found = true;
    break;
  }

  expect(found).toBeTruthy();
});

test('既存の主要URLと末尾スラッシュを維持する', async ({ page }) => {
  for (const path of ['overview/', 'field-work/', 'incidents-and-operations/', 'variations/']) {
    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    expect(new URL(page.url()).pathname.endsWith(`/${path}`)).toBeTruthy();
  }
});
