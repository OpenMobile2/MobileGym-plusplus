// apps/GoogleDrive/components/ItemListing.tsx — 列表/网格主体
// 各页把自己的 transitionId 以字面量绑好后，通过 make*Props 回调传进来，
// 共享组件内部不拼 ID（平台硬规则）。
import React from 'react';
import { GRID_COLUMNS } from '../constants';
import { useGoogleDriveStore } from '../state';
import type { DriveItem } from '../types';
import { ItemRow, ItemCard, type BindProps } from './common';
import { useSubtitle } from './listing';

type Props = BindProps | undefined;

export const ItemListing: React.FC<{
  rows: DriveItem[];
  view: 'list' | 'grid';
  selectMode?: boolean;
  makeTapProps: (item: DriveItem) => Props;
  makeMenuProps: (item: DriveItem) => Props;
  makeLongPressProps?: (item: DriveItem) => Props;
  /** 副标题覆写（回收站显示「移入回收站 时间」等） */
  subtitleOf?: (item: DriveItem) => string;
}> = ({ rows, view, selectMode, makeTapProps, makeMenuProps, makeLongPressProps, subtitleOf }) => {
  const starred = useGoogleDriveStore(s => s.starredIds);
  const offline = useGoogleDriveStore(s => s.offlineIds);
  const selected = useGoogleDriveStore(s => s.selectedIds);
  const toggleSelect = useGoogleDriveStore(s => s.toggleSelect);
  const defaultSubtitle = useSubtitle();
  const sub = subtitleOf ?? defaultSubtitle;

  if (view === 'grid' && !selectMode) {
    return (
      <div className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}>
        {rows.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            tapProps={makeTapProps(item)}
            menuProps={makeMenuProps(item)}
            longPressProps={makeLongPressProps?.(item)}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {rows.map(item => (
        <ItemRow
          key={item.id}
          item={item}
          subtitle={sub(item)}
          starred={starred.includes(item.id)}
          offline={offline.includes(item.id)}
          selectMode={selectMode}
          selected={selected.includes(item.id)}
          {...(selectMode
            ? {
              onTap: () => toggleSelect(item.id),
              tapProps: {
                'data-action': 'googledrive.selection.toggle',
                'data-action-params': JSON.stringify({ item: item.id }),
              },
            }
            : {
              tapProps: makeTapProps(item),
              menuProps: makeMenuProps(item),
              longPressProps: makeLongPressProps?.(item),
            })}
        />
      ))}
    </>
  );
};
