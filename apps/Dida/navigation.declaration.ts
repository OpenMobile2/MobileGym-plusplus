// 声明式导航 —— 手写,与 docs/dida-replication/spec.json (frozen v0.2.0) 对应。
// 覆盖率/一致性 gate 依赖此文件包含代码里所有 data-trigger/data-action id。
// 增量1:5 Tab + 任务(完整) + 日历/四象限/专注/我的(主交互) + 登录/会员。
import type { NavigationDeclaration } from './navigation.types';

const scroll = [{ name: 'main', direction: 'vertical', description: '主滚动区' }] as const;

export const NAVIGATION_DECLARATION = {
  app: 'dida',
  routes: [
    {
      path: '/',
      component: 'TasksPage',
      params: {},
      entryPoint: 'home',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.tasks.base',
          search: {},
          description: '任务主列表',
          actions: [
            { id: 'tasks.item.complete', label: '任务复选框(完成)', behavior: 'other', scope: 'item', paramsSchema: { taskId: 'string' } },
            { id: 'tasks.completed.toggle', label: 'Completed 折叠头', behavior: 'toggle' },
          ],
        },
        {
          id: 'dida.tasks.drawer',
          search: { drawer: 'open' },
          description: '左侧抽屉',
          actions: [
            { id: 'sidebar.list.select.item', label: '切换清单', behavior: 'select', scope: 'item', paramsSchema: { listId: 'string' } },
            { id: 'sidebar.add.toast', label: '新建清单 (暂未开放)', behavior: 'other' },
            { id: 'sidebar.bell.toast', label: '通知铃铛 (暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'dida.tasks.add',
          search: { sheet: 'add' },
          description: '快速添加任务',
          actions: [
            { id: 'quickadd.title.input', label: '标题输入框', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'quickadd.tag.insert', label: '标签图标(插入#)', behavior: 'other' },
            { id: 'quickadd.submit.commit', label: '保存任务', behavior: 'submit' },
          ],
        },
        {
          id: 'dida.tasks.add.prio',
          search: { sheet: 'add', prio: 'open' },
          description: '快速添加·优先级选择菜单',
          actions: [
            { id: 'quickadd.priority.select.high', label: 'High Priority', behavior: 'select' },
            { id: 'quickadd.priority.select.medium', label: 'Medium Priority', behavior: 'select' },
            { id: 'quickadd.priority.select.low', label: 'Low Priority', behavior: 'select' },
            { id: 'quickadd.priority.select.none', label: 'No Priority', behavior: 'select' },
          ],
        },
        {
          id: 'dida.tasks.listmenu',
          search: { listmenu: 'open' },
          description: '清单选项菜单',
          actions: [
            { id: 'listmenu.completed.toggle', label: 'Hide Completed 开关', behavior: 'toggle' },
            { id: 'listmenu.groupsort.toast', label: 'Group & Sort (暂未开放)', behavior: 'other' },
            { id: 'listmenu.multiselect.toast', label: 'Select 多选 (暂未开放)', behavior: 'other' },
            { id: 'listmenu.view.toast', label: 'View/Background/More (暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '任务主列表',
    },
    {
      path: '/task/:id',
      component: 'TaskDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.task.detail.base',
          search: {},
          description: '任务详情',
          actions: [
            { id: 'detail.main.complete', label: '主复选框(完成)', behavior: 'other' },
            { id: 'detail.sub.complete', label: '子任务复选框', behavior: 'other', scope: 'item', paramsSchema: { subId: 'string' } },
            { id: 'detail.sub.add', label: '添加子任务', behavior: 'other' },
            { id: 'detail.tag.toast', label: '标签 (暂未开放)', behavior: 'other' },
            { id: 'detail.checklist.toast', label: '清单/列表 (暂未开放)', behavior: 'other' },
            { id: 'detail.attach.pick', label: '附件·系统选图', behavior: 'other' },
          ],
        },
        {
          id: 'dida.task.detail.menu',
          search: { menu: 'open' },
          description: '任务详情·更多菜单(分享/复制)',
          actions: [
            { id: 'detail.menu.share', label: '分享任务(系统分享)', behavior: 'other' },
            { id: 'detail.menu.copy', label: '复制任务到剪贴板', behavior: 'other' },
          ],
        },
        {
          id: 'dida.task.detail.datesheet',
          search: { edit: 'date' },
          description: '任务详情·日期选择',
          actions: [
            { id: 'detail.date.select.item', label: '选日期', behavior: 'select', scope: 'item', paramsSchema: { day: 'string' } },
            { id: 'detail.date.clear.action', label: '清除日期', behavior: 'other' },
          ],
        },
        {
          id: 'dida.task.detail.reminder',
          search: { edit: 'reminder' },
          description: '任务详情·提醒选择',
          actions: [
            { id: 'detail.reminder.select.none', label: '无', behavior: 'select' },
            { id: 'detail.reminder.select.ontime', label: '准时', behavior: 'select' },
            { id: 'detail.reminder.select.min5', label: '提前5分钟', behavior: 'select' },
            { id: 'detail.reminder.select.min30', label: '提前30分钟', behavior: 'select' },
            { id: 'detail.reminder.select.hour1', label: '提前1小时', behavior: 'select' },
            { id: 'detail.reminder.select.day1', label: '提前1天', behavior: 'select' },
          ],
        },
        {
          id: 'dida.task.detail.repeat',
          search: { edit: 'repeat' },
          description: '任务详情·重复选择',
          actions: [
            { id: 'detail.repeat.select.none', label: '不重复', behavior: 'select' },
            { id: 'detail.repeat.select.daily', label: '每天', behavior: 'select' },
            { id: 'detail.repeat.select.weekly', label: '每周', behavior: 'select' },
            { id: 'detail.repeat.select.monthly', label: '每月', behavior: 'select' },
            { id: 'detail.repeat.select.yearly', label: '每年', behavior: 'select' },
          ],
        },
        {
          id: 'dida.task.detail.priority',
          search: { edit: 'priority' },
          description: '任务详情·优先级选择',
          actions: [
            { id: 'detail.priority.select.high', label: 'High', behavior: 'select' },
            { id: 'detail.priority.select.medium', label: 'Medium', behavior: 'select' },
            { id: 'detail.priority.select.low', label: 'Low', behavior: 'select' },
            { id: 'detail.priority.select.none', label: 'None', behavior: 'select' },
          ],
        },
      ],
      queryParams: {},
      description: '任务详情',
    },
    {
      path: '/calendar',
      component: 'CalendarPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.calendar.base',
          search: {},
          description: '日历(月历+当日日程)',
          actions: [
            { id: 'calendar.day.select.item', label: '选中某天', behavior: 'select', scope: 'item', paramsSchema: { day: 'string' } },
            { id: 'calendar.item.complete', label: '日程任务复选框(完成/取消)', behavior: 'other', scope: 'item', paramsSchema: { taskId: 'string' } },
          ],
        },
        {
          id: 'dida.calendar.view',
          search: { view: 'open' },
          description: '日历视图切换菜单(日/周/月,真机无年视图)',
          actions: [],
        },
        {
          id: 'dida.calendar.add',
          search: { sheet: 'add' },
          description: '日历·快速添加任务',
          actions: [
            { id: 'calendar.add.title.input', label: '标题输入框', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'calendar.add.submit.commit', label: '保存任务(带选中日期)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { calview: 'string' },
      description: '日历',
    },
    {
      path: '/matrix',
      component: 'MatrixPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.matrix.base',
          search: {},
          description: '四象限',
          actions: [
            { id: 'matrix.item.complete', label: '象限内任务完成', behavior: 'other', scope: 'item', paramsSchema: { taskId: 'string' } },
            { id: 'matrix.more.view', label: 'View More', behavior: 'other' },
          ],
        },
        {
          id: 'dida.matrix.menu',
          search: { menu: 'open' },
          description: '四象限·更多菜单',
          actions: [
            { id: 'matrix.menu.completed.toggle', label: '隐藏/显示已完成', behavior: 'toggle' },
          ],
        },
        {
          id: 'dida.matrix.layout',
          search: { sheet: 'layout' },
          description: '四象限·编辑布局',
          actions: [
            { id: 'matrix.layout.swap', label: '拖动交换象限位置', behavior: 'other', paramsSchema: { from: 'string', to: 'string' } },
          ],
        },
        {
          id: 'dida.matrix.guide',
          search: { guide: 'open' },
          description: '四象限·用户指引',
          actions: [],
        },
        {
          id: 'dida.matrix.add',
          search: { sheet: 'add' },
          description: '四象限·快速添加任务(选象限)',
          actions: [
            { id: 'matrix.add.title.input', label: '标题输入框', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'matrix.add.quadrant.select.q1', label: '归入 Ⅰ 紧急重要', behavior: 'select' },
            { id: 'matrix.add.quadrant.select.q2', label: '归入 Ⅱ 重要不紧急', behavior: 'select' },
            { id: 'matrix.add.quadrant.select.q3', label: '归入 Ⅲ 紧急不重要', behavior: 'select' },
            { id: 'matrix.add.quadrant.select.q4', label: '归入 Ⅳ 不紧急不重要', behavior: 'select' },
            { id: 'matrix.add.submit.commit', label: '保存任务', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '四象限',
    },
    {
      path: '/focus',
      component: 'FocusPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.focus.base',
          search: {},
          description: '专注主页',
          actions: [
            { id: 'focus.mode.select.item', label: '番茄钟/正计时 切换', behavior: 'select' },
            { id: 'focus.mini.pause.toggle', label: '专注中小条·暂停/继续', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '专注主页',
    },
    {
      path: '/focus/run',
      component: 'FocusRunningPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.focus.run.base',
          search: {},
          description: '专注运行中',
          actions: [
            { id: 'focusrun.pause.toggle', label: '暂停/继续', behavior: 'toggle' },
            { id: 'focusrun.stop.action', label: '停止(直接结束)', behavior: 'other' },
            { id: 'focusrun.music.toast', label: '白噪音 (仅UI)', behavior: 'other' },
            { id: 'focusrun.brightness.toast', label: '亮度 (暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { mode: 'string' },
      description: '专注运行中',
    },
    {
      path: '/focus/stats',
      component: 'FocusStatsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.focus.stats.base',
          search: {},
          description: '专注统计',
          actions: [
            { id: 'stats.period.select.item', label: '统计周期切换', behavior: 'select' },
          ],
        },
      ],
      queryParams: {},
      description: '专注统计',
    },
    {
      path: '/me',
      component: 'MePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.base',
          search: {},
          description: '我的/设置',
          actions: [
            { id: 'me.entry.toast', label: '设置入口 (暂未开放)', behavior: 'other' },
            { id: 'me.notif.toast', label: '声音与通知 (暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'dida.me.signout.confirm',
          search: { confirm: 'signout' },
          description: '退出登录确认',
          actions: [],
        },
      ],
      queryParams: {},
      description: '我的/设置',
    },
    {
      path: '/me/profile',
      component: 'ProfilePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.profile.base',
          search: {},
          description: '个人资料',
          actions: [
            { id: 'profile.nickname.input', label: '昵称输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'profile.signature.input', label: '签名输入', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'profile.avatar.pick', label: '头像·系统选图', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '个人资料',
    },
    {
      path: '/me/premium',
      component: 'PremiumPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.premium.base',
          search: {},
          description: '超级会员',
          actions: [
            { id: 'premium.buy.pay', label: '开通/试用·系统支付', behavior: 'other' },
            { id: 'premium.terms.toggle', label: '同意条款', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '超级会员',
    },
    {
      path: '/me/appearance',
      component: 'AppearancePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.appearance.base',
          search: {},
          description: '外观设置',
          actions: [
            { id: 'appearance.theme.select', label: '选择外观模式', behavior: 'other', paramsSchema: { theme: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '外观设置',
    },
    {
      path: '/me/datetime',
      component: 'DateTimePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.datetime.base',
          search: {},
          description: '日期与时间',
          actions: [
            { id: 'datetime.weekStart.select', label: '一周起始日', behavior: 'other', paramsSchema: { startOfWeek: 'string' } },
            { id: 'datetime.timeFormat.select', label: '时间格式', behavior: 'other', paramsSchema: { timeFormat: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '日期与时间',
    },
    {
      path: '/me/general',
      component: 'GeneralPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.general.base',
          search: {},
          description: '通用设置',
          actions: [
            { id: 'general.showCompleted.toggle', label: '显示已完成', behavior: 'toggle' },
            { id: 'general.pomo.select', label: '番茄时长', behavior: 'other', paramsSchema: { minutes: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '通用设置',
    },
    {
      path: '/me/about',
      component: 'AboutPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.about.base',
          search: {},
          description: '关于',
          actions: [],
        },
      ],
      queryParams: {},
      description: '关于',
    },
    {
      path: '/me/help',
      component: 'HelpPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.me.help.base',
          search: {},
          description: '帮助与反馈',
          actions: [
            { id: 'help.faq.toggle', label: '展开/收起 FAQ', behavior: 'toggle', paramsSchema: { faq: 'string' } },
            { id: 'help.feedback.input', label: '反馈内容', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'help.feedback.submit', label: '提交反馈', behavior: 'submit' },
            { id: 'help.contact.copy', label: '联系邮箱', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '帮助与反馈',
    },

    {
      path: '/login',
      component: 'LoginPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: scroll,
      uiStates: [
        {
          id: 'dida.login.base',
          search: {},
          description: '登录页',
          actions: [],
        },
      ],
      queryParams: {},
      description: '登录页',
    },
  ],
  transitions: [
    { id: 'tabbar.tasks', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '任务 Tab', ui: { placement: 'tabbar', icon: 'IcTasks', gesture: 'tap' } },
    { id: 'tabbar.calendar', from: '*', to: '/calendar', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '日历 Tab', ui: { placement: 'tabbar', icon: 'IcCalendar', gesture: 'tap' } },
    { id: 'tabbar.matrix', from: '*', to: '/matrix', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '四象限 Tab', ui: { placement: 'tabbar', icon: 'IcMatrix', gesture: 'tap' } },
    { id: 'tabbar.focus', from: '*', to: '/focus', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '专注 Tab', ui: { placement: 'tabbar', icon: 'IcFocus', gesture: 'tap' } },
    { id: 'tabbar.me', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '我的 Tab', ui: { placement: 'tabbar', icon: 'IcMe', gesture: 'tap' } },

    { id: 'task.openSidebar', from: '/', to: '/', search: { drawer: 'open' }, searchParams: {}, mode: 'push', params: {}, label: '左上菜单(打开抽屉)', ui: { placement: 'topbar', icon: 'IcMenu', gesture: 'tap' } },
    { id: 'task.quickadd', from: '/', to: '/', search: { sheet: 'add' }, searchParams: {}, mode: 'push', params: {}, label: '右下 FAB(快速添加)', ui: { placement: 'fab', icon: 'IcPlus', gesture: 'tap' } },
    { id: 'quickadd.priority.open', from: { path: '/', search: { sheet: 'add' } }, to: '/', search: { prio: 'open' }, searchParams: {}, preserveParams: ['sheet'], mode: 'push', params: {}, label: '快速添加·优先级旗标(打开菜单)', ui: { placement: 'content', icon: 'IcFlag', gesture: 'tap' } },
    { id: 'task.open', from: '/', to: '/task/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开任务详情', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'detail.edit.date', from: '/task/:id', to: '/task/:id', search: { edit: 'date' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '详情·日期行', ui: { placement: 'content', icon: 'IcClock', gesture: 'tap' } },
    { id: 'detail.edit.reminder', from: '/task/:id', to: '/task/:id', search: { edit: 'reminder' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '详情·提醒行', ui: { placement: 'content', icon: 'IcAlarm', gesture: 'tap' } },
    { id: 'detail.edit.repeat', from: '/task/:id', to: '/task/:id', search: { edit: 'repeat' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '详情·重复行', ui: { placement: 'content', icon: 'IcRepeat', gesture: 'tap' } },
    { id: 'detail.edit.priority', from: '/task/:id', to: '/task/:id', search: { edit: 'priority' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '详情·优先级行', ui: { placement: 'content', icon: 'IcFlag', gesture: 'tap' } },
    { id: 'detail.more.open', from: [{ path: '/task/:id', search: { menu: null } }], to: '/task/:id', search: { menu: 'open' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '详情·更多菜单', ui: { placement: 'topbar', icon: 'IcMore', gesture: 'tap' } },
    { id: 'task.moreMenu', from: '/', to: '/', search: { listmenu: 'open' }, searchParams: {}, mode: 'push', params: {}, label: '右上 ⋯(清单选项)', ui: { placement: 'topbar', icon: 'IcMore', gesture: 'tap' } },
    { id: 'sidebar.settings', from: { path: '/', search: { drawer: 'open' } }, to: '/me', search: {}, searchParams: {}, mode: 'push', params: {}, label: '抽屉·设置齿轮', ui: { placement: 'content', icon: 'IcMe', gesture: 'tap' } },

    { id: 'cal.openTask', from: '/calendar', to: '/task/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '日历·打开任务', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'calendar.view.open', from: '/calendar', to: '/calendar', search: { view: 'open' }, searchParams: {}, preserveParams: ['calview'], mode: 'push', params: {}, label: '日历·视图切换(打开菜单)', ui: { placement: 'topbar', icon: 'IcMatrix', gesture: 'tap' } },
    { id: 'calendar.view.set.month', from: { path: '/calendar', search: { view: 'open' } }, to: '/calendar', search: { view: null, calview: null }, searchParams: {}, mode: 'replace', params: {}, label: '切换到月视图', ui: { placement: 'content', icon: 'IcCalendar', gesture: 'tap' } },
    { id: 'calendar.view.set.week', from: { path: '/calendar', search: { view: 'open' } }, to: '/calendar', search: { view: null, calview: 'week' }, searchParams: {}, mode: 'replace', params: {}, label: '切换到周视图', ui: { placement: 'content', icon: 'IcCalendar', gesture: 'tap' } },
    { id: 'calendar.view.set.day', from: { path: '/calendar', search: { view: 'open' } }, to: '/calendar', search: { view: null, calview: 'day' }, searchParams: {}, mode: 'replace', params: {}, label: '切换到日视图', ui: { placement: 'content', icon: 'IcCalendar', gesture: 'tap' } },
    { id: 'calendar.add.open', from: '/calendar', to: '/calendar', search: { sheet: 'add' }, searchParams: {}, mode: 'push', params: {}, label: '日历·＋ 新建任务', ui: { placement: 'fab', icon: 'IcPlus', gesture: 'tap' } },
    { id: 'matrix.openTask', from: '/matrix', to: '/task/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '四象限·打开任务', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'matrix.add.open', from: '/matrix', to: '/matrix', search: { sheet: 'add' }, searchParams: {}, mode: 'push', params: {}, label: '四象限·＋ 新建任务', ui: { placement: 'fab', icon: 'IcPlus', gesture: 'tap' } },
    { id: 'matrix.menu.open', from: '/matrix', to: '/matrix', search: { menu: 'open' }, searchParams: {}, mode: 'push', params: {}, label: '四象限·更多菜单', ui: { placement: 'topbar', icon: 'IcMore', gesture: 'tap' } },
    { id: 'matrix.layout.open', from: { path: '/matrix', search: { menu: 'open' } }, to: '/matrix', search: { menu: null, sheet: 'layout' }, searchParams: {}, mode: 'replace', params: {}, label: '四象限·编辑布局', ui: { placement: 'content', icon: 'IcMatrix', gesture: 'tap' } },
    { id: 'matrix.guide.open', from: { path: '/matrix', search: { menu: 'open' } }, to: '/matrix', search: { menu: null, guide: 'open' }, searchParams: {}, mode: 'replace', params: {}, label: '四象限·用户指引', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },

    { id: 'focus.start', from: '/focus', to: '/focus/run', search: {}, searchParams: { mode: 'string' }, mode: 'push', params: {}, label: '开始专注', ui: { placement: 'content', icon: 'IcPlay', gesture: 'tap' } },
    { id: 'focus.reopen', from: '/focus', to: '/focus/run', search: {}, searchParams: {}, mode: 'push', params: {}, label: '专注中·重新打开运行页', ui: { placement: 'content', icon: 'IcPlay', gesture: 'tap' } },
    { id: 'focus.stats', from: '/focus', to: '/focus/stats', search: {}, searchParams: {}, mode: 'push', params: {}, label: '专注统计', ui: { placement: 'topbar', icon: 'IcClock', gesture: 'tap' } },

    { id: 'me.premium', from: '/me', to: '/me/premium', search: {}, searchParams: {}, mode: 'push', params: {}, label: '开通超级会员', ui: { placement: 'content', icon: 'IcCrown', gesture: 'tap' } },
    { id: 'me.profile.open', from: '/me', to: '/me/profile', search: {}, searchParams: {}, mode: 'push', params: {}, label: '我的·用户卡→个人资料', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.appearance.open', from: '/me', to: '/me/appearance', search: {}, searchParams: {}, mode: 'push', params: {}, label: '外观设置', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.datetime.open', from: '/me', to: '/me/datetime', search: {}, searchParams: {}, mode: 'push', params: {}, label: '日期与时间', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.general.open', from: '/me', to: '/me/general', search: {}, searchParams: {}, mode: 'push', params: {}, label: '通用设置', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.about.open', from: '/me', to: '/me/about', search: {}, searchParams: {}, mode: 'push', params: {}, label: '关于', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.help.open', from: '/me', to: '/me/help', search: {}, searchParams: {}, mode: 'push', params: {}, label: '帮助与反馈', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'sidebar.profile.open', from: { path: '/', search: { drawer: 'open' } }, to: '/me/profile', search: {}, searchParams: {}, mode: 'push', params: {}, label: '抽屉·用户卡→个人资料', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.signout.open', from: '/me', to: '/me', search: { confirm: 'signout' }, searchParams: {}, mode: 'push', params: {}, label: '退出登录(确认)', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
    { id: 'me.signout.commit', from: { path: '/me', search: { confirm: 'signout' } }, to: '/login', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '确认退出→登录页', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },

    { id: 'login.enter', from: '/login', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '登录(假登录)进入', ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' } },
  ],
  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
