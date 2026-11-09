// apps/GoogleDrive/pages/StarredPage.tsx — 已加星标（空态 IMG_2240 / 有内容 IMG_2292）
import React from 'react';
import { IcStar } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SortBar } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { useItemsByIds, useSortLabel } from '../components/listing';

export const StarredPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const starredIds = useGoogleDriveStore(st => st.starredIds);
  const view = useGoogleDriveStore(st => st.view);
  const sort = useGoogleDriveStore(st => st.sort);
  const setView = useGoogleDriveStore(st => st.setView);
  const rows = useItemsByIds(starredIds);
  const sortLabel = useSortLabel();

  if (rows.length === 0) {
    return <EmptyState icon={IcStar} title={s.starred_empty_title} desc={s.starred_empty_desc} />;
  }

  return (
    <div className="flex flex-col h-full">
      <SortBar
        label={sortLabel(sort)}
        order={sort.order}
        view={view}
        sortProps={bindTap('googledrive.starred.sortmenu.open')}
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
              ? bindTap('googledrive.starred.foldermenu.open', { params: { item: item.id }, stopPropagation: true })
              : bindTap('googledrive.starred.filemenu.open', { params: { item: item.id }, stopPropagation: true })
          )}
        />
        <div className="h-24" />
      </div>
    </div>
  );
};
