// 年度热门剧活动页(深色)。节点 activity.yearly(spec:3 条交互)。入口 = 好片 tab「历年好剧」。
// 视觉证据:800(顶栏「年度热门剧」+ 满幅活动头图「历年好剧 拯救剧荒」;下面按年份分组,
// 每组标题「🔥 2026年度热门剧 ·」+ 一条横滑竖版海报,卡上右上角标、右下「全N集/更新至N集」,
// 卡下片名)、799(往下滚是 2024/2023/2022 同款分组)。
import React, { useMemo, useRef } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { Badge, EmptyState, TopBar } from '../components/ui';
import { IcHeat } from '../res/icons';

/** 「年份分组横滑」一次推进的像素(卡宽 104 + 间距 8) */
const SCROLL_STEP = 112;

export default function ActivityYearlyPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((s) => s.contents);
  const activity = useTencentvideoStore((s) => s.yearHotActivity);

  const rowsRef = useRef<Record<string, HTMLDivElement | null>>({});

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  const groups = useMemo(
    () =>
      activity.groups.map((g) => ({
        key: String(g.year),
        items: g.ids.map((id) => byId.get(id)).filter((c) => c !== undefined),
      })),
    [activity.groups, byId],
  );

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: C.darkBg }}
      data-status-bar-foreground="light"
    >
      <TopBar title={activity.title} dark />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 活动头图:满幅,标题压在图上(证据 800) */}
        <div className="relative w-full aspect-[16/7] overflow-hidden">
          <TvImg id={activity.banner} alt={activity.title} className="w-full h-full object-cover" />
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.28), rgba(0,0,0,0.55))' }}
          >
            <div className="text-[30px] font-bold text-white tracking-wide">{activity.title}</div>
          </div>
        </div>

        {groups.length === 0 ? (
          <EmptyState text="活动内容整理中" dark />
        ) : (
          groups.map((g) => (
            <div key={g.key} className="pt-4">
              {/* 年份分组标题:火苗 + 年份 + 细横线(证据 800) */}
              <div className="flex items-center gap-1.5 px-3 pb-2">
                <span style={{ color: C.badgeOrange }}>
                  <IcHeat size={16} />
                </span>
                <span
                  className="text-[16px] font-bold italic"
                  style={{ color: C.vipBadgeBg }}
                >
                  {g.key}年度热门剧
                </span>
                <span
                  className="flex-1 h-px"
                  style={{ background: 'linear-gradient(to right, rgba(254,223,139,0.45), transparent)' }}
                />
              </div>
              <div
                ref={(el) => {
                  rowsRef.current[g.key] = el;
                }}
                {...bindTap({ kind: 'action', id: 'activity.yearly.group.scroll' }, {
                  params: { year: g.key },
                  onTrigger: () =>
                    rowsRef.current[g.key]?.scrollBy({ left: SCROLL_STEP, behavior: 'smooth' }),
                })}
                className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none"
                data-scroll-container={`year-${g.key}`}
                data-scroll-direction="horizontal"
              >
                {g.items.map((c) => (
                  <div
                    key={c.id}
                    {...bindTap('detail.series.open.fromYearly', {
                      params: { contentId: c.id },
                      stopPropagation: true,
                    })}
                    className="shrink-0 w-[104px] cursor-pointer"
                  >
                    <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                      <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                      {c.badge && (
                        <div className="absolute top-0 right-0">
                          <Badge
                            text={c.badge}
                            className="rounded-none rounded-bl-[6px] rounded-tr-[8px]"
                          />
                        </div>
                      )}
                      <div
                        className="absolute inset-x-0 bottom-0 px-1.5 pb-0.5 pt-4 text-right text-[10px] leading-none text-white"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.62), transparent)' }}
                      >
                        {c.updatedTo && c.episodes && c.updatedTo < c.episodes
                          ? `更新至${c.updatedTo}集`
                          : c.episodes
                            ? `全${c.episodes}集`
                            : ''}
                      </div>
                    </div>
                    <div
                      className="mt-1.5 text-[13px] text-center truncate"
                      style={{ color: C.darkText }}
                    >
                      {c.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
        <div className="h-6" />
      </div>
    </div>
  );
}
