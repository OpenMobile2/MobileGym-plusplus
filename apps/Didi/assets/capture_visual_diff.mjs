// Regenerate DiDi simulator-side visual comparison screenshots.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../../../..');
const OUTPUT = path.join(REPO, 'docs/didi-replication/visual-diff/actual');
const URL = process.env.DIDI_URL || 'http://127.0.0.1:5193';
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function click(page, selector, index = 0) {
  const elements = await page.$$(selector);
  if (elements.length <= index) {
    throw new Error(`${selector}: expected index ${index}, found ${elements.length}`);
  }
  await elements[index].click();
  await wait(180);
}

async function shot(page, name) {
  const target = path.join(OUTPUT, `${name}.png`);
  await page.screenshot({ path: target });
  fs.chmodSync(target, 0o644);
  console.log(`captured ${name}`);
}

async function back(page) {
  await page.evaluate(() => window.__OS__.handleBack());
  await wait(180);
}

async function openRide(page) {
  await click(page, 'button[data-trigger="dest.search.open"]');
  await shot(page, 'dest.search');
  await click(page, 'button[data-trigger="car.select.open"]');
  await shot(page, 'car.select');
}

async function main() {
  fs.mkdirSync(OUTPUT, { recursive: true, mode: 0o755 });
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });

  try {
    await page.goto(URL, { waitUntil: 'networkidle0' });
    await page.evaluate(() => window.__OS__.openApp('didi'));
    await page.waitForSelector('button[data-trigger="home.tab"]');
    await wait(900);

    await shot(page, 'home.main');
    await openRide(page);
    await click(page, 'button[data-trigger="call.waiting.open"]');
    await shot(page, 'call.waiting');
    await click(page, 'button[data-trigger="trip.driver.open"]');
    await shot(page, 'trip.driver');
    await click(page, 'button[data-trigger="trip.ongoing.open"]');
    await shot(page, 'trip.ongoing');
    await click(page, 'button[data-trigger="trip.finish.open"]');
    await shot(page, 'trip.finish');

    await click(page, 'button[data-trigger="trip.finish.done"]');
    await openRide(page);
    await click(page, 'button[data-trigger="call.waiting.open"]');
    await click(page, 'button[data-trigger="trip.driver.open"]');
    await click(page, 'button[data-trigger="trip.cancel.open"]');
    await shot(page, 'trip.cancel.keep');
    await click(page, 'button[data-action="trip.cancel.confirm"]');
    await click(page, 'button[data-action="trip.cancel.reason.toggle"]', 0);
    await click(page, 'button[data-trigger="trip.cancel.done"]');

    await click(page, 'button[data-trigger="trips.tab"]');
    await shot(page, 'trips.list');
    await click(page, '[data-testid="didi-trips-section-all"]');
    await click(page, 'button[data-trigger="invoice.fromTrips"]', 0);
    await shot(page, 'invoice.entry');
    await click(page, 'button[data-action="invoice.entry.trip.toggle"]', 0);
    await click(page, 'button[data-trigger="invoice.form.open"]');
    await shot(page, 'invoice.form');

    await back(page);
    await back(page);
    await click(page, 'button[data-trigger="me.tab"]');
    await shot(page, 'me.main');
    await click(page, 'button[data-trigger="coupons.list.open"]');
    await shot(page, 'coupons.list');
    await back(page);
    await click(page, 'button[data-trigger="wallet.main.open"]');
    await shot(page, 'wallet.main');
    await back(page);
    await click(page, 'button[data-trigger="settings.main.open"]');
    await shot(page, 'settings.main');
    await click(page, 'button[data-trigger="settings.account.open"]');
    await shot(page, 'settings.account');
    await click(page, 'button[data-trigger="settings.account.delete.open"]');
    await shot(page, 'settings.account.delete');
    await back(page);
    await back(page);
    await click(page, 'button[data-trigger="safety.fromSettings"]');
    await shot(page, 'safety.center');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
