import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const JINGDONG_TOOL_DEFINITIONS = defineAppTools('jingdong', [
  {
    name: 'search_items',
    description: 'Search Jingdong main-catalog items by title, category, tag, or shop name. Optional filters match the GUI chips/drawer: 国家补贴, 京东物流, 自营, 包邮, 先用后付. Returns compact summaries including price, national-subsidy (国补) info, and self-operated/JD-logistics badges. Does not search Miaosong/Waimai store dishes.',
    properties: {
      query: STRING,
      limit: LIMIT,
      filters: { type: 'array', items: { type: 'string', enum: ['国家补贴', '京东物流', '自营', '包邮', '先用后付'] } },
    },
    required: ['query'],
  },
  {
    name: 'get_item_summary',
    description: 'Return compact catalog and SKU information for one Jingdong main-catalog item.',
    properties: { item_id: ID },
    required: ['item_id'],
  },
  {
    name: 'compare_items',
    description: 'Compare price, national-subsidy amount, self-operated/JD-logistics badges, and review counts for selected Jingdong catalog items.',
    properties: { item_ids: { type: 'array', items: ID, minItems: 2, maxItems: 10 } },
    required: ['item_ids'],
  },
  {
    name: 'get_cart',
    description: 'Return the current shopping cart grouped by shop, with per-line quantity, checked state, and totals.',
    properties: {},
  },
  {
    name: 'list_orders',
    description: 'List compact Jingdong orders, optionally filtered by status.',
    properties: {
      status: { type: 'string', enum: ['all', 'unpaid', 'undelivered', 'unused', 'done', 'refunding', 'refunded', 'cancelled'], default: 'all' },
      limit: LIMIT,
    },
  },
  {
    name: 'get_order_summary',
    description: 'Return one Jingdong order summary and its most recent logistics update. Earlier logistics history remains on the logistics detail GUI.',
    properties: { order_id: ID },
    required: ['order_id'],
  },
  {
    name: 'list_coupons',
    description: 'List Jingdong coupons. source=mine (default) is already-claimed coupons; source=center is the coupon-center catalog, including unclaimed rows. This does not claim a coupon.',
    properties: {
      channel: { type: 'string', enum: ['all', 'shopping', 'miaosong'], default: 'all' },
      source: { type: 'string', enum: ['mine', 'center'], default: 'mine' },
    },
  },
  {
    name: 'claim_coupon',
    description: 'Claim one coupon-center coupon by id, the same as tapping 领取 in 领券中心. Already-claimed coupons are left unchanged.',
    properties: { coupon_id: ID },
    required: ['coupon_id'],
    kind: 'write',
    idempotent: true,
  },
  {
    name: 'search_life_shops',
    description: 'Search Jingdong Miaosong/Waimai (即时零售/外卖) stores by name or category. Returns store-level info (rating, ETA, distance) only; open the store in the GUI to see its dish/product menu and prices.',
    properties: { query: STRING, limit: LIMIT },
  },
  {
    name: 'open_item',
    description: 'Open one Jingdong main-catalog item detail page for continued GUI inspection (specs, reviews, detail images).',
    properties: { item_id: ID },
    required: ['item_id'],
    kind: 'navigation',
  },
  {
    name: 'open_cart',
    description: 'Open the normal Jingdong cart without changing any selection.',
    kind: 'navigation',
  },
  {
    name: 'add_to_cart',
    description: 'Add one main-catalog item (not a Miaosong/Waimai dish) with an exact valid SKU description and quantity to the shopping cart, exactly like tapping "加入购物车" in the GUI. Use an empty sku_description for items with no spec options.',
    properties: { item_id: ID, sku_description: STRING, quantity: { type: 'integer', minimum: 1, maximum: 99 } },
    required: ['item_id', 'sku_description', 'quantity'],
    kind: 'write',
  },
  {
    name: 'prepare_checkout',
    description: 'Check exactly the given cart line IDs (unchecking everything else) and open the order-confirmation page, exactly like ticking those rows in the cart and tapping "去结算". This does not place or pay for an order; payment method selection and final submission remain GUI actions.',
    properties: { cart_line_ids: { type: 'array', items: ID, minItems: 1, maxItems: 30 } },
    required: ['cart_line_ids'],
    kind: 'draft',
  },
]);
