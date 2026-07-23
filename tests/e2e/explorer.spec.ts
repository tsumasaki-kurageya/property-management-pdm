import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const representativeUrl = 'explorer/?business=BM-09-06&view=flow';

function explorerShell(page: Page) {
  return page.getByLabel('業務エクスプローラー');
}

function relationFilter(page: Page, label: RegExp) {
  return explorerShell(page).locator('.context-map-filters').getByRole('button', { name: label });
}

async function openRepresentative(page: Page) {
  await page.goto(representativeUrl);
  const shell = explorerShell(page);
  await expect(shell.getByRole('heading', { name: '業務エクスプローラー' })).toBeVisible();
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
}

test('BM-09-06の前後と条件分岐をテキストでも確認できる', async ({ page }) => {
  await openRepresentative(page);

  const textAlternative = explorerShell(page).getByLabel('仕事の流れをテキストで確認');
  await expect(textAlternative).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /点検値を記録する/ })).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /点検結果を承認する/ })).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /不具合を受け付ける/ })).toBeVisible();

  const renderedNodes = await explorerShell(page).locator('.flow-map-canvas .react-flow__node').count();
  expect(renderedNodes).toBeLessThanOrEqual(8);
});

test('各画面幅で主要表示へ到達でき、ページ全体が横にはみ出さない', async ({ page }, testInfo) => {
  await openRepresentative(page);

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);

  const shell = explorerShell(page);
  const mobileTabs = shell.getByRole('tablist', { name: 'スマートフォン表示' });
  if (testInfo.project.name === 'mobile') {
    await expect(mobileTabs).toBeVisible();
    await mobileTabs.getByRole('tab', { name: '説明を見る' }).click();
    await expect(shell.locator('.explorer-detail-pane')).toBeVisible();
    await expect(shell.locator('.explorer-map-pane')).toBeHidden();

    await mobileTabs.getByRole('tab', { name: '全体の位置' }).click();
    await expect(shell.locator('.explorer-lifecycle')).toBeVisible();
    await expect(shell.locator('.explorer-detail-pane')).toBeHidden();

    await mobileTabs.getByRole('tab', { name: '図を見る' }).click();
    await expect(shell.locator('.explorer-map-pane')).toBeVisible();
    await expect(shell.getByRole('button', { name: /業務を探す/ })).toBeVisible();
  } else {
    await expect(mobileTabs).toBeHidden();
    await expect(shell.locator('.explorer-map-pane')).toBeVisible();
    await expect(shell.locator('.explorer-detail-pane')).toBeVisible();
  }
});

test('キーボードで表示切替と業務検索を完了できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const shell = explorerShell(page);
  const viewTabs = shell.getByRole('tablist', { name: '表示方法' });
  const flowTab = viewTabs.getByRole('tab', { name: '仕事の流れ' });
  await flowTab.focus();
  await flowTab.press('ArrowRight');
  await expect(viewTabs.getByRole('tab', { name: '全体から見る' })).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/view=hierarchy/);

  await viewTabs.getByRole('tab', { name: '全体から見る' }).press('End');
  await expect(viewTabs.getByRole('tab', { name: '関係から探す' })).toHaveAttribute('aria-selected', 'true');

  const search = shell.getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('不具合を受け付ける');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(shell.locator('.detail-panel-summary h3')).toHaveText('不具合を受け付ける');
  await expect(page).toHaveURL(/business=BM-/);
});

test('選択・表示・関係分類をURLとブラウザ履歴から復元できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const viewTabs = explorerShell(page).getByRole('tablist', { name: '表示方法' });
  await viewTabs.getByRole('tab', { name: '全体から見る' }).click();
  await viewTabs.getByRole('tab', { name: '関係から探す' }).click();
  await relationFilter(page, /^必要なもの \d+$/).click();
  await expect(page).toHaveURL(/view=relations/);
  await expect(page).toHaveURL(/type=uses/);

  await page.goBack();
  await expect(viewTabs.getByRole('tab', { name: '関係から探す' })).toHaveAttribute('aria-selected', 'true');
  await expect(page).not.toHaveURL(/type=uses/);

  await page.goBack();
  await expect(viewTabs.getByRole('tab', { name: '全体から見る' })).toHaveAttribute('aria-selected', 'true');
  await page.reload();
  await expect(explorerShell(page).locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(viewTabs.getByRole('tab', { name: '全体から見る' })).toHaveAttribute('aria-selected', 'true');
});

test('@pages 共有URLへの直接アクセスと再読み込みで同じ状態を復元できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('explorer/?business=BM-09-06&view=relations&type=uses');

  const shell = explorerShell(page);
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(shell.getByRole('tablist', { name: '表示方法' }).getByRole('tab', { name: '関係から探す' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect(relationFilter(page, /^必要なもの \d+$/)).toHaveAttribute('aria-pressed', 'true');
  await expect(shell.getByRole('link', { name: '詳細ページで確認する' })).toHaveAttribute(
    'href',
    /\/property-management-pdm\//,
  );

  await page.reload();
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(relationFilter(page, /^必要なもの \d+$/)).toHaveAttribute('aria-pressed', 'true');
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
  await explorerShell(page).getByRole('button', { name: /業務を探す/ }).click();

  const transitionSeconds = await explorerShell(page).locator('.explorer-list-pane').evaluate((element) => {
    const duration = window.getComputedStyle(element).transitionDuration.split(',')[0] ?? '0s';
    return duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
  });
  expect(transitionSeconds).toBeLessThanOrEqual(0.001);
});
