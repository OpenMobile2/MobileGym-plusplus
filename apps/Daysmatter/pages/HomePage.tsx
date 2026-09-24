import { useLocation } from 'react-router-dom';
import { Menu, Search, Plus, Camera, Pencil, Share2, Archive, Pin, Star, Globe, Send, Trash2 } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { dayInfo, phrase, dateLabel } from '../utils/dayMath';
import type { DMEvent } from '../types';
import EventRow, { DayPill } from '../components/EventRow';
import CoverThumb from '../components/CoverThumb';
import { bgUrl } from '../assets';
import { useI18n } from '../i18n';

function sortEvents(events: DMEvent[], sortBy: string, locale: string): DMEvent[] {
  const arr = [...events];
  arr.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sortBy === 'createTime') return b.createdAt - a.createdAt;
    if (sortBy === 'name') return a.title.localeCompare(b.title, locale === 'en' ? 'en' : 'zh');
    return Math.abs(dayInfo(a).diff) - Math.abs(dayInfo(b).diff);
  });
  return arr;
}

export default function HomePage() {
  const { t, locale } = useI18n();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const drawerOpen = sp.get('drawer') === 'open';
  const rowMenuOpen = sp.get('menu') === 'row';
  const rowEid = sp.get('eid') ?? '';

  const { bindTap, action, bindBack, back } = useDaysmatterGestures();

  const events = useDaysmatterStore((s) => s.events);
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const filter = useDaysmatterStore((s) => s.filter);
  const sortBy = useDaysmatterStore((s) => s.settings.sortBy);
  const setFilter = useDaysmatterStore((s) => s.setFilter);
  const setArchived = useDaysmatterStore((s) => s.setArchived);
  const togglePin = useDaysmatterStore((s) => s.togglePin);
  const deleteEvent = useDaysmatterStore((s) => s.deleteEvent);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const clearDraft = useDaysmatterStore((s) => s.clearDraft);

  const nbById = (id: string) => notebooks.find((n) => n.id === id);

  const visible = events.filter((e) => {
    if (e.archived) return false;
    if (e.parentId) return false;
    if (filter.kind === 'home') return e.showOnHome;
    if (filter.kind === 'notebook') return e.notebookId === filter.notebookId;
    return true;
  });
  const list = sortEvents(visible, sortBy, locale);
  const featured = list[0];

  const title = filter.kind === 'home' ? t('home.title') : filter.kind === 'all' ? t('common.all') : nbById(filter.notebookId)?.name ?? t('home.title');

  const rowEvent = events.find((e) => e.id === rowEid);
  const woodDark = bgUrl('bg_wood_dark');

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <div className="flex h-[84px] flex-shrink-0 items-center bg-[#3E7CB1] px-2 pt-10 text-white">
        <button {...bindTap<HTMLButtonElement>('home.drawer-open')} className="p-1.5" aria-label="menu">
          <Menu size={24} />
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold">{title}</div>
        <button {...action<HTMLButtonElement>('home.camera.tap', () => showToast(t('toast.cameraUnavailable')))} className="p-1.5" aria-label="camera">
          <Camera size={22} />
        </button>
        <button {...bindTap<HTMLButtonElement>('home.add-open', { beforeTrigger: () => clearDraft() })} className="p-1.5" aria-label="add">
          <Plus size={24} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto no-scrollbar">
        {featured && (
          <div
            {...bindTap<HTMLDivElement>('home.item-open', { params: { id: featured.id } })}
            className="flex items-center justify-between bg-white px-5 pb-4 pt-3 active:bg-[#F7F6F2]"
          >
            <div className="min-w-0">
              <div className="text-[15px] text-[#9A9A9A]">{phrase(dayInfo(featured), locale)}</div>
              <div className="mt-1 truncate text-[13px] text-[#B8B8B8]">
                {dayInfo(featured).state === 'past' ? t('common.startDate') : t('common.targetDate')}:{' '}
                {dateLabel(featured.targetDate, featured.calendar, locale).replace(t('day.lunarPrefix'), '')}
              </div>
            </div>
            <div className="flex flex-shrink-0 items-start pl-3">
              <span className="text-[64px] font-bold leading-none text-[#1A1A1A]">
                {dayInfo(featured).state === 'today' ? 0 : dayInfo(featured).count}
              </span>
              <span className="ml-1 mt-1 rounded bg-[#E8543F] px-1.5 py-0.5 text-[11px] font-bold text-white">{t('common.days')}</span>
            </div>
          </div>
        )}

        <div className="px-3 py-2.5">
          <button
            {...bindTap<HTMLButtonElement>('home.search-open')}
            className="flex w-full items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[14px] text-[#B0B0B0] shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:bg-[#F2F1EC]"
          >
            <Search size={16} /> {t('common.search')}
          </button>
        </div>

        {list.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-[#9A9A9A]">
            <span className="text-5xl">🗓️</span>
            <p className="mt-3 text-sm">{t('home.empty')}</p>
          </div>
        ) : (
          <div className="pb-3">
            {list.map((e) => (
              <EventRow key={e.id} event={e} openTrigger="home.item-open" longPressTrigger="home.rowMenu-open" />
            ))}
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="absolute inset-0 z-[200] flex">
          <div
            className="relative flex h-full w-[82%] flex-col pt-12"
            style={woodDark ? { backgroundImage: `url(${woodDark})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#5A4632' }}
          >
            <div className="absolute inset-0 bg-black/25" />
            <div className="relative flex-1 space-y-3 overflow-y-auto px-3 py-2 no-scrollbar">
              <DrawerPanel>
                <DrawerRow icon={<Send size={18} />} label={t('home.airtrans')}
                  {...action<HTMLButtonElement>('drawer.airtrans.tap', () => showToast(t('toast.airtransUnavailable')))} />
              </DrawerPanel>

              <DrawerPanel>
                <DrawerRow icon={<Star size={18} />} label={t('home.drawerHome')} active={filter.kind === 'home'}
                  {...action<HTMLButtonElement>('drawer.filter.select.home', () => { setFilter({ kind: 'home' }); back(); })} />
                <DrawerRow icon={<Globe size={18} />} label={t('common.all')} active={filter.kind === 'all'}
                  {...action<HTMLButtonElement>('drawer.filter.select.all', () => { setFilter({ kind: 'all' }); back(); })} />
                {[...notebooks].sort((a, b) => a.order - b.order).map((n) => (
                  <DrawerRow key={n.id} emoji={n.icon} label={n.name}
                    active={filter.kind === 'notebook' && filter.notebookId === n.id}
                    {...action<HTMLButtonElement>('drawer.filter.select.notebook', () => { setFilter({ kind: 'notebook', notebookId: n.id }); back(); }, { params: { notebookId: n.id } })} />
                ))}
              </DrawerPanel>

              <DrawerPanel>
                <DrawerRow icon={<Pencil size={18} />} label={t('home.manageNotebooks')}
                  {...bindTap<HTMLButtonElement>('notebook.manage-open')} />
              </DrawerPanel>
            </div>
          </div>
          <button {...bindBack<HTMLButtonElement>()} className="h-full flex-1 bg-black/40" aria-label="close" />
        </div>
      )}

      {rowMenuOpen && rowEvent && (
        <div className="absolute inset-0 z-[200] flex flex-col justify-end">
          <button {...bindBack<HTMLButtonElement>()} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 mx-3 mb-3 overflow-hidden rounded-2xl bg-white">
            <div className="flex items-center justify-between border-b border-[#F2F1EC] px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <CoverThumb cover={nbById(rowEvent.notebookId)?.cover ?? 'cover_life'} icon={nbById(rowEvent.notebookId)?.icon} className="h-9 w-9" rounded="rounded-lg" />
                <span className="truncate text-[15px] font-medium">{rowEvent.title}</span>
              </div>
              <DayPill event={rowEvent} />
            </div>
            <RowAction icon={<Pencil size={20} />} label={t('common.edit')} {...bindTap<HTMLButtonElement>('rowMenu.edit-open', { params: { id: rowEvent.id }, beforeTrigger: () => clearDraft() })} />
            <RowAction icon={<Share2 size={20} />} label={t('common.share')} {...bindTap<HTMLButtonElement>('rowMenu.share-open', { params: { id: rowEvent.id } })} />
            <RowAction icon={<Pin size={20} />} label={rowEvent.pinned ? t('common.unpin') : t('common.pin')} {...action<HTMLButtonElement>('rowMenu.event.pin', () => { togglePin(rowEvent.id); back(); })} />
            <RowAction icon={<Archive size={20} />} label={t('common.archive')} {...action<HTMLButtonElement>('rowMenu.event.archive', () => { setArchived(rowEvent.id, true); showToast(t('toast.archived')); back(); }, { params: { eventId: rowEvent.id } })} />
            <RowAction icon={<Trash2 size={20} />} label={t('common.delete')} danger last {...action<HTMLButtonElement>('rowMenu.event.delete', () => { deleteEvent(rowEvent.id); showToast(t('toast.deleted')); back(); }, { params: { eventId: rowEvent.id } })} />
          </div>
          <button {...bindBack<HTMLButtonElement>()} className="relative z-10 mx-3 mb-3 rounded-2xl bg-white py-3.5 text-center text-[16px] font-medium text-[#3E7CB1]">
            {t('common.cancel')}
          </button>
        </div>
      )}
    </div>
  );
}

function DrawerPanel({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl bg-[#4A3826]/80 backdrop-blur-sm">{children}</div>;
}

function DrawerRow({ icon, emoji, label, active, ...rest }: { icon?: React.ReactNode; emoji?: string; label: string; active?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="flex w-full items-center gap-3 border-b border-white/10 px-4 py-3 text-left text-[15px] text-white last:border-b-0 active:bg-white/10">
      <span className="flex w-5 flex-shrink-0 justify-center">{emoji ? <span className="text-[17px]">{emoji}</span> : icon}</span>
      <span className="flex-1">{label}</span>
      {active && <span className="text-white">✓</span>}
    </button>
  );
}

function RowAction({ icon, label, danger, last, ...rest }: { icon: React.ReactNode; label: string; danger?: boolean; last?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`flex w-full items-center gap-3 px-4 py-3.5 text-[15px] active:bg-[#F2F1EC] ${last ? '' : 'border-b border-[#F2F1EC]'} ${danger ? 'text-[#E0524D]' : 'text-[#1A1A1A]'}`}>
      <span className={danger ? 'text-[#E0524D]' : 'text-[#3E7CB1]'}>{icon}</span>
      {label}
    </button>
  );
}
