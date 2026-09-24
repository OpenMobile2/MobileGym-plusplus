import React, { useState } from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { NEUTRAL, GREEN, BLUE } from '../res/colors';
import { IcClose, IcCheck, IcSend, IcHash, IcLock, IcAt } from '../res/icons';
import Avatar from '../components/Avatar';

/** 新消息页：选收件人（人或频道）后在底部编写消息，发出即进入该会话。 */
const NewMessagePage: React.FC = () => {
  const { bindTap, bindBack, action, bindInput, go } = useSlackGestures();
  const { t } = useI18n();

  const users = useSlackStore((s) => s.users);
  const conversations = useSlackStore((s) => s.conversations);
  const openDm = useSlackStore((s) => s.openDm);
  const sendMessage = useSlackStore((s) => s.sendMessage);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const [filter, setFilter] = useState('');
  const [target, setTarget] = useState('');
  const [text, setText] = useState('');

  const q = filter.trim().toLowerCase();
  const people = users.filter(
    (u) => u.id !== ME && (q === '' || u.displayName.toLowerCase().includes(q) || u.handle.includes(q)),
  );
  const channels = conversations.filter(
    (c) => c.kind === 'channel' && (q === '' || c.name.includes(q)),
  );

  const send = () => {
    if (!target || !text.trim()) return;
    const convId = target.startsWith('u_') ? openDm(target) : target;
    sendMessage(convId, text);
    go('slack.newmsg.openconversation', { convId });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2 pt-11">
        <button
          {...bindBack()}
          aria-label="close"
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcClose size={19} />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('newMsg.title')}
        </h1>
        <span className="w-9" />
      </div>

      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#EAEAEA] px-4 pb-2.5">
        <span className="text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
          {t('newMsg.to')}
        </span>
        <input
          {...bindInput('slack.newmsg.filter.input')}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('newMsg.placeholder')}
          className="min-w-0 flex-1 border-none bg-transparent text-[16px] outline-none"
          style={{ color: NEUTRAL.textPrimary }}
        />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <button
          {...action('slack.newmsg.external.toast', notImplemented)}
          className="flex w-full items-center gap-3 border-b border-[#EAEAEA] bg-transparent px-4 py-3 text-left"
        >
          <IcAt size={19} style={{ color: BLUE.link }} />
          <span className="text-[16px]" style={{ color: BLUE.link }}>
            {t('newMsg.external')}
          </span>
        </button>

        {people.map((u) => {
          const picked = target === u.id;
          return (
            <button
              key={u.id}
              {...action('slack.newmsg.recipient.toggle', () => setTarget(picked ? '' : u.id), {
                params: { targetId: u.id },
              })}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
            >
              <Avatar user={u} size={34} rounded="rounded-md" presence />
              <span className="min-w-0 flex-1 text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {u.displayName}
                <span className="ml-1.5 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                  @{u.handle}
                </span>
              </span>
              <span
                className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: picked ? BLUE.link : '#C4C4C6',
                  backgroundColor: picked ? BLUE.link : 'transparent',
                  color: '#FFFFFF',
                }}
              >
                {picked && <IcCheck size={14} />}
              </span>
            </button>
          );
        })}

        {channels.map((c) => {
          const picked = target === c.id;
          return (
            <button
              key={c.id}
              {...action('slack.newmsg.recipient.toggle', () => setTarget(picked ? '' : c.id), {
                params: { targetId: c.id },
              })}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
            >
              <span style={{ color: NEUTRAL.textSecondary }}>
                {c.isPrivate ? <IcLock size={17} /> : <IcHash size={19} />}
              </span>
              <span className="min-w-0 flex-1 text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {c.name}
              </span>
              <span
                className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: picked ? BLUE.link : '#C4C4C6',
                  backgroundColor: picked ? BLUE.link : 'transparent',
                  color: '#FFFFFF',
                }}
              >
                {picked && <IcCheck size={14} />}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-shrink-0 items-end gap-2 border-t border-[#EAEAEA] px-3 py-2">
        <textarea
          {...bindInput('slack.newmsg.compose.input')}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder={t('newMsg.compose')}
          className="max-h-24 min-w-0 flex-1 resize-none rounded-lg border border-[#DDDDDD] px-3 py-2 text-[16px] outline-none"
          style={{ color: NEUTRAL.textPrimary, backgroundColor: NEUTRAL.bgInput }}
        />
        <button
          {...bindTap('slack.newmsg.openconversation', { onTrigger: send })}
          disabled={!target || !text.trim()}
          aria-label="send"
          className="flex h-9 w-9 items-center justify-center rounded-lg border-none"
          style={{
            backgroundColor: target && text.trim() ? GREEN.primary : '#E4E4E4',
            color: target && text.trim() ? '#FFFFFF' : '#A9A9A9',
          }}
        >
          <IcSend size={17} />
        </button>
      </div>
    </div>
  );
};

export default NewMessagePage;
