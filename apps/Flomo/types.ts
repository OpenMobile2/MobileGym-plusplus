// apps/Flomo/types.ts
// 所有 timestamp 均为绝对 Unix 毫秒(非负偏移)。

export interface FlomoMemo {
  id: string;
  content: string;            // 富文本以 markdown 子集存(列表/加粗/下划线/荧光笔)
  createdAt: number;          // 绝对 Unix 毫秒
  updatedAt: number;
  tags: string[];             // tag id 列表
  images: string[];           // 资源路径 /@app-assets/Flomo/images/xxx
  hasLink: boolean;
  hasAudio: boolean;
  source: 'app' | 'wechat' | 'api';
  sourceMemoId: string | null; // 批注/关联自:指向被引用的 memo id
  pinned: boolean;
  deleted: boolean;           // 在回收站
}

export interface FlomoTag {
  id: string;
  name: string;               // 含层级以 / 分隔,如 "欢迎/简介"
  parentId: string | null;
  count: number;
}

export interface FlomoNotification {
  id: string;
  text: string;
  createdAt: number;
  read: boolean;
}

export interface FlomoSettings {
  theme: 'light' | 'dark';
  fontSize: number;           // 偏好设置字号
  foldLong: boolean;          // 内容过长折叠
  foldQuote: boolean;         // 引用/被引用折叠
  aiRelated: boolean;         // AI设置:相关笔记开关
  aiInsight: boolean;         // AI设置:AI洞察开关
  dailyReviewCount: number;
  dailyNotify: boolean;
}

export interface FlomoUser {
  id: string;
  name: string;
  avatar: string;
  pro: boolean;
  proExpire: string;          // 展示用文本
  phone: string;
  memoCount: number;
  tagCount: number;
  days: number;               // 坚持记录天数
  storageUsedMb: number;
}

export interface FlomoState {
  user: FlomoUser;
  memos: FlomoMemo[];
  tags: FlomoTag[];
  notifications: FlomoNotification[];
  settings: FlomoSettings;
  // 运行态:当前操作的笔记 / 标签 / 多选集合(由各页交互设置)
  currentMemoId: string | null;
  currentTagId: string | null;
  currentFilter: 'images' | 'links' | 'audio' | 'untagged' | 'wechat' | 'byDate' | null;
  currentDate: string | null;   // 'YYYY-MM-DD',byDate 筛选用
  selectedMemoIds: string[];
  composeMode: 'new' | 'edit' | 'annotate';
  composeDraft: string;
  composeDraftImages: string[];
  searchQuery: string;
  searchRecents: string[];
  searchFilters: string[];          // 'untagged' | 'haslink' | 'hasimage' | 'hasaudio'
  sortBy: 'created' | 'edited';
  sortOrder: 'newest' | 'oldest';
  lastDeleted: string[] | null;     // 刚删除的笔记 id(单条或批量),供撤销黑条恢复
  previewImage: string | null;      // 全屏图片预览
  payPlan: 'monthly' | 'yearly';    // Pro 购买选中的档位
  lastToast: string | null;
}

export interface FlomoActions {
  addMemo: (content: string, opts?: Partial<Pick<FlomoMemo, 'tags' | 'images' | 'sourceMemoId'>>) => void;
  updateMemo: (id: string, content: string) => void;
  deleteMemo: (id: string) => void;          // 软删除 -> 回收站,并置 lastDeleted 供撤销
  deleteMemos: (ids: string[]) => void;      // 批量软删除(多选),并置 lastDeleted
  undoDelete: () => void;                    // 撤销黑条:恢复 lastDeleted
  restoreMemo: (id: string) => void;
  purgeMemo: (id: string) => void;
  duplicateMemo: (id: string) => void;
  togglePin: (id: string) => void;
  addTagToMemos: (memoIds: string[], tagName: string) => void;
  renameTag: (id: string, name: string) => void;
  deleteTag: (id: string, alsoDeleteMemos: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setSetting: <K extends keyof FlomoSettings>(key: K, value: FlomoSettings[K]) => void;
  markNotificationsRead: () => void;
  setCurrentMemo: (id: string | null) => void;
  setCurrentTag: (id: string | null) => void;
  setCurrentFilter: (f: FlomoState['currentFilter']) => void;
  setCurrentDate: (d: string | null) => void;
  setCompose: (mode: 'new' | 'edit' | 'annotate', memoId: string | null) => void;
  setDraft: (text: string) => void;
  insertDraft: (snippet: string) => void;
  addDraftImage: (src: string) => void;
  clearDraft: () => void;
  removeDraftImage: (src: string) => void;
  setSearchQuery: (q: string) => void;
  toggleSearchFilter: (id: string) => void;
  setSort: (by: 'created' | 'edited', order: 'newest' | 'oldest') => void;
  setPreviewImage: (src: string | null) => void;
  setPayPlan: (p: 'monthly' | 'yearly') => void;
  paySuccess: () => void;                    // 模拟支付成功:延长 proExpire
  toggleSelectMemo: (id: string) => void;
  clearSelection: () => void;
  toast: (msg: string) => void;
}
