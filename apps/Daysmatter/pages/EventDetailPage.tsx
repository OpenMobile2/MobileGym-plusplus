import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, Image as ImageIcon, Share, Archive, EyeOff, Flag, Download, Plus } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { dayInfo, phrase, ymd, dateLabel } from '../utils/dayMath';
import { bgUrl } from '../assets';
import { NOTEBOOK_COVERS } from '../constants';
import EventRow from '../components/EventRow';
import { useI18n } from '../i18n';

export default function EventDetailPage() {
  const { t, locale } = useI18n();
  const { id = '' } = useParams();
  const location = useLocation();
  const shareOpen = new URLSearchParams(location.search).get('sheet') === 'share';
  const { bindTap, action, bindBack, back } = useDaysmatterGestures();

  const events = useDaysmatterStore((s) => s.events);
  const event = useMemo(() => events.find((e) => e.id === id), [events, id]);
  const subEvents = useMemo(() => events.filter((e) => e.parentId === id && !e.archived), [events, id]);
  const notebook = useDaysmatterStore((s) => s.notebooks.find((n) => n.id === event?.notebookId));
  const setArchived = useDaysmatterStore((s) => s.setArchived);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const clearDraft = useDaysmatterStore((s) => s.clearDraft);
  const [ymdMode, setYmdMode] = useState(false);
  const wood = bgUrl('bg_wood_light');

  if (!event) {
    return (
      <div data-status-bar-foreground="dark" className="flex h-full flex-col items-center justify-center bg-[#F2F1EC] pt-10 text-[#9A9A9A]">
        <p>{t('eventDetail.notFound')}</p>
        <button {...bindBack<HTMLButtonElement>()} className="mt-4 rounded-lg bg-[#3E7CB1] px-5 py-2 text-white">{t('common.back')}</button>
      </div>
    );
  }

  const info = dayInfo(event);
  const headerColor = NOTEBOOK_COVERS.find((c) => c.id === notebook?.cover)?.color ?? '#3E7CB1';

  return (
    <div
      data-status-bar-foreground="dark"
      className="relative flex h-full flex-col pt-10"
      style={wood ? { backgroundImage: `url(${wood})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#D9A066' }}
    >
      <div className="relative z-10 flex h-12 flex-shrink-0 items-center justify-between px-3">
        <button {...bindBack<HTMLButtonElement>()} className="flex items-center rounded-full bg-white/55 py-1 pl-1 pr-2.5 text-[14px] font-medium text-[#5A4632] backdrop-blur-sm active:bg-white/70" aria-label="back">
          <ChevronLeft size={18} />{t('common.back')}
        </button>
        <span className="text-[17px] font-bold text-[#5A4632]/70 drop-shadow-sm">{t('home.title')}</span>
        <button {...bindTap<HTMLButtonElement>('detail.edit-open', { params: { id: event.id }, beforeTrigger: () => clearDraft() })} className="rounded-full bg-white/55 px-3 py-1 text-[14px] font-medium text-[#5A4632] backdrop-blur-sm active:bg-white/70" aria-label="edit">
          {t('common.edit')}
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
        <div className="flex flex-col items-center px-8 pb-4 pt-8">
          <div className="w-full max-w-[300px] overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
            <div className="px-4 py-3 text-center text-[17px] font-semibold text-white" style={{ backgroundColor: headerColor }}>
              {event.title}
            </div>
            <button
              {...action<HTMLButtonElement>('detail.display.cycle', () => setYmdMode((v) => !v))}
              className="flex w-full flex-col items-center justify-center px-4 py-7 active:bg-[#FAF9F6]"
            >
              {info.state === 'today' ? (
                <span className="text-[64px] font-bold leading-none text-[#1A1A1A]">0</span>
              ) : ymdMode ? (
                <>
                  <span className="mb-1 text-[14px] text-[#9A9A9A]">{phrase(info, locale)}</span>
                  <span className="text-[30px] font-bold leading-tight text-[#1A1A1A]">{ymd(event, locale)}</span>
                </>
              ) : (
                <>
                  <span className="mb-1 text-[14px] text-[#9A9A9A]">{phrase(info, locale)}</span>
                  <span className="text-[80px] font-bold leading-none text-[#1A1A1A]">{info.count}</span>
                  <span className="mt-1 text-[14px] text-[#9A9A9A]">{t('common.days')}</span>
                </>
              )}
            </button>
            <div className="border-t border-[#EFEDE8] px-4 py-2.5 text-center text-[13px] text-[#9A9A9A]">
              {t('eventDetail.targetDateLabel')} {dateLabel(event.targetDate, event.calendar, locale)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 px-3 pb-3">
          <OrangePill icon={<Share size={18} />} label={t('common.share')} {...bindTap<HTMLButtonElement>('detail.share-open', { params: { id: event.id } })} />
          <OrangePill icon={<Download size={18} />} label={t('eventDetail.saveImage')} {...action<HTMLButtonElement>('share.saveImage.tap', () => showToast(t('toast.saveImageUnavailable')))} />
          <OrangeCircle {...bindTap<HTMLButtonElement>('detail.album-open')} aria-label="album"><ImageIcon size={20} /></OrangeCircle>
          <OrangeCircle {...action<HTMLButtonElement>('detail.bigday.tap', () => showToast(t('toast.bigDayUnavailable')))} aria-label="big day"><Flag size={20} /></OrangeCircle>
          <OrangeCircle solid {...bindTap<HTMLButtonElement>('detail.subadd-open', { params: { parent: event.id }, beforeTrigger: () => clearDraft() })} aria-label="add sub"><Plus size={22} /></OrangeCircle>
        </div>

        {subEvents.length > 0 && (
          <div className="pb-8 pt-1">
            {subEvents.map((s) => (
              <EventRow key={s.id} event={s} openTrigger="detail.sub-open" />
            ))}
          </div>
        )}
      </div>

      {shareOpen && (
        <div className="absolute inset-0 z-[200] flex flex-col justify-end">
          <button {...bindBack<HTMLButtonElement>()} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 rounded-t-2xl bg-white pb-6 pt-4">
            <div className="mb-3 text-center text-sm text-[#9A9A9A]">{t('eventDetail.shareSheet')}</div>
            <div className="grid grid-cols-4 gap-2 px-4">
              <ShareIcon emoji="🖼️" label={t('eventDetail.saveImage')} {...action<HTMLButtonElement>('share.saveImage.tap', () => showToast(t('toast.saveImageUnavailable')))} />
              <ShareIcon emoji="💬" label={t('eventDetail.wechat')} {...action<HTMLButtonElement>('share.thirdparty.tap', () => showToast(t('toast.thirdPartyShare')))} />
              <ShareIcon emoji="📷" label={t('eventDetail.moments')} {...action<HTMLButtonElement>('share.thirdparty.tap', () => showToast(t('toast.thirdPartyShare')))} />
              <ShareIcon emoji="🔗" label={t('eventDetail.copyLink')} {...action<HTMLButtonElement>('share.thirdparty.tap', () => showToast(t('toast.thirdPartyShare')))} />
            </div>
            <div className="mt-3 border-t border-[#F2F1EC] pt-2">
              <SheetRow icon={<Archive size={20} />} label={t('common.archive')} {...action<HTMLButtonElement>('share.event.archive', () => { setArchived(event.id, true); showToast(t('toast.archived')); back(); }, { params: { eventId: event.id } })} />
              <SheetRow icon={<EyeOff size={20} />} label={t('eventForm.hide')} {...action<HTMLButtonElement>('share.hide.tap', () => showToast(t('toast.hideUnavailable')))} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrangePill({ icon, label, ...rest }: { icon: React.ReactNode; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F2A23C] px-3.5 py-2.5 text-[14px] font-medium text-white shadow-md active:bg-[#E0902C]">
      {icon}{label}
    </button>
  );
}

function OrangeCircle({ solid, children, ...rest }: { solid?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white shadow-md active:opacity-90 ${solid ? 'bg-[#F2A23C]' : 'bg-[#F2A23C]/85'}`}>
      {children}
    </button>
  );
}

function ShareIcon({ emoji, label, ...rest }: { emoji: string; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="flex flex-col items-center gap-1.5 py-2">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F2F1EC] text-2xl">{emoji}</span>
      <span className="text-[11px] text-[#6B6B6B]">{label}</span>
    </button>
  );
}

function SheetRow({ icon, label, ...rest }: { icon: React.ReactNode; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="flex w-full items-center gap-3 px-5 py-3 text-[15px] text-[#1A1A1A] active:bg-[#F2F1EC]">
      <span className="text-[#3E7CB1]">{icon}</span>
      {label}
    </button>
  );
}
