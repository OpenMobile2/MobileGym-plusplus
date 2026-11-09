import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { contentNavParams } from '../utils/openContent';
import { CATALOG, fmtCount } from '../components/feedShared';
import {
  catalogItem, commentKey, discussBase, epLocked, playerSync, seriesRecommends,
} from '../components/player/playerLib';
import VideoPlayer, { PlayingBars } from '../components/player/VideoPlayer';
import DiscussTab from '../components/player/DiscussTab';
import HighlightsTab from '../components/player/HighlightsTab';
import Img from '../components/Img';
import HScroll from './home/HScroll';
import {
  IcZhui, IcZhuiDone, IcDownload, IcShare, IcLike, IcChevronRight, IcFlame,
} from '../components/player/playerIcons';
import type { CatalogItem } from '../types';

type TabId = 'video' | 'discuss' | 'highlights';

function initProgress(id: string, ep: number, dur: number): number {
  const h = useYoukuStore.getState().history.find((x) => x.id === id && (x.episode ?? 0) === ep);
  return h && h.progressSec < dur ? h.progressSec : 0;
}

/**
 * spec 节点 player.series.main(route /player/series?showId=&ep?=&commentId?=)—— 剧集播放页(a267/a269)。
 * 结构同 player.main,差异:操作行纯图标4个;选集横排+选集面板;会员金色横幅;每集讨论独立
 * (评论 key=`${showId}:${ep}`);VIP集(ep>=vipFrom)未开通显示会员蒙层。ep 缺省=第1集。
 */
export default function PlayerSeriesPage() {
  const [sp] = useSearchParams();
  const showId = sp.get('showId') ?? '';
  const commentId = sp.get('commentId') ?? undefined;
  const item =
    catalogItem(showId) ?? (CATALOG.find((c) => c.type === 'series' && c.episodeCount != null) as CatalogItem);
  return <SeriesInner key={`${item.id}#${commentId ?? ''}`} item={item} commentId={commentId} />;
}

function SeriesInner({ item, commentId }: { item: CatalogItem; commentId?: string }) {
  const { bindTap, action } = useYoukuGestures();
  const { t } = useI18n();
  const [sp, setSearchParams] = useSearchParams();
  const epCount = item.episodeCount ?? 1;

  const member = useYoukuStore((s) => s.membership.active);
  const zhui = useYoukuStore((s) => s.libFollowing.some((e) => e.id === item.id));
  const liked = useYoukuStore((s) => s.likes.some((e) => e.id === item.id));
  const toggleZhui = useYoukuStore((s) => s.toggleZhui);
  const toggleLike = useYoukuStore((s) => s.toggleLike);
  const fakeDownload = useYoukuStore((s) => s.fakeDownload);

  // 当前集:选集面板(playerSync)优先,其次 URL ?ep,缺省第1集
  const [ep, setEp] = useState<number>(() => {
    if (playerSync.showId === item.id && playerSync.ep != null) return playerSync.ep;
    const q = Number(sp.get('ep') ?? '1');
    return Number.isFinite(q) && q >= 1 ? Math.min(q, epCount) : 1;
  });
  const ignoreStaleInitialUrl = useRef(playerSync.showId === item.id && playerSync.ep != null);
  const [tab, setTab] = useState<TabId>(() => (commentId ? 'discuss' : 'video'));
  const [introOpen, setIntroOpen] = useState(false);
  // 续播:按 showId+ep 读历史(qa:Q11)
  const [progress, setProgress] = useState(() => initProgress(item.id, ep, item.durationSec));

  // 切集时同步重置进度(render 期 derived state,避免旧进度写入新集历史)
  const [lastEp, setLastEp] = useState(ep);
  if (lastEp !== ep) {
    setLastEp(ep);
    setProgress(initProgress(item.id, ep, item.durationSec));
  }

  // URL ?ep 与内部状态双向同步(replace 不入栈);选集面板回填单例消费后清理(幂等)
  useEffect(() => {
    if (playerSync.showId === item.id) {
      playerSync.showId = null;
      playerSync.ep = null;
    }
    setSearchParams(
      (p) => {
        if (p.get('ep') !== String(ep)) p.set('ep', String(ep));
        return p;
      },
      { replace: true },
    );
  }, [ep, item.id, setSearchParams]);
  const urlEp = Number(sp.get('ep') ?? '');
  useEffect(() => {
    if (ignoreStaleInitialUrl.current) {
      ignoreStaleInitialUrl.current = false;
      return;
    }
    if (Number.isFinite(urlEp) && urlEp >= 1 && urlEp <= epCount && urlEp !== ep) setEp(urlEp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlEp]);

  const cKey = commentKey(item.id, ep);
  const locked = epLocked(item, ep, member);
  const commentCount = useYoukuStore((s) => (s.commentsByKey[cKey] ?? []).length);
  const recommends = seriesRecommends(item.id);
  const eps = Array.from({ length: epCount }, (_, i) => i + 1);

  return (
    <div data-status-bar-foreground="light" className="flex h-full w-full flex-col bg-black pt-10 text-white">
      <VideoPlayer
        item={item}
        contentKey={cKey}
        historyId={item.id}
        ctype={String(item.type)}
        episode={ep}
        locked={locked}
        progress={progress}
        setProgress={setProgress}
        maskBind={bindTap('player.series.vip.open')}
      />

      {/* 会员金色横幅(模拟版初始未开通用开通文案;假开通后消失 拍板Q7) */}
      {!member && (
        <div className="flex shrink-0 items-center gap-2 bg-gradient-to-r from-[#3A2E1C] to-[#6B5636] px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#F4DFAC]">
            {t('player.series.banner.title')}
          </span>
          <button
            {...bindTap('player.series.vipBanner.open')}
            className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[#F8E3A8] to-[#E9C177] px-3.5 py-1.5 text-[13px] font-medium text-[#5C4318]"
          >
            {t('player.series.banner.btn')}
          </button>
        </div>
      )}

      {/* tab行:视频 / 讨论(每集独立计数) / 看点 */}
      <div className="flex shrink-0 items-center gap-5 px-3 py-2.5">
        {(['video', 'discuss', 'highlights'] as TabId[]).map((tb) => (
          <button
            key={tb}
            {...action('player.series.tab.select.option', () => setTab(tb), { params: { value: tb } })}
            className={`flex cursor-pointer items-baseline gap-0.5 border-none bg-transparent p-0 ${
              tab === tb ? 'text-[19px] font-bold text-white' : 'text-[15px] text-[#8A8A8A]'
            }`}
          >
            {t(`player.tab.${tb === 'highlights' ? 'highlights' : tb}`)}
            {tb === 'discuss' && (
              <span className="text-[10px] font-normal text-[#8A8A8A]">
                {fmtCount(discussBase(cKey) + commentCount)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ---------------- 视频tab ---------------- */}
      {tab === 'video' && (
        <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
          {/* 标题 + 简介> + 热度/题材标签 */}
          <div className="flex items-center gap-2.5 px-3 pt-1.5">
            <span className="text-[22px] font-bold">{item.title}</span>
            <button
              {...action('player.intro.expand', () => setIntroOpen((v) => !v))}
              className="flex cursor-pointer items-center border-none bg-transparent p-0 text-[13px] text-[#999999]"
            >
              {t('player.intro')}
              <IcChevronRight size={14} className={introOpen ? 'rotate-90' : ''} />
            </button>
          </div>
          {introOpen && (
            <div className="mx-3 mt-2 rounded-xl bg-[#141414] p-3 text-[13px] leading-5 text-[#BBBBBB]">
              <div>{item.desc}</div>
              <div className="mt-2 text-[#999999]">
                {t('player.intro.director')}:{item.director} / {t('player.intro.actors')}:{item.actors.join(' ')}
              </div>
            </div>
          )}
          <div className="mt-2.5 flex items-center gap-2 px-3">
            <span className="flex items-center gap-1 rounded-md bg-[#1A1A1A] px-2 py-1 text-[12px] text-[#BBBBBB]">
              <IcFlame size={12} className="text-[#FF6000]" />
              {item.heat}
            </span>
            <span className="rounded-md bg-[#1A1A1A] px-2 py-1 text-[12px] text-[#BBBBBB]">{item.tags.join(' ')}</span>
          </div>

          {/* 操作行(纯图标):加追 / 下载VIP / 分享 / 点赞 */}
          <div className="mt-4 flex items-center justify-around px-6">
            <button
              {...action('player.follow.toggle', () => toggleZhui(item.id, String(item.type)))}
              aria-label={zhui ? t('home.followed') : t('home.follow')}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
            >
              {zhui ? <IcZhuiDone size={24} className="text-[#0C7BFF]" /> : <IcZhui size={24} className="text-white" />}
            </button>
            <button
              {...action('player.download.fakeStart', () => fakeDownload(item.id, String(item.type), ep))}
              aria-label="缓存"
              className="relative flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
            >
              <IcDownload size={24} className="text-white" />
              <span className="absolute -right-4 -top-1.5 rounded-sm bg-[#3A2E1C] px-0.5 text-[9px] leading-3 text-[#E8C87E]">
                VIP
              </span>
            </button>
            <button {...bindTap('player.series.share.open')} aria-label="分享" className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0">
              <IcShare size={24} className="text-white" />
            </button>
            <button
              {...action('player.like.toggle', () => toggleLike(item.id, String(item.type)))}
              aria-label={liked ? '已点赞' : '点赞'}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
            >
              <IcLike size={24} className={liked ? 'fill-[#0C7BFF] text-[#0C7BFF]' : 'text-white'} />
            </button>
          </div>

          {/* 选集:『选集 N集全>』+ 集数chips横排(播放中动画/试看/VIP角标) */}
          <div className="mt-5">
            <div {...bindTap('player.series.episodes.open')} className="flex cursor-pointer items-center gap-1.5 px-3">
              <span className="text-[19px] font-bold">{t('player.series.episodes')}</span>
              <span className="flex items-center text-[13px] text-[#999999]">
                {t('player.series.epAll', { n: epCount })}
                <IcChevronRight size={14} />
              </span>
            </div>
            <HScroll id="player-series-eps" className="mt-2.5 gap-2 px-3">
              {eps.map((n) => (
                <button
                  key={n}
                  {...action('player.series.episode.select.option', () => setEp(n), { params: { value: n } })}
                  className="relative flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-[#1A1A1A] text-[16px] text-white"
                >
                  {n === ep ? <PlayingBars /> : n}
                  {n === item.trialEp && (
                    <span className="absolute -top-0 right-0 rounded-bl-md rounded-tr-lg bg-[#3A3A3A] px-1 py-0.5 text-[8px] leading-none text-white">
                      {t('player.series.trial')}
                    </span>
                  )}
                  {item.vipFrom != null && n >= item.vipFrom && (
                    <span className="absolute -top-0 right-0 rounded-bl-md rounded-tr-lg bg-black/50 px-1 py-0.5 text-[8px] font-semibold leading-none text-[#E8C87E]">
                      VIP
                    </span>
                  )}
                </button>
              ))}
            </HScroll>
          </div>

          {/* 为你推荐:三列海报(独播角标) */}
          <div className="mt-5 px-3">
            <div className="text-[19px] font-bold">{t('player.recommend')}</div>
            <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-4">
              {recommends.map((r) => (
                <div
                  key={r.id}
                  {...bindTap('player.series.recommend.open', { params: contentNavParams(r, { ep: '1' }) })}
                  className="cursor-pointer"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#1A1A1A]">
                    <Img src={r.poster} label={r.title} ratio="poster" className="h-full w-full object-cover" />
                    {r.badge && (
                      <span className="absolute right-0 top-0 rounded-bl-md bg-black/45 px-1 py-0.5 text-[10px] leading-tight text-white">
                        {r.badge}
                      </span>
                    )}
                    {r.updatedTo != null && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                        {r.updatedTo === r.episodeCount
                          ? t('player.series.epAll', { n: r.episodeCount })
                          : t('home.epUpdatedTo', { n: r.updatedTo })}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 truncate text-[14px] text-white">{r.title}</div>
                  <div className="mt-0.5 truncate text-[12px] text-[#999999]">{r.recTitle}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 讨论tab(每集独立) ---------------- */}
      {tab === 'discuss' && (
        <DiscussTab contentKey={cKey} contentId={item.id} episode={ep} currentSec={progress} focusCommentId={commentId} />
      )}

      {/* ---------------- 看点tab ---------------- */}
      {tab === 'highlights' && <HighlightsTab contentId={item.id} />}
    </div>
  );
}
