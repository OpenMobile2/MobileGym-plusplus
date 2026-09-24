import React, { useMemo, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { dayKey } from '../utils/format';
import { IcNavBack, IcShare } from '../res/icons';

const DAY_MS = 86400000;

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

function StatBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-16 text-right shrink-0" style={{ color: C.sub, fontSize: 12 }}>{label}</div>
      <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: C.tagBg }}>
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 6)}%`, background: C.green }} />
      </div>
      <div className="w-12 shrink-0 font-semibold" style={{ color: C.text, fontSize: 13 }}>{value}</div>
    </div>
  );
}

export default function StatsHeatmapPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const memos = useFlomoStore((s) => s.memos);
  const user = useFlomoStore((s) => s.user);
  const setCurrentFilter = useFlomoStore((s) => s.setCurrentFilter);
  const setCurrentDate = useFlomoStore((s) => s.setCurrentDate);
  const setCurrentTag = useFlomoStore((s) => s.setCurrentTag);
  const toast = useFlomoStore((s) => s.toast);
  const [range, setRange] = useState<'month' | 'year'>('month');

  const live = useMemo(() => memos.filter((m) => !m.deleted), [memos]);

  // 锚点:最近一条笔记的时间戳(无笔记则用当前模拟时间),日历定位到它所在的月/年
  const anchorTs = useMemo(
    () => (live.length ? live.reduce((max, m) => Math.max(max, m.createdAt), 0) : TimeService.now()),
    [live],
  );

  // 派生:每一天的笔记数('YYYY-MM-DD' → count),用于热力图着色
  const dayCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of live) {
      const k = dayKey(m.createdAt);
      counts[k] = (counts[k] ?? 0) + 1;
    }
    return counts;
  }, [live]);

  // 月视图:锚点所在月的真实日历(周一为首列;从当月 1 号起逐天 +86400000,月份变化即止)
  const monthGrid = useMemo(() => {
    const a = TimeService.fromTimestamp(anchorTs);
    const year = a.getFullYear();
    const month = a.getMonth(); // 0-based
    const firstTs = anchorTs - (a.getDate() - 1) * DAY_MS;
    const offset = (TimeService.fromTimestamp(firstTs).getDay() + 6) % 7;
    const days: { day: number; key: string }[] = [];
    let ts = firstTs;
    while (TimeService.fromTimestamp(ts).getMonth() === month) {
      days.push({ day: days.length + 1, key: dayKey(ts) });
      ts += DAY_MS;
    }
    return { year, month: month + 1, offset, days };
  }, [anchorTs]);

  // 年视图:锚点所在年 12 个月的笔记数
  const yearCounts = useMemo(() => {
    const year = TimeService.fromTimestamp(anchorTs).getFullYear();
    const counts = Array.from({ length: 12 }, () => 0);
    for (const m of live) {
      const d = TimeService.fromTimestamp(m.createdAt);
      if (d.getFullYear() === year) counts[d.getMonth()] += 1;
    }
    return counts;
  }, [live, anchorTs]);

  const liveCount = live.length;
  const wordCount = useMemo(() => live.reduce((sum, m) => sum + m.content.length, 0), [live]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 / 月·年切换 / 更多 */}
      <div className="flex items-center h-12 px-2 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="返回"
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 flex justify-center">
          <div className="flex rounded-full p-0.5" style={{ background: C.tagBg }}>
            {(['month', 'year'] as const).map((r) => (
              <button
                key={r}
                {...bindTap(
                  { kind: 'action', id: 'stats.heatmap.range.select' },
                  { onTrigger: () => { setRange(r); toast(r === 'month' ? '月度视图' : '年度视图'); } },
                )}
                className="px-5 h-8 rounded-full border-none cursor-pointer font-medium"
                style={{
                  fontSize: 13,
                  background: range === r ? C.surface : 'transparent',
                  color: range === r ? C.text : C.sub,
                }}
              >
                {r === 'month' ? '月' : '年'}
              </button>
            ))}
          </div>
        </div>
        <button
          {...bindTap('stats.heatmap.more')}
          className="px-3 h-8 rounded-full border-none cursor-pointer"
          style={{ background: C.tagBg, color: C.text, fontSize: 13 }}
        >
          更多
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-10"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 周标题(仅月视图) */}
        {range === 'month' && (
          <div className="grid grid-cols-7 gap-1.5 mb-2 mt-1">
            {WEEK.map((w) => (
              <div key={w} className="text-center" style={{ color: C.sub, fontSize: 11 }}>{w}</div>
            ))}
          </div>
        )}

        {/* 月份标题 + 概要 + 分享 */}
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-semibold" style={{ color: C.text, fontSize: 16 }}>
              {range === 'month' ? `${monthGrid.year} 年 ${monthGrid.month} 月` : `${monthGrid.year} 年`}
            </div>
            <div style={{ color: C.sub, fontSize: 12 }}>
              {liveCount} 条笔记 · {wordCount} 字 · 坚持记录 {user.days} 天
            </div>
          </div>
          <button
            {...bindTap(
              { kind: 'action', id: 'stats.heatmap.share.do' },
              { onTrigger: () => toast('已生成统计分享图') },
            )}
            className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: C.surface, color: C.sub }}
            aria-label="分享"
          >
            <IcShare size={16} />
          </button>
        </div>

        {/* 月视图:真实日历热力图网格 */}
        {range === 'month' && (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: monthGrid.offset }, (_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {monthGrid.days.map(({ day, key }) => {
              const count = dayCounts[key] ?? 0;
              const hasRecord = count > 0;
              const cell = (
                <div
                  className="aspect-square rounded-md flex items-center justify-center"
                  style={{
                    background: hasRecord
                      ? (count >= 2 ? C.green : '#9FD9BC')
                      : C.tagBg,
                    color: hasRecord ? '#fff' : C.sub,
                    fontSize: 10,
                  }}
                >
                  {day}
                </div>
              );
              if (!hasRecord) return <span key={key}>{cell}</span>;
              // 有记录的一天 → tag.filter(按该日筛选)
              return (
                <button
                  key={key}
                  {...bindTap('stats.heatmap.day', {
                    beforeTrigger: () => { setCurrentTag(null); setCurrentFilter('byDate'); setCurrentDate(key); },
                  })}
                  className="border-none cursor-pointer p-0 bg-transparent"
                >
                  {cell}
                </button>
              );
            })}
          </div>
        )}

        {/* 年视图:12 个月的迷你月块(条数 + 强度底色),无逐日交互 */}
        {range === 'year' && (
          <div className="grid grid-cols-3 gap-2">
            {yearCounts.map((count, i) => {
              const hasRecord = count > 0;
              return (
                <div
                  key={i}
                  className="rounded-xl px-3 py-3 flex flex-col items-center"
                  style={{ background: hasRecord ? (count >= 3 ? C.green : '#9FD9BC') : C.tagBg }}
                >
                  <div style={{ color: hasRecord ? 'rgba(255,255,255,0.9)' : C.sub, fontSize: 12 }}>
                    {i + 1} 月
                  </div>
                  <div className="font-semibold mt-1" style={{ color: hasRecord ? '#fff' : C.sub, fontSize: 16 }}>
                    {count}
                  </div>
                  <div style={{ color: hasRecord ? 'rgba(255,255,255,0.9)' : C.sub, fontSize: 10 }}>条</div>
                </div>
              );
            })}
          </div>
        )}

        {/* 统计柱图 */}
        <div className="mt-6 rounded-2xl p-4" style={{ background: C.surface }}>
          <StatBar label="字数" value={wordCount} max={Math.max(wordCount, 200)} />
          <StatBar label="坚持天数" value={user.days} max={Math.max(user.days, 30)} />
          <StatBar label="笔记数" value={liveCount} max={Math.max(liveCount, 20)} />
        </div>
      </div>
    </div>
  );
}
