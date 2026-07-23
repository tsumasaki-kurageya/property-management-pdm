import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const representativeUrl = 'explorer/?business=BM-09-06&view=flow';

async function openRepresentative(page: Page) {
  await page.goto(representativeUrl);
  await expect(page.getByRole('heading', { name: '業務エクスプローラー' })).toBeVisible();
  await expect(page.locator('.detail-panel-id')).toHaveText('BM-09-06');
}

test('BM-09-06の前後と条件分岐をテキストでも確認できる', async ({ page }) => {
  await openRepresentative(page);

  const textAlternative = page.getByLabel('仕事の流れをテキストで確認');
  await expect(textAlternative).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /点検値を記録する/ })).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /点検結果を承認する/ })).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /不具合を受け付ける/ })).toBeVisible();

  const renderedNodes = await page.locator('.flow-map-canvas .react-flow__node').count();
  expect(renderedNodes).toBeLessThanOrEqual(8);
});

test('各画面幅で主要表示へ到達でき、ページ全体が横にはみ出さない', async ({ page }, testInfo) => {
  await openRepresentative(page);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);

  const mobileTabs = page.getByRole('tablist', { name: 'スマートフォン表示' });
  if (testInfo.project.name === 'mobile') {
    await expect(mobileTabs).toBeVisible();
    await page.getByRole('tab', { name: '説明を見る' }).click();
    await expect(page.locator('.explorer-detail-pane')).toBeVisible();
    await expect(page.locator('.explorer-map-pane')).toBeHidden();

    await page.getByRole('tab', { name: '全体の位置' }).click();
    await expect(page.locator('.explorer-lifecycle')).toBeVisible();
    await expect(page.locator('.explorer-detail-pane')).toBeHidden();

    await page.getByRole('tab', { name: '図を見る' }).click();
    await expect(page.locator('.explorer-map-pane')).toBeVisible();
    await expect(page.getByRole('button', { name: /業務を探す/ })).toBeVisible();
  } else {
    await expect(mobileTabs).toBeHidden();
    await expect(page.locator('.explorer-map-pane')).toBeVisible();
    await expect(page.locator('.explorer-detail-pane')).toBeVisible();
  }
});

test('キーボードで表示切替と業務検索を完了できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const flowTab = page.getByRole('tab', { name: '仕事の流れ' });
  await flowTab.focus();
  await flowTab.press('ArrowRight');
  await expect(page.getByRole('tab', { name: '全体から見る' })).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/view=hierarchy/);

  await page.getByRole('tab', { name: '全体から見る' }).press('End');
  await expect(page.getByRole('tab', { name: '関係から探す' })).toHaveAttribute('aria-selected', 'true');

  const search = page.getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('不具合を受け付ける');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.detail-panel-summary h3')).toHaveText('不具合を受け付ける');
  await expect(page).toHaveURL(/business=BM-/);
});

test('選択・表示・関係分類をURLとブラウザ履歴から復元できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  await page.getByRole('tab', { name: '全体から見る' }).click();
  await page.getByRole('tab', { name: '関係から探す' }).click();
  await page.getByRole('button', { name: /^必要なもの/ }).click();
  await expect(page).toHaveURL(/view=relations/);
  await expect(page).toHaveURL(/type=uses/);

  await page.goBack();
  await expect(page.getByRole('tab', { name: '関係から探す' })).toHaveAttribute('aria-selected', 'true');
  await expect(page).not.toHaveURL(/type=uses/);

  await page.goBack();
  await expect(page.getByRole('tab', { name: '全体から見る' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(page.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(page.getByRole('tab', { name: '全体から見る' })).toHaveAttribute('aria-selected', 'true');
});

test('@pages 共有URLへの直接アクセスと再読み込みで同じ状態を復元できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('explorer/?business=BM-09-06&view=relations&type=uses');

  await expect(page.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(page.getByRole('tab', { name: '関係から探す' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('button', { name: /^必要なもの/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('link', { name: '詳細ページで確認する' })).toHaveAttribute(
    'href',
    /\/property-management-pdm\//,
  );

  await page.reload();
  await expect(page.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(page.getByRole('button', { name: /^必要なもの/ })).toHaveAttribute('aria-pressed', 'true');
});

test('重大な自動検出可能アクセシビリティ違反がない', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const result = await new AxeBuilder({ page })
    .include('.explorer-shell')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const seriousViolations = result.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );

  expect(seriousViolations, JSON.stringify(seriousViolations, null, 2)).toEqual([]);
});

test('動きを減らす設定で画面遷移アニメーションを抑制する', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openRepresentative(page);
  await page.getByRole('button', { name: /業務を探す/ }).click();

  const transitionSeconds = await page.locator('.explorer-list-pane').evaluate((element) => {
    const duration = window.getComputedStyle(element).transitionDuration.split(',')[0] ?? '0s';
    return duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
  });
  expect(transitionSeconds).toBeLessThanOrEqual(0.001);
});
