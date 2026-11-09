import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { Img, SwipeRow, usePanel, useToast } from '../components/ui';
import { formatListTime } from '../utils/format';
import { IcSearch, IcPlus, IcUsers, IcDelete, IcBell, IcSettings } from '../res/icons';

/** 消息(spec: message.list;+菜单走 ?menu=open;左滑:设置/置顶/删除 qa:Q12) */
export default function MessageListPage() {
  const { open: openPanel, searchParams } = usePanel('menu');
  const menuOpen = searchParams.get('menu') === 'open';
  const { bindTap, back } = useTaobaoGestures();
  const s = useStrings();
  const [toast, showToast] = useToast();

  const chats = useTaobaoStore((st) => st.chats);
  const toggleChatSticky = useTaobaoStore((st) => st.toggleChatSticky);
  const deleteChat = useTaobaoStore((st) => st.deleteChat);
  const clearAllUnread = useTaobaoStore((st) => st.clearAllUnread);

  const totalUnread = chats.reduce((n, c) => n + c.unread, 0);
  const sorted = [...chats].sort((a, b) => Number(b.isSticky) - Number(a.isSticky));

  const lastText = (c: (typeof chats)[number]) => {
    const m = c.messages[c.messages.length - 1];
    if (!m) return '';
    if (m.type === 'itemCard') return s.productBracketLabel;
    if (m.type === 'addressConfirm') return s.addressConfirmBracketLabel;
    return m.content;
  };

  return (
    <div className="flex flex-col h-full bg-app-surface">
      {/* 头部 */}
      <div className="flex items-center px-3 h-11 shrink-0">
        <span className="text-[17px] font-bold">{s.messagesTitle}{totalUnread > 0 ? `(${totalUnread})` : ''}</span>
        <button
          {...bindTap({ kind: 'action', id: 'message.unread.clearAll' }, { onTrigger: () => clearAllUnread() })}
          className="text-[11px] text-app-text-muted ml-2 bg-transparent border-none cursor-pointer"
        >
          {s.clearUnreadLabel}
        </button>
        <span className="flex-1" />
        <button {...bindTap('message.search-open')} className="bg-transparent border-none cursor-pointer mr-3">
          <IcSearch size={19} className="text-app-text" />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'message.plusMenu.open' }, { onTrigger: () => openPanel('open') })}
          className="bg-transparent border-none cursor-pointer"
        >
          <IcPlus size={21} className="text-app-text" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="message-list" data-scroll-direction="vertical">
        {sorted.map((c) => (
          <SwipeRow
            key={c.id}
            actionsWidth={168}
            swipeBinding={bindTap({ kind: 'action', id: 'message.item.swipeActions' }, {
              params: { chatId: c.id }, onTrigger: () => {},
            })}
            actions={
              <>
                <button
                  className="flex-1 h-full text-white text-[12px] border-none cursor-pointer bg-[#8B8B8B]"
                >
                  {s.settingsLabel}
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'message.item.sticky.toggle' }, {
                    params: { chatId: c.id },
                    onTrigger: () => toggleChatSticky(c.id),
                  })}
                  className="flex-1 h-full text-white text-[12px] border-none cursor-pointer bg-[#FF8C00]"
                >
                  {c.isSticky ? s.unstickyLabel : s.stickyLabel}
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'message.item.delete' }, {
                    params: { chatId: c.id },
                    onTrigger: () => deleteChat(c.id),
                  })}
                  className="flex-1 h-full text-white text-[12px] border-none cursor-pointer bg-[#FF0036]"
                >
                  {s.deleteLabel}
                </button>
              </>
            }
          >
            <div
              {...bindTap('message.chat-open', { params: { chatId: c.id } })}
              className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer ${c.isSticky ? 'bg-[#FAFAFA]' : ''}`}
            >
              <span className="relative shrink-0">
                <Img src={c.avatar} className="w-11 h-11 rounded-xl" />
                {c.unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-[#FF0036] text-white text-[10px] leading-4 text-center">
                    {c.unread}
                  </span>
                )}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium">{c.name}</div>
                <div className="text-[12px] text-app-text-muted truncate mt-0.5">{lastText(c)}</div>
              </div>
              <span className="text-[11px] text-[#BBBBBB] shrink-0">
                {c.messages.length ? formatListTime(c.messages[c.messages.length - 1].timestamp) : ''}
              </span>
            </div>
          </SwipeRow>
        ))}

        {/* 活动优惠聚合入口 */}
        <div
          {...bindTap('message.activity-open')}
          className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer"
        >
          <span className="w-11 h-11 rounded-xl bg-[#FFF1E8] flex items-center justify-center shrink-0">
            <IcBell size={20} className="text-[#FF5000]" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-medium">{s.activityDiscountLabel}</div>
            <div className="text-[12px] text-app-text-muted truncate mt-0.5">{s.activityEntrySubtitle}</div>
          </div>
        </div>
      </div>

      {/* + 菜单 */}
      {menuOpen && (
        <div className="absolute inset-0 z-40" onClick={() => back()}>
          <div className="absolute right-3 top-12 bg-[#3C3C3C] rounded-xl py-1 w-44 shadow-lg">
            <MenuItem icon={<IcUsers size={16} />} label={s.createGroupChatLabel} onUnavailable={showToast} unavailableMsg={s.featureNotAvailable} />
            <MenuItem icon={<IcUsers size={16} />} label={s.addFriendLabel} binding={bindTap('message.contacts-open')} />
            <MenuItem icon={<IcDelete size={16} />} label={s.batchDeleteChatsLabel} onUnavailable={showToast} unavailableMsg={s.featureNotAvailable} />
            <MenuItem icon={<IcBell size={16} />} label={s.marketingMsgManageLabel} tag="New" onUnavailable={showToast} unavailableMsg={s.featureNotAvailable} />
            <MenuItem icon={<IcSettings size={16} />} label={s.messageSettingsLabel} binding={bindTap('message.settings-open')} />
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}

function MenuItem({
  icon, label, binding, tag, onUnavailable, unavailableMsg,
}: { icon: React.ReactNode; label: string; binding?: object; tag?: string;
  onUnavailable?: (msg: string) => void; unavailableMsg?: string }) {
  return (
    <button
      {...(binding ?? { onClick: (e: React.MouseEvent) => { e.stopPropagation(); onUnavailable?.(unavailableMsg ?? ''); } })}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 bg-transparent border-none cursor-pointer text-white text-[13px]"
    >
      {icon}{label}
      {tag && <span className="text-[8px] text-white bg-[#FF0036] rounded px-0.5 ml-1">{tag}</span>}
    </button>
  );
}
