import React, { useMemo } from 'react';
import * as TimeService from '@/os/TimeService';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcClose, IcEdit, IcArrowDown } from '../res/icons';

function StatCell({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col gap-1 py-2">
      <div className="font-semibold" style={{ color: C.text, fontSize: 26 }}>{value}</div>
      <div style={{ color: C.sub, fontSize: 12 }}>{label}</div>
    </div>
  );
}

export default function StatsRecordPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const user = useFlomoStore((s) => s.user);
  const toast = useFlomoStore((s) => s.toast);

  const stats = useMemo(() => {
    const live = memos.filter((m) => !m.deleted);
    const noteCount = live.length;
    const wordCount = live.reduce((sum, m) => sum + m.content.length, 0);
    // 按天聚合:单日最多条数 / 单日最多字数
    const byDay: Record<string, { notes: number; words: number }> = {};
    for (const m of live) {
      const dt = TimeService.fromTimestamp(m.createdAt);
      const key = `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
      const bucket = byDay[key] ?? { notes: 0, words: 0 };
      bucket.notes += 1;
      bucket.words += m.content.length;
      byDay[key] = bucket;
    }
    const buckets = Object.values(byDay);
    const maxNotesPerDay = buckets.reduce((mx, b) => Math.max(mx, b.notes), 0);
    const maxWordsPerDay = buckets.reduce((mx, b) => Math.max(mx, b.words), 0);
    return { noteCount, wordCount, maxNotesPerDay, maxWordsPerDay };
  }, [memos]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 / flomo / 编辑 */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-bold lowercase" style={{ color: C.text, fontSize: 17 }}>flomo</div>
        <button
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="编辑"
        >
          <IcEdit size={16} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-10"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="font-semibold mb-3" style={{ color: C.text, fontSize: 18 }}>记录统计</div>

        {/* 统计卡 */}
        <div className="rounded-2xl p-4" style={{ background: C.surface }}>
          {/* 月份下拉 + 分享 */}
          <div className="flex items-center justify-between mb-2">
            <button
              {...bindTap(
                { kind: 'action', id: 'stats.record.month.select' },
                { onTrigger: () => toast('切换统计月份') },
              )}
              className="flex items-center gap-1 border-none cursor-pointer bg-transparent"
              style={{ color: C.sub, fontSize: 13 }}
            >
              本月
              <IcArrowDown size={14} />
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'stats.record.share.do' },
                { onTrigger: () => toast('已生成记录统计分享图') },
              )}
              className="border-none cursor-pointer bg-transparent"
              style={{ color: C.linkBlue, fontSize: 13 }}
            >
              分享
            </button>
          </div>

          <div className="grid grid-cols-3 gap-x-2">
            <StatCell value={stats.noteCount} label="笔记数" />
            <StatCell value={stats.wordCount} label="字数" />
            <StatCell value={stats.maxNotesPerDay} label="单日最多条数" />
            <StatCell value={stats.maxWordsPerDay} label="单日最多字数" />
            <StatCell value={user.days} label="坚持记录天数" />
          </div>
        </div>
      </div>
    </div>
  );
}
