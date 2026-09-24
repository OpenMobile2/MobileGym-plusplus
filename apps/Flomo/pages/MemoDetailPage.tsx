import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, MemoImages, renderContent } from '../components/ui';
import { fullTime, memoTime } from '../utils/format';
import { IcArrowDown, IcMore } from '../res/icons';

export default function MemoDetailPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const cur = useFlomoStore((s) => s.currentMemoId);
  const memos = useFlomoStore((s) => s.memos);
  const tags = useFlomoStore((s) => s.tags);
  const setCurrentMemo = useFlomoStore((s) => s.setCurrentMemo);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);

  const memo = memos.find((m) => m.id === cur);
  const backlinks = memo ? memos.filter((m) => m.sourceMemoId === memo.id && !m.deleted) : [];
  const source = memo?.sourceMemoId ? memos.find((m) => m.id === memo.sourceMemoId) : null;

  const tagProps = (name: string) =>
    bindTap('tag.filter.open', {
      stopPropagation: true,
      beforeTrigger: () => {
        const t = tags.find((x) => x.name === name);
        setCurrentTag(t ? t.id : null);
      },
    }) as React.HTMLAttributes<HTMLSpanElement>;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-2 shrink-0">
        <button {...bindBack()} className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
          <IcArrowDown size={22} />
        </button>
        <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>笔记详情</div>
        <button
          {...bindTap('memo.detailMenu.open', { beforeTrigger: () => memo && setCurrentMemo(memo.id) })}
          className="w-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
        >
          <IcMore size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-10">
        {!memo ? (
          <div className="py-10 text-center" style={{ color: C.sub }}>笔记不存在或已删除</div>
        ) : (
          <>
            <div className="py-2" style={{ color: C.sub, fontSize: 12 }}>{fullTime(memo.createdAt)}</div>
            {source && (
              <button
                {...bindTap('memo.detail.fromLink2', { beforeTrigger: () => setCurrentMemo(source.id) })}
                className="block text-left mb-2 bg-transparent border-none cursor-pointer"
                style={{ color: C.linkBlue, fontSize: 14 }}
              >
                关联自:MEMO »
              </button>
            )}
            {renderContent(memo.content, tagProps, 16)}
            <MemoImages images={memo.images} />

            {backlinks.length > 0 && (
              <div className="mt-6">
                <div className="text-center text-xs mb-2" style={{ color: C.sub }}>— 被以下 {backlinks.length} 条笔记引用 —</div>
                <div className="flex flex-col gap-2">
                  {backlinks.map((b) => (
                    <button
                      key={b.id}
                      {...bindTap('memo.detail.fromBacklink', { beforeTrigger: () => setCurrentMemo(b.id) })}
                      className="text-left rounded-xl px-3 py-2 bg-transparent border cursor-pointer"
                      style={{ borderColor: C.border, background: C.surface }}
                    >
                      <div style={{ color: C.sub, fontSize: 11 }}>{memoTime(b.createdAt)}</div>
                      <div className="truncate" style={{ color: C.text, fontSize: 13 }}>{b.content.slice(0, 40)}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
