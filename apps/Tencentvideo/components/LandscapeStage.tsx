// apps/Tencentvideo/components/LandscapeStage.tsx —— 真横屏舞台。
// 手机壳不会转,所以把一个「宽 = 容器高、高 = 容器宽」的盒子旋转 90° 居中放置,
// 里面就是一块真正的横屏画布(宽高比与真机横屏一致),全屏播放器在其中按横屏布局写。
// 尺寸靠测量而非硬编码:AppShell 的状态栏占位/底部占位变了也不会错位。
import React, { useEffect, useRef, useState } from 'react';

export function LandscapeStage({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="relative w-full h-full overflow-hidden bg-black">
      {size.w > 0 && (
        <div
          className={`tv-landscape-stage absolute overflow-hidden bg-black text-white ${className ?? ''}`}
          style={{
            width: size.h,
            height: size.w,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%) rotate(90deg)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
