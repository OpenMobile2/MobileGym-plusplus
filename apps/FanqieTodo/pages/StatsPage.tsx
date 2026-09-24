import React from 'react';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { APP_TODAY_MS, formatDashDate } from '../utils/appTime';
import { IcClock } from '../res/icons';

const RANGES: [string, string, string][] = [
  ['day', '日', 'stats.range.select.day'],
  ['week', '周', 'stats.range.select.week'],
  ['month', '月', 'stats.range.select.month'],
  ['custom', '自定义', 'stats.range.select.custom'],
];

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm">{children}</div>;
}

export default function StatsPage() {
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const stats = useFanqieTodoStore((s) => s.stats);
  const records = useFanqieTodoStore((s) => s.records);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const toast = () => showToast(t('toast.unavailable'));
  const [range, setRange] = React.useState<string>('day');

  const todayMin = records.reduce((a, r) => a + r.durationMin, 0);
  const hh = Math.floor(stats.totalMinutes / 60);
  const mm = stats.totalMinutes % 60;

  // 专注时长分布:按待办名聚合(时长为 0 的记录按 1 分钟计,保证有饼可分)
  const PIE_COLORS = ['#FF8FA0', '#7FD4C4', '#F7C77E', '#8FB7F0', '#C3A6E0'];
  const dist = React.useMemo(() => {
    const byName = new Map<string, number>();
    let total = 0;
    for (const r of records) { const m = Math.max(1, r.durationMin); byName.set(r.todoName, (byName.get(r.todoName) ?? 0) + m); total += m; }
    const entries = [...byName.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { entries, total: total || 1 };
  }, [records]);
  const pieGradient = (() => {
    let acc = 0;
    const stops = dist.entries.map(([, v], i) => {
      const start = (acc / dist.total) * 100; acc += v;
      const end = (acc / dist.total) * 100;
      return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(', ') || '#E5E5E5 0 100%'})`;
  })();

  return (
    <div className="flex h-full flex-col bg-[#EAF2FB]" data-status-bar-foreground="dark">
      <div className="flex items-center justify-between px-4 pb-2 pt-10">
        <span className="text-lg font-bold text-[#4A90D9]">{t('stats.title')}</span>
        <button {...bindTap('stats.checkin.open')} aria-label="打卡" className="text-[#4A90D9]"><IcClock size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <Card>
          <div className="mb-2 text-sm font-semibold text-[#4A90D9]">{t('stats.totalFocus')}</div>
          <div className="flex justify-between">
            <div><div className="text-xs text-[#8A8F99]">{t('stats.count')}</div><div className="text-2xl font-bold text-[#4A90D9]">{stats.totalCount}</div></div>
            <div><div className="text-xs text-[#8A8F99]">{t('stats.duration')}</div><div className="text-2xl font-bold text-[#4A90D9]">{hh}<span className="text-sm">小时</span>{mm}<span className="text-sm">分</span></div></div>
            <div><div className="text-xs text-[#8A8F99]">连续</div><div className="text-2xl font-bold text-[#4A90D9]">{stats.streakDays}天</div></div>
          </div>
        </Card>

        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#4A90D9]">{t('stats.todayFocus')} {formatDashDate(APP_TODAY_MS)}</span>
            <div className="flex gap-3 text-[#8A8F99]">
              <button {...action('stats.date.prev.action', () => showToast('前一天'))}>◀</button>
              <button {...action('stats.date.next.action', () => showToast('后一天'))}>▶</button>
            </div>
          </div>
          <div className="flex justify-between">
            <div><div className="text-xs text-[#8A8F99]">{t('stats.count')}</div><div className="text-xl font-bold text-[#4A90D9]">{records.length}</div></div>
            <div><div className="text-xs text-[#8A8F99]">{t('stats.duration')}</div><div className="text-xl font-bold text-[#4A90D9]">{Math.floor(todayMin / 60)}小时{todayMin % 60}分</div></div>
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#4A90D9]">专注时长分布</span>
            <button {...bindTap('stats.share.open')} className="text-xs text-[#4A90D9]">分享</button>
          </div>
          <div className="mb-3 flex gap-1 rounded-lg bg-[#F1F3F5] p-1 text-xs">
            {RANGES.map(([r, label, id]) => (
              <button key={r} {...action(id, () => setRange(r))}
                className={`flex-1 rounded-md py-1 ${range === r ? 'bg-white font-semibold text-[#4A90D9]' : 'text-[#8A8F99]'}`}>
                {label}
              </button>
            ))}
          </div>
          {/* 饼图 + 图例(按待办分布) */}
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full" style={{ background: pieGradient }}>
            <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white text-center">
              <span className="text-[11px] text-[#8A8F99]">总计</span>
              <span className="text-lg font-bold text-[#4A90D9]">{Math.round(dist.total)}<span className="text-xs">分</span></span>
            </div>
          </div>
          <div className="mt-3 flex flex-col gap-1">
            {dist.entries.map(([name, v], i) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-[#555]">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {name}
                </span>
                <span className="text-[#8A8F99]">{Math.round((v / dist.total) * 100)}%</span>
              </div>
            ))}
          </div>
          <button {...bindTap('stats.records.open')} className="mt-3 block w-full rounded-full bg-[#EAF2FB] py-2 text-sm text-[#4A90D9]">{t('stats.viewRecords')}</button>
        </Card>

        <Card>
          <div className="mb-2 text-sm font-semibold text-[#4A90D9]">App前台运行时间</div>
          <button {...action('stats.appUsage.wontfixToast', toast)} className="text-xs text-[#8A8F99]">点击配置权限来查看App使用情况</button>
        </Card>

        <button {...action('stats.chartSettings.wontfixToast', toast)} className="mx-auto block rounded-full bg-white px-6 py-2 text-sm text-[#4A90D9] shadow-sm">统计图表设置</button>
      </div>
    </div>
  );
}
