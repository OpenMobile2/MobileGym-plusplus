#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.argv[2] ?? 'http://127.0.0.1:4181';
const OUT = path.resolve(process.argv[3] ?? `runs/new-app-tools-smoke-${Date.now()}`);
const EXPECTED = { broadcast: 8, ctrip: 8, luckin: 7 };

function assert(value, message) {
  if (!value) throw new Error(message);
}

const clone = (value) => JSON.parse(JSON.stringify(value));
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

async function appState(page, app) {
  return page.evaluate((appId) => {
    const value = window.__SIM__.getState().apps[appId] ?? {};
    return JSON.parse(JSON.stringify(value, (_key, item) => typeof item === 'function' ? undefined : item));
  }, app);
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const report = { url: URL, started_at: new Date().toISOString(), apps: {}, calls: [] };
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  try {
    for (const app of Object.keys(EXPECTED)) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      try {
        await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 1 });
        await page.goto(URL, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__MOBILE_GYM_TOOLS__ && window.__SIM__ && window.__OS__);
        await page.evaluate((appId) => window.__SIM__.waitForData([appId]), app);
        await page.evaluate((appId) => window.__OS__.openApp(appId, '/'), app);
        const definitions = await page.evaluate((appId) => window.__MOBILE_GYM_TOOLS__.listTools({ app: appId }), app);
        assert(definitions.length === EXPECTED[app], `${app}: expected ${EXPECTED[app]} tools, got ${definitions.length}`);
        const definitionMap = new Map(definitions.map((item) => [item.name, item]));

        const call = async (name, args = {}, expectedRoute) => {
          const definition = definitionMap.get(name);
          assert(definition, `${name} is not registered`);
          const before = await appState(page, app);
          const result = await page.evaluate(({ toolName, toolArgs }) =>
            window.__MOBILE_GYM_TOOLS__.callTool(toolName, toolArgs), { toolName: name, toolArgs: args });
          const after = await appState(page, app);
          assert(result?.ok === true, `${name}: ${JSON.stringify(result?.error)}`);
          if (definition.annotations.readOnlyHint && definition.annotations.uiEffect === 'none') {
            assert(equal(before, after), `${name} changed business state despite readOnlyHint`);
          }
          let route = null;
          if (definition.annotations.uiEffect !== 'none') {
            route = await page.evaluate((appId) => window.__OS__.getAppRoute(appId)?.path ?? null, app);
            assert(route === expectedRoute, `${name}: route ${route}, expected ${expectedRoute}`);
            const imagePath = path.join(OUT, `${name}.png`);
            const image = await page.screenshot({ path: imagePath });
            assert(image.byteLength > 5000, `${name}: blank screenshot`);
          }
          report.calls.push({ app, name, ok: true, route });
          return { output: result.output, before, after };
        };

        const initial = await appState(page, app);
        if (app === 'broadcast') {
          const show = Object.values(initial.shows)[0];
          const episode = Object.values(initial.episodes)[0];
          assert(show && episode, 'Broadcast fixture is empty');
          await call('broadcast__search_shows', { query: show.title, limit: 5 });
          await call('broadcast__search_episodes', { query: episode.title, limit: 5 });
          await call('broadcast__get_show_summary', { show_id: show.id });
          await call('broadcast__get_episode_summary', { episode_id: episode.id });
          await call('broadcast__list_up_next', { limit: 10 });
          await call('broadcast__open_show', { show_id: show.id }, `/show/${show.id}`);
          await call('broadcast__open_episode', { episode_id: episode.id }, `/episode/${episode.id}`);
          const queued = await call('broadcast__add_to_queue', { episode_id: episode.id });
          assert(queued.after.queueIds.includes(episode.id), 'Broadcast queue write did not persist');
        } else if (app === 'ctrip') {
          const hotel = initial.hotels[0];
          const train = initial.trains[0];
          const flight = initial.flights[0];
          const attraction = initial.attractions[0];
          assert(hotel && train && flight && attraction, 'Ctrip fixture is incomplete');
          await call('ctrip__search_hotels', { query: hotel.name, limit: 5 });
          await call('ctrip__get_hotel_summary', { hotel_id: hotel.id });
          await call('ctrip__search_trains', { query: train.trainNo, limit: 5 });
          await call('ctrip__search_flights', { query: flight.flightNo, limit: 5 });
          await call('ctrip__search_attractions', { query: attraction.name, limit: 5 });
          await call('ctrip__list_orders', { limit: 10 });
          await call('ctrip__open_hotel', { hotel_id: hotel.id }, `/hotel/${hotel.id}`);
          await call('ctrip__open_orders', {}, '/orders');
        } else {
          const product = initial.products[0];
          assert(product, 'Luckin fixture is empty');
          await call('luckin__search_products', { query: product.name, limit: 5 });
          await call('luckin__list_stores', { limit: 10 });
          await call('luckin__list_coupons', { limit: 10 });
          await call('luckin__get_cart', { limit: 10 });
          await call('luckin__open_product', { product_id: product.id }, `/product/${product.id}`);
          await call('luckin__open_cart', {}, '/order/confirm');
          const beforeQty = initial.cart.find((item) => item.productId === product.id)?.quantity ?? 0;
          const added = await call('luckin__add_to_cart', { product_id: product.id });
          const afterQty = added.after.cart.find((item) => item.productId === product.id)?.quantity ?? 0;
          assert(afterQty === beforeQty + 1, 'Luckin cart quantity did not increase exactly once');
        }
        report.apps[app] = { passed: true, tool_count: definitions.length };
      } catch (error) {
        report.apps[app] = { passed: false, error: error.stack ?? String(error) };
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  report.finished_at = new Date().toISOString();
  report.summary = {
    passed_apps: Object.values(report.apps).filter((item) => item.passed).length,
    total_apps: Object.keys(report.apps).length,
    passed_calls: report.calls.length,
  };
  await fs.writeFile(path.join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ out: OUT, summary: report.summary, apps: report.apps }, null, 2));
  assert(report.summary.passed_apps === report.summary.total_apps, 'One or more app tool suites failed');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
