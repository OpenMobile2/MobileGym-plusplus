// apps/GoogleDrive/pages/SearchResultsPage.tsx
// apps/GoogleDrive/pages/searchPages.tsx — 搜索入口 / 搜索结果 / 筛选弹层
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { FILTER_CHIPS, FILTER_TYPE_OPTIONS, FILTER_MODIFIED_OPTIONS } from '../constants';
import { IcSearch, IcClose, IcCheck, IcCalendar } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { BottomSheet, EmptyState, SortBar, showToast, type BindProps } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { useSortLabel, sortItems, matchItems, applyFilters, isSearchTypeSupported } from '../components/listing';

// ═══════════════════════════════════════════════════════════
// 筛选弹层（type / people / modified / customDate 四态）
// ═══════════════════════════════════════════════════════════
const FilterSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, go } = useGoogleDriveGestures();
  const filters = useGoogleDriveStore(st => st.searchFilters);
  const contacts = useGoogleDriveStore(st => st.contacts);
  const setFilter = useGoogleDriveStore(st => st.setSearchFilter);
  const [people, setPeople] = React.useState('');

  const kind = sp.get('filter');
  if (!kind) return null;

  // 筛选是 replace 叠在结果页上的，关闭必须清 filter 而不是 history.back（否则会退出整页搜索）
  const closeFilter = () => go('googledrive.results.filter.close');
  const pickAndClose = (fn: () => void) => { fn(); closeFilter(); };

  const header = (
    <div className="flex items-center gap-2 px-2 py-2" style={{ borderBottom: `1px solid ${GD.divider}` }}>
      <button
        {...bindTap('googledrive.results.filter.close')}
        className="w-10 h-10 flex items-center justify-center"
        aria-label={s.a11y_close}
      >
        <IcClose size={20} color={GD.text} />
      </button>
      <span className="text-[16px]" style={{ color: GD.text }}>
        {kind === 'type' ? s.filter_type : kind === 'people' ? s.filter_people : s.filter_modified}
      </span>
    </div>
  );

  const Option: React.FC<{ label: string; on: boolean; bind: BindProps; onClick: () => void }> =
    ({ label, on, bind, onClick }) => (
      <button {...bind} onClick={onClick} className="w-full flex items-center gap-4 px-4 h-14 text-left active:bg-black/5">
        <span className="w-5 shrink-0">{on && <IcCheck size={18} color={GD.blue} />}</span>
        <span className="text-[15px]" style={{ color: on ? GD.blue : GD.text }}>{label}</span>
      </button>
    );

  if (kind === 'type') {
    return (
      <BottomSheet header={header}>
        {FILTER_TYPE_OPTIONS.map(o => {
          const supported = isSearchTypeSupported(o.id);
          return (
            <Option
              key={o.id}
              label={s[o.labelKey as keyof typeof s]}
              on={filters.type === o.id}
              bind={{ 'data-action': 'googledrive.search.select.type', 'data-action-params': JSON.stringify({ value: o.id }) }}
              onClick={() => {
                if (!supported) {
                  showToast(s.toast_feature_unavailable);
                  return;
                }
                pickAndClose(() => setFilter('type', filters.type === o.id ? null : o.id));
              }}
            />
          );
        })}
      </BottomSheet>
    );
  }

  if (kind === 'people') {
    const hits = contacts.filter(c =>
      people.trim() === '' || c.name.toLowerCase().includes(people.toLowerCase()) || c.email.includes(people));
    return (
      <BottomSheet header={header}>
        <div className="px-4 py-3">
          <input
            data-action="googledrive.search.filterPeopleInput"
            value={people}
            onChange={e => setPeople(e.target.value)}
            placeholder={s.filter_people_placeholder}
            className="w-full text-[15px] outline-none pb-1"
            style={{ color: GD.text, borderBottom: `1px solid ${GD.divider}` }}
          />
        </div>
        {hits.length === 0 ? (
          <div className="px-4 py-6 text-[14px]" style={{ color: GD.textSecondary }}>{s.filter_people_no_match}</div>
        ) : hits.map(c => (
          <button
            key={c.id}
            data-action="googledrive.search.select.people"
            data-action-params={JSON.stringify({ value: c.id })}
            // 人员筛选是边输入边选，键盘一直是弹起的：不声明就要点两下才选中
            data-keep-keyboard="true"
            onClick={() => pickAndClose(() => setFilter('people', c.name))}
            className="w-full flex items-center gap-3 px-4 h-16 text-left active:bg-black/5"
          >
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[14px]" style={{ background: c.color }}>
              {c.name.slice(0, 1)}
            </span>
            <span className="min-w-0">
              <span className="block text-[15px] truncate" style={{ color: GD.text }}>{c.name}</span>
              <span className="block text-[12px] truncate" style={{ color: GD.textSecondary }}>{c.email}</span>
            </span>
          </button>
        ))}
      </BottomSheet>
    );
  }

  if (kind === 'customDate') {
    return (
      <BottomSheet header={header}>
        <div className="px-4 py-6 flex flex-col items-center gap-4">
          <IcCalendar size={48} color={GD.divider} />
          <div className="text-[14px] text-center" style={{ color: GD.textSecondary }}>{s.filter_modified_custom}</div>
          <button
            data-action="googledrive.search.applyCustomDate"
            data-action-params={JSON.stringify({ value: 'custom' })}
            onClick={() => pickAndClose(() => setFilter('modified', 'custom'))}
            className="px-5 h-10 rounded-full text-[14px] text-white"
            style={{ background: GD.blue }}
          >
            {s.dialog_create}
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet header={header}>
      {FILTER_MODIFIED_OPTIONS.map(o => (
        o.id === 'custom' ? (
          <button
            key={o.id}
            {...bindTap('googledrive.results.filter.customDate')}
            className="w-full flex items-center gap-4 px-4 h-14 text-left active:bg-black/5"
          >
            <span className="w-5 shrink-0" />
            <span className="text-[15px]" style={{ color: GD.text }}>{s[o.labelKey as keyof typeof s]}</span>
          </button>
        ) : (
          <Option
            key={o.id}
            label={s[o.labelKey as keyof typeof s]}
            on={filters.modified === o.id}
            bind={{ 'data-action': 'googledrive.search.select.modified', 'data-action-params': JSON.stringify({ value: o.id }) }}
            onClick={() => pickAndClose(() => setFilter('modified', filters.modified === o.id ? null : o.id))}
          />
        )
      ))}
    </BottomSheet>
  );
};


// ═══════════════════════════════════════════════════════════
// 搜索结果（IMG_2271 结果 / IMG_2274 无结果）
// ═══════════════════════════════════════════════════════════
export const SearchResultsPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindBack, bindTap } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const trashed = useGoogleDriveStore(st => st.trashedIds);
  const filters = useGoogleDriveStore(st => st.searchFilters);
  const searchSort = useGoogleDriveStore(st => st.searchSort);
  const view = useGoogleDriveStore(st => st.view);
  const setView = useGoogleDriveStore(st => st.setView);
  const clearFilters = useGoogleDriveStore(st => st.clearSearchFilters);
  const sortLabel = useSortLabel();

  const q = sp.get('q') ?? '';
  const rows = useMemo(() => {
    // 空关键字 + 筛选：在全库上筛（从入口 chip 点进来时常无 q）
    const matched = q.trim()
      ? matchItems(items, trashed, q)
      : Object.values(items).filter(it => !trashed.includes(it.id));
    return sortItems(applyFilters(matched, filters), searchSort);
  }, [items, trashed, q, filters, searchSort]);
  const activeFilters = [filters.type, filters.people, filters.modified].filter(Boolean).length;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 8 }}>
        <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_back}>
          <span className="text-[24px] leading-none" style={{ color: GD.text }}>‹</span>
        </button>
        <span className="flex-1 text-[16px] truncate" style={{ color: GD.text }}>{q}</span>
        <IcSearch size={20} color={GD.textSecondary} />
      </div>

      <div className="flex gap-2 px-4 pb-3 shrink-0 overflow-x-auto" data-scroll-container="chips" data-scroll-direction="horizontal">
        {FILTER_CHIPS.map(chip => {
          const value = filters[chip.id as 'type' | 'people' | 'modified'];
          const on = Boolean(value);
          const bind = chip.id === 'type'
            ? bindTap('googledrive.results.filter.type')
            : chip.id === 'people'
              ? bindTap('googledrive.results.filter.people')
              : bindTap('googledrive.results.filter.modified');
          return (
            <button
              key={chip.id}
              {...bind}
              className="h-8 px-3 rounded-full text-[13px] flex items-center gap-1 shrink-0"
              style={{
                border: `1px solid ${on ? GD.blue : GD.divider}`,
                background: on ? GD.blueSurface : 'transparent',
                color: on ? GD.blue : GD.text,
              }}
            >
              {on && <IcCheck size={13} color={GD.blue} />}
              {s[chip.labelKey as keyof typeof s]}
            </button>
          );
        })}
        {activeFilters > 0 && (
          <button
            data-action="googledrive.search.clearFilters"
            onClick={() => { clearFilters(); showToast(s.toast_filters_cleared); }}
            className="h-8 px-3 rounded-full text-[13px] shrink-0"
            style={{ color: GD.blue }}
          >
            {s.search_clear_filters}
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={IcSearch} title={s.search_no_results_title} desc={s.search_no_results_desc} />
      ) : (
        <>
          <SortBar
            label={sortLabel(searchSort)}
            order={searchSort.order}
            view={view}
            sortProps={bindTap('googledrive.results.sortmenu.open')}
            onToggleView={() => setView(view === 'list' ? 'grid' : 'list')}
            toggleA11y={view === 'list' ? s.a11y_switch_to_grid : s.a11y_switch_to_list}
          />
          <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
            <ItemListing
              rows={rows}
              view={view}
              makeTapProps={item => (
                item.kind === 'folder'
                  ? bindTap('googledrive.folder.enter', { params: { id: item.id } })
                  : bindTap('googledrive.preview.open', { params: { id: item.id } })
              )}
              makeMenuProps={item => (
                item.kind === 'folder'
                  ? bindTap('googledrive.results.foldermenu.open', { params: { item: item.id }, stopPropagation: true })
                  : bindTap('googledrive.results.filemenu.open', { params: { item: item.id }, stopPropagation: true })
              )}
            />
            <div className="h-10" />
          </div>
        </>
      )}
      <FilterSheet />
    </div>
  );
};
