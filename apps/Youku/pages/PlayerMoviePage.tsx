import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import { CATALOG, fmtCount } from '../components/feedShared';
import {
  catalogItem, commentKey, discussBase, isVipMovie, movieRecommends, playerSync, seriesFilms, LANG_VALUE,
} from '../components/player/playerLib';
import VideoPlayer, { PlayingBars } from '../components/player/VideoPlayer';
import DiscussTab from '../components/player/DiscussTab';
import HighlightsTab from '../components/player/HighlightsTab';
import Img from '../components/Img';
import {
  IcZhui, IcZhuiDone, IcDownload, IcShare, IcLike, IcChevronRight, IcStar,
} from '../components/player/playerIcons';
import type { CatalogItem } from '../types';

type TabId = 'video' | 'discuss' | 'highlights';

/**
 * spec 节点 player.main(route /player?videoId=&commentId?=)—— 电影播放页(s237~s241/s257~s259/a266)。
 * uiStates:videoTab / discussTab / highlightsTab。贴片/信息流/品牌广告卡按 spec 全部移除,版面用内容补齐。
 * commentId=赞通知定位评论(进讨论tab并滚动到该条);从历史进入进度条停上次位置续播(qa:Q11)。
 */
export default function PlayerMoviePage() {
  const [sp] = useSearchParams();
  const videoId = sp.get('videoId') ?? '';
  const commentId = sp.get('commentId') ?? undefined;
  const item = catalogItem(videoId) ?? (CATALOG.find((c) => c.type === 'movie') as CatalogItem);
  // key 驱动换片重挂载(系列卡/推荐卡 push 同路由时重置 tab/进度/展开态)
  return <MovieInner key={`${item.id}#${commentId ?? ''}`} item={item} commentId={commentId} />;
}

function MovieInner({ item, commentId }: { item: CatalogItem; commentId?: string }) {
  const { bindTap, action } = useYoukuGestures();
  const { t } = useI18n();

  const member = useYoukuStore((s) => s.membership.active);
  const zhui = useYoukuStore((s) => s.libFollowing.some((e) => e.id === item.id));
  const liked = useYoukuStore((s) => s.likes.some((e) => e.id === item.id));
  const rated = useYoukuStore((s) => !!s.ratings[item.id]);
  const lang = useYoukuStore((s) => s.playback.languages[item.id]);
  const commentCount = useYoukuStore((s) => (s.commentsByKey[item.id] ?? []).length);
  const toggleZhui = useYoukuStore((s) => s.toggleZhui);
  const toggleLike = useYoukuStore((s) => s.toggleLike);
  const fakeDownload = useYoukuStore((s) => s.fakeDownload);
  const setLanguage = useYoukuStore((s) => s.setLanguage);
  const showToast = useYoukuStore((s) => s.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const cKey = commentKey(item.id);
  const locked = isVipMovie(item) && !member;

  const [tab, setTab] = useState<TabId>(() =>
    commentId || playerSync.discussKey === item.id ? 'discuss' : 'video',
  );
  const [introOpen, setIntroOpen] = useState(false);
  // 续播:从历史进入停在上次位置(qa:Q11);走秒/拖动实时写回历史(VideoPlayer 内)
  const [progress, setProgress] = useState(() => {
    const h = useYoukuStore.getState().history.find((x) => x.id === item.id && (x.episode ?? 0) === 0);
    return h && h.progressSec < item.durationSec ? h.progressSec : 0;
  });
  useEffect(() => {
    // 评分页返回讨论tab 的一次性同步已在 useState 初始化消费,这里清理(重复执行幂等)
    if (playerSync.discussKey === item.id) playerSync.discussKey = null;
  }, [item.id]);

  const films = seriesFilms(item);
  const recommends = movieRecommends(item.id);
  const seriesTitle = `${item.title.replace(/[0-9].*$/, '').replace(/[·.].*$/, '')}${t('player.series.suffix')}`;
  const metaChips: string[] = [
    `${t('player.meta.nIndex')}${(item.heat / 100).toFixed(2)}`,
    `${item.rating.toFixed(1)}${t('player.meta.scoreUnit')}`,
    ...(item.douban ? [`${t('player.meta.douban')} ${item.douban.toFixed(1)}${t('player.meta.scoreUnit')}`] : []),
    ...(item.badge ? [item.badge] : []),
    ...item.tags,
  ];

  return (
    <div data-status-bar-foreground="light" className="flex h-full w-full flex-col bg-black pt-10 text-white">
      <VideoPlayer
        item={item}
        contentKey={cKey}
        historyId={item.id}
        ctype="movie"
        locked={locked}
        progress={progress}
        setProgress={setProgress}
        maskBind={bindTap('player.vipMask.open')}
        moreBind={bindTap('player.more.share.open')}
      />

      {/* tab行:视频 / 讨论(计数) / 看点 + 会员胶囊(假开通后变已开通态 拍板Q7) */}
      <div className="flex shrink-0 items-center gap-5 px-3 py-2.5">
        <button
          {...action('player.tab.select.video', () => setTab('video'), { params: { value: 'video' } })}
          className={`cursor-pointer border-none bg-transparent p-0 ${
            tab === 'video' ? 'text-[19px] font-bold text-white' : 'text-[15px] text-[#8A8A8A]'
          }`}
        >
          {t('player.tab.video')}
        </button>
        <button
          {...action('player.tab.select.discuss', () => setTab('discuss'), { params: { value: 'discuss' } })}
          className={`flex cursor-pointer items-baseline gap-0.5 border-none bg-transparent p-0 ${
            tab === 'discuss' ? 'text-[19px] font-bold text-white' : 'text-[15px] text-[#8A8A8A]'
          }`}
        >
          {t('player.tab.discuss')}
          <span className="text-[10px] font-normal text-[#8A8A8A]">{fmtCount(discussBase(cKey) + commentCount)}</span>
        </button>
        <button
          {...action('player.tab.select.highlights', () => setTab('highlights'), { params: { value: 'highlights' } })}
          className={`cursor-pointer border-none bg-transparent p-0 ${
            tab === 'highlights' ? 'text-[19px] font-bold text-white' : 'text-[15px] text-[#8A8A8A]'
          }`}
        >
          {t('player.tab.highlights')}
        </button>
        <button
          {...bindTap('player.vipCapsule.open')}
          className={`ml-auto shrink-0 cursor-pointer rounded-full border-none px-3.5 py-1.5 text-[13px] font-medium ${
            member
              ? 'bg-[#3A2E1C] text-[#E8C87E]'
              : 'bg-gradient-to-r from-[#F8E3A8] to-[#E9C177] text-[#5C4318]'
          }`}
        >
          {member ? t('player.capsule.active') : t('player.capsule')}
        </button>
      </div>

      {/* ---------------- 视频tab ---------------- */}
      {tab === 'video' && (
        <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
          {/* 标题 + 简介>(展开:剧情/导演/主演) */}
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
              <div className="mt-1 text-[#999999]">
                {item.year} · {item.region} · {item.tags.join(' ')}
              </div>
            </div>
          )}

          {/* 评分标签行(N刷指数/优酷评分/豆瓣/角标/题材,同组 wontfix) */}
          <div className="mt-3 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
            {metaChips.map((c, i) => (
              <button
                key={c}
                {...action('player.metaTags.wontfixToast', wontfix)}
                className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md border-none px-2.5 py-1.5 text-[12px] ${
                  i <= 1 ? 'bg-[#1B222E] text-[#3D8BFF]' : 'bg-[#1A1A1A] text-[#BBBBBB]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* 操作行:+追 / 缓存VIP / 分享 / 点赞 */}
          <div className="mt-4 flex items-center justify-around px-6">
            <button
              {...action('player.follow.toggle', () => toggleZhui(item.id, 'movie'))}
              aria-label={zhui ? t('home.followed') : t('home.follow')}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
            >
              {zhui ? <IcZhuiDone size={24} className="text-[#0C7BFF]" /> : <IcZhui size={24} className="text-white" />}
            </button>
            <button
              {...action('player.download.fakeStart', () => fakeDownload(item.id, 'movie'))}
              aria-label="缓存"
              className="relative flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
            >
              <IcDownload size={24} className="text-white" />
              <span className="absolute -right-4 -top-1.5 rounded-sm bg-[#3A2E1C] px-0.5 text-[9px] leading-3 text-[#E8C87E]">
                VIP
              </span>
            </button>
            <button {...bindTap('player.share.open')} aria-label="分享" className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0">
              <IcShare size={24} className="text-white" />
            </button>
            <button
              {...action('player.like.toggle', () => toggleLike(item.id, 'movie'))}
              aria-label={liked ? '已点赞' : '点赞'}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
            >
              <IcLike size={24} className={liked ? 'fill-[#0C7BFF] text-[#0C7BFF]' : 'text-white'} />
            </button>
          </div>

          {/* 语言选择(部分影片,s240;选中持久 仅状态) */}
          {item.languages && item.languages.length > 0 && (
            <div className="mt-5 px-3">
              <div className="text-[19px] font-bold">{t('player.language')}</div>
              <div className="mt-2.5 flex gap-2 overflow-x-auto [scrollbar-width:none]">
                {item.languages.map((lg) => {
                  const selected = (lang ?? item.languages?.[0]) === lg;
                  return (
                    <button
                      key={lg}
                      {...action('player.language.select.option', () => setLanguage(item.id, lg), {
                        params: { value: LANG_VALUE[lg] ?? lg },
                      })}
                      className={`h-11 shrink-0 cursor-pointer rounded-lg px-8 text-[15px] ${
                        selected
                          ? 'border border-[#CCCCCC] bg-transparent font-medium text-white'
                          : 'border-none bg-[#1F1F1F] text-[#BBBBBB]'
                      }`}
                    >
                      {lg}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 系列电影横滑 + 查看更多(当前片=播放中指示) */}
          {films.length > 1 && (
            <div className="mt-5">
              <div className="flex items-center px-3">
                <span className="text-[19px] font-bold">{seriesTitle}</span>
                <button
                  {...action('player.seriesMore.wontfixToast', wontfix)}
                  className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[13px] text-[#8A8A8A]"
                >
                  {t('player.more')}
                </button>
              </div>
              <div className="mt-2.5 flex gap-2 overflow-x-auto px-3 [scrollbar-width:none]">
                {films.map((f) => (
                  <div
                    key={f.id}
                    {...bindTap('player.seriesFilm.open', { params: contentNavParams(f) })}
                    className="w-[150px] shrink-0 cursor-pointer"
                  >
                    <div className="relative aspect-video overflow-hidden rounded-lg bg-[#1A1A1A]">
                      <Img src={f.still} label={f.title} ratio="landscape" className="h-full w-full object-cover" />
                      <span className="absolute right-0 top-0 rounded-bl-md bg-gradient-to-r from-[#F0D9A0] to-[#D9B36A] px-1 py-0.5 text-[9px] font-semibold leading-none text-[#5C4318]">
                        帧享60帧
                      </span>
                      {f.id === item.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                          <PlayingBars />
                        </div>
                      )}
                    </div>
                    <div className={`mt-1.5 truncate text-[14px] ${f.id === item.id ? 'text-[#0C7BFF]' : 'text-white'}`}>
                      {f.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 为你推荐:三列海报(票房破N亿/角标) */}
          <div className="mt-5 px-3">
            <div className="text-[19px] font-bold">{t('player.recommend')}</div>
            <div className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-4">
              {recommends.map((r) => (
                <div key={r.id} {...bindTap('player.recommend.open', { params: contentNavParams(r) })} className="cursor-pointer">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-[#1A1A1A]">
                    <Img src={r.poster} label={r.title} ratio="poster" className="h-full w-full object-cover" />
                    {r.boxOffice ? (
                      <span className="absolute left-0 top-0 rounded-br-md bg-black/45 px-1 py-0.5 text-[10px] leading-tight text-[#FFB25C]">
                        {r.boxOffice}
                      </span>
                    ) : (
                      r.badge && (
                        <span className="absolute left-0 top-0 rounded-br-md bg-black/45 px-1 py-0.5 text-[10px] leading-tight text-white">
                          {r.badge}
                        </span>
                      )
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

      {/* ---------------- 讨论tab(评分入口 未评↔已评橙色 a266) ---------------- */}
      {tab === 'discuss' && (
        <DiscussTab
          contentKey={cKey}
          contentId={item.id}
          currentSec={progress}
          focusCommentId={commentId}
          ratingEntry={
            <button
              {...bindTap('player.rating.open', {
                params: { videoId: item.id },
                beforeTrigger: () => {
                  playerSync.discussKey = item.id;
                },
              })}
              className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent p-0"
            >
              <IcStar size={20} className={rated ? 'fill-[#FF6000] text-[#FF6000]' : 'text-[#CCCCCC]'} />
              <span className={`text-[10px] ${rated ? 'text-[#FF6000]' : 'text-[#CCCCCC]'}`}>
                {rated ? t('player.comment.rated') : t('player.comment.rate')}
              </span>
            </button>
          }
        />
      )}

      {/* ---------------- 看点tab(二创双列→shorts feed 拍板Q5) ---------------- */}
      {tab === 'highlights' && <HighlightsTab contentId={item.id} />}
    </div>
  );
}
