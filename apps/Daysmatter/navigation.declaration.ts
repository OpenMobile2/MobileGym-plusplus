import type { NavigationDeclaration, ScrollContainerDeclaration } from './navigation.types';

const MAIN_SCROLL: ScrollContainerDeclaration[] = [
  { name: 'main', direction: 'vertical', description: '主内容滚动' },
];

const EVENT_FORM_FROM = ['/event/add', '/event/edit/:id'];

export const NAVIGATION_DECLARATION = {
  app: 'daysmatter',
  routes: [
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.home.base',
          search: {},
          description: '首页倒数日列表',
          actions: [
            { id: 'home.camera.tap', label: '相机(暂未开放)', behavior: 'other' },
            { id: 'drawer.airtrans.tap', label: 'AirTrans接收(暂未开放)', behavior: 'other' },
            { id: 'drawer.filter.select.home', label: '筛选-首页事件', behavior: 'select' },
            { id: 'drawer.filter.select.all', label: '筛选-全部', behavior: 'select' },
            { id: 'drawer.filter.select.notebook', label: '筛选-按本子', behavior: 'select', scope: 'item', paramsSchema: { notebookId: 'string' } },
            { id: 'rowMenu.event.archive', label: '归档(行菜单)', behavior: 'modify', scope: 'item', paramsSchema: { eventId: 'string' } },
            { id: 'rowMenu.event.pin', label: '置顶(行菜单)', behavior: 'toggle' },
            { id: 'rowMenu.event.delete', label: '删除(行菜单)', behavior: 'modify', scope: 'item', paramsSchema: { eventId: 'string' } },
          ],
        },
        { id: 'daysmatter.home.drawer', search: { drawer: 'open' }, description: '侧边抽屉打开' },
        { id: 'daysmatter.home.rowMenu', search: { menu: 'row' }, description: '事件行长按菜单' },
      ],
      queryParams: { eid: 'string' },
      description: '首页倒数日列表',
    },
    {
      path: '/notebooks',
      component: 'NotebookHomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.notebooks.base',
          search: {},
          description: '倒数本主页',
          actions: [
            { id: 'notebook.milestone.tap', label: '里程碑(暂未开放)', behavior: 'other' },
            { id: 'notebook.calendar.tap', label: '日历视图(暂未开放)', behavior: 'other' },
            { id: 'notebook.strongReminder.tap', label: '强提醒(暂未开放)', behavior: 'other' },
            { id: 'notebook.library.tap', label: '事件库(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '倒数本主页',
    },
    {
      path: '/discover',
      component: 'DiscoverPage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.discover.base',
          search: {},
          description: '历史上的今天',
          actions: [
            { id: 'discover.share.tap', label: '分享(暂未开放)', behavior: 'other' },
            { id: 'discover.idaily.tap', label: 'iDaily(暂未开放)', behavior: 'other' },
            { id: 'discover.day.shift', label: '切换日期', behavior: 'modify' },
          ],
        },
      ],
      queryParams: {},
      description: '历史上的今天',
    },
    {
      path: '/account',
      component: 'AccountPage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.account.base',
          search: {},
          description: '我的/登录',
          actions: [
            { id: 'account.session.register', label: '注册', behavior: 'submit' },
            { id: 'account.session.login', label: '登录', behavior: 'submit' },
            { id: 'account.session.logout', label: '退出登录', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '我的/登录',
    },
    {
      path: '/more',
      component: 'MorePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.more.base',
          search: {},
          description: '更多',
          actions: [
            { id: 'more.piggy.tap', label: '隐藏内页广告', behavior: 'other' },
          ],
        },
        { id: 'daysmatter.more.airtrans', search: { popup: 'airtrans' }, description: 'AirTrans 等待弹窗' },
      ],
      queryParams: {},
      description: '更多',
    },
    {
      path: '/event/:id',
      component: 'EventDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.eventDetail.base',
          search: {},
          description: '事件详情',
          actions: [
            { id: 'detail.display.cycle', label: '切换天数显示格式', behavior: 'modify' },
            { id: 'detail.bigday.tap', label: 'Big Day(暂未开放)', behavior: 'other' },
            { id: 'share.saveImage.tap', label: '分享-存图(暂未开放)', behavior: 'other' },
            { id: 'share.event.archive', label: '分享-归档', behavior: 'modify' },
            { id: 'share.hide.tap', label: '分享-隐藏(暂未开放)', behavior: 'other' },
            { id: 'share.thirdparty.tap', label: '分享-三方(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'daysmatter.eventDetail.share', search: { sheet: 'share' }, description: '分享面板' },
      ],
      queryParams: {},
      description: '事件详情',
    },
    {
      path: '/event/add',
      component: 'EventAddPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.eventAdd.base',
          search: {},
          description: '添加新日子',
          actions: [
            { id: 'add.name.input', label: '输入事件名称', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'add.calendar.toggle', label: '公历/农历', behavior: 'toggle' },
            { id: 'add.pin.toggle', label: '置顶', behavior: 'toggle' },
            { id: 'add.showHome.toggle', label: '在首页显示', behavior: 'toggle' },
            { id: 'add.plusOne.toggle', label: '正数+1天', behavior: 'toggle' },
            { id: 'add.endDate.toggle', label: '结束时间', behavior: 'toggle' },
            { id: 'add.color.tap', label: '事件颜色(Pro)', behavior: 'other' },
            { id: 'add.advanced.toggle', label: '展开进阶设置', behavior: 'toggle' },
            { id: 'add.date.set', label: '选择目标日期', behavior: 'modify' },
            { id: 'add.endDate.set', label: '选择结束日期', behavior: 'modify' },
            { id: 'add.event.save', label: '保存事件', behavior: 'submit' },
          ],
        },
        { id: 'daysmatter.eventAdd.datePicker', search: { picker: 'date' }, description: '日期滚轮' },
      ],
      queryParams: { parent: 'string' },
      description: '添加新日子',
    },
    {
      path: '/event/edit/:id',
      component: 'EventEditPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.eventEdit.base',
          search: {},
          description: '编辑事件',
          actions: [
            { id: 'edit.name.input', label: '输入事件名称', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'edit.calendar.toggle', label: '公历/农历', behavior: 'toggle' },
            { id: 'edit.showHome.toggle', label: '在首页显示', behavior: 'toggle' },
            { id: 'edit.pin.toggle', label: '置顶', behavior: 'toggle' },
            { id: 'edit.advanced.toggle', label: '展开进阶设置', behavior: 'toggle' },
            { id: 'edit.endDate.toggle', label: '结束时间', behavior: 'toggle' },
            { id: 'edit.plusOne.toggle', label: '正数+1天', behavior: 'toggle' },
            { id: 'edit.color.tap', label: '事件颜色(Pro)', behavior: 'other' },
            { id: 'edit.date.set', label: '选择目标日期', behavior: 'modify' },
            { id: 'edit.endDate.set', label: '选择结束日期', behavior: 'modify' },
            { id: 'edit.event.save', label: '保存', behavior: 'submit' },
            { id: 'edit.event.archive', label: '归档事件', behavior: 'modify' },
            { id: 'edit.event.hide', label: '隐藏事件(暂未开放)', behavior: 'other' },
            { id: 'edit.event.delete', label: '删除事件', behavior: 'submit' },
          ],
        },
        { id: 'daysmatter.eventEdit.datePicker', search: { picker: 'date' }, description: '日期滚轮' },
      ],
      queryParams: {},
      description: '编辑事件',
    },
    {
      path: '/event/notebook-select',
      component: 'NotebookSelectPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.notebookSelect.base',
          search: {},
          description: '选择倒数本',
          actions: [
            { id: 'notebookSelect.item.pick', label: '选择本子', behavior: 'modify', scope: 'item', paramsSchema: { notebookId: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '选择倒数本',
    },
    {
      path: '/event/repeat',
      component: 'RepeatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.repeat.base',
          search: {},
          description: '重复设置',
          actions: [
            { id: 'repeat.option.pick', label: '选择重复方式', behavior: 'modify', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '重复设置',
    },
    {
      path: '/event/reminder',
      component: 'ReminderPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.reminder.base',
          search: {},
          description: '定期提醒',
          actions: [
            { id: 'reminder.freq.pick', label: '选择提醒频率', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'reminder.bigday.toggle', label: 'Big Day 提醒', behavior: 'toggle' },
            { id: 'reminder.strong.tap', label: '强提醒(Pro)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '定期提醒',
    },
    {
      path: '/search',
      component: 'SearchPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.search.base',
          search: {},
          description: '搜索',
          actions: [
            { id: 'search.query.input', label: '输入搜索词', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'search.input.clear', label: '清除搜索词', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '搜索',
    },
    {
      path: '/notebooks/manage',
      component: 'NotebookManagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.notebookManage.base',
          search: {},
          description: '管理本子',
          actions: [
            { id: 'manage.notebook.delete', label: '删除本子', behavior: 'modify', scope: 'item', paramsSchema: { notebookId: 'string' } },
            { id: 'manage.notebook.reorder', label: '拖拽排序', behavior: 'modify', scope: 'item', paramsSchema: { notebookId: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '管理本子',
    },
    {
      path: '/notebooks/add',
      component: 'NotebookAddPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.notebookAdd.base',
          search: {},
          description: '添加/编辑倒数本',
          actions: [
            { id: 'notebookAdd.name.input', label: '输入本子名称', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'notebookAdd.icon.pick', label: '选图标', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'notebookAdd.iconPro.tap', label: 'Pro图标(暂未开放)', behavior: 'other' },
            { id: 'notebookAdd.cover.pick', label: '选封面', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'notebookAdd.bg.tap', label: '背景图(暂未开放)', behavior: 'other' },
            { id: 'notebookAdd.form.save', label: '保存本子', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { nbid: 'string' },
      description: '添加/编辑倒数本',
    },
    {
      path: '/settings',
      component: 'SettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.settings.base',
          search: {},
          description: '设置',
          actions: [
            { id: 'settings.bigFont.toggle', label: '更大字体', behavior: 'toggle' },
            { id: 'settings.cardAnim.toggle', label: '卡片动效', behavior: 'toggle' },
            { id: 'settings.autoPin.toggle', label: '自动置顶', behavior: 'toggle' },
            { id: 'settings.hideAffix.toggle', label: '隐藏前后缀', behavior: 'toggle' },
            { id: 'settings.sort.pick', label: '事件列表排序', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'settings.backup.tap', label: '备份相关(暂未开放)', behavior: 'other' },
            { id: 'settings.appIcon.tap', label: '更换主屏幕图标', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'settings.terms.tap', label: '条款(暂未开放)', behavior: 'other' },
            { id: 'settings.item.tap', label: '设置项(暂未开放)', behavior: 'other', paramsSchema: { key: 'string' } },
            { id: 'settings.switch.toggle', label: '设置开关', behavior: 'toggle', paramsSchema: { key: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '设置',
    },
    {
      path: '/settings/language',
      component: 'LanguagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.settings.language',
          search: {},
          description: '应用语言',
          actions: [
            { id: 'settings.locale.pick', label: '选择应用语言', behavior: 'modify', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '应用语言',
    },
    {
      path: '/date-calculator',
      component: 'DateCalcPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.dateCalc.base',
          search: {},
          description: '日期计算器',
          actions: [
            { id: 'datecalc.startDate.set', label: '设置起始日', behavior: 'modify' },
            { id: 'datecalc.days.input', label: '输入天数', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'datecalc.rangeStart.set', label: '设置间隔起始', behavior: 'modify' },
            { id: 'datecalc.rangeEnd.set', label: '设置间隔结束', behavior: 'modify' },
            { id: 'datecalc.includeStart.toggle', label: '包含起始日', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '日期计算器',
    },
    {
      path: '/widgets',
      component: 'WidgetManagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.widgets.base',
          search: {},
          description: '小组件管理',
          actions: [
            { id: 'widget.preview.edit', label: '编辑小组件(选事件)', behavior: 'modify', scope: 'item', paramsSchema: { widgetId: 'string' } },
            { id: 'widget.bind.pick', label: '绑定事件', behavior: 'modify', scope: 'item', paramsSchema: { eventId: 'string' } },
          ],
        },
        { id: 'daysmatter.widgets.guideMain', search: { guide: 'main' }, description: '主屏指南弹窗' },
        { id: 'daysmatter.widgets.guideMulti', search: { guide: 'multi' }, description: '多功能指南弹窗' },
        { id: 'daysmatter.widgets.guideLock', search: { guide: 'lock' }, description: '锁屏指南弹窗' },
      ],
      queryParams: {},
      description: '小组件管理',
    },
    {
      path: '/album',
      component: 'AlbumPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.album.base',
          search: {},
          description: '倒数日相册',
          actions: [
            { id: 'album.tab.pick', label: '切换相册Tab', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'album.addPhoto.tap', label: '添加照片(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '倒数日相册',
    },
    {
      path: '/pro',
      component: 'ProPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.pro.base',
          search: {},
          description: '高级版介绍',
          actions: [
            { id: 'pro.carousel.shift', label: '切换介绍', behavior: 'modify' },
            { id: 'pro.upgrade.tap', label: '即刻升级(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '高级版介绍',
    },
    {
      path: '/faq',
      component: 'FaqPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.faq.base',
          search: {},
          description: '使用帮助/反馈',
          actions: [
            { id: 'faq.form.input', label: '填写反馈', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'faq.type.pick', label: '反馈类型', behavior: 'modify', paramsSchema: { value: 'string' } },
            { id: 'faq.form.submit', label: '提交反馈', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '使用帮助/反馈',
    },
    {
      path: '/archive',
      component: 'ArchivePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'daysmatter.archive.base',
          search: {},
          description: '归档·隐藏列表',
          actions: [
            { id: 'archive.item.restore', label: '恢复事件', behavior: 'modify', scope: 'item', paramsSchema: { eventId: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '归档·隐藏列表',
    },
  ],
  transitions: [
    // ---- TabBar ----
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '倒数日', ui: { placement: 'tabbar', icon: 'calendar', gesture: 'tap' } },
    { id: 'tabbar.notebook-open', from: '*', to: '/notebooks', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '倒数本', ui: { placement: 'tabbar', icon: 'star', gesture: 'tap' } },
    { id: 'tabbar.discover-open', from: '*', to: '/discover', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '发现', ui: { placement: 'tabbar', icon: 'globe', gesture: 'tap' } },
    { id: 'tabbar.account-open', from: '*', to: '/account', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '我的', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },
    { id: 'tabbar.more-open', from: '*', to: '/more', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '更多', ui: { placement: 'tabbar', icon: 'more', gesture: 'tap' } },
    // ---- Home ----
    { id: 'home.drawer-open', from: '/', to: '/', search: { drawer: 'open' }, searchParams: {}, mode: 'push', params: {}, label: '打开抽屉', ui: { placement: 'topbar', icon: 'menu', gesture: 'tap' } },
    { id: 'home.add-open', from: '/', to: '/event/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '添加新日子', ui: { placement: 'topbar', icon: 'add', gesture: 'tap' } },
    { id: 'home.search-open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '搜索', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'home.item-open', from: '/', to: '/event/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开事件', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    { id: 'home.rowMenu-open', from: '/', to: '/', search: { menu: 'row' }, searchParams: { eid: 'string' }, mode: 'push', params: { eid: 'string' }, label: '行长按菜单', ui: { placement: 'content', icon: 'none', gesture: 'longPress' } },
    // ---- Event detail ----
    { id: 'detail.edit-open', from: '/event/:id', to: '/event/edit/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '编辑', ui: { placement: 'topbar', icon: 'edit', gesture: 'tap' } },
    { id: 'detail.album-open', from: '/event/:id', to: '/album', search: {}, searchParams: {}, mode: 'push', params: {}, label: '相册', ui: { placement: 'content', icon: 'image', gesture: 'tap' } },
    { id: 'detail.share-open', from: '/event/:id', to: '/event/:id', search: { sheet: 'share' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '分享面板', ui: { placement: 'content', icon: 'share', gesture: 'tap' } },
    { id: 'detail.subadd-open', from: '/event/:id', to: '/event/add', search: {}, searchParams: { parent: 'string' }, mode: 'push', params: {}, label: '添加小倒数日', ui: { placement: 'content', icon: 'add', gesture: 'tap' } },
    { id: 'detail.sub-open', from: '/event/:id', to: '/event/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开小倒数日', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    // ---- Event add/edit shared ----
    { id: 'event.notebook-open', from: EVENT_FORM_FROM, to: '/event/notebook-select', search: {}, searchParams: {}, mode: 'push', params: {}, label: '选倒数本', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },
    { id: 'event.repeat-open', from: EVENT_FORM_FROM, to: '/event/repeat', search: {}, searchParams: {}, mode: 'push', params: {}, label: '重复', ui: { placement: 'content', icon: 'repeat', gesture: 'tap' } },
    { id: 'event.reminder-open', from: EVENT_FORM_FROM, to: '/event/reminder', search: {}, searchParams: {}, mode: 'push', params: {}, label: '定期提醒', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'add.datePicker-open', from: '/event/add', to: '/event/add', search: { picker: 'date' }, searchParams: {}, mode: 'push', params: {}, label: '选日期', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    { id: 'edit.datePicker-open', from: '/event/edit/:id', to: '/event/edit/:id', search: { picker: 'date' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '选日期', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    // ---- Notebook select ----
    { id: 'notebookSelect.add-open', from: '/event/notebook-select', to: '/notebooks/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '新建本子', ui: { placement: 'content', icon: 'add', gesture: 'tap' } },
    // ---- Search ----
    { id: 'search.item-open', from: '/search', to: '/event/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开事件', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    { id: 'search.add-open', from: '/search', to: '/event/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '添加倒数日', ui: { placement: 'content', icon: 'add', gesture: 'tap' } },
    // ---- Notebook home ----
    { id: 'notebook.item-open', from: '/notebooks', to: '/event/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开事件', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    { id: 'notebook.allEvents-open', from: '/notebooks', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '查看全部事件', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    { id: 'notebook.filter-open', from: '/notebooks', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '按本子筛选', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    { id: 'notebook.add-open', from: '/notebooks', to: '/notebooks/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '新建本子', ui: { placement: 'content', icon: 'add', gesture: 'tap' } },
    { id: 'notebook.manage-open', from: ['/notebooks', '/'], to: '/notebooks/manage', search: {}, searchParams: {}, mode: 'push', params: {}, label: '管理本子', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'notebook.datecalc-open', from: '/notebooks', to: '/date-calculator', search: {}, searchParams: {}, mode: 'push', params: {}, label: '日期计算器', ui: { placement: 'content', icon: 'calculator', gesture: 'tap' } },
    { id: 'notebook.album-open', from: ['/notebooks', '/event/:id', '/settings'], to: '/album', search: {}, searchParams: {}, mode: 'push', params: {}, label: '相册', ui: { placement: 'content', icon: 'image', gesture: 'tap' } },
    { id: 'notebook.faq-open', from: ['/notebooks', '/more', '/settings'], to: '/faq', search: {}, searchParams: {}, mode: 'push', params: {}, label: '使用指南', ui: { placement: 'content', icon: 'help', gesture: 'tap' } },
    { id: 'notebook.pro-open', from: ['/notebooks', '/more', '/account', '/settings'], to: '/pro', search: {}, searchParams: {}, mode: 'push', params: {}, label: '高级版', ui: { placement: 'content', icon: 'crown', gesture: 'tap' } },
    { id: 'notebook.archive-open', from: '/notebooks', to: '/archive', search: {}, searchParams: {}, mode: 'push', params: {}, label: '归档隐藏', ui: { placement: 'content', icon: 'archive', gesture: 'tap' } },
    { id: 'notebook.widgets-open', from: '/settings', to: '/widgets', search: {}, searchParams: {}, mode: 'push', params: {}, label: '小组件管理', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    // ---- Notebook manage ----
    { id: 'manage.add-open', from: '/notebooks/manage', to: '/notebooks/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '新建本子', ui: { placement: 'content', icon: 'add', gesture: 'tap' } },
    { id: 'manage.notebook-edit', from: '/notebooks/manage', to: '/notebooks/add', search: {}, searchParams: { nbid: 'string' }, mode: 'push', params: { nbid: 'string' }, label: '编辑本子', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    // ---- More ----
    { id: 'more.feedback-open', from: '/more', to: '/faq', search: {}, searchParams: {}, mode: 'push', params: {}, label: '反馈', ui: { placement: 'topbar', icon: 'help', gesture: 'tap' } },
    { id: 'more.datecalc-open', from: '/more', to: '/date-calculator', search: {}, searchParams: {}, mode: 'push', params: {}, label: '日期计算器', ui: { placement: 'content', icon: 'calculator', gesture: 'tap' } },
    { id: 'more.settings-open', from: '/more', to: '/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'more.airtrans-open', from: '/more', to: '/more', search: { popup: 'airtrans' }, searchParams: {}, mode: 'push', params: {}, label: 'AirTrans 接收', ui: { placement: 'content', icon: 'send', gesture: 'tap' } },
    // ---- Settings ----
    { id: 'settings.login-open', from: '/settings', to: '/account', search: {}, searchParams: {}, mode: 'push', params: {}, label: '登录', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'settings.language-open', from: '/settings', to: '/settings/language', search: {}, searchParams: {}, mode: 'push', params: {}, label: '应用语言', ui: { placement: 'content', icon: 'globe', gesture: 'tap' } },
    // ---- Widget guides ----
    { id: 'widget.guideMain-open', from: '/widgets', to: '/widgets', search: { guide: 'main' }, searchParams: {}, mode: 'push', params: {}, label: '主屏指南', ui: { placement: 'content', icon: 'help', gesture: 'tap' } },
    { id: 'widget.guideMulti-open', from: '/widgets', to: '/widgets', search: { guide: 'multi' }, searchParams: {}, mode: 'push', params: {}, label: '多功能指南', ui: { placement: 'content', icon: 'help', gesture: 'tap' } },
    { id: 'widget.guideLock-open', from: '/widgets', to: '/widgets', search: { guide: 'lock' }, searchParams: {}, mode: 'push', params: {}, label: '锁屏指南', ui: { placement: 'content', icon: 'help', gesture: 'tap' } },
    // ---- Detail-from-archive ----
    { id: 'archive.item-open', from: '/archive', to: '/event/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '打开归档事件', ui: { placement: 'content', icon: 'none', gesture: 'tap' } },
    // ---- Row menu edit ----
    { id: 'rowMenu.edit-open', from: '/', to: '/event/edit/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '编辑(菜单)', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'rowMenu.share-open', from: '/', to: '/event/:id', search: { sheet: 'share' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '分享(菜单)', ui: { placement: 'content', icon: 'share', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
