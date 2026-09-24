import type { NavigationDeclaration, ScrollContainerDeclaration } from './navigation.types';

const MAIN_SCROLL: ScrollContainerDeclaration[] = [
  { name: 'main', direction: 'vertical', description: '页面主内容滚动区' },
];

export const NAVIGATION_DECLARATION = {
  app: 'meituan',

  routes: [
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        { id: 'home.base', search: {}, description: '首页-附近餐厅列表' },
        { id: 'home.search', search: { mode: 'search' }, description: '首页-搜索状态' },
      ],
      queryParams: {},
      description: '美团外卖首页',
    },
    {
      path: '/restaurant/:rid',
      component: 'RestaurantPage',
      params: { rid: 'string' },
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        { id: 'restaurant.menu', search: {}, description: '餐厅-菜单' },
        { id: 'restaurant.comments', search: { tab: 'comments' }, description: '餐厅-评价' },
        {
          id: 'restaurant.cart.open',
          search: { cart: 'open' },
          description: '餐厅-购物车展开',
          actions: [
            {
              id: 'restaurant.cartItem.add',
              label: '加入购物车',
              behavior: 'submit',
              scope: 'item',
              paramsSchema: { dishId: 'string' },
            },
            {
              id: 'restaurant.cartItem.remove',
              label: '从购物车移除',
              behavior: 'modify',
              scope: 'item',
              paramsSchema: { dishId: 'string' },
            },
          ],
        },
      ],
      queryParams: {},
      description: '餐厅详情页（菜单+评价+购物车）',
    },
    {
      path: '/order-confirm',
      component: 'OrderConfirmPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        { id: 'orderConfirm.base', search: {}, description: '订单确认页' },
      ],
      queryParams: {},
      description: '订单确认',
    },
    {
      path: '/orders',
      component: 'OrdersPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        { id: 'orders.all', search: {}, description: '全部订单' },
        { id: 'orders.ongoing', search: { tab: 'ongoing' }, description: '进行中订单' },
      ],
      queryParams: {},
      description: '我的订单',
    },
    {
      path: '/me',
      component: 'MePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        { id: 'me.base', search: {}, description: '我的页面' },
      ],
      queryParams: {},
      description: '个人中心',
    },
    {
      path: '/order-success',
      component: 'OrderSuccessPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        { id: 'orderSuccess.base', search: {}, description: '下单成功页' },
      ],
      queryParams: {},
      description: '下单成功',
    },
  ],

  transitions: [
    // 首页 → 餐厅详情
    {
      id: 'meituan.home-open',
      from: '*',
      to: '/',
      search: {},
      searchParams: {},
      mode: 'replace',
      params: {},
      label: '回到首页',
      ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' },
    },
    {
      id: 'meituan.open-restaurant',
      from: '/',
      to: '/restaurant/:rid',
      search: {},
      searchParams: {},
      mode: 'push',
      params: { rid: 'string' },
      label: '进入餐厅',
      ui: { placement: 'content', icon: 'tap', gesture: 'tap' },
      dataSource: { ref: 'restaurants', paramMapping: { rid: 'id' }, labelField: 'name' },
    },
    // 购物车展开
    {
      id: 'meituan.cart-open',
      from: '/restaurant/:rid',
      to: '/restaurant/:rid',
      search: { cart: 'open' },
      searchParams: {},
      mode: 'push',
      params: { rid: 'string' },
      label: '展开购物车',
      ui: { placement: 'content', icon: 'cart', gesture: 'tap' },
    },
    {
      id: 'meituan.cart-close',
      from: { path: '/restaurant/:rid', search: { cart: 'open' } },
      to: '/restaurant/:rid',
      search: {},
      searchParams: {},
      mode: 'replace',
      params: { rid: 'string' },
      label: '收起购物车',
      ui: { placement: 'content', icon: 'close', gesture: 'tap' },
    },
    // 去结算 → 订单确认
    {
      id: 'meituan.open-order-confirm',
      from: { path: '/restaurant/:rid', search: { cart: 'open' } },
      to: '/order-confirm',
      search: {},
      searchParams: {},
      mode: 'push',
      params: {},
      label: '去结算',
      ui: { placement: 'content', icon: 'checkout', gesture: 'tap' },
    },
    // 提交订单 → 下单成功
    {
      id: 'meituan.submit-order',
      from: '/order-confirm',
      to: '/order-success',
      search: {},
      searchParams: {},
      mode: 'replace',
      params: {},
      label: '提交订单',
      ui: { placement: 'content', icon: 'submit', gesture: 'tap' },
    },
    // 下单成功 → 查看订单
    {
      id: 'meituan.open-orders',
      from: '*',
      to: '/orders',
      search: {},
      searchParams: {},
      mode: 'push',
      params: {},
      label: '查看订单',
      ui: { placement: 'tabbar', icon: 'orders', gesture: 'tap' },
    },
    // 我的
    {
      id: 'meituan.open-me',
      from: '*',
      to: '/me',
      search: {},
      searchParams: {},
      mode: 'replace',
      params: {},
      label: '我的',
      ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' },
    },
    // 评价 Tab
    {
      id: 'meituan.restaurant-comments',
      from: '/restaurant/:rid',
      to: '/restaurant/:rid',
      search: { tab: 'comments' },
      searchParams: {},
      mode: 'replace',
      params: { rid: 'string' },
      label: '切换到评价',
      ui: { placement: 'content', icon: 'tab', gesture: 'tap' },
    },
    {
      id: 'meituan.restaurant-menu',
      from: { path: '/restaurant/:rid', search: { tab: 'comments' } },
      to: '/restaurant/:rid',
      search: {},
      searchParams: {},
      mode: 'replace',
      params: { rid: 'string' },
      label: '切换到菜单',
      ui: { placement: 'content', icon: 'tab', gesture: 'tap' },
    },
  ],

  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
