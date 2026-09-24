import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const LUCKIN_TOOL_DEFINITIONS = defineAppTools('luckin', [
  { name: 'search_products', description: 'Search known Luckin products by name, subtitle, category, or badge. Returns base prices; use the GUI to choose size, temperature, sweetness, and add-ons.', properties: { query: STRING, limit: LIMIT }, required: ['query'] },
  { name: 'list_stores', description: 'List known stores with address, distance, and opening information.', properties: { query: STRING, limit: LIMIT } },
  { name: 'list_coupons', description: 'List coupon summaries and whether each coupon has been claimed. This does not claim or apply a coupon.', properties: { limit: LIMIT } },
  { name: 'get_cart', description: 'Return a compact summary of the current classic-menu cart without opening it.', properties: { limit: LIMIT } },
  { name: 'open_product', description: 'Open the normal product customization page. Choose specifications and confirm through the GUI; read a fresh screenshot after this call.', properties: { product_id: ID }, required: ['product_id'], kind: 'navigation' },
  { name: 'open_cart', description: 'Open the normal Luckin cart and order flow. Confirmation and payment remain GUI actions.', kind: 'navigation' },
  { name: 'add_to_cart', description: 'Add a known classic-menu product in the app default specification to the cart. Use open_product instead when custom specifications are required.', properties: { product_id: ID }, required: ['product_id'], kind: 'write' },
]);
