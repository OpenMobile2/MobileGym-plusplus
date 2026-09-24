import { useState, useMemo } from 'react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import TopBar from '../components/TopBar';
import { useI18n } from '../i18n';

const DOTS = 8;

export default function ProPage() {
  const { t } = useI18n();
  const { action } = useDaysmatterGestures();
  const showToast = useDaysmatterStore((s) => s.showToast);
  const [i, setI] = useState(0);

  const slides = useMemo(() => [
    {
      title: t('pro.slideGuide'),
      keywords: [t('pro.kwPassword'), t('pro.kwFonts'), t('pro.kwPrecise'), t('pro.kwIcons'), t('pro.kwSubEvents')],
    },
    {
      title: t('pro.slideSync'),
      keywords: [t('pro.kwMultiSync'), t('pro.kwIcloud'), t('pro.kwNeverLose')],
    },
    {
      title: t('pro.slideWidget'),
      keywords: [t('pro.kwHomeWidget'), t('pro.kwCustomColor'), t('pro.kwWatch')],
    },
  ], [t]);

  const slide = slides[i];

  return (
    <div data-status-bar-foreground="dark" className="flex h-full flex-col bg-[#F2F1EC]">
      <TopBar title={t('pro.title')} back />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex flex-1 flex-col overflow-y-auto px-4 py-4 no-scrollbar">
        <button {...action<HTMLButtonElement>('pro.carousel.shift', () => setI((v) => (v + 1) % slides.length))}
          className="flex flex-1 flex-col rounded-xl bg-white px-6 py-8 text-left"
          style={{ backgroundImage: 'repeating-linear-gradient(#FFF,#FFF 23px,#F0F0F0 23px,#F0F0F0 24px),repeating-linear-gradient(90deg,#FFF,#FFF 23px,#F0F0F0 23px,#F0F0F0 24px)' }}>
          <div className="h-[88px] w-[88px] overflow-hidden rounded-[20px] shadow-md">
            <div className="bg-[#5B9BD5] py-1.5 text-center text-[15px] font-bold text-white">{t('pro.iconLabel')}</div>
            <div className="flex h-[60px] items-center justify-center bg-white text-[42px] font-bold text-[#1A1A1A]">23</div>
          </div>
          <div className="mt-5 flex items-start gap-1">
            <span className="text-[34px] font-bold leading-none text-[#1A1A1A]">Days Matter</span>
            <span className="rounded-full bg-[#E89A4C] px-2 py-0.5 text-[12px] font-bold text-white">Pro</span>
          </div>
          <span className="mt-2 h-1 w-12 rounded bg-[#3E7CB1]" />
          <div className="mt-4 text-[30px] font-bold leading-snug text-[#1A1A1A]">
            {t('pro.headline')}<br /><span className="bg-[#FCE94F] px-1">{slide.title}</span>
          </div>
          <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1.5 pt-10 text-[16px] font-medium text-[#1A1A1A]">
            {slide.keywords.map((k) => <span key={k} className="bg-[#FCE94F] px-1">{k}</span>)}
          </div>
          <div className="mt-3 text-[14px] text-[#9A9A9A]">{t('pro.support')}</div>
          <div className="mt-3 flex gap-1.5">
            {Array.from({ length: DOTS }).map((_, idx) => (
              <span key={idx} className={`h-1.5 w-1.5 rounded-full ${idx === i ? 'bg-[#3E7CB1]' : 'bg-[#D8D6D0]'}`} />
            ))}
          </div>
        </button>

        <button {...action<HTMLButtonElement>('pro.upgrade.tap', () => showToast(t('toast.iapUnavailable')))}
          className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#5B9BD5] py-4 text-[17px] font-semibold text-white shadow-md active:bg-[#4A90D9]">
          {t('pro.upgradeButton')}
        </button>
      </div>
    </div>
  );
}
