import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, EmptyState, showToast } from '../components/ui';
import { IcStar, IcChevronRight } from '../res/icons';

export function ReviewListPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { bindTap } = useJingdongGestures();
  const items = useJingdongStore((s) => s.items);
  const reviews = useJingdongStore((s) => s.reviews);
  const recordTaskAudit = useJingdongStore((s) => s.recordTaskAudit);
  const item = items.find((i) => i.id === itemId) || items[0];
  const list = reviews.filter((r) => r.itemId === item.id);
  const shown = list;

  const chips = ['全部', ...item.reviewTags];
  const [chip, setChip] = useState(0);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="大家评" className="pt-10" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="reviews-list" data-scroll-direction="vertical">
        {/* 概览 */}
        <div className="bg-white px-3 py-3 flex items-center justify-between">
          <span className="text-[16px] font-semibold text-[#1A1A1A]">买家评价 {item.reviewCount >= 10000 ? '1万+' : item.reviewCount}</span>
          <span className="flex items-center text-[13px] text-[#333]">超{item.goodRate}买家赞不绝口<IcChevronRight size={14} className="text-[#CCC]" /></span>
        </div>

        {/* AI全网评 */}
        <div className="bg-white px-3 pb-3">
          <div className="rounded-xl bg-[#F7F7FB] p-3 text-[13px] leading-[20px] text-[#333]">
            <span className="text-[#8A5CFF] font-semibold mr-1">✦ AI全网评</span>
            外观轻薄便携,运行流畅不卡顿,屏幕清晰护眼,续航表现优异,性价比高,适合办公、学习及日常娱乐,买家普遍好评。
          </div>
        </div>

        {/* 标签 chips */}
        <div className="bg-white px-3 pb-3 flex gap-2 overflow-x-auto">
          {chips.map((t, i) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'reviews.filter.select.tag' }, { onTrigger: () => { setChip(i); recordTaskAudit({ reviewFilter: { itemId: item.id, tag: t } }); } })}
              className={`shrink-0 px-3 py-1.5 rounded-md text-[13px] ${chip === i ? 'bg-[#FFF0EF] text-[#E1251B]' : 'bg-[#F5F5F5] text-[#666]'}`}
            >{t}</button>
          ))}
        </div>

        {/* 评价列表 */}
        <div className="mt-2 bg-white">
          {shown.length === 0 ? (
            <EmptyState text="还没有评价" />
          ) : (
            shown.map((r) => (
              <div key={r.id} className="px-3 py-3 border-b border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#F0A860] text-white text-[12px] flex items-center justify-center">{r.user.slice(0, 1)}</div>
                  <span className="text-[13px] text-[#333]">{r.user}</span>
                  {r.plus && <span className="text-[10px] px-1 rounded-sm bg-[#3B2E1E] text-[#F3D9A0]">PLUS</span>}
                  <span className="ml-auto flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <IcStar key={i} size={12} className={i < r.rating ? 'text-[#E1251B]' : 'text-[#DDD]'} fill={i < r.rating ? '#E1251B' : 'none'} />
                    ))}
                  </span>
                </div>
                <div className="text-[14px] leading-[20px] text-[#1A1A1A] mt-2">{r.content}</div>
                {r.images.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.images.map((src, i) => (
                      <button
                        key={i}
                        {...bindTap({ kind: 'action', id: 'reviews.image.preview' }, { onTrigger: () => showToast('查看大图') })}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-[#F5F5F5]"
                      >
                        <Img src={src} className="w-full h-full object-cover" alt="晒图" />
                      </button>
                    ))}
                  </div>
                )}
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {r.tags.map((t) => (
                      <span key={t} className="text-[11px] text-[#888] bg-[#F5F5F5] rounded px-1.5 py-0.5">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
