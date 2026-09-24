import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcBell, IcClock, IcMusicNote } from '../res/icons';
import { MissingContent } from '../components/common';
import type { HabitFormDraft } from './HabitEditPage';

/** 提示音(s245)。无音频资产,不实际发声。 */
const SOUNDS = [
  { id: 'short_guitar', name: 'Short Guitar' },
  { id: 'moving_on_bell', name: 'Moving On Bell' },
  { id: 'deep_electric_piano', name: 'Deep Electric Piano' },
  { id: 'shining_star_electric_piano', name: 'Shining Star Electric Piano' },
  { id: 'twilight', name: 'Twilight' },
];

/** 添加提醒弹层(Gate4 补拍 s245)。 */
export default function ReminderAddPage() {
  const [sp] = useSearchParams();
  const habitId = sp.get('habitId') ?? '';
  const st = useXiaorichangStore();
  const { action, bindBack, back } = useXiaorichangGestures();
  const s = useStrings();
  const now = TimeService.getDate();
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());
  const [repeat, setRepeat] = useState<'daily' | 'workday' | 'weekend' | 'custom'>('daily');
  const [sound, setSound] = useState('moving_on_bell');
  const habitForm = (st._temp.draft as { habitForm?: HabitFormDraft } | null)?.habitForm;
  const targetHabit = st.habits.find((h) => h.id === habitId);
  const validTarget = habitId === 'draft' ? Boolean(habitForm) : Boolean(targetHabit);
  const purchasePremium = () => {
    const launched = window.__OS__?.startActivityForResult?.(
      {
        action: 'ACTION_PAY',
        scheme: 'alipays',
        data: {
          amount: 18,
          orderId: `xiaorichang-vip-${TimeService.now()}`,
          merchantName: s.paymentMerchant,
          subject: s.paymentPremiumSubject,
          source: 'xiaorichang',
        },
      },
      (result) => {
        if (result.resultCode !== 'OK') return;
        st.updateUser({ vip: true });
        st.showNotice(`${s.paymentSuccess}当前环境暂不支持强提醒，请使用软提醒。`);
      },
    );
    if (!launched) st.showNotice(s.notAvailable);
  };

  if (!validTarget) return <MissingContent />;

  const RepeatChip = ({ k, label, bind }: { k: typeof repeat; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="flex-1 rounded-full py-2 text-[13px]"
      style={repeat === k ? { background: colors.inkStrong, color: '#fff' } : { background: '#fff', color: '#424242', border: '1px solid #EEE' }}>
      {label}
    </button>
  );
  const Wheel = ({ value, max, onPick, bind }: { value: number; max: number; onPick: (n: number) => void; bind: Record<string, any> }) => (
    <select {...bind} value={value} onChange={(e) => onPick(Number(e.target.value))} size={3}
      className="rounded-2xl bg-transparent text-center text-2xl font-semibold text-[#212121] outline-none">
      {Array.from({ length: max }, (_, i) => <option key={i} value={i}>{`${i}`.padStart(2, '0')}</option>)}
    </select>
  );

  return (
    <div className="relative flex h-full flex-col bg-[#F5F6F7]" data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center justify-between px-4 pb-3 pt-10">
        <button {...bindBack()} className="rounded-full bg-white px-4 py-2 text-sm text-[#9AA5B1] shadow-sm">{s.cancel}</button>
        <div className="text-base font-bold text-[#212121]">添加提醒</div>
        <button
          {...action('reminder.add.commit', () => {
            const reminder = {
              id: `rm_${TimeService.now()}_${habitId}`,
              mode: 'soft',
              time: `${`${hour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')}`,
              repeat, sound,
            } as const;
            if (habitId === 'draft') {
              if (!habitForm) { st.showNotice(s.contentMissing); return; }
              st.setDraft({ habitForm: {
                ...habitForm,
                reminders: [...habitForm.reminders, reminder],
              } });
            } else {
              if (!targetHabit) { st.showNotice(s.contentMissing); return; }
              const reminders = [...(targetHabit.reminders ?? []), reminder];
              st.updateHabit(habitId, { reminders });
              // 编辑页在跨路由期间保留表单草稿；同步它，避免返回后“保存”用旧列表
              // 把刚新增的提醒覆盖掉。
              if (habitForm?.ownerId === habitId) {
                st.setDraft({ habitForm: { ...habitForm, reminders } });
              }
            }
            back();
          })}
          className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm" style={{ color: colors.brand }}>
          {s.confirm}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 提醒方式 */}
        <div className="text-sm text-[#9AA5B1]">提醒方式</div>
        <div className="mt-2 flex gap-3 rounded-2xl bg-white p-3">
          <button {...action('reminder.mode.select.soft', () => {})}
            className="flex-1 rounded-2xl p-3 text-left"
            style={{ background: colors.brandWash, border: `1.5px solid ${colors.brand}` }}>
            <div className="flex items-center justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-full" style={{ background: colors.brand, color: '#fff' }}>
                <IcBell size={16} />
              </span>
              <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-white" style={{ background: colors.brand }}>✓</span>
            </div>
            <div className="mt-2 text-sm font-semibold text-[#212121]">软提醒</div>
            <div className="text-xs text-[#9AA5B1]">通过通知提醒你</div>
          </button>
          {/* 强提醒仍需闹钟能力；高级会员入口先走系统支付，支付成功后记录会员状态。 */}
          <button {...action('reminder.mode.strong.pay', purchasePremium)}
            className="flex-1 rounded-2xl bg-[#F8F8F8] p-3 text-left">
            <div className="flex items-center justify-between">
              <IcClock size={20} className="text-[#C9CDD3]" />
              <span className="h-5 w-5 rounded-full border-2 border-[#DDD]" />
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm font-semibold text-[#9AA5B1]">
              强提醒
              <span className="rounded px-1 py-0.5 text-[9px]" style={{ background: colors.brandSoft, color: '#8A6A1E' }}>高级功能</span>
            </div>
            <div className="text-xs text-[#C9CDD3]">使用闹钟方式提醒,更不容易错过</div>
          </button>
        </div>

        {/* 提醒时间 */}
        <div className="mt-4 text-sm text-[#9AA5B1]">提醒时间</div>
        <div className="mt-2 flex justify-center gap-8 rounded-2xl bg-white py-3">
          <Wheel value={hour} max={24} onPick={setHour}
            bind={action('reminder.time.hour', () => {}, { params: { value: hour } })} />
          <Wheel value={minute} max={60} onPick={setMinute}
            bind={action('reminder.time.minute', () => {}, { params: { value: minute } })} />
        </div>
        <div className="mt-2 flex gap-2">
          {['06:00', '08:00', '12:00', '21:00'].map((time) => (
            <button key={time}
              {...action('reminder.time.quick.select', () => {
                const [nextHour, nextMinute] = time.split(':').map(Number);
                setHour(nextHour);
                setMinute(nextMinute);
              }, { params: { time } })}
              className="flex-1 rounded-full bg-white py-2 text-xs font-semibold text-[#424242]">
              {time}
            </button>
          ))}
        </div>

        {/* 重复周期 */}
        <div className="mt-4 text-sm text-[#9AA5B1]">重复周期</div>
        <div className="mt-2 flex gap-2 rounded-2xl bg-white p-2">
          <RepeatChip k="daily" label="每天" bind={action('reminder.repeat.select.daily', () => setRepeat('daily'))} />
          <RepeatChip k="workday" label="工作日" bind={action('reminder.repeat.select.workday', () => setRepeat('workday'))} />
          <RepeatChip k="weekend" label="周末" bind={action('reminder.repeat.select.weekend', () => setRepeat('weekend'))} />
          <RepeatChip k="custom" label="自定义" bind={action('reminder.repeat.select.custom', () => setRepeat('custom'))} />
        </div>

        {/* 提示音 */}
        <div className="mt-4 text-sm text-[#9AA5B1]">提示音</div>
        <div className="mt-2 overflow-hidden rounded-2xl bg-white">
          {SOUNDS.map((snd) => {
            const on = sound === snd.id;
            return (
              <button key={snd.id}
                {...action('reminder.sound.pick', () => setSound(snd.id), { params: { soundId: snd.id } })}
                className="flex w-full items-center gap-3 border-b border-[#F5F5F5] px-3 py-3 text-left"
                style={on ? { background: colors.brandWash } : undefined}>
                <span className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={on ? { background: colors.brandSoft, color: '#8A6A1E' } : { background: '#F2F3F5', color: '#9AA5B1' }}>
                  <IcMusicNote size={14} />
                </span>
                <span className="flex-1 text-sm text-[#424242]">{snd.name}</span>
                {on && <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-white" style={{ background: colors.brand }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
