/**
 * 邮件详情页 —— 对照 IMG_2189/2190（单封）、2191/2192（地址菜单）、2193/2194（会话线程）。
 *
 * 阶段③ Q7 决定：顶栏右侧的 ∧∨ 上下一封切换整个移除，只保留返回键。
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { ACCOUNT_FOLDERS } from '../constants';
import { MAIL_CONFIG } from '../data';
import { threadOf, useMailStore } from '../state';
import { MenuRow, Popover, SenderAvatar, Sheet, showToast } from '../components/ui';
import { formatDetailTime, formatListTime } from '../utils/formatMailTime';
import {
  IcAttachment, IcCompose, IcContactCard, IcCopy, IcDownload, IcFileIcs, IcFileOther, IcFileZip,
  IcFlag, IcFolder, IcNavBack, IcReply, IcSearch, IcTrash,
} from '../res/icons';
import type { Mail, MailBlock } from '../types';

export default function MessageDetailPage() {
  const s = useAppStrings(strings, stringsEn);
  const { mailId = '' } = useParams<{ mailId: string }>();
  const [params] = useSearchParams();
  const mails = useMailStore((st) => st.mails);
  const setRead = useMailStore((st) => st.setRead);

  const mail = mails.find((m) => m.id === mailId);
  const thread = useMemo(() => (mail ? threadOf(mails, mail) : []), [mails, mail]);
  const isThread = thread.length > 1;

  // 打开即标为已读（阶段③ Q1）
  useEffect(() => {
    if (mail && !mail.isRead) setRead([mail.id], true);
  }, [mail, setRead]);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  useEffect(() => {
    // 会话里默认只展开最新那封
    setExpandedIds(mail ? [thread[thread.length - 1]?.id ?? mail.id] : []);
  }, [mailId, mail, thread]);

  if (!mail) {
    return (
      <div className="flex h-full items-center justify-center bg-white pt-10" data-status-bar-foreground="dark">
        <span style={{ color: C.secondaryLabel }}>{s.no_messages}</span>
      </div>
    );
  }

  const sheet = params.get('sheet');
  const addrOpen = params.get('addr') === 'open';

  return (
    <div className="flex h-full flex-col bg-white pt-10" data-status-bar-foreground="dark">
      <DetailHeader title={isThread ? s.n_messages.replace('{n}', String(thread.length)) : ''} />

      <div
        className="flex-1 overflow-y-auto no-scrollbar"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {isThread
          ? thread.map((m, i) => (
              <ThreadEntry
                key={m.id}
                mail={m}
                expanded={expandedIds.includes(m.id)}
                onToggle={() =>
                  setExpandedIds((prev) =>
                    prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id],
                  )
                }
                showSource={i > 0 && m.folder !== thread[i - 1].folder}
              />
            ))
          : <SingleMessage mail={mail} />}
      </div>

      <DetailToolbar mail={mail} />

      {addrOpen && <AddressMenu />}
      {sheet === 'move' && <DetailMoveSheet mailId={mail.id} />}
    </div>
  );
}

function DetailHeader({ title }: { title: string }) {
  const { bindBack } = useMailGestures();
  return (
    <div className="flex flex-shrink-0 items-center px-4 pb-2">
      <button
        {...bindBack()}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
      >
        <IcNavBack size={20} />
      </button>
      <span className="flex-1 text-center text-[17px] font-semibold text-black">{title}</span>
      <span className="h-9 w-9" />
    </div>
  );
}

/** 单封邮件：头部 + 大字主题 + 正文 */
function SingleMessage({ mail }: { mail: Mail }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4">
      {expanded ? (
        <div className="border-b py-3" style={{ borderColor: C.separator }}>
          <div className="flex items-start gap-2.5">
            <SenderAvatar name={mail.from.name} corporate size={44} />
            <div className="min-w-0 flex-1">
              <AddressLine mailId={mail.id} label={s.from_label} name={mail.from.name} />
              <AddressLine mailId={mail.id} label={s.to_label} name={mail.to[0]?.address ?? ''} />
              <div className="text-[15px]" style={{ color: C.secondaryLabel }}>
                {formatDetailTime(mail.receivedAt, s)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <button
          {...bindTap({ kind: 'action', id: 'mail.detail.expandHeader' }, { onTrigger: () => setExpanded(true) })}
          className="flex w-full items-start gap-2.5 border-b py-3 text-left"
          style={{ borderColor: C.separator }}
        >
          <SenderAvatar name={mail.from.name} corporate size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="flex-1 truncate text-[17px] font-semibold text-black">{mail.from.name}</span>
              <span className="text-[14px]" style={{ color: C.secondaryLabel }}>
                {formatListTime(mail.receivedAt, s)}
              </span>
            </div>
            <div className="truncate text-[15px]" style={{ color: C.secondaryLabel }}>
              {s.to_label}
              {mail.to[0]?.address ?? ''} ›
            </div>
          </div>
        </button>
      )}

      <h1 className="py-3 text-[26px] font-bold leading-tight text-black">{mail.subject}</h1>
      <MailBody blocks={mail.body} />
      {mail.attachments.length > 0 && <AttachmentCards mail={mail} />}
      <div className="h-6" />
    </div>
  );
}

function AddressLine({ mailId, label, name }: { mailId: string; label: string; name: string }) {
  const { bindTap } = useMailGestures();
  return (
    <div className="flex items-baseline gap-1 text-[15px]">
      <span style={{ color: C.secondaryLabel }}>{label}</span>
      <button
        {...bindTap('detail.addr.open', { params: { mailId, addrValue: name } })}
        className="truncate font-medium"
        style={{ color: C.accent }}
      >
        {name}
      </button>
      <span style={{ color: C.tertiaryLabel }}>›</span>
    </div>
  );
}

/** 会话线程里的一封：展开显示全文，折叠显示灰条 */
function ThreadEntry({
  mail,
  expanded,
  onToggle,
  showSource,
}: {
  mail: Mail;
  expanded: boolean;
  onToggle: () => void;
  showSource: boolean;
}) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const account = MAIL_CONFIG.accounts.find((a) => a.id === mail.accountId);
  const folderDef = ACCOUNT_FOLDERS.find((f) => f.folder === mail.folder);
  const sourceText = s.found_in.replace(
    '{mailbox}',
    `${account?.label ?? ''} ${folderDef ? s[folderDef.labelKey] : mail.folder}`,
  );

  if (!expanded) {
    return (
      <>
        {showSource && (
          <div className="flex items-center gap-1.5 px-4 py-2 text-[13px]" style={{ color: C.secondaryLabel }}>
            <IcReply size={13} />
            {sourceText}
          </div>
        )}
        <button
          {...bindTap({ kind: 'action', id: 'mail.thread.expand' }, {
            params: { mailId: mail.id },
            onTrigger: onToggle,
          })}
          className="mx-3 mb-2 flex w-[calc(100%-24px)] items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left"
          style={{ background: '#F2F2F7' }}
        >
          <SenderAvatar name={mail.from.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="flex-1 truncate text-[15px] font-semibold" style={{ color: C.secondaryLabel }}>
                {mail.from.name}
              </span>
              <span className="text-[13px]" style={{ color: C.secondaryLabel }}>
                {formatListTime(mail.receivedAt, s)}
              </span>
              {mail.attachments.length > 0 && <IcAttachment size={12} style={{ color: C.secondaryLabel }} />}
              {mail.isFlagged && <IcFlag size={12} style={{ color: C.flagOrange }} />}
            </div>
            <div className="truncate text-[14px]" style={{ color: C.secondaryLabel }}>
              {mail.preview || mail.subject}
            </div>
          </div>
        </button>
      </>
    );
  }

  return (
    <div className="border-b px-4 pb-4" style={{ borderColor: C.separator }}>
      {showSource && (
        <div className="flex items-center gap-1.5 py-2 text-[13px]" style={{ color: C.secondaryLabel }}>
          <IcReply size={13} />
          {sourceText}
        </div>
      )}
      <div className="flex items-start gap-2.5 border-b py-3" style={{ borderColor: C.separator }}>
        <SenderAvatar name={mail.from.name} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="flex-1 truncate text-[16px] font-semibold text-black">{mail.from.name}</span>
            <span className="text-[13px]" style={{ color: C.secondaryLabel }}>
              {formatListTime(mail.receivedAt, s)}
            </span>
            {mail.isFlagged && <IcFlag size={13} style={{ color: C.flagOrange }} />}
          </div>
          <div className="truncate text-[14px]" style={{ color: C.secondaryLabel }}>
            {s.to_label}
            {mail.to[0]?.name || mail.to[0]?.address}
          </div>
        </div>
      </div>
      <h2 className="py-2.5 text-[22px] font-bold leading-tight text-black">{mail.subject}</h2>
      <MailBody blocks={mail.body} />
      {mail.attachments.length > 0 && <AttachmentCards mail={mail} />}
      <SeeMoreRow />
    </div>
  );
}

function SeeMoreRow() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between pt-2">
      {open ? (
        <span className="text-[15px]" style={{ color: C.secondaryLabel }}>
          —
        </span>
      ) : (
        <button
          {...bindTap({ kind: 'action', id: 'mail.thread.seeMore' }, { onTrigger: () => setOpen(true) })}
          className="text-[15px]"
          style={{ color: C.accent }}
        >
          {s.see_more}
        </button>
      )}
      <span style={{ color: C.accent }}>
        <IcReply size={18} />
      </span>
    </div>
  );
}

// ——————————————————— 正文渲染 ———————————————————

function MailBody({ blocks }: { blocks: MailBlock[] }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();

  if (blocks.length === 0) {
    return (
      <p className="py-2 text-[16px]" style={{ color: C.secondaryLabel }}>
        {s.no_content}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-1">
      {blocks.map((b, i) => {
        if (b.kind === 'logo') {
          return (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-black text-[11px] font-bold text-white">
                {b.text.charAt(0)}
              </span>
              <span className="text-[15px] font-semibold tracking-wide text-black">{b.text}</span>
            </div>
          );
        }
        if (b.kind === 'h') {
          return (
            <h3 key={i} className="text-[19px] font-semibold leading-snug text-black">
              {b.text}
            </h3>
          );
        }
        if (b.kind === 'link') {
          return (
            <button
              key={i}
              {...bindTap({ kind: 'action', id: 'mail.detail.link' }, {
                onTrigger: () => showToast(s.feature_unavailable),
              })}
              className="self-start text-[16px] underline"
              style={{ color: C.accent }}
            >
              {b.text}
            </button>
          );
        }
        if (b.kind === 'img') {
          return <BodyImage key={i} alt={b.alt} />;
        }
        if (b.kind === 'feature') {
          return (
            <div key={i} className="border-t pt-3" style={{ borderColor: C.separator }}>
              <div className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[16px] font-semibold text-black">{b.title}</h4>
                  <ul className="mt-1.5 flex flex-col gap-1">
                    {b.items.map((it, k) => (
                      <li key={k} className="flex gap-1.5 text-[14px] leading-snug text-black">
                        <span>•</span>
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {b.img && <BodyImage alt={b.alt ?? ''} small />}
              </div>
            </div>
          );
        }
        return (
          <p key={i} className="whitespace-pre-line text-[16px] leading-relaxed text-black">
            {b.text}
          </p>
        );
      })}
    </div>
  );
}

/**
 * 图文邮件里的配图占位。
 * 阶段③ Q8 选了"挑 2–3 封做真图文混排、配图用生图 API 造"，
 * 生图这一步还没跑，先用 iOS 风格的渐变块占位，尺寸和圆角与真机一致。
 */
function BodyImage({ alt, small }: { alt: string; small?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-[10px] ${
        small ? 'h-[86px] w-[120px] flex-shrink-0' : 'h-[140px] w-full'
      }`}
      style={{ background: 'linear-gradient(135deg,#E8ECF4 0%,#D6DEEC 100%)' }}
      role="img"
      aria-label={alt}
    >
      <span className="px-2 text-center text-[11px]" style={{ color: C.secondaryLabel }}>
        {alt}
      </span>
    </div>
  );
}

function AttachmentCards({ mail }: { mail: Mail }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const iconOf = (kind: string) =>
    kind === 'ics' ? <IcFileIcs size={22} /> : kind === 'zip' ? <IcFileZip size={22} /> : <IcFileOther size={22} />;

  return (
    <div className="flex flex-col gap-2 py-2">
      {mail.attachments.map((att) => (
        <button
          key={att.name}
          {...bindTap({ kind: 'action', id: 'mail.detail.attachment' }, {
            onTrigger: () => showToast(s.feature_unavailable),
          })}
          className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-left"
          style={{ background: '#F2F2F7' }}
        >
          <span
            className="flex h-11 w-9 items-center justify-center rounded-[4px] bg-white"
            style={{ color: C.secondaryLabel }}
          >
            {iconOf(att.kind)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-medium text-black">{att.name}</span>
            <span className="block text-[13px]" style={{ color: C.secondaryLabel }}>
              {att.size}
            </span>
          </span>
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full"
            style={{ background: '#E1E1E6', color: C.accent }}
          >
            <IcDownload size={15} />
          </span>
        </button>
      ))}
    </div>
  );
}

// ——————————————————— 底部工具栏与弹层 ———————————————————

function DetailToolbar({ mail }: { mail: Mail }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, back } = useMailGestures();
  const trashMails = useMailStore((st) => st.trashMails);

  const circle = 'flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.12)]';

  return (
    <div className="flex flex-shrink-0 items-center gap-3 px-4 pb-3 pt-1" data-hide-on-keyboard="true">
      <div className="flex items-center gap-2 rounded-full bg-white px-1.5 py-1.5 shadow-[0_1px_6px_rgba(0,0,0,0.12)]">
        <button
          {...bindTap({ kind: 'action', id: 'mail.detail.trash' }, {
            onTrigger: () => {
              trashMails([mail.id]);
              back();
            },
          })}
          className="flex h-8 w-9 items-center justify-center"
          aria-label={s.trash}
        >
          <IcTrash size={19} />
        </button>
        <button
          {...bindTap('detail.move.open', { params: { mailId: mail.id } })}
          className="flex h-8 w-9 items-center justify-center"
          aria-label={s.move_to}
        >
          <IcFolder size={19} />
        </button>
        <button
          {...bindTap('compose.reply', { params: { src: mail.id } })}
          className="flex h-8 w-9 items-center justify-center"
          aria-label={s.reply}
        >
          <IcReply size={19} />
        </button>
      </div>
      <div className="flex-1" />
      <button {...bindTap('compose.open')} className={circle} aria-label={s.new_message}>
        <IcCompose size={20} />
      </button>
    </div>
  );
}

function AddressMenu() {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const { bindTap, bindActionThenBack } = useMailGestures();
  const value = params.get('addrValue') ?? '';
  const contact = MAIL_CONFIG.contacts.find((c) => c.name === value || c.address === value);
  const address = contact?.address ?? value;

  return (
    <Popover>
      <div className="w-[268px]">
        <div className="border-b px-4 py-3" style={{ borderColor: C.separator }}>
          <div className="truncate text-[17px] font-semibold text-black">{value}</div>
          <div className="truncate text-[15px]" style={{ color: C.secondaryLabel }}>
            {address}
          </div>
        </div>
        <MenuRow
          label={s.copy_address}
          icon={<IcCopy size={17} />}
          bind={bindActionThenBack('mail.addr.copy', () => {
            const clipboard = window.__OS__?.clipboard;
            if (!clipboard?.copyText) {
              showToast(s.feature_unavailable);
              return;
            }
            clipboard.copyText(address, 'mail');
            showToast(s.copied);
          })}
        />
        <MenuRow
          label={s.search_for.replace('{q}', value)}
          icon={<IcSearch size={17} />}
          bind={bindTap('detail.addr.search', { params: { q: value } })}
        />
        <MenuRow
          label={s.view_contact_card}
          icon={<IcContactCard size={17} />}
          last
          bind={bindTap({ kind: 'action', id: 'mail.addr.contactCard' }, {
            onTrigger: () => showToast(s.feature_unavailable),
          })}
        />
      </div>
    </Popover>
  );
}

function DetailMoveSheet({ mailId }: { mailId: string }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindActionThenBack, back } = useMailGestures();
  const mails = useMailStore((st) => st.mails);
  const customFolders = useMailStore((st) => st.customFolders);
  const moveTo = useMailStore((st) => st.moveTo);
  const accountId = mails.find((m) => m.id === mailId)?.accountId ?? MAIL_CONFIG.accounts[0].id;

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
          bind={bindActionThenBack('mail.detailMove.select.folder', () => {
            moveTo([mailId], opt.id);
            // 移走后当前详情已不在原邮箱，退回列表
            back();
          })}
        />
      ))}
    </Sheet>
  );
}
