import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('http://127.0.0.1:1234');
});

test('open script on browser', async ({ page }) => {
	await page.getByRole('button', { name: 'foo' }).click();

	expect(await page.evaluate(() => {
		return document.cookie;
	})).toEqual(expect.stringContaining('foo=123'));

	await page.getByRole('button', { name: 'bar' }).click();

	expect(await page.evaluate(() => {
		return document.cookie;
	})).toEqual(expect.stringContaining('bar=456'));
});
