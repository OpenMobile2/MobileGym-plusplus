import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { CATALOG } from '../components/feedShared';
import {
  catalogItem, commentKey, epLocked, playerSync, seriesRecommends, synopsisOf,
} from '../components/player/playerLib';
import VideoPlayer, { PlayingBars } from '../components/player/VideoPlayer';
import Img from '../components/Img';
import { IcClose, IcPlaySolid } from '../components/player/playerIcons';
import type { CatalogItem } from '../types';

type SheetTab = 'episodes' | 'synopsis';

function initProgress(id: string, ep: number, dur: number): number {
  const h = useYoukuStore.getState().history.find((x) => x.id === id && (x.episode ?? 0) === ep);
  return h && h.progressSec < dur ? h.progressSec : 0;
}

/**
 * spec 节点 player.series.episodes.sheet(route /player/series/episodes,preserve showId/ep)—— 选集面板(a268)。
 * 半屏面板盖在播放器下方,URL 驱动,关闭=bindBack。
 * uiStates:episodes(6列宫格+推荐横条)/ synopsis(分集剧情)。切集与横排同一 actionId,
 * 选中经 playerSync 单例回填剧集页(路由互斥挂载,back 后剧集页初始化时消费)。
 */
export default function EpisodesSheet() {
  const [sp] = useSearchParams();
  const showId = sp.get('showId') ?? '';
  const item =
    catalogItem(showId) ?? (CATALOG.find((c) => c.type === 'series' && c.episodeCount != null) as CatalogItem);
  return <EpisodesInner key={item.id} item={item} />;
}

function EpisodesInner({ item }: { item: CatalogItem }) {
  const { action, bindTap, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const [sp, setSearchParams] = useSearchParams();
  const epCount = item.episodeCount ?? 1;
  const member = useYoukuStore((s) => s.membership.active);
  const recordEpisodePanel = useYoukuStore((s) => s.recordEpisodePanel);

  const [ep, setEp] = useState<number>(() => {
    const q = Number(sp.get('ep') ?? '1');
    return Number.isFinite(q) && q >= 1 ? Math.min(q, epCount) : 1;
  });
  const [tab, setTab] = useState<SheetTab>('episodes');
  const [titlesOn, setTitlesOn] = useState(false);
  const [progress, setProgress] = useState(() => initProgress(item.id, ep, item.durationSec));
  const [lastEp, setLastEp] = useState(ep);
  useEffect(() => {
    if (!item.id) return;
    recordEpisodePanel(item.id, { viewedTab: 'episodes' });
  }, [item.id]);
  if (lastEp !== ep) {
    setLastEp(ep);
    setProgress(initProgress(item.id, ep, item.durationSec));
  }

  const selectEp = (n: number) => {
    setEp(n);
    recordEpisodePanel(item.id, { selectedEpisode: n });
    // 回填剧集页 + 同步本页 URL(replace 不入栈)
    playerSync.showId = item.id;
    playerSync.ep = n;
    setSearchParams(
      (p) => {
        p.set('ep', String(n));
        return p;
      },
      { replace: true },
    );
  };

  const locked = epLocked(item, ep, member);
  const eps = Array.from({ length: epCount }, (_, i) => i + 1);
  const synopsis = synopsisOf(item.id);
  const epTitle = (n: number) => synopsis[n - 1] ?? t('episodes.fallback', { n });
  const rec = seriesRecommends(item.id)[0];

  const epBadge = (n: number) => (
    <>
      {n === item.trialEp && (
        <span className="absolute right-0 top-0 rounded-bl-md rounded-tr-lg bg-(--app-c-chip-bg) px-1 py-0.5 text-[8px] leading-none text-(--app-c-text-primary)">
          {t('player.series.trial')}
        </span>
      )}
      {item.vipFrom != null && n >= item.vipFrom && (
        <span className="absolute right-0 top-0 rounded-bl-md rounded-tr-lg bg-black/50 px-1 py-0.5 text-[8px] font-semibold leading-none text-[#E8C87E]">
          VIP
        </span>
      )}
    </>
  );

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶部播放器(切集后蒙层/弹幕/进度联动;蒙层无声明入边=纯展示) */}
      <VideoPlayer
        item={item}
        contentKey={commentKey(item.id, ep)}
        historyId={item.id}
        ctype={String(item.type)}
        episode={ep}
        locked={locked}
        progress={progress}
        setProgress={setProgress}
      />

      {/* 面板:『选集』/『分集剧情』tab + 分集标题开关 + 关闭× */}
      <div className="flex min-h-0 flex-1 flex-col rounded-t-2xl bg-(--app-c-card-bg)">
        <div className="flex shrink-0 items-center gap-5 px-4 pt-3.5">
          <button
            {...action('player.episodes.tab.select.option', () => {
              setTab('episodes');
              recordEpisodePanel(item.id, { viewedTab: 'episodes' });
            }, { params: { value: 'episodes' } })}
            className={`cursor-pointer border-none bg-transparent p-0 ${
              tab === 'episodes' ? 'text-[18px] font-bold text-(--app-c-text-primary)' : 'text-[15px] text-[#8A8A8A]'
            }`}
          >
            {t('player.series.episodes')}
          </button>
          <button
            {...action('player.episodes.tab.select.option', () => {
              setTab('synopsis');
              recordEpisodePanel(item.id, { viewedTab: 'synopsis' });
            }, { params: { value: 'synopsis' } })}
            className={`cursor-pointer border-none bg-transparent p-0 ${
              tab === 'synopsis' ? 'text-[18px] font-bold text-(--app-c-text-primary)' : 'text-[15px] text-[#8A8A8A]'
            }`}
          >
            {t('episodes.synopsis')}
          </button>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[13px] text-[#999999]">{t('episodes.titles')}</span>
            <button
              {...action('player.episodes.titles.toggle', () => setTitlesOn((v) => {
                const next = !v;
                recordEpisodePanel(item.id, { titlesEnabled: next });
                return next;
              }))}
              aria-label={t('episodes.titles')}
              className={`relative h-5.5 w-10 cursor-pointer rounded-full border-none transition-colors ${
                titlesOn ? 'bg-[#0C7BFF]' : 'bg-(--app-c-chip-bg)'
              }`}
            >
              <span
                className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition-all ${
                  titlesOn ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
            <button
              {...bindBack()}
              aria-label={t('common.back')}
              className="ml-1 cursor-pointer border-none bg-transparent p-0 text-[#CCCCCC]"
            >
              <IcClose size={20} />
            </button>
          </div>
        </div>

        <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-4 pt-3">
          <div className="text-[13px] text-[#999999]">{t('player.series.epAll', { n: epCount })}</div>

          {/* 选集tab:6列宫格 /(分集标题开=列表式) */}
          {tab === 'episodes' && !titlesOn && (
            <div className="mt-3 grid grid-cols-6 gap-2 pb-4">
              {eps.map((n) => (
                <button
                  key={n}
                  {...action('player.series.episode.select.option', () => selectEp(n), { params: { value: n } })}
                  className="relative flex aspect-square cursor-pointer items-center justify-center rounded-lg border-none bg-(--app-c-chip-bg) text-[16px] text-(--app-c-text-primary)"
                >
                  {n === ep ? <PlayingBars /> : n}
                  {epBadge(n)}
                </button>
              ))}
            </div>
          )}
          {tab === 'episodes' && titlesOn && (
            <div className="mt-2 pb-4">
              {eps.map((n) => (
                <button
                  key={n}
                  {...action('player.series.episode.select.option', () => selectEp(n), { params: { value: n } })}
                  className="relative flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent px-0 py-2.5 text-left"
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--app-c-chip-bg) text-[14px] text-(--app-c-text-primary)">
                    {n === ep ? <PlayingBars /> : n}
                    {epBadge(n)}
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-[14px] ${n === ep ? 'text-[#0C7BFF]' : 'text-[#DDDDDD]'}`}>
                    {epTitle(n)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* 分集剧情tab:按集剧情简介列表(点集数同样切集) */}
          {tab === 'synopsis' && (
            <div className="mt-2 pb-4">
              {eps.map((n) => (
                <button
                  key={n}
                  {...action('player.series.episode.select.option', () => selectEp(n), { params: { value: n } })}
                  className="block w-full cursor-pointer border-none bg-transparent px-0 py-2.5 text-left"
                >
                  <div className={`text-[14px] leading-5 ${n === ep ? 'text-[#0C7BFF]' : 'text-[#DDDDDD]'}`}>
                    {epTitle(n)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 底部『推荐』横条(相关剧卡,携带 showId 重进剧集播放页) */}
        {rec && (
          <div
            {...bindTap('player.episodes.recommend.open', { params: { showId: rec.id, ep: '1' } })}
            className="flex shrink-0 cursor-pointer items-center gap-2.5 border-t border-[#222222] bg-(--app-c-card-bg) px-4 py-2.5"
          >
            <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-(--app-c-card-bg)">
              <Img src={rec.poster} label={rec.title} ratio="poster" className="h-full w-full object-cover" />
              <span className="absolute left-0 top-0 rounded-br-md bg-[#FF6000] px-1 text-[8px] leading-3 text-white">
                {t('episodes.recommend')}
              </span>
            </div>
            <span className="min-w-0 flex-1 truncate text-[15px] text-(--app-c-text-primary)">{rec.title}</span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--app-c-chip-bg)">
              <IcPlaySolid size={14} className="ml-0.5 fill-white text-(--app-c-text-primary)" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
