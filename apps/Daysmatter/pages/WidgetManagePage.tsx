import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Plus, LayoutGrid, Clock, Lock, ChevronRight } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { miscUrl } from '../assets';
import { realNow } from '../../../os/TimeService';
import TopBar from '../components/TopBar';
import { useI18n } from '../i18n';

const GUIDE_KEYS: Record<string, { title: string; body: string }> = {
  main: { title: 'widget.guideMainTitle', body: 'widget.guideMainBody' },
  multi: { title: 'widget.guideMultiTitle', body: 'widget.guideMultiBody' },
  lock: { title: 'widget.guideLockTitle', body: 'widget.guideLockBody' },
};

export default function WidgetManagePage() {
  const { t } = useI18n();
  const location = useLocation();
  const guide = new URLSearchParams(location.search).get('guide');
  const { bindTap, action, bindBack } = useDaysmatterGestures();
  const events = useDaysmatterStore((s) => s.events);
  const widgetEventId = useDaysmatterStore((s) => s.widgetEventId);
  const setWidgetEvent = useDaysmatterStore((s) => s.setWidgetEvent);
  const [picking, setPicking] = useState(false);

  const sky = miscUrl('widget_sky');
  const gKeys = guide ? GUIDE_KEYS[guide] : null;

  const now = new Date(realNow());
  const y = now.getFullYear(), m = now.getMonth() + 1, d = now.getDate();
  const hh = now.getHours(), mm = String(now.getMinutes()).padStart(2, '0');
  const ampm = hh < 12 ? 'AM' : 'PM', h12 = hh % 12 || 12;
  const dayOfYear = Math.floor((Date.UTC(y, now.getMonth(), d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
  const totalDays = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 366 : 365;
  const pct = (dayOfYear / totalDays * 100).toFixed(2);
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  const weekdays = t('day.weekdays').split(',');

  const skyStyle = sky ? { backgroundImage: `url(${sky})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#7FB3D5' };

  return (
    <div data-status-bar-foreground="dark" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('widget.title')} back />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <div className="overflow-hidden rounded-xl bg-white">
          <GuideRow icon={<LayoutGrid size={18} className="text-[#5B9BD5]" />} label={t('widget.guideMain')} {...bindTap<HTMLButtonElement>('widget.guideMain-open')} />
          <GuideRow icon={<Clock size={18} className="text-[#5B9BD5]" />} label={t('widget.guideMulti')} {...bindTap<HTMLButtonElement>('widget.guideMulti-open')} />
          <GuideRow icon={<Lock size={18} className="text-[#5B9BD5]" />} label={t('widget.guideLock')} {...bindTap<HTMLButtonElement>('widget.guideLock-open')} last />
        </div>

        <div className="my-4 flex justify-center">
          <span className="rounded-full bg-[#E4E2DC] px-4 py-1.5 text-[13px] text-[#9A9A9A]">{t('widget.tapToEdit')}</span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div>
            <div className="mb-1.5 text-[15px] font-semibold text-[#1A1A1A]">{t('widget.clockWidget')}</div>
            <button {...action<HTMLButtonElement>('widget.preview.edit', () => setPicking(true), { params: { widgetId: 'w_clock' } })}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl text-left text-white shadow" style={skyStyle}>
              <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-[12px] font-medium">{y}.{m}.{d} <span>◐</span></div>
              <div className="absolute bottom-3 left-3">
                <div className="text-[18px] font-medium leading-none">{ampm}</div>
                <div className="text-[40px] font-bold leading-tight">{h12}:{mm}</div>
              </div>
            </button>
          </div>
          <div>
            <div className="mb-1.5 text-[15px] font-semibold text-[#1A1A1A]">{t('widget.calendarWidget')}</div>
            <button {...action<HTMLButtonElement>('widget.preview.edit', () => setPicking(true), { params: { widgetId: 'w_cal' } })}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl p-2 text-left text-white shadow" style={skyStyle}>
              <div className="absolute inset-0 bg-black/10" />
              <div className="relative">
                <div className="mb-0.5 text-right text-[11px] font-medium">{y}.{m}</div>
                <div className="grid grid-cols-7 text-center text-[7px] leading-tight">
                  {weekdays.map((w) => <span key={w} className="opacity-80">{w}</span>)}
                  {cells.map((c, i) => (
                    <span key={i} className={c === d ? 'mx-auto flex h-2.5 w-2.5 items-center justify-center rounded-full bg-white font-bold text-[#3E7CB1]' : ''}>{c ?? ''}</span>
                  ))}
                </div>
              </div>
            </button>
          </div>
          <div>
            <div className="mb-1.5 text-[15px] font-semibold text-[#1A1A1A]">{t('widget.yearProgress')}</div>
            <button {...action<HTMLButtonElement>('widget.preview.edit', () => setPicking(true), { params: { widgetId: 'w_year' } })}
              className="block aspect-square w-full rounded-2xl bg-white p-4 text-left shadow">
              <div className="flex items-center justify-between text-[13px] text-[#9A9A9A]">{t('widget.yearProgress')} <span>🌸</span></div>
              <div className="mt-3 text-[#1A1A1A]"><span className="text-[44px] font-bold leading-none">{pct.split('.')[0]}</span><span className="text-[18px] font-medium">.{pct.split('.')[1]}%</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#ECEAE4]"><span className="block h-full rounded-full bg-[#5B9BD5]" style={{ width: `${pct}%` }} /></div>
              <div className="mt-2 text-[12px] text-[#9A9A9A]">{dayOfYear} / {totalDays}</div>
            </button>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[#1A1A1A]">{t('widget.photoWidget')}</span>
              <button {...action<HTMLButtonElement>('widget.preview.edit', () => setPicking(true), { params: { widgetId: 'w_photo' } })} className="flex items-center gap-0.5 text-[14px] text-[#3E7CB1]"><Plus size={15} /> {t('common.add')}</button>
            </div>
            <button {...action<HTMLButtonElement>('widget.preview.edit', () => setPicking(true), { params: { widgetId: 'w_photo' } })}
              className="relative block aspect-square w-full overflow-hidden rounded-2xl shadow" style={skyStyle}>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/40 to-transparent p-2 text-left text-[12px] text-white">Photo #1</span>
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-[12px] text-[#B0B0B0]">
          <div className="font-medium">{t('widget.brandLine1')}</div>
          <div className="mt-0.5">{t('widget.brandLine2')}</div>
        </div>
      </div>

      {picking && (
        <div className="absolute inset-0 z-[200] flex flex-col justify-end">
          <button onClick={() => setPicking(false)} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 max-h-[60%] overflow-y-auto rounded-t-2xl bg-white pb-6 no-scrollbar">
            <div className="sticky top-0 bg-white px-4 py-3 text-center text-sm text-[#9A9A9A]">{t('widget.pickEvent')}</div>
            {events.filter((e) => !e.archived).map((e) => (
              <button key={e.id}
                {...action<HTMLButtonElement>('widget.bind.pick', () => { setWidgetEvent(e.id); setPicking(false); }, { params: { eventId: e.id } })}
                className="flex w-full items-center justify-between border-t border-[#F2F1EC] px-5 py-3 text-left active:bg-[#F2F1EC]">
                <span className="text-[15px] text-[#1A1A1A]">{e.title}</span>
                {widgetEventId === e.id && <Check size={18} className="text-[#3E7CB1]" />}
              </button>
            ))}
          </div>
        </div>
      )}

      {gKeys && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center px-8">
          <button {...bindBack<HTMLButtonElement>()} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 w-full rounded-2xl bg-white p-5 text-center">
            <div className="text-[16px] font-semibold text-[#1A1A1A]">{t(gKeys.title)}</div>
            <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{t(gKeys.body)}</p>
            <button {...bindBack<HTMLButtonElement>()} className="mt-4 w-full rounded-lg bg-[#3E7CB1] py-2.5 text-white">{t('widget.gotIt')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

function GuideRow({ icon, label, last, ...rest }: { icon: React.ReactNode; label: string; last?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[#F2F1EC] ${last ? '' : 'border-b border-[#F2F1EC]'}`}>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#EAF3FB]">{icon}</span>
      <span className="flex-1 text-[14px] text-[#1A1A1A]">{label}</span>
      <ChevronRight size={16} className="flex-shrink-0 text-[#C4C4C4]" />
    </button>
  );
}
