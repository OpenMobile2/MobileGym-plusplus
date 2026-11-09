import React, { useMemo } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C, TopBar, renderContent } from '../components/ui';
import { memoTime } from '../utils/format';
import { IcRefresh, IcDelete } from '../res/icons';

export default function TrashPagePage() {
  const { bindTap } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const restoreMemo = useFlomoStore((s) => s.restoreMemo);
  const purgeMemo = useFlomoStore((s) => s.purgeMemo);
  const toast = useFlomoStore((s) => s.toast);

  const trashed = useMemo(
    () => memos.filter((m) => m.deleted).sort((a, b) => b.updatedAt - a.updatedAt),
    [memos],
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="回收站" />

      <div
        className="flex-1 overflow-y-auto px-3 py-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {trashed.length === 0 ? (
          <div className="text-center mt-20" style={{ color: C.sub, fontSize: 14 }}>回收站是空的</div>
        ) : (
          <div className="flex flex-col gap-2">
            {trashed.map((m) => (
              <div key={m.id} className="rounded-2xl px-4 py-3" style={{ background: C.surface }}>
                <div className="mb-1.5" style={{ color: C.sub, fontSize: 12 }}>{memoTime(m.createdAt)}</div>
                {renderContent(m.content, () => ({}), 14)}
                <div className="flex gap-4 mt-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                  <button
                    {...bindTap({ kind: 'action', id: 'trash.page.restore.do' }, { onTrigger: () => { restoreMemo(m.id); toast('已恢复'); } })}
                    className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    style={{ color: C.green, fontSize: 13 }}
                  >
                    <IcRefresh size={15} />恢复
                  </button>
                  <button
                    {...bindTap({ kind: 'action', id: 'trash.page.purge.do' }, { onTrigger: () => { purgeMemo(m.id); toast('已彻底删除'); } })}
                    className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
                    style={{ color: '#E5484D', fontSize: 13 }}
                  >
                    <IcDelete size={15} />彻底删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
