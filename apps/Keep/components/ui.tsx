import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStore } from '../state';
import { IcNavBack } from '../res/icons';

/** Keep 品牌色速查(manifest 主题外的辅助色) */
export const C = {
  green: '#24C789',       // Keep 品牌绿
  greenDeep: '#0FB27A',
  dark: '#1A1A1A',
  sub: '#8A8F99',
  bgGray: '#F5F6F8',
  gold: '#D8B173',        // 会员金
  purple: '#7A5AF8',      // AI/定制紫
  blue: '#3C7CFC',
  red: '#FF4D4F',
  orange: '#FF7D41',
};

/** 顶栏。返回键统一 bindBack;right 可放 icon。 */
export function TopBar({
  title,
  right,
  showBack = true,
  transparent = false,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  showBack?: boolean;
  transparent?: boolean;
}) {
  const { bindBack } = useKeepGestures();
  return (
    <div
      className={`flex items-center h-11 px-2 shrink-0 ${
        transparent ? '' : 'border-b border-app-border bg-app-surface'
      }`}
    >
      <div className="w-12 flex items-center">
        {showBack && (
          <button
            {...bindBack()}
            className="flex items-center text-app-text bg-transparent border-none p-1"
            aria-label="返回"
          >
            <IcNavBack size={22} />
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-app-text truncate text-[16px]">
        {title}
      </div>
      <div className="w-12 flex justify-end items-center gap-1">{right}</div>
    </div>
  );
}

export function isUnavailableMessage(msg: string | null): boolean {
  return Boolean(msg && (msg.includes('暂未开放') || msg.toLowerCase().includes('not available')));
}

/** 全局 Toast；未开放消息升级为必须手动确认的明确弹窗。 */
export function Toast() {
  const msg = useKeepStore((s) => s.lastToast);
  const toast = useKeepStore((s) => s.toast);
  const { bindTap } = useKeepGestures();
  const needsConfirmation = isUnavailableMessage(msg);
  React.useEffect(() => {
    if (!msg || needsConfirmation) return;
    const t = setTimeout(() => toast(null), 2200);
    return () => clearTimeout(t);
  }, [msg, needsConfirmation, toast]);
  if (!msg) return null;
  if (needsConfirmation) {
    return (
      <div className="absolute inset-0 z-[70] flex items-center justify-center px-8">
        <div className="absolute inset-0 bg-black/45" />
        <div role="alertdialog" aria-modal="true" aria-labelledby="keep-not-open-title" className="relative w-full rounded-2xl bg-app-surface px-5 pt-6 pb-4 shadow-xl">
          <div id="keep-not-open-title" className="text-center font-semibold text-[16px] text-app-text">功能未开放</div>
          <div className="mt-2 mb-4 text-center text-[13px] text-app-text-muted">{msg}</div>
          <button
            autoFocus
            {...bindTap({ kind: 'action', id: 'global.notOpen.confirm' }, { onTrigger: () => toast(null) })}
            className="w-full rounded-full border-none bg-emerald-500 py-2.5 text-white"
          >
            我知道了
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none z-50">
      <div className="px-4 py-2 rounded-lg bg-black/80 text-white text-sm max-w-[80%] text-center">
        {msg}
      </div>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-app-surface rounded-xl ${className}`}>{children}</div>;
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-[13px] text-app-text-muted px-1 pt-3 pb-1.5">{children}</div>;
}

/** 设置类行:label + value + › */
export function Row({
  label,
  value,
  last = false,
  bind,
  onClick,
  arrow = true,
  danger = false,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  last?: boolean;
  bind?: object;
  onClick?: () => void;
  arrow?: boolean;
  danger?: boolean;
}) {
  const merged: Record<string, unknown> = { ...(bind ?? {}) };
  if (onClick) merged.onClick = onClick;
  return (
    <button
      {...merged}
      className={`flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left ${
        last ? '' : 'border-b border-app-border'
      }`}
    >
      <span className={`flex-1 text-[15px] ${danger ? 'text-red-500' : 'text-app-text'}`}>{label}</span>
      {value != null && <span className="text-[13px] text-app-text-muted mr-1">{value}</span>}
      {arrow && <span className="text-app-text-muted text-base">›</span>}
    </button>
  );
}

/** iOS 风格开关(带 data-action 绑定) */
export function Toggle({
  on,
  bind,
}: {
  on: boolean;
  bind?: object;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="border-none bg-transparent p-0"
      role="switch"
      aria-checked={on}
    >
      <span
        className="inline-flex w-11 h-6.5 rounded-full p-0.5 transition-colors"
        style={{ background: on ? C.green : '#D9DBE0', height: 26, width: 46 }}
      >
        <span
          className="rounded-full bg-white transition-transform"
          style={{
            width: 22, height: 22, marginTop: 0,
            transform: on ? 'translateX(20px)' : 'translateX(0)',
            boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          }}
        />
      </span>
    </button>
  );
}

export function ToggleRow({
  label,
  desc,
  on,
  bind,
  last = false,
}: {
  label: string;
  desc?: string;
  on: boolean;
  bind?: object;
  last?: boolean;
}) {
  return (
    <div className={`flex items-center px-4 py-3 ${last ? '' : 'border-b border-app-border'}`}>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-app-text">{label}</div>
        {desc && <div className="text-[12px] text-app-text-muted mt-0.5">{desc}</div>}
      </div>
      <Toggle on={on} bind={bind} />
    </div>
  );
}

/** 圆角主按钮(滴滴橙) */
export function PrimaryBtn({
  children,
  bind,
  onClick,
  className = '',
  disabled = false,
}: {
  children: React.ReactNode;
  bind?: object;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  const merged: Record<string, unknown> = { ...(bind ?? {}) };
  if (onClick) merged.onClick = onClick;
  return (
    <button
      {...merged}
      disabled={disabled}
      className={`w-full py-3 rounded-full text-white text-[16px] font-medium border-none ${className}`}
      style={{ background: disabled ? '#A8E8CF' : C.green }}
    >
      {children}
    </button>
  );
}

/** 分类 chip */
export function Chip({
  active,
  children,
  bind,
}: {
  active: boolean;
  children: React.ReactNode;
  bind?: object;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="px-3 py-1.5 rounded-full text-[13px] border-none shrink-0"
      style={{
        background: active ? '#FFEFE5' : '#F5F6FA',
        color: active ? C.greenDeep : '#666',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  );
}

/** 勾选圆框(车型/发票行程勾选) */
export function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-md shrink-0"
      style={{
        width: 22, height: 22,
        background: checked ? C.green : 'transparent',
        border: checked ? 'none' : '1.5px solid #D9DBE0',
        color: '#fff', fontSize: 14,
      }}
    >
      {checked ? '✓' : ''}
    </span>
  );
}

export const IMG_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 80'><rect width='100' height='80' fill='%23EEF1FB'/></svg>";

/** 司机头像 SVG 占位(生图缺失时的兜底) */
