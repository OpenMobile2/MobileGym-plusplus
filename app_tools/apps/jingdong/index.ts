import { useJingdongStore } from '@/apps/Jingdong/state';
import type { CartLine, Item, LifeShop } from '@/apps/Jingdong/types';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys, optionalEnum, requireInteger, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { JINGDONG_TOOL_DEFINITIONS } from './definitions';

const state = () => useJingdongStore.getState();
const round2 = (value: number) => Math.round(value * 100) / 100;

const item = (id: string): Item =>
  requireFound(state().items.find((entry) => entry.id === id), 'ITEM_NOT_FOUND', `Jingdong item not found: ${id}`);
const lifeShop = (id: string): LifeShop =>
  requireFound(state().lifeShops.find((entry) => entry.id === id), 'SHOP_NOT_FOUND', `Jingdong life-service shop not found: ${id}`);
const order = (id: string) =>
  requireFound(state().orders.find((entry) => entry.id === id), 'ORDER_NOT_FOUND', `Jingdong order not found: ${id}`);

const itemSummary = (entry: Item) => ({
  item_id: entry.id,
  title: entry.title,
  shop_id: entry.shopId,
  shop_name: state().shops.find((candidate) => candidate.id === entry.shopId)?.name,
  price: entry.price,
  original_price: entry.originPrice,
  guobu: entry.guobu,
  guobu_off: entry.guobuOff,
  self: entry.self,
  jd_logistics: entry.jdLogistics,
  baitiao_periods: entry.baitiaoPeriods,
  sold: entry.sold,
  good_rate: entry.goodRate,
  category: entry.category,
  tags: entry.tags,
  review_count: entry.reviewCount,
  sku_specs: entry.specs,
});

const lifeShopSummary = (entry: LifeShop) => ({
  shop_id: entry.id,
  name: entry.name,
  kind: entry.kind,
  rating: entry.rating,
  sold: entry.sold,
  eta: entry.eta,
  distance: entry.distance,
  categories: entry.cats,
});

function requireSkuDescription(input: JsonObject, target: Item): string {
  const raw = input.sku_description;
  if (typeof raw !== 'string') throw new ToolExecutionError('INVALID_ARGUMENT', '"sku_description" must be a string.');
  const sku = raw.trim();
  const options = target.specs.flatMap((spec) => spec.options);
  if (target.specs.length === 0) {
    if (sku) throw new ToolExecutionError('INVALID_SKU', `${target.title} has no SKU options; sku_description must be empty.`);
    return '';
  }
  if (!options.some((option) => sku.includes(option))) {
    throw new ToolExecutionError('INVALID_SKU', `sku_description must include valid options: ${options.join(', ')}`);
  }
  return sku;
}

function cartLineById(id: string): CartLine {
  return requireFound(state().cart.find((line) => line.key === id), 'CART_LINE_NOT_FOUND', `Cart line not found: ${id}`);
}

const handlers: Record<string, ToolHandler> = {
  jingdong__search_items: (input) => {
    assertAllowedKeys(input, ['query', 'limit', 'filters']);
    const query = getQuery(input);
    const limit = getLimit(input, 50);
    const rawFilters = input.filters;
    const filters = Array.isArray(rawFilters)
      ? rawFilters.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim())
      : [];
    const current = state();
    let rows = current.items.filter((entry) => includesQuery([
      entry.title, entry.category, entry.tags.join(' '),
      current.shops.find((candidate) => candidate.id === entry.shopId)?.name,
    ], query));
    if (filters.includes('国家补贴')) rows = rows.filter((entry) => entry.guobu);
    if (filters.includes('京东物流')) rows = rows.filter((entry) => entry.jdLogistics);
    if (filters.includes('自营')) rows = rows.filter((entry) => entry.self);
    if (filters.includes('包邮')) rows = rows.filter((entry) => entry.jdLogistics || entry.self);
    if (filters.includes('先用后付')) rows = rows.filter((entry) => entry.price < 200 || entry.category === '食品酒饮');
    current.recordTaskAudit({
      searchResult: {
        query,
        sort: 'comprehensive',
        filters,
        addressId: current.selectedAddressId,
      },
    });
    return compactResult(rows.map(itemSummary), limit);
  },

  jingdong__get_item_summary: (input) => {
    assertAllowedKeys(input, ['item_id']);
    return itemSummary(item(getQuery(input, 'item_id')));
  },

  jingdong__compare_items: (input) => {
    assertAllowedKeys(input, ['item_ids']);
    const ids = Array.isArray(input.item_ids) ? input.item_ids.map(String) : [];
    if (ids.length < 2 || ids.length > 10) throw new ToolExecutionError('INVALID_ARGUMENT', 'item_ids must contain 2-10 IDs.');
    return { items: ids.map((id) => itemSummary(item(id))).sort((left, right) => left.price - right.price) };
  },

  jingdong__get_cart: (input) => {
    assertAllowedKeys(input, []);
    const cart = state().cart;
    const groups: { shopId: string; shopName: string; self: boolean; channel: CartLine['channel']; lines: CartLine[] }[] = [];
    for (const line of cart) {
      let group = groups.find((entry) => entry.shopId === line.shopId);
      if (!group) {
        group = { shopId: line.shopId, shopName: line.shopName, self: line.self, channel: line.channel, lines: [] };
        groups.push(group);
      }
      group.lines.push(line);
    }
    const shops = groups.map((group) => ({
      shop_id: group.shopId,
      shop_name: group.shopName,
      self: group.self,
      channel: group.channel,
      lines: group.lines.map((line) => ({
        cart_line_id: line.key, item_id: line.itemId, title: line.title,
        sku_description: line.skuDesc || null, quantity: line.qty, unit_price: line.price,
        subtotal: round2(line.price * line.qty), checked: line.checked,
      })),
      subtotal: round2(group.lines.reduce((sum, line) => sum + line.price * line.qty, 0)),
    }));
    return {
      shops,
      line_count: cart.length,
      total: round2(cart.reduce((sum, line) => sum + line.price * line.qty, 0)),
      checked_total: round2(cart.filter((line) => line.checked).reduce((sum, line) => sum + line.price * line.qty, 0)),
    };
  },

  jingdong__list_orders: (input) => {
    assertAllowedKeys(input, ['status', 'limit']);
    const status = optionalEnum(
      input, 'status',
      ['all', 'unpaid', 'undelivered', 'unused', 'done', 'refunding', 'refunded', 'cancelled'] as const,
      'all',
    );
    const limit = getLimit(input);
    const rows = state().orders.filter((entry) => status === 'all' || entry.status === status).map((entry) => ({
      order_id: entry.id, order_number: entry.orderNo, channel: entry.channel,
      shop_name: entry.shopName, status: entry.status, paid_amount: entry.paidAmount,
      item_count: entry.lines.reduce((sum, line) => sum + line.qty, 0),
      created_at: TimeService.fromTimestamp(entry.createdAt).toISOString(),
    }));
    return { status, ...compactResult(rows, limit) };
  },

  jingdong__get_order_summary: (input) => {
    assertAllowedKeys(input, ['order_id']);
    const entry = order(getQuery(input, 'order_id'));
    state().markOrderLogisticsViewed(entry.id);
    return {
      order_id: entry.id, order_number: entry.orderNo, channel: entry.channel,
      shop_name: entry.shopName, status: entry.status,
      item_total: entry.itemTotal, paid_amount: entry.paidAmount, pay_method: entry.payMethod,
      lines: entry.lines.map((line) => ({
        item_id: line.itemId, title: line.title, sku_description: line.skuDesc, quantity: line.qty, price: line.price,
      })),
      shipping_company: entry.logistics.company,
      tracking_number: entry.logistics.trackingNo,
      latest_logistics: entry.logistics.nodes.at(-1) ?? null,
      created_at: TimeService.fromTimestamp(entry.createdAt).toISOString(),
    };
  },

  jingdong__list_coupons: (input) => {
    assertAllowedKeys(input, ['channel', 'source']);
    const channel = optionalEnum(input, 'channel', ['all', 'shopping', 'miaosong'] as const, 'all');
    const source = optionalEnum(input, 'source', ['mine', 'center'] as const, 'mine');
    const pool = source === 'center' ? state().couponCenter : state().coupons;
    const rows = pool
      .filter((coupon) => channel === 'all' || coupon.channel === channel)
      .map((coupon) => ({
        coupon_id: coupon.id, amount: coupon.amount, threshold: coupon.threshold,
        scope: coupon.scope, expire: coupon.expire, channel: coupon.channel,
        claimed: coupon.claimed,
      }));
    return { channel, source, coupons: rows };
  },

  jingdong__claim_coupon: (input) => {
    assertAllowedKeys(input, ['coupon_id']);
    const couponId = getQuery(input, 'coupon_id');
    const target = requireFound(
      state().couponCenter.find((coupon) => coupon.id === couponId),
      'COUPON_NOT_FOUND',
      `Jingdong coupon-center coupon not found: ${couponId}`,
    );
    state().claimCoupon(couponId);
    const claimed = state().coupons.find((coupon) => coupon.id === couponId);
    return { coupon_id: couponId, claimed: Boolean(claimed?.claimed || target.claimed), amount: target.amount, threshold: target.threshold };
  },

  jingdong__search_life_shops: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const limit = getLimit(input, 50);
    const rows = state().lifeShops.filter((entry) => includesQuery([entry.name, entry.kind, entry.cats.join(' ')], query));
    return compactResult(rows.map(lifeShopSummary), limit);
  },

  jingdong__open_item: async (input) => {
    assertAllowedKeys(input, ['item_id']);
    const target = item(getQuery(input, 'item_id'));
    const route = `/item/${encodeURIComponent(target.id)}`;
    state().addFootprint(target.id);
    await openAppRoute('jingdong', route);
    return { route, item_id: target.id };
  },

  jingdong__open_cart: async (input) => {
    assertAllowedKeys(input, []);
    const route = '/cart';
    await openAppRoute('jingdong', route);
    return { route };
  },

  jingdong__add_to_cart: (input) => {
    assertAllowedKeys(input, ['item_id', 'sku_description', 'quantity']);
    const target = item(getQuery(input, 'item_id'));
    const sku = requireSkuDescription(input, target);
    const quantity = requireInteger(input, 'quantity', { min: 1, max: 99 });
    state().addToCart(target.id, quantity, sku, 'shopping');
    return { item_id: target.id, sku_description: sku, quantity, added: true };
  },

  jingdong__prepare_checkout: async (input) => {
    assertAllowedKeys(input, ['cart_line_ids']);
    const ids = Array.isArray(input.cart_line_ids) ? input.cart_line_ids.map(String) : [];
    if (ids.length < 1 || ids.length > 30) throw new ToolExecutionError('INVALID_ARGUMENT', 'cart_line_ids must contain 1-30 IDs.');
    const targetLines = ids.map((id) => cartLineById(id));
    const current = state();
    current.toggleSelectAll(false);
    for (const line of targetLines) current.toggleCartCheck(line.key);
    const route = '/order-confirm';
    await openAppRoute('jingdong', route);
    const checked = state().cart.filter((line) => line.checked);
    return {
      route, persisted: false, line_count: checked.length,
      item_total: round2(checked.reduce((sum, line) => sum + line.price * line.qty, 0)),
    };
  },
};

export function executeJingdongTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Jingdong tool: ${name}`)(input);
}
export { JINGDONG_TOOL_DEFINITIONS } from './definitions';
