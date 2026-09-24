# -*- coding: utf-8 -*-
from pathlib import Path

def tr(id_, frm, to, mode="push", params=None, search=None, search_params=None, label="", placement="content", icon="chevronRight"):
    params = params or {}
    search = search or {}
    search_params = search_params or {}
    def obj(d, quote_vals=True):
        if not d:
            return "{}"
        parts = []
        for k, v in d.items():
            if quote_vals:
                parts.append(f"{k}: '{v}'")
            else:
                parts.append(f"{k}: {v if isinstance(v, str) and v.startswith('{') else repr(v)}")
        return "{ " + ", ".join(parts) + " }"
    search_lit = "{}"
    if search:
        search_lit = "{ " + ", ".join(f"{k}: '{v}'" if v is not None else f"{k}: null" for k, v in search.items()) + " }"
    if isinstance(frm, (list, tuple)):
        frm_lit = "[" + ", ".join(f"'{x}'" for x in frm) + "]"
    else:
        frm_lit = "'*'" if frm == "*" else f"'{frm}'"
    return f"""    {{
      id: '{id_}',
      from: {frm_lit},
      to: '{to}',
      mode: '{mode}',
      search: {search_lit},
      searchParams: {obj(search_params)},
      preserveParams: [],
      params: {obj(params)},
      label: '{label}',
      ui: {{ placement: '{placement}', icon: '{icon}', gesture: 'tap' }},
    }}"""

def route(path, component, desc, scroll=None, params=None, entry="none", query=None, actions=None):
    params = params or {}
    query = query or {}
    sc_list = scroll or []
    sc = ", ".join(f"sc('{n}', '{d}')" for n, d in sc_list)
    acts = ""
    if actions:
        items = ",\n            ".join(
            f"{{ id: '{a['id']}', label: '{a['label']}', behavior: '{a.get('behavior','other')}'"
            + (f", paramsSchema: {a['paramsSchema']}" if a.get("paramsSchema") else "")
            + " }"
            for a in actions
        )
        acts = f""",
          actions: [
            {items}
          ]"""
    pobj = "{ " + ", ".join(f"{k}: '{v}'" for k, v in params.items()) + " }" if params else "{}"
    qobj = "{ " + ", ".join(f"{k}: '{v}'" for k, v in query.items()) + " }" if query else "{}"
    return f"""    {{
      path: '{path}',
      component: '{component}',
      params: {pobj},
      entryPoint: '{entry}',
      scrollContainers: [{sc}],
      uiStates: [
        {{
          id: 'dianping.{component.lower()}.base',
          search: {{}},
          description: '{desc}'{acts}
        }},
      ],
      queryParams: {qobj},
      description: '{desc}',
    }}"""

routes = [
    route("/", "HomePage", "首页", [("home-feed", "首页信息流")], entry="home",
          actions=[{"id": "home.diamond.open.disabled", "label": "金刚区暂未开放"}, {"id": "home.channel.open.disabled", "label": "频道暂未开放"}, {"id": "home.channel.select.target", "label": "频道切换", "behavior": "select", "paramsSchema": "{ target: 'string' }"}, {"id": "home.gift.open.disabled", "label": "新人礼"}]),
    route("/map", "MapPage", "地图附近店", [("map-list", "附近店列表")]),
    route("/checkin", "CheckinPage", "打卡", [("checkin", "打卡选店")],
          actions=[{"id": "checkin.shop.select.target", "label": "选择店铺打卡", "behavior": "select", "paramsSchema": "{ id: 'string' }"}]),
    route("/msg", "MsgPage", "消息", [("msg-list", "消息入口")],
          actions=[{"id": "msg.entry.open.disabled", "label": "消息子入口"}]),
    route("/me", "MinePage", "我的", [("mine", "我的页")],
          actions=[{"id": "mine.entry.open.disabled", "label": "暂未开放入口"}, {"id": "mine.bottomTab.select.target", "label": "底部分区", "behavior": "select", "paramsSchema": "{ target: 'string' }"}, {"id": "mine.cs.open.disabled", "label": "客服"}, {"id": "mine.settings.open.disabled", "label": "设置"}, {"id": "mine.profile.open.disabled", "label": "个人主页"}]),
    route("/city", "CityPickerPage", "城市选择", [("city-list", "城市列表")],
          actions=[{"id": "city.pick.select.target", "label": "选择城市", "behavior": "select", "paramsSchema": "{ target: 'string' }"}]),
    route("/food", "FoodChannelPage", "美食频道", [("food-list", "店铺列表"), ("food-subcats", "子分类")],
          query={"tab": "string"},
          actions=[{"id": "food.loc.open.disabled", "label": "定位"}, {"id": "food.map.open.disabled", "label": "地图"}, {"id": "food.sub.open.disabled", "label": "子分类"}, {"id": "food.filter.open.disabled", "label": "筛选"}, {"id": "food.chip.open.disabled", "label": "快筛"}, {"id": "food.search.open.disabled", "label": "搜索"}]),
    route("/search", "SearchLandingPage", "搜索中间页", [("search-landing", "搜索中间页")],
          actions=[{"id": "search.history.clear.action", "label": "清空历史"}, {"id": "search.hot.select.target", "label": "热搜", "behavior": "select", "paramsSchema": "{ q: 'string' }"}]),
    route("/search/result", "SearchResultPage", "搜索结果", [("search-result", "搜索结果")],
          query={"q": "string", "tab": "string"}),
    route("/shop/:shopId", "ShopDetailPage", "店铺详情", [("shop-detail", "店铺详情"), ("dish-row", "推荐菜横滑")],
          params={"shopId": "string"}, query={"sec": "string"},
          actions=[{"id": "shop.favorite.toggle", "label": "收藏", "behavior": "toggle", "paramsSchema": "{ id: 'string' }"}, {"id": "shop.section.select.target", "label": "分段", "behavior": "select", "paramsSchema": "{ target: 'string' }"}, {"id": "shop.top.open.disabled", "label": "顶栏"}, {"id": "shop.photos.open.disabled", "label": "看图"}, {"id": "shop.hours.open.disabled", "label": "营业"}, {"id": "shop.utility.open.disabled", "label": "工具"}, {"id": "shop.menu.open.disabled", "label": "菜单"}, {"id": "shop.bar.favorite", "label": "底栏收藏", "behavior": "toggle", "paramsSchema": "{ id: 'string' }"}, {"id": "shop.checkin.open.disabled", "label": "打卡"}]),
    route("/shop/:shopId/dishes", "DishesPage", "推荐菜", [("dishes", "推荐菜列表")],
          params={"shopId": "string"},
          actions=[{"id": "dishes.like.toggle", "label": "点赞", "behavior": "toggle", "paramsSchema": "{ id: 'string' }"}, {"id": "dishes.favorite.toggle", "label": "收藏菜", "behavior": "toggle", "paramsSchema": "{ id: 'string' }"}, {"id": "dishes.menu.open.disabled", "label": "菜单"}, {"id": "dishes.search.open.disabled", "label": "搜索"}]),
    route("/shop/:shopId/reviews", "ReviewsPage", "评价列表", [("reviews", "评价列表")],
          params={"shopId": "string"}, query={"tab": "string"},
          actions=[{"id": "reviews.tab.select.target", "label": "评价Tab", "behavior": "select", "paramsSchema": "{ tab: 'string' }"}, {"id": "reviews.tag.select.target", "label": "标签", "behavior": "select", "paramsSchema": "{ tag: 'string' }"}]),
    route("/review/write/:shopId", "WriteReviewPage", "写评价", [("write-review", "写评价")],
          params={"shopId": "string"}, query={"sheet": "string"},
          actions=[{"id": "write.score.select.target", "label": "打星", "behavior": "select", "paramsSchema": "{ score: 'number' }"}, {"id": "write.media.open.disabled", "label": "传图暂未开放"}, {"id": "write.dish.toggle", "label": "勾选菜", "behavior": "toggle", "paramsSchema": "{ id: 'string' }"}, {"id": "write.publish.commit", "label": "发布", "behavior": "submit"}, {"id": "write.draft.save.action", "label": "存草稿"}]),
    route("/order/confirm", "OrderConfirmPage", "确认订单", [("order-confirm", "确认订单"), ("coupon-picker", "美团券选择")],
          query={"shopId": "string", "dealId": "string", "sheet": "string"},
          actions=[{"id": "order.qty.dec.action", "label": "减数量"}, {"id": "order.qty.inc.action", "label": "加数量"}, {"id": "order.submit.commit", "label": "提交订单", "behavior": "submit"}, {"id": "coupon.select.target", "label": "选用券", "behavior": "select", "paramsSchema": "{ target: 'string' }"}, {"id": "coupon.unusable.expand", "label": "不可用原因"}]),
    route("/order/pay", "OrderPayPage", "支付", [("order-pay", "支付页")],
          query={"orderId": "string"},
          actions=[{"id": "pay.method.select.target", "label": "支付方式", "behavior": "select", "paramsSchema": "{ method: 'string' }"}]),
    route("/order/pay-password", "PayPasswordPage", "支付密码", [],
          query={"orderId": "string"},
          actions=[{"id": "pay.password.digit.action", "label": "输入密码", "behavior": "other", "paramsSchema": "{ d: 'string' }"}, {"id": "pay.password.ok.commit", "label": "确认支付", "behavior": "submit"}]),
    route("/order/success", "OrderSuccessPage", "购买成功", [],
          query={"orderId": "string"}),
    route("/orders", "OrdersPage", "我的订单", [("orders", "订单列表")],
          query={"tab": "string"}),
    route("/order/:orderId", "OrderDetailPage", "订单详情", [("order-detail", "订单详情")],
          params={"orderId": "string"}),
    route("/refund/:orderId", "RefundApplyPage", "申请退款", [("refund", "退款表单")],
          params={"orderId": "string"}, query={"sheet": "string"},
          actions=[{"id": "refund.reason.select.target", "label": "退款原因", "behavior": "select", "paramsSchema": "{ reason: 'string' }"}, {"id": "refund.submit.commit", "label": "提交退款", "behavior": "submit"}]),
    route("/voucher/:shopId/:dealId", "VoucherDetailPage", "券详情", [("voucher", "券详情")],
          params={"shopId": "string", "dealId": "string"}),
    route("/fav", "FavListPage", "收藏", [("fav", "收藏列表")], query={"tab": "string"}),
    route("/history", "HistoryPage", "最近浏览", [("history", "浏览列表")]),
    route("/rank", "RankPage", "榜单", [("rank", "榜单列表")]),
    route("/note/:noteId", "NoteDetailPage", "笔记详情", [("note", "笔记")],
          params={"noteId": "string"}),
    route("/msg/activity", "MsgActivityPage", "活动消息", [("msg-activity", "活动列表")]),
]

transitions = [
    tr("tabbar.home-open", ["/", "/map", "/checkin", "/msg", "/me", "/order/success"], "/", "replace", label="首页 Tab", placement="tabbar", icon="home"),
    tr("tabbar.map-open", ["/", "/map", "/checkin", "/msg", "/me"], "/map", "replace", label="地图 Tab", placement="tabbar", icon="map"),
    tr("tabbar.checkin-open", ["/", "/map", "/checkin", "/msg", "/me"], "/checkin", "replace", label="打卡 Tab", placement="tabbar", icon="plus"),
    tr("tabbar.msg-open", ["/", "/map", "/checkin", "/msg", "/me"], "/msg", "replace", label="消息 Tab", placement="tabbar", icon="msg"),
    tr("tabbar.mine-open", ["/", "/map", "/checkin", "/msg", "/me"], "/me", "replace", label="我的 Tab", placement="tabbar", icon="me"),
    tr("home.city-open", "/", "/city", label="选择城市", placement="topbar", icon="chevronDown"),
    tr("home.food-open", "/", "/food", label="美食频道"),
    tr("home.search-open", "/", "/search", label="搜索", placement="topbar", icon="search"),
    tr("home.rank-open", "/", "/rank", label="点评榜单"),
    tr("home.note-open", "/", "/note/:noteId", params={"noteId": "string"}, label="笔记详情"),
    tr("food.category-switch", "/food", "/food", "replace", search_params={"tab": "string"}, label="美食分类"),
    tr("food.shop-open", ["/", "/food", "/map", "/fav", "/history", "/search/result", "/rank", "/me"], "/shop/:shopId", params={"shopId": "string"}, label="打开店铺"),
    tr("shop.dishes-open", "/shop/:shopId", "/shop/:shopId/dishes", params={"shopId": "string"}, label="推荐菜"),
    tr("shop.reviews-open", "/shop/:shopId", "/shop/:shopId/reviews", params={"shopId": "string"}, label="评价列表"),
    tr("shop.write-open", ["/shop/:shopId", "/shop/:shopId/reviews"], "/review/write/:shopId", params={"shopId": "string"}, label="写评价"),
    tr("shop.deal-buy", ["/shop/:shopId", "/search/result", "/voucher/:shopId/:dealId"], "/order/confirm", search_params={"shopId": "string", "dealId": "string"}, label="抢购确认订单"),
    tr("shop.voucher-open", "/shop/:shopId", "/voucher/:shopId/:dealId", params={"shopId": "string", "dealId": "string"}, label="券详情"),
    tr("search.submit", "/search", "/search/result", "push", search_params={"q": "string"}, label="搜索提交"),
    tr("search.result-tab", "/search/result", "/search/result", "replace", search_params={"tab": "string", "q": "string"}, label="结果Tab"),
    tr("search.shop-open", "/search/result", "/shop/:shopId", params={"shopId": "string"}, label="结果进店"),
    tr("search.deal-open", "/search/result", "/order/confirm", search_params={"shopId": "string", "dealId": "string"}, label="结果买券"),
    tr("order.coupon-open", "/order/confirm", "/order/confirm", "replace", search_params={"shopId": "string", "dealId": "string"}, search={"sheet": "coupon"}, label="打开美团券"),
    tr("order.coupon-dismiss", "/order/confirm", "/order/confirm", "replace", search_params={"shopId": "string", "dealId": "string"}, search={"sheet": None}, label="关闭美团券"),
    tr("order.submit", "/order/confirm", "/order/pay", search_params={"orderId": "string"}, label="提交订单"),
    tr("pay.confirm", "/order/pay", "/order/pay-password", search_params={"orderId": "string"}, label="确认交易"),
    tr("pay.success", "/order/pay-password", "/order/success", "replace", search_params={"orderId": "string"}, label="支付成功"),
    tr("success.order-open", "/order/success", "/order/:orderId", params={"orderId": "string"}, label="查看订单"),
    tr("mine.orders-open", "/me", "/orders", label="我的订单"),
    tr("mine.fav-open", "/me", "/fav", label="我的收藏"),
    tr("mine.history-open", "/me", "/history", label="最近浏览"),
    tr("orders.tab", "/orders", "/orders", "replace", search_params={"tab": "string"}, label="订单Tab"),
    tr("orders.detail-open", "/orders", "/order/:orderId", params={"orderId": "string"}, label="订单详情"),
    tr("order.refund-open", "/order/:orderId", "/refund/:orderId", params={"orderId": "string"}, label="申请退款"),
    tr("voucher.buy", "/voucher/:shopId/:dealId", "/order/confirm", search_params={"shopId": "string", "dealId": "string"}, label="立即团购"),
    tr("fav.tab", "/fav", "/fav", "replace", search_params={"tab": "string"}, label="收藏Tab"),
    tr("fav.shop-open", "/fav", "/shop/:shopId", params={"shopId": "string"}, label="收藏进店"),
    tr("history.shop-open", "/history", "/shop/:shopId", params={"shopId": "string"}, label="浏览进店"),
    tr("rank.shop-open", "/rank", "/shop/:shopId", params={"shopId": "string"}, label="榜单进店"),
    tr("note.shop-open", "/note/:noteId", "/shop/:shopId", params={"shopId": "string"}, label="笔记进店"),
    tr("msg.activity-open", "/msg", "/msg/activity", label="活动消息"),
    tr("write.dish-open", "/review/write/:shopId", "/review/write/:shopId", "replace", params={"shopId": "string"}, search={"sheet": "dishes"}, label="推荐菜弹层"),
    tr("write.dish-close", "/review/write/:shopId", "/review/write/:shopId", "replace", params={"shopId": "string"}, search={"sheet": None}, label="关闭菜弹层"),
    tr("refund.reason-open", "/refund/:orderId", "/refund/:orderId", "replace", params={"orderId": "string"}, search={"sheet": "reason"}, label="退款原因弹层"),
    tr("refund.reason-close", "/refund/:orderId", "/refund/:orderId", "replace", params={"orderId": "string"}, search={"sheet": None}, label="关闭原因弹层"),
]

header = '''/**
 * 大众点评 — 阶段⑤全量导航声明
 */
import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string, direction: 'vertical' | 'horizontal' = 'vertical') =>
  ({ name, direction, description }) as const;

export const NAVIGATION_DECLARATION = {
  app: 'dianping',
  routes: [
'''

body = ",\n".join(routes)
mid = """
  ],
  transitions: [
"""
trans = ",\n".join(transitions)
footer = """
  ],
  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
"""

text = header + body + mid + trans + footer
Path(__file__).with_name("navigation.declaration.ts").write_text(text, encoding="utf-8")
print("wrote", len(text))
