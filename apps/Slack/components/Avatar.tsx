import React from 'react';
import { avatarColor, GREEN } from '../res/colors';
import type { SlackUser } from '../types';

/** Slack 用圆角矩形头像，不是圆形（design-tokens.md §7） */
const Avatar: React.FC<{
  user?: SlackUser;
  size?: number;
  /** 显示右下角在线状态点 */
  presence?: boolean;
  /** 暂停通知小标 */
  paused?: boolean;
  /** 覆盖显示的字，用于工作区首字母块 */
  text?: string;
  color?: string;
  rounded?: string;
}> = ({ user, size = 40, presence = false, paused = false, text, color, rounded = 'rounded-lg' }) => {
  const bg = color ?? avatarColor(user?.avatarColor ?? 'avatarPurple');
  const label = text ?? user?.initial ?? '?';
  const src = user?.avatarSrc;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img
          src={src}
          alt=""
          className={`h-full w-full object-cover ${rounded}`}
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center ${rounded} font-semibold text-white`}
          style={{ backgroundColor: bg, fontSize: Math.round(size * 0.42) }}
        >
          {label}
        </div>
      )}
      {presence && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white"
          style={{
            width: Math.max(10, size * 0.3),
            height: Math.max(10, size * 0.3),
            backgroundColor: paused ? '#8E8E93' : user?.online ? GREEN.online : 'transparent',
            borderColor: '#FFFFFF',
            boxShadow: user?.online && !paused ? 'none' : `inset 0 0 0 2px ${'#8E8E93'}`,
          }}
        />
      )}
      {paused && (
        <span
          className="absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-[#420E43] text-white"
          style={{
            width: Math.max(14, size * 0.34),
            height: Math.max(14, size * 0.34),
            fontSize: size * 0.2,
          }}
        >
          ⏸
        </span>
      )}
    </div>
  );
};

/** 群私信 / 多人会话的叠加头像 */
export const AvatarStack: React.FC<{ users: SlackUser[]; size?: number }> = ({
  users,
  size = 40,
}) => {
  const shown = users.slice(0, 2);
  const small = Math.round(size * 0.68);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {shown.map((u, i) => (
        <div
          key={u.id}
          className="absolute"
          style={i === 0 ? { top: 0, left: 0 } : { bottom: 0, right: 0 }}
        >
          <Avatar user={u} size={small} rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
};

export default Avatar;
