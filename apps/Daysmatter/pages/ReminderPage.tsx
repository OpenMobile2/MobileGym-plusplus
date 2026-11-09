import { useState } from 'react';
import { Check, Flag, BellRing, ChevronRight } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { REMINDER_OPTIONS } from '../constants';
import type { ReminderKind } from '../types';
import TopBar from '../components/TopBar';
import { useI18n, optionLabel } from '../i18n';

export default function ReminderPage() {
  const { t } = useI18n();
  const { action, bindBack } = useDaysmatterGestures();
  const draft = useDaysmatterStore((s) => s._temp.draft);
  const patchDraft = useDaysmatterStore((s) => s.patchDraft);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const [bigDay, setBigDay] = useState(false);

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('reminder.title')} back solid right={
        <button {...bindBack<HTMLButtonElement>()} className="px-2 text-[16px] text-white">{t('common.done')}</button>
      } />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <p className="mb-3 px-1 text-[13px] leading-relaxed text-[#9A9A9A]">
          {t('reminder.hint')}
        </p>

        <div className="overflow-hidden rounded-xl bg-white">
          {REMINDER_OPTIONS.map((o, i) => (
            <button
              key={o.id}
              {...action<HTMLButtonElement>('reminder.freq.pick', () => { patchDraft({ reminder: o.id as ReminderKind }); }, { params: { value: o.id } })}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#F2F1EC] ${i < REMINDER_OPTIONS.length - 1 ? 'border-b border-[#F2F1EC]' : ''}`}
            >
              <span className="text-[16px] text-[#1A1A1A]">{optionLabel(t, 'reminder', o.id)}</span>
              {draft?.reminder === o.id && <Check size={20} className="text-[#3E7CB1]" strokeWidth={3} />}
            </button>
          ))}
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-white">
          <button
            {...action<HTMLButtonElement>('reminder.bigday.toggle', () => setBigDay((v) => !v))}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[#F2F1EC]"
          >
            <Flag size={20} className="flex-shrink-0 text-[#E0524D]" />
            <span className="flex-1 text-[16px] text-[#1A1A1A]">{t('reminder.bigDay')}</span>
            <span className={`relative h-6 w-10 flex-shrink-0 rounded-full ${bigDay ? 'bg-[#3E7CB1]' : 'bg-[#D8D6D0]'}`}>
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${bigDay ? 'left-[18px]' : 'left-0.5'}`} />
            </span>
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-white">
          <button
            {...action<HTMLButtonElement>('reminder.strong.tap', () => showToast(t('toast.strongPro')))}
            className="flex w-full items-center gap-2 px-4 py-3.5 text-left active:bg-[#F2F1EC]"
          >
            <BellRing size={20} className="flex-shrink-0 text-[#9A9A9A]" />
            <span className="text-[16px] text-[#1A1A1A]">{t('reminder.strong')}</span>
            <span className="rounded bg-[#F2A23C] px-1.5 py-0.5 text-[10px] font-bold text-white">Pro</span>
            <span className="text-[13px] text-[#9A9A9A]">{t('settings.strongProOnly')}</span>
            <span className="ml-auto flex items-center text-[14px] text-[#3E7CB1]">{t('reminder.add')}<ChevronRight size={16} className="text-[#C4C4C4]" /></span>
          </button>
        </div>
      </div>
    </div>
  );
}
