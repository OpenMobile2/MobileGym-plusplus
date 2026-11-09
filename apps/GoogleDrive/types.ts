// apps/GoogleDrive/types.ts — App 级类型
export type ItemKind = 'folder' | 'doc' | 'sheet' | 'slide' | 'pdf' | 'image' | 'other';

/** 预览呈现方式：底稿 preview.doc 的四个 uiState */
export type PreviewKind = 'pdf' | 'image' | 'gdoc' | 'unsupported';

export interface DriveItem {
  id: string;
  name: string;
  kind: ItemKind;
  /** 父文件夹 id；null = 我的云端硬盘根 */
  parentId: string | null;
  /** 修改时间（毫秒时间戳，渲染时经 TimeService.fromTimestamp 格式化） */
  modifiedAt: number;
  createdAt: number;
  /** 字节数；文件夹为 0 */
  size: number;
  /** 是否由本人上传（决定副标题是「你已上传」还是「修改时间」） */
  uploadedByMe: boolean;
  /** 所有者不是自己时的显示名；null = 自己 */
  ownerName: string | null;
  /** 文件夹自定义颜色（Change color 的结果）；null = 默认深灰 */
  color: string | null;
  /** 文件夹是否已共享（决定是否画内嵌人像的文件夹图标） */
  sharedFolder: boolean;
  /** 常规访问：受限 / 任何拥有链接的人 */
  linkAccess?: 'restricted' | 'anyone';
  /** 链接角色（anyone 时有效） */
  linkRole?: 'viewer' | 'commenter' | 'editor';
  /** 该条目专属分享链接（任何人有链接时可展示/复制） */
  shareLink?: string;
  /** 有权访问的协作者（按联系人 id） */
  collaborators?: Collaborator[];
  /** 活动记录（详细信息页的时间线） */
  activity?: Array<{ who: string; whatKey: 'details_activity_edited' | 'details_activity_created' | 'details_activity_uploaded'; at: number }>;
  /** 预览正文（模拟内容，但呈现逻辑要与文件类型对得上） */
  preview?: PreviewBody;
}

export type AccessRole = 'viewer' | 'commenter' | 'editor';

export interface Collaborator {
  contactId: string;
  role: AccessRole;
}

export type PreviewBody =
  | { kind: 'doc'; title: string; paragraphs: string[] }
  | { kind: 'sheet'; title: string; columns: string[]; rows: string[][] }
  | { kind: 'slide'; title: string; slides: Array<{ heading: string; bullets: string[] }> }
  | { kind: 'code'; title: string; lines: string[] };

export interface Contact {
  id: string;
  name: string;
  email: string;
  /** 头像底色（首字母头像） */
  color: string;
}

export type SortField = 'name' | 'modified' | 'modifiedByMe' | 'openedByMe' | 'relevance' | 'trashed';
export type SortOrder = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';

export interface SortSetting {
  field: SortField;
  order: SortOrder;
}

export interface SearchFilters {
  type: string | null;
  people: string | null;
  modified: string | null;
}

export interface UploadTask {
  id: string;
  name: string;
  kind: ItemKind;
  /** 0–100；100 表示完成 */
  progress: number;
}

export interface StorageInfo {
  totalBytes: number;
  driveBytes: number;
  gmailBytes: number;
  photosBytes: number;
}

export interface GoogleDriveUser {
  name: string;
  email: string;
  avatarColor: string;
  /** 相册选图后的头像 URI；缺省时用字母头像 */
  avatar?: string;
}

export interface GoogleDriveState {
  user: GoogleDriveUser;
  contacts: Contact[];
  /** 全部条目（含文件夹）；回收站与星标用 id 列表引用 */
  items: Record<string, DriveItem>;
  /** 我的云端硬盘根与各文件夹的显示顺序由排序决定，这里只存归属 */
  starredIds: string[];
  offlineIds: string[];
  trashedIds: string[];
  /** 移入回收站的时间，用于「移入回收站」副标题与排序 */
  trashedAt: Record<string, number>;
  recentIds: string[];
  spamIds: string[];
  uploads: UploadTask[];
  storage: StorageInfo;
  /** 视图与排序偏好（store 持有，不进 URL） */
  view: ViewMode;
  sort: SortSetting;
  searchSort: SortSetting;
  searchQuery: string;
  searchFilters: SearchFilters;
  recentQueries: string[];
  /** 多选态已选中的 id（运行时状态，但需要跨 URL 状态保留） */
  selectedIds: string[];
  notify: Record<string, boolean>;
  /** 待上传文件的暂存（上传确认页） */
  pendingUpload: { name: string; kind: ItemKind; parentId: string | null; size: number } | null;
  /** Gemini 会话（仅预置问答） */
  geminiTurns: Array<{ q: string; a: string }>;
}

export interface GoogleDriveActions {
  toggleStar: (id: string) => void;
  toggleOffline: (id: string) => void;
  rename: (id: string, name: string) => void;
  move: (id: string, parentId: string | null) => void;
  duplicate: (id: string, copyName: string) => void;
  moveToTrash: (id: string) => void;
  moveManyToTrash: (ids: string[]) => void;
  restore: (id: string) => void;
  deleteForever: (id: string) => void;
  emptyTrash: () => void;
  createFolder: (name: string, parentId: string | null, fallbackName: string) => void;
  /** 新建空文档/表格/幻灯片（不进编辑器） */
  createDocument: (kind: 'doc' | 'sheet' | 'slide', parentId: string | null, fallbackName: string) => string;
  setFolderColor: (id: string, color: string) => void;
  setLinkAccess: (id: string, linkAccess: 'restricted' | 'anyone', linkRole?: AccessRole) => void;
  /** 进入权限页时补齐专属链接与默认协作者名单 */
  ensureAccessDefaults: (id: string) => void;
  setCollaboratorRole: (id: string, contactId: string, role: AccessRole) => void;
  removeCollaborator: (id: string, contactId: string) => void;
  setView: (view: ViewMode) => void;
  setSort: (field: SortField, order: SortOrder) => void;
  setSearchSort: (field: SortField, order: SortOrder) => void;
  setSearchQuery: (q: string) => void;
  setSearchFilter: (kind: keyof SearchFilters, value: string | null) => void;
  clearSearchFilters: () => void;
  pushRecentQuery: (q: string) => void;
  toggleSelect: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  toggleNotify: (key: string) => void;
  setPendingUpload: (name: string, kind: ItemKind, parentId: string | null, size: number) => void;
  renamePendingUpload: (name: string) => void;
  setPendingUploadLocation: (parentId: string | null) => void;
  commitUpload: () => void;
  cancelUpload: (taskId: string) => void;
  askGemini: (q: string, a: string) => void;
  setUserAvatar: (avatar: string) => void;
  /** 支付成功后扩容（字节） */
  expandStorage: (extraBytes: number) => void;
}
