// apps/Tencentvideo/components/shortdrama.tsx —— 短剧族共用件。
// 证据:754/757(短剧频道顶栏:左「短剧⇌」类型开关 + 中 推荐/精选/看过 tab + 右搜索 icon,
// 点「短剧⇌」在其正下方落一张深色下拉卡,当前项青绿)、756/f_030/f_038(短番形态同一套顶栏,
// 只是压在黑底上)、f_006/f_034(竖屏流右侧操作纵列:白色描边图标 + 计数文字)。
// 绑定纪律同 cards.tsx:本文件不含任何 transition/action id,绑定一律由页面以字面量传入。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { BindProps } from './ui';
import { IcArrowDown, IcSearch } from '../res/icons';

/* ---------- 顶栏:类型开关 + tab 行(shortdrama.home / shortdrama.kids 共用) ---------- */

export interface ShortdramaTypeHeaderProps {
  /** 当前内容类型(短剧/短番/少儿) */
  mode: string;
  /** 下拉可选类型(种子 channels.shortdrama.modes) */
  modes: readonly string[];
  /** 中间 tab 行;kids 形态只给一个「推荐」时按纯文字渲染 */
  tabs: readonly string[];
  activeTab: string;
  /** 类型下拉是否展开 */
  menuOpen: boolean;
  /** 点「短剧⇌」= typemenu.toggle */
  typeBind?: BindProps;
  /** 下拉每一项的绑定(切同类=state,切少儿/切回短剧=transition,由页面决定) */
  getModeBind?: (mode: string) => BindProps;
  /** tab 绑定;不传 = tab 行按纯文字渲染(kids 形态未申报 tab 交互) */
  getTabBind?: (tab: string) => BindProps;
  searchBind?: BindProps;
  /** 深色底(短番竖屏流形态,证据 756) */
  dark?: boolean;
  /** 类型开关下方的引导气泡(证据 758「点击切换更多内容」) */
  guideSlot?: React.ReactNode;
}

export function ShortdramaTypeHeader({
  mode,
  modes,
  tabs,
  activeTab,
  menuOpen,
  typeBind,
  getModeBind,
  getTabBind,
  searchBind,
  dark = false,
  guideSlot,
}: ShortdramaTypeHeaderProps) {
  const fg = dark ? C.darkText : C.text;
  const fgIdle = dark ? C.darkTextSub : C.textSub;
  return (
    <div className="relative shrink-0" style={{ background: dark ? C.darkBg : C.pageBg }}>
      <div className="flex items-center h-11 px-3">
        <button
          {...(typeBind ?? {})}
          className="shrink-0 flex items-center gap-0.5 bg-transparent border-none p-0 text-[15px] font-semibold"
          style={{ color: fg }}
        >
          {mode}
          {/* 真机是一枚左右箭头的「⇌」,用现有下拉箭头图标近似(res/icons 不新增) */}
          <IcArrowDown size={14} />
        </button>
        <div className="flex-1 flex items-end justify-center gap-4">
          {tabs.map((t) => {
            const active = t === activeTab;
            const cls = `bg-transparent border-none p-0 whitespace-nowrap ${
              active ? 'text-[18px] font-bold' : 'text-[15px]'
            }`;
            const style = { color: active ? fg : fgIdle };
            return getTabBind ? (
              <button key={t} {...getTabBind(t)} className={cls} style={style}>
                {t}
              </button>
            ) : (
              <span key={t} className={cls} style={style}>
                {t}
              </span>
            );
          })}
        </div>
        <button
          {...(searchBind ?? {})}
          className="shrink-0 bg-transparent border-none p-0"
          style={{ color: fg, visibility: searchBind ? 'visible' : 'hidden' }}
          aria-label="搜索"
        >
          <IcSearch size={21} />
        </button>
      </div>

      {/* 类型下拉:压在内容上方的深色小卡,当前项青绿(证据 757/f_038) */}
      {menuOpen && (
        <div
          className="absolute left-3 top-[42px] z-30 w-[86px] rounded-lg overflow-hidden py-1"
          style={{ background: '#2E2E2E' }}
        >
          {modes.map((m) => (
            <button
              key={m}
              {...(getModeBind ? getModeBind(m) : {})}
              className="w-full bg-transparent border-none py-2 text-[14px] text-center"
              style={{ color: m === mode ? C.primary : '#FFFFFF' }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {guideSlot && <div className="absolute left-3 top-[42px] z-20">{guideSlot}</div>}
    </div>
  );
}

/* ---------- 竖屏流右侧操作纵列(shortdrama.home 短番形态 / shortdrama.player 共用) ---------- */

export interface RailItem {
  key: string;
  icon: React.ReactNode;
  /** 图标下的计数/文案;缺省不渲染(种子没给数就不编) */
  label?: string;
  /** 点亮态(已赞/已关注/在追)*/
  active?: boolean;
  bind?: BindProps;
  ariaLabel: string;
}

/** 右侧操作纵列:白色图标 + 11px 白字计数,点亮态转解锁红(证据 f_006/f_034)。 */
export function SideRail({ items, className }: { items: RailItem[]; className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className ?? ''}`}>
      {items.map((it) => (
        <button
          key={it.key}
          {...(it.bind ?? {})}
          className="flex flex-col items-center gap-0.5 bg-transparent border-none p-0"
          style={{ color: it.active ? C.unlockRed : '#FFFFFF' }}
          aria-label={it.ariaLabel}
        >
          {it.icon}
          {it.label && (
            <span className="text-[11px] leading-none" style={{ color: '#FFFFFF' }}>
              {it.label}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
