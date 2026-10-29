import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, expect, test as base, type BrowserContext } from '@playwright/test';

interface Fixtures {
  context: BrowserContext;
  extensionId: string;
}

const dist = resolve('dist');

const test = base.extend<Fixtures>({
  // Playwright fixtures must destructure their first argument even when unused.
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'veil-')), {
      channel: 'chromium',
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(new URL(worker.url()).host);
  },
});

test('loads with the approved permissions and no host permissions', async ({ context }) => {
  const worker = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
  const manifest = await worker.evaluate(() => chrome.runtime.getManifest());
  expect(manifest.manifest_version).toBe(3);
  expect(manifest.permissions).toEqual(['activeTab', 'scripting', 'storage']);
  expect(manifest.host_permissions).toBeUndefined();
  const granted = await worker.evaluate(() => chrome.permissions.getAll());
  expect(granted.origins ?? []).toEqual([]);
});

test('popup placeholder renders with bundled fonts and makes no network requests', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  await expect(page.getByRole('heading', { name: 'VEIL' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 16px Newsreader'))).toBe(true);
  expect(await page.evaluate(() => document.fonts.check('400 14px Geist'))).toBe(true);
  expect(requested.every((url) => url.startsWith('chrome-extension://'))).toBe(true);
});

test('popup follows the colour scheme through the same tokens', async ({
  context,
  extensionId,
}) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
  const background = (): Promise<string> =>
    page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await background()).toBe('rgb(247, 246, 243)');
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await background()).toBe('rgb(18, 18, 17)');
});
