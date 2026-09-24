import React from 'react';
import { CategoryGlyph, IcNavBack, IcArrowRight } from '../res/icons';
import { useToastQueue } from './toast';

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="48" fill="%23EAF0FE"/><circle cx="48" cy="40" r="16" fill="%23B3B9C6"/><path d="M24 84c0-13 11-20 24-20s24 7 24 20z" fill="%23B3B9C6"/></svg>';

export function Avatar({ src, size = 40, className = '' }: { src?: string; size?: number; className?: string }) {
  return (
    <img
      src={src || FALLBACK_AVATAR}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = FALLBACK_AVATAR;
      }}
      alt=""
    />
  );
}

/** 胖咪猫吉祥物 */
export function MascotCat({ size = 36 }: { size?: number }) {
  return <Avatar src="/@app-assets/Kapi/avatars/cat.svg" size={size} />;
}

/** 彩色圆底分类图标 */
export function CategoryIcon({
  icon,
  color,
  size = 48,
  selected = false,
}: {
  icon: string;
  color: string;
  size?: number;
  selected?: boolean;
}) {
  // 彩色扁平图标(gate4:F11):圆底用分类色淡染,glyph 用分类色;选中态保持蓝底蓝描边蓝 glyph
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: selected ? '#EAF0FE' : `${color}1F`,
        border: selected ? '2px solid #4B6EF5' : '2px solid transparent',
        color: selected ? '#4B6EF5' : color,
      }}
    >
      <CategoryGlyph name={icon} size={Math.round(size * 0.5)} />
    </span>
  );
}

export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`bg-white rounded-2xl ${className}`}>{children}</div>;
}

/**
 * 记录 / AI助手 顶部切换器(gate4:F8)。
 * 两页共用同一组件,在各自顶栏「绝对居中」渲染 → 切 tab 时两字位置不跳动。
 * 当前页对应的 tab 不绑定跳转(避免 from 约束报错),非当前页 tab 传入对应 bind。
 */
export function TopTabs({
  active,
  recordBind,
  aiBind,
}: {
  active: 'record' | 'ai';
  recordBind?: React.HTMLAttributes<HTMLElement>;
  aiBind?: React.HTMLAttributes<HTMLElement>;
}) {
  const cls = (on: boolean) =>
    `text-[18px] bg-transparent border-none cursor-pointer p-0 transition-colors ${
      on ? 'font-bold text-[#1A1D26]' : 'text-[#B3B9C6]'
    }`;
  return (
    <div className="flex items-center gap-5">
      <button {...(active === 'record' ? {} : recordBind)} className={cls(active === 'record')}>记录</button>
      <button {...(active === 'ai' ? {} : aiBind)} className={cls(active === 'ai')}>AI助手</button>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-1 mb-2">
      <span className="text-[16px] font-semibold text-[#1A1D26]">{children}</span>
      {right}
    </div>
  );
}

/** 详情/设置行:左标题 + 右值 + 可选 chevron。整行可点(传 bind 展开) */
export function Row({
  label,
  value,
  chevron = true,
  bind,
  className = '',
  leading,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  chevron?: boolean;
  bind?: React.HTMLAttributes<HTMLElement>;
  className?: string;
  leading?: React.ReactNode;
}) {
  return (
    <div
      {...bind}
      className={`flex items-center min-h-[52px] px-4 ${bind ? 'cursor-pointer active:bg-[#F7F8FB]' : ''} ${className}`}
    >
      {leading && <span className="mr-2 flex items-center">{leading}</span>}
      <span className="text-[15px] text-[#1A1D26]">{label}</span>
      <span className="flex-1" />
      {value !== undefined && <span className="text-[15px] text-[#8A92A6] mr-1">{value}</span>}
      {chevron && <IcArrowRight size={18} className="text-[#C5CAD4]" />}
    </div>
  );
}

/** pill 开关 */
export function Switch({ on, bind }: { on: boolean; bind?: React.HTMLAttributes<HTMLElement> }) {
  return (
    <span
      {...bind}
      className="inline-flex items-center rounded-full transition-colors cursor-pointer shrink-0"
      style={{ width: 44, height: 26, padding: 3, background: on ? '#4B6EF5' : '#E3E6EE' }}
    >
      <span
        className="rounded-full bg-white transition-transform"
        style={{ width: 20, height: 20, transform: on ? 'translateX(18px)' : 'translateX(0)' }}
      />
    </span>
  );
}

/** 顶栏:返回 + 居中标题 + 右操作 */
export function TopBar({
  title,
  backBind,
  right,
  foreground = 'dark',
}: {
  title?: React.ReactNode;
  backBind?: React.HTMLAttributes<HTMLElement>;
  right?: React.ReactNode;
  foreground?: 'dark' | 'light';
}) {
  return (
    <div
      data-status-bar-foreground={foreground}
      className="flex items-center h-11 px-2 shrink-0"
    >
      <div className="w-12 flex items-center">
        {backBind && (
          <button {...backBind} className="p-1 bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcNavBack size={26} className="text-[#1A1D26]" />
          </button>
        )}
      </div>
      <div className="flex-1 text-center text-[17px] font-semibold text-[#1A1D26] truncate">{title}</div>
      <div className="min-w-12 shrink-0 flex justify-end items-center pl-1">{right}</div>
    </div>
  );
}

export function ToastHost() {
  const items = useToastQueue();
  if (!items.length) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[200] flex items-center justify-center">
      <div className="flex flex-col gap-2">
        {items.map((i) => (
          <div key={i.id} className="px-4 py-2.5 rounded-xl bg-black/75 text-white text-[14px] max-w-[260px] text-center">
            {i.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
