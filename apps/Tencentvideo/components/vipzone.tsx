// apps/Tencentvideo/components/vipzone.tsx —— 会员专区族(vip.zone.rights/get/points/joint)的公共积木。
// 4 个子页在真机上顶部完全一致(证据 743/745/747/748:同一条子 tab 行、同一个账号条形态),
// 但互切是 nav(spec 各页 interactions 里的 vip.zone.*.open.fromTab),所以这里
// 一律「无 action / 无 transition」:所有可点元素的绑定由页面以字面量 id 传入(IMPL_BRIEF 硬规则2/8)。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { BindProps } from './ui';

/**
 * 子 tab 行(证据 748:领权益/领会员/花积分/联合会员/IP商城 为文字 tab,
 * 最后一项「小助理」是右侧独立胶囊)。选中 = 黑色加粗 + 短下划线。
 */
export function ZoneTabRow({
  tabs,
  activeLabel,
  getBind,
}: {
  tabs: string[];
  activeLabel: string;
  getBind: (label: string) => BindProps;
}) {
  const hasAssistantPill = tabs[tabs.length - 1] === '小助理';
  const textTabs = hasAssistantPill ? tabs.slice(0, -1) : tabs;
  const pillTab = hasAssistantPill ? tabs[tabs.length - 1] : null;
  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 h-11"
      style={{ background: C.pageBg }}
    >
      {textTabs.map((label) => {
        const active = label === activeLabel;
        // 当前 tab 不再重复绑定跳转(spec 只给了「切到别的 tab」的 transition)
        const bind = active ? undefined : getBind(label);
        return (
          <button
            key={label}
            {...bind}
            className="relative shrink-0 bg-transparent border-none p-0 h-full whitespace-nowrap"
            style={{ color: active ? C.text : C.textSub }}
          >
            <span className="text-[13px]" style={{ fontWeight: active ? 700 : 400 }}>
              {label}
            </span>
            {active && (
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-1 w-5 h-[2px] rounded-full"
                style={{ background: C.text }}
              />
            )}
          </button>
        );
      })}
      <div className="flex-1" />
      {pillTab && (
        <button
          {...getBind(pillTab)}
          className="flex items-center gap-0.5 shrink-0 border-none rounded-full pl-1.5 pr-2 h-6 whitespace-nowrap"
          style={{ background: C.chipGray, color: C.textSub }}
        >
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: C.primary }} />
          <span className="text-[11px]">{pillTab}</span>
        </button>
      )}
    </div>
  );
}

/** 账号条(证据 744/746:昵称 + VIP 角标,右侧一个次级入口)。right 由页面绑定后传入。 */
export function ZoneAccountRow({
  nickname,
  levelLabel,
  right,
}: {
  nickname: string;
  levelLabel: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <span className="text-[15px] font-semibold" style={{ color: C.text }}>
        {nickname}
      </span>
      <span
        className="px-1 rounded text-[10px] leading-[15px] font-semibold"
        style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
      >
        {levelLabel}
      </span>
      <div className="flex-1" />
      {right}
    </div>
  );
}

/** 金色领取/开通胶囊(证据 743「立即开通」/747「去领取」同一形态)。 */
export function ZoneClaimButton({
  label,
  bind,
  className,
}: {
  label: string;
  bind: BindProps;
  className?: string;
}) {
  return (
    <button
      {...bind}
      className={`shrink-0 h-7 px-3 rounded-md border-none text-[12px] font-semibold ${className ?? ''}`}
      style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
    >
      {label}
    </button>
  );
}
