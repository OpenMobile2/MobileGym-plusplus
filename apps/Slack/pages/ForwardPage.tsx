import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { NEUTRAL, GREEN } from '../res/colors';
import { IcSearch, IcHash, IcLock, IcCheck, IcSend } from '../res/icons';
import PageHeader from '../components/PageHeader';
import Avatar, { AvatarStack } from '../components/Avatar';
import type { SlackUser } from '../types';

/** 转发选择页：频道与人员混排，选中一个目标后底部出现附言框 + 发送 */
const ForwardPage: React.FC = () => {
  const { bindTap, action, bindInput } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const messageId = params.get('msg') ?? '';

  const conversations = useSlackStore((s) => s.conversations);
  const users = useSlackStore((s) => s.users);
  const forwardMessage = useSlackStore((s) => s.forwardMessage);
  const showToast = useSlackStore((s) => s.showToast);

  const [q, setQ] = useState('');
  const [note, setNote] = useState('');
  const [picked, setPicked] = useState<string | null>(null);

  const term = q.trim().toLowerCase();
  const list = conversations.filter((c) => term === '' || c.name.toLowerCase().includes(term));
  const target = conversations.find((c) => c.id === picked);

  const doSend = () => {
    if (!picked || !messageId) return;
    forwardMessage(messageId, picked, note);
    showToast(t('forward.sentToast', { name: target?.name ?? '' }));
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('forward.title')} close />

      <div className="flex-shrink-0 px-4 pb-2">
        <span className="flex items-center gap-2 rounded-lg bg-[#F3F3F3] px-3 py-2">
          <IcSearch size={16} style={{ color: NEUTRAL.textSecondary }} />
          <input
            {...bindInput('slack.forward.search')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('forward.searchPlaceholder')}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] outline-none"
            style={{ color: NEUTRAL.textPrimary }}
          />
        </span>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {list.map((c) => {
          const others = c.memberIds.filter((id) => id !== ME);
          const peer = users.find((u) => u.id === others[0]);
          const groupUsers = others
            .map((id) => users.find((u) => u.id === id))
            .filter((u): u is SlackUser => Boolean(u));
          const on = picked === c.id;
          return (
            <button
              key={c.id}
              {...action('slack.forward.target.select.conv', () => setPicked(c.id), {
                params: { convId: c.id },
              })}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
            >
              {c.kind === 'channel' ? (
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-md bg-[#F3F3F3]"
                  style={{ color: NEUTRAL.textPrimary }}
                >
                  {c.isPrivate ? <IcLock size={15} /> : <IcHash size={17} />}
                </span>
              ) : c.kind === 'group' ? (
                <AvatarStack users={groupUsers} size={28} />
              ) : (
                <Avatar user={peer} size={32} rounded="rounded-md" />
              )}
              <span className="min-w-0 flex-1 truncate text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {c.kind === 'channel' ? `#${c.name}` : c.name}
              </span>
              {on && (
                <span style={{ color: GREEN.primary }}>
                  <IcCheck size={18} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {target && (
        <div
          data-keep-keyboard="true"
          className="flex flex-shrink-0 items-end gap-2 border-t border-[#EAEAEA] px-3 py-2"
        >
          <textarea
            {...bindInput('slack.forward.note.input')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={1}
            placeholder={t('forward.notePlaceholder')}
            className="max-h-24 min-w-0 flex-1 resize-none rounded-2xl border border-[#DDDDDD] px-3 py-2 text-[16px] outline-none"
            style={{ color: NEUTRAL.textPrimary, backgroundColor: NEUTRAL.bgInput }}
          />
          <button
            {...(target.kind === 'channel'
              ? bindTap('slack.forward.sendtochannel', {
                  params: { convId: target.id },
                  beforeTrigger: doSend,
                })
              : bindTap('slack.forward.sendtodm', {
                  params: { convId: target.id },
                  beforeTrigger: doSend,
                }))}
            aria-label="send-forward"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-none"
            style={{ backgroundColor: GREEN.primary, color: '#FFFFFF' }}
          >
            <IcSend size={17} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ForwardPage;
