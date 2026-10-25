import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { courseFixture, login } from './course-fixture.ts';

test('PERF-01: Materiales muestra las clases sin descargar PDF ni un motor de PDF', async ({ app, screen, browser }) => {
  await courseFixture(browser); await login(app, screen);
  await browser.evaluate(() => { performance.clearResourceTimings(); performance.mark('materials-start'); });
  await screen.getByRole('link', 'Materiales del curso', { exact: true }).tap();
  await expect(screen.getByRole('heading', 'Materiales del curso.')).toBeVisible();
  await expect(screen.getByRole('region', 'Clases del curso')).toBeVisible();
  const metrics = await browser.evaluate(async () => {
    const visibleCovers = [...document.querySelectorAll('.class-cover')].filter(image => image.getBoundingClientRect().top < window.innerHeight) as HTMLImageElement[];
    await Promise.all(visibleCovers.map(image => image.decode()));
    return {
    readyMs: Math.round(performance.now() - performance.getEntriesByName('materials-start')[0].startTime),
    resources: performance.getEntriesByType('resource').map(entry => {
      const resource = entry as PerformanceResourceTiming;
      return { path: new URL(resource.name).pathname, bytes: resource.encodedBodySize };
    }),
    };
  });
  console.log('MATERIALS_METRICS', JSON.stringify(metrics));
  await expect(metrics.resources.filter(resource => /\.pdf$|\/vendor\/pdfjs\//.test(resource.path))).toEqual([]);
  await expect(metrics.resources.reduce((sum, resource) => sum + resource.bytes, 0) < 200000).toBe(true);
  await browser.route('**/*.pdf', route => route.abort());
  await browser.evaluate(() => { performance.clearResourceTimings(); performance.mark('class-start'); });
  await screen.getByRole('button', 'Ver clase 1: IA y chatbots', { exact: true }).tap();
  await expect(screen.getByRole('status').filter({ hasText: 'Página 1 de' })).toBeVisible();
  const preview = await browser.evaluate(() => ({
    readyMs: Math.round(performance.now() - performance.getEntriesByName('class-start')[0].startTime),
    resources: performance.getEntriesByType('resource').map(entry => ({ path: new URL(entry.name).pathname, bytes: (entry as PerformanceResourceTiming).encodedBodySize })),
  }));
  console.log('CLASS_PREVIEW_METRICS', JSON.stringify(preview));
  await expect(preview.resources.filter(resource => /\.pdf$|\/vendor\/pdfjs\//.test(resource.path))).toEqual([]);
  await expect(preview.resources.reduce((sum, resource) => sum + resource.bytes, 0) < 250000).toBe(true);
});
