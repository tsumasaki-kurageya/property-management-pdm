import { expect, test } from '@playwright/test';

test('業務ガイドラインのMermaidラベルがBOX内に収まる', async ({ page }) => {
  await page.goto('introduction/how-to-use/');
  await expect(page.getByRole('heading', { name: '業務ガイドラインの使い方' })).toBeVisible();

  const diagrams = page.locator('.mermaid svg');
  await expect(diagrams).toHaveCount(3);
  await expect.poll(() => diagrams.locator('g.node').count()).toBeGreaterThan(0);

  const measurements = await diagrams.evaluateAll((svgs) =>
    svgs.flatMap((svg, diagramIndex) =>
      Array.from(svg.querySelectorAll<SVGGElement>('g.node')).map((node, nodeIndex) => {
        const shape = node.querySelector<SVGRectElement>('rect');
        const foreignObject = node.querySelector<SVGForeignObjectElement>('foreignObject');
        const text = node.querySelector<SVGTextElement>('text');
        const label = foreignObject ?? text;
        const htmlLabel = foreignObject?.querySelector<HTMLElement>('div');

        if (!shape || !label) {
          return {
            diagramIndex,
            nodeIndex,
            text: node.textContent?.trim() ?? '',
            contained: false,
            reason: 'shape or label not found',
          };
        }

        const shapeRect = shape.getBoundingClientRect();
        const labelRect = label.getBoundingClientRect();
        const tolerance = 2;
        const labelInsideShape =
          labelRect.left >= shapeRect.left - tolerance &&
          labelRect.right <= shapeRect.right + tolerance &&
          labelRect.top >= shapeRect.top - tolerance &&
          labelRect.bottom <= shapeRect.bottom + tolerance;
        const htmlContentFits =
          !htmlLabel ||
          (htmlLabel.scrollWidth <= htmlLabel.clientWidth + tolerance &&
            htmlLabel.scrollHeight <= htmlLabel.clientHeight + tolerance);

        return {
          diagramIndex,
          nodeIndex,
          text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          contained: labelInsideShape && htmlContentFits,
          shape: {
            width: shapeRect.width,
            height: shapeRect.height,
          },
          label: {
            width: labelRect.width,
            height: labelRect.height,
          },
          htmlContentFits,
        };
      }),
    ),
  );

  const clippedLabels = measurements.filter((measurement) => !measurement.contained);
  expect(clippedLabels, JSON.stringify(clippedLabels, null, 2)).toEqual([]);
});
