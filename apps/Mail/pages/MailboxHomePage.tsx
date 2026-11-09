/**
 * 邮箱首页 —— 对照 IMG_2162/2163（常态）、2164/2165（Edit）、2166（New Mailbox）。
 *
 * 阶段①/③/④ 的删减在这里生效：
 * - 无 VIP 行（Q19）
 * - 副标题恒为 Updated Just Now，不显示 Account Errors（Q20）
 * - 账号分组里无 Virus Items（阶段④审核）
 * - Edit 模式里无 Add Mailbox...，新建入口只有右下角 New Mailbox（阶段④审核）
 */
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMailGestures } from '../hooks/useMailGestures';
import { useAppStrings } from '../../../os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { colors as C } from '../res/colors';
import { ACCOUNT_FOLDERS, SMART_MAILBOXES } from '../constants';
import { MAIL_CONFIG } from '../data';
import { countDrafts, mailsInMailbox, selectVisibleSmartMailboxes, useMailStore } from '../state';
import { GroupCard, Sheet } from '../components/ui';
import { IconRenderer, IcCheck, IcChevronDown, IcChevronRight, IcCompose, IcDrag, IcInbox, IcNewFolder, IcSelectOff, IcSelectOn } from '../res/icons';

export default function MailboxHomePage() {
  const s = useAppStrings(strings, stringsEn);
  const [params] = useSearchParams();
  const editing = params.get('edit') === '1';
  const dialog = params.get('dialog');

  return (
    <div
      className="flex h-full flex-col pt-10"
      style={{ background: C.groupedBg }}
      data-status-bar-foreground="dark"
    >
      {editing ? <EditHeader /> : <NormalHeader />}
      <div className="flex-1 overflow-y-auto pb-6 no-scrollbar" data-scroll-container="main" data-scroll-direction="vertical">
        {editing ? <EditBody /> : <NormalBody />}
      </div>
      {!editing && <ComposeFab />}
      {editing && dialog !== 'new-mailbox' && dialog !== 'location' && <NewMailboxFab />}
      {dialog === 'new-mailbox' && <NewMailboxSheet />}
      {dialog === 'location' && <LocationSheet />}
    </div>
  );
}

// ——————————————————— 常态 ———————————————————

function NormalHeader() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  return (
    <div className="flex-shrink-0 px-4">
      <div className="flex justify-end">
        <button
          {...bindTap('home.edit.enter')}
          className="rounded-full bg-white px-4 py-1.5 text-[15px] shadow-[0_1px_4px_rgba(0,0,0,0.08)]"
          style={{ color: '#000' }}
        >
          {s.edit}
        </button>
      </div>
      <h1 className="mt-3 text-[32px] font-bold leading-tight text-black">{s.mailboxes}</h1>
      <p className="mb-2 text-[13px]" style={{ color: C.secondaryLabel }}>
        {s.updated_just_now}
      </p>
    </div>
  );
}

function NormalBody() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const mails = useMailStore((st) => st.mails);
  const customFolders = useMailStore((st) => st.customFolders);
  const expandedAccountIds = useMailStore((st) => st.expandedAccountIds);
  const toggleAccountExpanded = useMailStore((st) => st.toggleAccountExpanded);
  const visible = useMailStore(selectVisibleSmartMailboxes);

  /** 智能邮箱行 + 4 个账号的 Inbox 行，按 Edit 里的顺序排 */
  const smartRows = useMemo(() => {
    const rows: Array<{ key: string; mailboxId: string; icon: string; label: string; count: number }> = [];
    for (const id of visible) {
      const def = SMART_MAILBOXES.find((m) => m.id === id);
      if (!def) continue;
      // All Inboxes 之后紧跟 4 个账号各自的 Inbox（真机顺序，见 IMG_2162）
      rows.push({
        key: id,
        mailboxId: id,
        icon: def.icon,
        label: s[def.labelKey],
        count: mailsInMailbox(mails, id).length,
      });
      if (id === 'follow-up') {
        for (const acct of MAIL_CONFIG.accounts) {
          rows.push({
            key: `acct-${acct.id}`,
            mailboxId: `${acct.id}:inbox`,
            icon: 'IcInbox',
            label: acct.label,
            count: 0,
          });
        }
      }
    }
    return rows;
  }, [visible, mails, s]);

  return (
    <>
      <GroupCard>
        {smartRows.map((row, i) => (
          <button
            key={row.key}
            {...bindTap('mailbox.open', { params: { mailboxId: row.mailboxId } })}
            className={`flex w-full items-center gap-3 px-4 py-[11px] text-left active:bg-black/[0.04] ${
              i === smartRows.length - 1 ? '' : 'border-b'
            }`}
            style={{ borderColor: C.separator }}
          >
            <IconRenderer name={row.icon} size={22} style={{ color: C.accent }} />
            <span className="flex-1 truncate text-[17px] text-black">{row.label}</span>
            <IcChevronRight size={16} style={{ color: C.tertiaryLabel }} />
          </button>
        ))}
      </GroupCard>

      {MAIL_CONFIG.accounts.map((acct) => {
        const expanded = expandedAccountIds.includes(acct.id);
        const folders = [
          ...ACCOUNT_FOLDERS.map((f) => ({
            id: `${acct.id}:${f.folder}`,
            icon: f.icon,
            label: s[f.labelKey],
            count: f.showCount ? countDrafts(mails, acct.id) : 0,
            showCount: f.showCount,
          })),
          ...customFolders
            .filter((f) => f.accountId === acct.id)
            .map((f) => ({ id: `${acct.id}:${f.id}`, icon: 'IcFolder', label: f.name, count: 0, showCount: false })),
        ];

        return (
          <div key={acct.id} className="mt-6">
            <button
              {...bindTap({ kind: 'action', id: 'mail.home.accountToggle' }, {
                params: { accountId: acct.id },
                onTrigger: () => toggleAccountExpanded(acct.id),
              })}
              className="flex w-full items-center gap-2 px-6 pb-2 text-left"
            >
              <span className="flex-1 truncate text-[20px] font-bold text-black">{acct.label}</span>
              {expanded ? (
                <IcChevronDown size={18} style={{ color: C.accent }} />
              ) : (
                <IcChevronRight size={18} style={{ color: C.accent }} />
              )}
            </button>

            {expanded && (
              <GroupCard>
                {folders.map((f, i) => (
                  <button
                    key={f.id}
                    {...bindTap('mailbox.open', { params: { mailboxId: f.id } })}
                    className={`flex w-full items-center gap-3 px-4 py-[11px] text-left active:bg-black/[0.04] ${
                      i === folders.length - 1 ? '' : 'border-b'
                    }`}
                    style={{ borderColor: C.separator }}
                  >
                    <IconRenderer name={f.icon} size={22} style={{ color: C.accent }} />
                    <span className="flex-1 truncate text-[17px] text-black">{f.label}</span>
                    {f.showCount && f.count > 0 && (
                      <span className="text-[17px]" style={{ color: C.secondaryLabel }}>
                        {f.count}
                      </span>
                    )}
                    <IcChevronRight size={16} style={{ color: C.tertiaryLabel }} />
                  </button>
                ))}
              </GroupCard>
            )}
          </div>
        );
      })}
    </>
  );
}

function ComposeFab() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  return (
    <div className="flex flex-shrink-0 justify-end px-4 pb-3" data-hide-on-keyboard="true">
      <button
        {...bindTap('compose.open')}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-[0_1px_6px_rgba(0,0,0,0.14)]"
        aria-label={s.new_message}
      >
        <IcCompose size={20} />
      </button>
    </div>
  );
}

// ——————————————————— Edit 模式 ———————————————————

function EditHeader() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack } = useMailGestures();
  return (
    <div className="flex-shrink-0 px-4">
      <div className="flex justify-end">
        <button
          {...bindBack()}
          className="rounded-full px-4 py-1.5 text-[15px] font-medium text-white"
          style={{ background: C.accent }}
        >
          {s.done}
        </button>
      </div>
      <h1 className="mt-3 text-[32px] font-bold leading-tight text-black">{s.mailboxes}</h1>
      <p className="mb-2 text-[13px]" style={{ color: C.secondaryLabel }}>
        {s.updated_just_now}
      </p>
    </div>
  );
}

function EditBody() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  const hidden = useMailStore((st) => st.hiddenSmartMailboxes);
  const order = useMailStore((st) => st.smartMailboxOrder);
  const toggleSmartMailbox = useMailStore((st) => st.toggleSmartMailbox);
  const moveSmartMailbox = useMailStore((st) => st.moveSmartMailbox);

  // 已勾选的按用户排序在前，未勾选的按定义顺序在后
  const rows = useMemo(() => {
    const checked = order.filter((id) => !hidden.includes(id));
    const unchecked = SMART_MAILBOXES.filter((m) => hidden.includes(m.id)).map((m) => m.id);
    return [...checked, ...unchecked];
  }, [order, hidden]);

  return (
    <GroupCard>
      {rows.map((id, i) => {
        const def = SMART_MAILBOXES.find((m) => m.id === id);
        if (!def) return null;
        const isChecked = !hidden.includes(id);
        return (
          <div
            key={id}
            className={`flex items-center gap-3 px-4 py-[11px] ${i === rows.length - 1 ? '' : 'border-b'}`}
            style={{ borderColor: C.separator }}
          >
            <button
              {...bindTap({ kind: 'action', id: 'mail.edit.toggleMailbox' }, {
                params: { mailboxId: id },
                onTrigger: () => toggleSmartMailbox(id),
              })}
              aria-label={s[def.labelKey]}
            >
              {isChecked ? (
                <IcSelectOn size={22} style={{ color: C.accent }} />
              ) : (
                <IcSelectOff size={22} style={{ color: C.tertiaryLabel }} />
              )}
            </button>
            <IconRenderer name={def.icon} size={22} style={{ color: C.accent }} />
            <span className="flex-1 truncate text-[17px] text-black">{s[def.labelKey]}</span>
            {isChecked && (
              <span className="flex items-center gap-1">
                <button
                  {...bindTap({ kind: 'action', id: 'mail.edit.moveUp' }, {
                    params: { mailboxId: id },
                    onTrigger: () => moveSmartMailbox(id, -1),
                  })}
                  className="rotate-180 p-1"
                  aria-label="up"
                >
                  <IcChevronDown size={14} style={{ color: C.tertiaryLabel }} />
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'mail.edit.moveDown' }, {
                    params: { mailboxId: id },
                    onTrigger: () => moveSmartMailbox(id, 1),
                  })}
                  className="p-1"
                  aria-label="down"
                >
                  <IcChevronDown size={14} style={{ color: C.tertiaryLabel }} />
                </button>
                <IcDrag size={18} style={{ color: C.tertiaryLabel }} />
              </span>
            )}
          </div>
        );
      })}
    </GroupCard>
  );
}

function NewMailboxFab() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useMailGestures();
  return (
    <div className="flex flex-shrink-0 justify-end px-4 pb-3" data-hide-on-keyboard="true">
      <button
        {...bindTap('home.newMailbox.open')}
        className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[15px] shadow-[0_1px_6px_rgba(0,0,0,0.14)]"
      >
        <IcNewFolder size={18} />
        {s.new_mailbox}
      </button>
    </div>
  );
}

// ——————————————————— New Mailbox / Location ———————————————————

function NewMailboxSheet() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, navigateTo } = useMailGestures();
  const [params, setParams] = useSearchParams();
  const createFolder = useMailStore((st) => st.createFolder);
  // 名称也放在 URL 中：进入 Location 子层时本组件会卸载，局部 state 会丢失。
  // 保存在 URL 可确保选完账号回来仍能直接保存。
  const name = params.get('name') ?? '';
  // 位置选完后由 LocationSheet 写进 URL 带回来
  const pickedAccount = params.get('loc') ?? '';
  // 阶段④审核修订：要选完 Location 才能 Save，光填名字不够
  const canSave = name.trim().length > 0 && pickedAccount.length > 0;
  const account = MAIL_CONFIG.accounts.find((a) => a.id === pickedAccount);

  return (
    <div className="absolute inset-0 z-50 flex flex-col" style={{ background: C.groupedBg }}>
      <div className="flex flex-shrink-0 items-center justify-between px-4 pt-12">
        <button {...bindBack()} className="rounded-full bg-white px-4 py-1.5 text-[15px]">
          {s.cancel}
        </button>
        <span className="text-[17px] font-semibold text-black">{s.new_mailbox}</span>
        <button
          {...bindTap({ kind: 'action', id: 'mail.newMailbox.save' }, {
            onTrigger: () => {
              if (!canSave) return;
              createFolder(name, pickedAccount);
              // Location is a nested history entry. A single back would reopen
              // the pre-location form (and make the saved fields appear lost).
              // Close the complete flow explicitly after the folder is written.
              navigateTo('/?edit=1', { replace: true });
            },
          })}
          className="rounded-full px-4 py-1.5 text-[15px] font-medium"
          style={{
            background: canSave ? C.accent : '#D8D8DC',
            color: canSave ? '#fff' : '#9A9AA0',
          }}
          disabled={!canSave}
        >
          {s.save}
        </button>
      </div>

      <div className="mt-8 px-4" data-keep-keyboard="true">
        <input
          value={name}
          onChange={(e) => {
            const value = e.target.value;
            setParams((prev) => {
              const next = new URLSearchParams(prev);
              if (value) next.set('name', value);
              else next.delete('name');
              return next;
            }, { replace: true });
          }}
          placeholder={s.mailbox_name}
          data-action="mail.newMailbox.typeName"
          data-action-type="input"
          data-action-params={JSON.stringify({ value: name })}
          className="w-full rounded-[10px] bg-white px-4 py-3 text-[17px] text-black outline-none"
        />
        <p className="mb-2 mt-6 px-2 text-[13px]" style={{ color: C.secondaryLabel }}>
          {s.mailbox_location}
        </p>
        <button
          {...bindTap('newMailbox.location.open')}
          className="flex w-full items-center justify-between rounded-[10px] bg-white px-4 py-3 text-left"
        >
          <span className="text-[17px]" style={{ color: account ? '#000' : C.tertiaryLabel }}>
            {account ? account.label : ''}
          </span>
          <IcChevronRight size={16} style={{ color: C.tertiaryLabel }} />
        </button>
      </div>
    </div>
  );
}

function LocationSheet() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, navigateTo } = useMailGestures();
  const [params] = useSearchParams();

  /** 选完把结果写回 new-mailbox 那层 URL（replace，不新增历史） */
  const pick = (accountId: string) => {
    const next = new URLSearchParams(params);
    next.set('dialog', 'new-mailbox');
    next.set('loc', accountId);
    navigateTo(`/?${next.toString()}`, { replace: true });
  };

  return (
    <Sheet>
      <p className="px-4 py-3 text-center text-[13px]" style={{ color: C.secondaryLabel }}>
        {s.mailbox_location}
      </p>
      {MAIL_CONFIG.accounts.map((acct, i) => (
        <button
          key={acct.id}
          {...bindTap({ kind: 'action', id: 'mail.location.select.account' }, {
            params: { accountId: acct.id },
            onTrigger: () => pick(acct.id),
          })}
          className={`flex w-full items-center gap-3 px-4 py-[13px] text-left active:bg-black/5 ${
            i === MAIL_CONFIG.accounts.length - 1 ? '' : 'border-b'
          }`}
          style={{ borderColor: C.separator }}
        >
          <IcInbox size={20} style={{ color: C.accent }} />
          <span className="flex-1 text-[16px] text-black">{acct.label}</span>
          {params.get('loc') === acct.id && <IcCheck size={18} style={{ color: C.accent }} />}
        </button>
      ))}
    </Sheet>
  );
}
