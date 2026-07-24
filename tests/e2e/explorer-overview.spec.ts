import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('explorer/');
  await expect(page.getByRole('heading', { name: '18業務領域から業務を探す' })).toBeVisible();
});

test('初期画面に18業務領域を表示し、詳細やプロセス図を常設しない', async ({ page }) => {
  const explorer = page.getByLabel('業務エクスプローラー');
  const areaMap = explorer.getByRole('main', { name: '18業務領域から業務を探す' });

  await expect(areaMap.locator('[data-business-area-id]')).toHaveCount(18);
  await expect(areaMap.getByText('18 業務領域')).toBeVisible();
  await expect(areaMap.getByText('178 業務')).toBeVisible();
  await expect(explorer.locator('.explorer-detail-pane')).toHaveCount(0);
  await expect(explorer.locator('.react-flow')).toHaveCount(0);
  await expect(page).toHaveURL(/\/explorer\/$/);
});

test('業務領域の展開で全所属業務を表示し、領域自体は選択しない', async ({ page }, testInfo) => {
  const explorer = page.getByLabel('業務エクスプローラー');
  const area = explorer.getByRole('button', { name: /BM-10 業務領域「不具合・修繕管理」/ });

  if (testInfo.project.name === 'desktop') {
    await area.hover();
  } else {
    await area.tap();
  }

  await expect(area).toHaveAttribute('aria-expanded', 'true');
  await expect(explorer.getByRole('heading', { name: '不具合・修繕管理' })).toBeVisible();
  await expect(explorer.locator('[data-map-business-area-id="BM-10"]')).toHaveCount(13);
  await expect(page).toHaveURL(/\/explorer\/$/);

  await area.click();
  await expect(area).toHaveAttribute('aria-expanded', 'false');
});

test('キーボードで領域から業務へ移動し、共通の業務選択処理を呼び出せる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');

  const explorer = page.getByLabel('業務エクスプローラー');
  const area = explorer.getByRole('button', { name: /BM-09 業務領域「点検・保守管理」/ });

  await area.focus();
  await expect(area).toHaveAttribute('aria-expanded', 'true');
  await area.press('Escape');
  await expect(area).toHaveAttribute('aria-expanded', 'false');
  await area.press('ArrowDown');

  const firstBusiness = explorer.locator('[data-map-business-area-id="BM-09"]').first();
  await expect(firstBusiness).toBeFocused();
  await firstBusiness.press('Enter');

  await expect(page).toHaveURL(/business=BM-09-/);
  await expect(explorer.locator('.detail-panel-id')).toHaveText(/BM-09-/);
  await expect(explorer.getByRole('heading', { name: '18業務領域から業務を探す' })).toHaveCount(0);
});
