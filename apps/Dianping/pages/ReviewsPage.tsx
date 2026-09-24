import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcPear } from '../res/icons';
import { Stars } from '../components/Stars';
import { DpAvatar } from '../components/DpAvatar';
import { dishImageUrl } from '../assets';

const TABS = [
  { id: 'all', labelKey: 'reviewAll' as const },
  { id: 'good', labelKey: 'reviewGood' as const },
  { id: 'bad', labelKey: 'reviewBad' as const },
  { id: 'photo', labelKey: 'reviewPhoto' as const },
];

export default function ReviewsPage() {
  const { shopId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const userReviews = useDianpingStore((st) => st.userReviews);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const [tab, setTab] = useState('all');
  const [tag, setTag] = useState('');

  const reviewPhotos = useMemo(
    () => (shop ? shop.dishes.map((d) => dishImageUrl(shop.id, d.id)).filter((u): u is string => Boolean(u)) : []),
    [shop],
  );

  const list = useMemo(() => {
    if (!shop) return [];
    const fmtReviewDate = (ts: number) => {
      const d = TimeService.fromTimestamp(ts);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const mine = userReviews
      .filter((r) => r.shopId === shop.id && !shop.reviews.some((sr) => sr.id === r.id))
      .map((r) => ({
        id: r.id,
        userName: userProfile.nickname,
        score: r.score,
        body: r.body,
        tags: ['我的评价'],
        dateLabel: fmtReviewDate(r.createdAt),
        hasPhoto: (r.photos?.length ?? 0) > 0,
        photos: r.photos ?? [],
        avgPriceText: r.avgPriceText,
      }));
    let rows = [...mine, ...shop.reviews];
    if (tab === 'good') rows = rows.filter((r) => r.score >= 4);
    if (tab === 'bad') rows = rows.filter((r) => r.score <= 2);
    if (tab === 'photo') rows = rows.filter((r) => r.hasPhoto);
    if (tag) rows = rows.filter((r) => r.tags.includes(tag));
    return rows;
  }, [shop, tab, tag, userReviews, userProfile.nickname]);

  if (!shop) {
    return (
      <div className="p-4">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  const avgFor = (id: string, given?: string) =>
    given ??
    (Math.abs([...id].reduce((a, c) => (a * 17 + c.charCodeAt(0)) | 0, 3)) % 3 === 0
      ? `¥${shop.avgPrice + ((id.length % 21) - 10)}/人`
      : '');

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center gap-1 px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold">
          {s.reviews}({shop.reviewCount})
        </div>
        <div className="ml-auto pr-2">
          <button
            type="button"
            className="cursor-pointer rounded-full border-none bg-[#FF6633] px-3 py-1 text-[12px] text-white"
            {...bindTap('shop.write-open', { params: { shopId: shop.id } })}
          >
            {s.writeReview}
          </button>
        </div>
      </div>
      <div className="flex gap-4 overflow-x-auto px-3">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`relative shrink-0 cursor-pointer border-none bg-transparent py-2 text-[13px] ${
                active ? 'font-bold text-[#222]' : 'text-[#666]'
              }`}
              {...action('reviews.tab.select.target', () => setTab(t.id), { params: { tab: t.id } })}
            >
              {s[t.labelKey]}
              {active ? (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[#FF6633]" />
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5 px-3 py-2">
        {shop.tags.map((t) => (
          <button
            key={t}
            type="button"
            className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-[11px] ${
              tag === t ? 'bg-[#FFF1EA] text-[#FF6633]' : 'bg-[#F5F5F5] text-[#666]'
            }`}
            {...action('reviews.tag.select.target', () => setTag(tag === t ? '' : t), {
              params: { tag: t },
            })}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="reviews" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyList}</div>
        ) : (
          list.map((r) => (
            <button
              key={r.id}
              type="button"
              className="block w-full border-none border-b border-[#F5F5F5] bg-transparent py-3 text-left cursor-pointer"
              {...bindTap('shop.review-open', { params: { shopId: shop.id, reviewId: r.id } })}
            >
              <div className="flex items-center gap-2">
                {r.userName === userProfile.nickname ? (
                  <IcPear size={32} className="shrink-0 rounded-full" />
                ) : (
                  <DpAvatar seed={r.userName} size={32} className="shrink-0 rounded-full" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-medium">{r.userName}</div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Stars score={r.score} size={10} showScore={false} />
                    <span className="text-[10px] text-[#999]">{r.dateLabel}</span>
                    {avgFor(r.id, r.avgPriceText) ? (
                      <span className="text-[10px] text-[#999]">{avgFor(r.id, r.avgPriceText)}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="mt-1.5 text-[13px] leading-5 text-[#333]">{r.body}</div>
              {(r.photos && r.photos.length > 0) || (r.hasPhoto && reviewPhotos.length > 0) ? (
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {(r.photos && r.photos.length > 0
                    ? r.photos.slice(0, 3)
                    : [0, 1, 2].map((i) => reviewPhotos[(r.id.length + i) % reviewPhotos.length])
                  ).map((url, i) => (
                    <div
                      key={i}
                      className="aspect-square overflow-hidden rounded-[4px]"
                      style={{ background: shop.coverColor }}
                    >
                      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
