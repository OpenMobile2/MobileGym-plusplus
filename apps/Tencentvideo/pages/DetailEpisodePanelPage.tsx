// 选集弹层(竖屏半屏)。节点 detail.episodePanel(spec v1.2.0,5 条交互)。
// 视觉证据:803(剧场版 6 集列表模式:顶部蒙层 +「选集」+ ∨ 收起 + 副标题「全6集」+
// 缩略图集条目 + VIP 角标 +「正在播放」盖章)、820(长剧集数 chips,按此延伸为数字宫格模式)。
//
// 列表 / 宫格由集数决定:少集多物料走缩略图列表(803),多集长剧走数字宫格(820 延伸,
// spec note 要求主装配器复核)。选集后弹层收起 = bindBack(),与 803 的推断口径一致。
import React, { useMemo, useRef } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { Badge } from '../components/ui';
import { PillChipRow, SeasonRow, stillOf } from '../components/detail';
import { PanelHeader } from '../components/detailExtra';
import {
  currentSeasonOf,
  seasonEpisodeStateOf,
  seasonNumbersOf,
  seasonSubTabsOf,
} from '../utils/seasonEpisodes';

/** 列表模式的集数上限(803 是 6 集;超过就换数字宫格,证据 820) */
const LIST_MODE_MAX = 8;
const UI_SEASON = 'playback.season';
const UI_SUBTAB = 'playback.subTab';

export default function DetailEpisodePanelPage() {
  const { bindTap, bindBack, back } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const content = useTvContent('tv_hushanghuakai');
  const detail = useTencentvideoStore((st) => st.detail);
  const playback = useTencentvideoStore((st) => st.playback);
  const ui = useTencentvideoStore((st) => st.ui);
  const listRef = useRef<HTMLDivElement>(null);

  const selectEpisode = useTencentvideoStore((st) => st.selectEpisode);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const setUi = useTencentvideoStore((st) => st.setUi);

  const contentId = content?.id ?? '';
  const seasonUiKey = `${UI_SEASON}.${contentId}`;
  const subTabUiKey = `${UI_SUBTAB}.${contentId}`;
  const seasons = seasonNumbersOf(content);
  const currentSeason = currentSeasonOf(content, seasons);
  const requestedSeason = Number(ui[seasonUiKey] ?? currentSeason);
  const activeSeason = seasons.includes(requestedSeason) ? requestedSeason : currentSeason;
  const subTabs = seasonSubTabsOf(content, activeSeason);
  const requestedSubTab = String(ui[subTabUiKey] ?? subTabs[0] ?? '');
  const activeSubTab = subTabs.includes(requestedSubTab) ? requestedSubTab : subTabs[0] || '';
  const seasonState = seasonEpisodeStateOf(content, activeSeason, activeSubTab);
  const total = seasonState.available;
  const updatedTo = seasonState.updatedTo;
  const vipFrom = typeof content?.vipFrom === 'number' ? content.vipFrom : undefined;
  const current = playback.contentId === contentId ? playback.episodeIndex : 1;

  const episodes = useMemo(() => Array.from({ length: total }, (_, i) => i + 1), [total]);

  if (!content) return null;

  const listMode = total <= LIST_MODE_MAX;

  /** 副标题:剧集形态带追剧日历与更新进度(证据 824),剧场版只有「全N集」(证据 803) */
  const note = updatedTo !== undefined && updatedTo < seasonState.total
    ? `${detail.calendarLabel} · 更新至${updatedTo}集 · 全${seasonState.total}集`
    : `全${seasonState.total}集`;

  /** 选集:切集 + 收起弹层。免费集与 VIP 集是两条不同申报,故分开绑定。 */
  const pick = (ep: number) => {
    if (playback.contentId === contentId) selectEpisode(ep);
    else openPlayback(contentId, ep);
    back();
  };

  const episodeBind = (ep: number, vip: boolean) =>
    vip
      ? bindTap({ kind: 'action', id: 'detail.episodePanel.episodeVip.select' }, {
        stopPropagation: true,
        onTrigger: () => pick(ep),
      })
      : bindTap({ kind: 'action', id: 'detail.episodePanel.episode.select' }, {
        stopPropagation: true,
        onTrigger: () => pick(ep),
      });

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" {...bindBack()} />
      <div
        className="relative rounded-t-2xl flex flex-col max-h-[72%]"
        style={{ background: C.pageBg }}
      >
        <PanelHeader title={s.episodeSection} note={note} closeBind={bindBack()} />

        {seasons.length > 0 && (
          <SeasonRow
            seasons={seasons}
            activeSeason={activeSeason}
            labelOf={(season) => `第${season}季`}
            getBind={(season) => bindTap({ kind: 'action', id: 'detail.episodePanel.season.select' }, {
              params: { season },
              onTrigger: () => {
                setUi(seasonUiKey, season);
                if (playback.contentId === contentId) selectEpisode(1); else openPlayback(contentId, 1);
              },
            })}
          />
        )}
        {subTabs.length > 0 && (
          <PillChipRow
            chips={subTabs}
            activeChip={activeSubTab}
            getBind={(tab) => bindTap({ kind: 'action', id: 'detail.episodePanel.subtab.select' }, {
              params: { tab },
              onTrigger: () => {
                setUi(subTabUiKey, tab);
                if (playback.contentId === contentId) selectEpisode(1); else openPlayback(contentId, 1);
              },
            })}
          />
        )}

        <div
          ref={listRef}
          {...bindTap({ kind: 'action', id: 'detail.episodePanel.list.scroll' }, {
            onTrigger: () => listRef.current?.scrollBy({ top: 240, behavior: 'smooth' }),
          })}
          className="flex-1 overflow-y-auto px-3 pt-2 pb-6"
          data-scroll-container="episodes"
          data-scroll-direction="vertical"
        >
          {listMode ? (
            <div className="flex flex-col gap-3">
              {episodes.map((ep) => {
                const vip = vipFrom !== undefined && ep >= vipFrom;
                const active = ep === current;
                return (
                  <div key={ep} {...episodeBind(ep, vip)} className="flex gap-2.5">
                    <div className="relative w-[124px] shrink-0 aspect-video rounded-md overflow-hidden">
                      <TvImg id={stillOf(content)} alt={content.title} className="w-full h-full object-cover" />
                      {vip && (
                        <span className="absolute top-0 right-0">
                          <Badge text="VIP" variant="vip" />
                        </span>
                      )}
                      {active && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span
                            className="rounded-[3px] px-1.5 py-[2px] text-[11px] text-white"
                            style={{ background: C.toastBg }}
                          >
                            {detail.playingLabel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-[13px] leading-[19px] line-clamp-2"
                      style={{ color: active ? C.primary : C.text }}
                    >
                      第{ep}集 {content.title}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-6 gap-2">
              {episodes.map((ep) => {
                const vip = vipFrom !== undefined && ep >= vipFrom;
                const active = ep === current;
                return (
                  <button
                    key={ep}
                    {...episodeBind(ep, vip)}
                    className="relative h-11 rounded-md border-none text-[14px]"
                    style={{
                      background: active ? C.primaryBg : C.chipGray,
                      color: active ? C.primary : C.text,
                    }}
                  >
                    {ep}
                    {vip && (
                      <span
                        className="absolute top-0 right-0 rounded-tr-[6px] rounded-bl-[4px] px-[3px] text-[9px] leading-[12px]"
                        style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
                      >
                        VIP
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
