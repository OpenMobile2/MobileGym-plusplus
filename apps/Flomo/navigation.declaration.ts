// AUTO-GENERATED from docs/flomo-replication/spec.json (frozen v1.0) by assets/scaffold_l0.py
// 不要手改;改 spec 后重跑生成器(spec-first 纪律)。
import type { NavigationDeclaration } from './navigation.types';

export const NAVIGATION_DECLARATION = {
  app: 'flomo',
  routes: [
    {
      path: '/',
      component: 'HomeFeedPage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [{ name: 'feed', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.home.feed.base', search: {}, description: '主页笔记流',
          actions: [
            { id: 'home.feed.image.preview', label: '笔记内嵌图片', behavior: 'submit' },
            { id: 'home.feed.imagePreview.close', label: '图片全屏预览·点击关闭', behavior: 'submit' },
            { id: 'home.feed.deleteUndo.do', label: '已删除黑条·撤销', behavior: 'submit' },
            { id: 'home.feed.memo.expand.toggle', label: '长笔记「展开/收起」', behavior: 'toggle' },
          ],
        },
        { id: 'flomo.home.titleMenu.open', search: { titleMenu: 'open' }, description: '顶栏标题下拉菜单',
          actions: [
            { id: 'home.titleMenu.sort.toggle', label: '排序切换', behavior: 'toggle' },
          ], },
      ],
      queryParams: {},
      description: '主页笔记流',
    },
    {
      path: '/home/multiSelect',
      component: 'HomeMultiselectPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.home.multiSelect.base', search: {}, description: '多选模式(批量操作)',
          actions: [
            { id: 'home.multiSelect.toggle.item', label: '勾选一条笔记', behavior: 'submit' },
            { id: 'home.multiSelect.addtag.do', label: '添加标签', behavior: 'submit' },
            { id: 'home.multiSelect.copy.do', label: '复制', behavior: 'submit' },
            { id: 'home.multiSelect.delete.do', label: '删除', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '多选模式(批量操作)',
    },
    {
      path: '/compose/editor',
      component: 'ComposeEditorPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.compose.editor.base', search: {}, description: '写笔记编辑器',
          actions: [
            { id: 'compose.editor.input.text', label: '文本区', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'compose.editor.bold.toggle', label: '加粗 B 按钮', behavior: 'toggle' },
            { id: 'compose.editor.image.remove', label: '已选图片右上角 X', behavior: 'submit' },
            { id: 'compose.editor.send.submit', label: '发送按钮', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '写笔记编辑器',
    },
    {
      path: '/compose/tagSuggest',
      component: 'ComposeTagsuggestPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.compose.tagSuggest.base', search: {}, description: '标签联想面板',
          actions: [
            { id: 'compose.tagSuggest.select.tag', label: '一个标签候选', behavior: 'select' },
            { id: 'compose.tagSuggest.create.new', label: '新建标签(输入未命中时)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '标签联想面板',
    },
    {
      path: '/compose/listMenu',
      component: 'ComposeListmenuPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.compose.listMenu.base', search: {}, description: '列表/排版菜单',
          actions: [
            { id: 'compose.listMenu.select.bullet', label: '无序列表', behavior: 'select' },
            { id: 'compose.listMenu.select.ordered', label: '有序列表', behavior: 'select' },
          ],
        },
      ],
      queryParams: {},
      description: '列表/排版菜单',
    },
    {
      path: '/compose/moreToolbar',
      component: 'ComposeMoretoolbarPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.compose.moreToolbar.base', search: {}, description: '工具条·更多(第二排)',
          actions: [
            { id: 'compose.moreToolbar.highlight.toggle', label: '荧光笔', behavior: 'toggle' },
            { id: 'compose.moreToolbar.underline.toggle', label: '下划线', behavior: 'toggle' },
            { id: 'compose.moreToolbar.undo.do', label: '撤销/重做(前进后退)', behavior: 'submit' },
            { id: 'compose.moreToolbar.camera.open', label: '拍照', behavior: 'submit' },
            { id: 'compose.moreToolbar.scan.open', label: '扫描', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '工具条·更多(第二排)',
    },
    {
      path: '/image/picker',
      component: 'ImagePickerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.image.picker.base', search: {}, description: '插入图片(相册选择)',
          actions: [
            { id: 'image.picker.select.photo', label: '一张照片', behavior: 'select' },
            { id: 'image.picker.confirm.insert', label: '确认', behavior: 'submit' },
            { id: 'image.picker.tab.select.album', label: '相片/选集 Tab', behavior: 'select' },
          ],
        },
      ],
      queryParams: {},
      description: '插入图片(相册选择)',
    },
    {
      path: '/memo/cardMenu',
      component: 'MemoCardmenuPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.memo.cardMenu.base', search: {}, description: '主页卡片「…」菜单',
          actions: [
            { id: 'memo.cardMenu.pin.toggle', label: '置顶', behavior: 'toggle' },
            { id: 'memo.cardMenu.more.expand', label: '更多', behavior: 'submit' },
            { id: 'memo.cardMenu.delete.confirm', label: '删除', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '主页卡片「…」菜单',
    },
    {
      path: '/memo/detail',
      component: 'MemoDetailPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.memo.detail.base', search: {}, description: '笔记详情页',
        },
      ],
      queryParams: {},
      description: '笔记详情页',
    },
    {
      path: '/memo/longPressMenu',
      component: 'MemoLongpressmenuPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.memo.longPressMenu.base', search: {}, description: '笔记长按菜单',
          actions: [
            { id: 'memo.longPressMenu.copy.do', label: '复制', behavior: 'submit' },
            { id: 'memo.longPressMenu.duplicate.do', label: '副本', behavior: 'submit' },
            { id: 'memo.longPressMenu.delete.do', label: '删除', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '笔记长按菜单',
    },
    {
      path: '/memo/detailMenu',
      component: 'MemoDetailmenuPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.memo.detailMenu.base', search: {}, description: '详情页「…」菜单',
          actions: [
            { id: 'memo.detailMenu.pin.toggle', label: '置顶', behavior: 'toggle' },
            { id: 'memo.detailMenu.copylink.do', label: '复制链接', behavior: 'submit' },
            { id: 'memo.detailMenu.setdate.open', label: '设定日期', behavior: 'submit' },
            { id: 'memo.detailMenu.delete.do', label: '删除', behavior: 'submit' },
            { id: 'memo.detailMenu.history.open', label: '历史版本', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '详情页「…」菜单',
    },
    {
      path: '/share/image',
      component: 'ShareImagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.share.image.base', search: {}, description: '分享成图预览',
          actions: [
            { id: 'share.image.style.select', label: '一个样式模板', behavior: 'submit' },
            { id: 'share.image.save.do', label: '保存图片', behavior: 'submit' },
            { id: 'share.image.send.wechat', label: '微信/朋友圈/更多', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '分享成图预览',
    },
    {
      path: '/tag/drawer',
      component: 'TagDrawerPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.tag.drawer.base', search: {}, description: '左侧标签抽屉',
          actions: [
            { id: 'tag.drawer.heatmapEmpty', label: '顶部热力图·空白日期', behavior: 'submit' },
            { id: 'tag.drawer.tag.longpress', label: '一个标签', behavior: 'submit' },
            { id: 'tag.drawer.agent.open', label: 'Agent', behavior: 'submit' },
            { id: 'tag.drawer.help.open', label: '帮助中心', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '左侧标签抽屉',
    },
    {
      path: '/tag/filter',
      component: 'TagFilterPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.tag.filter.base', search: {}, description: '标签筛选后的笔记流',
          actions: [
            { id: 'tag.filter.sort.open', label: '#标签名下拉', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '标签筛选后的笔记流',
    },
    {
      path: '/filter/byType',
      component: 'FilterBytypePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.filter.byType.base', search: {}, description: '内容类型筛选流',
        },
      ],
      queryParams: {},
      description: '内容类型筛选流',
    },
    {
      path: '/tag/manage',
      component: 'TagManagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.tag.manage.base', search: {}, description: '标签管理',
          actions: [
            { id: 'tag.manage.reorder.drag', label: '拖拽排序', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '标签管理',
    },
    {
      path: '/tag/editSheet',
      component: 'TagEditsheetPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.tag.editSheet.base', search: {}, description: '标签重命名/移动/删除弹层',
          actions: [
            { id: 'tag.editSheet.rename.do', label: '重命名', behavior: 'submit' },
            { id: 'tag.editSheet.delete.do', label: '删除', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '标签重命名/移动/删除弹层',
    },
    {
      path: '/review/random',
      component: 'ReviewRandomPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.review.random.base', search: {}, description: '随机漫步',
          actions: [
            { id: 'review.random.reroll.do', label: '骰子(再来一组)', behavior: 'submit' },
            { id: 'review.random.walk.step', label: '分支笔记(单击=继续漫步)', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '随机漫步',
    },
    {
      path: '/review/daily',
      component: 'ReviewDailyPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.review.daily.base', search: {}, description: '每日回顾',
          actions: [
            { id: 'review.daily.next.swipe', label: '翻到下一条', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '每日回顾',
    },
    {
      path: '/review/dailySettings',
      component: 'ReviewDailysettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.review.dailySettings.base', search: {}, description: '每日回顾设置',
          actions: [
            { id: 'review.dailySettings.condition.select', label: '回顾条件', behavior: 'submit' },
            { id: 'review.dailySettings.timerange.select', label: '时间范围', behavior: 'submit' },
            { id: 'review.dailySettings.count.select', label: '回顾条数', behavior: 'submit' },
            { id: 'review.dailySettings.wxnotify.toggle', label: '微信提醒', behavior: 'toggle' },
            { id: 'review.dailySettings.widget.add', label: '添加小组件', behavior: 'submit' },
            { id: 'review.dailySettings.widget.custom', label: '自定义小组件', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '每日回顾设置',
    },
    {
      path: '/review/notifyPush',
      component: 'ReviewNotifypushPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.review.notifyPush.base', search: {}, description: 'App 通知提醒(子页)',
          actions: [
            { id: 'review.notifyPush.toggle', label: '每日回顾推送开关', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: 'App 通知提醒(子页)',
    },
    {
      path: '/stats/heatmap',
      component: 'StatsHeatmapPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.stats.heatmap.base', search: {}, description: '热力图/统计页',
          actions: [
            { id: 'stats.heatmap.range.select', label: '月/年 切换', behavior: 'submit' },
            { id: 'stats.heatmap.share.do', label: '分享', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '热力图/统计页',
    },
    {
      path: '/stats/record',
      component: 'StatsRecordPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.stats.record.base', search: {}, description: '记录统计',
          actions: [
            { id: 'stats.record.month.select', label: '月份下拉', behavior: 'submit' },
            { id: 'stats.record.share.do', label: '分享', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '记录统计',
    },
    {
      path: '/search/page',
      component: 'SearchPagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.search.page.base', search: {}, description: '搜索页',
          actions: [
            { id: 'search.page.aifind.do', label: '用AI找一找', behavior: 'submit' },
            { id: 'search.page.filter.toggle', label: '类型筛选chip', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '搜索页',
    },
    {
      path: '/search/results',
      component: 'SearchResultsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.search.results.base', search: {}, description: '搜索结果',
          actions: [
            { id: 'search.results.expand.toggle', label: '展开', behavior: 'toggle' },
            { id: 'search.results.filter.select', label: '日期/标签/更多 筛选', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '搜索结果',
    },
    {
      path: '/ai/insight',
      component: 'AiInsightPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.ai.insight.base', search: {}, description: 'AI洞察(视角选择)',
          actions: [
            { id: 'ai.insight.perspective.run', label: '一个洞察视角', behavior: 'submit' },
            { id: 'ai.insight.scope.open', label: '洞察范围', behavior: 'submit' },
            { id: 'ai.insight.history.open', label: '历史洞察', behavior: 'submit' },
            { id: 'ai.insight.more.open', label: '发现更多视角/自定义', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: 'AI洞察(视角选择)',
    },
    {
      path: '/mind/map',
      component: 'MindMapPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.mind.map.base', search: {}, description: '认知地图(等高线地形图)',
          actions: [
            { id: 'mind.map.timeline.scrub', label: '记录足迹 时间轴滑块', behavior: 'submit' },
            { id: 'mind.map.share.do', label: '分享', behavior: 'submit' },
            { id: 'mind.map.more.open', label: '…菜单', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '认知地图(等高线地形图)',
    },
    {
      path: '/related/notes',
      component: 'RelatedNotesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.related.notes.base', search: {}, description: '相关笔记',
          actions: [
            { id: 'related.notes.search.input', label: '搜索关联笔记', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'related.notes.link.do', label: '选一条建立关联', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '相关笔记',
    },
    {
      path: '/pro/intro',
      component: 'ProIntroPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.pro.intro.base', search: {}, description: '会员 Pro 介绍',
          actions: [
            { id: 'pro.intro.more.expand', label: '更多专属功能', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '会员 Pro 介绍',
    },
    {
      path: '/pay/sheet',
      component: 'PaySheetPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.pay.sheet.base', search: {}, description: '选择支付方式(系统购买弹层)',
          actions: [
            { id: 'pay.sheet.pay.mock', label: '支付/购买', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '选择支付方式(系统购买弹层)',
    },
    {
      path: '/settings/main',
      component: 'SettingsMainPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.settings.main.base', search: {}, description: '设置页',
          actions: [
            { id: 'settings.main.freevip.open', label: '免费领会员', behavior: 'submit' },
            { id: 'settings.main.help.open', label: '帮助与反馈', behavior: 'submit' },
            { id: 'settings.main.widget.open', label: '小组件', behavior: 'submit' },
            { id: 'settings.main.api.open', label: 'API & 插件', behavior: 'submit' },
            { id: 'settings.main.lock.open', label: '密码锁 PRO', behavior: 'submit' },
            { id: 'settings.main.logout.do', label: '退出登录', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '设置页',
    },
    {
      path: '/settings/account',
      component: 'SettingsAccountPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.settings.account.base', search: {}, description: '账号与密码',
          actions: [
            { id: 'settings.account.delete.do', label: '注销账号', behavior: 'submit' },
            { id: 'settings.account.legal.open', label: '用户协议/隐私政策', behavior: 'submit' },
            { id: 'settings.account.notion.open', label: 'Notion 同步', behavior: 'submit' },
            { id: 'settings.account.rebuild.do', label: '标签重建', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '账号与密码',
    },
    {
      path: '/settings/preferences',
      component: 'SettingsPreferencesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.settings.preferences.base', search: {}, description: '偏好设置(含深色模式)',
          actions: [
            { id: 'settings.preferences.dark.toggle', label: '深色模式开关', behavior: 'toggle' },
            { id: 'settings.preferences.fontsize.select', label: '字体大小', behavior: 'submit' },
            { id: 'settings.preferences.fold.toggle', label: '内容过长折叠开关', behavior: 'toggle' },
            { id: 'settings.preferences.lang.select', label: '语言', behavior: 'submit' },
            { id: 'settings.preferences.misc.toggle', label: 'Spotlight搜索/LivePhoto等开关', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '偏好设置(含深色模式)',
    },
    {
      path: '/settings/ai',
      component: 'SettingsAiPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.settings.ai.base', search: {}, description: 'AI 设置',
          actions: [
            { id: 'settings.ai.related.toggle', label: '相关笔记开关', behavior: 'toggle' },
            { id: 'settings.ai.insight.toggle', label: 'AI洞察开关', behavior: 'toggle' },
            { id: 'settings.ai.voice.open', label: 'AI语音输入', behavior: 'submit' },
            { id: 'settings.ai.persona.open', label: '个性化信息', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: 'AI 设置',
    },
    {
      path: '/data/importExport',
      component: 'DataImportexportPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.data.importExport.base', search: {}, description: '导入/导出弹层',
          actions: [
            { id: 'data.importExport.tab.select', label: '导出/导入 Tab', behavior: 'submit' },
            { id: 'data.importExport.source.open', label: '一个导入来源', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '导入/导出弹层',
    },
    {
      path: '/notifications',
      component: 'NotificationsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.notifications.base', search: {}, description: '消息通知',
          actions: [
            { id: 'notifications.item.open', label: '一条通知', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '消息通知',
    },
    {
      path: '/trash/page',
      component: 'TrashPagePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.trash.page.base', search: {}, description: '回收站',
          actions: [
            { id: 'trash.page.restore.do', label: '恢复一条', behavior: 'submit' },
            { id: 'trash.page.purge.do', label: '彻底删除', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '回收站',
    },
    {
      path: '/auth/login',
      component: 'AuthLoginPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.auth.login.base', search: {}, description: '登录/启动页',
          actions: [
            { id: 'auth.login.wechat.do', label: '微信登录', behavior: 'submit' },
            { id: 'auth.login.phone.do', label: '手机号登录', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '登录/启动页',
    },
    {
      path: '/home/empty',
      component: 'HomeEmptyPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'main', direction: 'vertical', description: '主滚动区' }],
      uiStates: [
        {
          id: 'flomo.home.empty.base', search: {}, description: '空状态(无笔记)',
        },
      ],
      queryParams: {},
      description: '空状态(无笔记)',
    },
  ],
  transitions: [
    { id: 'tag.drawer.open', from: ['/', '/filter/byType', '/tag/filter'], to: '/tag/drawer', search: {}, searchParams: {}, mode: 'push', params: {}, label: '汉堡菜单按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'search.page.open', from: '/', to: '/search/page', search: {}, searchParams: {}, mode: 'push', params: {}, label: '搜索按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'home.titleMenu.open', from: '/', to: '/', search: { titleMenu: 'open' }, searchParams: {}, mode: 'push', params: {}, label: 'flomo 标题下拉', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.editor.openFab', from: '/', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '绿色+写笔记按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.editor.editFromCard', from: '/', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条笔记卡片', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.cardMenu.open', from: '/', to: '/memo/cardMenu', search: {}, searchParams: {}, mode: 'push', params: {}, label: '笔记卡片 …按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.longPressMenu.open', from: '/', to: '/memo/longPressMenu', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条笔记卡片', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.filter.open', from: ['/', '/memo/detail', '/review/daily', '/review/random'], to: '/tag/filter', search: {}, searchParams: {}, mode: 'push', params: {}, label: '正文里的标签chip(#xxx)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.detail.fromLink', from: '/', to: '/memo/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '正文里「关联自:MEMO »」链接', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'stats.heatmap.open', from: ['/', '/filter/byType'], to: '/stats/heatmap', search: {}, searchParams: {}, mode: 'push', params: {}, label: '「查看N月记录统计」入口', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.daily.open', from: '/', to: '/review/daily', search: {}, searchParams: {}, mode: 'push', params: {}, label: '热门入口·每日回顾', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.random.open', from: '/', to: '/review/random', search: {}, searchParams: {}, mode: 'push', params: {}, label: '热门入口·随机漫步', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'ai.insight.open', from: '/', to: '/ai/insight', search: {}, searchParams: {}, mode: 'push', params: {}, label: '热门入口·AI洞察', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'home.multiSelect.enter', from: '/', to: '/home/multiSelect', search: {}, searchParams: {}, mode: 'push', params: {}, label: '选择笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'home.multiSelect.exit', from: '/home/multiSelect', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '取消/完成', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.tagSuggest.open', from: '/compose/editor', to: '/compose/tagSuggest', search: {}, searchParams: {}, mode: 'push', params: {}, label: '# 标签按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'image.picker.open', from: '/compose/editor', to: '/image/picker', search: {}, searchParams: {}, mode: 'push', params: {}, label: '图片按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.listMenu.open', from: '/compose/editor', to: '/compose/listMenu', search: {}, searchParams: {}, mode: 'push', params: {}, label: '列表按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.moreToolbar.open', from: '/compose/editor', to: '/compose/moreToolbar', search: {}, searchParams: {}, mode: 'push', params: {}, label: '更多 … 按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.moreToolbar.mention', from: '/compose/moreToolbar', to: '/related/notes', search: {}, searchParams: {}, mode: 'push', params: {}, label: '@ 笔记联想', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'share.image.open', from: '/memo/cardMenu', to: '/share/image', search: {}, searchParams: {}, mode: 'push', params: {}, label: '分享(成图)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.editor.edit', from: '/memo/cardMenu', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '编辑', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.detail.fromMenu', from: '/memo/cardMenu', to: '/memo/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '查看详情', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'compose.editor.annotate', from: '/memo/cardMenu', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '批注', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'related.notes.open', from: '/memo/cardMenu', to: '/related/notes', search: {}, searchParams: {}, mode: 'push', params: {}, label: '相关笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'ai.insight.fromCard', from: '/memo/cardMenu', to: '/ai/insight', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'AI洞察', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.detailMenu.open', from: '/memo/detail', to: '/memo/detailMenu', search: {}, searchParams: {}, mode: 'push', params: {}, label: '详情页 …按钮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.detail.fromBacklink', from: '/memo/detail', to: '/memo/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '「被以下N条笔记引用」中的一条', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.detail.fromLink2', from: '/memo/detail', to: '/memo/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '正文「关联自:MEMO »」', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.longPressMenu.share', from: '/memo/longPressMenu', to: '/share/image', search: {}, searchParams: {}, mode: 'push', params: {}, label: '分享', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.longPressMenu.edit', from: '/memo/longPressMenu', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '编辑', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.longPressMenu.aiInsight', from: '/memo/longPressMenu', to: '/ai/insight', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'AI洞察', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.longPressMenu.related', from: '/memo/longPressMenu', to: '/related/notes', search: {}, searchParams: {}, mode: 'push', params: {}, label: '相关笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'ai.insight.adjust', from: '/memo/detailMenu', to: '/ai/insight', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'AI调整', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'memo.detailMenu.related', from: '/memo/detailMenu', to: '/related/notes', search: {}, searchParams: {}, mode: 'push', params: {}, label: '相关笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'share.image.close', from: '/share/image', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '确定/关闭', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.drawer.avatarClose', from: '/tag/drawer', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '用户头像', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'notifications.open', from: '/tag/drawer', to: '/notifications', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部通知入口(铃铛)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.main.open', from: '/tag/drawer', to: '/settings/main', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部设置入口(六边形)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.drawer.statsOpen', from: '/tag/drawer', to: '/stats/heatmap', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部统计标签(笔记/标签/天)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.drawer.heatmapDay', from: '/tag/drawer', to: '/filter/byType', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶部热力图·有记录的某天', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.drawer.proOpen', from: '/tag/drawer', to: '/pro/intro', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'PRO 徽标', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.drawer.allNotes', from: '/tag/drawer', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '全部笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'filter.byType.images', from: '/tag/drawer', to: '/filter/byType', search: {}, searchParams: {}, mode: 'push', params: {}, label: '有图片', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'filter.byType.links', from: '/tag/drawer', to: '/filter/byType', search: {}, searchParams: {}, mode: 'push', params: {}, label: '有链接', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'filter.byType.audio', from: '/tag/drawer', to: '/filter/byType', search: {}, searchParams: {}, mode: 'push', params: {}, label: '有语音', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'filter.byType.untagged', from: '/tag/drawer', to: '/filter/byType', search: {}, searchParams: {}, mode: 'push', params: {}, label: '无标签', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.filter.fromDrawer', from: '/tag/drawer', to: '/tag/filter', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一个自创标签(如 #欢迎)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.daily.fromDrawer', from: '/tag/drawer', to: '/review/daily', search: {}, searchParams: {}, mode: 'push', params: {}, label: '每日回顾', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.random.fromDrawer', from: '/tag/drawer', to: '/review/random', search: {}, searchParams: {}, mode: 'push', params: {}, label: '随机漫步', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'ai.insight.fromDrawer', from: '/tag/drawer', to: '/ai/insight', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'AI清单/AI洞察', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'mind.map.open', from: '/tag/drawer', to: '/mind/map', search: {}, searchParams: {}, mode: 'push', params: {}, label: '认知地图', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'filter.byType.wechat', from: '/tag/drawer', to: '/filter/byType', search: {}, searchParams: {}, mode: 'push', params: {}, label: '微信输入', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'trash.page.open', from: '/tag/drawer', to: '/trash/page', search: {}, searchParams: {}, mode: 'push', params: {}, label: '回收站', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.manage.open', from: '/tag/drawer', to: '/tag/manage', search: {}, searchParams: {}, mode: 'push', params: {}, label: '标签管理入口', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.filter.openMemo', from: '/tag/filter', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.filter.longpress', from: '/tag/filter', to: '/memo/longPressMenu', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'filter.byType.openMemo', from: '/filter/byType', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'tag.editSheet.open', from: '/tag/manage', to: '/tag/editSheet', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一个标签的操作', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.random.openMemo', from: '/review/random', to: '/memo/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '分支笔记(双击=看详情)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.dailySettings.open', from: '/review/daily', to: '/review/dailySettings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置齿轮', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'ai.insight.fromReview', from: '/review/daily', to: '/ai/insight', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'AI洞察', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.daily.openMemo', from: '/review/daily', to: '/memo/detail', search: {}, searchParams: {}, mode: 'push', params: {}, label: '点回顾的笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'review.notifyPush.open', from: '/review/dailySettings', to: '/review/notifyPush', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'App通知提醒', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'stats.heatmap.day', from: '/stats/heatmap', to: '/tag/filter', search: {}, searchParams: {}, mode: 'push', params: {}, label: '热力图有记录的一天', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'stats.heatmap.more', from: '/stats/heatmap', to: '/stats/record', search: {}, searchParams: {}, mode: 'push', params: {}, label: '更多', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'search.results.open', from: '/search/page', to: '/search/results', search: {}, searchParams: {}, mode: 'push', params: {}, label: '搜索输入框', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'search.results.recent', from: '/search/page', to: '/search/results', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条最近搜索', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'search.results.openMemo', from: '/search/results', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一条结果', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'mind.map.peak.open', from: '/mind/map', to: '/tag/filter', search: {}, searchParams: {}, mode: 'push', params: {}, label: '一个主题峰(标签簇)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.sheet.monthly', from: '/pro/intro', to: '/pay/sheet', search: {}, searchParams: {}, mode: 'push', params: {}, label: '连续包月 ¥15', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.sheet.yearly', from: '/pro/intro', to: '/pay/sheet', search: {}, searchParams: {}, mode: 'push', params: {}, label: '连续包年 ¥99', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pro.intro.account', from: '/pro/intro', to: '/settings/account', search: {}, searchParams: {}, mode: 'push', params: {}, label: '账号详情', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'pay.sheet.close', from: '/pay/sheet', to: '/pro/intro', search: {}, searchParams: {}, mode: 'push', params: {}, label: '取消/关闭', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.account.open', from: '/settings/main', to: '/settings/account', search: {}, searchParams: {}, mode: 'push', params: {}, label: '账号与密码', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.preferences.open', from: '/settings/main', to: '/settings/preferences', search: {}, searchParams: {}, mode: 'push', params: {}, label: '偏好设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.stats.open', from: '/settings/main', to: '/stats/record', search: {}, searchParams: {}, mode: 'push', params: {}, label: '记录统计', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.mindmap.open', from: '/settings/main', to: '/mind/map', search: {}, searchParams: {}, mode: 'push', params: {}, label: '认知地图', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'settings.ai.open', from: '/settings/main', to: '/settings/ai', search: {}, searchParams: {}, mode: 'push', params: {}, label: 'AI设置', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'data.importExport.open', from: '/settings/main', to: '/data/importExport', search: {}, searchParams: {}, mode: 'push', params: {}, label: '导出/导入', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'notifications.pro-open', from: '/notifications', to: '/pro/intro', search: {}, searchParams: {}, mode: 'push', params: {}, label: '通知内『点击续费』(PRO类通知)', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
    { id: 'home.empty.compose', from: '/home/empty', to: '/compose/editor', search: {}, searchParams: {}, mode: 'push', params: {}, label: '写第一条笔记', ui: { placement: 'content', icon: 'arrow', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
