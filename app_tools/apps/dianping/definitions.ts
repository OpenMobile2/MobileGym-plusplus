import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const DIANPING_TOOL_DEFINITIONS = defineAppTools('dianping', [
  { name: 'search_shops', description: 'Search shops by name, category, tag, or district. Returns compact candidates with rating, price, and distance; open a shop in the GUI for full detail.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'get_shop_summary', description: 'Return compact rating breakdown, average price, hours, tags, and top recommended dishes for one shop. Does not include review text.', properties: { shop_id: ID }, required: ['shop_id'] },
  { name: 'list_shop_deals', description: "List a shop's group-buy vouchers and set meals with price and discount. Package contents and purchase remain in the GUI.", properties: { shop_id: ID, limit: LIMIT }, required: ['shop_id'] },
  { name: 'list_recommended_dishes', description: "List a shop's dishes ranked by recommend count (most-recommended first).", properties: { shop_id: ID, limit: LIMIT }, required: ['shop_id'] },
  { name: 'search_reviews', description: "Search a shop's reviews by score range or tag. Returns reviewer name, score, tags, and date only; read the full review text from the GUI after opening it.", properties: { shop_id: ID, tag: STRING, min_score: { type: 'integer', minimum: 1, maximum: 5 }, max_score: { type: 'integer', minimum: 1, maximum: 5 }, limit: LIMIT }, required: ['shop_id'] },
  { name: 'open_shop', description: 'Open a shop detail page on the normal Dianping GUI for continued browsing.', properties: { shop_id: ID }, required: ['shop_id'], kind: 'navigation' },
  { name: 'open_review', description: "Open one review's detail page so its full text can be read from the GUI.", properties: { shop_id: ID, review_id: ID }, required: ['shop_id', 'review_id'], kind: 'navigation' },
  { name: 'open_voucher', description: 'Open a voucher/set-meal detail page on the normal GUI for continued browsing.', properties: { shop_id: ID, deal_id: ID }, required: ['shop_id', 'deal_id'], kind: 'navigation' },
  { name: 'add_favorite_shop', description: 'Favorite a shop if it is not already favorited. Idempotent: calling it again on an already-favorited shop makes no change.', properties: { shop_id: ID }, required: ['shop_id'], kind: 'write', idempotent: true },
  { name: 'prepare_voucher_checkout', description: 'Fill in a voucher/set-meal checkout draft (shop, deal, quantity) using the same action the GUI uses, then open the normal order-confirm page. This does not submit or pay for the order; review, adjust, and confirm or cancel in the GUI.', properties: { shop_id: ID, deal_id: ID, quantity: { type: 'integer', minimum: 1, maximum: 20, default: 1 } }, required: ['shop_id', 'deal_id'], kind: 'draft' },
]);
