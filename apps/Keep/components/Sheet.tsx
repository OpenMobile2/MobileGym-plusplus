import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { IcClose } from '../res/icons';

/**
 * 弹层容器 —— kind=sheet/dialog 的节点是独立路由页,渲染成「压暗背景 + 底部抽屉 / 居中卡片」。
 * 关闭一律 bindBack(pop),符合 §11 返回契约。
 */
export function BottomSheet({
  title,
  children,
  showClose = true,
  heightClass = 'max-h-[80%]',
  padded = true,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  showClose?: boolean;
  heightClass?: string;
  padded?: boolean;
}) {
  const { bindBack } = useKeepGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" {...bindBack()} />
      <div className={`relative bg-app-surface rounded-t-2xl flex flex-col ${heightClass}`}>
        {(title || showClose) && (
          <div className="flex items-center justify-center relative px-4 pt-4 pb-2 shrink-0">
            <div className="font-semibold text-[16px] text-app-text">{title}</div>
            {showClose && (
              <button
                {...bindBack()}
                className="absolute right-3 top-3 p-1 bg-transparent border-none text-app-text-muted"
                aria-label="关闭"
              >
                <IcClose size={20} />
              </button>
            )}
          </div>
        )}
        <div className={`flex-1 overflow-y-auto ${padded ? 'px-4 pb-6' : 'pb-4'}`}>{children}</div>
      </div>
    </div>
  );
}

/** 居中弹窗(kind=dialog):标题 + 内容 + 双按钮。按钮由调用方传入以便绑定 transition/action。 */
export function CenterDialog({
  title,
  children,
  footer,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { bindBack } = useKeepGestures();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
      <div className="absolute inset-0 bg-black/45" {...bindBack()} />
      <div className="relative bg-app-surface rounded-2xl w-full px-5 pt-6 pb-4">
        {title && <div className="text-center font-semibold text-[16px] text-app-text mb-2">{title}</div>}
        {children && <div className="text-center text-[13px] text-app-text-muted mb-4">{children}</div>}
        <div className="flex items-center gap-3">{footer}</div>
      </div>
    </div>
  );
}
