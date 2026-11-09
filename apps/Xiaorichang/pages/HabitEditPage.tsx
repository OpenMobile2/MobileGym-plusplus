import React, { useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors, HABIT_COLORS } from '../res/colors';
import { IconRenderer, IcRight } from '../res/icons';
import { MissingContent, PageHeader, Switch, SettingRow } from '../components/common';
import type { Habit, HabitContext, Recurrence, Reminder } from '../types';

const MOTIVATIONS = ['每天进步一点点', '坚持就是胜利', '为了更好的自己', '现在开始也不晚', '小步快跑,不要停'];
type RecMode = 'weeklyFixed' | 'weeklyCount' | 'monthlyFixed' | 'monthlyCount';

export interface HabitFormDraft {
  sessionKey: string;
  ownerId: string;
  name: string;
  iconStyle: 'graphic' | 'text';
  iconText: string;
  iconTextColor: string;
  icon: string;
  color: string;
  needFocus: boolean;
  contextName: string;
  quant: boolean;
  recMode: RecMode;
  weekdays: number[];
  periodCount: number;
  monthDay: number;
  reward: number;
  motivation: string;
  oneTap: boolean;
  reminders: Reminder[];
}

function initialForm(sessionKey: string, ownerId: string, editing: Habit | undefined, contexts: HabitContext[], contextId: string | null): HabitFormDraft {
  const recurrence = editing?.recurrence;
  const recMode: RecMode = recurrence?.kind === 'weeklyCount' ? 'weeklyCount'
    : recurrence?.kind === 'monthlyCount' ? 'monthlyCount'
      : recurrence?.kind === 'monthly' ? 'monthlyFixed' : 'weeklyFixed';
  return {
    sessionKey,
    ownerId,
    name: editing?.name ?? '',
    iconStyle: editing?.iconStyle ?? 'graphic',
    iconText: editing?.iconText ?? '',
    iconTextColor: editing?.color ?? HABIT_COLORS[0],
    icon: editing?.icon ?? 'IcCheck',
    color: editing?.color ?? HABIT_COLORS[0],
    needFocus: editing?.focusRequired ?? false,
    contextName: contexts.find((c) => c.id === (editing?.contextId ?? contextId))?.name ?? '晨间',
    quant: editing?.quantify?.enabled ?? false,
    recMode,
    weekdays: recurrence?.kind === 'weekly' ? recurrence.weekdays : [1, 2, 3, 4, 5, 6, 7],
    periodCount: recurrence?.kind === 'weeklyCount' || recurrence?.kind === 'monthlyCount' ? recurrence.count : 3,
    monthDay: recurrence?.kind === 'monthly' ? recurrence.days[0] ?? 1 : 1,
    reward: editing?.reward ?? 10,
    motivation: editing?.motivation ?? '',
    oneTap: editing?.oneTap ?? true,
    reminders: editing?.reminders ?? [],
  };
}

/**
 * 新建/编辑打卡(s162-s165)。
 * 真机情境是固定七档(起床/晨间/中午/午间/晚间/睡前/全天)+ 自定义;
 * 种子 contexts 与七档并存:选中七档时若 contexts 里没有会即时创建。
 */
export default function HabitEditPage() {
  const [sp] = useSearchParams();
  const location = useLocation();
  const habitId = sp.get('habitId');
  const st = useXiaorichangStore();
  const editing = st.habits.find((h) => h.id === habitId);
  const { bindTap, action, back } = useXiaorichangGestures();
  const s = useStrings();
  const ownerId = editing?.id ?? 'new';
  const storedForm = (st._temp.draft as { habitForm?: HabitFormDraft } | null)?.habitForm;
  const validStoredForm = storedForm?.sessionKey === location.key && storedForm.ownerId === ownerId;
  const form = validStoredForm ? storedForm : initialForm(location.key, ownerId, editing, st.contexts, sp.get('contextId'));
  const updateForm = (patch: Partial<HabitFormDraft>) => st.setDraft({ habitForm: { ...form, ...patch } });

  useEffect(() => {
    if (habitId && !editing) return;
    if (!validStoredForm) st.setDraft({ habitForm: form });
  }, [editing, form, habitId, st, validStoredForm]);

  if (habitId && !editing) return <MissingContent />;

  const { name, iconStyle, iconText, iconTextColor, needFocus, contextName, quant, recMode,
    weekdays, periodCount, monthDay, reward, motivation, oneTap, icon, color, reminders } = form;

  const toggleWeekday = (w: number) =>
    updateForm({ weekdays: weekdays.includes(w) ? weekdays.filter((x) => x !== w) : [...weekdays, w] });
  const toggleGroup = (group: string) => {
    const ws = group === 'workday' ? [1, 2, 3, 4, 5] : [6, 7];
    const allOn = ws.every((w) => weekdays.includes(w));
    updateForm({ weekdays: allOn ? weekdays.filter((w) => !ws.includes(w)) : Array.from(new Set([...weekdays, ...ws])) });
  };

  const commit = () => {
    const recurrence: Recurrence = recMode === 'weeklyFixed' ? { kind: 'weekly', weekdays: [...weekdays].sort() }
      : recMode === 'weeklyCount' ? { kind: 'weeklyCount', count: Math.min(7, Math.max(1, periodCount)) }
        : recMode === 'monthlyCount' ? { kind: 'monthlyCount', count: Math.min(31, Math.max(1, periodCount)) }
          : { kind: 'monthly', days: [Math.min(31, Math.max(1, monthDay))] };
    const contextId = st.contexts.find((c) => c.name === contextName)?.id ?? st.addContext(contextName);
    const patch = {
      name, icon, color: iconStyle === 'text' ? iconTextColor : color, contextId, reward,
      recurrence, focusRequired: needFocus, oneTap, iconStyle,
      iconText: iconStyle === 'text' ? iconText : undefined,
      motivation: motivation || undefined,
      quantify: quant ? { enabled: true, unit: '次', target: 1 } : undefined, reminders,
    };
    if (editing) st.updateHabit(editing.id, patch); else st.addHabit(patch);
    st.setDraft(null);
    back();
  };

  const CtxChip = ({ id, label, bind }: { id: string; label: string; bind: Record<string, any> }) => {
    void id;
    return (
      <button {...bind} className="rounded-full px-3 py-1.5 text-[13px]"
        style={contextName === label ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5', color: '#424242' }}>
        {label}
      </button>
    );
  };
  const RewardChip = ({ n, bind }: { n: number; bind: Record<string, any> }) => (
    <button {...bind} className="h-9 w-9 rounded-full text-[13px]"
      style={reward === n ? { background: colors.brand, color: '#5B4718', fontWeight: 700 } : { background: '#F2F3F5', color: '#424242' }}>
      {n}
    </button>
  );
  const RecChip = ({ k, label, bind }: { k: RecMode; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="rounded-full px-3 py-1.5 text-[13px]"
      style={recMode === k ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5', color: '#424242' }}>
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={editing ? s.habitEdit : s.habitNew}
        right={<button {...action('habit.create.commit', commit)}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          {editing ? s.save : '创建打卡'}
        </button>} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 名称 */}
        <div className="rounded-2xl bg-white p-4">
          <input
            {...action('habit.create.name.input', () => {}, { params: { value: name } })}
            value={name} onChange={(e) => updateForm({ name: e.target.value })} placeholder={s.habitName}
            className="w-full bg-transparent text-base outline-none" />
        </div>

        {/* 图标 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-[#424242]">{s.habitIcon}</div>
          <div className="flex items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl"
              style={{ background: iconStyle === 'text' ? iconTextColor : color, color: '#fff' }}>
              {iconStyle === 'text' && iconText ? <span className="text-xl">{iconText}</span> : <IconRenderer name={icon} size={24} />}
            </span>
            <div className="flex gap-2">
              <button {...action('habit.create.iconstyle.select.graphic', () => updateForm({ iconStyle: 'graphic' }))}
                className="rounded-full px-3 py-1.5 text-[13px]"
                style={iconStyle === 'graphic' ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5' }}>图形</button>
              <button {...action('habit.create.iconstyle.select.text', () => updateForm({ iconStyle: 'text' }))}
                className="rounded-full px-3 py-1.5 text-[13px]"
                style={iconStyle === 'text' ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5' }}>文字</button>
              <button {...action('habit.create.iconstyle.select.album', () => {
                void import('@/os/albumBridge').then(({ pickImages }) =>
                  pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                    if (r.cancelled || !r.selected.length) return;
                    const selected = r.selected[0];
                    const image = selected.path || selected.uri;
                    if (!image) return;
                    updateForm({ iconStyle: 'graphic', icon: image });
                    st.showToast('已从系统相册选择图标');
                  }),
                );
              })}
                className="rounded-full bg-[#F2F3F5] px-3 py-1.5 text-[13px] text-[#424242]">相册</button>
            </div>
          </div>
          {iconStyle === 'graphic' ? (
            <button {...bindTap('habit.create.iconpicker.open')}
              className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#424242]">
              从图标库选择 <IcRight size={16} />
            </button>
          ) : (
            <div className="mt-3">
              <input
                {...action('habit.create.icontext.input', () => {}, { params: { value: iconText } })}
                value={iconText} maxLength={2} onChange={(e) => updateForm({ iconText: e.target.value })}
                placeholder="文字 / emoji" className="w-full rounded-xl bg-[#F8F8F8] px-3 py-2.5 text-sm outline-none" />
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {HABIT_COLORS.map((c) => (
                  <button key={c} {...action('habit.create.icontext.color', () => updateForm({ iconTextColor: c }))}
                    className="h-7 w-7 shrink-0 rounded-full"
                    style={{ background: c, outline: iconTextColor === c ? `2px solid ${colors.inkStrong}` : 'none', outlineOffset: 2 }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 番茄钟 / 提醒 */}
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <SettingRow label={s.habitFocusRequired}>
            <Switch on={needFocus} {...action('habit.create.focus.toggle', () => updateForm({ needFocus: !needFocus }))} />
          </SettingRow>
          <button {...bindTap('habit.create.reminder.open', { params: { habitId: editing?.id ?? 'draft' } })}
            className="flex w-full items-center justify-between px-4 py-3.5 text-sm text-[#424242]">
            添加提醒 <IcRight size={16} className="text-[#C9CDD3]" />
          </button>
        </div>

        {/* 情境(真机固定七档 s162) */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-[#424242]">{s.habitContext}</div>
          <div className="flex flex-wrap gap-2">
            <CtxChip id="wakeup" label="起床" bind={action('habit.create.context.select.wakeup', () => updateForm({ contextName: '起床' }))} />
            <CtxChip id="morning" label="晨间" bind={action('habit.create.context.select.morning', () => updateForm({ contextName: '晨间' }))} />
            <CtxChip id="noon" label="中午" bind={action('habit.create.context.select.noon', () => updateForm({ contextName: '中午' }))} />
            <CtxChip id="afternoon" label="午间" bind={action('habit.create.context.select.afternoon', () => updateForm({ contextName: '午间' }))} />
            <CtxChip id="evening" label="晚间" bind={action('habit.create.context.select.evening', () => updateForm({ contextName: '晚间' }))} />
            <CtxChip id="bedtime" label="睡前" bind={action('habit.create.context.select.bedtime', () => updateForm({ contextName: '睡前' }))} />
            <CtxChip id="allday" label="全天" bind={action('habit.create.context.select.allday', () => updateForm({ contextName: '全天' }))} />
            <button {...bindTap('habit.create.context.manage')}
              className="rounded-full bg-[#F2F3F5] px-3 py-1.5 text-[13px] text-[#9AA5B1]">自定义情境</button>
          </div>
        </div>

        {/* 量化 */}
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <SettingRow label={s.habitQuantify}>
            <Switch on={quant} {...action('habit.create.quant.toggle', () => updateForm({ quant: !quant }))} />
          </SettingRow>
        </div>

        {/* 循环 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-[#424242]">{s.habitRecurrence}</div>
          <div className="flex flex-wrap gap-2">
            <RecChip k="weeklyFixed" label="每周定期" bind={action('habit.create.recurrence.select.weeklyFixed', () => updateForm({ recMode: 'weeklyFixed' }))} />
            <RecChip k="weeklyCount" label="每周N天" bind={action('habit.create.recurrence.select.weeklyCount', () => updateForm({ recMode: 'weeklyCount', periodCount: Math.min(7, periodCount) }))} />
            <RecChip k="monthlyFixed" label="每月定期" bind={action('habit.create.recurrence.select.monthlyFixed', () => updateForm({ recMode: 'monthlyFixed' }))} />
            <RecChip k="monthlyCount" label="每月N天" bind={action('habit.create.recurrence.select.monthlyCount', () => updateForm({ recMode: 'monthlyCount' }))} />
          </div>
          {recMode === 'weeklyFixed' && <div className="mt-3 flex gap-2">
            {(['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const).map((label, i) => {
              const w = i + 1;
              return (
                <button key={w}
                  {...action('habit.create.recurrence.weekday', () => toggleWeekday(w), { params: { weekday: w } })}
                  className="flex h-9 flex-1 items-center justify-center rounded-lg text-xs"
                  style={weekdays.includes(w) ? { background: colors.brandSoft, color: '#5B4718', fontWeight: 600 } : { background: '#F2F3F5', color: '#B9BEC7' }}>
                  {label}
                </button>
              );
            })}
          </div>}
          {recMode === 'weeklyFixed' && <div className="mt-2 flex gap-2 text-xs">
            <button {...action('habit.create.recurrence.weekdayGroup.toggleAll', () => toggleGroup('workday'), { params: { group: 'workday' } })}
              className="rounded-full bg-[#F2F3F5] px-3 py-1 text-[#9AA5B1]">工作日 全选/取消</button>
            <button {...action('habit.create.recurrence.weekdayGroup.toggleAll', () => toggleGroup('weekend'), { params: { group: 'weekend' } })}
              className="rounded-full bg-[#F2F3F5] px-3 py-1 text-[#9AA5B1]">周末 全选/取消</button>
          </div>}
          {(recMode === 'weeklyCount' || recMode === 'monthlyCount') && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#424242]">
              <span>{recMode === 'weeklyCount' ? '每周完成天数' : '每月完成天数'}</span>
              <span className="flex items-center gap-3">
                <button {...action('habit.create.recurrence.count.step', () => updateForm({ periodCount: Math.max(1, periodCount - 1) }))} className="text-lg text-[#9AA5B1]">−</button>
                <b className="w-8 text-center">{periodCount} 天</b>
                <button {...action('habit.create.recurrence.count.step', () => updateForm({ periodCount: Math.min(recMode === 'weeklyCount' ? 7 : 31, periodCount + 1) }))} className="text-lg text-[#9AA5B1]">＋</button>
              </span>
            </div>
          )}
          {recMode === 'monthlyFixed' && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F8F8F8] px-3 py-2.5 text-sm text-[#424242]">
              <span>每月日期</span>
              <span className="flex items-center gap-3">
                <button {...action('habit.create.recurrence.monthday.step', () => updateForm({ monthDay: Math.max(1, monthDay - 1) }))} className="text-lg text-[#9AA5B1]">−</button>
                <b className="w-10 text-center">{monthDay} 日</b>
                <button {...action('habit.create.recurrence.monthday.step', () => updateForm({ monthDay: Math.min(31, monthDay + 1) }))} className="text-lg text-[#9AA5B1]">＋</button>
              </span>
            </div>
          )}
        </div>

        {/* 光芒积分 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-[#424242]">{s.habitReward}</div>
          <div className="flex flex-wrap gap-2">
            <RewardChip n={0} bind={action('habit.create.reward.select.n0', () => updateForm({ reward: 0 }))} />
            <RewardChip n={1} bind={action('habit.create.reward.select.n1', () => updateForm({ reward: 1 }))} />
            <RewardChip n={2} bind={action('habit.create.reward.select.n2', () => updateForm({ reward: 2 }))} />
            <RewardChip n={3} bind={action('habit.create.reward.select.n3', () => updateForm({ reward: 3 }))} />
            <RewardChip n={5} bind={action('habit.create.reward.select.n5', () => updateForm({ reward: 5 }))} />
            <RewardChip n={10} bind={action('habit.create.reward.select.n10', () => updateForm({ reward: 10 }))} />
            <RewardChip n={20} bind={action('habit.create.reward.select.n20', () => updateForm({ reward: 20 }))} />
            <RewardChip n={50} bind={action('habit.create.reward.select.n50', () => updateForm({ reward: 50 }))} />
            <RewardChip n={80} bind={action('habit.create.reward.select.n80', () => updateForm({ reward: 80 }))} />
            <div className="flex items-center gap-2 rounded-full bg-[#F2F3F5] px-2">
              <button {...action('habit.create.reward.step', () => updateForm({ reward: Math.max(0, reward - 1) }))} className="px-1 text-lg text-[#9AA5B1]">−</button>
              <span className="w-7 text-center text-sm font-semibold">{reward}</span>
              <button {...action('habit.create.reward.step', () => updateForm({ reward: Math.min(100, reward + 1) }))} className="px-1 text-lg text-[#9AA5B1]">＋</button>
            </div>
          </div>
        </div>

        {/* 自我激励 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#424242]">自我激励</span>
            <button {...action('habit.create.motivation.random', () => updateForm({ motivation: MOTIVATIONS[(motivation ? MOTIVATIONS.indexOf(motivation) + 1 : 0) % MOTIVATIONS.length] }))}
              className="text-xs text-[#9AA5B1]">随机</button>
          </div>
          <input
            {...action('habit.create.motivation.input', () => {}, { params: { value: motivation } })}
            value={motivation} onChange={(e) => updateForm({ motivation: e.target.value })}
            placeholder="给自己一句鼓励" className="w-full rounded-xl bg-[#F8F8F8] px-3 py-2.5 text-sm outline-none" />
        </div>

        {/* 一键打卡 / 地点 */}
        <div className="mt-3 overflow-hidden rounded-2xl bg-white">
          <SettingRow label="一键打卡" hint="开启后今日页单击图标直接完成;关闭则先弹打卡窗">
            <Switch on={oneTap} {...action('habit.create.onetap.toggle', () => updateForm({ oneTap: !oneTap }))} />
          </SettingRow>
          <SettingRow label="记录打卡地点">
            <Switch on={false} {...action('habit.create.location.wontfixToast', () => st.showNotice(s.notAvailable))} />
          </SettingRow>
        </div>
      </div>
    </div>
  );
}
