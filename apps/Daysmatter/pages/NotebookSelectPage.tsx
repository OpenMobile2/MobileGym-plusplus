import { Check, Plus } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import TopBar from '../components/TopBar';
import { useI18n } from '../i18n';

export default function NotebookSelectPage() {
  const { t } = useI18n();
  const { action, bindTap, back } = useDaysmatterGestures();
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const draft = useDaysmatterStore((s) => s._temp.draft);
  const patchDraft = useDaysmatterStore((s) => s.patchDraft);
  const selected = draft?.notebookId;
  const sorted = [...notebooks].sort((a, b) => a.order - b.order);

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('notebookSelect.title')} back solid />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <div className="mx-3 overflow-hidden rounded-xl bg-white">
          {sorted.map((n) => (
            <button
              key={n.id}
              {...action<HTMLButtonElement>('notebookSelect.item.pick', () => { patchDraft({ notebookId: n.id }); back(); }, { params: { notebookId: n.id } })}
              className="flex w-full items-center gap-3 border-b border-[#F2F1EC] px-4 py-3.5 text-left active:bg-[#F2F1EC]"
            >
              <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center text-[20px]">{n.icon}</span>
              <span className="flex-1 text-[16px] text-[#1A1A1A]">{n.name}</span>
              {selected === n.id && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3E7CB1]">
                  <Check size={15} className="text-white" />
                </span>
              )}
            </button>
          ))}
          <button
            {...bindTap<HTMLButtonElement>('notebookSelect.add-open')}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[#F2F1EC]"
          >
            <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#4CAF50]">
              <Plus size={18} className="text-white" />
            </span>
            <span className="flex-1 text-[16px] text-[#9A9A9A]">{t('notebookSelect.addNew')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
