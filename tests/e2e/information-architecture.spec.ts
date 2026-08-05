import { expect, test, type Page } from '@playwright/test';

async function getVisibleSidebar(page: Page) {
  const menuButton = page.getByRole('button', { name: /メニュー|Menu/i }).locator(':visible').first();
  if (await menuButton.isVisible()) {
    await menuButton.click();
  }

  const sidebar = page.locator('nav[aria-label="メイン"]:visible');
  await expect(sidebar).toBeVisible();
  return sidebar;
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
  const sidebar = await getVisibleSidebar(page);

  await expect(sidebar).toContainText('所有・投資管理');
  await expect(sidebar).toContainText('物件・施設運営');
  await expect(sidebar).toContainText('維持管理・実行 ― ビルメンテナンス');
  await expect(sidebar).toContainText('レイヤー間の接続');
  await expect(sidebar).toContainText('代表シナリオ');
});

test('BM内部章を維持管理・実行の配下から開ける', async ({ page }) => {
  await page.goto('management-structure/maintenance-execution/');
  const sidebar = await getVisibleSidebar(page);

  const group = sidebar.locator('summary').filter({ hasText: '維持管理・実行 ― ビルメンテナンス' }).first();
  await expect(group).toBeVisible();
  if ((await group.getAttribute('aria-expanded')) !== 'true') {
    await group.click();
  }

  for (const label of ['業務の全体像', '現場の業務', '異常と周辺業務', '条件による違い']) {
    await expect(sidebar.locator('summary').filter({ hasText: label }).first()).toBeVisible();
  }
});

test('既存の主要URLと末尾スラッシュを維持する', async ({ page }) => {
  for (const path of ['overview/', 'field-work/', 'incidents-and-operations/', 'variations/']) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should respond successfully`).toBeTruthy();
    expect(new URL(page.url()).pathname.endsWith(`/${path}`)).toBeTruthy();
  }
});
