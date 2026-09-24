/**
 * 唯品会 声明式导航 —— 由 docs/vipshop-replication/spec.json v1.1 编译。
 * 弹层(panel)走 searchParams,符合 module-contract「URL 驱动 UI」规则。
 * nav → transitions;state → uiStates[].actions。纯返回/关闭走 system.back(不建声明)。
 */
import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string, direction: 'vertical' | 'horizontal' = 'vertical') =>
  ({ name, direction, description }) as const;
const ds = (ref: string, param: string, labelField?: string) =>
  ({ ref, paramMapping: { [param]: 'id' }, labelField }) as const;

export const NAVIGATION_DECLARATION = {
  app: 'vipshop',
  routes: [
    // ---------------- 首页 ----------------
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [sc('home-feed', '首页瀑布流')],
      uiStates: [
        {
          id: 'vipshop.home.base', search: {}, description: '首页(品牌特卖;cat= 切换品类整页内容)',
          actions: [
            { id: 'home.category.select.target', label: '切换顶部一级品类', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.camera.disabled', label: '相机搜索(暂未开放)', behavior: 'other' },
            { id: 'home.svipBanner.disabled', label: '超V开通横幅(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { cat: 'string' },
      description: '首页:品类Tab+搜索栏+金刚区+秒杀+专场+瀑布流',
    },
    // ---------------- 登录 ----------------
    {
      path: '/login',
      component: 'LoginPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.login.base', search: {}, description: '验证码登录页',
          actions: [
            { id: 'login.phone.input', label: '输入手机号', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'login.agreement.toggle', label: '勾选服务条款', behavior: 'toggle' },
            { id: 'login.sms.open', label: '获取验证码(未勾协议先弹隐私弹窗)', behavior: 'open' },
          ],
        },
        {
          id: 'vipshop.login.privacy', search: { privacy: 'open' }, description: '隐私协议弹窗',
        },
      ],
      queryParams: {},
      description: '登录页(验证码登录)',
    },
    {
      path: '/login/sms',
      component: 'SmsCodePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.sms.base', search: {}, description: '验证码输入页',
          actions: [
            { id: 'sms.code.input', label: '输入验证码', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'sms.resend.submit', label: '重新发送', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '验证码输入页',
    },
    {
      path: '/login/oauth',
      component: 'OauthPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [{ id: 'vipshop.oauth.base', search: {}, description: '第三方授权确认(微信/QQ)' }],
      queryParams: { provider: 'string' },
      description: '第三方授权确认',
    },
    {
      path: '/login/pwd',
      component: 'PwdLoginPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.pwd.base', search: {}, description: '账号密码登录',
          actions: [{ id: 'pwd.field.input', label: '输入账号/密码', behavior: 'input', paramsSchema: { value: 'string' } }],
        },
      ],
      queryParams: {},
      description: '账号密码登录页',
    },
    // ---------------- 品类页(金刚区跳入) ----------------
    {
      path: '/category/:id',
      component: 'CategoryPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('category-feed', '品类商品流')],
      uiStates: [
        {
          id: 'vipshop.category.base', search: {}, description: '一级品类页(顶部二级智能分类 + 商品瀑布)',
          actions: [
            { id: 'category.subcat.select.target', label: '切换二级分类', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { sub: 'string' },
      description: '一级品类页',
    },
    // ---------------- 发现品牌 ----------------
    {
      path: '/discover',
      component: 'DiscoverPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('discover-body', '发现品牌聚合流')],
      uiStates: [{ id: 'vipshop.discover.base', search: {}, description: '发现品牌(专场/品牌聚合)' }],
      queryParams: {},
      description: '发现品牌聚合页',
    },
    {
      path: '/brand/:id',
      component: 'BrandEventPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('brand-body', '专场商品流')],
      uiStates: [
        {
          id: 'vipshop.brand.base', search: {}, description: '品牌特卖专场(超级大牌日,带倒计时)',
          actions: [
            { id: 'brand.subscribe.toggle', label: '订阅/取消专场', behavior: 'toggle' },
            { id: 'brand.subcat.select.target', label: '子分类tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'brand.sort.select.target', label: '排序(销量/价格/折扣)', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '品牌特卖专场',
    },
    {
      path: '/brands',
      component: 'BrandListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('brands-list', '大牌直通列表')],
      uiStates: [{ id: 'vipshop.brandList.base', search: {}, description: '大牌直通/专场列表' }],
      queryParams: {},
      description: '大牌直通/专场列表',
    },
    // ---------------- 限时秒杀 ----------------
    {
      path: '/flash',
      component: 'FlashPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('flash-list', '秒杀商品流')],
      uiStates: [
        {
          id: 'vipshop.flash.base', search: {}, description: '限时秒杀24H(无时间轴分场,仅品类tab)',
          actions: [
            { id: 'flash.category.select.target', label: '品类tab(精选/彩妆/家居/美容)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'flash.remind.submit', label: '设置开抢提醒', behavior: 'submit', scope: 'item', paramsSchema: { itemId: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '限时秒杀',
    },
    // ---------------- 搜索 ----------------
    {
      path: '/search',
      component: 'SearchLandingPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-landing', '搜索中间页')],
      uiStates: [
        {
          id: 'vipshop.searchLanding.base', search: {}, description: '搜索中间页(历史/猜你想搜/唯YOUNG热榜)',
          actions: [{ id: 'searchLanding.clearHistory.submit', label: '清空历史', behavior: 'submit' }],
        },
      ],
      queryParams: {},
      description: '搜索中间页',
    },
    {
      path: '/search/suggest',
      component: 'SearchSuggestPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-suggest', '联想词列表')],
      uiStates: [
        {
          id: 'vipshop.suggest.base', search: {}, description: '搜索联想页',
          actions: [{ id: 'suggest.camera.disabled', label: '相机入口(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: { q: 'string' },
      description: '搜索联想页',
    },
    {
      path: '/search/result',
      component: 'SearchResultPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-result', '搜索结果流')],
      uiStates: [
        {
          id: 'vipshop.searchResult.base', search: {}, description: '搜索结果页(找相似复用本页)',
          actions: [
            { id: 'searchResult.sort.select.target', label: '排序(综合/销量/价格/榜单)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'searchResult.chips.toggle', label: '快捷筛选chips', behavior: 'toggle', scope: 'item', paramsSchema: { chip: 'string' } },
            { id: 'searchResult.favorite.toggle', label: '收藏心标', behavior: 'toggle', scope: 'item', paramsSchema: { itemId: 'string' } },
          ],
        },
      ],
      queryParams: { q: 'string', sort: 'string' },
      description: '搜索结果页',
    },
    {
      path: '/search/filter',
      component: 'SearchFilterPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('filter-body', '筛选抽屉')],
      uiStates: [
        {
          id: 'vipshop.searchFilter.base', search: {}, description: '筛选抽屉(价格/品牌/色系/类型/功效/款型)',
          actions: [
            { id: 'searchFilter.option.toggle', label: '选中/取消筛选项', behavior: 'toggle', scope: 'item', paramsSchema: { option: 'string' } },
            { id: 'searchFilter.reset.submit', label: '重置筛选', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '筛选抽屉',
    },
    // ---------------- 商品详情 ----------------
    {
      path: '/detail/:id',
      component: 'DetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('detail-body', '详情滚动区'), sc('detail-gallery', '主图轮播', 'horizontal')],
      uiStates: [
        {
          id: 'vipshop.detail.base', search: {}, description: '商品详情页',
          actions: [
            { id: 'detail.gallery.select.target', label: '切换主图', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'detail.favorite.toggle', label: '收藏/取消', behavior: 'toggle' },
            { id: 'detail.sku.openForCart', label: '打开SKU面板(加购)', behavior: 'open' },
            { id: 'detail.sku.openForBuy', label: '打开SKU面板(立即购买)', behavior: 'open' },
            { id: 'detail.reviews.open', label: '打开评价弹层', behavior: 'open' },
            { id: 'detail.sizeInfo.open', label: '打开尺码表弹层', behavior: 'open' },
          ],
        },
        {
          id: 'vipshop.detail.sku', search: { panel: 'sku' }, description: 'SKU 选规格面板(mode=buy 时立即购买)',
          actions: [
            { id: 'sku.color.select.target', label: '选择颜色/版本', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'sku.size.select.target', label: '选择尺码', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'sku.qty.change', label: 'SKU数量增减', behavior: 'modify' },
            { id: 'sku.sizeInfo.open', label: '打开尺码表', behavior: 'open' },
            { id: 'sku.addToCart.submit', label: '加入购物车(toast+角标)', behavior: 'submit' },
          ],
        },
        {
          id: 'vipshop.detail.size', search: { panel: 'size' }, description: '尺码对照表弹层',
          actions: [{ id: 'size.unit.toggle', label: '切换对照单位', behavior: 'toggle' }],
        },
        {
          id: 'vipshop.detail.reviews', search: { panel: 'reviews' }, description: '评价弹层',
          actions: [
            { id: 'reviews.filter.select.target', label: '评价标签筛选', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'reviews.media.open', label: '查看评价大图', behavior: 'open', scope: 'item', paramsSchema: { reviewId: 'string' } },
          ],
        },
      ],
      queryParams: { mode: 'string' },
      description: '商品详情页',
    },
    // ---------------- 购物车 ----------------
    {
      path: '/cart',
      component: 'CartPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('cart-list', '购物车列表')],
      uiStates: [
        {
          id: 'vipshop.cart.base', search: {}, description: '购物车',
          actions: [
            { id: 'cart.item.select.toggle', label: '勾选购物车商品', behavior: 'toggle', scope: 'item', paramsSchema: { cartItemId: 'string' } },
            { id: 'cart.manage.toggle', label: '管理模式切换', behavior: 'toggle' },
            { id: 'cart.moveToFav.submit', label: '移入收藏', behavior: 'submit' },
            { id: 'cart.delete.submit', label: '删除选中', behavior: 'submit' },
            { id: 'cart.share.open', label: '打开分享弹层', behavior: 'open' },
            { id: 'cart.filterChips.toggle', label: '筛选chips(降价/库存紧张/常购)', behavior: 'toggle', scope: 'item', paramsSchema: { chip: 'string' } },
          ],
        },
        {
          id: 'vipshop.cart.share', search: { panel: 'share' }, description: '购物车分享弹层',
          actions: [{ id: 'share.channel.select.target', label: '分享渠道', behavior: 'select', paramsSchema: { target: 'string' } }],
        },
      ],
      queryParams: {},
      description: '购物车',
    },
    {
      path: '/cart/addon',
      component: 'CartAddonPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('addon-list', '凑单商品流')],
      uiStates: [{ id: 'vipshop.addon.base', search: {}, description: '凑单商品流(满减活动)' }],
      queryParams: {},
      description: '凑单商品流',
    },
    // ---------------- 下单 / 支付 ----------------
    {
      path: '/order/confirm',
      component: 'OrderConfirmPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('order-confirm', '确认订单滚动区')],
      uiStates: [
        {
          id: 'vipshop.orderConfirm.base', search: {}, description: '确认订单',
          actions: [
            { id: 'orderConfirm.coupon.open', label: '选择可用优惠券', behavior: 'open' },
            { id: 'orderConfirm.delivery.open', label: '展开配送方式', behavior: 'open' },
            { id: 'orderConfirm.payMethod.select.target', label: '选择支付方式', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'orderConfirm.svip.toggle', label: '勾选超V年卡', behavior: 'toggle' },
            { id: 'orderConfirm.detail.toggle', label: '展开金额明细', behavior: 'toggle' },
          ],
        },
        {
          id: 'vipshop.orderConfirm.coupon', search: { panel: 'coupon' }, description: '可用优惠券弹层',
          actions: [{ id: 'orderConfirm.couponPick.select.target', label: '选中一张券', behavior: 'select', scope: 'item', paramsSchema: { couponId: 'string' } }],
        },
      ],
      queryParams: {},
      description: '确认订单页',
    },
    {
      path: '/order/success',
      component: 'PaySuccessPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [{ id: 'vipshop.paySuccess.base', search: {}, description: '支付成功(模拟)' }],
      queryParams: { orderId: 'string' },
      description: '支付成功页',
    },
    // ---------------- 订单 ----------------
    {
      path: '/orders',
      component: 'OrdersPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('orders-list', '订单列表')],
      uiStates: [
        {
          id: 'vipshop.orders.base', search: {}, description: '订单列表(tab=all/pendingPayment/pendingReceipt/completed/canceled)',
          actions: [
            { id: 'orders.statusTab.select.target', label: '订单状态tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'orders.friendPay.disabled', label: '找朋友付(暂未开放)', behavior: 'other' },
            { id: 'orders.invoice.disabled', label: '发票详情(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '我的订单列表',
    },
    {
      path: '/orders/:id',
      component: 'OrderDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('order-detail', '订单详情滚动区')],
      uiStates: [
        {
          id: 'vipshop.orderDetail.base', search: {}, description: '订单详情(状态驱动)',
          actions: [
            { id: 'orderDetail.confirmReceipt.submit', label: '确认收货', behavior: 'submit' },
            { id: 'orderDetail.copyOrderNo.submit', label: '复制订单号', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '订单详情',
    },
    {
      path: '/orders/:id/refund',
      component: 'RefundPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('refund-body', '售后类型')],
      uiStates: [
        {
          id: 'vipshop.refund.base', search: {}, description: '选择服务类型(退货/售后)',
          actions: [
            { id: 'refund.priceGuard.open', label: '查看价格保护', behavior: 'open' },
            { id: 'refund.flow.disabled', label: '退换货流程(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '选择服务类型',
    },
    {
      path: '/orders/:id/refund/exchange',
      component: 'RefundExchangePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('exchange-body', '换货选择')],
      uiStates: [
        {
          id: 'vipshop.exchange.base', search: {}, description: '换货-选择款式/尺寸',
          actions: [
            { id: 'exchange.variant.select.target', label: '选择换货款式/尺寸', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '换货选择款式尺寸',
    },
    {
      path: '/orders/:id/refund/return',
      component: 'RefundReturnPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('return-body', '退货取件')],
      uiStates: [
        {
          id: 'vipshop.return.base', search: {}, description: '退货退款-确认与取件方式',
          actions: [
            { id: 'return.method.select.target', label: '选择取件方式', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'return.pickupTime.select.target', label: '选择上门取件时间', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '退货取件方式',
    },
    {
      path: '/orders/:id/refund/progress',
      component: 'RefundProgressPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.refundProgress.base', search: {}, description: '售后申请进度',
          actions: [{ id: 'refundProgress.cancel.submit', label: '撤销申请', behavior: 'submit' }],
        },
      ],
      queryParams: {},
      description: '售后申请进度页',
    },
    {
      path: '/orders/:id/logistics',
      component: 'LogisticsPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('logistics', '物流时间轴')],
      uiStates: [
        {
          id: 'vipshop.logistics.base', search: {}, description: '物流详情(时间轴)',
          actions: [
            { id: 'logistics.copyNo.submit', label: '复制快递单号', behavior: 'other' },
            { id: 'logistics.contactCourier.disabled', label: '联系快递(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '物流详情',
    },
    {
      path: '/orders/:id/trace',
      component: 'TracePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('trace-body', '溯源信息')],
      uiStates: [
        {
          id: 'vipshop.trace.base', search: {}, description: '唯品国际商品溯源',
          actions: [{ id: 'trace.report.toggle', label: '展开溯源报告', behavior: 'toggle' }],
        },
      ],
      queryParams: {},
      description: '商品溯源',
    },
    {
      path: '/orders/:id/review',
      component: 'ReviewWritePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.reviewWrite.base', search: {}, description: '评价填写页',
          actions: [
            { id: 'reviewWrite.rating.select.target', label: '评分/标签', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'reviewWrite.publish.submit', label: '发布评价', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '评价填写页',
    },
    // ---------------- 个人中心 ----------------
    {
      path: '/me',
      component: 'MinePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('mine-body', '我的滚动区')],
      uiStates: [
        {
          id: 'vipshop.mine.base', search: {}, description: '个人中心',
          actions: [
            { id: 'mine.wontfix.disabled', label: '领券中心/惊喜预告/签到/公益(暂未开放)', behavior: 'other' },
            { id: 'mine.svip.disabled', label: '超V开通(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '个人中心',
    },
    {
      path: '/favorites',
      component: 'FavoritesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('favorites-list', '收藏列表')],
      uiStates: [
        {
          id: 'vipshop.favorites.base', search: {}, description: '我的收藏(商品/品牌/穿搭 tab)',
          actions: [
            { id: 'favorites.tab.select.target', label: '收藏类型tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'favorites.manage.toggle', label: '进入管理', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '我的收藏',
    },
    {
      path: '/footprints',
      component: 'FootprintsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('footprints-list', '足迹列表')],
      uiStates: [
        {
          id: 'vipshop.footprints.base', search: {}, description: '我的足迹(按时间分组)',
          actions: [{ id: 'footprints.manage.toggle', label: '管理足迹', behavior: 'toggle' }],
        },
      ],
      queryParams: {},
      description: '我的足迹',
    },
    {
      path: '/coupons',
      component: 'CouponsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('coupons-list', '券列表')],
      uiStates: [
        {
          id: 'vipshop.coupons.base', search: {}, description: '我的优惠券',
          actions: [{ id: 'coupons.filter.select.target', label: '排序/类型筛选', behavior: 'select', paramsSchema: { target: 'string' } }],
        },
      ],
      queryParams: {},
      description: '我的优惠券',
    },
    {
      path: '/vipcoin',
      component: 'VipCoinPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.vipcoin.base', search: {}, description: '唯品币',
          actions: [{ id: 'vipcoin.earn.disabled', label: '去做任务赚币(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {},
      description: '唯品币',
    },
    {
      path: '/vipfloat',
      component: 'VipFloatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'vipshop.vipfloat.base', search: {}, description: '唯品花(关于为静态文案不可点)',
          actions: [{ id: 'vipfloat.apply.disabled', label: '查看额度/立即开通(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {},
      description: '唯品花',
    },
    // ---------------- 地址 ----------------
    {
      path: '/address',
      component: 'AddressListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('address-list', '地址列表')],
      uiStates: [
        {
          id: 'vipshop.address.base', search: {}, description: '收货地址列表',
          actions: [{ id: 'address.delete.submit', label: '删除地址', behavior: 'submit', scope: 'item', paramsSchema: { addressId: 'string' } }],
        },
      ],
      queryParams: { mode: 'string' },
      description: '收货地址列表',
    },
    {
      path: '/address/edit',
      component: 'AddressEditPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('address-edit', '地址表单')],
      uiStates: [
        {
          id: 'vipshop.addressEdit.base', search: {}, description: '新增/编辑地址',
          actions: [
            { id: 'addressEdit.region.open', label: '省市区选择器', behavior: 'open' },
            { id: 'addressEdit.smartFill.submit', label: '智能填写解析', behavior: 'submit' },
            { id: 'addressEdit.detail.input', label: '详细地址输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'addressEdit.tag.select.target', label: '地址类型标签', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'addressEdit.default.toggle', label: '设为默认', behavior: 'toggle' },
            { id: 'addressEdit.locate.disabled', label: '定位(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'vipshop.addressEdit.region', search: { region: 'open' }, description: '省市区选择器弹层',
          actions: [{ id: 'regionPicker.area.select.target', label: '逐级选择地区', behavior: 'select', paramsSchema: { target: 'string' } }],
        },
      ],
      queryParams: { id: 'string' },
      description: '新增/编辑地址',
    },
    // ---------------- 设置 ----------------
    {
      path: '/settings',
      component: 'SettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('settings-body', '设置列表')],
      uiStates: [
        {
          id: 'vipshop.settings.base', search: {}, description: '设置',
          actions: [
            { id: 'settings.generic.disabled', label: '账号与安全/支付/推送(暂未开放)', behavior: 'other' },
            { id: 'settings.appearance.toggle', label: '深浅外观切换', behavior: 'toggle' },
            { id: 'settings.clearCache.submit', label: '清除缓存', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '设置',
    },
    // ---------------- 消息 ----------------
    {
      path: '/messages',
      component: 'MessageListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('message-list', '消息列表')],
      uiStates: [
        {
          id: 'vipshop.messages.base', search: {}, description: '消息中心(分类+子tab)',
          actions: [{ id: 'message.subtab.select.target', label: '子tab(物流/动态/降价)', behavior: 'select', paramsSchema: { target: 'string' } }],
        },
      ],
      queryParams: {},
      description: '消息中心',
    },
    {
      path: '/messages/chat',
      component: 'ChatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('chat-messages', '会话流')],
      uiStates: [
        {
          id: 'vipshop.chat.base', search: {}, description: '唯小蜜客服会话',
          actions: [
            { id: 'chat.faq.select.target', label: '猜你想问卡片', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'chat.menu.select.target', label: '快捷菜单', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'chat.coupon.submit', label: '券卡领取', behavior: 'submit' },
            { id: 'chat.message.send', label: '发送消息', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '唯小蜜客服会话',
    },
    {
      path: '/messages/pricedrop',
      component: 'PriceDropPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('pricedrop-list', '降价商品列表')],
      uiStates: [{ id: 'vipshop.pricedrop.base', search: {}, description: '降价提醒' }],
      queryParams: {},
      description: '降价提醒',
    },
  ],
  transitions: [
    // ---- TabBar(chrome.tabbar) ----
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '首页 Tab', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'tabbar.favorites-open', from: '*', to: '/favorites', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '收藏 Tab', ui: { placement: 'tabbar', icon: 'heart', gesture: 'tap' } },
    { id: 'tabbar.discover-open', from: '*', to: '/discover', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '发现品牌 Tab', ui: { placement: 'tabbar', icon: 'compass', gesture: 'tap' } },
    { id: 'tabbar.cart-open', from: '*', to: '/cart', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '购物车 Tab', ui: { placement: 'tabbar', icon: 'cart', gesture: 'tap' } },
    { id: 'tabbar.mine-open', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '个人中心 Tab', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },

    // ---- 首页 ----
    { id: 'home.search-open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '点击搜索栏', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'home.flash-open', from: '/', to: '/flash', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '限时秒杀入口', ui: { placement: 'content', icon: 'flash', gesture: 'tap' } },
    { id: 'home.category-open', from: '/', to: '/category/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '金刚区分类 → 一级品类页', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'category.item-open', from: '/category/:id', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '品类页商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'home.event-open', from: '/', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '大牌闪降/专场卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },
    { id: 'home.item-open', from: '/', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '今日特卖/瀑布流商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'home.message-open', from: '/', to: '/messages', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '消息铃铛', ui: { placement: 'topbar', icon: 'bell', gesture: 'tap' } },

    // ---- 登录 ----
    { id: 'privacy.agree-open', from: { path: '/login', search: { privacy: 'open' } }, to: '/login/sms',
      search: { privacy: null }, searchParams: {}, mode: 'push', params: {},
      label: '隐私弹窗-同意并继续', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'login.oneClick-open', from: '/login', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '本机号一键登录', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'login.wechat-open', from: '/login', to: '/login/oauth', search: {}, searchParams: { provider: 'string' }, mode: 'push', params: {},
      label: '微信登录', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'login.qq-open', from: '/login', to: '/login/oauth', search: {}, searchParams: { provider: 'string' }, mode: 'push', params: {},
      label: 'QQ登录', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'login.pwd-open', from: '/login', to: '/login/pwd', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '账号密码登录', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'login.close-open', from: '/login', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '关闭×回个人中心(未登录)', ui: { placement: 'topbar', icon: 'close', gesture: 'tap' } },
    { id: 'sms.confirm-open', from: '/login/sms', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '验证码确定进首页', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'oauth.confirm-open', from: '/login/oauth', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '授权确认登录进首页', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'pwd.login-open', from: '/login/pwd', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '账号密码登录进首页', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },

    // ---- 发现品牌 / 专场 ----
    { id: 'discover.event-open', from: '/discover', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '专场卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },
    { id: 'discover.brand-open', from: '/discover', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '品牌卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },
    { id: 'discover.item-open', from: '/discover', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '发现商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'brand.filter-open', from: '/brand/:id', to: '/search/filter', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '专场筛选', ui: { placement: 'content', icon: 'filter', gesture: 'tap' } },
    { id: 'brand.item-open', from: '/brand/:id', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '专场商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'brandList.event-open', from: '/brands', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '进入专场', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },
    { id: 'brandList.brand-open', from: '/brands', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '大牌品牌卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },

    // ---- 秒杀 ----
    { id: 'flash.grab-open', from: '/flash', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '秒杀抢按钮', ui: { placement: 'content', icon: 'flash', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'flash.item-open', from: '/flash', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '秒杀商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },

    // ---- 搜索 ----
    { id: 'searchLanding.suggest-open', from: '/search', to: '/search/suggest', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '输入词进入联想', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'searchLanding.history-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '历史搜索词', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'searchLanding.hot-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '热榜/发现词', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'suggest.word-open', from: '/search/suggest', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '联想词', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'searchResult.filter-open', from: '/search/result', to: '/search/filter', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '全部筛选', ui: { placement: 'content', icon: 'filter', gesture: 'tap' } },
    { id: 'searchResult.item-open', from: '/search/result', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '结果商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'searchResult.searchBox-open', from: '/search/result', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '结果页搜索框回中间页', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'searchFilter.confirm-open', from: '/search/filter', to: '/search/result', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '筛选确认', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },

    // ---- 详情 ----
    { id: 'detail.service-open', from: '/detail/:id', to: '/messages/chat', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '详情客服(唯小蜜)', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'detail.findSimilar-open', from: '/detail/:id', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '找相似', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'detail.brand-open', from: '/detail/:id', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '品牌店铺入口', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },
    { id: 'sku.buyNow-open', from: { path: '/detail/:id', search: { panel: 'sku' } }, to: '/cart', search: {}, searchParams: {}, mode: 'push', params: {},
      label: 'SKU-立即购买(加购锁定去购物车下单)', ui: { placement: 'content', icon: 'cart', gesture: 'tap' } },

    // ---- 购物车 / 下单 ----
    { id: 'cart.sku-open', from: '/cart', to: '/detail/:id', search: { panel: 'sku' }, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '购物车-数量/规格', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'cart.addon-open', from: '/cart', to: '/cart/addon', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '去凑单', ui: { placement: 'content', icon: 'gift', gesture: 'tap' } },
    { id: 'cart.checkout-open', from: '/cart', to: '/order/confirm', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '结算', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'cart.item-open', from: '/cart', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '购物车商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'addon.item-open', from: '/cart/addon', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '凑单商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'orderConfirm.address-open', from: '/order/confirm', to: '/address', search: { mode: 'select' }, searchParams: {}, mode: 'push', params: {},
      label: '收货地址卡', ui: { placement: 'content', icon: 'location', gesture: 'tap' } },
    { id: 'orderConfirm.submit-open', from: '/order/confirm', to: '/order/success', search: {}, searchParams: { orderId: 'string' }, mode: 'push', params: {},
      label: '提交订单(模拟支付成功)', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },

    // ---- 支付成功 ----
    { id: 'paySuccess.orders-open', from: '/order/success', to: '/orders', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '查看订单', ui: { placement: 'content', icon: 'receipt', gesture: 'tap' } },
    { id: 'paySuccess.home-open', from: '/order/success', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '返回首页', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },

    // ---- 订单 ----
    { id: 'orders.detail-open', from: '/orders', to: '/orders/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '订单卡', ui: { placement: 'content', icon: 'receipt', gesture: 'tap' }, dataSource: ds('orders', 'id', 'orderNo') },
    { id: 'orders.pay-open', from: '/orders', to: '/order/success', search: {}, searchParams: { orderId: 'string' }, mode: 'push', params: {},
      label: '待付款-付款', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'orders.refund-open', from: '/orders', to: '/orders/:id/refund', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '申请售后', ui: { placement: 'content', icon: 'refund', gesture: 'tap' }, dataSource: ds('orders', 'id', 'orderNo') },
    { id: 'orders.buyAgain-open', from: '/orders', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '再次购买', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'orders.review-open', from: '/orders', to: '/orders/:id/review', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '评价有礼', ui: { placement: 'content', icon: 'star', gesture: 'tap' }, dataSource: ds('orders', 'id', 'orderNo') },
    { id: 'orderDetail.pay-open', from: '/orders/:id', to: '/order/success', search: {}, searchParams: { orderId: 'string' }, mode: 'push', params: {},
      label: '继续付款', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'orderDetail.logistics-open', from: '/orders/:id', to: '/orders/:id/logistics', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '查看物流', ui: { placement: 'content', icon: 'truck', gesture: 'tap' } },
    { id: 'orderDetail.refund-open', from: '/orders/:id', to: '/orders/:id/refund', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '订单详情-申请售后', ui: { placement: 'content', icon: 'refund', gesture: 'tap' } },
    { id: 'orderDetail.trace-open', from: '/orders/:id', to: '/orders/:id/trace', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '商品溯源', ui: { placement: 'content', icon: 'shield', gesture: 'tap' } },
    { id: 'orderDetail.service-open', from: '/orders/:id', to: '/messages/chat', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '订单客服(唯小蜜)', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'refund.exchange-open', from: '/orders/:id/refund', to: '/orders/:id/refund/exchange', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '免费换货 → 选款式尺寸', ui: { placement: 'content', icon: 'refund', gesture: 'tap' } },
    { id: 'refund.return-open', from: '/orders/:id/refund', to: '/orders/:id/refund/return', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '退货退款 → 确认取件方式', ui: { placement: 'content', icon: 'refund', gesture: 'tap' } },
    { id: 'exchange.confirm-open', from: '/orders/:id/refund/exchange', to: '/orders/:id/refund/progress', search: {}, searchParams: {}, mode: 'replace', params: { id: 'string' },
      label: '确认换货申请', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'return.confirm-open', from: '/orders/:id/refund/return', to: '/orders/:id/refund/progress', search: {}, searchParams: {}, mode: 'replace', params: { id: 'string' },
      label: '确认退货退款', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },

    // ---- 个人中心 ----
    { id: 'mine.orders-open', from: '/me', to: '/orders', search: {}, searchParams: { tab: 'string' }, mode: 'push', params: {},
      label: '订单入口(可带状态tab)', ui: { placement: 'content', icon: 'receipt', gesture: 'tap' } },
    { id: 'mine.favorites-open', from: '/me', to: '/favorites', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '我的收藏', ui: { placement: 'content', icon: 'heart', gesture: 'tap' } },
    { id: 'mine.footprints-open', from: '/me', to: '/footprints', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '我的足迹', ui: { placement: 'content', icon: 'footprint', gesture: 'tap' } },
    { id: 'mine.subscribe-open', from: '/me', to: '/discover', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '订阅(去发现品牌)', ui: { placement: 'content', icon: 'compass', gesture: 'tap' } },
    { id: 'mine.coupons-open', from: '/me', to: '/coupons', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '优惠券', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'mine.vipcoin-open', from: '/me', to: '/vipcoin', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '唯品币', ui: { placement: 'content', icon: 'coins', gesture: 'tap' } },
    { id: 'mine.vipfloat-open', from: '/me', to: '/vipfloat', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '唯品花', ui: { placement: 'content', icon: 'wallet', gesture: 'tap' } },
    { id: 'mine.service-open', from: '/me', to: '/messages/chat', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '唯品客服(唯小蜜)', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'mine.settings-open', from: '/me', to: '/settings', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'mine.item-open', from: '/me', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '猜你喜欢商品', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },

    // ---- 收藏 / 足迹 ----
    { id: 'favorites.findSimilar-open', from: '/favorites', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '收藏-找相似', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'favorites.addCart-open', from: '/favorites', to: '/detail/:id', search: { panel: 'sku' }, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '收藏-加购', ui: { placement: 'content', icon: 'cart', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'favorites.buy-open', from: '/favorites', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '收藏-去购买', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
    { id: 'favorites.priceAlert-open', from: '/favorites', to: '/messages/pricedrop', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '收藏-降价提醒', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'footprints.item-open', from: '/footprints', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '足迹商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },

    // ---- 券 ----
    { id: 'coupons.use-open', from: '/coupons', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '券-去使用(进可用商品列表)', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },

    // ---- 地址 ----
    { id: 'address.new-open', from: '/address', to: '/address/edit', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '新增收货地址', ui: { placement: 'topbar', icon: 'plus', gesture: 'tap' } },
    { id: 'address.edit-open', from: '/address', to: '/address/edit', search: {}, searchParams: { id: 'string' }, mode: 'push', params: {},
      label: '编辑地址', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'address.select-confirm', from: { path: '/address', search: { mode: 'select' } }, to: '/order/confirm', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '选中地址返回结算(回填)', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'addressEdit.save-open', from: '/address/edit', to: '/address', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '保存地址回列表', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },

    // ---- 设置 ----
    { id: 'settings.logout-open', from: '/settings', to: '/login', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '切换账号/退出登录', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },

    // ---- 消息 ----
    { id: 'message.category-open', from: '/messages', to: '/messages/chat', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '客服/优惠消息(汇入唯小蜜)', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'message.brand-open', from: '/messages', to: '/brand/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '品牌动态 → 品牌主页', ui: { placement: 'content', icon: 'shop', gesture: 'tap' }, dataSource: ds('brands', 'id', 'name') },
    { id: 'message.logistics-open', from: '/messages', to: '/orders/:id/logistics', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '物流更新 → 该订单物流详情', ui: { placement: 'content', icon: 'truck', gesture: 'tap' }, dataSource: ds('orders', 'id', 'orderNo') },
    { id: 'message.subscribe-open', from: '/messages', to: '/discover', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '订阅上新 → 发现品牌', ui: { placement: 'content', icon: 'compass', gesture: 'tap' } },
    { id: 'message.account-open', from: '/messages', to: '/coupons', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '账户通知 → 优惠券', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'message.pricedrop-open', from: '/messages', to: '/messages/pricedrop', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '降价提醒条目', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'pricedrop.item-open', from: '/messages/pricedrop', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '降价商品', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('items', 'id', 'title') },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
