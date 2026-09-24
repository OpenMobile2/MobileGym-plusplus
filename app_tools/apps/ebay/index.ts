import { loadProducts } from '@/apps/Ebay/data/loader';
import { useEbayStore } from '@/apps/Ebay/state';
import type { ProductItem } from '@/apps/Ebay/types';
import { assertAllowedKeys, optionalBoolean, optionalString } from '../../core/errors';
import { compactResult, finiteNumber, getLimit, getQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { EBAY_TOOL_DEFINITIONS } from './definitions';

const COUNTRY_TO_CONTINENT: Record<string, string> = {
  '中国': '亚洲', '日本': '亚洲', '韩国': '亚洲', '印度': '亚洲',
  '美国': '北美洲', '加拿大': '北美洲', '墨西哥': '北美洲',
  '英国': '欧洲', '德国': '欧洲', '法国': '欧洲', '意大利': '欧洲', '西班牙': '欧洲',
  '澳大利亚': '大洋洲', '新西兰': '大洋洲', '巴西': '南美洲',
};

const totalPrice = (product: ProductItem) => product.price + product.shipping;
const roundMoney = (value: number) => Math.round(value * 100) / 100;
const normalizeSearchText = (value: unknown) => String(value ?? '').toLocaleLowerCase().replace(/\s+/g, '');
const matchesLocation = (actual: string, requested: string) =>
  actual === requested || COUNTRY_TO_CONTINENT[actual] === requested;

const productSummary = (product: ProductItem) => ({
  product_id: product.id,
  title: product.title,
  brand: product.brand,
  category: product.categoryLabel,
  condition: product.condition,
  price: product.price,
  shipping: product.shipping,
  total_price: roundMoney(totalPrice(product)),
  free_shipping: product.freeShipping,
  buying_format: product.buyingFormat,
  location: product.location,
});

async function product(id: string) {
  return requireFound(
    (await loadProducts()).find((item) => item.id === id),
    'PRODUCT_NOT_FOUND',
    `eBay product not found: ${id}`,
  );
}

const handlers: Record<string, ToolHandler> = {
  ebay__search_products: async (input) => {
    assertAllowedKeys(input, [
      'query', 'min_price', 'max_price', 'category', 'brand', 'condition',
      'buying_format', 'location', 'free_shipping', 'sort_by', 'limit',
    ]);
    const query = normalizeSearchText(getQuery(input));
    const min = finiteNumber(input.min_price);
    const max = finiteNumber(input.max_price);
    const category = optionalString(input, 'category');
    const brand = optionalString(input, 'brand');
    const condition = optionalString(input, 'condition');
    const buyingFormat = optionalString(input, 'buying_format');
    const location = optionalString(input, 'location');
    const freeShipping = optionalBoolean(input, 'free_shipping', false);
    const sortBy = optionalString(input, 'sort_by') ?? 'total_price_asc';
    const limit = getLimit(input, 50);

    const rows = (await loadProducts()).filter((item) => {
      const haystack = normalizeSearchText(
        `${item.title} ${item.brand} ${item.typeLabel} ${item.categoryLabel}`,
      );
      const total = totalPrice(item);
      return haystack.includes(query)
        && (min == null || total >= min)
        && (max == null || total <= max)
        && (!category || item.categoryId === category || item.categoryLabel === category)
        && (!brand || item.brand === brand)
        && (!condition || item.condition === condition)
        && (!buyingFormat || item.buyingFormat === buyingFormat)
        && (!location || matchesLocation(item.location, location))
        && (!freeShipping || item.freeShipping);
    });

    const sorters: Record<string, (left: ProductItem, right: ProductItem) => number> = {
      total_price_asc: (left, right) => totalPrice(left) - totalPrice(right),
      total_price_desc: (left, right) => totalPrice(right) - totalPrice(left),
      newly_listed: (left, right) => right.dateListed - left.dateListed,
      ending_soon: (left, right) => left.endingSoon - right.endingSoon,
      distance_asc: (left, right) => left.distanceKm - right.distanceKm,
    };
    const sorter = requireFound(
      sorters[sortBy],
      'INVALID_ARGUMENT',
      `Unsupported eBay sort_by: ${sortBy}`,
    );
    const ordered = rows.sort(sorter);
    // Keep the tool path semantically equivalent to the GUI path.  The
    // verifier for cross-app tasks reads the search snapshot, not merely the
    // returned JSON, so a successful tool search must commit the same state
    // mutation as SearchPage.
    const sortOptionMap: Record<string, string> = {
      total_price_asc: 'priceLow',
      total_price_desc: 'priceHigh',
      newly_listed: 'newlyListed',
      ending_soon: 'endingSoon',
      distance_asc: 'distance',
    };
    const buyingFormatMap: Record<string, string> = {
      buyItNow: 'buyItNow', auction: 'auction', offer: 'offer',
    };
    const first = ordered[0];
    const store = useEbayStore.getState();
    store.setSearchCurrent({
      query,
      sortOption: sortOptionMap[sortBy] ?? 'bestMatch',
      buyingFormat: buyingFormatMap[buyingFormat ?? ''] ?? 'all',
      categoryId: category ?? null,
      brand: brand ?? null,
      location: location ?? null,
      freeShippingOnly: freeShipping,
      conditions: condition ? [condition].sort() : [],
      priceMin: input.min_price == null ? '' : String(input.min_price),
      priceMax: input.max_price == null ? '' : String(input.max_price),
      resultsCount: ordered.length,
      firstTitle: first?.title ?? null,
      firstTotalCents: first ? Math.round(totalPrice(first) * 100) : null,
    });
    store.addRecentSearch(query);
    store.recordSearchSnapshot();
    return compactResult(ordered.map(productSummary), limit);
  },
  ebay__compare_products: async (input) => {
    assertAllowedKeys(input, ['product_ids']);
    const ids = Array.isArray(input.product_ids) ? input.product_ids.map(String) : [];
    if (ids.length < 2 || ids.length > 10) {
      requireFound(undefined, 'INVALID_ARGUMENT', 'product_ids must contain 2-10 IDs.');
    }
    return {
      products: (await Promise.all(ids.map(product)))
        .map(productSummary)
        .sort((left, right) => left.total_price - right.total_price),
    };
  },
  ebay__get_product_summary: async (input) => {
    assertAllowedKeys(input, ['product_id']);
    return productSummary(await product(getQuery(input, 'product_id')));
  },
  ebay__list_recent_searches: (input) => {
    assertAllowedKeys(input, ['limit']);
    const limit = getLimit(input);
    return compactResult(
      (useEbayStore.getState().recentSearches ?? []).map((item: any) => ({
        search_id: item.id,
        query: item.query,
      })),
      limit,
    );
  },
  ebay__open_search: async () => {
    await openAppRoute('ebay', '/search');
    return { route: '/search' };
  },
  ebay__open_product: async (input) => {
    assertAllowedKeys(input, ['product_id']);
    const id = (await product(getQuery(input, 'product_id'))).id;
    const route = `/item/${encodeURIComponent(id)}`;
    await openAppRoute('ebay', route);
    return { route, product_id: id };
  },
  ebay__open_cart: async () => {
    await openAppRoute('ebay', '/cart');
    return { route: '/cart' };
  },
  ebay__save_search: (input) => {
    assertAllowedKeys(input, ['query']);
    const query = getQuery(input);
    useEbayStore.getState().addRecentSearch(query);
    return { query, saved: true };
  },
};

export function executeEbayTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown eBay tool: ${name}`)(input);
}

export { EBAY_TOOL_DEFINITIONS } from './definitions';
