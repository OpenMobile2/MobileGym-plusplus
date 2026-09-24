// 二创 tab(短视频瀑布流)。节点 detail.ugc(spec v1.2.0,4 条交互)。
// 视觉证据:805(沿用宿主详情页黑条 +「详情/二创/讨论」tab 行 + 栏目标题「精彩短视频无限刷」+
// 双列瀑布流卡:封面 + 两行标题 + 作者行 + 右侧 ♡ 赞数,广告卡混排在第二列)。
//
// 本节点是详情页内 tab,返回沿用宿主详情页返回键(spec note),故 tab 行的「详情」= bindBack();
// 「讨论」在本路由没有申报 transition,渲染为纯文本(不做假按钮)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { DetailHostBar, DetailSubTabRow } from '../components/detailExtra';
import type { TvShortVideoItem } from '../types';
import { IcArrowRight, IcHeart } from '../res/icons';

const UI_PAGES = 'detail.ugc.pages';

/** 广告卡 CTA(证据 805 左下角;第三方文案保持中文) */
const AD_CTA = '去微信看看';
/** 瀑布流底部的上滑加载位(spec:瀑布流上滑 = 循环加载更多二创) */
const LOAD_MORE_LABEL = '上滑加载更多';

/** 瀑布流高度节奏(证据 805 双列高矮交错),按下标取模保持确定性 */
const CARD_ASPECTS = ['aspect-[3/4]', 'aspect-[4/3]', 'aspect-[1/1]', 'aspect-[3/4]'];

export default function DetailUgcPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const content = useTvContent('tv_');
  const detail = useTencentvideoStore((st) => st.detail);
  const channels = useTencentvideoStore((st) => st.channels);
  const likedContentIds = useTencentvideoStore((st) => st.likedContentIds);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const likeToggle = useTencentvideoStore((st) => st.likeToggle);

  const contentId = content?.id ?? '';
  const tabs = useMemo(() => detail.tabs.slice(0, 3), [detail.tabs]);
  const pages = typeof ui[UI_PAGES] === 'number' ? (ui[UI_PAGES] as number) : 1;

  /** 二创物料池:与本片相关的短视频排在前面,其余补位(种子只有一份短视频池) */
  const pool = useMemo<TvShortVideoItem[]>(() => {
    const items = (channels.shortvideo?.items ?? []) as TvShortVideoItem[];
    const mine = items.filter((it) => it.linkedFilm === contentId);
    const rest = items.filter((it) => it.linkedFilm !== contentId);
    return [...mine, ...rest];
  }, [channels.shortvideo, contentId]);

  /** 上滑加载更多 = 循环种子(spec stateChange 明确「循环种子」) */
  const feed = useMemo(
    () => Array.from({ length: pages }, (_, page) => pool.map((it) => ({ it, page }))).flat(),
    [pool, pages],
  );

  const likeCount = (it: TvShortVideoItem, liked: boolean): string => {
    if (!liked) return it.likesText;
    return /^\d+$/.test(it.likesText) ? String(Number(it.likesText) + 1) : it.likesText;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      <DetailHostBar backBind={bindBack()} playLabel={s.playNowBar} />
      <DetailSubTabRow
        tabs={tabs}
        activeTab="二创"
        badges={{ 讨论: typeof content?.discussCount === 'number' ? String(content.discussCount) : undefined }}
        getTabBind={(tab) => (tab === '详情' ? bindBack() : undefined)}
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-3 pt-1 pb-2 text-[15px] font-bold" style={{ color: C.text }}>
          {s.ugcBanner}
        </div>

        <div className="px-3 columns-2 gap-2.5">
          {feed.map(({ it, page }, i) => {
            const liked = likedContentIds.includes(it.id);
            return (
              <React.Fragment key={`${it.id}_${page}`}>
                <div className="break-inside-avoid mb-3">
                  <div
                    {...bindTap('home.shortvideo.open.fromUgc')}
                    className={`relative w-full rounded-lg overflow-hidden ${CARD_ASPECTS[i % CARD_ASPECTS.length]}`}
                  >
                    <TvImg id={it.cover} alt={it.title} className="w-full h-full object-cover" />
                    {it.topic && (
                      <span
                        className="absolute bottom-1 left-1 rounded px-1 py-[1px] text-[10px] leading-[14px] text-white"
                        style={{ background: C.maskBadge }}
                      >
                        {it.topic}
                      </span>
                    )}
                  </div>
                  <div
                    {...bindTap('home.shortvideo.open.fromUgc')}
                    className="mt-1.5 text-[13px] leading-[18px] line-clamp-2"
                    style={{ color: C.text }}
                  >
                    {it.title}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                      <TvImg id={it.avatar} alt={it.author} className="w-full h-full object-cover" />
                    </div>
                    <span className="flex-1 min-w-0 text-[11px] truncate" style={{ color: C.textSub }}>
                      {it.author}
                    </span>
                    <button
                      {...bindTap({ kind: 'action', id: 'detail.ugc.like.toggle' }, {
                        stopPropagation: true,
                        onTrigger: () => likeToggle(it.id),
                      })}
                      className="shrink-0 flex items-center gap-0.5 bg-transparent border-none p-0 text-[11px]"
                      style={{ color: liked ? C.unlockRed : C.textSub }}
                    >
                      <IcHeart size={13} fill={liked ? C.unlockRed : 'none'} />
                      {likeCount(it, liked)}
                    </button>
                  </div>
                </div>

                {/* 广告卡混排:每一轮种子后插一张(证据 805 第二列第二张为广告) */}
                {i % Math.max(1, pool.length) === 1 && (
                  <div className="break-inside-avoid mb-3">
                    <button
                      {...bindTap({ kind: 'action', id: 'detail.ugc.ad.wontfix' }, {
                        onTrigger: () => toast(s.notOpen),
                      })}
                      className="relative block w-full rounded-lg overflow-hidden border-none p-0 aspect-[3/4]"
                      style={{ background: C.chipGray }}
                    >
                      <TvImg id={detail.adCard.img} alt={detail.adCard.badge} className="w-full h-full object-cover" />
                      <span
                        className="absolute top-1 right-1 rounded px-1 text-[10px] leading-[14px] text-white"
                        style={{ background: C.maskBadge }}
                      >
                        {detail.adCard.badge}
                      </span>
                      <span
                        className="absolute bottom-1 left-1 flex items-center rounded px-1 text-[10px] leading-[14px] text-white"
                        style={{ background: C.maskBadge }}
                      >
                        {AD_CTA}
                        <IcArrowRight size={10} />
                      </span>
                    </button>
                    <div className="mt-1.5 text-[13px] leading-[18px] line-clamp-2" style={{ color: C.text }}>
                      {detail.adCard.title}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <button
          {...bindTap({ kind: 'action', id: 'detail.ugc.feed.loadMore' }, {
            onTrigger: () => setUi(UI_PAGES, pages + 1),
          })}
          className="block w-full bg-transparent border-none py-4 text-center text-[12px]"
          style={{ color: C.textSub }}
        >
          {LOAD_MORE_LABEL}
        </button>
      </div>
    </div>
  );
}
