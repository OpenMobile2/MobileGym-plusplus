/**
 * 猫眼 声明式导航 —— 由 docs/maoyan-replication/spec.json v1.0.0 编译。
 * 弹层(协议弹窗/优惠券/明细/分享卡/新增观演人)走 searchParams(URL 驱动 UI)。
 * nav → transitions;state → uiStates[].actions;返回/关闭一律 system.back(§11,不建声明)。
 */
import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string, direction: 'vertical' | 'horizontal' = 'vertical') =>
  ({ name, direction, description }) as const;
const ds = (ref: string, param: string, labelField?: string) =>
  ({ ref, paramMapping: { [param]: 'id' }, labelField }) as const;

export const NAVIGATION_DECLARATION = {
  app: 'maoyan',
  routes: [
    // ---------------- 首页 ----------------
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [sc('home-feed', '首页内容流')],
      uiStates: [
        {
          id: 'maoyan.home.base', search: {}, description: '首页(金刚区 ch= 切换频道整版内容)',
          actions: [
            { id: 'home.channel.select.target', label: '金刚区频道切换(电影/演唱会/演出/脱口秀/话剧音乐剧)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.wish.toggle', label: '待映卡【想看】', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'home.peripheral.disabled', label: '爆款周边/景点门票(暂未开放)', behavior: 'other' },
            { id: 'home.banner.disabled', label: '营销banner/抢票播报站(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { ch: 'string' },
      description: '首页:城市/搜索/金刚区频道/热门电影演出/待映推荐',
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
          id: 'maoyan.login.base', search: {}, description: '手机验证码登录页',
          actions: [
            { id: 'login.phone.input', label: '输入手机号', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'login.agree.toggle', label: '勾选用户协议', behavior: 'toggle' },
            { id: 'login.thirdparty.disabled', label: '微信/QQ登录(暂未开放)', behavior: 'other' },
            { id: 'login.pwd.disabled', label: '密码登录(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '登录页(mock:任意手机号+任意验证码)',
    },
    {
      path: '/login/sms',
      component: 'SmsCodePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'maoyan.sms.base', search: {}, description: '验证码输入(数字键盘,输满6位登录)',
          actions: [
            { id: 'login.smscode.input', label: '输入验证码(6位自动提交)', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '验证码输入页',
    },
    // ---------------- 城市选择 ----------------
    {
      path: '/city',
      component: 'CityPickerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('city-list', '城市列表')],
      uiStates: [
        {
          id: 'maoyan.city.base', search: {}, description: '城市选择页',
          actions: [
            { id: 'city.pick.select.target', label: '选择城市(全局切换并返回)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'city.index.select.letter', label: '字母索引定位', behavior: 'select', paramsSchema: { letter: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '城市选择(定位/最近访问/热门城市/A-Z)',
    },
    // ---------------- 电影频道 ----------------
    {
      path: '/movie',
      component: 'MovieChannelPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('movie-list', '影片/影院列表')],
      uiStates: [
        {
          id: 'maoyan.movie.base', search: {}, description: '默认态(=热映tab)',
          actions: [
            { id: 'movie.tab.select.target', label: '热映/影院/待映 tab', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
        { id: 'maoyan.movie.hot', search: { tab: 'hot' }, description: '热映tab' },
        {
          id: 'maoyan.movie.cinemas', search: { tab: 'cinemas' }, description: '影院tab',
          actions: [
            { id: 'movie.cinemas.region.select.option', label: '商圈/地铁筛选', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'movie.cinemas.sort.select.option', label: '排序(距离近/价格低)', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'movie.cinemas.filter.select.option', label: '筛选(影院服务/影厅类型)', behavior: 'select', paramsSchema: { option: 'string' } },
          ],
        },
        {
          id: 'maoyan.movie.upcoming', search: { tab: 'upcoming' }, description: '待映tab',
          actions: [
            { id: 'movie.upcoming.wish.toggle', label: '待映行【想看】', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'movie.trailer.disabled', label: '预告片(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '电影频道:热映/影院/待映',
    },
    // ---------------- 全部热门 ----------------
    {
      path: '/hot-all',
      component: 'HotAllPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('hotall-list', '全部热门列表')],
      uiStates: [
        {
          id: 'maoyan.hotall.base', search: {}, description: '默认态(=热映电影tab)',
          actions: [
            { id: 'hotall.tab.select.target', label: '热映电影/热门演出/影院 tab', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
        { id: 'maoyan.hotall.movies', search: { tab: 'movies' }, description: '热映电影tab' },
        { id: 'maoyan.hotall.shows', search: { tab: 'shows' }, description: '热门演出tab' },
        { id: 'maoyan.hotall.cinemas', search: { tab: 'cinemas' }, description: '影院tab' },
      ],
      queryParams: {},
      description: '全部热门(热映电影/热门演出/影院)',
    },
    // ---------------- 电影详情 ----------------
    {
      path: '/detail/:id',
      component: 'MovieDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('detail-scroll', '详情页滚动'), sc('cast-row', '演职人员横滑', 'horizontal')],
      uiStates: [
        {
          id: 'maoyan.detail.base', search: {}, description: '电影详情(海报自适应沉浸主题)',
          actions: [
            { id: 'detail.wish.toggle', label: '想看/已想看切换(人数±1)', behavior: 'toggle' },
            { id: 'detail.synopsis.toggle', label: '简介展开/收起', behavior: 'toggle' },
            { id: 'detail.tab.select.target', label: '影评/详细信息/推荐 tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'detail.review.like.toggle', label: '热评点赞', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'detail.cast.disabled', label: '演职人员全部页(暂未开放)', behavior: 'other' },
            { id: 'detail.share.disabled', label: '右上分享→跨App分享到微信(ACTION_SEND)', behavior: 'other' },
          ],
        },
        {
          id: 'maoyan.detail.share', search: { share: 'open' }, description: '分享卡弹层(发布短评后/右上分享)',
          actions: [
            { id: 'sharecard.channel.share', label: '分享到微信好友/朋友圈/QQ好友/保存图片', behavior: 'other', paramsSchema: { option: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '电影详情页',
    },
    // ---------------- 短评 ----------------
    {
      path: '/reviews/:id',
      component: 'ReviewsPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('reviews-list', '短评列表')],
      uiStates: [
        {
          id: 'maoyan.reviews.base', search: {}, description: '猫眼短评列表',
          actions: [
            { id: 'reviews.filter.select.option', label: '筛选chips(全部/最新/购票好评/购票差评)', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'reviews.like.toggle', label: '短评点赞', behavior: 'toggle', paramsSchema: { id: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '猫眼短评列表页',
    },
    {
      path: '/write-review/:id',
      component: 'WriteReviewPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'maoyan.writereview.base', search: {}, description: '写短评(星级+标签+正文,满5字可发布)',
          actions: [
            { id: 'writereview.stars.input', label: '拖动/点选星级(1-10分)', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'writereview.tag.toggle', label: '小标签chips', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'writereview.text.input', label: '输入评论正文', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '写短评/评分页',
    },
    // ---------------- 购票链 ----------------
    {
      path: '/showtimes/:id',
      component: 'ShowtimesPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('showtimes-list', '影院列表')],
      uiStates: [
        {
          id: 'maoyan.showtimes.base', search: {}, description: '购票·选影院页',
          actions: [
            { id: 'showtimes.date.select.option', label: '日期tab(今天/明天/后天)', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'showtimes.filter.select.option', label: '区域/排序/品牌/筛选', behavior: 'select', paramsSchema: { option: 'string' } },
          ],
        },
      ],
      queryParams: { date: 'string' },
      description: '选影院页(影片维度)',
    },
    {
      path: '/cinema/:id',
      component: 'CinemaDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('cinema-scroll', '影院详情滚动'), sc('film-carousel', '影片横滑', 'horizontal')],
      uiStates: [
        {
          id: 'maoyan.cinema.base', search: {}, description: '影院详情/场次页',
          actions: [
            { id: 'cinema.film.select.target', label: '影片横滑切换(未上映片显示空态)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'cinema.date.select.option', label: '日期tab', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'cinema.fav.toggle', label: '影院收藏☆', behavior: 'toggle' },
            { id: 'cinema.snack.disabled', label: '观影小吃购买(暂未开放)', behavior: 'other' },
            { id: 'cinema.promo.disabled', label: '观影套餐/券包/影城卡(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { film: 'string', date: 'string' },
      description: '影院详情页(场次表+小吃)',
    },
    {
      path: '/seat/:sessionId',
      component: 'SeatSelectPage',
      params: { sessionId: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('seat-map', '座位图', 'horizontal')],
      uiStates: [
        {
          id: 'maoyan.seat.base', search: {}, description: '在线选座',
          actions: [
            { id: 'seat.pick.toggle', label: '选/取消座位(上限6,qa:Q3)', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'seat.remove.toggle', label: '底部座位签×移除', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'seat.recommend.select.option', label: '推荐座位1-5人(自动连座,qa:Q12)', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'seat.session.select.target', label: '切换场次(清空已选)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'seat.confirm.blocked', label: '未选座点确认→提示请先选座', behavior: 'other' },
          ],
        },
        {
          id: 'maoyan.seat.agreement', search: { agree: 'open' }, description: '退改签规定协议弹窗',
          actions: [
            { id: 'seat.agree.check.toggle', label: '勾选我已阅读并同意', behavior: 'toggle' },
            { id: 'seat.agree.blocked', label: '未勾选点继续→toast提示', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '选座页(座位图+推荐座位+协议弹窗)',
    },
    {
      path: '/order/confirm',
      component: 'OrderConfirmPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('orderconfirm-scroll', '确认订单滚动')],
      uiStates: [
        {
          id: 'maoyan.orderconfirm.base', search: {}, description: '确认订单(电影票)',
          actions: [
            { id: 'orderconfirm.snack.toggle', label: '小吃/周边加购±', behavior: 'toggle', paramsSchema: { id: 'string' } },
{ id: 'orderconfirm.card.toggle', label: '随票加购影城卡(本单加卡费/减开卡立减)', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'orderconfirm.refundPolicy.disabled', label: '限时退改签查看详情(暂未开放,待补拍退改签详情页)', behavior: 'other' },
          ],
        },
        { id: 'maoyan.orderconfirm.coupon', search: { coupon: 'open' }, description: '优惠券半屏弹层' },
        { id: 'maoyan.orderconfirm.detail', search: { detail: 'open' }, description: '价格明细弹层' },
      ],
      queryParams: {},
      description: '确认订单页(小吃加购/优惠/手机号/须知)',
    },
    {
      path: '/pay',
      component: 'CashierPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'maoyan.cashier.base', search: {}, description: '支付订单收银台(qa:Q4=C)',
          actions: [
            { id: 'cashier.method.select.option', label: '支付方式单选(微信/云闪付/京东白条)', behavior: 'select', paramsSchema: { option: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '收银台页(倒计时+金额+支付方式)',
    },
    {
      path: '/pay/success',
      component: 'PaySuccessPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        { id: 'maoyan.paysuccess.base', search: {}, description: '出票中/支付成功过渡页(qa:Q5=A)' },
      ],
      queryParams: {},
      description: '支付成功/出票页',
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
          id: 'maoyan.orders.base', search: {}, description: '默认态(=电影票tab)',
          actions: [
            { id: 'orders.tab.select.target', label: '电影票/演出玩乐 tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'orders.edit.toggle', label: '右上编辑(多选模式)', behavior: 'toggle' },
          ],
        },
        { id: 'maoyan.orders.movie', search: { tab: 'movie' }, description: '电影票订单' },
        { id: 'maoyan.orders.show', search: { tab: 'show' }, description: '演出订单(空态:这里还没有票)' },
      ],
      queryParams: {},
      description: '订单列表(电影票/演出)',
    },
    {
      path: '/order/:id',
      component: 'OrderDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('orderdetail-scroll', '订单详情滚动')],
      uiStates: [
        {
          id: 'maoyan.orderdetail.base', search: {}, description: '订单详情(取票码/评价)',
          actions: [
            { id: 'orderdetail.code.toggle', label: '展开取票码(二维码+验证码,qa:Q6)', behavior: 'toggle' },
            { id: 'orderdetail.refund.trigger', label: '退票/改签(暂未开放,qa:Q11)', behavior: 'other' },
            { id: 'orderdetail.food.disabled', label: '附近美食/玩乐(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '订单详情页',
    },
    // ---------------- 搜索 ----------------
    {
      path: '/search',
      component: 'SearchLandingPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-landing', '搜索中间页滚动')],
      uiStates: [
        {
          id: 'maoyan.search.base', search: {}, description: '搜索中间页',
          actions: [
            { id: 'search.query.input', label: '输入关键词', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'search.history.clear', label: '清除历史记录', behavior: 'other' },
            { id: 'search.local.disabled', label: '热门景点/休闲玩乐(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '搜索中间页(历史/热搜/想看榜)',
    },
    {
      path: '/search/result',
      component: 'SearchResultPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-result', '搜索结果列表')],
      uiStates: [
        {
          id: 'maoyan.searchresult.base', search: {}, description: '搜索结果页',
          actions: [
            { id: 'searchresult.tab.select.target', label: '全部/演出/影视剧/影院/影·艺人 tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'searchresult.wish.toggle', label: '结果卡【想看】', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'searchresult.artist.disabled', label: '影人卡【去主页】(影人主页暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { q: 'string' },
      description: '搜索结果(影片/影院/演出分组)',
    },
    // ---------------- 演出 ----------------
    {
      path: '/show',
      component: 'ShowChannelPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('show-feed', '演出频道流')],
      uiStates: [
        {
          id: 'maoyan.show.base', search: {}, description: '演出频道',
          actions: [
            { id: 'show.rank.disabled', label: '演出榜单(暂未开放,qa:Q10)', behavior: 'other' },
            { id: 'show.artist.disabled', label: '艺人预约(暂未开放)', behavior: 'other' },
            { id: 'show.calendar.disabled', label: '演出日历/神券/观演团(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '演出频道(演唱会·演出tab)',
    },
    {
      path: '/show/category',
      component: 'ShowCategoryPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('showcat-list', '演出分类列表')],
      uiStates: [
        {
          id: 'maoyan.showcat.base', search: {}, description: '演出分类列表页',
          actions: [
            { id: 'showcat.tab.select.target', label: '分类tab(演唱会/话剧/音乐节…)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'showcat.filter.select.option', label: '时间/艺人/智能排序', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'showcat.fav.toggle', label: '演出卡收藏♡', behavior: 'toggle', paramsSchema: { id: 'string' } },
          ],
        },
      ],
      queryParams: { cat: 'string' },
      description: '演出分类列表(演唱会等)',
    },
    {
      path: '/show/:id',
      component: 'ShowDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('showdetail-scroll', '演出详情滚动')],
      uiStates: [
        {
          id: 'maoyan.showdetail.base', search: {}, description: '演出详情页',
          actions: [
            { id: 'showdetail.city.select.option', label: '场次城市chips', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'showdetail.wish.toggle', label: '想看♡', behavior: 'toggle' },
            { id: 'showdetail.tab.select.target', label: '介绍/须知/推荐 tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'showdetail.notice.toggle', label: '购票观演须知展开', behavior: 'toggle' },
            { id: 'showdetail.follow.toggle', label: '艺人+关注', behavior: 'toggle' },
            { id: 'showdetail.artist.disabled', label: '艺人头像/名(艺人主页暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '演出详情页',
    },
    {
      path: '/show/:id/tickets',
      component: 'ShowTicketPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'maoyan.showticket.base', search: {}, description: '选择票档页',
          actions: [
            { id: 'showticket.session.select.option', label: '场次chip', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'showticket.tier.select.option', label: '票档chip', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'showticket.qty.input', label: '数量-/+(1~6张)', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '选择票档(场次/票档/数量)',
    },
    {
      path: '/show/order/confirm',
      component: 'ShowOrderConfirmPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('showorder-scroll', '确认购票滚动')],
      uiStates: [
        {
          id: 'maoyan.showorder.base', search: {}, description: '确认购票页(演出)',
          actions: [
            { id: 'showorder.viewer.select.option', label: '实名观演人单选', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'showorder.phone.input', label: '联系方式手机号(数字键盘,qa:Q2)', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '确认购票页(实名观演人/联系方式)',
    },
    // ---------------- 玩乐 ----------------
    {
      path: '/fun',
      component: 'FunPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('fun-list', '玩乐商户列表')],
      uiStates: [
        {
          id: 'maoyan.fun.base', search: {}, description: '玩乐频道(qa:Q9=A 简单列表页)',
          actions: [
            { id: 'fun.tab.select.target', label: '附近玩乐/美食团购/精彩演出 tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'fun.category.select.option', label: '金刚区15格分类过滤(同组一致)', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'fun.filter.select.option', label: '附近/分类/推荐排序筛选', behavior: 'select', paramsSchema: { option: 'string' } },
            { id: 'fun.merchant.disabled', label: '商户/景点深页(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '玩乐频道(金刚区+景点+商户列表)',
    },
    // ---------------- 我的 ----------------
    {
      path: '/me',
      component: 'MinePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('mine-scroll', '我的页滚动')],
      uiStates: [
        {
          id: 'maoyan.mine.base', search: {}, description: '我的页',
          actions: [
            { id: 'mine.misc.disabled', label: '猫享卡/喵币/包场/月卡等(暂未开放,同组一致)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '我的页(想看看过/订单/资产/服务宫格)',
    },
    {
      path: '/me/filmlog',
      component: 'FilmLogPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('filmlog-list', '想看/看过列表')],
      uiStates: [
        {
          id: 'maoyan.filmlog.base', search: {}, description: '默认态(=想看tab)',
          actions: [
            { id: 'filmlog.tab.select.target', label: '想看/看过 tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'filmlog.cat.select.target', label: '电影/电视剧/综艺/演出 分类tab', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
        { id: 'maoyan.filmlog.wish', search: { tab: 'wish' }, description: '想看tab' },
        { id: 'maoyan.filmlog.watched', search: { tab: 'watched' }, description: '看过tab(待评价/已评分)' },
      ],
      queryParams: {},
      description: '想看/看过页',
    },
    {
      path: '/me/profiles',
      component: 'ProfilesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('profiles-list', '观演人列表')],
      uiStates: [
        {
          id: 'maoyan.profiles.base', search: {}, description: '常用信息(实名观演人)',
          actions: [
            { id: 'profiles.remove.trigger', label: '删除观演人', behavior: 'other', paramsSchema: { id: 'string' } },
            { id: 'profiles.mail.disabled', label: '邮寄地址tab(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'maoyan.profiles.add', search: { add: 'open' }, description: '添加实名信息表单弹层',
          actions: [
            { id: 'profiles.name.input', label: '输入姓名', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'profiles.idno.input', label: '输入身份证号', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'profiles.save.submit', label: '保存观演人', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '常用信息(观演人管理)',
    },
    {
      path: '/me/cards',
      component: 'CardsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('cards-list', '影城卡列表')],
      uiStates: [
        {
          id: 'maoyan.cards.base', search: {}, description: '我的影城卡',
          actions: [
            { id: 'cards.buy.trigger', label: '开卡(走系统支付 ACTION_PAY,连续续费)', behavior: 'other', paramsSchema: { id: 'string' } },
            { id: 'cards.autorenew.toggle', label: '取消/开启影城卡自动续费', behavior: 'toggle', paramsSchema: { id: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '我的影城卡',
    },
    {
      path: '/me/ticket-folder',
      component: 'TicketFolderPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('folder-list', '票根列表')],
      uiStates: [
        {
          id: 'maoyan.folder.base', search: {}, description: '数字纪念票夹(深色页)',
          actions: [
            { id: 'folder.activity.disabled', label: '参加活动(暂未开放)', behavior: 'other' },
            { id: 'folder.tab.select.target', label: '电影/演出 tab', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '我的数字纪念票夹',
    },
    {
      path: '/me/coupons',
      component: 'CouponsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('coupons-list', '优惠券列表')],
      uiStates: [
        {
          id: 'maoyan.coupons.base', search: {}, description: '我的优惠券',
          actions: [
            { id: 'coupons.condition.toggle', label: '使用条件展开', behavior: 'toggle', paramsSchema: { id: 'string' } },
            { id: 'coupons.add.disabled', label: '添加优惠券(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '我的优惠券',
    },
    {
      path: '/me/coupons/expired',
      component: 'CouponsExpiredPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('couponsexp-list', '失效券列表')],
      uiStates: [
        {
          id: 'maoyan.couponsexp.base', search: {}, description: '默认态(=已过期tab)',
          actions: [
            { id: 'couponsexp.tab.select.target', label: '已过期/已使用 tab', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
        { id: 'maoyan.couponsexp.expired', search: { tab: 'expired' }, description: '已过期' },
        { id: 'maoyan.couponsexp.used', search: { tab: 'used' }, description: '已使用' },
      ],
      queryParams: {},
      description: '已失效优惠券',
    },
    {
      path: '/me/settings',
      component: 'SettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('settings-list', '设置列表')],
      uiStates: [
        {
          id: 'maoyan.settings.base', search: {}, description: '设置页',
          actions: [
            { id: 'settings.misc.disabled', label: '其余设置行(暂未开放,同组一致)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '设置页',
    },
  ],
  transitions: [
    // ---- TabBar(chrome.global) ----
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '首页 Tab', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'tabbar.movie-open', from: '*', to: '/movie', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '电影/影院 Tab', ui: { placement: 'tabbar', icon: 'film', gesture: 'tap' } },
    { id: 'tabbar.show-open', from: '*', to: '/show', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '演唱会·演出 Tab(中间特型)', ui: { placement: 'tabbar', icon: 'ticket', gesture: 'tap' } },
    { id: 'tabbar.fun-open', from: '*', to: '/fun', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '玩乐 Tab', ui: { placement: 'tabbar', icon: 'gamepad', gesture: 'tap' } },
    { id: 'tabbar.mine-open', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '我的 Tab', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },

    // ---- 登录 ----
    { id: 'login.sms-open', from: '/login', to: '/login/sms', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '获取短信验证码', ui: { placement: 'content', icon: 'send', gesture: 'tap' } },
    { id: 'login.smscode-submit', from: '/login/sms', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '验证码输满6位→登录成功回我的', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },

    // ---- 首页 ----
    { id: 'home.city-open', from: '/', to: '/city', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '城市入口(咸阳▾)', ui: { placement: 'topbar', icon: 'pin', gesture: 'tap' } },
    { id: 'home.search-open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '搜索栏', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'home.movie-open', from: '/', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '热门电影演出卡片', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'home.movie.buy-open', from: '/', to: '/showtimes/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '电影卡【购票】按钮', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'home.hotall-open', from: '/', to: '/hot-all', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '热门电影演出【查看全部】', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'home.show-open', from: '/', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '首页演出卡片', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },

    // ---- 电影频道 ----
    { id: 'movie.hot.item-open', from: '/movie', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '热映影片行', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'movie.hot.buy-open', from: '/movie', to: '/showtimes/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '热映行【购票】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'movie.upcoming.presale-open', from: '/movie', to: '/showtimes/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '待映行【预售】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'movie.cinemas.item-open', from: '/movie', to: '/cinema/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '影院行', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('cinemas', 'id', 'name') },

    // ---- 全部热门 ----
    { id: 'hotall.movie-open', from: '/hot-all', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '影片行', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'hotall.buy-open', from: '/hot-all', to: '/showtimes/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '【购票】/【预售】按钮', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'hotall.show-open', from: '/hot-all', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '演出行', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },

    // ---- 电影详情 ----
    { id: 'detail.buy-open', from: '/detail/:id', to: '/showtimes/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '底部【特惠购票】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'detail.watched-open', from: '/detail/:id', to: '/write-review/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '【看过】→进入打分(qa:Q8)', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'detail.review.write-open', from: '/detail/:id', to: '/write-review/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '【写短评】', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'detail.reviews-open', from: '/detail/:id', to: '/reviews/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '查看全部N条短评', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },

    // ---- 短评/写短评 ----
    { id: 'reviews.write-open', from: '/reviews/:id', to: '/write-review/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '右上写短评/编辑短评', ui: { placement: 'topbar', icon: 'edit', gesture: 'tap' } },
    { id: 'writereview.publish-submit', from: '/write-review/:id', to: '/detail/:id', search: { share: 'open' }, searchParams: {}, mode: 'replace', params: { id: 'string' },
      label: '【发布】→详情页+分享卡弹层', ui: { placement: 'topbar', icon: 'send', gesture: 'tap' } },

    // ---- 购票链 ----
    { id: 'showtimes.cinema-open', from: '/showtimes/:id', to: '/cinema/:id', search: {}, searchParams: { film: 'string', date: 'string' }, mode: 'push', params: { id: 'string' },
      label: '影院卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('cinemas', 'id', 'name') },
    { id: 'cinema.session.buy-open', from: '/cinema/:id', to: '/seat/:sessionId', search: {}, searchParams: {}, mode: 'push', params: { sessionId: 'string' },
      label: '场次行【购票】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('sessions', 'sessionId') },
    { id: 'seat.session.switch-open', from: '/seat/:sessionId', to: '/seat/:sessionId', search: {}, searchParams: {}, mode: 'replace', params: { sessionId: 'string' },
      label: '切换场次(重载座位图)', ui: { placement: 'content', icon: 'clock', gesture: 'tap' }, dataSource: ds('sessions', 'sessionId') },
    { id: 'seat.confirm.open', from: '/seat/:sessionId', to: '/seat/:sessionId', search: { agree: 'open' }, searchParams: {}, mode: 'push', params: { sessionId: 'string' },
      label: '已选座点【确认选座】→退改签协议弹窗', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'seat.agreement.continue-open', from: { path: '/seat/:sessionId', search: { agree: 'open' } }, to: '/order/confirm',
      search: { agree: null }, searchParams: {}, mode: 'push', params: {},
      label: '协议弹窗【继续购票】(已勾选)', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'orderconfirm.coupon.open', from: '/order/confirm', to: '/order/confirm', search: { coupon: 'open' }, searchParams: {}, mode: 'push', params: {},
      label: '影票活动与优惠券行→半屏券列表', ui: { placement: 'content', icon: 'coupon', gesture: 'tap' } },
    { id: 'orderconfirm.detail.toggle', from: '/order/confirm', to: '/order/confirm', search: { detail: 'open' }, searchParams: {}, mode: 'push', params: {},
      label: '明细▴弹层', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'orderconfirm.reselect-open', from: '/order/confirm', to: '/movie', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '订单草稿失效兜底【重新选座】→电影/影院', ui: { placement: 'content', icon: 'film', gesture: 'tap' } },
    { id: 'orderconfirm.pay-open', from: '/order/confirm', to: '/pay', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '【确认支付】→收银台(qa:Q4=C)', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'cashier.confirm-submit', from: '/pay', to: '/pay/success', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '【确认支付】→出票页(生成订单)', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },
    { id: 'paysuccess.order-open', from: '/pay/success', to: '/order/:id', search: {}, searchParams: {}, mode: 'replace', params: { id: 'string' },
      label: '【查看订单/取票码】(popTo:/ 收起下单链)', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'paysuccess.orders-open', from: '/pay/success', to: '/orders', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '订单未生成时的兜底出口【查看我的订单】', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'cashier.orders-open', from: '/pay', to: '/orders', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '收银台草稿失效兜底【查看我的订单】', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'paysuccess.home-open', from: '/pay/success', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '出票页【回到首页】(popTo:/ 收起下单链)', ui: { placement: 'content', icon: 'home', gesture: 'tap' } },

    // ---- 订单 ----
    { id: 'orders.item-open', from: '/orders', to: '/order/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '订单卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('orders', 'id', 'title') },
    { id: 'orders.review-open', from: '/orders', to: '/write-review/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '【评价影片】', ui: { placement: 'content', icon: 'star', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'orderdetail.rate-open', from: '/order/:id', to: '/write-review/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '评价电影·星级拖动→写短评', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'orderdetail.cinema-open', from: '/order/:id', to: '/cinema/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '影院名行>', ui: { placement: 'content', icon: 'shop', gesture: 'tap' } },

    // ---- 搜索 ----
    { id: 'search.submit-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '键盘【搜索】提交', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'search.history-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '历史记录chip', ui: { placement: 'content', icon: 'clock', gesture: 'tap' } },
    { id: 'search.hotword-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '热搜/想看榜条目', ui: { placement: 'content', icon: 'fire', gesture: 'tap' } },
    { id: 'searchresult.movie-open', from: '/search/result', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '影片结果卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'searchresult.buy-open', from: '/search/result', to: '/showtimes/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '结果卡【购票】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'searchresult.cinema-open', from: '/search/result', to: '/cinema/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '影院结果卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('cinemas', 'id', 'name') },
    { id: 'searchresult.show-open', from: '/search/result', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '演出结果卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },

    // ---- 演出 ----
    { id: 'show.search-open', from: '/show', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '搜索明星 演出 赛事 场馆', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'show.category-open', from: '/show', to: '/show/category', search: {}, searchParams: { cat: 'string' }, mode: 'push', params: {},
      label: '分类宫格(演唱会等)', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'show.item-open', from: '/show', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '推荐/必抢演出卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },
    { id: 'showcat.item-open', from: '/show/category', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '演出卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },
    { id: 'showdetail.book-open', from: '/show/:id', to: '/show/:id/tickets', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '【立即预订】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'showticket.confirm-open', from: '/show/:id/tickets', to: '/show/order/confirm', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '票档【确认】', ui: { placement: 'content', icon: 'check', gesture: 'tap' } },
    { id: 'showorder.viewer.add-open', from: '/show/order/confirm', to: '/me/profiles', search: { add: 'open' }, searchParams: {}, mode: 'push', params: {},
      label: '【新增】观演人', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    { id: 'showorder.reselect-open', from: '/show/order/confirm', to: '/show', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '购票草稿失效兜底【重新选票档】→演出频道', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'showorder.pay-open', from: '/show/order/confirm', to: '/pay', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '【立即支付】→收银台', ui: { placement: 'content', icon: 'pay', gesture: 'tap' } },

    // ---- 玩乐 ----
    { id: 'fun.search-open', from: '/fun', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '搜索商户/玩乐项目', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'fun.show-open', from: '/fun', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '精彩演出tab演出卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },

    // ---- 我的 ----
    { id: 'mine.filmlog-open', from: '/me', to: '/me/filmlog', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '想看/看过区块', ui: { placement: 'content', icon: 'heart', gesture: 'tap' } },
    { id: 'mine.orders.movie-open', from: '/me', to: '/orders', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '我的订单【电影票】(默认电影票tab)', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'mine.orders.show-open', from: '/me', to: '/orders', search: { tab: 'show' }, searchParams: {}, mode: 'push', params: {},
      label: '我的订单【演出/玩乐】', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' } },
    { id: 'mine.coupons-open', from: '/me', to: '/me/coupons', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '优惠券', ui: { placement: 'content', icon: 'coupon', gesture: 'tap' } },
    { id: 'mine.cards-open', from: '/me', to: '/me/cards', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '影城卡', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'mine.profiles-open', from: '/me', to: '/me/profiles', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '观演人信息', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'mine.ticketfolder-open', from: '/me', to: '/me/ticket-folder', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '我的纪念票夹', ui: { placement: 'content', icon: 'bookmark', gesture: 'tap' } },
    { id: 'mine.settings-open', from: '/me', to: '/me/settings', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '设置⚙', ui: { placement: 'topbar', icon: 'settings', gesture: 'tap' } },
    { id: 'mine.hotmovies-open', from: '/me', to: '/movie', search: { tab: 'hot' }, searchParams: {}, mode: 'push', params: {},
      label: '正在热映宫格', ui: { placement: 'content', icon: 'film', gesture: 'tap' } },

    // ---- 想看/看过、券、设置 ----
    { id: 'filmlog.item-open', from: '/me/filmlog', to: '/detail/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '条目行', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'filmlog.show-open', from: '/me/filmlog', to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '想看的演出行→演出详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },
    { id: 'filmlog.show.book-open', from: '/me/filmlog', to: '/show/:id/tickets', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '想看的演出行【预订】→选择票档', ui: { placement: 'content', icon: 'ticket', gesture: 'tap' }, dataSource: ds('shows', 'id', 'title') },
    { id: 'filmlog.rate-open', from: '/me/filmlog', to: '/write-review/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '条目【评分】按钮', ui: { placement: 'content', icon: 'star', gesture: 'tap' }, dataSource: ds('movies', 'id', 'title') },
    { id: 'profiles.add.open', from: '/me/profiles', to: '/me/profiles', search: { add: 'open' }, searchParams: {}, mode: 'push', params: {},
      label: '【+添加/修改实名信息】', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    { id: 'coupons.expired-open', from: '/me/coupons', to: '/me/coupons/expired', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '【查看失效券】', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.logout-open', from: '/me/settings', to: '/login', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '【退出登录】', ui: { placement: 'content', icon: 'logout', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
