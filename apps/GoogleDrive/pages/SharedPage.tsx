// apps/GoogleDrive/pages/SharedPage.tsx — 共享内容（别人分享给我的文件）
import React, { useMemo } from 'react';
import { IcTabShared } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SortBar, useDateFormat } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { sortItems, useSortLabel } from '../components/listing';

export const SharedPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const trashed = useGoogleDriveStore(st => st.trashedIds);
  const contacts = useGoogleDriveStore(st => st.contacts);
  const view = useGoogleDriveStore(st => st.view);
  const sort = useGoogleDriveStore(st => st.sort);
  const setView = useGoogleDriveStore(st => st.setView);
  const sortLabel = useSortLabel();
  const fmt = useDateFormat();

  // 「别人分享给我」：有 ownerName，或标记为共享文件夹；不含回收站
  const rows = useMemo(
    () => sortItems(
      Object.values(items).filter(
        it => !trashed.includes(it.id) && (Boolean(it.ownerName) || it.sharedFolder),
      ),
      sort,
    ),
    [items, trashed, sort],
  );

  if (rows.length === 0) {
    return <EmptyState icon={IcTabShared} title={s.shared_empty_title} desc={s.shared_empty_desc} />;
  }

  return (
    <div className="flex flex-col h-full">
      <SortBar
        label={sortLabel(sort)}
        order={sort.order}
        view={view}
        sortProps={bindTap('googledrive.shared.sortmenu.open')}
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
              ? bindTap('googledrive.shared.foldermenu.open', { params: { item: item.id }, stopPropagation: true })
              : bindTap('googledrive.shared.filemenu.open', { params: { item: item.id }, stopPropagation: true })
          )}
          subtitleOf={(item) => {
            const email = contacts.find(c => c.name === item.ownerName)?.email;
            const who = email || item.ownerName || '';
            return `${who} · ${fmt(item.modifiedAt)}`;
          }}
        />
        <div className="h-24" />
      </div>
    </div>
  );
};
