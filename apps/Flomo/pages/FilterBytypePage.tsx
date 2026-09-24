import React, { useMemo } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { dayKey, dayLabel } from '../utils/format';
import MemoCard from '../components/MemoCard';
import { IcMenu, IcArrowDown } from '../res/icons';

const LABELS: Record<string, string> = {
  images: '有图片',
  links: '有链接',
  audio: '有语音',
  untagged: '无标签',
  wechat: '微信输入',
};

export default function FilterBytypePage() {
  const { bindTap } = useFlomoGestures();
  const filter = useFlomoStore((s) => s.currentFilter);
  const currentDate = useFlomoStore((s) => s.currentDate);
  const memos = useFlomoStore((s) => s.memos);

  const list = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    const f = live.filter((m) => {
      switch (filter) {
        case 'images': return m.images.length > 0;
        case 'links': return m.hasLink;
        case 'audio': return m.hasAudio;
        case 'untagged': return m.tags.length === 0;
        case 'wechat': return m.source === 'wechat';
        case 'byDate': return currentDate ? dayKey(m.createdAt) === currentDate : true;
        default: return true;
      }
    });
    return f.sort((a, b) => b.createdAt - a.createdAt);
  }, [memos, filter, currentDate]);

  const title = filter === 'byDate' && currentDate ? dayLabel(currentDate) : LABELS[filter ?? ''] ?? '筛选';

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button {...bindTap('tag.drawer.open')} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer" style={{ color: C.text }} aria-label="菜单">
          <IcMenu size={18} />
        </button>
        {filter === 'byDate' ? (
          <button
            {...bindTap('stats.heatmap.open')}
            className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
          >
            <span className="font-semibold">{title}</span>
            <IcArrowDown size={14} style={{ color: C.sub }} />
          </button>
        ) : (
          <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>{title}</div>
        )}
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="feed" data-scroll-direction="vertical">
        <div className="flex flex-col gap-2 pt-1">
          {list.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>没有符合条件的笔记</div>
          ) : (
            list.map((m) => <MemoCard key={m.id} memo={m} openTid="filter.byType.openMemo" />)
          )}
        </div>
      </div>
    </div>
  );
}
