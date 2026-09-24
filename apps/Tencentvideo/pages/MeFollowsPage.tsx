// 预约/加追/收藏 三 tab 页。节点 me.follows(spec 5 条交互 / 4 个 uiState)。
// 视觉证据:728(顶栏三 tab「预约 / 加追(选中) / 收藏」+ 右上「编辑」;分类 chip 行;
// 3 条加追行:有更新角标 + 更新至N集 + 第N集·观看至X%)。
// 加追列表与首页/详情的「加追」共享 store.chasing —— 那边加追成功后本页立刻出现。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { ChipRow } from '../components/ChipRow';
import { landscapeCornerNote } from '../components/cards';
import { EmptyState } from '../components/ui';
import { EditBar, MeListRow, parseSelection, serializeSelection, toggleSelection } from '../components/me';
import { IcNavBack } from '../res/icons';

const TAB_KEY = 'me.follows.tab';
const FILTER_KEY = 'me.follows.filter';
const EDIT_KEY = 'me.follows.edit';
const SEL_KEY = 'me.follows.selected';

/** 三 tab 文案照 728;加追为入口默认态 */
const TABS = ['预约', '加追', '收藏'];

/**
 * 筛选 chip 与内容分类的口径差:chip 叫「电视剧」,contents.category 叫「剧集」
 * (与 constants.RANK_BOARD_BY_CATEGORY 同一处口径差)。
 */
const FILTER_TO_CATEGORY: Record<string, string> = { 电视剧: '剧集' };

export default function MeFollowsPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const chasing = useTencentvideoStore((s) => s.chasing);
  const chasingFilters = useTencentvideoStore((s) => s.chasingFilters);
  const reservations = useTencentvideoStore((s) => s.reservations);
  const favorites = useTencentvideoStore((s) => s.favorites);
  const contents = useTencentvideoStore((s) => s.contents);
  const watchHistory = useTencentvideoStore((s) => s.watchHistory);
  const ui = useTencentvideoStore((s) => s.ui);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const toast = useTencentvideoStore((s) => s.toast);
  const removeChasing = useTencentvideoStore((s) => s.removeChasing);
  const removeFavorites = useTencentvideoStore((s) => s.removeFavorites);
  const reserveToggle = useTencentvideoStore((s) => s.reserveToggle);

  const tabLabel = (t: string) =>
    t === TABS[0] ? s.meFollowReserve : t === TABS[1] ? s.meFollowChase : t === TABS[2] ? s.meFollowFav : t;

  const tab = typeof ui[TAB_KEY] === 'string' ? (ui[TAB_KEY] as string) : TABS[1];
  const filter = typeof ui[FILTER_KEY] === 'string' ? (ui[FILTER_KEY] as string) : chasingFilters[0];
  const editing = ui[EDIT_KEY] === true;
  const selected = useMemo(() => parseSelection(ui[SEL_KEY]), [ui]);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  const pctById = useMemo(() => {
    const m = new Map<string, number>();
    for (const h of watchHistory) {
      if (h.contentId !== undefined && h.progressPct !== undefined) m.set(h.contentId, h.progressPct);
    }
    return m;
  }, [watchHistory]);

  /** 三个 tab 统一成同一种行数据,再按 chip 过滤 */
  const rows = useMemo(() => {
    const src: { contentId: string; note: string; corner: string; badge?: string }[] =
      tab === TABS[0]
        ? reservations.map((r) => ({ contentId: r.contentId, note: r.note, corner: '' }))
        : tab === TABS[2]
          ? favorites.map((f) => ({ contentId: f.contentId, note: f.progressText, corner: '', badge: f.badge }))
          : chasing.map((c) => ({ contentId: c.contentId, note: c.progressText, corner: c.updateBadge }));
    return src
      .map((r) => ({ ...r, content: byId.get(r.contentId) }))
      .filter((r) => r.content !== undefined)
      .filter((r) => {
        if (filter === chasingFilters[0]) return true;
        return r.content!.category === (FILTER_TO_CATEGORY[filter] ?? filter);
      });
  }, [tab, reservations, favorites, chasing, byId, filter, chasingFilters]);

  const setSelection = (ids: string[]) => setUi(SEL_KEY, serializeSelection(ids));
  const allSelected = rows.length > 0 && selected.length === rows.length;

  /** 删除:各 tab 落到各自的 store action(预约用 reserveToggle 取消) */
  const deleteSelected = () => {
    if (selected.length === 0) {
      toast(s.meSelectToDelete);
      return;
    }
    if (tab === TABS[0]) selected.forEach((id) => reserveToggle(id));
    else if (tab === TABS[2]) removeFavorites(selected);
    else removeChasing(selected);
    setSelection([]);
    setUi(EDIT_KEY, false);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 + 三 tab 居中 + 编辑 */}
      <div className="shrink-0 flex items-center h-11 px-2">
        <button
          {...bindBack()}
          className="bg-transparent border-none p-1"
          style={{ color: C.text }}
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 flex items-center justify-center gap-5">
          {TABS.map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'me.follows.tab.switch' }, {
                  params: { tab: t },
                  onTrigger: () => {
                    setUi(TAB_KEY, t);
                    setSelection([]);
                  },
                })}
                className="bg-transparent border-none p-0"
                style={{
                  color: active ? C.text : C.textSub,
                  fontSize: active ? 17 : 15,
                  fontWeight: active ? 700 : 400,
                }}
              >
                {tabLabel(t)}
              </button>
            );
          })}
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'me.follows.edit.toggle' }, {
            onTrigger: () => {
              setUi(EDIT_KEY, !editing);
              setSelection([]);
            },
          })}
          className="bg-transparent border-none px-1 text-[14px] whitespace-nowrap"
          style={{ color: C.text }}
        >
          {editing ? s.cancel : s.edit}
        </button>
      </div>

      <ChipRow
        items={chasingFilters}
        active={filter}
        getBind={(item) =>
          bindTap({ kind: 'action', id: 'me.follows.filter.switch' }, {
            params: { filter: item },
            onTrigger: () => {
              setUi(FILTER_KEY, item);
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
        {rows.length === 0 ? (
          <EmptyState text={s.meFollowsEmpty} />
        ) : (
          rows.map((r) => {
            const c = r.content!;
            const isSel = selected.includes(c.id);
            const pct = pctById.get(c.id);
            return (
              <MeListRow
                key={`${tab}_${c.id}`}
                img={c.still ?? c.poster}
                title={c.title}
                subtitle={pct === undefined ? r.note : `${r.note}·观看至${pct}%`}
                badge={r.badge ?? c.badge}
                cornerNote={r.corner || landscapeCornerNote(c)}
                progressPct={pct}
                editing={editing}
                selected={isSel}
                bind={
                  editing
                    ? bindTap({ kind: 'action', id: 'me.follows.edit.toggle' }, {
                      params: { contentId: c.id },
                      onTrigger: () => setSelection(toggleSelection(selected, c.id)),
                    })
                    : bindTap('detail.series.open.fromFollows', { params: { contentId: c.id } })
                }
              />
            );
          })
        )}
      </div>

      {editing && (
        <EditBar
          allSelected={allSelected}
          selectedCount={selected.length}
          selectAllBind={bindTap({ kind: 'action', id: 'me.follows.edit.toggle' }, {
            onTrigger: () => setSelection(allSelected ? [] : rows.map((r) => r.contentId)),
          })}
          deleteBind={bindTap({ kind: 'action', id: 'me.follows.edit.toggle' }, {
            onTrigger: () => deleteSelected(),
          })}
        />
      )}
    </div>
  );
}
