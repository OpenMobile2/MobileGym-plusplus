/** 历史经期补录全屏表单。spec: record.periodForm */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, IconCheckWrap } from '../components/formBits';
import { FLOW_OPTIONS, COLOR_OPTIONS, PAIN_OPTIONS } from '../constants';
import { fmtDate } from '../utils/cycle';

const TIMES = ['06:00', '08:00', '10:00', '12:00', '18:00', '20:00', '22:00'];

export default function PeriodFormPage() {
  const { bindTap, bindBack, back } = useMeiyouGestures();
  const [sp] = useSearchParams();
  const date = sp.get('date') ?? fmtDate(TimeService.now());
  const confirmPeriodStart = useMeiyouStore((s) => s.confirmPeriodStart);

  const [flow, setFlow] = React.useState('');
  const [color, setColor] = React.useState('');
  const [pain, setPain] = React.useState('');
  const [time, setTime] = React.useState('');

  const [, m, d] = date.split('-');
  const title = `${Number(m)}月${Number(d)}日经期记录`;

  const group = (label: string, opts: readonly string[], val: string, set: (v: string) => void) => (
    <div className="bg-white rounded-xl mt-3 p-3">
      <div className="text-[14px] font-medium text-[#1A1A1A] mb-2">{label}</div>
      <div className="grid grid-cols-5 gap-2">
        {opts.map((o) => (
          <button
            key={o}
            {...bindTap({ kind: 'action', id: 'periodform.option.select.target' }, { params: { target: `${label}:${o}` }, onTrigger: () => set(o) })}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <IconCheckWrap active={val === o}>{o.slice(0, 2)}</IconCheckWrap>
            <span className="text-[10px]" style={{ color: val === o ? MY.primary : '#999' }}>{o}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F2F2F4]">
      <div className="flex items-center justify-between h-11 px-4 bg-white shrink-0">
        <button {...bindBack()} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
        <div className="text-[15px] font-semibold text-[#1A1A1A]">{title}</div>
        <button
          {...bindTap({ kind: 'action', id: 'periodform.record.confirm' }, {
            onTrigger: () => { confirmPeriodStart(date, { flow: flow || undefined, color: color || undefined, pain: pain || undefined, startTime: time || undefined }); back(); },
          })}
          className="text-[14px] font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: MY.primary }}
        >
          确定
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {group('流量', FLOW_OPTIONS, flow, setFlow)}
        {group('颜色', COLOR_OPTIONS, color, setColor)}
        {group('痛经', PAIN_OPTIONS, pain, setPain)}
        <div className="bg-white rounded-xl mt-3 p-3">
          <div className="text-[14px] font-medium text-[#1A1A1A] mb-2">开始时间</div>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'periodform.time.select.target' }, { params: { target: t }, onTrigger: () => setTime(t) })}
                className="px-3 h-8 rounded-full text-[13px] border cursor-pointer"
                style={time === t ? { background: MY.primary, color: '#fff', borderColor: MY.primary } : { background: '#fff', color: '#666', borderColor: '#DDD' }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
