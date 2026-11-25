const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const languages = [
 { file: 'index.html', pause: 'Pause motion', play: 'Play motion' },
 { file: 'pl/index.html', pause: 'Zatrzymaj ruch', play: 'Włącz ruch' },
];

(async () => {
 const browser = await chromium.launch();
 try {
  for (const language of languages) {
   for (const javaScriptEnabled of [true, false]) {
    const page = await browser.newPage({ javaScriptEnabled, reducedMotion: 'no-preference', viewport: { width: 375, height: 812 } });
    try {
     await page.goto(pathToFileURL(path.join(__dirname, '../..', language.file)).href);
     const pause = page.getByRole('checkbox', { name: language.pause });
     assert.equal(await pause.count(), 1);
     await pause.check();
     const play = page.getByRole('checkbox', { name: language.play });
     assert.equal(await play.count(), 1);
     assert.equal(await play.isChecked(), true);
     await play.focus();
     await page.keyboard.press('Space');
     assert.equal(await pause.count(), 1);
     assert.equal(await pause.isChecked(), false);
    } finally {
     await page.close();
    }
   }
  }
 } finally {
  await browser.close();
 }
 console.log('Motion labels match their visible actions in both languages, with and without JavaScript.');
})().catch(error => {
 console.error(error);
 process.exitCode = 1;
});
