import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { IcRight } from '../res/icons';

/**
 * 实验室(s85)。
 * Gate4 翻案:原先四项全 wontfix。补拍 s249/s250/s251 证明其中三项内容是纯展示或本地开关,
 * 页面粒度的 wontfix 把本可实现的内容一起砍了,违反铁律①。
 * 现在只有『打卡地图』仍 wontfix(真需要地图 SDK 与定位权限)。
 */
export default function LabPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.lab} />
      <div className="px-4">
        <div className="overflow-hidden rounded-2xl bg-white">
          <button {...bindTap('lab.shortcuts.open')}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            快捷指令 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...action('lab.map.wontfixToast', () => st.showNotice(s.notAvailable))}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            打卡地图 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...bindTap('lab.cards.open')}
            className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
            我的卡包 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...bindTap('lab.chime.open')}
            className="flex w-full items-center justify-between px-4 py-3.5 text-sm text-[#424242]">
            整点报时 <IcRight size={15} className="text-[#C9CDD3]" />
          </button>
        </div>
      </div>
    </div>
  );
}
