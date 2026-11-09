// apps/Tencentvideo/components/cards.tsx —— 首页/频道页卡片族。
// 证据:832 双列横版卡(16:9 缩略图 + 角标 + 推荐语 + ⋮ 负反馈 + 榜单chip)、
// 827 信息流大卡(通栏预览 + 小海报 + 追按钮 + × + 在追数 + chip 行)、
// 832/827 顶部沉浸搜索条 + 频道 tab 横滑。
// 绑定纪律:组件自身不绑任何 id;整卡绑定由页面以 `bind` 传入,卡内子控件(⋮ / × / 追 / chip)
// 由页面各自传入并自带 stopPropagation,避免冒泡到整卡(硬规则2/8)。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { TvContent } from '../types';
import { TvImg } from './Img';
import { Badge, BindProps } from './ui';
import { IcArrowRight, IcMoreVertical, IcClose, IcSearch, IcArrowDown, IcGamepad } from '../res/icons';

/* ---------- 通用小件 ---------- */

/** 榜单 chip(米黄底棕橙字 + ›)。证据 832「电影热播榜第1名 ›」/ 827「电视剧热播榜第2名 ›」 */
export function RankChip({
  text,
  bind,
}: {
  text: string;
  bind?: BindProps;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-[3px] rounded border-none text-[11px] leading-none max-w-full"
      style={{ background: C.rankChipBg, color: C.rankChipText }}
    >
      <span className="truncate">{text}</span>
      <IcArrowRight size={10} />
    </button>
  );
}

/** 灰底信息 chip(「讨论破1000万 ›」「萤火单元」)。证据 827 */
export function InfoChip({
  text,
  bind,
  arrow = false,
}: {
  text: string;
  bind?: BindProps;
  arrow?: boolean;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="inline-flex items-center gap-0.5 shrink-0 px-1.5 py-[3px] rounded border-none text-[11px] leading-none max-w-full"
      style={{ background: C.chipGray, color: C.textSub }}
    >
      <span className="truncate">{text}</span>
      {arrow && <IcArrowRight size={10} />}
    </button>
  );
}

/**
 * 追剧胶囊。未追 = 白底 + 细灰描边 + 黑字「＋追」;已追 = 灰底 #D2D2D4 + 灰字「在追」
 * (design-tokens §三·按钮)。文案由页面传入以走双语。
 */
export function ChasePill({
  chasing,
  label,
  bind,
}: {
  chasing: boolean;
  label: string;
  bind?: BindProps;
}) {
  return (
    <button
      {...(bind ?? {})}
      className="shrink-0 inline-flex items-center justify-center gap-0.5 px-3 h-[26px] rounded-full text-[12px] leading-none"
      style={
        chasing
          ? { background: C.divider, color: C.textTertiary, border: 'none' }
          : { background: C.pageBg, color: C.text, border: `1px solid ${C.divider}` }
      }
    >
      {!chasing && <span className="text-[13px] leading-none">＋</span>}
      {label}
    </button>
  );
}

/* ---------- 横版双列卡(832) ---------- */

/** 横版卡右下角信息:多集内容给更新进度,单片给评分(证据 832)。 */
export function landscapeCornerNote(content: TvContent): string {
  if (content.episodes && content.episodes > 1) {
    return content.updatedTo && content.updatedTo < content.episodes
      ? `更新至${content.updatedTo}集`
      : `全${content.episodes}集`;
  }
  return '';
}

export interface LandscapeCardProps {
  content: TvContent;
  /** 整卡进详情的绑定(页面字面量绑定) */
  bind?: BindProps;
  /** ⋮ 负反馈绑定(页面需自带 stopPropagation) */
  moreBind?: BindProps;
  /** 推荐语行;缺省用 content.recommend → 卡司+题材 */
  subtitle?: React.ReactNode;
  /** 图右下角文案;缺省 landscapeCornerNote */
  cornerNote?: string;
  /** 图右下角大号评分(影片卡:832「9.3」「8.8」) */
  ratingCorner?: boolean;
  /** 标题下的榜单/信息 chip 行 */
  chips?: React.ReactNode;
  dark?: boolean;
  className?: string;
}

/** 双列横版剧卡(16:9)。证据 832:图上左「最近在看」/右上角标/右下更新进度或评分。 */
export function LandscapeCard({
  content,
  bind,
  moreBind,
  subtitle,
  cornerNote,
  ratingCorner = false,
  chips,
  dark = false,
  className,
}: LandscapeCardProps) {
  const watching = typeof content.watchingNote === 'string' ? content.watchingNote : '';
  const note = cornerNote === undefined ? landscapeCornerNote(content) : cornerNote;
  const sub =
    subtitle === undefined
      ? typeof content.recommend === 'string'
        ? content.recommend
        : content.tags.join(' ')
      : subtitle;
  return (
    <div className={`flex flex-col min-w-0 ${className ?? ''}`}>
      <div {...(bind ?? {})} className="flex flex-col min-w-0 cursor-pointer">
        <div className="relative w-full aspect-video rounded-lg overflow-hidden">
          <TvImg
            id={content.still ?? content.poster}
            alt={content.title}
            className="w-full h-full object-cover"
          />
          {watching && (
            <span
              className="absolute top-0 left-0 px-1.5 py-[2px] text-[10px] leading-[14px] text-white rounded-br-[6px]"
              style={{ background: C.maskBadge }}
            >
              {watching}
            </span>
          )}
          {content.badge && (
            <div className="absolute top-0 right-0">
              <Badge
                text={content.badge}
                className="rounded-none rounded-bl-[6px] rounded-tr-[8px]"
              />
            </div>
          )}
          {ratingCorner && typeof content.rating === 'number' && Number.isFinite(content.rating) ? (
            <div
              className="absolute bottom-0 inset-x-0 px-1.5 pb-0.5 pt-4 text-right text-white text-[15px] font-semibold leading-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
            >
              {content.rating.toFixed(1)}
            </div>
          ) : (
            note && (
              <div
                className="absolute bottom-0 inset-x-0 px-1.5 pb-0.5 pt-4 text-right text-white text-[10px] leading-none"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
              >
                {note}
              </div>
            )
          )}
        </div>
        <div
          className="mt-1.5 text-[15px] font-semibold truncate"
          style={{ color: dark ? C.darkText : C.text }}
        >
          {content.title}
        </div>
      </div>
      <div className="flex items-center gap-1 mt-0.5">
        <div
          className="flex-1 min-w-0 text-[12px] truncate"
          style={{ color: dark ? C.darkTextSub : C.textSub }}
        >
          {sub}
        </div>
        {moreBind && (
          <button
            {...moreBind}
            className="shrink-0 bg-transparent border-none p-0 leading-none"
            style={{ color: dark ? C.darkTextSub : C.textSub }}
            aria-label="更多"
          >
            <IcMoreVertical size={14} />
          </button>
        )}
      </div>
      {chips && <div className="flex items-center gap-1.5 mt-1 overflow-hidden">{chips}</div>}
    </div>
  );
}

/* ---------- 信息流大卡(827) ---------- */

export interface FeedBigCardProps {
  content: TvContent;
  /** 整卡进详情 */
  bind?: BindProps;
  /** 「追/在追」胶囊(页面自带 stopPropagation) */
  chaseSlot?: React.ReactNode;
  /** 「×」关闭卡(页面自带 stopPropagation) */
  closeBind?: BindProps;
  /** 右下角在追人数文案(如「522万在追」) */
  countText?: string;
  /** 底部 chip 行(榜单chip / 讨论chip) */
  chips?: React.ReactNode;
  className?: string;
}

/**
 * 信息流通栏大卡。证据 827:通栏 16:9 预览(带静音标)+ 小海报缩略 + 片名 +
 * 卡司·题材行 + 右侧追按钮与在追数 + × + 底部 chip 行。
 */
export function FeedBigCard({
  content,
  bind,
  chaseSlot,
  closeBind,
  countText,
  chips,
  className,
}: FeedBigCardProps) {
  const castLine = [
    ...(content.cast ?? []).slice(0, 2).map((m) => m.name),
    ...content.tags,
  ].join(' ');
  return (
    <div className={`flex flex-col ${className ?? ''}`}>
      <div {...(bind ?? {})} className="relative w-full aspect-video overflow-hidden cursor-pointer">
        <TvImg
          id={content.still ?? content.poster}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        <span
          className="absolute bottom-1.5 right-1.5 px-1 py-[1px] rounded text-[10px] leading-[14px] text-white"
          style={{ background: C.maskBadge }}
        >
          🔇
        </span>
      </div>
      <div className="flex items-start gap-2 px-3 pt-2">
        <div {...(bind ?? {})} className="shrink-0 w-8 h-11 rounded overflow-hidden cursor-pointer">
          <TvImg id={content.poster} alt={content.title} className="w-full h-full object-cover" />
        </div>
        <div {...(bind ?? {})} className="flex-1 min-w-0 cursor-pointer">
          <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
            {content.title}
          </div>
          <div className="text-[12px] truncate mt-0.5" style={{ color: C.textSub }}>
            {castLine}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1">
          {chaseSlot}
          {countText && (
            <span className="text-[11px] leading-none" style={{ color: C.textSub }}>
              {countText}
            </span>
          )}
        </div>
        {closeBind && (
          <button
            {...closeBind}
            className="shrink-0 bg-transparent border-none p-0 mt-0.5"
            style={{ color: C.textSub }}
            aria-label="关闭"
          >
            <IcClose size={16} />
          </button>
        )}
      </div>
      {chips && <div className="flex items-center gap-1.5 px-3 mt-1.5 overflow-hidden">{chips}</div>}
    </div>
  );
}

/* ---------- 顶部搜索条 + 频道 tab(832/827) ---------- */

export interface ChannelHeaderProps {
  placeholder: string;
  /** 频道 tab 文案列表 */
  tabs: readonly string[];
  activeTab: string;
  /** 页面提供:每个 tab 的字面量绑定 */
  getTabBind: (tab: string, index: number) => BindProps;
  searchBind?: BindProps;
  filterLabel: string;
  filterBind?: BindProps;
  /** 右侧游戏手柄(wontfix) */
  gamepadBind?: BindProps;
  /** 「∨」展开全部频道 */
  expandBind?: BindProps;
  /**
   * 沉浸态:未滚动时顶部透白字 + banner 取色渐变底(832);
   * 滚动后转浅色实底 + 黑字(827)。
   */
  immersive?: boolean;
  /** 沉浸底色(取自当前频道 banner 主色) */
  themeColor?: string;
  /** 运营高亮 tab(832「少儿」金色) */
  highlightTab?: string;
}

/**
 * 频道头:搜索条 + 频道 tab 横滑。沉浸态白字压在 banner 取色渐变上(832),
 * 滚动态转白底黑字(827)。
 */
export function ChannelHeader({
  placeholder,
  tabs,
  activeTab,
  getTabBind,
  searchBind,
  filterLabel,
  filterBind,
  gamepadBind,
  expandBind,
  immersive = false,
  themeColor = '#8C3A3A',
  highlightTab,
}: ChannelHeaderProps) {
  const fg = immersive ? '#FFFFFF' : C.text;
  const fgIdle = immersive ? 'rgba(255,255,255,0.82)' : C.textSub;
  return (
    <div
      className="shrink-0 pt-1"
      style={
        immersive
          ? {
            // 搜索条 + tab 行都压在实色上,只在最后一段淡出到 banner(832 顶部红色饱和度较高)
            background: `linear-gradient(to bottom, ${themeColor} 0%, ${themeColor} 68%, ${themeColor}00 100%)`,
          }
          : { background: C.pageBg }
      }
    >
      {/* 搜索条 */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div
          className="flex-1 min-w-0 flex items-center h-8 rounded-full px-2.5"
          style={{ background: immersive ? 'rgba(255,255,255,0.22)' : C.chipGray }}
        >
          <button
            {...(searchBind ?? {})}
            className="flex-1 min-w-0 flex items-center gap-1.5 bg-transparent border-none p-0 text-left"
            style={{ color: fg }}
          >
            <IcSearch size={14} />
            <span className="text-[13px] truncate" style={{ color: fgIdle }}>
              {placeholder}
            </span>
          </button>
          <span className="mx-1.5 w-px h-3.5" style={{ background: fgIdle, opacity: 0.5 }} />
          <button
            {...(filterBind ?? {})}
            className="shrink-0 bg-transparent border-none p-0 text-[13px]"
            style={{ color: fg }}
          >
            {filterLabel}
          </button>
        </div>
        {gamepadBind && (
          <button
            {...gamepadBind}
            className="shrink-0 bg-transparent border-none p-0"
            style={{ color: fg }}
            aria-label="游戏中心"
          >
            <IcGamepad size={20} />
          </button>
        )}
      </div>
      {/* 频道 tab */}
      <div className="flex items-center">
        <div
          className="flex-1 min-w-0 flex items-end gap-3.5 overflow-x-auto px-3 pb-1.5 scrollbar-none"
          data-scroll-container="channels"
          data-scroll-direction="horizontal"
        >
          {tabs.map((t, i) => {
            const active = t === activeTab;
            const gold = t === highlightTab && !active;
            return (
              <button
                key={t}
                {...getTabBind(t, i)}
                className={`shrink-0 bg-transparent border-none p-0 whitespace-nowrap ${
                  active ? 'text-[19px] font-bold' : 'text-[15px]'
                }`}
                style={{ color: active ? fg : gold ? C.vipBadgeBg : fgIdle }}
              >
                {t}
              </button>
            );
          })}
        </div>
        {expandBind && (
          <button
            {...expandBind}
            className="shrink-0 bg-transparent border-none px-2 pb-1.5"
            style={{ color: fg }}
            aria-label="展开全部频道"
          >
            <IcArrowDown size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
