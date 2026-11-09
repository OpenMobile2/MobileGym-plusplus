/**
 * 邮件列表页 —— 一套组件覆盖底稿里的 13 个列表相关节点。
 * 对照 IMG_2168/2169/2170/2172/2174/2199/2200/2201/2202/2203/2205/2206/2207/2211。
 */
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { ACCOUNT_FOLDERS, CATEGORY_BANNERS, CATEGORY_TABS, REMIND_OPTIONS, SMART_MAILBOXES } from '../constants';
import { MAIL_CONFIG } from '../data';
import * as TimeService from '../../../os/TimeService';
import {
  bundleBySender,
  filterByCategory,
  mailsInMailbox,
  selectSelectedIdSet,
  useMailStore,
} from '../state';
import { EmptyState, MenuRow, Popover, SenderAvatar, Sheet, showToast } from '../components/ui';
import { MailRow } from '../components/MailRow';
import { SwipeableRow, UnreadDot } from '../components/SwipeableRow';
import { CategoryTabs } from '../components/CategoryTabs';
import { BottomBar, SelectionBar } from '../components/BottomBar';
import { formatListTime } from '../utils/formatMailTime';
import {
  IcCheck, IcChevronRight, IcClose, IcFlag, IcFolder, IcForward, IcJunk, IcMarkRead, IcMore,
  IcMute, IcNavBack, IcNotifyMe, IcPrimary, IcReply, IcReplyAll, IcSelectOff, IcSelectOn,
  IcSendLater, IcTrash, IconRenderer,
} from '../res/icons';
import type { Mail, MailCategory } from '../types';

/** 解析邮箱 id → 标题、副标题、是否显示分类行、列表显示收件人还是发件人 */
function useMailboxMeta(mailboxId: string) {
  const s = useAppStrings(strings, stringsEn);
  return useMemo(() => {
    if (mailboxId.includes(':')) {
      const [accountId, folder] = mailboxId.split(':');
      const account = MAIL_CONFIG.accounts.find((a) => a.id === accountId);
      const def = ACCOUNT_FOLDERS.find((f) => f.folder === folder);
      const custom = !def;
      return {
        title: def ? s[def.labelKey] : folder,
        subtitle: account?.label ?? '',
        showCategories: folder === 'inbox',
        showRecipient: folder === 'drafts' || folder === 'sent',
        isDrafts: folder === 'drafts',
        custom,
      };
    }
    const def = SMART_MAILBOXES.find((m) => m.id === mailboxId);
    return {
      title: def ? s[def.labelKey] : mailboxId,
      subtitle: '',
      showCategories: mailboxId === 'all-inboxes',
      showRecipient: mailboxId === 'all-sent',
      isDrafts: false,
      custom: false,
    };
  }, [mailboxId, s]);
}

export default function MailListPage() {
  const s = useAppStrings(strings, stringsEn);
  const { mailboxId = 'all-inboxes' } = useParams<{ mailboxId: string }>();
  const [params] = useSearchParams();
  const meta = useMailboxMeta(mailboxId);

  const mails = useMailStore((st) => st.mails);
  const viewMode = useMailStore((st) => st.settings.viewMode);
  const dismissed = useMailStore((st) => st.dismissedBanners);

  const selecting = params.get('select') === '1';
  const filtered = params.get('filter') === 'unread';
  const sheet = params.get('sheet');
  const menu = params.get('menu');
  const category = (params.get('category') ?? 'primary') as MailCategory | 'all';

  const inMailbox = useMemo(() => mailsInMailbox(mails, mailboxId), [mails, mailboxId]);

  const shown = useMemo(() => {
    let list = inMailbox;
    if (meta.showCategories && viewMode === 'categories') list = filterByCategory(list, category);
    if (filtered) list = list.filter((m) => !m.isRead);
    return list;
  }, [inMailbox, meta.showCategories, viewMode, category, filtered]);

  const unreadByCategory = useMemo(() => {
    const out: Record<string, boolean> = {};
    for (const tab of CATEGORY_TABS) {
      out[tab.id] = filterByCategory(inMailbox, tab.id).some((m) => !m.isRead);
    }
    return out;
  }, [inMailbox]);

  const activeTab = CATEGORY_TABS.find((t) => t.id === category);
  const bundled = Boolean(activeTab?.bundled) && viewMode === 'categories' && meta.showCategories;
  const banner = CATEGORY_BANNERS[category];
  const showBanner = Boolean(banner) && bundled && !dismissed.includes(category);

  return (
    <div className="flex h-full flex-col bg-white pt-10" data-status-bar-foreground="dark">
      {selecting ? (
        <SelectHeader mailboxId={mailboxId} listIds={shown.map((m) => m.id)} />
      ) : (
        <ListHeader title={meta.title} subtitle={meta.subtitle} mailboxId={mailboxId} canSelect={inMailbox.length > 0} />
      )}

      {meta.showCategories && viewMode === 'categories' && !selecting && (
        <CategoryTabs mailboxId={mailboxId} active={category} unreadByCategory={unreadByCategory} />
      )}

      <div
        className="flex flex-1 flex-col overflow-y-auto no-scrollbar"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {showBanner && <CategoryBanner category={category} />}

        {shown.length === 0 ? (
          <EmptyState text={s.no_messages} />
        ) : bundled ? (
          <BundledList mails={shown} mailboxId={mailboxId} />
        ) : (
          <div>
            {shown.map((m) =>
              selecting ? (
                <SelectableRow key={m.id} mail={m} showRecipient={meta.showRecipient} />
              ) : meta.isDrafts ? (
                <DraftRow key={m.id} mail={m} mailboxId={mailboxId} />
              ) : (
                <MailRow key={m.id} mail={m} mailboxId={mailboxId} showRecipient={meta.showRecipient} />
              ),
            )}
          </div>
        )}
      </div>

      {selecting ? <SelectionFooter mailboxId={mailboxId} /> : <BottomBar mailboxId={mailboxId} filtered={filtered} />}

      {menu === 'more' && <MoreMenu />}
      {sheet === 'context' && <ContextMenu mailboxId={mailboxId} />}
      {sheet === 'remind' && <RemindMenu />}
      {sheet === 'move' && <MoveSheet />}
    </div>
  );
}

// ——————————————————— 顶栏 ———————————————————

function ListHeader({
  title,
  subtitle,
  mailboxId,
  canSelect,
}: {
  title: string;
  subtitle: string;
  mailboxId: string;
  canSelect: boolean;
}) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useMailGestures();
  return (
    <div className="flex-shrink-0 px-4">
      <div className="flex items-center gap-2">
        <button {...bindBack()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
          <IcNavBack size={20} />
        </button>
        <div className="flex-1" />
        {canSelect ? (
          <button
            {...bindTap('list.select.enter', { params: { mailboxId } })}
            className="rounded-full bg-white px-4 py-1.5 text-[15px] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          >
            {s.select}
          </button>
        ) : (
          <span className="rounded-full bg-white/60 px-4 py-1.5 text-[15px]" style={{ color: C.tertiaryLabel }}>
            {s.select}
          </span>
        )}
        <button
          {...bindTap('list.moreMenu.open', { params: { mailboxId } })}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
          aria-label={s.categories}
        >
          <IcMore size={18} />
        </button>
      </div>
      <h1 className="mt-2 text-[32px] font-bold leading-tight text-black">{title}</h1>
      <p className="mb-1 text-[13px]" style={{ color: C.secondaryLabel }}>
        {subtitle ? `${subtitle} · ${s.updated_just_now}` : s.updated_just_now}
      </p>
    </div>
  );
}

function SelectHeader({ mailboxId, listIds }: { mailboxId: string; listIds: string[] }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useMailGestures();
  const selectedIds = useMailStore((st) => st._temp.selectedIds);
  const selectAll = useMailStore((st) => st.selectAll);

  return (
    <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2">
      <button
        {...bindTap({ kind: 'action', id: 'mail.select.all' }, { onTrigger: () => selectAll(listIds) })}
        className="rounded-full bg-white px-4 py-1.5 text-[15px] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
      >
        {s.select_all}
      </button>
      <div className="flex-1 text-center">
        <div className="text-[16px] font-semibold text-black">
          {s.n_selected.replace('{n}', String(selectedIds.length))}
        </div>
        <div className="text-[12px]" style={{ color: C.secondaryLabel }}>
          {s.updated_just_now}
        </div>
      </div>
      <button {...bindBack()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
        <IcClose size={18} />
      </button>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/60">
        <IcMore size={18} style={{ color: C.tertiaryLabel }} />
      </span>
    </div>
  );
}

// ——————————————————— 列表内容 ———————————————————

function CategoryBanner({ category }: { category: string }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const dismissBanner = useMailStore((st) => st.dismissBanner);
  const cfg = CATEGORY_BANNERS[category];
  if (!cfg) return null;
  const bg = (C as Record<string, string>)[cfg.bgKey];
  const fg = (C as Record<string, string>)[cfg.textKey] ?? '#000';

  return (
    <div className="mx-4 mb-2 mt-1 rounded-[10px] px-4 py-3" style={{ background: bg }}>
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <div className="text-[16px] font-semibold" style={{ color: fg }}>
            {s[cfg.titleKey]}
          </div>
          <div className="mt-1 text-[14px] leading-snug" style={{ color: fg, opacity: 0.9 }}>
            {s[cfg.bodyKey]}
          </div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'mail.banner.dismiss' }, { onTrigger: () => dismissBanner(category) })}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'rgba(0,0,0,0.08)' }}
          aria-label="close"
        >
          <IcClose size={13} style={{ color: fg }} />
        </button>
      </div>
    </div>
  );
}

/**
 * 按发件人聚合的列表（Transactions / Updates / Promotions）。
 * gate4 #1：聚合行也要能左右滑和长按，所以同样套 SwipeableRow。
 * gate4 #3：组内有未读时要显示未读蓝点，否则和分类标签上的未读圆点显示矛盾。
 */
function BundledList({ mails, mailboxId }: { mails: Mail[]; mailboxId: string }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const showPhotos = useMailStore((st) => st.settings.showContactPhotos);
  const setRead = useMailStore((st) => st.setRead);

  const now = TimeService.now();
  const isNew = (m: Mail) => now - m.receivedAt < 86_400_000;
  const groups = useMemo(() => bundleBySender(mails), [mails]);
  const newGroups = groups.filter((g) => g.mails.some(isNew));
  const olderGroups = groups.filter((g) => !g.mails.some(isNew));

  const renderGroup = (g: { key: string; mails: Mail[] }) => {
    const head = g.mails[0];
    const groupUnread = g.mails.some((m) => !m.isRead);
    return (
      <SwipeableRow
        key={g.key}
        mail={head}
        mailboxId={mailboxId}
        // 一行代表这个发件人的一批邮件，蓝点也是"组内有未读"的意思，
        // 所以点开时把整组标为已读，否则读完回来点还在（gate4 轮2 #2）
        tapBinding={bindTap('message.open', {
          params: { mailId: head.id },
          beforeTrigger: () => setRead(g.mails.map((m) => m.id), true),
        })}
      >
        <UnreadDot unread={groupUnread} />
        {showPhotos && <SenderAvatar name={head.from.name} corporate />}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-black">{head.from.name}</span>
            <span className="flex-shrink-0 text-[13px]" style={{ color: C.secondaryLabel }}>
              {formatListTime(head.receivedAt, s)}
            </span>
            <IcChevronRight size={14} style={{ color: C.tertiaryLabel }} />
          </div>
          {g.mails.slice(0, 2).map((m) => (
            <div key={m.id} className="flex gap-1.5 text-[15px]" style={{ color: C.secondaryLabel }}>
              <span>•</span>
              <span className="truncate">{m.subject || s.no_subject}</span>
            </div>
          ))}
        </div>
      </SwipeableRow>
    );
  };

  return (
    <div>
      {newGroups.length > 0 && (
        <>
          <SectionTitle text={s.new_messages} />
          {newGroups.map(renderGroup)}
        </>
      )}
      {olderGroups.length > 0 && (
        <>
          <SectionTitle text={s.older_messages} />
          {olderGroups.map(renderGroup)}
        </>
      )}
    </div>
  );
}

function SectionTitle({ text }: { text: string }) {
  return (
    <div className="px-4 pb-1 pt-3 text-[13px]" style={{ color: C.secondaryLabel }}>
      {text}
    </div>
  );
}

/**
 * 草稿行：显示收件人 + 附件提示，点进去继续编辑。
 * gate4 #1：草稿行同样要能左右滑和长按。
 */
function DraftRow({ mail, mailboxId }: { mail: Mail; mailboxId: string }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const showPhotos = useMailStore((st) => st.settings.showContactPhotos);
  const who = mail.to[0]?.name || mail.to[0]?.address || '';

  return (
    <SwipeableRow
      mail={mail}
      mailboxId={mailboxId}
      tapBinding={bindTap('compose.editDraft', { params: { draft: mail.id } })}
    >
      <UnreadDot unread={false} />
      {showPhotos && <SenderAvatar name={who || '?'} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-black">{who}</span>
          <span className="flex-shrink-0 text-[13px]" style={{ color: C.secondaryLabel }}>
            {formatListTime(mail.receivedAt, s)}
          </span>
        </div>
        <div className="truncate text-[15px] text-black">{mail.subject || s.no_subject}</div>
        <div className="line-clamp-2 text-[15px]" style={{ color: C.secondaryLabel }}>
          {mail.attachments.length > 0
            ? `${s.attachment_prefix}${mail.attachments[0].name}`
            : mail.preview || s.no_content}
        </div>
      </div>
    </SwipeableRow>
  );
}

/** 多选模式下的行 */
function SelectableRow({ mail, showRecipient }: { mail: Mail; showRecipient?: boolean }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const selectedSet = useMailStore(selectSelectedIdSet);
  const toggleSelected = useMailStore((st) => st.toggleSelected);
  const showPhotos = useMailStore((st) => st.settings.showContactPhotos);
  const checked = selectedSet.has(mail.id);
  const who = showRecipient ? mail.to[0]?.name || mail.to[0]?.address || '' : mail.from.name;

  return (
    <button
      {...bindTap({ kind: 'action', id: 'mail.select.toggleOne' }, {
        params: { mailId: mail.id },
        onTrigger: () => toggleSelected(mail.id),
      })}
      className="flex w-full items-start gap-2.5 border-b px-3 py-2.5 text-left"
      style={{ borderColor: C.separator, background: checked ? '#EFEFF4' : '#fff' }}
    >
      <span className="mt-3 flex-shrink-0">
        {checked ? (
          <IcSelectOn size={22} style={{ color: C.accent }} />
        ) : (
          <IcSelectOff size={22} style={{ color: C.tertiaryLabel }} />
        )}
      </span>
      {showPhotos && <SenderAvatar name={who || '?'} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-black">{who}</span>
          <span className="flex-shrink-0 text-[13px]" style={{ color: C.secondaryLabel }}>
            {formatListTime(mail.receivedAt, s)}
          </span>
        </div>
        <div className="truncate text-[15px] text-black">{mail.subject || s.no_subject}</div>
        <div className="line-clamp-2 text-[15px]" style={{ color: C.secondaryLabel }}>
          {mail.preview || s.no_content}
        </div>
      </div>
    </button>
  );
}

function SelectionFooter({ mailboxId }: { mailboxId: string }) {
  const { back } = useMailGestures();
  const selectedIds = useMailStore((st) => st._temp.selectedIds);
  const trashMails = useMailStore((st) => st.trashMails);
  const toggleFlag = useMailStore((st) => st.toggleFlag);
  const clearSelection = useMailStore((st) => st.clearSelection);

  return (
    <SelectionBar
      mailboxId={mailboxId}
      count={selectedIds.length}
      onFlag={() => {
        selectedIds.forEach((id) => toggleFlag(id));
        clearSelection();
        back();
      }}
      onTrash={() => {
        trashMails(selectedIds);
        clearSelection();
        back();
      }}
    />
  );
}

// ——————————————————— 弹层 ———————————————————

function MoreMenu() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindActionThenBack } = useMailGestures();
  const viewMode = useMailStore((st) => st.settings.viewMode);
  const showPhotos = useMailStore((st) => st.settings.showContactPhotos);
  const setViewMode = useMailStore((st) => st.setViewMode);
  const toggleContactPhotos = useMailStore((st) => st.toggleContactPhotos);

  const Card = ({ mode, label }: { mode: 'categories' | 'list'; label: string }) => {
    const active = viewMode === mode;
    return (
      <button
        {...bindActionThenBack(mode === 'categories' ? 'mail.viewMode.select.categories' : 'mail.viewMode.select.listView', () =>
          setViewMode(mode),
        )}
        className="flex flex-1 flex-col items-center gap-2 px-3 py-3"
      >
        <div
          className="flex h-[86px] w-[52px] flex-col gap-1 rounded-[8px] border-2 p-1"
          style={{ borderColor: active ? C.accent : '#C7C7CC' }}
        >
          {mode === 'categories' && (
            <div className="flex gap-0.5">
              <span className="h-1.5 w-3 rounded-full" style={{ background: C.accent }} />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
              <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
            </div>
          )}
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-2 w-full rounded-sm bg-gray-200" />
          ))}
        </div>
        <span className="text-[13px] text-black">{label}</span>
        {active ? <IcSelectOn size={18} style={{ color: C.accent }} /> : <IcSelectOff size={18} style={{ color: C.tertiaryLabel }} />}
      </button>
    );
  };

  return (
    <Popover align="top-right">
      <div className="w-[248px]">
        <div className="flex border-b" style={{ borderColor: C.separator }}>
          <Card mode="categories" label={s.categories} />
          <Card mode="list" label={s.list_view} />
        </div>
        <MenuRow
          label={s.about_categories}
          icon={<IcPrimary size={17} />}
          bind={bindTap({ kind: 'action', id: 'mail.moreMenu.about' }, {
            onTrigger: () => showToast(s.feature_unavailable),
          })}
        />
        <MenuRow
          label={s.show_contact_photos}
          icon={showPhotos ? <IcCheck size={17} /> : undefined}
          last
          bind={bindTap({ kind: 'action', id: 'mail.moreMenu.contactPhotos' }, {
            onTrigger: () => toggleContactPhotos(),
          })}
        />
      </div>
    </Popover>
  );
}

function ContextMenu({ mailboxId }: { mailboxId: string }) {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const { bindTap, bindBack, bindActionThenBack } = useMailGestures();
  const mid = params.get('mid') ?? '';
  const mails = useMailStore((st) => st.mails);
  const mail = mails.find((m) => m.id === mid);
  const trashMails = useMailStore((st) => st.trashMails);
  const toggleFlag = useMailStore((st) => st.toggleFlag);
  const setRead = useMailStore((st) => st.setRead);
  const moveTo = useMailStore((st) => st.moveTo);
  const toggleMute = useMailStore((st) => st.toggleMute);
  const toggleNotifyMe = useMailStore((st) => st.toggleNotifyMe);

  if (!mail) return null;

  const quadClass = 'flex flex-1 flex-col items-center gap-1 py-3 text-[11px] text-black';

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.2)' }} aria-label="close" />

      {/* 邮件预览卡 */}
      <div className="mx-3 mb-2 overflow-hidden rounded-[14px] bg-white">
        {mail.badge && (
          <div className="flex items-center gap-1.5 border-b px-3 py-2 text-[13px]" style={{ borderColor: C.separator }}>
            <IconRenderer name="IcTransactions" size={14} />
            <span className="font-medium text-black">{mail.badge}</span>
          </div>
        )}
        <div className="flex items-start gap-2.5 px-3 py-2.5">
          <SenderAvatar name={mail.from.name} corporate />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="flex-1 truncate text-[16px] font-semibold text-black">{mail.from.name}</span>
              <span className="text-[13px]" style={{ color: C.secondaryLabel }}>
                {formatListTime(mail.receivedAt, s)}
              </span>
            </div>
            <div className="truncate text-[15px] font-semibold text-black">{mail.subject}</div>
            <div className="line-clamp-2 text-[15px]" style={{ color: C.secondaryLabel }}>
              {mail.preview}
            </div>
          </div>
        </div>
      </div>

      {/* 操作菜单 */}
      <div className="mx-3 mb-6 overflow-hidden rounded-[14px]" style={{ background: 'rgba(250,250,250,0.98)' }}>
        <div className="flex border-b" style={{ borderColor: C.separator }}>
          {/* transition id 必须是字符串字面量，静态分析才扫得到，所以这三个不走数组循环 */}
          <button {...bindTap('compose.reply', { params: { src: mail.id } })} className={quadClass}>
            <IcReply size={20} />
            {s.reply}
          </button>
          <button {...bindTap('compose.reply', { params: { src: mail.id, all: '1' } })} className={quadClass}>
            <IcReplyAll size={20} />
            {s.reply_all}
          </button>
          <button {...bindTap('compose.forward', { params: { src: mail.id } })} className={quadClass}>
            <IcForward size={20} />
            {s.forward}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'mail.context.trash' }, {
              onTrigger: () => trashMails([mail.id]),
            })}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-[11px]"
            style={{ color: C.destructive }}
          >
            <IcTrash size={20} />
            {s.trash}
          </button>
        </div>

        <MenuRow
          label={s.remind_me}
          icon={<IcSendLater size={17} />}
          bind={bindTap('list.remind.open', { params: { mailboxId, mid: mail.id } })}
        />
        <MenuRow
          label={mail.isFlagged ? s.unflag : s.flag}
          icon={<IcFlag size={17} />}
          bind={bindActionThenBack('mail.context.flag', () => toggleFlag(mail.id))}
        />
        <MenuRow
          label={mail.isRead ? s.mark_unread : s.mark_read}
          icon={<IcMarkRead size={17} />}
          bind={bindActionThenBack('mail.context.markRead', () => setRead([mail.id], !mail.isRead))}
        />
        <MenuRow
          label={s.notify_me}
          icon={<IcNotifyMe size={17} />}
          bind={bindActionThenBack('mail.context.notifyMe', () => toggleNotifyMe(mail.id))}
        />
        <MenuRow
          label={s.mute}
          icon={<IcMute size={17} />}
          bind={bindActionThenBack('mail.context.mute', () => toggleMute(mail.id))}
        />
        <MenuRow
          label={s.move_message}
          icon={<IcFolder size={17} />}
          bind={bindTap('list.contextMove.open', { params: { mailboxId, mid: mail.id } })}
        />
        <MenuRow
          label={s.move_to_junk}
          icon={<IcJunk size={17} />}
          last
          bind={bindActionThenBack('mail.context.moveJunk', () => moveTo([mail.id], 'junk'))}
        />
      </div>
    </div>
  );
}

function RemindMenu() {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const { bindActionThenBack } = useMailGestures();
  const mid = params.get('mid') ?? '';
  const remindMe = useMailStore((st) => st.remindMe);

  return (
    <Sheet>
      <p className="px-4 py-3 text-center text-[13px]" style={{ color: C.secondaryLabel }}>
        {s.remind_me}
      </p>
      {REMIND_OPTIONS.map((opt, i) => (
        <MenuRow
          key={opt.id}
          label={s[opt.labelKey]}
          last={i === REMIND_OPTIONS.length - 1}
          bind={bindActionThenBack('mail.remind.select.option', () => remindMe(mid, opt.offsetMinutes))}
        />
      ))}
    </Sheet>
  );
}

function MoveSheet() {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const { bindActionThenBack } = useMailGestures();
  const mid = params.get('mid') ?? '';
  const mails = useMailStore((st) => st.mails);
  const selectedIds = useMailStore((st) => st._temp.selectedIds);
  const customFolders = useMailStore((st) => st.customFolders);
  const moveTo = useMailStore((st) => st.moveTo);
  const clearSelection = useMailStore((st) => st.clearSelection);

  const targetIds = mid ? [mid] : selectedIds;
  const accountId = mails.find((m) => m.id === targetIds[0])?.accountId ?? MAIL_CONFIG.accounts[0].id;
  const options = [
    ...ACCOUNT_FOLDERS.map((f) => ({ id: f.folder as string, label: s[f.labelKey] })),
    ...customFolders.filter((f) => f.accountId === accountId).map((f) => ({ id: f.id, label: f.name })),
  ];

  return (
    <Sheet>
      <p className="px-4 py-3 text-center text-[13px]" style={{ color: C.secondaryLabel }}>
        {s.move_to}
      </p>
      {options.map((opt, i) => (
        <MenuRow
          key={opt.id}
          label={opt.label}
          icon={<IcFolder size={17} />}
          last={i === options.length - 1}
          bind={bindActionThenBack('mail.move.select.folder', () => {
            moveTo(targetIds, opt.id);
            clearSelection();
          })}
        />
      ))}
    </Sheet>
  );
}
