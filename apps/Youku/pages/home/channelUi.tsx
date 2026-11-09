import React from 'react';
import Img from '../../components/Img';
import type { CatalogItem } from '../../types';
import { Bind, ChannelBar, ChannelChip, TopSearchBar, epText } from './homeUi';
import HScroll from './HScroll';

/**
 * 频道页(home.channel / home.channelLite)共享展示组件。
 * 与 homeUi.tsx 同约定:纯展示、不产生 transition/action 绑定,
 * 绑定一律由页面文件以字符串字面量创建后经 props 传入(checker 铁律)。
 */

type TFn = (key: string, params?: Record<string, string | number>) => string;

/** 频道配置(defaults.json channelConfig 的宽松视图) */
export interface ChannelCfg {
  filters?: string[];
  rankTabs?: string[];
  bannerId?: string;
  opFloor?: { showId: string; title: string; sub: string; episodes?: string[] };
  upcomingTitle?: string;
  upcomingIds?: string[];
  entries?: string[];
  ages?: string[];
  tags?: string[];
  chips?: string[];
  ids?: string[];
  note?: string;
}

/** 预约位条目(defaults.json upcoming) */
export interface UpcomingItem {
  id: string;
  title: string;
  type: string;
  poster: string;
  dateText: string;
  dayOffset: number;
  reserveCount: number;
  desc: string;
  region: string;
  genre: string;
}

// ---------------------------------------------------------------- 频道页顶栏(实体黑底:搜索胶囊 + 频道条)
export function ChannelHeader({
  avatar,
  avatarBind,
  hotword,
  hotTag,
  searchBind,
  filterBind,
  filterLabel,
  chips,
  expandBind,
}: {
  avatar: string;
  avatarBind?: Bind;
  hotword: string;
  hotTag?: string;
  searchBind: Bind;
  filterBind: Bind;
  filterLabel: string;
  chips: ChannelChip[];
  expandBind: Bind;
}) {
  return (
    <div className="shrink-0 bg-(--app-c-page-bg) pb-1 pt-10">
      <TopSearchBar
        avatar={avatar}
        avatarBind={avatarBind}
        hotword={hotword}
        hotTag={hotTag}
        searchBind={searchBind}
        filterBind={filterBind}
        filterLabel={filterLabel}
        filterAsPlus
      />
      <div className="mt-1">
        <ChannelBar chips={chips} expandBind={expandBind} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- 筛选行胶囊
export interface FilterChip {
  label: string;
  active: boolean;
  bind: Bind;
}

export function FilterChipsRow({ chips }: { chips: FilterChip[] }) {
  return (
    <HScroll id="filter-chips" className="items-center gap-2 px-3 py-2.5">
      {chips.map((c) => (
        <span
          key={c.label}
          {...c.bind}
          className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] ${
            c.active
              ? 'bg-(--app-c-brand-soft) font-medium text-(--app-c-brand)'
              : 'bg-(--app-c-chip-bg) text-(--app-c-text-muted)'
          }`}
        >
          {c.label}
        </span>
      ))}
    </HScroll>
  );
}

// ---------------------------------------------------------------- 榜单视图行(筛选行选中『排行榜/N刷榜』)
export function RankListRow({
  item,
  rank,
  bind,
  t,
  heatText,
}: {
  item: CatalogItem;
  rank: number;
  bind: Bind;
  t: TFn;
  heatText: string;
}) {
  return (
    <div {...bind} className="flex cursor-pointer items-center gap-3 px-3 py-2">
      <span
        className={`w-7 shrink-0 text-[20px] font-bold italic leading-none ${
          rank <= 3 ? 'text-[#0C7BFF]' : 'text-[#666666]'
        }`}
      >
        {String(rank).padStart(2, '0')}
      </span>
      <div className="h-[72px] w-[54px] shrink-0 overflow-hidden rounded-md bg-(--app-c-card-bg)">
        <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] text-(--app-c-text-primary)">{item.title}</div>
        <div className="mt-1 truncate text-[12px] text-[#999999]">{item.recTitle}</div>
        {epText(item, t) ? (
          <div className="mt-1 text-[11px] text-[#666666]">{epText(item, t)}</div>
        ) : null}
      </div>
      <span className="shrink-0 text-[12px] text-[#FF6000]">{heatText}</span>
    </div>
  );
}

// ---------------------------------------------------------------- 预约位卡片
export function UpcomingCard({
  item,
  reserved,
  countText,
  btnLabel,
  comingSoonLabel,
  cardBind,
  btnBind,
}: {
  item: UpcomingItem;
  reserved: boolean;
  countText: string;
  btnLabel: string;
  comingSoonLabel: string;
  cardBind: Bind;
  btnBind: Bind;
}) {
  const urgent = item.dayOffset <= 1;
  return (
    <div {...cardBind} className="w-[104px] shrink-0 cursor-pointer">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-(--app-c-card-bg)">
        <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
        <span
          className={`absolute left-0 top-0 rounded-br-lg px-1.5 py-0.5 text-[10px] leading-4 text-(--app-c-text-primary) ${
            urgent ? 'bg-[#F5265C]' : 'bg-black/55'
          }`}
        >
          {item.dateText}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-4 text-[10px] text-white/85">
          {comingSoonLabel} · {item.genre}
        </div>
      </div>
      <div className="mt-1.5 truncate text-[13px] text-(--app-c-text-primary)">{item.title}</div>
      <div className="mt-0.5 truncate text-[11px] text-[#999999]">{countText}</div>
      <button
        {...(btnBind as React.HTMLAttributes<HTMLButtonElement>)}
        className={`mt-1.5 h-7 w-full cursor-pointer rounded-full border-none text-[12px] ${
          reserved ? 'bg-(--app-c-chip-bg) text-[#999999]' : 'bg-white font-medium text-black'
        }`}
      >
        {btnLabel}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- 每日放送周 tab(动漫)
export interface WeekTab {
  key: string;
  label: string;
  active: boolean;
  bind: Bind;
}

export function WeekTabsRow({ tabs }: { tabs: WeekTab[] }) {
  return (
    <HScroll id="week-tabs" className="items-center gap-5 px-3 py-1.5">
      {tabs.map((d) => (
        <span
          key={d.key}
          {...d.bind}
          className={`shrink-0 cursor-pointer whitespace-nowrap ${
            d.active ? 'text-[15px] font-bold text-(--app-c-text-primary)' : 'text-[13px] text-[#8A8A8A]'
          }`}
        >
          {d.label}
        </span>
      ))}
    </HScroll>
  );
}

/** 每日放送当日更新卡(横图 + 更新时间) */
export function BroadcastCard({
  item,
  timeText,
  bind,
  t,
}: {
  item: CatalogItem;
  timeText: string;
  bind: Bind;
  t: TFn;
}) {
  return (
    <div {...bind} className="w-[132px] shrink-0 cursor-pointer">
      <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-(--app-c-card-bg)">
        <Img src={item.still} label={item.title} ratio="landscape" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/75 to-transparent" />
        <span className="absolute bottom-1 left-1.5 text-[10px] text-white/95">{timeText}</span>
      </div>
      <div className="mt-1.5 truncate text-[13px] text-(--app-c-text-primary)">{item.title}</div>
      <div className="mt-0.5 truncate text-[11px] text-[#999999]">{epText(item, t)}</div>
    </div>
  );
}

// ---------------------------------------------------------------- 圆形分类入口(少儿/体育/游戏)
const CIRCLE_GRADIENTS = [
  'from-[#FF7AA8] to-[#E9447A]',
  'from-[#4FA3FF] to-[#1F6FE0]',
  'from-[#FFB84F] to-[#E98A1F]',
  'from-[#7ED07E] to-[#3AA65C]',
  'from-[#B48CFF] to-[#7B4FE0]',
  'from-[#5AD0D0] to-[#2A9DA8]',
  'from-[#FF8A5C] to-[#E05A2A]',
  'from-[#8FA8FF] to-[#5064E0]',
  'from-[#F5A0D0] to-[#C85AA0]',
  'from-[#A0D05A] to-[#6AA02A]',
] as const;

export function CircleEntry({
  label,
  index,
  badge,
  bind,
}: {
  label: string;
  index: number;
  badge?: string;
  bind: Bind;
}) {
  const grad = CIRCLE_GRADIENTS[index % CIRCLE_GRADIENTS.length];
  return (
    <div {...bind} className="flex w-[60px] shrink-0 cursor-pointer flex-col items-center">
      <div className="relative">
        <div
          className={`flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-br text-[20px] font-bold text-(--app-c-text-primary) ${grad}`}
        >
          {label.slice(0, 1)}
        </div>
        {badge ? (
          <span className="absolute -right-2 -top-1 rounded-full bg-[#F5265C] px-1.5 text-[9px] leading-4 text-(--app-c-text-primary)">
            {badge}
          </span>
        ) : null}
      </div>
      <span className="mt-1.5 w-full truncate text-center text-[12px] text-(--app-c-text-primary)">{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------- 胶囊快捷入口(纪录片/人文)
export function LiteChipBtn({ label, bind }: { label: string; bind: Bind }) {
  return (
    <button
      {...(bind as React.HTMLAttributes<HTMLButtonElement>)}
      className="h-10 min-w-0 flex-1 cursor-pointer truncate rounded-lg border-none bg-(--app-c-card-bg) px-2 text-[13px] text-(--app-c-text-primary)"
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------- 体育:赛程卡 / 直播宽卡(整组 wontfix)
export function ScheduleCard({
  league,
  time,
  desc,
  liveLabel,
  bind,
  cover,
}: {
  league: string;
  time: string;
  desc: string;
  liveLabel: string;
  bind: Bind;
  cover?: string;
}) {
  return (
    <div {...bind} className="w-[210px] shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[#191B26]">
      {cover ? (
        <div className="aspect-video w-full overflow-hidden">
          <Img src={cover} label={league} ratio="landscape" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="p-3">
        <div className="truncate text-[12px] text-[#999999]">{league}</div>
        <div className="mt-1.5 flex items-center">
          <span className="text-[14px] font-medium text-(--app-c-text-primary)">{time}</span>
          <span className="ml-auto text-[12px] text-[#3D8BFF]">{liveLabel}</span>
        </div>
        <div className="mt-1.5 text-[13px] leading-5 text-(--app-c-text-primary)">{desc}</div>
      </div>
    </div>
  );
}

export function LiveWideCard({
  title,
  badge,
  badgeLive,
  gradient,
  bind,
  cover,
}: {
  title: string;
  badge: string;
  badgeLive: boolean;
  gradient: string;
  bind: Bind;
  cover?: string;
}) {
  return (
    <div {...bind} className="w-[200px] shrink-0 cursor-pointer">
      <div className={`relative aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br ${gradient}`}>
        {cover ? (
          <Img src={cover} label={title} ratio="landscape" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <span
          className={`absolute right-0 top-0 rounded-bl-lg px-1.5 py-0.5 text-[10px] leading-4 text-(--app-c-text-primary) ${
            badgeLive ? 'bg-[#F5265C]' : 'bg-black/55'
          }`}
        >
          {badge}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2.5 pb-2 pt-5 text-[13px] font-medium text-white">
          {title}
        </div>
      </div>
    </div>
  );
}
