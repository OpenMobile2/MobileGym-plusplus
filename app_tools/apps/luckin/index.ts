import { useLuckinStore } from '@/apps/Luckin/state';
import type { Product } from '@/apps/Luckin/types';
import { assertAllowedKeys } from '../../core/errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { LUCKIN_TOOL_DEFINITIONS } from './definitions';

const state = () => useLuckinStore.getState();
const productById = (id: string): Product => requireFound(
  state().products.find((item) => item.id === id), 'PRODUCT_NOT_FOUND', `Luckin product not found: ${id}`,
);
const productSummary = (product: Product) => ({
  product_id: product.id, name: product.name, subtitle: product.subtitle,
  category: product.category, base_price: product.price, original_price: product.originalPrice,
  badge: product.badge, favorite: state().favorites.includes(product.id),
});

const handlers: Record<string, ToolHandler> = {
  luckin__search_products: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    return compactResult(state().products.filter((product) => includesQuery([
      product.name, product.subtitle, product.category, product.badge,
    ], query)).map(productSummary), getLimit(input, 50));
  },
  luckin__list_stores: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = typeof input.query === 'string' ? input.query.trim() : '';
    const rows = state().stores.filter((store) => !query || includesQuery([
      store.name, store.address,
    ], query)).map((store) => ({
      store_id: store.id, name: store.name, address: store.address, distance: store.distance, open: store.open,
    }));
    return compactResult(rows, getLimit(input, 50));
  },
  luckin__list_coupons: (input) => {
    assertAllowedKeys(input, ['limit']);
    return compactResult(state().coupons.map((coupon) => ({
      coupon_id: coupon.id, title: coupon.title, amount: coupon.amount, threshold: coupon.threshold,
      expiry: coupon.expiry, kind: coupon.kind, claimed: coupon.claimed,
    })), getLimit(input, 50));
  },
  luckin__get_cart: (input) => {
    assertAllowedKeys(input, ['limit']);
    const rows = state().cart.map((item) => {
      const product = productById(item.productId);
      return { ...productSummary(product), quantity: item.quantity, checked: item.checked, spec: item.spec };
    });
    return compactResult(rows, getLimit(input, 50));
  },
  luckin__open_product: async (input) => {
    assertAllowedKeys(input, ['product_id']);
    const product = productById(getQuery(input, 'product_id'));
    const route = `/product/${encodeURIComponent(product.id)}`;
    await openAppRoute('luckin', route);
    return { route, product_id: product.id };
  },
  luckin__open_cart: async () => {
    await openAppRoute('luckin', '/order/confirm');
    return { route: '/order/confirm' };
  },
  luckin__add_to_cart: (input) => {
    assertAllowedKeys(input, ['product_id']);
    const product = productById(getQuery(input, 'product_id'));
    state().addToCart(product.id, 1);
    const row = state().cart.find((item) => item.productId === product.id);
    return { product_id: product.id, quantity: row?.quantity ?? 0, spec: row?.spec ?? 'coffee.default' };
  },
};

export function executeLuckinTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Luckin tool: ${name}`)(input);
}

export { LUCKIN_TOOL_DEFINITIONS } from './definitions';
