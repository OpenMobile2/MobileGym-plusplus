import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { APP_TODAY_MS } from '../utils/appTime';

const pad = (n: number) => String(n).padStart(2, '0');
// 人类月份 m(1-12)的天数:fromLocalParts 的 monthIndex=m、day=0 => 上一个月索引的最后一天 = 人类第 m 月最后一天
const daysInMonth = (y: number, m: number) => TimeService.fromLocalParts(y, m, 0).getDate();

export default function FutureAddPage() {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const [name, setName] = React.useState('');
  const [remark, setRemark] = React.useState('');
  // 目标日期默认取叙事今天的一年后
  const base = TimeService.fromTimestamp(APP_TODAY_MS);
  const [y, setY] = React.useState(base.getFullYear() + 1);
  const [m, setM] = React.useState(base.getMonth() + 1); // 1-12
  const [d, setD] = React.useState(base.getDate());
  const [picking, setPicking] = React.useState(false);

  const clampDay = (yy: number, mm: number, dd: number) => Math.min(dd, daysInMonth(yy, mm));
  const bump = (field: 'y' | 'm' | 'd', delta: number) => {
    if (field === 'y') { const ny = Math.max(base.getFullYear(), y + delta); setY(ny); setD(clampDay(ny, m, d)); }
    else if (field === 'm') { let nm = m + delta; if (nm < 1) nm = 12; if (nm > 12) nm = 1; setM(nm); setD(clampDay(y, nm, d)); }
    else { const dim = daysInMonth(y, m); let nd = d + delta; if (nd < 1) nd = dim; if (nd > dim) nd = 1; setD(nd); }
  };

  const commit = () => {
    s.addFuture({ name, remark, targetDate: TimeService.fromLocalParts(y, m - 1, d).getTime() });
    back();
  };

  const Stepper = ({ label, field }: { label: string; field: 'y' | 'm' | 'd' }) => (
    <div className="flex flex-col items-center">
      <button onClick={() => bump(field, 1)} className="px-3 py-1 text-[#4A90D9]">▲</button>
      <span className="py-1 text-lg font-semibold tabular-nums">{label}</span>
      <button onClick={() => bump(field, -1)} className="px-3 py-1 text-[#4A90D9]">▼</button>
    </div>
  );

  return (
    <div className="relative flex h-full flex-col items-center justify-center bg-black/40" data-status-bar-foreground="light">
      <div {...bindBack()} className="absolute inset-0" />
      <div className="relative z-10 mx-6 w-full max-w-[340px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 text-center text-lg font-bold">添加未来倒计时</div>
        <input {...action('future.add.name.input', () => {}, { params: { value: name } })}
          value={name} onChange={(e) => setName(e.target.value)}
          placeholder='名称,如"考试"' className="mb-3 w-full rounded-lg bg-[#F1F3F5] px-3 py-2.5 text-sm outline-none" />
        <input {...action('future.add.remark.input', () => {}, { params: { value: remark } })}
          value={remark} onChange={(e) => setRemark(e.target.value)}
          placeholder='备注,如"考上心仪的学校"' className="mb-3 w-full rounded-lg bg-[#F1F3F5] px-3 py-2.5 text-sm outline-none" />
        <button {...action('future.add.date.action', () => setPicking((v) => !v))}
          className="mb-3 flex w-full items-center justify-center rounded-lg bg-[#F7F8FA] py-4 text-base font-semibold text-[#333]">
          {y} / {pad(m)} / {pad(d)} <span className="ml-1 text-[#8A8F99]">{picking ? '▴' : '▾'}</span>
        </button>
        {picking && (
          <div className="mb-4 flex items-center justify-center gap-4 rounded-lg bg-[#F7F8FA] py-2">
            <Stepper label={String(y)} field="y" /><span className="text-[#C8CDD4]">/</span>
            <Stepper label={pad(m)} field="m" /><span className="text-[#C8CDD4]">/</span>
            <Stepper label={pad(d)} field="d" />
          </div>
        )}
        <div className="flex gap-3">
          <button {...bindBack()} className="flex-1 rounded-full bg-[#F1F3F5] py-2.5 text-sm">取消</button>
          <button {...action('future.add.commit.action', commit)} className="flex-1 rounded-full bg-[#4A90D9] py-2.5 text-sm text-white">确认添加</button>
        </div>
      </div>
    </div>
  );
}
