import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { dayKey, dayLabel } from '../utils/format';
import MemoCard from '../components/MemoCard';
import { IcClose, IcArrowDown } from '../res/icons';
import MemoCardmenuPage from './MemoCardmenuPage';

const LABELS: Record<string, string> = {
  images: '有图片',
  links: '有链接',
  audio: '有语音',
  untagged: '无标签',
  wechat: '微信输入',
};

export default function FilterBytypePage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const location = useLocation();
  const filter = useFlomoStore((s) => s.currentFilter);
  const currentDate = useFlomoStore((s) => s.currentDate);
  const memos = useFlomoStore((s) => s.memos);
  const showCardMenu = new URLSearchParams(location.search).get('cardMenu') === 'open';

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
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button {...bindBack()} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer" style={{ color: C.text }} aria-label="返回">
          <IcClose size={18} />
        </button>
        {filter === 'byDate' ? (
          <button
            {...bindBack()}
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
            list.map((m) => (
              <MemoCard
                key={m.id}
                memo={m}
                openTid="filter.byType.openMemo"
                longPressTid="filter.byType.longpress"
                menuTid="filter.byType.cardMenu.open"
              />
            ))
          )}
        </div>
      </div>
      {showCardMenu && <MemoCardmenuPage />}
    </div>
  );
}
