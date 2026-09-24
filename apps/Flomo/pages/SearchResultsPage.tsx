import React, { useMemo, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import MemoCard from '../components/MemoCard';
import { IcSearch, IcClose, IcArrowDown } from '../res/icons';

const RESULT_FILTERS = [
  { id: 'date', label: '日期' },
  { id: 'tag', label: '标签' },
  { id: 'more', label: '更多' },
];

const FILTER_LABELS: Record<string, string> = {
  untagged: '无标签',
  haslink: '有链接',
  hasimage: '有图片',
  hasaudio: '有语音',
};

export default function SearchResultsPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const tags = useFlomoStore((s) => s.tags);
  const searchQuery = useFlomoStore((s) => s.searchQuery);
  const searchFilters = useFlomoStore((s) => s.searchFilters);
  const toast = useFlomoStore((s) => s.toast);
  const [expanded, setExpanded] = useState(false);

  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase().replace(/^#/, '');
    const live = memos.filter((m) => !m.deleted);
    const matched = !q
      ? live
      : live.filter((m) => {
          if (m.content.toLowerCase().includes(q)) return true;
          // 标签名命中
          return m.tags.some((tid) => {
            const t = tags.find((x) => x.id === tid);
            return t && t.name.toLowerCase().includes(q);
          });
        });
    // 类型筛选:所有激活的筛选条件都必须满足
    const filtered = matched.filter((m) =>
      searchFilters.every((f) => {
        if (f === 'untagged') return m.tags.length === 0;
        if (f === 'haslink') return m.hasLink;
        if (f === 'hasimage') return m.images.length > 0;
        if (f === 'hasaudio') return m.hasAudio;
        return true;
      }),
    );
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [memos, tags, searchQuery, searchFilters]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:只读输入框 + 关闭 */}
      <div className="flex items-center gap-2 h-12 px-3 shrink-0">
        <div
          className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full"
          style={{ background: C.surface }}
        >
          <IcSearch size={16} style={{ color: C.sub }} />
          <span className="flex-1 text-sm truncate" style={{ color: searchQuery ? C.text : C.sub }}>
            {searchQuery || '搜索笔记'}
          </span>
        </div>
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
      </div>

      {/* 结果筛选:日期/标签/更多 */}
      <div className="flex items-center gap-2 px-3 pb-2 shrink-0">
        {RESULT_FILTERS.map((f) => (
          <button
            key={f.id}
            {...bindTap(
              { kind: 'action', id: 'search.results.filter.select' },
              { onTrigger: () => toast(`筛选:${f.label}`) },
            )}
            className="flex items-center gap-1 px-3 h-8 rounded-full border-none cursor-pointer"
            style={{ background: C.surface, color: C.text, fontSize: 13 }}
          >
            {f.label}
            <IcArrowDown size={13} style={{ color: C.sub }} />
          </button>
        ))}
        {/* 激活的类型筛选 */}
        {searchFilters.map((f) => (
          <span
            key={f}
            className="px-3 h-8 rounded-full flex items-center"
            style={{ background: C.tagBg, color: C.tagText, fontSize: 13 }}
          >
            {FILTER_LABELS[f] ?? f}
          </span>
        ))}
        {/* 展开/收起长笔记 */}
        <button
          {...bindTap(
            { kind: 'action', id: 'search.results.expand.toggle' },
            { onTrigger: () => setExpanded((v) => !v) },
          )}
          className="ml-auto px-3 h-8 rounded-full border-none cursor-pointer"
          style={{ background: C.surface, color: C.linkBlue, fontSize: 13 }}
        >
          {expanded ? '收起' : '展开'}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="text-xs mb-2" style={{ color: C.sub }}>
          共 {results.length} 条结果
        </div>
        <div className="flex flex-col gap-2">
          {results.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>没有匹配的笔记</div>
          ) : (
            results.map((m) => (
              <MemoCard key={m.id} memo={m} openTid="search.results.openMemo" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
