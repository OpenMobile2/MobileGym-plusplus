import React, { useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

const C = BOSS_CONFIG;
const DAYS = ['日', '一', '二', '三', '四', '五', '六'];
const DAY_MS = 24 * 60 * 60 * 1000;
const HOURS = ['08', '09', '10', '11', '13', '14', '15', '16', '17', '19'];
const MINUTES = ['00', '05', '10', '15', '30', '45'];

/** 添加面试日程(IMG_8431/8491):Boss选择 + 线上/线下 + 日历 + 时间选择器(实锤) */
const InterviewAddPage: React.FC = () => {
  const { action, back } = useBossGestures();
  const store = useBossStore();
  const sessions = useBossStore((s) => s.sessions);
  const [bossId, setBossId] = useState('');
  const [type, setType] = useState<'online' | 'offline'>('online');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [bossPickerOpen, setBossPickerOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [hour, setHour] = useState('08');
  const [minute, setMinute] = useState('00');

  const chattedBosses = C.bosses.filter((b) => sessions.some((s) => s.bossId === b.id));
  const pickedBoss = C.bosses.find((b) => b.id === bossId);
  const pickedSession = sessions.find((s) => s.bossId === bossId);

  // 面试日历必须跟随模拟器系统时间；否则「本周六」等任务会随时间失效。
  const todayDate = TimeService.fromTimestamp(TimeService.now());
  todayDate.setHours(0, 0, 0, 0);
  const todayTs = todayDate.getTime();
  const calendarStartTs = todayTs - todayDate.getDay() * DAY_MS;
  const weeks = Array.from({ length: 5 }, (_, weekIndex) => (
    Array.from({ length: 7 }, (_, dayIndex) => calendarStartTs + (weekIndex * 7 + dayIndex) * DAY_MS)
  ));

  return (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #1E7FA6 0%, #3FA6B8 30%, #EAF4F6 70%)' }} data-status-bar-foreground="light">
      <PageHeader transparent light />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[26px] font-bold text-white">添加面试日程</div>
        <div className="mt-1 text-[13px] text-white/70">添加Boss未正式邀约的面试,统一管理更方便</div>

        <div className="mt-4 rounded-2xl bg-white/95 p-4">
          <button
            {...action('interviewadd.select.boss', () => setBossPickerOpen(true), { params: { bossId } })}
            className="flex w-full items-center justify-between border-b border-gray-100 pb-3"
          >
            <span className="text-[16px] text-gray-900">面试Boss</span>
            <span className="text-[15px] text-gray-500">{pickedBoss ? `${pickedBoss.name}·${C.companies.find((c) => c.id === pickedBoss.companyId)!.name}` : '选择 ›'}</span>
          </button>
          <div className="flex items-center justify-between pt-3">
            <span className="text-[16px] text-gray-900">面试类型</span>
            <span className="flex items-center gap-5">
              {(['online', 'offline'] as const).map((v) => (
                <button
                  key={v}
                  {...action('interviewadd.select.type', () => setType(v), { params: { value: v } })}
                  className="flex items-center gap-1.5 text-[15px]"
                  style={type === v ? { color: '#111' } : { color: '#9CA3AF' }}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border" style={type === v ? { backgroundColor: COLORS.primaryBtn, borderColor: COLORS.primaryBtn, color: 'white', fontSize: 11 } : { borderColor: '#D1D5DB' }}>
                    {type === v ? '✓' : ''}
                  </span>
                  {v === 'online' ? '线上面试' : '线下面试'}
                </button>
              ))}
            </span>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white/95 p-4">
          <div className="text-[16px] font-semibold text-gray-900">面试日期</div>
          <div className="mt-3 grid grid-cols-7 text-center text-[14px] text-gray-500">
            {DAYS.map((d) => <span key={d}>{d}</span>)}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="mt-2 grid grid-cols-7 text-center">
              {week.map((timestamp, di) => {
                const day = TimeService.fromTimestamp(timestamp);
                const dayOfMonth = day.getDate();
                const label = `${day.getMonth() + 1}月${dayOfMonth}日`;
                const isPast = timestamp < todayTs;
                const selected = date === label;
                return (
                  <button
                    key={timestamp}
                    {...action('interviewadd.select.date', () => setDate(label), { params: { date: label } })}
                    disabled={isPast}
                    className="mx-auto flex h-10 w-10 flex-col items-center justify-center rounded-full text-[16px]"
                    style={selected ? { backgroundColor: COLORS.primaryBtn, color: 'white' } : { color: '#1F2937' }}
                  >
                    {dayOfMonth}
                    {timestamp === todayTs && <span className="text-[9px]" style={selected ? { color: 'white' } : { color: '#9CA3AF' }}>今天</span>}
                    {dayOfMonth === 1 && timestamp !== todayTs && <span className="text-[9px] text-gray-400">{day.getMonth() + 1}月</span>}
                  </button>
                );
              })}
            </div>
          ))}
          <button
            {...action('interviewadd.select.time', () => setTimeOpen(true), { params: { value: time } })}
            className="mt-3 flex w-full items-center justify-between border-t border-gray-100 pt-3"
          >
            <span className="text-[16px] text-gray-900">开始时间</span>
            <span className={`text-[15px] ${time ? 'text-gray-900' : 'text-gray-400'}`}>{time || '请选择时间 ›'}</span>
          </button>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-6">
        <button
          {...action('interviewadd.save.commit', () => {
            if (!bossId || !date || !time) { store.showToast('请完善面试Boss、日期和时间'); return; }
            store.addInterview({ bossId, jobId: pickedSession?.jobId ?? '', type, date, time });
            store.showToast('已保存,仅自己可见');
            back();
          })}
          className="w-full rounded-full py-3 text-center text-[16px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          保存
          <span className="block text-[11px] font-normal text-white/75">仅自己可见</span>
        </button>
      </div>

      {/* 面试Boss选择弹层 */}
      {bossPickerOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => setBossPickerOpen(false)}>
          <div className="rounded-t-2xl bg-white pb-6" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-gray-100 px-4 py-3 text-center text-[15px] font-semibold">选择面试Boss</div>
            {chattedBosses.map((b) => (
              <button key={b.id} onClick={() => { setBossId(b.id); setBossPickerOpen(false); }} className="block w-full py-3 text-center text-[16px] text-gray-800 active:bg-gray-50">
                {b.name}·{C.companies.find((c) => c.id === b.companyId)!.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 时间选择器(IMG_8491:精准时间/宽松时间滚轮) */}
      {timeOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => setTimeOpen(false)}>
          <div className="rounded-t-2xl bg-white pb-8" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <button className="text-[14px] text-gray-400" onClick={() => setTimeOpen(false)}>取消</button>
              <span className="text-[16px] font-semibold">请选择面试开始时间</span>
              <button className="text-[14px]" style={{ color: COLORS.accent }} onClick={() => { setTime(`${hour}:${minute}`); setTimeOpen(false); }}>确定</button>
            </div>
            <div className="flex items-center justify-center gap-6 px-6 py-5">
              <span className="rounded-full bg-[#F0F1F3] px-4 py-2 text-[15px] font-medium text-gray-800">精准时间</span>
              <div className="flex max-h-40 gap-6 overflow-hidden text-center">
                <div className="max-h-40 overflow-y-auto" data-scroll-container="hour-wheel" data-scroll-direction="vertical">
                  {HOURS.map((h) => (
                    <button key={h} onClick={() => setHour(h)} className={`block w-14 py-2 text-[20px] ${hour === h ? 'font-bold text-gray-900' : 'text-gray-300'}`}>{h}</button>
                  ))}
                </div>
                <span className="pt-2 text-[20px] text-gray-400">:</span>
                <div className="max-h-40 overflow-y-auto" data-scroll-container="minute-wheel" data-scroll-direction="vertical">
                  {MINUTES.map((m) => (
                    <button key={m} onClick={() => setMinute(m)} className={`block w-14 py-2 text-[20px] ${minute === m ? 'font-bold text-gray-900' : 'text-gray-300'}`}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center text-[13px] text-gray-400">宽松时间</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewAddPage;
