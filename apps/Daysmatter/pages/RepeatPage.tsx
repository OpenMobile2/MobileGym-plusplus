import { Check } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { REPEAT_OPTIONS } from '../constants';
import type { RepeatKind } from '../types';
import TopBar from '../components/TopBar';
import { useI18n, optionLabel } from '../i18n';

export default function RepeatPage() {
  const { t } = useI18n();
  const { action, bindBack, back } = useDaysmatterGestures();
  const draft = useDaysmatterStore((s) => s._temp.draft);
  const patchDraft = useDaysmatterStore((s) => s.patchDraft);

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('repeat.title')} back solid right={
        <button {...bindBack<HTMLButtonElement>()} className="px-2 text-[16px] text-white">{t('common.done')}</button>
      } />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <div className="mx-3 overflow-hidden rounded-xl bg-white">
          {REPEAT_OPTIONS.map((o, i) => (
            <button
              key={o.id}
              {...action<HTMLButtonElement>('repeat.option.pick', () => { patchDraft({ repeat: o.id as RepeatKind }); back(); }, { params: { value: o.id } })}
              className={`flex w-full items-center justify-between px-4 py-3.5 text-left active:bg-[#F2F1EC] ${i < REPEAT_OPTIONS.length - 1 ? 'border-b border-[#F2F1EC]' : ''}`}
            >
              <span className="text-[16px] text-[#1A1A1A]">{optionLabel(t, 'repeat', o.id)}</span>
              {draft?.repeat === o.id && <Check size={20} className="text-[#3E7CB1]" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
