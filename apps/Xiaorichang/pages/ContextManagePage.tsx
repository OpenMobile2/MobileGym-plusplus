import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useDialogs } from '../hooks/useDialogs';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

/** 习惯情境(s167)。选择模式 + 多选删除;重排为上移/下移(裁定1)。 */
export default function ContextManagePage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const { dialogs, confirm, prompt } = useDialogs();
  const [selectMode, setSelectMode] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const contexts = [...st.contexts].sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title="习惯情境" right={
        selectMode ? (
          <button {...action('context.select.commit', () => { setSelectMode(false); setChecked([]); })}
            className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>完成</button>
        ) : (
          <button {...action('context.select.mode', () => setSelectMode(true))}
            className="rounded-full bg-white px-4 py-1.5 text-sm text-[#424242] shadow-sm">选择</button>
        )
      } />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {contexts.map((c) => (
          <div key={c.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            {selectMode && (
              <button
                {...action('context.row.check', () => setChecked((cur) => cur.includes(c.id) ? cur.filter((x) => x !== c.id) : [...cur, c.id]), { params: { contextId: c.id } })}
                className="flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs"
                style={checked.includes(c.id) ? { background: colors.brand, borderColor: colors.brand, color: '#5B4718' } : { borderColor: '#C9CDD3' }}>
                {checked.includes(c.id) ? '✓' : ''}
              </button>
            )}
            <span className="flex-1 text-sm text-[#424242]">{c.name}</span>
            <span className="text-xs text-[#C9CDD3]">{st.habits.filter((h) => h.contextId === c.id && !h.archived).length} 个习惯</span>
            {!selectMode && (
              <>
                <button {...action('context.row.moveUp', () => st.moveContext(c.id, -1), { params: { contextId: c.id } })}
                  className="px-1 text-[#9AA5B1]">↑</button>
                <button {...action('context.row.moveDown', () => st.moveContext(c.id, 1), { params: { contextId: c.id } })}
                  className="px-1 text-[#9AA5B1]">↓</button>
              </>
            )}
          </div>
        ))}
        {!selectMode && (
          <button
            {...action('context.create.open', () => prompt({
              title: '新增情境', placeholder: '情境名称',
              onConfirm: (v) => st.addContext(v),
            }))}
            className="mt-2 w-full rounded-2xl border-2 border-dashed border-[#E3E5E8] py-3 text-sm text-[#9AA5B1]">
            + 新增情境
          </button>
        )}
      </div>
      {selectMode && (
        <div className="flex shrink-0 items-center justify-between px-5 pb-8">
          <button {...action('context.select.none', () => setChecked([]))} className="text-sm text-[#9AA5B1]">取消全选</button>
          <button
            {...action('context.select.delete', () => checked.length && confirm({
              title: `删除选中的 ${checked.length} 个情境?`, danger: true,
              onConfirm: () => { st.deleteContexts(checked); setChecked([]); },
            }))}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ background: colors.stateFail }}>
            删除选中项 ({checked.length})
          </button>
        </div>
      )}
      {dialogs}
    </div>
  );
}
