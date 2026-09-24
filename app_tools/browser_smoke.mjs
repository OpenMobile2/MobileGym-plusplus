#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import puppeteer from 'puppeteer';

const TARGET_APPS = ['wechat', 'tbsg', 'daysmatter', 'clock', 'notes'];
const TOOL_COUNTS = { wechat: 10, tbsg: 10, daysmatter: 9, clock: 9, notes: 10 };

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) result[key] = true;
    else {
      result[key] = value;
      index += 1;
    }
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sameValue(left, right) {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function changedTopLevelKeys(before, after) {
  const keys = new Set([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  return [...keys].filter((key) => !sameValue(before?.[key], after?.[key])).sort();
}

function sanitize(value) {
  return value.replaceAll('__', '-').replaceAll('_', '-').replace(/[^a-z0-9-]/gi, '');
}

async function appState(page, app) {
  return page.evaluate((appId) => {
    const state = window.__SIM__?.getState?.()?.apps?.[appId] ?? {};
    return JSON.parse(JSON.stringify(state, (_key, value) =>
      typeof value === 'function' || typeof value === 'symbol' ? undefined : value));
  }, app);
}

async function currentRoute(page, app) {
  return page.evaluate((appId) => window.__OS__?.getAppRoute?.(appId)?.path ?? null, app);
}

class AppSmokeRunner {
  constructor(app, page, definitions, screenshotsDir, report) {
    this.app = app;
    this.page = page;
    this.definitions = new Map(definitions.map((definition) => [definition.name, definition]));
    this.screenshotsDir = screenshotsDir;
    this.report = report;
    this.sequence = 0;
  }

  async state() {
    return appState(this.page, this.app);
  }

  async call(name, arguments_ = {}, options = {}) {
    const definition = this.definitions.get(name);
    assert(definition, `${name} is not registered for ${this.app}`);
    this.sequence += 1;
    await new Promise((resolve) => setTimeout(resolve, 120));
    const before = await this.state();
    const startedAt = Date.now();
    const result = await this.page.evaluate(
      async ({ toolName, toolArguments }) =>
        window.__MOBILE_GYM_TOOLS__.callTool(toolName, toolArguments),
      { toolName: name, toolArguments: arguments_ },
    );
    await new Promise((resolve) => setTimeout(resolve, 120));
    const after = await this.state();
    const changedKeys = changedTopLevelKeys(before, after);
    const route = await currentRoute(this.page, this.app);
    const record = {
      app: this.app,
      name,
      arguments: arguments_,
      ok: result?.ok === true,
      output: result?.ok ? result.output : undefined,
      error: result?.ok ? undefined : result?.error,
      changed_state_keys: changedKeys,
      route,
      duration_ms: Date.now() - startedAt,
    };

    try {
      assert(result?.ok === true, `${name} failed: ${JSON.stringify(result?.error)}`);
      const annotations = definition.annotations ?? {};
      const allowed = options.allowedStateKeys
        ?? (annotations.readOnlyHint && annotations.uiEffect === 'none' ? [] : null);
      if (allowed) {
        const unexpected = changedKeys.filter((key) => !allowed.includes(key));
        assert(unexpected.length === 0, `${name} unexpectedly changed state keys: ${unexpected.join(', ')}`);
      }
      if (options.requireStateKey) {
        assert(changedKeys.includes(options.requireStateKey), `${name} did not change expected state key ${options.requireStateKey}`);
      }
      if (options.expectedPath) {
        const matches = options.expectedPath instanceof RegExp
          ? options.expectedPath.test(route ?? '')
          : route === options.expectedPath;
        assert(matches, `${name} reached route ${route}, expected ${String(options.expectedPath)}`);
      }
      if (options.bodyIncludes) {
        const body = await this.page.evaluate(() => document.body.innerText);
        assert(body.includes(options.bodyIncludes), `${name} page does not contain ${JSON.stringify(options.bodyIncludes)}`);
      }
      if (options.valueIncludes) {
        const values = await this.page.evaluate(() =>
          [...document.querySelectorAll('input, textarea')].map((element) => element.value));
        assert(
          values.some((value) => value.includes(options.valueIncludes)),
          `${name} form controls do not contain ${JSON.stringify(options.valueIncludes)}`,
        );
      }
      if (annotations.uiEffect && annotations.uiEffect !== 'none') {
        const screenshotPath = path.join(
          this.screenshotsDir,
          `${this.app}-${String(this.sequence).padStart(2, '0')}-${sanitize(name)}.png`,
        );
        const image = await this.page.screenshot({ path: screenshotPath });
        assert(image.byteLength > 5000, `${name} produced an unexpectedly small screenshot`);
        const bodyTextLength = await this.page.evaluate(() => document.body.innerText.trim().length);
        assert(bodyTextLength > 10, `${name} produced an empty rendered page`);
        record.screenshot = screenshotPath;
        record.screenshot_bytes = image.byteLength;
        record.body_text_length = bodyTextLength;
      }
      if (options.verify) await options.verify({ result, before, after, route });
      record.passed = true;
      this.report.called_tools.add(name);
      return result.output;
    } catch (error) {
      record.passed = false;
      record.assertion_error = error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      this.report.calls.push(record);
    }
  }
}

async function createAppPage(browser, envUrl, app) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 402, height: 874, deviceScaleFactor: 1 });
  await page.goto(envUrl, { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__MOBILE_GYM_TOOLS__ && window.__SIM__ && window.__OS__);
  await page.evaluate(async (appId) => window.__SIM__.waitForData([appId]), app);
  await new Promise((resolve) => setTimeout(resolve, 250));
  return { context, page };
}

function serializableReport(report) {
  return {
    ...report,
    called_tools: [...report.called_tools].sort(),
  };
}

async function writeReport(report, outputDir) {
  report.finished_at = new Date().toISOString();
  await fs.writeFile(
    path.join(outputDir, 'report.json'),
    `${JSON.stringify(serializableReport(report), null, 2)}\n`,
  );
}

async function runWechat(runner) {
  const initial = await runner.state();
  const chat = initial.chats.find((candidate) => {
    const contact = initial.contacts.find((item) => item.wxid === candidate.id);
    return contact && !contact.isBlacklisted && !contact.aiConfig?.enabled;
  }) ?? initial.chats[0];
  assert(chat, 'WeChat fixture has no chat');
  const contact = initial.contacts.find((item) => item.wxid === chat.id);
  assert(contact, `WeChat fixture has no contact for ${chat.id}`);
  const sourceMessage = chat.messages.find((message) =>
    ['text', 'system'].includes(message.type) && message.content?.trim());
  assert(sourceMessage, 'WeChat fixture has no searchable text message');
  const query = sourceMessage.content.trim().slice(0, Math.min(2, sourceMessage.content.trim().length));

  await runner.call('wechat__list_recent_chats', { limit: 5 });
  const contacts = await runner.call('wechat__search_contacts', { query: contact.name, limit: 5 });
  assert(contacts.contacts.some((item) => item.contact_id === contact.wxid), 'Contact search missed the known contact');
  const messages = await runner.call('wechat__search_messages', { query, contact_id: contact.wxid, limit: 10 });
  const hit = messages.messages.find((item) => item.message_id === sourceMessage.id) ?? messages.messages[0];
  assert(hit, 'Message search returned no hit');
  const context = await runner.call('wechat__get_message_context', {
    contact_id: contact.wxid, message_id: hit.message_id, before: 1, after: 1,
  });
  assert(context.messages.some((item) => item.message_id === hit.message_id), 'Message context omitted the target');
  await runner.call('wechat__open_contact', { contact_id: contact.wxid }, {
    allowedStateKeys: ['_temp'], expectedPath: `/friend-info/${encodeURIComponent(contact.wxid)}`, bodyIncludes: contact.name,
  });
  await runner.call('wechat__open_chat', { contact_id: contact.wxid }, {
    allowedStateKeys: ['_temp'], expectedPath: `/chat/${encodeURIComponent(contact.wxid)}`, bodyIncludes: contact.name,
  });
  await runner.call('wechat__open_chat_search', { contact_id: contact.wxid }, {
    allowedStateKeys: ['_temp'], expectedPath: `/chat/${encodeURIComponent(contact.wxid)}/chat-search`,
  });
  await runner.call('wechat__open_moments', {}, { allowedStateKeys: ['_temp'], expectedPath: '/moments' });

  const sentText = `tool smoke message ${Date.now()}`;
  await runner.call('wechat__send_text_message', { contact_id: contact.wxid, text: sentText }, {
    allowedStateKeys: ['chats'], requireStateKey: 'chats',
    verify: ({ after }) => {
      const updated = after.chats.find((candidate) => candidate.id === contact.wxid);
      assert(updated.messages.some((message) => message.content === sentText), 'Sent text is absent from chat state');
    },
  });
  const sentSearch = await runner.call('wechat__search_messages', { query: sentText, contact_id: contact.wxid });
  assert(sentSearch.total === 1, 'The sent message is not searchable exactly once');

  const momentText = `tool smoke moment ${Date.now()}`;
  await runner.call('wechat__prepare_moment_draft', { text: momentText, location: 'Smoke Lab' }, {
    allowedStateKeys: ['textMomentDraft', '_temp'], requireStateKey: 'textMomentDraft',
    expectedPath: '/post-text-moment', valueIncludes: momentText,
    verify: ({ before, after }) => {
      assert(sameValue(before.moments, after.moments), 'Moment draft unexpectedly published a Moment');
      assert(after.textMomentDraft.content === momentText, 'Moment draft text was not stored');
    },
  });
}

async function runTbsg(runner) {
  const initial = await runner.state();
  const cartItemIds = new Set(initial.cart.map((line) => line.itemId));
  const item = initial.items.find((candidate) => !candidate.skuGroups && !cartItemIds.has(candidate.id));
  assert(item, 'Taobao Instant fixture has no unused non-SKU item');
  const shop = initial.shops.find((candidate) => candidate.id === item.shopId);
  assert(shop, `Taobao Instant fixture has no shop for ${item.id}`);

  const shops = await runner.call('tbsg__search_shops', { query: shop.name.slice(0, 2), limit: 10 });
  assert(shops.shops.some((candidate) => candidate.shop_id === shop.id), 'Shop search missed the selected shop');
  const items = await runner.call('tbsg__search_items', { query: item.name.slice(0, 2), shop_id: shop.id, limit: 10 });
  assert(items.items.some((candidate) => candidate.item_id === item.id), 'Item search missed the selected item');
  const menu = await runner.call('tbsg__get_shop_menu', { shop_id: shop.id, limit: 20 });
  assert(menu.items.some((candidate) => candidate.item_id === item.id), 'Shop menu omitted the selected item');
  const shopPath = shop.type === 'retail' ? `/retail/${shop.id}` : `/shop/${shop.id}`;
  await runner.call('tbsg__open_shop', { shop_id: shop.id }, {
    allowedStateKeys: ['route', 'recentShops'], expectedPath: shopPath, bodyIncludes: shop.name,
  });
  await runner.call('tbsg__get_cart', {});
  await runner.call('tbsg__add_item_to_cart', { item_id: item.id, quantity: 2 }, {
    allowedStateKeys: ['cart'], requireStateKey: 'cart',
    verify: ({ after }) => {
      const line = after.cart.find((candidate) => candidate.itemId === item.id && candidate.skuDesc === null);
      assert(line?.qty === 2, 'Cart quantity is not 2 after add_item_to_cart');
      assert(line?.price === item.price, 'Cart unit price differs from catalog price');
    },
  });
  const cart = await runner.call('tbsg__get_cart', {});
  assert(cart.shops.some((group) => group.lines.some((line) => line.item_id === item.id)), 'Cart query omitted the added item');
  await runner.call('tbsg__open_cart', {}, { allowedStateKeys: ['route'], expectedPath: '/cart', bodyIncludes: item.name });
  const orders = await runner.call('tbsg__list_orders', { status: 'all', limit: 20 });
  assert(orders.orders.length > 0, 'Taobao Instant fixture has no order for open_order');
  const order = orders.orders[0];
  await runner.call('tbsg__open_order', { order_id: order.order_id }, {
    allowedStateKeys: ['route', 'orders', 'messages'], expectedPath: `/order/${encodeURIComponent(order.order_id)}`,
  });
  await runner.call('tbsg__prepare_checkout', { shop_id: shop.id, mode: 'delivery' }, {
    allowedStateKeys: ['checkoutDraft', 'route'], requireStateKey: 'checkoutDraft', expectedPath: '/checkout',
    verify: ({ before, after }) => {
      assert(sameValue(before.orders, after.orders), 'prepare_checkout unexpectedly created or changed an order');
      assert(after.checkoutDraft?.shopGroups?.some((group) => group.shopId === shop.id), 'Checkout draft omitted the selected shop');
    },
  });
}

async function runDaysmatter(runner) {
  const initial = await runner.state();
  const event = initial.events.find((candidate) => !candidate.archived && !candidate.parentId);
  assert(event, 'Days Matter fixture has no active top-level event');
  const notebook = initial.notebooks.find((candidate) => candidate.id === event.notebookId) ?? initial.notebooks[0];
  assert(notebook, 'Days Matter fixture has no notebook');

  const search = await runner.call('daysmatter__search_events', { query: event.title, notebook_id: notebook.id });
  assert(search.events.some((candidate) => candidate.event_id === event.id), 'Days Matter search missed the selected event');
  await runner.call('daysmatter__list_upcoming_events', { days_ahead: 3650, limit: 20 });
  const countdown = await runner.call('daysmatter__get_event_countdown', { event_id: event.id });
  assert(countdown.title === event.title, 'Countdown returned the wrong event');
  const notebooks = await runner.call('daysmatter__list_notebooks', {});
  assert(notebooks.notebooks.some((candidate) => candidate.notebook_id === notebook.id), 'Notebook list missed the selected notebook');
  await runner.call('daysmatter__open_event', { event_id: event.id }, {
    allowedStateKeys: ['_temp'], expectedPath: `/event/${encodeURIComponent(event.id)}`, bodyIncludes: event.title,
  });
  await runner.call('daysmatter__open_notebook', { notebook_id: notebook.id }, {
    allowedStateKeys: ['filter', '_temp'], requireStateKey: 'filter', expectedPath: '/', bodyIncludes: notebook.name,
  });
  const difference = await runner.call('daysmatter__calculate_date_difference', {
    start_date: '2026-07-12', end_date: '2026-07-20', include_start: true,
  });
  assert(difference.days === 9, `Date difference expected 9, got ${difference.days}`);

  const draftTitle = `Tool smoke day ${Date.now()}`;
  await runner.call('daysmatter__prepare_event_draft', {
    title: draftTitle, target_date: '2026-07-30', notebook_id: notebook.id,
  }, {
    allowedStateKeys: ['_temp'], requireStateKey: '_temp', expectedPath: '/event/add', valueIncludes: draftTitle,
    verify: ({ before, after }) => assert(sameValue(before.events, after.events), 'Days Matter draft unexpectedly created an event'),
  });
  await runner.call('daysmatter__archive_event', { event_id: event.id }, {
    allowedStateKeys: ['events'], requireStateKey: 'events',
    verify: ({ before, after }) => {
      const beforeEvent = before.events.find((candidate) => candidate.id === event.id);
      const afterEvent = after.events.find((candidate) => candidate.id === event.id);
      assert(beforeEvent.archived === false && afterEvent.archived === true, 'archive_event did not archive the event');
      assert(afterEvent.showOnHome === false, 'Archived event remains visible on home');
    },
  });
}

async function runClock(runner) {
  const initial = await runner.state();
  const cityCatalog = await runner.call('clock__search_world_cities', { query: 'GMT', limit: 20 });
  const city = cityCatalog.cities.find((candidate) => !initial.selectedCityIds.includes(candidate.city_id));
  assert(city, 'Clock fixture has no unselected world city');
  await runner.call('clock__list_alarms', {});
  await runner.call('clock__get_next_alarm', {});
  const times = await runner.call('clock__get_world_times', { city_ids: [city.city_id] });
  assert(times.cities[0]?.city_id === city.city_id, 'World time returned the wrong city');

  const label = `Tool smoke alarm ${Date.now()}`;
  const created = await runner.call('clock__create_alarm', { hour: 9, minute: 17, label, repeat: 'once' }, {
    allowedStateKeys: ['alarms'], requireStateKey: 'alarms',
    verify: ({ after, result }) => assert(after.alarms.some((alarm) => alarm.id === result.output.alarm_id && alarm.note === label), 'Created alarm is absent from state'),
  });
  await runner.call('clock__set_alarm_enabled', { alarm_id: created.alarm_id, enabled: false }, {
    allowedStateKeys: ['alarms'], requireStateKey: 'alarms',
    verify: ({ after }) => assert(after.alarms.find((alarm) => alarm.id === created.alarm_id)?.enabled === false, 'Alarm was not disabled'),
  });
  await runner.call('clock__open_alarms', {}, { allowedStateKeys: [], expectedPath: '/alarm', bodyIncludes: label });
  await runner.call('clock__add_world_city', { city_id: city.city_id }, {
    allowedStateKeys: ['selectedCityIds', 'selectedCities'], requireStateKey: 'selectedCityIds',
    verify: ({ after }) => assert(after.selectedCityIds.includes(city.city_id), 'World city was not added'),
  });
  await runner.call('clock__open_timer', {}, { allowedStateKeys: [], expectedPath: '/timer' });
}

async function runNotes(runner) {
  const initial = await runner.state();
  const note = initial.notes.find((candidate) => !candidate.trashedAt && !candidate.isPrivate);
  assert(note, 'Notes fixture has no visible note');
  const folder = initial.folders.find((candidate) => candidate.id === note.folderId)
    ?? initial.folders.find((candidate) => candidate.id === 'unfiled');
  assert(folder, 'Notes fixture has no usable folder');

  const search = await runner.call('notes__search_notes', { query: note.title || note.content.slice(0, 2), limit: 10 });
  assert(search.notes.some((candidate) => candidate.note_id === note.id), 'Note search missed the selected note');
  await runner.call('notes__list_recent_notes', { limit: 10 });
  const folders = await runner.call('notes__list_folders', {});
  assert(folders.folders.some((candidate) => candidate.folder_id === folder.id), 'Folder list missed the selected folder');
  await runner.call('notes__search_todos', { query: '', limit: 20 });
  await runner.call('notes__open_note', { note_id: note.id }, {
    allowedStateKeys: [], expectedPath: `/note/${encodeURIComponent(note.id)}`, valueIncludes: note.title,
  });
  await runner.call('notes__open_folder', { folder_id: folder.id }, {
    allowedStateKeys: ['selectedFolderId'], requireStateKey: 'selectedFolderId', expectedPath: '/',
  });

  const noteTitle = `Tool smoke note ${Date.now()}`;
  const createdNote = await runner.call('notes__create_note', { title: noteTitle, content: 'Created by browser smoke', folder_id: folder.id }, {
    allowedStateKeys: ['notes'], requireStateKey: 'notes',
    verify: ({ after, result }) => assert(after.notes.some((candidate) => candidate.id === result.output.note_id && candidate.title === noteTitle), 'Created note is absent from state'),
  });
  const createdSearch = await runner.call('notes__search_notes', { query: noteTitle });
  assert(createdSearch.notes.some((candidate) => candidate.note_id === createdNote.note_id), 'Created note is not searchable');

  const todoText = `Tool smoke todo ${Date.now()}`;
  const createdTodo = await runner.call('notes__create_todo', { text: todoText }, {
    allowedStateKeys: ['todos'], requireStateKey: 'todos',
    verify: ({ after, result }) => assert(after.todos.some((todo) => todo.id === result.output.todo_id && todo.text === todoText), 'Created to-do is absent from state'),
  });
  const todoSearch = await runner.call('notes__search_todos', { query: todoText });
  assert(todoSearch.todos.some((candidate) => candidate.todo_id === createdTodo.todo_id), 'Created to-do is not searchable');
  await runner.call('notes__set_todo_completed', { todo_id: createdTodo.todo_id, completed: true }, {
    allowedStateKeys: ['todos'], requireStateKey: 'todos',
    verify: ({ after }) => assert(after.todos.find((todo) => todo.id === createdTodo.todo_id)?.completed === true, 'To-do was not completed'),
  });
  await runner.call('notes__open_todos', {}, { allowedStateKeys: [], expectedPath: '/todo', bodyIncludes: todoText });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const envUrl = String(args['env-url'] ?? 'http://127.0.0.1:4181');
  const selectedApps = String(args.apps ?? TARGET_APPS.join(','))
    .split(',')
    .map((app) => app.trim())
    .filter(Boolean);
  selectedApps.forEach((app) => assert(TARGET_APPS.includes(app), `Unknown --apps value: ${app}`));
  const chromePath = String(args['chrome-path'] ?? process.env.CHROME_PATH
    ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  const stamp = new Date().toISOString().replaceAll(':', '').replaceAll('.', '-');
  const outputDir = path.resolve(String(args['output-dir'] ?? `runs/app-tools-smoke-${stamp}`));
  const screenshotsDir = path.join(outputDir, 'screenshots');
  await fs.mkdir(screenshotsDir, { recursive: true });

  const report = {
    env_url: envUrl,
    started_at: new Date().toISOString(),
    apps: {},
    calls: [],
    called_tools: new Set(),
    errors: [],
  };
  const browser = await puppeteer.launch({ headless: true, executablePath: chromePath });
  try {
    const runners = {
      wechat: runWechat,
      tbsg: runTbsg,
      daysmatter: runDaysmatter,
      clock: runClock,
      notes: runNotes,
    };
    const registeredNames = new Set();
    for (const app of selectedApps) {
      console.log(`[browser-smoke] starting ${app}`);
      const { context, page } = await createAppPage(browser, envUrl, app);
      try {
        const beforeList = await appState(page, app);
        const definitions = await page.evaluate((appId) =>
          window.__MOBILE_GYM_TOOLS__.listTools({ app: appId }), app);
        const afterList = await appState(page, app);
        assert(sameValue(beforeList, afterList), `listTools({app: ${app}}) changed app state`);
        definitions.forEach((definition) => registeredNames.add(definition.name));
        report.apps[app] = { registered: definitions.length, passed: false };
        const runner = new AppSmokeRunner(app, page, definitions, screenshotsDir, report);
        await runners[app](runner);
        report.apps[app].passed = true;
        console.log(`[browser-smoke] passed ${app}`);
      } catch (error) {
        const message = error instanceof Error ? error.stack ?? error.message : String(error);
        report.errors.push({ app, message });
        console.error(`[browser-smoke] failed ${app}: ${message}`);
      } finally {
        await context.close();
        await writeReport(report, outputDir);
      }
    }

    const missing = [...registeredNames].filter((name) => !report.called_tools.has(name)).sort();
    const unexpected = [...report.called_tools].filter((name) => !registeredNames.has(name)).sort();
    report.summary = {
      registered_tools: registeredNames.size,
      called_tools: report.called_tools.size,
      invocations: report.calls.length,
      passed_invocations: report.calls.filter((call) => call.passed).length,
      failed_invocations: report.calls.filter((call) => !call.passed).length,
      missing_tools: missing,
      unexpected_tools: unexpected,
      screenshots: report.calls.filter((call) => call.screenshot).length,
    };
    const expectedCount = selectedApps.reduce((total, app) => total + TOOL_COUNTS[app], 0);
    assert(registeredNames.size === expectedCount, `Expected ${expectedCount} registered tools, found ${registeredNames.size}`);
    assert(missing.length === 0, `Tools not called: ${missing.join(', ')}`);
    assert(unexpected.length === 0, `Unexpected tools called: ${unexpected.join(', ')}`);
    assert(report.errors.length === 0, `${report.errors.length} app smoke suite(s) failed`);
  } finally {
    try {
      await browser.close();
    } catch (error) {
      report.errors.push({ app: 'browser', message: error instanceof Error ? error.message : String(error) });
    }
    await writeReport(report, outputDir);
    console.log(JSON.stringify({ output_dir: outputDir, summary: report.summary, errors: report.errors }, null, 2));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
