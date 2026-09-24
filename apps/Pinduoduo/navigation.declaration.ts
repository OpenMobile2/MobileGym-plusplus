import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string) =>
  ({ name, direction: 'vertical', description }) as const;

// 从 spec.json v1.0 翻写。id 与 spec 交互一一对应(nav=transitions,state/none=uiStates[].actions)。
export const NAVIGATION_DECLARATION = {
  app: 'pinduoduo',
  routes: [
    // ——— 主 Tab ———
    {
      path: '/', component: 'HomePage', params: {}, entryPoint: 'home',
      scrollContainers: [sc('home-feed', '首页推荐流')],
      uiStates: [
        {
          id: 'pdd.home.base', search: {}, description: '首页',
          actions: [
            { id: 'home.feedtab.switch', label: '切换首页分类', behavior: 'other', paramsSchema: { tab: 'string' } },
            { id: 'home.camera.wontfix', label: '拍照购(暂未开放)', behavior: 'other' },
            { id: 'home.marketing.wontfix', label: '营销玩法(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {}, description: '首页',
    },
    {
      path: '/video', component: 'VideoStubPage', params: {}, entryPoint: 'none',
      scrollContainers: [], uiStates: [{ id: 'pdd.video.base', search: {}, description: '多多视频(占位)' }],
      queryParams: {}, description: '多多视频占位',
    },
    {
      path: '/subsidy', component: 'SubsidyPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('subsidy-feed', '百亿补贴流')],
      uiStates: [
        {
          id: 'pdd.subsidy.base', search: {}, description: '百亿补贴',
          actions: [{ id: 'subsidy.tab.select.channel', label: '切换补贴频道', behavior: 'select', paramsSchema: { tab: 'string' } }],
        },
      ],
      queryParams: {}, description: '百亿补贴频道',
    },
    {
      path: '/chat', component: 'ChatListPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('chat-list', '会话列表')],
      uiStates: [
        {
          id: 'pdd.chat.base', search: {}, description: '聊天',
          actions: [{ id: 'chat.subsidy.wontfix', label: '专属补贴(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {}, description: '聊天列表',
    },
    {
      path: '/me', component: 'MinePage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('mine-scroll', '个人中心')],
      uiStates: [
        {
          id: 'pdd.mine.base', search: {}, description: '个人中心',
          actions: [{ id: 'mine.monthcard.wontfix', label: '省钱月卡(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {}, description: '个人中心',
    },

    // ——— 搜索 ———
    {
      path: '/search', component: 'SearchPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('search-landing', '搜索中间页')],
      uiStates: [
        {
          id: 'pdd.search.base', search: {}, description: '搜索中间页/联想',
          actions: [
            { id: 'search.input.type', label: '搜索词输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'search.history.clear', label: '清空搜索历史', behavior: 'modify' },
          ],
        },
      ],
      queryParams: { q: 'string' }, description: '搜索',
    },
    {
      path: '/search-result', component: 'SearchResultPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('result-feed', '搜索结果流')],
      uiStates: [
        {
          id: 'pdd.result.base', search: {}, description: '搜索结果',
          actions: [
            { id: 'result.sort.select.comprehensive', label: '综合排序', behavior: 'select' },
            { id: 'result.sort.select.sales', label: '销量排序', behavior: 'select' },
            { id: 'result.sort.select.price', label: '价格排序', behavior: 'select' },
          ],
        },
        {
          id: 'pdd.result.filter', search: { drawer: 'filter' }, description: '筛选抽屉',
          actions: [
            { id: 'result.filter.apply', label: '应用筛选', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { q: 'string' }, description: '搜索结果',
    },

    // ——— 分类 ———
    {
      path: '/category', component: 'CategoryPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('category-right', '分类右侧')],
      uiStates: [
        {
          id: 'pdd.category.base', search: {}, description: '分类',
          actions: [
            { id: 'category.select.group', label: '切换类目', behavior: 'select', paramsSchema: { cat: 'string' } },
            { id: 'category.swipe.switch', label: '左右滑切类目', behavior: 'other' },
          ],
        },
      ],
      queryParams: {}, description: '分类',
    },

    // ——— 商品详情 + SKU/收银台/密码 panel ———
    {
      path: '/item/:itemId', component: 'ItemDetailPage', params: { itemId: 'string' }, entryPoint: 'none',
      scrollContainers: [sc('item-detail', '商品详情滚动区'), { name: 'item-gallery', direction: 'horizontal', description: '主图轮播' }],
      uiStates: [
        {
          id: 'pdd.item.base', search: {}, description: '商品详情',
          actions: [
            { id: 'detail.favorite.toggle', label: '收藏/取消收藏', behavior: 'toggle' },
            { id: 'detail.report.wontfix', label: '举报(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'pdd.item.sku', search: { panel: 'sku' }, description: 'SKU 下单弹层',
          actions: [
            { id: 'sku.spec.select.option', label: '选择规格', behavior: 'select', scope: 'item', paramsSchema: { spec: 'string', option: 'string' } },
            { id: 'sku.qty.step', label: '增减数量', behavior: 'modify', paramsSchema: { delta: 'number' } },
            { id: 'sku.pay.switch', label: '切换支付方式', behavior: 'other', paramsSchema: { method: 'string' } },
          ],
        },
        {
          id: 'pdd.item.pay', search: { panel: 'pay' }, description: '收银台(选支付方式)',
          actions: [
            { id: 'cashier.method.select.option', label: '选支付方式', behavior: 'select', paramsSchema: { method: 'string' } },
          ],
        },
        {
          id: 'pdd.item.pwd', search: { panel: 'pwd' }, description: '支付密码键盘',
          actions: [
            { id: 'paypwd.digit.input', label: '输入密码位', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'paypwd.recover.wontfix', label: '找回密码(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'pdd.item.share', search: { panel: 'share' }, description: '分享弹层' },
        { id: 'pdd.item.params', search: { panel: 'params' }, description: '商品参数弹层' },
      ],
      queryParams: {}, description: '商品详情页',
    },
    {
      path: '/item/:itemId/reviews', component: 'ReviewListPage', params: { itemId: 'string' }, entryPoint: 'none',
      scrollContainers: [sc('reviews-list', '评价列表')],
      uiStates: [
        {
          id: 'pdd.reviews.base', search: {}, description: '评价列表',
          actions: [
            { id: 'reviews.filter.select.tag', label: '按标签筛选评价', behavior: 'select', paramsSchema: { tag: 'string' } },
            { id: 'reviews.image.preview', label: '查看评价大图', behavior: 'open' },
          ],
        },
      ],
      queryParams: {}, description: '评价列表',
    },

    // ——— 拼单/下单成功/支付成功 ———
    {
      path: '/group', component: 'GroupWaitingPage', params: {}, entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'pdd.group.base', search: {}, description: '等待成团',
          actions: [
            { id: 'group.invite.share', label: '邀请好友拼单', behavior: 'other' },
            { id: 'group.solo.finish', label: '直接免拼(1人成团)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {}, description: '等待成团',
    },
    {
      path: '/order-success', component: 'OrderSuccessPage', params: {}, entryPoint: 'none',
      scrollContainers: [], uiStates: [{ id: 'pdd.ordersuccess.base', search: {}, description: '下单成功' }],
      queryParams: {}, description: '下单成功',
    },
    {
      path: '/pay-success', component: 'PaySuccessPage', params: {}, entryPoint: 'none',
      scrollContainers: [], uiStates: [{ id: 'pdd.paysuccess.base', search: {}, description: '支付成功' }],
      queryParams: {}, description: '支付成功',
    },

    // ——— 店铺 ———
    {
      path: '/shop/:shopId', component: 'ShopPage', params: { shopId: 'string' }, entryPoint: 'none',
      scrollContainers: [sc('shop-feed', '店铺商品流')],
      uiStates: [
        {
          id: 'pdd.shop.base', search: {}, description: '店铺',
          actions: [
            { id: 'shop.tab.select.section', label: '切换店铺Tab', behavior: 'select', paramsSchema: { tab: 'string' } },
            { id: 'shop.follow.toggle', label: '关注/取消关注', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {}, description: '店铺页',
    },

    // ——— 订单 ———
    {
      path: '/orders', component: 'OrdersPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('orders-list', '订单列表')],
      uiStates: [
        {
          id: 'pdd.orders.base', search: {}, description: '我的订单',
          actions: [
            { id: 'orders.tab.select.status', label: '切换订单状态Tab', behavior: 'select', paramsSchema: { status: 'string' } },
            { id: 'orders.remind.ship', label: '催发货', behavior: 'other' },
            { id: 'orders.pay.now', label: '立即付款', behavior: 'submit' },
            { id: 'orders.cancel.confirm', label: '取消订单', behavior: 'other' },
            { id: 'orders.receipt.confirm', label: '确认收货', behavior: 'submit' },
            { id: 'orders.group.solo', label: '直接免拼', behavior: 'submit' },
          ],
        },
        {
          id: 'pdd.orders.quickRefund', search: { refund: 'quick' }, description: '极速退款弹层',
          actions: [
            { id: 'orders.quickrefund.confirm', label: '确认退款', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { status: 'string' }, description: '我的订单',
    },
    {
      path: '/orders/:orderId', component: 'OrderDetailPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: [sc('orderdetail-scroll', '订单详情')],
      uiStates: [
        {
          id: 'pdd.orderdetail.base', search: {}, description: '订单详情',
          actions: [{ id: 'orderdetail.group.solo', label: '直接免拼', behavior: 'submit' }],
        },
        {
          id: 'pdd.orderdetail.quickRefund', search: { refund: 'quick' }, description: '极速退款弹层',
          actions: [
            { id: 'orderdetail.quickrefund.confirm', label: '确认退款', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {}, description: '订单详情',
    },
    {
      path: '/orders/:orderId/logistics', component: 'LogisticsPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: [sc('logi-scroll', '物流轨迹')],
      uiStates: [
        {
          id: 'pdd.logistics.base', search: {}, description: '物流轨迹',
          actions: [{ id: 'logistics.copy.trackno', label: '复制单号', behavior: 'other' }],
        },
      ],
      queryParams: {}, description: '物流轨迹',
    },
    {
      path: '/orders/:orderId/invoice', component: 'InvoicePage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'pdd.invoice.base', search: {}, description: '发票信息',
          actions: [
            { id: 'invoice.title.select.type', label: '抬头类型', behavior: 'select', paramsSchema: { type: 'string' } },
            { id: 'invoice.form.submit', label: '提交发票', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {}, description: '发票信息',
    },
    {
      path: '/orders/:orderId/review', component: 'WriteReviewPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'pdd.writereview.base', search: {}, description: '写评价',
          actions: [
            { id: 'writereview.rating.set', label: '设定星级', behavior: 'modify', paramsSchema: { rating: 'number' } },
            { id: 'writereview.form.submit', label: '提交评价', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {}, description: '写评价',
    },

    // ——— 售后 ———
    {
      path: '/aftersale', component: 'AftersaleListPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('aftersale-list', '售后列表')],
      uiStates: [
        {
          id: 'pdd.aftersale.base', search: {}, description: '退款/售后',
          actions: [{ id: 'aftersale.refundflow.show', label: '钱款去向', behavior: 'open' }],
        },
      ],
      queryParams: {}, description: '退款/售后',
    },
    {
      path: '/aftersale/apply', component: 'RefundFormPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('refundform-scroll', '退款表单')],
      uiStates: [
        {
          id: 'pdd.refundform.base', search: {}, description: '申请退款(填表)',
          actions: [
            { id: 'refundform.reason.select', label: '选择退款原因', behavior: 'modify', paramsSchema: { reason: 'string' } },
            { id: 'refundform.form.submit', label: '提交退款申请', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { orderId: 'string' }, description: '申请退款填表',
    },

    // ——— 地址 ———
    {
      path: '/address', component: 'AddressListPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('address-list', '地址列表')],
      uiStates: [
        {
          id: 'pdd.address.base', search: {}, description: '收货地址',
          actions: [
            { id: 'address.item.choose', label: '选择该地址', behavior: 'other' },
            { id: 'address.item.setdefault', label: '设为默认', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {}, description: '收货地址',
    },
    {
      path: '/address/edit', component: 'AddressEditPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('addressedit-scroll', '地址表单')],
      uiStates: [
        {
          id: 'pdd.addressedit.base', search: {}, description: '编辑地址',
          actions: [
            { id: 'address.region.open', label: '打开省市区选择器', behavior: 'open' },
            { id: 'address.default.toggle', label: '设为默认', behavior: 'toggle' },
            { id: 'address.form.save', label: '保存地址', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { id: 'string' }, description: '编辑地址',
    },

    // ——— 收藏/足迹/券/钱包 ———
    {
      path: '/favorites', component: 'FavoritesPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('favorites-list', '收藏列表')],
      uiStates: [
        {
          id: 'pdd.favorites.base', search: {}, description: '商品收藏',
          actions: [
            { id: 'favorites.manage.toggle', label: '进入/退出管理态', behavior: 'toggle' },
            { id: 'favorites.list.remove', label: '删除收藏', behavior: 'modify' },
          ],
        },
      ],
      queryParams: {}, description: '商品收藏',
    },
    {
      path: '/footprint', component: 'FootprintPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('footprint-list', '足迹列表')],
      uiStates: [
        {
          id: 'pdd.footprint.base', search: {}, description: '历史浏览',
          actions: [{ id: 'footprint.tab.select.type', label: '切换记录类型', behavior: 'select', paramsSchema: { type: 'string' } }],
        },
      ],
      queryParams: {}, description: '历史浏览',
    },
    {
      path: '/coupons', component: 'CouponsPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('coupons-list', '券列表')],
      uiStates: [
        {
          id: 'pdd.coupons.base', search: {}, description: '我的优惠券',
          actions: [{ id: 'coupon.tab.select.type', label: '切换券分类', behavior: 'select', paramsSchema: { tab: 'string' } }],
        },
      ],
      queryParams: {}, description: '我的优惠券',
    },
    {
      path: '/coupon-center', component: 'CouponCenterPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('couponcenter-list', '领券中心')],
      uiStates: [
        {
          id: 'pdd.couponcenter.base', search: {}, description: '领券中心',
          actions: [
            { id: 'couponcenter.item.claim', label: '领取券', behavior: 'submit' },
            { id: 'couponcenter.timed.wontfix', label: '整点抢券(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {}, description: '领券中心',
    },
    {
      path: '/wallet', component: 'WalletPage', params: {}, entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'pdd.wallet.base', search: {}, description: '多多钱包',
          actions: [{ id: 'wallet.security.wontfix', label: '银行卡/安全(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {}, description: '多多钱包',
    },
    {
      path: '/wallet/transactions', component: 'WalletTxnsPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('wallettxn-list', '交易记录')],
      uiStates: [
        {
          id: 'pdd.wallettxn.base', search: {}, description: '交易记录',
          actions: [{ id: 'wallettxn.detail.show', label: '交易详情', behavior: 'open' }],
        },
      ],
      queryParams: {}, description: '交易记录',
    },

    // ——— 设置 ———
    {
      path: '/settings', component: 'SettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('settings-scroll', '设置')],
      uiStates: [
        {
          id: 'pdd.settings.base', search: {}, description: '设置',
          actions: [
            { id: 'settings.misc.stub', label: '其它设置项(暂未开放)', behavior: 'other' },
            { id: 'settings.logout.confirm', label: '退出登录', behavior: 'other' },
          ],
        },
      ],
      queryParams: {}, description: '设置',
    },
    {
      path: '/settings/fufei', component: 'FufeiSettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'pdd.fufei.base', search: {}, description: '先用后付设置',
          actions: [{ id: 'fufei.switch.toggle', label: '开关先用后付', behavior: 'toggle' }],
        },
      ],
      queryParams: {}, description: '先用后付设置',
    },
    {
      path: '/settings/appearance', component: 'AppearanceSettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'pdd.appearance.base', search: {}, description: '外观与语言',
          actions: [
            { id: 'appearance.language.select', label: '切换语言', behavior: 'modify', paramsSchema: { lang: 'string' } },
            { id: 'appearance.fontsize.set', label: '调整字号', behavior: 'modify', paramsSchema: { scale: 'number' } },
            { id: 'appearance.darkmode.select', label: '切换深色模式', behavior: 'modify', paramsSchema: { mode: 'string' } },
          ],
        },
      ],
      queryParams: {}, description: '外观与语言',
    },

    // ——— 消息 ———
    {
      path: '/chat/notification', component: 'NotificationPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('notification-list', '交易通知')],
      uiStates: [{ id: 'pdd.notification.base', search: {}, description: '交易通知' }],
      queryParams: {}, description: '交易通知',
    },
    {
      path: '/chat/:chatId', component: 'ConversationPage', params: { chatId: 'string' }, entryPoint: 'none',
      scrollContainers: [sc('conversation-scroll', '会话消息')],
      uiStates: [
        {
          id: 'pdd.conversation.base', search: {}, description: '会话',
          actions: [
            { id: 'conversation.message.send', label: '发送消息', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'conversation.quick.ask', label: '快捷问题', behavior: 'other', paramsSchema: { question: 'string' } },
          ],
        },
      ],
      queryParams: {}, description: '客服/店铺会话',
    },
    {
      path: '/cs', component: 'CsWorkbenchPage', params: {}, entryPoint: 'none',
      scrollContainers: [sc('cs-scroll', '客服工作台')],
      uiStates: [
        {
          id: 'pdd.cs.base', search: {}, description: '官方客服工作台',
          actions: [{ id: 'cs.misc.wontfix', label: '其它客服功能(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {}, description: '官方客服工作台',
    },
  ],

  transitions: [
    // —— TabBar ——
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '首页 Tab', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'tabbar.video-open', from: '*', to: '/video', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '多多视频 Tab', ui: { placement: 'tabbar', icon: 'video', gesture: 'tap' } },
    { id: 'tabbar.subsidy-open', from: '*', to: '/subsidy', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '百亿补贴 Tab', ui: { placement: 'tabbar', icon: 'tag', gesture: 'tap' } },
    { id: 'tabbar.chat-open', from: '*', to: '/chat', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '聊天 Tab', ui: { placement: 'tabbar', icon: 'chat', gesture: 'tap' } },
    { id: 'tabbar.mine-open', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '个人中心 Tab', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },

    // —— 首页 ——
    { id: 'home.search-open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '首页搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'home.subsidy-open', from: '/', to: '/subsidy', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚位-百亿补贴', ui: { placement: 'content', icon: 'tag', gesture: 'tap' } },
    { id: 'home.category-open', from: '/', to: '/category', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚位-分类', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'home.item-open', from: '/', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '首页商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },
    { id: 'home.item-quickbuy', from: '/', to: '/item/:itemId', search: { panel: 'sku' }, searchParams: { mode: 'string' }, mode: 'push', params: { itemId: 'string' }, label: '首页商品+加购(直接开SKU)', ui: { placement: 'content', icon: 'plus', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },

    // —— 搜索 ——
    { id: 'subsidy.search-open', from: '/subsidy', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '补贴页搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'search.submit', from: ['/search', '/search-result'], to: '/search-result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '提交搜索', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'search.suggest-open', from: '/search', to: '/search-result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '联想词/历史词', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'result.item-open', from: '/search-result', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '结果商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },
    { id: 'result.filter.show', from: '/search-result', to: '/search-result', search: { drawer: 'filter' }, searchParams: {}, mode: 'push', params: {}, label: '打开筛选抽屉', ui: { placement: 'topbar', icon: 'filter', gesture: 'tap' } },

    // —— 补贴/分类 ——
    { id: 'subsidy.item-open', from: '/subsidy', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '补贴商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },
    { id: 'category.sub-open', from: '/category', to: '/search-result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '分类子频道', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'category.item-open', from: '/category', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '分类商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },

    // —— 详情 ——
    { id: 'detail.reviews-open', from: '/item/:itemId', to: '/item/:itemId/reviews', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '查看全部评价', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'detail.shop-open', from: '/item/:itemId', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '进店', ui: { placement: 'content', icon: 'store', gesture: 'tap' } },
    { id: 'detail.cs-open', from: '/item/:itemId', to: '/chat/:chatId', search: {}, searchParams: {}, mode: 'push', params: { chatId: 'string' }, label: '联系客服', ui: { placement: 'content', icon: 'chat', gesture: 'tap' } },

    // —— SKU 下单弹层(open/close/内部转支付) ——
    { id: 'detail.sku.show', from: '/item/:itemId', to: '/item/:itemId', search: { panel: 'sku' }, searchParams: { mode: 'string' }, mode: 'push', params: { itemId: 'string' }, label: '打开SKU弹层', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'detail.share.show', from: '/item/:itemId', to: '/item/:itemId', search: { panel: 'share' }, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '打开分享弹层', ui: { placement: 'content', icon: 'share', gesture: 'tap' } },
    { id: 'detail.params.show', from: '/item/:itemId', to: '/item/:itemId', search: { panel: 'params' }, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '打开参数弹层', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'sku.order.group', from: { path: '/item/:itemId', search: { panel: 'sku' } }, to: '/group', search: { panel: null }, searchParams: {}, mode: 'push', params: {}, label: 'SKU-发起拼单下单', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'sku.order.success', from: { path: '/item/:itemId', search: { panel: 'sku' } }, to: '/order-success', search: { panel: null }, searchParams: {}, mode: 'push', params: {}, label: 'SKU-0元下单成功', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'sku.pay.open', from: { path: '/item/:itemId', search: { panel: 'sku' } }, to: '/item/:itemId', search: { panel: 'pay' }, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: 'SKU-去收银台', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'cashier.pay.confirm', from: { path: '/item/:itemId', search: { panel: 'pay' } }, to: '/item/:itemId', search: { panel: 'pwd' }, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '收银台-确认支付', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'paypwd.pay.done', from: { path: '/item/:itemId', search: { panel: 'pwd' } }, to: '/pay-success', search: { panel: null }, searchParams: {}, mode: 'push', params: {}, label: '密码支付成功', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },

    // —— 拼单/下单成功/支付成功 ——
    { id: 'group.orderdetail-open', from: '/group', to: '/orders/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '拼单页-订单详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'group.home-open', from: '/group', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '拼单页-回首页', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },
    { id: 'ordersuccess.detail-open', from: '/order-success', to: '/orders/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '下单成功-订单详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'ordersuccess.home-open', from: '/order-success', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '下单成功-回首页', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },
    { id: 'paysuccess.detail-open', from: '/pay-success', to: '/orders/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '支付成功-订单详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'paysuccess.home-open', from: '/pay-success', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '支付成功-回首页', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },

    // —— 店铺 ——
    { id: 'shop.cs-open', from: '/shop/:shopId', to: '/chat/:chatId', search: {}, searchParams: {}, mode: 'push', params: { chatId: 'string' }, label: '店铺客服', ui: { placement: 'topbar', icon: 'chat', gesture: 'tap' } },
    { id: 'shop.item-open', from: '/shop/:shopId', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '店铺商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },

    // —— 个人中心 ——
    { id: 'mine.orders-open', from: '/me', to: '/orders', search: {}, searchParams: {}, mode: 'push', params: {}, label: '我的订单', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'mine.orders-open-status', from: '/me', to: '/orders', search: {}, searchParams: { status: 'string' }, mode: 'push', params: {}, label: '订单状态入口', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'mine.favorites-open', from: '/me', to: '/favorites', search: {}, searchParams: {}, mode: 'push', params: {}, label: '商品收藏', ui: { placement: 'content', icon: 'heart', gesture: 'tap' } },
    { id: 'mine.footprint-open', from: '/me', to: '/footprint', search: {}, searchParams: {}, mode: 'push', params: {}, label: '历史浏览', ui: { placement: 'content', icon: 'clock', gesture: 'tap' } },
    { id: 'mine.coupon-open', from: '/me', to: '/coupons', search: {}, searchParams: {}, mode: 'push', params: {}, label: '优惠券', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'mine.wallet-open', from: '/me', to: '/wallet', search: {}, searchParams: {}, mode: 'push', params: {}, label: '多多钱包', ui: { placement: 'content', icon: 'wallet', gesture: 'tap' } },
    { id: 'mine.aftersale-open', from: '/me', to: '/aftersale', search: {}, searchParams: {}, mode: 'push', params: {}, label: '退款售后', ui: { placement: 'content', icon: 'refresh', gesture: 'tap' } },
    { id: 'mine.address-open', from: '/me', to: '/address', search: {}, searchParams: {}, mode: 'push', params: {}, label: '收货地址', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },
    { id: 'mine.settings-open', from: '/me', to: '/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置', ui: { placement: 'topbar', icon: 'settings', gesture: 'tap' } },

    // —— 订单 ——
    { id: 'orders.detail-open', from: '/orders', to: '/orders/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '订单卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'orders', paramMapping: { orderId: 'id' }, labelField: 'orderNo' } },
    { id: 'orders.reorder-open', from: '/orders', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '再次拼单', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'orders.review-open', from: '/orders', to: '/orders/:orderId/review', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '去评价', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'writereview.orders-open', from: '/orders/:orderId/review', to: '/orders', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '评价完成回全部订单(默认全部Tab)', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'orderdetail.item-open', from: '/orders/:orderId', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '订单商品进详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'orders.refund.show', from: '/orders', to: '/orders', search: { refund: 'quick' }, searchParams: {}, mode: 'push', params: {}, label: '极速退款弹层', ui: { placement: 'content', icon: 'refresh', gesture: 'tap' } },
    { id: 'orderdetail.logistics-open', from: '/orders/:orderId', to: '/orders/:orderId/logistics', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '查看物流', ui: { placement: 'content', icon: 'truck', gesture: 'tap' } },
    { id: 'orderdetail.invoice-open', from: '/orders/:orderId', to: '/orders/:orderId/invoice', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '开发票', ui: { placement: 'content', icon: 'invoice', gesture: 'tap' } },
    { id: 'orderdetail.review-open', from: '/orders/:orderId', to: '/orders/:orderId/review', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '去评价', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'orderdetail.reorder-open', from: '/orders/:orderId', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '再次拼单', ui: { placement: 'content', icon: 'buy', gesture: 'tap' } },
    { id: 'orderdetail.refund.show', from: '/orders/:orderId', to: '/orders/:orderId', search: { refund: 'quick' }, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '极速退款弹层', ui: { placement: 'content', icon: 'refresh', gesture: 'tap' } },

    // —— 售后 ——
    { id: 'aftersale.detail-open', from: '/aftersale', to: '/orders/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '售后单', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'refundform.open', from: ['/orders', '/orders/:orderId'], to: '/aftersale/apply', search: {}, searchParams: { orderId: 'string' }, mode: 'push', params: {}, label: '已发货退款填表', ui: { placement: 'content', icon: 'refresh', gesture: 'tap' } },

    // —— 地址 ——
    { id: 'address.add-open', from: '/address', to: '/address/edit', search: {}, searchParams: {}, mode: 'push', params: {}, label: '新增地址', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    { id: 'address.edit-open', from: '/address', to: '/address/edit', search: {}, searchParams: { id: 'string' }, mode: 'push', params: {}, label: '修改地址', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },
    { id: 'sku.address-open', from: { path: '/item/:itemId', search: { panel: 'sku' } }, to: '/address', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'SKU-选地址', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },

    // —— 券/钱包 ——
    { id: 'coupon.use-open', from: '/coupons', to: '/search-result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '券-立即使用', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'coupon.center-open', from: '/coupons', to: '/coupon-center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '领券中心', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'wallet.txns-open', from: '/wallet', to: '/wallet/transactions', search: {}, searchParams: {}, mode: 'push', params: {}, label: '交易记录', ui: { placement: 'content', icon: 'wallet', gesture: 'tap' } },
    { id: 'favorites.item-open', from: '/favorites', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '收藏商品', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },
    { id: 'footprint.item-open', from: '/footprint', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '足迹商品', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: { ref: 'items', paramMapping: { itemId: 'id' }, labelField: 'title' } },

    // —— 设置 ——
    { id: 'settings.fufei-open', from: '/settings', to: '/settings/fufei', search: {}, searchParams: {}, mode: 'push', params: {}, label: '先用后付设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'settings.appearance-open', from: '/settings', to: '/settings/appearance', search: {}, searchParams: {}, mode: 'push', params: {}, label: '外观与语言', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },

    // —— 消息 ——
    { id: 'chat.notification-open', from: '/chat', to: '/chat/notification', search: {}, searchParams: {}, mode: 'push', params: {}, label: '交易通知', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'chat.conversation-open', from: '/chat', to: '/chat/:chatId', search: {}, searchParams: {}, mode: 'push', params: { chatId: 'string' }, label: '店铺会话', ui: { placement: 'content', icon: 'chat', gesture: 'tap' }, dataSource: { ref: 'chats', paramMapping: { chatId: 'id' }, labelField: 'name' } },
    { id: 'chat.official-open', from: '/chat', to: '/cs', search: {}, searchParams: {}, mode: 'push', params: {}, label: '官方客服工作台', ui: { placement: 'content', icon: 'chat', gesture: 'tap' } },
    { id: 'conversation.item-open', from: '/chat/:chatId', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '会话商品卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'notification.item-open', from: '/chat/notification', to: '/item/:itemId', search: {}, searchParams: {}, mode: 'push', params: { itemId: 'string' }, label: '通知卡进商品', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'cs.refund-open', from: '/cs', to: '/orders', search: {}, searchParams: {}, mode: 'push', params: {}, label: '客服台-申请退款', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'cs.logistics-open', from: '/cs', to: '/orders', search: {}, searchParams: {}, mode: 'push', params: {}, label: '客服台-查物流', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
  ],
  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
