// apps/Tencentvideo/components/Sheet.tsx —— 半屏弹层 + 居中弹窗。
// URL 驱动:sheet/dialog 由 searchParams 或独立路由承载,关闭一律 bindBack(硬规则1)。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { TV_COLORS as C } from '../constants';
import { IcClose } from '../res/icons';

/**
 * 半屏底部弹层:压暗 backdrop(点击 = back)+ 圆角抽屉。
 * dark = 播放器/竖屏流深色变体。
 */
export function Sheet({
  title,
  children,
  showClose = true,
  heightClass = 'max-h-[75%]',
  padded = true,
  dark = false,
  left,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  showClose?: boolean;
  heightClass?: string;
  padded?: boolean;
  dark?: boolean;
  /** 标题栏左上角(证据 822:从「更多」进倍速面板时是一个返回上一级的 ‹) */
  left?: React.ReactNode;
}) {
  const { bindBack } = useTencentvideoGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" {...bindBack()} />
      <div
        className={`relative rounded-t-2xl flex flex-col ${heightClass}`}
        style={{ background: dark ? C.darkCard : C.pageBg }}
      >
        {(title !== undefined || showClose) && (
          <div className="flex items-center justify-center relative px-4 pt-4 pb-2 shrink-0">
            {left && <div className="absolute left-3 top-3">{left}</div>}
            <div
              className="font-semibold text-[16px]"
              style={{ color: dark ? C.darkText : C.text }}
            >
              {title}
            </div>
            {showClose && (
              <button
                {...bindBack()}
                className="absolute right-3 top-3 p-1 bg-transparent border-none"
                style={{ color: dark ? C.darkTextSub : C.textSub }}
                aria-label="关闭"
              >
                <IcClose size={20} />
              </button>
            )}
          </div>
        )}
        <div
          className={`flex-1 overflow-y-auto ${padded ? 'px-4 pb-6' : 'pb-4'}`}
          data-scroll-container="sheet"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 横屏右侧抽屉(证据 849/852/854/855)。
 * 左侧留出可点关闭的透明区,面板本体半透明压暗、画面隐约可见。
 * 必须放在 LandscapeStage 内部(由调用页负责),这里只管布局。
 */
export function LandscapeDrawer({
  title,
  titleExtra,
  children,
  widthClass = 'w-[38%]',
}: {
  title: React.ReactNode;
  /** 标题右侧的次级文案(如「恢复默认设置」) */
  titleExtra?: React.ReactNode;
  children: React.ReactNode;
  widthClass?: string;
}) {
  const { bindBack } = useTencentvideoGestures();
  return (
    <div className="absolute inset-0 z-40 flex justify-end">
      <div className="absolute inset-0" {...bindBack()} />
      <div
        className={`relative h-full ${widthClass} min-w-[240px] flex flex-col`}
        style={{ background: 'rgba(16,16,16,0.88)', backdropFilter: 'blur(6px)' }}
      >
        <div className="flex items-center gap-2 px-4 pt-3 pb-1 shrink-0">
          <span className="text-[14px] font-semibold text-white">{title}</span>
          {titleExtra}
          <div className="flex-1" />
          <button
            {...bindBack()}
            className="bg-transparent border-none p-0.5 text-white/85"
            aria-label="关闭"
          >
            <IcClose size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="sheet">
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * 横屏底部通栏面板(证据 853 选集)。上方留透明可点关闭区,面板本体由黑渐变兜底。
 */
export function LandscapeBottomPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const { bindBack } = useTencentvideoGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0" {...bindBack()} />
      <div
        className="relative max-h-[76%] overflow-y-auto pb-2"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.80) 14%, rgba(0,0,0,0.94) 40%, rgba(0,0,0,0.97) 100%)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 居中弹窗(挽留弹层/开通成功弹层/引导弹窗)。
 * footer 按钮由页面传入以便字面量绑定 action/transition;
 * dismissOnBackdrop=false 时背景不可点关(如支付成功弹层须点按钮关)。
 */
export function Dialog({
  title,
  children,
  footer,
  dark = false,
  dismissOnBackdrop = true,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  dark?: boolean;
  dismissOnBackdrop?: boolean;
}) {
  const { bindBack } = useTencentvideoGestures();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-8">
      {dismissOnBackdrop ? (
        <div className="absolute inset-0 bg-black/45" {...bindBack()} />
      ) : (
        <div className="absolute inset-0 bg-black/45" />
      )}
      <div
        className="relative rounded-2xl w-full px-5 pt-6 pb-4"
        style={{ background: dark ? C.darkCard : C.pageBg }}
      >
        {title && (
          <div
            className="text-center font-semibold text-[16px] mb-2"
            style={{ color: dark ? C.darkText : C.text }}
          >
            {title}
          </div>
        )}
        {children && (
          <div
            className="text-center text-[13px] mb-4"
            style={{ color: dark ? C.darkTextSub : C.textSub }}
          >
            {children}
          </div>
        )}
        {footer && <div className="flex items-center gap-3">{footer}</div>}
      </div>
    </div>
  );
}
