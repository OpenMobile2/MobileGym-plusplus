import { useTbsgStore } from '@/apps/TaobaoShangou/state';
import type { OrderStatus, TbItem, TbShop } from '@/apps/TaobaoShangou/types';
import { skuDescOf } from '@/apps/TaobaoShangou/utils';
import * as TimeService from '@/os/TimeService';
import {
  assertAllowedKeys, optionalEnum, optionalInteger, optionalString, requireString, ToolExecutionError,
} from '../../core/errors';
import { openAppRoute } from '../../core/navigation';
import { toolRegistry } from '../../core/registry';
import type { JsonObject, ToolHandler } from '../../core/types';
import { TBSG_TOOL_DEFINITIONS, TBSG_TOOL_NAMES } from './definitions';

function state() { return useTbsgStore.getState(); }
function shopById(id: string): TbShop {
  const shop = state().shops.find((item) => item.id === id);
  if (!shop) throw new ToolExecutionError('SHOP_NOT_FOUND', `Shop not found: ${id}`);
  return shop;
}
function itemById(id: string): TbItem {
  const item = state().items.find((entry) => entry.id === id);
  if (!item) throw new ToolExecutionError('ITEM_NOT_FOUND', `Item not found: ${id}`);
  return item;
}
function itemSummary(item: TbItem) {
  return {
    item_id: item.id, shop_id: item.shopId, name: item.name, description: item.desc,
    price: item.price, monthly_sales: item.monthlySales, has_sku: !!item.skuGroups,
    sku_groups: item.skuGroups?.map((group) => ({
      name: group.name, type: group.type,
      options: group.options.map((option) => ({ label: option.label, price_delta: option.delta })),
    })) ?? [],
  };
}
function requireOptions(input: Record<string, unknown>): string[] {
  const value = input.options ?? [];
  if (!Array.isArray(value) || value.some((option) => typeof option !== 'string' || !option.trim()) || value.length > 20) {
    throw new ToolExecutionError('INVALID_ARGUMENT', '"options" must be an array of at most 20 non-empty strings.');
  }
  return value.map((option) => String(option).trim());
}
function resolveSku(item: TbItem, labels: string[]) {
  const groups = item.skuGroups ?? [];
  if (!groups.length) {
    if (labels.length) throw new ToolExecutionError('INVALID_ARGUMENT', 'This item has no SKU options.');
    return { desc: '', delta: 0 };
  }
  const unknown = labels.filter((label) => !groups.some((group) => group.options.some((option) => option.label === label)));
  if (unknown.length) throw new ToolExecutionError('INVALID_ARGUMENT', `Unknown SKU option: ${unknown.join(', ')}`);
  const selection: Record<string, string[]> = {};
  for (const group of groups) {
    const selected = group.options.filter((option) => labels.includes(option.label)).map((option) => option.label);
    if (group.type === 'single') {
      if (selected.length !== 1) throw new ToolExecutionError('INVALID_ARGUMENT', `Select exactly one option for "${group.name}".`);
    }
    selection[group.name] = selected;
  }
  if (new Set(labels).size !== labels.length) throw new ToolExecutionError('INVALID_ARGUMENT', 'SKU options must not be duplicated.');
  return skuDescOf(groups, selection);
}

const handlers: Record<string, ToolHandler> = {
  [TBSG_TOOL_NAMES.searchShops]: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = requireString(input, 'query', { maxLength: 100 }).toLowerCase();
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = state().shops.filter((shop) =>
      [shop.name, shop.branch, shop.fullName, shop.category, ...shop.features].join(' ').toLowerCase().includes(query),
    );
    return { shops: matches.slice(0, limit).map((shop) => ({ shop_id: shop.id, name: shop.fullName, category: shop.category, rating: shop.rating, delivery_minutes: shop.deliveryMinutes, distance_km: shop.distanceKm, supports_pickup: shop.supportsPickup })), total: matches.length, truncated: matches.length > limit };
  },
  [TBSG_TOOL_NAMES.searchItems]: (input) => {
    assertAllowedKeys(input, ['query', 'shop_id', 'limit']);
    const query = requireString(input, 'query', { maxLength: 100 }).toLowerCase();
    const shopId = optionalString(input, 'shop_id');
    if (shopId) shopById(shopId);
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = state().items.filter((item) => (!shopId || item.shopId === shopId)
      && [item.name, item.desc, item.brand, item.drugCat, item.drugSub, ...(item.tags ?? []), ...(item.funcs ?? [])]
        .filter(Boolean).join(' ').toLowerCase().includes(query));
    return { items: matches.slice(0, limit).map(itemSummary), total: matches.length, truncated: matches.length > limit };
  },
  [TBSG_TOOL_NAMES.getShopMenu]: (input) => {
    assertAllowedKeys(input, ['shop_id', 'limit']);
    const shopId = requireString(input, 'shop_id');
    shopById(shopId);
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const items = state().items.filter((item) => item.shopId === shopId);
    return { shop_id: shopId, items: items.slice(0, limit).map(itemSummary), total: items.length, truncated: items.length > limit };
  },
  [TBSG_TOOL_NAMES.openShop]: async (input) => {
    assertAllowedKeys(input, ['shop_id', 'mode']);
    const shopId = requireString(input, 'shop_id');
    const shop = shopById(shopId);
    const mode = optionalEnum(input, 'mode', ['delivery', 'pickup'] as const, 'delivery');
    if (mode === 'pickup' && !shop.supportsPickup) throw new ToolExecutionError('INVALID_ARGUMENT', 'This shop does not support pickup.');
    const base = shop.type === 'retail' ? `/retail/${encodeURIComponent(shopId)}` : `/shop/${encodeURIComponent(shopId)}`;
    const route = mode === 'pickup' ? `${base}?mode=pickup` : base;
    await openAppRoute('tbsg', route);
    return { shop_id: shopId, route };
  },
  [TBSG_TOOL_NAMES.getCart]: (input) => {
    assertAllowedKeys(input, []);
    const current = state();
    const groups = new Map<string, typeof current.cart>();
    for (const line of current.cart) groups.set(line.shopId, [...(groups.get(line.shopId) ?? []), line]);
    const shops = [...groups.entries()].map(([shopId, lines]) => ({
      shop_id: shopId, shop_name: current.shops.find((shop) => shop.id === shopId)?.fullName ?? shopId,
      lines: lines.map((line) => ({ line_id: line.id, item_id: line.itemId, item_name: current.items.find((item) => item.id === line.itemId)?.name ?? line.itemId, quantity: line.qty, unit_price: line.price, sku_description: line.skuDesc, selected: line.selected })),
      subtotal: Math.round(lines.reduce((sum, line) => sum + line.price * line.qty, 0) * 100) / 100,
    }));
    return { shops, line_count: current.cart.length, total: Math.round(current.cart.reduce((sum, line) => sum + line.price * line.qty, 0) * 100) / 100 };
  },
  [TBSG_TOOL_NAMES.addItemToCart]: (input) => {
    assertAllowedKeys(input, ['item_id', 'quantity', 'options']);
    const itemId = requireString(input, 'item_id');
    const item = itemById(itemId);
    const quantity = optionalInteger(input, 'quantity', { min: 1, max: 20, defaultValue: 1 });
    const sku = resolveSku(item, requireOptions(input));
    const unitPrice = Math.round((item.price + sku.delta) * 100) / 100;
    const description = sku.desc || null;
    state().addToCart(itemId, description, unitPrice, quantity);
    const line = state().cart.find((entry) => entry.itemId === itemId && entry.skuDesc === description);
    if (!line) throw new ToolExecutionError('INTERNAL_ERROR', 'The cart line was not persisted.');
    return { line_id: line.id, item_id: itemId, quantity: line.qty, unit_price: line.price, sku_description: line.skuDesc };
  },
  [TBSG_TOOL_NAMES.openCart]: async (input) => {
    assertAllowedKeys(input, []); const route = '/cart'; await openAppRoute('tbsg', route); return { route };
  },
  [TBSG_TOOL_NAMES.listOrders]: (input) => {
    assertAllowedKeys(input, ['status', 'limit']);
    const status = optionalEnum(input, 'status', ['all', 'unpaid', 'preparing', 'delivering', 'delivered', 'canceled', 'refunding', 'refunded'] as const, 'all');
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const orders = [...state().orders].filter((order) => status === 'all' || order.status === status as OrderStatus).sort((a, b) => b.createdAt - a.createdAt);
    return { orders: orders.slice(0, limit).map((order) => ({ order_id: order.id, shop_id: order.shopId, shop_name: state().shops.find((shop) => shop.id === order.shopId)?.fullName ?? order.shopId, status: order.status, total_paid: order.totalPaid, created_at: TimeService.fromTimestamp(order.createdAt).toISOString() })), total: orders.length, truncated: orders.length > limit };
  },
  [TBSG_TOOL_NAMES.openOrder]: async (input) => {
    assertAllowedKeys(input, ['order_id']); const orderId = requireString(input, 'order_id');
    if (!state().orders.some((order) => order.id === orderId)) throw new ToolExecutionError('ORDER_NOT_FOUND', `Order not found: ${orderId}`);
    const route = `/order/${encodeURIComponent(orderId)}`; await openAppRoute('tbsg', route); return { order_id: orderId, route };
  },
  [TBSG_TOOL_NAMES.prepareCheckout]: async (input) => {
    assertAllowedKeys(input, ['shop_id', 'mode']); const shopId = requireString(input, 'shop_id'); const shop = shopById(shopId);
    const mode = optionalEnum(input, 'mode', ['delivery', 'pickup'] as const, 'delivery');
    if (mode === 'pickup' && !shop.supportsPickup) throw new ToolExecutionError('INVALID_ARGUMENT', 'This shop does not support pickup.');
    const lines = state().cart.filter((line) => line.shopId === shopId);
    if (!lines.length) throw new ToolExecutionError('CART_EMPTY', 'The selected shop has no cart items.');
    state().beginCheckout(shopId, mode);
    if (!state().checkoutDraft) throw new ToolExecutionError('INTERNAL_ERROR', 'The checkout draft was not created.');
    const route = '/checkout'; await openAppRoute('tbsg', route); return { route, persisted: false, line_count: lines.length };
  },
};

export function executeTbsgTool(name: string, input: JsonObject): ReturnType<ToolHandler> {
  const handler = handlers[name];
  if (!handler) throw new ToolExecutionError('TOOL_NOT_FOUND', `Unknown Taobao Instant tool: ${name}`);
  return handler(input);
}

export function registerTbsgTools(registry: Pick<typeof toolRegistry, 'register'>): void {
  TBSG_TOOL_DEFINITIONS.forEach((definition) => registry.register(definition, handlers[definition.name]));
}
export { TBSG_TOOL_DEFINITIONS, TBSG_TOOL_NAMES } from './definitions';
