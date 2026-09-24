// 我的签到足迹(footprint.stub,IMG_0289/0290,frame:38a79c@t0030/t0033):
// 集章成就横幅 + 主题地点推荐入口 + 领取集章册横滑 + 我的签到0空态 + 底部「附近签到」黑胶囊。
// 签到=stub;所有入口 → toast「该功能暂未开放」(真机为定位权限被拒错误,mock 统一提示)。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, C } from '../components/ui';

const STAMP_BOOKS = [
  { name: '全国重点文物保护单位', emoji: '🏛️', tint: '#E7D8BE' },
  { name: '我们就喜欢逛公园', emoji: '🌳', tint: '#D6E6CE' },
  { name: '逛博物馆', emoji: '🖼️', tint: '#DCD6E8' },
  { name: '古迹胜景签到足迹', emoji: '⛩️', tint: '#E9D6CE' },
];

export default function FootprintStubPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const wontfix = (id: 'footprint.checkin.nearby.wontfix' | 'footprint.places.entry.wontfix' | 'footprint.stampbook.entry.wontfix') =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast('该功能暂未开放') });

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="我的签到足迹" />
      <div
        className="flex-1 overflow-y-auto pb-24"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 集章成就插画横幅 + 粉色「点击前往 ›」按钮 */}
        <div
          className="mx-3 mt-3 rounded-2xl px-5 py-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(120deg,#FBEFE6,#F6E3D6)' }}
        >
          <div className="absolute right-4 top-3 text-5xl opacity-40 select-none pointer-events-none" aria-hidden>🏯</div>
          <div className="relative text-lg font-bold" style={{ color: '#6B4A2E' }}>我的国保单位 · 集章成就</div>
          <div className="relative mt-1 text-xs" style={{ color: '#9C7B5E' }}>走过山河古迹,盖满属于你的印章</div>
          <button
            {...wontfix('footprint.places.entry.wontfix')}
            className="relative mt-4 inline-flex items-center gap-1 px-4 h-8 rounded-full text-sm font-semibold text-white border-none cursor-pointer"
            style={{ background: '#E86A9A' }}
          >
            点击前往 ›
          </button>
        </div>

        {/* 主题地点推荐:灰底圆角条,蓝色定位图标,文案居中 */}
        <div className="px-3 mt-3">
          <button
            {...wontfix('footprint.places.entry.wontfix')}
            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-none cursor-pointer"
            style={{ background: '#EEF0F3' }}
          >
            <span style={{ color: '#3E7BF2' }}>📍</span>
            <span className="text-[14px] font-medium" style={{ color: C.text }}>主题地点推荐</span>
            <span style={{ color: C.sub }}>›</span>
          </button>
        </div>

        {/* 领取集章册,开始集章 + 查看全部 ;册子=书本封面卡 */}
        <div className="mt-3 bg-white py-3">
          <div className="px-4 mb-2 flex items-center justify-between">
            <span className="text-[15px] font-semibold" style={{ color: C.text }}>领取集章册,开始集章</span>
            <button {...wontfix('footprint.stampbook.entry.wontfix')} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>查看全部 ›</button>
          </div>
          <div className="flex gap-3 px-4 overflow-x-auto" data-scroll-container="stampbooks" data-scroll-direction="horizontal">
            {STAMP_BOOKS.map((b) => (
              <button key={b.name} {...wontfix('footprint.stampbook.entry.wontfix')} className="w-24 shrink-0 text-left border-none cursor-pointer bg-transparent p-0">
                {/* 书本封面(内嵌插图 + 书脊阴影) */}
                <div
                  className="w-24 h-32 rounded-md flex items-center justify-center shadow-sm relative overflow-hidden"
                  style={{ background: b.tint, boxShadow: 'inset 6px 0 0 rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.12)' }}
                >
                  <span className="text-4xl">{b.emoji}</span>
                </div>
                <div className="mt-1.5 text-xs font-medium leading-snug line-clamp-2" style={{ color: C.text }}>{b.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 我的签到 ⓘ + 计数右缘;空态=时间轴桩 + 地图纹理卡 */}
        <div className="mt-3 bg-white">
          <div className="px-4 pt-3 flex items-center justify-between">
            <span className="flex items-center gap-1 text-[15px] font-semibold" style={{ color: C.text }}>
              我的签到
              <span className="text-xs" style={{ color: C.sub }}>ⓘ</span>
            </span>
            <span className="text-sm" style={{ color: C.sub }}>0</span>
          </div>
          <div className="flex px-4 py-6">
            {/* 左侧时间轴桩 */}
            <div className="w-14 shrink-0 flex flex-col items-center pt-1">
              <span className="text-[11px] leading-tight text-center" style={{ color: C.sub }}>--/--月</span>
              <span className="w-2 h-2 rounded-full mt-1.5" style={{ background: '#D8DCE1' }} />
              <span className="flex-1 w-px mt-1" style={{ background: '#EDEDED' }} />
            </div>
            {/* 地图纹理卡 */}
            <div
              className="flex-1 rounded-xl px-4 py-6 flex flex-col items-center justify-center text-center"
              style={{
                background:
                  "repeating-linear-gradient(45deg,#F4F6F8 0 10px,#EEF1F4 10px 20px)",
                border: '1px dashed #DCE0E5',
              }}
            >
              <div className="text-3xl">🗺️</div>
              <div className="mt-2 text-[13px] leading-relaxed" style={{ color: C.sub }}>
                暂无签到记录 – 使用定位信息签到地点后,可在集章册上盖章
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部「附近签到」黑胶囊:居中、内容宽 */}
      <div className="absolute left-0 right-0 bottom-0 pb-5 pt-2 flex justify-center pointer-events-none">
        <button
          {...wontfix('footprint.checkin.nearby.wontfix')}
          className="inline-flex items-center gap-1.5 px-8 h-12 rounded-full text-white text-[15px] font-semibold border-none cursor-pointer pointer-events-auto"
          style={{ background: '#1A1A1A' }}
        >
          <span style={{ color: C.orange }}>📍</span>
          附近签到
        </button>
      </div>
    </div>
  );
}
