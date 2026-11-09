// 观看历史。节点 me.history(spec 7 条交互 / 4 个 uiState)。
// 视觉证据:734(今天/近一周分组 + 聚合行「看过的短视频」+ 条目含设备与时间)、
// 733(继续下滚的更早分组)、732(电影筛选态:评分角标 + 「观看不足1%」)。
// qa:Q9 锁定「猜你在追」形态 = 推荐剧卡 + 每卡「追」按钮(与全局加追 store 共享)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { ChipRow } from '../components/ChipRow';
import { ChasePill, landscapeCornerNote } from '../components/cards';
import { EmptyState } from '../components/ui';
import { TvImg } from '../components/Img';
import { EditBar, MeListRow, parseSelection, serializeSelection, toggleSelection } from '../components/me';
import { IcNavBack } from '../res/icons';

const TAB_KEY = 'me.history.tab';
const FILTER_KEY = 'me.history.filter';
const EDIT_KEY = 'me.history.edit';
const SEL_KEY = 'me.history.selected';

/** 顶部两 tab(证据 734) */
const TABS = ['观看历史', '猜你在追'];

/** chip「电视剧」对应 contents.category「剧集」(同 me.follows 的口径差) */
const FILTER_TO_CATEGORY: Record<string, string> = { 电视剧: '剧集' };

export default function MeHistoryPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const watchHistory = useTencentvideoStore((s) => s.watchHistory);
  const historyFilters = useTencentvideoStore((s) => s.historyFilters);
  const guessYouFollow = useTencentvideoStore((s) => s.guessYouFollow);
  const chasing = useTencentvideoStore((s) => s.chasing);
  const contents = useTencentvideoStore((s) => s.contents);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const removeHistoryEntries = useTencentvideoStore((s) => s.removeHistoryEntries);
  const chaseToggle = useTencentvideoStore((s) => s.chaseToggle);

  const tabLabel = (t: string) =>
    t === TABS[0] ? s.meHistory : t === TABS[1] ? s.meHistoryGuess : t;

  const tab = typeof ui[TAB_KEY] === 'string' ? (ui[TAB_KEY] as string) : TABS[0];
  const filter = typeof ui[FILTER_KEY] === 'string' ? (ui[FILTER_KEY] as string) : historyFilters[0];
  const editing = ui[EDIT_KEY] === true;
  const selected = useMemo(() => parseSelection(ui[SEL_KEY]), [ui]);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  const entries = useMemo(
    () =>
      watchHistory
        .map((h) => ({ entry: h, content: h.contentId ? byId.get(h.contentId) : undefined }))
        .filter((x) => {
          if (filter === historyFilters[0]) return true;
          // 聚合行没有分类,只在「全部」露出
          if (!x.content) return false;
          return x.content.category === (FILTER_TO_CATEGORY[filter] ?? filter);
        }),
    [watchHistory, byId, filter, historyFilters],
  );

  /** 按 group 字段(今天/近一周/更早)保序分组 */
  const groups = useMemo(() => {
    const out: { title: string; items: typeof entries }[] = [];
    for (const item of entries) {
      const last = out[out.length - 1];
      if (last && last.title === item.entry.group) last.items.push(item);
      else out.push({ title: item.entry.group, items: [item] });
    }
    return out;
  }, [entries]);

  const guessCards = useMemo(
    () => guessYouFollow.map((id) => byId.get(id)).filter((c) => c !== undefined),
    [guessYouFollow, byId],
  );

  const setSelection = (ids: string[]) => setUi(SEL_KEY, serializeSelection(ids));
  const allSelected = entries.length > 0 && selected.length === entries.length;

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 + 观看历史/猜你在追 + 编辑 */}
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
                {...bindTap({ kind: 'action', id: 'me.history.tab.switch' }, {
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
          {...bindTap({ kind: 'action', id: 'me.history.edit.toggle' }, {
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

      {tab === TABS[0] && (
        <ChipRow
          items={historyFilters}
          active={filter}
          getBind={(item) =>
            bindTap({ kind: 'action', id: 'me.history.filter.switch' }, {
              params: { filter: item },
              onTrigger: () => {
                setUi(FILTER_KEY, item);
                setSelection([]);
              },
            })
          }
        />
      )}

      <div
        className="flex-1 overflow-y-auto pb-4"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === TABS[1] ? (
          /* 猜你在追:推荐剧卡 + 每卡「追」按钮(qa:Q9) */
          <div className="grid grid-cols-3 gap-x-2.5 gap-y-3 px-3 pt-2">
            {guessCards.map((c) => {
              const content = c!;
              const isChasing = chasing.some((x) => x.contentId === content.id);
              return (
                <div key={content.id} className="flex flex-col min-w-0">
                  <button
                    {...bindTap('detail.series.open.fromGuess', { params: { contentId: content.id } })}
                    className="relative w-full aspect-[2/3] rounded-lg overflow-hidden border-none p-0"
                  >
                    <TvImg
                      id={content.poster ?? content.still}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                    <span
                      className="absolute bottom-0 inset-x-0 px-1 pb-0.5 pt-3 text-right text-white text-[10px] leading-none"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
                    >
                      {landscapeCornerNote(content)}
                    </span>
                  </button>
                  <div className="mt-1 text-[13px] truncate" style={{ color: C.text }}>
                    {content.title}
                  </div>
                  <div className="mt-1">
                    <ChasePill
                      chasing={isChasing}
                      label={isChasing ? '已追' : '追'}
                      bind={bindTap({ kind: 'action', id: 'me.history.guess.follow' }, {
                        params: { contentId: content.id },
                        stopPropagation: true,
                        onTrigger: () => chaseToggle(content.id),
                      })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState text={`暂无${filter}观看记录`} />
        ) : (
          groups.map((g) => (
            <div key={`${filter}_${g.title}`}>
              <div className="px-3 pt-3 pb-1 text-[16px] font-bold" style={{ color: C.text }}>
                {g.title}
              </div>
              {g.items.map(({ entry, content }) => {
                const isSel = selected.includes(entry.id);
                const selectBind = bindTap({ kind: 'action', id: 'me.history.edit.toggle' }, {
                  params: { entryId: entry.id },
                  onTrigger: () => setSelection(toggleSelection(selected, entry.id)),
                });
                if (!content) {
                  // 聚合行「看过的短视频」(734)
                  return (
                    <MeListRow
                      key={entry.id}
                      img={entry.cover}
                      title={entry.title ?? ''}
                      subtitle={`含${entry.count ?? 0}个视频`}
                      cornerNote="短视频"
                      editing={editing}
                      selected={isSel}
                      bind={
                        editing
                          ? selectBind
                          : bindTap({ kind: 'action', id: 'me.history.shortagg.wontfix' }, {
                            onTrigger: () => toast(s.notOpen),
                          })
                      }
                    />
                  );
                }
                const pct = entry.progressPct ?? 0;
                return (
                  <MeListRow
                    key={entry.id}
                    img={content.still ?? content.poster}
                    title={content.title}
                    subtitle={
                      entry.episode
                        ? `${entry.episode}·观看至${pct}%`
                        : pct < 1
                          ? '观看不足1%'
                          : `观看至${pct}%`
                    }
                    device={entry.device}
                    date={entry.date}
                    badge={content.badge}
                    cornerNote={entry.rating === undefined ? landscapeCornerNote(content) : undefined}
                    rating={entry.rating}
                    progressPct={pct}
                    editing={editing}
                    selected={isSel}
                    bind={
                      editing
                        ? selectBind
                        : bindTap('detail.series.open.fromHistory', { params: { contentId: content.id } })
                    }
                  />
                );
              })}
            </div>
          ))
        )}
      </div>

      {editing && tab === TABS[0] && (
        <EditBar
          allSelected={allSelected}
          selectedCount={selected.length}
          selectAllBind={bindTap({ kind: 'action', id: 'me.history.edit.toggle' }, {
            onTrigger: () => setSelection(allSelected ? [] : entries.map((e) => e.entry.id)),
          })}
          deleteBind={bindTap({ kind: 'action', id: 'me.history.edit.toggle' }, {
            onTrigger: () => {
              if (selected.length === 0) {
                toast(s.meSelectHistoryToDelete);
                return;
              }
              removeHistoryEntries(selected);
              setSelection([]);
              setUi(EDIT_KEY, false);
            },
          })}
        />
      )}
    </div>
  );
}
