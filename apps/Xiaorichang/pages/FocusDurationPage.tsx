import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcTrash, IcTomato } from '../res/icons';

/** 默认项的色块(s243:列表里的配色与番茄主页圆环不同,单独一套) */
const DEFAULT_ROWS = [
  { key: '正', label: '正计时', bg: '#CFE8CF' },
  { key: '25', label: '25 mins', bg: '#CFE8CF' },
  { key: '45', label: '45 mins', bg: '#E5C0B8' },
  { key: '60', label: '60 mins', bg: '#BFD8E4' },
  { key: '90', label: '90 mins', bg: '#E4E2B0' },
];

/** 自定义时长(Gate4 订正 s243:是「管理番茄钟时长选项」列表页,默认项带锁不可删)。 */
export default function FocusDurationPage() {
  const st = useXiaorichangStore();
  const { action, bindBack, back } = useXiaorichangGestures();
  const s = useStrings();
  const [minutes, setMinutes] = useState('');

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]" data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-10">
        <button {...bindBack()} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#212121] shadow-sm">
          关闭
        </button>
        <div className="text-base font-bold text-[#212121]">{s.focusCustomDuration}</div>
        <button {...action('focus.custom.commit', () => back())}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#212121] shadow-sm">
          完成
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-start gap-3 px-1">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EDEEF0] text-[#9AA5B1]">
            <IcTomato size={18} />
          </span>
          <div>
            <div className="text-base font-bold text-[#424242]">管理番茄钟时长选项</div>
            <div className="mt-0.5 text-xs text-[#9AA5B1]">默认选项无法删除,您可以添加或删除自定义的时长选项。</div>
          </div>
        </div>

        <div className="mt-4 flex items-center rounded-2xl bg-white px-4 py-1">
          <input type="number"
            {...action('focus.custom.minutes.input', () => {}, { params: { value: minutes } })}
            value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="输入分钟数"
            className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none placeholder:text-[#C9CDD3]" />
          <button
            {...action('focus.custom.add', () => {
              const m = Number(minutes);
              if (m >= 1 && m <= 600) { st.addCustomDuration(m); setMinutes(''); }
            })}
            aria-label="添加"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C9CDD3] text-xl text-white">＋</button>
        </div>

        <div className="mt-5 px-1 text-xs text-[#9AA5B1]">已添加的番茄钟</div>
        <div className="mt-2 overflow-hidden rounded-2xl bg-white">
          {DEFAULT_ROWS.map((r) => (
            <div key={r.key} className="flex items-center gap-3 border-b border-[#F5F5F5] px-3 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold text-[#424242]"
                style={{ background: r.bg }}>{r.key}</span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-[#212121]">{r.label}</span>
                <span className="text-xs text-[#9AA5B1]">默认选项</span>
              </span>
              {/* 默认项不可删 —— 显示锁,且不打交互标(只给真正做事的控件打标) */}
              <span className="pr-1 text-lg text-[#D5D8DC]" aria-label="不可删除">🔒</span>
            </div>
          ))}
          {st.settings.customDurations.map((m) => (
            <div key={m} className="flex items-center gap-3 border-b border-[#F5F5F5] px-3 py-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl text-base font-bold text-[#5B4718]"
                style={{ background: colors.brandSoft }}>{m}</span>
              <span className="flex-1">
                <span className="block text-base font-semibold text-[#212121]">{m} mins</span>
                <span className="text-xs text-[#9AA5B1]">自定义</span>
              </span>
              <button
                {...action('focus.custom.remove', () => st.removeCustomDuration(m), { params: { durationId: String(m) } })}
                className="pr-1 text-[#C9CDD3]" aria-label="删除"><IcTrash size={17} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
