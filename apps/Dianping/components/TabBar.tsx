import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcTabHome, IcTabMap, IcTabMsg, IcTabMine, IcCheckinPin } from '../res/icons';

export default function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useDianpingGestures();
  const s = useAppStrings(strings, stringsEn);
  const msgUnread = useDianpingStore((st) => st.msgUnread);
  const totalUnread =
    msgUnread.system + msgUnread.activity + msgUnread.likes + msgUnread.comment + msgUnread.fans;
  const on = (p: string) => pathname === p;

  const side = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-[2px] border-none bg-transparent cursor-pointer ${
      active ? 'text-[#FF6633]' : 'text-[#8E8E93]'
    }`;

  return (
    <div
      className="relative flex h-[54px] shrink-0 items-end border-t border-(--app-c-border) bg-(--app-c-card-bg) pb-[4px]"
      data-hide-on-keyboard
    >
      <button type="button" {...bindTap('tabbar.home-open')} className={side(on('/'))}>
        <IcTabHome size={23} />
        <span className="text-[10px] leading-none">{s.tabHome}</span>
      </button>
      <button type="button" {...bindTap('tabbar.map-open')} className={side(on('/map'))}>
        <IcTabMap size={22} />
        <span className="text-[10px] leading-none">{s.tabMap}</span>
      </button>

      {/* 真机 dp_374: 中间橙胶囊「定位针 + 打卡」 */}
      <button
        type="button"
        {...bindTap('tabbar.checkin-open')}
        className="relative -mt-3 flex flex-1 flex-col items-center justify-end border-none bg-transparent pb-[2px] cursor-pointer"
      >
        <span className="flex h-[36px] min-w-[78px] items-center justify-center gap-1 rounded-full bg-[#FF6633] px-3 text-white shadow-[0_4px_10px_rgba(255,102,51,0.35)]">
          <IcCheckinPin size={15} className="text-white" />
          <span className="text-[13px] font-semibold tracking-wide">{s.tabCheckin}</span>
        </span>
      </button>

      <button type="button" {...bindTap('tabbar.msg-open')} className={side(on('/msg'))}>
        <span className="relative">
          <IcTabMsg size={22} />
          {totalUnread > 0 ? (
            <span className="absolute -right-2 -top-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FF4B33] px-[3px] text-[9px] font-bold text-white">
              {totalUnread}
            </span>
          ) : null}
        </span>
        <span className="text-[10px] leading-none">{s.tabMsg}</span>
      </button>
      <button type="button" {...bindTap('tabbar.mine-open')} className={side(on('/me'))}>
        <IcTabMine size={22} />
        <span className="text-[10px] leading-none">{s.tabMine}</span>
      </button>
    </div>
  );
}
