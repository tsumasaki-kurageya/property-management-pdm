import { expect, test } from '@playwright/test';

async function openSidebarOnNarrowViewport(page: import('@playwright/test').Page) {
  const menuButton = page.getByRole('button', { name: /メニュー|Menu/i }).first();
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }
}

test('サイト名称とトップページが建物管理業務全体の対象範囲を示す', async ({ page }) => {
  await page.goto('');

  await expect(page).toHaveTitle(/建物の所有・運営・維持管理業務ガイド/);
  await expect(
    page.getByRole('heading', { level: 1, name: '建物の所有・運営・維持管理業務ガイド' }),
  ).toBeVisible();

  const main = page.getByRole('main');
  await expect(main).toContainText('所有・投資管理');
  await expect(main).toContainText('物件・施設運営');
  await expect(main).toContainText('維持管理・実行');
  await expect(main).toContainText('ビルメンテナンス');
});

test('三つの業務レイヤーと横断章を同じサイドバー水準で表示する', async ({ page }) => {
  await page.goto('management-structure/');
  await openSidebarOnNarrowViewport(page);

  const sidebar = page.locator('nav').filter({ hasText: '所有・投資管理' }).first();
  await expect(sidebar).toBeVisible();
  await expect(sidebar).toContainText('所有・投資管理');
  await expect(sidebar).toContainText('物件・施設運営');
  await expect(sidebar).toContainText('維持管理・実行 ― ビルメンテナンス');
  await expect(sidebar).toContainText('レイヤー間の接続');
  await expect(sidebar).toContainText('代表シナリオ');
});

test('BM内部章を維持管理・実行の配下から開ける', async ({ page }) => {
  await page.goto('management-structure/maintenance-execution/');
  await openSidebarOnNarrowViewport(page);

  const group = page.getByText('維持管理・実行 ― ビルメンテナンス', { exact: true }).first();
  await expect(group).toBeVisible();
  await group.click();

  for (const label of ['業務の全体像', '現場の業務', '異常と周辺業務', '条件による違い']) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
});

test('既存の主要URLと末尾スラッシュを維持する', async ({ page }) => {
  for (const path of ['overview/', 'field-work/', 'incidents-and-operations/', 'variations/']) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should respond successfully`).toBeTruthy();
    expect(new URL(page.url()).pathname).toEndWith(`/${path}`);
  }
});
