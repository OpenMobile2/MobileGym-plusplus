import React, { useMemo, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcClose, IcShare, IcMore } from '../res/icons';

// 主题峰预置布局(归一化坐标 + 尺寸),标签名由 store 填入
const PEAK_LAYOUT = [
  { x: 28, y: 18, size: 64 },
  { x: 66, y: 24, size: 72 },
  { x: 20, y: 46, size: 56 },
  { x: 58, y: 52, size: 80 },
  { x: 80, y: 60, size: 52 },
  { x: 38, y: 72, size: 60 },
];

const MONTHS = ['2025年 03月', '2025年 06月', '2025年 09月', '2025年 12月', '2026年 03月', '2026年 06月'];

export default function MindMapPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const tags = useFlomoStore((s) => s.tags);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const toast = useFlomoStore((s) => s.toast);
  const [monthIdx, setMonthIdx] = useState(MONTHS.length - 1);

  // 取顶层标签(无 parentId)作为主题峰,与预置布局位置一一对应
  const peaks = useMemo(() => {
    const top = tags.filter((t) => !t.parentId);
    return PEAK_LAYOUT.map((pos, i) => ({ ...pos, tag: top[i % top.length] }));
  }, [tags]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 / 标题 / 分享 / … */}
      <div className="flex items-center h-12 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>
          认知地图
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'mind.map.share.do' }, { onTrigger: () => toast('已生成认知地图分享图') })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="分享"
        >
          <IcShare size={18} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'mind.map.more.open' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="更多"
        >
          <IcMore size={18} />
        </button>
      </div>

      {/* 等高线地形图画布(深色) */}
      <div className="flex-1 px-3 pb-3 min-h-0">
        <div
          className="relative w-full h-full rounded-2xl overflow-hidden"
          style={{
            background:
              'radial-gradient(120% 120% at 30% 20%, #2A2F3A 0%, #14171E 55%, #0C0E13 100%)',
          }}
        >
          {peaks.map((p, i) => (
            <button
              key={i}
              {...bindTap('mind.map.peak.open', { beforeTrigger: () => setCurrentTag(p.tag?.id ?? null) })}
              className="absolute flex flex-col items-center justify-center bg-transparent border-none cursor-pointer p-0"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                transform: 'translate(-50%, -50%)',
                width: p.size,
                height: p.size,
              }}
              aria-label={p.tag?.name}
            >
              {/* 同心椭圆等高线 = 一座峰 */}
              <div className="absolute inset-0 rounded-full" style={{ border: '1px solid rgba(255,255,255,0.10)' }} />
              <div className="absolute rounded-full" style={{ inset: '18%', border: '1px solid rgba(255,255,255,0.16)' }} />
              <div className="absolute rounded-full" style={{ inset: '36%', border: '1px solid rgba(255,255,255,0.24)' }} />
              <div
                className="absolute rounded-full"
                style={{ inset: '54%', background: 'rgba(51,182,121,0.55)' }}
              />
              <span
                className="absolute whitespace-nowrap"
                style={{ top: '100%', marginTop: 2, color: 'rgba(255,255,255,0.85)', fontSize: 11 }}
              >
                {p.tag?.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部:记录足迹时间轴 + AI 提示 */}
      <div className="shrink-0 px-4 pb-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="shrink-0" style={{ color: C.sub, fontSize: 12 }}>记录足迹</span>
          <input
            type="range"
            min={0}
            max={MONTHS.length - 1}
            step={1}
            value={monthIdx}
            {...bindTap(
              { kind: 'action', id: 'mind.map.timeline.scrub' },
              {
                onTrigger: () => {
                  // 实际月份由 onChange 已写入,这里只发提示
                  toast(`回放至 ${MONTHS[monthIdx]}`);
                },
              },
            )}
            onChange={(e) => setMonthIdx(Number(e.currentTarget.value))}
            className="flex-1"
            style={{ accentColor: C.green }}
            aria-label="记录足迹时间轴"
          />
          <span className="shrink-0 tabular-nums" style={{ color: C.text, fontSize: 12 }}>
            {MONTHS[monthIdx]}
          </span>
        </div>
        <div className="text-center mt-2" style={{ color: C.sub, fontSize: 11 }}>
          当前内容由 AI 生成，仅供参考
        </div>
      </div>
    </div>
  );
}
