import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcStar, IcThumbsUp, IcCheck } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import type { RuntimeReviewItem } from '../types';
import {
  productOf, fallbackSummary, reviewTags, reviewHasTag, isPremiumReview, defaultSelection, selectionText,
} from '../utils/detail';
import { fmtYmd } from '../utils/appTime';

type FilterKey = 'all' | 'hasImage' | 'premium' | 'mid' | 'bad';

/**
 * 商品评价页(spec product.reviews,s341):只看当前规格开关 / 标签云 / 五维筛选Tab /
 * 最新·默认排序 / 点赞;「去选购」与返回同为 bindBack(唯一入口是商详评价区)。
 */
export default function ProductReviewsPage() {
  const { action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const product = productOf(productId);
  const reviews = useSuningStore((s) => s.reviews);
  const likedReviewIds = useSuningStore((s) => s.likedReviewIds);
  const toggleReviewLike = useSuningStore((s) => s.toggleReviewLike);
  const recordTaskAudit = useSuningStore((s) => s.recordTaskAudit);

  const [filterKey, setFilterKey] = useState<FilterKey>('all');
  const [latestFirst, setLatestFirst] = useState(false);
  const [tag, setTag] = useState<string | null>(null);
  const [currentOnly, setCurrentOnly] = useState(false);

  if (!product) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-surface)] pt-10">
        <button {...bindBack()} className="w-10 cursor-pointer border-none bg-transparent p-2 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="py-16 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>
      </div>
    );
  }

  const data = reviews[product.id];
  const summary = data?.summary ?? fallbackSummary(product);
  const all = data?.items ?? [];
  const defaultSku = selectionText(product, defaultSelection(product));

  const matchFilter = (it: RuntimeReviewItem): boolean => {
    if (filterKey === 'hasImage') return (it.images?.length ?? 0) > 0;
    if (filterKey === 'premium') return isPremiumReview(it);
    if (filterKey === 'mid') return it.stars === 3;
    if (filterKey === 'bad') return it.stars <= 2;
    return true;
  };

  let list = all.filter(matchFilter);
  if (currentOnly && defaultSku) list = list.filter((it) => it.sku === defaultSku);
  if (tag) list = list.filter((it) => reviewHasTag(it, tag));
  list = latestFirst ? [...list].sort((a, b) => b.ts - a.ts) : [...list].sort((a, b) => b.likes - a.likes);

  const tags = reviewTags(all);
  // 筛选Tab 计数取商品评价摘要口径(s341:全部42/有图8/优质33/中评3/差评0)
  const tabs = [
    { key: 'all' as const, label: S.filterAll, count: summary.total, bind: action('product.reviews.select.all', () => { setFilterKey('all'); recordTaskAudit({ reviewFilter: { productId, filter: 'all' } }); }) },
    { key: 'hasImage' as const, label: S.filterHasImage, count: summary.withImages, bind: action('product.reviews.select.hasImage', () => { setFilterKey('hasImage'); recordTaskAudit({ reviewFilter: { productId, filter: 'hasImage' } }); }) },
    { key: 'premium' as const, label: S.filterPremium, count: summary.quality, bind: action('product.reviews.select.premium', () => setFilterKey('premium')) },
    { key: 'mid' as const, label: S.filterMid, count: summary.mid, bind: action('product.reviews.select.mid', () => setFilterKey('mid')) },
    { key: 'bad' as const, label: S.filterBad, count: summary.bad, bind: action('product.reviews.select.bad', () => setFilterKey('bad')) },
  ];

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏 */}
      <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.reviewsTitle}</div>
        <div className="w-8" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 只看当前商品评价开关 + 好评率 */}
        <div className="flex items-center bg-[var(--app-surface)] px-3 py-2.5">
          <button
            {...action('product.reviews.currentOnly.toggle', () => setCurrentOnly((v) => !v))}
            className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full ${
                currentOnly ? 'bg-[var(--app-primary)] text-white' : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-transparent'
              }`}
            >
              <IcCheck size={11} />
            </span>
            <span className="text-[13px] text-[var(--app-text)]">{S.currentOnly}</span>
          </button>
          <span className="ml-auto text-[13px] text-[var(--app-c-danger)]">
            {summary.goodRate}% {S.goodRateLabel}
          </span>
        </div>

        {/* 标签云 chips */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 bg-[var(--app-surface)] px-3 pb-3">
            {tags.map((t) => {
              const active = tag === t.label;
              return (
                <button
                  key={t.label}
                  {...action('product.reviews.tagFilter.toggle', () => setTag(active ? null : t.label), {
                    params: { value: t.label },
                  })}
                  className={`cursor-pointer rounded-full px-2.5 py-1 text-[12px] leading-4 ${
                    active
                      ? 'border border-[var(--app-primary)] bg-[#FFF3E8] font-semibold text-[var(--app-primary)]'
                      : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
                  }`}
                >
                  {t.label}({t.count})
                </button>
              );
            })}
          </div>
        )}

        {/* 筛选Tab + 排序 */}
        <div className="mt-1 bg-[var(--app-surface)] px-3 pb-2 pt-2">
          <div className="flex gap-2 overflow-x-auto" data-scroll-container="reviewTabs" data-scroll-direction="horizontal">
            {tabs.map((t) => (
              <button
                key={t.key}
                {...t.bind}
                className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-[12px] leading-4 ${
                  filterKey === t.key
                    ? 'border-none bg-[var(--app-primary)] font-semibold text-white'
                    : 'border-none bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
                }`}
              >
                {t.label}({t.count})
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-4">
            <button
              {...action('product.reviews.select.latest', () => setLatestFirst(true))}
              className={`cursor-pointer border-none bg-transparent p-0 text-[12px] ${
                latestFirst ? 'font-bold text-[var(--app-text)]' : 'text-[var(--app-c-text-muted)]'
              }`}
            >
              {S.sortLatest}
            </button>
            <button
              {...action('product.reviews.select.default', () => setLatestFirst(false))}
              className={`cursor-pointer border-none bg-transparent p-0 text-[12px] ${
                latestFirst ? 'text-[var(--app-c-text-muted)]' : 'font-bold text-[var(--app-text)]'
              }`}
            >
              {S.sortDefaultReview}
            </button>
          </div>
        </div>

        {/* 评价列表 */}
        <div className="mt-1 bg-[var(--app-surface)] px-3 pb-4">
          {list.map((it) => {
            const isLiked = likedReviewIds.includes(it.id);
            return (
              <div key={it.id} className="border-b border-[var(--app-border)] py-3 last:border-b-0">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#FDE8D5]" />
                  <span className="text-[13px] text-[var(--app-text)]">{it.nick}</span>
                  <span className="rounded-sm bg-[#FDF0E2] px-1 text-[10px] leading-4 text-[#B0651F]">{it.level}</span>
                  <button
                    {...action('product.reviews.like.toggle', () => toggleReviewLike(it.id), {
                      params: { reviewId: it.id },
                    })}
                    className={`ml-auto flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent text-[12px] ${
                      isLiked ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text-muted)]'
                    }`}
                  >
                    <IcThumbsUp size={14} />
                    {it.likes + (isLiked ? 1 : 0)}
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <IcStar
                      key={n}
                      size={12}
                      className={n <= it.stars ? 'fill-[#FD7101] text-[var(--app-primary)]' : 'text-[#DDD]'}
                    />
                  ))}
                  <span className="ml-1 text-[11px] text-[var(--app-c-text-muted)]">
                    {fmtYmd(it.ts)} · {S.ipLocation}
                    {it.ip}
                  </span>
                </div>
                <div className="mt-1.5 text-[13px] leading-5 text-[var(--app-text)]">{it.text}</div>
                {it.images && it.images.length > 0 && (
                  <div className="mt-2 flex gap-2">
                    {it.images.map((src) => (
                      <div key={src} className="h-20 w-20 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                        <Img src={src} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-1.5 text-[11px] text-[var(--app-c-text-muted)]">
                  {S.selectedLabel} {it.sku}
                </div>
              </div>
            );
          })}
          {list.length === 0 && <div className="py-12 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>}
        </div>
      </div>

      {/* 右侧悬浮(笔记/问)装饰 + 底部「去选购」通栏 */}
      <div className="absolute bottom-20 right-3 flex flex-col gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[11px] text-[var(--app-text-muted)] shadow-md">
          {S.floatNote}
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] text-[11px] text-[var(--app-text-muted)] shadow-md">
          {S.floatAsk}
        </span>
      </div>
      <div className="border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
        <button
          {...bindBack()}
          className="w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
        >
          {S.goShopping}
        </button>
      </div>
    </div>
  );
}
