// apps/Tencentvideo/components/detail.tsx —— 详情族(剧集/电影/剧场版/体育)共用积木。
// 视觉证据:824(剧集形态:黑底播放器 + 黑金运营条 + 7 个 tab + 5 键操作行 + 集数 chips)、
// 845(综艺形态:2 个 tab + 季横滑 + 子 tab + 期卡)、825(VIP 金框提示)、826(功能搬家引导气泡)。
// 组件不自带 actionId/transitionId:所有绑定由页面字面量传入(硬规则8)。
import React from 'react';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { TV_COLORS as C } from '../constants';
import type { TvContent } from '../types';
import { TvImg } from './Img';
import { Badge, BindProps } from './ui';
import {
  IcArrowRight, IcClose, IcDanmaku, IcFullscreen, IcHeat, IcMute, IcNavBack,
  IcPlay, IcPause, IcShare, IcTv, IcMore,
} from '../res/icons';
import { fmtTime } from './PlayerCore';

/* ---------- 播放器顶部悬浮行 ---------- */

/**
 * 播放器顶部悬浮行:返回 / 升级SVIP 金胶囊 / TV投屏 / 分享 / 更多。
 * 五个绑定都由页面传入 —— 同一排 icon 在详情页与竖屏/全屏播放器走不同 transition。
 */
export function PlayerTopBar({
  backBind,
  svipLabel,
  svipBind,
  castBind,
  shareBind,
  moreBind,
  vipNote,
  castSlot,
}: {
  backBind?: BindProps;
  svipLabel: string;
  svipBind?: BindProps;
  castBind?: BindProps;
  shareBind?: BindProps;
  moreBind?: BindProps;
  /** 播 VIP 集时顶栏让位给金框提示,右侧 icon 组整体隐藏(证据 825) */
  vipNote?: string;
  /** 覆写投屏位(音频播放模式下这里是「退出音频播放」,证据 821) */
  castSlot?: React.ReactNode;
}) {
  const s = useTencentvideoStrings();
  if (vipNote) {
    return (
      <div className="flex items-center gap-1 px-2 h-11 text-white">
        <button {...(backBind ?? {})} className="bg-transparent border-none p-1 text-white" aria-label={s.back}>
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 flex justify-center min-w-0">
          <div
            className="rounded-full border px-3 py-[3px] text-[11px] whitespace-nowrap"
            style={{ borderColor: C.vipBadgeBg, color: C.vipBadgeBg, background: 'rgba(0,0,0,0.35)' }}
          >
            {vipNote}
          </div>
        </div>
        <div className="w-[22px] shrink-0" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-2 h-11 text-white">
      <button {...(backBind ?? {})} className="bg-transparent border-none p-1 text-white" aria-label={s.back}>
        <IcNavBack size={22} />
      </button>
      <div className="flex-1 flex justify-center">
        <button
          {...(svipBind ?? {})}
          className="rounded-full px-3 py-1 border-none text-[12px] font-semibold"
          style={{ background: C.svipCapsule, color: C.goldBtnText }}
        >
          {svipLabel}
        </button>
      </div>
      {castSlot ?? (
        <button {...(castBind ?? {})} className="bg-transparent border-none p-1 text-white" aria-label={s.detailCast}>
          <IcTv size={19} />
        </button>
      )}
      <button {...(shareBind ?? {})} className="bg-transparent border-none p-1 text-white" aria-label={s.share}>
        <IcShare size={18} />
      </button>
      <button {...(moreBind ?? {})} className="bg-transparent border-none p-1 text-white" aria-label={s.more}>
        <IcMore size={20} />
      </button>
    </div>
  );
}

/* ---------- 播放器底部控件行 ---------- */

/**
 * 竖屏控件行:播放键 + 已播时间 + 进度条 + 总时长 + 弹幕「弹」+ 横竖屏切换。
 * progressSlot 由页面塞入(详情页是只读展示条,竖屏播放页是可拖 ProgressBar)。
 */
export function PortraitControlRow({
  playing,
  positionSec,
  durationSec,
  playBind,
  progressSlot,
  danmakuOn,
  danmakuBind,
  fullscreenBind,
  extraSlot,
}: {
  playing: boolean;
  positionSec: number;
  durationSec: number;
  playBind?: BindProps;
  progressSlot: React.ReactNode;
  danmakuOn: boolean;
  danmakuBind?: BindProps;
  fullscreenBind?: BindProps;
  extraSlot?: React.ReactNode;
}) {
  const s = useTencentvideoStrings();
  return (
    <div className="flex items-center gap-2 px-2.5 pb-1.5 text-white">
      <button {...(playBind ?? {})} className="bg-transparent border-none p-0.5 text-white" aria-label={playing ? s.pause : s.play}>
        {playing ? <IcPause size={20} /> : <IcPlay size={20} />}
      </button>
      <span className="text-[11px] tabular-nums shrink-0">{fmtTime(positionSec)}</span>
      <div className="flex-1 min-w-0">{progressSlot}</div>
      <span className="text-[11px] tabular-nums shrink-0">{fmtTime(durationSec)}</span>
      <button
        {...(danmakuBind ?? {})}
        className="shrink-0 relative rounded-[4px] border px-1 py-[1px] text-[11px] leading-[13px] bg-transparent"
        style={{ borderColor: 'rgba(255,255,255,0.7)', color: '#FFFFFF' }}
        aria-label={s.danmaku}
      >
        弹
        {danmakuOn && (
          <span
            className="absolute -top-[2px] -right-[2px] w-1.5 h-1.5 rounded-full"
            style={{ background: C.primary }}
          />
        )}
      </button>
      {extraSlot}
      <button
        {...(fullscreenBind ?? {})}
        className="shrink-0 bg-transparent border-none p-0.5 text-white"
        aria-label={s.fullscreen}
      >
        <IcFullscreen size={17} />
      </button>
    </div>
  );
}

/* ---------- 贴片广告浮层(已暂停态) ---------- */

/** 暂停时的贴片广告:内嵌小画面 + 「广告×」+ 中央「⏸ 已暂停」+「了解详情」(证据 824)。 */
export function PausedAdOverlay({
  img,
  badge,
  pausedLabel,
  buttonLabel,
  closeBind,
  ctaBind,
  subtitle,
}: {
  img?: string;
  badge: string;
  pausedLabel: string;
  buttonLabel: string;
  closeBind?: BindProps;
  ctaBind?: BindProps;
  subtitle?: string;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[58%] aspect-video rounded-[3px] overflow-hidden">
        <TvImg id={img} alt={badge} className="w-full h-full object-cover" />
        <button
          {...(closeBind ?? {})}
          className="absolute top-1 right-1 flex items-center gap-0.5 rounded-[3px] border-none px-1 py-[1px] text-[10px] text-white"
          style={{ background: C.maskBadge }}
        >
          {badge}
          <IcClose size={10} />
        </button>
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-white text-[13px] font-medium"
            style={{ background: C.toastBg }}
          >
            <IcPause size={15} />
            {pausedLabel}
          </div>
        </div>
        <button
          {...(ctaBind ?? {})}
          className="absolute bottom-1 right-1 rounded-[3px] border-none px-1.5 py-[2px] text-[10px] text-white"
          style={{ background: C.maskBadge }}
        >
          {buttonLabel}
        </button>
        <div className="absolute bottom-1 left-1 text-white/80">
          <IcMute size={12} />
        </div>
      </div>
      {subtitle && (
        <div className="absolute bottom-1 inset-x-0 text-center text-[11px] text-white/85 px-4 truncate">
          {subtitle}
        </div>
      )}
    </div>
  );
}

/* ---------- 黑金运营条 ---------- */

/** 运营条:黑底浅金两行文案 + 右侧金色 CTA(证据 824/845)。 */
export function OpBanner({
  title,
  sub,
  button,
  bind,
  buttonBind,
}: {
  title: string;
  sub: string;
  button: string;
  bind?: BindProps;
  buttonBind?: BindProps;
}) {
  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 py-2"
      style={{ background: C.svipBarBg }}
    >
      <div className="flex-1 min-w-0" {...(bind ?? {})}>
        <div className="text-[14px] font-medium truncate" style={{ color: C.svipBarText }}>
          {title}
        </div>
        <div className="flex items-center text-[11px] mt-0.5" style={{ color: C.svipBarText, opacity: 0.75 }}>
          <span className="truncate">{sub}</span>
          <IcArrowRight size={12} />
        </div>
      </div>
      <button
        {...(buttonBind ?? {})}
        className="shrink-0 rounded-full border-none px-4 py-1.5 text-[13px] font-semibold"
        style={{
          background: `linear-gradient(to bottom, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
          color: C.goldBtnText,
        }}
      >
        {button}
      </button>
    </div>
  );
}

/* ---------- 详情 tab 行 ---------- */

/** tab 行:选中项加粗放大,可带红色右上角标(「千万+」「2万+」)。 */
export function DetailTabRow({
  tabs,
  activeTab,
  badges,
  getTabBind,
}: {
  tabs: readonly string[];
  activeTab: string;
  /** tab 名 → 右上角标文案 */
  badges?: Record<string, string | undefined>;
  getTabBind: (tab: string, index: number) => BindProps;
}) {
  return (
    <div
      className="flex items-end gap-4 overflow-x-auto px-3 pt-3 pb-2 scrollbar-none"
      data-scroll-container="detailTabs"
      data-scroll-direction="horizontal"
    >
      {tabs.map((t, i) => {
        const active = t === activeTab;
        const badge = badges?.[t];
        return (
          <button
            key={t}
            {...getTabBind(t, i)}
            className={`shrink-0 relative bg-transparent border-none p-0 whitespace-nowrap ${
              active ? 'text-[18px] font-bold' : 'text-[16px]'
            }`}
            style={{ color: active ? C.text : C.textSub }}
          >
            {t}
            {badge && (
              <span
                className="absolute -top-1.5 -right-3 text-[9px] font-semibold leading-none"
                style={{ color: C.redDot }}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- 标题 + 徽标行 ---------- */

function InfoOrButtonChip({ text, bind }: { text: string; bind?: BindProps }) {
  const cls = 'shrink-0 rounded-[4px] border-none px-2 py-1 text-[12px]';
  const style = { background: C.chipGray, color: C.text };
  if (!bind) {
    return <span className={cls} style={style}>{text}</span>;
  }
  return <button {...bind} className={cls} style={style}>{text}</button>;
}

/** 标题区:片名 +「简介 ›」;下面一行 评分/豆瓣/热度/榜单chip/题材chip(证据 824/845)。 */
export function DetailTitleBlock({
  title,
  introLabel,
  introBind,
  rating,
  doubanRating,
  heat,
  rankNote,
  rankBind,
  genre,
  genreBind,
}: {
  title: string;
  introLabel: string;
  introBind?: BindProps;
  rating?: number;
  doubanRating?: number;
  heat?: number;
  rankNote?: string;
  rankBind?: BindProps;
  genre?: string;
  genreBind?: BindProps;
}) {
  // NaN / Infinity 不渲染,避免详情顶栏出现「NaN分」
  const safeRating = typeof rating === 'number' && Number.isFinite(rating) ? rating : undefined;
  const safeDouban =
    typeof doubanRating === 'number' && Number.isFinite(doubanRating) ? doubanRating : undefined;
  const safeHeat = typeof heat === 'number' && Number.isFinite(heat) ? heat : undefined;

  return (
    <div className="px-3">
      <div className="flex items-baseline gap-1.5">
        <span className="text-[21px] font-bold leading-tight" style={{ color: C.text }}>
          {title}
        </span>
        <button
          {...(introBind ?? {})}
          className="flex items-center bg-transparent border-none p-0 text-[13px] shrink-0"
          style={{ color: C.textSub }}
        >
          {introLabel}
          <IcArrowRight size={13} />
        </button>
      </div>
      <div
        className="flex items-center gap-2.5 mt-2 overflow-x-auto scrollbar-none"
        data-scroll-container="detailBadges"
        data-scroll-direction="horizontal"
      >
        {safeRating !== undefined && (
          <span className="shrink-0 text-[15px] font-bold" style={{ color: C.text }}>
            {safeRating.toFixed(1)}
            <span className="text-[11px] font-normal">分</span>
          </span>
        )}
        {safeDouban !== undefined && (
          <span className="shrink-0 text-[12px]" style={{ color: C.textSub }}>
            豆瓣 <b className="text-[14px]" style={{ color: C.text }}>{safeDouban.toFixed(1)}</b>分
          </span>
        )}
        {safeHeat !== undefined && (
          <span className="shrink-0 flex items-center gap-0.5 text-[12px]" style={{ color: C.textSub }}>
            <IcHeat size={12} />
            {safeHeat}
          </span>
        )}
        {/* 榜单/题材 chip:824 上没有「›」,spec 也没给它们建 transition —— 无绑定时渲染为纯标签,
            不做成假按钮(避免「可见可点但点了没反应」) */}
        {rankNote && <InfoOrButtonChip text={rankNote} bind={rankBind} />}
        {genre && <InfoOrButtonChip text={genre} bind={genreBind} />}
      </div>
    </div>
  );
}

/* ---------- 5 键操作行 ---------- */

export interface DetailActionItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  /** 选中态(已推荐/已追)走品牌青绿 */
  active?: boolean;
  /** 置灰不可用(体育详情的「下载」) */
  disabled?: boolean;
  bind?: BindProps;
}

/** 操作行:图标在上、文案在下,均分 5 列。选中态整列变青绿(证据 825 已推荐/已追)。 */
export function DetailActionRow({
  items,
  guideSlot,
}: {
  items: DetailActionItem[];
  /** 功能搬家引导气泡(证据 826),由页面按 ui 态传入 */
  guideSlot?: React.ReactNode;
}) {
  return (
    <div className="relative px-3 pt-4 pb-1">
      <div className="flex items-start">
        {items.map((it) => {
          const color = it.active ? C.primary : it.disabled ? C.divider : C.text;
          return (
            <button
              key={it.key}
              {...(it.bind ?? {})}
              className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none p-0"
              style={{ color }}
            >
              {it.icon}
              <span className="text-[11px]" style={{ color: it.active ? C.primary : it.disabled ? C.divider : C.textSub }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
      {guideSlot}
    </div>
  );
}

/**
 * 功能搬家引导气泡:深灰圆角浮层 + 顶部朝上小箭头(指向「下载」列)+ 青绿「我知道了」(证据 826)。
 * arrowLeftPct = 箭头水平位置百分比,让它对准第 N 列。
 */
export function DetailGuideBubble({
  icons,
  text,
  text2,
  button,
  buttonBind,
  arrowLeftPct = 50,
}: {
  icons: React.ReactNode[];
  text: string;
  text2: string;
  button: string;
  buttonBind?: BindProps;
  arrowLeftPct?: number;
}) {
  return (
    <div className="absolute left-3 right-3 top-full -mt-1 z-30 pointer-events-none">
      <div
        className="absolute -top-[6px] w-0 h-0"
        style={{
          left: `calc(${arrowLeftPct}% - 6px)`,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderBottom: '7px solid rgba(90,90,90,0.96)',
        }}
      />
      <div className="rounded-xl px-4 py-4" style={{ background: 'rgba(90,90,90,0.96)' }}>
        <div className="flex items-center justify-between text-white px-1">
          {icons.map((ic, i) => (
            <span key={i}>{ic}</span>
          ))}
        </div>
        <div className="mt-3 text-center text-[13px] text-white leading-6">
          <div>{text}</div>
          <div>{text2}</div>
        </div>
        <div className="mt-3 flex justify-center">
          <button
            {...(buttonBind ?? {})}
            className="pointer-events-auto rounded-full border-none px-6 py-1.5 text-[14px] text-white"
            style={{ background: C.primary }}
          >
            {button}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 选集:集数 chips ---------- */

/** 集数 chip 横滑区:VIP 集带金角标,正在播放集青绿底 + 青绿字(证据 824)。 */
export function EpisodeNumberChips({
  episodes,
  currentEpisode,
  vipFrom,
  getBind,
  dark = false,
  wrap = false,
}: {
  episodes: number[];
  currentEpisode: number;
  vipFrom?: number;
  getBind: (episode: number, isVip: boolean) => BindProps;
  dark?: boolean;
  /** 横屏选集面板是多行宫格(证据 ba6ce3@30),详情页是单行横滑(证据 824) */
  wrap?: boolean;
}) {
  return (
    <div
      className={
        wrap
          ? 'flex flex-wrap gap-2 px-3 pb-1'
          : 'flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none'
      }
      data-scroll-container="episodes"
      data-scroll-direction={wrap ? 'vertical' : 'horizontal'}
    >
      {episodes.map((ep) => {
        const isVip = vipFrom !== undefined && ep >= vipFrom;
        const active = ep === currentEpisode;
        return (
          <button
            key={ep}
            {...getBind(ep, isVip)}
            className="relative shrink-0 w-[62px] h-[52px] rounded-md border-none flex items-center justify-center text-[16px]"
            style={{
              background: active
                ? dark
                  ? 'rgba(6,191,184,0.20)'
                  : C.primaryBg
                : dark
                  ? 'rgba(255,255,255,0.12)'
                  : C.chipGray,
              color: active ? C.primary : dark ? C.darkText : C.text,
            }}
          >
            {ep}
            {isVip && (
              <span className="absolute top-0 right-0">
                <Badge text="VIP" variant="vip" className="rounded-none rounded-bl-[4px] rounded-tr-[6px]" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- 选集:综艺期卡 ---------- */

export interface EpisodeCardItem {
  episode: number;
  title: string;
  dateText: string;
  vip?: boolean;
  still?: string;
}

/** 综艺期卡横滑:16:9 剧照 + VIP 角标 + 右下日期 + 正在播放胶囊 + 两行标题(证据 845)。 */
export function EpisodeCardRow({
  items,
  currentEpisode,
  playingLabel,
  getBind,
  dark = false,
  compact = false,
}: {
  items: EpisodeCardItem[];
  currentEpisode: number;
  playingLabel: string;
  getBind: (item: EpisodeCardItem) => BindProps;
  dark?: boolean;
  /** 横屏选集面板里的卡更窄(证据 853 一屏 6 张),详情页是 164(证据 845 一屏 3 张半) */
  compact?: boolean;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none"
      data-scroll-container="episodeCards"
      data-scroll-direction="horizontal"
    >
      {items.map((it) => {
        const active = it.episode === currentEpisode;
        return (
          <div key={it.episode} className={`shrink-0 ${compact ? 'w-[122px]' : 'w-[164px]'}`} {...getBind(it)}>
            <div className="relative rounded-md overflow-hidden aspect-video">
              <TvImg id={it.still} alt={it.title} className="w-full h-full object-cover" />
              {it.vip && (
                <div className="absolute top-0 right-0">
                  <Badge text="VIP" variant="vip" className="rounded-none rounded-bl-[4px] rounded-tr-[6px]" />
                </div>
              )}
              {active && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="rounded-[3px] px-1.5 py-[2px] text-[11px] text-white"
                    style={{ background: C.toastBg }}
                  >
                    {playingLabel}
                  </span>
                </div>
              )}
              <span className="absolute bottom-1 right-1.5 text-[10px] text-white/90">{it.dateText}</span>
            </div>
            <div
              className="mt-1.5 text-[12px] leading-[17px] line-clamp-2"
              style={{ color: active ? C.primary : dark ? C.darkText : C.text }}
            >
              {it.title}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- 广告卡 ---------- */

/** 信息流式广告卡:左图右文 + 「广告」角标 + 「了解详情」按钮(证据 824)。 */
export function DetailAdCard({
  img,
  badge,
  title,
  button,
  bind,
}: {
  img?: string;
  badge: string;
  title: string;
  button: string;
  bind?: BindProps;
}) {
  return (
    <div className="mx-3 mt-4 rounded-lg overflow-hidden flex" style={{ background: C.chipGray }} {...(bind ?? {})}>
      <div className="relative w-[52%] shrink-0 aspect-[16/10]">
        <TvImg id={img} alt={badge} className="w-full h-full object-cover" />
        <span
          className="absolute top-1 right-1 rounded-[3px] px-1 text-[10px] text-white"
          style={{ background: C.maskBadge }}
        >
          {badge}
        </span>
      </div>
      <div className="flex-1 min-w-0 p-2 flex flex-col justify-between">
        <div className="text-[12px] leading-[17px] line-clamp-3" style={{ color: C.text }}>
          {title}
        </div>
        <span
          className="self-start rounded-full px-2.5 py-1 text-[11px] mt-1"
          style={{ background: C.primaryBg, color: C.primary }}
        >
          {button}
        </span>
      </div>
    </div>
  );
}

/* ---------- 演职员 ---------- */

/** 演职员横滑:圆形头像 + 姓名 + 角色名。头像点击进演员页(绑定由页面传入)。 */
export function CastRow({
  cast,
  avatarOf,
  getBind,
}: {
  cast: { name: string; role?: string }[];
  avatarOf: (name: string, index: number) => string | undefined;
  getBind: (name: string, index: number) => BindProps;
}) {
  return (
    <div
      className="flex gap-4 overflow-x-auto px-3 pb-1 scrollbar-none"
      data-scroll-container="cast"
      data-scroll-direction="horizontal"
    >
      {cast.map((m, i) => (
        <button
          key={m.name}
          {...getBind(m.name, i)}
          className="shrink-0 w-[64px] flex flex-col items-center bg-transparent border-none p-0"
        >
          <div className="w-14 h-14 rounded-full overflow-hidden">
            <TvImg id={avatarOf(m.name, i)} alt={m.name} className="w-full h-full object-cover" />
          </div>
          <div className="mt-1 text-[12px] truncate w-full text-center" style={{ color: C.text }}>
            {m.name}
          </div>
          {m.role && (
            <div className="text-[11px] truncate w-full text-center" style={{ color: C.textSub }}>
              {m.role}
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- 推荐楼层 ---------- */

/** 推荐楼层:子栏目 tab 行(选中加粗)+ 右侧「›」+ 海报横滑区(卡片由页面传入)。 */
export function RecommendFloor({
  tabs,
  activeTab,
  getTabBind,
  moreBind,
  children,
}: {
  tabs: readonly string[];
  activeTab: string;
  getTabBind: (tab: string, index: number) => BindProps;
  moreBind?: BindProps;
  children: React.ReactNode;
}) {
  const str = useTencentvideoStrings();
  return (
    <div className="pt-4">
      <div className="flex items-center px-3 pb-2">
        <div
          className="flex-1 min-w-0 flex items-baseline gap-4 overflow-x-auto scrollbar-none"
          data-scroll-container="recommendTabs"
          data-scroll-direction="horizontal"
        >
          {tabs.map((t, i) => {
            const active = t === activeTab;
            return (
              <button
                key={t}
                {...getTabBind(t, i)}
                className={`shrink-0 bg-transparent border-none p-0 whitespace-nowrap ${
                  active ? 'text-[17px] font-bold' : 'text-[15px]'
                }`}
                style={{ color: active ? C.text : C.textSub }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <button
          {...(moreBind ?? {})}
          className="shrink-0 bg-transparent border-none pl-2"
          style={{ color: C.textSub }}
          aria-label={str.moreRecommend}
        >
          <IcArrowRight size={18} />
        </button>
      </div>
      {children}
    </div>
  );
}

/* ---------- 评论区入口 ---------- */

/** 评论区入口条:头像 + 输入框占位 +「查看全部评论 ›」(证据 806)。 */
export function CommentEntryRow({
  avatar,
  placeholder,
  moreLabel,
  totalText,
  bind,
  moreBind,
  value,
  onChangeValue,
  submitBind,
}: {
  avatar?: string;
  placeholder: string;
  moreLabel: string;
  totalText?: string;
  bind?: BindProps;
  moreBind?: BindProps;
  value?: string;
  onChangeValue?: (v: string) => void;
  submitBind?: BindProps;
}) {
  const s = useTencentvideoStrings();
  const editable = value !== undefined && onChangeValue !== undefined;
  return (
    <div className="px-3 pt-4" data-keep-keyboard={editable ? 'true' : undefined}>
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
          <TvImg id={avatar} alt="我" className="w-full h-full object-cover" />
        </div>
        {editable ? (
          <input
            value={value}
            onChange={(e) => onChangeValue(e.target.value)}
            placeholder={placeholder}
            className="flex-1 min-w-0 rounded-full border-none px-3 py-1.5 text-[12px] outline-none"
            style={{ background: C.chipGray, color: C.text }}
          />
        ) : (
          <button
            {...(bind ?? {})}
            className="flex-1 min-w-0 text-left rounded-full border-none px-3 py-1.5 text-[12px]"
            style={{ background: C.chipGray, color: C.textSub }}
          >
            {placeholder}
          </button>
        )}
        {editable && (
          <button
            {...(submitBind ?? {})}
            className="shrink-0 bg-transparent border-none p-0 text-[13px]"
            style={{ color: (value ?? '').trim() ? C.primary : C.textTertiary }}
          >
            {s.send}
          </button>
        )}
      </div>
      <button
        {...(moreBind ?? {})}
        className="mt-2 flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
        style={{ color: C.textSub }}
      >
        {totalText ? `${moreLabel}(${totalText})` : moreLabel}
        <IcArrowRight size={13} />
      </button>
    </div>
  );
}

/* ---------- 选集区标题 ---------- */

/** 「选集 追剧日历·更新至15集·全33集 ›」整行可点进选集弹层(证据 824)。 */
export function EpisodeSectionHeader({
  label,
  note,
  bind,
}: {
  label: string;
  note?: string;
  bind?: BindProps;
}) {
  return (
    <div className="flex items-baseline px-3 pt-4 pb-2" {...(bind ?? {})}>
      <span className="text-[17px] font-bold shrink-0" style={{ color: C.text }}>
        {label}
      </span>
      {note && (
        <span className="ml-2 flex items-center text-[12px] min-w-0" style={{ color: C.textSub }}>
          <span className="truncate">{note}</span>
          <IcArrowRight size={13} className="shrink-0" />
        </span>
      )}
    </div>
  );
}

/* ---------- 综艺季横滑 ---------- */

/** 季横滑行:选中季加粗放大 + 尾部「›」(证据 845)。 */
export function SeasonRow({
  seasons,
  activeSeason,
  labelOf,
  getBind,
  moreBind,
  dark = false,
}: {
  seasons: number[];
  activeSeason: number;
  labelOf: (season: number) => string;
  getBind: (season: number) => BindProps;
  moreBind?: BindProps;
  dark?: boolean;
}) {
  const str = useTencentvideoStrings();
  return (
    <div className="flex items-center pt-3">
      <div
        className="flex-1 min-w-0 flex items-baseline gap-4 overflow-x-auto px-3 scrollbar-none"
        data-scroll-container="seasons"
        data-scroll-direction="horizontal"
      >
        {seasons.map((season) => {
          const active = season === activeSeason;
          return (
            <button
              key={season}
              {...getBind(season)}
              className={`shrink-0 bg-transparent border-none p-0 whitespace-nowrap ${
                active ? 'text-[17px] font-bold' : 'text-[15px]'
              }`}
              style={{
                color: active ? (dark ? C.darkText : C.text) : dark ? 'rgba(255,255,255,0.62)' : C.textSub,
              }}
            >
              {labelOf(season)}
            </button>
          );
        })}
      </div>
      {moreBind && (
        <button
          {...moreBind}
          className="shrink-0 bg-transparent border-none px-2"
          style={{ color: dark ? 'rgba(255,255,255,0.62)' : C.textSub }}
          aria-label={str.allSeasons}
        >
          <IcArrowRight size={18} />
        </button>
      )}
    </div>
  );
}

/* ---------- 通用 pill chips ---------- */

/** 圆角 pill chip 行(选集分组「剧集/主创直播」、综艺子 tab「正片/纯享/…」)。 */
export function PillChipRow({
  chips,
  activeChip,
  getBind,
  className,
  dark = false,
  /** 横屏选集面板的选中态是白底黑字(证据 853),浅色页是青底青字(证据 845) */
  solidActive = false,
  right,
}: {
  chips: readonly string[];
  activeChip: string;
  getBind: (chip: string, index: number) => BindProps;
  className?: string;
  dark?: boolean;
  solidActive?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 overflow-x-auto px-3 py-2 scrollbar-none ${className ?? ''}`}
      data-scroll-container="pills"
      data-scroll-direction="horizontal"
    >
      {chips.map((c, i) => {
        const active = c === activeChip;
        const bg = active
          ? solidActive
            ? '#FFFFFF'
            : dark
              ? 'rgba(6,191,184,0.20)'
              : C.primaryBg
          : dark
            ? 'rgba(255,255,255,0.12)'
            : C.chipGray;
        const fg = active
          ? solidActive
            ? '#000000'
            : C.primary
          : dark
            ? 'rgba(255,255,255,0.72)'
            : C.textSub;
        return (
          <button
            key={c}
            {...getBind(c, i)}
            className="shrink-0 rounded-full border-none px-3 py-1.5 text-[13px] whitespace-nowrap"
            style={{ background: bg, color: fg }}
          >
            {c}
          </button>
        );
      })}
      {right && <div className="shrink-0 ml-auto">{right}</div>}
    </div>
  );
}

/** 弹幕开启态(mode !== 'off')判定,给控件行的绿点用。 */
export function isDanmakuOn(mode: string): boolean {
  return mode !== 'off';
}

/** 播放器画面取图:只有热门内容配了 16:9 剧照,其余用竖版海报裁切顶上。 */
export function stillOf(c: Partial<Pick<TvContent, 'still' | 'poster'>>): string | undefined {
  return c.still ?? c.poster;
}
