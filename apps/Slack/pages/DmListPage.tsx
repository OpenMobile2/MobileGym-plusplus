import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME, timelineOf } from '../state';
import { NEUTRAL } from '../res/colors';
import { formatListTime } from '../utils/format';
import TopBar from '../components/TopBar';
import ConversationRow from '../components/ConversationRow';
import RowMenu from '../components/home/RowMenu';

/** 私信 Tab。长按会话行弹出与主页相同的行菜单。 */
const DmListPage: React.FC = () => {
  const { bindTap, bindLongPress } = useSlackGestures();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const sheet = params.get('sheet');
  const conversations = useSlackStore((s) => s.conversations);
  const users = useSlackStore((s) => s.users);
  const messages = useSlackStore((s) => s.messages);

  const list = conversations
    .filter((c) => c.kind !== 'channel')
    .sort((a, b) => b.lastActivityTs - a.lastActivityTs);

  const previewOf = (convId: string) => {
    const timeline = timelineOf(messages, convId);
    const last = timeline[timeline.length - 1];
    if (!last) return '';
    const who = last.userId === ME ? t('common.you') : users.find((u) => u.id === last.userId)?.displayName;
    const body = last.deleted ? t('conv.deleted') : last.text;
    return `${who}：${body}`;
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar variant="title" title={t('dms.title')} />
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {list.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('dms.empty')}
          </p>
        ) : (
          list.map((c) => (
            <ConversationRow
              key={c.id}
              conv={{
                ...c,
                name: c.memberIds.length === 1 ? `${c.name}（${t('common.you')}）` : c.name,
              }}
              users={users}
              preview={previewOf(c.id)}
              time={formatListTime(c.lastActivityTs, locale)}
              tapProps={bindTap('slack.dms.openconversation', { params: { convId: c.id } })}
              longPressProps={bindLongPress('slack.dms.openrowmenu', { params: { convId: c.id } })}
            />
          ))
        )}
      </div>
      {sheet === 'channelRow' && <RowMenu />}
    </div>
  );
};

export default DmListPage;
