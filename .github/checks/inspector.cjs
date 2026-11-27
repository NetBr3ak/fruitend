const assert = require('node:assert/strict');
const http = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.join(__dirname, '../..');
const files = {
 '/': ['index.html', 'text/html'],
 '/pl/': ['pl/index.html', 'text/html'],
 '/styles.css': ['styles.css', 'text/css'],
 '/script.js': ['script.js', 'text/javascript'],
};

(async () => {
 const server = http.createServer(async (request, response) => {
  const file = files[request.url];
  if (!file) {
   response.writeHead(404).end();
   return;
  }
  try {
   const data = await readFile(path.join(root, file[0]));
   response.writeHead(200, { 'Content-Type': file[1] }).end(data);
  } catch (error) {
   response.writeHead(500).end();
   console.error(error);
  }
 });
 await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
 let browser;
 try {
  browser = await chromium.launch();
  for (const width of [375, 1280]) {
   for (const lang of ['en', 'pl']) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    try {
     await page.goto(`http://127.0.0.1:${server.address().port}/${lang === 'pl' ? 'pl/' : ''}`);
     await page.locator('#probe-toggle').click();
     const select = async (selector, target) => {
      await page.locator(selector).dispatchEvent('pointerover');
      await page.waitForFunction(value => document.querySelector('.probe-target').textContent === value, target);
      return page.locator('.probe-box').textContent();
     };
     await select('.blk-wide .blk-text', 'div.blk-text');
     assert.match(await page.locator('.probe-label').textContent(),
      lang === 'pl' ? /Warunki kontenerów nie są sprawdzane/ : /Container conditions are not checked/);
     const plain = await select('.blk-kiwi h3', 'h3');
     assert.match(plain, lang === 'pl' ? /tekst [\d.]+:1/ : /text [\d.]+:1/);
     const texture = await select('.fruits-title', 'h2.fruits-title');
     const uncertain = lang === 'pl' ? /kontrast tekstu na tym tle nie został obliczony/ : /text contrast not calculated for this background/;
     assert.match(texture, uncertain);
     await page.locator('.blk-kiwi').evaluate(element => { element.classList.add('probe-rules'); });
     await page.waitForFunction(() => getComputedStyle(document.querySelector('.blk-kiwi')).opacity === '0.82');
     await select('.blk-kiwi h3', 'h3');
     await page.waitForFunction(pattern => document.querySelector('.probe-box').textContent.includes(pattern),
      lang === 'pl' ? 'kontrast tekstu na tym tle nie został obliczony' : 'text contrast not calculated for this background');
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('#probe-toggle').getAttribute('aria-pressed'), 'false');
    } finally {
     await page.close();
    }
   }
  }
  console.log('Inspector describes conditional rules and avoids uncertain contrast in both languages.');
 } finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
 }
})().catch(error => {
 console.error(error);
 process.exitCode = 1;
});
