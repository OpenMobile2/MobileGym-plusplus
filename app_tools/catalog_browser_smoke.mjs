#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.argv[2] ?? 'http://127.0.0.1:4181';
const OUT = path.resolve(process.argv[3] ?? `runs/catalog-tools-smoke-${Date.now()}`);
const APPS = [
  'baicizhan', 'boss', 'cainiao', 'didi', 'douban',
  'fanqietodo', 'fanqiexiaoshuo', 'flomo', 'keep',
  'maoyan', 'meituan', 'meiyou', 'pinduoduo', 'suning', 'tencentvideo',
  'vipshop', 'weibo', 'xianyu', 'xiaorichang', 'ximalaya', 'youku',
];
const CONFIG_QUERIES = {
  boss: '校招提前批-算法工程师',
  meituan: '麦当劳（望京店）',
  suning: '格力(GREE)云锦Pro',
  youku: '寻妖记',
};

function assert(value, message) {
  if (!value) throw new Error(message);
}

function rows(value) {
  if (Array.isArray(value)) return value.map((item, index) => [String(index), item]);
  if (value && typeof value === 'object') return Object.entries(value);
  return [];
}

function searchNeedle(key, value) {
  if (value && typeof value === 'object') {
    for (const field of ['id', 'title', 'name', 'displayName', 'word', 'subject', 'content']) {
      if (typeof value[field] === 'string' && value[field].trim()) return value[field].trim();
    }
    const scalar = Object.values(value).find((item) => typeof item === 'string' && item.trim());
    if (scalar) return scalar.trim();
  }
  return key;
}

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const report = { url: URL, apps: {}, calls: [], errors: [] };
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  try {
    for (const app of APPS) {
      console.log(`[catalog-smoke] ${app}`);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      try {
        await page.goto(URL, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__MOBILE_GYM_TOOLS__ && window.__SIM__ && window.__OS__);
        await page.evaluate((appId) => window.__SIM__.waitForData([appId]), app);
        await page.evaluate((appId) => window.__OS__.openApp(appId, '/'), app);
        const state = await page.evaluate((appId) => JSON.parse(JSON.stringify(window.__SIM__.getState().apps[appId] ?? {})), app);
        const definitions = await page.evaluate((appId) => window.__MOBILE_GYM_TOOLS__.listTools({ app: appId }), app);
        const search = definitions.find((item) => item.name.startsWith(`${app}__search_`));
        const list = definitions.find((item) => item.name.startsWith(`${app}__list_`));
        assert(search && list, `${app}: missing catalog search/list definitions`);

        const searchField = search.name.slice(`${app}__search_`.length);
        const listField = list.name.slice(`${app}__list_`.length);
        const searchRows = rows(state[searchField]);
        const listRows = rows(state[listField]);
        const query = searchRows.length > 0
          ? searchNeedle(...searchRows[0])
          : CONFIG_QUERIES[app];
        assert(query, `${app}.${searchField}: no store row or audited config query`);

        const before = JSON.stringify(state);
        const searchResult = await page.evaluate(
          ({ name, queryValue }) => window.__MOBILE_GYM_TOOLS__.callTool(name, { query: queryValue, limit: 50 }),
          { name: search.name, queryValue: query },
        );
        const listResult = await page.evaluate(
          (name) => window.__MOBILE_GYM_TOOLS__.callTool(name, { limit: 50 }), list.name,
        );
        const after = await page.evaluate((appId) => JSON.stringify(window.__SIM__.getState().apps[appId] ?? {}), app);
        assert(searchResult?.ok, `${search.name}: ${JSON.stringify(searchResult?.error)}`);
        assert(listResult?.ok, `${list.name}: ${JSON.stringify(listResult?.error)}`);
        assert(searchResult.output.items.length > 0, `${search.name}: seeded query returned no matching rows`);
        if (listRows.length > 0) {
          assert(listResult.output.total === listRows.length, `${list.name}: tool total does not match GUI store (${listResult.output.total}/${listRows.length})`);
        } else {
          assert(listResult.output.total > 0, `${list.name}: canonical GUI config returned no rows`);
        }
        assert(before === after, `${app}: read-only catalog tools changed GUI store state`);
        report.apps[app] = {
          passed: true, search_tool: search.name, list_tool: list.name,
          primary_store_rows: searchRows.length,
          secondary_store_rows: listRows.length,
          search_result_rows: searchResult.output.total,
          list_result_rows: listResult.output.total,
        };
        report.calls.push({ app, name: search.name, query, returned: searchResult.output.items.length, passed: true });
        report.calls.push({ app, name: list.name, returned: listResult.output.items.length, passed: true });
      } catch (error) {
        report.apps[app] = { passed: false };
        report.errors.push({ app, error: error.stack ?? error.message });
      } finally {
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  report.summary = {
    apps: APPS.length,
    passed_apps: Object.values(report.apps).filter((item) => item.passed).length,
    calls: report.calls.length,
    failed: report.errors.length,
  };
  await fs.writeFile(path.join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ out: OUT, summary: report.summary, errors: report.errors }, null, 2));
  assert(report.errors.length === 0, `${report.errors.length} catalog app smoke suites failed`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
