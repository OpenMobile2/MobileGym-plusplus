import React, { useEffect, useRef } from 'react';
import Img from '../../components/Img';
import type { CatalogItem } from '../../types';
import HScroll from './HScroll';
import { useHorizontalSwipe } from './useHorizontalSwipe';

/**
 * 首页模块共享展示组件(纯展示,不产生任何 transition/action 绑定;
 * 绑定 id 一律由页面文件以字符串字面量创建后通过 props 传入 —— checker 铁律)。
 * 视觉基准:design-tokens.md 深色模式(页底 #000 / 卡 #1A1A1A / 主文本 #FFF / 副 #999)。
 */

export type Bind = React.HTMLAttributes<HTMLElement>;

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** 万级计数:32000 → 3.2万(en → 32.0k) */
export function fmtWan(n: number, locale: string): string {
  if (locale === 'en') return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n);
}

// ---------------------------------------------------------------- 小图标(细线性白色,design-tokens)
export function IcSearch({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function IcChevronDown({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IcMute({ muted, size = 16 }: { muted: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
      {muted ? (
        <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      ) : (
        <path d="M16.5 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

export function IcPlus({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------- 顶栏(搜索胶囊 + 加号/筛选)
export function TopSearchBar({
  avatar,
  avatarBind,
  hotword,
  hotTag,
  searchBind,
  filterBind,
  filterLabel,
  transparent = false,
  filterAsPlus = false,
}: {
  avatar: string;
  /** 左上头像点击绑定(阶段⑥走查:头像 → 我的);缺省保持纯装饰 */
  avatarBind?: Bind;
  hotword: string;
  hotTag?: string;
  searchBind: Bind;
  filterBind: Bind;
  filterLabel: string;
  transparent?: boolean;
  /** true=右侧显示加号圆钮(阶段⑥走查:筛选→加号菜单) */
  filterAsPlus?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3">
      {/* 左上头像:点击进入「我的」(阶段⑥走查修订) */}
      <div
        {...(avatarBind ?? {})}
        className={`h-9 w-9 shrink-0 overflow-hidden rounded-full ${avatarBind ? 'cursor-pointer' : ''}`}
      >
        <Img src={avatar} label="头像" ratio="square" className="h-full w-full object-cover" />
      </div>
      <div
        {...searchBind}
        className={`flex h-9 min-w-0 flex-1 cursor-pointer items-center rounded-full px-3 ${
          transparent ? 'bg-black/35 backdrop-blur-sm' : 'bg-(--app-c-chip-bg)'
        }`}
      >
        <span className={`truncate text-[13px] ${transparent ? 'text-[#CCCCCC]' : 'text-(--app-c-text-secondary)'}`}>{hotword}</span>
        {hotTag ? (
          <span className="ml-1.5 shrink-0 rounded-sm border border-[#FF6000]/70 px-1 text-[10px] leading-4 text-[#FF6000]">
            {hotTag}
          </span>
        ) : null}
        <span className={`ml-auto pl-2 ${transparent ? 'text-white' : 'text-(--app-c-text-primary)'}`}>
          <IcSearch />
        </span>
      </div>
      <button
        {...(filterBind as React.HTMLAttributes<HTMLButtonElement>)}
        aria-label={filterAsPlus ? 'add' : filterLabel}
        className={`shrink-0 cursor-pointer border-none ${transparent ? 'text-white' : 'text-(--app-c-text-primary)'} ${
          filterAsPlus
            ? `flex h-9 w-9 items-center justify-center rounded-full ${transparent ? 'bg-black/35 backdrop-blur-sm' : 'bg-(--app-c-chip-bg)'}`
            : `h-9 rounded-full px-3.5 text-[13px] ${transparent ? 'bg-black/35 backdrop-blur-sm' : 'bg-(--app-c-chip-bg)'}`
        }`}
      >
        {filterAsPlus ? <IcPlus /> : filterLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- 频道条
export interface ChannelChip {
  key: string;
  name: string;
  active: boolean;
  /** 无绑定 = 惰性展示(如当前频道/首页 chip 未在 spec 声明交互) */
  bind?: Bind;
}

export function ChannelBar({ chips, expandBind }: { chips: ChannelChip[]; expandBind: Bind }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // 当前频道自动滚入视野(幂等,StrictMode 安全)
  useEffect(() => {
    const box =
      scrollRef.current?.querySelector<HTMLElement>('[data-hscroll]') ?? scrollRef.current;
    const el = box?.querySelector<HTMLElement>('[data-active-chip="1"]');
    if (box && el) {
      const target = Math.max(0, el.offsetLeft - box.clientWidth / 2 + el.clientWidth / 2);
      box.scrollLeft = target;
    }
  }, [chips]);
  return (
    <div className="flex items-center">
      <div ref={scrollRef} className="min-w-0 flex-1">
        <HScroll id="channel-bar" className="items-center gap-4 px-3 py-1.5">
          {chips.map((c) => (
            <span
              key={c.key}
              data-active-chip={c.active ? '1' : undefined}
              {...(c.bind ?? {})}
              className={`shrink-0 whitespace-nowrap ${
                c.active
                  ? 'text-[18px] font-bold text-(--app-c-text-primary)'
                  : `text-[15px] text-(--app-c-text-muted) ${c.bind ? 'cursor-pointer' : ''}`
              }`}
            >
              {c.name}
            </span>
          ))}
        </HScroll>
      </div>
      <button
        {...(expandBind as React.HTMLAttributes<HTMLButtonElement>)}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-(--app-c-text-primary)"
        aria-label="expand"
      >
        <IcChevronDown />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- 楼层标题行
export function SectionHeader({
  title,
  moreLabel,
  moreBind,
  sub,
}: {
  title: string;
  moreLabel?: string;
  moreBind?: Bind;
  sub?: string;
}) {
  return (
    <div className="mb-2.5 flex items-baseline px-3">
      <span className="text-[18px] font-bold text-(--app-c-text-primary)">{title}</span>
      {sub ? <span className="ml-2 text-[12px] text-[#999999]">{sub}</span> : null}
      {moreLabel && moreBind ? (
        <span {...moreBind} className="ml-auto cursor-pointer text-[12px] text-[#999999]">
          {moreLabel} ›
        </span>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- 海报角标解析(design-tokens 角标体系)
interface BadgeParts {
  left?: { label: string; top?: string; cls: string };
  right?: { label: string; cls: string };
}

export function badgeParts(item: Pick<CatalogItem, 'badge'>): BadgeParts {
  const b = item.badge || '';
  const out: BadgeParts = {};
  if (!b) return out;
  const rankMatch = b.match(/^(.*榜)(TOP\d+)$/);
  if (rankMatch) {
    const hot = /热|飙/.test(rankMatch[1]);
    out.left = {
      label: rankMatch[1],
      top: rankMatch[2],
      cls: hot
        ? 'bg-gradient-to-br from-[#FF6000] to-[#D93A00] text-white'
        : 'bg-gradient-to-br from-[#0C7BFF] to-[#0A5BD6] text-white',
    };
    return out;
  }
  if (b.startsWith('豆瓣')) {
    out.left = { label: '豆瓣', top: b.slice(2), cls: 'bg-black/60 text-[#5BE28A]' };
    return out;
  }
  if (b.includes('帧享')) {
    out.right = { label: b, cls: 'bg-gradient-to-r from-[#F0D9A0] to-[#D9B36A] text-[#5C4318]' };
    return out;
  }
  if (b === 'VIP' || b.startsWith('SVIP')) {
    out.right = { label: b, cls: 'bg-black/55 text-[#E8C87E]' };
    return out;
  }
  // 独播 / 首播 / 限免中 / 付费 / 经典 / 每周五更新 / 加更礼 …
  out.right = { label: b, cls: 'bg-black/55 text-white' };
  return out;
}

/** 集数进度角标文案(右下白小字) */
export function epText(item: CatalogItem, t: TFn): string {
  if (!item.episodeCount) return '';
  if (item.channel === 'kids') return t('home.epTotalKids', { n: item.episodeCount });
  if (item.updatedTo && item.updatedTo < item.episodeCount) {
    return t('home.epUpdatedTo', { n: item.updatedTo });
  }
  return t('home.epTotal', { n: item.episodeCount });
}

// ---------------------------------------------------------------- 海报卡
export function PosterCard({
  item,
  tapBind,
  t,
  showRec = false,
  leftOverride,
  className = '',
  titleClassName = 'text-[14px]',
}: {
  item: CatalogItem;
  tapBind: Bind;
  t: TFn;
  /** 卡下是否显示一句话推荐 */
  showRec?: boolean;
  /** 左上角标覆盖(如「正在追」联动 me.library) */
  leftOverride?: string;
  className?: string;
  titleClassName?: string;
}) {
  const parts = badgeParts(item);
  const ep = epText(item, t);
  return (
    <div {...tapBind} className={`min-w-0 cursor-pointer ${className}`}>
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-(--app-c-card-bg)">
        <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
        {leftOverride ? (
          <span className="absolute left-0 top-0 rounded-br-lg bg-black/55 px-1.5 py-0.5 text-[10px] leading-4 text-white">
            {leftOverride}
          </span>
        ) : parts.left ? (
          <span className={`absolute left-0 top-0 rounded-br-lg px-1.5 py-0.5 leading-tight ${parts.left.cls}`}>
            <span className="block text-[9px]">{parts.left.label}</span>
            {parts.left.top ? <span className="block text-[10px] font-bold italic">{parts.left.top}</span> : null}
          </span>
        ) : null}
        {parts.right ? (
          <span className={`absolute right-0 top-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] leading-4 ${parts.right.cls}`}>
            {parts.right.label}
          </span>
        ) : null}
        {ep ? (
          <>
            <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-1 right-1.5 text-[10px] text-white/95">{ep}</span>
          </>
        ) : null}
      </div>
      <div className={`mt-1.5 truncate text-(--app-c-text-primary) ${titleClassName}`}>{item.title}</div>
      {showRec ? <div className="mt-0.5 truncate text-[12px] text-[#999999]">{item.recTitle}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------- 轮播(横滑 PointerEvent + 页码圆点)
export function Dots({ count, index }: { count: number; index: number }) {
  if (count < 2) return null;
  return (
    <span className="flex items-center gap-1">
      {Array.from({ length: count }, (_, i) => (
        <span
          key={i}
          className={`rounded-full ${i === index ? 'h-1 w-3 bg-white' : 'h-1 w-1 bg-white/40'}`}
        />
      ))}
    </span>
  );
}

export function Carousel({
  slides,
  index,
  onAdvance,
  className = '',
}: {
  slides: React.ReactNode[];
  index: number;
  /** dir: 1=左滑下一张,-1=右滑上一张 */
  onAdvance: (dir: 1 | -1) => void;
  className?: string;
}) {
  const swipe = useHorizontalSwipe({
    onLeft: () => onAdvance(1),
    onRight: () => onAdvance(-1),
    minDx: 40,
    respectHScroll: false,
  });
  return (
    <div data-hscroll {...swipe} className={`relative w-full overflow-hidden ${className}`}>
      <div
        className="flex h-full w-full transition-transform duration-300"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((s, i) => (
          <div key={i} className="h-full w-full shrink-0">
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 榜单排名卡(01-04 蓝斜体编号)
export function RankCard({
  item,
  rank,
  tapBind,
  t,
}: {
  item: CatalogItem;
  rank: number;
  tapBind: Bind;
  t: TFn;
}) {
  return (
    <div {...tapBind} className="w-[104px] shrink-0 cursor-pointer">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-(--app-c-card-bg)">
        <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/75 to-transparent" />
        <span className="absolute bottom-0 left-1 text-[26px] font-bold italic leading-none text-[#3D8BFF] drop-shadow">
          {String(rank).padStart(2, '0')}
        </span>
        {epText(item, t) ? (
          <span className="absolute bottom-1 right-1.5 text-[10px] text-white/95">{epText(item, t)}</span>
        ) : null}
      </div>
      <div className="mt-1.5 truncate text-[13px] text-(--app-c-text-primary)">{item.title}</div>
    </div>
  );
}
