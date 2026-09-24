import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcSun, IcFlag, IcSend } from '../res/icons';
import { tsAt } from '../utils/appTime';

const FLAGS = { gray: '#9AA5B1', green: '#7FB685', blue: '#6BAED6', red: '#D97A7A' } as const;

/** 小事快捷输入(s168)。🌞 光芒值仅 UI 展示 —— Q11:小事不进光芒值体系。 */
export default function TodoQuickAddPage() {
  const st = useXiaorichangStore();
  const { action, bindBack, back } = useXiaorichangGestures();
  const s = useStrings();
  const [title, setTitle] = useState('');
  const [reward, setReward] = useState(0);
  const [flag, setFlag] = useState<keyof typeof FLAGS>('gray');
  const [due, setDue] = useState<'today' | 'tomorrow' | 'custom'>('today');

  const commit = () => {
    if (!title.trim()) return;
    const now = TimeService.now();
    st.addTodo(title, {
      reward: reward || undefined, flag,
      dueAt: due === 'today' ? now : due === 'tomorrow' ? tsAt(1, 720) : undefined,
      createdAt: now,
    });
    back();
  };

  const FlagBtn = ({ k, bind }: { k: keyof typeof FLAGS; bind: Record<string, any> }) => (
    <button {...bind} aria-label={`旗标${k}`}
      className="flex h-8 w-8 items-center justify-center rounded-full"
      style={{ background: flag === k ? '#F2F3F5' : 'transparent' }}>
      <IcFlag size={16} color={FLAGS[k]} fill={flag === k ? FLAGS[k] : 'none'} />
    </button>
  );
  const DueChip = ({ k, label, bind }: { k: typeof due; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="rounded-full px-3 py-1 text-xs"
      style={due === k ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5', color: '#9AA5B1' }}>
      {label}
    </button>
  );

  return (
    <div className="relative flex h-full flex-col justify-end bg-black/40">
      {/* Gate4 修复:此前遮罩没绑返回,进来就出不去(铁律①:可见即可点) */}
      <div {...bindBack()} className="absolute inset-0" />
      <div className="relative rounded-t-3xl bg-white p-4 pb-8" data-keep-keyboard="true">
        <div className="mb-2 flex justify-end">
          <button {...bindBack()} className="text-xs text-[#9AA5B1]">取消</button>
        </div>
        <div className="flex items-center gap-2">
          <input autoFocus
            {...action('todo.quick.title.input', () => {}, { params: { value: title } })}
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="非循环的一次性待办事项"
            className="min-w-0 flex-1 rounded-xl bg-[#F5F6F7] px-3 py-2.5 text-sm outline-none" />
          <button {...action('todo.quick.commit', commit)} aria-label="发送"
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#5B4718]"
            style={{ background: colors.brand }}>
            <IcSend size={17} />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button {...action('todo.quick.reward.set', () => setReward((r) => (r + 5) % 55))}
            className="flex items-center gap-1 rounded-full bg-[#F5F6F7] px-2.5 py-1 text-xs text-[#9AA5B1]">
            <IcSun size={13} color={colors.vip} /> {reward}
          </button>
          <FlagBtn k="gray" bind={action('todo.quick.flag.select.gray', () => setFlag('gray'))} />
          <FlagBtn k="green" bind={action('todo.quick.flag.select.green', () => setFlag('green'))} />
          <FlagBtn k="blue" bind={action('todo.quick.flag.select.blue', () => setFlag('blue'))} />
          <FlagBtn k="red" bind={action('todo.quick.flag.select.red', () => setFlag('red'))} />
          <div className="ml-auto flex gap-1.5">
            <DueChip k="today" label="今天" bind={action('todo.quick.due.select.today', () => setDue('today'))} />
            <DueChip k="tomorrow" label="明天" bind={action('todo.quick.due.select.tomorrow', () => setDue('tomorrow'))} />
            <DueChip k="custom" label="其它" bind={action('todo.quick.due.select.custom', () => st.showNotice(s.notAvailable))} />
          </div>
        </div>
      </div>
    </div>
  );
}
