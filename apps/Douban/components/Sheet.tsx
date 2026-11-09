// apps/Douban/components/Sheet.tsx —— 弹层三件套(FOUNDATION,Flomo 同款范式)。
// 弹层可见性一律 URL 驱动(?xxx=open / 独立 overlay 路由);遮罩点击 = bindBack() 弹栈。
// 组件不出现任何 id 字面量 —— 行/按钮的绑定由页面侧传入。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { C } from './ui';

/** 底部弹出面板:暗遮罩点击关闭(bindBack),内容贴底圆角。 */
export function Sheet({
  title,
  children,
  bg,
  maxH = '75%',
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  /** 自定义面板底色(送礼物弹层随礼物换主题色) */
  bg?: string;
  maxH?: string;
}) {
  const { bindBack } = useDoubanGestures();
  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
      <div
        className="rounded-t-2xl pb-6 pt-1 flex flex-col overflow-hidden shrink-0"
        style={{ background: bg ?? C.surface, maxHeight: maxH }}
      >
        {title && (
          <div className="text-center py-2.5 text-sm font-semibold shrink-0" style={{ color: C.text }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/** 弹层菜单行(action-sheet 行)。bind 由页面侧传入。 */
export function SheetRow({
  icon,
  label,
  sub,
  danger,
  bind,
  right,
}: {
  icon?: React.ReactNode;
  label: string;
  sub?: string;
  danger?: boolean;
  bind?: object;
  right?: React.ReactNode;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="w-full flex items-center gap-3 px-5 h-12 bg-transparent border-none cursor-pointer text-left"
      style={{ color: danger ? C.danger : C.text, fontSize: 15 }}
    >
      {icon && (
        <span className="w-5 flex justify-center" style={{ color: danger ? C.danger : C.sub }}>{icon}</span>
      )}
      <span className="flex-1 truncate">
        {label}
        {sub && <span className="ml-2 text-xs" style={{ color: C.sub }}>{sub}</span>}
      </span>
      {right}
    </button>
  );
}

/** 弹层顶部横排图标行(分享面板类) */
export function SheetIconRow({
  items,
}: {
  items: { icon: React.ReactNode; label: string; bind: object }[];
}) {
  return (
    <div className="flex px-2 pt-2 pb-1 overflow-x-auto" data-scroll-container="sheet-icons" data-scroll-direction="horizontal">
      {items.map((it, i) => (
        <button
          key={i}
          {...it.bind}
          className="w-16 shrink-0 flex flex-col items-center gap-1.5 py-2 bg-transparent border-none cursor-pointer"
          style={{ color: C.text, fontSize: 11 }}
        >
          <span className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#F2F3F5' }}>
            {it.icon}
          </span>
          {it.label}
        </button>
      ))}
    </div>
  );
}

/**
 * 居中对话框(二次确认/支付失败弹窗/添加标签弹窗)。
 * dismissable=true 时遮罩可 bindBack 关闭;按钮由 buttons 传入(bind 页面侧绑定)。
 */
export function CenterDialog({
  title,
  children,
  buttons,
  dismissable = true,
  vertical,
}: {
  title?: React.ReactNode;
  children?: React.ReactNode;
  /** 底部按钮组;primary=true 绿字/绿底强调 */
  buttons?: { label: string; bind: object; primary?: boolean; danger?: boolean }[];
  dismissable?: boolean;
  /** 按钮纵向排列(支付失败弹窗:联系客服/重新支付/确定) */
  vertical?: boolean;
}) {
  const { bindBack } = useDoubanGestures();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center px-9">
      <div
        {...(dismissable ? bindBack() : {})}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: C.surface }}>
        {title && (
          <div className="px-5 pt-5 pb-1 text-center text-base font-semibold" style={{ color: C.text }}>
            {title}
          </div>
        )}
        {children && (
          <div className="px-5 py-3 text-sm text-center" style={{ color: C.sub }}>{children}</div>
        )}
        {buttons && buttons.length > 0 && (
          <div
            className={`border-t flex ${vertical ? 'flex-col' : ''}`}
            style={{ borderColor: C.border }}
          >
            {buttons.map((b, i) => (
              <button
                key={i}
                {...b.bind}
                className={`${vertical ? 'w-full border-b last:border-b-0' : 'flex-1 border-r last:border-r-0'} h-12 bg-transparent cursor-pointer text-[15px]`}
                style={{
                  borderColor: C.border,
                  borderStyle: 'solid',
                  borderWidth: 0,
                  ...(vertical ? { borderBottomWidth: i === buttons.length - 1 ? 0 : 1 } : { borderRightWidth: i === buttons.length - 1 ? 0 : 1 }),
                  color: b.danger ? C.danger : b.primary ? C.green : C.text,
                  fontWeight: b.primary || b.danger ? 600 : 400,
                }}
              >
                {b.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 半透明「正在验证支付状态」类居中浮层(无按钮,自动流转)。
 */
export function LoadingOverlay({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.35)' }}>
      <div className="px-6 py-5 rounded-xl flex flex-col items-center gap-3" style={{ background: 'rgba(20,20,20,0.85)' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" className="animate-spin">
          <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" fill="none" />
          <path d="M12 3 a9 9 0 0 1 9 9" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
        <div className="text-xs text-white">{text}</div>
      </div>
    </div>
  );
}
