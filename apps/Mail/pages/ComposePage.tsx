/**
 * 撰写页 —— 一套组件覆盖新建 / 回复 / 全部回复 / 转发 / 继续草稿五种入口。
 * 对照 IMG_2180（新建）、2208（展开 Cc/Bcc/From）、2204（继续草稿）、2210（转发）、2181（选联系人）。
 *
 * 阶段③ 决议：
 * - Q9 Reply/Reply All 按 Forward 类推（Re: 前缀 + 预填原发件人 + 引用原文）
 * - Q10 关闭已写内容的草稿弹 Save / Delete / Cancel 三选
 * - Q11 不做定时发送，长按发送键无特殊反应
 * - Q12 联系人用 App 自带假数据
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { MAIL_CONFIG } from '../data';
import { useMailStore, type ComposeInput } from '../state';
import { MenuRow, Sheet, showToast } from '../components/ui';
import { IcCheck, IcClose, IcFileOther, IcNavBack, IcPlus, IcSend } from '../res/icons';
import type { MailAddress, MailBlock } from '../types';

const addrText = (list: MailAddress[]) => list.map((a) => a.name || a.address).join(', ');

const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

/** 切分收件人输入：支持逗号分隔 */
const splitAddrs = (text: string) =>
  text
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

/**
 * 一个收件人 token 合法的两种情况：本身是邮箱地址，或能在通讯录里匹配到人名。
 * 只有全部 token 合法才允许发送（gate4 轮2 #3）。
 */
const isValidRecipient = (token: string) =>
  EMAIL_RE.test(token) || MAIL_CONFIG.contacts.some((c) => c.name === token || c.address === token);

export default function ComposePage() {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const { bindTap, bindBack, back } = useMailGestures();
  const mails = useMailStore((st) => st.mails);
  const sendMail = useMailStore((st) => st.sendMail);
  const saveDraft = useMailStore((st) => st.saveDraft);
  const discardDraft = useMailStore((st) => st.discardDraft);

  const mode = params.get('mode');
  const srcId = params.get('src');
  const draftId = params.get('draft');
  const replyAll = params.get('all') === '1';
  const sheet = params.get('sheet');
  const pickedContactId = params.get('picked');

  const src = srcId ? mails.find((m) => m.id === srcId) : undefined;
  const draft = draftId ? mails.find((m) => m.id === draftId) : undefined;

  /** 按入口算出初值 */
  const initial = useMemo(() => {
    if (draft) {
      return {
        accountId: draft.accountId,
        to: draft.to,
        cc: draft.cc,
        subject: draft.subject,
        bodyText: draft.body.map((b) => ('text' in b ? b.text : '')).join('\n\n'),
        attachments: draft.attachments,
      };
    }
    if (src && mode === 'reply') {
      return {
        accountId: src.accountId,
        to: [src.from],
        cc: replyAll ? src.cc : [],
        subject: `${s.re_prefix}${src.subject}`,
        bodyText: '',
        attachments: [],
      };
    }
    if (src && mode === 'forward') {
      return {
        accountId: src.accountId,
        to: [],
        cc: [],
        subject: `${s.fwd_prefix}${src.subject}`,
        bodyText: '',
        attachments: src.attachments,
      };
    }
    return {
      accountId: MAIL_CONFIG.accounts[0].id,
      to: [] as MailAddress[],
      cc: [] as MailAddress[],
      subject: '',
      bodyText: '',
      attachments: [],
    };
  }, [draft, src, mode, replyAll, s]);

  const [accountId, setAccountId] = useState(initial.accountId);
  const [to, setTo] = useState(addrText(initial.to));
  const [cc, setCc] = useState(addrText(initial.cc));
  const [subject, setSubject] = useState(initial.subject);
  const [bodyText, setBodyText] = useState(initial.bodyText);
  const [fieldsOpen, setFieldsOpen] = useState(false);

  // 从 Contacts 选完人回来，把名字并进 To
  React.useEffect(() => {
    if (!pickedContactId) return;
    const c = MAIL_CONFIG.contacts.find((x) => x.id === pickedContactId);
    if (!c) return;
    setTo((prev) => (prev ? `${prev}, ${c.name}` : c.name));
  }, [pickedContactId]);

  const account = MAIL_CONFIG.accounts.find((a) => a.id === accountId) ?? MAIL_CONFIG.accounts[0];
  const signature = `${s.signature}\n${account.displayName}`;
  const quoted = src ? `\n\n${s.quoted_header}\n${src.from.name} <${src.from.address}>\n${src.preview}` : '';
  const hasContent = to.trim().length > 0 || subject.trim().length > 0 || bodyText.trim().length > 0;
  const toTokens = splitAddrs(to);
  const recipientsValid = toTokens.length > 0 && toTokens.every(isValidRecipient);
  const canSend = recipientsValid;
  // 已经开始输入但还不是有效地址时给出原因，避免出现"发送键点了没反应"
  const showRecipientHint = toTokens.length > 0 && !recipientsValid;

  const parseAddrs = (text: string): MailAddress[] =>
    splitAddrs(text).map((t) => {
      const hit = MAIL_CONFIG.contacts.find((c) => c.name === t || c.address === t);
      return hit ? { name: hit.name, address: hit.address } : { name: '', address: t };
    });

  const buildInput = (): ComposeInput => {
    const blocks: MailBlock[] = [];
    if (bodyText.trim()) blocks.push({ kind: 'p', text: bodyText.trim() });
    blocks.push({ kind: 'p', text: signature });
    if (quoted) blocks.push({ kind: 'p', text: quoted.trim() });
    return {
      accountId,
      to: parseAddrs(to),
      cc: parseAddrs(cc),
      bcc: [{ name: account.displayName, address: account.address }],
      subject,
      body: blocks,
      draftId: draftId ?? undefined,
      attachments: initial.attachments,
      replyToId: mode === 'reply' ? srcId ?? undefined : undefined,
    };
  };

  return (
    <div className="flex h-full flex-col bg-white pt-9" data-status-bar-foreground="dark">
      {/* 顶栏：左 × / 右 ↑ 发送 */}
      <div className="flex flex-shrink-0 items-center justify-between px-4 pb-1">
        {hasContent ? (
          <button
            {...bindTap('compose.closeConfirm.open')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
            aria-label={s.cancel}
          >
            <IcClose size={18} />
          </button>
        ) : (
          <button
            {...bindBack()}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
            aria-label={s.cancel}
          >
            <IcClose size={18} />
          </button>
        )}
        <button
          {...bindTap({ kind: 'action', id: 'mail.compose.send' }, {
            onTrigger: () => {
              if (!canSend) return;
              sendMail(buildInput());
              showToast(s.toast_sent);
              back();
            },
          })}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ background: canSend ? C.accent : '#E5E5EA', color: canSend ? '#fff' : '#B0B0B5' }}
          disabled={!canSend}
          aria-label={s.new_message}
        >
          <IcSend size={19} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 no-scrollbar"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <h1 className="py-2 text-[28px] font-bold leading-tight text-black">
          {subject.trim() || s.new_message}
        </h1>

        <Field label={s.to_field}>
          <input
            value={to}
            onChange={(e) => setTo(e.target.value)}
            data-action="mail.compose.typeTo"
            data-action-type="input"
            data-action-params={JSON.stringify({ value: to })}
            className="flex-1 bg-transparent text-[16px] text-black outline-none"
          />
          <button
            {...bindTap('compose.contacts.open')}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: '#E5E5EA' }}
            aria-label={s.contacts}
          >
            <IcPlus size={15} />
          </button>
        </Field>
        {showRecipientHint && (
          <p className="pt-1.5 text-[13px]" style={{ color: C.destructive }} data-mail-recipient-hint="1">
            {s.invalid_recipient}
          </p>
        )}

        {fieldsOpen ? (
          <>
            <Field label={s.cc_field}>
              <input
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                data-action="mail.compose.typeTo"
                data-action-type="input"
                data-action-params={JSON.stringify({ value: cc })}
                className="flex-1 bg-transparent text-[16px] text-black outline-none"
              />
            </Field>
            <Field label={s.bcc_field}>
              <span
                className="rounded-full px-2 py-0.5 text-[15px]"
                style={{ background: '#E1EBFB', color: C.accent }}
              >
                {account.displayName}
              </span>
            </Field>
            <Field label={s.from_field}>
              <span className="flex flex-wrap gap-1.5">
                {MAIL_CONFIG.accounts.map((a) => (
                  <button
                    key={a.id}
                    {...bindTap({ kind: 'action', id: 'mail.composeFrom.select.account' }, {
                      params: { accountId: a.id },
                      onTrigger: () => setAccountId(a.id),
                    })}
                    className="rounded-full px-2 py-0.5 text-[14px]"
                    style={{
                      background: a.id === accountId ? '#E1EBFB' : 'transparent',
                      color: a.id === accountId ? C.accent : C.secondaryLabel,
                    }}
                  >
                    {a.address}
                  </button>
                ))}
              </span>
            </Field>
          </>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'mail.compose.expandFields' }, {
              onTrigger: () => setFieldsOpen(true),
            })}
            className="flex w-full items-center gap-1 border-b py-2.5 text-left"
            style={{ borderColor: C.separator }}
          >
            <span className="text-[16px]" style={{ color: C.secondaryLabel }}>
              {s.cc_bcc_from}
            </span>
            <span className="text-[16px] text-black">{account.address}</span>
          </button>
        )}

        <Field label={s.subject_field}>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            data-action="mail.compose.typeSubject"
            data-action-type="input"
            data-action-params={JSON.stringify({ value: subject })}
            className="flex-1 bg-transparent text-[16px] text-black outline-none"
          />
        </Field>

        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          data-action="mail.compose.typeBody"
          data-action-type="input"
          data-action-params={JSON.stringify({ value: bodyText })}
          rows={4}
          className="mt-3 w-full resize-none bg-transparent text-[16px] leading-relaxed text-black outline-none"
        />

        <p className="whitespace-pre-line pt-1 text-[16px] leading-relaxed text-black">{signature}</p>

        {initial.attachments.length > 0 && (
          <div className="flex flex-col gap-2 pt-3">
            {initial.attachments.map((att) => (
              <button
                key={att.name}
                {...bindTap({ kind: 'action', id: 'mail.compose.attachment' }, {
                  onTrigger: () => showToast(s.feature_unavailable),
                })}
                className="flex w-[152px] flex-col items-center gap-1 rounded-[10px] border px-3 py-4"
                style={{ borderColor: C.separator }}
              >
                <IcFileOther size={26} style={{ color: C.tertiaryLabel }} />
                <span className="w-full truncate text-center text-[12px]" style={{ color: C.secondaryLabel }}>
                  {att.name}
                </span>
                <span className="text-[12px]" style={{ color: C.secondaryLabel }}>
                  {att.size}
                </span>
              </button>
            ))}
          </div>
        )}

        {quoted && (
          <p className="whitespace-pre-line pt-4 text-[15px] leading-relaxed" style={{ color: C.secondaryLabel }}>
            {quoted.trim()}
          </p>
        )}
        <div className="h-8" />
      </div>

      {sheet === 'contacts' && <ContactsSheet />}
      {sheet === 'close-confirm' && (
        <CloseConfirmSheet
          onSave={() => {
            saveDraft(buildInput());
            showToast(s.toast_draft_saved);
            back(2);
          }}
          onDelete={() => {
            discardDraft(draftId ?? undefined);
            back(2);
          }}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b py-2.5" style={{ borderColor: C.separator }}>
      <span className="flex-shrink-0 text-[16px]" style={{ color: C.secondaryLabel }}>
        {label}
      </span>
      {children}
    </div>
  );
}

// ——————————————————— Contacts ———————————————————

function ContactsSheet() {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const { bindTap, bindBack, navigateTo } = useMailGestures();
  const [kw, setKw] = useState('');

  const sections = useMemo(() => {
    const q = kw.trim().toLowerCase();
    const list = q
      ? MAIL_CONFIG.contacts.filter(
          (c) => c.name.toLowerCase().includes(q) || c.address.toLowerCase().includes(q),
        )
      : MAIL_CONFIG.contacts;
    const map = new Map<string, typeof MAIL_CONFIG.contacts>();
    for (const c of list) {
      const arr = map.get(c.section) ?? [];
      arr.push(c);
      map.set(c.section, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] === '#' ? 1 : b[0] === '#' ? -1 : a[0].localeCompare(b[0])));
  }, [kw]);

  const pick = (contactId: string) => {
    const next = new URLSearchParams(params);
    next.delete('sheet');
    next.set('picked', contactId);
    navigateTo(`/compose?${next.toString()}`, { replace: true });
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white pt-10">
      <p className="flex-shrink-0 text-center text-[13px]" style={{ color: C.secondaryLabel }}>
        {s.choose_contact}
      </p>
      <div className="flex flex-shrink-0 items-center px-4 pb-2">
        <button {...bindBack()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
          <IcNavBack size={20} />
        </button>
        <span className="flex-1 text-center text-[17px] font-semibold text-black">{s.contacts}</span>
        <button {...bindBack()} className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]">
          <IcClose size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar" data-scroll-container="main" data-scroll-direction="vertical">
        {sections.map(([section, items]) => (
          <div key={section}>
            <div className="px-4 py-1 text-[14px]" style={{ color: C.secondaryLabel }}>
              {section}
            </div>
            {items.map((c) => (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'mail.contacts.select.contact' }, {
                  params: { contactId: c.id },
                  onTrigger: () => pick(c.id),
                })}
                className="flex w-full items-center gap-3 border-b px-4 py-2.5 text-left"
                style={{ borderColor: C.separator }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full text-[15px] text-white"
                  style={{ background: '#8E9BB3' }}
                >
                  {c.initial}
                </span>
                <span className="flex-1 truncate text-[17px] text-black">{c.name}</span>
                {c.isMe && (
                  <span className="text-[15px]" style={{ color: C.secondaryLabel }}>
                    {s.me}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="flex-shrink-0 px-4 pb-3" data-keep-keyboard="true">
        <div className="flex items-center gap-2 rounded-full px-4 py-2.5" style={{ background: '#EFEFF4' }}>
          <input
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            placeholder={s.search}
            data-action="mail.contacts.search"
            data-action-type="input"
            data-action-params={JSON.stringify({ value: kw })}
            className="flex-1 bg-transparent text-[16px] text-black outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function CloseConfirmSheet({ onSave, onDelete }: { onSave: () => void; onDelete: () => void }) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useMailGestures();
  return (
    <Sheet>
      <MenuRow
        label={s.save_draft}
        icon={<IcCheck size={17} />}
        bind={bindTap({ kind: 'action', id: 'mail.closeConfirm.save' }, { onTrigger: onSave })}
      />
      <MenuRow
        label={s.delete_draft}
        danger
        bind={bindTap({ kind: 'action', id: 'mail.closeConfirm.delete' }, { onTrigger: onDelete })}
      />
      <MenuRow label={s.cancel} last bind={bindBack()} />
    </Sheet>
  );
}
