import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { copyToClipboard, pickImages } from '../utils/osCaps';
import { NEUTRAL, GREEN } from '../res/colors';
import { IcBack, IcHuddle, IcSaved, IcOverflow, IcForwardMsg, IcCheck } from '../res/icons';
import MessageBlock from '../components/MessageBlock';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';
import MessageMenuSheet from '../components/conversation/MessageMenuSheet';
import EmojiPickerSheet from '../components/conversation/EmojiPickerSheet';
import type { Attachment, Message } from '../types';

/**
 * 消息列详情页：父消息 → 分隔行（N 条回复 + 书签 / 转发 / …）→ 回复列表 → 「添加回复」输入栏。
 * 输入栏上方带「同时发送至 #频道」勾选框，勾了主时间线也会留一条。
 */
const ThreadPage: React.FC = () => {
  const { bindTap, bindLongPress, bindBack, action, bindInput, back } = useSlackGestures();
  const { t } = useI18n();
  const { convId = '', messageId = '' } = useParams();
  const [params] = useSearchParams();
  const sheet = params.get('sheet');
  const targetId = params.get('msg') ?? '';

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const users = useSlackStore((s) => s.users);
  const messages = useSlackStore((s) => s.messages);
  const mutedThreads = useSlackStore((s) => s.mutedThreads);
  const sendMessage = useSlackStore((s) => s.sendMessage);
  const toggleReaction = useSlackStore((s) => s.toggleReaction);
  const toggleSaved = useSlackStore((s) => s.toggleSaved);
  const toggleThreadMute = useSlackStore((s) => s.toggleThreadMute);
  const markThreadRead = useSlackStore((s) => s.markThreadRead);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const [text, setText] = useState('');
  const [alsoSend, setAlsoSend] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const parent = messages.find((m) => m.id === messageId);
  const replies = useMemo(
    () =>
      messages.filter((m) => m.threadParentId === messageId).sort((a, b) => a.ts - b.ts),
    [messages, messageId],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
    markThreadRead(messageId);
  }, [replies.length, messageId, markThreadRead]);

  if (!parent || !conv) return null;

  const target = messages.find((m) => m.id === targetId);

  const send = () => {
    if (!text.trim() && !attachment) return;
    sendMessage(convId, text, {
      threadParentId: messageId,
      alsoSent: alsoSend,
      attachments: attachment ? [attachment] : [],
    });
    setText('');
    setAttachment(null);
  };

  const closeSheetAfter = (fn: () => boolean | void) => () => {
    if (fn() === false) return;
    back();
  };

  const bindsOf = (m: Message) => ({
    longPress: bindLongPress('slack.thread.openmessagemenu', {
      params: { convId, messageId, msg: m.id },
    }),
    author: bindTap('slack.thread.openprofile', { params: { userId: m.userId } }),
    mention: (userId: string) => bindTap('slack.thread.openprofile', { params: { userId } }),
    reaction: (emoji: string) =>
      action('slack.thread.reaction.toggle', () => toggleReaction(m.id, emoji), {
        params: { messageId: m.id, emoji },
      }),
    addReaction: bindTap('slack.thread.openemoji', {
      params: { convId, messageId, msg: m.id },
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
        <span className="min-w-0 flex-1">
          <span className="block text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {t('thread.title')}
          </span>
          <span className="block truncate text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
            #{conv.name}
          </span>
        </span>
        <button
          {...bindTap('slack.thread.openhuddle', { params: { convId } })}
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
        <MessageBlock
          msg={parent}
          user={users.find((u) => u.id === parent.userId)}
          binds={bindsOf(parent)}
        />

        <div className="flex items-center gap-2 border-b border-[#EAEAEA] px-4 py-2">
          <span className="flex-1 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('thread.replyCount', { n: replies.length })}
          </span>
          <button
            {...action('slack.thread.save', () => {
              const was = parent.saved;
              toggleSaved(parent.id);
              showToast(was ? t('msgMenu.unsavedToast') : t('msgMenu.savedToast'));
            })}
            aria-label="save-thread"
            className="border-none bg-transparent p-1"
            style={{ color: parent.saved ? GREEN.primary : NEUTRAL.textSecondary }}
          >
            <IcSaved size={17} />
          </button>
          <button
            {...bindTap('slack.thread.openforward', { params: { msg: parent.id } })}
            aria-label="forward-thread"
            className="border-none bg-transparent p-1"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcForwardMsg size={17} />
          </button>
          <button
            {...bindTap('slack.thread.openmore', {
              params: { convId, messageId, msg: parent.id },
            })}
            aria-label="thread-more"
            className="border-none bg-transparent p-1"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcOverflow size={17} />
          </button>
        </div>

        <MessageList messages={replies} bindsOf={bindsOf} />
        <div ref={bottomRef} />
      </div>

      <Composer
        value={text}
        onChange={setText}
        placeholder={t('thread.placeholder')}
        attachment={attachment}
        aboveRow={
          <button
            {...action('slack.thread.alsosend.toggle', () => setAlsoSend((v) => !v))}
            className="mb-1.5 flex w-full items-center gap-2 border-none bg-transparent p-0 text-left"
          >
            <span
              className="flex h-[18px] w-[18px] items-center justify-center rounded border"
              style={{
                borderColor: alsoSend ? GREEN.primary : '#B9B9B9',
                backgroundColor: alsoSend ? GREEN.primary : 'transparent',
                color: '#FFFFFF',
              }}
            >
              {alsoSend && <IcCheck size={12} />}
            </span>
            <span className="text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('thread.alsoSend', { name: conv.name })}
            </span>
          </button>
        }
        hideTools={['mention']}
        binds={{
          input: bindInput('slack.thread.reply.input'),
          send: action('slack.thread.reply.submit', send),
          removeAttachment: action('slack.thread.attach.remove', () => setAttachment(null)),
          tool: (id) => {
            if (id === 'attach')
              return action('slack.thread.attach.toast', () => {
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
              });
            if (id === 'format') return action('slack.thread.format.toast', notImplemented);
            if (id === 'emoji')
              return bindTap('slack.thread.openemoji', { params: { convId, messageId } });
            return action('slack.thread.slash.toast', notImplemented);
          },
        }}
      />

      {sheet === 'messageMenu' && target && (
        <MessageMenuSheet
          mine={target.userId === ME}
          expanded
          threadMuted={mutedThreads.includes(target.id)}
          hiddenTiles={['reply', 'forward']}
          hiddenRows={[
            'markUnread',
            'remind',
            'copyLink',
            'edit',
            'pin',
            'selectText',
            'delete',
          ]}
          binds={{
            quickReact: (emoji) =>
              action(
                'slack.thread.msgmenu.react',
                closeSheetAfter(() => toggleReaction(target.id, emoji)),
                { params: { messageId: target.id, emoji } },
              ),
            moreEmoji: bindTap('slack.thread.msgmenu.openemoji', {
              params: { convId, messageId, msg: target.id },
            }),
            tile: () =>
              action(
                'slack.thread.msgmenu.save',
                closeSheetAfter(() => {
                  const was = target.saved;
                  toggleSaved(target.id);
                  showToast(was ? t('msgMenu.unsavedToast') : t('msgMenu.savedToast'));
                }),
                { params: { messageId: target.id } },
              ),
            row: (id) => {
              if (id === 'copyText')
                return action(
                  'slack.thread.msgmenu.copytext',
                  closeSheetAfter(() => {
                    if (!copyToClipboard(target.text)) {
                      notImplemented();
                      return false;
                    }
                    showToast(t('msgMenu.copiedToast'));
                  }),
                  { params: { messageId: target.id } },
                );
              return action(
                'slack.thread.msgmenu.threadmute.toggle',
                closeSheetAfter(() => {
                  const muted = useSlackStore.getState().mutedThreads.includes(target.id);
                  toggleThreadMute(target.id);
                  showToast(muted ? t('msgMenu.subscribedToast') : t('msgMenu.unsubscribedToast'));
                }),
                { params: { messageId: target.id } },
              );
            },
            expand: bindBack(),
          }}
        />
      )}

      {sheet === 'emojiPicker' && (
        <EmojiPickerSheet
          binds={{
            pick: (emoji) =>
              action(
                'slack.thread.emoji.pick',
                closeSheetAfter(() => {
                  if (targetId) toggleReaction(targetId, emoji);
                  else setText((prev) => prev + emoji);
                }),
                { params: { emoji } },
              ),
            search: bindInput('slack.thread.emoji.search'),
            category: (id) =>
              action('slack.thread.emoji.category.select.jump', () => {}, {
                params: { category: id },
              }),
          }}
        />
      )}
    </div>
  );
};

export default ThreadPage;
