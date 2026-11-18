const assert = require('node:assert/strict');
const path = require('node:path');
const { readFileSync } = require('node:fs');
const { gzipSync } = require('node:zlib');
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
async function checkCssMotion(browser, reducedMotion, javaScriptEnabled) {
 const page = await browser.newPage({ reducedMotion, javaScriptEnabled });
 try {
  await page.goto(url);
  const loops = () => page.evaluate(() => [
   getComputedStyle(document.querySelector('.citrus'), '::before'),
   getComputedStyle(document.querySelector('.ticker-track')),
   getComputedStyle(document.querySelector('.cut img'))
  ].map(style => [style.animationName, style.animationPlayState]));
  const names = reducedMotion === 'reduce' ? ['breathe', 'breathe', 'breathe'] : ['spin', 'slide', 'float'];
  assert.deepEqual(await loops(), names.map(name => [name, 'running']));
  const toggle = page.locator('#motion-toggle');
  await toggle.focus();
  await page.keyboard.press('Space');
  assert.deepEqual(await loops(), names.map(name => [name, 'paused']));
  await page.keyboard.press('Space');
  assert.deepEqual(await loops(), names.map(name => [name, 'running']));
 } finally {
  await page.close();
 }
}
(async () => {
 const compressedSize = file => gzipSync(readFileSync(path.join(__dirname, '../..', file)), { level: 9 }).length;
 assert.ok(compressedSize('index.html') + compressedSize('styles.css') <= 14 * 1024, 'HTML and CSS exceed 14 KiB gzip');
 assert.ok(compressedSize('script.js') <= 3 * 1024, 'JavaScript exceeds 3 KiB gzip');
 const browser = await chromium.launch();
 try {
  for (const width of [375, 1280]) await checkControls(browser, width);
  for (const motion of ['reduce', 'no-preference']) {
   for (const enabled of [false, true]) await checkCssMotion(browser, motion, enabled);
  }
 } finally {
  await browser.close();
 }
})().catch(error => {
 console.error(error);
 process.exitCode = 1;
});
