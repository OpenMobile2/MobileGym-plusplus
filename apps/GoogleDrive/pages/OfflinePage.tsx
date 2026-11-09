// apps/GoogleDrive/pages/OfflinePage.tsx
// apps/GoogleDrive/pages/drawerPages.tsx — 抽屉里的子页：最近使用 / 离线 / 上传 / 垃圾内容 / 回收站
import React from 'react';
import { IcOfflineNav } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SubPageBar } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { useItemsByIds } from '../components/listing';

/** 离线（IMG_2282） */
export const OfflinePage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const offlineIds = useGoogleDriveStore(st => st.offlineIds);
  const rows = useItemsByIds(offlineIds);
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.offline_title} a11yClose={s.a11y_close} />
      {rows.length === 0 ? (
        <EmptyState icon={IcOfflineNav} title={s.offline_empty_title} desc={s.offline_empty_desc} />
      ) : (
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          <ItemListing
            rows={rows}
            view="list"
            makeTapProps={item => (
              item.kind === 'folder'
                ? bindTap('googledrive.folder.enter', { params: { id: item.id } })
                : bindTap('googledrive.preview.open', { params: { id: item.id } })
            )}
            makeMenuProps={item => (
              item.kind === 'folder'
                ? bindTap('googledrive.offline.foldermenu.open', { params: { item: item.id }, stopPropagation: true })
                : bindTap('googledrive.offline.filemenu.open', { params: { item: item.id }, stopPropagation: true })
            )}
          />
        </div>
      )}
    </div>
  );
};
