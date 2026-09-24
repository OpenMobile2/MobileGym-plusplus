import React, { useState } from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useXianyuStrings } from '../hooks/useXianyuStrings';
import { ItemImage, Avatar } from '../components/ItemImage';
import { useToast, EmptyState } from '../components/ui';
import { IcReceipt, IcBell, IcSparkles, IcFlash, IcArrowRight } from '../res/icons';

const SYSTEM_ENTRIES = [
  { id: 'trade', label: '交易消息', preview: '查看买卖交易进度', Icon: IcReceipt, color: '#FF6A00', tid: 'message.system-open' as const },
  { id: 'select', label: '闲鱼精选', preview: '精选好物与活动推荐', Icon: IcSparkles, color: '#8B5CF6' },
  { id: 'notice', label: '通知消息', preview: '系统通知与账号提醒', Icon: IcBell, color: '#2A7FFF', unread: 13 },
  { id: 'activity', label: '热门活动', preview: '限时福利与玩法活动', Icon: IcFlash, color: '#FF3B30' },
];

export default function MessageListPage() {
  const { bindTap, bindLongPress } = useXianyuGestures();
  const s = useXianyuStrings();
  const [toast, showToast] = useToast();

  const chats = useXianyuStore((st) => st.chats);
  const items = useXianyuStore((st) => st.items);
  const toggleChatSticky = useXianyuStore((st) => st.toggleChatSticky);
  const deleteChat = useXianyuStore((st) => st.deleteChat);

  const [menuFor, setMenuFor] = useState<string | null>(null);

  // 过滤/排序在组件体做:先置顶,再按最后消息时间倒序
  const lastTs = (c: (typeof chats)[number]) =>
    c.messages.length ? c.messages[c.messages.length - 1].timestamp : 0;
  const sorted = [...chats].sort((a, b) => {
    if (a.isSticky !== b.isSticky) return a.isSticky ? -1 : 1;
    return lastTs(b) - lastTs(a);
  });

  const activeMenuChat = chats.find((c) => c.id === menuFor) ?? null;

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="dark">
      {/* 自绘标题栏(tab 根页,无返回) */}
      <div className="h-11 flex items-center justify-center bg-app-surface border-b border-(--app-border) shrink-0">
        <span className="font-semibold text-[16px] text-app-text">{s.tabMessage}</span>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="MessageListPage-main"
        data-scroll-direction="vertical"
      >
        {/* 系统入口:与私信会话相同的纵向列表行(截图326) */}
        <div className="bg-app-surface">
          {SYSTEM_ENTRIES.map((e) => {
            const inner = (
              <>
                <span
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${e.color}1A` }}
                >
                  <e.Icon size={22} style={{ color: e.color }} />
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[15px] text-app-text font-medium">{e.label}</div>
                  <div className="text-[13px] text-app-text-muted truncate mt-0.5">{e.preview}</div>
                </div>
                {e.unread ? (
                  <span className="min-w-5 h-5 px-1 rounded-full bg-(--app-c-price-red) text-white text-[11px] flex items-center justify-center shrink-0">
                    {e.unread}
                  </span>
                ) : (
                  <IcArrowRight size={14} className="text-app-text-muted shrink-0" />
                )}
              </>
            );
            const cls = 'w-full flex items-center gap-3 px-3 py-3 border-b border-(--app-border) bg-transparent border-x-0 border-t-0 cursor-pointer';
            return e.tid ? (
              <button key={e.id} {...bindTap(e.tid)} className={cls}>{inner}</button>
            ) : (
              <button key={e.id} onClick={() => showToast(s.wontfix)} className={cls}>{inner}</button>
            );
          })}
        </div>

        {/* 私信会话列表 */}
        <div className="mt-2 bg-app-surface">
          {sorted.length === 0 ? (
            <EmptyState text={s.emptyMessage} hint="去逛逛,和卖家聊聊吧" />
          ) : (
            sorted.map((c) => {
              const last = c.messages[c.messages.length - 1];
              const item = c.itemId ? items.find((i) => i.id === c.itemId) : undefined;
              return (
                <div
                  key={c.id}
                  {...bindTap('message.chat-open', { params: { chatId: c.id } })}
                  {...bindLongPress(
                    { kind: 'action', id: 'message.session.menu.open' },
                    { params: { target: c.id }, onTrigger: () => setMenuFor(c.id) },
                  )}
                  className={`flex items-center gap-3 px-3 py-3 border-b border-[#F4F4F4] cursor-pointer ${c.isSticky ? 'bg-[#FAFAFA]' : ''}`}
                >
                  <div className="relative shrink-0">
                    <Avatar seed={c.sellerId} name={c.name} size={46} />
                    {c.unread > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF3B30] text-white text-[10px] flex items-center justify-center">
                        {c.unread > 99 ? '99+' : c.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      {c.isSticky && <span className="text-[10px] text-[#FF6A00] bg-[#FFF3E0] px-1 rounded">置顶</span>}
                      <span className="text-[15px] text-[#111] font-medium truncate">{c.name}</span>
                    </div>
                    <div className="text-[13px] text-[#999] truncate mt-0.5">
                      {last ? (last.type === 'itemCard' ? '[宝贝]' : last.content) : ''}
                    </div>
                  </div>
                  {item && (
                    <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-11 h-11 rounded-md shrink-0" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 长按会话操作菜单(本地) */}
      {activeMenuChat && (
        <div className="absolute inset-0 z-40" onClick={() => setMenuFor(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="text-center text-[12px] text-[#999] py-2 border-b border-[#F4F4F4]">{activeMenuChat.name}</div>
            <button
              {...bindTap(
                { kind: 'action', id: 'message.session.pin.toggle' },
                { params: { target: activeMenuChat.id }, onTrigger: () => { toggleChatSticky(activeMenuChat.id); setMenuFor(null); } },
              )}
              className="w-full text-center py-3.5 text-[15px] text-[#111] bg-transparent border-none border-b border-[#F4F4F4] cursor-pointer"
            >{activeMenuChat.isSticky ? '取消置顶' : '置顶会话'}</button>
            <button
              {...bindTap(
                { kind: 'action', id: 'message.session.delete.commit' },
                { params: { target: activeMenuChat.id }, onTrigger: () => { deleteChat(activeMenuChat.id); setMenuFor(null); } },
              )}
              className="w-full text-center py-3.5 text-[15px] text-[#FF3B30] bg-transparent border-none cursor-pointer"
            >删除会话</button>
            <div className="h-2 bg-[#F4F4F4]" />
            <button onClick={() => setMenuFor(null)} className="w-full text-center py-3.5 text-[15px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}
