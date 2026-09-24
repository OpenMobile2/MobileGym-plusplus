import React from 'react';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL, RED } from '../res/colors';
import { formatDayLabel } from '../utils/format';
import MessageBlock, { type MessageBinds } from './MessageBlock';
import type { Message } from '../types';

/** 同人连续消息合并的时间窗（5 分钟内不重复头像与名字） */
const MERGE_WINDOW_MS = 5 * 60 * 1000;

/**
 * 时间线渲染：日期分隔行 + 「新消息」红线 + 消息块。
 * 红线位置由进入会话那一刻的 lastReadTs 决定，停留期间不动（spec channel.conversation）。
 */
const MessageList: React.FC<{
  messages: Message[];
  /** 红线插在 ts 大于该值的第一条之前；null = 不画 */
  dividerAfterTs?: number | null;
  /** 正在编辑的消息 id */
  editingId?: string | null;
  bindsOf?: (msg: Message) => MessageBinds;
}> = ({ messages, dividerAfterTs = null, editingId = null, bindsOf }) => {
  const { t, locale } = useI18n();
  const users = useSlackStore((s) => s.users);

  const firstUnread =
    dividerAfterTs === null ? undefined : messages.find((m) => m.ts > dividerAfterTs);

  return (
    <>
      {messages.map((m, i) => {
        const prev = messages[i - 1];
        const newDay = !prev || formatDayLabel(prev.ts, locale) !== formatDayLabel(m.ts, locale);
        const showUnreadLine = firstUnread?.id === m.id;
        const compactHead =
          !newDay &&
          !showUnreadLine &&
          prev?.userId === m.userId &&
          !prev?.system &&
          !m.system &&
          m.ts - prev.ts < MERGE_WINDOW_MS;

        return (
          <React.Fragment key={m.id}>
            {newDay && (
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="h-px flex-1 bg-[#EAEAEA]" />
                <span className="text-[13px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                  {formatDayLabel(m.ts, locale)}
                </span>
                <span className="h-px flex-1 bg-[#EAEAEA]" />
              </div>
            )}
            {showUnreadLine && (
              <div className="flex items-center px-4 pb-0.5 pt-1.5">
                <span className="h-px flex-1" style={{ backgroundColor: RED.primary }} />
                <span className="pl-2 text-[12px] font-bold" style={{ color: RED.primary }}>
                  {t('conv.newMessages')}
                </span>
              </div>
            )}
            <MessageBlock
              msg={m}
              user={users.find((u) => u.id === m.userId)}
              compactHead={compactHead}
              editing={editingId === m.id}
              binds={bindsOf?.(m)}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default MessageList;
