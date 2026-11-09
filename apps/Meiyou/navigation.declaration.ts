/**
 * 美柚 声明式导航 —— 由 docs/meiyou-replication/spec.json v1.0(2026-07-13 冻结)编译。
 * 弹层走 searchParams(URL 驱动 UI);nav → transitions;state → uiStates[].actions;
 * 返回/关闭一律 system.back(bindBack),不建自定义 transition(pipeline v3 §11)。
 * qa:Q1=B 底部四格(美柚/记录/消息/我);qa:Q2=A 备孕模式浅层纳入。
 */
import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string, direction: 'vertical' | 'horizontal' = 'vertical') =>
  ({ name, direction, description }) as const;

export const NAVIGATION_DECLARATION = {
  app: 'meiyou',
  routes: [
    // ---------------- 首页(美柚tab) ----------------
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [sc('home-feed', '首页社区信息流')],
      uiStates: [
        {
          id: 'meiyou.home.base', search: {}, description: '首页:经期状态卡+月经走喽快捷条+社区feed(模式随全局 mode 变化)',
          actions: [
            { id: 'home.periodend.open', label: '月经走喽点「是」→弹选择结束日期层', behavior: 'open' },
            { id: 'home.post.like', label: '帖子卡点赞', behavior: 'toggle', paramsSchema: { target: 'string' } },
            { id: 'home.ad.dismiss', label: '关闭广告卡', behavior: 'other', paramsSchema: { target: 'string' } },
            { id: 'home.preptools.expand', label: '备孕工具行更多/收起', behavior: 'toggle' },
            { id: 'home.preptools.disabled', label: '备孕工具图标(暂未开放)', behavior: 'other' },
            { id: 'home.prepdate.select.target', label: '备孕态日期条切换', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
        { id: 'meiyou.home.periodEnd', search: { sheet: 'periodEnd' }, description: '「选择经期结束日期」滚轮弹层(取消=back;确定=periodend.confirm)',
          actions: [
            { id: 'home.periodend.select.target', label: '滚动选结束日期', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.periodend.confirm', label: '确定:标记经期结束,日历/大卡联动', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '首页:顶栏(搜索/发帖)+经期状态大卡+月经走喽+社区feed+悬浮发帖',
    },
    // ---------------- 今日密报 ----------------
    {
      path: '/daily-report',
      component: 'DailyReportPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('daily-report-body', '今日密报长页')],
      uiStates: [
        {
          id: 'meiyou.dailyreport.base', search: {}, description: '今日密报:周期环形图+症状预测+血量+怀孕几率+生活指南',
          actions: [
            { id: 'dailyreport.date.select.target', label: '昨天/今天/明天切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'dailyreport.pregprob.hide.toggle', label: '怀孕几率隐藏开关', behavior: 'toggle' },
            { id: 'dailyreport.misc.disabled', label: '想知道/视频/咨询等(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { d: 'string', focus: 'string' },
      description: '今日密报页(qa:Q3/Q5)',
    },
    // ---------------- 搜索 ----------------
    {
      path: '/search',
      component: 'SearchPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-body', '搜索落地/结果列表')],
      uiStates: [
        {
          id: 'meiyou.search.base', search: {}, description: '搜索(落地:猜你想搜+热点;?q= 时显示结果:AI卡+帖子)',
          actions: [
            { id: 'search.query.input', label: '输入关键词', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'search.query.submit', label: '执行搜索', behavior: 'submit' },
            { id: 'search.hotword.select.target', label: '点热词/猜你想搜', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'search.guess.refresh', label: '换一换', behavior: 'other' },
            { id: 'search.ai.expand.toggle', label: 'AI卡查看更多', behavior: 'toggle' },
            { id: 'search.tab.disabled', label: '知识/帖子/用户tab(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { q: 'string' },
      description: '搜索页(补拍G1)',
    },
    // ---------------- 记录(tab) ----------------
    {
      path: '/record',
      component: 'RecordPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('record-body', '记录页(日历+记录项)')],
      uiStates: [
        {
          id: 'meiyou.record.base', search: {}, description: '记录页月历+当日记录项(date=选中日;经期/备孕模式随全局)',
          actions: [
            { id: 'record.day.select.target', label: '点选日期', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'record.sheet.open', label: '记录行打开对应弹层', behavior: 'open', paramsSchema: { target: 'string' } },
            { id: 'record.month.select.target', label: '左右滑翻月', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'record.calendar.backtoday', label: '回今天', behavior: 'other' },
            { id: 'record.calendar.collapse.toggle', label: '月历折叠为周条', behavior: 'toggle' },
            { id: 'record.period.toggle', label: '月经来了/走喽 是|否', behavior: 'toggle' },
            { id: 'record.mood.select.target', label: '心情表情直接点选', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'record.mode.prep.switch', label: '顶部模式tab备孕(已开启直接切)', behavior: 'other' },
            { id: 'record.mode.disabled', label: '怀孕/育儿模式tab(暂未开放)', behavior: 'other' },
            { id: 'record.misc.disabled', label: '日记/好习惯/计划(暂未开放)', behavior: 'other' },
            { id: 'record.time.set', label: '记下具体时间', behavior: 'open' },
          ],
        },
        { id: 'meiyou.record.sheet', search: { sheet: '*' }, description: '记录项底部弹层(flow/color/pain/poop/weight/love/symptom/leukorrhea/temperature)',
          actions: [
            { id: 'record.sheet.option.select.target', label: '选档位/多选症状', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'record.sheet.number.input', label: '体重/体温数字键盘', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'record.sheet.confirm', label: '确定:写入记录+分析已更新', behavior: 'submit' },
            { id: 'record.sheet.weight.unit.toggle', label: '公斤/斤切换', behavior: 'toggle' },
            { id: 'record.sheet.time.select.target', label: '时间滚轮', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'record.sheet.scale.disabled', label: '连接体重秤(暂未开放)', behavior: 'other' },
            { id: 'record.sheet.symptomadd.disabled', label: '添加症状(暂未开放)', behavior: 'other' },
            { id: 'record.sheet.poopextra.toggle', label: '便便折叠项展开', behavior: 'toggle' },
          ],
        },
        { id: 'meiyou.record.periodEnd', search: { sheet: 'periodEnd' }, description: '选择经期结束日期弹层(同首页)',
          actions: [
            { id: 'record.periodend.select.target', label: '滚动选结束日期', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'record.periodend.confirm', label: '确定:标记结束并铺色', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { date: 'string' },
      description: '记录页(月历+记录项一体,spec record.calendar/entrySheet/periodEndSheet)',
    },
    {
      path: '/record/year',
      component: 'YearViewPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('year-body', '年历纵向滚动')],
      uiStates: [{ id: 'meiyou.yearview.base', search: {}, description: '年历总览(逐年12宫格,经期标注)' }],
      queryParams: {},
      description: '年历总览页',
    },
    {
      path: '/record/period-form',
      component: 'PeriodFormPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'meiyou.periodform.base', search: {}, description: '历史经期补录全屏表单(date=补录日;流量/颜色/痛经/时间)',
          actions: [
            { id: 'periodform.option.select.target', label: '选流量/颜色/痛经档', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'periodform.time.select.target', label: '时间滚轮', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'periodform.record.confirm', label: '确定:标记经期开始并自动铺色', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { date: 'string' },
      description: '历史经期补录表单',
    },
    // ---------------- 分析 ----------------
    {
      path: '/analysis',
      component: 'AnalysisPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('analysis-body', '分析长页')],
      uiStates: [
        {
          id: 'meiyou.analysis.base', search: {}, description: '经期健康报告:健康度+周期/经期/流量/颜色/痛经/心情/体重/便便/预测模块',
          actions: [
            { id: 'analysis.deep.disabled', label: '深度分析/引导条/BMI填写(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '分析页',
    },
    // ---------------- 圈子 / 帖子 ----------------
    {
      path: '/circle/:id',
      component: 'CirclePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('circle-feed', '圈子帖子流')],
      uiStates: [
        {
          id: 'meiyou.circle.base', search: {}, description: '圈子页(tab=hot|new|reply;发布成功横幅)',
          actions: [
            { id: 'circle.tab.select.target', label: '热门/最新发帖/最新回复', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'circle.join.toggle', label: '加入/已加入(联动我页宫格)', behavior: 'toggle' },
            { id: 'circle.post.like', label: '帖子点赞', behavior: 'toggle', paramsSchema: { target: 'string' } },
            { id: 'circle.ad.disabled', label: '广告卡(暂未开放)', behavior: 'other' },
            { id: 'circle.topic.disabled', label: '话题标签(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '圈子页(如爱情碎碎念)',
    },
    {
      path: '/post/:id',
      component: 'PostDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('post-body', '帖子详情+评论区')],
      uiStates: [
        {
          id: 'meiyou.post.base', search: {}, description: '帖子详情',
          actions: [
            { id: 'post.follow.toggle', label: '关注/已关注', behavior: 'toggle' },
            { id: 'post.like.toggle', label: '点赞', behavior: 'toggle' },
            { id: 'post.fav.toggle', label: '收藏', behavior: 'toggle' },
            { id: 'post.replies.expand', label: '展开N条回复', behavior: 'other', paramsSchema: { target: 'string' } },
            { id: 'post.comment.like', label: '评论点赞', behavior: 'toggle', paramsSchema: { target: 'string' } },
            { id: 'post.more.disabled', label: '「···」(暂未开放)', behavior: 'other' },
            { id: 'post.ad.disabled', label: '评论区广告(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'meiyou.post.commentInput', search: { panel: 'comment' }, description: '评论输入面板(键盘)',
          actions: [
            { id: 'post.comment.input', label: '输入评论', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'post.comment.send', label: '发送评论(置顶+计数+1)', behavior: 'submit' },
          ],
        },
        { id: 'meiyou.post.imageViewer', search: { panel: 'viewer' }, description: '配图全屏大图(×关闭=back)' },
      ],
      queryParams: {},
      description: '帖子详情页',
    },
    {
      path: '/publish',
      component: 'PublishPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'meiyou.publish.base', search: {}, description: '发帖页(正文+话题chips+工具栏)',
          actions: [
            { id: 'publish.text.input', label: '输入正文(发布激活/chips联动)', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'publish.topic.insert', label: '插入话题chip', behavior: 'other', paramsSchema: { target: 'string' } },
            { id: 'publish.post.submit', label: '发布(回圈子页+进度横幅+新帖入feed)', behavior: 'submit' },
            { id: 'publish.image.add', label: '添加图片(mock相册)', behavior: 'open' },
            { id: 'publish.topic.panel.open', label: '#话题面板', behavior: 'open' },
            { id: 'publish.tools.disabled', label: '表情/投票/AI/草稿(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { circle: 'string' },
      description: '发帖页',
    },
    {
      path: '/profile',
      component: 'ProfilePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('profile-body', '个人主页帖子列表')],
      uiStates: [
        {
          id: 'meiyou.profile.base', search: {}, description: '个人主页(tab=works|liked;qa:Q10=B 赞过可用)',
          actions: [
            { id: 'profile.tab.select.target', label: '作品/赞过', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'profile.tab.disabled', label: '回复/回答/视频/提问(暂未开放)', behavior: 'other' },
            { id: 'profile.filter.select.target', label: '全部/图文筛选', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'profile.misc.disabled', label: '任务中心/活动广场/微章等(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '个人主页(自己)',
    },
    // ---------------- 消息 ----------------
    {
      path: '/message',
      component: 'MessagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('message-list', '会话列表')],
      uiStates: [
        {
          id: 'meiyou.message.base', search: {}, description: '消息列表(美柚姐姐/小柚子/互动消息/创作者中心)',
          actions: [
            { id: 'message.banner.dismiss', label: '关闭开通知横幅', behavior: 'other' },
            { id: 'message.banner.disabled', label: '去开启(暂未开放)', behavior: 'other' },
            { id: 'message.creator.disabled', label: '创作者中心(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '消息tab',
    },
    {
      path: '/message/interact',
      component: 'InteractPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('interact-list', '互动通知列表')],
      uiStates: [
        {
          id: 'meiyou.interact.base', search: {}, description: '互动消息(tab=like|reply|fans;qa:Q13=A 预置通知)',
          actions: [
            { id: 'interact.tab.select.target', label: '赞/回复/新增粉丝', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'interact.notice.open', label: '打开互动通知', behavior: 'other', paramsSchema: { target: 'string' } },
            { id: 'interact.gift.disabled', label: '领惊喜(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '互动消息页',
    },
    {
      path: '/message/system',
      component: 'SystemChatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('syschat-list', '系统通知卡片流')],
      uiStates: [
        {
          id: 'meiyou.syschat.base', search: {}, description: '小柚子系统通知会话',
          actions: [{ id: 'syschat.settings.disabled', label: '齿轮(暂未开放)', behavior: 'other' }],
        },
      ],
      queryParams: {},
      description: '系统通知会话页',
    },
    {
      path: '/message/ai',
      component: 'AiChatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('aichat-body', 'AI对话流')],
      uiStates: [
        {
          id: 'meiyou.aichat.base', search: {}, description: '美柚姐姐AI聊天(qa:Q9=A 内置回答打字机)',
          actions: [
            { id: 'aichat.drawer.open', label: '打开会话抽屉', behavior: 'open' },
            { id: 'aichat.suggest.select.target', label: '点推荐问题', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'aichat.text.input', label: '自由输入提问', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'aichat.send.submit', label: '发送提问', behavior: 'submit' },
            { id: 'aichat.gen.stop', label: '停止生成', behavior: 'other' },
            { id: 'aichat.session.new', label: '发起新对话', behavior: 'other' },
            { id: 'aichat.session.select.target', label: '切换历史会话', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'aichat.misc.disabled', label: '健康档案/语音/折叠条(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'meiyou.aichat.drawer', search: { drawer: 'open' }, description: '右侧会话抽屉' },
      ],
      queryParams: {},
      description: '美柚姐姐AI聊天页',
    },
    // ---------------- 我 ----------------
    {
      path: '/me',
      component: 'MePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('me-body', '我页纵向滚动')],
      uiStates: [
        {
          id: 'meiyou.me.base', search: {}, description: '我页(模式四宫格/经期设置/圈子宫格/服务宫格;备孕态变体)',
          actions: [
            { id: 'me.mode.period.switch', label: '切回经期模式', behavior: 'other' },
            { id: 'me.mode.disabled', label: '怀孕/育儿模式卡(暂未开放)', behavior: 'other' },
            { id: 'me.misc.disabled', label: '钱包/订单/服务宫格/会员等(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '我页(个人中心)',
    },
    {
      path: '/mode/prep-intro',
      component: 'PrepIntroPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [{ id: 'meiyou.prepintro.base', search: {}, description: '备孕模式介绍全屏页(×=back)' }],
      queryParams: {},
      description: '备孕模式介绍页',
    },
    {
      path: '/mode/prep-setup',
      component: 'PrepSetupPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'meiyou.prepsetup.base', search: {}, description: '备孕模式设置(经期/周期长度+智能预测+确定)',
          actions: [
            { id: 'prepsetup.param.select.target', label: '经期/周期长度滚轮', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'prepsetup.smartpredict.toggle', label: '智能预测开关', behavior: 'toggle' },
            { id: 'prepsetup.mode.confirm', label: '确定:切换备孕模式+引导气泡', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '备孕模式设置页',
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
          id: 'meiyou.settings.base', search: {}, description: '设置页(登录态/登出态)',
          actions: [
            { id: 'settings.logout.open', label: '退出登录→确认弹层', behavior: 'open' },
            { id: 'settings.misc.disabled', label: '其余条目(暂未开放,qa:Q11=A)', behavior: 'other' },
          ],
        },
        { id: 'meiyou.settings.logoutConfirm', search: { confirm: 'logout' }, description: '退出登录确认底部弹层',
          actions: [
            { id: 'settings.logout.confirm', label: '确认退出(同步数据→已退出→登出态)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '设置页',
    },
    {
      path: '/settings/cycle',
      component: 'CycleSettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'meiyou.cycle.base', search: {}, description: '经期设置(经期长度/周期长度/智能预测/显示怀孕几率)',
          actions: [
            { id: 'cycle.periodlen.open', label: '经期长度→天数滚轮', behavior: 'open' },
            { id: 'cycle.cyclelen.open', label: '周期长度→天数滚轮', behavior: 'open' },
            { id: 'cycle.smartpredict.toggle', label: '智能预测开关', behavior: 'toggle' },
            { id: 'cycle.pregprob.toggle', label: '显示怀孕几率开关(联动首页花朵)', behavior: 'toggle' },
          ],
        },
        { id: 'meiyou.cycle.sheet', search: { sheet: '*' }, description: '选择经期/周期天数滚轮弹层(sheet=periodlen|cyclelen)',
          actions: [
            { id: 'cycle.len.select.target', label: '天数滚轮', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'cycle.len.confirm', label: '确定:值更新+全局预测联动', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '经期设置页',
    },
    {
      path: '/settings/notification',
      component: 'NotifSettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'meiyou.notif.base', search: {}, description: '消息通知设置(补拍G3:允许通知+夜间免打扰/声音/震动)',
          actions: [
            { id: 'notif.master.toggle', label: '允许通知总开关', behavior: 'toggle' },
            { id: 'notif.item.toggle', label: '夜间免打扰/声音/震动开关', behavior: 'toggle', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '消息通知设置页',
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
          id: 'meiyou.login.base', search: {}, description: '一键登录页(微信快捷;mock跳过真实授权)',
          actions: [
            { id: 'login.agree.toggle', label: '协议勾选圈', behavior: 'toggle' },
            { id: 'login.other.disabled', label: '登录其他账号/遇到问题(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '一键登录页',
    },
    {
      path: '/restore',
      component: 'RestorePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [{ id: 'meiyou.restore.base', search: {}, description: '登录成功/数据恢复过场(0-100%→开始使用)' }],
      queryParams: {},
      description: '数据恢复过场页',
    },
  ],
  transitions: [
    // Tab 切换(replace)
    { id: 'meiyou.tab.home', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: 'Tab美柚', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'meiyou.tab.record', from: '*', to: '/record', search: {}, searchParams: {}, mode: 'replace', params: {}, label: 'Tab记录', ui: { placement: 'tabbar', icon: 'calendar', gesture: 'tap' } },
    { id: 'meiyou.tab.message', from: '*', to: '/message', search: {}, searchParams: {}, mode: 'replace', params: {}, label: 'Tab消息', ui: { placement: 'tabbar', icon: 'message', gesture: 'tap' } },
    { id: 'meiyou.tab.me', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {}, label: 'Tab我', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },
    // 首页
    { id: 'meiyou.search-open', from: ['/', '/circle/:id'], to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '搜索', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'meiyou.publish-open', from: ['/', '/circle/:id', '/profile'], to: '/publish', search: {}, searchParams: {}, mode: 'push', params: {}, label: '发帖', ui: { placement: 'topbar', icon: 'pen', gesture: 'tap' } },
    { id: 'meiyou.dailyreport-open', from: '/', to: '/daily-report', search: {}, searchParams: { focus: 'string' }, mode: 'push', params: { focus: 'string' }, label: '查看详情/怀孕几率→今日密报', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'meiyou.postdetail-open', from: ['/', '/circle/:id', '/search', '/profile', '/message/interact'], to: '/post/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开帖子详情', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    // 记录
    { id: 'meiyou.yearview-open', from: '/record', to: '/record/year', search: {}, searchParams: {}, mode: 'push', params: {}, label: '月份→年历', ui: { placement: 'topbar', icon: 'calendar', gesture: 'tap' } },
    { id: 'meiyou.monthview-open', from: '/record/year', to: '/record', search: {}, searchParams: { date: 'string' }, mode: 'replace', params: { date: 'string' }, label: '年历→某月', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    { id: 'meiyou.periodform-open', from: '/record', to: '/record/period-form', search: {}, searchParams: { date: 'string' }, mode: 'push', params: { date: 'string' }, label: '过去日期点月经来了→补录表单', ui: { placement: 'content', icon: 'form', gesture: 'tap' } },
    { id: 'meiyou.analysis-open', from: ['/daily-report', '/record'], to: '/analysis', search: {}, searchParams: {}, mode: 'push', params: {}, label: '分析/去查看', ui: { placement: 'topbar', icon: 'chart', gesture: 'tap' } },
    // 圈子/社区
    { id: 'meiyou.circle-open', from: '/me', to: '/circle/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '进入圈子', ui: { placement: 'content', icon: 'users', gesture: 'tap' } },
    { id: 'meiyou.profile-open', from: ['/me', '/circle/:id'], to: '/profile', search: {}, searchParams: {}, mode: 'push', params: {}, label: '个人主页/发布成功去看看', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    // 消息
    { id: 'meiyou.interact-open', from: '/message', to: '/message/interact', search: {}, searchParams: {}, mode: 'push', params: {}, label: '互动消息', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'meiyou.syschat-open', from: '/message', to: '/message/system', search: {}, searchParams: {}, mode: 'push', params: {}, label: '小柚子通知', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'meiyou.aichat-open', from: '/message', to: '/message/ai', search: {}, searchParams: {}, mode: 'push', params: {}, label: '美柚姐姐', ui: { placement: 'content', icon: 'sparkles', gesture: 'tap' } },
    // 我/设置/模式
    { id: 'meiyou.settings-open', from: '/me', to: '/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置', ui: { placement: 'topbar', icon: 'settings', gesture: 'tap' } },
    { id: 'meiyou.cyclesettings-open', from: ['/me', '/mode/prep-setup'], to: '/settings/cycle', search: {}, searchParams: {}, mode: 'push', params: {}, label: '经期设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'meiyou.notifsettings-open', from: '/settings', to: '/settings/notification', search: {}, searchParams: {}, mode: 'push', params: {}, label: '消息通知', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'meiyou.prepintro-open', from: ['/me', '/record'], to: '/mode/prep-intro', search: {}, searchParams: {}, mode: 'push', params: {}, label: '备孕模式卡→介绍页', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'meiyou.prepsetup-open', from: '/mode/prep-intro', to: '/mode/prep-setup', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开启备孕模式→设置页', ui: { placement: 'content', icon: 'form', gesture: 'tap' } },
    { id: 'meiyou.prep-done', from: '/mode/prep-setup', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '确定开启备孕→回首页(备孕变体)', ui: { placement: 'content', icon: 'button', gesture: 'tap' } },
    { id: 'meiyou.login-open', from: '/settings', to: '/login', search: {}, searchParams: {}, mode: 'push', params: {}, label: '登录', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'meiyou.restore-open', from: '/login', to: '/restore', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '登录该账号→数据恢复', ui: { placement: 'content', icon: 'cloud', gesture: 'tap' } },
    { id: 'meiyou.restore-done', from: '/restore', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '开始使用→回我页', ui: { placement: 'content', icon: 'button', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
