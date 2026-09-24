import React from 'react';
import { IcClose } from '../res/icons';

/**
 * 底部弹层外壳:暗遮罩 + 圆角白底面板。close 由调用方传入(通常 = back())。
 * variant: 'bottom' 底部半屏 | 'full' 上拉全屏 | 'left' 左侧抽屉。
 */
export function SheetShell({
  close,
  title,
  headerRight,
  children,
  variant = 'bottom',
  closeIcon = false,
}: {
  close: () => void;
  title?: React.ReactNode;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  variant?: 'bottom' | 'full' | 'left';
  closeIcon?: boolean;
}) {
  const panelClass =
    variant === 'left'
      ? 'absolute inset-y-0 left-0 w-[80%] bg-[#EEF1F9] rounded-r-2xl flex flex-col animate-[slideRight_.2s_ease]'
      : variant === 'full'
        ? 'absolute inset-x-0 top-10 bottom-0 bg-white rounded-t-2xl flex flex-col'
        : 'absolute inset-x-0 bottom-0 max-h-[88%] bg-white rounded-t-2xl flex flex-col';

  return (
    <div className="absolute inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className={panelClass} onClick={(e) => e.stopPropagation()}>
        {variant !== 'left' && (
          <div className="flex items-center px-4 pt-3 pb-2 shrink-0">
            <div className="w-10">
              {closeIcon && (
                <button onClick={close} className="bg-transparent border-none cursor-pointer p-0" aria-label="关闭">
                  <IcClose size={20} className="text-[#8A92A6]" />
                </button>
              )}
            </div>
            <div className="flex-1 text-center text-[17px] font-semibold text-[#1A1D26]">{title}</div>
            <div className="w-10 flex justify-end">{headerRight}</div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto" data-scroll-container="sheet" data-scroll-direction="vertical">
          {children}
        </div>
      </div>
    </div>
  );
}
