// AUTO-GENERATED from docs/didi-replication/spec.json (v0.3.0-draft) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type { NavigationDeclaration } from './navigation.types';

export const NAVIGATION_DECLARATION = {
  app: 'didi',
  routes: [
    {
      path: '/',
      component: 'HomeMainPage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.home.main.base', search: {}, description: '首页·出行(地图+叫车入口+金刚区)',
          actions: [
            { id: 'home.map.pan', label: '首页地图按住四向拖动或双指缩放并更新上车点', behavior: 'submit' },
            { id: 'home.map.locate', label: '首页地图定位回中', behavior: 'submit' },
            { id: 'home.coupon.claim', label: '一起5折 banner·收下', behavior: 'submit' },
            { id: 'home.main.stub', label: '金刚区·未实现服务(借钱/公交地铁等)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '首页·出行(地图+叫车入口+金刚区)',
    },
    {
      path: '/dest/search',
      component: 'DestSearchPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.dest.search.base', search: {}, description: '地点搜索(联想+分城市结果+常用地点)',
          actions: [
            { id: 'dest.search.input', label: '目的地输入框', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'dest.search.clear', label: '清空搜索词', behavior: 'submit' },
            { id: 'dest.search.favorite.toggle', label: '收藏夹筛选', behavior: 'toggle' },
            { id: 'dest.search.voice', label: '点我说地址(语音)', behavior: 'submit' },
            { id: 'dest.search.close', label: '返回上一页', behavior: 'submit' },
            { id: 'pickup.search.close', label: '返回上车点确认', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '地点搜索(联想+分城市结果+常用地点)',
    },
    {
      path: '/pickup/confirm',
      component: 'PickupConfirmPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.pickup.confirm.base', search: {}, description: '确认上车位置(搜索+拖图+附近推荐)',
          actions: [
            { id: 'pickup.confirm.pan', label: '按住地图向上/下/左/右拖动或双指缩放;缩小后扩大连续可视范围并更新中心上车点', behavior: 'submit' },
            { id: 'pickup.confirm.pick', label: '选择推荐上车点', behavior: 'submit' },
            { id: 'pickup.confirm.locate', label: '定位回到当前区域', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '确认上车位置(搜索+拖图+附近推荐)',
    },
    {
      path: '/car/select',
      component: 'CarSelectPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.car.select.base', search: {}, description: '车型选择/预估价(分类栏+分组勾选+呼叫N种)',
          actions: [
            { id: 'car.select.type.toggle', label: '车型勾选框', behavior: 'toggle' },
            { id: 'car.select.category.pick', label: '左侧分类栏', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '车型选择/预估价(分类栏+分组勾选+呼叫N种)',
    },
    {
      path: '/fare/rules',
      component: 'FareRulesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.fare.rules.base', search: {}, description: '计价规则(一口价说明)',
        },
      ],
      queryParams: {},
      description: '计价规则(一口价说明)',
    },
    {
      path: '/call/waiting',
      component: 'CallWaitingPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.call.waiting.base', search: {}, description: '呼叫中·正在通知司机',
          actions: [
            { id: 'call.waiting.append.toggle', label: '追加车型勾选', behavior: 'toggle' },
            { id: 'call.waiting.append.confirm', label: '确认追加车型', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '呼叫中·正在通知司机',
    },
    {
      path: '/trip/driver',
      component: 'TripDriverPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.driver.base', search: {}, description: '司机已接单·接驾中',
          actions: [
            { id: 'trip.driver.call', label: '联系司机(电话)', behavior: 'submit' },
            { id: 'trip.driver.thanks', label: '感谢红包', behavior: 'submit' },
            { id: 'trip.driver.quiet', label: '去提醒(更安静)', behavior: 'submit' },
            { id: 'trip.driver.address.share', label: '分享当前行程地址(系统分享)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '司机已接单·接驾中',
    },
    {
      path: '/trip/ongoing',
      component: 'TripOngoingPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.ongoing.base', search: {}, description: '行程中(前往目的地+互动流)',
          actions: [
            { id: 'trip.ongoing.acFeedback', label: '空调反馈', behavior: 'submit' },
            { id: 'trip.ongoing.wall.vote', label: '匿名反馈墙投票', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '行程中(前往目的地+互动流)',
    },
    {
      path: '/trip/waypoint',
      component: 'TripWaypointPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.waypoint.base', search: {}, description: '添加途经点',
          actions: [
            { id: 'trip.waypoint.input', label: '途经点输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'trip.waypoint.pick', label: '选择推荐地点', behavior: 'submit' },
            { id: 'trip.waypoint.done', label: '完成', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '添加途经点',
    },
    {
      path: '/trip/changeDest',
      component: 'TripChangedestPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.changeDest.base', search: {}, description: '修改终点',
          actions: [
            { id: 'trip.changeDest.input', label: '新终点输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'trip.changeDest.done', label: '确认修改', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '修改终点',
    },
    {
      path: '/route/select',
      component: 'RouteSelectPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.route.select.base', search: {}, description: '选择路线(多方案+偏好)',
          actions: [
            { id: 'route.select.pick', label: '选择一条路线', behavior: 'submit' },
            { id: 'route.select.pref', label: '偏好选择', behavior: 'submit' },
            { id: 'route.select.done', label: '完成设置', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '选择路线(多方案+偏好)',
    },
    {
      path: '/trip/finish',
      component: 'TripFinishPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.finish.base', search: {}, description: '行程已结束(免密已扣款+评价)',
          actions: [
            { id: 'trip.finish.rate.face', label: '评价表情选择', behavior: 'submit' },
            { id: 'trip.finish.rate.tag.toggle', label: '评价标签', behavior: 'toggle' },
            { id: 'trip.finish.rate.quick', label: '一键好评', behavior: 'submit' },
            { id: 'trip.finish.rate.anonymous.toggle', label: '匿名评价勾选', behavior: 'toggle' },
            { id: 'trip.finish.rate.submit', label: '签名评价提交', behavior: 'submit' },
            { id: 'trip.finish.coupon.claim', label: '领券', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '行程已结束(免密已扣款+评价)',
    },
    {
      path: '/trip/cancel',
      component: 'TripCancelPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.cancel.base', search: {}, description: '取消订单(挽留→取消成功+原因问卷)',
          actions: [
            { id: 'trip.cancel.redispatch', label: '挽留·帮我换辆车', behavior: 'submit' },
            { id: 'trip.cancel.confirm', label: '挽留·不用车了(确认取消)', behavior: 'submit' },
            { id: 'trip.cancel.reason.toggle', label: '取消原因勾选', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '取消订单(挽留→取消成功+原因问卷)',
    },
    {
      path: '/chat/list',
      component: 'ChatListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.chat.list.base', search: {}, description: '司机对话列表',
          actions: [
            { id: 'chat.list.delete', label: '左滑删除会话', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '司机对话列表',
    },
    {
      path: '/chat/detail',
      component: 'ChatDetailPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.chat.detail.base', search: {}, description: '司机对话详情',
          actions: [
            { id: 'chat.detail.input', label: '消息输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'chat.detail.send', label: '发送', behavior: 'submit' },
            { id: 'chat.detail.phrase', label: '快捷短语', behavior: 'submit' },
            { id: 'chat.detail.notify', label: '开启消息通知横幅', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '司机对话详情',
    },
    {
      path: '/reserve/home',
      component: 'ReserveHomePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.reserve.home.base', search: {}, description: '预约用车(预约打车/接送机/包时用车)',
          actions: [
            { id: 'reserve.home.tab', label: '三tab切换', behavior: 'submit' },
            { id: 'reserve.home.time', label: '选择用车时间', behavior: 'submit' },
            { id: 'reserve.home.airport', label: '选择机场/航班', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '预约用车(预约打车/接送机/包时用车)',
    },
    {
      path: '/services/all',
      component: 'ServicesAllPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.services.all.base', search: {}, description: '更多服务(全部服务网格)',
          actions: [
            { id: 'services.all.stub', label: '未实现服务入口', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '更多服务(全部服务网格)',
    },
    {
      path: '/driver/home',
      component: 'DriverHomePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.driver.home.base', search: {}, description: '滴滴代驾 首页',
        },
      ],
      queryParams: {},
      description: '滴滴代驾 首页',
    },
    {
      path: '/driver/select',
      component: 'DriverSelectPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.driver.select.base', search: {}, description: '代驾车型选择(浏览版)',
          actions: [
            { id: 'driver.select.type.toggle', label: '代驾档位勾选', behavior: 'toggle' },
            { id: 'driver.select.call', label: '同意协议并呼叫(暂未开放)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '代驾车型选择(浏览版)',
    },
    {
      path: '/hitch/home',
      component: 'HitchHomePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.hitch.home.base', search: {}, description: '顺风车(乘客/车主,浏览版)',
          actions: [
            { id: 'hitch.home.tab', label: '乘客/车主切换', behavior: 'submit' },
            { id: 'hitch.home.order.filter', label: '市内/跨城/常用路线订单筛选', behavior: 'submit' },
            { id: 'hitch.home.go', label: '顺风车下单(暂未开放)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '顺风车(乘客/车主,浏览版)',
    },
    {
      path: '/delivery/home',
      component: 'DeliveryHomePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.delivery.home.base', search: {}, description: '送货 tab(拉货/搬家)',
          actions: [
            { id: 'delivery.home.tab', label: '送货类型切换', behavior: 'submit' },
            { id: 'delivery.home.go', label: '送货下单(暂未开放)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '送货 tab(拉货/搬家)',
    },
    {
      path: '/travel/home',
      component: 'TravelHomePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.travel.home.base', search: {}, description: '旅行 tab(酒店/机票/火车票)',
          actions: [
            { id: 'travel.home.tab', label: '旅行品类切换', behavior: 'submit' },
            { id: 'travel.home.search', label: '查询(暂未开放)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '旅行 tab(酒店/机票/火车票)',
    },
    {
      path: '/owner/home',
      component: 'OwnerHomePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.owner.home.base', search: {}, description: '车主 tab(车主服务/顺风车)',
          actions: [
            { id: 'owner.home.stub', label: '车主服务入口(暂未开放)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '车主 tab(车主服务/顺风车)',
    },
    {
      path: '/messages',
      component: 'MessagesCenterPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.messages.center.base', search: {}, description: '消息中心',
          actions: [
            { id: 'messages.center.clear', label: '清空全部消息', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '消息中心',
    },
    {
      path: '/message/thread',
      component: 'MessageThreadPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.message.thread.base', search: {}, description: '消息线程(安全/租车/企业/保险/支付)',
          actions: [
            { id: 'message.thread.clear', label: '清空当前消息线程', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '消息线程(安全/租车/企业/保险/支付)',
    },
    {
      path: '/trips',
      component: 'TripsListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trips.list.base', search: {}, description: '订单列表(全部/待出发/待支付)',
          actions: [
            { id: 'trips.list.section', label: '我的行程/全部订单分区切换', behavior: 'submit' },
            { id: 'trips.list.tab', label: '订单tab切换', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '订单列表(全部/待出发/待支付)',
    },
    {
      path: '/orders',
      component: 'TripsListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '独立订单列表' }],
      uiStates: [
        {
          id: 'didi.orders.list.base', search: {}, description: '从我的进入的独立订单页',
        },
      ],
      queryParams: {},
      description: '独立订单列表(返回我的)',
    },
    {
      path: '/trips/filter',
      component: 'TripsFilterPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trips.filter.base', search: {}, description: '订单筛选(服务类型+时间)',
          actions: [
            { id: 'trips.filter.type.toggle', label: '服务类型勾选', behavior: 'toggle' },
            { id: 'trips.filter.reset', label: '重置', behavior: 'submit' },
            { id: 'trips.filter.apply', label: '确认', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '订单筛选(服务类型+时间)',
    },
    {
      path: '/order/detail',
      component: 'OrderDetailPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.order.detail.base', search: {}, description: '订单详情=行程已结束(历史单回看)',
          actions: [
            { id: 'order.detail.rate.face', label: '评价表情选择', behavior: 'submit' },
            { id: 'order.detail.rate.tag.toggle', label: '评价标签', behavior: 'toggle' },
            { id: 'order.detail.rate.submit', label: '提交评价', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '订单详情=行程已结束(历史单回看)',
    },
    {
      path: '/fee/explain',
      component: 'FeeExplainPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.fee.explain.base', search: {}, description: '费用说明·车费卫士',
          actions: [
            { id: 'fee.explain.step', label: '四步tab切换', behavior: 'submit' },
            { id: 'fee.explain.faq.toggle', label: '常见问题展开', behavior: 'toggle' },
            { id: 'fee.explain.dispute', label: '不认可车费', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '费用说明·车费卫士',
    },
    {
      path: '/invoice/entry',
      component: 'InvoiceEntryPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.invoice.entry.base', search: {}, description: '开发票·选择行程',
          actions: [
            { id: 'invoice.entry.trip.toggle', label: '行程勾选', behavior: 'toggle' },
            { id: 'invoice.entry.tab', label: '品类tab', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '开发票·选择行程',
    },
    {
      path: '/invoice/form',
      component: 'InvoiceFormPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.invoice.form.base', search: {}, description: '开发票·填写信息',
          actions: [
            { id: 'invoice.form.headType', label: '抬头类型选择', behavior: 'submit' },
            { id: 'invoice.form.input', label: '表单输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'invoice.form.itinerary.toggle', label: '发送行程单开关', behavior: 'toggle' },
            { id: 'invoice.form.submit', label: '提交', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '开发票·填写信息',
    },
    {
      path: '/me',
      component: 'MeMainPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.me.main.base', search: {}, description: '我的',
          actions: [
            { id: 'me.main.stub', label: '金刚区·未实现入口', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '我的',
    },
    {
      path: '/wallet/main',
      component: 'WalletMainPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.wallet.main.base', search: {}, description: '我的钱包',
          actions: [
            { id: 'wallet.main.stub', label: '金融服务入口(暂未开放)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '我的钱包',
    },
    {
      path: '/coupons/list',
      component: 'CouponsListPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.coupons.list.base', search: {}, description: '优惠券',
          actions: [
            { id: 'coupons.list.tab', label: '分类chip切换', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '优惠券',
    },
    {
      path: '/pay/settings',
      component: 'PaySettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.pay.settings.base', search: {}, description: '支付设置',
        },
      ],
      queryParams: {},
      description: '支付设置',
    },
    {
      path: '/pay/password',
      component: 'PayPasswordPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.pay.password.base', search: {}, description: '支付密码管理',
          actions: [
            { id: 'pay.password.change', label: '修改密码(键盘mock)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '支付密码管理',
    },
    {
      path: '/pay/methods',
      component: 'PayMethodsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.pay.methods.base', search: {}, description: '免密支付设置',
          actions: [
            { id: 'pay.methods.toggle', label: '渠道开通/关闭', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '免密支付设置',
    },
    {
      path: '/family/pay',
      component: 'FamilyPayPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.family.pay.base', search: {}, description: '亲友代付',
          actions: [
            { id: 'family.pay.tab', label: '代付tab切换', behavior: 'submit' },
            { id: 'family.pay.qr', label: '我的二维码', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '亲友代付',
    },
    {
      path: '/address/manage',
      component: 'AddressManagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.address.manage.base', search: {}, description: '常用地址(家/公司)',
          actions: [
            { id: 'address.manage.set', label: '设置家/公司地址', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '常用地址(家/公司)',
    },
    {
      path: '/profile/edit',
      component: 'ProfileEditPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.profile.edit.base', search: {}, description: '个人信息',
          actions: [
            { id: 'profile.edit.avatar.pick', label: '从系统相册选择头像', behavior: 'submit' },
            { id: 'profile.edit.name', label: '编辑昵称', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '个人信息',
    },
    {
      path: '/settings/main',
      component: 'SettingsMainPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.settings.main.base', search: {}, description: '设置',
          actions: [
            { id: 'settings.main.elder.toggle', label: '长辈模式开关', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '设置',
    },
    {
      path: '/settings/general',
      component: 'SettingsGeneralPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.settings.general.base', search: {}, description: '通用设置',
          actions: [
            { id: 'settings.general.toggle', label: '通用开关', behavior: 'toggle' },
            { id: 'settings.general.clearCache', label: '清除缓存', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '通用设置',
    },
    {
      path: '/settings/account',
      component: 'SettingsAccountPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.settings.account.base', search: {}, description: '账号安全',
          actions: [
            { id: 'settings.account.stub', label: '账号安全入口(mock)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '账号安全',
    },
    {
      path: '/settings/account/delete',
      component: 'SettingsAccountDeletePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.settings.account.delete.base', search: {}, description: '永久注销账号确认',
          actions: [
            { id: 'settings.account.clearPrivateData', label: '确认永久注销并清除本地数据', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '永久注销账号确认',
    },
    {
      path: '/settings/privacy',
      component: 'SettingsPrivacyPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.settings.privacy.base', search: {}, description: '个人信息与权限',
          actions: [
            { id: 'settings.privacy.clipboard.toggle', label: '剪切板读取开关', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '个人信息与权限',
    },
    {
      path: '/skin/settings',
      component: 'SkinSettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.skin.settings.base', search: {}, description: '皮肤设置',
          actions: [
            { id: 'skin.settings.use', label: '切换皮肤', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '皮肤设置',
    },
    {
      path: '/safety/center',
      component: 'SafetyCenterPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.safety.center.base', search: {}, description: '安全工具',
          actions: [
            { id: 'safety.center.tool', label: '其他安全工具(mock开关)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '安全工具',
    },
    {
      path: '/safety/contacts',
      component: 'SafetyContactsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.safety.contacts.base', search: {}, description: '紧急联系人(添加/管理)',
          actions: [
            { id: 'safety.contacts.input', label: '联系人手机号输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'safety.contacts.add', label: '确认添加', behavior: 'submit' },
            { id: 'safety.contacts.auto.toggle', label: '自动分享行程开关', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '紧急联系人(添加/管理)',
    },
    {
      path: '/trip/share',
      component: 'TripSharePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.trip.share.base', search: {}, description: '行程分享',
          actions: [
            { id: 'trip.share.copy', label: '复制链接', behavior: 'submit' },
            { id: 'trip.share.send', label: '发送给联系人(系统分享)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '行程分享',
    },
    {
      path: '/help/center',
      component: 'HelpCenterPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.help.center.base', search: {}, description: '滴滴客服(智能客服会话)',
          actions: [
            { id: 'help.center.quick', label: '快捷入口(失物/叫车/改手机号等)', behavior: 'submit' },
            { id: 'help.center.confirm', label: '是的(确认咨询该订单)', behavior: 'submit' },
            { id: 'help.center.pickOrder', label: '咨询其他订单(选择订单弹层)', behavior: 'submit' },
            { id: 'help.center.input', label: '消息输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'help.center.send', label: '发送', behavior: 'submit' },
            { id: 'help.center.pickFaq', label: '非订单相关问题(选一条FAQ)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '滴滴客服(智能客服会话)',
    },
    {
      path: '/help/detail',
      component: 'HelpDetailPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.help.detail.base', search: {}, description: '常见问题(列表+解答)',
          actions: [
            { id: 'help.detail.useful', label: '有用反馈', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '常见问题(列表+解答)',
    },
    {
      path: '/auth/login',
      component: 'AuthLoginPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'didi.auth.login.base', search: {}, description: '登录(嗨,欢迎回来·两步式)',
          actions: [
            { id: 'auth.login.phone', label: '手机号输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'auth.login.next', label: '下一步(发验证码)', behavior: 'submit' },
            { id: 'auth.login.code', label: '验证码输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'auth.login.thirdparty', label: '第三方登录图标', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '登录(嗨,欢迎回来·两步式)',
    },
  ],
  transitions: [
    { id: 'home.tab', from: ['/', '/me', '/messages', '/trips'], to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '首页tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'messages.tab', from: ['/', '/me', '/messages', '/trips'], to: '/messages', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '消息tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trips.tab', from: ['/', '/me', '/messages', '/trips'], to: '/trips', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '行程tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'me.tab', from: ['/', '/me', '/messages', '/trips'], to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '我的tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'dest.search.open', from: '/', to: '/dest/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '输入目的地搜索框', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pickup.confirm.fromHome', from: '/', to: '/pickup/confirm', search: {}, searchParams: {}, mode: 'push', params: {}, label: '从XX上车位置行', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.resume', from: '/', to: '/trip/driver', search: {}, searchParams: {}, mode: 'push', params: {}, label: '司机接驾中行程条', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.resume.ongoing', from: '/', to: '/trip/ongoing', search: {}, searchParams: {}, mode: 'push', params: {}, label: '进行中行程条', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'reserve.home.open', from: '/', to: '/reserve/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '预约', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'reserve.airport.open', from: '/', to: '/reserve/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '接送机', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'hitch.home.open', from: '/', to: '/hitch/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区·顺风车', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'driver.home.open', from: '/', to: '/driver/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区·代驾', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'services.all.open', from: '/', to: '/services/all', search: {}, searchParams: {}, mode: 'push', params: {}, label: '金刚区·更多服务', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'delivery.home.open', from: '/', to: '/delivery/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部·送货tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'travel.home.open', from: '/', to: '/travel/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部·旅行tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'owner.home.open', from: '/', to: '/owner/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部·车主tab', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'car.select.open', from: '/dest/search', to: '/car/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '点选一个地点', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pickup.confirm.open', from: '/dest/search', to: '/pickup/confirm', search: {}, searchParams: {}, mode: 'push', params: {}, label: '在地图上选点', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pickup.search.open', from: '/pickup/confirm', to: '/dest/search', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '搜索起点', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pickup.search.close', from: '/dest/search', to: '/pickup/confirm', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '返回上车点确认', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'car.select.fromPickup', from: '/pickup/confirm', to: '/car/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '确认上车点', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'call.waiting.open', from: '/car/select', to: '/call/waiting', search: {}, searchParams: {}, mode: 'push', params: {}, label: '呼叫N种车型', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'fare.rules.open', from: '/car/select', to: '/fare/rules', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一口价/预估价文字', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'reserve.fromCarSelect', from: '/car/select', to: '/reserve/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '预约出发', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.driver.open', from: '/call/waiting', to: '/trip/driver', search: {}, searchParams: {}, mode: 'push', params: {}, label: '司机接单(自动)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.cancel.open', from: ['/call/waiting', '/trip/driver'], to: '/trip/cancel', search: {}, searchParams: {}, mode: 'push', params: {}, label: '取消订单', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'chat.detail.open', from: '/trip/driver', to: '/chat/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '联系客服/消息', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'safety.center.open', from: '/trip/driver', to: '/safety/center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '110报警', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.share.open', from: ['/trip/driver', '/trip/ongoing'], to: '/trip/share', search: {}, searchParams: {}, mode: 'push', params: {}, label: '行程分享', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.waypoint.open', from: '/trip/driver', to: '/trip/waypoint', search: {}, searchParams: {}, mode: 'push', params: {}, label: '途经点', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.changeDest.open', from: '/trip/driver', to: '/trip/changeDest', search: {}, searchParams: {}, mode: 'push', params: {}, label: '修改终点', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'route.select.open', from: '/trip/driver', to: '/route/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '选择路线', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.ongoing.open', from: '/trip/driver', to: '/trip/ongoing', search: {}, searchParams: {}, mode: 'push', params: {}, label: '司机已到达·开始行程(mock)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'route.fromOngoing', from: '/trip/ongoing', to: '/route/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '选择路线', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'safety.fromOngoing', from: '/trip/ongoing', to: '/safety/center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '安全中心', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.finish.open', from: '/trip/ongoing', to: '/trip/finish', search: {}, searchParams: {}, mode: 'push', params: {}, label: '到达目的地(mock)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'fee.explain.open', from: '/trip/finish', to: '/fee/explain', search: {}, searchParams: {}, mode: 'push', params: {}, label: '查看费用明细', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'invoice.entry.open', from: '/trip/finish', to: '/invoice/entry', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开发票', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'help.center.open', from: '/trip/finish', to: '/help/center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '联系客服', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'car.select.rebook', from: '/trip/finish', to: '/car/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '再来一单', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.finish.done', from: '/trip/finish', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '完成返回首页', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trip.cancel.done', from: '/trip/cancel', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '提交问卷→首页', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'chat.fromList', from: '/chat/list', to: '/chat/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条会话', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'car.fromReserve', from: '/reserve/home', to: '/car/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '立即选车', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'services.all.ride', from: '/services/all', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '打车', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'hitch.fromServices', from: '/services/all', to: '/hitch/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顺风车', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'driver.fromServices', from: '/services/all', to: '/driver/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '代驾', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'delivery.fromServices', from: '/services/all', to: '/delivery/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '送货', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'travel.fromServices', from: '/services/all', to: '/travel/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '旅行', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'owner.fromServices', from: '/services/all', to: '/owner/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '车主', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'driver.select.open', from: '/driver/home', to: '/driver/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '代驾目的地', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'hitch.fromOwner', from: '/owner/home', to: '/hitch/home', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顺风车切换', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'chat.fromMessages', from: '/messages', to: '/chat/list', search: {}, searchParams: {}, mode: 'push', params: {}, label: '对话chip→司机对话', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'message.thread.open', from: '/messages', to: '/message/thread', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条消息线程', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'order.detail.open', from: ['/trips', '/orders'], to: '/order/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条订单', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trips.filter.open', from: ['/trips', '/orders'], to: '/trips/filter', search: {}, searchParams: {}, mode: 'push', params: {}, label: '筛选', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'invoice.fromTrips', from: ['/trips', '/orders'], to: '/invoice/entry', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开发票', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'car.rebookFromTrips', from: ['/trips', '/orders'], to: '/car/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '再来一单', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'fee.fromOrder', from: '/order/detail', to: '/fee/explain', search: {}, searchParams: {}, mode: 'push', params: {}, label: '查看费用明细', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'invoice.fromOrder', from: '/order/detail', to: '/invoice/entry', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开发票', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'help.fromOrder', from: '/order/detail', to: '/help/center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '联系客服', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'car.rebookFromOrder', from: '/order/detail', to: '/car/select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '再来一单', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'fare.fromFee', from: '/fee/explain', to: '/fare/rules', search: {}, searchParams: {}, mode: 'push', params: {}, label: '计价规则', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'invoice.form.open', from: '/invoice/entry', to: '/invoice/form', search: {}, searchParams: {}, mode: 'push', params: {}, label: '去开票', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trips.fromMe', from: '/me', to: '/orders', search: {}, searchParams: {}, mode: 'push', params: {}, label: '全部订单', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'invoice.fromMe', from: '/me', to: '/invoice/entry', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开发票', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'wallet.main.open', from: '/me', to: '/wallet/main', search: {}, searchParams: {}, mode: 'push', params: {}, label: '钱包', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'coupons.list.open', from: '/me', to: '/coupons/list', search: {}, searchParams: {}, mode: 'push', params: {}, label: '优惠券', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.main.open', from: '/me', to: '/settings/main', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置icon', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'help.fromMe', from: '/me', to: '/help/center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '客服(金刚区)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'profile.edit.open', from: '/me', to: '/profile/edit', search: {}, searchParams: {}, mode: 'push', params: {}, label: '头像/个人信息', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'address.manage.open', from: '/me', to: '/address/manage', search: {}, searchParams: {}, mode: 'push', params: {}, label: '常用地址(金刚区·个性化)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.settings.open', from: '/wallet/main', to: '/pay/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '支付设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.fromHelp', from: '/help/center', to: '/pay/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '客服·支付设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'coupons.fromWallet', from: '/wallet/main', to: '/coupons/list', search: {}, searchParams: {}, mode: 'push', params: {}, label: '优惠券', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'invoice.fromWallet', from: '/wallet/main', to: '/invoice/entry', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开发票', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'coupons.toRide', from: '/coupons/list', to: '/dest/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '立即使用(去叫车)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.password.open', from: '/pay/settings', to: '/pay/password', search: {}, searchParams: {}, mode: 'push', params: {}, label: '支付密码管理', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.methods.open', from: '/pay/settings', to: '/pay/methods', search: {}, searchParams: {}, mode: 'push', params: {}, label: '免密支付设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'family.pay.open', from: '/pay/settings', to: '/family/pay', search: {}, searchParams: {}, mode: 'push', params: {}, label: '亲友代付设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.account.open', from: '/settings/main', to: '/settings/account', search: {}, searchParams: {}, mode: 'push', params: {}, label: '账号安全', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'safety.fromSettings', from: '/settings/main', to: '/safety/center', search: {}, searchParams: {}, mode: 'push', params: {}, label: '行程安全', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.fromSettings', from: '/settings/main', to: '/pay/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '支付设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.privacy.open', from: '/settings/main', to: '/settings/privacy', search: {}, searchParams: {}, mode: 'push', params: {}, label: '个人信息与权限', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.general.open', from: '/settings/main', to: '/settings/general', search: {}, searchParams: {}, mode: 'push', params: {}, label: '通用', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'skin.settings.open', from: '/settings/main', to: '/skin/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '个性皮肤', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'auth.login.open', from: '/settings/main', to: '/auth/login', search: {}, searchParams: {}, mode: 'push', params: {}, label: '退出登录', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.account.delete.open', from: '/settings/account', to: '/settings/account/delete', search: {}, searchParams: {}, mode: 'push', params: {}, label: '永久注销账号', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.account.delete.done', from: '/settings/account/delete', to: '/auth/login', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '清除后进入登录页', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'safety.contacts.open', from: '/safety/center', to: '/safety/contacts', search: {}, searchParams: {}, mode: 'push', params: {}, label: '紧急联系人', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'help.detail.open', from: '/help/center', to: '/help/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '非订单相关问题→常见问题', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'auth.login.done', from: '/auth/login', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '验证码输完→首页', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
