// apps/GoogleDrive/pages/HomePage.tsx — 主页：推荐 / 活动（IMG_2219 / 2260）
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { GRID_COLUMNS } from '../constants';
import { IcClose, IcMore, IcRecent, IcGemini } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { ItemRow, ItemCard, EmptyState, showToast, type BindProps } from '../components/common';
import { useItemsByIds, useSubtitle } from '../components/listing';
import { PullToRefresh } from '../components/PullToRefresh';

/** 页面内 Suggested / Activity 两个标签 */
const InnerTabs: React.FC<{ active: 'suggested' | 'activity' }> = ({ active }) => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const Tab: React.FC<{ label: string; on: boolean; bind: BindProps }> = ({ label, on, bind }) => (
    <button {...bind} className="flex-1 h-11 relative">
      <span className="text-[14px]" style={{ color: on ? GD.blue : GD.textSecondary, fontWeight: on ? 600 : 400 }}>{label}</span>
      {on && <span className="absolute left-0 right-0 bottom-0 h-[3px] rounded-t" style={{ background: GD.blue }} />}
    </button>
  );
  // 点当前标签要静默无操作：transition.from 不含自身，直接 go() 会抛异常（同 TabBar）
  const noop = () => undefined;
  return (
    <div className="flex shrink-0" style={{ borderBottom: `1px solid ${GD.divider}` }}>
      <Tab
        label={s.home_tab_suggested}
        on={active === 'suggested'}
        bind={bindTap('googledrive.home.tabSuggested', active === 'suggested' ? { onTrigger: noop } : undefined)}
      />
      <Tab
        label={s.home_tab_activity}
        on={active === 'activity'}
        bind={bindTap('googledrive.home.tabActivity', active === 'activity' ? { onTrigger: noop } : undefined)}
      />
    </div>
  );
};

/** 多选态顶栏：Clear（纯关闭，只用 bindBack）+ 计数 + 全选 + ⋮ */
const SelectionBar: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindBack, bindTap } = useGoogleDriveGestures();
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const selectAll = useGoogleDriveStore(st => st.selectAll);
  const recentIds = useGoogleDriveStore(st => st.recentIds);
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
        onClick={() => selectAll(recentIds)}
        className="w-11 h-11 flex items-center justify-center"
        aria-label={s.a11y_select_all}
      >
        <span className="w-5 h-5 rounded-sm" style={{ border: `2px dashed ${GD.textSecondary}` }} />
      </button>
      <button {...bindTap('googledrive.home.selection.menu')} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_more}>
        <IcMore size={20} color={GD.text} />
      </button>
    </div>
  );
};

export const HomePage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, bindLongPress } = useGoogleDriveGestures();
  const view = useGoogleDriveStore(st => st.view);
  const recentIds = useGoogleDriveStore(st => st.recentIds);
  const starred = useGoogleDriveStore(st => st.starredIds);
  const offline = useGoogleDriveStore(st => st.offlineIds);
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const toggleSelect = useGoogleDriveStore(st => st.toggleSelect);
  const rows = useItemsByIds(recentIds);
  const subtitle = useSubtitle();

  const isActivity = sp.get('tab') === 'activity';
  const selectMode = sp.get('select') === '1';

  return (
    <div className="flex flex-col h-full">
      {selectMode ? <SelectionBar /> : <InnerTabs active={isActivity ? 'activity' : 'suggested'} />}
      {isActivity ? (
        <EmptyState icon={IcRecent} title={s.activity_empty_title} desc={s.activity_empty_desc} />
      ) : (
        <PullToRefresh>
          {view === 'grid' && !selectMode ? (
            <div className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))` }}>
              {rows.map(item => (
                <ItemCard
                  key={item.id}
                  item={item}
                  tapProps={bindTap('googledrive.preview.open', { params: { id: item.id } })}
                  menuProps={bindTap('googledrive.home.filemenu.open', { params: { item: item.id }, stopPropagation: true })}
                  longPressProps={bindLongPress('googledrive.home.selection.enter', { params: { item: item.id }, beforeTrigger: () => toggleSelect(item.id) })}
                />
              ))}
            </div>
          ) : (
            rows.map(item => (
              <ItemRow
                key={item.id}
                item={item}
                subtitle={subtitle(item)}
                starred={starred.includes(item.id)}
                offline={offline.includes(item.id)}
                selectMode={selectMode}
                selected={selected.includes(item.id)}
                {...(selectMode
                  ? {
                    onTap: () => toggleSelect(item.id),
                    tapProps: { 'data-action': 'googledrive.selection.toggle', 'data-action-params': JSON.stringify({ item: item.id }) },
                  }
                  : {
                    tapProps: bindTap('googledrive.preview.open', { params: { id: item.id } }),
                    menuProps: bindTap('googledrive.home.filemenu.open', { params: { item: item.id }, stopPropagation: true }),
                    longPressProps: bindLongPress('googledrive.home.selection.enter', { params: { item: item.id }, beforeTrigger: () => toggleSelect(item.id) }),
                  })}
              />
            ))
          )}
          <div className="h-24" />
        </PullToRefresh>
      )}
      {selectMode && (
        <div className="absolute left-4 bottom-24 z-[90]">
          <GeminiChip />
        </div>
      )}
    </div>
  );
};

/** 多选态左下的「Ask Gemini ×」悬浮 chip（IMG_2260） */
const GeminiChip: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [visible, setVisible] = React.useState(true);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-2 h-9 pl-3 pr-1 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.18)]">
      {/* 文案区看起来可点：多选场景暂未接 Gemini，统一 toast，避免死点击 */}
      <button
        type="button"
        data-action="googledrive.selection.gemini.unavailable"
        onClick={() => showToast(s.toast_feature_unavailable)}
        className="flex items-center gap-2 h-full pl-0.5 active:opacity-70"
      >
        <IcGemini size={16} color={GD.blue} />
        <span className="text-[13px]" style={{ color: GD.text }}>{s.menu_ask_gemini}</span>
      </button>
      <button
        data-action="googledrive.selection.dismissGeminiChip"
        onClick={() => setVisible(false)}
        className="w-7 h-7 flex items-center justify-center"
        aria-label={s.a11y_close}
      >
        <IcClose size={14} color={GD.textSecondary} />
      </button>
    </div>
  );
};
