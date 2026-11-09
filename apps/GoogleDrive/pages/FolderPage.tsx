// apps/GoogleDrive/pages/FolderPage.tsx — 文件夹内容（IMG_2243 / 2248）
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcSearch, IcMore, IcClose, IcFolderOpen } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SortBar } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { useChildren, useSortLabel } from '../components/listing';

export const FolderPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const { bindTap, bindLongPress, bindBack } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const view = useGoogleDriveStore(st => st.view);
  const sort = useGoogleDriveStore(st => st.sort);
  const setView = useGoogleDriveStore(st => st.setView);
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const selectAll = useGoogleDriveStore(st => st.selectAll);
  const toggleSelect = useGoogleDriveStore(st => st.toggleSelect);
  const rows = useChildren(id);
  const sortLabel = useSortLabel();

  const folder = items[id];
  const selectMode = sp.get('select') === '1';

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      {selectMode ? (
        <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 4 }}>
          <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.selection_clear}>
            <IcClose size={22} color={GD.text} />
          </button>
          <span className="text-[16px] flex-1 ml-1" style={{ color: GD.text }}>
            {s.selection_count.replace('{n}', String(selected.length))}
          </span>
          <button
            data-action="googledrive.selection.selectAll"
            onClick={() => selectAll(rows.map(r => r.id))}
            className="w-11 h-11 flex items-center justify-center"
            aria-label={s.a11y_select_all}
          >
            <span className="w-5 h-5 rounded-sm" style={{ border: `2px dashed ${GD.textSecondary}` }} />
          </button>
          <button {...bindTap('googledrive.folder.selection.menu', { params: { id } })} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_more}>
            <IcMore size={20} color={GD.text} />
          </button>
        </div>
      ) : (
        <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 4 }}>
          <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_back}>
            <span className="text-[24px] leading-none" style={{ color: GD.text }}>‹</span>
          </button>
          <span className="text-[18px] flex-1 truncate ml-1" style={{ color: GD.text }}>{folder?.name ?? ''}</span>
          <button {...bindTap('googledrive.search.open')} className="w-11 h-11 flex items-center justify-center" aria-label={s.search_title}>
            <IcSearch size={20} color={GD.text} />
          </button>
          <button
            {...bindTap('googledrive.folder.foldermenu.open', { params: { id, item: id }, stopPropagation: true })}
            className="w-11 h-11 flex items-center justify-center"
            aria-label={s.a11y_more}
          >
            <IcMore size={20} color={GD.text} />
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState icon={IcFolderOpen} title={s.folder_empty_title} desc={s.folder_empty_desc} />
      ) : (
        <>
          {!selectMode && (
            <SortBar
              label={sortLabel(sort)}
              order={sort.order}
              view={view}
              sortProps={bindTap('googledrive.folder.sortmenu.open', { params: { id } })}
              onToggleView={() => setView(view === 'list' ? 'grid' : 'list')}
              toggleA11y={view === 'list' ? s.a11y_switch_to_grid : s.a11y_switch_to_list}
            />
          )}
          <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
            <ItemListing
              rows={rows}
              view={view}
              selectMode={selectMode}
              makeTapProps={item => (item.kind === 'folder'
                ? bindTap('googledrive.folder.enter', { params: { id: item.id } })
                : bindTap('googledrive.preview.open', { params: { id: item.id } }))}
              makeMenuProps={item => (item.kind === 'folder'
                ? bindTap('googledrive.folder.foldermenu.open', { params: { id, item: item.id }, stopPropagation: true })
                : bindTap('googledrive.folder.filemenu.open', { params: { id, item: item.id }, stopPropagation: true }))}
              makeLongPressProps={item => bindLongPress('googledrive.folder.selection.enter', { params: { id, item: item.id }, beforeTrigger: () => toggleSelect(item.id) })}
            />
            <div className="h-24" />
          </div>
        </>
      )}
    </div>
  );
};
