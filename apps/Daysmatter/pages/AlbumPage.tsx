import { useState } from 'react';
import { Plus, ChevronLeft, Cloud, LayoutGrid, AlignJustify, GalleryThumbnails } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { bgUrl } from '../assets';
import { todayMidnight, DAY } from '../utils/dayMath';
import { useI18n } from '../i18n';

const START = Date.UTC(2025, 5, 7);

export default function AlbumPage() {
  const { t } = useI18n();
  const { action, bindBack } = useDaysmatterGestures();
  const showToast = useDaysmatterStore((s) => s.showToast);
  const [tab, setTab] = useState('all');
  const wood = bgUrl('bg_wood_light');
  const days = Math.max(1, Math.round((todayMidnight() - START) / DAY));

  const tabs = [
    { id: 'all', label: t('album.tabAll'), icon: LayoutGrid },
    { id: 'timeline', label: t('album.tabTimeline'), icon: AlignJustify },
    { id: 'anniv', label: t('album.tabAnniv'), icon: GalleryThumbnails },
  ];

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#D9A066] bg-cover bg-center pt-10"
      style={wood ? { backgroundImage: `url(${wood})` } : undefined}>
      <div className="flex flex-shrink-0 items-center px-2 py-1 text-white">
        <button {...bindBack<HTMLButtonElement>()} className="p-1" aria-label="back"><ChevronLeft size={26} /></button>
        <div className="flex-1 text-center leading-tight">
          <div className="text-[15px] font-semibold">{t('album.camTitle')}</div>
          <div className="text-[13px] opacity-90">{t('album.title')}</div>
        </div>
        <span className="w-8" />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden rounded-t-2xl bg-white">
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-[16px] text-[#6B6B6B]"><Cloud size={18} className="text-[#B0B0B0]" />{t('album.already')}</div>
            <div className="mt-1 text-[12px] text-[#9A9A9A]">{t('album.startDateSample')}</div>
          </div>
          <div className="flex items-end gap-1.5">
            <span className="text-[52px] font-bold leading-none text-[#3A3A3A]">{days}</span>
            <span className="mb-1.5 rounded bg-[#E0524D] px-1.5 py-0.5 text-[11px] font-bold text-white">{t('common.days')}</span>
          </div>
        </div>

        <div className="flex border-b border-[#F0EFEA]">
          {tabs.map((tabItem) => {
            const Icon = tabItem.icon;
            const active = tab === tabItem.id;
            return (
              <button key={tabItem.id} {...action<HTMLButtonElement>('album.tab.pick', () => setTab(tabItem.id), { params: { value: tabItem.id } })}
                className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-[15px] ${active ? 'font-semibold text-[#3E7CB1]' : 'text-[#9A9A9A]'}`}>
                <Icon size={16} className={active ? 'text-[#3E7CB1]' : 'text-[#B0B0B0]'} />{tabItem.label}
              </button>
            );
          })}
        </div>

        <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto p-4 no-scrollbar">
          <button {...action<HTMLButtonElement>('album.addPhoto.tap', () => showToast(t('toast.addPhotoUnavailable')))}
            className="flex aspect-square w-[31%] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D8D6D0] text-[#C4C4C4] active:bg-[#F7F6F2]">
            <Plus size={28} />
          </button>
          <div className="mt-16 flex flex-col items-center">
            <p className="text-[16px] text-[#9A9A9A]">{t('album.addImportant')}</p>
            <p className="mt-1 text-[16px] text-[#9A9A9A]">{t('album.dontForget')}</p>
            <button {...action<HTMLButtonElement>('album.addPhoto.tap', () => showToast(t('toast.addPhotoUnavailable')))}
              className="mt-7 flex items-center gap-1.5 rounded-full bg-[#E89A4C] px-6 py-3 text-[16px] font-medium text-white shadow-md active:bg-[#D98A3C]">
              <Plus size={20} /> {t('album.addFirstPhoto')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
