import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('explorer/');
  await expect(page.getByRole('heading', { name: '業務エクスプローラー' })).toBeVisible();
});

test('業務カタログ正本の18業務領域だけを初期表示する', async ({ page }) => {
  const explorer = page.getByLabel('業務エクスプローラー');
  await expect(explorer.locator('.react-flow__node-area')).toHaveCount(18);
  await expect(explorer.locator('.react-flow__node-business')).toHaveCount(0);
  await expect(explorer.locator('.react-flow__edge')).toHaveCount(0);
  await expect(explorer.getByRole('button', { name: 'BM-01 業務領域「営業・提案」' })).toBeVisible();
  await expect(explorer.getByRole('button', { name: 'BM-18 業務領域「分析・改善・経営管理」' })).toBeVisible();
  await expect(explorer.locator('.explorer-detail-pane')).toHaveCount(0);
  await expect(explorer.locator('.explorer-toolbar')).toHaveCount(0);
});

test('18業務領域を主系列・現場実行・横断基盤の順に配置する', async ({ page }) => {
  const explorer = page.getByLabel('業務エクスプローラー');
  await expect(explorer.locator('[data-lifecycle-group="main"]')).toHaveCount(8);
  await expect(explorer.locator('[data-lifecycle-group="execution"]')).toHaveCount(6);
  await expect(explorer.locator('[data-lifecycle-group="cross"]')).toHaveCount(4);

  const mainStart = explorer.getByRole('button', { name: 'BM-01 業務領域「営業・提案」' });
  const mainEnd = explorer.getByRole('button', { name: 'BM-18 業務領域「分析・改善・経営管理」' });
  const execution = explorer.getByRole('button', { name: 'BM-06 業務領域「清掃管理」' });
  const cross = explorer.getByRole('button', { name: 'BM-12 業務領域「テナント・顧客対応」' });
  const [mainStartBox, mainEndBox, executionBox, crossBox] = await Promise.all([
    mainStart.boundingBox(),
    mainEnd.boundingBox(),
    execution.boundingBox(),
    cross.boundingBox(),
  ]);

  expect(mainStartBox).not.toBeNull();
  expect(mainEndBox).not.toBeNull();
  expect(executionBox).not.toBeNull();
  expect(crossBox).not.toBeNull();
  if (!mainStartBox || !mainEndBox || !executionBox || !crossBox) return;

  expect(mainStartBox.x).toBeLessThan(mainEndBox.x);
  expect(executionBox.y).toBeGreaterThan(mainStartBox.y);
  expect(crossBox.y).toBeGreaterThan(executionBox.y);
});

test('領域をホバーすると全所属業務を周辺へ展開し、明瞭な線で結ぶ', async ({ page }, testInfo) => {
  const explorer = page.getByLabel('業務エクスプローラー');
  const isMobile = testInfo.project.name === 'mobile';
  const area = explorer.getByRole('button', {
    name: isMobile
      ? 'BM-09 業務領域「点検・保守管理」'
      : 'BM-10 業務領域「不具合・修繕管理」',
  });
  const expectedBusinessCount = isMobile ? 10 : 13;

  if (testInfo.project.name === 'desktop') {
    await area.hover();
  } else {
    await area.tap();
  }

  await expect(area).toHaveAttribute('aria-expanded', 'true');
  await expect(explorer.locator('.react-flow__node-business')).toHaveCount(expectedBusinessCount);
  await expect(explorer.locator('.react-flow__edge')).toHaveCount(expectedBusinessCount);
  await expect(explorer.getByLabel(isMobile ? /業務 BM-09-01 / : /業務 BM-10-01 /)).toBeVisible();
  await expect(
    explorer.locator('.explorer-business-edge .react-flow__edge-path').first(),
  ).toHaveCSS('stroke-width', '2.5px');
});

test('別領域へ移ると展開対象を切り替え、古い所属業務を残さない', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const explorer = page.getByLabel('業務エクスプローラー');
  const bm10 = explorer.getByRole('button', { name: 'BM-10 業務領域「不具合・修繕管理」' });
  const bm02 = explorer.getByRole('button', { name: 'BM-02 業務領域「契約管理」' });

  await bm10.hover();
  await expect(explorer.locator('.react-flow__node-business')).toHaveCount(13);
  await bm02.hover();
  await expect(bm02).toHaveAttribute('aria-expanded', 'true');
  await expect(bm10).toHaveAttribute('aria-expanded', 'false');
  await expect(explorer.locator('.react-flow__node-business')).toHaveCount(7);
  await expect(explorer.getByLabel(/業務 BM-10-/)).toHaveCount(0);
});

test('キーボードとクリックで領域を展開・収納できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  const explorer = page.getByLabel('業務エクスプローラー');
  const area = explorer.getByRole('button', { name: 'BM-09 業務領域「点検・保守管理」' });

  await area.focus();
  await expect(area).toHaveAttribute('aria-expanded', 'true');
  await area.press('Space');
  await expect(area).toHaveAttribute('aria-expanded', 'false');
  await area.press('Enter');
  await expect(area).toHaveAttribute('aria-expanded', 'true');
  await expect(explorer.locator('.react-flow__node-business')).toHaveCount(10);
});

test('キャンバスが主要表示領域を占め、パン・ズーム操作を備える', async ({ page }) => {
  const explorer = page.getByLabel('業務エクスプローラー');
  const canvas = explorer.locator('.explorer-canvas');
  const metrics = await canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    };
  });

  expect(metrics.width / metrics.viewportWidth).toBeGreaterThan(0.9);
  expect(metrics.height / metrics.viewportHeight).toBeGreaterThan(0.75);
  await expect(explorer.locator('.react-flow__controls')).toBeVisible();
  await expect(page.locator('#starlight__sidebar')).toBeHidden();
});

test('重大なアクセシビリティ違反がない', async ({ page }) => {
  const results = await new AxeBuilder({ page })
    .include('.explorer-shell')
    .disableRules(['region'])
    .analyze();

  expect(results.violations).toEqual([]);
});
