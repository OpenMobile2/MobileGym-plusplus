import React, { useMemo, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { fullTime } from '../utils/format';
import { IcNavBack, IcSearch } from '../res/icons';

export default function RelatedNotesPage() {
  const { bindTap, bindBack, back } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const currentMemoId = useFlomoStore((s) => s.currentMemoId);
  const toast = useFlomoStore((s) => s.toast);
  const [query, setQuery] = useState('');

  // 候选笔记:排除当前笔记与回收站,按关键词过滤
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memos
      .filter((m) => !m.deleted && m.id !== currentMemoId)
      .filter((m) => (q ? m.content.toLowerCase().includes(q) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [memos, currentMemoId, query]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 / 标题 */}
      <div className="flex items-center h-12 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="返回"
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>
          选择关联的笔记
        </div>
        <div className="w-9" />
      </div>

      {/* 搜索框 */}
      <div className="px-3 pb-2 shrink-0">
        <div className="flex items-center gap-2 h-9 px-3 rounded-full" style={{ background: C.surface }}>
          <IcSearch size={16} style={{ color: C.sub }} />
          <input
            {...bindTap({ kind: 'action', id: 'related.notes.search.input' }, { onTrigger: () => {} })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索要关联的笔记"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: C.text }}
          />
        </div>
      </div>

      {/* 候选笔记列表 */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex flex-col gap-2">
          {candidates.map((m) => (
            <button
              key={m.id}
              {...bindTap(
                { kind: 'action', id: 'related.notes.link.do' },
                {
                  onTrigger: () => {
                    toast('已建立关联');
                    back();
                  },
                },
              )}
              className="w-full text-left rounded-2xl p-3 border-none cursor-pointer"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}
            >
              <div style={{ color: C.sub, fontSize: 11 }}>{fullTime(m.createdAt)}</div>
              <div
                className="mt-1 break-words"
                style={{
                  color: C.text,
                  fontSize: 14,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {m.content}
              </div>
            </button>
          ))}
          {candidates.length === 0 && (
            <div className="text-center py-12" style={{ color: C.sub, fontSize: 13 }}>
              没有匹配的笔记
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
