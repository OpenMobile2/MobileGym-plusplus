import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import MemoCard from '../components/MemoCard';
import { dayKey, dayLabel } from '../utils/format';
import { IcClose, IcArrowDown } from '../res/icons';
import MemoCardmenuPage from './MemoCardmenuPage';

export default function TagFilterPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const location = useLocation();
  const cur = useFlomoStore((s) => s.currentTagId);
  const currentFilter = useFlomoStore((s) => s.currentFilter);
  const currentDate = useFlomoStore((s) => s.currentDate);
  const memos = useFlomoStore((s) => s.memos);
  const tags = useFlomoStore((s) => s.tags);
  const toast = useFlomoStore((s) => s.toast);
  const showCardMenu = new URLSearchParams(location.search).get('cardMenu') === 'open';

  // 按日筛选模式(热力图某天点入):无 currentTag 且 currentFilter='byDate' 时按 currentDate 过滤。
  const byDate = !cur && currentFilter === 'byDate' && !!currentDate;

  const tag = tags.find((t) => t.id === cur);
  const list = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    const hit = byDate
      ? live.filter((m) => dayKey(m.createdAt) === currentDate)
      : live.filter((m) => cur && m.tags.includes(cur));
    return hit.sort((a, b) => b.createdAt - a.createdAt);
  }, [memos, cur, byDate, currentDate]);

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button {...bindBack()} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer" style={{ color: C.text }} aria-label="返回">
          <IcClose size={18} />
        </button>
        {byDate ? (
          <button
            {...bindBack()}
            className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
          >
            <span className="font-semibold">{dayLabel(currentDate!)}</span>
            <IcArrowDown size={15} />
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'tag.filter.sort.open' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
          >
            <span className="font-semibold">#{tag?.name ?? '标签'}</span>
            <IcArrowDown size={15} />
          </button>
        )}
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="feed" data-scroll-direction="vertical">
        <div className="flex flex-col gap-2 pt-1">
          {list.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>
              {byDate ? '这一天还没有笔记' : '该标签下还没有笔记'}
            </div>
          ) : (
            list.map((m) => (
              <MemoCard
                key={m.id}
                memo={m}
                openTid="tag.filter.openMemo"
                longPressTid="tag.filter.longpress"
                menuTid="tag.filter.cardMenu.open"
              />
            ))
          )}
        </div>
      </div>
      {showCardMenu && <MemoCardmenuPage />}
    </div>
  );
}
