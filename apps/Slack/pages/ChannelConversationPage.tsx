import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME, timelineOf } from '../state';
import { ATTACH_FILE, REMIND_OPTIONS } from '../constants';
import { applyFormat } from '../utils/format';
import {
  copyToClipboard,
  pickImages,
  channelUrl,
  messageUrl,
} from '../utils/osCaps';
import { NEUTRAL, RED, BLUE } from '../res/colors';
import { IcBack, IcHash, IcLock, IcHuddle, IcPin, IcClose } from '../res/icons';
import MessageList from '../components/MessageList';
import Composer from '../components/Composer';
import MessageMenuSheet from '../components/conversation/MessageMenuSheet';
import EmojiPickerSheet from '../components/conversation/EmojiPickerSheet';
import AttachSheet from '../components/conversation/AttachSheet';
import RemindSheet from '../components/conversation/RemindSheet';
import ReactionUsersSheet from '../components/conversation/ReactionUsersSheet';
import MentionList from '../components/conversation/MentionList';
import ChannelPanelSheet from '../components/conversation/ChannelPanelSheet';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Attachment, Message } from '../types';

/**
 * 频道会话页 —— Layer 1 核心。
 * 消息流（日期分隔 / 新消息红线 / reaction / 消息列入口）+ 输入栏各态 + 长按面板及其全部出口。
 */
const ChannelConversationPage: React.FC = () => {
  const { bindTap, bindLongPress, bindBack, action, bindInput, back } = useSlackGestures();
  const { t } = useI18n();
  const { convId = '' } = useParams();
  const [params] = useSearchParams();

  const sheet = params.get('sheet');
  const dialog = params.get('dialog');
  const overlay = params.get('overlay');
  const menuMore = params.get('more') === '1';
  const panelMenu = params.get('menu');
  const confirmKind = (params.get('confirm') ?? 'leave') as 'leave' | 'archive' | 'private';
  const formatOpen = params.get('bar') === 'format';
  const editId = params.get('compose') === 'edit' ? params.get('edit') : null;
  const targetId = params.get('msg') ?? '';
  const targetEmoji = params.get('emoji') ?? '';

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const workspace = useSlackStore((s) => s.workspace);
  const users = useSlackStore((s) => s.users);
  const messages = useSlackStore((s) => s.messages);
  const mutedThreads = useSlackStore((s) => s.mutedThreads);
  const sendMessage = useSlackStore((s) => s.sendMessage);
  const editMessage = useSlackStore((s) => s.editMessage);
  const deleteMessage = useSlackStore((s) => s.deleteMessage);
  const toggleReaction = useSlackStore((s) => s.toggleReaction);
  const toggleSaved = useSlackStore((s) => s.toggleSaved);
  const togglePinned = useSlackStore((s) => s.togglePinned);
  const toggleThreadMute = useSlackStore((s) => s.toggleThreadMute);
  const addReminder = useSlackStore((s) => s.addReminder);
  const setDraft = useSlackStore((s) => s.setDraft);
  const markRead = useSlackStore((s) => s.markRead);
  const markUnread = useSlackStore((s) => s.markUnread);
  const addMembers = useSlackStore((s) => s.addMembers);
  const leaveChannel = useSlackStore((s) => s.leaveChannel);
  const archiveChannel = useSlackStore((s) => s.archiveChannel);
  const convertToPrivate = useSlackStore((s) => s.convertToPrivate);
  const toggleStar = useSlackStore((s) => s.toggleStar);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const [text, setText] = useState(conv?.draft ?? '');
  const [editText, setEditText] = useState('');
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  /** 发出的消息 @ 了不在频道里的人 → 输入栏上方提示条 */
  const [suggestUserId, setSuggestUserId] = useState<string | null>(null);
  /** 「新消息」红线位置在进入会话那一刻定下，停留期间不动 */
  const [dividerTs, setDividerTs] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = useSlackStore.getState().conversations.find((x) => x.id === convId);
    setDividerTs(c?.hasUnread ? c.lastReadTs : null);
    markRead(convId);
  }, [convId, markRead]);

  useEffect(() => {
    // 从搜索/留待处理带 msg 进来时定位到该条；有 sheet 时不抢滚动
    if (targetId && !sheet) {
      const el = document.querySelector(`[data-message-id="${CSS.escape(targetId)}"]`);
      el?.scrollIntoView({ block: 'center' });
      return;
    }
    if (!sheet) bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, targetId, sheet]);

  // 编辑态回填原文
  useEffect(() => {
    if (!editId) return;
    const m = useSlackStore.getState().messages.find((x) => x.id === editId);
    setEditText(m?.text ?? '');
  }, [editId]);

  // 离开会话把未发送内容存成草稿
  const textRef = useRef(text);
  textRef.current = text;
  useEffect(
    () => () => {
      if (convId) setDraft(convId, textRef.current);
    },
    [convId, setDraft],
  );

  const timeline = useMemo(() => timelineOf(messages, convId), [messages, convId]);
  const pinnedCount = useMemo(
    () => messages.filter((m) => m.convId === convId && m.pinned && !m.deleted).length,
    [messages, convId],
  );
  const target = messages.find((m) => m.id === targetId);

  if (!conv) return null;

  const send = () => {
    const body = text.trim();
    if (!body && !attachment) return;
    sendMessage(convId, body, { attachments: attachment ? [attachment] : [] });
    // @ 了不在频道里的人 → 出提示条
    const outsider = conv.memberSuggestion
      ? users.find(
          (u) =>
            !u.isBot &&
            u.id !== ME &&
            !conv.memberIds.includes(u.id) &&
            (body.includes(`@${u.handle}`) || body.includes(`@${u.displayName}`)),
        )
      : undefined;
    setSuggestUserId(outsider?.id ?? null);
    setText('');
    setAttachment(null);
    setAttachment(null);
  };

  const saveEdit = () => {
    if (!editId || !editText.trim()) return;
    editMessage(editId, editText);
    back();
  };

  /** fn 返回 false 时不关面板（如复制失败需留在原处给反馈） */
  const closeSheetAfter = (fn: () => boolean | void) => () => {
    if (fn() === false) return;
    back();
  };

  const messageBinds = (m: Message) => ({
    longPress: bindLongPress('slack.channel.openmessagemenu', {
      params: { convId, msg: m.id },
    }),
    author: bindTap('slack.channel.openprofile', { params: { userId: m.userId } }),
    mention: (userId: string) =>
      bindTap('slack.channel.openprofile', { params: { userId } }),
    link: (url: string) => bindTap('slack.channel.openlink', { params: { url } }),
    image: bindTap('slack.channel.openimage', { params: { messageId: m.id } }),
    reaction: (emoji: string) =>
      action('slack.channel.reaction.toggle', () => toggleReaction(m.id, emoji), {
        params: { messageId: m.id, emoji },
      }),
    reactionLongPress: (emoji: string) =>
      // 不 stopPropagation 的话整块的长按也会同时起来，最后被消息面板覆盖
      bindLongPress('slack.channel.openreactionusers', {
        params: { convId, msg: m.id, emoji },
        stopPropagation: true,
      }),
    addReaction: bindTap('slack.channel.openemojifromrow', { params: { convId, msg: m.id } }),
    thread: bindTap('slack.channel.openthread', { params: { convId, messageId: m.id } }),
  });

  const suggestUser = users.find((u) => u.id === suggestUserId);

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
          {...bindTap('slack.channel.openpanel', { params: { convId } })}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-[#F3F3F3] px-3 py-1.5 text-left"
        >
          <span style={{ color: NEUTRAL.textPrimary }}>
            {conv.isPrivate ? <IcLock size={15} /> : <IcHash size={17} />}
          </span>
          <span className="min-w-0">
            <span
              className="block truncate text-[15px] font-bold"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {conv.name}
            </span>
            <span className="block truncate text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('conv.members', { n: conv.memberIds.length })}
            </span>
          </span>
        </button>

        <button
          {...bindTap('slack.channel.openhuddle', { params: { convId } })}
          aria-label="huddle"
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcHuddle size={19} />
        </button>
      </div>

      {pinnedCount > 0 && (
        <button
          {...bindTap('slack.channel.openpinned', { params: { convId } })}
          className="flex flex-shrink-0 items-center gap-2 border-y border-[#EAEAEA] bg-white px-4 py-2 text-left"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcPin size={14} />
          <span className="text-[14px]">{t('conv.pinnedBar', { n: pinnedCount })}</span>
        </button>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto py-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-4 py-4">
          <h2 className="text-[22px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            #{conv.name}
          </h2>
          <p className="mt-1.5 text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('conv.openingTitle', { name: conv.name })}
            {conv.description ? ` ${conv.description}` : ''}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!conv.description && (
              <button
                {...bindTap('slack.channel.openedit', { params: { convId } })}
                className="rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5 text-[14px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                {t('conv.addDescription')}
              </button>
            )}
            <button
              {...bindTap('slack.channel.openaddmembers', { params: { convId } })}
              className="rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5 text-[14px] font-bold"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {t('conv.addPeople')}
            </button>
          </div>
        </div>

        <MessageList
          messages={timeline}
          dividerAfterTs={dividerTs}
          editingId={editId}
          bindsOf={messageBinds}
        />
        <div ref={bottomRef} />
      </div>

      {suggestUser && (
        <div
          className="flex flex-shrink-0 items-center gap-2 px-3 py-2"
          style={{ backgroundColor: BLUE.noticeBg }}
        >
          <span className="min-w-0 flex-1 text-[13px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('mention.suggestAdd', { name: suggestUser.displayName })}
          </span>
          <button
            {...action(
              'slack.channel.mentionsuggest.add',
              () => {
                addMembers(convId, [suggestUser.id], (name) =>
                  t('members.joined', { name, channel: conv.name }),
                );
                setSuggestUserId(null);
              },
              { params: { userId: suggestUser.id } },
            )}
            className="flex-shrink-0 rounded border-none bg-white px-2 py-1 text-[13px] font-bold"
            style={{ color: BLUE.link }}
          >
            {t('mention.add')}
          </button>
          <button
            {...action('slack.channel.mentionsuggest.dismiss', () => setSuggestUserId(null))}
            aria-label="dismiss-suggest"
            className="flex-shrink-0 border-none bg-transparent p-1"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcClose size={15} />
          </button>
        </div>
      )}

      <Composer
        value={editId ? editText : text}
        onChange={editId ? setEditText : setText}
        placeholder={t('conv.placeholder', { name: conv.name })}
        attachment={attachment}
        formatOpen={formatOpen}
        editing={Boolean(editId)}
        binds={{
          input: bindInput('slack.channel.compose.input'),
          send: action('slack.channel.send.submit', send),
          mic: action('slack.channel.mic.toast', notImplemented),
          removeAttachment: action('slack.channel.attach.remove', () => setAttachment(null)),
          tool: (id) => {
            if (id === 'attach') return bindTap('slack.channel.openattach', { params: { convId } });
            if (id === 'format')
              return bindTap('slack.channel.openformatbar', { params: { convId } });
            if (id === 'emoji')
              return bindTap('slack.channel.openemojifromcomposer', { params: { convId } });
            if (id === 'mention') return bindTap('slack.channel.openmention', { params: { convId } });
            return action('slack.channel.slash.toast', notImplemented);
          },
          formatApply: (id) =>
            action(
              'slack.channel.format.apply',
              () => {
                const next = applyFormat(text, id);
                if (next === null) notImplemented();
                else setText(next);
              },
              { params: { tool: id } },
            ),
          closeFormat: bindBack(),
          editSave: action('slack.channel.edit.submit', saveEdit),
          editCancel: bindBack(),
        }}
      />

      {sheet === 'messageMenu' && target && (
        <MessageMenuSheet
          mine={target.userId === ME}
          expanded={menuMore}
          pinned={target.pinned}
          threadMuted={mutedThreads.includes(target.id)}
          binds={{
            quickReact: (emoji) =>
              action(
                'slack.channel.msgmenu.react',
                closeSheetAfter(() => toggleReaction(target.id, emoji)),
                { params: { messageId: target.id, emoji } },
              ),
            moreEmoji: bindTap('slack.channel.msgmenu.openemoji', {
              params: { convId, msg: target.id },
            }),
            tile: (id) => {
              if (id === 'reply')
                return bindTap('slack.channel.msgmenu.openthread', {
                  params: { convId, messageId: target.id },
                });
              if (id === 'forward')
                return bindTap('slack.channel.msgmenu.openforward', { params: { msg: target.id } });
                return action(
                  'slack.channel.msgmenu.save',
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
                  'slack.channel.msgmenu.markunread',
                  closeSheetAfter(() => markUnread(convId, target.ts)),
                  { params: { messageId: target.id } },
                );
              if (id === 'remind')
                return bindTap('slack.channel.msgmenu.openremind', {
                  params: { convId, msg: target.id },
                });
              if (id === 'unsubscribe')
                return action(
                  'slack.channel.msgmenu.threadmute.toggle',
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
                return bindTap('slack.channel.msgmenu.openedit', {
                  params: { convId, edit: target.id },
                });
              if (id === 'copyLink')
                return action(
                  'slack.channel.msgmenu.copylink',
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
                  'slack.channel.msgmenu.copytext',
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
                  'slack.channel.msgmenu.pin.toggle',
                  closeSheetAfter(() => togglePinned(target.id)),
                  { params: { messageId: target.id } },
                );
              if (id === 'selectText')
                return action('slack.channel.msgmenu.selecttext.toast', notImplemented);
              return bindTap('slack.channel.msgmenu.opendelete', {
                params: { convId, msg: target.id },
              });
            },
            expand: bindTap('slack.channel.msgmenu.expand', {
              params: { convId, msg: target.id },
            }),
          }}
        />
      )}

      {sheet === 'emojiPicker' && (
        <EmojiPickerSheet
          binds={{
            pick: (emoji) =>
              action(
                'slack.channel.emoji.pick',
                closeSheetAfter(() => {
                  if (targetId) toggleReaction(targetId, emoji);
                  else setText((prev) => prev + emoji);
                }),
                { params: { emoji } },
              ),
            search: bindInput('slack.channel.emoji.search'),
            category: (id) =>
              action('slack.channel.emoji.category.select.jump', () => {}, {
                params: { category: id },
              }),
          }}
        />
      )}

      {sheet === 'attach' && (
        <AttachSheet
          binds={{
            camera: action('slack.channel.attach.camera.toast', notImplemented),
            photo: (id) =>
              action(
                'slack.channel.attach.pickimage',
                () => {
                  void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                    if (r.cancelled || !r.selected.length) return;
                    const selected = r.selected[0];
                    const uri = selected.path || selected.uri;
                    setAttachment({
                      kind: 'image',
                      name: selected.name,
                      uri,
                      color: '#DDDDDD',
                      ratio:
                        selected.width && selected.height
                          ? selected.width / selected.height
                          : 1.5,
                    });
                    back();
                  });
                },
                { params: { imageId: id } },
              ),
            row: (id) => {
              if (id === 'file')
                return action(
                  'slack.channel.attach.pickfile',
                  closeSheetAfter(() =>
                    setAttachment({
                      kind: 'file',
                      name: ATTACH_FILE.name,
                      ext: ATTACH_FILE.ext,
                      size: ATTACH_FILE.size,
                    }),
                  ),
                );
              if (id === 'recentFiles') return bindTap('slack.channel.attach.openrecentfiles');
              if (id === 'canvas') return action('slack.channel.attach.canvas.toast', notImplemented);
              return action('slack.channel.attach.record.toast', notImplemented);
            },
          }}
        />
      )}

      {sheet === 'remind' && (
        <RemindSheet
          pick={(id) =>
            action(
              'slack.channel.remind.set',
              closeSheetAfter(() => {
                const opt = REMIND_OPTIONS.find((o) => o.id === id);
                if (!opt || !targetId) return;
                addReminder(targetId, opt.minutes);
                showToast(t('remind.setToast', { when: t(opt.labelKey) }));
              }),
              { params: { option: id } },
            )
          }
        />
      )}

      {sheet === 'reactionUsers' && target && (
        <ReactionUsersSheet
          msg={target}
          emoji={targetEmoji}
          openProfile={(userId) =>
            bindTap('slack.channel.reactionusers.openprofile', { params: { userId } })
          }
        />
      )}

      {overlay === 'mention' && (
        <MentionList
          memberIds={conv.memberIds}
          pick={(userId) =>
            action(
              'slack.channel.mention.pick',
              closeSheetAfter(() => {
                const u = users.find((x) => x.id === userId);
                if (u) setText((prev) => `${prev}@${u.handle} `);
              }),
              { params: { userId } },
            )
          }
          filterBind={bindInput('slack.channel.mention.filter')}
          dismiss={bindBack()}
        />
      )}

      {sheet === 'panel' && (
        <ChannelPanelSheet
          conv={conv}
          starBind={action('slack.channel.panel.star.toggle', () => toggleStar(convId))}
          copyLink={() => {
            if (!copyToClipboard(channelUrl(workspace.url, convId))) {
              notImplemented();
              return;
            }
            showToast(t('panelMore.copiedToast'));
          }}
          rowBinds={{
            messages: action('slack.channel.panel.messages', back),
            canvas: action('slack.channel.panel.canvas.toast', notImplemented),
            members: bindTap('slack.panel.openmembers', { params: { convId } }),
            notifications: bindTap('slack.panel.opennotifications', { params: { convId } }),
            settings: bindTap('slack.panel.opensettings', { params: { convId } }),
          }}
          moreRowBinds={{
            details: bindTap('slack.panelmore.opendetails', { params: { convId } }),
            archive: bindTap('slack.panelmore.confirmarchive', { params: { convId } }),
            leave: bindTap('slack.panelmore.confirmleave', { params: { convId } }),
          }}
        />
      )}

      {dialog === 'confirm' && (
        <ConfirmDialog
          kind={confirmKind}
          channelName={conv.name}
          confirmBind={
            confirmKind === 'leave'
              ? bindTap('slack.channel.leave', {
                  beforeTrigger: () => leaveChannel(convId),
                  nav: { mode: 'replace', popTo: '/', popToInclusive: true },
                })
              : confirmKind === 'archive'
                ? bindTap('slack.channel.archive', {
                    beforeTrigger: () => {
                      archiveChannel(convId);
                      showToast(t('confirm.archivedToast', { name: conv.name }));
                    },
                    nav: { mode: 'replace', popTo: '/', popToInclusive: true },
                  })
                : action('slack.channel.convertprivate.submit', () => {
                    convertToPrivate(convId);
                    back();
                  })
          }
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
                {...action('slack.channel.msgdelete.submit', () => {
                  if (targetId) deleteMessage(targetId);
                  back();
                })}
                className="flex-1 rounded-lg border-none py-2.5 text-[15px] font-bold text-white"
                style={{ backgroundColor: RED.destructive }}
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

export default ChannelConversationPage;
