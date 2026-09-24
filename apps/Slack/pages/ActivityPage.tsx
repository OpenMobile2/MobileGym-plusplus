import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL, PURPLE, HIGHLIGHT } from '../res/colors';
import { IcHash, IcLock } from '../res/icons';
import { formatListTime } from '../utils/format';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';

const SEGS = [
  { key: '', labelKey: 'activity.all' },
  { key: 'dms', labelKey: 'tab.dms' },
  { key: 'mentions', labelKey: 'activity.mentions' },
  { key: 'threads', labelKey: 'activity.threads' },
] as const;

/**
 * 活动页。紫点规则（阶段④ 订正）：逐条点开活动行才清该行紫点，
 * 全部清完后底栏「活动」紫点才消失。
 */
const ActivityPage: React.FC = () => {
  const { bindTap } = useSlackGestures();
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const seg = params.get('seg') ?? '';
  const unreadOnly = params.get('unread') === '1';

  const activity = useSlackStore((s) => s.activity);
  const conversations = useSlackStore((s) => s.conversations);
  const users = useSlackStore((s) => s.users);
  const readActivity = useSlackStore((s) => s.readActivity);

  const filtered = activity
    .filter((a) => {
      if (seg === 'mentions') return a.kind === 'mention';
      if (seg === 'threads') return a.kind === 'thread';
      if (seg === 'dms') return conversations.find((c) => c.id === a.convId)?.kind !== 'channel';
      return true;
    })
    .filter((a) => (unreadOnly ? !a.read : true))
    .sort((x, y) => y.ts - x.ts);

  const kindLabel = (kind: string) => {
    if (kind === 'mention') return t('activity.mentionedYou');
    if (kind === 'thread') return t('activity.repliedThread');
    return t('activity.reactedTo');
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar variant="title" title={t('activity.title')} />

      <div className="flex flex-shrink-0 gap-2 px-3 py-2.5">
        {SEGS.map((s) => {
          const on = seg === s.key;
          return (
            <button
              key={s.key || 'all'}
              {...bindTap('slack.activity.selectseg', { params: { seg: s.key } })}
              className="flex-1 rounded-full border py-2 text-[14px]"
              style={{
                backgroundColor: on ? PURPLE.aubergine : '#FFFFFF',
                borderColor: on ? PURPLE.aubergine : '#DDDDDD',
                color: on ? '#FFFFFF' : NEUTRAL.textPrimary,
                fontWeight: on ? 700 : 400,
              }}
            >
              {t(s.labelKey)}
            </button>
          );
        })}
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('activity.empty')}
          </p>
        ) : (
          filtered.map((a) => {
            const u = users.find((x) => x.id === a.userId);
            const conv = conversations.find((c) => c.id === a.convId);
            return (
              <button
                key={a.id}
                {...(conv?.kind === 'channel'
                  ? bindTap('slack.activity.openitem', {
                      params: { convId: a.convId },
                      beforeTrigger: () => readActivity(a.id),
                    })
                  : bindTap('slack.activity.opendm', {
                      params: { convId: a.convId },
                      beforeTrigger: () => readActivity(a.id),
                    }))}
                className="flex w-full gap-3 border-none bg-transparent px-4 py-3 text-left"
              >
                <Avatar user={u} size={38} rounded="rounded-md" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline">
                    <span className="truncate text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                      {u?.displayName}
                    </span>
                    <span className="ml-auto flex items-center gap-1.5 pl-2 text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
                      {formatListTime(a.ts, locale)}
                      {!a.read && (
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PURPLE.unreadDot }} />
                      )}
                    </span>
                  </div>
                  <p className="flex items-center gap-1 text-[13px] font-semibold" style={{ color: NEUTRAL.textSecondary }}>
                    {conv?.kind === 'channel' &&
                      (conv.isPrivate ? <IcLock size={12} /> : <IcHash size={12} />)}
                    <span className="truncate">{conv?.name}</span>
                    <span className="font-normal">· {kindLabel(a.kind)}</span>
                  </p>
                  <p
                    className="mt-0.5 line-clamp-2 text-[15px]"
                    style={{
                      color: NEUTRAL.textPrimary,
                      backgroundColor: a.kind === 'mention' ? HIGHLIGHT : 'transparent',
                    }}
                  >
                    {a.emoji ? `${a.emoji} ` : ''}
                    {a.text}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {seg === '' && (
        <div className="pointer-events-none absolute bottom-24 right-4 z-10">
          <button
            {...bindTap('slack.activity.toggleunread', { params: { on: unreadOnly ? '0' : '1' } })}
            className="pointer-events-auto rounded-full border-none px-4 py-2 text-[14px] font-semibold"
            style={{
              backgroundColor: unreadOnly ? PURPLE.aubergine : '#EFEFEF',
              color: unreadOnly ? '#FFFFFF' : NEUTRAL.textPrimary,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            }}
          >
            {t('activity.unreadFilter')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
