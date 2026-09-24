import React, { useRef } from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';

/**
 * 底部弹层容器。阶段④ 订正：下滑弹层**或点击弹层外区域**都能关闭。
 * 关闭统一走 bindBack()（system.back），不声明额外 transition。
 */
const Sheet: React.FC<{
  children: React.ReactNode;
  /** 顶部小横条（抓手） */
  handle?: boolean;
  className?: string;
  /** 自定义关闭遮罩绑定；默认 bindBack() */
  dismissBind?: React.ComponentProps<'div'>;
}> = ({ children, handle = true, className = '', dismissBind }) => {
  const { bindBack, back } = useSlackGestures();
  const backdrop = dismissBind ?? bindBack();
  const startY = useRef<number | null>(null);

  const dismiss = () => {
    if (backdrop.onClick) {
      backdrop.onClick({} as React.MouseEvent<HTMLDivElement>);
      return;
    }
    back();
  };

  // 跟手下滑必须用 PointerEvent（平台规则），不维护并行 touch/mouse 逻辑
  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    if (e.clientY - startY.current > 60) {
      startY.current = null;
      dismiss();
    }
  };
  const onPointerUp = () => {
    startY.current = null;
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div {...backdrop} className="flex-1 bg-black/40" aria-label="close-sheet" />
      <div
        className={`relative flex-shrink-0 rounded-t-2xl bg-white pb-6 ${className}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {handle && (
          <div className="flex justify-center py-2.5">
            <span className="h-1 w-9 rounded-full bg-[#D5D5D5]" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

/** 居中气泡菜单（＋添加频道、行 … 菜单这类带尖角的小浮层） */
export const PopoverMenu: React.FC<{
  children: React.ReactNode;
  /** 相对屏幕的定位类，如 'top-40 left-4'；与 center 二选一 */
  position?: string;
  /** 水平居中（用于添加频道等底部气泡） */
  center?: boolean;
  /** 自定义关闭遮罩绑定；默认 bindBack() */
  dismissBind?: React.ComponentProps<'div'>;
}> = ({ children, position = 'top-40 left-4', center = false, dismissBind }) => {
  const { bindBack } = useSlackGestures();
  const backdrop = dismissBind ?? bindBack();
  return (
    <div className="absolute inset-0 z-50">
      <div {...backdrop} className="absolute inset-0" aria-label="close-menu" />
      {center ? (
        <div className="absolute bottom-28 left-0 right-0 flex justify-center px-4">
          <div
            className="min-w-[200px] overflow-hidden rounded-xl bg-white py-1"
            style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}
          >
            {children}
          </div>
        </div>
      ) : (
        <div
          className={`absolute ${position} min-w-[200px] overflow-hidden rounded-xl bg-white py-1`}
          style={{ boxShadow: '0 6px 24px rgba(0,0,0,0.18)' }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default Sheet;
