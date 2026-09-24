import React from 'react';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { NEUTRAL, BLUE, HIGHLIGHT } from '../res/colors';
import { IcFile, IcThread, IcEmoji, IcForwardMsg } from '../res/icons';
import { formatTime } from '../utils/format';
import Avatar from './Avatar';
import AsyncFsImage from '@/os/components/AsyncFsImage';
import type { Bind, Message, SlackUser } from '../types';

/** 消息列入口文案：有未读回复时加粗显示「N 条新回复」 */
const ThreadReplyLabel: React.FC<{ parentId: string; replyCount: number }> = ({
  parentId,
  replyCount,
}) => {
  const { t } = useI18n();
  const threadReadTs = useSlackStore((s) => s.threadReadTs[parentId] ?? 0);
  const messages = useSlackStore((s) => s.messages);
  const newCount = messages.filter(
    (m) => m.threadParentId === parentId && m.ts > threadReadTs && !m.deleted,
  ).length;
  const hasNew = newCount > 0;
  return (
    <span
      className={`flex items-center gap-1 text-[14px] font-semibold ${hasNew ? 'font-bold' : ''}`}
      style={{ color: BLUE.link }}
    >
      <IcThread size={13} />
      {hasNew ? t('thread.newReplies', { n: newCount }) : t('conv.replies', { n: replyCount })}
    </span>
  );
};

/** 消息块上各处可点元素的绑定。页面按自己所在路由的 id 家族传进来 */
export type MessageBinds = {
  /** 整块长按 → 消息面板 */
  longPress?: Bind;
  /** 头像 / 名字 → 个人档案 */
  author?: Bind;
  /** @提及蓝字 → 个人档案 */
  mention?: (userId: string) => Bind;
  /** 链接 / 链接预览卡 → 内嵌网页 */
  link?: (url: string) => Bind;
  /** 图片 → 全屏查看 */
  image?: Bind;
  /** reaction 胶囊：点=加/取消，长按=看都有谁 */
  reaction?: (emoji: string) => Bind;
  reactionLongPress?: (emoji: string) => Bind;
  /** reaction 条末尾 ☺+ */
  addReaction?: Bind;
  /** 消息列入口条「N 条回复」 */
  thread?: Bind;
};

/** 格式标记（输入栏 Aa 插的那几种）渲染成对应样式，标记本身不显示 */
const MARKUP: Array<{ re: RegExp; style: React.CSSProperties; mono?: boolean }> = [
  { re: /^\*([^*]+)\*$/, style: { fontWeight: 700 } },
  { re: /^_([^_]+)_$/, style: { fontStyle: 'italic' } },
  { re: /^~([^~]+)~$/, style: { textDecoration: 'line-through' } },
  { re: /^`([^`]+)`$/, style: { fontFamily: 'monospace', fontSize: '14px' }, mono: true },
];

function renderMarkup(text: string, keyPrefix: string): React.ReactNode {
  return text.split(/(\*[^*]+\*|_[^_]+_|~[^~]+~|`[^`]+`)/g).map((seg, i) => {
    const hit = MARKUP.find((m) => m.re.test(seg));
    if (!hit) return <React.Fragment key={`${keyPrefix}-${i}`}>{seg}</React.Fragment>;
    const inner = seg.replace(hit.re, '$1');
    return (
      <span
        key={`${keyPrefix}-${i}`}
        style={hit.style}
        className={hit.mono ? 'rounded bg-[#F3F3F3] px-1' : undefined}
      >
        {inner}
      </span>
    );
  });
}

/** @提及、URL 用蓝色且都可点；* _ ~ ` 渲染成粗体 / 斜体 / 删除线 / 代码 */
const RichText: React.FC<{ text: string; binds?: MessageBinds }> = ({ text, binds }) => {
  const users = useSlackStore((s) => s.users);
  const parts = text.split(/(@[\w.\u4e00-\u9fa5]+|https?:\/\/\S+)/g);

  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('@')) {
          const key = p.slice(1).toLowerCase();
          const hit = users.find(
            (u) => u.handle.toLowerCase() === key || u.displayName.toLowerCase() === key,
          );
          const bind = hit ? binds?.mention?.(hit.id) : undefined;
          return bind ? (
            <button
              key={i}
              {...bind}
              className="border-none bg-transparent p-0 text-[16px]"
              style={{ color: BLUE.link }}
            >
              {p}
            </button>
          ) : (
            <span key={i} style={{ color: BLUE.link }}>
              {p}
            </span>
          );
        }
        if (p.startsWith('http')) {
          const bind = binds?.link?.(p);
          return bind ? (
            <button
              key={i}
              {...bind}
              className="break-all border-none bg-transparent p-0 text-left text-[16px]"
              style={{ color: BLUE.link }}
            >
              {p}
            </button>
          ) : (
            <span key={i} style={{ color: BLUE.link }}>
              {p}
            </span>
          );
        }
        return <React.Fragment key={i}>{renderMarkup(p, String(i))}</React.Fragment>;
      })}
    </>
  );
};

/** 正文：连续的「> 」行渲染成引用竖条，其余照常 */
const BodyText: React.FC<{ text: string; binds?: MessageBinds }> = ({ text, binds }) => {
  const runs: Array<{ quote: boolean; text: string }> = [];
  text.split('\n').forEach((line) => {
    const quote = line.startsWith('> ');
    const content = quote ? line.slice(2) : line;
    const last = runs[runs.length - 1];
    if (last && last.quote === quote) last.text += `\n${content}`;
    else runs.push({ quote, text: content });
  });

  return (
    <>
      {runs.map((run, i) =>
        run.quote ? (
          <span
            key={i}
            className="my-0.5 block border-l-4 border-[#DDDDDD] pl-2.5"
            style={{ color: NEUTRAL.textPrimary }}
          >
            <RichText text={run.text} binds={binds} />
          </span>
        ) : (
          <RichText key={i} text={run.text} binds={binds} />
        ),
      )}
    </>
  );
};

/** 转发消息带的引用块 */
const QuoteBlock: React.FC<{ msg: Message }> = ({ msg }) => {
  const { t } = useI18n();
  const users = useSlackStore((s) => s.users);
  if (!msg.quote) return null;
  const author = users.find((u) => u.id === msg.quote?.userId);
  return (
    <div className="mt-1.5 border-l-4 border-[#DDDDDD] pl-2.5">
      <p className="flex items-center gap-1.5 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
        <IcForwardMsg size={12} />
        {t('conv.forwarded')} · {author?.displayName}
        {msg.quote.convName ? ` · #${msg.quote.convName}` : ''}
      </p>
      <p className="text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
        {msg.quote.text}
      </p>
    </div>
  );
};

const MessageBlock: React.FC<{
  msg: Message;
  user?: SlackUser;
  /** 与上一条同人且间隔很近时省略头像与名字 */
  compactHead?: boolean;
  /** 正在被编辑 → 整块浅黄底 */
  editing?: boolean;
  binds?: MessageBinds;
}> = ({ msg, user, compactHead = false, editing = false, binds }) => {
  const { t, locale } = useI18n();
  const users = useSlackStore((s) => s.users);

  if (msg.system) {
    return (
      <p className="px-4 py-1 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
        {msg.text}
      </p>
    );
  }

  // 编辑态与 @提及 用同一个浅黄（design-tokens §6）
  const background = editing || msg.isMention ? HIGHLIGHT : 'transparent';

  return (
    <div
      {...(binds?.longPress ?? {})}
      data-message-id={msg.id}
      className="flex items-start gap-2.5 px-4 py-1"
      style={{ backgroundColor: background }}
    >
      {compactHead ? (
        <span className="w-9 flex-shrink-0" />
      ) : binds?.author ? (
        <button {...binds.author} aria-label="author" className="border-none bg-transparent p-0">
          <Avatar user={user} size={36} rounded="rounded-md" />
        </button>
      ) : (
        <Avatar user={user} size={36} rounded="rounded-md" />
      )}

      <div className="min-w-0 flex-1">
        {!compactHead && (
          <p className="flex items-baseline gap-1.5">
            {binds?.author ? (
              <button
                {...binds.author}
                className="border-none bg-transparent p-0 text-[15px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                {user?.displayName}
              </button>
            ) : (
              <span className="text-[15px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                {user?.displayName}
              </span>
            )}
            {user?.statusEmoji && <span className="text-[12px]">{user.statusEmoji}</span>}
            <span className="text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
              {formatTime(msg.ts, locale)}
            </span>
          </p>
        )}

        {msg.alsoSent && (
          <p className="text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('conv.alsoSentToChannel')}
          </p>
        )}

        {msg.deleted ? (
          <p className="text-[15px] italic" style={{ color: NEUTRAL.textSecondary }}>
            {t('conv.deleted')}
          </p>
        ) : msg.bigEmoji ? (
          <p className="py-1 text-[40px] leading-none">{msg.text}</p>
        ) : (
          msg.text && (
            <p
              className="whitespace-pre-wrap text-[16px] leading-snug"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <BodyText text={msg.text} binds={binds} />
              {msg.edited && (
                <span className="text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
                  {t('conv.edited')}
                </span>
              )}
            </p>
          )
        )}

        <QuoteBlock msg={msg} />

        {msg.attachments.map((a, i) => (
          <div key={i} className="mt-1.5">
            {a.kind === 'image' &&
              (binds?.image ? (
                <button
                  {...binds.image}
                  aria-label={t('viewer.image')}
                  className="block max-w-[240px] overflow-hidden rounded-lg border-none p-0"
                  style={{
                    backgroundColor: a.color ?? '#DDDDDD',
                    aspectRatio: a.uri ? undefined : String(a.ratio ?? 1.5),
                    width: '100%',
                  }}
                >
                  {a.uri ? (
                    a.uri.startsWith('/') ? (
                      <AsyncFsImage path={a.uri} alt={a.name ?? ''} className="block w-full object-cover" />
                    ) : (
                      <img src={a.uri} alt={a.name ?? ''} className="block w-full object-cover" />
                    )
                  ) : null}
                </button>
              ) : (
                <div
                  className="max-w-[240px] overflow-hidden rounded-lg"
                  style={{
                    backgroundColor: a.color ?? '#DDDDDD',
                    aspectRatio: a.uri ? undefined : String(a.ratio ?? 1.5),
                  }}
                >
                  {a.uri ? (
                    a.uri.startsWith('/') ? (
                      <AsyncFsImage path={a.uri} alt={a.name ?? ''} className="block w-full object-cover" />
                    ) : (
                      <img src={a.uri} alt={a.name ?? ''} className="block w-full object-cover" />
                    )
                  ) : null}
                </div>
              ))}
            {a.kind === 'file' && (
              <div className="flex max-w-[280px] items-center gap-2.5 rounded-lg border border-[#DDDDDD] p-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded bg-[#1264A3] text-white">
                  <IcFile size={18} />
                </span>
                <span className="min-w-0">
                  <span
                    className="block truncate text-[14px] font-bold"
                    style={{ color: NEUTRAL.textPrimary }}
                  >
                    {a.name}
                  </span>
                  <span className="block text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
                    {a.ext} · {a.size}
                  </span>
                </span>
              </div>
            )}
            {a.kind === 'link' &&
              (binds?.link ? (
                <button
                  {...binds.link(a.url ?? '')}
                  className="block max-w-[300px] border-none border-l-4 border-[#DDDDDD] bg-transparent pl-2.5 text-left"
                >
                  <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                    {a.domain}
                  </span>
                  <span className="block text-[15px] font-bold" style={{ color: BLUE.link }}>
                    {a.title}
                  </span>
                  <span className="block text-[14px]" style={{ color: NEUTRAL.textPrimary }}>
                    {a.desc}
                  </span>
                </button>
              ) : (
                <div className="max-w-[300px] border-l-4 border-[#DDDDDD] pl-2.5">
                  <p className="text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                    {a.domain}
                  </p>
                  <p className="text-[15px] font-bold" style={{ color: BLUE.link }}>
                    {a.title}
                  </p>
                  <p className="text-[14px]" style={{ color: NEUTRAL.textPrimary }}>
                    {a.desc}
                  </p>
                </div>
              ))}
          </div>
        ))}

        {(msg.reactions.length > 0 || (binds?.addReaction && !msg.deleted)) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {msg.reactions.map((r) => {
              const mine = r.userIds.includes(ME);
              return (
                <button
                  key={r.emoji}
                  {...(binds?.reactionLongPress?.(r.emoji) ?? {})}
                  {...(binds?.reaction?.(r.emoji) ?? {})}
                  className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[13px]"
                  style={{
                    borderColor: mine ? BLUE.reactionActiveBorder : '#DDDDDD',
                    backgroundColor: mine ? BLUE.reactionActiveBg : '#FFFFFF',
                    color: NEUTRAL.textPrimary,
                  }}
                >
                  <span>{r.emoji}</span>
                  <span className="font-semibold">{r.userIds.length}</span>
                </button>
              );
            })}
            {binds?.addReaction && !msg.deleted && msg.reactions.length > 0 && (
              <button
                {...binds.addReaction}
                aria-label="add-reaction"
                className="flex items-center rounded-full border border-[#DDDDDD] bg-white px-2 py-0.5"
                style={{ color: NEUTRAL.textSecondary }}
              >
                <IcEmoji size={14} />
              </button>
            )}
          </div>
        )}

        {/* 消息列入口只在给了 thread 绑定的页面出现（消息列页里父消息不再重复显示入口） */}
        {msg.replyCount > 0 && binds?.thread && (
          <button
            {...binds.thread}
            className="mt-1.5 flex items-center gap-2 border-none bg-transparent p-0"
          >
            <span className="flex -space-x-1">
              {msg.replyUserIds.slice(0, 3).map((id) => (
                <Avatar
                  key={id}
                  user={users.find((u) => u.id === id)}
                  size={18}
                  rounded="rounded-[4px]"
                />
              ))}
            </span>
            <ThreadReplyLabel parentId={msg.id} replyCount={msg.replyCount} />
          </button>
        )}
      </div>
    </div>
  );
};

export default MessageBlock;
