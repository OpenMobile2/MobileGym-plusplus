/**
 * 淘宝闪购(tbsg)导航 FSM 声明 —— spec v1.0.1 的工程转写,IDs 与 spec 一一对应(coverage gate 依据)。
 * 弹层(panel)走 searchParams(URL 驱动 UI);返回/关闭一律 bindBack(pipeline §11)。
 */
import type { NavigationDeclaration, ScrollContainerDeclaration } from './navigation.types';

const MAIN_SCROLL: ScrollContainerDeclaration[] = [
  { name: 'main', direction: 'vertical', description: '主内容区' },
];

export const NAVIGATION_DECLARATION = {
  app: 'tbsg',
  routes: [
    // ================= 主 tab =================
    {
      path: '/', component: 'HomePage', params: {}, entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.home.base', search: {}, description: '首页(地址/搜索/金刚区/超抢手/商家列表)',
        actions: [
          { id: 'home.scan.stub', label: '扫一扫(暂未开放)', behavior: 'other' },
          { id: 'home.kingkong.stub', label: '金刚区未实现入口提示', behavior: 'other' },
          { id: 'home.kingkong.page', label: '金刚区左滑翻页', behavior: 'other' },
          { id: 'home.categoryTab.select', label: '分类tab过滤商家', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
          { id: 'home.quickFilter.toggle', label: '快捷筛选', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
          { id: 'home.shopcard.dismiss', label: '商家卡×移除', behavior: 'modify', scope: 'item', paramsSchema: { shopId: 'string' } },
          { id: 'home.banner.stub', label: '运营banner(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '首页',
    },
    {
      path: '/hotdeals', component: 'HotdealsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'tbsg.hotdeals.base', search: {}, description: '超抢手推荐页(qa:R1)' }],
      queryParams: {}, description: '超抢手推荐页',
    },
    {
      path: '/daily-redpacket', component: 'DailyRedpacketPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.redpacket.base', search: {}, description: '天天红包tab',
        actions: [
          { id: 'redpacket.daily.burst', label: '免费爆1次', behavior: 'submit' },
          { id: 'redpacket.timeslot.select', label: '限时抢时段切换', behavior: 'toggle', scope: 'item', paramsSchema: { slot: 'string' } },
          { id: 'redpacket.rush.claim', label: '限时抢红包', behavior: 'submit' },
          { id: 'redpacket.foodcard.stub', label: '超值购卡(暂未开放)', behavior: 'other' },
          { id: 'redpacket.shopsearch.input', label: '搜索红包可用商家', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'redpacket.filter.select', label: '品类/筛选过滤', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
        ],
      }],
      queryParams: {}, description: '天天红包',
    },
    {
      path: '/messages', component: 'MessageCenterPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.messages.base', search: {}, description: '消息中心',
        actions: [
          { id: 'message.clean.all', label: '清扫全部已读', behavior: 'modify' },
          { id: 'message.banner.close', label: '关闭推广横幅', behavior: 'close' },
          { id: 'message.viewall.stub', label: '查看全部(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '消息中心',
    },
    {
      path: '/cart', component: 'CartPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.cart.base', search: {}, description: '购物车(普通模式)',
          actions: [
            { id: 'cart.manage.toggle', label: '管理/退出管理', behavior: 'toggle' },
            { id: 'cart.item.check', label: '勾选商品', behavior: 'toggle', scope: 'item', paramsSchema: { lineId: 'string' } },
            { id: 'cart.checkall.toggle', label: '全选', behavior: 'toggle' },
            { id: 'cart.item.qty', label: '数量步进', behavior: 'modify', scope: 'item', paramsSchema: { lineId: 'string' } },
            { id: 'cart.shop.delete', label: '删除店铺分组', behavior: 'modify', scope: 'item', paramsSchema: { shopId: 'string' } },
          ],
        },
        {
          id: 'tbsg.cart.deleteConfirm', search: { confirm: 'del' }, description: '删除确认弹窗',
          actions: [
            { id: 'cart.delete.confirm.open', label: '删除(弹确认)', behavior: 'open' },
            { id: 'cart.delete.confirm', label: '确认删除', behavior: 'submit' },
            { id: 'cart.delete.cancel', label: '取消删除', behavior: 'close' },
          ],
        },
      ],
      queryParams: { manage: 'string' }, description: '购物车 tab',
    },
    {
      path: '/mine', component: 'MinePage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.mine.base', search: {}, description: '我的(个人中心)',
        actions: [
          { id: 'mine.beans.view', label: '吃货豆余额浮层', behavior: 'open' },
          { id: 'mine.foodcard.stub', label: '超级吃货卡(暂未开放)', behavior: 'other' },
          { id: 'mine.wallet.stub', label: '钱包项(暂未开放)', behavior: 'other' },
          { id: 'mine.activity.stub', label: '活动宫格(暂未开放)', behavior: 'other' },
          { id: 'mine.morefunc.stub', label: '开发票/下单返(暂未开放)', behavior: 'other' },
          { id: 'mine.svip.stub', label: 'SVIP(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '我的',
    },
    // ================= 频道 =================
    {
      path: '/channel/food', component: 'ChannelFoodPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.channel.food.base', search: {}, description: '美食夜宵频道',
          actions: [
            { id: 'channel.redpacket.claimAll', label: '夜市红包一键领取', behavior: 'submit' },
            { id: 'channel.redpacket.claimOne', label: '夜市红包单张领取', behavior: 'submit', scope: 'item', paramsSchema: { couponId: 'string' } },
            { id: 'channel.category.select', label: '品类icon条切换', behavior: 'toggle', scope: 'item', paramsSchema: { cat: 'string' } },
            { id: 'channel.sortPanel.open', label: '打开排序面板', behavior: 'open' },
            { id: 'channel.filterPanel.open', label: '打开筛选面板', behavior: 'open' },
            { id: 'channel.quickFilter.toggle', label: '快捷筛选', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
            { id: 'channel.list.scroll', label: '列表滚动加载', behavior: 'other' },
          ],
        },
        {
          id: 'tbsg.channel.food.sort', search: { panel: 'sort' }, description: '排序下拉面板',
          actions: [
            { id: 'channel.sort.select', label: '选择排序规则', behavior: 'toggle', scope: 'item', paramsSchema: { sort: 'string' } },
            { id: 'channel.sortPanel.close', label: '收起排序面板', behavior: 'close' },
          ],
        },
        {
          id: 'tbsg.channel.food.filter', search: { panel: 'filter' }, description: '筛选大面板',
          actions: [
            { id: 'channel.filter.toggle', label: '筛选胶囊多选', behavior: 'toggle', scope: 'item', paramsSchema: { opt: 'string' } },
            { id: 'channel.filter.priceRange', label: '人均价滑杆', behavior: 'modify' },
            { id: 'channel.filter.apply', label: '查看(应用筛选)', behavior: 'submit' },
            { id: 'channel.filter.clear', label: '清空筛选', behavior: 'modify' },
          ],
        },
      ],
      queryParams: {}, description: '美食|夜宵频道页',
    },
    {
      path: '/channel/market', component: 'ChannelMarketPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.channel.market.base', search: {}, description: '超市便利频道',
          actions: [
            { id: 'channel.market.category.select', label: '金刚区分类过滤', behavior: 'toggle', scope: 'item', paramsSchema: { cat: 'string' } },
            { id: 'channel.market.shoptab.select', label: '附近好店分类胶囊', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
          ],
        },
        {
          id: 'tbsg.channel.market.popup', search: { popup: 'coupon' }, description: '进场红包弹窗',
          actions: [
            { id: 'channel.market.popup.claim', label: '红包弹窗-去使用', behavior: 'submit' },
            { id: 'channel.market.popup.close', label: '红包弹窗-关闭', behavior: 'close' },
          ],
        },
      ],
      queryParams: {}, description: '超市便利频道页',
    },
    {
      path: '/channel/fruit', component: 'ChannelFruitPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.channel.fruit.base', search: {}, description: '水果买菜频道',
        actions: [
          { id: 'channel.fruit.category.select', label: '分类金刚区过滤', behavior: 'toggle', scope: 'item', paramsSchema: { cat: 'string' } },
          { id: 'channel.fruit.filter.toggle', label: '筛选条', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
        ],
      }],
      queryParams: {}, description: '水果买菜频道页',
    },
    {
      path: '/channel/medicine', component: 'ChannelMedicinePage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.channel.medicine.base', search: {}, description: '看病买药频道(分类金刚区+附近药店)',
        actions: [
          { id: 'channel.medicine.tab.stub', label: '子tab(问医生/医疗器械等,暂未开放)', behavior: 'other' },
          { id: 'channel.medicine.misc.stub', label: '健康卡/问医生等(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '看病买药频道页',
    },
    {
      path: '/channel/medicine/cat', component: 'MedicineCategoryPage', params: {}, entryPoint: 'none',
      scrollContainers: [
        { name: 'main', direction: 'vertical', description: '药品列表' },
        { name: 'subcats', direction: 'vertical', description: '左侧二级类目' },
      ],
      uiStates: [{
        id: 'tbsg.medcat.base', search: {}, description: '药品分类页(跨店在售药品)',
        actions: [
          { id: 'medcat.subcat.select', label: '二级类目过滤', behavior: 'toggle', scope: 'item', paramsSchema: { sub: 'string' } },
        ],
      }],
      queryParams: { cat: 'string' }, description: '药品分类页',
    },
    {
      path: '/channel/medicine/search', component: 'MedicineSearchPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.medsearch.base', search: {}, description: '买药独立搜索页',
        actions: [
          { id: 'medsearch.query.input', label: '药品搜索输入', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'medsearch.discover.pick', label: '搜索发现词', behavior: 'modify', scope: 'item', paramsSchema: { q: 'string' } },
        ],
      }],
      queryParams: {}, description: '买药搜索页',
    },
    {
      path: '/drug/:drugId', component: 'DrugDetailPage', params: { drugId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.drug.base', search: {}, description: '药品详情(在售商家跨店列表)',
        actions: [
          { id: 'drug.combo.stub', label: '组合用药tab(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '药品详情页',
    },
    // ================= 搜索 =================
    {
      path: '/search', component: 'SearchEntryPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.search.base', search: {}, description: '搜索中间页',
        actions: [
          { id: 'search.entry.input', label: '搜索词输入', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'search.history.clear', label: '清空历史搜索', behavior: 'modify' },
        ],
      }],
      queryParams: {}, description: '搜索中间页',
    },
    {
      path: '/search/result', component: 'SearchResultPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.searchresult.base', search: {}, description: '搜索结果页(商家+匹配商品)',
        actions: [
          { id: 'searchresult.brand.filter', label: '热卖品牌chips', behavior: 'toggle', scope: 'item', paramsSchema: { brand: 'string' } },
          { id: 'searchresult.sort.select', label: '排序(综合/销量/速度)', behavior: 'toggle', scope: 'item', paramsSchema: { sort: 'string' } },
          { id: 'searchresult.filter.toggle', label: '筛选chips', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
        ],
      }],
      queryParams: { q: 'string' }, description: '搜索结果页',
    },
    // ================= 店铺(餐饮) =================
    {
      path: '/shop/:shopId', component: 'ShopPage', params: { shopId: 'string' }, entryPoint: 'none',
      scrollContainers: [
        { name: 'main', direction: 'vertical', description: '菜单右栏' },
        { name: 'cats', direction: 'vertical', description: '左侧分类栏' },
        { name: 'shopsearch', direction: 'vertical', description: '店内搜索结果' },
      ],
      uiStates: [
        {
          id: 'tbsg.shop.base', search: {}, description: '点餐tab',
          actions: [
            { id: 'shop.favorite.toggle', label: '收藏店铺', behavior: 'toggle' },
            { id: 'shop.moremenu.open', label: '打开...面板', behavior: 'open' },
            { id: 'shop.search.open', label: '打开店内搜索弹层', behavior: 'open' },
            { id: 'shop.couponSheet.open', label: '打开红包优惠弹层', behavior: 'open' },
            { id: 'shop.pickup.toggle', label: '外送/自取切换(qa:Q8)', behavior: 'toggle' },
            { id: 'shop.tab.select', label: '点餐/评价/商家tab', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
            { id: 'shop.category.select', label: '左侧分类跳转', behavior: 'toggle', scope: 'item', paramsSchema: { cat: 'string' } },
            { id: 'shop.item.add', label: '单规格商品加购', behavior: 'modify', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'shop.item.minus', label: '步进器减购', behavior: 'modify', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'shop.skuSheet.open', label: '打开SKU弹层', behavior: 'open', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'shop.reorder.add', label: '再来一单(qa:Q6)', behavior: 'submit' },
            { id: 'shop.cartbar.expand', label: '展开购物车明细', behavior: 'open' },
            { id: 'shop.mustpick.hint', label: '未选必选品提示', behavior: 'other' },
            { id: 'shop.addonSheet.open', label: '打开凑单弹层', behavior: 'open' },
          ],
        },
        {
          id: 'tbsg.shop.reviews', search: { tab: 'reviews' }, description: '评价tab',
          actions: [
            { id: 'shop.reviews.filter', label: '评价标签过滤', behavior: 'toggle', scope: 'item', paramsSchema: { tag: 'string' } },
            { id: 'shop.reviews.contentOnly.toggle', label: '只看有内容', behavior: 'toggle' },
            { id: 'shop.reviews.reply.expand', label: '展开商家回复', behavior: 'open' },
            { id: 'shop.reviews.photo.view', label: '查看评价大图', behavior: 'open' },
          ],
        },
        {
          id: 'tbsg.shop.merchant', search: { tab: 'merchant' }, description: '商家tab',
          actions: [
            { id: 'shop.merchant.call.stub', label: '电话(暂未开放)', behavior: 'other' },
            { id: 'shop.merchant.map.stub', label: '地址地图(暂未开放)', behavior: 'other' },
            { id: 'shop.merchant.license.stub', label: '亮证经营(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'tbsg.shop.sku', search: { panel: 'sku', item: null }, description: 'SKU规格弹层',
          actions: [
            { id: 'shop.sku.option.select', label: 'SKU选项胶囊', behavior: 'toggle', scope: 'item', paramsSchema: { group: 'string', option: 'string' } },
            { id: 'shop.sku.confirm', label: '选好了(加购)', behavior: 'submit' },
            { id: 'shop.sku.close', label: '关闭SKU弹层', behavior: 'close' },
          ],
        },
        {
          id: 'tbsg.shop.coupons', search: { panel: 'coupons' }, description: '红包优惠弹层',
          actions: [
            { id: 'shop.coupon.followClaim', label: '关注领券', behavior: 'submit' },
            { id: 'shop.coupon.expand', label: '展开其他红包', behavior: 'open' },
            { id: 'shop.foodcardSheet.open', label: '打开吃货卡弹层', behavior: 'open' },
            { id: 'shop.couponSheet.close', label: '关闭红包弹层', behavior: 'close' },
          ],
        },
        {
          id: 'tbsg.shop.foodcard', search: { panel: 'foodcard' }, description: '超级吃货卡购买弹层',
          actions: [
            { id: 'shop.foodcard.buy', label: '购买吃货卡(模拟)', behavior: 'submit' },
            { id: 'shop.foodcard.agreement.stub', label: '协议(暂未开放)', behavior: 'other' },
            { id: 'shop.foodcardSheet.close', label: '关闭吃货卡弹层', behavior: 'close' },
          ],
        },
        {
          id: 'tbsg.shop.addon', search: { panel: 'addon' }, description: '凑单弹层',
          actions: [
            { id: 'shop.addon.add', label: '凑单商品加购', behavior: 'modify', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'shop.addon.sku.open', label: '凑单商品选规格', behavior: 'open', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'shop.addon.filter', label: '凑单筛选', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
            { id: 'shop.addonSheet.close', label: '关闭凑单弹层', behavior: 'close' },
          ],
        },
        {
          id: 'tbsg.shop.search', search: { panel: 'search' }, description: '店内商品搜索弹层',
          actions: [
            { id: 'shop.search.input', label: '店内搜索输入', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
        { id: 'tbsg.shop.cartbar', search: { panel: 'cartbar' }, description: '购物车明细浮层' },
        { id: 'tbsg.shop.more', search: { panel: 'more' }, description: '全局...面板(动作声明见 /orders)' },
      ],
      queryParams: {}, description: '餐饮店铺页',
    },
    // ================= 店铺(零售) =================
    {
      path: '/retail/:shopId', component: 'RetailShopPage', params: { shopId: 'string' }, entryPoint: 'none',
      scrollContainers: [
        { name: 'main', direction: 'vertical', description: '主内容区' },
        { name: 'retailsearch', direction: 'vertical', description: '店内搜索结果' },
      ],
      uiStates: [
        {
          id: 'tbsg.retail.base', search: {}, description: '零售店首页tab',
          actions: [
            { id: 'retail.tab.select', label: '首页/商品/评价tab', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
            { id: 'retail.coupon.claim', label: '优惠胶囊领券', behavior: 'submit', scope: 'item', paramsSchema: { couponId: 'string' } },
            { id: 'retail.category.select', label: '分类宫格', behavior: 'toggle', scope: 'item', paramsSchema: { cat: 'string' } },
            { id: 'retail.item.add', label: '商品加购', behavior: 'modify', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'retail.search.open', label: '打开店内搜索弹层', behavior: 'open' },
            { id: 'retail.share.stub', label: '分享(暂未开放)', behavior: 'other' },
            { id: 'retail.favorite.toggle', label: '收藏', behavior: 'toggle' },
          ],
        },
        { id: 'tbsg.retail.goods', search: { tab: 'goods' }, description: '商品tab(左右双栏)' },
        { id: 'tbsg.retail.reviews', search: { tab: 'reviews' }, description: '评价tab(复用模板)' },
        { id: 'tbsg.retail.sku', search: { panel: 'sku', item: null }, description: 'SKU弹层(复用)' },
        { id: 'tbsg.retail.cartbar', search: { panel: 'cartbar' }, description: '购物车明细浮层(复用)' },
        {
          id: 'tbsg.retail.search', search: { panel: 'search' }, description: '零售店内搜索弹层',
          actions: [
            { id: 'retail.search.input', label: '店内搜索输入', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {}, description: '零售店铺页(罗森式)',
    },
    {
      path: '/shop/:shopId/group', component: 'GroupOrderPage', params: { shopId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.group.base', search: {}, description: '好友拼单详情',
        actions: [
          { id: 'group.invite.stub', label: '邀请好友(暂未开放)', behavior: 'other' },
          { id: 'group.helporder.stub', label: '帮好友点(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '好友拼单详情页',
    },
    // ================= 聊天 =================
    {
      path: '/chat/shop/:shopId', component: 'ShopChatPage', params: { shopId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.shopchat.base', search: {}, description: '商家聊天',
          actions: [
            { id: 'shopchat.message.send', label: '发送消息(自动回复qa:Q9)', behavior: 'submit' },
            { id: 'shopchat.emoji.toggle', label: '表情面板开关', behavior: 'toggle' },
            { id: 'shopchat.quickq.send', label: '快捷问题发送', behavior: 'submit', scope: 'item', paramsSchema: { q: 'string' } },
            { id: 'shopchat.misc.stub', label: '语音/清单/+(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'tbsg.shopchat.emoji', search: { panel: 'emoji' }, description: '表情面板',
          actions: [
            { id: 'shopchat.emoji.pick', label: '选择表情', behavior: 'modify', scope: 'item', paramsSchema: { emoji: 'string' } },
            { id: 'shopchat.emoji.send', label: '表情面板发送', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {}, description: '商家聊天页',
    },
    {
      path: '/chat/rider/:orderId', component: 'RiderChatPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.riderchat.base', search: {}, description: '骑手聊天',
        actions: [
          { id: 'riderchat.message.send', label: '发送消息(自动回复qa:Q9)', behavior: 'submit' },
          { id: 'riderchat.photo.view', label: '查看凭证大图', behavior: 'open' },
        ],
      }],
      queryParams: {}, description: '骑手聊天页',
    },
    // ================= 结算 =================
    {
      path: '/checkout', component: 'CheckoutPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.checkout.base', search: {}, description: '确认订单页(多店分组qa:Q7)',
          actions: [
            { id: 'checkout.mode.toggle', label: '外卖到家/到店自取', behavior: 'toggle' },
            { id: 'checkout.delivery.select', label: '立即送出/预约配送', behavior: 'toggle', scope: 'item', paramsSchema: { slot: 'string' } },
            { id: 'checkout.vas.toggle', label: '增值服务勾选', behavior: 'toggle', scope: 'item', paramsSchema: { vas: 'string' } },
            { id: 'checkout.exchange.add', label: '换购加购', behavior: 'modify', scope: 'item', paramsSchema: { itemId: 'string' } },
            { id: 'checkout.tableware.open', label: '打开餐具弹层', behavior: 'open' },
            { id: 'checkout.payment.select', label: '支付方式选择', behavior: 'toggle', scope: 'item', paramsSchema: { method: 'string' } },
            { id: 'checkout.payment.expand', label: '更多支付方式(暂未开放)', behavior: 'other' },
            { id: 'checkout.invoice.stub', label: '发票(暂未开放)', behavior: 'other' },
            { id: 'checkout.pay.open', label: '立即支付(开收银台)', behavior: 'open' },
          ],
        },
        {
          id: 'tbsg.checkout.tableware', search: { panel: 'tableware' }, description: '餐具份数弹层',
          actions: [
            { id: 'checkout.tableware.select', label: '选择餐具份数', behavior: 'toggle', scope: 'item', paramsSchema: { opt: 'string' } },
            { id: 'checkout.tableware.remember', label: '以后都需要餐具', behavior: 'toggle' },
          ],
        },
        { id: 'tbsg.checkout.pay', search: { panel: 'pay' }, description: '模拟收银台弹层(qa:Q1)' },
      ],
      queryParams: {}, description: '确认订单页',
    },
    {
      path: '/checkout/coupons', component: 'CheckoutCouponPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.checkout.coupons.base', search: {}, description: '选择红包/店铺券',
        actions: [
          { id: 'checkout.coupon.select', label: '勾选券', behavior: 'toggle', scope: 'item', paramsSchema: { couponId: 'string' } },
          { id: 'checkout.coupon.memberClaim', label: '入会领券', behavior: 'submit' },
          { id: 'checkout.coupon.unusable.expand', label: '展开不可用券', behavior: 'open' },
        ],
      }],
      queryParams: { type: 'string', shopId: 'string' }, description: '选择红包/店铺活动券页',
    },
    {
      path: '/checkout/remark', component: 'RemarkPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.checkout.remark.base', search: {}, description: '备注编辑页',
        actions: [
          { id: 'checkout.remark.input', label: '备注输入', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'checkout.remark.quick', label: '快捷输入胶囊', behavior: 'modify', scope: 'item', paramsSchema: { text: 'string' } },
          { id: 'checkout.remark.setDefault', label: '设为默认备注', behavior: 'submit' },
        ],
      }],
      queryParams: {}, description: '订单备注编辑页',
    },
    // ================= 订单 =================
    {
      path: '/order/:orderId/success', component: 'PaySuccessPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.paysuccess.base', search: {}, description: '支付成功页',
        actions: [{ id: 'paysuccess.beans.claim', label: '领取下单奖励吃货豆', behavior: 'submit' }],
      }],
      queryParams: {}, description: '支付成功页',
    },
    {
      path: '/orders', component: 'OrdersPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.orders.base', search: {}, description: '订单列表',
          actions: [
            { id: 'order.list.tab.select', label: '订单状态tab', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
            { id: 'order.list.invoice.stub', label: '开发票(暂未开放)', behavior: 'other' },
            { id: 'order.list.beans.claim', label: '领吃货豆', behavior: 'submit', scope: 'item', paramsSchema: { orderId: 'string' } },
            { id: 'order.list.search', label: '搜订单', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
        {
          id: 'tbsg.orders.ordermore', search: { panel: 'ordermore' }, description: '订单更多菜单(qa:Q5)',
          actions: [{ id: 'order.list.more', label: '更多(开发票/订单评价等)', behavior: 'open', scope: 'item', paramsSchema: { orderId: 'string' } }],
        },
        {
          id: 'tbsg.orders.more', search: { panel: 'more' }, description: '全局...面板',
          actions: [
            { id: 'moremenu.feedback.stub', label: '意见反馈(暂未开放)', behavior: 'other' },
            { id: 'moremenu.panel.close', label: '取消(关闭面板)', behavior: 'close' },
          ],
        },
      ],
      queryParams: { tab: 'string' }, description: '我的订单列表页',
    },
    {
      path: '/order/:orderId', component: 'OrderDetailPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.order.base', search: {}, description: '订单详情(状态机:待支付/备餐/配送/送达/取消/退款)',
          actions: [
            { id: 'order.refundReason.open', label: '申请售后(开原因弹层)', behavior: 'open' },
            { id: 'order.detail.price.expand', label: '价格明细展开', behavior: 'toggle' },
            { id: 'order.detail.copyid', label: '复制订单号', behavior: 'other' },
            { id: 'order.detail.invoice.stub', label: '发票(暂未开放)', behavior: 'other' },
            { id: 'order.modify.stub', label: '改订单信息(暂未开放)', behavior: 'other' },
            { id: 'order.status.expand', label: '状态时间轴展开', behavior: 'toggle' },
            { id: 'order.survey.stub', label: '问卷调查(暂未开放)', behavior: 'other' },
            { id: 'order.repay.open', label: '去支付(重开收银台)', behavior: 'open' },
          ],
        },
        {
          id: 'tbsg.order.refundReason', search: { panel: 'refund-reason' }, description: '售后原因弹层',
          actions: [
            { id: 'refund.reason.select', label: '选择售后原因', behavior: 'toggle', scope: 'item', paramsSchema: { reason: 'string' } },
            { id: 'refund.subreason.select', label: '子原因chips', behavior: 'toggle', scope: 'item', paramsSchema: { sub: 'string' } },
            { id: 'refund.contact.call.stub', label: '电话(暂未开放)', behavior: 'other' },
            { id: 'refund.reason.close', label: '关闭原因弹层', behavior: 'close' },
          ],
        },
        { id: 'tbsg.order.pay', search: { panel: 'pay' }, description: '待支付订单收银台(复用)' },
      ],
      queryParams: {}, description: '订单详情页',
    },
    {
      path: '/order/:orderId/cancel-survey', component: 'CancelSurveyPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.cancelsurvey.base', search: {}, description: '取消成功+原因调研',
        actions: [{ id: 'cancel.survey.select', label: '选择取消原因', behavior: 'toggle', scope: 'item', paramsSchema: { reason: 'string' } }],
      }],
      queryParams: {}, description: '取消原因调研页',
    },
    {
      path: '/order/:orderId/refund/apply', component: 'RefundFormPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.refundform.base', search: {}, description: '退款申请表单',
          actions: [
            { id: 'refund.form.reason.reopen', label: '重选售后原因', behavior: 'open' },
            { id: 'refund.form.item.toggle', label: '勾选售后商品(金额联动)', behavior: 'toggle', scope: 'item', paramsSchema: { lineIdx: 'number' } },
            { id: 'refund.form.desc', label: '补充说明', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'refund.form.photo.stub', label: '上传凭证(暂未开放)', behavior: 'other' },
            { id: 'refund.form.call.stub', label: '致电骑士(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'tbsg.refundform.reason', search: { panel: 'reason' }, description: '重选原因弹层(复用)' },
      ],
      queryParams: {}, description: '退款申请表单页',
    },
    {
      path: '/order/:orderId/refund', component: 'RefundProgressPage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.refundprogress.base', search: {}, description: '退款进度页',
        actions: [
          { id: 'refund.progress.withdraw', label: '撤销申请', behavior: 'submit' },
          { id: 'refund.progress.call.stub', label: '致电商家(暂未开放)', behavior: 'other' },
          { id: 'refund.progress.timeline.expand', label: '查看详细流程', behavior: 'toggle' },
        ],
      }],
      queryParams: {}, description: '退款进度页',
    },
    {
      path: '/order/:orderId/review', component: 'ReviewWritePage', params: { orderId: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.reviewwrite.base', search: {}, description: '写评价页',
        actions: [
          { id: 'review.stars.set', label: '满意度星级(qa:Q10)', behavior: 'modify', scope: 'item', paramsSchema: { stars: 'number' } },
          { id: 'review.rider.set', label: '骑手满意/不满意', behavior: 'toggle', scope: 'item', paramsSchema: { good: 'string' } },
          { id: 'review.text.input', label: '评价文字', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'review.photo.add', label: '添加示例图(模拟传图)', behavior: 'modify' },
          { id: 'review.anonymous.toggle', label: '匿名评价', behavior: 'toggle' },
        ],
      }],
      queryParams: {}, description: '写评价页',
    },
    {
      path: '/review-center', component: 'ReviewCenterPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.reviewcenter.base', search: {}, description: '评价中心',
        actions: [
          { id: 'reviewcenter.tab.select', label: '待评价/已评价tab', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
          { id: 'reviewcenter.rules.stub', label: '规则(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: { tab: 'string' }, description: '评价中心页',
    },
    {
      path: '/service', component: 'ServiceAgentPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.service.base', search: {}, description: '智能客服/专属管家',
          actions: [
            { id: 'service.refund.open', label: '申请售后(开原因弹层)', behavior: 'open' },
            { id: 'service.quickq.send', label: '快捷问题发送', behavior: 'submit', scope: 'item', paramsSchema: { q: 'string' } },
            { id: 'service.message.send', label: '发送消息(AI回复)', behavior: 'submit' },
            { id: 'service.human.stub', label: '召唤人工(暂未开放)', behavior: 'other' },
            { id: 'service.call.stub', label: '电话(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'tbsg.service.refundReason', search: { panel: 'refund-reason' }, description: '售后原因弹层(复用)' },
      ],
      queryParams: { orderId: 'string' }, description: '智能客服页',
    },
    // ================= 券包 =================
    {
      path: '/coupons', component: 'CouponWalletPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.coupons.base', search: {}, description: '红包卡券页',
        actions: [
          { id: 'coupon.tab.select', label: '红包/已购券/卡tab', behavior: 'toggle', scope: 'item', paramsSchema: { tab: 'string' } },
          { id: 'coupon.filter.select', label: '红包类型筛选', behavior: 'toggle', scope: 'item', paramsSchema: { filter: 'string' } },
          { id: 'coupon.condition.expand', label: '使用条件展开', behavior: 'toggle', scope: 'item', paramsSchema: { couponId: 'string' } },
          { id: 'coupon.tools.stub', label: '底部工具栏(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: { tab: 'string' }, description: '红包卡券页',
    },
    // ================= 地址 =================
    {
      path: '/address/select', component: 'AddressSelectPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.addressselect.base', search: {}, description: '选择收货地址',
        actions: [
          { id: 'address.select.pin', label: '置顶地址', behavior: 'modify', scope: 'item', paramsSchema: { addressId: 'string' } },
          { id: 'address.search.input', label: '搜索地址输入', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'address.search.pick', label: '选择联想地址', behavior: 'submit', scope: 'item', paramsSchema: { poi: 'string' } },
          { id: 'address.city.select', label: '切换城市', behavior: 'toggle', scope: 'item', paramsSchema: { city: 'string' } },
          { id: 'address.relocate.stub', label: '重新定位(暂未开放)', behavior: 'other' },
          { id: 'address.batchclear.stub', label: '批量清除(暂未开放)', behavior: 'other' },
          { id: 'address.tip.close', label: '关闭清理提示条', behavior: 'close' },
        ],
      }],
      queryParams: { from: 'string' }, description: '选择收货地址页',
    },
    {
      path: '/settings/address', component: 'AddressListPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'tbsg.addresslist.base', search: {}, description: '收货地址管理' }],
      queryParams: {}, description: '收货地址管理页',
    },
    {
      path: '/address/edit', component: 'AddressEditPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'tbsg.addressedit.base', search: {}, description: '新增/修改地址表单',
          actions: [
            { id: 'address.edit.poi.open', label: '选择收货地址(POI列表)', behavior: 'open' },
            { id: 'address.edit.input', label: '表单输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'address.edit.gender', label: '先生/女士', behavior: 'toggle', scope: 'item', paramsSchema: { gender: 'string' } },
            { id: 'address.edit.tag', label: '地址标签', behavior: 'toggle', scope: 'item', paramsSchema: { tag: 'string' } },
            { id: 'address.edit.delete', label: '删除地址(确认弹窗)', behavior: 'submit' },
            { id: 'address.edit.smartpaste.stub', label: '粘贴识别(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'tbsg.addressedit.poi', search: { panel: 'poi' }, description: 'POI选择面板' },
        { id: 'tbsg.addressedit.delconfirm', search: { panel: 'delconfirm' }, description: '删除确认弹窗' },
      ],
      queryParams: { id: 'string' }, description: '新增/修改收货地址页',
    },
    // ================= 设置 =================
    {
      path: '/settings', component: 'SettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.settings.base', search: {}, description: '设置页',
        actions: [
          { id: 'settings.misc.stub', label: '其余设置项(暂未开放)', behavior: 'other' },
          { id: 'settings.elder.stub', label: '长辈模式(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '设置页',
    },
    {
      path: '/settings/profile', component: 'ProfilePage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.profile.base', search: {}, description: '个人资料编辑(推断页)',
        actions: [
          { id: 'profile.edit.input', label: '昵称/签名编辑', behavior: 'input', paramsSchema: { value: 'string' } },
          { id: 'profile.avatar.pick', label: '更换头像', behavior: 'modify', scope: 'item', paramsSchema: { avatar: 'string' } },
        ],
      }],
      queryParams: {}, description: '个人资料页',
    },
    {
      path: '/settings/general', component: 'GeneralSettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.general.base', search: {}, description: '通用设置(推断页)',
        actions: [
          { id: 'general.cache.clear', label: '清理缓存', behavior: 'submit' },
          { id: 'general.imgquality.select', label: '图片质量', behavior: 'toggle', scope: 'item', paramsSchema: { quality: 'string' } },
        ],
      }],
      queryParams: {}, description: '通用设置页',
    },
    {
      path: '/settings/security', component: 'SecurityPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.security.base', search: {}, description: '账号与安全',
        actions: [
          { id: 'security.switch.toggle', label: '安全开关(面容/登录密码/支付密码)', behavior: 'toggle', scope: 'item', paramsSchema: { which: 'string' } },
          { id: 'security.misc.stub', label: '注销账号等(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '账号与安全页',
    },
    {
      path: '/settings/payment', component: 'PaymentSettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.paymentset.base', search: {}, description: '支付设置',
        actions: [
          { id: 'paymentset.nopwd.toggle', label: '免密支付开关', behavior: 'toggle', scope: 'item', paramsSchema: { which: 'string' } },
          { id: 'paymentset.misc.stub', label: '去设置/查看(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '支付设置页',
    },
    {
      path: '/settings/notifications', component: 'NotificationSettingsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{
        id: 'tbsg.notif.base', search: {}, description: '消息通知设置',
        actions: [
          { id: 'notif.banner.toggle', label: '横幅通知开关', behavior: 'toggle' },
          { id: 'notif.channel.toggle', label: '各通知渠道开关', behavior: 'toggle', scope: 'item', paramsSchema: { channel: 'string' } },
          { id: 'notif.clearall.confirm', label: '清空消息列表', behavior: 'submit' },
          { id: 'notif.misc.stub', label: '其余通知项(暂未开放)', behavior: 'other' },
        ],
      }],
      queryParams: {}, description: '消息通知设置页',
    },
  ],
  transitions: [
    // ---- 底部tab(chrome.tabbar) ----
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '首页tab', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'tabbar.redpacket-open', from: '*', to: '/daily-redpacket', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '天天红包tab', ui: { placement: 'tabbar', icon: 'ticket', gesture: 'tap' } },
    { id: 'tabbar.message-open', from: '*', to: '/messages', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '消息tab', ui: { placement: 'tabbar', icon: 'message', gesture: 'tap' } },
    { id: 'tabbar.cart-open', from: '*', to: '/cart', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '购物车tab', ui: { placement: 'tabbar', icon: 'cart', gesture: 'tap' } },
    { id: 'tabbar.mine-open', from: '*', to: '/mine', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '我的tab', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },
    // ---- 全局...面板(chrome.moreMenu) ----
    { id: 'moremenu.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '...面板-回到首页', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },
    { id: 'moremenu.message-open', from: '*', to: '/messages', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '...面板-消息中心', ui: { placement: 'content', icon: 'message', gesture: 'tap' } },
    { id: 'moremenu.cart-open', from: '*', to: '/cart', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '...面板-购物车', ui: { placement: 'content', icon: 'cart', gesture: 'tap' } },
    { id: 'moremenu.mine-open', from: '*', to: '/mine', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '...面板-个人中心', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'moremenu.service-open', from: '*', to: '/service', search: {}, searchParams: {}, mode: 'push', params: {}, label: '...面板-智能客服', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'moremenu.recentshop-open', from: '*', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '...面板-最近浏览店', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    // ---- 首页 ----
    { id: 'home.address-open', from: '/', to: '/address/select', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {}, label: '首页地址栏', ui: { placement: 'topbar', icon: 'pin', gesture: 'tap' } },
    { id: 'home.search-open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '首页搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'home.channel.food-open', from: '/', to: '/channel/food', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区-美食外卖', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'home.channel.market-open', from: '/', to: '/channel/market', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区-超市便利', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'home.channel.medicine-open', from: '/', to: '/channel/medicine', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区-看病买药', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'home.channel.fruit-open', from: '/', to: '/channel/fruit', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区-水果买菜', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'home.kingkong.hotdeals-open', from: '/', to: '/hotdeals', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区-超抢手(qa:R1)', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'home.hotdeals-open', from: '/', to: '/hotdeals', search: {}, searchParams: {}, mode: 'push', params: {}, label: '超抢手卡片区(qa:R1)', ui: { placement: 'content', icon: 'fire', gesture: 'tap' } },
    { id: 'home.shop-open', from: '/', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '首页商家卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    // ---- 超抢手 ----
    { id: 'hotdeals.shop-open', from: '/hotdeals', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '超抢手商家卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'hotdeals.item-open', from: '/hotdeals', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '超抢手商品卡', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    // ---- 频道 ----
    { id: 'channel.search-open', from: ['/channel/food', '/channel/market', '/channel/fruit'], to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '频道搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'channel.shop-open', from: '/channel/food', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '频道商家卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'channel.shopitem-open', from: '/channel/food', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '商家卡横滑商品(qa:R2)', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'channel.shopmore-open', from: '/channel/food', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '横滑区查看更多(qa:R2)', ui: { placement: 'content', icon: 'more', gesture: 'tap' } },
    { id: 'channel.market.deal-open', from: '/channel/market', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '爆好价商品', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'channel.market.shop-open', from: '/channel/market', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '附近好店卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'channel.fruit.shop-open', from: '/channel/fruit', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '水果店铺卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'channel.fruit.item-open', from: '/channel/fruit', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '商品+进店加购(qa:R3)', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    // ---- 看病买药 ----
    { id: 'medicine.category-open', from: '/channel/medicine', to: '/channel/medicine/cat', search: {}, searchParams: { cat: 'string' }, mode: 'push', params: {}, label: '药品分类金刚区', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'medicine.pharmacy-open', from: '/channel/medicine', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '附近药店卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'medicine.search-open', from: '/channel/medicine', to: '/channel/medicine/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '买药搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'medcat.search-open', from: '/channel/medicine/cat', to: '/channel/medicine/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '药品分类页搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'medcat.drug-open', from: '/channel/medicine/cat', to: '/drug/:drugId', search: {}, searchParams: {}, mode: 'push', params: { drugId: 'string' }, label: '药品卡(等N家在售)', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'medsearch.drug-open', from: '/channel/medicine/search', to: '/drug/:drugId', search: {}, searchParams: {}, mode: 'push', params: { drugId: 'string' }, label: '搜索结果药品', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'drug.pharmacy-open', from: '/drug/:drugId', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '在售商家-立即购买', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    // ---- 天天红包 ----
    { id: 'redpacket.wallet-open', from: '/daily-redpacket', to: '/coupons', search: {}, searchParams: {}, mode: 'push', params: {}, label: '我的N张红包', ui: { placement: 'topbar', icon: 'ticket', gesture: 'tap' } },
    { id: 'redpacket.shop-open', from: '/daily-redpacket', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '红包商家-去使用', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'redpacket.item-open', from: '/daily-redpacket', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '红包商家商品', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    // ---- 搜索 ----
    { id: 'search.submit', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '搜索按钮', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'search.history-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '历史搜索词', ui: { placement: 'content', icon: 'history', gesture: 'tap' } },
    { id: 'search.discover-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '搜索发现词', ui: { placement: 'content', icon: 'discover', gesture: 'tap' } },
    { id: 'search.rankshop-open', from: '/search', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '专属好店卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'searchresult.shop-open', from: '/search/result', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '搜索结果商家卡(零售)', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'searchresult.item-open', from: '/search/result', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '匹配商品(零售)', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'searchresult.restshop-open', from: '/search/result', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '搜索结果商家卡(餐饮)', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'searchresult.restitem-open', from: '/search/result', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '匹配商品(餐饮)', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'searchresult.coupon-open', from: '/search/result', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '爆红包去使用', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'searchresult.research', from: '/search/result', to: '/search', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '改词重搜', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    // ---- 店铺 ----
    { id: 'shop.chat-open', from: '/shop/:shopId', to: '/chat/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '商家客服', ui: { placement: 'topbar', icon: 'service', gesture: 'tap' } },
    { id: 'shop.group-open', from: '/shop/:shopId', to: '/shop/:shopId/group', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '好友拼单', ui: { placement: 'content', icon: 'group', gesture: 'tap' } },
    { id: 'shop.checkout-open', from: '/shop/:shopId', to: '/checkout', search: {}, searchParams: {}, mode: 'push', params: {}, label: '去结算', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'retail.checkout-open', from: '/retail/:shopId', to: '/checkout', search: {}, searchParams: {}, mode: 'push', params: {}, label: '零售店去结算(qa:Q15)', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'group.order-open', from: '/shop/:shopId/group', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'replace', params: { shopId: 'string' }, label: '拼单-去点餐', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    { id: 'group.cancel', from: '/shop/:shopId/group', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'replace', params: { shopId: 'string' }, label: '取消拼单', ui: { placement: 'topbar', icon: 'close', gesture: 'tap' } },
    { id: 'shopchat.shop-open', from: '/chat/shop/:shopId', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '聊天页店铺入口', ui: { placement: 'topbar', icon: 'shop', gesture: 'tap' } },
    // ---- 结算 ----
    { id: 'checkout.address-open', from: '/checkout', to: '/address/select', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {}, label: '收货地址卡', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },
    { id: 'checkout.platformcoupon-open', from: '/checkout', to: '/checkout/coupons', search: {}, searchParams: { type: 'string' }, mode: 'push', params: {}, label: '平台红包行', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'checkout.shopcoupon-open', from: '/checkout', to: '/checkout/coupons', search: {}, searchParams: { type: 'string', shopId: 'string' }, mode: 'push', params: {}, label: '店铺活动/券行', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'checkout.remark-open', from: '/checkout', to: '/checkout/remark', search: {}, searchParams: {}, mode: 'push', params: {}, label: '备注行', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'checkout.coupon.confirm', from: '/checkout/coupons', to: '/checkout', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '选券确定(合计联动)', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'checkout.remark.done', from: '/checkout/remark', to: '/checkout', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '备注完成', ui: { placement: 'topbar', icon: 'check', gesture: 'tap' } },
    { id: 'checkout.pay.success', from: ['/checkout', '/order/:orderId'], to: '/order/:orderId/success', search: {}, searchParams: {}, mode: 'replace', params: { orderId: 'string' }, label: '收银台-立即付款(qa:Q1)', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'checkout.pay.abandon', from: '/checkout', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'replace', params: { orderId: 'string' }, label: '收银台×(生成待支付单qa:R4)', ui: { placement: 'content', icon: 'close', gesture: 'tap' } },
    { id: 'checkout.exit-home', from: '/checkout', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '结算已失效-返回首页(逃生)', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },
    { id: 'checkout.exit-mine', from: '/checkout', to: '/mine', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '结算已失效-去我的订单(逃生)', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    // ---- 地址 ----
    { id: 'address.select.pick', from: '/address/select', to: '/checkout', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '选中地址返回', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },
    { id: 'address.select.edit-open', from: '/address/select', to: '/address/edit', search: {}, searchParams: { id: 'string' }, mode: 'push', params: {}, label: '地址编辑', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'address.select.add-open', from: '/address/select', to: '/address/edit', search: {}, searchParams: {}, mode: 'push', params: {}, label: '新增收货地址', ui: { placement: 'content', icon: 'add', gesture: 'tap' } },
    { id: 'address.list.add-open', from: '/settings/address', to: '/address/edit', search: {}, searchParams: {}, mode: 'push', params: {}, label: '新增地址', ui: { placement: 'topbar', icon: 'add', gesture: 'tap' } },
    { id: 'address.list.edit-open', from: '/settings/address', to: '/address/edit', search: {}, searchParams: { id: 'string' }, mode: 'push', params: {}, label: '编辑地址', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'address.edit.save', from: '/address/edit', to: '/settings/address', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '保存地址', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    // ---- 订单 ----
    { id: 'order.list.detail-open', from: '/orders', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '订单卡', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    { id: 'order.list.shop-open', from: '/orders', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '订单卡店名', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'order.list.reorder', from: '/orders', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '再买一单(qa:Q6)', ui: { placement: 'content', icon: 'reorder', gesture: 'tap' } },
    { id: 'order.list.review-open', from: '/orders', to: '/order/:orderId/review', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '订单卡-评价', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'order.list.refund-open', from: '/orders', to: '/order/:orderId/refund', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '退款进度', ui: { placement: 'content', icon: 'refund', gesture: 'tap' } },
    { id: 'order.detail.reorder', from: '/order/:orderId', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '详情-再买一单', ui: { placement: 'content', icon: 'reorder', gesture: 'tap' } },
    { id: 'order.detail.review-open', from: '/order/:orderId', to: '/order/:orderId/review', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '详情-评价', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'order.detail.shopchat-open', from: '/order/:orderId', to: '/chat/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '联系商家', ui: { placement: 'content', icon: 'message', gesture: 'tap' } },
    { id: 'order.detail.riderchat-open', from: '/order/:orderId', to: '/chat/rider/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '联系骑士', ui: { placement: 'content', icon: 'message', gesture: 'tap' } },
    { id: 'order.detail.shop-open', from: '/order/:orderId', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '详情店铺卡', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'order.detail.service-open', from: '/order/:orderId', to: '/service', search: {}, searchParams: { orderId: 'string' }, mode: 'push', params: {}, label: '常见问题胶囊', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'order.detail.agent-open', from: '/order/:orderId', to: '/service', search: {}, searchParams: { orderId: 'string' }, mode: 'push', params: {}, label: '专属管家', ui: { placement: 'topbar', icon: 'service', gesture: 'tap' } },
    { id: 'order.detail.rec-open', from: '/order/:orderId', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '推荐流商品', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    { id: 'order.cancel.confirm', from: '/order/:orderId', to: '/order/:orderId/cancel-survey', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '取消订单', ui: { placement: 'content', icon: 'close', gesture: 'tap' } },
    { id: 'order.unpaid.cancel', from: '/order/:orderId', to: '/order/:orderId/cancel-survey', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '待支付-取消订单(qa:R4)', ui: { placement: 'content', icon: 'close', gesture: 'tap' } },
    { id: 'order.detail.refund-open', from: '/order/:orderId', to: '/order/:orderId/refund', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '退款卡-打款成功', ui: { placement: 'content', icon: 'refund', gesture: 'tap' } },
    { id: 'order.similar-open', from: '/order/:orderId', to: '/channel/food', search: {}, searchParams: {}, mode: 'push', params: {}, label: '相似好店', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'cancel.survey.submit', from: '/order/:orderId/cancel-survey', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'replace', params: { orderId: 'string' }, label: '取消原因提交', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    // ---- 退款 ----
    { id: 'refund.reason.next', from: ['/order/:orderId', '/service'], to: '/order/:orderId/refund/apply', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '售后原因-确认', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'refund.contact.chat', from: ['/order/:orderId', '/order/:orderId/refund/apply', '/service'], to: '/chat/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '联系商户-消息', ui: { placement: 'content', icon: 'message', gesture: 'tap' } },
    { id: 'refund.form.submit', from: '/order/:orderId/refund/apply', to: '/order/:orderId/refund', search: {}, searchParams: {}, mode: 'replace', params: { orderId: 'string' }, label: '提交退款申请(qa:Q11)', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'refund.progress.wallet-open', from: '/order/:orderId/refund', to: '/coupons', search: {}, searchParams: {}, mode: 'push', params: {}, label: '已退红包查看', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    // ---- 支付成功 ----
    { id: 'paysuccess.order-open', from: '/order/:orderId/success', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'replace', params: { orderId: 'string' }, label: '查看订单', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    { id: 'paysuccess.home-open', from: '/order/:orderId/success', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '支付成功-首页', ui: { placement: 'topbar', icon: 'home', gesture: 'tap' } },
    { id: 'paysuccess.rec-open', from: '/order/:orderId/success', to: '/retail/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '成功页推荐', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    // ---- 评价 ----
    { id: 'review.submit', from: '/order/:orderId/review', to: '/review-center', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '提交评价(qa:Q10)', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'reviewcenter.review-open', from: '/review-center', to: '/order/:orderId/review', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '评价中心-评价按钮', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'reviewcenter.task-open', from: '/review-center', to: '/order/:orderId/review', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '任务卡-去评价', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    // ---- 客服 ----
    { id: 'service.order-open', from: '/service', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '关联订单卡', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    { id: 'service.orderpick-open', from: '/service', to: '/orders', search: {}, searchParams: {}, mode: 'push', params: {}, label: '咨询其他订单', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    // ---- 消息 ----
    { id: 'message.rider-open', from: '/messages', to: '/chat/rider/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '骑士会话行', ui: { placement: 'content', icon: 'message', gesture: 'tap' } },
    { id: 'message.shop-open', from: '/messages', to: '/chat/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '商家会话行', ui: { placement: 'content', icon: 'message', gesture: 'tap' } },
    { id: 'message.order-open', from: '/messages', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '订单通知', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    { id: 'message.settings-open', from: '/messages', to: '/settings/notifications', search: {}, searchParams: {}, mode: 'push', params: {}, label: '消息设置', ui: { placement: 'topbar', icon: 'settings', gesture: 'tap' } },
    { id: 'riderchat.order-open', from: '/chat/rider/:orderId', to: '/order/:orderId', search: {}, searchParams: {}, mode: 'push', params: { orderId: 'string' }, label: '聊天页订单卡', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    // ---- 我的 ----
    { id: 'mine.settings-open', from: '/mine', to: '/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置齿轮', ui: { placement: 'topbar', icon: 'settings', gesture: 'tap' } },
    { id: 'mine.coupons-open', from: '/mine', to: '/coupons', search: {}, searchParams: {}, mode: 'push', params: {}, label: '红包卡券入口', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'mine.orders-open', from: '/mine', to: '/orders', search: {}, searchParams: { tab: 'string' }, mode: 'push', params: {}, label: '订单入口', ui: { placement: 'content', icon: 'order', gesture: 'tap' } },
    { id: 'mine.address-open', from: '/mine', to: '/settings/address', search: {}, searchParams: {}, mode: 'push', params: {}, label: '我的地址', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },
    { id: 'mine.service-open', from: '/mine', to: '/service', search: {}, searchParams: {}, mode: 'push', params: {}, label: '我的客服', ui: { placement: 'content', icon: 'service', gesture: 'tap' } },
    { id: 'mine.favshop-open', from: '/mine', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '关注/常点店', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'mine.rec-open', from: '/mine', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '推荐流商品', ui: { placement: 'content', icon: 'item', gesture: 'tap' } },
    // ---- 设置 ----
    { id: 'settings.profile-open', from: '/settings', to: '/settings/profile', search: {}, searchParams: {}, mode: 'push', params: {}, label: '用户信息卡', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'settings.address-open', from: '/settings', to: '/settings/address', search: {}, searchParams: {}, mode: 'push', params: {}, label: '收货地址管理', ui: { placement: 'content', icon: 'pin', gesture: 'tap' } },
    { id: 'settings.security-open', from: '/settings', to: '/settings/security', search: {}, searchParams: {}, mode: 'push', params: {}, label: '账号与安全', ui: { placement: 'content', icon: 'shield', gesture: 'tap' } },
    { id: 'settings.payment-open', from: '/settings', to: '/settings/payment', search: {}, searchParams: {}, mode: 'push', params: {}, label: '支付设置', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'settings.notif-open', from: '/settings', to: '/settings/notifications', search: {}, searchParams: {}, mode: 'push', params: {}, label: '消息通知设置', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'settings.general-open', from: '/settings', to: '/settings/general', search: {}, searchParams: {}, mode: 'push', params: {}, label: '通用设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    // ---- 券包 ----
    { id: 'coupon.use-open', from: '/coupons', to: '/channel/food', search: {}, searchParams: {}, mode: 'push', params: {}, label: '券-去使用(qa:Q4)', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    // ---- 购物车 ----
    { id: 'cart.shop-open', from: '/cart', to: '/shop/:shopId', search: {}, searchParams: {}, mode: 'push', params: { shopId: 'string' }, label: '购物车店铺名', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },
    { id: 'cart.checkout-open', from: '/cart', to: '/checkout', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一键结算(qa:Q7)', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'cart.address-open', from: '/cart', to: '/address/select', search: {}, searchParams: { from: 'string' }, mode: 'push', params: {}, label: '购物车地址下拉', ui: { placement: 'topbar', icon: 'pin', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
