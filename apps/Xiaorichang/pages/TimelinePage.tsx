import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, Segmented } from '../components/common';
import { toDateKey, todayKey, daysInMonth } from '../utils/appTime';
import { sharePlainText } from '@/os/shareBridge';

/** 时间线(s182/s215)。聚合打卡 stamps + 笔记 + 专注记录为当日流水。 */
export default function TimelinePage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const [view, setView] = useState<'timeline' | 'text'>('timeline');
  const [filter, setFilter] = useState<'all' | 'checkin' | 'note' | 'focus'>('all');
  const now = TimeService.getDate();
  const [ym, setYm] = useState<[number, number]>([now.getFullYear(), now.getMonth()]);
  const [dateKey, setDateKey] = useState(todayKey());

  const [year, month] = ym;
  const firstDay = TimeService.fromLocalParts(year, month, 1);
  const startCol = st.settings.weekStart === 'mon' ? (firstDay.getDay() + 6) % 7 : firstDay.getDay();
  const rawEvents: { ts: number; text: string; color: string; kind: 'checkin' | 'note' | 'focus' }[] = [];
  for (const l of st.logs.filter((l) => l.date === dateKey)) {
    const habit = st.habits.find((h) => h.id === l.habitId);
    for (const ts of l.stamps) rawEvents.push({ ts, text: `完成了「${habit?.name ?? l.habitId}」`, color: habit?.color ?? colors.brand, kind: 'checkin' });
    if (l.status === 'failed') rawEvents.push({ ts: 0, text: `「${habit?.name}」标记失败`, color: colors.stateFail, kind: 'checkin' });
  }
  for (const n of st.notes.filter((n) => toDateKey(TimeService.fromTimestamp(n.createdAt)) === dateKey)) {
    rawEvents.push({ ts: n.createdAt, text: `记了一条笔记:${n.title ?? n.body.slice(0, 18)}`, color: n.color, kind: 'note' });
  }
  for (const r of st.records.filter((r) => toDateKey(TimeService.fromTimestamp(r.startTs)) === dateKey)) {
    rawEvents.push({ ts: r.startTs, text: `专注了 ${r.minutes} 分钟`, color: colors.focusStop, kind: 'focus' });
  }
  const events = rawEvents.filter((event) => filter === 'all' || event.kind === filter);
  events.sort((a, b) => a.ts - b.ts);
  const fmt = (ts: number) => {
    if (!ts) return '--:--';
    const d = TimeService.fromTimestamp(ts);
    return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
  };
  const textVersion = events.map((e) => `${fmt(e.ts)} ${e.text}`).join('\n') || '(这一天还没有记录)';
  const filterLabels = {
    all: s.timelineFilterAll,
    checkin: s.timelineFilterCheckin,
    note: s.timelineFilterNote,
    focus: s.timelineFilterFocus,
  } as const;
  const cycleFilter = () => {
    const filters: (keyof typeof filterLabels)[] = ['all', 'checkin', 'note', 'focus'];
    setFilter(filters[(filters.indexOf(filter) + 1) % filters.length]);
  };

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.timelineTitle} right={
        <>
          <button {...action('timeline.filter.open', cycleFilter)}
            className="rounded-full bg-[#F5F6F7] px-2.5 py-1 text-xs text-[#6B7280]">{filterLabels[filter]} ⌄</button>
          <button {...action('timeline.share.open', () => {
            const launched = sharePlainText(`【${s.timelineTitle} · ${dateKey}】\n${textVersion}`, {
              onResult: (r) => { if (r.resultCode === 'OK') st.showToast(s.shareSuccess); },
            });
            if (!launched) st.showNotice(s.notAvailable);
          })}
            className="text-sm text-[#9AA5B1]">➤</button>
        </>
      } />

      {/* 月历 */}
      <div className="px-4">
        <div className="flex items-center justify-between text-sm text-[#9AA5B1]">
          <div className="flex gap-3">
            <button {...action('timeline.month.nav', () => setYm(([y, m]) => [y - 1, m]), { params: { delta: -12 } })}>«</button>
            <button {...action('timeline.month.nav', () => setYm(([y, m]) => (m === 0 ? [y - 1, 11] : [y, m - 1])), { params: { delta: -1 } })}>‹</button>
          </div>
          <b className="text-[#424242]">{year}-{`${month + 1}`.padStart(2, '0')}</b>
          <div className="flex gap-3">
            <button {...action('timeline.month.nav', () => setYm(([y, m]) => (m === 11 ? [y + 1, 0] : [y, m + 1])), { params: { delta: 1 } })}>›</button>
            <button {...action('timeline.month.nav', () => setYm(([y, m]) => [y + 1, m]), { params: { delta: 12 } })}>»</button>
          </div>
        </div>
        {/* Gate4 订正(s244):真机是 7 列月历网格,不是横向日期条。
            有记录的日子下方一个黄点;今天=黑底圆角方块;选中日=浅灰底。 */}
        <div className="mt-2 grid grid-cols-7 gap-y-1 text-center">
          {(st.settings.weekStart === 'mon'
            ? ['一', '二', '三', '四', '五', '六', '日']
            : ['日', '一', '二', '三', '四', '五', '六']
          ).map((w) => <div key={w} className="pb-1 text-xs text-[#C9CDD3]">{w}</div>)}
          {Array.from({ length: startCol }).map((_, i) => <div key={`pad${i}`} />)}
          {Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1).map((day) => {
            const key = `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
            const sel = key === dateKey;
            const isToday = key === todayKey();
            const hasData = st.logs.some((l) => l.date === key && l.status === 'done')
              || st.notes.some((n) => toDateKey(TimeService.fromTimestamp(n.createdAt)) === key)
              || st.records.some((r) => toDateKey(TimeService.fromTimestamp(r.startTs)) === key);
            return (
              <button key={day}
                {...action('timeline.date.pick', () => setDateKey(key), { params: { date: key } })}
                className="mx-auto flex h-11 w-11 flex-col items-center justify-center rounded-xl"
                style={isToday
                  ? { background: colors.inkStrong, color: '#fff' }
                  : sel ? { background: '#F2F3F5', color: '#212121' } : { color: '#212121' }}>
                <span className="text-base">{day}</span>
                <span className="h-1.5 w-1.5 rounded-full"
                  style={{ background: hasData ? colors.brand : 'transparent' }} />
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <Segmented value={view} options={[
            { key: 'timeline', label: '时间线', bind: action('timeline.view.select.timeline', () => setView('timeline')) },
            { key: 'text', label: s.timelineText, bind: action('timeline.view.select.text', () => setView('text')) },
          ]} />
          {view === 'text' && (
            <button {...action('timeline.text.copy', () => {
              const clipboard = window.__OS__?.clipboard;
              if (!clipboard) { st.showNotice(s.notAvailable); return; }
              clipboard.copyText(textVersion, 'xiaorichang');
              st.showToast(s.copiedToClipboard);
            })}
              className="text-xs text-[#9AA5B1]">复制文字笔记</button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
        {view === 'timeline' ? (
          events.length === 0 ? (
            <div className="pt-16 text-center text-sm text-[#9AA5B1]">这一天还没有记录</div>
          ) : (
            <div className="border-l-2 border-[#F0F0F0] pl-4">
              {events.map((e, i) => (
                <div key={i} className="relative mb-4">
                  <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white" style={{ background: e.color }} />
                  <div className="text-xs text-[#9AA5B1]">{fmt(e.ts)}</div>
                  <div className="text-sm text-[#424242]">{e.text}</div>
                </div>
              ))}
            </div>
          )
        ) : (
          <pre className="whitespace-pre-wrap rounded-2xl bg-[#F8F8F8] p-4 text-sm leading-relaxed text-[#424242]">{textVersion}</pre>
        )}
      </div>
    </div>
  );
}
