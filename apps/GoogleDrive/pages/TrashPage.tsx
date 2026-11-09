// apps/GoogleDrive/pages/TrashPage.tsx
// apps/GoogleDrive/pages/drawerPages.tsx — 抽屉里的子页：最近使用 / 离线 / 上传 / 垃圾内容 / 回收站
import React from 'react';
import { GD } from '../res/colors';
import { IcTrash } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SubPageBar, ItemRow, useDateFormat } from '../components/common';
import { sortItems } from '../components/listing';

/** 回收站（IMG_2280 / 2293） */
export const TrashPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const trashedIds = useGoogleDriveStore(st => st.trashedIds);
  const trashedAt = useGoogleDriveStore(st => st.trashedAt);
  const itemsMap = useGoogleDriveStore(st => st.items);
  const starred = useGoogleDriveStore(st => st.starredIds);
  const fmt = useDateFormat();

  const rows = sortItems(
    trashedIds.map(id => itemsMap[id]).filter(Boolean),
    { field: 'trashed', order: 'asc' },
    trashedAt,
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.trash_title} a11yClose={s.a11y_close} />
      <div className="px-4 pb-2 text-[13px]" style={{ color: GD.textSecondary }}>{s.trash_notice}</div>
      {rows.length > 0 && (
        <div className="flex justify-end px-4 pb-2">
          <button {...bindTap('googledrive.trash.confirm.empty')} className="text-[14px]" style={{ color: GD.blue }}>
            {s.trash_empty_action}
          </button>
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState icon={IcTrash} title={s.trash_empty_title} desc={s.trash_empty_desc} />
      ) : (
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          {rows.map(item => (
            <ItemRow
              key={item.id}
              item={item}
              subtitle={`${s.sub_trashed} ${fmt(trashedAt[item.id] ?? item.modifiedAt)}`}
              starred={starred.includes(item.id)}
              menuProps={bindTap('googledrive.trash.itemmenu.open', { params: { item: item.id }, stopPropagation: true })}
            />
          ))}
        </div>
      )}
    </div>
  );
};
