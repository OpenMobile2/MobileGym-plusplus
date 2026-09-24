import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { SLACK_CONFIG } from './data';
import { DATA_VERSION, DEFAULT_FILE_TYPE_FILTERS } from './constants';
import { USER_AVATARS } from './assets/avatars';
import type {
  ActivityItem,
  AppActions,
  Conversation,
  FullState,
  Message,
  Section,
  Settings,
  SlackUser,
  UserStatus,
} from './types';

export const ME = 'u_me';
/** Slackbot 私信会话 id —— 提醒到点由它发通知 */
export const SLACKBOT_DM = 'd_slackbot';

/** 由「相对天数 + 当天分钟」构造 simulated ts */
function dayTs(offsetDays: number, timeMin: number): number {
  const d = TimeService.getDate();
  return TimeService.fromLocalParts(
    d.getFullYear(),
    d.getMonth(),
    d.getDate() + offsetDays,
    Math.floor(timeMin / 60),
    timeMin % 60,
  ).getTime();
}

type RawMessage = (typeof SLACK_CONFIG.messages)[number];
type RawConversation = (typeof SLACK_CONFIG.conversations)[number];

function buildMessage(raw: RawMessage): Message {
  const r = raw as RawMessage & {
    reactions?: Array<{ emoji: string; userIds: string[] }>;
    attachments?: Message['attachments'];
    threadParentId?: string;
    replyCount?: number;
    replyUserIds?: string[];
    edited?: boolean;
    pinned?: boolean;
    saved?: boolean;
    isMention?: boolean;
    system?: boolean;
    deleted?: boolean;
    bigEmoji?: boolean;
  };
  return {
    id: r.id,
    convId: r.convId,
    userId: r.userId,
    text: r.text,
    ts: dayTs(r.dayOffset, r.timeMin),
    edited: r.edited ?? false,
    reactions: (r.reactions ?? []).map((x) => ({ emoji: x.emoji, userIds: [...x.userIds] })),
    attachments: (r.attachments ?? []).map((a) => ({ ...a })),
    threadParentId: r.threadParentId ?? null,
    replyCount: r.replyCount ?? 0,
    replyUserIds: [...(r.replyUserIds ?? [])],
    pinned: r.pinned ?? false,
    saved: r.saved ?? false,
    isMention: r.isMention ?? false,
    system: r.system ?? false,
    deleted: r.deleted ?? false,
    bigEmoji: r.bigEmoji ?? false,
    quote: null,
    alsoSent: false,
  };
}

/** 会话主时间线（不含消息列回复），按时间正序 */
function timelineOf(messages: Message[], convId: string): Message[] {
  return messages
    .filter((m) => m.convId === convId && m.threadParentId === null)
    .sort((a, b) => a.ts - b.ts);
}

/**
 * 未读态派生（Q四-1/-2）：
 * 徽章数字只给「@提及」和私信；频道只加粗不给数字；静音频道既不加粗也不计数。
 */
function notificationsPaused(settings: Settings): boolean {
  const until = settings.notificationsPausedUntil;
  return until != null && until > TimeService.now();
}

function syncMeStatus(users: SlackUser[], status: UserStatus): SlackUser[] {
  return users.map((u) =>
    u.id === ME ? { ...u, statusEmoji: status.emoji, statusText: status.text } : u,
  );
}

function recomputeUnread(
  conv: Conversation,
  messages: Message[],
  settings?: Settings,
): Conversation {
  if (settings && notificationsPaused(settings)) {
    return { ...conv, hasUnread: false, unreadCount: 0 };
  }
  if (settings?.notifyMode === 'nothing') {
    return { ...conv, hasUnread: false, unreadCount: 0 };
  }
  const timeline = timelineOf(messages, conv.id);
  const unread = timeline.filter((m) => m.ts > conv.lastReadTs && m.userId !== ME && !m.system);
  const isDm = conv.kind !== 'channel';
  const mentionUnread = unread.filter((m) => m.isMention);
  const channelMentionsOnly = settings?.notifyMode === 'mentions' && !isDm;
  const relevantUnread = channelMentionsOnly ? mentionUnread : unread;
  return {
    ...conv,
    hasUnread: !conv.muted && relevantUnread.length > 0,
    unreadCount: conv.muted ? 0 : isDm ? unread.length : mentionUnread.length,
    // 线程回复不在主时间线里，但 sendMessage 会先写入 lastActivityTs=now；取较大值避免被盖掉
    lastActivityTs: Math.max(
      conv.lastActivityTs,
      timeline.length > 0 ? timeline[timeline.length - 1].ts : 0,
    ),
  };
}

function buildInitialState(): FullState {
  const users: SlackUser[] = SLACK_CONFIG.users.map((u) => ({
    ...u,
    avatarSrc: USER_AVATARS[u.id],
  }));
  const sections: Section[] = SLACK_CONFIG.sections.map((s) => ({ ...s }));
  const messages: Message[] = SLACK_CONFIG.messages.map(buildMessage);

  const conversations: Conversation[] = SLACK_CONFIG.conversations.map((raw: RawConversation) => {
    const timeline = timelineOf(messages, raw.id);
    // lastReadIndex：读到第 N 条为止（99 = 全部已读）
    const idx = Math.min(raw.lastReadIndex, timeline.length);
    const lastReadTs = idx <= 0 ? 0 : timeline[idx - 1].ts;
    const base: Conversation = {
      id: raw.id,
      kind: raw.kind as Conversation['kind'],
      name: raw.name,
      isPrivate: raw.isPrivate,
      topic: raw.topic,
      description: raw.description,
      memberIds: [...raw.memberIds],
      sectionId: raw.sectionId,
      unreadCount: 0,
      hasUnread: false,
      lastReadTs,
      muted: raw.muted,
      starred: raw.starred,
      archived: false,
      memberSuggestion: true,
      creatorId: ME,
      createdTs: timeline.length > 0 ? timeline[0].ts : dayTs(-30, 540),
      draft: raw.draft,
      lastActivityTs: dayTs(raw.lastActivity.dayOffset, raw.lastActivity.timeMin),
    };
    return recomputeUnread(base, messages, {
      ...SLACK_CONFIG.settings,
      customizeOrder: [...SLACK_CONFIG.settings.customizeOrder],
      customizeEnabled: { ...SLACK_CONFIG.settings.customizeEnabled },
      fileTypeFilters: [...DEFAULT_FILE_TYPE_FILTERS],
      messagePreview: true,
      soundEnabled: true,
    } as FullState['settings']);
  });

  const activity: ActivityItem[] = SLACK_CONFIG.activity.map((a) => ({
    id: a.id,
    kind: a.kind as ActivityItem['kind'],
    userId: a.userId,
    convId: a.convId,
    messageId: a.messageId,
    text: a.text,
    emoji: a.emoji,
    ts: dayTs(a.dayOffset, a.timeMin),
    read: a.read,
  }));

  return {
    _dataVersion: DATA_VERSION,
    users,
    sections,
    conversations,
    messages,
    mutedThreads: [],
    reminders: [],
    activity,
    searchHistory: [...SLACK_CONFIG.searchHistory],
    status: { ...SLACK_CONFIG.status },
    settings: {
      ...SLACK_CONFIG.settings,
      customizeOrder: [...SLACK_CONFIG.settings.customizeOrder],
      customizeEnabled: { ...SLACK_CONFIG.settings.customizeEnabled },
      fileTypeFilters: [...DEFAULT_FILE_TYPE_FILTERS],
      messagePreview: true,
      soundEnabled: true,
    } as FullState['settings'],
    workspace: {
      name: SLACK_CONFIG.workspace.name,
      url: SLACK_CONFIG.workspace.url,
      memberCount: SLACK_CONFIG.workspace.memberCount,
    },
    threadReadTs: {},
    savedBuckets: {},
    _temp: {
      toast: '',
      toastKey: '',
      toastSeq: 0,
      guideCleared: false,
      draftSelection: [],
      statusNoticeDismissed: false,
    },
  };
}

const initialState = buildInitialState();

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

/** 空白消息骨架，各处按需覆盖字段（少写十几行 false） */
function blankMessage(convId: string, userId: string, text: string, ts: number): Message {
  return {
    id: genId('m'),
    convId,
    userId,
    text,
    ts,
    edited: false,
    reactions: [],
    attachments: [],
    threadParentId: null,
    replyCount: 0,
    replyUserIds: [],
    pinned: false,
    saved: false,
    isMention: false,
    system: false,
    deleted: false,
    bigEmoji: false,
    quote: null,
    alsoSent: false,
  };
}

export const useSlackStore = createAppStoreWithActions<FullState, AppActions>(
  'slack',
  initialState,
  (set, get) => ({
    showToast: (msg) =>
      set((s) => ({
        _temp: { ...s._temp, toast: msg, toastKey: '', toastSeq: s._temp.toastSeq + 1 },
      })),

    notImplemented: () =>
      set((s) => ({
        _temp: {
          ...s._temp,
          toast: '',
          toastKey: 'common.notImplemented',
          toastSeq: s._temp.toastSeq + 1,
        },
      })),

    sendMessage: (convId, text, opts) => {
      const id = genId('m');
      const threadParentId = opts?.threadParentId ?? null;
      set((s) => {
        const now = TimeService.now();
        const msg: Message = {
          id,
          convId,
          userId: ME,
          text: text.trim(),
          ts: now,
          edited: false,
          reactions: [],
          attachments: opts?.attachments ?? [],
          threadParentId,
          replyCount: 0,
          replyUserIds: [],
          pinned: false,
          saved: false,
          isMention: false,
          system: false,
          deleted: false,
          bigEmoji: /^\p{Extended_Pictographic}{1,3}$/u.test(text.trim()),
          quote: opts?.quote ?? null,
          alsoSent: opts?.alsoSent ?? false,
        };
        let messages = [...s.messages, msg];
        // 回复消息列时，主消息的回复数与参与者要跟着更新
        if (threadParentId) {
          messages = messages.map((m) =>
            m.id === threadParentId
              ? {
                  ...m,
                  replyCount: m.replyCount + 1,
                  replyUserIds: m.replyUserIds.includes(ME)
                    ? m.replyUserIds
                    : [...m.replyUserIds, ME],
                }
              : m,
          );
        }
        // 勾了「同时发送至 #频道」→ 主时间线也留一条（带来源标记）
        if (threadParentId && opts?.alsoSent) {
          messages = [...messages, { ...msg, id: `${id}_also`, threadParentId: null }];
        }
        return {
          messages,
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? recomputeUnread({ ...c, lastReadTs: now, draft: '', lastActivityTs: now }, messages, s.settings)
              : c,
          ),
        };
      });
      return id;
    },

    editMessage: (id, text) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === id ? { ...m, text: text.trim(), edited: true } : m,
        ),
      })),

    deleteMessage: (id) =>
      set((s) => ({
        messages: s.messages.map((m) =>
          m.id === id
            ? { ...m, deleted: true, text: '', attachments: [], reactions: [], bigEmoji: false }
            : m,
        ),
      })),

    toggleReaction: (messageId, emoji) =>
      set((s) => ({
        messages: s.messages.map((m) => {
          if (m.id !== messageId) return m;
          const hit = m.reactions.find((r) => r.emoji === emoji);
          if (!hit) return { ...m, reactions: [...m.reactions, { emoji, userIds: [ME] }] };
          const mine = hit.userIds.includes(ME);
          const userIds = mine ? hit.userIds.filter((u) => u !== ME) : [...hit.userIds, ME];
          return {
            ...m,
            reactions:
              userIds.length === 0
                ? m.reactions.filter((r) => r.emoji !== emoji)
                : m.reactions.map((r) => (r.emoji === emoji ? { ...r, userIds } : r)),
          };
        }),
      })),

    toggleSaved: (messageId) =>
      set((s) => {
        const cur = s.messages.find((m) => m.id === messageId);
        const nextSaved = !cur?.saved;
        const { [messageId]: _drop, ...restBuckets } = s.savedBuckets;
        return {
          messages: s.messages.map((m) =>
            m.id === messageId ? { ...m, saved: nextSaved } : m,
          ),
          // 取消保存时清掉 done/archived，避免再次保存直接进「已完成」
          savedBuckets: nextSaved ? s.savedBuckets : restBuckets,
        };
      }),

    togglePinned: (messageId) =>
      set((s) => ({
        messages: s.messages.map((m) => (m.id === messageId ? { ...m, pinned: !m.pinned } : m)),
      })),

    toggleThreadMute: (messageId) =>
      set((s) => ({
        mutedThreads: s.mutedThreads.includes(messageId)
          ? s.mutedThreads.filter((x) => x !== messageId)
          : [...s.mutedThreads, messageId],
      })),

    addReminder: (messageId, minutes) =>
      set((s) => {
        const msg = s.messages.find((m) => m.id === messageId);
        if (!msg) return {} as Partial<FullState>;
        return {
          reminders: [
            ...s.reminders,
            {
              id: genId('r'),
              messageId,
              convId: msg.convId,
              dueTs: TimeService.now() + minutes * 60_000,
            },
          ],
        };
      }),

    fireDueReminders: (noticePrefix) =>
      set((s) => {
        const now = TimeService.now();
        const due = s.reminders.filter((r) => r.dueTs <= now);
        if (due.length === 0) return {} as Partial<FullState>;
        const notes: Message[] = due.map((r) => {
          const src = s.messages.find((m) => m.id === r.messageId);
          return blankMessage(
            SLACKBOT_DM,
            'u_slackbot',
            `${noticePrefix}「${(src?.text ?? '').slice(0, 60)}」`,
            now,
          );
        });
        const messages = [...s.messages, ...notes];
        return {
          messages,
          reminders: s.reminders.filter((r) => r.dueTs > now),
          conversations: s.conversations.map((c) =>
            c.id === SLACKBOT_DM ? recomputeUnread({ ...c, lastActivityTs: now }, messages, s.settings) : c,
          ),
        };
      }),

    forwardMessage: (messageId, targetConvId, note) =>
      set((s) => {
        const src = s.messages.find((m) => m.id === messageId);
        if (!src) return {} as Partial<FullState>;
        const srcConv = s.conversations.find((c) => c.id === src.convId);
        const now = TimeService.now();
        const msg: Message = {
          id: genId('m'),
          convId: targetConvId,
          userId: ME,
          text: note.trim(),
          ts: now,
          edited: false,
          reactions: [],
          attachments: src.attachments.map((a) => ({ ...a })),
          threadParentId: null,
          replyCount: 0,
          replyUserIds: [],
          pinned: false,
          saved: false,
          isMention: false,
          system: false,
          deleted: false,
          bigEmoji: false,
          quote: {
            userId: src.userId,
            text: src.text,
            convName: srcConv?.name ?? '',
          },
          alsoSent: false,
        };
        const messages = [...s.messages, msg];
        return {
          messages,
          conversations: s.conversations.map((c) =>
            c.id === targetConvId
              ? recomputeUnread({ ...c, lastReadTs: now, lastActivityTs: now }, messages, s.settings)
              : c,
          ),
        };
      }),

    setDraft: (convId, text) =>
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === convId ? { ...c, draft: text } : c)),
      })),

    clearDraft: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === convId ? { ...c, draft: '' } : c)),
      })),

    markRead: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? recomputeUnread({ ...c, lastReadTs: TimeService.now() }, s.messages, s.settings) : c,
        ),
      })),

    markUnread: (convId, fromTs) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? recomputeUnread({ ...c, lastReadTs: fromTs - 1 }, s.messages, s.settings) : c,
        ),
      })),

    markThreadRead: (parentMessageId, ts) =>
      set((s) => ({
        threadReadTs: {
          ...s.threadReadTs,
          [parentMessageId]: ts ?? TimeService.now(),
        },
      })),

    toggleMute: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? recomputeUnread({ ...c, muted: !c.muted }, s.messages, s.settings) : c,
        ),
      })),

    toggleStar: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId
            ? { ...c, starred: !c.starred, sectionId: !c.starred ? 's_starred' : originalSection(c) }
            : c,
        ),
      })),

    createChannel: (name, isPrivate, opts) => {
      const id = genId('c');
      set((s) => {
        const now = TimeService.now();
        const channelName = name.trim().replace(/\s+/g, '-');
        const conv: Conversation = {
          id,
          kind: 'channel',
          name: channelName,
          isPrivate,
          topic: '',
          description: '',
          memberIds: [ME],
          sectionId: 's_channels',
          unreadCount: 0,
          hasUnread: false,
          lastReadTs: now,
          muted: false,
          starred: false,
          archived: false,
          memberSuggestion: true,
          creatorId: ME,
          createdTs: now,
          draft: '',
          lastActivityTs: now,
        };
        // 创建者自己也落一条「X 已加入 #频道」系统消息（与加人入口一致）
        const meName = s.users.find((u) => u.id === ME)?.displayName ?? '';
        const joinNote =
          opts?.joinText && meName
            ? [{ ...blankMessage(id, ME, opts.joinText(meName), now), system: true as const }]
            : [];
        return {
          conversations: [...s.conversations, conv],
          messages: joinNote.length > 0 ? [...s.messages, ...joinNote] : s.messages,
        };
      });
      return id;
    },

    updateChannel: (convId, patch) =>
      set((s) => ({
        conversations: s.conversations.map((c) => (c.id === convId ? { ...c, ...patch } : c)),
      })),

    leaveChannel: (convId) =>
      set((s) => ({
        conversations: s.conversations.filter((c) => c.id !== convId),
        messages: s.messages.filter((m) => m.convId !== convId),
      })),

    archiveChannel: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? { ...c, archived: true, hasUnread: false, unreadCount: 0 } : c,
        ),
      })),

    convertToPrivate: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? { ...c, isPrivate: true } : c,
        ),
      })),

    toggleMemberSuggestion: (convId) =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === convId ? { ...c, memberSuggestion: !c.memberSuggestion } : c,
        ),
      })),

    addMembers: (convId, userIds, joinText) =>
      set((s) => {
        const now = TimeService.now();
        const fresh = userIds.filter((id) => {
          const conv = s.conversations.find((c) => c.id === convId);
          return !conv?.memberIds.includes(id);
        });
        const notes = joinText
          ? fresh.map((id, i) => {
              const name = s.users.find((u) => u.id === id)?.displayName ?? '';
              const note = blankMessage(convId, id, joinText(name), now + i);
              return { ...note, system: true };
            })
          : [];
        const messages = notes.length > 0 ? [...s.messages, ...notes] : s.messages;
        return {
          messages,
          conversations: s.conversations.map((c) =>
            c.id === convId
              ? { ...c, memberIds: Array.from(new Set([...c.memberIds, ...userIds])) }
              : c,
          ),
        };
      }),

    openDm: (userId) => {
      const state = get();
      const existing = state.conversations.find(
        (c) => c.kind === 'dm' && c.memberIds.includes(userId) && c.memberIds.length <= 2,
      );
      if (existing) return existing.id;
      const id = genId('d');
      const user = state.users.find((u) => u.id === userId);
      set((s) => {
        const now = TimeService.now();
        const conv: Conversation = {
          id,
          kind: 'dm',
          name: user?.displayName ?? '私信',
          isPrivate: false,
          topic: '',
          description: '',
          memberIds: [ME, userId],
          sectionId: 's_dms',
          unreadCount: 0,
          hasUnread: false,
          lastReadTs: now,
          muted: false,
          starred: false,
          archived: false,
          memberSuggestion: true,
          creatorId: ME,
          createdTs: now,
          draft: '',
          lastActivityTs: now,
        };
        return { conversations: [...s.conversations, conv] };
      });
      return id;
    },

    openGroupDm: (userIds) => {
      const state = get();
      const wanted = Array.from(new Set([ME, ...userIds])).sort();
      const existing = state.conversations.find(
        (c) =>
          c.kind !== 'channel' &&
          c.memberIds.length === wanted.length &&
          [...c.memberIds].sort().every((id, i) => id === wanted[i]),
      );
      if (existing) return existing.id;
      const id = genId('g');
      const names = userIds
        .map((uid) => state.users.find((u) => u.id === uid)?.displayName ?? '')
        .filter(Boolean);
      set((s) => {
        const now = TimeService.now();
        const conv: Conversation = {
          id,
          kind: userIds.length > 1 ? 'group' : 'dm',
          name: names.join('、'),
          isPrivate: false,
          topic: '',
          description: '',
          memberIds: wanted,
          sectionId: 's_dms',
          unreadCount: 0,
          hasUnread: false,
          lastReadTs: now,
          muted: false,
          starred: false,
          archived: false,
          memberSuggestion: true,
          creatorId: ME,
          createdTs: now,
          draft: '',
          lastActivityTs: now,
        };
        return { conversations: [...s.conversations, conv] };
      });
      return id;
    },

    replyAsUser: (convId, userId, text) =>
      set((s) => {
        const now = TimeService.now();
        const messages = [...s.messages, blankMessage(convId, userId, text, now)];
        return {
          messages,
          conversations: s.conversations.map((c) =>
            c.id === convId ? recomputeUnread({ ...c, lastActivityTs: now }, messages, s.settings) : c,
          ),
        };
      }),

    toggleSection: (sectionId) =>
      set((s) => ({
        sections: s.sections.map((sec) =>
          sec.id === sectionId ? { ...sec, collapsed: !sec.collapsed } : sec,
        ),
      })),

    readActivity: (id) =>
      set((s) => ({ activity: s.activity.map((a) => (a.id === id ? { ...a, read: true } : a)) })),

    pushSearchHistory: (q) =>
      set((s) => {
        const term = q.trim();
        if (!term) return {} as Partial<FullState>;
        return { searchHistory: [term, ...s.searchHistory.filter((x) => x !== term)].slice(0, 10) };
      }),

    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    togglePresence: () =>
      set((s) => ({
        users: s.users.map((u) => (u.id === ME ? { ...u, online: !u.online } : u)),
      })),

    setStatus: (patch) =>
      set((s) => {
        const status = { ...s.status, ...patch };
        return { status, users: syncMeStatus(s.users, status) };
      }),

    clearStatus: () =>
      set((s) => {
        const status: UserStatus = { emoji: '', text: '', clearAfter: '', clearAtTs: null };
        return { status, users: syncMeStatus(s.users, status) };
      }),

    dismissStatusNotice: () =>
      set((s) => ({ _temp: { ...s._temp, statusNoticeDismissed: true } })),

    completeSavedItem: (messageId, bucket) =>
      set((s) => ({
        savedBuckets: { ...s.savedBuckets, [messageId]: bucket },
      })),

    addSavedItem: (text) => {
      const body = text.trim();
      if (!body) return null;
      let createdId: string | null = null;
      set((s) => {
        const host =
          s.conversations.find((c) => c.kind === 'channel' && !c.archived) ?? s.conversations[0];
        if (!host) return {};
        const now = TimeService.now();
        const msg = blankMessage(host.id, ME, body, now);
        msg.saved = true;
        createdId = msg.id;
        return {
          messages: [...s.messages, msg],
          conversations: s.conversations.map((c) =>
            c.id === host.id ? { ...c, lastActivityTs: now } : c,
          ),
        };
      });
      return createdId;
    },

    toggleFileTypeFilter: (typeId) =>
      set((s) => {
        const cur = s.settings.fileTypeFilters;
        const next = cur.includes(typeId) ? cur.filter((x) => x !== typeId) : [...cur, typeId];
        return { settings: { ...s.settings, fileTypeFilters: next } };
      }),

    setSetting: (key, value) =>
      set((s) => {
        const settings = { ...s.settings, [key]: value };
        const affectsUnread = key === 'notifyMode' || key === 'notificationsPausedUntil';
        return {
          settings,
          conversations: affectsUnread
            ? s.conversations.map((c) => recomputeUnread(c, s.messages, settings))
            : s.conversations,
        };
      }),

    pauseNotifications: (untilTs) =>
      set((s) => {
        const settings = { ...s.settings, notificationsPausedUntil: untilTs };
        return {
          settings,
          conversations: s.conversations.map((c) => recomputeUnread(c, s.messages, settings)),
        };
      }),

    moveCustomizeItem: (id, dir) =>
      set((s) => {
        const order = [...s.settings.customizeOrder];
        const i = order.indexOf(id);
        const j = dir === 'after' ? i + 1 : i - 1;
        if (i < 0 || j < 0 || j >= order.length) return {} as Partial<FullState>;
        [order[i], order[j]] = [order[j], order[i]];
        return { settings: { ...s.settings, customizeOrder: order } };
      }),

    toggleCustomizeCard: (id) =>
      set((s) => ({
        settings: {
          ...s.settings,
          customizeEnabled: {
            ...s.settings.customizeEnabled,
            [id]: !s.settings.customizeEnabled[id],
          },
        },
      })),

    updateUser: (userId, patch) =>
      set((s) => ({
        users: s.users.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
      })),

    clearGuideCards: () => set((s) => ({ _temp: { ...s._temp, guideCleared: true } })),

    toggleDraftSelection: (convId) =>
      set((s) => ({
        _temp: {
          ...s._temp,
          draftSelection: s._temp.draftSelection.includes(convId)
            ? s._temp.draftSelection.filter((x) => x !== convId)
            : [...s._temp.draftSelection, convId],
        },
      })),

    resetDraftSelection: () => set((s) => ({ _temp: { ...s._temp, draftSelection: [] } })),

    deleteSelectedDrafts: () =>
      set((s) => ({
        conversations: s.conversations.map((c) =>
          s._temp.draftSelection.includes(c.id) ? { ...c, draft: '' } : c,
        ),
        _temp: { ...s._temp, draftSelection: [] },
      })),
  }),
  {
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useSlackStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useSlackStore.setState({ ...buildInitialState() });
        }
      });
    },
  },
);

/** 取消星标时归位到原分区：频道回「频道」，私信回「私信」 */
function originalSection(c: Conversation): string {
  return c.kind === 'channel' ? 's_channels' : 's_dms';
}

export { timelineOf };
