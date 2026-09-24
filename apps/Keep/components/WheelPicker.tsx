import React, { useRef } from 'react';

/**
 * 滚轮选择器(体重/目标距离/身高等数值弹层,阶段③锁定=滚轮而非键盘)。
 * PointerEvent 拖动(平台规范:禁 touch/mouse 双轨),行高用像素常量避免 rem 漂移。
 */
const ITEM_H = 36;

export function WheelPicker({
  options,
  value,
  onChange,
  unit,
  widthClass = 'w-24',
}: {
  options: (string | number)[];
  value: string | number;
  onChange: (v: string | number) => void;
  unit?: string;
  widthClass?: string;
}) {
  const idx = Math.max(0, options.findIndex((o) => String(o) === String(value)));
  const startY = useRef<number | null>(null);
  const startIdx = useRef(0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    startIdx.current = idx;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const delta = Math.round((startY.current - e.clientY) / ITEM_H);
    const next = Math.min(options.length - 1, Math.max(0, startIdx.current + delta));
    if (next !== idx) onChange(options[next]);
  };
  const onPointerUp = () => { startY.current = null; };

  return (
    <div
      className={`relative overflow-hidden ${widthClass} select-none touch-none`}
      style={{ height: ITEM_H * 5 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div
        className="absolute inset-x-0 transition-transform duration-100"
        style={{ transform: `translateY(${(2 - idx) * ITEM_H}px)` }}
      >
        {options.map((o, i) => (
          <div
            key={String(o)}
            className="flex items-center justify-center"
            style={{
              height: ITEM_H,
              fontSize: i === idx ? 18 : 14,
              fontWeight: i === idx ? 600 : 400,
              color: i === idx ? '#1A1A1A' : '#B0B4BC',
            }}
            onClick={() => onChange(o)}
          >
            {o}{unit && i === idx ? <span className="text-[11px] ml-1 text-app-text-muted">{unit}</span> : null}
          </div>
        ))}
      </div>
      {/* 选中带 */}
      <div
        className="absolute inset-x-0 pointer-events-none border-y border-app-border"
        style={{ top: ITEM_H * 2, height: ITEM_H }}
      />
    </div>
  );
}
