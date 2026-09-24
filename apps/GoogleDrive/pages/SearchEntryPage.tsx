// apps/GoogleDrive/pages/SearchEntryPage.tsx
// apps/GoogleDrive/pages/searchPages.tsx — 搜索入口 / 搜索结果 / 筛选弹层
import React, { useMemo } from 'react';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { FILTER_CHIPS } from '../constants';
import { IcSearch, IcClose, IcExternal, IcFilter } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { ItemRow } from '../components/common';
import { useSubtitle, matchItems } from '../components/listing';

// ═══════════════════════════════════════════════════════════
// 搜索入口（IMG_2267 / 2268 / 2269）
// ═══════════════════════════════════════════════════════════
export const SearchEntryPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindBack, bindTap, go } = useGoogleDriveGestures();
  const query = useGoogleDriveStore(st => st.searchQuery);
  const setQuery = useGoogleDriveStore(st => st.setSearchQuery);
  const recentQueries = useGoogleDriveStore(st => st.recentQueries);
  const pushRecentQuery = useGoogleDriveStore(st => st.pushRecentQuery);
  const items = useGoogleDriveStore(st => st.items);
  const trashed = useGoogleDriveStore(st => st.trashedIds);
  const subtitle = useSubtitle();

  const fileHits = useMemo(() => matchItems(items, trashed, query).slice(0, 5), [items, trashed, query]);
  const queryHits = useMemo(
    () => (query.trim() ? recentQueries.filter(q => q.toLowerCase().includes(query.trim().toLowerCase())) : recentQueries),
    [recentQueries, query],
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: 4, paddingRight: 8 }}>
        <button {...bindBack()} className="w-11 h-11 flex items-center justify-center" aria-label={s.a11y_back}>
          <span className="text-[24px] leading-none" style={{ color: GD.text }}>‹</span>
        </button>
        <input
          data-action="googledrive.search.input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          // 键盘回车要能直接提交搜索，否则输入完只能去点联想项，等于「看着能用却不能用」
          onKeyDown={e => {
            if (e.key === 'Enter' && query.trim()) {
              pushRecentQuery(query);
              go('googledrive.search.submit', { q: query.trim() });
            }
          }}
          placeholder={s.search_placeholder}
          autoFocus
          className="flex-1 text-[16px] outline-none bg-transparent"
          style={{ color: GD.text }}
        />
        {query && (
          <button
            data-action="googledrive.search.clear"
            data-keep-keyboard="true"
            onClick={() => setQuery('')}
            className="w-11 h-11 flex items-center justify-center"
            aria-label={s.search_clear}
          >
            <IcClose size={18} color={GD.textSecondary} />
          </button>
        )}
      </div>

      {/* 筛选 chip：从搜索入口点进去直接落到结果页的筛选态 */}
      <div className="flex gap-2 px-4 pb-3 shrink-0">
        {FILTER_CHIPS.map(chip => {
          const bind = chip.id === 'type'
            ? bindTap('googledrive.search.filter.type', { params: { q: query } })
            : chip.id === 'people'
              ? bindTap('googledrive.search.filter.people', { params: { q: query } })
              : bindTap('googledrive.search.filter.modified', { params: { q: query } });
          return (
            <button
              key={chip.id}
              {...bind}
              className="h-8 px-3 rounded-full text-[13px] flex items-center gap-1"
              style={{ border: `1px solid ${GD.divider}`, color: GD.text }}
            >
              <IcFilter size={13} color={GD.textSecondary} />
              {s[chip.labelKey as keyof typeof s]}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {queryHits.map(qs => (
          <div key={qs} className="flex items-center" style={{ height: 52, paddingLeft: DIM.pagePadding, paddingRight: 4 }}>
            <button {...bindTap('googledrive.search.submit', { params: { q: qs } })} className="flex items-center gap-4 flex-1 min-w-0 h-full text-left">
              <IcSearch size={20} color={GD.textSecondary} />
              <span className="text-[15px] truncate" style={{ color: GD.text }}>{qs}</span>
            </button>
            <button
              data-action="googledrive.search.select.suggestion"
              data-action-params={JSON.stringify({ value: qs })}
              onClick={() => setQuery(qs)}
              className="w-11 h-11 flex items-center justify-center shrink-0"
              aria-label={qs}
            >
              <IcExternal size={18} color={GD.textSecondary} className="-rotate-90" />
            </button>
          </div>
        ))}
        {fileHits.map(item => (
          <ItemRow
            key={item.id}
            item={item}
            subtitle={subtitle(item)}
            tapProps={bindTap('googledrive.preview.open', { params: { id: item.id } })}
          />
        ))}
        <div className="h-10" />
      </div>
    </div>
  );
};
