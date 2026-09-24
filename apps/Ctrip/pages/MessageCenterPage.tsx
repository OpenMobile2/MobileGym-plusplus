import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img } from '../components/ui';
import { IcService, IcSettings, IconRenderer } from '../res/icons';

/** 消息 Tab(spec message.center)。消息金刚→subList;客服→cs;设置→settings;会话→hotel.cs。 */
const KINGKONG = [
  { id: 'order', label: '订单出行', color: '#3B9BFF', icon: 'IcTrain' },
  { id: 'notify', label: '账户通知', color: '#FF9F45', icon: 'IcSettings' },
  { id: 'interact', label: '互动消息', color: '#37C7A0', icon: 'IcTabMessage' },
  { id: 'member', label: '会员服务', color: '#B07BFF', icon: 'IcHeart' },
];

export default function MessageCenterPage() {
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((s) => s.hotels);
  const chats = hotels.slice(0, 3);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title="消息"
        showBack={false}
        rightContent={
          <>
            <button {...bindTap('message.toCs')} className="bg-transparent border-none cursor-pointer p-0"><IcService size={18} className="text-[#333333]" /></button>
            <button {...bindTap('message.toSettings')} className="bg-transparent border-none cursor-pointer p-0"><IcSettings size={18} className="text-[#333333]" /></button>
          </>
        }
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 金刚 */}
        <div className="bg-white grid grid-cols-4 py-4">
          {KINGKONG.map((k) => (
            <button key={k.id} {...bindTap('message.toSub')} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer">
              <span className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: k.color }}>
                <IconRenderer name={k.icon} size={20} />
              </span>
              <span className="text-[12px] text-[#333333]">{k.label}</span>
            </button>
          ))}
        </div>

        {/* 会话列表 */}
        <div className="mt-2">
          {chats.map((h) => (
            <button key={h.id} {...bindTap('message.toChat', { params: { id: h.id } })} className="w-full flex items-center gap-3 px-4 py-3 bg-white border-b border-[#F2F2F2] border-x-0 border-t-0 cursor-pointer text-left">
              <Img src={h.image} className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-[#222222] line-clamp-1">{h.name}</div>
                <div className="text-[12px] text-[#999999] line-clamp-1 mt-0.5">在线客服:您好,有什么可以帮您?</div>
              </div>
              <span className="text-[11px] text-[#BBBBBB]">昨天</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
