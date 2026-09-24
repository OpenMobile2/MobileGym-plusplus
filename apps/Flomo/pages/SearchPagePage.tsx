import React, { useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcSearch, IcClose, IcAi, IcClock } from '../res/icons';

const FILTERS = [
  { id: 'untagged', label: '无标签' },
  { id: 'haslink', label: '有链接' },
  { id: 'hasimage', label: '有图片' },
  { id: 'hasaudio', label: '有语音' },
];

const RECENT_FALLBACK = ['flomo', '读书', '产品设计', '#灵感'];

export default function SearchPagePage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const setSearchQuery = useFlomoStore((s) => s.setSearchQuery);
  const toast = useFlomoStore((s) => s.toast);
  const searchRecents = useFlomoStore((s) => s.searchRecents);
  const searchFilters = useFlomoStore((s) => s.searchFilters);
  const toggleSearchFilter = useFlomoStore((s) => s.toggleSearchFilter);
  const [query, setQuery] = useState('');

  const recents = searchRecents.length > 0 ? searchRecents : RECENT_FALLBACK;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:搜索输入框 + 关闭 */}
      <div className="flex items-center gap-2 h-12 px-3 shrink-0">
        <div
          className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full"
          style={{ background: C.surface }}
        >
          <IcSearch size={16} style={{ color: C.sub }} />
          <input
            {...bindTap('search.results.open', { beforeTrigger: () => setSearchQuery(query) })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                setSearchQuery(query);
                (e.currentTarget as HTMLInputElement).click();
              }
            }}
            placeholder="搜索笔记"
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: C.text }}
          />
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

      <div
        className="flex-1 overflow-y-auto px-3 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 用AI找一找 */}
        <button
          {...bindTap(
            { kind: 'action', id: 'search.page.aifind.do' },
            { onTrigger: () => toast('该功能暂未开放') },
          )}
          className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border-none cursor-pointer mt-1 mb-4"
          style={{ background: C.surface, color: C.green, fontSize: 14 }}
        >
          <IcAi size={16} />
          <span className="flex-1 text-left">用 AI 找一找</span>
        </button>

        {/* 类型筛选 chip */}
        <div className="mb-5">
          <div className="text-xs mb-2" style={{ color: C.sub }}>类型筛选</div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const on = searchFilters.includes(f.id);
              return (
                <button
                  key={f.id}
                  {...bindTap(
                    { kind: 'action', id: 'search.page.filter.toggle' },
                    { onTrigger: () => toggleSearchFilter(f.id) },
                  )}
                  className="px-3 h-8 rounded-full border-none cursor-pointer"
                  style={{
                    fontSize: 13,
                    background: on ? C.tagBg : C.surface,
                    color: on ? C.tagText : C.text,
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 最近搜索 */}
        <div>
          <div className="text-xs mb-2" style={{ color: C.sub }}>最近搜索</div>
          <div className="flex flex-col">
            {recents.map((term) => (
              <button
                key={term}
                {...bindTap('search.results.recent', { beforeTrigger: () => { setQuery(term); setSearchQuery(term); } })}
                className="flex items-center gap-3 h-11 bg-transparent border-none cursor-pointer text-left"
                style={{ color: C.text }}
              >
                <IcClock size={15} style={{ color: C.sub }} />
                <span className="flex-1 text-sm">{term}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
