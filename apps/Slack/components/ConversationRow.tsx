import React from 'react';
import { NEUTRAL, RED } from '../res/colors';
import { IcHash, IcLock, IcMute } from '../res/icons';
import Avatar, { AvatarStack } from './Avatar';
import type { Bind, Conversation, SlackUser } from '../types';

/** 未读数字徽章（红）。频道只在有 @提及 时给数字，私信一律给数字 —— Q四-1 */
export const UnreadBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count <= 0) return null;
  return (
    <span
      className="ml-2 min-w-[20px] rounded-full px-1.5 text-center text-[12px] font-bold leading-5 text-white"
      style={{ backgroundColor: RED.primary }}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

type Props = {
  conv: Conversation;
  users: SlackUser[];
  /** 主页的紧凑行（只有图标 + 名称 + 徽章）；私信页用详细行（含摘要与时间） */
  compact?: boolean;
  /** 最后一条消息摘要（详细行用） */
  preview?: string;
  time?: string;
  tapProps?: Bind;
  longPressProps?: Bind;
};

const ConversationRow: React.FC<Props> = ({
  conv,
  users,
  compact = false,
  preview,
  time,
  tapProps,
  longPressProps,
}) => {
  const isChannel = conv.kind === 'channel';
  const others = conv.memberIds.filter((id) => id !== 'u_me');
  // 「自己给自己」的私信里 others 为空，头像就用自己的
  const peer = users.find((u) => u.id === (others[0] ?? 'u_me'));
  const groupUsers = others.map((id) => users.find((u) => u.id === id)).filter(Boolean) as SlackUser[];
  const bold = conv.hasUnread;

  return (
    // 两者 data-trigger 同名：tap 放后面，让 DOM 上留主交互（长按的事件回调不受影响）
    <button
      {...longPressProps}
      {...tapProps}
      className={`flex w-full items-center gap-3 border-none bg-transparent px-4 text-left ${
        compact ? 'py-2.5' : 'py-3'
      }`}
    >
      {isChannel ? (
        <span
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center"
          style={{ color: bold ? NEUTRAL.textPrimary : NEUTRAL.textSecondary }}
        >
          {conv.isPrivate ? <IcLock size={17} /> : <IcHash size={19} />}
        </span>
      ) : conv.kind === 'group' ? (
        <AvatarStack users={groupUsers} size={compact ? 26 : 40} />
      ) : (
        <Avatar user={peer} size={compact ? 26 : 40} presence rounded="rounded-md" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <span
            className={`truncate text-[16px] ${bold ? 'font-bold' : ''}`}
            style={{ color: bold ? NEUTRAL.textPrimary : '#3B3A3C' }}
          >
            {conv.name}
          </span>
          {conv.muted && <IcMute size={13} className="ml-1.5 flex-shrink-0 text-[#9E9E9E]" />}
        </div>
        {!compact && preview && (
          <p className="mt-0.5 truncate text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
            {preview}
          </p>
        )}
      </div>

      {!compact && time && (
        <span className="flex-shrink-0 text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
          {time}
        </span>
      )}
      <UnreadBadge count={conv.unreadCount} />
    </button>
  );
};

export default ConversationRow;
