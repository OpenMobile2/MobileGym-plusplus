import { useDianpingStore } from '@/apps/Dianping/state';
import type { Shop, ShopDeal } from '@/apps/Dianping/types';
import { assertAllowedKeys, optionalInteger, optionalString, ToolExecutionError } from '../../core/errors';
import { compactResult, encodeRoute, getLimit, getQuery, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { DIANPING_TOOL_DEFINITIONS } from './definitions';

function state() { return useDianpingStore.getState(); }

function shopById(id: string): Shop {
  return requireFound(state().shops.find((shop) => shop.id === id), 'SHOP_NOT_FOUND', `Dianping shop not found: ${id}`);
}

function dealById(shop: Shop, id: string): ShopDeal {
  return requireFound(shop.deals.find((deal) => deal.id === id), 'DEAL_NOT_FOUND', `Deal not found: ${id} in shop ${shop.id}`);
}

function shopSummary(shop: Shop) {
  return {
    shop_id: shop.id, name: shop.name, category: shop.category, district: shop.district,
    avg_price: shop.avgPrice, score: shop.score, review_count: shop.reviewCount,
    distance_m: shop.distanceM, tags: shop.tags, favorite: state().favoriteShopIds.includes(shop.id),
  };
}

const handlers: Record<string, ToolHandler> = {
  dianping__search_shops: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = getQuery(input);
    const matches = state().shops.filter((shop) => includesQuery(
      [shop.name, shop.category, shop.district, ...shop.tags],
      query,
    ));
    return compactResult(matches.map(shopSummary), getLimit(input, 50));
  },

  dianping__get_shop_summary: (input) => {
    assertAllowedKeys(input, ['shop_id']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const topDishes = [...shop.dishes]
      .sort((a, b) => b.recommendCount - a.recommendCount)
      .slice(0, 5)
      .map((dish) => ({ dish_id: dish.id, name: dish.name, price: dish.price, recommend_count: dish.recommendCount }));
    return {
      shop_id: shop.id, name: shop.name, category: shop.category, district: shop.district,
      avg_price: shop.avgPrice, score: shop.score, taste: shop.taste, env: shop.env, service: shop.service,
      ingredient: shop.ingredient ?? null, review_count: shop.reviewCount, distance_m: shop.distanceM,
      address: shop.address, open_time: shop.hours.open, close_time: shop.hours.close, tags: shop.tags,
      deal_count: shop.deals.length, top_dishes: topDishes, favorite: state().favoriteShopIds.includes(shop.id),
    };
  },

  dianping__list_shop_deals: (input) => {
    assertAllowedKeys(input, ['shop_id', 'limit']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const favoriteDealIds = state().favoriteDealIds;
    const rows = shop.deals.map((deal) => ({
      deal_id: deal.id, title: deal.title, kind: deal.kind, price: deal.price, origin: deal.origin,
      sold: deal.sold, favorite: favoriteDealIds.includes(`${shop.id}:${deal.id}`),
    }));
    return { shop_id: shop.id, ...compactResult(rows, getLimit(input, 20)) };
  },

  dianping__list_recommended_dishes: (input) => {
    assertAllowedKeys(input, ['shop_id', 'limit']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const rows = [...shop.dishes]
      .sort((a, b) => b.recommendCount - a.recommendCount)
      .map((dish) => ({ dish_id: dish.id, name: dish.name, price: dish.price, recommend_count: dish.recommendCount }));
    return { shop_id: shop.id, ...compactResult(rows, getLimit(input, 20)) };
  },

  dianping__search_reviews: (input) => {
    assertAllowedKeys(input, ['shop_id', 'tag', 'min_score', 'max_score', 'limit']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const tag = optionalString(input, 'tag');
    const minScore = optionalInteger(input, 'min_score', { min: 1, max: 5, defaultValue: 1 });
    const maxScore = optionalInteger(input, 'max_score', { min: 1, max: 5, defaultValue: 5 });
    if (maxScore < minScore) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"max_score" must not be less than "min_score".');
    }
    let rows = shop.reviews.filter((review) => review.score >= minScore && review.score <= maxScore);
    if (tag) rows = rows.filter((review) => review.tags.includes(tag));
    const mapped = rows.map((review) => ({
      review_id: review.id, user_name: review.userName, score: review.score,
      tags: review.tags, date_label: review.dateLabel, has_photo: Boolean(review.hasPhoto),
    }));
    return { shop_id: shop.id, ...compactResult(mapped, getLimit(input, 20)) };
  },

  dianping__open_shop: async (input) => {
    assertAllowedKeys(input, ['shop_id']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const route = `/shop/${encodeURIComponent(shop.id)}`;
    await openAppRoute('dianping', route);
    return { shop_id: shop.id, route };
  },

  dianping__open_review: async (input) => {
    assertAllowedKeys(input, ['shop_id', 'review_id']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const reviewId = getQuery(input, 'review_id');
    requireFound(shop.reviews.find((review) => review.id === reviewId), 'REVIEW_NOT_FOUND', `Review not found: ${reviewId} in shop ${shop.id}`);
    const route = `/review/${encodeURIComponent(shop.id)}/${encodeURIComponent(reviewId)}`;
    await openAppRoute('dianping', route);
    return { shop_id: shop.id, review_id: reviewId, route };
  },

  dianping__open_voucher: async (input) => {
    assertAllowedKeys(input, ['shop_id', 'deal_id']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const deal = dealById(shop, getQuery(input, 'deal_id'));
    const route = `/voucher/${encodeURIComponent(shop.id)}/${encodeURIComponent(deal.id)}`;
    await openAppRoute('dianping', route);
    return { shop_id: shop.id, deal_id: deal.id, route };
  },

  dianping__add_favorite_shop: (input) => {
    assertAllowedKeys(input, ['shop_id']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const already = state().favoriteShopIds.includes(shop.id);
    if (!already) state().toggleFavoriteShop(shop.id);
    return { shop_id: shop.id, favorited: true, changed: !already };
  },

  dianping__prepare_voucher_checkout: async (input) => {
    assertAllowedKeys(input, ['shop_id', 'deal_id', 'quantity']);
    const shop = shopById(getQuery(input, 'shop_id'));
    const deal = dealById(shop, getQuery(input, 'deal_id'));
    const quantity = optionalInteger(input, 'quantity', { min: 1, max: 20, defaultValue: 1 });
    state().setPendingCheckout({ shopId: shop.id, dealId: deal.id, qty: 1, couponId: null });
    const route = encodeRoute('/order/confirm', { shopId: shop.id, dealId: deal.id });
    await openAppRoute('dianping', route);
    if (quantity !== 1) state().setCheckoutQty(quantity);
    return { route, persisted: false, shop_id: shop.id, deal_id: deal.id, quantity };
  },
};

export function executeDianpingTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Dianping tool: ${name}`)(input);
}
export { DIANPING_TOOL_DEFINITIONS } from './definitions';
