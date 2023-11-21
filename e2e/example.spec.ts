import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('http://127.0.0.1:1234');
});

test('works on every browser', async ({ browserName, page }) => {
  // @ts-expect-error: `cookieStore` does not exists
  const store = await page.evaluate(() => window.cookieStore);

  switch (browserName) {
    case 'webkit':
    case 'firefox':
      expect(store).not.toBeDefined();
      break;
    case 'chromium':
    default:
      expect(store).toBeDefined();
      break;
  }

  const msgPromise = page.waitForEvent('console', (e) => e.type() === 'debug');

  await page.evaluate(() => {
    document.cookie = 'foo=bar';
  });

  const msg = await msgPromise;
  const entries = await msg.args()[0].jsonValue();

  expect(entries.changed).toContainEqual({ name: 'foo', value: 'bar' });
});
