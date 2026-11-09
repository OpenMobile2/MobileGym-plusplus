import type React from 'react';
import { C } from './ui';
import { IcHeadphones, IcMail, IcMenu, IcSearch } from '../res/icons';

interface ChannelTopBarProps {
  menuBinding: React.ButtonHTMLAttributes<HTMLButtonElement>;
  searchBinding: React.ButtonHTMLAttributes<HTMLButtonElement>;
  audioBinding: React.ButtonHTMLAttributes<HTMLButtonElement>;
  messageBinding: React.ButtonHTMLAttributes<HTMLButtonElement>;
  searchText: string;
  unread: number;
  audioLabel?: string;
}

/** 书影音六个频道共用顶栏：固定图标盒尺寸，避免 Emoji 字宽和角标压住文字。 */
export function ChannelTopBar({
  menuBinding,
  searchBinding,
  audioBinding,
  messageBinding,
  searchText,
  unread,
  audioLabel = '耳机',
}: ChannelTopBarProps) {
  return (
    <div
      className="flex items-center gap-1 h-11 px-2 shrink-0 bg-white border-b"
      style={{ borderColor: C.border }}
    >
      <button
        {...menuBinding}
        className="w-9 h-9 flex items-center justify-center shrink-0 bg-transparent border-none cursor-pointer"
        style={{ color: C.green }}
        aria-label="菜单"
      >
        <IcMenu size={22} strokeWidth={2} aria-hidden />
      </button>
      <button
        {...searchBinding}
        className="flex-1 min-w-0 flex items-center gap-2 h-8 rounded-full px-3 border-none cursor-pointer text-left"
        style={{ background: '#F2F3F5' }}
        aria-label={`搜索：${searchText}`}
      >
        <IcSearch size={15} strokeWidth={2} className="shrink-0" style={{ color: C.sub }} aria-hidden />
        <span className="min-w-0 text-xs truncate" style={{ color: C.sub }}>{searchText}</span>
      </button>
      <button
        {...audioBinding}
        className="w-9 h-9 flex items-center justify-center shrink-0 bg-transparent border-none cursor-pointer"
        style={{ color: C.green }}
        aria-label={audioLabel}
      >
        <IcHeadphones size={20} strokeWidth={1.9} aria-hidden />
      </button>
      <button
        {...messageBinding}
        className="relative w-9 h-9 flex items-center justify-center shrink-0 bg-transparent border-none cursor-pointer"
        style={{ color: C.green }}
        aria-label="消息"
      >
        <IcMail size={20} strokeWidth={1.9} aria-hidden />
        {unread > 0 && (
          <span
            className="absolute top-0 right-0 min-w-4 h-4 px-1 rounded-full text-[10px] leading-none text-white flex items-center justify-center"
            style={{ background: C.danger }}
          >
            {unread}
          </span>
        )}
      </button>
    </div>
  );
}
