// apps/GoogleDrive/pages/FilesPage.tsx — 文件：我的云端硬盘 / 计算机（IMG_2242 / 2246 / 2249）
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcClose, IcMore, IcFolder } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SortBar, type BindProps } from '../components/common';
import { ItemListing } from '../components/ItemListing';
import { useChildren, useSortLabel } from '../components/listing';

export const InnerTabs: React.FC<{
  left: { label: string; on: boolean; bind: BindProps };
  right: { label: string; on: boolean; bind: BindProps };
}> = ({ left, right }) => (
  <div className="flex shrink-0" style={{ borderBottom: `1px solid ${GD.divider}` }}>
    {[left, right].map(t => (
      <button key={t.label} {...t.bind} className="flex-1 h-11 relative">
        <span className="text-[14px]" style={{ color: t.on ? GD.blue : GD.textSecondary, fontWeight: t.on ? 600 : 400 }}>{t.label}</span>
        {t.on && <span className="absolute left-0 right-0 bottom-0 h-[3px] rounded-t" style={{ background: GD.blue }} />}
      </button>
    ))}
  </div>
);

/** 多选态顶栏（文件页版本） */
const SelectionBar: React.FC<{ allIds: string[] }> = ({ allIds }) => {
  const s = useGoogleDriveStrings();
  const { bindBack, bindTap } = useGoogleDriveGestures();
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const selectAll = useGoogleDriveStore(st => st.selectAll);
  return (
    <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 4 }}>
      <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.selection_clear}>
        <IcClose size={22} color={GD.text} />
      </button>
      <span className="text-[16px] flex-1 ml-1" style={{ color: GD.text }}>
        {s.selection_count.replace('{n}', String(selected.length))}
      </span>
      <button
        data-action="googledrive.selection.selectAll"
        onClick={() => selectAll(allIds)}
        className="w-11 h-11 flex items-center justify-center"
        aria-label={s.a11y_select_all}
      >
        <span className="w-5 h-5 rounded-sm" style={{ border: `2px dashed ${GD.textSecondary}` }} />
      </button>
      <button {...bindTap('googledrive.files.selection.menu')} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_more}>
        <IcMore size={20} color={GD.text} />
      </button>
    </div>
  );
};

export const FilesPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, bindLongPress } = useGoogleDriveGestures();
  const view = useGoogleDriveStore(st => st.view);
  const sort = useGoogleDriveStore(st => st.sort);
  const setView = useGoogleDriveStore(st => st.setView);
  const toggleSelect = useGoogleDriveStore(st => st.toggleSelect);
  const rows = useChildren(null);
  const sortLabel = useSortLabel();

  const onComputers = sp.get('tab') === 'computers';
  const selectMode = sp.get('select') === '1';

  return (
    <div className="flex flex-col h-full">
      {selectMode ? (
        <SelectionBar allIds={rows.map(r => r.id)} />
      ) : (
        <InnerTabs
          left={{
            label: s.files_tab_mydrive,
            on: !onComputers,
            // 点当前标签静默无操作：transition.from 不含自身，直接 go() 会抛异常
            bind: bindTap('googledrive.files.tabMyDrive', !onComputers ? { onTrigger: () => undefined } : undefined),
          }}
          right={{
            label: s.files_tab_computers,
            on: onComputers,
            bind: bindTap('googledrive.files.tabComputers', onComputers ? { onTrigger: () => undefined } : undefined),
          }}
        />
      )}
      {onComputers ? (
        <EmptyState icon={IcFolder} title={s.computers_empty_title} desc={s.computers_empty_desc} />
      ) : (
        <>
          {!selectMode && (
            <SortBar
              label={sortLabel(sort)}
              order={sort.order}
              view={view}
              sortProps={bindTap('googledrive.files.sortmenu.open')}
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
                ? bindTap('googledrive.files.foldermenu.open', { params: { item: item.id }, stopPropagation: true })
                : bindTap('googledrive.files.filemenu.open', { params: { item: item.id }, stopPropagation: true }))}
              makeLongPressProps={item => bindLongPress('googledrive.files.selection.enter', { params: { item: item.id }, beforeTrigger: () => toggleSelect(item.id) })}
            />
            <div className="h-24" />
          </div>
        </>
      )}
    </div>
  );
};
