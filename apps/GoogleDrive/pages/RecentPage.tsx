// apps/GoogleDrive/pages/RecentPage.tsx
// apps/GoogleDrive/pages/drawerPages.tsx — 抽屉里的子页：最近使用 / 离线 / 上传 / 垃圾内容 / 回收站
import React from 'react';
import { IcRecent } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SubPageBar } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { useItemsByIds } from '../components/listing';

/** 最近使用（IMG_2224） */
export const RecentPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const recentIds = useGoogleDriveStore(st => st.recentIds);
  const rows = useItemsByIds(recentIds);
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.recent_title} a11yClose={s.a11y_close} />
      {rows.length === 0 ? (
        <EmptyState icon={IcRecent} title={s.recent_title} />
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
                ? bindTap('googledrive.recent.foldermenu.open', { params: { item: item.id }, stopPropagation: true })
                : bindTap('googledrive.recent.filemenu.open', { params: { item: item.id }, stopPropagation: true })
            )}
          />
        </div>
      )}
    </div>
  );
};
