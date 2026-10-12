// game-verification reference sketch: a Playwright walk of the game-shell flows with real (CDP)
// input, asserting on the app's OWN state. Adapt the STATE adapter and selectors to the game.
//
//   GAME_URL=http://127.0.0.1:<scratch-port>/?dev=1 node ui-walk.mjs
//
// Expects a dev-only handle `window.__shell()` returning
//   { top: string | null, paused: boolean, focus: string, log: string[] }
// and dialogs #pause, #options (with a text field #name), #death (non-dismissable, read-hold).
// Blind to: pads (CDP has none: shim navigator.getGamepads), pointer lock (often refused under
// automation), screen readers, feel. Say so in the report, as the last lines below do.

import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const URL_ = process.env.GAME_URL ?? 'http://127.0.0.1:39417/';
const GRACE = 400; // beyond the shell's Esc grace, so steps test the flow, not the guard

const browser = await chromium.launch({ headless: true });
const results = [];
const step = async (name, fn) => {
  await fn();
  results.push(`ok  ${name}`);
};

try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(URL_);
  await page.waitForFunction(() => typeof window.__shell === 'function');
  const S = () => page.evaluate(() => window.__shell());
  const wait = (ms) => page.waitForTimeout(ms);

  await page.locator('#hud').focus();

  await step('Esc opens pause; focus on its default', async () => {
    assert.equal((await S()).top, null, 'precondition: nothing open');
    await page.keyboard.press('Escape');
    const s = await S();
    assert.equal(s.top, 'pause');
    assert.equal(s.paused, true);
    assert.equal(s.focus, 'resume');
  });

  await step('a repeated Esc (held key) does not pop', async () => {
    await wait(GRACE);
    await page.keyboard.down('Escape'); // first down: pops pause
    await page.keyboard.down('Escape'); // second down: repeat === true, must be ignored
    await page.keyboard.up('Escape');
    assert.equal((await S()).top, null, 'one level popped, not more');
  });

  await step('Options over Pause; Esc pops one level and restores focus to the opener', async () => {
    await page.keyboard.press('Escape');
    await wait(GRACE);
    await page.locator('#opt').focus();
    await page.keyboard.press('Enter');
    assert.equal((await S()).top, 'options');
    await wait(GRACE);
    await page.keyboard.press('Escape');
    const s = await S();
    assert.equal(s.top, 'pause');
    assert.equal(s.focus, 'opt');
  });

  await step('typing in a text field types; P does not toggle pause there', async () => {
    await page.keyboard.press('Enter'); // Options again (focus is on #opt)
    await page.locator('#name').focus();
    await page.keyboard.type('pip');
    assert.equal(await page.locator('#name').inputValue(), 'pip');
    assert.equal((await S()).top, 'options');
  });

  await step('P toggles pause from Options-over-Pause, resuming once', async () => {
    const resumes = async () => (await S()).log.filter((l) => l === 'RESUMED').length;
    const before = await resumes(); // the log is cumulative: count this step's resumes only
    await page.locator('#dummy').focus();
    await page.keyboard.press('KeyP');
    assert.equal((await S()).top, null);
    assert.equal((await resumes()) - before, 1);
  });

  await step('death screen: Esc ignored, read-hold drops an early Enter, a later Enter acts', async () => {
    await page.locator('#die').click();
    assert.equal((await S()).top, 'death');
    await page.keyboard.press('Enter'); // inside the read-hold
    assert.equal((await S()).top, 'death', 'read-hold dropped the early Enter');
    await wait(GRACE);
    await page.keyboard.press('Escape');
    assert.equal((await S()).top, 'death', 'non-dismissable');
    await wait(1100);
    await page.keyboard.press('Enter');
    assert.equal((await S()).top, null);
  });

  await step('window blur during play opens pause (latch wiring only; blur has no default action)', async () => {
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.equal((await S()).top, 'pause');
  });

  assert.deepEqual(errors, [], 'no page errors');
} finally {
  await browser.close();
}

console.log(results.join('\n'));
console.log('not exercised: pads, pointer lock, screen readers, visibilitychange, feel');
