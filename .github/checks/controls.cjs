const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');
const url = pathToFileURL(path.join(__dirname, '../../index.html')).href;
async function checkControls(browser, width) {
 const page = await browser.newPage({ viewport: { width, height: 812 } });
 try {
  await page.goto(url);
  await page.locator('.bar-links a[href="#about"]').click();
  await page.waitForFunction(() => window.scrollY > 500);
  await page.locator('.wordmark').click();
  await page.waitForFunction(() => window.scrollY === 0);
  const motion = page.locator('#motion-toggle');
  const inspect = page.locator('#probe-toggle');
  const close = page.locator('.probe-close');
  const ticker = page.locator('.ticker-track');
  for (const paused of [false, true]) {
   if (paused) await motion.click();
   await inspect.click();
   assert.equal(await motion.isDisabled(), true);
   assert.equal(await ticker.evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
   await close.focus();
   await page.keyboard.press('Escape');
   assert.equal(await inspect.evaluate(el => document.activeElement === el), true);
   assert.equal(await motion.isEnabled(), true);
   assert.equal(await ticker.evaluate(el => getComputedStyle(el).animationPlayState), paused ? 'paused' : 'running');
  }
 } finally {
  await page.close();
 }
}
(async () => {
 const browser = await chromium.launch();
 try {
  for (const width of [375, 1280]) await checkControls(browser, width);
 } finally {
  await browser.close();
 }
})().catch(error => {
 console.error(error);
 process.exitCode = 1;
});
