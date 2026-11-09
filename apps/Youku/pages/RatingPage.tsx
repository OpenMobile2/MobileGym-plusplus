import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { CATALOG } from '../components/feedShared';
import { catalogItem, playerSync } from '../components/player/playerLib';
import Img from '../components/Img';
import { IcClose, IcStar } from '../components/player/playerIcons';
import type { CatalogItem } from '../types';

/**
 * spec 节点 player.rating.page(route /player/rating?videoId=)—— 优酷评分页(a264/a265,Q4答案B)。
 * uiStates:unrated(灰星+提交置灰)/ rated(大字橙色分数+评语+橙星)。星星支持点击或滑动(PointerEvent,半星步进)。
 * 提交:保存评分(感受非空作为影评入讨论tab)→ back 回播放页讨论tab,入口变橙色『已评』(a266);再进可改分。
 */
export default function RatingPage() {
  const { action, bindBack, back } = useYoukuGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const videoId = sp.get('videoId') ?? '';
  const item = catalogItem(videoId) ?? (CATALOG.find((c) => c.type === 'movie') as CatalogItem);

  const existing = useYoukuStore((s) => s.ratings[item.id]);
  const submitRating = useYoukuStore((s) => s.submitRating);

  // stars ∈ 0.5 步进 0~5;分数=stars*2(2.0糟糕~10.0完美);已评进入=回显可改分(以最新一次为准)
  const [stars, setStars] = useState<number>(() => (existing ? existing.score / 2 : 0));
  const [review, setReview] = useState<string>(() => existing?.review ?? '');
  const score = stars * 2;
  const verdict =
    score <= 0 ? '' : score <= 2 ? t('rating.v1') : score <= 4 ? t('rating.v2') : score <= 6 ? t('rating.v3') : score <= 8 ? t('rating.v4') : t('rating.v5');

  // 滑动选星(半星步进,AGENTS:连续手势 PointerEvent)
  const rowRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const slideTo = (clientX: number) => {
    const r = rowRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setStars(Math.max(0.5, Math.round(pct * 10) / 2));
  };

  const submit = () => {
    if (stars <= 0) return;
    submitRating(item.id, score, review.trim());
    playerSync.discussKey = item.id;
    back();
  };

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶部播放器区(静态剧照 + 返回) */}
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-[#111111]">
        <Img src={item.still} label={item.title} ratio="landscape" className="h-full w-full object-cover opacity-60" />
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="absolute left-2 top-1 flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent text-[22px] leading-none text-(--app-c-text-primary)"
        >
          ‹
        </button>
      </div>

      {/* 面板:标题 + 关闭× */}
      <div className="flex shrink-0 items-center px-4 pt-3.5">
        <span className="text-[18px] font-bold">{t('rating.title')}</span>
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[#CCCCCC]"
        >
          <IcClose size={20} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6">
        {/* 评分区:未评=引导文案;已评=大字橙色分数+评语 */}
        <div className="mt-10 text-center">
          {stars > 0 ? (
            <>
              <div className="text-[56px] font-bold leading-none text-[#FF6000]">{score.toFixed(1)}</div>
              <div className="mt-3 text-[15px] text-(--app-c-text-primary)">{verdict}</div>
            </>
          ) : (
            <div className="text-[17px] font-medium text-(--app-c-text-primary)">{t('rating.hint')}</div>
          )}
          <div className="mt-3 text-[13px] text-[#999999]">{t('rating.subhint')}</div>
        </div>

        {/* 5颗星:点击或滑动(半星步进) */}
        <div
          ref={rowRef}
          className="mx-auto mt-7 flex touch-none items-center gap-4"
          onPointerDown={(e) => {
            dragging.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            slideTo(e.clientX);
          }}
          onPointerMove={(e) => {
            if (dragging.current) slideTo(e.clientX);
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        >
          {[0, 1, 2, 3, 4].map((i) => {
            const fill = Math.min(1, Math.max(0, stars - i));
            return (
              <button
                key={i}
                {...action('player.rating.stars.select.value', () => setStars(i + 1), {
                  params: { value: (i + 1) * 2 },
                })}
                aria-label={`${(i + 1) * 2}`}
                className="relative cursor-pointer border-none bg-transparent p-0"
              >
                <IcStar size={42} className="text-[#3A3A3A]" />
                {fill > 0 && (
                  <span
                    className="absolute inset-y-0 left-0 overflow-hidden"
                    style={{ width: fill >= 1 ? '100%' : '50%' }}
                  >
                    <IcStar size={42} className="fill-[#FF6000] text-[#FF6000]" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 感受输入框 */}
        <textarea
          data-action="player.rating.review.input"
          data-action-type="input"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder={t('rating.placeholder')}
          className="mt-8 h-32 w-full resize-none rounded-xl border-none bg-(--app-c-card-bg) p-3.5 text-[14px] leading-6 text-(--app-c-text-primary) outline-none placeholder:text-[#666666]"
        />

        {/* 提交(未选星置灰) */}
        <button
          {...action('player.rating.submit', submit)}
          className={`mt-8 h-12 w-full shrink-0 rounded-lg border-none text-[16px] ${
            stars > 0 ? 'cursor-pointer bg-(--app-c-chip-bg) font-medium text-(--app-c-text-primary)' : 'bg-(--app-c-card-bg) text-[#666666]'
          }`}
        >
          {t('rating.submit')}
        </button>

        {/* 底部评分巡检声明(静态) */}
        <div className="mb-4 mt-6 text-center text-[12px] leading-5 text-[#666666]">{t('rating.notice')}</div>
      </div>
    </div>
  );
}
