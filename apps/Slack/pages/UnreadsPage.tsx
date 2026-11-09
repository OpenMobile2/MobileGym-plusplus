import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL } from '../res/colors';
import PageHeader from '../components/PageHeader';
import ConversationRow from '../components/ConversationRow';
import { formatListTime } from '../utils/format';

/** 未读整理：列出所有有未读的会话（P1 scope §1） */
const UnreadsPage: React.FC = () => {
  const { bindTap } = useSlackGestures();
  const { t, locale } = useI18n();

  const conversations = useSlackStore((s) => s.conversations);
  const messages = useSlackStore((s) => s.messages);
  const users = useSlackStore((s) => s.users);

  const unread = conversations
    .filter((c) => !c.archived && c.hasUnread)
    .sort((a, b) => b.lastActivityTs - a.lastActivityTs);

  const previewOf = (convId: string) => {
    const last = messages
      .filter((m) => m.convId === convId && !m.deleted && !m.system)
      .sort((a, b) => b.ts - a.ts)[0];
    return last?.text ?? '';
  };

  const openBind = (c: { id: string; kind: string }) => {
    if (c.kind === 'channel') {
      return bindTap('slack.unreads.openchannel', { params: { convId: c.id } });
    }
    return bindTap('slack.unreads.opendm', { params: { convId: c.id } });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('unreads.title')} />
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {unread.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('unreads.empty')}
          </p>
        ) : (
          unread.map((c) => (
            <ConversationRow
              key={c.id}
              conv={c}
              users={users}
              preview={previewOf(c.id)}
              time={formatListTime(c.lastActivityTs, locale)}
              tapProps={openBind(c)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default UnreadsPage;
