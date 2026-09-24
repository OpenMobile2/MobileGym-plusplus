/**
 * 邮件 App 运行时状态。
 *
 * 契约要点：
 * - store 里只放 mutation，**不放** isXxx / getXxx 这类 query-style getter
 *   （Zustand 函数引用恒定 → 组件订阅函数永远不 re-render）。
 *   派生数据一律用文件末尾的 memoSelector 或纯函数。
 * - 多选状态属于 UI 态，放 `_temp`，默认 partialize 会把它排除，刷新即丢。
 * - 业务数据（邮件、文件夹、Edit 勾选与排序、视图模式）全部持久化到 localStorage['mail']。
 */
import { createAppStoreWithActions, memoSelector } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { MAIL_CONFIG } from './data';
import { SMART_MAILBOXES } from './constants';
import type { CustomFolder, Mail, MailAddress, MailBlock, MailCategory, MailSettings, ViewMode } from './types';

// —— id 生成：不用 Math.random，避免"随机拼可导航 id"（阶段⑤自检 A-3）——
let idCounter = 0;
const nextId = (prefix: string) => `${prefix}-${TimeService.now().toString(36)}-${++idCounter}`;

export interface ComposeInput {
  accountId: string;
  to: MailAddress[];
  cc: MailAddress[];
  bcc: MailAddress[];
  subject: string;
  body: MailBlock[];
  /** 从草稿继续编辑时带上原草稿 id，发送/再存时替换它 */
  draftId?: string;
  attachments?: Mail['attachments'];
  /** 回复时关联原邮件，发送成功后回写原邮件的已回复状态。 */
  replyToId?: string;
}

interface MailState {
  mails: Mail[];
  customFolders: CustomFolder[];
  /** Edit 模式里被取消勾选的智能邮箱 id */
  hiddenSmartMailboxes: string[];
  /** Edit 模式拖动后的顺序，元素是智能邮箱 id */
  smartMailboxOrder: string[];
  settings: MailSettings;
  /** 已关闭过的分类说明横幅 */
  dismissedBanners: string[];
  /** 首页展开着的账号分组，可同时展开多个（gate4 #4） */
  expandedAccountIds: string[];
  _temp: {
    selectedIds: string[];
  };
}

interface MailActions {
  setRead: (ids: string[], read: boolean) => void;
  toggleFlag: (id: string) => void;
  moveTo: (ids: string[], folder: string) => void;
  trashMails: (ids: string[]) => void;
  remindMe: (id: string, offsetMinutes: number) => void;
  toggleMute: (id: string) => void;
  toggleNotifyMe: (id: string) => void;
  sendMail: (input: ComposeInput) => void;
  saveDraft: (input: ComposeInput) => void;
  discardDraft: (draftId: string | undefined) => void;
  createFolder: (name: string, accountId: string) => void;
  toggleSmartMailbox: (id: string) => void;
  moveSmartMailbox: (id: string, direction: -1 | 1) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleContactPhotos: () => void;
  dismissBanner: (category: string) => void;
  toggleAccountExpanded: (accountId: string) => void;
  toggleSelected: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
}

const defaultOrder = SMART_MAILBOXES.filter((m) => m.visibleByDefault).map((m) => m.id);
const defaultHidden = SMART_MAILBOXES.filter((m) => !m.visibleByDefault).map((m) => m.id);

const initialState: MailState = {
  mails: MAIL_CONFIG.mails.map((m) => ({ ...m })),
  customFolders: [],
  hiddenSmartMailboxes: [...defaultHidden],
  smartMailboxOrder: [...defaultOrder],
  settings: { ...MAIL_CONFIG.settings },
  dismissedBanners: [],
  expandedAccountIds: [MAIL_CONFIG.accounts[0].id],
  _temp: { selectedIds: [] },
};

export const useMailStore = createAppStoreWithActions<MailState, MailActions>(
  'mail',
  initialState,
  (set, get) => ({
    setRead(ids, read) {
      set((s) => ({ mails: s.mails.map((m) => (ids.includes(m.id) ? { ...m, isRead: read } : m)) }));
    },

    toggleFlag(id) {
      set((s) => ({ mails: s.mails.map((m) => (m.id === id ? { ...m, isFlagged: !m.isFlagged } : m)) }));
    },

    moveTo(ids, folder) {
      set((s) => ({ mails: s.mails.map((m) => (ids.includes(m.id) ? { ...m, folder } : m)) }));
    },

    /** 删除 = 移入该邮件所属账号自己的 Trash（阶段③ Q3） */
    trashMails(ids) {
      set((s) => ({ mails: s.mails.map((m) => (ids.includes(m.id) ? { ...m, folder: 'trash' } : m)) }));
    },

    /** Remind Me 后邮件进 Follow Up（阶段③ Q5），不弹系统通知（阶段① 决议） */
    remindMe(id, offsetMinutes) {
      const at = TimeService.now() + offsetMinutes * 60_000;
      set((s) => ({ mails: s.mails.map((m) => (m.id === id ? { ...m, remindedAt: at } : m)) }));
    },

    toggleMute(id) {
      set((s) => ({ mails: s.mails.map((m) => (m.id === id ? { ...m, isMuted: !m.isMuted } : m)) }));
    },

    toggleNotifyMe(id) {
      set((s) => ({ mails: s.mails.map((m) => (m.id === id ? { ...m, notifyMe: !m.notifyMe } : m)) }));
    },

    /** 发送：写入该账号 Sent；若来自草稿则同时移除原草稿 */
    sendMail(input) {
      const account = MAIL_CONFIG.accounts.find((a) => a.id === input.accountId) ?? MAIL_CONFIG.accounts[0];
      const mail: Mail = {
        id: nextId('m'),
        accountId: account.id,
        folder: 'sent',
        from: { name: account.displayName, address: account.address },
        to: input.to,
        cc: input.cc,
        subject: input.subject,
        preview: previewOf(input.body),
        body: input.body,
        receivedAt: TimeService.now(),
        isRead: true,
        isFlagged: false,
        isReplied: false,
        attachments: input.attachments ?? [],
        category: 'primary',
      };
      set((s) => ({
        mails: [
          mail,
          ...s.mails
            .filter((m) => m.id !== input.draftId)
            .map((m) => (m.id === input.replyToId ? { ...m, isReplied: true, isRead: true } : m)),
        ],
      }));
    },

    /** 存草稿：新建或原地更新 */
    saveDraft(input) {
      const account = MAIL_CONFIG.accounts.find((a) => a.id === input.accountId) ?? MAIL_CONFIG.accounts[0];
      const draft: Mail = {
        id: input.draftId ?? nextId('d'),
        accountId: account.id,
        folder: 'drafts',
        from: { name: account.displayName, address: account.address },
        to: input.to,
        cc: input.cc,
        subject: input.subject,
        preview: previewOf(input.body),
        body: input.body,
        receivedAt: TimeService.now(),
        isRead: true,
        isFlagged: false,
        isReplied: false,
        attachments: input.attachments ?? [],
        category: 'primary',
      };
      set((s) => ({
        mails: input.draftId
          ? s.mails.map((m) => (m.id === input.draftId ? draft : m))
          : [draft, ...s.mails],
      }));
    },

    discardDraft(draftId) {
      if (!draftId) return;
      set((s) => ({ mails: s.mails.filter((m) => m.id !== draftId) }));
    },

    createFolder(name, accountId) {
      const trimmed = name.trim();
      if (!trimmed) return;
      set((s) => ({ customFolders: [...s.customFolders, { id: nextId('f'), name: trimmed, accountId }] }));
    },

    toggleSmartMailbox(id) {
      set((s) => {
        const hidden = s.hiddenSmartMailboxes.includes(id);
        return {
          hiddenSmartMailboxes: hidden
            ? s.hiddenSmartMailboxes.filter((x) => x !== id)
            : [...s.hiddenSmartMailboxes, id],
          smartMailboxOrder: hidden
            ? [...s.smartMailboxOrder, id]
            : s.smartMailboxOrder.filter((x) => x !== id),
        };
      });
    },

    moveSmartMailbox(id, direction) {
      set((s) => {
        const order = [...s.smartMailboxOrder];
        const from = order.indexOf(id);
        const to = from + direction;
        if (from < 0 || to < 0 || to >= order.length) return { smartMailboxOrder: order };
        [order[from], order[to]] = [order[to], order[from]];
        return { smartMailboxOrder: order };
      });
    },

    setViewMode(mode) {
      set((s) => ({ settings: { ...s.settings, viewMode: mode } }));
    },

    toggleContactPhotos() {
      set((s) => ({ settings: { ...s.settings, showContactPhotos: !s.settings.showContactPhotos } }));
    },

    dismissBanner(category) {
      set((s) =>
        s.dismissedBanners.includes(category)
          ? { dismissedBanners: s.dismissedBanners }
          : { dismissedBanners: [...s.dismissedBanners, category] },
      );
    },

    /** 展开/折叠某个账号，互不影响其它账号（gate4 #4） */
    toggleAccountExpanded(accountId) {
      set((s) => ({
        expandedAccountIds: s.expandedAccountIds.includes(accountId)
          ? s.expandedAccountIds.filter((x) => x !== accountId)
          : [...s.expandedAccountIds, accountId],
      }));
    },

    toggleSelected(id) {
      set((s) => ({
        _temp: {
          ...s._temp,
          selectedIds: s._temp.selectedIds.includes(id)
            ? s._temp.selectedIds.filter((x) => x !== id)
            : [...s._temp.selectedIds, id],
        },
      }));
    },

    selectAll(ids) {
      set((s) => ({ _temp: { ...s._temp, selectedIds: [...ids] } }));
    },

    clearSelection() {
      set((s) => ({ _temp: { ...s._temp, selectedIds: [] } }));
    },
  }),
);

function previewOf(body: MailBlock[]): string {
  const first = body.find((b) => b.kind === 'p' || b.kind === 'h');
  if (!first) return '';
  return 'text' in first ? first.text.replace(/\n/g, ' ').slice(0, 120) : '';
}

// ——————— 派生数据：全部走纯函数 / memoSelector，不进 store actions ———————

type MailStore = MailState & MailActions;

/** 首页要显示的智能邮箱 id 顺序（已应用 Edit 的勾选与排序） */
export const selectVisibleSmartMailboxes = memoSelector(
  (s: MailStore) => ({ order: s.smartMailboxOrder, hidden: s.hiddenSmartMailboxes }),
  ({ order, hidden }) => order.filter((id) => !hidden.includes(id)),
);

/** 已选中的邮件 id 集合，供列表行 O(1) 判断 */
export const selectSelectedIdSet = memoSelector(
  (s: MailStore) => s._temp.selectedIds,
  (ids) => new Set(ids),
);

/** 某账号 Drafts 的条数（首页那个计数） */
export function countDrafts(mails: Mail[], accountId: string): number {
  return mails.filter((m) => m.accountId === accountId && m.folder === 'drafts').length;
}

/**
 * 按邮箱 id 取邮件。mailboxId 有两类：
 * - 智能邮箱：unread / all-inboxes / follow-up / send-later / flagged / attachments / all-sent / all-trash / all-junk
 * - 账号文件夹：`<accountId>:<folder>`，folder 可以是标准名或自定义文件夹 id
 */
export function mailsInMailbox(mails: Mail[], mailboxId: string): Mail[] {
  const byTime = (a: Mail, b: Mail) => b.receivedAt - a.receivedAt;

  if (mailboxId.includes(':')) {
    const [accountId, folder] = mailboxId.split(':');
    return mails.filter((m) => m.accountId === accountId && m.folder === folder).sort(byTime);
  }

  switch (mailboxId) {
    case 'unread':
      return mails.filter((m) => m.folder === 'inbox' && !m.isRead).sort(byTime);
    case 'all-inboxes':
      return mails.filter((m) => m.folder === 'inbox').sort(byTime);
    case 'follow-up':
      return mails.filter((m) => m.remindedAt !== undefined && m.folder !== 'trash').sort(byTime);
    case 'send-later':
      // 阶段③ Q11：不做定时发送，此邮箱恒为空
      return [];
    case 'flagged':
      return mails.filter((m) => m.isFlagged && m.folder !== 'trash').sort(byTime);
    case 'attachments':
      return mails.filter((m) => m.attachments.length > 0 && m.folder !== 'trash').sort(byTime);
    case 'all-sent':
      return mails.filter((m) => m.folder === 'sent').sort(byTime);
    case 'all-trash':
      return mails.filter((m) => m.folder === 'trash').sort(byTime);
    case 'all-junk':
      return mails.filter((m) => m.folder === 'junk').sort(byTime);
    default:
      return [];
  }
}

/** 按分类过滤。'all' 表示 All Mail，不过滤。 */
export function filterByCategory(mails: Mail[], category: MailCategory | 'all'): Mail[] {
  if (category === 'all') return mails;
  return mails.filter((m) => m.category === category);
}

/** 把邮件按发件人聚合成 bundle（Transactions / Updates / Promotions 用） */
export function bundleBySender(mails: Mail[]): Array<{ key: string; from: MailAddress; mails: Mail[] }> {
  const map = new Map<string, { key: string; from: MailAddress; mails: Mail[] }>();
  for (const m of mails) {
    const key = m.from.address;
    const hit = map.get(key);
    if (hit) hit.mails.push(m);
    else map.set(key, { key, from: m.from, mails: [m] });
  }
  return [...map.values()];
}

/** 同一 threadId 的邮件（含自己），按时间正序，用于详情页「N Messages」 */
export function threadOf(mails: Mail[], mail: Mail): Mail[] {
  if (!mail.threadId) return [mail];
  return mails.filter((m) => m.threadId === mail.threadId).sort((a, b) => a.receivedAt - b.receivedAt);
}

/** 搜索：命中发件人、主题或预览文本 */
export function searchMails(mails: Mail[], query: string): Mail[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return mails
    .filter((m) => m.folder !== 'trash')
    .filter(
      (m) =>
        m.from.name.toLowerCase().includes(q) ||
        m.from.address.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.preview.toLowerCase().includes(q),
    )
    .sort((a, b) => b.receivedAt - a.receivedAt);
}
