import React from 'react';
import { useLocation } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { appTodayDay, appTodayMonth, appTodayYear } from '../utils/appTime';
import { IcCheck, IcClose } from '../res/icons';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

function hm(ts: number) {
  const d = TimeService.fromTimestamp(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
/** 记录所属「日」(仅取月内日号,日历为单月装饰网格) */
const dayOf = (ts: number) => TimeService.fromTimestamp(ts).getDate();

export default function TimelinePage() {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const sheet = sp.get('sheet');
  const recordId = sp.get('recordId') ?? '';
  const records = useFanqieTodoStore((s) => s.records);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();

  // 「今天」= 模拟系统当天(与统计/锁机页一致);种子与新记录都归在此日。
  const today = appTodayDay();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const dayRecords = records.filter((r) => dayOf(r.startTs) === selectedDay);

  const year = appTodayYear();
  const month = appTodayMonth(); // 0-11
  const daysInMonth = TimeService.fromLocalParts(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="relative flex h-full flex-col bg-[#EAF2FB]" data-status-bar-foreground="dark">
      <div className="px-4 pb-1 pt-10 text-lg font-bold text-[#222]">{year}年{month + 1}月</div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 月历 */}
        <div className="bg-gradient-to-b from-[#EAF2FB] to-white px-3 pb-2">
          <div className="grid grid-cols-7 text-center text-xs text-[#8A8F99]">{WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}</div>
          <div className="grid grid-cols-7 text-center text-sm">
            {days.map((d) => {
              const sel = d === selectedDay;
              const hasRec = records.some((r) => dayOf(r.startTs) === d);
              return (
                <button key={d} {...action('timeline.date.select.action', () => setSelectedDay(d), { params: { day: d } })}
                  className={`py-1.5 ${sel ? 'font-bold text-white' : 'text-[#333]'}`}>
                  <span className={`relative inline-block h-6 w-6 leading-6 ${sel ? 'rounded-full bg-[#4A90D9]' : ''}`}>
                    {d}
                    {!sel && hasRec && <span className="absolute bottom-0 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#4A90D9]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 工具行 */}
        <div className="flex items-center justify-around border-b border-[#EEE] bg-white py-2 text-lg text-[#555]">
          <button {...action('timeline.grid.wontfixToast', () => showToast('九宫格功能暂未开放'))} aria-label="九宫格">▦</button>
          <button {...action('timeline.today.action', () => setSelectedDay(today))} className="text-base font-semibold text-[#4A90D9]">今</button>
          <button {...action('timeline.kanban.wontfixToast', () => showToast('总结功能暂未开放'))} aria-label="总结">◫</button>
          <button {...action('timeline.add.wontfixToast', () => showToast('补记功能暂未开放'))} aria-label="补记" className="text-3xl leading-none text-[#4A90D9]">＋</button>
          <button {...action('timeline.share.wontfixToast', () => showToast('分享功能暂未开放'))} aria-label="分享">↗</button>
          <button {...action('timeline.sort.wontfixToast', () => showToast('排序功能暂未开放'))} aria-label="排序">⇅</button>
        </div>

        {/* 记录列表(按选中日筛选) */}
        <div className="p-3">
          {dayRecords.length === 0 ? (
            <div className="mt-16 text-center text-sm text-[#8A8F99]">{t('timeline.noRecord')}</div>
          ) : (
            dayRecords.map((r) => (
              <button key={r.id} {...bindTap('timeline.record.open', { params: { recordId: r.id } })}
                className="mb-2 flex w-full items-start gap-3 rounded-xl bg-white p-3 text-left">
                <div className="w-14 shrink-0 text-xs text-[#8A8F99]">{hm(r.startTs)}<br />{hm(r.endTs)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between"><span className="font-semibold text-[#222]">{r.todoName}</span><span className="text-xs text-[#8A8F99]">{t('timeline.done')}</span></div>
                  <div className="mt-1 text-xs text-[#B8BCC4]">{r.reflection || t('timeline.fillNote')}</div>
                  {r.durationMin > 0 && <div className="mt-1 text-xs text-[#8A8F99]">{r.durationMin >= 60 ? `${Math.floor(r.durationMin / 60)} 小时 ${r.durationMin % 60} 分钟` : `${r.durationMin} 分钟`} · {r.percent ?? 100}%</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {sheet === 'record' && <RecordDetail recordId={recordId} />}
      {sheet === 'note' && <NoteDialog recordId={recordId} />}
    </div>
  );
}

function RecordDetail({ recordId }: { recordId: string }) {
  const { bindTap, bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const rec = useFanqieTodoStore((x) => x.records.find((r) => r.id === recordId));
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [dur, setDur] = React.useState('');
  const startEdit = () => { setName(rec?.todoName ?? ''); setDur(String(rec?.durationMin ?? 0)); setEditing(true); };
  const saveEdit = () => {
    const n = parseInt(dur, 10);
    s.updateRecord(recordId, { todoName: name.trim() || rec?.todoName || '', durationMin: Number.isFinite(n) && n >= 0 ? n : (rec?.durationMin ?? 0) });
    setEditing(false);
  };
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-3 w-full max-w-[340px] rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold">{editing ? '修改记录' : (rec?.todoName ?? '记录')}</span>
          {editing ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(false)} aria-label="取消"><IcClose size={20} /></button>
              <button onClick={saveEdit} aria-label="保存" className="text-[#4A90D9]"><IcCheck size={22} /></button>
            </div>
          ) : (
            <button {...bindBack()} aria-label="关闭"><IcClose size={20} /></button>
          )}
        </div>
        {editing ? (
          <div className="mb-3 flex flex-col gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="待办名称"
              className="border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
            <div className="flex items-center gap-2">
              <input type="number" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} placeholder="专注时长"
                className="flex-1 border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
              <span className="text-sm text-[#8A8F99]">分钟</span>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex gap-2">
            <button {...action('timeline.record.edit.action', startEdit)} className="flex-1 rounded-lg bg-[#EAF2FB] py-2 text-sm text-[#4A90D9]">修改记录</button>
            <button {...action('timeline.record.delete.action', () => { s.deleteRecord(recordId); back(); })} className="flex-1 rounded-lg bg-[#FDECEC] py-2 text-sm text-[#E5533C]">删除</button>
          </div>
        )}
        <div className="mb-3 rounded-lg bg-[#F7F8FA] p-3 text-sm text-[#555]">
          <div className="flex justify-between py-0.5"><span>专注时长</span><span>{rec?.durationMin ?? 0} 分钟</span></div>
          <div className="flex justify-between py-0.5"><span>计时状态</span><span>已完成</span></div>
        </div>
        <button {...bindTap('timeline.record.note', { params: { recordId } })} className="w-full rounded-lg bg-[#F7F8FA] py-3 text-center text-sm font-medium text-[#222]">点击填写心得</button>
      </div>
    </div>
  );
}

function NoteDialog({ recordId }: { recordId: string }) {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const { t } = useI18n();
  const [text, setText] = React.useState('');
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-3 w-full max-w-[340px] rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold">{t('note.title')}</span>
          <button {...action('timeline.note.commit.action', () => { if (recordId) s.addRecordNote(recordId, text); back(); })} aria-label="保存"><IcCheck size={22} /></button>
        </div>
        <textarea {...action('timeline.note.input', () => {}, { params: { value: text } })}
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t('note.placeholder')} rows={5}
          className="w-full resize-none border-b border-[#DCEBFB] pb-1 text-sm text-[#4A90D9] outline-none" />
      </div>
    </div>
  );
}
