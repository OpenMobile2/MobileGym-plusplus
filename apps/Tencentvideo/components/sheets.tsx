// apps/Tencentvideo/components/sheets.tsx —— 播放器弹层组(player.sheets)的公共积木。
// 一律「无 action」:所有可点元素的绑定由 PlayerSheetsPage 以字面量 actionId 传入
// (IMPL_BRIEF 硬规则8),这里只负责证据里的视觉形态。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import { Switch, type BindProps } from './ui';
import { IcArrowRight } from '../res/icons';

/** 分区小标题(证据 854「画质」/855「其他设置」),right 放「自定义 ›」等次级入口。 */
export function SheetSectionTitle({
  title,
  right,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-end justify-between mt-3 mb-1.5 ${className ?? ''}`}>
      <span className="text-[11px] text-white/55">{title}</span>
      {right}
    </div>
  );
}

/**
 * 档位方块(倍速 855 / 清晰度·音质·滤镜 854)。
 * 选中 = 白底黑字(横屏)或青底青字(竖屏 822);tierBadge 走右上角 VIP/SVIP 小字。
 */
export function OptionTile({
  label,
  sub,
  tierBadge,
  selected,
  locked = false,
  bind,
  variant = 'dark',
  extra,
  className,
}: {
  label: React.ReactNode;
  sub?: React.ReactNode;
  tierBadge?: string;
  selected?: boolean;
  /** true = 该档位超出当前会员等级(证据 854 灰显),点击走权益墙 */
  locked?: boolean;
  bind?: BindProps;
  variant?: 'dark' | 'light';
  /** 方块内底部附加行(证据 855「0.5X」下的「自定义 ›」) */
  extra?: React.ReactNode;
  className?: string;
}) {
  const dark = variant === 'dark';
  const bg = selected
    ? dark
      ? '#FFFFFF'
      : C.primaryBg
    : dark
      ? 'rgba(255,255,255,0.10)'
      : C.chipGray;
  const fg = selected ? (dark ? '#000000' : C.primary) : dark ? '#FFFFFF' : C.text;
  return (
    <button
      {...bind}
      className={`relative flex flex-col items-center justify-center rounded-lg border-none px-2 ${className ?? ''}`}
      style={{ background: bg, color: fg, opacity: locked && !selected ? 0.55 : 1 }}
    >
      {tierBadge && (
        <span
          className="absolute right-1 top-0.5 text-[9px] font-semibold leading-tight"
          style={{ color: C.vipBadgeBg }}
        >
          {tierBadge}
        </span>
      )}
      <span className="text-[13px] font-semibold leading-tight">{label}</span>
      {sub && <span className="text-[9px] mt-0.5 opacity-70 leading-tight whitespace-nowrap">{sub}</span>}
      {extra}
    </button>
  );
}

/**
 * 深色设置行(证据 850/851/855)。
 * bind 缺省时渲染为纯展示行(spec 明确「不建交互」的行,如此刻弹幕列表)。
 */
export function SheetSettingRow({
  icon,
  label,
  sub,
  info = false,
  right,
  bind,
}: {
  icon?: React.ReactNode;
  label: React.ReactNode;
  sub?: React.ReactNode;
  /** 标签后的 ⓘ 说明点(证据 850) */
  info?: boolean;
  right?: React.ReactNode;
  bind?: BindProps;
}) {
  const body = (
    <>
      {icon && <span className="shrink-0 text-white/85">{icon}</span>}
      <span className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1">
          <span className="text-[13px] text-white truncate">{label}</span>
          {info && (
            <span
              className="shrink-0 w-3 h-3 rounded-full text-[8px] leading-3 text-center text-black/70"
              style={{ background: 'rgba(255,255,255,0.55)' }}
              aria-hidden
            >
              i
            </span>
          )}
        </span>
        {sub && <span className="block text-[10px] text-white/45 mt-0.5">{sub}</span>}
      </span>
      {right}
    </>
  );
  const cls = 'w-full flex items-center gap-2 rounded-lg px-3 py-2.5 mb-1.5 border-none text-left';
  const style = { background: 'rgba(255,255,255,0.10)' };
  return bind ? (
    <button {...bind} className={cls} style={style}>
      {body}
    </button>
  ) : (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

/** 行尾「值 ›」(证据 851「已添加 0/50 ›」/855「3.0X ›」) */
export function RowValue({ text }: { text: React.ReactNode }) {
  return (
    <span className="shrink-0 flex items-center text-[12px] text-white/60">
      {text}
      <IcArrowRight size={13} />
    </span>
  );
}

/**
 * 竖向填充滑杆(证据 849 弹幕展示的行数/不透明度/速度/字号)。
 * 白色自底部按 pct 填充,当前值文案压在顶部;点击落点 = 目标档位由页面在 bind 里算。
 */
export function VerticalFillSlider({
  valueLabel,
  label,
  pct,
  bind,
}: {
  valueLabel: string;
  label: string;
  pct: number;
  bind?: BindProps;
}) {
  const filled = pct >= 0.92;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
      {/* 子元素 pointer-events-none:落点算档位靠 nativeEvent.offsetY(本地坐标),
          需要 event.target 恒为按钮本体 —— 横屏抽屉整块被 rotate(90deg)。 */}
      <button
        {...bind}
        className="relative w-full h-[130px] rounded-lg overflow-hidden border-none p-0"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <span
          className="absolute inset-x-0 bottom-0 bg-white pointer-events-none"
          style={{ height: `${Math.round(pct * 100)}%` }}
        />
        <span
          className="absolute inset-x-0 top-1.5 text-[12px] font-semibold pointer-events-none"
          style={{ color: filled ? '#000000' : '#FFFFFF' }}
        >
          {valueLabel}
        </span>
      </button>
      <span className="text-[11px] text-white/75 truncate">{label}</span>
    </div>
  );
}

/** 二选一分段器(证据 849 完整⇌精选);选中 = 白底黑字。 */
export function SheetSegmented({
  items,
  activeId,
  getBind,
}: {
  items: { id: string; label: string }[];
  activeId: string;
  getBind: (id: string) => BindProps;
}) {
  return (
    <div className="flex rounded-lg p-1 gap-1" style={{ background: 'rgba(255,255,255,0.10)' }}>
      {items.map((it) => {
        const on = it.id === activeId;
        return (
          <button
            key={it.id}
            {...getBind(it.id)}
            className="flex-1 rounded-md border-none py-2 text-[13px] font-semibold"
            style={{
              background: on ? '#FFFFFF' : 'transparent',
              color: on ? '#000000' : 'rgba(255,255,255,0.85)',
            }}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

/** 分享渠道圆钮(证据 852)。渠道配色写死在此(装饰,不是数据)。 */
const CHANNEL_STYLE: Record<string, string> = {
  保存本地: 'rgba(255,255,255,0.16)',
  微信: '#3CBB39',
  朋友圈: '#22B14C',
  QQ: '#1E9BF0',
  QQ空间: '#F5B429',
  微博: '#E6162D',
};

export function ShareChannelRow({
  channels,
  getBind,
  icons,
}: {
  channels: string[];
  getBind: (label: string) => BindProps;
  icons: Record<string, React.ReactNode>;
}) {
  return (
    <div className="flex items-start gap-4 overflow-x-auto no-scrollbar">
      {channels.map((label) => (
        <button
          key={label}
          {...getBind(label)}
          className="shrink-0 flex flex-col items-center gap-1 bg-transparent border-none p-0"
        >
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{ background: CHANNEL_STYLE[label] ?? 'rgba(255,255,255,0.16)' }}
          >
            {icons[label]}
          </span>
          <span className="text-[10px] text-white/75 whitespace-nowrap">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** 开关行右侧胶囊(把 Switch 收在此,免得页面到处 import) */
export function SheetSwitch({ on, bind }: { on: boolean; bind: BindProps }) {
  return <Switch on={on} bind={bind} size="sm" />;
}
