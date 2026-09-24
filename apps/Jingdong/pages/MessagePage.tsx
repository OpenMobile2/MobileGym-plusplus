import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { Img, EmptyState } from '../components/ui';
import { useJingdongStore } from '../state';
import { IcTabChat, IcTruck, IcBell, IcTicket, IcTrash } from '../res/icons';
import type { Chat } from '../types';

type SubTab = 'session' | 'logistics' | 'remind' | 'promo';

const EMPTY_VIEWED_SUBTABS: string[] = [];

const SUBTABS: { id: SubTab; label: string; Icon: typeof IcTruck; color: string }[] = [
  { id: 'session', label: '会话', Icon: IcTabChat, color: '#E1251B' },
  { id: 'logistics', label: '物流', Icon: IcTruck, color: '#3B8BFF' },
  { id: 'remind', label: '提醒', Icon: IcBell, color: '#FFB000' },
  { id: 'promo', label: '优惠', Icon: IcTicket, color: '#FF6A3C' },
];

const FILTERS = ['全部', '购物', '秒送外卖'] as const;

// 官方标签(JoyAI / 京东客服)
const isOfficial = (c: Chat) => c.kind === 'official' || c.kind === 'cs';

export function MessagePage() {
  const { bindTap } = useJingdongGestures();
  const chats = useJingdongStore((s) => s.chats);
  const clearUnread = useJingdongStore((s) => s.clearUnread);
  const recordTaskAudit = useJingdongStore((s) => s.recordTaskAudit);
  // Older delivery profiles predate taskAudit. They are still valid Jingdong
  // states, so opening the Messages tab must not crash while they hydrate.
  const viewedSubtabs = useJingdongStore((s) => s.taskAudit?.messageSubtabsViewed ?? EMPTY_VIEWED_SUBTABS);

  const [sub, setSub] = useState<SubTab>('session');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('全部');

  const sessionUnread = chats.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0);

  // 会话过滤:购物=非骑手,秒送外卖=骑手
  const visibleChats = chats.filter((c) => {
    if (filter === '购物') return c.kind !== 'rider';
    if (filter === '秒送外卖') return c.kind === 'rider';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部标题 + 清除未读 */}
      <div className="shrink-0 pt-10 bg-white">
        <div className="h-11 px-3 flex items-center justify-between">
          <div className="text-[20px] font-bold text-[#1A1A1A]">消息</div>
          <div className="flex items-center gap-3">
            <button
              {...bindTap({ kind: 'action', id: 'msg.unread.clear' }, { onTrigger: () => clearUnread() })}
              className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-[#F3F3F3] text-[12px] text-[#555]"
            >
              <IcTrash size={14} />
              清除未读
            </button>
            <span className="text-[#999] text-[18px] leading-none tracking-widest">···</span>
          </div>
        </div>

        {/* 顶部子tab:会话/物流/提醒/优惠/互动 */}
        <div className="flex items-stretch px-2 pt-1 pb-2">
          {SUBTABS.map((t) => {
            const active = sub === t.id;
            const badge = t.id === 'session' ? sessionUnread : 0;
            return (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'msg.subtab.select.category' }, {
                  params: { category: t.id },
                  onTrigger: () => {
                    setSub(t.id);
                    recordTaskAudit({
                      messageSubtab: t.id,
                      messageSubtabsViewed: viewedSubtabs.includes(t.id) ? viewedSubtabs : [...viewedSubtabs, t.id],
                    });
                  },
                })}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <div className="relative">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: active ? `${t.color}1A` : '#F5F5F5' }}
                  >
                    <t.Icon size={22} color={t.color} />
                  </div>
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E1251B] text-white text-[10px] font-medium flex items-center justify-center">
                      {badge}
                    </span>
                  )}
                </div>
                <span className={`text-[12px] ${active ? 'font-semibold text-[#1A1A1A]' : 'text-[#666]'}`}>{t.label}</span>
              </button>
            );
          })}
          {/* 互动:独立子页 */}
          <button {...bindTap('msg.interactive-open')} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#8E7BFF] to-[#6A5AF9]">
              <IcTabChat size={22} color="#fff" />
            </div>
            <span className="text-[12px] text-[#666]">互动</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="msg-list" data-scroll-direction="vertical">
        {sub === 'session' ? (
          <>
            {/* 全部/购物/秒送外卖 过滤 */}
            <div className="flex items-center gap-4 px-4 py-2.5 bg-white text-[14px]">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex items-center gap-1 ${filter === f ? 'text-[#1A1A1A] font-semibold' : 'text-[#888]'}`}
                >
                  {f === '秒送外卖' ? (
                    <>
                      <span>秒送</span>
                      <span className="text-[10px] leading-[15px] px-1 rounded-sm bg-[#E1251B] text-white">外卖</span>
                    </>
                  ) : (
                    f
                  )}
                </button>
              ))}
            </div>

            <div className="flex flex-col bg-white">
              {visibleChats.map((c) => (
                <button
                  key={c.id}
                  {...bindTap('msg.chat-open', { params: { chatId: c.id } })}
                  className="text-left flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5] active:bg-[#FAFAFA]"
                >
                  <div className="relative shrink-0">
                    <Img src={c.avatar} className="w-11 h-11 rounded-full object-cover bg-[#F0F0F0]" />
                    {c.unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#E1251B] text-white text-[10px] flex items-center justify-center">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="text-[15px] text-[#1A1A1A] font-medium truncate">{c.name}</span>
                      {isOfficial(c) && (
                        <span className="ml-1.5 shrink-0 text-[10px] leading-[15px] px-1 rounded-sm border border-[#E1251B]/40 text-[#E1251B]">官方</span>
                      )}
                      <span className="ml-auto pl-2 shrink-0 text-[12px] text-[#B5B5B5]">{c.time}</span>
                    </div>
                    <div className="mt-1 text-[13px] text-[#999] truncate">{c.preview}</div>
                  </div>
                </button>
              ))}
            </div>
            <div className="py-4 text-center text-[12px] text-[#BBB]">没有更多消息了</div>
          </>
        ) : (
          <div className="bg-white mt-2">
            <EmptyState text="暂无消息" />
          </div>
        )}
      </div>
    </div>
  );
}
