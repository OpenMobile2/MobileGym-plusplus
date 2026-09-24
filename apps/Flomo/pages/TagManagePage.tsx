import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, TopBar } from '../components/ui';
import { IcTag, IcSort, IcArrowRight } from '../res/icons';

export default function TagManagePage() {
  const { bindTap, bindLongPress } = useFlomoGestures();
  const tags = useFlomoStore((s) => s.tags);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const toast = useFlomoStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="标签管理" />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-4 py-2 text-xs" style={{ color: C.sub }}>长按拖拽排序,不可跨级移动</div>
        <div className="flex flex-col">
          {tags.map((t) => (
            <button
              key={t.id}
              {...bindTap('tag.editSheet.open', { beforeTrigger: () => setCurrentTag(t.id) })}
              {...bindLongPress({ kind: 'action', id: 'tag.manage.reorder.drag' }, { onTrigger: () => toast('长按拖拽,不可跨级') })}
              className="w-full flex items-center gap-3 h-12 px-4 bg-transparent border-none cursor-pointer text-left"
              style={{ color: C.text, fontSize: 15 }}
            >
              <span className="w-5 flex justify-center" style={{ color: C.sub }}><IcTag size={16} /></span>
              <span className="flex-1 truncate">{t.name}</span>
              <span style={{ color: C.sub, fontSize: 12 }}>{t.count}</span>
              <span style={{ color: C.sub }}><IcSort size={14} /></span>
              <span style={{ color: C.sub }}><IcArrowRight size={16} /></span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
