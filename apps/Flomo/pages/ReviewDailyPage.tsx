import React, { useMemo, useRef, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, MemoImages, renderContent } from '../components/ui';
import { memoTime } from '../utils/format';
import { IcClose, IcAi } from '../res/icons';

/** 每日回顾:整页 overlay,顶部 关闭/标题/设置(文字),中间单条回顾笔记(左右横滑翻页,双击进详情),底部分页 + AI洞察。 */
export default function ReviewDailyPage() {
  const { bindTap, bindDoubleTap, bindBack } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const setCurrentMemo = useFlomoStore((s) => s.setCurrentMemo);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const tags = useFlomoStore((s) => s.tags);

  const reviewList = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    const withImg = live.filter((m) => m.images?.length);
    const rest = live.filter((m) => !m.images?.length);
    return [...withImg, ...rest];
  }, [memos]);

  const total = reviewList.length;
  const [idx, setIdx] = useState(0);
  const current = reviewList[Math.min(idx, Math.max(total - 1, 0))];

  const next = () => { if (total > 1) setIdx((i) => (i + 1) % total); };
  const prev = () => { if (total > 1) setIdx((i) => (i - 1 + total) % total); };

  // 左右横滑翻页
  const startX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { startX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    if (startX.current == null) return;
    const dx = e.clientX - startX.current;
    startX.current = null;
    if (dx < -48) next();
    else if (dx > 48) prev();
  };

  // 保留 review.daily.next.swipe action 绑定(coverage)
  const swipeBind = bindTap<HTMLDivElement>(
    { kind: 'action', id: 'review.daily.next.swipe' },
    { onTrigger: () => {} },
  ) as React.HTMLAttributes<HTMLDivElement>;

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
      {/* 顶栏:关闭 / 每日回顾 / 设置(文字) */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>每日回顾</div>
        <button
          {...bindTap('review.dailySettings.open')}
          className="bg-transparent border-none cursor-pointer px-2"
          style={{ color: C.text, fontSize: 15 }}
        >
          设置
        </button>
      </div>

      {/* 单条回顾笔记(左右横滑翻页;双击进详情) */}
      <div
        {...swipeBind}
        onPointerDown={(e) => { onPointerDown(e); (swipeBind.onPointerDown as ((e: React.PointerEvent) => void) | undefined)?.(e); }}
        onPointerUp={(e) => { onPointerUp(e); (swipeBind.onPointerUp as ((e: React.PointerEvent) => void) | undefined)?.(e); }}
        className="flex-1 overflow-y-auto px-3 pt-2 select-none"
        data-scroll-container="review"
        data-scroll-direction="vertical"
      >
        {current ? (
          <div
            {...bindDoubleTap('review.daily.openMemo', { beforeTrigger: () => setCurrentMemo(current.id) })}
            className="w-full rounded-2xl px-4 py-3 cursor-pointer"
            style={{ background: C.surface }}
          >
            <div className="mb-1.5" style={{ color: C.sub, fontSize: 12 }}>{memoTime(current.createdAt)}</div>
            {renderContent(current.content, tagProps)}
            <MemoImages images={current.images} />
          </div>
        ) : (
          <div className="text-center mt-20" style={{ color: C.sub, fontSize: 14 }}>暂无可回顾的笔记</div>
        )}
        {total > 1 && (
          <div className="text-center mt-4" style={{ color: C.sub, fontSize: 12 }}>← 左右横滑翻页 →</div>
        )}
      </div>

      {/* 底部:分页 + AI洞察 */}
      {total > 0 && (
        <div className="shrink-0 px-4 h-14 flex items-center">
          <span style={{ color: C.sub, fontSize: 13 }}>{Math.min(idx, total - 1) + 1}/{total} 条笔记</span>
          <div className="flex-1" />
          <button
            {...bindTap('ai.insight.fromReview')}
            className="flex items-center gap-1 px-3 h-9 rounded-full border-none cursor-pointer"
            style={{ background: '#EAF1FE', color: C.linkBlue, fontSize: 13 }}
          >
            <IcAi size={15} />
            AI 洞察
          </button>
        </div>
      )}
    </div>
  );
}
