#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';

const URL = process.argv[2] ?? 'http://127.0.0.1:4181';
const OUT = path.resolve(process.argv[3] ?? `runs/specialized-tools-smoke-${Date.now()}`);
const APPS = ['dianping', 'dida', 'googledrive', 'jingdong', 'kapi', 'mail'];

function assert(value, message) { if (!value) throw new Error(message); }
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const report = { url: URL, apps: {}, calls: [], errors: [] };
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  try {
    for (const app of APPS) {
      console.log(`[specialized-smoke] ${app}`);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      try {
        await page.goto(URL, { waitUntil: 'networkidle0' });
        await page.waitForFunction(() => window.__MOBILE_GYM_TOOLS__ && window.__SIM__ && window.__OS__);
        await page.evaluate((id) => window.__SIM__.waitForData([id]), app);
        await page.evaluate((id) => window.__OS__.openApp(id, '/'), app);
        const definitions = await page.evaluate((id) => window.__MOBILE_GYM_TOOLS__.listTools({ app: id }), app);
        const definitionMap = new Map(definitions.map((item) => [item.name, item]));
        // Browser context cannot see this module's clone helper.
        const getState = () => page.evaluate((id) => JSON.parse(JSON.stringify(window.__SIM__.getState().apps[id] ?? {})), app);
        const call = async (name, args = {}) => {
          const definition = definitionMap.get(name);
          assert(definition, `${app}: missing ${name}`);
          const before = await getState();
          const result = await page.evaluate(({ toolName, input }) => window.__MOBILE_GYM_TOOLS__.callTool(toolName, input), { toolName: name, input: args });
          const after = await getState();
          assert(result?.ok, `${name}: ${JSON.stringify(result?.error)}`);
          if (definition.annotations.readOnlyHint && definition.annotations.uiEffect === 'none') {
            assert(same(before, after), `${name}: read-only call changed state`);
          }
          let route = null;
          if (definition.annotations.uiEffect !== 'none') {
            route = await page.evaluate((id) => window.__OS__.getAppRoute(id)?.path ?? null, app);
            const image = await page.screenshot({ path: path.join(OUT, `${name}.png`) });
            assert(image.byteLength > 5000 && route, `${name}: GUI handoff did not render`);
          }
          report.calls.push({ app, name, passed: true, route });
          return { output: result.output, before, after, route };
        };

        const initial = await getState();
        if (app === 'dianping') {
          const shop = initial.shops.find((item) => item.deals.length && item.dishes.length && item.reviews.length);
          assert(shop, 'Dianping has no complete shop fixture');
          await call('dianping__search_shops', { query: shop.name, limit: 5 });
          await call('dianping__get_shop_summary', { shop_id: shop.id });
          await call('dianping__list_shop_deals', { shop_id: shop.id, limit: 20 });
          await call('dianping__list_recommended_dishes', { shop_id: shop.id, limit: 20 });
          await call('dianping__search_reviews', { shop_id: shop.id, min_score: 1, max_score: 5 });
          await call('dianping__open_shop', { shop_id: shop.id });
          await call('dianping__open_review', { shop_id: shop.id, review_id: shop.reviews[0].id });
          await call('dianping__open_voucher', { shop_id: shop.id, deal_id: shop.deals[0].id });
          const favorite = await call('dianping__add_favorite_shop', { shop_id: shop.id });
          assert(favorite.after.favoriteShopIds.includes(shop.id), 'Dianping favorite did not persist');
          const checkout = await call('dianping__prepare_voucher_checkout', { shop_id: shop.id, deal_id: shop.deals[0].id, quantity: 2 });
          assert(checkout.after.pendingCheckout?.shopId === shop.id && checkout.after.pendingCheckout?.qty === 2, 'Dianping checkout draft mismatch');
        } else if (app === 'dida') {
          const task = initial.tasks.find((item) => !item.completed);
          assert(task, 'Dida has no incomplete task');
          await call('dida__search_tasks', { query: task.title, include_completed: true });
          await call('dida__list_today_tasks', {});
          await call('dida__list_tasks_in_list', { list_id: task.listId });
          await call('dida__list_tasks_in_quadrant', { quadrant: task.quadrant ?? 4 });
          await call('dida__open_task', { task_id: task.id });
          await call('dida__open_today', {});
          const created = await call('dida__create_task', { title: '工具专项联调', list_id: 'inbox', priority: 'high', quadrant: 1, due_date: '2026-07-12' });
          assert(created.output.task_id && created.after.tasks.some((item) => item.id === created.output.task_id), 'Dida create did not persist');
          const completed = await call('dida__complete_task', { task_id: created.output.task_id });
          assert(completed.after.tasks.find((item) => item.id === created.output.task_id)?.completed, 'Dida complete did not persist');
        } else if (app === 'googledrive') {
          const values = Object.values(initial.items);
          const file = values.find((item) => item.kind !== 'folder');
          const folder = values.find((item) => item.kind === 'folder');
          assert(file && folder, 'Google Drive fixture incomplete');
          await call('googledrive__search', { query: file.name });
          await call('googledrive__list_folder', {});
          await call('googledrive__list_starred', {});
          await call('googledrive__get_item', { item_id: file.id });
          await call('googledrive__open_item', { item_id: file.id });
          const star = await call('googledrive__toggle_star', { item_id: file.id });
          assert(star.after.starredIds.includes(file.id) !== initial.starredIds.includes(file.id), 'Google Drive star did not toggle');
          const created = await call('googledrive__create_folder', { name: '工具联调文件夹' });
          assert(created.output.item_id, 'Google Drive folder id missing');
          const moved = await call('googledrive__move_item', { item_id: file.id, dest_folder_id: created.output.item_id });
          assert(moved.after.items[file.id].parentId === created.output.item_id, 'Google Drive move did not persist');
        } else if (app === 'jingdong') {
          const [item, second] = initial.items;
          const order = initial.orders[0];
          assert(item && second && order, 'Jingdong fixture incomplete');
          await call('jingdong__search_items', { query: item.title, limit: 5 });
          await call('jingdong__get_item_summary', { item_id: item.id });
          await call('jingdong__compare_items', { item_ids: [item.id, second.id] });
          await call('jingdong__get_cart', {});
          await call('jingdong__list_orders', { status: 'all' });
          await call('jingdong__get_order_summary', { order_id: order.id });
          await call('jingdong__list_coupons', { channel: 'all' });
          await call('jingdong__search_life_shops', { query: initial.lifeShops[0].name });
          await call('jingdong__open_item', { item_id: item.id });
          await call('jingdong__open_cart', {});
          const sku = item.specs.flatMap((spec) => spec.options).slice(0, 1).join('');
          const added = await call('jingdong__add_to_cart', { item_id: item.id, sku_description: sku, quantity: 1 });
          const line = added.after.cart.find((entry) => entry.itemId === item.id);
          assert(line, 'Jingdong add-to-cart did not persist');
          await call('jingdong__prepare_checkout', { cart_line_ids: [line.key] });
        } else if (app === 'kapi') {
          const bill = initial.bills[0];
          const category = initial.categories.expense[0];
          assert(bill && category, 'Kapi fixture incomplete');
          await call('kapi__search_bills', { query: bill.note || bill.categoryName, limit: 20 });
          await call('kapi__get_category_summary', { date_from: '2020-01-01', date_to: '2035-01-01' });
          await call('kapi__get_budget_status', {});
          await call('kapi__list_accounts', {});
          await call('kapi__open_bill', { bill_id: bill.id });
          await call('kapi__open_category', { category_name: category.name });
          await call('kapi__open_stats', {});
          const draft = await call('kapi__prepare_bill_draft', { type: 'expense', category_name: category.name, amount: 18.8, note: '工具联调', date: '2026-07-12' });
          assert(draft.after._draft?.categoryId === category.id, 'Kapi draft did not reach GUI store');
        } else if (app === 'mail') {
          const mail = initial.mails[0];
          assert(mail, 'Mail fixture empty');
          await call('mail__search_messages', { query: mail.subject });
          await call('mail__list_mailbox', { mailbox_id: 'all-inboxes' });
          await call('mail__get_message', { mail_id: mail.id });
          await call('mail__open_message', { mail_id: mail.id });
          await call('mail__open_mailbox', { mailbox_id: 'all-inboxes' });
          const read = await call('mail__set_read', { mail_id: mail.id, is_read: !mail.isRead });
          assert(read.after.mails.find((item) => item.id === mail.id).isRead === !mail.isRead, 'Mail read state did not persist');
          const flagged = await call('mail__toggle_flag', { mail_id: mail.id });
          assert(flagged.after.mails.find((item) => item.id === mail.id).isFlagged !== mail.isFlagged, 'Mail flag did not persist');
          const draft = await call('mail__prepare_draft', { to_address: 'review@example.com', to_name: '验收人', subject: '工具联调草稿', body: '这是一封未发送的联调草稿。' });
          assert(draft.output.draft_id && draft.after.mails.some((item) => item.id === draft.output.draft_id), 'Mail draft did not persist');
        }
        report.apps[app] = { passed: true, registered: definitions.length };
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
    passed_apps: Object.values(report.apps).filter((row) => row.passed).length,
    calls: report.calls.length,
    failed: report.errors.length,
  };
  await fs.writeFile(path.join(OUT, 'report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ out: OUT, summary: report.summary, errors: report.errors }, null, 2));
  assert(report.errors.length === 0, `${report.errors.length} specialized app smoke suites failed`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
