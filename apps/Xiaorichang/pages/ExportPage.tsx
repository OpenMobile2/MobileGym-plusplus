import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { toDateKey } from '../utils/appTime';

type ExportRange = 'all' | 'd7' | 'd30' | 'm3' | 'y1';

/** 数据导出(s187)。当前环境通过系统剪切板交付完整 CSV。 */
export default function ExportPage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const [type, setType] = useState<'notes' | 'checkins'>('checkins');
  const [range, setRange] = useState<ExportRange>('all');
  const [preview, setPreview] = useState('');

  const Chip = ({ on, label, bind }: { on: boolean; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="rounded-full px-3.5 py-1.5 text-[13px]"
      style={on ? { background: colors.inkStrong, color: '#fff' } : { background: '#fff', color: '#424242' }}>
      {label}
    </button>
  );

  const exportCsv = () => {
    const days = range === 'd7' ? 7 : range === 'd30' ? 30 : range === 'm3' ? 90 : range === 'y1' ? 365 : null;
    const cutoffTs = days === null ? null : TimeService.now() - days * 86400000;
    const cutoffDate = cutoffTs === null ? null : toDateKey(TimeService.fromTimestamp(cutoffTs));
    const logs = st.logs.filter((l) => !cutoffDate || l.date >= cutoffDate);
    const notes = st.notes.filter((n) => cutoffTs === null || n.createdAt >= cutoffTs);
    const rows = type === 'checkins'
      ? [['date', 'habit', 'status'], ...logs.map((l) => [l.date, st.habits.find((h) => h.id === l.habitId)?.name ?? l.habitId, l.status])]
      : [['created', 'title', 'body'], ...notes.map((n) => [String(n.createdAt), n.title ?? '', n.body])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    setPreview(csv.split('\n').slice(0, 8).join('\n'));
    const clipboard = window.__OS__?.clipboard;
    if (!clipboard) { st.showNotice(s.notAvailable); return; }
    clipboard.copyText(csv, 'xiaorichang');
    st.showToast(s.exportCopied);
  };

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.dataExport} />
      <div className="px-4">
        <div className="text-sm font-semibold text-[#424242]">类型</div>
        <div className="mt-2 flex gap-2">
          <Chip on={type === 'checkins'} label="打卡记录" bind={action('export.type.select.checkins', () => setType('checkins'))} />
          <Chip on={type === 'notes'} label="碎念笔记" bind={action('export.type.select.notes', () => setType('notes'))} />
        </div>
        <div className="mt-4 text-sm font-semibold text-[#424242]">时间范围</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Chip on={range === 'all'} label="全部数据" bind={action('export.range.select.all', () => setRange('all'))} />
          <Chip on={range === 'd7'} label="最近7天" bind={action('export.range.select.d7', () => setRange('d7'))} />
          <Chip on={range === 'd30'} label="最近30天" bind={action('export.range.select.d30', () => setRange('d30'))} />
          <Chip on={range === 'm3'} label="最近3个月" bind={action('export.range.select.m3', () => setRange('m3'))} />
          <Chip on={range === 'y1'} label="最近一年" bind={action('export.range.select.y1', () => setRange('y1'))} />
          <Chip on={false} label="自定义时间段" bind={action('export.range.select.custom', () => st.showNotice(s.notAvailable))} />
        </div>
        <button {...action('export.csv.commit', exportCsv)}
          className="mt-5 w-full rounded-full py-3 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          导出 CSV
        </button>
        {preview && (
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-white p-3 text-xs leading-relaxed text-[#6B7280]">{preview}</pre>
        )}
      </div>
    </div>
  );
}
