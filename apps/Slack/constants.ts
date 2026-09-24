// Slack — 结构常量（固定 App 结构，不可由用户编辑）。可替换数据在 data/defaults.json。

/** 改动 defaults.json 结构时 +1，触发 store 重建 */
export const DATA_VERSION = 6;

/** 底栏 4 个标签。右侧的圆形搜索钮是分离元素，不在此列 */
export const TABS = [
  { id: 'home', path: '/', icon: 'IcHome', labelKey: 'tab.home' },
  { id: 'dms', path: '/dms', icon: 'IcDm', labelKey: 'tab.dms' },
  { id: 'activity', path: '/activity', icon: 'IcActivity', labelKey: 'tab.activity' },
  { id: 'more', path: '/more', icon: 'IcMore', labelKey: 'tab.more' },
] as const;

/**
 * 快速视图卡池。
 * ⚠️ 实测差异（IMG_2367 vs IMG_2381）：「自定义主页」弹层列出 5 行且开关均为开，
 * 但主页卡区只出现「抱团 / 留待以后处理 / 草稿和已发送」3 张。按实测渲染，
 * unreadTidy 与 threads 的开关只记录状态、不在主页出卡，不自行发明卡片形态。
 */
export const QUICK_VIEW_CARDS = [
  { id: 'unreadTidy', icon: 'IcUnreadTidy', labelKey: 'quick.unreadTidy', hasToggle: true, showOnHome: false },
  { id: 'threads', icon: 'IcThread', labelKey: 'quick.threads', hasToggle: true, showOnHome: false },
  { id: 'huddle', icon: 'IcHuddle', labelKey: 'quick.huddle', hasToggle: true, showOnHome: true },
  { id: 'saved', icon: 'IcSaved', labelKey: 'quick.saved', hasToggle: true, showOnHome: true },
  // 「草稿和已发送」卡的图标是纸飞机（IMG_2367），不是文档
  { id: 'drafts', icon: 'IcSend', labelKey: 'quick.drafts', hasToggle: false, showOnHome: true },
] as const;

/** 「接下来，你可以…」引导卡（Q3：保留，「全部清除」仅当次会话生效） */
export const GUIDE_CARDS = [
  { id: 'addMembers', icon: 'IcAddMember', labelKey: 'guide.addMembers', implemented: true },
  { id: 'sendMessage', icon: 'IcCompose', labelKey: 'guide.sendMessage', implemented: true },
  { id: 'desktop', icon: 'IcDesktop', labelKey: 'guide.desktop', implemented: false },
  { id: 'tips', icon: 'IcTip', labelKey: 'guide.tips', implemented: false },
] as const;

/** 排序菜单：两组单选 */
export const SORT_OPTIONS = [
  { id: 'section', labelKey: 'sort.section' },
  { id: 'recent', labelKey: 'sort.recent' },
] as const;

export const UNREAD_SORT_OPTIONS = [
  { id: 'top', labelKey: 'sort.unreadTop' },
  { id: 'inline', labelKey: 'sort.unreadInline' },
] as const;

/** 长按频道行菜单。空频道（无消息）时前三项置灰 —— IMG_2375 */
export const CHANNEL_ROW_MENU = [
  { id: 'markUnread', icon: 'IcUnreadTidy', labelKey: 'rowMenu.markUnread', needsMessages: true },
  { id: 'mute', icon: 'IcMute', labelKey: 'rowMenu.mute', needsMessages: true },
  { id: 'star', icon: 'IcStar', labelKey: 'rowMenu.star', needsMessages: true },
  { id: 'copy', icon: 'IcCopy', labelKey: 'rowMenu.copy', needsMessages: false },
  { id: 'leave', icon: 'IcLeave', labelKey: 'rowMenu.leave', needsMessages: false },
] as const;

export const COPY_SUBMENU = [
  { id: 'copyName', labelKey: 'rowMenu.copyName' },
  { id: 'copyLink', labelKey: 'rowMenu.copyLink' },
  { id: 'copyHuddleLink', labelKey: 'rowMenu.copyHuddleLink' },
] as const;

/** FAB / 更多页底部的三项快捷操作卡 */
export const QUICK_ACTIONS = [
  { id: 'huddle', icon: 'IcHuddle', titleKey: 'quickAction.huddle', descKey: 'quickAction.huddleDesc' },
  { id: 'channel', icon: 'IcHash', titleKey: 'quickAction.channel', descKey: 'quickAction.channelDesc' },
] as const;

/** 一行最多显示几个成员头像后折叠成「+N」 */
export const MAX_AVATAR_STACK = 3;

// ================= 会话域（Layer 1） =================

/** 长按消息面板顶部的快捷 emoji 排 —— IMG_2415 */
export const QUICK_EMOJIS = ['👀', '😛', '👍', '🙂', '✅', '❤️'] as const;

/** 长按消息面板的三个方块 */
export const MESSAGE_MENU_TILES = [
  { id: 'reply', icon: 'IcThread', labelKey: 'msgMenu.reply' },
  { id: 'forward', icon: 'IcForwardMsg', labelKey: 'msgMenu.forward' },
  { id: 'save', icon: 'IcSaved', labelKey: 'msgMenu.save' },
] as const;

/**
 * 长按消息面板的列表项。ownerOnly 的两项在别人的消息上不出现（uiState=othersMessage）；
 * inMore 的两项要点开「更多操作 ⌄」才出现。
 */
export const MESSAGE_MENU_ROWS = [
  { id: 'markUnread', icon: 'IcUnreadTidy', labelKey: 'msgMenu.markUnread' },
  { id: 'remind', icon: 'IcClock', labelKey: 'msgMenu.remind' },
  { id: 'unsubscribe', icon: 'IcMute', labelKey: 'msgMenu.unsubscribe' },
  { id: 'edit', icon: 'IcEdit', labelKey: 'msgMenu.edit', ownerOnly: true },
  { id: 'copyLink', icon: 'IcLink', labelKey: 'msgMenu.copyLink' },
  { id: 'copyText', icon: 'IcCopy', labelKey: 'msgMenu.copyText' },
  { id: 'pin', icon: 'IcPin', labelKey: 'msgMenu.pin', inMore: true },
  { id: 'selectText', icon: 'IcText', labelKey: 'msgMenu.selectText', inMore: true },
  { id: 'delete', icon: 'IcTrash', labelKey: 'msgMenu.delete', ownerOnly: true, destructive: true },
] as const;

/** 「提醒我」的时间选项（Q二-3） */
export const REMIND_OPTIONS = [
  { id: 'min20', minutes: 20, labelKey: 'remind.min20' },
  { id: 'hour1', minutes: 60, labelKey: 'remind.hour1' },
  { id: 'hour3', minutes: 180, labelKey: 'remind.hour3' },
  { id: 'tomorrow', minutes: 60 * 24, labelKey: 'remind.tomorrow' },
  { id: 'nextWeek', minutes: 60 * 24 * 7, labelKey: 'remind.nextWeek' },
] as const;

/** 输入栏工具条。slash 项属放弃清单，只给「暂未开放」 */
export const COMPOSER_TOOLS = [
  { id: 'attach', icon: 'IcPlus', labelKey: 'composer.attach' },
  { id: 'format', icon: 'IcFormat', labelKey: 'composer.format' },
  { id: 'emoji', icon: 'IcEmoji', labelKey: 'composer.emoji' },
  { id: 'mention', icon: 'IcAt', labelKey: 'composer.mention' },
  { id: 'slash', icon: 'IcSlash', labelKey: 'composer.slash' },
] as const;

/**
 * 格式工具条（点 Aa 后替换整条）。
 * wrap = 用标记包住当前草稿（* _ ~ ` 会在消息里渲染成对应样式）；
 * prefix = 在最后一行行首插入前缀；两者都没有的（🔗）走「暂未开放」。
 */
export const FORMAT_TOOLS = [
  { id: 'bold', label: 'B', wrap: '*' },
  { id: 'italic', label: 'I', wrap: '_' },
  { id: 'strike', label: 'S', wrap: '~' },
  { id: 'code', label: '‹›', wrap: '`' },
  { id: 'link', label: '🔗' },
  { id: 'ordered', label: '1.', prefix: '1. ' },
  { id: 'bullet', label: '•', prefix: '• ' },
  { id: 'quote', label: '❝', prefix: '> ' },
] as const;

/** 附件弹层：相册横排之外的功能行 */
export const ATTACH_ROWS = [
  { id: 'audio', icon: 'IcMic', labelKey: 'attach.audio', implemented: false },
  { id: 'video', icon: 'IcVideo', labelKey: 'attach.video', implemented: false },
  { id: 'file', icon: 'IcFile', labelKey: 'attach.file', implemented: true },
  { id: 'canvas', icon: 'IcCanvas', labelKey: 'attach.canvas', implemented: false },
  { id: 'recentFiles', icon: 'IcFolder', labelKey: 'attach.recentFiles', implemented: true },
] as const;

/** 相册横排的预置图片（占位色块，Layer 4 换生成图） */
export const ATTACH_GALLERY = [
  { id: 'g1', color: '#B8C6D9', ratio: 1.4 },
  { id: 'g2', color: '#D9C6B8', ratio: 1 },
  { id: 'g3', color: '#C6D9B8', ratio: 0.8 },
  { id: 'g4', color: '#D9B8C6', ratio: 1.2 },
] as const;

/** 「上传文件」选中的预置文件 */
export const ATTACH_FILE = { name: '课程结构 v3.pdf', ext: 'PDF', size: '2.4 MB' } as const;

/** emoji 面板分组（inferred I-4：按官方面板结构外推） */
export const EMOJI_CATEGORIES = [
  {
    id: 'recent',
    labelKey: 'emoji.recent',
    icon: '🕐',
    items: ['👀', '😛', '👍', '🙂', '✅', '❤️', '🎉', '🙏'],
  },
  {
    id: 'smileys',
    labelKey: 'emoji.smileys',
    icon: '🙂',
    items: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🙂', '🙃', '😉', '😊', '😍', '😘', '😜', '🤔', '😴'],
  },
  {
    id: 'people',
    labelKey: 'emoji.people',
    icon: '👋',
    items: ['👋', '🤝', '👍', '👎', '👏', '🙌', '🙏', '💪', '🧑‍💻', '🧑‍🏫', '👀', '🧠'],
  },
  {
    id: 'nature',
    labelKey: 'emoji.nature',
    icon: '🌿',
    items: ['🐶', '🐱', '🐼', '🦊', '🌿', '🌸', '🌞', '🌙', '⭐️', '🔥', '🌈', '❄️'],
  },
  {
    id: 'food',
    labelKey: 'emoji.food',
    icon: '🍎',
    items: ['🍎', '🍊', '🍰', '🍜', '🍚', '🍕', '🍔', '☕️', '🍵', '🍺', '🥗', '🍫'],
  },
  {
    id: 'activity',
    labelKey: 'emoji.activity',
    icon: '⚽️',
    items: ['⚽️', '🏀', '🎾', '🏃', '🚴', '🎯', '🎮', '🎧', '🎤', '🎨', '🏆', '🥇'],
  },
  {
    id: 'travel',
    labelKey: 'emoji.travel',
    icon: '✈️',
    items: ['✈️', '🚗', '🚆', '🚲', '🏠', '🏢', '🗺', '🏝', '⛰', '🌆', '🚀', '⛵️'],
  },
  {
    id: 'objects',
    labelKey: 'emoji.objects',
    icon: '💡',
    items: ['💡', '📌', '📎', '📝', '📚', '💻', '📱', '⌚️', '🔑', '🔒', '📦', '🗓'],
  },
  {
    id: 'symbols',
    labelKey: 'emoji.symbols',
    icon: '❤️',
    items: ['❤️', '💙', '💚', '💛', '💜', '✅', '❌', '⚠️', '❗️', '❓', '💯', '🔁'],
  },
  {
    id: 'flags',
    labelKey: 'emoji.flags',
    icon: '🏁',
    items: ['🏁', '🚩', '🎌', '🏳️', '🏴', '🇨🇳', '🇺🇸', '🇯🇵', '🇬🇧', '🇩🇪', '🇫🇷', '🇰🇷'],
  },
] as const;

/** 频道面板顶部三按钮（IMG_2403） */
export const PANEL_ACTIONS = [
  { id: 'add', icon: 'IcAddMember', labelKey: 'panel.add' },
  { id: 'star', icon: 'IcStar', labelKey: 'panel.star' },
  { id: 'search', icon: 'IcSearch', labelKey: 'panel.search' },
] as const;

/**
 * 频道面板列表行（IMG_2403）。
 * 「添加画板」据 Q2 去掉 PRO 徽章，点了给「暂未开放」。
 */
export const PANEL_ROWS = [
  { id: 'messages', icon: 'IcThread', labelKey: 'panel.messages', current: true },
  { id: 'canvas', icon: 'IcCanvas', labelKey: 'panel.canvas' },
  { id: 'members', icon: 'IcMembers', labelKey: 'panel.members', chevron: true },
  { id: 'notifications', icon: 'IcBell', labelKey: 'panel.notifications', chevron: true },
  { id: 'settings', icon: 'IcGear', labelKey: 'panel.settings', chevron: true },
] as const;

/** 面板右上 … 气泡菜单（IMG_2404） */
export const PANEL_MORE_ROWS = [
  { id: 'details', icon: 'IcInfo', labelKey: 'panelMore.details' },
  { id: 'copyLink', icon: 'IcLink', labelKey: 'panelMore.copyLink' },
  { id: 'archive', icon: 'IcArchive', labelKey: 'panelMore.archive' },
  { id: 'leave', icon: 'IcLeave', labelKey: 'panelMore.leave', danger: true },
] as const;

/** 设置和详情页的开关行（IMG_2427） */
export const CHANNEL_SETTING_SWITCHES = [
  { id: 'mute', icon: 'IcBell', labelKey: 'chSettings.mute', descKey: 'chSettings.muteDesc' },
  {
    id: 'memberSuggestion',
    icon: 'IcAt',
    labelKey: 'chSettings.memberSuggestion',
    descKey: 'chSettings.memberSuggestionDesc',
  },
] as const;

/**
 * Slackbot 关键词自动回复（据 Q五-2）。
 * 从上往下匹配，命中即回；都没命中用 fallback。
 */
export const SLACKBOT_RULES = [
  { id: 'greeting', words: ['你好', '您好', 'hi', 'hello', '嗨'], replyKey: 'slackbot.greeting' },
  { id: 'thanks', words: ['谢谢', '感谢', 'thanks', 'thank you'], replyKey: 'slackbot.thanks' },
  { id: 'help', words: ['帮助', '怎么', '如何', 'help', 'how'], replyKey: 'slackbot.help' },
  { id: 'remind', words: ['提醒', '日程', 'remind'], replyKey: 'slackbot.remind' },
  { id: 'leave', words: ['请假', '休假', 'vacation', 'ooo'], replyKey: 'slackbot.leave' },
] as const;

/** Slackbot 回复延时区间（毫秒，据 Q五-2「1–2 秒」） */
export const SLACKBOT_DELAY = { min: 1000, max: 2000 } as const;

/**
 * 首选项页的分组结构（IMG_2408 / 2409 / 2410 逐行抄录）。
 * external: true 的行右侧是 ↗ 外链角标，点击给「暂未开放」提示。
 * value 为动态值的行（语言 / 颜色模式）由页面按当前设置填。
 */
export const PREFS_SECTIONS = [
  {
    titleKey: 'prefs.groupNotifications',
    rows: [{ id: 'notifications', icon: 'IcActivity', labelKey: 'prefs.notifications', descKey: 'prefs.notificationsDesc' }],
  },
  {
    titleKey: 'prefs.groupAppearance',
    rows: [
      { id: 'appIcon', icon: 'IcHash', labelKey: 'prefs.appIcon', valueKey: 'prefs.appIconValue' },
      { id: 'colorMode', icon: 'IcTheme', labelKey: 'prefs.colorMode', dynamicValue: 'colorMode' },
      { id: 'emojiSkin', icon: 'IcEmoji', labelKey: 'prefs.emojiSkin', trailing: '✋' },
      { id: 'messageDisplay', icon: 'IcThread', labelKey: 'prefs.messageDisplay', descKey: 'prefs.messageDisplayDesc' },
      { id: 'links', icon: 'IcLink', labelKey: 'prefs.links', descKey: 'prefs.linksDesc' },
      { id: 'inputOptions', icon: 'IcText', labelKey: 'prefs.inputOptions', descKey: 'prefs.inputOptionsDesc' },
    ],
  },
  {
    titleKey: 'prefs.groupAccessibility',
    rows: [
      { id: 'animation', icon: 'IcEmoji', labelKey: 'prefs.animation', descKey: 'prefs.animationDesc' },
      { id: 'screenReader', icon: 'IcHuddle', labelKey: 'prefs.screenReader', descKey: 'prefs.screenReaderDesc' },
      { id: 'swipe', icon: 'IcSwipe', labelKey: 'prefs.swipe' },
    ],
  },
  {
    titleKey: 'prefs.groupMedia',
    rows: [
      { id: 'media', icon: 'IcImage', labelKey: 'prefs.media', descKey: 'prefs.mediaDesc' },
      { id: 'huddleAudio', icon: 'IcHuddle', labelKey: 'quick.huddle', descKey: 'prefs.huddleAudioDesc' },
    ],
  },
  {
    titleKey: 'prefs.groupLanguage',
    rows: [
      { id: 'language', icon: 'IcGlobe', labelKey: 'prefs.language', dynamicValue: 'language' },
      { id: 'time', icon: 'IcClock', labelKey: 'prefs.time', valueKey: 'prefs.timeValue' },
    ],
  },
  {
    titleKey: 'prefs.groupPrivacy',
    rows: [
      { id: 'discoverability', icon: 'IcUnreadTidy', labelKey: 'prefs.discoverability', descKey: 'prefs.discoverabilityDesc' },
      { id: 'privacy', icon: 'IcLock', labelKey: 'prefs.privacy', descKey: 'prefs.privacyDesc', external: true },
      { id: 'account', icon: 'IcProfile', labelKey: 'prefs.account', external: true },
    ],
  },
  {
    titleKey: 'prefs.groupDevice',
    rows: [
      { id: 'browser', icon: 'IcExternalLink', labelKey: 'prefs.browser', descKey: 'prefs.browserDesc' },
      { id: 'network', icon: 'IcNetwork', labelKey: 'prefs.network', descKey: 'prefs.networkDesc' },
      { id: 'debug', icon: 'IcDebug', labelKey: 'prefs.debug', descKey: 'prefs.debugDesc' },
      { id: 'help', icon: 'IcHelp', labelKey: 'prefs.help', external: true },
      { id: 'feedback', icon: 'IcFeedback', labelKey: 'prefs.feedback' },
    ],
  },
  {
    titleKey: 'prefs.groupAdmin',
    rows: [
      { id: 'billing', icon: 'IcBilling', labelKey: 'prefs.billing', descKey: 'prefs.billingDesc', external: true },
      { id: 'analytics', icon: 'IcAnalytics', labelKey: 'prefs.analytics', descKey: 'prefs.analyticsDesc', external: true },
    ],
  },
  {
    titleKey: 'prefs.groupAbout',
    rows: [
      { id: 'version', icon: 'IcInfo', labelKey: 'prefs.version', valueKey: 'prefs.versionValue', readonly: true },
      { id: 'libraries', icon: 'IcLibrary', labelKey: 'prefs.libraries', descKey: 'prefs.librariesDesc', external: true },
    ],
  },
] as const;

// ================= Layer 3：设置 / 搜索 / 文件 =================

/** 设置状态预置（IMG_2423） */
export const STATUS_PRESETS = [
  { id: 'meeting', emoji: '📝', textKey: 'status.preset.meeting', clearMinutes: 60 },
  { id: 'commute', emoji: '🚌', textKey: 'status.preset.commute', clearMinutes: 30 },
  { id: 'sick', emoji: '🤒', textKey: 'status.preset.sick', clearKind: 'today' as const },
  { id: 'vacation', emoji: '🌴', textKey: 'status.preset.vacation', clearKind: 'never' as const },
  { id: 'remote', emoji: '🏠', textKey: 'status.preset.remote', clearKind: 'today' as const },
] as const;

export const STATUS_CLEAR_OPTIONS = [
  { id: 'never', labelKey: 'status.dontClear' },
  { id: '30min', minutes: 30, labelKey: 'status.clear.30min' },
  { id: '1h', minutes: 60, labelKey: 'status.clear.1h' },
  { id: '4h', minutes: 240, labelKey: 'status.clear.4h' },
  { id: 'today', clearKind: 'today' as const, labelKey: 'status.clear.today' },
  { id: 'week', clearKind: 'week' as const, labelKey: 'status.clear.week' },
  { id: 'custom', labelKey: 'status.clear.custom', toast: true },
] as const;

export const PAUSE_NOTIFICATION_OPTIONS = [
  { id: '30min', minutes: 30, labelKey: 'pause.30min' },
  { id: '1h', minutes: 60, labelKey: 'pause.1h' },
  { id: '2h', minutes: 120, labelKey: 'pause.2h' },
  { id: '4h', minutes: 240, labelKey: 'pause.4h' },
  { id: 'tomorrow', kind: 'tomorrow' as const, labelKey: 'pause.tomorrow' },
  { id: 'nextWeek', kind: 'nextWeek' as const, labelKey: 'pause.nextWeek' },
  { id: 'custom', labelKey: 'pause.custom', toast: true },
] as const;

export const PREFS_LANGUAGE_OPTIONS = [
  { id: 'zh', labelKey: 'prefs.langZh', enabled: true },
  { id: 'en', labelKey: 'prefs.langEn', enabled: true },
  { id: 'ja', labelKey: 'prefs.langJa', enabled: false },
  { id: 'ko', labelKey: 'prefs.langKo', enabled: false },
  { id: 'fr', labelKey: 'prefs.langFr', enabled: false },
  { id: 'de', labelKey: 'prefs.langDe', enabled: false },
  { id: 'es', labelKey: 'prefs.langEs', enabled: false },
] as const;

export const SEARCH_TYPES = [
  { id: 'messages', labelKey: 'search.type.messages' },
  { id: 'dms', labelKey: 'search.type.dms' },
  { id: 'files', labelKey: 'search.type.files' },
  { id: 'canvas', labelKey: 'search.type.canvas' },
  { id: 'channels', labelKey: 'search.type.channels' },
  { id: 'people', labelKey: 'search.type.people' },
] as const;

export const FILE_SCOPE_FILTERS = [
  { id: 'all', labelKey: 'files.filter.all' },
  { id: 'starred', labelKey: 'files.filter.starred' },
  { id: 'created', labelKey: 'files.filter.created' },
  { id: 'shared', labelKey: 'files.filter.shared' },
] as const;

/** 文件类型多选（IMG_2389）。默认选中前 5 项 */
export const FILE_TYPE_OPTIONS = [
  { id: 'lists', labelKey: 'files.type.lists' },
  { id: 'canvas', labelKey: 'files.type.canvas' },
  { id: 'spreadsheet', labelKey: 'files.type.spreadsheet' },
  { id: 'presentation', labelKey: 'files.type.presentation' },
  { id: 'pdf', labelKey: 'files.type.pdf' },
  { id: 'audio', labelKey: 'files.type.audio' },
  { id: 'video', labelKey: 'files.type.video' },
  { id: 'image', labelKey: 'files.type.image' },
  { id: 'snippet', labelKey: 'files.type.snippet' },
  { id: 'email', labelKey: 'files.type.email' },
] as const;

export const DEFAULT_FILE_TYPE_FILTERS = FILE_TYPE_OPTIONS.slice(0, 5).map((x) => x.id);
