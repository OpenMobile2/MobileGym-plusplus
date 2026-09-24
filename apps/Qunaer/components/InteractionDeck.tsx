import React from 'react';
import { useQunaerGestures } from '../hooks/useQunaerGestures';
import { useQunaerStore } from '../state';

const navClass =
  'w-full min-h-11 px-3 py-2.5 flex items-center justify-between text-left bg-white border border-[#edf0f2] rounded-xl text-[13px] text-[#263238] cursor-pointer';

export function InteractionDeck({ nodeId }: { nodeId: string }) {
  const { bindTap } = useQunaerGestures();
  const recordAction = useQunaerStore((s) => s.recordAction);
  switch (nodeId) {
    case "home.main":
      return <div className="grid gap-2">        <button {...bindTap("home.main.0.open")} className={navClass}>
          <span>金刚区-机票大卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.1.open")} className={navClass}>
          <span>金刚区-酒店大卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.2.open")} className={navClass}>
          <span>金刚区-火车·高铁</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.3.open")} className={navClass}>
          <span>金刚区-景点·门票</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.4.open")} className={navClass}>
          <span>顶部搜索胶囊</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.5.open")} className={navClass}>
          <span>金刚区-民宿·客栈</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.6.open")} className={navClass}>
          <span>金刚区-海外酒店</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.7.open")} className={navClass}>
          <span>金刚区-租车自驾</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.8.open")} className={navClass}>
          <span>金刚区-接机/送机</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.9.open")} className={navClass}>
          <span>金刚区-旅游(度假/跟团游)</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.main.10.open")} className={navClass}>
          <span>金刚区-特价酒店</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "home.main.11.other" }, {
            onTrigger: () => recordAction("home.main.11.other", "金刚区-借钱/分期"),
          })}
          className={navClass}
        >
          <span>金刚区-借钱/分期</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "home.search.landing":
      return <div className="grid gap-2">        <button {...bindTap("home.search.landing.0.open")} className={navClass}>
          <span>输入关键词</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "home.search.sug":
      return <div className="grid gap-2">        <button {...bindTap("home.search.sug.0.open")} className={navClass}>
          <span>联想词「烟台」</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "home.search.results":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "home.search.results.0.other" }, {
            onTrigger: () => recordAction("home.search.results.0.other", "tab 切换"),
          })}
          className={navClass}
        >
          <span>tab 切换</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("home.search.results.1.open")} className={navClass}>
          <span>门票 tab 景点卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("home.search.results.2.open")} className={navClass}>
          <span>跟团游 tab</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "home.search.results.3.other" }, {
            onTrigger: () => recordAction("home.search.results.3.other", "一日游 tab"),
          })}
          className={navClass}
        >
          <span>一日游 tab</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "trip.main":
      return <div className="grid gap-2">        <button {...bindTap("trip.main.0.open")} className={navClass}>
          <span>全部订单 tab</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("trip.main.1.open")} className={navClass}>
          <span>门票卡-立即支付</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("trip.main.2.open")} className={navClass}>
          <span>酒店卡-订单详情</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "flight.search":
      return <div className="grid gap-2">        <button {...bindTap("flight.search.0.open")} className={navClass}>
          <span>出发城市</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("flight.search.1.open")} className={navClass}>
          <span>到达城市</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "flight.search.2.other" }, {
            onTrigger: () => recordAction("flight.search.2.other", "换向按钮"),
          })}
          className={navClass}
        >
          <span>换向按钮</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("flight.search.3.open")} className={navClass}>
          <span>日期行</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("flight.search.4.open")} className={navClass}>
          <span>搜索按钮</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "flight.citypicker":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "flight.citypicker.0.other" }, {
            onTrigger: () => recordAction("flight.citypicker.0.other", "城市项"),
          })}
          className={navClass}
        >
          <span>城市项</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "flight.calendar":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "flight.calendar.0.other" }, {
            onTrigger: () => recordAction("flight.calendar.0.other", "日期格"),
          })}
          className={navClass}
        >
          <span>日期格</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "flight.list":
      return <div className="grid gap-2">        <button {...bindTap("flight.list.0.open")} className={navClass}>
          <span>航班卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "flight.list.1.other" }, {
            onTrigger: () => recordAction("flight.list.1.other", "日期条"),
          })}
          className={navClass}
        >
          <span>日期条</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "flight.cabins":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "flight.cabins.0.other" }, {
            onTrigger: () => recordAction("flight.cabins.0.other", "报价「订」"),
          })}
          className={navClass}
        >
          <span>报价「订」</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("flight.cabins.1.open")} className={navClass}>
          <span>弹窗「立即预订」</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "flight.cabins.2.other" }, {
            onTrigger: () => recordAction("flight.cabins.2.other", "明珠经济舱/公务头等 tab"),
          })}
          className={navClass}
        >
          <span>明珠经济舱/公务头等 tab</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "flight.booking":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "flight.booking.0.other" }, {
            onTrigger: () => recordAction("flight.booking.0.other", "去支付"),
          })}
          className={navClass}
        >
          <span>去支付</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("flight.booking.1.open")} className={navClass}>
          <span>确认链完成</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "flight.order.detail":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "flight.order.detail.0.other" }, {
            onTrigger: () => recordAction("flight.order.detail.0.other", "取消订单"),
          })}
          className={navClass}
        >
          <span>取消订单</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("flight.order.detail.1.open")} className={navClass}>
          <span>立即支付</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "hotel.search":
      return <div className="grid gap-2">        <button {...bindTap("hotel.search.0.open")} className={navClass}>
          <span>城市</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("hotel.search.1.open")} className={navClass}>
          <span>日期条</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("hotel.search.2.open")} className={navClass}>
          <span>开始搜索</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "hotel.citypicker":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "hotel.citypicker.0.other" }, {
            onTrigger: () => recordAction("hotel.citypicker.0.other", "城市项"),
          })}
          className={navClass}
        >
          <span>城市项</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "hotel.calendar":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "hotel.calendar.0.other" }, {
            onTrigger: () => recordAction("hotel.calendar.0.other", "两次点选+确定"),
          })}
          className={navClass}
        >
          <span>两次点选+确定</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "hotel.list":
      return <div className="grid gap-2">        <button {...bindTap("hotel.list.0.open")} className={navClass}>
          <span>酒店卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "hotel.list.1.other" }, {
            onTrigger: () => recordAction("hotel.list.1.other", "排序▾"),
          })}
          className={navClass}
        >
          <span>排序▾</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "hotel.list.2.other" }, {
            onTrigger: () => recordAction("hotel.list.2.other", "筛选▾"),
          })}
          className={navClass}
        >
          <span>筛选▾</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "hotel.detail":
      return <div className="grid gap-2">        <button {...bindTap("hotel.detail.0.open")} className={navClass}>
          <span>房型「订」</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "hotel.detail.1.other" }, {
            onTrigger: () => recordAction("hotel.detail.1.other", "相册入口"),
          })}
          className={navClass}
        >
          <span>相册入口</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "hotel.booking":
      return <div className="grid gap-2">        <button {...bindTap("hotel.booking.0.open")} className={navClass}>
          <span>去支付</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "hotel.booking.1.other" }, {
            onTrigger: () => recordAction("hotel.booking.1.other", "间数步进器"),
          })}
          className={navClass}
        >
          <span>间数步进器</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "train.search":
      return <div className="grid gap-2">        <button {...bindTap("train.search.0.open")} className={navClass}>
          <span>出发/到达</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "train.search.1.other" }, {
            onTrigger: () => recordAction("train.search.1.other", "日期"),
          })}
          className={navClass}
        >
          <span>日期</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("train.search.2.open")} className={navClass}>
          <span>搜索</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "train.stationpicker":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "train.stationpicker.0.other" }, {
            onTrigger: () => recordAction("train.stationpicker.0.other", "城市/站点项"),
          })}
          className={navClass}
        >
          <span>城市/站点项</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "train.list":
      return <div className="grid gap-2">        <button {...bindTap("train.list.0.open")} className={navClass}>
          <span>车次/方案卡</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "train.detail":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "train.detail.0.other" }, {
            onTrigger: () => recordAction("train.detail.0.other", "席别卡"),
          })}
          className={navClass}
        >
          <span>席别卡</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("train.detail.1.open")} className={navClass}>
          <span>档位「订」→风险弹窗→继续预订</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "train.booking":
      return <div className="grid gap-2">        <button {...bindTap("train.booking.0.open")} className={navClass}>
          <span>选择乘车人</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "train.booking.1.other" }, {
            onTrigger: () => recordAction("train.booking.1.other", "普通预订"),
          })}
          className={navClass}
        >
          <span>普通预订</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("train.booking.2.open")} className={navClass}>
          <span>占座完成</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "train.passenger.pick":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "train.passenger.pick.0.other" }, {
            onTrigger: () => recordAction("train.passenger.pick.0.other", "勾选乘车人"),
          })}
          className={navClass}
        >
          <span>勾选乘车人</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "ticket.channel":
      return <div className="grid gap-2">        <button {...bindTap("ticket.channel.0.open")} className={navClass}>
          <span>景点卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "ticket.channel.1.other" }, {
            onTrigger: () => recordAction("ticket.channel.1.other", "定位弹窗「确定」"),
          })}
          className={navClass}
        >
          <span>定位弹窗「确定」</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "ticket.detail":
      return <div className="grid gap-2">        <button {...bindTap("ticket.detail.0.open")} className={navClass}>
          <span>票种「预订」</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "ticket.detail.1.other" }, {
            onTrigger: () => recordAction("ticket.detail.1.other", "锚点侧栏"),
          })}
          className={navClass}
        >
          <span>锚点侧栏</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "ticket.detail.2.other" }, {
            onTrigger: () => recordAction("ticket.detail.2.other", "评论·笔记/周边推荐 tab"),
          })}
          className={navClass}
        >
          <span>评论·笔记/周边推荐 tab</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "ticket.booking":
      return <div className="grid gap-2">        <button {...bindTap("ticket.booking.0.open")} className={navClass}>
          <span>提交订单</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "ticket.booking.1.other" }, {
            onTrigger: () => recordAction("ticket.booking.1.other", "日期胶囊"),
          })}
          className={navClass}
        >
          <span>日期胶囊</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "ticket.booking.2.other" }, {
            onTrigger: () => recordAction("ticket.booking.2.other", "游客编辑/新增"),
          })}
          className={navClass}
        >
          <span>游客编辑/新增</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "pay.cashier":
      return <div className="grid gap-2">        <button {...bindTap("pay.cashier.0.open")} className={navClass}>
          <span>支付宝支付按钮</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "pay.cashier.1.other" }, {
            onTrigger: () => recordAction("pay.cashier.1.other", "返回"),
          })}
          className={navClass}
        >
          <span>返回</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "pay.success":
      return <div className="grid gap-2">        <button {...bindTap("pay.success.0.open")} className={navClass}>
          <span>查看订单</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "pay.success.1.other" }, {
            onTrigger: () => recordAction("pay.success.1.other", "自动跳转"),
          })}
          className={navClass}
        >
          <span>自动跳转</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "orders.center":
      return <div className="grid gap-2">        <button {...bindTap("orders.center.0.open")} className={navClass}>
          <span>门票待支付卡-立即支付</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("orders.center.1.open")} className={navClass}>
          <span>机票订单卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("orders.center.2.open")} className={navClass}>
          <span>酒店/门票订单卡</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "orders.detail.hotel":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "orders.detail.hotel.0.other" }, {
            onTrigger: () => recordAction("orders.detail.hotel.0.other", "取消订单/原房续住/开发票"),
          })}
          className={navClass}
        >
          <span>取消订单/原房续住/开发票</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "orders.detail.ticket":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "orders.detail.ticket.0.other" }, {
            onTrigger: () => recordAction("orders.detail.ticket.0.other", "保存到相册/发送短信凭证"),
          })}
          className={navClass}
        >
          <span>保存到相册/发送短信凭证</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button {...bindTap("orders.detail.ticket.1.open")} className={navClass}>
          <span>再次预定</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "mine.main":
      return <div className="grid gap-2">        <button {...bindTap("mine.main.0.open")} className={navClass}>
          <span>我的订单/待付款等宫格</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("mine.main.1.open")} className={navClass}>
          <span>常用信息</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("mine.main.2.open")} className={navClass}>
          <span>优惠券</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("mine.main.3.open")} className={navClass}>
          <span>收藏浏览</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("mine.main.4.open")} className={navClass}>
          <span>设置齿轮</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("mine.main.5.open")} className={navClass}>
          <span>未登录头部</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "mine.passengers":
      return <div className="grid gap-2">        <button {...bindTap("mine.passengers.0.open")} className={navClass}>
          <span>旅客卡✎/新增</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "mine.passenger.edit":
      return <div className="grid gap-2">        <button {...bindTap("mine.passenger.edit.0.open")} className={navClass}>
          <span>保存</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "mine.coupons":
      return <div className="grid gap-2">
      </div>;
    case "mine.favorites":
      return <div className="grid gap-2">
      </div>;
    case "mine.settings":
      return <div className="grid gap-2">        <button {...bindTap("mine.settings.0.open")} className={navClass}>
          <span>退出登录→确定</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "auth.login":
      return <div className="grid gap-2">        <button {...bindTap("auth.login.0.open")} className={navClass}>
          <span>验证码填完</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "homestay.channel":
      return <div className="grid gap-2">        <button {...bindTap("homestay.channel.0.open")} className={navClass}>
          <span>开始搜索</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "homestay.channel.1.other" }, {
            onTrigger: () => recordAction("homestay.channel.1.other", "入住条件"),
          })}
          className={navClass}
        >
          <span>入住条件</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "homestay.list":
      return <div className="grid gap-2">        <button {...bindTap("homestay.list.0.open")} className={navClass}>
          <span>房源卡</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "homestay.detail":
      return <div className="grid gap-2">        <button {...bindTap("homestay.detail.0.open")} className={navClass}>
          <span>立即预订/选房型</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("homestay.detail.1.open")} className={navClass}>
          <span>咨询房东</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "oversea.channel":
      return <div className="grid gap-2">        <button {...bindTap("oversea.channel.0.open")} className={navClass}>
          <span>搜索</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "oversea.list":
      return <div className="grid gap-2">        <button {...bindTap("oversea.list.0.open")} className={navClass}>
          <span>酒店卡</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "oversea.detail":
      return <div className="grid gap-2">        <button {...bindTap("oversea.detail.0.open")} className={navClass}>
          <span>房型订</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "oversea.booking":
      return <div className="grid gap-2">        <button {...bindTap("oversea.booking.0.open")} className={navClass}>
          <span>去支付</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "carrental.channel":
      return <div className="grid gap-2">        <button {...bindTap("carrental.channel.0.open")} className={navClass}>
          <span>立即选车</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("carrental.channel.1.open")} className={navClass}>
          <span>新手指南</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "carrental.carlist":
      return <div className="grid gap-2">        <button {...bindTap("carrental.carlist.0.open")} className={navClass}>
          <span>车卡订</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "carrental.guide":
      return <div className="grid gap-2">        <button {...bindTap("carrental.guide.0.open")} className={navClass}>
          <span>去租车</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "transfer.channel":
      return <div className="grid gap-2">        <button {...bindTap("transfer.channel.0.open")} className={navClass}>
          <span>关联航班行程</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "transfer.flightlink":
      return <div className="grid gap-2">        <button {...bindTap("transfer.flightlink.0.open")} className={navClass}>
          <span>选定下车点</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "transfer.carlist":
      return <div className="grid gap-2">        <button {...bindTap("transfer.carlist.0.open")} className={navClass}>
          <span>立即预订</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "vacation.channel":
      return <div className="grid gap-2">        <button {...bindTap("vacation.channel.0.open")} className={navClass}>
          <span>跟团游/搜索</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "tour.list":
      return <div className="grid gap-2">        <button {...bindTap("tour.list.0.open")} className={navClass}>
          <span>产品卡</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "tour.detail":
      return <div className="grid gap-2">        <button {...bindTap("tour.detail.0.open")} className={navClass}>
          <span>选套餐下单</span><span className="text-[#8b949c]">›</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "tour.detail.1.other" }, {
            onTrigger: () => recordAction("tour.detail.1.other", "收藏"),
          })}
          className={navClass}
        >
          <span>收藏</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "support.chat.merchant":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "support.chat.merchant.0.other" }, {
            onTrigger: () => recordAction("support.chat.merchant.0.other", "快捷问题/发送"),
          })}
          className={navClass}
        >
          <span>快捷问题/发送</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "support.chat.merchant.1.other" }, {
            onTrigger: () => recordAction("support.chat.merchant.1.other", "电话联系"),
          })}
          className={navClass}
        >
          <span>电话联系</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "support.chat.ai":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "support.chat.ai.0.other" }, {
            onTrigger: () => recordAction("support.chat.ai.0.other", "快捷问题/发送"),
          })}
          className={navClass}
        >
          <span>快捷问题/发送</span><span className="text-[#19bfc3]">点按</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: "support.chat.ai.1.other" }, {
            onTrigger: () => recordAction("support.chat.ai.1.other", "转人工客服"),
          })}
          className={navClass}
        >
          <span>转人工客服</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "world.article":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "world.article.0.other" }, {
            onTrigger: () => recordAction("world.article.0.other", "发评论/点赞/收藏"),
          })}
          className={navClass}
        >
          <span>发评论/点赞/收藏</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "world.topic":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "world.topic.0.other" }, {
            onTrigger: () => recordAction("world.topic.0.other", "参与话题"),
          })}
          className={navClass}
        >
          <span>参与话题</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "world.note":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "world.note.0.other" }, {
            onTrigger: () => recordAction("world.note.0.other", "发评论/收藏"),
          })}
          className={navClass}
        >
          <span>发评论/收藏</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "support.main":
      return <div className="grid gap-2">        <button {...bindTap("support.main.0.open")} className={navClass}>
          <span>在线客服项(门票/机票/酒店/房东)</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("support.main.1.open")} className={navClass}>
          <span>大家常问 FAQ</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    case "support.faq":
      return <div className="grid gap-2">        <button
          {...bindTap({ kind: 'action', id: "support.faq.0.other" }, {
            onTrigger: () => recordAction("support.faq.0.other", "返回"),
          })}
          className={navClass}
        >
          <span>返回</span><span className="text-[#19bfc3]">点按</span>
        </button>
      </div>;
    case "world.main":
      return <div className="grid gap-2">        <button {...bindTap("world.main.0.open")} className={navClass}>
          <span>攻略卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("world.main.1.open")} className={navClass}>
          <span>话题</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("world.main.2.open")} className={navClass}>
          <span>笔记卡</span><span className="text-[#8b949c]">›</span>
        </button>
        <button {...bindTap("world.main.3.open")} className={navClass}>
          <span>低价机票卡</span><span className="text-[#8b949c]">›</span>
        </button>
      </div>;
    default:
      return null;
  }
}
