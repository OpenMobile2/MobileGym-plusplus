import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { fmtTime } from '../components/StatusCard';
import { useStrings, TopBar, EmptyState, Img } from '../components/ui';
import { IcTrash } from '../res/icons';

export default function DraftsPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const drafts = useWeiboStore((st) => st.drafts);
  const deleteDraft = useWeiboStore((st) => st.deleteDraft);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="草稿箱" />
      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="drafts-list" data-scroll-direction="vertical">
        {drafts.length ? drafts.map((d) => (
          <div key={d.id} className="flex items-center gap-2 bg-white px-4 py-3 mb-0.5">
            <div
              {...bindTap('drafts.compose-open', { params: { draft: d.id } })}
              className="flex-1 min-w-0 cursor-pointer"
            >
              <div className="text-[14px] text-[#1A1A1A] truncate">{d.text || '(无文字)'}</div>
              <div className="text-[11px] text-[#9A9A9A] mt-0.5">{fmtTime(d.timestamp)}{d.images.length ? ` · ${d.images.length}图` : ''}</div>
            </div>
            {d.images[0] && <Img src={d.images[0]} label="图" className="w-10 h-10 rounded object-cover shrink-0" />}
            <button
              {...bindTap({ kind: 'action', id: 'drafts.item.delete' }, {
                params: { draftId: d.id },
                onTrigger: () => deleteDraft(d.id),
              })}
              className="bg-transparent border-none cursor-pointer text-[#BBBBBB] p-1 shrink-0"
            >
              <IcTrash size={17} />
            </button>
          </div>
        )) : <EmptyState text={s.emptyDrafts} hint="发博时点「取消-保存」的内容会出现在这里" />}
      </div>
    </div>
  );
}
