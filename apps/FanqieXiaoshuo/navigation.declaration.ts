/**
 * 番茄免费小说 声明式导航 —— 由 docs/fanqiexiaoshuo-replication/spec.json v1.0-frozen 编译。
 * 弹层(阅读器菜单/目录/设置/点评/弹窗)走 searchParams(URL 驱动 UI 合同);
 * 纯返回/关闭走 system.back(bindBack,不建声明)。
 */
import type { NavigationDeclaration } from './navigation.types';

const sc = (name: string, description: string, direction: 'vertical' | 'horizontal' = 'vertical') =>
  ({ name, direction, description }) as const;
const ds = (ref: string, param: string, labelField?: string) =>
  ({ ref, paramMapping: { [param]: 'id' }, labelField }) as const;

export const NAVIGATION_DECLARATION = {
  app: 'fanqiexiaoshuo',
  routes: [
    // ---------------- 书城首页 ----------------
    {
      path: '/',
      component: 'HomePage',
      params: {},
      entryPoint: 'home',
      scrollContainers: [sc('home-feed', '首页推荐流')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.home.base', search: {}, description: '书城首页(channel= 切换频道)',
          actions: [
            { id: 'home.channel.select.target', label: '切换频道(推荐/小说/新书)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.channel.disabled', label: '范围外频道(听书/看剧等,toast暂未开放)', behavior: 'other' },
            { id: 'home.rankcard.select.target', label: '榜单卡子tab切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'home.shuhuang.disabled', label: '书荒广场(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { channel: 'string', rtab: 'string' },
      description: '书城首页:搜索栏+分类入口+频道tab+推荐榜卡+双列书流',
    },
    // ---------------- 排行榜 ----------------
    {
      path: '/rank',
      component: 'RankPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('rank-list', '榜单列表')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.rank.base', search: {}, description: '完整排行榜(cat=小说/出版,sub=子榜)',
          actions: [
            { id: 'rank.cat.select.target', label: '一级类目切换(小说/出版)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'rank.sub.select.target', label: '左侧子榜切换', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'rank.cat.disabled', label: '范围外类目(短剧/漫剧/听书)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { cat: 'string', sub: 'string' },
      description: '完整排行榜页',
    },
    // ---------------- 分类 ----------------
    {
      path: '/category',
      component: 'CategoryPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('category-tags', '标签流')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.category.base', search: {}, description: '分类页(channel=male/female)',
          actions: [
            { id: 'category.channel.select.target', label: '频道切换(男生/女生)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'category.channel.disabled', label: '范围外频道(听书/出版/短剧/漫画)', behavior: 'other' },
            { id: 'category.group.select.target', label: '左侧分组定位', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { channel: 'string', group: 'string' },
      description: '分类页:频道tab+左分组栏+标签chip流',
    },
    {
      path: '/category/tag',
      component: 'TagResultPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('tag-result', '标签书目列表')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.tagresult.base', search: {}, description: '标签结果页(tag=词,sort=排序)',
          actions: [
            { id: 'tagresult.sort.select.target', label: '排序切换(综合/热门/新书/高分)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'tagresult.tag.select.target', label: '标签chip切换', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { tag: 'string', sort: 'string' },
      description: '标签结果页',
    },
    // ---------------- 搜索 ----------------
    {
      path: '/search',
      component: 'SearchLandingPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-landing', '搜索中间页')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.search.base', search: {}, description: '搜索中间页(历史+热搜;输入即联想)',
          actions: [
            { id: 'search.keyword.input', label: '输入关键词(出联想)', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'search.history.clear', label: '清空搜索历史', behavior: 'other' },
            { id: 'search.ai.disabled', label: 'AI搜索入口(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '搜索中间页',
    },
    {
      path: '/search/result',
      component: 'SearchResultPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('search-result', '搜索结果列表')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.searchresult.base', search: {}, description: '搜索结果页(q=词)',
          actions: [
            { id: 'searchresult.tab.disabled', label: '综合以外结果tab(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { q: 'string' },
      description: '搜索结果页',
    },
    // ---------------- 书籍 ----------------
    {
      path: '/book/:id',
      component: 'BookDetailPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('book-detail', '书籍详情')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.bookdetail.base', search: {}, description: '书籍详情(沉浸式)',
          actions: [
            { id: 'bookdetail.follow.toggle', label: '关注作者', behavior: 'toggle' },
            { id: 'bookdetail.tab.disabled', label: '改编剧/听书tab(暂未开放)', behavior: 'other' },
            { id: 'bookdetail.buy.submit', label: '实体书购买(系统收银台 ACTION_PAY)', behavior: 'other' },
          ],
        },
        { id: 'fanqiexiaoshuo.bookdetail.intro', search: { intro: 'open' }, description: '简介半屏弹层' },
        {
          id: 'fanqiexiaoshuo.bookdetail.cover', search: { cover: 'open' }, description: '封面全屏大图',
          actions: [
            { id: 'bookdetail.cover.save', label: '保存封面到系统相册(albumBridge)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '书籍详情页',
    },
    {
      path: '/book/:id/reviews',
      component: 'ReviewsPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('reviews-list', '书评列表')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.reviews.base', search: {}, description: '书评列表页',
          actions: [
            { id: 'reviews.like.toggle', label: '书评点赞', behavior: 'toggle' },
            { id: 'reviews.filter.select.target', label: '筛选chips(全部/最新/最多赞)', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { filter: 'string' },
      description: '书评列表页',
    },
    {
      path: '/book/:id/review/write',
      component: 'ReviewWritePage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.reviewwrite.base', search: {}, description: '点评此书(写书评)',
          actions: [
            { id: 'reviewwrite.star.select.target', label: '设定星级', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'reviewwrite.text.input', label: '输入书评正文', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'reviewwrite.topic.toggle', label: '选中/取消话题', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: { stars: 'string' },
      description: '写书评页',
    },
    // ---------------- 阅读器(核心) ----------------
    {
      path: '/reader/:id',
      component: 'ReaderPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('reader-body', '正文(上下滚动模式)')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.reader.base', search: {}, description: '正文沉浸态(ch=章节下标);菜单开合走 reader.menu-open 转换+back(URL驱动)',
          actions: [
            { id: 'reader.page.next', label: '点右侧翻下一页', behavior: 'other' },
            { id: 'reader.page.prev', label: '点左侧翻上一页', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.reader.menu', search: { menu: 'open' }, description: '菜单浮层',
          actions: [
            { id: 'reader.shelf.add', label: '加入书架', behavior: 'other' },
            { id: 'reader.chapter.prev', label: '上一章', behavior: 'other' },
            { id: 'reader.chapter.next', label: '下一章', behavior: 'other' },
            { id: 'reader.progress.seek', label: '拖动进度条跳页', behavior: 'input', paramsSchema: { value: 'string' } },
            { id: 'reader.download.disabled', label: '下载(暂未开放)', behavior: 'other' },
            { id: 'reader.share.submit', label: '分享(系统分享 ACTION_SEND,无目标回落剪贴板)', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.reader.catalog', search: { panel: 'catalog' }, description: '目录页(详情/目录/笔记)',
          actions: [
            { id: 'readercatalog.chapter.select.target', label: '点章节跳转', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'readercatalog.tab.select.target', label: '详情/目录/笔记tab', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'readercatalog.order.toggle', label: '正/倒序', behavior: 'toggle' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.reader.settings', search: { panel: 'settings' }, description: '设置面板',
          actions: [
            { id: 'readersettings.fontsize.select.target', label: '字号A+/A-', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'readersettings.theme.select.target', label: '主题色7档', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'readersettings.pagemode.select.target', label: '翻页方式(覆盖/上下)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'readersettings.misc.disabled', label: '亮度/字体/间距等(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.reader.ratepanel', search: { panel: 'rate' }, description: '点评弹层(⋮)',
          actions: [
            { id: 'ratepanel.star.select.target', label: '轻按星星点评', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'ratepanel.misc.disabled', label: '送礼物/书圈/书签(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.reader.nightdialog', search: { dialog: 'night' }, description: '切换夜间确认弹窗',
          actions: [
            { id: 'reader.night.confirm', label: '确认切夜间', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.reader.exitdialog', search: { dialog: 'exit' }, description: '退出挽留弹窗(未加书架+达时长)',
          actions: [
            { id: 'reader.exit.addshelf', label: '加入书架并退出', behavior: 'other' },
            { id: 'reader.exit.decline', label: '暂不加入并退出', behavior: 'other' },
          ],
        },
      ],
      queryParams: { ch: 'string', ctab: 'string' },
      description: '阅读器(正文/菜单/目录/设置/点评/弹窗);menu/panel/dialog 为离散uiState键,不入queryParams',
    },
    // ---------------- 书架 / 历史 ----------------
    {
      path: '/shelf',
      component: 'ShelfPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('shelf-grid', '书架网格')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.shelf.base', search: {}, description: '书架普通态',
          actions: [
            { id: 'shelf.filter.select.target', label: '筛选chips(全部/阅读)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'shelf.tab.disabled', label: '收藏/圈子tab(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.shelf.edit', search: { edit: '1' }, description: '编辑态(勾选+删除)',
          actions: [
            { id: 'shelf.edit.select.target', label: '勾选书籍', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'shelf.edit.selectall.toggle', label: '全选', behavior: 'toggle' },
            { id: 'shelf.edit.delete', label: '删除(二次确认)', behavior: 'other' },
            { id: 'shelf.edit.misc.disabled', label: '找相似/分组/书单/桌面(暂未开放)', behavior: 'other' },
          ],
        },
        { id: 'fanqiexiaoshuo.shelf.deletedialog', search: { edit: '1', dialog: 'delete' }, description: '删除确认弹窗' },
      ],
      queryParams: { filter: 'string' },
      description: '书架页;edit/dialog 为离散uiState键,不入queryParams',
    },
    {
      path: '/history',
      component: 'HistoryPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('history-grid', '浏览历史网格')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.history.base', search: {}, description: '浏览历史(tab=all/reading)',
          actions: [
            { id: 'history.filter.select.target', label: 'tab过滤(全部/阅读)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'history.tab.disabled', label: '听书/短剧/漫剧tab(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '浏览历史页(书架历史tab与我的入口共用,Q11)',
    },
    // ---------------- 赚钱(福利中心) ----------------
    {
      path: '/welfare',
      component: 'WelfarePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('welfare-list', '福利任务列表')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.welfare.base', search: {}, description: '福利中心',
          actions: [
            { id: 'welfare.task.disabled', label: '范围外任务按钮(暂未开放)', behavior: 'other' },
            { id: 'welfare.tab.disabled', label: '福利商城/番茄柿集(暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.welfare.signin', search: { dialog: 'signin' }, description: '签到弹窗',
          actions: [
            { id: 'welfare.signin.do', label: '立即签到(+金币入账)', behavior: 'other' },
          ],
        },
      ],
      queryParams: {},
      description: '赚钱tab·福利中心;dialog 为离散uiState键,不入queryParams',
    },
    // ---------------- 我的 ----------------
    {
      path: '/me',
      component: 'MinePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('mine-body', '我的页')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.mine.base', search: {}, description: '我的页',
          actions: [
            { id: 'mine.grid.select.target', label: '宫格横滑翻页', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'mine.drawer.toggle', label: '打开右上角侧边抽屉', behavior: 'toggle' },
            { id: 'mine.nightmode.toggle', label: '右上角月亮:切换夜间模式(与阅读器同一设置)', behavior: 'toggle' },
            { id: 'mine.misc.disabled', label: '范围外入口(订单/作家/提现等,暂未开放)', behavior: 'other' },
          ],
        },
        {
          id: 'fanqiexiaoshuo.mine.drawer', search: { drawer: '1' }, description: '侧边抽屉(消息/历史/收益等入口)',
          actions: [
            { id: 'mine.drawer.entry.disabled', label: '抽屉内范围外入口(暂未开放)', behavior: 'other' },
          ],
        },
      ],
      queryParams: { grid: 'string' },
      description: '我的页(含侧边抽屉;drawer 为离散uiState键,不入queryParams)',
    },
    {
      path: '/me/profile',
      component: 'ProfilePage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('profile-body', '个人主页')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.profile.base', search: {}, description: '个人主页(tab=shelf/talk)',
          actions: [
            { id: 'profile.tab.select.target', label: 'tab切换(书架/讨论)', behavior: 'select', paramsSchema: { target: 'string' } },
            { id: 'profile.misc.disabled', label: '编辑资料等(暂未开放)', behavior: 'other' },
            { id: 'profile.avatar.pick', label: '点头像→系统相册选图换头像', behavior: 'other' },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '个人主页(简版)',
    },
    {
      path: '/me/earnings',
      component: 'EarningsPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('earnings-list', '收益记录')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.earnings.base', search: {}, description: '收益记录(tab=coin/cash)',
          actions: [
            { id: 'earnings.tab.select.target', label: '金币/现金记录切换', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
      ],
      queryParams: { tab: 'string' },
      description: '收益记录页(简版)',
    },
    {
      path: '/me/messages',
      component: 'MessagesPage',
      params: {},
      entryPoint: 'none',
      scrollContainers: [sc('messages-list', '消息列表')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.messages.base', search: {}, description: '我的消息:分类列表',
          actions: [
            { id: 'messages.category.select.target', label: '打开某类消息(内联详情)', behavior: 'select', paramsSchema: { target: 'string' } },
          ],
        },
        { id: 'fanqiexiaoshuo.messages.detail', search: { open: '*' }, description: '某类消息详情(内联);open 为离散uiState键,不入queryParams' },
      ],
      queryParams: {},
      description: '我的消息页(分类列表 + 内联详情)',
    },
    // ---------------- 作者 ----------------
    {
      path: '/author/:id',
      component: 'AuthorPage',
      params: { id: 'string' },
      entryPoint: 'none',
      scrollContainers: [sc('author-body', '作者主页')],
      uiStates: [
        {
          id: 'fanqiexiaoshuo.author.base', search: {}, description: '作者主页(简版)',
          actions: [
            { id: 'author.follow.toggle', label: '关注作者', behavior: 'toggle' },
          ],
        },
      ],
      queryParams: {},
      description: '作者主页(简版)',
    },
  ],
  transitions: [
    // ---- TabBar(chrome.tabbar,四格) ----
    { id: 'tabbar.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '书城 Tab', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'tabbar.welfare-open', from: '*', to: '/welfare', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '赚钱 Tab', ui: { placement: 'tabbar', icon: 'coin', gesture: 'tap' } },
    { id: 'tabbar.shelf-open', from: '*', to: '/shelf', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '书架 Tab', ui: { placement: 'tabbar', icon: 'library', gesture: 'tap' } },
    { id: 'tabbar.mine-open', from: '*', to: '/me', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '我的 Tab', ui: { placement: 'tabbar', icon: 'user', gesture: 'tap' } },

    // ---- 首页 ----
    { id: 'home.search-open', from: '/', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '点击搜索栏', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'home.category-open', from: '/', to: '/category', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '右上分类按钮', ui: { placement: 'topbar', icon: 'grid', gesture: 'tap' } },
    { id: 'home.rank-open', from: '/', to: '/rank', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '完整榜单>', ui: { placement: 'content', icon: 'rank', gesture: 'tap' } },
    { id: 'home.bookdetail-open', from: '/', to: '/book/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '书卡/榜单行(未读书)', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },
    { id: 'home.reader-open', from: '/', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '书卡(读过/在书架,直进阅读器续读 Q13)', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },

    // ---- 排行榜 ----
    { id: 'rank.bookdetail-open', from: '/rank', to: '/book/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '榜单行', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },

    // ---- 分类 ----
    { id: 'category.tagresult-open', from: '/category', to: '/category/tag', search: {}, searchParams: { tag: 'string' }, mode: 'push', params: {},
      label: '标签chip', ui: { placement: 'content', icon: 'tag', gesture: 'tap' } },
    { id: 'tagresult.bookdetail-open', from: '/category/tag', to: '/book/:id', mode: 'push', params: { id: 'string' },
      label: '标签结果点书直进阅读器(Q4)', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },

    // ---- 搜索 ----
    { id: 'search.result-open', from: '/search', to: '/search/result', search: {}, searchParams: { q: 'string' }, mode: 'push', params: {},
      label: '联想词/历史词/热搜词/搜索按钮', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },
    // 走查轮3 #1:navigation.ts 的 NAV_DEFAULTS 给这条挂了 popTo '/search'(inclusive),
    // 改词回收「中间页→结果页」这一段,搜索链路始终只占一条栈位
    { id: 'searchresult.search-open', from: '/search/result', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '点搜索框回中间页改词(回收上一轮搜索栈位)', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'searchresult.bookdetail-open', from: '/search/result', to: '/book/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '搜索结果书卡(未读)', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },
    { id: 'searchresult.reader-open', from: '/search/result', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '搜索结果书卡(读过,直进阅读器 Q13)', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },

    // ---- 书籍详情 ----
    // 走查轮3 #3:NAV_DEFAULTS 给下面两条挂了 popTo '/book/:id'(inclusive+collapse),
    // 详情只是进阅读器的中转页,进阅读器时弹掉它,阅读器返回一次即回来源页
    { id: 'bookdetail.reader-open', from: '/book/:id', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '左滑/点击开始阅读(Q6;详情不留在栈里)', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },
    { id: 'bookdetail.intro-open', from: '/book/:id', to: '/book/:id', search: { intro: 'open' }, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '简介[更多]弹层', ui: { placement: 'content', icon: 'more', gesture: 'tap' } },
    { id: 'bookdetail.introread-open', from: { path: '/book/:id', search: { intro: 'open' } }, to: '/reader/:id', search: { intro: null }, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '简介弹层[阅读正文]', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },
    { id: 'bookdetail.cover-open', from: '/book/:id', to: '/book/:id', search: { cover: 'open' }, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '点封面看大图', ui: { placement: 'content', icon: 'image', gesture: 'tap' } },
    { id: 'bookdetail.reviews-open', from: '/book/:id', to: '/book/:id/reviews', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '更多书评', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'bookdetail.author-open', from: '/book/:id', to: '/author/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '作者名/头像', ui: { placement: 'content', icon: 'user', gesture: 'tap' }, dataSource: ds('authors', 'id', 'name') },

    // ---- 书评 ----
    { id: 'reviews.write-open', from: '/book/:id/reviews', to: '/book/:id/review/write', search: {}, searchParams: { stars: 'string' }, mode: 'push', params: { id: 'string' },
      label: '评分头五星/添加追评', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'reviews.reader-open', from: '/book/:id/reviews', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '底部立即阅读/继续阅读', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },
    { id: 'reviewwrite.submit-open', from: '/book/:id/review/write', to: '/book/:id/reviews', search: {}, searchParams: {}, mode: 'replace', params: { id: 'string' },
      label: '发表(新书评置顶带[我]角标)', ui: { placement: 'topbar', icon: 'check', gesture: 'tap' } },

    // ---- 阅读器 面板/弹窗(searchParams 驱动) ----
    { id: 'reader.menu-open', from: '/reader/:id', to: '/reader/:id', search: { menu: 'open' }, searchParams: {}, preserveParams: ['ch', 'ctab'], mode: 'push', params: { id: 'string' },
      label: '点屏幕中央呼出菜单', ui: { placement: 'content', icon: 'menu', gesture: 'tap' } },
    { id: 'reader.catalog-open', from: { path: '/reader/:id', search: { menu: 'open' } }, to: '/reader/:id', search: { menu: null, panel: 'catalog' }, searchParams: {}, preserveParams: ['ch', 'ctab'], mode: 'push', params: { id: 'string' },
      label: '菜单[目录]', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'reader.settings-open', from: { path: '/reader/:id', search: { menu: 'open' } }, to: '/reader/:id', search: { menu: null, panel: 'settings' }, searchParams: {}, preserveParams: ['ch', 'ctab'], mode: 'push', params: { id: 'string' },
      label: '菜单[设置]', ui: { placement: 'content', icon: 'settings', gesture: 'tap' } },
    { id: 'reader.ratepanel-open', from: { path: '/reader/:id', search: { menu: 'open' } }, to: '/reader/:id', search: { menu: null, panel: 'rate' }, searchParams: {}, preserveParams: ['ch', 'ctab'], mode: 'push', params: { id: 'string' },
      label: '菜单[⋮]点评弹层(Q5)', ui: { placement: 'topbar', icon: 'more', gesture: 'tap' } },
    { id: 'reader.nightdialog-open', from: { path: '/reader/:id', search: { menu: 'open' } }, to: '/reader/:id', search: { dialog: 'night' }, searchParams: {}, preserveParams: ['ch', 'ctab'], mode: 'push', params: { id: 'string' },
      label: '菜单[夜间](确认弹窗)', ui: { placement: 'content', icon: 'moon', gesture: 'tap' } },
    { id: 'reader.bookdetail-open', from: { path: '/reader/:id', search: { panel: 'rate' } }, to: '/book/:id', search: { panel: null }, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '点评弹层[书籍详情]', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },
    { id: 'ratepanel.write-open', from: { path: '/reader/:id', search: { panel: 'rate' } }, to: '/book/:id/review/write', search: { panel: null }, searchParams: { stars: 'string' }, mode: 'push', params: { id: 'string' },
      label: '点评弹层星星→写书评(经确认弹窗)', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },

    // ---- 书架 / 历史 ----
    { id: 'shelf.reader-open', from: '/shelf', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '书封面直进阅读器续读', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },
    { id: 'shelf.edit-open', from: '/shelf', to: '/shelf', search: { edit: '1' }, searchParams: {}, mode: 'push', params: {},
      label: '编辑按钮/长按封面进编辑态(Q2)', ui: { placement: 'topbar', icon: 'edit', gesture: 'tap' } },
    { id: 'shelf.deletedialog-open', from: { path: '/shelf', search: { edit: '1' } }, to: '/shelf', search: { edit: '1', dialog: 'delete' }, searchParams: {}, mode: 'push', params: {},
      label: '编辑态[删除]确认弹窗', ui: { placement: 'content', icon: 'trash', gesture: 'tap' } },
    { id: 'shelf.history-open', from: '/shelf', to: '/history', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '书架顶部[历史]tab(与我的浏览历史同页 Q11)', ui: { placement: 'topbar', icon: 'clock', gesture: 'tap' } },
    { id: 'history.reader-open', from: '/history', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '历史书封直进阅读器续读', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },
    { id: 'history.bookdetail-open', from: '/history', to: '/book/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '历史书封(仅浏览过书封页的)进详情', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },

    // ---- 福利 ----
    { id: 'welfare.signin-open', from: '/welfare', to: '/welfare', search: { dialog: 'signin' }, searchParams: {}, mode: 'push', params: {},
      label: '[去签到]弹签到弹窗', ui: { placement: 'content', icon: 'coin', gesture: 'tap' } },
    { id: 'welfare.home-open', from: '/welfare', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '[去阅读]回书城', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },

    // ---- 我的 ----
    { id: 'mine.history-open', from: '/me', to: '/history', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '宫格[浏览历史]', ui: { placement: 'content', icon: 'clock', gesture: 'tap' } },
    { id: 'mine.search-open', from: '/me', to: '/search', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '顶部搜索框', ui: { placement: 'topbar', icon: 'search', gesture: 'tap' } },
    { id: 'mine.profile-open', from: '/me', to: '/me/profile', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '头像/昵称行', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'mine.earnings-open', from: '/me', to: '/me/earnings', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '金币区', ui: { placement: 'content', icon: 'coin', gesture: 'tap' } },
    { id: 'mine.messages-open', from: '/me', to: '/me/messages', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '宫格[我的消息]', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'mine.reader-open', from: '/me', to: '/reader/:id', search: {}, searchParams: { ch: 'string' }, mode: 'push', params: { id: 'string' },
      label: '最近阅读卡[继续阅读>]', ui: { placement: 'content', icon: 'book', gesture: 'tap' } },
    { id: 'mine.bookdetail-open', from: '/me', to: '/book/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '推荐流书卡', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },

    // ---- 作者 ----
    { id: 'author.bookdetail-open', from: '/author/:id', to: '/book/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '作品封面', ui: { placement: 'content', icon: 'book', gesture: 'tap' }, dataSource: ds('books', 'id', 'title') },
  ],
  capabilities: {
    historyBack: true,
  },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
