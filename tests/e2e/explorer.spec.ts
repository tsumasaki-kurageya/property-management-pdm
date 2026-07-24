import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const representativeUrl = 'explorer/?business=BM-09-06';

function explorerShell(page: Page) {
  return page.getByLabel('業務エクスプローラー');
}

async function openRepresentative(page: Page) {
  await page.goto(representativeUrl);
  const shell = explorerShell(page);
  await expect(shell.getByRole('heading', { name: '業務エクスプローラー' })).toBeVisible();
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
}

test('BM-09-06を含む横断プロセスを開始から完了まで確認できる', async ({ page }) => {
  await openRepresentative(page);

  const shell = explorerShell(page);
  await expect(shell.getByText('P04 定常業務の実施', { exact: true })).toBeVisible();
  await expect(shell.getByText('開始', { exact: true }).first()).toBeAttached();
  await expect(shell.getByText('完了', { exact: true }).first()).toBeAttached();

  const textAlternative = shell.getByRole('region', { name: 'プロセス内容をテキストで確認' });
  await expect(textAlternative).toBeVisible();
  await expect(textAlternative.getByRole('button', { name: /点検値を記録する/ })).toBeVisible();
  await expect(textAlternative.locator('> ol > li')).toHaveCount(15);
  await expect(textAlternative.getByText(/異常の場合/).first()).toBeVisible();

  const renderedSteps = await shell.locator('.flow-map-canvas .flow-map-process-step').count();
  expect(renderedSteps).toBe(15);
});

test('プロセス内の別業務を選択しても同じプロセスを維持する', async ({ page }) => {
  await openRepresentative(page);

  const shell = explorerShell(page);
  const textAlternative = shell.getByRole('region', { name: 'プロセス内容をテキストで確認' });
  await textAlternative.getByRole('button', { name: /BM-09-05/ }).click();

  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-05');
  await expect(shell.locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P04');
  await expect(textAlternative.getByRole('button', { name: /BM-09-05/ })).toHaveAttribute('aria-current', 'true');
});

test('選択業務を含むプロセスを正本順で確認し、業務を維持して切り替えられる', async ({ page }) => {
  await openRepresentative(page);

  const shell = explorerShell(page);
  const processList = shell.getByRole('list', { name: 'この業務を含むプロセス' });
  const processNodes = processList.getByRole('button');

  await expect(processNodes).toHaveCount(4);
  await expect(processNodes.nth(0)).toContainText('P04');
  await expect(processNodes.nth(1)).toContainText('P06');
  await expect(processNodes.nth(2)).toContainText('P08');
  await expect(processNodes.nth(3)).toContainText('P09');
  await expect(processNodes.nth(0)).toContainText('表示中');
  await expect(processNodes.nth(0)).toHaveAttribute('aria-pressed', 'true');

  const repairProcess = processList.getByRole('button', { name: /P06.*異常・修繕・復旧/s });
  await repairProcess.click();
  await expect(repairProcess).toHaveAttribute('aria-pressed', 'true');
  await expect(repairProcess).toContainText('表示中');
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(page).toHaveURL(/business=BM-09-06/);
  await expect(page).toHaveURL(/process=P06/);

  const statutoryProcess = processList.getByRole('button', { name: /P08.*法定業務管理/s });
  await statutoryProcess.focus();
  await statutoryProcess.press('Enter');
  await expect(statutoryProcess).toHaveAttribute('aria-pressed', 'true');
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(page).toHaveURL(/process=P08/);
});

test('現在のプロセスに含まれる別業務を選んだ場合は表示プロセスを維持する', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const shell = explorerShell(page);
  const processList = shell.getByRole('list', { name: 'この業務を含むプロセス' });
  await processList.getByRole('button', { name: /P06.*異常・修繕・復旧/s }).click();

  const search = shell.getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('BM-10-01');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-10-01');
  await expect(page).toHaveURL(/business=BM-10-01/);
  await expect(page).toHaveURL(/process=P06/);
});

test('現在のプロセスに含まれない業務では正本順の先頭プロセスへ切り替える', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const shell = explorerShell(page);
  const processList = shell.getByRole('list', { name: 'この業務を含むプロセス' });
  await processList.getByRole('button', { name: /P06.*異常・修繕・復旧/s }).click();

  const search = shell.getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('BM-02-01');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-02-01');
  await expect(page).toHaveURL(/business=BM-02-01/);
  await expect(page).toHaveURL(/process=P01/);
});

test('全体の業務地図へ戻るとプロセス図と詳細を解除し、履歴から復元できる', async ({ page }) => {
  await openRepresentative(page);

  const shell = explorerShell(page);
  await shell.getByRole('button', { name: '全体の業務地図へ戻る' }).click();

  await expect(shell.getByRole('heading', { name: '18業務領域から業務を探す' })).toBeVisible();
  await expect(shell.locator('.flow-map-view')).toHaveCount(0);
  await expect(shell.locator('.explorer-detail-pane')).toHaveCount(0);
  await expect(page).not.toHaveURL(/business=/);
  await expect(page).not.toHaveURL(/process=/);

  await page.goBack();
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(shell.locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P04');

  await page.goForward();
  await expect(shell.getByRole('heading', { name: '18業務領域から業務を探す' })).toBeVisible();
});

test('プロセスが1件の場合も現在のプロセス名と表示中状態を確認できる', async ({ page }) => {
  await page.goto('explorer/?business=BM-02-01');

  const processList = explorerShell(page).getByRole('list', { name: 'この業務を含むプロセス' });
  await expect(processList.getByRole('button')).toHaveCount(1);
  await expect(processList.getByRole('button')).toContainText('P01');
  await expect(processList.getByRole('button')).toContainText('引き合い・提案・契約');
  await expect(processList.getByRole('button')).toContainText('表示中');
  await expect(processList.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
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
    await mobileTabs.getByRole('tab', { name: '業務詳細を見る' }).click();
    await expect(shell.locator('.explorer-detail-pane')).toBeVisible();
    await expect(shell.locator('.explorer-map-pane')).toBeHidden();

    await mobileTabs.getByRole('tab', { name: 'プロセスを見る' }).click();
    await expect(shell.locator('.explorer-map-pane')).toBeVisible();
  } else {
    await expect(mobileTabs).toBeHidden();
    await expect(shell.locator('.explorer-map-pane')).toBeVisible();
    await expect(shell.locator('.explorer-detail-pane')).toBeVisible();
  }
});

test('キーボードで業務検索を完了できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const shell = explorerShell(page);
  const search = shell.getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('不具合を受け付ける');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(shell.locator('.detail-panel-summary h3')).toHaveText('不具合を受け付ける');
  await expect(page).toHaveURL(/business=BM-/);
});

test('旧3表示タブ、旧領域ツリー、下部ライフサイクルを表示しない', async ({ page }) => {
  await openRepresentative(page);

  const shell = explorerShell(page);
  await expect(shell.getByRole('tablist', { name: '表示方法' })).toHaveCount(0);
  await expect(shell.getByText('全体から見る', { exact: true })).toHaveCount(0);
  await expect(shell.getByText('関係から探す', { exact: true })).toHaveCount(0);
  await expect(shell.locator('.explorer-list-pane')).toHaveCount(0);
  await expect(shell.locator('.explorer-lifecycle')).toHaveCount(0);
  await expect(shell.getByRole('heading', { name: '業務プロセス' })).toBeVisible();
});

test('業務詳細で開始契機・完了条件と業務別の関連情報を確認できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const detail = explorerShell(page).getByRole('complementary', { name: '業務詳細' });
  await expect(detail.getByText('開始契機', { exact: true })).toBeVisible();
  await expect(detail.getByText(/点検値、目視結果又は機器状態が記録されたとき/)).toBeVisible();
  await expect(detail.getByText('完了条件', { exact: true })).toBeVisible();
  await expect(detail.getByText(/判定根拠と後続経路が記録され/)).toBeVisible();
  await expect(detail.getByText('入力', { exact: true }).first()).toBeVisible();
  await expect(detail.getByText('成果物', { exact: true }).first()).toBeVisible();
  await expect(detail.getByText('実施者', { exact: true }).first()).toBeVisible();
  await expect(detail.getByText('判断者・承認者', { exact: true })).toBeVisible();
  await expect(detail.getByText('法令・基準', { exact: true })).toBeVisible();
  await expect(detail.getByText('作業手順', { exact: true })).toBeVisible();
  await expect(detail.getByText('チェックリスト・帳票', { exact: true })).toBeVisible();
  await expect(detail.getByText('関連業務', { exact: true })).toBeVisible();
  await expect(detail.getByText(/参照元:/)).toBeVisible();
});

test('関連業務の選択で共通の業務選択処理を呼び出す', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const detail = explorerShell(page).getByRole('complementary', { name: '業務詳細' });
  const relatedSection = detail.locator('details').filter({ hasText: '関連業務' });
  await relatedSection.getByRole('button', { name: /BM-10-01/ }).click();

  await expect(explorerShell(page).locator('.detail-panel-id')).toHaveText('BM-10-01');
  await expect(page).toHaveURL(/business=BM-10-01/);
  await expect(page).toHaveURL(/process=P06/);
});

test('プロセスID・名称の検索から開始業務を選び横断プロセスを直接表示する', async ({ page }) => {
  await page.goto('explorer/');

  const search = explorerShell(page).getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('P06');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(explorerShell(page).locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P06');
  await expect(explorerShell(page).locator('.detail-panel-id')).toHaveText('BM-08-07');
  await expect(page).toHaveURL(/business=BM-08-07/);
  await expect(page).toHaveURL(/process=P06/);
});

test('全体地図から業務領域名で検索して任意の業務へ移動できる', async ({ page }) => {
  await page.goto('explorer/');

  const search = explorerShell(page).getByRole('searchbox', { name: '業務ID・名前・説明から検索' });
  await search.fill('不具合・修繕管理');
  await search.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(explorerShell(page).locator('.detail-panel-id')).toHaveText('BM-10-01');
  await expect(page).toHaveURL(/business=BM-10-01/);
});

test('業務とプロセスだけをURLとブラウザ履歴から復元する', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await openRepresentative(page);

  const shell = explorerShell(page);
  const processList = shell.getByRole('list', { name: 'この業務を含むプロセス' });
  await processList.getByRole('button', { name: /P06.*異常・修繕・復旧/s }).click();
  await expect(page).toHaveURL(/business=BM-09-06/);
  await expect(page).toHaveURL(/process=P06/);
  await expect(page).not.toHaveURL(/view=/);
  await expect(page).not.toHaveURL(/type=/);

  await page.goBack();
  await expect(shell.locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P04');
  await page.reload();
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(shell.locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P04');
});

test('@pages 共有URLへの直接アクセスと再読み込みで同じ状態を復元できる', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop');
  await page.goto('explorer/?business=BM-09-06&process=P06&view=relations&type=uses');

  const shell = explorerShell(page);
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(shell.locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P06');
  await expect(page).not.toHaveURL(/view=/);
  await expect(page).not.toHaveURL(/type=/);
  await expect(shell.getByRole('link', { name: '詳細ページで確認する' })).toHaveAttribute(
    'href',
    /\/property-management-pdm\//,
  );

  await page.reload();
  await expect(shell.locator('.detail-panel-id')).toHaveText('BM-09-06');
  await expect(shell.locator('.flow-map-canvas')).toHaveAttribute('data-process-id', 'P06');
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

  const transitionSeconds = await explorerShell(page).locator('.explorer-map-pane').evaluate((element) => {
    const duration = window.getComputedStyle(element).transitionDuration.split(',')[0] ?? '0s';
    return duration.endsWith('ms') ? Number.parseFloat(duration) / 1000 : Number.parseFloat(duration);
  });
  expect(transitionSeconds).toBeLessThanOrEqual(0.001);
});
