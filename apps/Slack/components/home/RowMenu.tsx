import React from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../../hooks/useSlackGestures';
import { useI18n } from '../../i18n';
import { useSlackStore, timelineOf } from '../../state';
import { CHANNEL_ROW_MENU } from '../../constants';
import { NEUTRAL, RED, BLUE } from '../../res/colors';
import { formatTime } from '../../utils/format';
import { IconRenderer, IcChevronRight } from '../../res/icons';
import Avatar from '../Avatar';
import type { Bind } from '../../types';
import { copyToClipboard, channelUrl, huddleUrl } from '../../utils/osCaps';

/**
 * 长按会话行的 iOS 风格上下文菜单（IMG_2372 / IMG_2375）：
 * 上方是会话内容预览白卡，下方是灰白圆角菜单。空频道（无消息）时前三项置灰。
 */
const RowMenu: React.FC = () => {
  const { bindTap, action, bindBack, back } = useSlackGestures();
  const { t } = useI18n();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const convId = params.get('convId') ?? '';
  const copyOpen = params.get('copy') === 'open';
  const ns = pathname === '/dms' ? 'slack.dms' : 'slack.home';

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const workspace = useSlackStore((s) => s.workspace);
  const users = useSlackStore((s) => s.users);
  const messages = useSlackStore((s) => s.messages);
  const markUnread = useSlackStore((s) => s.markUnread);
  const toggleMute = useSlackStore((s) => s.toggleMute);
  const toggleStar = useSlackStore((s) => s.toggleStar);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const timeline = conv ? timelineOf(messages, conv.id) : [];
  const empty = timeline.length === 0;
  const preview = timeline.slice(-6);
  const copied = (text: string) => {
    if (!copyToClipboard(text)) {
      notImplemented();
      return;
    }
    showToast(t('common.copied'));
    back();
  };

  if (!conv) return null;

  const handlers: Record<string, Bind> = {
    markUnread: action(`${ns}.rowmenu.markunread`, () => {
      const last = timeline[timeline.length - 1];
      if (last) markUnread(conv.id, last.ts);
      back();
    }),
    mute: action(`${ns}.rowmenu.mute.toggle`, () => {
      toggleMute(conv.id);
      back();
    }),
    star: action(`${ns}.rowmenu.star.toggle`, () => {
      toggleStar(conv.id);
      back();
    }),
    copy: bindTap(pathname === '/dms' ? 'slack.dms.rowmenu.expandcopy' : 'slack.rowmenu.expandcopy'),
    leave: bindTap('slack.rowmenu.leavechannel', { params: { convId: conv.id } }),
  };

  const labelOf = (id: string) => {
    if (id === 'mute') return conv.muted ? t('rowMenu.unmute') : t('rowMenu.mute');
    if (id === 'star') return conv.starred ? t('rowMenu.unstar') : t('rowMenu.star');
    return t(`rowMenu.${id}`);
  };

  const copyItems = [
    {
      key: 'rowMenu.copyName',
      bind: action(`${ns}.rowcopy.select.name`, () =>
        copied(conv.isPrivate ? conv.name : `#${conv.name}`),
      ),
    },
    {
      key: 'rowMenu.copyLink',
      bind: action(`${ns}.rowcopy.select.link`, () =>
        copied(channelUrl(workspace.url, conv.id)),
      ),
    },
    {
      key: 'rowMenu.copyHuddleLink',
      bind: action(`${ns}.rowcopy.select.huddle`, () =>
        copied(huddleUrl(workspace.url, conv.id)),
      ),
    },
  ];

  return (
    <div className="absolute inset-0 z-50">
      <div
        {...bindBack()}
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        aria-label="close-rowmenu"
      />

      <div className="absolute inset-x-0 top-24 flex flex-col items-center gap-3 px-6">
        {!empty && (
          <div className="max-h-[44%] w-full overflow-hidden rounded-2xl bg-white px-4 py-3">
            {preview.map((m) => {
              const u = users.find((x) => x.id === m.userId);
              return (
                <div key={m.id} className="mb-2 flex gap-2">
                  <Avatar user={u} size={30} rounded="rounded-md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px]">
                      <span className="font-bold" style={{ color: NEUTRAL.textPrimary }}>
                        {u?.displayName}
                      </span>
                      <span className="ml-1.5 text-[11px]" style={{ color: NEUTRAL.textSecondary }}>
                        {formatTime(m.ts)}
                      </span>
                    </p>
                    <p className="text-[14px]" style={{ color: NEUTRAL.textPrimary }}>
                      {m.text}
                    </p>
                    {m.reactions.length > 0 && (
                      <div className="mt-1 flex gap-1.5">
                        {m.reactions.map((r) => (
                          <span
                            key={r.emoji}
                            className="rounded-full border px-1.5 text-[12px]"
                            style={{
                              borderColor: BLUE.reactionActiveBorder,
                              backgroundColor: BLUE.reactionActiveBg,
                            }}
                          >
                            {r.emoji} {r.userIds.length}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="w-[72%] overflow-hidden rounded-xl bg-[#F5F5F7]">
          {copyOpen ? (
            copyItems.map((item) => (
              <button
                key={item.key}
                {...item.bind}
                className="flex w-full items-center border-t border-black/5 bg-transparent px-4 py-3.5 text-left first:border-t-0"
              >
                <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                  {t(item.key)}
                </span>
              </button>
            ))
          ) : (
            <>
              <p className="px-4 pb-1 pt-3 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                {conv.isPrivate ? conv.name : `#${conv.name}`}
              </p>
              {CHANNEL_ROW_MENU.map((item) => {
                if (item.id === 'leave' && conv.kind !== 'channel') return null;
                const disabled = item.needsMessages && empty;
                const danger = item.id === 'leave';
                const color = disabled ? '#B5B5B8' : danger ? RED.destructive : NEUTRAL.textPrimary;
                return (
                  <button
                    key={item.id}
                    {...(disabled ? {} : handlers[item.id])}
                    disabled={disabled}
                    className="flex w-full items-center gap-3 border-t border-black/5 bg-transparent px-4 py-3 text-left"
                    style={{ color }}
                  >
                    <IconRenderer name={item.icon} size={19} />
                    <span className="flex-1 text-[16px]">{labelOf(item.id)}</span>
                    {item.id === 'copy' && <IcChevronRight size={18} />}
                  </button>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RowMenu;
