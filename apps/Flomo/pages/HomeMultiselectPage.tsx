import React, { useEffect, useMemo, useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, renderContent } from '../components/ui';
import { memoTime } from '../utils/format';
import { IcCheck, IcTag, IcCopy, IcDelete } from '../res/icons';

export default function HomeMultiselectPage() {
  const { bindTap } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const tags = useFlomoStore((s) => s.tags);
  const selectedMemoIds = useFlomoStore((s) => s.selectedMemoIds);
  const toggleSelectMemo = useFlomoStore((s) => s.toggleSelectMemo);
  const addTagToMemos = useFlomoStore((s) => s.addTagToMemos);
  const deleteMemos = useFlomoStore((s) => s.deleteMemos);
  const clearSelection = useFlomoStore((s) => s.clearSelection);
  const toast = useFlomoStore((s) => s.toast);
  const [tagPanelOpen, setTagPanelOpen] = useState(false);

  // 进入多选模式时清空已选集合
  useEffect(() => {
    clearSelection();
  }, [clearSelection]);

  const visible = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    return [...live].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.createdAt - a.createdAt;
    });
  }, [memos]);

  const count = selectedMemoIds.length;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:取消 + 已选 N */}
      <div className="flex items-center h-12 px-3 shrink-0 border-b" style={{ borderColor: C.border, background: C.bg }}>
        <button
          {...bindTap('home.multiSelect.exit')}
          className="bg-transparent border-none cursor-pointer"
          style={{ color: C.text, fontSize: 15 }}
        >
          取消
        </button>
        <div className="flex-1 text-center font-semibold" style={{ color: C.text }}>
          已选 {count}
        </div>
        <div className="w-8" />
      </div>

      {/* 笔记列表(每条带勾选框) */}
      <div
        className="flex-1 overflow-y-auto px-3 py-2 pb-24"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex flex-col gap-2">
          {visible.map((m) => {
            const on = selectedMemoIds.includes(m.id);
            return (
              <button
                key={m.id}
                {...bindTap({ kind: 'action', id: 'home.multiSelect.toggle.item' }, { onTrigger: () => toggleSelectMemo(m.id) })}
                className="w-full flex items-start gap-3 rounded-2xl px-3 py-3 border-none cursor-pointer text-left"
                style={{ background: C.surface }}
              >
                <span
                  className="w-5 h-5 mt-0.5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: on ? C.green : 'transparent',
                    border: on ? 'none' : `1.5px solid ${C.border}`,
                    color: '#fff',
                  }}
                >
                  {on && <IcCheck size={13} />}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block mb-1" style={{ color: C.sub, fontSize: 12 }}>{memoTime(m.createdAt)}</span>
                  {renderContent(m.content, () => ({}), 14)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 标签选择面板(本地弹层) */}
      {tagPanelOpen && (
        <div className="shrink-0 border-t px-3 py-3" style={{ borderColor: C.border, background: C.surface }}>
          <div className="flex items-center mb-2">
            <span className="flex-1 text-xs" style={{ color: C.sub }}>选择要添加的标签</span>
            <button
              onClick={() => setTagPanelOpen(false)}
              className="bg-transparent border-none cursor-pointer text-xs"
              style={{ color: C.sub }}
            >
              关闭
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.filter((t) => t.parentId === null).map((t) => (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'home.multiSelect.addtag.do' }, {
                  onTrigger: () => {
                    addTagToMemos(selectedMemoIds, t.name);
                    toast(`已添加 #${t.name}`);
                    setTagPanelOpen(false);
                  },
                })}
                className="px-3 h-8 rounded-full border-none cursor-pointer"
                style={{ background: C.tagBg, color: C.tagText, fontSize: 13 }}
              >
                #{t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 底部操作条 */}
      <div className="flex shrink-0 border-t" style={{ borderColor: C.border, background: C.surface }}>
        <ActionBtn
          icon={<IcTag size={18} />}
          label="添加标签"
          bind={bindTap({ kind: 'action', id: 'home.multiSelect.addtag.do' }, {
            onTrigger: () => setTagPanelOpen((v) => !v),
          })}
        />
        <ActionBtn
          icon={<IcCopy size={18} />}
          label="复制"
          bind={bindTap({ kind: 'action', id: 'home.multiSelect.copy.do' }, { onTrigger: () => toast('已复制') })}
        />
        <ActionBtn
          icon={<IcDelete size={18} />}
          label="删除"
          danger
          bind={bindTap({ kind: 'action', id: 'home.multiSelect.delete.do' }, {
            onTrigger: () => { deleteMemos(selectedMemoIds); clearSelection(); },
          })}
        />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, bind, danger }: { icon: React.ReactNode; label: string; bind: object; danger?: boolean }) {
  return (
    <button
      {...bind}
      className="flex-1 flex flex-col items-center gap-1 py-2.5 bg-transparent border-none cursor-pointer"
      style={{ color: danger ? '#E5484D' : C.text, fontSize: 12 }}
    >
      {icon}
      {label}
    </button>
  );
}
