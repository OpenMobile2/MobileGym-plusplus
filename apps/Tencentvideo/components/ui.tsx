import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS } from '../constants';
import { IcNavBack } from '../res/icons';

/** 品牌色速查(单一来源 = constants.TV_COLORS,取自 design-tokens.md) */
export const C = TV_COLORS;

/**
 * 页面传给组件的绑定 props(bindTap/bindLongPress/bindBack 的返回值)。
 * 用 `object` 而非 `Record<string, unknown>`:平台返回的是 React.HTMLAttributes 接口,
 * 接口没有隐式索引签名,赋给 Record 会报 TS2322(与 apps/Keep 同约定)。
 */
export type BindProps = object;

/** 顶栏。返回键统一 bindBack;right 可放 icon。dark = 深色页(好片/年度活动)变体。 */
export function TopBar({
  title,
  right,
  backBind,
  showBack = true,
  transparent = false,
  dark = false,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  backBind?: BindProps;
  showBack?: boolean;
  transparent?: boolean;
  dark?: boolean;
}) {
  const { bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  return (
    <div
      className={`flex items-center h-11 px-2 shrink-0 ${
        transparent ? '' : dark ? '' : 'bg-app-surface'
      }`}
      style={dark ? { background: C.darkBg } : undefined}
    >
      <div className="w-12 flex items-center">
        {showBack && (
          <button
            {...(backBind ?? bindBack())}
            className="flex items-center bg-transparent border-none p-1"
            style={{ color: dark ? C.darkText : C.text }}
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
        )}
      </div>
      <div
        className="flex-1 text-center font-semibold truncate text-[16px]"
        style={{ color: dark ? C.darkText : C.text }}
      >
        {title}
      </div>
      <div className="w-12 flex justify-end items-center gap-1">{right}</div>
    </div>
  );
}

/* ---------- 角标 ---------- */

export type BadgeVariant = 'vip' | 'svip' | 'orange' | 'premiere' | 'mask' | 'red';

/** 从内容 badge 文案推断角标变体(VIP/SVIP 金底;独播/上新/高清修复 橙红;结局点映 米黄) */
export function badgeVariantOf(text: string): BadgeVariant {
  if (text === 'VIP' || text === 'SVIP') return 'vip';
  if (text.includes('点映')) return 'premiere';
  if (text.includes('4K') || text.includes('60帧') || text.includes('最近')) return 'mask';
  return 'orange';
}

const BADGE_STYLE: Record<BadgeVariant, React.CSSProperties> = {
  vip: { background: C.vipBadgeBg, color: C.vipBadgeText },
  svip: { background: C.vipBadgeBg, color: C.vipBadgeText },
  orange: { background: C.badgeOrange, color: '#FFFFFF' },
  premiere: { background: C.premiereYellow, color: C.premiereText },
  mask: { background: C.maskBadge, color: '#FFFFFF' },
  red: { background: C.unlockRed, color: '#FFFFFF' },
};

/** 海报角标(VIP/独播/上新/4K|60帧/结局点映…)。variant 缺省按文案自动推断。 */
export function Badge({
  text,
  variant,
  className,
}: {
  text: string;
  variant?: BadgeVariant;
  className?: string;
}) {
  if (!text) return null;
  const v = variant ?? badgeVariantOf(text);
  return (
    <span
      className={`inline-flex items-center rounded-[3px] px-1 py-[1px] text-[10px] font-semibold leading-[14px] ${className ?? ''}`}
      style={BADGE_STYLE[v]}
    >
      {text}
    </span>
  );
}

/* ---------- 开关 ---------- */

/**
 * 胶囊开关。bind 由页面传入(字面量 actionId),组件本身不含 action。
 * 开态青绿 = 真机弹幕工具箱/设置页统一色(证据 850)。
 */
export function Switch({ on, bind, size = 'md' }: { on: boolean; bind?: BindProps; size?: 'sm' | 'md' }) {
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const knob = h - 6;
  return (
    <button
      {...bind}
      role="switch"
      aria-checked={on}
      className="relative shrink-0 rounded-full border-none p-0 transition-colors"
      style={{
        width: w,
        height: h,
        background: on ? C.primary : 'rgba(255,255,255,0.28)',
      }}
    >
      <span
        className="absolute rounded-full bg-white transition-all"
        style={{ width: knob, height: knob, top: 3, left: on ? w - knob - 3 : 3 }}
      />
    </button>
  );
}

/* ---------- 楼层标题 ---------- */

/** 楼层标题行:左标题 + 右侧动作(「更多›」「换一换」等由页面绑定后传入)。 */
export function SectionHeader({
  title,
  right,
  dark = false,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-between px-3 pt-4 pb-2 ${className ?? ''}`}>
      <div
        className="text-[16px] font-semibold truncate"
        style={{ color: dark ? C.darkText : C.text }}
      >
        {title}
      </div>
      {right && <div className="shrink-0 flex items-center">{right}</div>}
    </div>
  );
}

/* ---------- 空态 ---------- */

/** 空态占位:文案由页面传入(走 strings,保双语)。 */
export function EmptyState({
  text,
  sub,
  icon,
  dark = false,
  className,
}: {
  text: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 ${className ?? ''}`}>
      {icon ?? (
        <div
          className="w-16 h-16 rounded-full mb-3"
          style={{ background: dark ? C.darkCard : C.chipGray }}
        />
      )}
      <div className="text-sm" style={{ color: dark ? C.darkTextSub : C.textSub }}>
        {text}
      </div>
      {sub && (
        <div className="text-xs mt-1" style={{ color: dark ? C.darkTextSub : C.textTertiary }}>
          {sub}
        </div>
      )}
    </div>
  );
}

/** 全局 Toast(chrome.toast:黑底 rgba(0,0,0,0.80) 白字,自动消失,铁律①) */
export function Toast() {
  const msg = useTencentvideoStore((s) => s.lastToast);
  const toast = useTencentvideoStore((s) => s.toast);
  React.useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => toast(null), 2200);
    return () => clearTimeout(t);
  }, [msg, toast]);
  if (!msg) return null;
  return (
    <div className="absolute inset-x-0 top-[38%] flex justify-center pointer-events-none z-50">
      <div
        className="px-4 py-2 rounded-lg text-white text-sm max-w-[80%] text-center"
        style={{ background: C.toastBg }}
      >
        {msg}
      </div>
    </div>
  );
}
