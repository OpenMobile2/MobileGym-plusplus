import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors, HABIT_COLORS } from '../res/colors';
import { IconRenderer } from '../res/icons';
import { MissingContent, PageHeader } from '../components/common';
import type { HabitFormDraft } from './HabitEditPage';

/** 图标库(s166)。分类五档,『小动物 VIP』通过系统收银台开通会员。 */
const CATEGORIES: Record<string, string[]> = {
  daily: ['IcSunrise', 'IcDroplet', 'IcBook', 'IcBookOpen', 'IcCoffee', 'IcMeal', 'IcMoon', 'IcPen', 'IcClock', 'IcSun', 'IcCalendar', 'IcCard'],
  sport: ['IcRun', 'IcBike', 'IcDumbbell', 'IcWind', 'IcHeart', 'IcFlag', 'IcTomato', 'IcStar'],
  mind: ['IcBrain', 'IcSmile', 'IcLeaf', 'IcMusicNote', 'IcMessage', 'IcSparkles'],
  pet: ['IcCat', 'IcDog'],
};

export default function IconPickerPage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const habitForm = (st._temp.draft as { habitForm?: HabitFormDraft } | null)?.habitForm;
  const [cat, setCat] = useState('daily');
  const [color, setColor] = useState(habitForm?.color ?? HABIT_COLORS[0]);
  const [icon, setIcon] = useState(habitForm?.icon ?? 'IcSunrise');
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
        st.showToast(s.paymentSuccess);
      },
    );
    if (!launched) st.showNotice(s.notAvailable);
  };

  if (!habitForm) return <MissingContent />;

  const CatChip = ({ k, label, bind }: { k: string; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="shrink-0 rounded-full px-3 py-1.5 text-[13px]"
      style={cat === k ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5', color: '#424242' }}>
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.habitIcon}
        right={<button
          {...action('habit.icon.commit', () => {
            if (habitForm) st.setDraft({ habitForm: { ...habitForm, icon, color } });
            back();
          })}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          完成
        </button>} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 14 色 + 自定义(色值为 inferred,U1) */}
        <div className="rounded-2xl bg-white p-4">
          <div className="flex flex-wrap gap-2.5">
            {HABIT_COLORS.map((c, i) => (
              <button key={c}
                {...action('habit.icon.color.pick', () => setColor(c), { params: { colorIndex: i } })}
                className="h-8 w-8 rounded-full"
                style={{ background: c, outline: color === c ? `2px solid ${colors.inkStrong}` : 'none', outlineOffset: 2 }} />
            ))}
            <button {...action('habit.icon.color.custom', () => st.showNotice(s.notAvailable))}
              className="h-8 w-8 rounded-full border-2 border-dashed border-[#C9CDD3] text-xs text-[#9AA5B1]">+</button>
          </div>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          <CatChip k="daily" label="日常活动" bind={action('habit.icon.category.select.daily', () => setCat('daily'))} />
          <CatChip k="sport" label="运动健美" bind={action('habit.icon.category.select.sport', () => setCat('sport'))} />
          <CatChip k="mind" label="精神角落" bind={action('habit.icon.category.select.mind', () => setCat('mind'))} />
          <CatChip k="animalVip" label="小动物 VIP" bind={action('habit.icon.category.select.animalVip', () => { setCat('animalVip'); })} />
          <CatChip k="pet" label="宠物" bind={action('habit.icon.category.select.pet', () => setCat('pet'))} />
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4">
          {cat === 'animalVip' ? (
            <button {...action('habit.icon.category.vip.pay', purchasePremium)}
              className="w-full rounded-xl bg-[#FFF5D5] py-6 text-center text-sm text-[#B78A2F]">
              {s.premiumIconsCta}
            </button>
          ) : (
            <div className="grid grid-cols-6 gap-3">
              {(CATEGORIES[cat] ?? []).map((name) => (
                <button key={name}
                  {...action('habit.icon.pick', () => setIcon(name), { params: { iconId: name } })}
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={icon === name ? { background: color, color: '#fff' } : { background: '#F5F6F7', color: '#7A8794' }}>
                  <IconRenderer name={name} size={22} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
