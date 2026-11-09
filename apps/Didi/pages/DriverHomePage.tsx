import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';

/** 滴滴代驾 首页(绿色主题) —— 证据 s28、s30 */

const GREEN = '#0DAB76';

export default function DriverHomePage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full" style={{ background: '#F4EFE9' }} data-status-bar-foreground="dark">
      <TopBar
        transparent
        title="滴滴代驾"
        right={(
          <button
            onClick={() => toast('该功能暂未开放')}
            className="bg-transparent border-none p-1 text-app-text"
            aria-label="客服消息"
          >
            💬
          </button>
        )}
      />
      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 顶部小地图 */}
        <MapCanvas height={160}>
          <div className="absolute left-3 top-3">
            <div
              className="rounded-full shadow px-3 py-1.5 text-[12px] font-medium text-white"
              style={{ background: GREEN }}
            >
              快人一步 · 准时必达
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-10">
            <div className="bg-white rounded-lg shadow px-2.5 py-1.5 text-center">
              <div className="text-[12px] font-semibold text-app-text">晨曦雅苑</div>
              <div className="text-[10px]" style={{ color: GREEN }}>司机约2分钟接驾</div>
            </div>
          </div>
        </MapCanvas>

        <div className="px-3 -mt-5 relative flex flex-col gap-2.5">
          {/* 新客红条 */}
          <div
            className="rounded-t-xl px-3 py-2 text-[12px] text-white flex items-center"
            style={{ background: 'linear-gradient(90deg,#F5484D,#FF7A59)' }}
          >
            <span className="rounded px-1.5 py-0.5 mr-2 text-[11px]" style={{ background: 'rgba(255,255,255,.25)' }}>
              新客专享·免费调度
            </span>
            <span className="flex-1">优先在权益范围内,匹配更多司机</span>
          </div>

          {/* 绿色主卡 */}
          <div className="bg-app-surface rounded-xl px-3 pt-3 pb-2 shadow-sm">
            <button
              onClick={() => toast('该功能暂未开放')}
              className="flex items-center w-full bg-transparent border-none text-left pb-2.5"
            >
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: GREEN }} />
              <span className="text-[14px] text-app-text">
                从 <span className="font-semibold" style={{ color: GREEN }}>晨曦雅苑</span> 出发
              </span>
              <span className="text-app-text-muted ml-1">›</span>
            </button>
            <button
              {...bindTap('driver.select.open')}
              className="flex items-center w-full rounded-xl px-3 py-3 border-2 text-left bg-app-surface"
              style={{ borderColor: GREEN }}
            >
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: '#FF7D41' }} />
              <span className="text-[17px] font-bold text-app-text mr-2 shrink-0">代驾目的地</span>
              <span
                className="flex-1 text-[12px] text-app-text-muted truncate rounded-full px-2 py-1"
                style={{ background: '#F5F6FA' }}
              >
                去:乐游城(滨湖店)
              </span>
              <span className="flex flex-col items-center ml-2 shrink-0" style={{ color: GREEN }}>
                <span className="text-[16px] leading-none">⚡</span>
                <span className="text-[10px]">一键叫</span>
              </span>
            </button>
            <div className="flex items-center mt-1.5 text-[13px]">
              {['预约', '叫多名', '帮朋友叫'].map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <span className="w-px h-3.5 bg-app-border" />}
                  <button
                    onClick={() => toast('该功能暂未开放')}
                    className="flex-1 py-2 bg-transparent border-none text-app-text text-[13px]"
                  >
                    {t}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* 功能四格 */}
          <div className="bg-app-surface rounded-xl px-2 py-3 grid grid-cols-4">
            {[['🔁', '取送车'], ['👑', '豪华代驾'], ['✅', '年检'], ['⏱️', '包时司机']].map(([e, t]) => (
              <button
                key={t}
                onClick={() => toast('该功能暂未开放')}
                className="flex flex-col items-center gap-1 bg-transparent border-none p-0"
              >
                <span className="text-[24px] leading-none">{e}</span>
                <span className="text-[12px] text-app-text">{t}</span>
              </button>
            ))}
          </div>

          {/* 抽金球黄 banner */}
          <button
            onClick={() => toast('该功能暂未开放')}
            className="w-full rounded-xl border-none px-4 py-3.5 flex items-center text-left"
            style={{ background: 'linear-gradient(90deg,#FFE9B8,#FFD98A)' }}
          >
            <span className="text-[22px] mr-2">⚽</span>
            <span className="flex-1">
              <span className="block text-[16px] font-bold" style={{ color: '#B4530A' }}>抽金球赢免单</span>
              <span className="block text-[11px]" style={{ color: '#C97B3D' }}>叫代驾券后低至0元</span>
            </span>
            <span
              className="text-[13px] text-white rounded-full px-3.5 py-1.5"
              style={{ background: '#FF7D41' }}
            >
              领
            </span>
          </button>

          {/* 双卡 */}
          <div className="flex gap-2.5">
            <button
              onClick={() => toast('该功能暂未开放')}
              className="flex-1 rounded-xl border-none px-3 py-3 text-left"
              style={{ background: '#FFEFE5' }}
            >
              <div className="text-[14px] font-bold" style={{ color: '#D4380D' }}>酒店最高减200元</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#C97B3D' }}>限时特惠</div>
            </button>
            <button
              onClick={() => toast('该功能暂未开放')}
              className="flex-1 rounded-xl border-none px-3 py-3 text-left"
              style={{ background: '#E7F8F1' }}
            >
              <div className="text-[14px] font-bold" style={{ color: GREEN }}>高价卖车</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#4C9E7E' }}>一键预约卖得快</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
