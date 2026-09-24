import { Share2, Globe } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { miscUrl } from '../assets';
import { realNow } from '../../../os/TimeService';
import { useI18n } from '../i18n';

const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const HISTORY = [
  { labelKey: 'discover.historyHoliday', textKey: 'discover.historyHolidayText' },
  { labelKey: 'discover.historyBirthday', textKey: 'discover.historyBirthdayText' },
  { labelKey: '1860', textKey: 'discover.history1860Text' },
  { labelKey: '1876', textKey: 'discover.history1876Text' },
  { labelKey: '1894', textKey: 'discover.history1894Text' },
  { labelKey: '1905', textKey: 'discover.history1905Text' },
];

export default function DiscoverPage() {
  const { t } = useI18n();
  const { action } = useDaysmatterGestures();
  const showToast = useDaysmatterStore((s) => s.showToast);
  const now = new Date(realNow());
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const digits = `${y},${String(m).padStart(2, '0')},${String(d).padStart(2, '0')}`;
  const img = miscUrl('discover_travel');

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <div className="flex h-[84px] flex-shrink-0 items-center bg-[#3E7CB1] px-3 pt-10 text-white">
        <button {...action<HTMLButtonElement>('discover.day.shift', () => showToast(t('toast.historyToday')))} aria-label="shift"><Globe size={20} /></button>
        <div className="flex-1 text-center text-[17px] font-semibold">{t('discover.title')}</div>
        <button {...action<HTMLButtonElement>('discover.share.tap', () => showToast(t('toast.shareUnavailable')))} aria-label="share"><Share2 size={20} /></button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex justify-center gap-1 bg-white px-4 py-5">
          {digits.split('').map((ch, i) =>
            ch === ',' ? (
              <span key={i} className="self-end pb-1 text-[28px] font-bold text-[#9A9A9A]">,</span>
            ) : (
              <span key={i} className="flex h-12 w-9 items-center justify-center rounded-md bg-[#F0EFEA] text-[28px] font-bold text-[#1A1A1A] shadow-inner">{ch}</span>
            ),
          )}
        </div>

        <button {...action<HTMLButtonElement>('discover.idaily.tap', () => showToast(t('toast.idailyUnavailable')))} className="block w-full bg-white px-4 pb-4 text-left">
          <div className="mb-2 text-center text-[15px] font-bold text-[#1A1A1A]">{t('discover.idaily')}</div>
          <div className="flex gap-3">
            <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg">
              {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full bg-[#2E8B82]" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-[#1A1A1A]">{EN_MONTHS[(m + 10) % 12]} {d > 1 ? d - 1 : 28}, {y}</div>
              <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-[#6B6B6B]">
                {t('discover.idailySnippet')}
              </p>
            </div>
          </div>
        </button>

        <div
          className="mt-2 px-4 pb-6 pt-2"
          style={{
            backgroundColor: '#FBFAF7',
            backgroundImage:
              'linear-gradient(rgba(90,90,90,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(90,90,90,0.06) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        >
          {HISTORY.map((h, i) => (
            <div key={i} className="flex gap-4 py-3">
              <span className="w-12 flex-shrink-0 text-right text-[15px] font-bold text-[#5A5A5A]">
                {h.labelKey.startsWith('discover.') ? t(h.labelKey) : h.labelKey}
              </span>
              <span className="flex-1 whitespace-pre-line text-[14px] leading-relaxed text-[#1A1A1A]">{t(h.textKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
