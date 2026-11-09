import React, { useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcCheck, IcSort, IcMultiSelect, IcArrowRight } from '../res/icons';

/** 顶栏 flomo▾ 的浮层弹框(非整页):选择笔记 + 排序方式(可展开子项)。 */
export default function HomeTitlemenuPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const toast = useFlomoStore((s) => s.toast);
  const [showSort, setShowSort] = useState(false);
  const [by, setBy] = useState<'created' | 'edited'>('created');
  const [order, setOrder] = useState<'newest' | 'oldest'>('newest');

  const sortAct = (fn: () => void) =>
    bindTap({ kind: 'action', id: 'home.titleMenu.sort.toggle' }, { onTrigger: fn });

  const sortLabel = `${by === 'created' ? '创建日期' : '编辑日期'}（${order === 'newest' ? '从新到旧' : '从旧到新'}）`;

  return (
    <div className="absolute inset-0" data-status-bar-foreground="dark">
      {/* 轻遮罩,点击关闭 */}
      <div {...bindBack()} className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.08)' }} />

      <div className="absolute left-12 top-3 w-64 rounded-2xl overflow-hidden shadow-xl" style={{ background: C.surface }}>
        {/* 选择笔记 */}
        <button
          {...bindTap('home.multiSelect.enter')}
          className="w-full flex items-center gap-3 px-4 h-12 bg-transparent border-none cursor-pointer text-left"
          style={{ color: C.text, fontSize: 15 }}
        >
          <IcMultiSelect size={18} style={{ color: C.sub }} />
          选择笔记
        </button>

        {/* 排序方式 */}
        <button
          {...sortAct(() => setShowSort((v) => !v))}
          className="w-full flex items-center gap-3 px-4 h-14 bg-transparent border-none cursor-pointer text-left border-t"
          style={{ color: C.text, fontSize: 15, borderColor: C.border }}
        >
          <IcSort size={18} style={{ color: C.sub }} />
          <span className="flex-1">
            排序方式
            <span className="block text-xs" style={{ color: C.sub }}>{sortLabel}</span>
          </span>
          <IcArrowRight size={16} style={{ color: C.sub, transform: showSort ? 'rotate(90deg)' : 'none' }} />
        </button>

        {/* 排序子项 */}
        {showSort && (
          <div className="pb-1" style={{ background: '#FAFAFB' }}>
            <SortItem label="创建日期" active={by === 'created'} bind={sortAct(() => setBy('created'))} />
            <SortItem label="编辑日期" active={by === 'edited'} bind={sortAct(() => setBy('edited'))} />
            <div className="h-px mx-4 my-1" style={{ background: C.border }} />
            <SortItem label="最新的排最前" active={order === 'newest'} bind={sortAct(() => setOrder('newest'))} />
            <SortItem label="最旧的排最前" active={order === 'oldest'} bind={sortAct(() => setOrder('oldest'))} />
          </div>
        )}
      </div>
    </div>
  );
}

function SortItem({ label, active, bind }: { label: string; active: boolean; bind: object }) {
  return (
    <button
      {...bind}
      className="w-full flex items-center gap-2 px-4 h-10 bg-transparent border-none cursor-pointer text-left"
      style={{ color: C.text, fontSize: 14 }}
    >
      <span className="w-4">{active && <IcCheck size={15} style={{ color: C.green }} />}</span>
      {label}
    </button>
  );
}
