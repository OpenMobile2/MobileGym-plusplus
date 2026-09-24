import type { NavigationDeclaration } from './navigation.types';

/**
 * 卡皮记账 导航 FSM —— 单一事实源(对应 docs/kapi-replication/spec.json v1.0.0)。
 *
 * 弹层建模:16 个 kind=sheet 节点用共享 `?sheet=<name>` searchParam 覆盖层实现
 * (AppShell 顶层 SheetHost 渲染)。sheet 的原地动作挂在「主要父路由」的 sheet uiState 上;
 * 由于 sheet 内容渲染在共享组件(非 page),一致性校验器对其 from/usage-route 不做校验
 * (仅校验:used transition/action 必须 declared + actionId 命名合同)。
 */
export const NAVIGATION_DECLARATION = {
  app: 'kapi',
  routes: [
    // ===== home.feed =====
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [{ name: 'home-feed', direction: 'vertical', description: '首页记录流' }],
      uiStates: [
        {
          id: 'kapi.home.base',
          search: {},
          description: '首页/记录(月预算卡 + AI总结 + 记录明细 + 记一笔条)',
          actions: [
            { id: 'home.topCard.toggle.view', label: '收支/预算视图切换', behavior: 'toggle' },
            { id: 'home.amount.toggle.visible', label: '隐藏/显示金额', behavior: 'toggle' },
            { id: 'home.aiSummary.feedback.react', label: 'AI总结赞/踩/刷新', behavior: 'other' },
            { id: 'recordBar.quickEntry.noop', label: '快捷记账抽屉(相册/拍照/导入,暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'kapi.home.drawer',
          search: { sheet: 'drawer' },
          description: '侧拉抽屉·全部功能',
        },
        {
          id: 'kapi.home.record',
          search: { sheet: 'record' },
          description: '记账输入弹层(手动/AI)',
          actions: [
            { id: 'record.mode.select.tab', label: '手动记账/AI记录切换', behavior: 'select' },
            { id: 'record.type.select.tab', label: '支出/收入/转账切换', behavior: 'select' },
            { id: 'record.amount.input.value', label: '录入金额', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'record.note.input.value', label: '录入备注', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'record.submit.confirm.done', label: '完成(保存并关闭)', behavior: 'submit' },
            { id: 'record.submit.confirm.again', label: '再记(保存并续记)', behavior: 'submit' },
            { id: 'record.ai.submit.send', label: 'AI记录发送', behavior: 'submit' },
            { id: 'record.attach.noop', label: '相册/相机(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'kapi.home.voice',
          search: { sheet: 'voice' },
          description: '语音记账弹层(按住说话)',
          actions: [{ id: 'voice.record.input.speech', label: '按住说话(松手 mock 解析)', behavior: 'submit' }],
        },
        {
          id: 'kapi.home.category',
          search: { sheet: 'category' },
          description: '分类选择弹层',
          actions: [
            { id: 'category.type.select.tab', label: '支出/收入分类切换', behavior: 'select' },
            { id: 'category.pick.select.item', label: '选中分类回填', behavior: 'select', scope: 'item', paramsSchema: { categoryId: 'string' } },
          ],
        },
        {
          id: 'kapi.home.categoryEdit',
          search: { sheet: 'categoryEdit' },
          description: '分类方案管理(编辑/交易方/消费内容)',
          actions: [
            { id: 'categoryEdit.tab.select.section', label: '分类管理分段切换', behavior: 'select' },
            { id: 'categoryEdit.addCategory.noop', label: '添加分类(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'kapi.home.addRule',
          search: { sheet: 'addRule' },
          description: '添加分类识别规则',
          actions: [
            { id: 'addRule.trigger.input.value', label: '录入触发条件', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'addRule.submit.confirm.save', label: '保存识别规则', behavior: 'submit' },
          ],
        },
        {
          id: 'kapi.home.ledgerSwitch',
          search: { sheet: 'ledgerSwitch' },
          description: '账本切换',
          actions: [{ id: 'ledger.item.select.ledger', label: '切换当前账本', behavior: 'select', scope: 'item', paramsSchema: { ledgerId: 'string' } }],
        },
        {
          id: 'kapi.home.ledgerCreate',
          search: { sheet: 'ledgerCreate' },
          description: '新建账本(个人/共享)',
          actions: [
            { id: 'ledgerCreate.type.select.tab', label: '个人/共享切换', behavior: 'select' },
            { id: 'ledgerCreate.field.input.value', label: '录入账本属性', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'ledgerCreate.member.noop', label: '添加成员(无社交体系)', behavior: 'other' },
            { id: 'ledgerCreate.submit.confirm.create', label: '创建账本', behavior: 'submit' },
          ],
        },
        {
          id: 'kapi.home.datePick',
          search: { sheet: 'datePick' },
          description: '选择日期',
          actions: [
            { id: 'datePick.value.input.datetime', label: '选择日期时间', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'datePick.submit.confirm.done', label: '确定回填日期', behavior: 'submit' },
          ],
        },
        {
          id: 'kapi.home.ledgerPick',
          search: { sheet: 'ledgerPick' },
          description: '选择所属账本',
          actions: [{ id: 'ledgerPick.item.select.ledger', label: '选定账本回填', behavior: 'select', scope: 'item', paramsSchema: { ledgerId: 'string' } }],
        },
        {
          id: 'kapi.home.accountPick',
          search: { sheet: 'accountPick' },
          description: '选择账户',
          actions: [{ id: 'accountPick.none.select.option', label: '不关联已有账户', behavior: 'select' }],
        },
        {
          id: 'kapi.home.discount',
          search: { sheet: 'discount' },
          description: '优惠金额输入',
          actions: [
            { id: 'discount.type.select.tag', label: '选择优惠类型', behavior: 'select' },
            { id: 'discount.amount.input.value', label: '录入优惠金额', behavior: 'input', paramsSchema: { value: 'string' } },
          ],
        },
      ],
      queryParams: {},
      description: '首页/记录',
    },
    // ===== ai.chat =====
    {
      path: '/ai',
      component: 'AiChatPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'ai-chat', direction: 'vertical', description: '对话流' }],
      uiStates: [
        {
          id: 'kapi.ai.base',
          search: {},
          description: 'AI助手(胖咪)对话',
          actions: [
            { id: 'ai.message.submit.send', label: '发送消息', behavior: 'submit' },
            { id: 'ai.suggest.toggle.analysis', label: '灯泡-分析类提示词', behavior: 'toggle' },
            { id: 'ai.suggest.toggle.fun', label: '魔棒-趣味类提示词', behavior: 'toggle' },
            { id: 'ai.suggest.submit.pick', label: '选预设提示词发起对话', behavior: 'submit' },
            { id: 'ai.reply.feedback.react', label: '回复复制/刷新/赞踩', behavior: 'other' },
            { id: 'ai.voice.input.noop', label: '语音输入(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: 'AI助手',
    },
    // ===== stats.overview =====
    {
      path: '/stats',
      component: 'StatsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'stats', direction: 'vertical', description: '统计滚动区' }],
      uiStates: [
        {
          id: 'kapi.stats.base',
          search: {},
          description: '统计(周/月/年/自定义)',
          actions: [
            { id: 'stats.period.select.tab', label: '周期切换', behavior: 'select' },
            { id: 'stats.range.select.shift', label: '周期翻页', behavior: 'select' },
            { id: 'stats.flow.select.tab', label: '支出/收入切换', behavior: 'select' },
            { id: 'stats.trend.select.metric', label: '趋势口径切换', behavior: 'select' },
            { id: 'stats.list.toggle.expand', label: '展开全部', behavior: 'toggle' },
          ],
        },
        { id: 'kapi.stats.ledgerSwitch', search: { sheet: 'ledgerSwitch' }, description: '统计-账本切换弹层' },
        {
          id: 'kapi.stats.range',
          search: { sheet: 'statsRange' },
          description: '统计-自定义区间日历弹层(gate4:F5)',
          actions: [
            { id: 'statsRange.value.input.datetime', label: '点选起止日期', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'statsRange.submit.confirm.done', label: '确定回填区间', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '统计',
    },
    // ===== calendar.month =====
    {
      path: '/all',
      component: 'CalendarPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'calendar', direction: 'vertical', description: '日历视图滚动区' }],
      uiStates: [
        {
          id: 'kapi.calendar.base',
          search: {},
          description: '全部列表·日历视图',
          actions: [
            { id: 'calendar.day.select.date', label: '选中日期', behavior: 'select' },
            { id: 'calendar.month.select.shift', label: '翻月', behavior: 'select' },
            { id: 'calendar.today.select.reset', label: '回今天', behavior: 'select' },
            { id: 'calendar.ad.noop', label: '资讯/广告卡(wontfix)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '全部列表·日历视图',
    },
    // ===== category.detail =====
    {
      path: '/category/:id',
      component: 'CategoryDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [{ name: 'category-detail', direction: 'vertical', description: '分类下钻滚动区' }],
      uiStates: [
        {
          id: 'kapi.category.base',
          search: {},
          description: '分类下钻统计',
          actions: [
            { id: 'categoryDetail.month.select.period', label: '切换统计月份', behavior: 'select' },
            { id: 'categoryDetail.category.select.switch', label: '切换查看分类', behavior: 'select' },
            { id: 'categoryDetail.coupon.noop', label: '优惠卡领取(wontfix)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '分类下钻统计',
    },
    // ===== bill.detail =====
    {
      path: '/bill/:id',
      component: 'BillDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [{ name: 'bill-detail', direction: 'vertical', description: '账单详情滚动区' }],
      uiStates: [
        {
          id: 'kapi.bill.base',
          search: {},
          description: '账单详情',
          actions: [
            { id: 'billDetail.delete.confirm.remove', label: '删除账单', behavior: 'submit' },
            { id: 'billDetail.reimburse.toggle.flag', label: '是否报销', behavior: 'toggle' },
            { id: 'billDetail.excludeFlow.toggle.flag', label: '不计收支', behavior: 'toggle' },
            { id: 'billDetail.excludeBudget.toggle.flag', label: '不计预算', behavior: 'toggle' },
            { id: 'billDetail.tag.input.value', label: '编辑标签', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'billDetail.note.input.value', label: '编辑备注', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'billDetail.image.noop', label: '添加图片(wontfix)', behavior: 'other' },
          ],
        },
        {
          id: 'kapi.bill.refund',
          search: { sheet: 'refund' },
          description: '退款详情',
          actions: [{ id: 'refund.submit.confirm.save', label: '保存退款记录', behavior: 'submit' }],
        },
        {
          id: 'kapi.bill.payee',
          search: { sheet: 'payee' },
          description: '交易方选择',
          actions: [
            { id: 'payee.search.input.value', label: '输入交易方名', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'payee.pick.confirm.select', label: '选定交易方回填', behavior: 'submit' },
          ],
        },
        {
          id: 'kapi.bill.amountEdit',
          search: { sheet: 'amountEdit' },
          description: '详情-修改实付金额弹层(gate4:F3)',
          actions: [
            { id: 'amountEdit.amount.input.value', label: '录入新金额', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'amountEdit.submit.confirm.done', label: '保存新金额', behavior: 'submit' },
          ],
        },
        { id: 'kapi.bill.category', search: { sheet: 'category' }, description: '详情-分类选择弹层' },
        { id: 'kapi.bill.ledgerPick', search: { sheet: 'ledgerPick' }, description: '详情-账本选择弹层' },
        { id: 'kapi.bill.datePick', search: { sheet: 'datePick' }, description: '详情-日期弹层' },
        { id: 'kapi.bill.accountPick', search: { sheet: 'accountPick' }, description: '详情-账户弹层' },
        { id: 'kapi.bill.discount', search: { sheet: 'discount' }, description: '详情-优惠弹层' },
      ],
      queryParams: {},
      description: '账单详情',
    },
    // ===== bill.share =====
    {
      path: '/bill/share',
      component: 'SharePage',
      params: {},
      entryPoint: 'none',
      uiStates: [
        {
          id: 'kapi.share.base',
          search: {},
          description: '账单分享海报',
          actions: [
            { id: 'share.date.select.period', label: '切换海报统计日期', behavior: 'select' },
            { id: 'share.save.noop', label: '保存图片(mock)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '账单分享海报',
    },
    // ===== budget.manage =====
    {
      path: '/budget',
      component: 'BudgetPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'budget', direction: 'vertical', description: '预算管理滚动区' }],
      uiStates: [
        {
          id: 'kapi.budget.base',
          search: {},
          description: '预算管理',
          actions: [
            { id: 'budget.month.input.value', label: '查看/调整月预算', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'budget.day.select.date', label: '查看当日预算', behavior: 'select' },
            { id: 'budget.amount.toggle.visible', label: '隐藏/显示金额', behavior: 'toggle' },
          ],
        },
        {
          id: 'kapi.budget.addCat',
          search: { sheet: 'budgetAddCat' },
          description: '添加分类预算',
          actions: [{ id: 'budgetAdd.amount.input.value', label: '保存分类预算', behavior: 'input', paramsSchema: { value: 'string' } }],
        },
        {
          id: 'kapi.budget.editDay',
          search: { sheet: 'editDay' },
          description: '编辑日预算',
          actions: [{ id: 'editDay.amount.input.value', label: '修改该日预算', behavior: 'input', paramsSchema: { value: 'string' } }],
        },
        { id: 'kapi.budget.category', search: { sheet: 'category' }, description: '预算-分类选择弹层' },
      ],
      queryParams: {},
      description: '预算管理',
    },
    // ===== asset.main =====
    {
      path: '/asset',
      component: 'AssetMainPage',
      params: {},
      entryPoint: 'none',
      uiStates: [
        {
          id: 'kapi.asset.base',
          search: {},
          description: '资产',
          actions: [{ id: 'asset.amount.toggle.visible', label: '隐藏/显示净资产', behavior: 'toggle' }],
        },
      ],
      queryParams: {},
      description: '资产',
    },
    // ===== asset.addAccount =====
    {
      path: '/asset/add',
      component: 'AssetAddAccountPage',
      params: {},
      entryPoint: 'none',
      uiStates: [{ id: 'kapi.assetAdd.base', search: {}, description: '添加账户·类型选择' }],
      queryParams: {},
      description: '添加账户·类型选择',
    },
    // ===== asset.accountForm =====
    {
      path: '/asset/form',
      component: 'AssetAccountFormPage',
      params: {},
      entryPoint: 'none',
      uiStates: [
        {
          id: 'kapi.assetForm.base',
          search: {},
          description: '账户表单',
          actions: [
            { id: 'accountForm.field.input.value', label: '录入账户字段', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'accountForm.flag.toggle.option', label: '账户开关', behavior: 'toggle' },
            { id: 'accountForm.submit.confirm.save', label: '保存账户', behavior: 'submit' },
          ],
        },
      ],
      queryParams: { type: 'string' },
      description: '账户表单',
    },
    // ===== search.landing =====
    {
      path: '/search',
      component: 'SearchLandingPage',
      params: {},
      entryPoint: 'none',
      uiStates: [
        {
          id: 'kapi.search.base',
          search: {},
          description: '账单搜索',
          actions: [{ id: 'search.query.input.value', label: '输入关键词', behavior: 'input', paramsSchema: { value: 'string' } }],
        },
      ],
      queryParams: {},
      description: '账单搜索',
    },
    // ===== search.result =====
    {
      path: '/search/result',
      component: 'SearchResultPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'search-result', direction: 'vertical', description: '搜索结果列表' }],
      uiStates: [
        {
          id: 'kapi.searchResult.base',
          search: {},
          description: '搜索结果',
          actions: [
            { id: 'searchResult.sort.select.order', label: '切换排序', behavior: 'select' },
            { id: 'searchResult.clear.input.reset', label: '清空关键词', behavior: 'other' },
          ],
        },
      ],
      queryParams: { q: 'string' },
      description: '搜索结果',
    },
    // ===== profile.about =====
    {
      path: '/profile',
      component: 'ProfilePage',
      params: {},
      entryPoint: 'none',
      uiStates: [
        {
          id: 'kapi.profile.base',
          search: {},
          description: '关于你',
          actions: [
            { id: 'profile.field.input.value', label: '编辑昵称/手机字段', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'profile.benefit.noop', label: '权益条(wontfix)', behavior: 'other' },
            { id: 'profile.wechat.noop', label: '微信绑定(无账号体系)', behavior: 'other' },
          ],
        },
        {
          id: 'kapi.profile.genderPick',
          search: { sheet: 'genderPick' },
          description: '关于你-性别选择弹层(gate4:F6)',
          actions: [
            { id: 'profile.gender.select.option', label: '选择性别(男/女/保密)', behavior: 'select' },
          ],
        },
      ],
      queryParams: {},
      description: '关于你',
    },
    // ===== settings.main =====
    {
      path: '/settings',
      component: 'SettingsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [{ name: 'settings', direction: 'vertical', description: '设置列表' }],
      uiStates: [
        {
          id: 'kapi.settings.base',
          search: {},
          description: '设置',
          actions: [
            { id: 'settings.entry.noop', label: '月起始日/胖咔回复/货币/图标(stub)', behavior: 'other' },
            { id: 'settings.flag.toggle.option', label: '开关(自动记账/地点/优惠/推送)', behavior: 'toggle' },
            { id: 'settings.pushItem.toggle.option', label: '推送子项', behavior: 'toggle' },
            { id: 'settings.help.noop', label: '帮助与反馈/关于(wontfix)', behavior: 'other' },
            { id: 'settings.purge.confirm.delete', label: '删除所有历史账单', behavior: 'submit' },
          ],
        },
      ],
      queryParams: {},
      description: '设置',
    },
  ],
  transitions: [
    // ---- 顶部 Tab(记录 / AI助手)----
    { id: 'home.ai.open', from: '/', to: '/ai', search: {}, searchParams: {}, mode: 'replace', params: {}, label: 'AI助手 Tab', ui: { placement: 'topbar', icon: 'ai', gesture: 'tap' } },
    { id: 'ai.home.open', from: '/ai', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '记录 Tab', ui: { placement: 'topbar', icon: 'home', gesture: 'tap' } },

    // ---- 记一笔条(chrome) ----
    { id: 'recordBar.record.open', from: '/', to: '/', search: { sheet: 'record' }, searchParams: {}, mode: 'push', params: {}, label: '点击这里记一笔', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'recordBar.search.open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '记一笔条搜索', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'recordBar.voice.open', from: '/', to: '/', search: { sheet: 'voice' }, searchParams: {}, mode: 'push', params: {}, label: '语音波形图标', ui: { placement: 'content', icon: 'voice', gesture: 'tap' } },

    // ---- home.feed ----
    { id: 'home.drawer.open', from: '/', to: '/', search: { sheet: 'drawer' }, searchParams: {}, mode: 'push', params: {}, label: '三横线菜单', ui: { placement: 'topbar', icon: 'menu', gesture: 'tap' } },
    { id: 'home.search.open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {}, label: '顶栏搜索', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'home.ledger.open', from: '/', to: '/', search: { sheet: 'ledgerSwitch' }, searchParams: {}, mode: 'push', params: {}, label: '账本选择', ui: { placement: 'topbar', icon: 'ledger', gesture: 'tap' } },
    { id: 'home.stats.open', from: '/', to: '/stats', search: {}, searchParams: {}, mode: 'push', params: {}, label: '预算卡统计标签', ui: { placement: 'content', icon: 'chart', gesture: 'tap' } },
    { id: 'home.budget.open', from: '/', to: '/budget', search: {}, searchParams: {}, mode: 'push', params: {}, label: '月预算剩余跳预算管理', ui: { placement: 'content', icon: 'budget', gesture: 'tap' } },
    { id: 'home.asset.open', from: '/', to: '/asset', search: {}, searchParams: {}, mode: 'push', params: {}, label: '资产管理+', ui: { placement: 'content', icon: 'wallet', gesture: 'tap' } },
    { id: 'home.aiSummary.open', from: '/', to: '/ai', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '问问胖咪', ui: { placement: 'content', icon: 'ai', gesture: 'tap' } },
    { id: 'home.allList.open', from: '/', to: '/all', search: {}, searchParams: {}, mode: 'push', params: {}, label: '记录明细展开', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    { id: 'home.share.open', from: '/', to: '/bill/share', search: {}, searchParams: {}, mode: 'push', params: {}, label: '导出/分享', ui: { placement: 'content', icon: 'share', gesture: 'tap' } },
    { id: 'home.bill.open', from: '/', to: '/bill/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '账单行', ui: { placement: 'content', icon: 'bill', gesture: 'tap' }, dataSource: { ref: 'bills', paramMapping: { id: 'id' }, labelField: 'categoryName' } },

    // ---- record.input(弹层内,共享组件,from 不校验)----
    { id: 'record.category.open', from: '/', to: '/', search: { sheet: 'category' }, searchParams: {}, mode: 'push', params: {}, label: '分类/更多分类', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'record.date.open', from: '/', to: '/', search: { sheet: 'datePick' }, searchParams: {}, mode: 'push', params: {}, label: '日期胶囊', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    { id: 'record.ledger.open', from: '/', to: '/', search: { sheet: 'ledgerPick' }, searchParams: {}, mode: 'push', params: {}, label: '账本胶囊', ui: { placement: 'content', icon: 'ledger', gesture: 'tap' } },
    { id: 'record.account.open', from: '/', to: '/', search: { sheet: 'accountPick' }, searchParams: {}, mode: 'push', params: {}, label: '账户胶囊', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'record.discount.open', from: '/', to: '/', search: { sheet: 'discount' }, searchParams: {}, mode: 'push', params: {}, label: '优惠胶囊', ui: { placement: 'content', icon: 'discount', gesture: 'tap' } },
    { id: 'record.transferAccount.open', from: '/', to: '/', search: { sheet: 'accountPick' }, searchParams: {}, mode: 'push', params: {}, label: '转账扣款/入款账户', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },

    // ---- record.category ----
    { id: 'category.edit.open', from: '/', to: '/', search: { sheet: 'categoryEdit' }, searchParams: {}, mode: 'push', params: {}, label: '分类编辑入口', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    // ---- category.edit ----
    { id: 'categoryEdit.addRule.open', from: '/', to: '/', search: { sheet: 'addRule' }, searchParams: {}, mode: 'push', params: {}, label: '+添加识别规则', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    // ---- category.addRule ----
    { id: 'addRule.category.open', from: '/', to: '/', search: { sheet: 'category' }, searchParams: {}, mode: 'push', params: {}, label: '目标分类选择', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },

    // ---- category.detail ----
    { id: 'categoryDetail.sub.open', from: '/category/:id', to: '/category/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '子分类行', ui: { placement: 'content', icon: 'category', gesture: 'tap' } },
    { id: 'categoryDetail.bill.open', from: '/category/:id', to: '/bill/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '分类明细账单行', ui: { placement: 'content', icon: 'bill', gesture: 'tap' } },

    // ---- stats.overview ----
    { id: 'stats.ledger.open', from: '/stats', to: '/stats', search: { sheet: 'ledgerSwitch' }, searchParams: {}, mode: 'push', params: {}, label: '统计账本选择', ui: { placement: 'topbar', icon: 'ledger', gesture: 'tap' } },
    { id: 'stats.category.open', from: '/stats', to: '/category/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '分类构成行', ui: { placement: 'content', icon: 'category', gesture: 'tap' } },
    { id: 'stats.rankBill.open', from: '/stats', to: '/bill/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '单笔支出排行行', ui: { placement: 'content', icon: 'bill', gesture: 'tap' } },
    { id: 'stats.ai.open', from: '/stats', to: '/ai', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '胖咔卡前往AI助手', ui: { placement: 'content', icon: 'ai', gesture: 'tap' } },
    { id: 'stats.customRange.open', from: '/stats', to: '/stats', search: { sheet: 'statsRange' }, searchParams: {}, mode: 'push', params: {}, label: '自定义区间日历', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },

    // ---- calendar.month ----
    { id: 'calendar.bill.open', from: '/all', to: '/bill/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '日明细账单行', ui: { placement: 'content', icon: 'bill', gesture: 'tap' } },
    { id: 'calendar.record.open', from: '/all', to: '/', search: { sheet: 'record' }, searchParams: {}, mode: 'push', params: {}, label: '右下+悬浮记账', ui: { placement: 'fab', icon: 'edit', gesture: 'tap' } },

    // ---- bill.detail(整页,from=/bill/:id)----
    { id: 'billDetail.amount.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'amountEdit' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '实付金额(改额)', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'billDetail.category.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'category' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '分类行', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
    { id: 'billDetail.ledger.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'ledgerPick' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '所属账本行', ui: { placement: 'content', icon: 'ledger', gesture: 'tap' } },
    { id: 'billDetail.date.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'datePick' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '账单时间行', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    { id: 'billDetail.account.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'accountPick' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '付款账户行', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'billDetail.discount.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'discount' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '优惠金额行', ui: { placement: 'content', icon: 'discount', gesture: 'tap' } },
    { id: 'billDetail.refund.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'refund' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '退款行', ui: { placement: 'content', icon: 'refund', gesture: 'tap' } },
    { id: 'billDetail.payee.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'payee' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '交易方行', ui: { placement: 'content', icon: 'payee', gesture: 'tap' } },

    // ---- bill.refund(弹层内)----
    { id: 'refund.account.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'accountPick' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '退款账户', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },
    { id: 'refund.date.open', from: '/bill/:id', to: '/bill/:id', search: { sheet: 'datePick' }, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '退款时间', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },

    // ---- bill.accountPick ----
    { id: 'accountPick.addAccount.open', from: ['/', '/bill/:id'], to: '/asset/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '+添加账户', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },

    // ---- bill.share ----
    { id: 'share.close', from: '/bill/share', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '关闭分享', ui: { placement: 'topbar', icon: 'close', gesture: 'tap' } },

    // ---- budget.manage ----
    { id: 'budget.addCategory.open', from: '/budget', to: '/budget', search: { sheet: 'budgetAddCat' }, searchParams: {}, mode: 'push', params: {}, label: '添加分类预算+', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    { id: 'budget.editDay.open', from: '/budget', to: '/budget', search: { sheet: 'editDay' }, searchParams: {}, mode: 'push', params: {}, label: '长按日预算编辑', ui: { placement: 'content', icon: 'edit', gesture: 'longPress' } },
    // ---- budget.addCategory ----
    { id: 'budgetAdd.category.open', from: '/budget', to: '/budget', search: { sheet: 'category' }, searchParams: {}, mode: 'push', params: {}, label: '选择分类', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },

    // ---- asset.main ----
    { id: 'asset.addAccount.open', from: '/asset', to: '/asset/add', search: {}, searchParams: {}, mode: 'push', params: {}, label: '+添加账户', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },
    // ---- asset.addAccount ----
    { id: 'addAccount.type.open', from: '/asset/add', to: '/asset/form', search: {}, searchParams: { type: 'string' }, mode: 'push', params: {}, label: '账户类型项', ui: { placement: 'content', icon: 'card', gesture: 'tap' } },

    // ---- ledger.switch ----
    { id: 'ledger.create.open', from: '/', to: '/', search: { sheet: 'ledgerCreate' }, searchParams: {}, mode: 'push', params: {}, label: '+添加账本', ui: { placement: 'content', icon: 'plus', gesture: 'tap' } },

    // ---- more.drawer(弹层内)----
    { id: 'drawer.profile.open', from: '/', to: '/profile', search: {}, searchParams: {}, mode: 'push', params: {}, label: '头像/昵称', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'drawer.checkin.open', from: '/', to: '/budget', search: {}, searchParams: {}, mode: 'push', params: {}, label: '打卡日历跳预算日历', ui: { placement: 'content', icon: 'calendar', gesture: 'tap' } },
    { id: 'drawer.stats.open', from: '/', to: '/stats', search: {}, searchParams: {}, mode: 'push', params: {}, label: '图表统计', ui: { placement: 'content', icon: 'chart', gesture: 'tap' } },
    { id: 'drawer.asset.open', from: '/', to: '/asset', search: {}, searchParams: {}, mode: 'push', params: {}, label: '资产管理', ui: { placement: 'content', icon: 'wallet', gesture: 'tap' } },
    { id: 'drawer.ledger.open', from: '/', to: '/', search: { sheet: 'ledgerSwitch' }, searchParams: {}, mode: 'push', params: {}, label: '账本管理', ui: { placement: 'content', icon: 'ledger', gesture: 'tap' } },
    { id: 'drawer.budget.open', from: '/', to: '/budget', search: {}, searchParams: {}, mode: 'push', params: {}, label: '预算管理', ui: { placement: 'content', icon: 'budget', gesture: 'tap' } },
    { id: 'drawer.category.open', from: '/', to: '/', search: { sheet: 'categoryEdit' }, searchParams: {}, mode: 'push', params: {}, label: '分类管理', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'drawer.settings.open', from: '/', to: '/settings', search: {}, searchParams: {}, mode: 'push', params: {}, label: '设置', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },

    // ---- profile.about ----
    { id: 'profile.gender.open', from: '/profile', to: '/profile', search: { sheet: 'genderPick' }, searchParams: {}, mode: 'push', params: {}, label: '性别选择', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },

    // ---- search ----
    // NOTE: spec v1.0.0 漏给 search.landing→search.result 的 transitionId(search 否则成死链),
    //       实现期补 search.query.submit;待 specVersion 升版回写(对应 pipeline §6.5 开放问题)。
    { id: 'search.query.submit', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {}, label: '提交搜索词', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    { id: 'search.close', from: '/search', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {}, label: '关闭搜索', ui: { placement: 'topbar', icon: 'close', gesture: 'tap' } },
    { id: 'searchResult.bill.open', from: '/search/result', to: '/bill/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' }, label: '搜索结果账单行', ui: { placement: 'content', icon: 'bill', gesture: 'tap' } },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = (typeof NAVIGATION_DECLARATION.transitions)[number]['id'];
