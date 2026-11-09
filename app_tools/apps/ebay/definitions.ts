import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const EBAY_TOOL_DEFINITIONS = defineAppTools('ebay', [
  {
    name: 'search_products',
    description: 'Search eBay products using the same filters as the GUI. Prices include shipping, and results default to lowest total price first.',
    properties: {
      query: STRING,
      min_price: { type: 'number', minimum: 0, description: 'Minimum total price including shipping.' },
      max_price: { type: 'number', minimum: 0, description: 'Maximum total price including shipping.' },
      category: { type: 'string', description: 'Exact category ID or displayed category name.' },
      brand: { type: 'string' },
      condition: { type: 'string', enum: ['全新', '二手', '翻新'] },
      buying_format: { type: 'string', enum: ['buyItNow', 'auction', 'offer'] },
      location: { type: 'string', description: 'Exact country or continent displayed by the GUI.' },
      free_shipping: { type: 'boolean' },
      sort_by: {
        type: 'string',
        enum: ['total_price_asc', 'total_price_desc', 'newly_listed', 'ending_soon', 'distance_asc'],
        default: 'total_price_asc',
      },
      limit: LIMIT,
    },
    required: ['query'],
  },
  { name: 'compare_products', description: 'Compare total price including shipping for selected products.', properties: { product_ids: { type: 'array', items: ID, minItems: 2, maxItems: 10 } }, required: ['product_ids'] },
  { name: 'get_product_summary', description: 'Return public product metadata for one product.', properties: { product_id: ID }, required: ['product_id'] },
  { name: 'list_recent_searches', description: 'List recent eBay search queries.', properties: { limit: LIMIT } },
  { name: 'open_search', description: 'Open the normal eBay search page for continued GUI filtering.', kind: 'navigation' },
  { name: 'open_product', description: 'Open one eBay product page. Buying and offers remain GUI actions.', properties: { product_id: ID }, required: ['product_id'], kind: 'navigation' },
  { name: 'open_cart', description: 'Open the normal eBay cart without changing any cart contents.', kind: 'navigation' },
  { name: 'save_search', description: 'Save one query to recent eBay searches.', properties: { query: STRING }, required: ['query'], kind: 'write' },
]);
