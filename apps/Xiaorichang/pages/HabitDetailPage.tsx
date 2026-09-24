import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useDialogs } from '../hooks/useDialogs';
import { colors } from '../res/colors';
import { IconRenderer, IcHeart, IcPen, IcMoreH, IcRight, IcHelp } from '../res/icons';
import { Sheet } from '../components/Sheet';
import { MissingContent, PageHeader, MenuRow, Segmented } from '../components/common';
import { daysInMonth, toDateKey, todayKey } from '../utils/appTime';
import { monthStats, totalDoneDays, totalFocusMinutes, isScheduled } from '../utils/metrics';

/**
 * 习惯详情(s176-s178, s230-s233)。
 * ⚠ 日历点空格 = 就地补打卡,无弹层(s231→s233);
 *   达成率 = 本月完成天数 ÷ 当月自然日天数(两点定式 4/31=12.9%, 5/31=16.1%)。
 */
export default function HabitDetailPage() {
  const [sp] = useSearchParams();
  const habitId = sp.get('habitId') ?? '';
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const habit = st.habits.find((h) => h.id === habitId);
  const [tab, setTab] = useState<'calendar' | 'quant' | 'other'>('calendar');
  const now = TimeService.getDate();
  const requestedDateTs = sp.get('date') ? TimeService.parseToTimestamp(sp.get('date')!) : 0;
  const initialCalendarDate = requestedDateTs ? TimeService.fromTimestamp(requestedDateTs) : now;
  const [ym, setYm] = useState<[number, number]>([
    initialCalendarDate.getFullYear(), initialCalendarDate.getMonth(),
  ]);
  const sheet = sp.get('sheet');

  if (!habit) {
    return <MissingContent />;
  }

  const [year, month] = ym;
  const nDays = daysInMonth(year, month);
  const ms = monthStats(st.logs, habitId, year, month);
  const glowThisMonth = (ms.doneDays - ms.failedDays) * habit.reward;
  const firstDay = TimeService.fromLocalParts(year, month, 1);
  const startCol = st.settings.weekStart === 'mon'
    ? (firstDay.getDay() + 6) % 7
    : firstDay.getDay();
  const logOf = (day: number) => {
    const key = `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
    return st.logs.find((l) => l.habitId === habitId && l.date === key);
  };

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title="" right={
        <>
          <button {...action('habit.detail.favorite.toggle', () => st.toggleImportant(habitId))} aria-label="收藏"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm">
            <IcHeart size={17} color={habit.important ? colors.stateFail : '#C9CDD3'}
              fill={habit.important ? colors.stateFail : 'none'} />
          </button>
          <button {...bindTap('habit.detail.edit', { params: { habitId } })} aria-label="编辑"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcPen size={16} /></button>
          <button {...bindTap('habit.detail.moremenu.open', { params: { habitId } })} aria-label="更多"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcMoreH size={17} /></button>
        </>
      } />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部 */}
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: habit.color, color: '#fff' }}>
            <IconRenderer name={habit.icon} size={24} />
          </span>
          <div>
            <div className="text-base font-bold text-[#212121]">{habit.name}</div>
            <div className="text-xs text-[#9AA5B1]">
              {habit.recurrence.kind === 'daily' ? '每天' : habit.recurrence.kind === 'weekly' ? '每周' : habit.recurrence.kind === 'monthly' ? '每月' : '间隔'}
            </div>
          </div>
        </div>

        {/* 四数据块 */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { v: `${totalDoneDays(st.logs, habitId)}d`, label: s.statTotalDone },
            { v: `${st.logs.filter((l) => l.habitId === habitId).reduce((a, l) => a + (l.quantity ?? 0), 0)} 次`, label: s.statQuantify },
            { v: `${st.logs.filter((l) => l.habitId === habitId && l.status === 'done').length * habit.reward}`, label: s.statGlow },
            { v: `${totalFocusMinutes(st.records, habitId)}m`, label: s.statFocus },
          ].map((b) => (
            <div key={b.label} className="rounded-2xl bg-[#F2F3F5] py-3 text-center">
              <div className="text-base font-bold text-[#424242]">{b.v}</div>
              <div className="mt-0.5 text-xs text-[#9AA5B1]">{b.label}</div>
            </div>
          ))}
        </div>

        {/* tab 条 */}
        <div className="mt-3">
          <Segmented value={tab} options={[
            { key: 'calendar', label: s.tabCalendar, bind: action('habit.detail.tab.select.calendar', () => setTab('calendar')) },
            { key: 'quant', label: s.tabQuantTrend, bind: action('habit.detail.tab.select.quant', () => setTab('quant')) },
            { key: 'other', label: s.tabOther, bind: action('habit.detail.tab.select.other', () => setTab('other')) },
          ]} />
        </div>

        {tab === 'calendar' && (
          <>
            <div className="mt-3 flex items-center justify-between">
              <button {...action('habit.detail.calendar.nav', () => setYm(([y, m]) => (m === 0 ? [y - 1, 11] : [y, m - 1])), { params: { delta: -1 } })}
                className="text-sm text-[#9AA5B1]">‹ {s.calendarPrevMonth}</button>
              <div className="text-base font-bold text-[#212121]">{year}-{`${month + 1}`.padStart(2, '0')}</div>
              <button {...action('habit.detail.calendar.nav', () => setYm(([y, m]) => (m === 11 ? [y + 1, 0] : [y, m + 1])), { params: { delta: 1 } })}
                className="text-sm text-[#9AA5B1]">{s.calendarNextMonth} ›</button>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-y-2 text-center text-xs text-[#9AA5B1]">
              {(st.settings.weekStart === 'mon' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] : ['周日', '周一', '周二', '周三', '周四', '周五', '周六']).map((w) => <div key={w}>{w}</div>)}
              {Array.from({ length: startCol }).map((_, i) => <div key={`pad${i}`} />)}
              {Array.from({ length: nDays }, (_, i) => i + 1).map((day) => {
                const key = `${year}-${`${month + 1}`.padStart(2, '0')}-${`${day}`.padStart(2, '0')}`;
                const log = logOf(day);
                const isToday = key === todayKey();
                const d = TimeService.fromLocalParts(year, month, day);
                const dashed = isScheduled(habit.recurrence, d);
                return (
                  <div key={day} className="flex flex-col items-center">
                    <button
                      {...action('habit.detail.calendar.checkinOn', () => st.calendarCheckin(habitId, key), { params: { habitId, date: key } })}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-[13px]"
                      style={{
                        background: log?.status === 'done' ? '#D9C3A5' : 'transparent',
                        color: log?.status === 'done' ? '#fff' : '#424242',
                        border: log?.status === 'done' ? 'none' : dashed ? '1.5px dashed #D5D8DC' : '1.5px solid transparent',
                        outline: isToday ? '1.5px solid #8A8F99' : 'none',
                      }}>
                      {day}
                    </button>
                    {isToday && <span className="text-[9px] text-[#9AA5B1]">今天</span>}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 rounded-xl bg-[#F2F3F5] px-3 py-2 text-xs text-[#9AA5B1]">{s.calendarHint}</div>

            {/* 本月统计(s232/s233) */}
            <div className="mt-3 text-sm font-semibold text-[#424242]">{s.monthStats}</div>
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-[#F2F3F5] px-4 py-3">
              <div className="flex items-center gap-1 text-sm text-[#424242]">
                {s.achieveRate} <b>{(ms.rate * 100).toFixed(1)}%</b>
                <button {...action('habit.detail.rate.tip', () => st.showToast(s.achieveRateTip))} aria-label="说明">
                  <IcHelp size={14} className="text-[#B9BEC7]" />
                </button>
              </div>
              <span className="text-sm text-[#9AA5B1]">{s.keepGoing}</span>
            </div>
            <div className="mt-2 rounded-2xl bg-[#F2F3F5] px-4 py-3 text-sm text-[#424242]">
              {s.statGlow} <b>{glowThisMonth}</b>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-2xl bg-[#F2F3F5] px-3 py-3">完成 <b>{ms.doneDays}d</b></div>
              <div className="rounded-2xl bg-[#F2F3F5] px-3 py-3">失败 <b>{ms.failedDays}d</b></div>
              <div className="rounded-2xl bg-[#F2F3F5] px-3 py-3">量化 <b>{ms.quantity} 次</b></div>
            </div>
          </>
        )}

        {tab === 'quant' && (
          <div className="mt-4 rounded-2xl bg-white p-4">
            <div className="text-sm font-semibold text-[#424242]">{s.tabQuantTrend}</div>
            <div className="mt-3 flex h-32 items-end gap-1.5">
              {Array.from({ length: 14 }, (_, i) => {
                const d = TimeService.fromTimestamp(TimeService.now() - (13 - i) * 86400000);
                const q = st.logs.find((l) => l.habitId === habitId && l.date === toDateKey(d))?.quantity ?? 0;
                const max = Math.max(1, ...st.logs.filter((l) => l.habitId === habitId).map((l) => l.quantity ?? 0));
                return <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(4, (q / max) * 100)}%`, background: q ? habit.color : '#F2F3F5' }} />;
              })}
            </div>
          </div>
        )}

        {tab === 'other' && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-white">
            {[
              { label: s.habitReminder, bind: bindTap('habit.detail.reminder.open', { params: { habitId } }) },
              { label: s.focusRecords, bind: bindTap('habit.detail.focusrecords.open', { params: { habitId } }) },
              { label: '年度统计', bind: bindTap('habit.detail.yearstats.open', { params: { habitId } }) },
              { label: '所有日志', bind: bindTap('habit.detail.logs.open', { params: { habitId } }) },
            ].map((r) => (
              <button key={r.label} {...r.bind}
                className="flex w-full items-center justify-between border-b border-[#F5F5F5] px-4 py-3.5 text-sm text-[#424242]">
                {r.label} <IcRight size={16} className="text-[#C9CDD3]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ⋯ 菜单(s230:4 项,与行菜单不同构 —— 第二轮审核订正) */}
      {sheet === 'moremenu' && <DetailMenuSheet habitId={habitId} />}
    </div>
  );
}

function DetailMenuSheet({ habitId }: { habitId: string }) {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { dialogs, confirm } = useDialogs();
  const habit = st.habits.find((h) => h.id === habitId);
  const exportLog = () => {
    if (!habit) { st.showNotice(s.contentMissing); return; }
    const clipboard = window.__OS__?.clipboard;
    if (!clipboard) { st.showNotice(s.notAvailable); return; }
    const rows = st.logs
      .filter((l) => l.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((l) => `${l.date}\t${l.status}\t${l.quantity ?? ''}\t${l.note ?? ''}`);
    clipboard.copyText([`${habit.name}\t打卡日志`, '日期\t状态\t数量\t备注', ...rows].join('\n'), 'xiaorichang');
    st.showToast(s.exportCopied);
  };
  return (
    <Sheet>
      <MenuRow label={s.habitExportLog}
        {...action('habit.detailmenu.exportLog', exportLog, { params: { habitId } })} />
      <div className="mx-6 my-1 border-t border-[#F2F2F2]" />
      <MenuRow label={s.habitArchive}
        {...action('habit.detailmenu.archive', () => { st.archiveHabit(habitId); back(2); }, { params: { habitId } })} />
      <MenuRow label={s.habitResetData} danger
        {...action('habit.detailmenu.resetData', () => confirm({
          title: `${s.habitResetData}?`, desc: '清空该习惯的全部打卡记录与累计光芒值,习惯本身保留', danger: true,
          onConfirm: () => { st.resetHabitData(habitId); back(); },
        }), { params: { habitId } })} />
      <MenuRow label={s.habitDelete} danger
        {...action('habit.detailmenu.delete', () => confirm({
          title: `${s.habitDelete}?`, desc: '该习惯及其全部打卡记录都会被删除', danger: true,
          onConfirm: () => { st.deleteHabit(habitId); back(2); },
        }), { params: { habitId } })} />
      {dialogs}
    </Sheet>
  );
}
