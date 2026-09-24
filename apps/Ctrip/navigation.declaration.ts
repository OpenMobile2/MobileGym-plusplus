/**
 * Ctrip 声明式导航 —— 由 docs/ctrip-replication/spec.json v1.0.0 自动编译(gen_declaration.py)。
 * 改导航请改 spec 后重跑生成器,勿手改本文件(spec-first 纪律)。
 * 弹层/筛选态走 searchParams(state=xxx),符合 module-contract「URL 驱动 UI」。
 */
import type { NavigationDeclaration } from './navigation.types';

export const NAVIGATION_DECLARATION = {
  app: "ctrip",
  routes: [
    {
      path: "/",
      component: "HomeMainPage",
      params: {},
      entryPoint: "home",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.home.main.base", search: {}, description: "首页",
          actions: [
            { id: "home.kingkong.wontfix", label: "金刚区·旅游定制/跟团游/民宿等长尾", behavior: "submit" },
            { id: "home.ops.wontfix", label: "运营卡(特价直播/演出/榜单等)", behavior: "submit" },
            { id: "home.ai.wontfix", label: "行程规划AI / 问AI", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "首页",
    },
    {
      path: "/search",
      component: "SearchResultPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.search.result.base", search: {}, description: "搜索结果",
          actions: [
            { id: "search.input.value", label: "搜索输入框", behavior: "input", paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: "搜索结果",
    },
    {
      path: "/dest/:city",
      component: "DestCityPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.dest.city.base", search: {}, description: "城市目的地",
          actions: [
            { id: "destCity.chip.select.overview", label: "玩转XX chips(城市速览/交通攻略/亲子游)", behavior: "select" },
            { id: "destCity.guide.wontfix", label: "当地指南/旅行热点/线路规划/连玩目的地", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "城市目的地",
    },
    {
      path: "/hotel/search",
      component: "HotelSearchPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.search.base", search: {}, description: "酒店搜索·domestic",
          actions: [
            { id: "hotelSearch.date.open", label: "日期选择", behavior: "open" },
            { id: "hotelSearch.guests.open", label: "入住人数", behavior: "open" },
            { id: "hotelSearch.tab.select.domestic", label: "国内/海外/民宿/钟点房 tab", behavior: "select" },
            { id: "hotelSearch.explore.open", label: "周边探索副tab", behavior: "open" },
          ],
        },
        {
          id: "ctrip.hotel.search.oversea", search: {"state": "oversea"}, description: "酒店搜索·oversea",
          actions: [],
        },
        {
          id: "ctrip.hotel.search.homestay", search: {"state": "homestay"}, description: "酒店搜索·homestay",
          actions: [],
        },
        {
          id: "ctrip.hotel.search.hourly", search: {"state": "hourly"}, description: "酒店搜索·hourly",
          actions: [],
        },
        {
          id: "ctrip.hotel.search.explore", search: {"state": "explore"}, description: "酒店搜索·explore",
          actions: [],
        },
      ],
      queryParams: {},
      description: "酒店搜索",
    },
    {
      path: "/hotel/city",
      component: "HotelCityPickerPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.cityPicker.base", search: {}, description: "城市选择",
          actions: [
            { id: "cityPicker.input.value", label: "城市搜索框", behavior: "input", paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: "城市选择",
    },
    {
      path: "/hotel/list",
      component: "HotelListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.list.base", search: {}, description: "酒店列表·list",
          actions: [
            { id: "hotelList.sort.select.popularity", label: "排序栏(欢迎度/好评/低价…)", behavior: "select" },
            { id: "hotelList.filter.price.open", label: "价格/星级筛选", behavior: "open" },
            { id: "hotelList.filter.more.open", label: "综合筛选(玩法/品牌/设施)", behavior: "open" },
            { id: "hotelList.chip.select.hiking", label: "筛选chip(徒步/玩转乐园等)", behavior: "select" },
          ],
        },
        {
          id: "ctrip.hotel.list.sortPanel", search: {"state": "sortPanel"}, description: "酒店列表·sortPanel",
          actions: [],
        },
        {
          id: "ctrip.hotel.list.filterPrice", search: {"state": "filterPrice"}, description: "酒店列表·filterPrice",
          actions: [],
        },
        {
          id: "ctrip.hotel.list.filterMore", search: {"state": "filterMore"}, description: "酒店列表·filterMore",
          actions: [],
        },
      ],
      queryParams: {},
      description: "酒店列表",
    },
    {
      path: "/hotel/map",
      component: "HotelMapPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.map.base", search: {}, description: "酒店地图",
          actions: [
            { id: "hotelMap.pin.open", label: "酒店气泡", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "酒店地图",
    },
    {
      path: "/hotel/:id",
      component: "HotelDetailPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.detail.base", search: {}, description: "酒店详情·cover",
          actions: [
            { id: "hotelDetail.favorite.toggle", label: "收藏(♡+)", behavior: "toggle" },
            { id: "hotelDetail.share.wontfix", label: "分享/购物车", behavior: "submit" },
            { id: "hotelDetail.more.open", label: "右上「更多」", behavior: "open" },
          ],
        },
        {
          id: "ctrip.hotel.detail.highlights", search: {"state": "highlights"}, description: "酒店详情·highlights",
          actions: [],
        },
        {
          id: "ctrip.hotel.detail.facilities", search: {"state": "facilities"}, description: "酒店详情·facilities",
          actions: [],
        },
        {
          id: "ctrip.hotel.detail.surroundings", search: {"state": "surroundings"}, description: "酒店详情·surroundings",
          actions: [],
        },
        {
          id: "ctrip.hotel.detail.policy", search: {"state": "policy"}, description: "酒店详情·policy",
          actions: [],
        },
      ],
      queryParams: {},
      description: "酒店详情",
    },
    {
      path: "/hotel/:id/facilities",
      component: "HotelFacilitiesPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.facilities.base", search: {}, description: "酒店设施服务",
          actions: [],
        },
      ],
      queryParams: {},
      description: "酒店设施服务",
    },
    {
      path: "/hotel/:id/review",
      component: "HotelReviewPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.review.base", search: {}, description: "酒店点评",
          actions: [
            { id: "hotelReview.filter.select.withpic", label: "点评筛选chip(有图/差评/标签)", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "酒店点评",
    },
    {
      path: "/hotel/:id/rooms",
      component: "HotelRoomPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.room.base", search: {}, description: "房型选择",
          actions: [
            { id: "hotelRoom.filter.select.twinbed", label: "房型筛选chip(双床/家庭房/含早)", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "房型选择",
    },
    {
      path: "/hotel/:id/booking",
      component: "HotelBookingPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.booking.base", search: {}, description: "酒店填单",
          actions: [
            { id: "hotelBooking.rooms.step", label: "间数步进器", behavior: "modify" },
            { id: "hotelBooking.req.select.elevator", label: "特殊要求chip", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "酒店填单",
    },
    {
      path: "/hotel/:id/cs",
      component: "HotelCsPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.cs.base", search: {}, description: "酒店客服",
          actions: [
            { id: "hotelCs.faq.select.parking", label: "猜您想问条目/政策chip", behavior: "select" },
            { id: "hotelCs.send.value", label: "发送输入", behavior: "input", paramsSchema: { value: 'string' } },
            { id: "hotelCs.panel.toggle", label: "+面板项(相册/位置/房型/订单)", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "酒店客服",
    },
    {
      path: "/hotel/:id/cs/info",
      component: "HotelCsInfoPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.hotel.csInfo.base", search: {}, description: "聊天信息",
          actions: [
            { id: "csInfo.switch.toggle.top", label: "开关(置顶/推送/黑名单)", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "聊天信息",
    },
    {
      path: "/train/search",
      component: "TrainSearchPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.train.search.base", search: {}, description: "火车票搜索·oneway",
          actions: [
            { id: "trainSearch.city.open", label: "出发/到达城市", behavior: "open" },
            { id: "trainSearch.date.open", label: "日期", behavior: "open" },
            { id: "trainSearch.student.toggle", label: "学生票开关", behavior: "toggle" },
            { id: "trainSearch.toolbox.wontfix", label: "出行百宝箱(抢票/换座/订汽车)", behavior: "submit" },
          ],
        },
        {
          id: "ctrip.train.search.roundtrip", search: {"state": "roundtrip"}, description: "火车票搜索·roundtrip",
          actions: [],
        },
        {
          id: "ctrip.train.search.student", search: {"state": "student"}, description: "火车票搜索·student",
          actions: [],
        },
      ],
      queryParams: {},
      description: "火车票搜索",
    },
    {
      path: "/train/list",
      component: "TrainListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.train.list.base", search: {}, description: "车次列表",
          actions: [
            { id: "trainList.date.open", label: "日期切换/日历", behavior: "open" },
            { id: "trainList.filter.open", label: "高级筛选", behavior: "open" },
            { id: "trainList.sort.select.earliest", label: "排序(出发最早/耗时最短/价格最低)", behavior: "select" },
            { id: "trainList.grab.wontfix", label: "抢票入口", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "车次列表",
    },
    {
      path: "/train/:no",
      component: "TrainDetailPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.train.detail.base", search: {}, description: "车次详情",
          actions: [
            { id: "trainDetail.stops.open", label: "经停信息", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "车次详情",
    },
    {
      path: "/train/:no/booking",
      component: "TrainBookingPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.train.booking.base", search: {}, description: "火车票填单",
          actions: [
            { id: "trainBooking.passenger.toggle", label: "乘客标签(一键添加)", behavior: "toggle" },
            { id: "trainBooking.seat.open", label: "在线选座", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "火车票填单",
    },
    {
      path: "/flight/search",
      component: "FlightSearchPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.flight.search.base", search: {}, description: "机票搜索·oneway",
          actions: [
            { id: "flightSearch.city.open", label: "出发/到达城市", behavior: "open" },
            { id: "flightSearch.trip.select.oneway", label: "单程/往返/多程", behavior: "select" },
          ],
        },
        {
          id: "ctrip.flight.search.roundtrip", search: {"state": "roundtrip"}, description: "机票搜索·roundtrip",
          actions: [],
        },
        {
          id: "ctrip.flight.search.multi", search: {"state": "multi"}, description: "机票搜索·multi",
          actions: [],
        },
      ],
      queryParams: {},
      description: "机票搜索",
    },
    {
      path: "/flight/calendar",
      component: "FlightCalendarPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.flight.calendar.base", search: {}, description: "机票日历",
          actions: [
            { id: "flightCalendar.direct.toggle", label: "仅看直飞", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "机票日历",
    },
    {
      path: "/flight/list",
      component: "FlightListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.flight.list.base", search: {}, description: "航班列表",
          actions: [
            { id: "flightList.filter.open", label: "筛选", behavior: "open" },
            { id: "flightList.sort.select.recommend", label: "排序(推荐/直飞优先/时间/价格)", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "航班列表",
    },
    {
      path: "/flight/:no",
      component: "FlightDetailPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.flight.detail.base", search: {}, description: "航班详情",
          actions: [
            { id: "flightDetail.addon.toggle", label: "金牌延误服务/选购", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "航班详情",
    },
    {
      path: "/flight/:no/booking",
      component: "FlightBookingPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.flight.booking.base", search: {}, description: "机票填单",
          actions: [
            { id: "flightBooking.passenger.open", label: "乘机人选择", behavior: "open" },
            { id: "flightBooking.insurance.select.none", label: "保险选择(无/标准/尊享)", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "机票填单",
    },
    {
      path: "/flight/alert",
      component: "FlightPriceAlertPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.flight.priceAlert.base", search: {}, description: "低价提醒",
          actions: [
            { id: "priceAlert.threshold.value", label: "价格滑块", behavior: "input", paramsSchema: { value: 'string' } },
            { id: "priceAlert.smart.toggle", label: "智能提醒开关", behavior: "toggle" },
            { id: "priceAlert.confirm.submit", label: "确认", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "低价提醒",
    },
    {
      path: "/ticket/list",
      component: "TicketListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.ticket.list.base", search: {}, description: "景点门票列表",
          actions: [
            { id: "ticketList.tab.select.tickets", label: "分类tab(景点门票/玩乐/一日游)", behavior: "select" },
            { id: "ticketList.filter.open", label: "排序/筛选", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "景点门票列表",
    },
    {
      path: "/ticket/:id",
      component: "TicketDetailPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.ticket.detail.base", search: {}, description: "景点详情·booking",
          actions: [
            { id: "ticketDetail.tab.select.booking", label: "预订/点评/须知/周边 tab", behavior: "select" },
            { id: "ticketDetail.gallery.open", label: "封面相册/图片/箭头", behavior: "open" },
            { id: "ticketDetail.favorite.toggle", label: "收藏/加入路线", behavior: "toggle" },
          ],
        },
        {
          id: "ctrip.ticket.detail.tickets", search: {"state": "tickets"}, description: "景点详情·tickets",
          actions: [],
        },
        {
          id: "ctrip.ticket.detail.highlights", search: {"state": "highlights"}, description: "景点详情·highlights",
          actions: [],
        },
      ],
      queryParams: {},
      description: "景点详情",
    },
    {
      path: "/ticket/:id/booking",
      component: "TicketBookingPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.ticket.booking.base", search: {}, description: "门票填单",
          actions: [
            { id: "ticketBooking.date.open", label: "日期条/优惠日历", behavior: "open" },
            { id: "ticketBooking.qty.step", label: "票数步进器", behavior: "modify" },
            { id: "ticketBooking.visitor.open", label: "游客选择", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "门票填单",
    },
    {
      path: "/cashier",
      component: "CashierMainPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.cashier.main.base", search: {}, description: "收银台",
          actions: [
            { id: "cashier.method.select.bankcard", label: "支付方式单选(银行卡/支付宝/分期)", behavior: "select" },
            { id: "cashier.changecard.wontfix", label: "换卡支付/其他支付方式", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "收银台",
    },
    {
      path: "/cashier/success",
      component: "CashierSuccessPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.cashier.success.base", search: {}, description: "支付成功",
          actions: [],
        },
      ],
      queryParams: {},
      description: "支付成功",
    },
    {
      path: "/car/home",
      component: "CarHomePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.car.home.base", search: {}, description: "租车自驾首页",
          actions: [
            { id: "carHome.date.open", label: "取还时间", behavior: "open" },
            { id: "carHome.tab.select.pickup", label: "接送机/包车/预约打车 tab", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "租车自驾首页",
    },
    {
      path: "/car/pickup",
      component: "CarPickupPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.car.pickup.base", search: {}, description: "接送机",
          actions: [
            { id: "carPickup.query.wontfix", label: "查询", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "接送机",
    },
    {
      path: "/car/location",
      component: "CarLocationPickerPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.car.locationPicker.base", search: {}, description: "取车地点选择",
          actions: [],
        },
      ],
      queryParams: {},
      description: "取车地点选择",
    },
    {
      path: "/car/list",
      component: "CarListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.car.list.base", search: {}, description: "租车车型列表",
          actions: [
            { id: "carList.filter.open", label: "座位/配置/更多筛选", behavior: "open" },
            { id: "carList.editPickup.open", label: "修改取还车信息", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "租车车型列表",
    },
    {
      path: "/car/:id",
      component: "CarDetailPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.car.detail.base", search: {}, description: "车型详情",
          actions: [],
        },
      ],
      queryParams: {},
      description: "车型详情",
    },
    {
      path: "/car/:id/booking",
      component: "CarBookingPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.car.booking.base", search: {}, description: "租车填单",
          actions: [
            { id: "carBooking.driver.toggle", label: "驾驶员选择", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "租车填单",
    },
    {
      path: "/trip",
      component: "TripMainPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.trip.main.base", search: {}, description: "行程",
          actions: [
            { id: "trip.plan.wontfix", label: "开始规划/线路规划", behavior: "submit" },
            { id: "trip.guide.wontfix", label: "攻略卡片", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "行程",
    },
    {
      path: "/trip/sync",
      component: "TripSyncPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.trip.sync.base", search: {}, description: "同步行程",
          actions: [
            { id: "tripSync.switch.toggle.id", label: "同步开关", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "同步行程",
    },
    {
      path: "/message",
      component: "MessageCenterPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.message.center.base", search: {}, description: "消息",
          actions: [],
        },
      ],
      queryParams: {},
      description: "消息",
    },
    {
      path: "/message/sub",
      component: "MessageSubListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.message.subList.base", search: {}, description: "消息子列表(通知/会员)",
          actions: [
            { id: "msgSub.detail.expand", label: "通知卡片「查看详情」", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "消息子列表(通知/会员)",
    },
    {
      path: "/cs",
      component: "CsMainPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.cs.main.base", search: {}, description: "客服",
          actions: [
            { id: "cs.faq.select.refund", label: "常见问题chip", behavior: "select" },
            { id: "cs.online.open", label: "在线客服", behavior: "open" },
          ],
        },
      ],
      queryParams: {},
      description: "客服",
    },
    {
      path: "/orders",
      component: "OrdersListPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.orders.list.base", search: {}, description: "订单列表·all",
          actions: [
            { id: "orders.tab.select.all", label: "订单tab(全部/待付款/退款售后…)", behavior: "select" },
          ],
        },
        {
          id: "ctrip.orders.list.unpaid", search: {"state": "unpaid"}, description: "订单列表·unpaid",
          actions: [],
        },
        {
          id: "ctrip.orders.list.upcoming", search: {"state": "upcoming"}, description: "订单列表·upcoming",
          actions: [],
        },
        {
          id: "ctrip.orders.list.refund", search: {"state": "refund"}, description: "订单列表·refund",
          actions: [],
        },
        {
          id: "ctrip.orders.list.toReview", search: {"state": "toReview"}, description: "订单列表·toReview",
          actions: [],
        },
      ],
      queryParams: {},
      description: "订单列表",
    },
    {
      path: "/orders/:id",
      component: "OrdersDetailPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.orders.detail.base", search: {}, description: "订单详情",
          actions: [
            { id: "orderDetail.contact.wontfix", label: "联系/致电房东、地图导航", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "订单详情",
    },
    {
      path: "/orders/:id/cancel",
      component: "OrdersCancelPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.orders.cancel.base", search: {}, description: "取消订单申请",
          actions: [
            { id: "orderCancel.reason.select.changed", label: "取消原因单选", behavior: "select" },
            { id: "orderCancel.apply.submit", label: "提交申请", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "取消订单申请",
    },
    {
      path: "/orders/:id/rebook",
      component: "OrdersRebookPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.orders.rebook.base", search: {}, description: "改签申请",
          actions: [
            { id: "rebook.viewflights.wontfix", label: "查看航班", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "改签申请",
    },
    {
      path: "/orders/invoice",
      component: "OrdersInvoicePage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.orders.invoice.base", search: {}, description: "报销凭证",
          actions: [
            { id: "invoice.tab.select.todo", label: "凭证tab", behavior: "select" },
            { id: "invoice.apply.submit", label: "选择订单+提交开票", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "报销凭证",
    },
    {
      path: "/mine",
      component: "MineMainPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.mine.main.base", search: {}, description: "我的",
          actions: [
            { id: "mine.misc.wontfix", label: "客服/扫一扫/签到/礼品卡等长尾", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "我的",
    },
    {
      path: "/mine/wallet",
      component: "MineWalletPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.mine.wallet.base", search: {}, description: "我的钱包",
          actions: [
            { id: "wallet.item.wontfix", label: "钱包条目", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "我的钱包",
    },
    {
      path: "/mine/travelers",
      component: "MineTravelersPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.mine.travelers.base", search: {}, description: "常用信息",
          actions: [
            { id: "travelers.item.edit", label: "编辑/删除出行人", behavior: "modify" },
            { id: "travelers.add.open", label: "手动新增", behavior: "open" },
            { id: "travelers.scan.wontfix", label: "扫描证件/邀请好友填写", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "常用信息",
    },
    {
      path: "/member",
      component: "MemberBenefitsPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.member.benefits.base", search: {}, description: "会员权益中心",
          actions: [
            { id: "member.benefit.wontfix", label: "权益图标", behavior: "submit" },
            { id: "member.tab.select.family", label: "家庭/学生/职场 tab", behavior: "select" },
          ],
        },
      ],
      queryParams: {},
      description: "会员权益中心",
    },
    {
      path: "/settings",
      component: "SettingsMainPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.settings.main.base", search: {}, description: "设置",
          actions: [
            { id: "settings.switch.toggle.network", label: "移动网络/通知类开关", behavior: "toggle" },
            { id: "settings.logout.confirm", label: "退出登录", behavior: "submit" },
            { id: "settings.misc.wontfix", label: "其余二级项(资质规则/算法公开/加盟)", behavior: "submit" },
          ],
        },
      ],
      queryParams: {},
      description: "设置",
    },
    {
      path: "/settings/sub",
      component: "SettingsSubPage",
      params: {},
      entryPoint: "none",
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主内容' }],
      uiStates: [
        {
          id: "ctrip.settings.sub.base", search: {}, description: "设置二级页",
          actions: [
            { id: "settingsSub.item.toggle", label: "二级设置项", behavior: "toggle" },
          ],
        },
      ],
      queryParams: {},
      description: "设置二级页",
    },
  ],
  transitions: [
    {
      id: "home.hotel-open", from: "/", to: "/hotel/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·酒店", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.dest-open", from: "/", to: "/dest/:city",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·攻略/景点", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.flight-open", from: "/", to: "/flight/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·机票", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.train-open", from: "/", to: "/train/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·火车票", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.ticket2-open", from: "/", to: "/ticket/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·门票/玩乐", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.carpickup-open", from: "/", to: "/car/pickup",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·接送机/包车", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.car-open", from: "/", to: "/car/home",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "金刚区·租车自驾", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.search-open", from: "/", to: "/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "搜索框", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "home.feed-open", from: "/", to: "/dest/:city",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "本地feed卡片", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "search.toList", from: "/search", to: "/hotel/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "联想结果行", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "search.chip-toList", from: "/search", to: "/hotel/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "热搜chip", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "destCity.toHotel", from: "/dest/:city", to: "/hotel/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "品类入口·酒店", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "destCity.toTicket", from: "/dest/:city", to: "/ticket/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "品类入口·景点/日游", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "destCity.toFlight", from: "/dest/:city", to: "/flight/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "品类入口·机票/火车票", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "destCity.toAttraction", from: "/dest/:city", to: "/ticket/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "必看精选卡片(外滩/迪士尼/东方明珠)", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelSearch.city-open", from: "/hotel/search", to: "/hotel/city",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "城市选择", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelSearch.query", from: "/hotel/search", to: "/hotel/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "查询按钮", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "cityPicker.select", from: "/hotel/city", to: "/hotel/list",
      search: {}, searchParams: {}, mode: 'replace', params: {},
      label: "城市卡片", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelList.toDetail", from: ["/hotel/list", "/hotel/map"], to: "/hotel/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "酒店卡片(卡片主体)", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelList.toRoom", from: "/hotel/list", to: "/hotel/:id/rooms",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "卡片「订/¥价格」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelList.toMap", from: "/hotel/list", to: "/hotel/map",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "地图入口", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelMap.toList", from: "/hotel/map", to: "/hotel/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "返回列表", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelDetail.toRoom", from: "/hotel/:id", to: "/hotel/:id/rooms",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "查看房型 / 房型卡", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelDetail.toReview", from: "/hotel/:id", to: "/hotel/:id/review",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "点评 tab/评分卡", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelDetail.toFacilities", from: "/hotel/:id", to: "/hotel/:id/facilities",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "设施 tab", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelDetail.toCs", from: "/hotel/:id", to: "/hotel/:id/cs",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "底部「问酒店」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "facilities.back", from: "/hotel/:id/facilities", to: "/hotel/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "返回详情", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelReview.back", from: "/hotel/:id/review", to: "/hotel/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "返回详情", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelRoom.toBooking", from: "/hotel/:id/rooms", to: "/hotel/:id/booking",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "房型方案「订」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelBooking.toCashier", from: "/hotel/:id/booking", to: "/cashier",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "立即支付", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "hotelCs.toInfo", from: "/hotel/:id/cs", to: "/hotel/:id/cs/info",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "右上设置→聊天信息", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "trainSearch.query", from: "/train/search", to: "/train/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "查询/学生票查询", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "trainList.toDetail", from: "/train/list", to: "/train/:no",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "车次卡片", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "trainDetail.toBooking", from: "/train/:no", to: "/train/:no/booking",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "席别方案「订」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "trainBooking.toCashier", from: "/train/:no/booking", to: "/cashier",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "立即预订", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightSearch.toCalendar", from: "/flight/search", to: "/flight/calendar",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "出发日期", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightSearch.query", from: "/flight/search", to: "/flight/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "查询", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightCalendar.pick", from: "/flight/calendar", to: "/flight/list",
      search: {}, searchParams: { date: 'string' }, mode: 'replace', params: {},
      label: "日期格", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightList.toDetail", from: "/flight/list", to: "/flight/:no",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "航班卡片", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightList.toAlert", from: "/flight/list", to: "/flight/alert",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "低价提醒", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightDetail.toBooking", from: "/flight/:no", to: "/flight/:no/booking",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "票价方案「订」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "flightBooking.toCashier", from: "/flight/:no/booking", to: "/cashier",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "下一步/去支付", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "ticketList.toDetail", from: "/ticket/list", to: "/ticket/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "景点卡片", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "ticketDetail.toBooking", from: "/ticket/:id", to: "/ticket/:id/booking",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "票种「预订/选购」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "ticketBooking.toCashier", from: "/ticket/:id/booking", to: "/cashier",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "去支付", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "cashier.pay", from: "/cashier", to: "/cashier/success",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "底部「银行卡支付¥X」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "paySuccess.toOrders", from: "/cashier/success", to: "/orders",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "查看订单", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "paySuccess.toHome", from: ["/cashier/success", "/hotel/:id"], to: "/",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "返回首页", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "carHome.toLocation", from: "/car/home", to: "/car/location",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "取/还车地点", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "carHome.query", from: "/car/home", to: "/car/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "查询", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "carLocation.select", from: "/car/location", to: "/car/list",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "地点条目", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "carList.toDetail", from: "/car/list", to: "/car/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "车型卡片", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "carDetail.toBooking", from: "/car/:id", to: "/car/:id/booking",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "订", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "carBooking.toCashier", from: "/car/:id/booking", to: "/cashier",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "去支付", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "trip.toSync", from: "/trip", to: "/trip/sync",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "添加行程/同步行程", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "message.toSub", from: "/message", to: "/message/sub",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "消息金刚(订单出行/账户通知/会员服务)", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "message.toCs", from: "/message", to: "/cs",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "右上「客服」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "message.toSettings", from: "/message", to: "/settings",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "右上「设置」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "message.toChat", from: "/message", to: "/hotel/:id/cs",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "会话条目", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.toDetail", from: "/orders", to: "/orders/:id",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "待付款订单「立即支付」", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.toRebook", from: "/orders", to: "/orders/:id/rebook",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "改签", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.toInvoice", from: "/orders", to: "/orders/invoice",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "报销凭证", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.rebookSame", from: "/orders", to: "/hotel/search",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "再次预订", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orders.toRefund", from: "/orders", to: "/orders/:id/cancel",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "退票/退款", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orderDetail.toCashier", from: "/orders/:id", to: "/cashier",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "立即支付", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "orderDetail.toCancel", from: "/orders/:id", to: "/orders/:id/cancel",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "取消订单", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.toOrders", from: ["/mine", "/hotel/:id"], to: "/orders",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "全部订单/各状态订单", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.toWallet", from: "/mine", to: "/mine/wallet",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "钱包/优惠券", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.toMember", from: "/mine", to: "/member",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "会员权益/会员中心", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.toSettings", from: "/mine", to: "/settings",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "右上设置", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.toTravelers", from: "/mine", to: "/mine/travelers",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "常用信息", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "mine.toInvoice", from: "/mine", to: "/orders/invoice",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "报销凭证", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "settings.toSub", from: "/settings", to: "/settings/sub",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "个人信息/账号安全/隐私设置 二级页", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.home-open", from: '*', to: "/",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "首页 Tab", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.message-open", from: ["/", "/message", "/trip", "/mine", "/hotel/:id"], to: "/message",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "消息 Tab", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.trip-open", from: '*', to: "/trip",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "行程 Tab", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
    {
      id: "tabbar.mine-open", from: '*', to: "/mine",
      search: {}, searchParams: {}, mode: 'push', params: {},
      label: "我的 Tab", ui: { placement: 'none', icon: 'forward', gesture: 'tap' },
    },
  ],
  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
