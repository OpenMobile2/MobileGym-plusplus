// apps/Broadcast/navigation.declaration.ts — 苹果播客导航 FSM(spec v1.0.0 转写)
import type { NavigationDeclaration, ScrollContainerDeclaration } from './navigation.types';

const MAIN_SCROLL: ScrollContainerDeclaration[] = [
  { name: 'main', direction: 'vertical', description: '主内容纵向滚动' },
];
const H_SCROLL: ScrollContainerDeclaration[] = [
  { name: 'main', direction: 'vertical', description: '主内容纵向滚动' },
  { name: 'carousel', direction: 'horizontal', description: '横向卡片轮播' },
];

// 公用:四个主 Tab 的 from 约束之外都用 '*'(详情页可从多处进入)
export const NAVIGATION_DECLARATION = {
  app: 'broadcast',
  routes: [
    { path: '/', component: 'HomePage', params: {}, entryPoint: 'home',
      scrollContainers: H_SCROLL,
      uiStates: [{ id: 'broadcast.home.base', search: {}, description: '主页' }],
      queryParams: {}, description: '主页:待播清单 + 你的最爱节目' },

    { path: '/up-next', component: 'UpNextPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.upNext.base', search: {}, description: '待播清单' }],
      queryParams: {}, description: '待播清单列表' },

    { path: '/browse', component: 'BrowsePage', params: {}, entryPoint: 'none',
      scrollContainers: H_SCROLL,
      uiStates: [{ id: 'broadcast.browse.base', search: {}, description: '新发现' }],
      queryParams: {}, description: '新发现:精选/新节目/排行' },

    { path: '/browse/top-shows', component: 'TopShowsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.topShows.base', search: {}, description: '热门节目排行榜' }],
      queryParams: { genre: 'string' }, description: '热门节目排行榜' },

    { path: '/category/:id', component: 'CategoryPage', params: { id: 'string' }, entryPoint: 'none',
      scrollContainers: H_SCROLL,
      uiStates: [{ id: 'broadcast.category.base', search: {}, description: '类别详情' }],
      queryParams: {}, description: '类别/题材详情页' },

    { path: '/show/:id', component: 'ShowPage', params: { id: 'string' }, entryPoint: 'deepLink',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.show.base', search: {}, description: '节目详情', actions: [
        { id: 'broadcast.show.follow.toggle', label: '关注/取消关注', behavior: 'toggle', scope: 'item', paramsSchema: { showId: 'string' } },
        { id: 'broadcast.show.play', label: '播放节目', behavior: 'other', scope: 'item', paramsSchema: { showId: 'string' } },
        { id: 'broadcast.show.menu.open', label: '节目菜单', behavior: 'other' },
      ] }],
      queryParams: {}, description: '节目详情页' },

    { path: '/show/:id/episodes', component: 'ShowEpisodesPage', params: { id: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.showEpisodes.base', search: {}, description: '单集列表' }],
      queryParams: { filter: 'string' }, description: '节目单集列表' },

    { path: '/show/:id/reviews', component: 'ReviewsPage', params: { id: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.reviews.base', search: {}, description: '评分及评论', actions: [
        { id: 'broadcast.show.rate', label: '评分', behavior: 'other', scope: 'item', paramsSchema: { showId: 'string', stars: 'number' } },
      ] }],
      queryParams: {}, description: '评分及评论页' },

    { path: '/show/:id/write-review', component: 'WriteReviewPage', params: { id: 'string' }, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.writeReview.base', search: {}, description: '撰写评论', actions: [
        { id: 'broadcast.review.stars.set', label: '设置评论星级', behavior: 'other', paramsSchema: { value: 'number' } },
        { id: 'broadcast.review.title.input', label: '输入评论标题', behavior: 'input', paramsSchema: { value: 'string' } },
        { id: 'broadcast.review.body.input', label: '输入评论正文', behavior: 'input', paramsSchema: { value: 'string' } },
        { id: 'broadcast.review.submit', label: '提交评论', behavior: 'other', scope: 'item', paramsSchema: { showId: 'string' } },
      ] }],
      queryParams: {}, description: '撰写评论表单' },

    { path: '/episode/:id', component: 'EpisodePage', params: { id: 'string' }, entryPoint: 'deepLink',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.episode.base', search: {}, description: '单集详情', actions: [
        { id: 'broadcast.episode.play', label: '播放单集', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.save', label: '保存单集', behavior: 'toggle', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.download', label: '下载单集', behavior: 'toggle', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.menu.open', label: '单集菜单', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.chapter.seek', label: '章节跳转', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string', timeSec: 'number' } },
        { id: 'broadcast.episode.playNext', label: '插播', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.addQueue', label: '添加到队列', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.markPlayed', label: '标记为已播放', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.episode.removeUpNext', label: '从待播清单移除', behavior: 'other', scope: 'item', paramsSchema: { episodeId: 'string' } },
        { id: 'broadcast.share.open', label: '分享', behavior: 'other' },
      ] }],
      queryParams: {}, description: '单集详情页(简介/时光机/信息)' },

    { path: '/now-playing', component: 'NowPlayingPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [
        { id: 'broadcast.nowPlaying.base', search: {}, description: '正在播放',
          actions: [
            { id: 'broadcast.player.playpause.toggle', label: '播放/暂停', behavior: 'toggle' },
            { id: 'broadcast.player.skip.forward', label: '快进30秒', behavior: 'other' },
            { id: 'broadcast.player.skip.back', label: '后退15秒', behavior: 'other' },
            { id: 'broadcast.player.speed.cycle', label: '切换倍速', behavior: 'other' },
            { id: 'broadcast.player.sleep.set', label: '睡眠定时', behavior: 'other' },
            { id: 'broadcast.player.seek', label: '拖动进度', behavior: 'other' },
            { id: 'broadcast.player.airplay', label: 'AirPlay(暂未开放)', behavior: 'other' },
          ] },
        { id: 'broadcast.nowPlaying.queue', search: { view: 'queue' }, description: '播放队列/待播视图',
          actions: [
            { id: 'broadcast.player.queue.clear', label: '清除队列', behavior: 'other' },
          ] },
      ],
      queryParams: {}, description: '全屏播放器 + 队列' },

    { path: '/library', component: 'LibraryPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.library.base', search: {}, description: '资料库' }],
      queryParams: {}, description: '资料库首页' },

    { path: '/library/shows', component: 'LibraryShowsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.libraryShows.base', search: {}, description: '资料库›节目' }],
      queryParams: { segment: 'string' }, description: '资料库 节目列表' },

    { path: '/library/channels', component: 'LibraryChannelsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.libraryChannels.base', search: {}, description: '资料库›频道' }],
      queryParams: {}, description: '资料库 频道列表' },

    { path: '/channel/:id', component: 'ChannelPage', params: { id: 'string' }, entryPoint: 'none',
      scrollContainers: H_SCROLL,
      uiStates: [{ id: 'broadcast.channel.base', search: {}, description: '频道详情' }],
      queryParams: {}, description: '频道详情页' },

    { path: '/library/categories', component: 'LibraryCategoriesPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.libraryCategories.base', search: {}, description: '资料库›类别' }],
      queryParams: {}, description: '资料库 类别列表' },

    { path: '/library/saved', component: 'SavedPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.saved.base', search: {}, description: '已保存' }],
      queryParams: {}, description: '资料库 已保存单集' },

    { path: '/library/downloaded', component: 'DownloadedPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.downloaded.base', search: {}, description: '已下载' }],
      queryParams: {}, description: '资料库 已下载' },

    { path: '/library/latest', component: 'LatestPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.latest.base', search: {}, description: '最新单集' }],
      queryParams: {}, description: '最新单集 feed' },

    { path: '/search', component: 'SearchPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.search.base', search: {}, description: '搜索', actions: [
        { id: 'broadcast.search.input', label: '输入搜索词', behavior: 'input', paramsSchema: { value: 'string' } },
      ] }],
      queryParams: {}, description: '搜索:类别九宫格' },

    { path: '/search/results', component: 'SearchResultsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.searchResults.base', search: {}, description: '搜索结果(联想/分组标签)' }],
      queryParams: { q: 'string', tab: 'string', scope: 'string' }, description: '搜索结果页' },

    { path: '/account', component: 'AccountPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.account.base', search: {}, description: '账户', actions: [
        { id: 'broadcast.settings.open', label: '打开系统设置', behavior: 'other' },
      ] }],
      queryParams: {}, description: '账户模态页' },

    { path: '/account/notifications', component: 'NotificationsPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.notifications.base', search: {}, description: '通知设置',
        actions: [{ id: 'broadcast.notifications.toggle', label: '切换节目新单集通知', behavior: 'toggle', scope: 'item', paramsSchema: { showId: 'string' } }] }],
      queryParams: {}, description: '通知设置(逐节目开关)' },

    { path: '/account/categories', component: 'ManageCategoriesPage', params: {}, entryPoint: 'none',
      scrollContainers: MAIN_SCROLL,
      uiStates: [{ id: 'broadcast.manageCategories.base', search: {}, description: '管理喜爱类别', actions: [
        { id: 'broadcast.categories.toggle', label: '添加或移除喜爱类别', behavior: 'toggle', scope: 'item', paramsSchema: { genreId: 'string' } },
      ] }],
      queryParams: {}, description: '管理喜爱类别' },
  ],

  transitions: [
    // ---- 四个主 Tab(replace)----
    { id: 'broadcast.home-open', from: '*', to: '/', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '主页', ui: { placement: 'tabbar', icon: 'home', gesture: 'tap' } },
    { id: 'broadcast.browse-open', from: '*', to: '/browse', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '新发现', ui: { placement: 'tabbar', icon: 'grid', gesture: 'tap' } },
    { id: 'broadcast.library-open', from: '*', to: '/library', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '资料库', ui: { placement: 'tabbar', icon: 'podcast', gesture: 'tap' } },
    { id: 'broadcast.search-open', from: '*', to: '/search', search: {}, searchParams: {}, mode: 'replace', params: {},
      label: '搜索', ui: { placement: 'tabbar', icon: 'search', gesture: 'tap' } },

    // ---- 详情/子页(push)----
    { id: 'broadcast.upnext-open', from: ['/'], to: '/up-next', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '待播清单', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'broadcast.show-open', from: ['/', '/browse', '/library', '/search', '/up-next', '/show/:id', '/episode/:id', '/now-playing', '/category/:id', '/channel/:id', '/search/results', '/browse/top-shows', '/library/shows', '/library/downloaded'], to: '/show/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '节目详情', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.showEpisodes-open', from: ['/show/:id'], to: '/show/:id/episodes', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '查看全部单集', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'broadcast.showReviews-open', from: ['/show/:id'], to: '/show/:id/reviews', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '评分及评论', ui: { placement: 'content', icon: 'star', gesture: 'tap' } },
    { id: 'broadcast.showWriteReview-open', from: ['/show/:id', '/show/:id/reviews'], to: '/show/:id/write-review', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '撰写评论', ui: { placement: 'content', icon: 'edit', gesture: 'tap' } },
    { id: 'broadcast.episode-open', from: ['/', '/browse', '/library', '/search', '/up-next', '/show/:id', '/show/:id/episodes', '/episode/:id', '/now-playing', '/category/:id', '/channel/:id', '/search/results', '/library/saved', '/library/latest'], to: '/episode/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '单集详情', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.nowplaying-open', from: ['/', '/up-next', '/browse', '/browse/top-shows', '/category/:id', '/show/:id', '/show/:id/episodes', '/show/:id/reviews', '/episode/:id', '/now-playing', '/library', '/library/shows', '/library/channels', '/channel/:id', '/library/categories', '/library/saved', '/library/downloaded', '/library/latest', '/search', '/search/results'], to: '/now-playing', search: { view: null }, searchParams: {}, mode: 'push', params: {},
      label: '正在播放', ui: { placement: 'content', icon: 'play', gesture: 'tap' } },
    { id: 'broadcast.playerQueue-open', from: ['/now-playing'], to: '/now-playing', search: { view: 'queue' }, searchParams: {}, mode: 'push', params: {},
      label: '播放队列', ui: { placement: 'content', icon: 'list', gesture: 'tap' } },
    { id: 'broadcast.topShows-open', from: '*', to: '/browse/top-shows', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '热门节目排行', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.category-open', from: '*', to: '/category/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '类别详情', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },

    // ---- 资料库子页 ----
    { id: 'broadcast.libraryShows-open', from: ['/', '/library'], to: '/library/shows', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '节目', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.libraryChannels-open', from: '*', to: '/library/channels', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '频道', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.channel-open', from: '*', to: '/channel/:id', search: {}, searchParams: {}, mode: 'push', params: { id: 'string' },
      label: '频道详情', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.libraryCategories-open', from: '*', to: '/library/categories', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '类别', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.librarySaved-open', from: '*', to: '/library/saved', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '已保存', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.libraryDownloaded-open', from: '*', to: '/library/downloaded', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '已下载', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },
    { id: 'broadcast.libraryLatest-open', from: '*', to: '/library/latest', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '最新单集', ui: { placement: 'content', icon: 'chevron-right', gesture: 'tap' } },

    // ---- 搜索 ----
    { id: 'broadcast.searchResults-open', from: '*', to: '/search/results', search: {}, searchParams: { q: 'string' }, mode: 'push', params: { q: 'string' },
      label: '搜索结果', ui: { placement: 'content', icon: 'search', gesture: 'tap' } },

    // ---- 账户/设置 ----
    { id: 'broadcast.account-open', from: ['/', '/browse', '/library', '/search'], to: '/account', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '账户', ui: { placement: 'content', icon: 'user', gesture: 'tap' } },
    { id: 'broadcast.accountNotifications-open', from: '*', to: '/account/notifications', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '通知设置', ui: { placement: 'content', icon: 'bell', gesture: 'tap' } },
    { id: 'broadcast.accountCategories-open', from: '*', to: '/account/categories', search: {}, searchParams: {}, mode: 'push', params: {},
      label: '管理喜爱类别', ui: { placement: 'content', icon: 'grid', gesture: 'tap' } },
  ],

  capabilities: { historyBack: true },
} as const satisfies NavigationDeclaration;

export type TransitionId = typeof NAVIGATION_DECLARATION.transitions[number]['id'];
