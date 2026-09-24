// apps/Tencentvideo/components/channel.tsx —— 频道族(home.channel.full / home.channel.lite)共用小件。
// 证据:813/791/798/767 完整频道(banner + 金刚位 pill 行 + chip 行 + 双列卡),
// 766/764 体育、779 NBA(「全部赛程 ›」+ 横滑赛程卡),762 播客卡,759 好物商品卡。
// 绑定纪律同 cards.tsx:组件自身不绑任何 id,全部由页面以 bind/getBind 传入字面量绑定。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { TvScheduleItem } from '../types';
import { TvImg } from './Img';
import type { BindProps } from './ui';
import { IcArrowRight, IcHeat } from '../res/icons';

/* ---------- 频道 banner(813/798/791/767/787) ---------- */

export interface ChannelBannerProps {
  img?: string;
  title?: string;
  subtitle?: string;
  /** 右上角运营标(证据 813「广告」/779「直播中」) */
  cornerTag?: string;
  /** 轮播指示点数量(证据 767 五点);0 = 不画 */
  dots?: number;
  activeDot?: number;
  bind?: BindProps;
}

/** 频道首屏 banner:16:9 圆角图 + 底部渐变压字 + 右下指示点。 */
export function ChannelBanner({
  img,
  title,
  subtitle,
  cornerTag,
  dots = 0,
  activeDot = 0,
  bind,
}: ChannelBannerProps) {
  return (
    <div className="px-3 pt-1">
      <div
        {...(bind ?? {})}
        className="relative w-full aspect-video rounded-xl overflow-hidden cursor-pointer"
      >
        <TvImg id={img} alt={title ?? ''} className="w-full h-full object-cover" />
        {cornerTag && (
          <span
            className="absolute top-1.5 right-1.5 px-1.5 py-[1px] rounded text-[10px] leading-[15px] text-white"
            style={{ background: C.maskBadge }}
          >
            {cornerTag}
          </span>
        )}
        <div
          className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-8 pointer-events-none"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.72), transparent)' }}
        >
          {subtitle && (
            <div className="text-[11px] text-white/75 truncate">{subtitle}</div>
          )}
          <div className="text-white text-[16px] font-semibold truncate">{title}</div>
        </div>
        {dots > 0 && (
          <div className="absolute bottom-2.5 right-3 flex gap-1 pointer-events-none">
            {Array.from({ length: dots }, (_, i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: i === activeDot ? '#FFFFFF' : 'rgba(255,255,255,0.45)' }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- 金刚位 / 入口 pill 行(813 电视剧、791 电影、767 纪录片、764 体育) ---------- */

/** 横滑 pill 行:灰底圆角胶囊 + 左侧色点(真机是各频道自绘 icon,这里用品牌色点位替代)。 */
export function KingKongRow({
  items,
  getBind,
}: {
  items: readonly string[];
  getBind: (item: string, index: number) => BindProps;
}) {
  if (items.length === 0) return null;
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 pt-3 pb-1 scrollbar-none"
      data-scroll-container="kingkong"
      data-scroll-direction="horizontal"
    >
      {items.map((item, i) => (
        <button
          key={item}
          {...getBind(item, i)}
          className="shrink-0 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border-none text-[13px] whitespace-nowrap"
          style={{ background: C.chipGray, color: C.text }}
        >
          <span
            className="w-3.5 h-3.5 rounded-[3px] shrink-0"
            style={{ background: i % 2 === 0 ? C.primary : C.badgeOrange, opacity: 0.85 }}
          />
          {item}
        </button>
      ))}
    </div>
  );
}

/* ---------- 全部赛程(779 NBA / 766 体育 / 761 游戏) ---------- */

/** 赛程楼层标题行:左「全部赛程 ›」+ 右侧灰底 pill(证据 779「WNBA 赛程」)。 */
export function ScheduleHeader({
  title,
  sideLabel,
  bind,
  sideBind,
}: {
  title: string;
  sideLabel?: string;
  bind?: BindProps;
  sideBind?: BindProps;
}) {
  return (
    <div className="flex items-center justify-between px-3 pt-4 pb-2">
      <button
        {...(bind ?? {})}
        className="inline-flex items-center gap-0.5 bg-transparent border-none p-0 text-[16px] font-semibold"
        style={{ color: C.text }}
      >
        {title}
        <IcArrowRight size={16} />
      </button>
      {sideLabel && (
        <button
          {...(sideBind ?? {})}
          className="shrink-0 px-2.5 py-1 rounded-full border-none text-[11px]"
          style={{ background: C.chipGray, color: C.textSub }}
        >
          {sideLabel}
        </button>
      )}
    </div>
  );
}

/** 横滑赛程卡:顶部联赛名浅底条 + 状态/直播标 + 两支队伍与比分(证据 766/779)。 */
export function ScheduleRow({
  items,
  getBind,
}: {
  items: readonly TvScheduleItem[];
  getBind: (item: TvScheduleItem, index: number) => BindProps;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none"
      data-scroll-container="schedule"
      data-scroll-direction="horizontal"
    >
      {items.map((m, i) => {
        const live = m.status.includes('直播');
        const teams = [m.home, m.away].filter((t) => t.length > 0);
        const scores = (m.score ?? '').split(':');
        return (
          <button
            key={`${m.home}-${m.away}`}
            {...getBind(m, i)}
            className="shrink-0 w-[212px] rounded-lg overflow-hidden border-none p-0 text-left"
            style={{ background: C.chipGray }}
          >
            <div
              className="px-2.5 py-1.5 text-[12px] font-medium truncate"
              style={{ background: C.rankChipBg, color: C.rankChipText }}
            >
              {m.league ?? m.status}
            </div>
            <div className="flex items-center justify-between px-2.5 pt-2">
              <span className="text-[11px]" style={{ color: C.textSub }}>
                {m.time ?? m.status}
              </span>
              <span
                className="px-1.5 py-[1px] rounded text-[10px] leading-[14px]"
                style={
                  live
                    ? { background: C.badgeOrange, color: '#FFFFFF' }
                    : { background: C.divider, color: C.textTertiary }
                }
              >
                {live ? m.status.split('·').pop() : m.status}
              </span>
            </div>
            <div className="px-2.5 pt-1 pb-2.5">
              {teams.map((t, ti) => (
                <div key={t} className="flex items-center justify-between py-[3px]">
                  <span className="text-[13px] truncate" style={{ color: C.text }}>
                    {t}
                  </span>
                  {scores[ti] && (
                    <span className="text-[14px] font-semibold" style={{ color: C.text }}>
                      {scores[ti]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- 榜单序号角标(813 N刷榜 / 780 热播榜 / 783 综艺子榜) ---------- */

/** 卡片左上角榜单名次:前三名橙红实心,其后转半黑(证据 813 双列卡 1~6)。 */
export function RankNumBadge({ rank }: { rank: number }) {
  return (
    <span
      className="absolute top-0 left-0 z-10 min-w-[18px] px-1 text-center text-[11px] font-bold italic leading-[18px] text-white rounded-br-[6px]"
      style={{ background: rank <= 3 ? C.badgeOrange : C.maskBadge }}
    >
      {rank}
    </span>
  );
}

/* ---------- 热度数字(801/797/750 榜单行右侧火苗 + 红字) ---------- */

export function HeatValue({ heat }: { heat: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[14px] font-semibold"
      style={{ color: C.redDot }}
    >
      <IcHeat size={13} />
      {heat}
    </span>
  );
}
