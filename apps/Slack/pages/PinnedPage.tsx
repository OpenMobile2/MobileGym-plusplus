import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL } from '../res/colors';
import { IcOverflow, IcPin } from '../res/icons';
import { formatTime } from '../utils/format';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Sheet from '../components/Sheet';

/** 置顶消息页：置顶卡列表（点卡跳回会话，… 菜单可取消置顶） */
const PinnedPage: React.FC = () => {
  const { bindTap, action, back } = useSlackGestures();
  const { t, locale } = useI18n();
  const { convId = '' } = useParams();
  const [params] = useSearchParams();
  const menuOpen = params.get('menu') === 'item';
  const targetId = params.get('msg') ?? '';

  const users = useSlackStore((s) => s.users);
  const messages = useSlackStore((s) => s.messages);
  const togglePinned = useSlackStore((s) => s.togglePinned);
  const showToast = useSlackStore((s) => s.showToast);

  const pinned = messages
    .filter((m) => m.convId === convId && m.pinned && !m.deleted)
    .sort((a, b) => b.ts - a.ts);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('pinned.title')} />

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {pinned.length === 0 ? (
          <p className="py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('pinned.empty')}
          </p>
        ) : (
          pinned.map((m) => {
            const u = users.find((x) => x.id === m.userId);
            return (
              <div
                key={m.id}
                className="mb-2.5 flex items-start gap-2 rounded-xl border border-[#EAEAEA] p-3"
              >
                <button
                  {...bindTap('slack.pinned.jump', { params: { convId, msg: m.id } })}
                  className="flex min-w-0 flex-1 items-start gap-2.5 border-none bg-transparent p-0 text-left"
                >
                  <Avatar user={u} size={32} rounded="rounded-md" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-1.5">
                      <span
                        className="text-[15px] font-bold"
                        style={{ color: NEUTRAL.textPrimary }}
                      >
                        {u?.displayName}
                      </span>
                      <span className="text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
                        {formatTime(m.ts, locale)}
                      </span>
                    </span>
                    <span
                      className="mt-0.5 block line-clamp-3 text-[15px]"
                      style={{ color: NEUTRAL.textPrimary }}
                    >
                      {m.text}
                    </span>
                  </span>
                </button>
                <button
                  {...bindTap('slack.pinned.openitemmenu', { params: { convId, msg: m.id } })}
                  aria-label="pinned-menu"
                  className="flex-shrink-0 border-none bg-transparent p-1"
                  style={{ color: NEUTRAL.textSecondary }}
                >
                  <IcOverflow size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>

      {menuOpen && (
        <Sheet>
          <button
            {...action(
              'slack.pinned.unpin',
              () => {
                if (targetId) togglePinned(targetId);
                showToast(t('pinned.unpin'));
                back();
              },
              { params: { messageId: targetId } },
            )}
            className="flex w-full items-center gap-3.5 border-none bg-transparent px-4 py-3 text-left"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IcPin size={19} />
            <span className="text-[16px]">{t('pinned.unpin')}</span>
          </button>
        </Sheet>
      )}
    </div>
  );
};

export default PinnedPage;
