import { expect, test } from '@playwright/test';

test('PCではヘッダー下を使い切るワークスペースとして表示する', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');

  await page.goto('explorer/?business=BM-09-06');
  const explorer = page.locator('.explorer-shell');
  await expect(explorer).toBeVisible();
  await expect(page.locator('.detail-panel-id')).toHaveText('BM-09-06');

  const metrics = await page.evaluate(() => {
    const shell = document.querySelector<HTMLElement>('.explorer-shell');
    const map = document.querySelector<HTMLElement>('.explorer-map-pane');
    const pageRoot = document.querySelector<HTMLElement>('.explorer-page');
    if (!shell || !map || !pageRoot) throw new Error('Explorer layout elements not found');

    const shellRect = shell.getBoundingClientRect();
    const mapRect = map.getBoundingClientRect();
    const pageRect = pageRoot.getBoundingClientRect();

    return {
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      pageWidth: pageRect.width,
      shellWidth: shellRect.width,
      shellBottom: shellRect.bottom,
      mapWidth: mapRect.width,
      mapHeight: mapRect.height,
      bodyOverflowY: window.getComputedStyle(document.body).overflowY,
      htmlOverflowY: window.getComputedStyle(document.documentElement).overflowY,
    };
  });

  expect(metrics.pageWidth / metrics.viewportWidth).toBeGreaterThan(0.96);
  expect(metrics.mapWidth / metrics.shellWidth).toBeGreaterThan(0.5);
  expect(metrics.mapHeight).toBeGreaterThan(480);
  expect(metrics.shellBottom).toBeLessThanOrEqual(metrics.viewportHeight + 2);
  expect([metrics.bodyOverflowY, metrics.htmlOverflowY]).toContain('hidden');
});
