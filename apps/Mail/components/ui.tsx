/** 邮件 App 通用 UI 组件：Toast、底部弹层、头像方块、分组卡片 */
import React, { useEffect, useState } from 'react';
import { useMailGestures } from '../hooks/useMailGestures';
import { colors as C } from '../res/colors';

// ——— Toast（跨页事件驱动）———

export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent('mail-toast', { detail: message }));
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 1600);
    };
    window.addEventListener('mail-toast', handler);
    return () => {
      window.removeEventListener('mail-toast', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);
  if (!msg) return null;
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
      <div className="max-w-[76%] rounded-xl bg-black/75 px-4 py-2.5 text-center text-[13px] leading-snug text-white">
        {msg}
      </div>
    </div>
  );
}

// ——— 底部弹层：遮罩点击 = 系统返回 ———

export function Sheet({
  children,
  padBottom = true,
}: {
  children: React.ReactNode;
  padBottom?: boolean;
}) {
  const { bindBack } = useMailGestures();
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.28)' }} aria-label="close" />
      <div
        className={`rounded-t-[14px] bg-white ${padBottom ? 'pb-7' : ''}`}
        style={{ boxShadow: '0 -1px 12px rgba(0,0,0,0.12)' }}
      >
        {children}
      </div>
    </div>
  );
}

/** iOS 风格的居中浮层（用于地址菜单、⋯ 菜单这类 popover） */
export function Popover({
  children,
  align = 'center',
}: {
  children: React.ReactNode;
  align?: 'center' | 'top-right' | 'top-left';
}) {
  const { bindBack } = useMailGestures();
  const pos =
    align === 'top-right'
      ? 'items-start justify-end pt-16 pr-3'
      : align === 'top-left'
        ? 'items-start justify-start pt-16 pl-3'
        : 'items-center justify-center';
  return (
    <div className={`absolute inset-0 z-50 flex ${pos}`}>
      <div {...bindBack()} className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.12)' }} aria-label="close" />
      <div
        className="relative max-w-[86%] overflow-hidden rounded-[14px]"
        style={{ background: 'rgba(250,250,250,0.98)', boxShadow: '0 8px 28px rgba(0,0,0,0.18)' }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * 手势 hook（bindTap / bindBack）返回的 props。
 * 这些对象带 data-trigger / data-action 等属性，React 的 HTMLAttributes 类型里没有它们，
 * 但 JSX 展开是合法的，所以这里用 button 的 props 类型接住即可。
 */
export type GestureBinding = React.ComponentPropsWithoutRef<'button'>;

/** 弹层里的一行：图标在右（iOS 上下文菜单风格） */
export function MenuRow({
  label,
  icon,
  danger,
  bind,
  last,
}: {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  bind?: GestureBinding;
  last?: boolean;
}) {
  return (
    <button
      {...bind}
      className={`flex w-full items-center justify-between px-4 py-[13px] text-left text-[16px] active:bg-black/5 ${
        last ? '' : 'border-b'
      }`}
      style={{ borderColor: C.separator, color: danger ? C.destructive : '#000' }}
    >
      <span>{label}</span>
      {icon && <span style={{ color: danger ? C.destructive : '#000' }}>{icon}</span>}
    </button>
  );
}

// ——— 发件人头像方块 ———

const AVATAR_TINTS = ['#A8C0E8', '#C9A8E8', '#E8A8C4', '#A8E8C0', '#E8C9A8', '#A8D8E8'];

export function SenderAvatar({
  name,
  size = 40,
  corporate,
}: {
  name: string;
  size?: number;
  corporate?: boolean;
}) {
  // 用名字的字符和做稳定选色，避免 Math.random
  const seed = [...name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const tint = AVATAR_TINTS[seed % AVATAR_TINTS.length];
  const initial = [...name.trim()][0] ?? '?';

  if (corporate) {
    return (
      <div
        className="flex flex-shrink-0 items-center justify-center rounded-[8px]"
        style={{ width: size, height: size, background: tint }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="#fff">
          <path d="M4 21V8l8-5 8 5v13h-6v-6H10v6H4Z" />
        </svg>
      </div>
    );
  }

  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-full text-[16px] font-medium text-white"
      style={{ width: size, height: size, background: tint }}
    >
      {initial.toUpperCase()}
    </div>
  );
}

// ——— 分组卡片（iOS inset grouped list）———

export function GroupCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mx-4 overflow-hidden rounded-[10px] bg-white ${className}`}>{children}</div>
  );
}

/** 空状态：居中的 No Messages 大字 */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <span className="text-[17px] font-semibold text-black">{text}</span>
    </div>
  );
}
