import React from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, TopBar, showToast, formatCount } from '../components/ui';
import { IcHeadphones } from '../res/icons';

export function ChildMemberPage() {
  const { bindTap } = useXimalayaGestures();
  const albums = useXimalayaStore((st) => st.albums);
  const kids = albums.filter((a) => a.category.includes('儿童'));
  const grid = (kids.length ? kids : albums).slice(0, 6);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#EAF6FF]" data-status-bar-foreground="dark">
      <TopBar title="儿童会员" transparent />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* VIP 儿童头卡 */}
        <div className="mx-3 mt-1 rounded-2xl bg-gradient-to-br from-[#5CC0F5] to-[#3B8FE0] p-4 text-white">
          <div className="text-[18px] font-bold">VIP 儿童</div>
          <div className="text-[12px] text-white/85 mt-1">海量儿歌、故事、国学,陪伴孩子成长</div>
        </div>

        {/* 超值特惠 Banner */}
        <div className="mx-3 mt-3 rounded-xl bg-[#FFF3D6] px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold text-[#B26A00]">新用户超值特惠</div>
            <div className="text-[12px] text-[#B26A00]/80 mt-0.5">首月 ¥6 起,尊享全站儿童内容</div>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full bg-[#FE4543] text-white">限时</span>
        </div>

        {/* 会员内容网格 */}
        <div className="mx-3 mt-4 mb-4">
          <div className="text-[16px] font-semibold text-[#333] mb-2">会员精选</div>
          <div className="grid grid-cols-2 gap-3">
            {grid.map((a) => (
              <div key={a.id} {...bindTap('childmember.album-open', { params: { id: a.id } })} className="bg-white rounded-xl p-2 flex flex-col">
                <Img src={a.cover} className="w-full aspect-square rounded-lg object-cover" />
                <div className="text-[13px] text-[#333] font-medium mt-1.5 line-clamp-2">{a.title}</div>
                <div className="text-[11px] text-[#999] mt-1 flex items-center gap-0.5">
                  <IcHeadphones size={11} />{formatCount(a.playCount)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="h-20" />
      </div>

      {/* 立即开通 wontfix */}
      <div className="shrink-0 bg-white border-t border-[#F0F0F0] px-4 py-3">
        <button
          {...bindTap({ kind: 'action', id: 'childmember.open.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#5CC0F5] to-[#3B8FE0] text-white text-[15px] font-semibold"
        >
          立即开通
        </button>
      </div>
    </div>
  );
}
