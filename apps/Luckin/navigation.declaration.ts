/**
 * Luckin navigation FSM — generated from docs/luckin-replication/spec.json v1.0.2.
 * Change the spec first, then rerun assets/gen_declaration.py.
 */
import type { NavigationDeclaration } from './navigation.types';

export const NAVIGATION_DECLARATION = {
  app: 'luckin',
  routes: [
    {
      path: "/", component: "MenuMainPage",
      params: {}, entryPoint: "home",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.menu.main.base", search: {}, description: "自提模式(默认):门店栏+经典菜单/天天9.9/我的常点",
          actions: [
            { id: "menu.mode.select.target", label: "自提/外送 分段", behavior: "select" },
            { id: "menu.tab.select.target", label: "经典菜单/天天9.9/我的常点 子Tab", behavior: "select" },
            { id: "menu.category.select.target", label: "左侧分类锚点", behavior: "select" },
            { id: "menu.usual.add", label: "我的常点/收藏口味 卡", behavior: "modify" },
            { id: "menu.cart.open", label: "底部购物袋浮条", behavior: "open" },
            { id: "menu.daily99.claim", label: "天天9.9「立即领取」banner", behavior: "submit" },
            { id: "common.feature.unavailable", label: "拼单按钮", behavior: "other" },
          ],
        },
        {
          id: "luckin.menu.main.mode.delivery", search: {"view": "mode.delivery"}, description: "外送模式:地址栏+经典菜单/外送专区/我的常点+配送费凑单条",
          actions: [
          ],
        },
        {
          id: "luckin.menu.main.tab.classic", search: {"view": "tab.classic"}, description: "经典菜单(默认)",
          actions: [
          ],
        },
        {
          id: "luckin.menu.main.tab.daily99", search: {"view": "tab.daily99"}, description: "天天9.9",
          actions: [
          ],
        },
        {
          id: "luckin.menu.main.tab.myusual", search: {"view": "tab.myusual"}, description: "我的常点/我收藏的口味",
          actions: [
          ],
        },
        {
          id: "luckin.cart.panel", search: {"cart": "1"}, description: "有商品",
          actions: [
            { id: "cart.item.check.toggle", label: "商品勾选框", behavior: "toggle" },
            { id: "cart.item.qty.step", label: "数量 − / +", behavior: "modify" },
            { id: "cart.clear.ask", label: "清空购物车", behavior: "modify" },
            { id: "cart.clear.confirm", label: "清空确认「确定」", behavior: "modify" },
          ],
        },
        {
          id: "luckin.cart.panel.empty", search: {"cart": "1", "view": "empty"}, description: "空购物车(预计¥0,不可结算)",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "菜单(点单主页)",
    },
    {
      path: "/home", component: "HomeMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.home.main.base", search: {}, description: "首页",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "首页",
    },
    {
      path: "/search", component: "SearchMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.search.main.base", search: {}, description: "搜索",
          actions: [
            { id: "search.keyword.input", label: "搜索输入框", behavior: "input", paramsSchema: {"value": "string"} },
            { id: "search.submit.run", label: "搜索/确认", behavior: "submit" },
            { id: "search.history.select.target", label: "历史搜索chip", behavior: "select" },
            { id: "search.history.clear", label: "清空历史", behavior: "modify" },
          ],
        },
      ],
      queryParams: {},
      description: "搜索",
    },
    {
      path: "/product/:itemId", component: "ProductCustomizePage",
      params: {"itemId": "string"}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.product.customize.base", search: {}, description: "商品定制(规格面板)",
          actions: [
            { id: "product.temp.select.target", label: "温度选项(冰/热/去冰)", behavior: "select" },
            { id: "product.sweetness.select.target", label: "糖度选项", behavior: "select" },
            { id: "product.size.select.target", label: "规格(大杯/超大杯+¥)", behavior: "select" },
            { id: "product.bubble.select.target", label: "气泡选项", behavior: "select" },
            { id: "product.addon.select.target", label: "奶/加料选项", behavior: "select" },
            { id: "product.qty.step", label: "数量 − / +", behavior: "modify" },
            { id: "product.flavor.save", label: "保存口味", behavior: "submit" },
            { id: "product.exchange.add", label: "换购小食「+」", behavior: "modify" },
            { id: "product.cart.add", label: "加入购物车", behavior: "modify" },
          ],
        },
      ],
      queryParams: {},
      description: "商品定制(规格面板)",
    },
    {
      path: "/order/confirm", component: "OrderConfirmPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.order.confirm.base", search: {}, description: "自提:门店+取餐时间",
          actions: [
            { id: "order.mode.select.target", label: "自提/外送 分段", behavior: "select" },
            { id: "order.storeConfirm.panel.open", label: "确认当前门店", behavior: "open" },
            { id: "order.exchange.open", label: "超值换购区", behavior: "open" },
            { id: "order.coupon.open", label: "更改优惠/优惠券", behavior: "open" },
            { id: "order.payment.select.target", label: "支付方式行", behavior: "select" },
            { id: "order.note.open", label: "备注特殊要求", behavior: "open" },
            { id: "order.closed.dismiss", label: "门店打烊提示「我知道了」", behavior: "other" },
          ],
        },
        {
          id: "luckin.order.confirm.delivery", search: {"view": "delivery"}, description: "外送:收货地址+配送费(G4未补,inferred复用自提结构)",
          actions: [
          ],
        },
        {
          id: "luckin.store.confirm", search: {"storeConfirm": "1"}, description: "当前门店确认弹层",
          actions: [
            { id: "storeConfirm.store.accept", label: "确定门店", behavior: "other" },
            { id: "storeConfirm.mute.toggle", label: "不再提醒", behavior: "toggle" },
          ],
        },
        {
          id: "luckin.order.exchange", search: {"exchange": "1"}, description: "超值换购面板",
          actions: [
            { id: "exchange.item.add", label: "换购商品「+」", behavior: "modify" },
            { id: "exchange.confirm.add", label: "一键换购", behavior: "modify" },
          ],
        },
        {
          id: "luckin.order.coupon", search: {"coupon": "1"}, description: "选择优惠券",
          actions: [
            { id: "orderCoupon.select.target", label: "优惠券「去使用/选择」", behavior: "select" },
            { id: "orderCoupon.rule.toggle", label: "使用规则下拉", behavior: "toggle" },
          ],
        },
        {
          id: "luckin.order.note", search: {"note": "1"}, description: "订单备注面板",
          actions: [
            { id: "orderNote.contactless.select.target", label: "无接触配送(需要/不需要)", behavior: "select" },
            { id: "orderNote.napkin.select.target", label: "纸巾(需要/不需要)", behavior: "select" },
            { id: "orderNote.text.input", label: "备注文本输入", behavior: "input", paramsSchema: {"value": "string"} },
            { id: "orderNote.confirm.save", label: "确定", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "确认订单",
    },
    {
      path: "/order/:orderId", component: "OrderDetailPage",
      params: {"orderId": "string"}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.order.detail.base", search: {}, description: "待付款:倒计时+去支付+取消订单",
          actions: [
            { id: "orderDetail.cancel.ask", label: "取消订单", behavior: "other" },
            { id: "orderDetail.cancel.confirm", label: "取消确认「确定」", behavior: "submit" },
            { id: "orderDetail.invite.claim", label: "一键领取9.9券", behavior: "submit" },
          ],
        },
        {
          id: "luckin.order.detail.making", search: {"view": "making"}, description: "制作中(待取):取餐号+制作进度",
          actions: [
          ],
        },
        {
          id: "luckin.order.detail.ready", search: {"view": "ready"}, description: "待取/取餐:取餐号大字+二维码(inferred,qa:Q4b未答)",
          actions: [
          ],
        },
        {
          id: "luckin.order.detail.done", search: {"view": "done"}, description: "已完成:再来一单/开发票",
          actions: [
          ],
        },
        {
          id: "luckin.order.pay", search: {"pay": "1"}, description: "微信收银台(模拟支付)",
          actions: [
            { id: "pay.method.select.target", label: "付款方式「更改」", behavior: "select" },
            { id: "pay.password.input", label: "数字键盘输入6位密码", behavior: "input", paramsSchema: {"value": "string"} },
          ],
        },
      ],
      queryParams: {},
      description: "订单详情",
    },
    {
      path: "/order/:orderId/success", component: "OrderSuccessPage",
      params: {"orderId": "string"}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.order.success.base", search: {}, description: "支付成功",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "支付成功",
    },
    {
      path: "/orders", component: "OrdersListPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.orders.list.base", search: {}, description: "订单列表",
          actions: [
            { id: "orders.tab.select.target", label: "全部/门店/卡券/即享 标签", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "订单列表",
    },
    {
      path: "/store/picker", component: "StorePickerPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.store.picker.base", search: {}, description: "选择门店",
          actions: [
            { id: "store.search.input", label: "门店搜索框", behavior: "input", paramsSchema: {"value": "string"} },
          ],
        },
      ],
      queryParams: {},
      description: "选择门店",
    },
    {
      path: "/address", component: "AddressListPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.address.list.base", search: {}, description: "收货地址",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "收货地址",
    },
    {
      path: "/address/edit", component: "AddressEditPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.address.edit.base", search: {}, description: "新建/编辑地址",
          actions: [
            { id: "addressEdit.gender.select.target", label: "性别(先生/女士)", behavior: "select" },
            { id: "addressEdit.name.input", label: "姓名输入", behavior: "input", paramsSchema: {"value": "string"} },
            { id: "addressEdit.phone.input", label: "手机号输入", behavior: "input", paramsSchema: {"value": "string"} },
            { id: "addressEdit.region.open", label: "所在区域(省市区选择器)", behavior: "open" },
            { id: "addressEdit.detail.input", label: "门牌号输入", behavior: "input", paramsSchema: {"value": "string"} },
            { id: "addressEdit.tag.select.target", label: "标签(公司/家/学校)", behavior: "select" },
            { id: "addressEdit.default.toggle", label: "设为默认开关", behavior: "toggle" },
            { id: "addressEdit.form.save", label: "保存", behavior: "submit" },
            { id: "addressEdit.form.delete", label: "删除(编辑态)", behavior: "modify" },
          ],
        },
      ],
      queryParams: {},
      description: "新建/编辑地址",
    },
    {
      path: "/member", component: "MemberCardPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.member.card.base", search: {}, description: "会员卡(瑞王卡)",
          actions: [
            { id: "member.redeem.open", label: "开通/兑换瑞王卡", behavior: "open" },
          ],
        },
        {
          id: "luckin.member.redeem", search: {"redeem": "1"}, description: "兑换会员卡弹层",
          actions: [
            { id: "memberRedeem.code.input", label: "兑换码输入框", behavior: "input", paramsSchema: {"value": "string"} },
            { id: "memberRedeem.agree.toggle", label: "服务协议复选框", behavior: "toggle" },
            { id: "memberRedeem.form.submit", label: "确定(兑换)", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "会员卡(瑞王卡)",
    },
    {
      path: "/member/level", component: "MemberLevelPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.member.level.base", search: {}, description: "会员等级(小蓝鹿)",
          actions: [
            { id: "level.rules.toggle", label: "查看权益规则", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "会员等级(小蓝鹿)",
    },
    {
      path: "/member/beans", component: "MemberBeansPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.member.beans.base", search: {}, description: "小蓝豆明细",
          actions: [
            { id: "beans.tab.select.target", label: "消费/过期记录 切换", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "小蓝豆明细",
    },
    {
      path: "/coupons", component: "CouponsMinePage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.coupons.mine.base", search: {}, description: "饮品/食品/配送券(有内容)",
          actions: [
            { id: "coupons.tab.select.target", label: "三类券 标签", behavior: "select" },
            { id: "coupons.inflate.run", label: "券「去膨胀」", behavior: "submit" },
            { id: "coupons.remind.set", label: "券「生效通知」", behavior: "other" },
          ],
        },
        {
          id: "luckin.coupons.mine.instant", search: {"view": "instant"}, description: "即享优惠券(空态)",
          actions: [
          ],
        },
        {
          id: "luckin.coupons.mine.bought", search: {"view": "bought"}, description: "我的购券",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "我的优惠券",
    },
    {
      path: "/coupons/center", component: "CouponsCenterPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.coupons.center.base", search: {}, description: "领券中心(福利中心)",
          actions: [
            { id: "couponsCenter.claim.run", label: "立即领取/开卡立享", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "领券中心(福利中心)",
    },
    {
      path: "/card/coffee", component: "CardCoffeePage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.card.coffee.base", search: {}, description: "咖啡卡券",
          actions: [
            { id: "cardCoffee.invalid.toggle", label: "查看无效券", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "咖啡卡券",
    },
    {
      path: "/card/gift", component: "CardGiftPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.card.gift.base", search: {}, description: "我的礼品卡",
          actions: [
            { id: "cardGift.history.toggle", label: "历史记录", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "我的礼品卡",
    },
    {
      path: "/alliance", component: "AllianceMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.alliance.main.base", search: {}, description: "优惠联盟",
          actions: [
            { id: "alliance.tab.select.target", label: "金融/航空/生活 标签", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "优惠联盟",
    },
    {
      path: "/calendar", component: "CalendarMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.calendar.main.base", search: {}, description: "咖啡月历",
          actions: [
            { id: "calendar.month.select.target", label: "查看历月", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "咖啡月历",
    },
    {
      path: "/instant", component: "InstantHomePage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.instant.home.base", search: {}, description: "即享商城",
          actions: [
            { id: "instant.category.select.target", label: "分类选项卡", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "即享商城",
    },
    {
      path: "/instant/:itemId", component: "InstantDetailPage",
      params: {"itemId": "string"}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.instant.detail.base", search: {}, description: "商品(默认)",
          actions: [
            { id: "instantDetail.tab.select.target", label: "商品/评价/详情 Tab", behavior: "select" },
            { id: "instantDetail.sku.select.target", label: "规格选择(多种可选)", behavior: "select" },
            { id: "instantDetail.cart.add", label: "加入购物车", behavior: "modify" },
            { id: "instantDetail.fav.toggle", label: "收藏", behavior: "toggle" },
          ],
        },
        {
          id: "luckin.instant.detail.tab.review", search: {"view": "tab.review"}, description: "评价",
          actions: [
          ],
        },
        {
          id: "luckin.instant.detail.tab.detail", search: {"view": "tab.detail"}, description: "详情图文",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "即享商品详情",
    },
    {
      path: "/instant/cart", component: "InstantCartPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.instant.cart.base", search: {}, description: "即享购物车/结算",
          actions: [
            { id: "instantCart.item.step", label: "商品勾选/数量", behavior: "modify" },
          ],
        },
      ],
      queryParams: {},
      description: "即享购物车/结算",
    },
    {
      path: "/instant/service", component: "InstantServicePage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.instant.service.base", search: {}, description: "即享客服",
          actions: [
            { id: "service.quickCard.select.target", label: "快捷功能卡(查询订单/发货配送/价格保护/修改地址/运费)", behavior: "select" },
            { id: "service.quickChip.select.target", label: "底部快捷问题chip(DIY/挂耳冲泡等)", behavior: "select" },
            { id: "service.msg.input", label: "消息输入发送", behavior: "input", paramsSchema: {"value": "string"} },
          ],
        },
      ],
      queryParams: {},
      description: "即享客服",
    },
    {
      path: "/instant/purchases", component: "InstantPurchasesPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.instant.purchases.base", search: {}, description: "购买记录",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "购买记录",
    },
    {
      path: "/mine", component: "MineMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.mine.main.base", search: {}, description: "我的",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "我的",
    },
    {
      path: "/mine/profile", component: "MineProfilePage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.mine.profile.base", search: {}, description: "个人资料",
          actions: [
            { id: "profile.avatar.open", label: "头像", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "个人资料",
    },
    {
      path: "/messages", component: "MessagesListPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.messages.list.base", search: {}, description: "消息/通知(智能助手 lucky)",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "消息/通知(智能助手 lucky)",
    },
    {
      path: "/wallet", component: "WalletMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.wallet.main.base", search: {}, description: "钱包/余额(占位页)",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "钱包/余额(占位页)",
    },
    {
      path: "/invoice", component: "InvoiceMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.invoice.main.base", search: {}, description: "发票管理(占位页)",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "发票管理(占位页)",
    },
    {
      path: "/settings", component: "SettingsMainPage",
      params: {}, entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: 'main content' }],
      uiStates: [
        {
          id: "luckin.settings.main.base", search: {}, description: "设置(占位页)",
          actions: [
          ],
        },
      ],
      queryParams: {},
      description: "设置(占位页)",
    },
  ],
  transitions: [
    {
      id: "tabbar.home-open", from: "*", to: "/home",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "首页 Tab", ui: { placement: "tabbar", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.menu-open", from: "*", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "菜单 Tab", ui: { placement: "tabbar", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.instant-open", from: "*", to: "/instant",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "即享 Tab", ui: { placement: "tabbar", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.member-open", from: "*", to: "/member",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "会员卡 Tab", ui: { placement: "tabbar", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.mine-open", from: "*", to: "/mine",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "我的 Tab", ui: { placement: "tabbar", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "menu.search-open", from: "/", to: "/search",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "搜索栏", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "menu.store-open", from: "/", to: "/store/picker",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "门店栏(门店名+距离)", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "menu.coupons-open", from: "/", to: "/coupons/center",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "券banner「更多优惠›」", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "menu.product-open", from: "/", to: "/product/:itemId",
      search: {}, searchParams: {}, mode: "push", params: {"itemId": "string"},
      label: "商品行卡(点卡片本身)", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "menu.checkout-open", from: "/", to: "/order/confirm",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "去结算", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.search-open", from: "/home", to: "/search",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "搜索栏", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.menu-open", from: "/home", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "天天9.9 大礼包入口", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.product-open", from: "/home", to: "/product/:itemId",
      search: {}, searchParams: {}, mode: "push", params: {"itemId": "string"},
      label: "推荐商品卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.instant-open", from: "/home", to: "/instant/:itemId",
      search: {}, searchParams: {}, mode: "push", params: {"itemId": "string"},
      label: "即享周边卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "search.product-open", from: "/search", to: "/product/:itemId",
      search: {}, searchParams: {}, mode: "push", params: {"itemId": "string"},
      label: "结果商品卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "product.buynow-open", from: "/product/:itemId", to: "/order/confirm",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "立即购买", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "cart.checkout-open", from: {"path": "/", "search": {"cart": "1"}}, to: "/order/confirm",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "去结算", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "order.store-open", from: "/order/confirm", to: "/store/picker",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "门店行(自提)", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "order.address-open", from: "/order/confirm", to: "/address",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "收货地址行(外送)", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "order.submit-open", from: "/order/confirm", to: "/order/:orderId",
      search: {}, searchParams: {}, mode: "push", params: {"orderId": "string"},
      label: "提交订单", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "storeConfirm.change-open", from: {"path": "/order/confirm", "search": {"storeConfirm": "1"}}, to: "/store/picker",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "更换门店", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orderDetail.pay-open", from: "/order/:orderId", to: "/order/:orderId",
      search: {"pay": "1"}, searchParams: {}, mode: "push", params: {"orderId": "string"},
      label: "去支付", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orderDetail.reorder-open", from: "/order/:orderId", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "再来一单(已完成)", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "pay.success-open", from: {"path": "/order/:orderId", "search": {"pay": "1"}}, to: "/order/:orderId/success",
      search: {}, searchParams: {}, mode: "push", params: {"orderId": "string"},
      label: "数字键盘输入6位密码", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "success.detail-open", from: "/order/:orderId/success", to: "/order/:orderId",
      search: {}, searchParams: {}, mode: "push", params: {"orderId": "string"},
      label: "查看订单", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "success.home-open", from: "/order/:orderId/success", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "返回首页", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.detail-open", from: "/orders", to: "/order/:orderId",
      search: {}, searchParams: {}, mode: "push", params: {"orderId": "string"},
      label: "订单卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.reorder-open", from: "/orders", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "再来一单", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.invoice-open", from: "/orders", to: "/invoice",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "开发票", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "store.select-back", from: "/store/picker", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "门店列表项", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "address.select-back", from: "/address", to: "/order/confirm",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "地址项", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "address.edit-open", from: "/address", to: "/address/edit",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "修改", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "address.new-open", from: "/address", to: "/address/edit",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "新增收货地址", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "member.use-open", from: "/member", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "全场9.9兑换券「去使用」", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "member.level-open", from: "/member", to: "/member/level",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "会员等级入口", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "level.beans-open", from: "/member/level", to: "/member/beans",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "小蓝豆/积分明细入口", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "coupons.use-open", from: "/coupons", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "券「去使用」", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "coupons.center-open", from: "/coupons", to: "/coupons/center",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "领优惠券卡/立即解锁", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "couponsCenter.menu-open", from: "/coupons/center", to: "/",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "活动「去喝一杯」", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "calendar.gift-open", from: "/calendar", to: "/card/gift",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "送礼品卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "instant.detail-open", from: "/instant", to: "/instant/:itemId",
      search: {}, searchParams: {}, mode: "push", params: {"itemId": "string"},
      label: "商品卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "instant.service-open", from: "/instant", to: "/instant/service",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "客服入口", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "instant.cart-open", from: "/instant", to: "/instant/cart",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "购物车入口", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "instantDetail.buynow-open", from: "/instant/:itemId", to: "/instant/cart",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "立即购买", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "instantDetail.cart-open", from: "/instant/:itemId", to: "/instant/cart",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "购物车图标", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "instantCart.checkout-open", from: "/instant/cart", to: "/order/:orderId",
      search: {"pay": "1"}, searchParams: {}, mode: "push", params: {"orderId": "string"},
      label: "去结算/立即购买预估", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.profile-open", from: "/mine", to: "/mine/profile",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "头像/个人信息", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.orders-open", from: "/mine", to: "/orders",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "我的订单", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.coffeeCard-open", from: "/mine", to: "/card/coffee",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "咖啡卡券", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.coupons-open", from: "/mine", to: "/coupons",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "优惠券", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.wallet-open", from: "/mine", to: "/wallet",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "钱包/余额", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.messages-open", from: "/mine", to: "/messages",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "消息/通知", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.purchases-open", from: "/mine", to: "/instant/purchases",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "即享购买记录", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.partner-open", from: "/mine", to: "/settings",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "招商加盟/租赁合作", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.giftCard-open", from: "/mine", to: "/card/gift",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "礼品卡", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.alliance-open", from: "/mine", to: "/alliance",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "优惠联盟", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.calendar-open", from: "/mine", to: "/calendar",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "咖啡月历", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.settings-open", from: "/mine", to: "/settings",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "设置图标", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "profile.address-open", from: "/mine/profile", to: "/address",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "收货地址", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "profile.settings-open", from: "/mine/profile", to: "/settings",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "账号管理/支付设置/通用设置", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
    {
      id: "messages.item-open", from: "/messages", to: "/coupons/center",
      search: {}, searchParams: {}, mode: "push", params: {},
      label: "消息条目", ui: { placement: "content", icon: 'forward', gesture: 'tap' },
    },
  ],
  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
