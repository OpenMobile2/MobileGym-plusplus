import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack } from '../res/icons';
import { Stars } from '../components/Stars';

export default function DraftsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const reviewDrafts = useDianpingStore((st) => st.reviewDrafts);
  const deleteReviewDraft = useDianpingStore((st) => st.deleteReviewDraft);
  const showToast = useDianpingStore((st) => st.showToast);

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-white px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold text-[#222]">{s.drafts}</div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="drafts" data-scroll-direction="vertical">
        {reviewDrafts.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-[#999]">暂无草稿</div>
        ) : (
          reviewDrafts.map((d) => (
            <div key={d.id} className="mx-3 mt-2 rounded-[12px] bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="truncate text-[14px] font-semibold text-[#222]">{d.shopName}</span>
                {d.score > 0 ? <Stars score={d.score} size={11} showScore={false} /> : null}
              </div>
              <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#666]">
                {d.body || '（未填写文字）'}
              </div>
              <div className="mt-2 flex justify-end gap-2 border-t border-[#F5F5F5] pt-2">
                <button
                  type="button"
                  className="rounded-full border border-[#DDD] bg-white px-3 py-1 text-[12px] text-[#666] cursor-pointer"
                  {...action('drafts.delete.action', () => {
                    deleteReviewDraft(d.id);
                    showToast('已删除');
                  })}
                >
                  删除
                </button>
                <button
                  type="button"
                  className="rounded-full border-none bg-[#FF6633] px-4 py-1 text-[12px] font-medium text-white cursor-pointer"
                  {...bindTap('drafts.write-open', { params: { shopId: d.shopId } })}
                >
                  继续编辑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
