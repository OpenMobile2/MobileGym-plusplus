import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import MemoCard from '../components/MemoCard';
import TitleMenuOverlay from '../components/TitleMenuOverlay';
import {
  IcMenu, IcSearch, IcArrowDown, IcAi, IcReview, IcDice, IcStats, IcPlus,
} from '../res/icons';

function HotEntry({ icon, label, bind }: { icon: React.ReactNode; label: string; bind: object }) {
  return (
    <button
      {...bind}
      className="flex items-center gap-1.5 px-3 h-9 rounded-full border-none cursor-pointer shrink-0"
      style={{ background: C.surface, color: C.text, fontSize: 13 }}
    >
      {icon}
      {label}
    </button>
  );
}

export default function HomeFeedPage() {
  const { bindTap } = useFlomoGestures();
  const location = useLocation();
  const memos = useFlomoStore((s) => s.memos);
  const setCompose = useFlomoStore((s) => s.setCompose);
  const composeDraft = useFlomoStore((s) => s.composeDraft);
  const showTitleMenu = new URLSearchParams(location.search).get('titleMenu') === 'open';
  const hasDraft = composeDraft.trim().length > 0;

  const sortBy = useFlomoStore((s) => s.sortBy);
  const sortOrder = useFlomoStore((s) => s.sortOrder);
  const visible = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    const key = (m: (typeof live)[number]) => (sortBy === 'edited' ? m.updatedAt : m.createdAt);
    const dir = sortOrder === 'newest' ? -1 : 1;
    return [...live].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1; // 置顶恒在最前
      return (key(a) - key(b)) * dir;
    });
  }, [memos, sortBy, sortOrder]);

  const liveCount = useMemo(() => memos.filter((m) => !m.deleted).length, [memos]);

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...bindTap('tag.drawer.open')}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="菜单"
        >
          <IcMenu size={18} />
        </button>
        <button
          {...bindTap('home.titleMenu.open')}
          className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
        >
          <span className="font-bold text-lg lowercase">flomo</span>
          <IcArrowDown size={16} />
        </button>
        <button
          {...bindTap('search.page.open')}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="搜索"
        >
          <IcSearch size={18} />
        </button>
      </div>

      {/* 滚动区 */}
      <div
        className="flex-1 overflow-y-auto px-3 pb-24"
        data-scroll-container="feed"
        data-scroll-direction="vertical"
      >
        {/* 热门入口 */}
        <div className="flex gap-2 overflow-x-auto py-1 mb-1">
          <HotEntry icon={<IcAi size={15} style={{ color: C.green }} />} label="AI 洞察" bind={bindTap('ai.insight.open')} />
          <HotEntry icon={<IcReview size={15} style={{ color: C.green }} />} label="每日回顾" bind={bindTap('review.daily.open')} />
          <HotEntry icon={<IcDice size={15} style={{ color: C.green }} />} label="随机漫步" bind={bindTap('review.random.open')} />
        </div>

        {/* 统计入口 */}
        <button
          {...bindTap('stats.heatmap.open')}
          className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl border-none cursor-pointer mb-2"
          style={{ background: C.surface, color: C.linkBlue, fontSize: 13 }}
        >
          <IcStats size={15} />
          查看记录统计（{liveCount}）
        </button>

        {/* 笔记流 */}
        <div className="flex flex-col gap-2">
          {visible.map((m) => (
            <MemoCard key={m.id} memo={m} />
          ))}
        </div>
      </div>

      {/* 绿色 + 写笔记 FAB(flomo 无底部输入框) */}
      <button
        {...bindTap('compose.editor.openFab', { beforeTrigger: () => setCompose('new', null) })}
        className="absolute left-1/2 -translate-x-1/2 bottom-6 w-14 h-14 rounded-2xl flex flex-col items-center justify-center border-none cursor-pointer shadow-lg"
        style={{ background: C.green, color: '#fff' }}
        aria-label="写笔记"
      >
        <IcPlus size={28} />
        {hasDraft && (
          <span
            className="absolute -top-2 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium shadow"
            style={{ background: '#fff', color: C.green }}
          >
            草稿
          </span>
        )}
      </button>

      {showTitleMenu && <TitleMenuOverlay />}
    </div>
  );
}
