import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img } from '../components/ui';
import { IcService, IcSettings, IconRenderer } from '../res/icons';

/** 消息 Tab：置顶会话真正排到最前。 */
export default function MessageCenterPage() {
  const s = useCtripStrings();
  const KINGKONG = [
    { id: 'order', group: '订单出行', label: s.t('订单出行'), color: '#3B9BFF', icon: 'IcTrain' },
    { id: 'notify', group: '账户通知', label: s.t('账户通知'), color: '#FF9F45', icon: 'IcSettings' },
    { id: 'interact', group: '互动消息', label: s.t('互动消息'), color: '#37C7A0', icon: 'IcTabMessage' },
    { id: 'member', group: '会员服务', label: s.t('会员服务'), color: '#B07BFF', icon: 'IcHeart' },
  ];
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((st) => st.hotels);
  const settings = useCtripStore((st) => st.settings);
  const pinned = useCtripStore((st) => st.pinnedChats ?? []);
  const chats = hotels.slice(0, 4).filter((h) => !settings.csBlock || pinned.includes(h.id));
  const ordered = [...chats].sort((a, b) => {
    const ap = pinned.includes(a.id) ? 0 : 1;
    const bp = pinned.includes(b.id) ? 0 : 1;
    return ap - bp;
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={s.tabMessage}
        showBack={false}
        rightContent={
          <>
            <button {...bindTap('message.toCs')} className="bg-transparent border-none cursor-pointer p-0"><IcService size={18} className="text-[#333333]" /></button>
            <button {...bindTap('message.toSettings')} className="bg-transparent border-none cursor-pointer p-0"><IcSettings size={18} className="text-[#333333]" /></button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white grid grid-cols-4 py-4">
          {KINGKONG.map((k) => (
            <button key={k.id} {...bindTap('message.toSub', { params: { group: k.group } })} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
              <span className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: k.color }}>
                <IconRenderer name={k.icon} size={20} />
              </span>
              <span className="text-[12px] text-[#333333]">{k.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-2">
          {ordered.map((h) => (
            <button key={h.id} {...bindTap('message.toChat', { params: { id: h.id } })} className="w-full flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F2F2F2] border-x-0 border-t-0 cursor-pointer text-left">
              <Img src={h.image} className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <div className="text-[15px] text-[#222222] line-clamp-1">{h.name}</div>
                  {pinned.includes(h.id) && <span className="text-[10px] text-[#FF6A2C] shrink-0">{s.t('置顶')}</span>}
                </div>
                <div className="text-[12px] text-[#999999] line-clamp-1 mt-0.5">{s.t('在线客服:您好,有什么可以帮您?')}</div>
              </div>
              <span className="text-[11px] text-[#BBBBBB]">{s.t('昨天')}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
