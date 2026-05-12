const path = require('path');
const { pathToFileURL } = require('url');
const { test, expect } = require('@playwright/test');

test('QUnit browser suite passes', async ({ page }) => {
  const testPage = pathToFileURL(path.resolve(__dirname, 'index.html')).href;

  await page.goto(testPage);
  await page.waitForFunction(function() {
    return Boolean(window.__qunitDone);
  });

  const stats = await page.evaluate(function() {
    return {
      details: window.__qunitDone,
      failures: window.__qunitFailures
    };
  });

  expect(stats.details.failed, JSON.stringify(stats, null, 2)).toBe(0);
});
