import { useTaobaoStore } from '@/apps/Taobao/state';
import type { TbItem, TbOrderLine } from '@/apps/Taobao/types';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys, optionalBoolean, optionalEnum, requireInteger } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { TAOBAO_TOOL_DEFINITIONS } from './definitions';

const state = () => useTaobaoStore.getState();
const item = (id: string) => requireFound(state().items.find((entry) => entry.id === id), 'ITEM_NOT_FOUND', `Taobao item not found: ${id}`);
const shop = (id: string) => requireFound(state().shops.find((entry) => entry.id === id), 'SHOP_NOT_FOUND', `Taobao shop not found: ${id}`);
const order = (id: string) => requireFound(state().orders.find((entry) => entry.id === id), 'ORDER_NOT_FOUND', `Taobao order not found: ${id}`);
const itemSummary = (entry: TbItem) => ({
  item_id: entry.id, title: entry.title, shop_id: entry.shopId,
  shop_name: state().shops.find((candidate) => candidate.id === entry.shopId)?.name,
  price: entry.price, original_price: entry.originPrice, sold: entry.sold,
  category: entry.category, free_shipping: entry.freeShipping,
  review_count: entry.reviewCount, tags: entry.tags, sku_specs: entry.specs,
});

const handlers: Record<string, ToolHandler> = {
  taobao__search_items: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input); const limit = getLimit(input, 50); const current = state();
    const rows = current.items.filter((entry) => includesQuery([
      entry.title, entry.category, entry.tags.join(' '),
      current.shops.find((candidate) => candidate.id === entry.shopId)?.name,
    ], query));
    return compactResult(rows.map(itemSummary), limit);
  },
  taobao__search_shops: (input) => {
    assertAllowedKeys(input, ['query', 'limit']); const query = getQuery(input); const limit = getLimit(input, 50);
    return compactResult(state().shops.filter((entry) => includesQuery([entry.name, entry.certifiedText], query)).map((entry) => ({
      shop_id: entry.id, name: entry.name, rating: entry.rating, fans: entry.fans,
      positive_rate: entry.positiveRate, certification: entry.certifiedText,
    })), limit);
  },
  taobao__get_item_summary: (input) => { assertAllowedKeys(input, ['item_id']); return itemSummary(item(getQuery(input, 'item_id'))); },
  taobao__compare_items: (input) => {
    assertAllowedKeys(input, ['item_ids']); const ids = Array.isArray(input.item_ids) ? input.item_ids.map(String) : [];
    if (ids.length < 2 || ids.length > 10) requireFound(undefined, 'INVALID_ARGUMENT', 'item_ids must contain 2-10 IDs.');
    return { items: ids.map((id) => itemSummary(item(id))).sort((left, right) => left.price - right.price) };
  },
  taobao__get_cart: () => {
    const lines = state().cart.map((cartLine) => {
      const product = item(cartLine.itemId);
      return { cart_line_id: cartLine.id, item_id: product.id, title: product.title, shop_id: product.shopId, sku_description: cartLine.skuDesc, quantity: cartLine.qty, unit_price: cartLine.price, subtotal: cartLine.price * cartLine.qty, selected: cartLine.selected, invalid: cartLine.invalid };
    });
    return { lines, total: lines.reduce((sum, line) => sum + line.subtotal, 0), selected_total: lines.filter((line) => line.selected && !line.invalid).reduce((sum, line) => sum + line.subtotal, 0) };
  },
  taobao__list_orders: (input) => {
    assertAllowedKeys(input, ['status', 'limit']);
    const status = optionalEnum(input, 'status', ['all', 'pendingPayment', 'pendingShip', 'shipped', 'completed', 'refunded'] as const, 'all'); const limit = getLimit(input);
    const rows = state().orders.filter((entry) => status === 'all' || entry.status === status).map((entry) => ({
      order_id: entry.id, order_number: entry.orderNo, shop_name: entry.shopName,
      status: entry.status, paid_amount: entry.paidAmount,
      item_count: entry.lines.reduce((sum, line) => sum + line.qty, 0),
      created_at: TimeService.fromTimestamp(entry.createdAt).toISOString(),
    }));
    return { status, ...compactResult(rows, limit) };
  },
  taobao__get_order_summary: (input) => {
    assertAllowedKeys(input, ['order_id']); const entry = order(getQuery(input, 'order_id'));
    return { order_id: entry.id, order_number: entry.orderNo, shop_name: entry.shopName, status: entry.status, paid_amount: entry.paidAmount, lines: entry.lines.map((line) => ({ item_id: line.itemId, title: line.title, sku_description: line.skuDesc, quantity: line.qty, price: line.price })), shipping_company: entry.logistics.company, tracking_number: entry.logistics.trackingNo, latest_logistics: entry.logistics.nodes.at(-1) };
  },
  taobao__list_coupons: (input) => {
    assertAllowedKeys(input, ['include_used']); const includeUsed = optionalBoolean(input, 'include_used', false);
    return { coupons: state().coupons.filter((coupon) => includeUsed || !coupon.used).map((coupon) => ({ coupon_id: coupon.id, title: coupon.title, amount: coupon.amount, threshold: coupon.thresholdText, scope: coupon.scope, validity: coupon.validText, used: coupon.used })) };
  },
  taobao__open_search_results: async (input) => {
    assertAllowedKeys(input, ['query']); const query = getQuery(input); state().submitSearch(query);
    const route = `/search/result?q=${encodeURIComponent(query)}`; await openAppRoute('taobao', route); return { route, query };
  },
  taobao__open_item: async (input) => {
    assertAllowedKeys(input, ['item_id']); const id = item(getQuery(input, 'item_id')).id; const route = `/item/${encodeURIComponent(id)}`;
    state().recordFootprint(id); await openAppRoute('taobao', route); return { route, item_id: id };
  },
  taobao__open_shop: async (input) => { assertAllowedKeys(input, ['shop_id']); const id = shop(getQuery(input, 'shop_id')).id; const route = `/shop/${encodeURIComponent(id)}`; await openAppRoute('taobao', route); return { route, shop_id: id }; },
  taobao__open_cart: async () => { await openAppRoute('taobao', '/cart'); return { route: '/cart' }; },
  taobao__add_to_cart: (input) => {
    assertAllowedKeys(input, ['item_id', 'sku_description', 'quantity']);
    const product = item(getQuery(input, 'item_id')); const sku = getQuery(input, 'sku_description'); const quantity = requireInteger(input, 'quantity', { min: 1, max: 99 });
    const options = product.specs.flatMap((spec) => spec.options);
    if (product.specs.length && !options.some((option) => sku.includes(option))) requireFound(undefined, 'INVALID_SKU', `sku_description must include valid options: ${options.join(', ')}`);
    state().addToCart(product.id, sku, quantity); return { item_id: product.id, sku_description: sku, quantity, added: true };
  },
  taobao__prepare_checkout: async (input) => {
    assertAllowedKeys(input, ['cart_line_ids']); const ids = Array.isArray(input.cart_line_ids) ? input.cart_line_ids.map(String) : []; const current = state();
    const cart = ids.map((id) => requireFound(current.cart.find((line) => line.id === id && !line.invalid), 'CART_LINE_NOT_FOUND', `Valid cart line not found: ${id}`));
    const shopIds = [...new Set(cart.map((line) => item(line.itemId).shopId))];
    if (shopIds.length !== 1) requireFound(undefined, 'MULTI_SHOP_CHECKOUT', 'Checkout draft must contain lines from exactly one shop.');
    const lines: TbOrderLine[] = cart.map((cartLine) => { const product = item(cartLine.itemId); return { itemId: product.id, title: product.title, image: product.image, skuDesc: cartLine.skuDesc, price: cartLine.price, qty: cartLine.qty }; });
    current.beginCheckout({ lines, shopId: shopIds[0], source: 'cart', sourceCartLineIds: ids }); await openAppRoute('taobao', '/order/confirm');
    return { route: '/order/confirm', persisted: false, line_count: lines.length, shop_id: shopIds[0] };
  },
};

export function executeTaobaoTool(name: string, input: JsonObject) { return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Taobao tool: ${name}`)(input); }
export { TAOBAO_TOOL_DEFINITIONS } from './definitions';
