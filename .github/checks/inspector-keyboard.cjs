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
  if (!file) return response.writeHead(404).end();
  try {
   response.writeHead(200, { 'Content-Type': file[1] }).end(await readFile(path.join(root, file[0])));
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
     const picker = page.getByLabel(lang === 'pl' ? 'Element do sprawdzenia' : 'Element to inspect');
     assert.equal(await picker.count(), 1, 'The inspector needs a labelled keyboard selector');
     await picker.focus();
     await page.keyboard.press('Home');
     await page.keyboard.press('ArrowDown');
     assert.notEqual(await picker.inputValue(), '', 'Arrow keys choose an element');
     for (const selector of ['.blk-kiwi h3', '.blk-kiwi p', '.blk-kiwi img']) {
      const target = page.locator(selector).first();
      assert.equal(await target.count(), 1, `${selector} exists`);
      await target.hover();
      await page.waitForFunction(element => document.querySelector('.probe-target').textContent === element.tagName.toLowerCase() + [...element.classList].map(name => '.' + name).join(''), await target.elementHandle()).catch(error => { throw new Error(`Failed to inspect ${selector}`, { cause: error }); });
      const pointerBox = await page.locator('.probe-box').textContent();
      const value = await picker.inputValue();
      assert.notEqual(value, '', `${selector} has a selectable option`);
      await picker.selectOption('1');
      await page.waitForFunction(() => document.querySelector('.probe-target').textContent === 'html');
      await picker.selectOption(value);
      await page.waitForFunction(element => document.querySelector('.probe-target').textContent === element.tagName.toLowerCase() + [...element.classList].map(name => '.' + name).join(''), await target.elementHandle());
      assert.equal(await page.locator('.probe-box').textContent(), pointerBox);
     }
     await picker.focus();
     await page.keyboard.press('Escape');
     assert.equal(await page.locator('#probe-toggle').getAttribute('aria-pressed'), 'false');
     assert.equal(await page.locator('#probe-toggle').evaluate(element => element === document.activeElement), true);
    } finally {
     await page.close();
    }
   }
  }
  console.log('Keyboard selection describes the same elements as pointing in both languages.');
 } finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
 }
})().catch(error => { console.error(error); process.exitCode = 1; });
