import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check, Book, Heart, BookOpen, Image as ImageIcon, Plus, ChevronDown } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { NOTEBOOK_ICONS, NOTEBOOK_COVERS } from '../constants';
import TopBar from '../components/TopBar';
import CoverThumb from '../components/CoverThumb';
import { useI18n, optionLabel } from '../i18n';

const PRO_ICONS = ['🏔️', '🌙', '🏠', '📚', '🚀', '☕'];

export default function NotebookAddPage() {
  const { t } = useI18n();
  const location = useLocation();
  const nbid = new URLSearchParams(location.search).get('nbid');
  const { action, back } = useDaysmatterGestures();
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const addNotebook = useDaysmatterStore((s) => s.addNotebook);
  const updateNotebook = useDaysmatterStore((s) => s.updateNotebook);
  const showToast = useDaysmatterStore((s) => s.showToast);

  const existing = nbid ? notebooks.find((n) => n.id === nbid) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [icon, setIcon] = useState(existing?.icon ?? NOTEBOOK_ICONS[0]);
  const [cover, setCover] = useState(existing?.cover ?? 'cover_work');

  function save() {
    if (existing) {
      updateNotebook(existing.id, { name: name.trim() || existing.name, icon, cover });
      showToast(t('toast.updated'));
    } else {
      addNotebook({ name: name.trim() || t('notebook.newDefault'), icon, cover });
      showToast(t('toast.created'));
    }
    back();
  }

  const saveProps = action<HTMLButtonElement>('notebookAdd.form.save', save);

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={existing ? t('notebookAdd.edit') : t('notebookAdd.add')} back solid right={
        <button {...saveProps} className="px-2 text-[16px] text-white">{t('common.save')}</button>
      } />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3.5">
          <Book size={20} className="flex-shrink-0 text-[#9A9A9A]" />
          <input
            {...action<HTMLInputElement>('notebookAdd.name.input', () => {})}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('notebookAdd.namePlaceholder')}
            className="flex-1 text-[16px] outline-none placeholder:text-[#B8B8B8]"
          />
        </div>

        <div className="mt-3 rounded-xl bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-[15px] text-[#1A1A1A]">
            <Heart size={18} className="text-[#9A9A9A]" /> {t('notebookAdd.pickIcon')}
          </div>
          <div className="grid grid-cols-6 gap-2.5">
            {NOTEBOOK_ICONS.map((ic) => (
              <button
                key={ic}
                {...action<HTMLButtonElement>('notebookAdd.icon.pick', () => setIcon(ic), { params: { value: ic } })}
                className={`flex h-11 items-center justify-center rounded-xl text-[24px] ${icon === ic ? 'bg-[#3E7CB1]/12 ring-2 ring-[#3E7CB1]' : ''}`}
              >
                {ic}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#F2F1EC] pt-3">
            <span className="rounded bg-[#E0524D] px-1.5 py-0.5 text-[10px] font-bold text-white">Pro</span>
            <span className="text-[13px] text-[#9A9A9A]">{t('notebookAdd.proIcons')}</span>
          </div>
          <div className="mt-2 grid grid-cols-6 gap-2.5 opacity-40">
            {PRO_ICONS.map((ic, i) => (
              <span key={i} className="flex h-11 items-center justify-center text-[24px] grayscale">{ic}</span>
            ))}
          </div>
          <button {...action<HTMLButtonElement>('notebookAdd.iconPro.tap', () => showToast(t('toast.iconsPro')))}
            className="mx-auto mt-1 flex items-center gap-1 text-[13px] text-[#9A9A9A]">
            {t('notebookAdd.moreIcons')} <ChevronDown size={14} />
          </button>
        </div>

        <div className="mt-3 rounded-xl bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-[15px] text-[#1A1A1A]">
            <BookOpen size={18} className="text-[#9A9A9A]" /> {t('notebookAdd.pickCover')}
          </div>
          <div className="grid grid-cols-4 gap-2.5">
            <button
              {...action<HTMLButtonElement>('notebookAdd.cover.pick', () => showToast(t('toast.blankCoverPro')), { params: { value: 'blank' } })}
              className="relative flex aspect-[3/4] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#D8D6D0] text-[#B0B0B0]"
            >
              <span className="absolute right-1 top-1 rounded bg-[#E0524D] px-1 py-0.5 text-[9px] font-bold text-white">Pro</span>
              <Plus size={22} />
              <span className="mt-1 text-[11px]">{optionLabel(t, 'cover', 'blank')}</span>
            </button>
            {NOTEBOOK_COVERS.filter((c) => c.id !== 'blank').map((c) => (
              <button
                key={c.id}
                {...action<HTMLButtonElement>('notebookAdd.cover.pick', () => setCover(c.id), { params: { value: c.id } })}
                className={`relative aspect-[3/4] overflow-hidden rounded-lg ${cover === c.id ? 'ring-2 ring-[#3E7CB1] ring-offset-1' : ''}`}
              >
                <CoverThumb cover={c.id} className="h-full w-full" rounded="rounded-lg" />
                {cover === c.id && <span className="absolute right-1 top-1 rounded-full bg-[#3E7CB1] p-0.5 text-white"><Check size={11} /></span>}
              </button>
            ))}
          </div>
        </div>

        <button
          {...action<HTMLButtonElement>('notebookAdd.bg.tap', () => showToast(t('toast.customBgPro')))}
          className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3.5 text-left active:bg-[#F2F1EC]"
        >
          <ImageIcon size={20} className="flex-shrink-0 text-[#9A9A9A]" />
          <span className="flex-1">
            <span className="flex items-center gap-1.5 text-[15px] text-[#1A1A1A]">{t('notebookAdd.chooseBg')} <span className="rounded bg-[#E0524D] px-1.5 py-0.5 text-[10px] font-bold text-white">Pro</span></span>
            <span className="mt-0.5 block text-[12px] text-[#9A9A9A]">{t('notebookAdd.addBgHint')}</span>
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8D6D0] text-[#9A9A9A]"><Plus size={18} /></span>
        </button>

        <button {...saveProps} className="mb-4 mt-4 w-full rounded-full bg-[#5B9BD5] py-3.5 text-center text-[17px] font-semibold text-white shadow-md active:bg-[#4A90D9]">
          {t('common.save')}
        </button>
      </div>
    </div>
  );
}
