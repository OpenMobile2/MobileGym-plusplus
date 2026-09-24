import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME, timelineOf } from '../state';
import { SLACKBOT_DELAY, SLACKBOT_RULES } from '../constants';
import { copyToClipboard, pickImages, messageUrl } from '../utils/osCaps';
import { NEUTRAL, GREEN } from '../res/colors';
import { IcBack, IcClose, IcHuddle, IcPlus, IcSend } from '../res/icons';
import MessageList from '../components/MessageList';
import Avatar, { AvatarStack } from '../components/Avatar';
import MessageMenuSheet from '../components/conversation/MessageMenuSheet';
import AsyncFsImage from '@/os/components/AsyncFsImage';
import type { Attachment, Message, SlackUser } from '../types';

const SLACKBOT_ID = 'u_slackbot';

/**
 * 私信 / 群私信会话页 —— 消息流 + Slackbot 自动回复 + 长按面板。
 */
const DmConversationPage: React.FC = () => {
  const { bindTap, bindLongPress, bindBack, action, bindInput, back } = useSlackGestures();
  const { t } = useI18n();
  const { convId = '' } = useParams();
  const [params] = useSearchParams();

  const sheet = params.get('sheet');
  const dialog = params.get('dialog');
  const menuMore = params.get('more') === '1';
  const targetId = params.get('msg') ?? '';

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const workspace = useSlackStore((s) => s.workspace);
  const users = useSlackStore((s) => s.users);
  const messages = useSlackStore((s) => s.messages);
  const mutedThreads = useSlackStore((s) => s.mutedThreads);
  const sendMessage = useSlackStore((s) => s.sendMessage);
  const deleteMessage = useSlackStore((s) => s.deleteMessage);
  const toggleReaction = useSlackStore((s) => s.toggleReaction);
  const toggleSaved = useSlackStore((s) => s.toggleSaved);
  const togglePinned = useSlackStore((s) => s.togglePinned);
  const toggleThreadMute = useSlackStore((s) => s.toggleThreadMute);
  const setDraft = useSlackStore((s) => s.setDraft);
  const markRead = useSlackStore((s) => s.markRead);
  const markUnread = useSlackStore((s) => s.markUnread);
  const replyAsUser = useSlackStore((s) => s.replyAsUser);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const [text, setText] = useState(conv?.draft ?? '');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [dividerTs, setDividerTs] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = useSlackStore.getState().conversations.find((x) => x.id === convId);
    setDividerTs(c?.hasUnread ? c.lastReadTs : null);
    markRead(convId);
  }, [convId, markRead]);

  useEffect(() => {
    // 只负责滚动；不要在这里 markRead——关消息菜单也会改 sheet，会把刚设的「标记未读」清掉
    if (targetId && !sheet) {
      const el = document.querySelector(`[data-message-id="${CSS.escape(targetId)}"]`);
      el?.scrollIntoView({ block: 'center' });
      return;
    }
    if (!sheet) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, targetId, sheet]);

  const textRef = useRef(text);
  textRef.current = text;
  useEffect(
    () => () => {
      if (convId) setDraft(convId, textRef.current);
    },
    [convId, setDraft],
  );

  const timeline = useMemo(() => timelineOf(messages, convId), [messages, convId]);
  const target = messages.find((m) => m.id === targetId);

  if (!conv) return null;

  const others = conv.memberIds.filter((id) => id !== ME);
  const peer = users.find((u) => u.id === others[0]);
  const groupUsers = others
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is SlackUser => Boolean(u));

  const send = () => {
    const body = text.trim();
    if (!body && !attachment) return;
    sendMessage(convId, body, { attachments: attachment ? [attachment] : [] });
    setText('');
    setAttachment(null);

    if (conv.memberIds.includes(SLACKBOT_ID)) {
      const lower = body.toLowerCase();
      const rule = SLACKBOT_RULES.find((r) =>
        r.words.some((w) => lower.includes(w.toLowerCase())),
      );
      const replyKey = rule?.replyKey ?? 'slackbot.fallback';
      const delay =
        SLACKBOT_DELAY.min +
        Math.random() * (SLACKBOT_DELAY.max - SLACKBOT_DELAY.min);
      window.setTimeout(
        () => replyAsUser(convId, SLACKBOT_ID, t(replyKey)),
        delay,
      );
    }
  };

  const closeSheetAfter = (fn: () => boolean | void) => () => {
    if (fn() === false) return;
    back();
  };

  const headerBind =
    conv.kind === 'group'
      ? bindTap('slack.dm.openmembers', { params: { convId } })
      : peer
        ? bindTap('slack.dm.openprofile', { params: { userId: peer.id } })
        : {};

  const bindsOf = (m: Message) => ({
    longPress: bindLongPress('slack.dm.openmessagemenu', {
      params: { convId, msg: m.id },
    }),
    reaction: (emoji: string) =>
      action('slack.dm.reaction.toggle', () => toggleReaction(m.id, emoji), {
        params: { messageId: m.id, emoji },
      }),
  });

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-3 pb-2 pt-11">
        <button
          {...bindBack()}
          aria-label="back"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcBack size={21} />
        </button>

        <button
          {...headerBind}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#F3F3F3] px-3 py-1.5 text-left"
        >
          {conv.kind === 'group' ? (
            <AvatarStack users={groupUsers} size={22} />
          ) : (
            <Avatar user={peer} size={22} rounded="rounded" presence />
          )}
          <span className="min-w-0">
            <span
              className="block truncate text-[15px] font-bold"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {conv.name}
            </span>
            <span className="block truncate text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
              {conv.kind === 'group'
                ? t('conv.members', { n: conv.memberIds.length })
                : peer?.online
                  ? t('profile.active')
                  : t('profile.away')}
            </span>
          </span>
        </button>

        <button
          {...bindTap('slack.dm.openhuddle', { params: { convId } })}
          aria-label="huddle"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcHuddle size={19} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto py-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {conv.kind === 'dm' && peer && peer.id !== ME && (
          <div className="flex flex-col items-center px-4 py-6 text-center">
            <Avatar user={peer} size={72} rounded="rounded-2xl" presence />
            <h2 className="mt-3 text-[20px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {peer.displayName}
            </h2>
            <p className="text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
              {peer.title}
            </p>
            <p className="mt-2 text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('dm.openingTitle', { name: peer.displayName })}
            </p>
          </div>
        )}

        <MessageList messages={timeline} dividerAfterTs={dividerTs} bindsOf={bindsOf} />
        <div ref={bottomRef} />
      </div>

      <div data-keep-keyboard="true" className="flex-shrink-0 border-t border-[#EAEAEA] px-3 py-2">
        {attachment && (
          <div className="mb-2 flex items-center gap-2 rounded-xl bg-[#F3F3F3] px-2 py-2">
            {attachment.uri?.startsWith('/') ? (
              <AsyncFsImage
                path={attachment.uri}
                alt={attachment.name ?? ''}
                className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
              />
            ) : attachment.uri ? (
              <img
                src={attachment.uri}
                alt={attachment.name ?? ''}
                className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span
                className="h-14 w-14 flex-shrink-0 rounded-lg"
                style={{ backgroundColor: attachment.color ?? '#DDDDDD' }}
              />
            )}
            <span className="min-w-0 flex-1 truncate text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {attachment.name ?? t('attach.imageAdded')}
            </span>
            <button
              {...action('slack.dm.attach.remove', () => setAttachment(null))}
              aria-label="remove-attachment"
              className="flex h-7 w-7 items-center justify-center rounded-full border-none bg-white"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcClose size={15} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            {...action('slack.dm.attach.toast', () => {
              void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                if (r.cancelled || !r.selected.length) return;
                const selected = r.selected[0];
                setAttachment({
                  kind: 'image',
                  name: selected.name,
                  uri: selected.path || selected.uri,
                  color: '#DDDDDD',
                  ratio:
                    selected.width && selected.height
                      ? selected.width / selected.height
                      : 1.5,
                });
              });
            })}
            aria-label="attach"
            className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <IcPlus size={19} />
          </button>
          <textarea
            {...bindInput('slack.dm.compose.input')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={t('conv.placeholderDm', { name: conv.name })}
            className="max-h-28 min-w-0 flex-1 resize-none rounded-2xl border border-[#DDDDDD] px-3 py-2 text-[16px] outline-none"
            style={{ color: NEUTRAL.textPrimary, backgroundColor: NEUTRAL.bgInput }}
          />
          <button
            {...action('slack.dm.send.submit', send)}
            disabled={!text.trim() && !attachment}
            aria-label="send"
            className="flex h-9 w-9 items-center justify-center rounded-lg border-none"
            style={{
              backgroundColor: text.trim() || attachment ? GREEN.primary : '#E4E4E4',
              color: text.trim() || attachment ? '#FFFFFF' : '#A9A9A9',
            }}
          >
            <IcSend size={17} />
          </button>
        </div>
      </div>

      {sheet === 'messageMenu' && target && (
        <MessageMenuSheet
          mine={target.userId === ME}
          expanded={menuMore}
          pinned={target.pinned}
          threadMuted={mutedThreads.includes(target.id)}
          binds={{
            quickReact: (emoji) =>
              action(
                'slack.dm.msgmenu.react',
                closeSheetAfter(() => toggleReaction(target.id, emoji)),
                { params: { messageId: target.id, emoji } },
              ),
            moreEmoji: action('slack.dm.msgmenu.openemoji.toast', notImplemented),
            tile: (id) => {
              if (id === 'reply')
                return action('slack.dm.msgmenu.openthread.toast', notImplemented);
              if (id === 'forward')
                return bindTap('slack.dm.msgmenu.openforward', { params: { msg: target.id } });
              return action(
                'slack.dm.msgmenu.save',
                closeSheetAfter(() => {
                  const was = target.saved;
                  toggleSaved(target.id);
                  showToast(was ? t('msgMenu.unsavedToast') : t('msgMenu.savedToast'));
                }),
                { params: { messageId: target.id } },
              );
            },
            row: (id) => {
              if (id === 'markUnread')
                return action(
                  'slack.dm.msgmenu.markunread',
                  closeSheetAfter(() => markUnread(convId, target.ts)),
                  { params: { messageId: target.id } },
                );
              if (id === 'remind')
                return action('slack.dm.msgmenu.remind.toast', notImplemented);
              if (id === 'unsubscribe')
                return action(
                  'slack.dm.msgmenu.threadmute.toggle',
                  closeSheetAfter(() => {
                    const muted = useSlackStore.getState().mutedThreads.includes(target.id);
                    toggleThreadMute(target.id);
                    showToast(
                      muted ? t('msgMenu.subscribedToast') : t('msgMenu.unsubscribedToast'),
                    );
                  }),
                  { params: { messageId: target.id } },
                );
              if (id === 'edit')
                return action('slack.dm.msgmenu.edit.toast', notImplemented);
              if (id === 'copyLink')
                return action(
                  'slack.dm.msgmenu.copylink',
                  closeSheetAfter(() => {
                    if (!copyToClipboard(messageUrl(workspace.url, convId, target.id))) {
                      notImplemented();
                      return false;
                    }
                    showToast(t('msgMenu.copiedToast'));
                  }),
                  { params: { messageId: target.id } },
                );
              if (id === 'copyText')
                return action(
                  'slack.dm.msgmenu.copytext',
                  closeSheetAfter(() => {
                    if (!copyToClipboard(target.text)) {
                      notImplemented();
                      return false;
                    }
                    showToast(t('msgMenu.copiedToast'));
                  }),
                  { params: { messageId: target.id } },
                );
              if (id === 'pin')
                return action(
                  'slack.dm.msgmenu.pin.toggle',
                  closeSheetAfter(() => togglePinned(target.id)),
                  { params: { messageId: target.id } },
                );
              if (id === 'selectText')
                return action('slack.dm.msgmenu.selecttext.toast', notImplemented);
              return bindTap('slack.dm.msgmenu.opendelete', {
                params: { convId, msg: target.id },
              });
            },
            expand: bindTap('slack.dm.msgmenu.expand', {
              params: { convId, msg: target.id },
            }),
          }}
        />
      )}

      {dialog === 'deleteMessage' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
          <div {...bindBack()} className="absolute inset-0 bg-black/40" aria-label="cancel" />
          <div className="relative w-full max-w-[300px] rounded-xl bg-white p-5 text-center">
            <h3 className="text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {t('deleteMsg.title')}
            </h3>
            <p className="mt-1.5 text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('deleteMsg.desc')}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                {...bindBack()}
                className="flex-1 rounded-lg border border-[#DDDDDD] bg-transparent py-2.5 text-[15px]"
                style={{ color: NEUTRAL.textPrimary }}
              >
                {t('common.cancel')}
              </button>
              <button
                {...action('slack.dm.msgdelete.submit', () => {
                  if (targetId) deleteMessage(targetId);
                  back();
                })}
                className="flex-1 rounded-lg border-none py-2.5 text-[15px] font-bold text-white"
                style={{ backgroundColor: '#E01E5A' }}
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DmConversationPage;
