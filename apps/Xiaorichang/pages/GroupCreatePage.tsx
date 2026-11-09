import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcRight } from '../res/icons';
import { PageHeader } from '../components/common';

/** 新建习惯组(s214,补拍 B4 发现的完整表单)。 */
export default function GroupCreatePage() {
  const location = useLocation();
  const st = useXiaorichangStore();
  const { bindTap, action, back } = useXiaorichangGestures();
  const s = useStrings();
  const stored = (st._temp.draft as { groupForm?: GroupFormDraft } | null)?.groupForm;
  const validStored = stored?.sessionKey === location.key;
  const form: GroupFormDraft = useMemo(() => validStored ? stored : {
    sessionKey: location.key, name: '', contextName: '晨间', habitIds: [],
  }, [location.key, stored, validStored]);
  const updateForm = (patch: Partial<GroupFormDraft>) => st.setDraft({ groupForm: { ...form, ...patch } });
  useEffect(() => {
    if (!validStored) st.setDraft({ groupForm: form });
  }, [form, st, validStored]);
  const { name, contextName, habitIds } = form;

  const Chip = ({ label, bind }: { label: string; bind: Record<string, any> }) => (
    <button {...bind} className="rounded-full px-3 py-1.5 text-[13px]"
      style={contextName === label ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5', color: '#424242' }}>
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.habitGroupNew}
        right={<button {...action('habits.group.commit', () => {
          const contextId = st.contexts.find((c) => c.name === contextName)?.id ?? st.addContext(contextName);
          st.addGroup(name, habitIds, contextId);
          st.setDraft({ groupForm: undefined });
          back();
        })}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          完成
        </button>} />
      <div className="px-4">
        <button {...action('habits.group.help.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="w-full rounded-2xl bg-[#FFF5D5] px-4 py-2.5 text-left text-xs text-[#8A6A1E]">什么是习惯组? ›</button>
        <div className="mt-3 rounded-2xl bg-white p-4">
          <input
            {...action('habits.group.name.input', () => {}, { params: { value: name } })}
            value={name} onChange={(e) => updateForm({ name: e.target.value })} placeholder="习惯组名称"
            className="w-full bg-transparent text-base outline-none" />
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="mb-2 text-sm font-semibold text-[#424242]">时段</div>
          <div className="flex flex-wrap gap-2">
            <Chip label="起床" bind={action('habits.group.context.select.wakeup', () => updateForm({ contextName: '起床' }))} />
            <Chip label="晨间" bind={action('habits.group.context.select.morning', () => updateForm({ contextName: '晨间' }))} />
            <Chip label="中午" bind={action('habits.group.context.select.noon', () => updateForm({ contextName: '中午' }))} />
            <Chip label="午间" bind={action('habits.group.context.select.afternoon', () => updateForm({ contextName: '午间' }))} />
            <Chip label="晚间" bind={action('habits.group.context.select.evening', () => updateForm({ contextName: '晚间' }))} />
            <Chip label="睡前" bind={action('habits.group.context.select.bedtime', () => updateForm({ contextName: '睡前' }))} />
            <Chip label="全天" bind={action('habits.group.context.select.allday', () => updateForm({ contextName: '全天' }))} />
          </div>
        </div>
        <button {...bindTap('habits.group.pickHabits')}
          className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 text-sm text-[#424242]">
          <span>选择习惯{habitIds.length > 0 ? ` · 已选择 ${habitIds.length} 个` : ''}</span><IcRight size={16} className="text-[#C9CDD3]" />
        </button>
        {habitIds.length > 0 && <div className="mt-2 rounded-xl bg-[#FFF9E8] px-3 py-2 text-xs text-[#8A6A1E]">
          {st.habits.filter((h) => habitIds.includes(h.id)).map((h) => h.name).join('、')}
        </div>}
      </div>
    </div>
  );
}

export interface GroupFormDraft {
  sessionKey: string;
  name: string;
  contextName: string;
  habitIds: string[];
}
