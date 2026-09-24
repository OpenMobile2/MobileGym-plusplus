import { useLocation } from 'react-router-dom';
import { Settings, Calculator, Send, Heart, MessageCircle, X, Share } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { todayMidnight } from '../utils/dayMath';
import { useI18n } from '../i18n';

const INSTALL = Date.UTC(2025, 7, 8);

export default function MorePage() {
  const { t } = useI18n();
  const location = useLocation();
  const airtransOpen = new URLSearchParams(location.search).get('popup') === 'airtrans';
  const { bindTap, action, bindBack } = useDaysmatterGestures();
  const showToast = useDaysmatterStore((s) => s.showToast);
  const events = useDaysmatterStore((s) => s.events);

  const activeCount = events.filter((e) => !e.archived).length;
  const usedDays = Math.max(1, Math.round((todayMidnight() - INSTALL) / 86400000));

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <div className="flex h-[84px] flex-shrink-0 items-center bg-[#3E7CB1] px-3 pt-10 text-white">
        <button {...bindTap<HTMLButtonElement>('more.feedback-open')} className="text-[15px]">{t('more.feedback')}</button>
        <div className="flex-1 text-center text-[17px] font-semibold">{t('more.title')}</div>
        <button {...action<HTMLButtonElement>('more.piggy.tap', () => showToast(t('toast.thanks')))} aria-label="like"><Heart size={22} fill="#E89AA8" className="text-[#E89AA8]" /></button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex items-stretch bg-white py-4">
          <Stat n={activeCount} label={t('more.recording')} sub="EVENTS" />
          <div className="my-1 w-px bg-[#EFEDE8]" />
          <Stat n={usedDays} label={t('more.used')} sub="DAYS" />
          <div className="my-1 w-px bg-[#EFEDE8]" />
          <Stat n={0} label={t('more.shareStat')} sub="TIME" />
        </div>

        <div className="grid grid-cols-4 gap-2.5 px-3 py-3">
          <ToolCard icon={<Calculator size={20} />} label={t('notebook.dateCalc')} tint="#EAF3FB" color="#3E7CB1" {...bindTap<HTMLButtonElement>('more.datecalc-open')} />
          <ToolCard icon={<Send size={20} />} label={t('more.receive')} tint="#FCEFE0" color="#E08A3C" {...bindTap<HTMLButtonElement>('more.airtrans-open')} />
          <ToolCard icon={<Settings size={20} />} label={t('more.settings')} tint="#ECEBE6" color="#6B6B6B" {...bindTap<HTMLButtonElement>('more.settings-open')} />
          <ToolCard icon={<MessageCircle size={20} />} label={t('more.feedback')} tint="#F3EFFA" color="#8B6FD0" {...bindTap<HTMLButtonElement>('more.feedback-open')} />
        </div>

        <button {...bindTap<HTMLButtonElement>('notebook.pro-open')}
          className="mx-3 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B9BD5] to-[#3E7CB1] px-4 py-4 text-left active:opacity-90">
          <span className="text-[40px]">🛸</span>
          <div className="flex-1 px-3 text-white">
            <div className="flex items-center gap-1.5 text-[13px] opacity-90">Days Matter <span className="rounded bg-[#F2A23C] px-1.5 py-0.5 text-[10px] font-bold">Pro</span></div>
            <div className="mt-0.5 text-[18px] font-bold">{t('more.upgradePro')}</div>
            <div className="mt-0.5 text-[11px] opacity-80">{t('more.upgradeHint')}</div>
          </div>
          <span className="rounded-full bg-[#4CAF50] px-3 py-1.5 text-[13px] font-medium text-white">{t('more.upgradeNow')}</span>
        </button>

        <div className="mt-3 px-3 text-[13px] text-[#9A9A9A]">{t('more.recommended')}</div>
        <div className="mt-1.5 grid grid-cols-2 gap-2.5 px-3">
          <RecCard emoji="⏱️" title={t('more.recFocus')} desc={t('more.recFocusDesc')} tint="#EAF3FB" />
          <RecCard emoji="📝" title={t('more.recNotes')} desc={t('more.recNotesDesc')} tint="#F3EFFA" />
        </div>
        <div className="mt-2.5 px-3 pb-4">
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EAF3FB] text-2xl">⏱️</span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-medium text-[#1A1A1A]">{t('more.recTimer')}</div>
              <div className="truncate text-[12px] text-[#9A9A9A]">{t('more.recTimerDesc')}</div>
            </div>
            <span className="rounded-full border border-[#D8D6D0] px-3 py-1 text-[13px] text-[#6B6B6B]">{t('more.free')}</span>
          </div>
        </div>
      </div>

      {airtransOpen && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center px-8">
          <button {...bindBack<HTMLButtonElement>()} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 w-full rounded-2xl bg-[#F2F1EC] p-6 text-center shadow-2xl">
            <button {...bindBack<HTMLButtonElement>()} className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-[#C4C4C4] text-white" aria-label="close"><X size={14} /></button>
            <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#EAF3FB] to-[#CFE3F5]">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#5B9BD5]/40">
                <span className="absolute h-1/2 w-1/2 origin-bottom-right rounded-tl-full bg-[#5B9BD5]/30" style={{ top: 0, left: 0 }} />
                <span className="h-2 w-2 rounded-full bg-[#3E7CB1]" />
              </span>
            </div>
            <div className="text-[18px] font-bold text-[#1A1A1A]">{t('more.waitingFriends')}</div>
            <div className="mt-4 text-left text-[14px] text-[#6B6B6B]">{t('more.howToSend')}</div>
            <div className="mt-2 flex items-center gap-2 text-left text-[14px] text-[#1A1A1A]">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#F2A23C] text-white"><Share size={15} /></span>
              {t('more.tapShare')}
              <span className="ml-2 flex h-7 w-7 items-center justify-center rounded-md bg-[#9B7FE0] text-white"><Send size={15} /></span>
              AirTrans
            </div>
            <button {...bindBack<HTMLButtonElement>()} className="mt-5 w-full rounded-xl bg-[#5B9BD5] py-3 text-[16px] font-semibold text-white active:bg-[#4A90D9]">{t('common.cancel')}</button>
            <p className="mt-3 text-[12px] leading-relaxed text-[#9A9A9A]">{t('more.airtransHint')}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label, sub }: { n: number; label: string; sub: string }) {
  return (
    <div className="flex flex-1 flex-col items-center">
      <span className="text-[11px] text-[#9A9A9A]">{label}</span>
      <span className="my-0.5 text-[26px] font-bold leading-none text-[#1A1A1A]">{n}</span>
      <span className="text-[10px] tracking-wider text-[#C4C4C4]">{sub}</span>
    </div>
  );
}

function ToolCard({ icon, label, tint, color, ...rest }: { icon: React.ReactNode; label: string; tint: string; color: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="flex flex-col items-center justify-start gap-1.5 rounded-2xl border border-[#E6E4DE] bg-white px-1 py-3 active:bg-[#F2F1EC]">
      <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: tint, color }}>{icon}</span>
      <span className="text-center text-[11px] leading-tight text-[#5A5A5A]">{label}</span>
    </button>
  );
}

function RecCard({ emoji, title, desc, tint }: { emoji: string; title: string; desc: string; tint: string }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl p-3" style={{ background: tint }}>
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white text-xl">{emoji}</span>
      <div className="min-w-0">
        <div className="truncate text-[13px] font-medium text-[#1A1A1A]">{title}</div>
        <div className="truncate text-[11px] text-[#9A9A9A]">{desc}</div>
      </div>
    </div>
  );
}
