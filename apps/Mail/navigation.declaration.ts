/**
 * 邮件 App 导航声明 —— 静态分析、导航图与任务生成的真源。
 * 对应冻结底稿 docs/mail-replication/spec.json v1.0.0。
 *
 * 结构说明（与仓库里多数 App 不同）：本 App 无底部 TabBar，是三级导航栈
 *   邮箱首页 `/` → 邮件列表 `/mailbox/:mailboxId` → 邮件详情 `/message/:mailId`
 * 外加撰写页 `/compose` 与搜索页 `/search`。
 *
 * 两条建模约定：
 * 1. 所有关闭/返回（退出多选、退出筛选、关菜单、关弹层、Edit 完成、Cancel）一律 `bindBack()`，
 *    不声明成前进跳转，也不声明 action。
 * 2. Categories ↔ List View 是持久化设置（阶段③ Q15），存 store 而非 URL，
 *    以免和分类维度叠加成状态爆炸。
 */
import type { NavigationDeclaration } from './navigation.types';

const MAIN_SCROLL = [
  { name: 'main', direction: 'vertical', description: '页面主内容区' },
] as const;

const CATEGORY_SCROLL = [
  { name: 'main', direction: 'vertical', description: '邮件列表' },
  { name: 'categoryTabs', direction: 'horizontal', description: '顶部分类标签行' },
] as const;

export const NAVIGATION_DECLARATION = {
  app: 'mail',
  routes: [
    {
      path: '/',
      component: 'MailboxHomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'mail.home.base',
          search: {},
          description: '邮箱首页：智能邮箱组 + 按账号分组的文件夹',
          actions: [
            {
              id: 'mail.home.accountToggle',
              label: '展开/折叠某个账号分组',
              behavior: 'toggle',
              scope: 'item',
              paramsSchema: { accountId: 'string' },
            },
          ],
        },
        {
          id: 'mail.home.edit.open',
          search: { edit: '1' },
          description: 'Edit 编辑模式：勾选显示哪些智能邮箱 + 拖动排序',
          actions: [
            {
              id: 'mail.edit.toggleMailbox',
              label: '勾选/取消某个智能邮箱',
              behavior: 'toggle',
              scope: 'item',
              paramsSchema: { mailboxId: 'string' },
            },
            {
              id: 'mail.edit.moveUp',
              label: '把某个邮箱往上挪一位',
              behavior: 'other',
              scope: 'item',
              paramsSchema: { mailboxId: 'string' },
            },
            {
              id: 'mail.edit.moveDown',
              label: '把某个邮箱往下挪一位',
              behavior: 'other',
              scope: 'item',
              paramsSchema: { mailboxId: 'string' },
            },
          ],
        },
        {
          id: 'mail.home.newMailbox.open',
          search: { edit: '1', dialog: 'new-mailbox' },
          description: 'New Mailbox 新建文件夹表单',
          actions: [
            {
              id: 'mail.newMailbox.typeName',
              label: '输入文件夹名称',
              behavior: 'input',
              paramsSchema: { value: 'string' },
            },
            {
              id: 'mail.newMailbox.save',
              label: '保存新文件夹（需已选好位置才可用）',
              behavior: 'submit',
            },
          ],
        },
        {
          id: 'mail.home.location.open',
          search: { edit: '1', dialog: 'location' },
          description: 'Mailbox Location：选新文件夹挂在哪个账号下',
          actions: [
            {
              id: 'mail.location.select.account',
              label: '选择父级位置',
              behavior: 'select',
              scope: 'item',
              paramsSchema: { accountId: 'string' },
            },
          ],
        },
      ],
      queryParams: {},
      description: '邮箱首页',
    },
    {
      path: '/mailbox/:mailboxId',
      component: 'MailListPage',
      params: { mailboxId: 'string' },
      entryPoint: 'deepLink',
      scrollContainers: CATEGORY_SCROLL,
      uiStates: [
        {
          id: 'mail.list.base',
          search: {},
          description: '邮件列表（默认 Primary 分类）',
          // 注：左滑/右滑本身是行内本地 UI 状态（transform 位移），不声明成 action；
          // 声明的是滑开之后那几个按钮的动作。
          actions: [
            {
              id: 'mail.row.trash',
              label: '左滑后删除该邮件',
              behavior: 'other',
              scope: 'item',
              paramsSchema: { mailId: 'string' },
            },
            {
              id: 'mail.row.flag',
              label: '左滑后加/去橙旗',
              behavior: 'toggle',
              scope: 'item',
              paramsSchema: { mailId: 'string' },
            },
            {
              id: 'mail.row.toggleUnread',
              label: '右滑后切换已读/未读',
              behavior: 'toggle',
              scope: 'item',
              paramsSchema: { mailId: 'string' },
            },
            {
              id: 'mail.banner.dismiss',
              label: '关闭分类说明横幅',
              behavior: 'other',
            },
          ],
        },
        {
          id: 'mail.list.category.transactions',
          search: { category: 'transactions' },
          description: '交易分类（按发件人聚合）',
        },
        {
          id: 'mail.list.category.updates',
          search: { category: 'updates' },
          description: '更新分类（按发件人聚合）',
        },
        {
          id: 'mail.list.category.promotions',
          search: { category: 'promotions' },
          description: '促销分类（按发件人聚合）',
        },
        {
          id: 'mail.list.category.all',
          search: { category: 'all' },
          description: '全部邮件',
        },
        {
          id: 'mail.list.select.open',
          search: { select: '1' },
          description: '多选模式',
          actions: [
            {
              id: 'mail.select.toggleOne',
              label: '勾选/取消某封邮件',
              behavior: 'toggle',
              scope: 'item',
              paramsSchema: { mailId: 'string' },
            },
            { id: 'mail.select.all', label: '全选当前列表', behavior: 'other' },
            { id: 'mail.select.trash', label: '批量删除', behavior: 'submit' },
            { id: 'mail.select.flag', label: '批量加旗', behavior: 'submit' },
          ],
        },
        {
          id: 'mail.list.moreMenu.open',
          search: { menu: 'more' },
          description: '⋯ 显示设置菜单',
          actions: [
            { id: 'mail.viewMode.select.categories', label: '切到分类模式', behavior: 'select' },
            { id: 'mail.viewMode.select.listView', label: '切到纯列表模式', behavior: 'select' },
            { id: 'mail.moreMenu.about', label: '关于分类（暂未开放）', behavior: 'other' },
            { id: 'mail.moreMenu.contactPhotos', label: '开关联系人头像', behavior: 'toggle' },
          ],
        },
        {
          id: 'mail.list.filter.open',
          search: { filter: 'unread' },
          description: '筛选态：只看未读',
        },
        {
          id: 'mail.list.context.open',
          search: { sheet: 'context' },
          description: '长按邮件的操作菜单',
          actions: [
            { id: 'mail.context.trash', label: '删除', behavior: 'submit' },
            { id: 'mail.context.flag', label: '加/去旗', behavior: 'toggle' },
            { id: 'mail.context.markRead', label: '标为已读', behavior: 'other' },
            { id: 'mail.context.moveJunk', label: '移到垃圾邮件', behavior: 'submit' },
            { id: 'mail.context.notifyMe', label: '通知我', behavior: 'toggle' },
            { id: 'mail.context.mute', label: '静音会话', behavior: 'toggle' },
          ],
        },
        {
          id: 'mail.list.remind.open',
          search: { sheet: 'remind' },
          description: 'Remind Me 子菜单',
          actions: [
            {
              id: 'mail.remind.select.option',
              label: '选择提醒时间',
              behavior: 'select',
              paramsSchema: { option: 'string' },
            },
          ],
        },
        {
          id: 'mail.list.move.open',
          search: { sheet: 'move' },
          description: 'Move Message：选目标文件夹',
          actions: [
            {
              id: 'mail.move.select.folder',
              label: '选择目标文件夹',
              behavior: 'select',
              scope: 'item',
              paramsSchema: { folder: 'string' },
            },
          ],
        },
      ],
      queryParams: { mid: 'string' },
      description: '邮件列表页',
    },
    {
      path: '/message/:mailId',
      component: 'MessageDetailPage',
      params: { mailId: 'string' },
      entryPoint: 'deepLink',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'mail.detail.base',
          search: {},
          description: '邮件详情（含会话线程）',
          actions: [
            { id: 'mail.detail.expandHeader', label: '展开 From / To / 时间', behavior: 'toggle' },
            { id: 'mail.detail.trash', label: '删除并返回', behavior: 'submit' },
            { id: 'mail.detail.attachment', label: '附件卡片（暂未开放）', behavior: 'other' },
            { id: 'mail.detail.link', label: '正文超链接（暂未开放）', behavior: 'other' },
            {
              id: 'mail.thread.expand',
              label: '就地展开会话里折叠的某封',
              behavior: 'toggle',
              scope: 'item',
              paramsSchema: { mailId: 'string' },
            },
            { id: 'mail.thread.seeMore', label: '展开被截断的长正文', behavior: 'toggle' },
          ],
        },
        {
          id: 'mail.detail.addr.open',
          search: { addr: 'open' },
          description: '点地址弹出的菜单',
          actions: [
            { id: 'mail.addr.copy', label: '复制地址', behavior: 'other' },
            { id: 'mail.addr.contactCard', label: '查看联系人名片（暂未开放）', behavior: 'other' },
          ],
        },
        {
          id: 'mail.detail.move.open',
          search: { sheet: 'move' },
          description: '详情页的 Move 目标选择',
          actions: [
            {
              id: 'mail.detailMove.select.folder',
              label: '选择目标文件夹',
              behavior: 'select',
              scope: 'item',
              paramsSchema: { folder: 'string' },
            },
          ],
        },
      ],
      queryParams: { addrValue: 'string' },
      description: '邮件详情页',
    },
    {
      path: '/compose',
      component: 'ComposePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'mail.compose.base',
          search: {},
          description: '撰写邮件（新建 / 回复 / 转发 / 继续草稿）',
          actions: [
            {
              id: 'mail.compose.typeTo',
              label: '输入收件人',
              behavior: 'input',
              paramsSchema: { value: 'string' },
            },
            {
              id: 'mail.compose.typeSubject',
              label: '输入主题',
              behavior: 'input',
              paramsSchema: { value: 'string' },
            },
            {
              id: 'mail.compose.typeBody',
              label: '输入正文',
              behavior: 'input',
              paramsSchema: { value: 'string' },
            },
            { id: 'mail.compose.expandFields', label: '展开 Cc / Bcc / From', behavior: 'toggle' },
            {
              id: 'mail.composeFrom.select.account',
              label: '切换发送账号',
              behavior: 'select',
              paramsSchema: { accountId: 'string' },
            },
            { id: 'mail.compose.send', label: '发送', behavior: 'submit' },
            { id: 'mail.compose.attachment', label: '附件卡片（暂未开放）', behavior: 'other' },
          ],
        },
        {
          id: 'mail.compose.reply.open',
          search: { mode: 'reply' },
          description: '回复 / 全部回复的预填撰写态',
        },
        {
          id: 'mail.compose.forward.open',
          search: { mode: 'forward' },
          description: '转发的预填撰写态',
        },
        {
          id: 'mail.compose.contacts.open',
          search: { sheet: 'contacts' },
          description: 'Contacts 选联系人',
          actions: [
            {
              id: 'mail.contacts.select.contact',
              label: '选中某个联系人回填到收件人',
              behavior: 'select',
              scope: 'item',
              paramsSchema: { contactId: 'string' },
            },
            {
              id: 'mail.contacts.search',
              label: '按姓名过滤联系人',
              behavior: 'input',
              paramsSchema: { value: 'string' },
            },
          ],
        },
        {
          id: 'mail.compose.closeConfirm.open',
          search: { sheet: 'close-confirm' },
          description: '关闭未写完草稿的三选确认',
          actions: [
            { id: 'mail.closeConfirm.save', label: '存储草稿', behavior: 'submit' },
            { id: 'mail.closeConfirm.delete', label: '删除草稿', behavior: 'submit' },
          ],
        },
      ],
      // mode 不列在这里：它是 uiStates 枚举的离散维度（base / reply / forward），
      // 列进 queryParams 会让分析器把它当无界动态参数，导致目标节点找不到。
      queryParams: { src: 'string', draft: 'string', all: 'string', picked: 'string' },
      description: '撰写页',
    },
    {
      path: '/search',
      component: 'SearchPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        {
          id: 'mail.search.base',
          search: {},
          description: '搜索页',
          actions: [
            {
              id: 'mail.search.type',
              label: '输入搜索词',
              behavior: 'input',
              paramsSchema: { value: 'string' },
            },
            {
              id: 'mail.searchScope.select.scope',
              label: '切换 All Mailboxes / Current Mailbox',
              behavior: 'select',
              paramsSchema: { scope: 'string' },
            },
            { id: 'mail.search.clear', label: '清空搜索词', behavior: 'other' },
            { id: 'mail.search.voice', label: '语音输入（暂未开放）', behavior: 'other' },
          ],
        },
      ],
      queryParams: { q: 'string' },
      description: '搜索页',
    },
  ],

  transitions: [
    // ——— 首页出发 ———
    {
      id: 'mailbox.open',
      from: '/',
      to: '/mailbox/:mailboxId',
      search: {},
      searchParams: {},
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '打开某个邮箱或文件夹',
      ui: { placement: 'content', icon: 'IcInbox', gesture: 'tap' },
    },
    {
      id: 'home.edit.enter',
      from: { path: '/', search: { edit: null } },
      to: '/',
      search: { edit: '1' },
      searchParams: {},
      mode: 'push',
      params: {},
      label: '进入 Edit 编辑模式',
      ui: { placement: 'topbar', icon: 'IcCheck', gesture: 'tap' },
    },
    {
      id: 'home.newMailbox.open',
      from: { path: '/', search: { edit: '1', dialog: null } },
      to: '/',
      search: { edit: '1', dialog: 'new-mailbox' },
      searchParams: {},
      mode: 'push',
      params: {},
      label: '打开 New Mailbox 表单',
      ui: { placement: 'content', icon: 'IcNewFolder', gesture: 'tap' },
    },
    {
      id: 'newMailbox.location.open',
      from: { path: '/', search: { edit: '1', dialog: 'new-mailbox' } },
      to: '/',
      search: { edit: '1', dialog: 'location' },
      searchParams: {},
      preserveParams: ['name', 'loc'],
      mode: 'push',
      params: {},
      label: '打开 Mailbox Location 选择页',
      ui: { placement: 'content', icon: 'IcFolder', gesture: 'tap' },
    },

    // ——— 列表页内的离散状态 ———
    {
      id: 'list.category.switch',
      from: { path: '/mailbox/:mailboxId', search: { select: null, sheet: null } },
      to: '/mailbox/:mailboxId',
      search: {},
      searchParams: { category: 'string' },
      mode: 'replace',
      params: { mailboxId: 'string' },
      label: '切换分类标签',
      ui: { placement: 'content', icon: 'IcPrimary', gesture: 'tap' },
    },
    {
      id: 'list.select.enter',
      from: { path: '/mailbox/:mailboxId', search: { select: null } },
      to: '/mailbox/:mailboxId',
      search: { select: '1' },
      searchParams: {},
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '进入多选模式',
      ui: { placement: 'topbar', icon: 'IcSelectOn', gesture: 'tap' },
    },
    {
      id: 'list.moreMenu.open',
      from: { path: '/mailbox/:mailboxId', search: { menu: null } },
      to: '/mailbox/:mailboxId',
      search: { menu: 'more' },
      searchParams: {},
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '打开 ⋯ 显示设置菜单',
      ui: { placement: 'topbar', icon: 'IcMore', gesture: 'tap' },
    },
    {
      id: 'list.filter.enter',
      from: { path: '/mailbox/:mailboxId', search: { filter: null } },
      to: '/mailbox/:mailboxId',
      search: { filter: 'unread' },
      searchParams: {},
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '进入未读筛选态',
      ui: { placement: 'content', icon: 'IcFilter', gesture: 'tap' },
    },
    {
      // 两个入口：长按邮件行（主），以及左滑露出的 More 按钮（次，tap）。
      // gesture 按主入口声明为 longPress。一致性脚本只从 bind* 调用推断手势，
      // 而本 App 的长按是在 SwipeableRow 里自管计时 + 手写 data-trigger-type="longPress"
      // （原因见该文件注释：平台长按 hook 的 triggered 标志会串扰并吞掉点击），
      // 因此脚本会报一条 `gesture mismatch declared=longPress observed=tap` 的 WARN，属已知偏差。
      id: 'list.context.open',
      from: { path: '/mailbox/:mailboxId', search: { sheet: null } },
      to: '/mailbox/:mailboxId',
      search: { sheet: 'context' },
      searchParams: { mid: 'string' },
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '长按邮件打开操作菜单',
      ui: { placement: 'content', icon: 'IcMore', gesture: 'longPress' },
    },
    {
      id: 'list.remind.open',
      // 两个来源：邮件行右滑后的 Remind Me 按钮，以及长按菜单里的 Remind Me 项
      from: [
        { path: '/mailbox/:mailboxId', search: { sheet: null } },
        { path: '/mailbox/:mailboxId', search: { sheet: 'context' } },
      ],
      to: '/mailbox/:mailboxId',
      search: { sheet: 'remind' },
      searchParams: { mid: 'string' },
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '打开 Remind Me 子菜单',
      ui: { placement: 'content', icon: 'IcSendLater', gesture: 'tap' },
    },
    {
      id: 'list.move.open',
      from: { path: '/mailbox/:mailboxId', search: { sheet: null } },
      to: '/mailbox/:mailboxId',
      search: { sheet: 'move' },
      searchParams: { mid: 'string' },
      mode: 'push',
      params: { mailboxId: 'string' },
      label: '打开 Move Message 目标选择',
      ui: { placement: 'content', icon: 'IcFolder', gesture: 'tap' },
    },
    {
      id: 'list.contextMove.open',
      from: { path: '/mailbox/:mailboxId', search: { sheet: 'context' } },
      to: '/mailbox/:mailboxId',
      search: { sheet: 'move' },
      searchParams: { mid: 'string' },
      mode: 'replace',
      params: { mailboxId: 'string' },
      label: '从长按菜单转到 Move 目标选择',
      ui: { placement: 'content', icon: 'IcFolder', gesture: 'tap' },
    },

    // ——— 打开邮件详情 ———
    {
      id: 'message.open',
      from: '/mailbox/:mailboxId',
      to: '/message/:mailId',
      search: {},
      searchParams: {},
      mode: 'push',
      params: { mailId: 'string' },
      label: '打开邮件详情',
      ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' },
    },
    {
      id: 'search.result.open',
      from: '/search',
      to: '/message/:mailId',
      search: {},
      searchParams: {},
      mode: 'push',
      params: { mailId: 'string' },
      label: '从搜索结果打开邮件',
      ui: { placement: 'content', icon: 'IcChevronRight', gesture: 'tap' },
    },

    // ——— 详情页内 ———
    {
      id: 'detail.addr.open',
      from: { path: '/message/:mailId', search: { addr: null } },
      to: '/message/:mailId',
      search: { addr: 'open' },
      searchParams: { addrValue: 'string' },
      mode: 'push',
      params: { mailId: 'string' },
      label: '点地址弹出菜单',
      ui: { placement: 'content', icon: 'IcContactCard', gesture: 'tap' },
    },
    {
      id: 'detail.move.open',
      from: { path: '/message/:mailId', search: { sheet: null } },
      to: '/message/:mailId',
      search: { sheet: 'move' },
      searchParams: {},
      mode: 'push',
      params: { mailId: 'string' },
      label: '详情页打开 Move 目标选择',
      ui: { placement: 'content', icon: 'IcFolder', gesture: 'tap' },
    },
    {
      id: 'detail.addr.search',
      from: { path: '/message/:mailId', search: { addr: 'open' } },
      to: '/search',
      search: {},
      searchParams: { q: 'string' },
      mode: 'push',
      params: {},
      label: '从地址菜单搜索此人',
      ui: { placement: 'content', icon: 'IcSearch', gesture: 'tap' },
    },

    // ——— 撰写 ———
    {
      id: 'compose.open',
      from: ['/', '/mailbox/:mailboxId', '/message/:mailId'],
      to: '/compose',
      search: {},
      searchParams: {},
      mode: 'push',
      params: {},
      label: '撰写新邮件',
      ui: { placement: 'fab', icon: 'IcCompose', gesture: 'tap' },
    },
    {
      id: 'compose.reply',
      from: ['/mailbox/:mailboxId', '/message/:mailId'],
      to: '/compose',
      search: { mode: 'reply' },
      // all=1 表示 Reply All（额外把原抄送人也预填进 Cc）
      searchParams: { src: 'string', all: 'string' },
      mode: 'push',
      params: {},
      label: '回复 / 全部回复',
      ui: { placement: 'content', icon: 'IcReply', gesture: 'tap' },
    },
    {
      // 详情页底部只有 Trash / Move / Reply 三个键，Forward 只在长按菜单里，故来源只有列表页
      id: 'compose.forward',
      from: '/mailbox/:mailboxId',
      to: '/compose',
      search: { mode: 'forward' },
      searchParams: { src: 'string' },
      mode: 'push',
      params: {},
      label: '转发',
      ui: { placement: 'content', icon: 'IcForward', gesture: 'tap' },
    },
    {
      id: 'compose.editDraft',
      from: '/mailbox/:mailboxId',
      to: '/compose',
      search: {},
      searchParams: { draft: 'string' },
      mode: 'push',
      params: {},
      label: '继续编辑草稿',
      ui: { placement: 'content', icon: 'IcDrafts', gesture: 'tap' },
    },
    {
      id: 'compose.contacts.open',
      from: { path: '/compose', search: { sheet: null } },
      to: '/compose',
      search: { sheet: 'contacts' },
      searchParams: {},
      preserveParams: ['mode', 'src', 'draft'],
      mode: 'push',
      params: {},
      label: '打开 Contacts 选联系人',
      ui: { placement: 'content', icon: 'IcPlus', gesture: 'tap' },
    },
    {
      id: 'compose.closeConfirm.open',
      from: { path: '/compose', search: { sheet: null } },
      to: '/compose',
      search: { sheet: 'close-confirm' },
      searchParams: {},
      preserveParams: ['mode', 'src', 'draft'],
      mode: 'push',
      params: {},
      label: '关闭已写内容的草稿时弹三选确认',
      ui: { placement: 'topbar', icon: 'IcClose', gesture: 'tap' },
    },

    // ——— 搜索 ———
    {
      // 搜索框只在列表页底部工具栏里，首页（IMG_2162）底部只有撰写键，故来源不含 '/'
      id: 'search.open',
      from: '/mailbox/:mailboxId',
      to: '/search',
      search: {},
      searchParams: {},
      mode: 'push',
      params: {},
      label: '打开搜索',
      ui: { placement: 'content', icon: 'IcSearch', gesture: 'tap' },
    },
  ],

  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
