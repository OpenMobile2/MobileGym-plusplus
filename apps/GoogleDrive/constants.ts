// apps/GoogleDrive/constants.ts — 结构性常量（用户改不了的 app 形状）
import { IcTabHome, IcTabStarred, IcTabShared, IcTabFiles } from './res/icons';
import type { SortField } from './types';

/** OS 宿主约束 —— 来源 os 层 simulatorConfig；不要手改。 */
export const OS = {
  STATUS_BAR_H: 40,   // pt-10
  GESTURE_BAR_H: 16,  // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
} as const;

/** 每次改 defaults.json 必须递增（state persistName 带此版本，变化即清缓存）。 */
export const DATA_VERSION = 4;

// 底部四个主 Tab（IMG_2219 / IMG_2240 / IMG_2241 / IMG_2242）
export const TABS = [
  { id: 'home',    route: '/',        labelKey: 'tab_home',    icon: IcTabHome },
  { id: 'starred', route: '/starred', labelKey: 'tab_starred', icon: IcTabStarred },
  { id: 'shared',  route: '/shared',  labelKey: 'tab_shared',  icon: IcTabShared },
  { id: 'files',   route: '/files',   labelKey: 'tab_files',   icon: IcTabFiles },
] as const;

export const MAIN_TAB_ROUTES: readonly string[] = TABS.map(t => t.route);

/** 支持长按进多选的列表路由（与 navigation.declaration 里的多选宿主一致） */
export const SELECTABLE_ROUTES: readonly string[] = ['/', '/files', '/folder/:id'];

/** 排序菜单的字段项（IMG_2250：4 项 + A to Z / Z to A 两段） */
export const SORT_FIELDS: ReadonlyArray<{ id: SortField; labelKey: string }> = [
  { id: 'name',         labelKey: 'sort_name' },
  { id: 'modified',     labelKey: 'sort_modified' },
  { id: 'modifiedByMe', labelKey: 'sort_modified_by_me' },
  { id: 'openedByMe',   labelKey: 'sort_opened_by_me' },
];

/** 搜索结果页的排序字段多一个「相关程度」（IMG_2271） */
export const SEARCH_SORT_FIELDS: ReadonlyArray<{ id: SortField; labelKey: string }> = [
  { id: 'relevance',    labelKey: 'sort_relevance' },
  ...SORT_FIELDS,
];

/** 搜索筛选 chip（IMG_2270 / 2272 / 2273） */
export const FILTER_CHIPS = [
  { id: 'type',     labelKey: 'filter_type' },
  { id: 'people',   labelKey: 'filter_people' },
  { id: 'modified', labelKey: 'filter_modified' },
] as const;

export const FILTER_TYPE_OPTIONS = [
  { id: 'documents',     labelKey: 'filter_type_documents' },
  { id: 'spreadsheets',  labelKey: 'filter_type_spreadsheets' },
  { id: 'presentations', labelKey: 'filter_type_presentations' },
  { id: 'photos',        labelKey: 'filter_type_photos' },
  { id: 'forms',         labelKey: 'filter_type_forms' },
  { id: 'pdfs',          labelKey: 'filter_type_pdfs' },
  { id: 'videos',        labelKey: 'filter_type_videos' },
  { id: 'shortcuts',     labelKey: 'filter_type_shortcuts' },
  { id: 'folders',       labelKey: 'filter_type_folders' },
] as const;

export const FILTER_MODIFIED_OPTIONS = [
  { id: 'today',    labelKey: 'filter_modified_today' },
  { id: 'last7',    labelKey: 'filter_modified_last7' },
  { id: 'last30',   labelKey: 'filter_modified_last30' },
  { id: 'thisyear', labelKey: 'filter_modified_thisyear' },
  { id: 'lastyear', labelKey: 'filter_modified_lastyear' },
  { id: 'custom',   labelKey: 'filter_modified_custom' },
] as const;

/** 通知设置的 4 个开关（IMG_2230） */
export const NOTIFY_KEYS = [
  { id: 'shared',   labelKey: 'settings_notify_shared' },
  { id: 'comments', labelKey: 'settings_notify_comments' },
  { id: 'requests', labelKey: 'settings_notify_requests' },
  { id: 'storage',  labelKey: 'settings_notify_storage' },
] as const;

/** Gemini 预置问答（自由提问不开放，只这三条有答案） */
export const GEMINI_SUGGESTIONS = [
  { id: 'summary',   qKey: 'gemini_suggest_summary',   aKey: 'gemini_answer_summary' },
  { id: 'keypoints', qKey: 'gemini_suggest_keypoints', aKey: 'gemini_answer_keypoints' },
  { id: 'action',    qKey: 'gemini_suggest_action',     aKey: 'gemini_answer_action' },
] as const;

/** 文件类型 → 预览呈现方式（底稿 preview.doc 的四个 uiState） */
export const PREVIEW_BY_KIND = {
  pdf: 'pdf',
  image: 'image',
  doc: 'gdoc',
  sheet: 'gdoc',
  slide: 'gdoc',
  other: 'unsupported',
  folder: 'unsupported',
} as const;

/** 网格视图列数（IMG_2249：两列） */
export const GRID_COLUMNS = 2;

/** PDF 预览的模拟页数（IMG_2275：连续竖向滚动多页） */
export const PDF_PAGE_COUNT = 3;

/**
 * 上传时可浏览的本机目录（对应模拟手机 /sdcard 下真实存在的目录）。
 * 只列常见的几个，不把整个 /sdcard 铺开。
 */
export const UPLOAD_PICK_DIRS: readonly string[] = [
  '/sdcard/Documents',
  '/sdcard/Pictures',
  '/sdcard/DCIM/Camera',
  '/sdcard/Download',
];
