import React, { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useNotOpenToast } from '../components/ui';
import { CATEGORY_GROUPS } from '../constants';
import { IcBack } from '../res/icons';

/** 频道tab(男生/女生可用,其余 wontfix toast;视觉基准 88_4) */
const CATEGORY_CHANNELS = [
  { id: 'male', label: '男生', enabled: true },
  { id: 'female', label: '女生', enabled: true },
  { id: 'listen', label: '听书', enabled: false },
  { id: 'publish', label: '出版', enabled: false },
  { id: 'duanju', label: '短剧', enabled: false },
  { id: 'manhua', label: '漫画', enabled: false },
] as const;

export default function CategoryPage() {
  const { bindTap, bindBack } = useFanqieGestures();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const channel = (searchParams.get('channel') === 'female' ? 'female' : 'male') as 'male' | 'female';
  const groups = CATEGORY_GROUPS[channel];
  const group = searchParams.get('group') || groups[0].group;

  const selectChannel = (id: string) =>
    setSearchParams((p) => { p.set('channel', id); p.delete('group'); return p; }, { replace: true });
  const selectGroup = (g: string) => {
    setSearchParams((p) => { p.set('group', g); return p; }, { replace: true });
    sectionRefs.current[g]?.scrollIntoView({ block: 'start' });
  };

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-card)">
      {/* ===== 顶部:返回 + 频道tab ===== */}
      <div className="shrink-0 flex items-center h-11 px-1 border-b border-(--app-c-divider)">
        <button {...bindBack()} className="w-10 h-10 shrink-0 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        <div className="flex-1 flex items-end gap-4 overflow-x-auto no-scrollbar pr-2">
          {CATEGORY_CHANNELS.map((c) => {
            const on = c.id === channel;
            return c.enabled ? (
              <button
                key={c.id}
                {...bindTap(
                  { kind: 'action', id: 'category.channel.select.target' },
                  { params: { target: c.id }, onTrigger: () => selectChannel(c.id) },
                )}
                className={`shrink-0 bg-transparent border-none cursor-pointer p-0 ${
                  on ? 'text-[17px] font-bold text-(--app-c-text-primary)' : 'text-[14px] text-(--app-c-text-regular)'
                }`}
              >
                {c.label}
              </button>
            ) : (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'category.channel.disabled' }, { onTrigger: showNotOpen })}
                className="shrink-0 text-[14px] text-(--app-c-text-regular) bg-transparent border-none cursor-pointer p-0"
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 左分组栏 + 右标签宫格 ===== */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-20 shrink-0 bg-(--app-c-bg-fill-weak) overflow-y-auto">
          {groups.map((g) => {
            const on = g.group === group;
            return (
              <button
                key={g.group}
                {...bindTap(
                  { kind: 'action', id: 'category.group.select.target' },
                  { params: { target: g.group }, onTrigger: () => selectGroup(g.group) },
                )}
                className={`relative w-full h-13 text-[13px] border-none cursor-pointer ${
                  on ? 'bg-(--app-c-bg-card) text-(--app-c-brand) font-semibold' : 'bg-transparent text-(--app-c-text-regular)'
                }`}
              >
                {on && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r bg-(--app-c-brand)" />}
                {g.group}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto px-3" data-scroll-container="category-tags" data-scroll-direction="vertical">
          {groups.map((g) => (
            <div key={g.group} ref={(el) => { sectionRefs.current[g.group] = el; }}>
              <div className="text-[12px] text-(--app-c-text-secondary) pt-3 pb-1">{g.group}</div>
              <div className="grid grid-cols-3 gap-2">
                {g.tags.map((tag) => (
                  <button
                    key={tag}
                    {...bindTap('category.tagresult-open', { params: { tag } })}
                    className="h-9 rounded-lg bg-(--app-c-bg-fill) text-[13px] text-(--app-c-text-primary) border-none cursor-pointer truncate px-1"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="h-4" />
        </div>
      </div>
      {notOpenNode}
    </div>
  );
}
