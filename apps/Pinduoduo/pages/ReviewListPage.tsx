import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, EmptyState, showToast } from '../components/ui';
import { IcStar } from '../res/icons';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <IcStar
          key={i}
          size={13}
          className={i < rating ? 'text-[#E22E1F] fill-[#E22E1F]' : 'text-[#DDD]'}
        />
      ))}
    </div>
  );
}

export function ReviewListPage() {
  const { itemId } = useParams();
  const { bindTap } = usePinduoduoGestures();
  const reviews = usePinduoduoStore((s) => s.reviews);

  const itemReviews = reviews.filter((r) => r.itemId === itemId);
  const [tag, setTag] = useState<string>('全部');

  const tags = ['全部', ...Array.from(new Set(itemReviews.flatMap((r) => r.tags)))];
  const shown = tag === '全部' ? itemReviews : itemReviews.filter((r) => r.tags.includes(tag));

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <div className="shrink-0 bg-white">
        <TopBar title="商品评价" />
      </div>

      {/* 标签筛选 chips */}
      {tags.length > 1 && (
        <div className="shrink-0 bg-white px-3 pb-2 flex flex-wrap gap-2">
          {tags.map((t) => {
            const on = tag === t;
            return (
              <button
                key={t}
                {...bindTap(
                  { kind: 'action', id: 'reviews.filter.select.tag' },
                  { params: { tag: t }, onTrigger: () => setTag(t) },
                )}
                className={`px-3 py-1 rounded-full text-[12px] ${
                  on ? 'bg-[#FFF0E8] text-[#E22E1F]' : 'bg-[#F5F5F5] text-[#666]'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {shown.length === 0 ? (
          <EmptyState text="暂无相关评价" />
        ) : (
          <div className="flex flex-col">
            {shown.map((r) => (
              <div key={r.id} className="bg-white px-3 py-3 mb-2">
                <div className="flex items-center gap-2">
                  <Img src={r.avatar} className="w-8 h-8 rounded-full object-cover" alt={r.user} />
                  <span className="text-[13px] text-[#333] flex-1">{r.user}</span>
                  <Stars rating={r.rating} />
                </div>
                <div className="mt-2 text-[14px] text-[#333] leading-snug">{r.content}</div>
                {r.images.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.images.map((im, i) => (
                      <button
                        key={i}
                        {...bindTap(
                          { kind: 'action', id: 'reviews.image.preview' },
                          { onTrigger: () => showToast('查看大图') },
                        )}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-[#F5F5F5]"
                      >
                        <Img src={im} className="w-full h-full object-cover" alt="晒图" />
                      </button>
                    ))}
                  </div>
                )}
                {r.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => (
                      <span key={t} className="text-[11px] text-[#E22E1F] bg-[#FFF0E8] px-1.5 py-0.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
