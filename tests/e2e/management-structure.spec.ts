import { expect, test } from '@playwright/test';

const pages = [
  ['management-structure/', '所有・運営・維持管理の業務構造'],
  ['management-structure/ownership-and-investment/', '1. 所有・投資管理レイヤー'],
  ['management-structure/ownership-and-investment/owner/', 'オーナー'],
  ['management-structure/ownership-and-investment/asset-management/', 'アセットマネジメント（AM）'],
  ['management-structure/property-and-facility-operation/', '2. 物件・施設運営レイヤー'],
  ['management-structure/property-and-facility-operation/property-management/', 'プロパティマネジメント（PM）'],
  ['management-structure/property-and-facility-operation/facility-management/', 'ファシリティマネジメント（FM）'],
  ['management-structure/maintenance-execution/', '3. 維持管理・実行レイヤー'],
  ['management-structure/maintenance-execution/building-maintenance/', 'ビルメンテナンス（BM）の位置付け'],
  ['management-structure/connections/decision-and-responsibility/', '意思決定と責任分界'],
  ['management-structure/connections/requirements-to-bm/', '上位要求からBM業務への接続'],
  ['management-structure/connections/bm-feedback-to-management/', 'BM実績から上位判断へのフィードバック'],
  ['management-structure/scenarios/', '代表シナリオ'],
  ['management-structure/scenarios/air-conditioning-renewal/', '空調設備を更新する'],
  ['management-structure/scenarios/statutory-nonconformity/', '法定点検の不適合を是正する'],
  ['management-structure/scenarios/disaster-recovery/', '災害後の復旧方針を決める'],
  ['reference/management-to-bm-map/', '上位業務とBM業務の接続マップ'],
] as const;

test('上位業務レイヤーの全ページを公開し、主要見出しを表示する', async ({ page }) => {
  for (const [path, heading] of pages) {
    const response = await page.goto(path);
    expect(response?.ok(), `${path} should respond successfully`).toBeTruthy();
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
  }
});

test('既存URLを維持し、新章への相互導線を表示する', async ({ page }) => {
  await page.goto('introduction/people-and-roles/');
  await expect(page.getByRole('link', { name: '所有・運営・維持管理の業務構造' }).first()).toBeVisible();

  await page.goto('variations/responsibility-boundaries/');
  await expect(page.getByRole('link', { name: '所有・運営・維持管理の業務構造' }).first()).toBeVisible();

  await page.goto('management-structure/');
  await expect(page.getByRole('link', { name: '関係者と役割' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'オーナー・PM・FM・BMの責任分界' })).toBeVisible();
  await expect(page.getByRole('link', { name: '業務カタログ' })).toBeVisible();
});

test('3シナリオから上位ID・BM ID・接続種別・KPIを追跡できる', async ({ page }) => {
  for (const path of [
    'management-structure/scenarios/air-conditioning-renewal/',
    'management-structure/scenarios/statutory-nonconformity/',
    'management-structure/scenarios/disaster-recovery/',
  ]) {
    await page.goto(path);
    const main = page.locator('main');
    await expect(main).toContainText(/OWN-\d{2}/);
    await expect(main).toContainText(/AM-\d{2}/);
    await expect(main).toContainText(/PM-\d{2}/);
    await expect(main).toContainText(/FM-\d{2}/);
    await expect(main).toContainText(/BM-\d{2}/);
    await expect(main).toContainText(/requires|constrains|approves|reports|informs-decision|aggregates-to-kpi/);
    await expect(main).toContainText(/FIN-|OPS-|QTY-|RSK-|VAL-|USR-/);
  }
});

test('ページ全体に意図しない横スクロールを発生させない', async ({ page }) => {
  for (const path of [
    'management-structure/',
    'management-structure/connections/decision-and-responsibility/',
    'management-structure/scenarios/air-conditioning-renewal/',
  ]) {
    await page.goto(path);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
    }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport + 1);
    await expect(page.locator('.mermaid').first()).toBeVisible();
  }
});
