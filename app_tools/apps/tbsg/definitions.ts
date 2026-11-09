import type { ToolDefinition } from '../../core/types';

const STRING = { type: 'string' } as const;
const LIMIT = { type: 'integer', minimum: 1, maximum: 20, default: 10 } as const;
const SHOPS = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      shop_id: STRING, name: STRING, category: STRING, rating: { type: 'number' },
      delivery_minutes: { type: 'integer' }, distance_km: { type: 'number' }, supports_pickup: { type: 'boolean' },
    },
    required: ['shop_id', 'name', 'category', 'rating', 'delivery_minutes', 'distance_km', 'supports_pickup'],
  },
} as const;
const ITEMS = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      item_id: STRING, shop_id: STRING, name: STRING, description: STRING,
      price: { type: 'number' }, monthly_sales: { type: 'integer' }, has_sku: { type: 'boolean' },
      sku_groups: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: STRING,
            type: { type: 'string', enum: ['single', 'multi'] },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: { label: STRING, price_delta: { type: 'number' } },
                required: ['label', 'price_delta'],
              },
            },
          },
          required: ['name', 'type', 'options'],
        },
      },
    },
    required: ['item_id', 'shop_id', 'name', 'description', 'price', 'monthly_sales', 'has_sku', 'sku_groups'],
  },
} as const;
const CART_SHOPS = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      shop_id: STRING,
      shop_name: STRING,
      lines: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            line_id: STRING, item_id: STRING, item_name: STRING, quantity: { type: 'integer' },
            unit_price: { type: 'number' }, sku_description: { type: ['string', 'null'] }, selected: { type: 'boolean' },
          },
          required: ['line_id', 'item_id', 'item_name', 'quantity', 'unit_price', 'sku_description', 'selected'],
        },
      },
      subtotal: { type: 'number' },
    },
    required: ['shop_id', 'shop_name', 'lines', 'subtotal'],
  },
} as const;
const ORDERS = {
  type: 'array',
  items: {
    type: 'object',
    properties: { order_id: STRING, shop_id: STRING, shop_name: STRING, status: STRING, total_paid: { type: 'number' }, created_at: STRING },
    required: ['order_id', 'shop_id', 'shop_name', 'status', 'total_paid', 'created_at'],
  },
} as const;
const ann = (readOnly: boolean, uiEffect: 'none' | 'navigation' | 'draft' = 'none', idempotent = true) => ({
  readOnlyHint: readOnly, destructiveHint: false, idempotentHint: idempotent, uiEffect,
});

export const TBSG_TOOL_NAMES = {
  searchShops: 'tbsg__search_shops',
  searchItems: 'tbsg__search_items',
  getShopMenu: 'tbsg__get_shop_menu',
  openShop: 'tbsg__open_shop',
  getCart: 'tbsg__get_cart',
  addItemToCart: 'tbsg__add_item_to_cart',
  openCart: 'tbsg__open_cart',
  listOrders: 'tbsg__list_orders',
  openOrder: 'tbsg__open_order',
  prepareCheckout: 'tbsg__prepare_checkout',
} as const;

export const TBSG_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: TBSG_TOOL_NAMES.searchShops, app: 'tbsg',
    description: 'Search Taobao Instant shops by name, category, or feature. Returns compact shop candidates, not full menus.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 100 }, limit: LIMIT }, required: ['query'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { shops: SHOPS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['shops', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: TBSG_TOOL_NAMES.searchItems, app: 'tbsg',
    description: 'Search products across Taobao Instant shops. Returns item and shop identifiers plus price and SKU availability.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 100 }, shop_id: STRING, limit: LIMIT }, required: ['query'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { items: ITEMS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['items', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: TBSG_TOOL_NAMES.getShopMenu, app: 'tbsg',
    description: 'Get a compact menu for one shop, including valid SKU option labels needed by add_item_to_cart.',
    inputSchema: { type: 'object', properties: { shop_id: STRING, limit: LIMIT }, required: ['shop_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { shop_id: STRING, items: ITEMS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['shop_id', 'items', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: TBSG_TOOL_NAMES.openShop, app: 'tbsg',
    description: 'Open a shop page by shop_id. The next screenshot shows the normal shop GUI.',
    inputSchema: { type: 'object', properties: { shop_id: STRING, mode: { type: 'string', enum: ['delivery', 'pickup'], default: 'delivery' } }, required: ['shop_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { shop_id: STRING, route: STRING }, required: ['shop_id', 'route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: TBSG_TOOL_NAMES.getCart, app: 'tbsg',
    description: 'Read the current cart grouped by shop. Returns quantities and totals without changing selection state.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: { type: 'object', properties: { shops: CART_SHOPS, line_count: { type: 'integer' }, total: { type: 'number' } }, required: ['shops', 'line_count', 'total'] }, annotations: ann(true),
  },
  {
    name: TBSG_TOOL_NAMES.addItemToCart, app: 'tbsg',
    description: 'Add an item to the cart through the same cart action as the shop GUI. For SKU items, pass option labels from get_shop_menu.',
    inputSchema: { type: 'object', properties: { item_id: STRING, quantity: { type: 'integer', minimum: 1, maximum: 20, default: 1 }, options: { type: 'array', items: STRING, maxItems: 20, default: [] } }, required: ['item_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { line_id: STRING, item_id: STRING, quantity: { type: 'integer' }, unit_price: { type: 'number' }, sku_description: { type: ['string', 'null'] } }, required: ['line_id', 'item_id', 'quantity', 'unit_price', 'sku_description'] }, annotations: ann(false, 'none', false),
  },
  {
    name: TBSG_TOOL_NAMES.openCart, app: 'tbsg',
    description: 'Open the Taobao Instant cart. Continue selecting items or checking out through the GUI.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: { type: 'object', properties: { route: STRING }, required: ['route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: TBSG_TOOL_NAMES.listOrders, app: 'tbsg',
    description: 'List recent orders with status, shop, total, and creation time. Order contents remain on the order detail GUI.',
    inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['all', 'unpaid', 'preparing', 'delivering', 'delivered', 'canceled', 'refunding', 'refunded'], default: 'all' }, limit: LIMIT }, additionalProperties: false },
    outputSchema: { type: 'object', properties: { orders: ORDERS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['orders', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: TBSG_TOOL_NAMES.openOrder, app: 'tbsg',
    description: 'Open an order detail page by order_id. Sensitive details and order actions remain in the GUI.',
    inputSchema: { type: 'object', properties: { order_id: STRING }, required: ['order_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { order_id: STRING, route: STRING }, required: ['order_id', 'route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: TBSG_TOOL_NAMES.prepareCheckout, app: 'tbsg',
    description: 'Build a checkout draft from all cart lines in one shop and open checkout. This does not place or pay for an order; review and confirm in the GUI.',
    inputSchema: { type: 'object', properties: { shop_id: STRING, mode: { type: 'string', enum: ['delivery', 'pickup'], default: 'delivery' } }, required: ['shop_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { route: STRING, persisted: { type: 'boolean' }, line_count: { type: 'integer' } }, required: ['route', 'persisted', 'line_count'] }, annotations: ann(false, 'draft'),
  },
];
