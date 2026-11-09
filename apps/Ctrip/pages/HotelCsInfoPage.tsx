import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Switch, ListRow, useToast } from '../components/ui';

/** 聊天信息(spec hotel.csInfo)。进入店铺;置顶/推送/黑名单开关。 */
export default function HotelCsInfoPage() {
  const s = useCtripStrings();
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const { bindTap, go } = useCtripGestures();
  const [toast, showToast] = useToast();
  const settings = useCtripStore((st) => st.settings);
  const toggleSetting = useCtripStore((st) => st.toggleSetting);
  const pinnedChats = useCtripStore((st) => st.pinnedChats ?? []);
  const togglePinnedChat = useCtripStore((st) => st.togglePinnedChat);
  const hotels = useCtripStore((st) => st.hotels);
  const hotel = hotels.find((h) => h.id === id);
  if (!hotel) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title={s.t('酒店')} />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">{s.t('未找到该酒店')}</div>
      </div>
    );
  }

  const SWITCHES = [
    { key: 'csTop', label: s.t('聊天置顶'), tip: s.t('已置顶该会话') },
    { key: 'csPush', label: s.t('接收推送'), tip: s.t('已更新推送设置') },
    { key: 'csBlock', label: s.t('加入黑名单'), tip: s.t('已加入黑名单，将不再接收消息') },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('聊天信息')} backTo={`/hotel/${encodeURIComponent(hotel.id)}/cs${sp.toString() ? `?${sp.toString()}` : ''}`} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {settings.csBlock && (
          <div className="mx-3 mt-3 rounded-lg bg-[#FFF1F0] text-[#CF1322] text-[13px] px-3 py-2">
            {s.t('该商家已在黑名单中，会话已屏蔽')}
          </div>
        )}
        <div className="mt-2">
          <ListRow label={s.t('进入店铺')} value={hotel.name} binding={bindTap('hotelCs.toDetail', { params: { id: hotel.id } })} />
        </div>
        <div className="mt-2">
          {SWITCHES.map((item) => (
            <div key={item.key} className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#F2F2F2]">
              <span className="text-[15px] text-[#222222]">{item.label}</span>
              <Switch
                on={item.key === 'csTop' ? pinnedChats.includes(hotel.id) : !!settings[item.key]}
                onToggle={() => {
                  if (item.key === 'csTop') {
                    togglePinnedChat(hotel.id);
                    showToast(pinnedChats.includes(hotel.id) ? s.t('已取消置顶') : item.tip);
                    return;
                  }
                  toggleSetting(item.key);
                  showToast(settings[item.key] ? s.t('已关闭') : item.tip);
                }}
                binding={bindTap({ kind: 'action', id: 'csInfo.switch.toggle.top' }, {
                  params: { key: item.key },
                  onTrigger: () => {
                    if (item.key === 'csTop') {
                      togglePinnedChat(hotel.id);
                      showToast(pinnedChats.includes(hotel.id) ? s.t('已取消置顶') : item.tip);
                      return;
                    }
                    toggleSetting(item.key);
                    showToast(settings[item.key] ? s.t('已关闭') : item.tip);
                  },
                })}
              />
            </div>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}
