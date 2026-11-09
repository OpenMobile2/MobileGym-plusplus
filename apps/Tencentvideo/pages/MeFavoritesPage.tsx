// 我的收藏。节点 me.favorites(spec 4 条交互 / 5 个 uiState)。
// 视觉证据:725(顶栏「我的收藏」+ 右上「编辑」;剧集/片单/个人专辑/短视频 chip;
// 3 条横版收藏行,带角标 + 更新进度 + 观看进度)。
// 数据一致性:剧名/集数/角标全部来自 contents + favorites,进度百分比与观看历史同源。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { ChipRow } from '../components/ChipRow';
import { landscapeCornerNote } from '../components/cards';
import { EmptyState, TopBar } from '../components/ui';
import { EditBar, MeListRow, parseSelection, serializeSelection, toggleSelection } from '../components/me';

const TAB_KEY = 'me.favorites.tab';
const EDIT_KEY = 'me.favorites.edit';
const SEL_KEY = 'me.favorites.selected';

export default function MeFavoritesPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const favorites = useTencentvideoStore((s) => s.favorites);
  const favoriteTabs = useTencentvideoStore((s) => s.favoriteTabs);
  const contents = useTencentvideoStore((s) => s.contents);
  const watchHistory = useTencentvideoStore((s) => s.watchHistory);
  const ui = useTencentvideoStore((s) => s.ui);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const toast = useTencentvideoStore((s) => s.toast);
  const removeFavorites = useTencentvideoStore((s) => s.removeFavorites);

  const tab = typeof ui[TAB_KEY] === 'string' ? (ui[TAB_KEY] as string) : favoriteTabs[0];
  const editing = ui[EDIT_KEY] === true;
  const selected = useMemo(() => parseSelection(ui[SEL_KEY]), [ui]);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  // 观看百分比与观看历史同源(725 副标题「观看至12集 · 15%」)
  const pctById = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of watchHistory) {
      if (h.contentId !== undefined && h.progressPct !== undefined) m.set(h.contentId, h.progressPct);
    }
    return m;
  }, [watchHistory]);

  const rows = useMemo(
    () =>
      favorites
        .map((f) => ({ fav: f, content: byId.get(f.contentId) }))
        .filter((x) => x.content !== undefined),
    [favorites, byId],
  );

  const setSelection = (ids: string[]) => setUi(SEL_KEY, serializeSelection(ids));

  const editToggleBind = bindTap({ kind: 'action', id: 'me.favorites.edit.toggle' }, {
    onTrigger: () => {
      setUi(EDIT_KEY, !editing);
      setSelection([]);
    },
  });

  const allSelected = rows.length > 0 && selected.length === rows.length;

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar
        title={s.meFavorites}
        right={
          <button
            {...editToggleBind}
            className="bg-transparent border-none p-0 text-[14px] whitespace-nowrap"
            style={{ color: C.text }}
          >
            {editing ? s.cancel : s.edit}
          </button>
        }
      />

      <ChipRow
        items={favoriteTabs}
        active={tab}
        getBind={(item) =>
          bindTap({ kind: 'action', id: 'me.favorites.tab.switch' }, {
            params: { tab: item },
            onTrigger: () => {
              setUi(TAB_KEY, item);
              setSelection([]);
            },
          })
        }
      />

      <div
        className="flex-1 overflow-y-auto pb-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === favoriteTabs[0] ? (
          rows.map(({ fav, content }) => {
            const c = content!;
            const pct = pctById.get(c.id);
            const isSel = selected.includes(c.id);
            return (
              <MeListRow
                key={c.id}
                img={c.still ?? c.poster}
                title={c.title}
                subtitle={pct === undefined ? fav.progressText : `${fav.progressText} · ${pct}%`}
                badge={fav.badge}
                cornerNote={landscapeCornerNote(c)}
                progressPct={pct}
                editing={editing}
                selected={isSel}
                // 编辑态整行 = 勾选/取消;默认态整行 = 进详情
                bind={
                  editing
                    ? bindTap({ kind: 'action', id: 'me.favorites.edit.toggle' }, {
                      params: { contentId: c.id },
                      onTrigger: () => setSelection(toggleSelection(selected, c.id)),
                    })
                    : bindTap('detail.series.open.fromFavorites', { params: { contentId: c.id } })
                }
              />
            );
          })
        ) : (
          /* 片单/个人专辑/短视频真机未拍内容,spec 指定 mock 空态 */
          <EmptyState text={`暂无${tab}收藏`} />
        )}
      </div>

      {editing && (
        <EditBar
          allSelected={allSelected}
          selectedCount={selected.length}
          selectAllBind={bindTap({ kind: 'action', id: 'me.favorites.edit.toggle' }, {
            onTrigger: () => setSelection(allSelected ? [] : rows.map((r) => r.fav.contentId)),
          })}
          deleteBind={bindTap({ kind: 'action', id: 'me.favorites.edit.toggle' }, {
            onTrigger: () => {
              if (selected.length === 0) {
                toast(s.meSelectToDelete);
                return;
              }
              removeFavorites(selected);
              setSelection([]);
              setUi(EDIT_KEY, false);
            },
          })}
        />
      )}
    </div>
  );
}
