import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, MemoImages, renderContent } from './ui';
import { memoTime } from '../utils/format';
import { IcMore } from '../res/icons';
import type { FlomoMemo } from '../types';
import type { TransitionId } from '../navigation.declaration';

type Props = Record<string, unknown>;

/** 合并两套手势绑定到同一元素:保留 primary 的 data-trigger,叠加二者的 pointer 处理。 */
function mergePointer(primary: Props, secondary: Props): Props {
  const out: Props = { ...secondary, ...primary };
  const keys = ['onPointerDown', 'onPointerMove', 'onPointerUp', 'onPointerCancel', 'onPointerLeave'] as const;
  for (const k of keys) {
    const a = primary[k] as ((e: unknown) => void) | undefined;
    const b = secondary[k] as ((e: unknown) => void) | undefined;
    if (a && b) out[k] = (e: unknown) => { a(e); b(e); };
    else out[k] = a || b;
  }
  return out;
}

export default function MemoCard({
  memo,
  openTid = 'compose.editor.editFromCard',
  longPressTid = 'memo.longPressMenu.open',
}: {
  memo: FlomoMemo;
  openTid?: TransitionId;
  longPressTid?: TransitionId;
}) {
  const { bindTap, bindDoubleTap, bindLongPress } = useFlomoGestures();
  const tags = useFlomoStore((s) => s.tags);
  const memos = useFlomoStore((s) => s.memos);
  const setCurrentMemo = useFlomoStore((s) => s.setCurrentMemo);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const setCompose = useFlomoStore((s) => s.setCompose);
  const setPreviewImage = useFlomoStore((s) => s.setPreviewImage);
  const foldLong = useFlomoStore((s) => s.settings.foldLong);
  const fontSize = useFlomoStore((s) => s.settings.fontSize);
  const [expanded, setExpanded] = React.useState(false);
  // 偏好「内容过长折叠」:长文默认折叠,显示「展开」
  const foldable = foldLong && (memo.content.length > 120 || memo.content.split('\n').length > 6);

  const tagProps = (name: string) =>
    bindTap('tag.filter.open', {
      stopPropagation: true,
      beforeTrigger: () => {
        const t = tags.find((x) => x.name === name);
        setCurrentTag(t ? t.id : null);
      },
    }) as React.HTMLAttributes<HTMLSpanElement>;

  const editBind = bindDoubleTap(openTid, {
    beforeTrigger: () => setCompose('edit', memo.id),
  }) as unknown as Props;
  const menuBind = bindLongPress(longPressTid, {
    beforeTrigger: () => setCurrentMemo(memo.id),
  }) as unknown as Props;
  const cardGestures = mergePointer(editBind, menuBind);

  const src = memo.sourceMemoId ? memos.find((m) => m.id === memo.sourceMemoId) : null;
  const sourceTag = memo.source === 'wechat' ? '微信输入' : memo.source === 'api' ? 'API' : '';

  return (
    <div {...cardGestures} className="rounded-2xl px-4 py-3 cursor-pointer select-none" style={{ background: C.surface }}>
      <div className="flex items-center justify-between mb-1.5">
        <span style={{ color: C.sub, fontSize: 12 }}>
          {memoTime(memo.createdAt)}
          {sourceTag && <span className="ml-2">| {sourceTag}</span>}
          {memo.pinned && <span className="ml-2" style={{ color: C.green }}>· 置顶</span>}
        </span>
        <button
          {...bindTap('memo.cardMenu.open', { stopPropagation: true, beforeTrigger: () => setCurrentMemo(memo.id) })}
          className="px-1 -mr-1 bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
          aria-label="更多"
        >
          <IcMore size={18} />
        </button>
      </div>

      {src && (
        <button
          {...bindTap('memo.detail.fromLink', { stopPropagation: true, beforeTrigger: () => setCurrentMemo(src.id) })}
          className="block text-left mb-1 bg-transparent border-none cursor-pointer"
          style={{ color: C.linkBlue, fontSize: 14 }}
        >
          关联自:MEMO »
        </button>
      )}

      <div style={foldable && !expanded ? { maxHeight: '9em', overflow: 'hidden' } : undefined}>
        {renderContent(memo.content, tagProps, fontSize)}
      </div>
      {foldable && (
        <button
          {...bindTap({ kind: 'action', id: 'home.feed.memo.expand.toggle' }, {
            stopPropagation: true,
            onTrigger: () => setExpanded((v) => !v),
          })}
          className="mt-1 bg-transparent border-none cursor-pointer p-0"
          style={{ color: C.linkBlue, fontSize: 13 }}
        >
          {expanded ? '收起' : '展开'}
        </button>
      )}
      {memo.images.length > 0 && (
        <div
          {...bindTap({ kind: 'action', id: 'home.feed.image.preview' }, {
            stopPropagation: true,
            beforeTrigger: (e) => {
              const t = e.target as HTMLElement;
              const src = t.tagName === 'IMG' ? (t as HTMLImageElement).src : memo.images[0];
              setPreviewImage(src);
            },
            onTrigger: () => {},
          })}
        >
          <MemoImages images={memo.images} />
        </div>
      )}
    </div>
  );
}
