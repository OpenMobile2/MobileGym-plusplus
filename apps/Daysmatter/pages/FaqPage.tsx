import { useState } from 'react';
import { ChevronsUpDown } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import TopBar from '../components/TopBar';
import { useI18n } from '../i18n';

export default function FaqPage() {
  const { t } = useI18n();
  const { action } = useDaysmatterGestures();
  const showToast = useDaysmatterStore((s) => s.showToast);
  const [email, setEmail] = useState('');
  const [type, setType] = useState('suggest');
  const [text, setText] = useState('');

  const faqs = [
    { q: t('faq.q1'), a: t('faq.a1') },
    { q: t('faq.q2'), a: t('faq.a2') },
    { q: t('faq.q3'), a: t('faq.a3') },
    { q: t('faq.q4'), a: t('faq.a4') },
    { q: t('faq.q5'), a: t('faq.a5') },
  ];

  const typeKeys = ['suggest', 'bug', 'other'] as const;
  const typeLabel = (k: typeof typeKeys[number]) => {
    if (k === 'suggest') return t('faq.typeSuggest');
    if (k === 'bug') return t('faq.typeBug');
    return t('faq.typeOther');
  };

  const cycleType = () => setType((cur) => {
    const idx = typeKeys.indexOf(cur as typeof typeKeys[number]);
    return typeKeys[(idx + 1) % typeKeys.length];
  });

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-white">
      <TopBar title={t('faq.title')} back solid />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
        <div className="text-[15px] font-bold text-[#1A1A1A]">{t('faq.commonQuestions')}</div>
        <div className="mt-3 space-y-5">
          {faqs.map((f, i) => (
            <div key={i}>
              <div className="text-[15px] font-bold text-[#1A1A1A]">{f.q}</div>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[#8A8A8A]">{f.a}</p>
            </div>
          ))}
        </div>

        <div className="my-5 border-t-2 border-[#1A1A1A]/80" />

        <div className="text-[15px] font-bold text-[#1A1A1A]">{t('faq.feedbackTitle')}</div>
        <p className="mt-2 text-[14px] leading-relaxed text-[#6B6B6B]">
          {t('faq.feedbackIntro')}
        </p>

        <div className="mt-4 text-[14px] text-[#1A1A1A]">{t('faq.emailLabel')}</div>
        <input {...action<HTMLInputElement>('faq.form.input', () => {})} value={email} onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-md border border-[#D8D6D0] px-3 py-2.5 text-[15px] outline-none focus:border-[#3E7CB1]" />

        <div className="mt-4 text-[14px] text-[#1A1A1A]">{t('faq.typeLabel')}</div>
        <button {...action<HTMLButtonElement>('faq.type.pick', cycleType, { params: { value: type } })}
          className="mt-1.5 flex items-center gap-1 text-[15px] text-[#1A1A1A]">
          {typeLabel(type as typeof typeKeys[number])}<ChevronsUpDown size={14} className="text-[#9A9A9A]" />
        </button>

        <div className="mt-4 text-[14px] text-[#1A1A1A]">{t('faq.contentLabel')}</div>
        <textarea {...action<HTMLTextAreaElement>('faq.form.input', () => {})} value={text} onChange={(e) => setText(e.target.value)}
          rows={7} className="mt-1.5 w-full resize-none rounded-md border border-[#D8D6D0] p-3 text-[15px] outline-none focus:border-[#3E7CB1]" />

        <button {...action<HTMLButtonElement>('faq.form.submit', () => { setText(''); setEmail(''); showToast(t('toast.feedbackSubmitted')); })}
          className="mb-6 mt-4 rounded-md bg-[#7A7A7A] px-5 py-2.5 text-[15px] text-white active:bg-[#6B6B6B]">
          {t('faq.submit')}
        </button>
      </div>
    </div>
  );
}
