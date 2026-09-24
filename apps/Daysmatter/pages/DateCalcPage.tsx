import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { todayMidnight, parts, fromParts, DAY, dateLabel } from '../utils/dayMath';
import TopBar from '../components/TopBar';
import DateWheel from '../components/DateWheel';
import { useI18n } from '../i18n';

type PickTarget = 'start' | 'rangeStart' | 'rangeEnd';

export default function DateCalcPage() {
  const { t, locale } = useI18n();
  const { action } = useDaysmatterGestures();
  const [start, setStart] = useState(todayMidnight());
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [rangeStart, setRangeStart] = useState(todayMidnight());
  const [rangeEnd, setRangeEnd] = useState(todayMidnight());
  const [includeStart, setIncludeStart] = useState(false);
  const [pick, setPick] = useState<PickTarget | null>(null);

  const fmt = useMemo(() => (ms: number) => dateLabel(ms, 'solar', locale), [locale]);

  const beforeMs = start - (Number(before) || 0) * DAY;
  const afterMs = start + (Number(after) || 0) * DAY;
  const diff = Math.round((rangeEnd - rangeStart) / DAY) + (includeStart ? 1 : 0);

  const pickMs = pick === 'start' ? start : pick === 'rangeStart' ? rangeStart : rangeEnd;
  const pp = parts(pickMs);
  const pickAction = pick === 'start' ? 'datecalc.startDate.set' : pick === 'rangeStart' ? 'datecalc.rangeStart.set' : 'datecalc.rangeEnd.set';
  const applyPick = (ms: number) => {
    if (pick === 'start') setStart(ms);
    else if (pick === 'rangeStart') setRangeStart(ms);
    else setRangeEnd(ms);
  };

  const adPrefix = t('dateCalc.ad');

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('dateCalc.title')} back solid />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <div className="mb-1.5 px-1 text-[13px] text-[#9A9A9A]">{t('dateCalc.calcDate')}</div>
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="flex items-center justify-center gap-2 border-b border-[#F2F1EC] py-3.5 text-[15px] text-[#6B6B6B]">
            {t('dateCalc.from')} <DateChip label={fmt(start)} onClick={() => setPick('start')} /> {t('dateCalc.start')}
          </div>
          <div className="flex items-center justify-center gap-2 py-3 text-[15px] text-[#6B6B6B]">
            <input {...action<HTMLInputElement>('datecalc.days.input', () => {})} value={before} onChange={(e) => setBefore(e.target.value.replace(/\D/g, ''))}
              placeholder={t('dateCalc.enterDays')} className="w-28 rounded-full bg-[#F2F1EC] px-3 py-1.5 text-center text-[14px] outline-none placeholder:text-[#B8B8B8]" />
            <span className="flex items-center gap-0.5 rounded-full bg-[#F2F1EC] px-2.5 py-1.5 text-[14px]">{t('dateCalc.daysUnit')}<ChevronDown size={13} /></span>
            {t('dateCalc.before')}
          </div>
          <div className="border-t border-[#F2F1EC] py-3 text-center text-[15px] text-[#1A1A1A]">{adPrefix && `${adPrefix} `}{fmt(beforeMs)}</div>
          <div className="flex items-center justify-center gap-2 border-t border-[#F2F1EC] py-3 text-[15px] text-[#6B6B6B]">
            <input {...action<HTMLInputElement>('datecalc.days.input', () => {})} value={after} onChange={(e) => setAfter(e.target.value.replace(/\D/g, ''))}
              placeholder={t('dateCalc.enterDays')} className="w-28 rounded-full bg-[#F2F1EC] px-3 py-1.5 text-center text-[14px] outline-none placeholder:text-[#B8B8B8]" />
            <span className="flex items-center gap-0.5 rounded-full bg-[#F2F1EC] px-2.5 py-1.5 text-[14px]">{t('dateCalc.daysUnit')}<ChevronDown size={13} /></span>
            {t('dateCalc.after')}
          </div>
          <div className="border-t border-[#F2F1EC] py-3 text-center text-[15px] text-[#1A1A1A]">{adPrefix && `${adPrefix} `}{fmt(afterMs)}</div>
        </div>

        <div className="mb-1.5 mt-4 px-1 text-[13px] text-[#9A9A9A]">{t('dateCalc.calcRange')}</div>
        <div className="overflow-hidden rounded-xl bg-white">
          <div className="flex items-center justify-center gap-2 border-b border-[#F2F1EC] py-3.5 text-[15px] text-[#6B6B6B]">
            {t('dateCalc.from')} <DateChip label={fmt(rangeStart)} onClick={() => setPick('rangeStart')} /> {t('dateCalc.start')},
          </div>
          <div className="flex items-center justify-center gap-2 border-b border-[#F2F1EC] py-3.5 text-[15px] text-[#6B6B6B]">
            {t('dateCalc.to')} <DateChip label={fmt(rangeEnd)} onClick={() => setPick('rangeEnd')} /> {t('dateCalc.end')}
          </div>
          <div className="flex items-center justify-center gap-3 py-3.5 text-[15px] text-[#6B6B6B]">
            {locale === 'zh' ? '共' : ''} <span className="text-[22px] font-bold text-[#3E7CB1]">{Math.abs(diff)}</span>
            <span className="rounded bg-[#C4C4C4] px-2 py-0.5 text-[12px] text-white">Day</span>
          </div>
          <button {...action<HTMLButtonElement>('datecalc.includeStart.toggle', () => setIncludeStart((v) => !v))}
            className="flex w-full items-center justify-center gap-2 border-t border-[#F2F1EC] py-3 text-[14px] text-[#6B6B6B] active:bg-[#F2F1EC]">
            <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${includeStart ? 'border-[#3E7CB1] bg-[#3E7CB1]' : 'border-[#C4C4C4]'}`}>
              {includeStart && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            </span>
            {t('dateCalc.includeStart')}
          </button>
        </div>
      </div>

      {pick && (
        <div className="absolute inset-0 z-[200] flex flex-col justify-end">
          <button onClick={() => setPick(null)} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 rounded-t-2xl bg-white pb-4 pt-2">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-[#9A9A9A]">{t('dateCalc.pickDate')}</span>
              <button onClick={() => setPick(null)} className="text-sm font-medium text-[#3E7CB1]">{t('common.done')}</button>
            </div>
            <DateWheel y={pp.y} m={pp.m} d={pp.d} actionId={pickAction} onSet={(y, m, d) => applyPick(fromParts(y, m, d))} />
          </div>
        </div>
      )}
    </div>
  );
}

function DateChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-0.5 text-[15px] font-medium text-[#3E7CB1] active:opacity-70">
      {label}<ChevronDown size={14} />
    </button>
  );
}
