import React from 'react';
import * as TimeService from '@/os/TimeService';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, wontfix } from '../components/ui';
import { IcGift } from '../res/icons';
import type { Chat } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
function fmtChatTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const now = TimeService.getDate();
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

// 聊天列表(底部 Tab 页,TabBar 由外壳提供)
export function ChatListPage() {
  const { bindTap } = usePinduoduoGestures();
  const chats = usePinduoduoStore((s) => s.chats);

  const rowBind = (c: Chat): React.HTMLAttributes<HTMLElement> => {
    if (c.kind === 'system' && c.name === '交易通知') return bindTap('chat.notification-open');
    if (c.kind === 'official') return bindTap('chat.official-open', { params: { chatId: c.id } });
    return bindTap('chat.conversation-open', { params: { chatId: c.id } });
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      {/* 标题 */}
      <div className="shrink-0 h-11 flex items-center justify-center bg-white">
        <span className="text-[17px] font-medium text-[#333]">聊天</span>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 专属补贴 banner */}
        <button
          {...bindTap({ kind: 'action', id: 'chat.subsidy.wontfix' }, { onTrigger: wontfix })}
          className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-[#FFF3E9] to-[#FFEAE2] text-left"
        >
          <IcGift size={20} className="text-[#E22E1F]" />
          <div className="flex-1">
            <div className="text-[13px] text-[#E22E1F] font-medium">专属补贴红包</div>
            <div className="text-[11px] text-[#C4744F]">领取后下单立减,限时专享</div>
          </div>
          <span className="px-3 h-7 rounded-full bg-[#E22E1F] text-white text-[12px] flex items-center">立即领取</span>
        </button>

        {/* 会话列表 */}
        <div className="bg-white">
          {chats.map((c) => {
            const last = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.id}
                {...rowBind(c)}
                className="w-full flex items-center px-4 py-3 text-left border-b border-[#F5F5F5] last:border-b-0"
              >
                <div className="relative shrink-0">
                  <Img src={c.avatar} className="w-11 h-11 rounded-full object-cover bg-[#F2F2F2]" alt={c.name} />
                  {c.unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E22E1F] text-white text-[10px] leading-[18px] text-center">
                      {c.unread > 99 ? '99+' : c.unread}
                    </span>
                  )}
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[15px] text-[#333] truncate">{c.name}</span>
                    {c.badge && (
                      <span className="shrink-0 text-[10px] leading-[15px] px-1 rounded-sm text-[#E22E1F] bg-[#FFF0E8]">
                        {c.badge}
                      </span>
                    )}
                    {last && (
                      <span className="ml-auto shrink-0 text-[11px] text-[#BBB]">{fmtChatTime(last.ts)}</span>
                    )}
                  </div>
                  <div className="text-[13px] text-[#999] truncate mt-0.5">{last ? last.content : ''}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
