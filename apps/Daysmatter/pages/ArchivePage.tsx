import { RotateCcw } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { dayInfo, phrase, dateLabel } from '../utils/dayMath';
import TopBar from '../components/TopBar';
import CoverThumb from '../components/CoverThumb';
import { useI18n } from '../i18n';

export default function ArchivePage() {
  const { t, locale } = useI18n();
  const { bindTap, action } = useDaysmatterGestures();
  const events = useDaysmatterStore((s) => s.events);
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const setArchived = useDaysmatterStore((s) => s.setArchived);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const archived = events.filter((e) => e.archived);

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('archive.title')} back solid />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {archived.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-[#9A9A9A]">
            <span className="text-5xl">🗄️</span>
            <p className="mt-3 text-sm">{t('archive.empty')}</p>
          </div>
        ) : (
          archived.map((e) => {
            const nb = notebooks.find((n) => n.id === e.notebookId);
            const info = dayInfo(e);
            return (
              <div key={e.id} className="mx-3 mb-2.5 flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3">
                <CoverThumb cover={nb?.cover ?? 'cover_life'} icon={nb?.icon} className="h-10 w-10" rounded="rounded-lg" />
                <button {...bindTap<HTMLButtonElement>('archive.item-open', { params: { id: e.id } })} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-[15px] font-medium text-[#1A1A1A]">{e.title}</div>
                  <div className="truncate text-xs text-[#9A9A9A]">{phrase(info, locale)} {info.count} {t('common.days')} · {dateLabel(e.targetDate, e.calendar, locale)}</div>
                </button>
                <button {...action<HTMLButtonElement>('archive.item.restore', () => { setArchived(e.id, false); showToast(t('toast.restored')); }, { params: { eventId: e.id } })} className="flex items-center gap-1 rounded-full bg-[#3E7CB1]/10 px-3 py-1.5 text-xs text-[#3E7CB1]">
                  <RotateCcw size={14} /> {t('common.restore')}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
