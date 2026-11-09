// 我的下载。节点 download.mine(spec v1.0.0,10 条交互)。
// 视觉证据:730(视频 tab 空态:下载 icon 插画 +「您还没有下载视频」+「更多精彩内容」3 封面 +
// 存储条「剩余46.6G可用」)、729(小说 tab 空态)、856(有内容态:正在下载行 + 计数徽标 +
// 「9.2MB/s + VIP加速1.1MB/s」+ 存储条「已使用23M,剩余46.3G可用」)、
// 7130a7@36(正在下载行 + 双剧卡:封面「N个视频」角标 + 「N个待观看」+ 体积)、
// 7130a7@90(编辑模式:勾选圈 + 底部 全选|删除(n) + 右上「取消」)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useDownloadTicker } from '../hooks/useDownloadTicker';
import { useTencentvideoStore } from '../state';
import type { TvDownloadTask } from '../types';
import { TV_COLORS as C } from '../constants';
import { EmptyState, TopBar } from '../components/ui';
import { stillOf } from '../components/detail';
import {
  DownloadRecFloor,
  DownloadThumb,
  EditBottomBar,
  SelectCircle,
  SpeedLine,
  StorageBar,
  TaskProgress,
  fmtSizeMb,
  sizeMbOf,
  usedMbOf,
} from '../components/download';
import { IcDownload } from '../res/icons';

/** tab 视频/小说(证据 730/729);离散 UI 态走 store.ui */
const UI_TAB = 'download.mine.tab';
const UI_EDITING = 'download.mine.editing';
/** 编辑模式勾选的剧 id(ui 只存标量,用逗号串) */
const UI_SELECTED = 'download.mine.selected';

const TAB_VIDEO = 'video';
const TAB_NOVEL = 'novel';

export default function DownloadMinePage() {
  const { bindTap, bindLongPress } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  useDownloadTicker();

  const contents = useTencentvideoStore((st) => st.contents);
  const downloads = useTencentvideoStore((st) => st.downloads);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const deleteDownloads = useTencentvideoStore((st) => st.deleteDownloads);
  const dislikeDownloadRec = useTencentvideoStore((st) => st.dislikeDownloadRec);

  const activeTab = (ui[UI_TAB] as string) || TAB_VIDEO;
  const editing = ui[UI_EDITING] === true;
  const selectedRaw = String(ui[UI_SELECTED] ?? '');

  const selectedIds = useMemo(
    () => selectedRaw.split(',').filter(Boolean),
    [selectedRaw],
  );

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /** 进行中任务(正在下载行的数据源);完成的进单剧卡 */
  const runningTasks = useMemo(
    () => downloads.items.filter((t) => t.status !== 'done'),
    [downloads.items],
  );

  /** 已下载:按剧聚合(证据 7130a7@36 的两张单剧卡) */
  const seriesGroups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, TvDownloadTask[]>();
    for (const t of downloads.items) {
      if (t.status !== 'done') continue;
      if (!map.has(t.contentId)) {
        map.set(t.contentId, []);
        order.push(t.contentId);
      }
      map.get(t.contentId)!.push(t);
    }
    return order.map((cid) => {
      const tasks = map.get(cid)!;
      return {
        contentId: cid,
        tasks,
        sizeText: fmtSizeMb(tasks.reduce((sum, t) => sum + sizeMbOf(t.sizeText), 0)),
      };
    });
  }, [downloads.items]);

  const usedMb = useMemo(() => usedMbOf(downloads.items), [downloads.items]);

  const recommendations = useMemo(
    () => downloads.recommendations.map((id) => byId.get(id)).filter((c) => c !== undefined),
    [downloads.recommendations, byId],
  );

  const isVideoTab = activeTab === TAB_VIDEO;
  const hasAnything = runningTasks.length > 0 || seriesGroups.length > 0;

  /* ---------- 绑定 ---------- */

  const setSelected = (ids: string[]) => setUi(UI_SELECTED, ids.join(','));

  const editEnter = bindTap({ kind: 'action', id: 'download.mine.edit.enter' }, {
    onTrigger: () => {
      setUi(UI_EDITING, true);
      setSelected([]);
    },
  });

  const editExit = bindTap({ kind: 'action', id: 'download.mine.edit.exit' }, {
    onTrigger: () => {
      setUi(UI_EDITING, false);
      setSelected([]);
    },
  });

  const selectBind = (cid: string) =>
    bindTap({ kind: 'action', id: 'download.mine.edit.select' }, {
      onTrigger: () => setSelected(
        selectedIds.includes(cid) ? selectedIds.filter((x) => x !== cid) : [...selectedIds, cid],
      ),
    });

  const selectAllBind = bindTap({ kind: 'action', id: 'download.mine.edit.select' }, {
    onTrigger: () => setSelected(
      selectedIds.length === seriesGroups.length ? [] : seriesGroups.map((g) => g.contentId),
    ),
  });

  const deleteBind = bindTap({ kind: 'action', id: 'download.mine.edit.delete' }, {
    onTrigger: () => {
      if (selectedIds.length === 0) return;
      const ids = seriesGroups
        .filter((g) => selectedIds.includes(g.contentId))
        .flatMap((g) => g.tasks.map((t) => t.id));
      deleteDownloads(ids);
      setSelected([]);
      setUi(UI_EDITING, false);
    },
  });

  /* ---------- 列表 ---------- */

  const runningRow = runningTasks.length > 0 && (
    <div
      className="flex items-center gap-3 px-3 py-2 cursor-pointer"
      {...bindTap('download.running.open.fromMine')}
    >
      <DownloadThumb placeholder />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-[14px]" style={{ color: C.text }}>
          <span className="font-medium">{s.downloadRunning}</span>
          <span
            className="w-[15px] h-[15px] rounded-full text-[10px] leading-[15px] text-center text-white shrink-0"
            style={{ background: C.primary }}
          >
            {runningTasks.length}
          </span>
          <span className="truncate" style={{ color: C.text }}>
            {byId.get(runningTasks[0].contentId)?.title ?? ''}({runningTasks[0].label})
          </span>
        </div>
        <TaskProgress pct={runningTasks[0].progressPct} />
        <SpeedLine
          speedText={downloads.speedText}
          accelText={downloads.accelText}
          pausedText={runningTasks[0].status === 'paused' ? s.paused : undefined}
        />
      </div>
    </div>
  );

  const seriesList = seriesGroups.map((g) => {
    const c = byId.get(g.contentId);
    const card = (
      <>
        <DownloadThumb
          imgId={c ? stillOf(c) : undefined}
          alt={c?.title}
          countNote={`${g.tasks.length}${s.downloadVideosUnit}`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-medium truncate" style={{ color: C.text }}>
            {c?.title ?? g.contentId}
          </div>
          <div className="text-[12px] mt-1" style={{ color: C.textSub }}>
            {g.tasks.length}{s.downloadPendingWatch}
          </div>
        </div>
        <div className="shrink-0 text-[13px]" style={{ color: C.textSub }}>
          {g.sizeText}
        </div>
      </>
    );
    return editing ? (
      <div
        key={g.contentId}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        {...selectBind(g.contentId)}
      >
        <SelectCircle checked={selectedIds.includes(g.contentId)} />
        {card}
      </div>
    ) : (
      <div
        key={g.contentId}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        {...bindTap('download.series.open.fromMine', { params: { contentId: g.contentId } })}
      >
        {card}
      </div>
    );
  });

  /* ---------- 空态(证据 730 视频 / 729 小说) ---------- */

  const emptyVideo = (
    <EmptyState
      icon={<span className="mb-3" style={{ color: C.divider }}><IcDownload size={46} /></span>}
      text={<span className="text-[16px]" style={{ color: C.text }}>{s.downloadEmptyVideo}</span>}
      sub={s.downloadEmptyVideoHint}
    />
  );
  const emptyNovel = (
    <EmptyState
      text={<span className="text-[16px]" style={{ color: C.text }}>{s.downloadEmptyNovel}</span>}
      sub={s.downloadEmptyNovelHint}
    />
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar
        title={s.downloadMine}
        right={
          <div className="flex items-center gap-3 whitespace-nowrap">
            {editing ? (
              <button
                {...editExit}
                className="bg-transparent border-none p-0 text-[15px]"
                style={{ color: C.text }}
              >
                {s.cancel}
              </button>
            ) : (
              <>
                <button
                  {...bindTap({ kind: 'action', id: 'download.mine.feedback.wontfix' }, {
                    onTrigger: () => toast(s.notOpen),
                  })}
                  className="bg-transparent border-none p-0 text-[15px]"
                  style={{ color: C.text }}
                >
                  {s.feedback}
                </button>
                {hasAnything && (
                  <button
                    {...editEnter}
                    className="bg-transparent border-none p-0 text-[15px]"
                    style={{ color: C.text }}
                  >
                    {s.edit}
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      <div className="shrink-0 flex items-center gap-2 px-3 py-2">
        {[
          { key: TAB_VIDEO, label: s.downloadTabVideo },
          { key: TAB_NOVEL, label: s.downloadTabNovel },
        ].map(({ key, label }) => {
          const on = key === activeTab;
          return (
            <button
              key={key}
              {...bindTap({ kind: 'action', id: 'download.mine.tab.switch' }, {
                onTrigger: () => setUi(UI_TAB, key),
              })}
              className="rounded-full border-none px-4 h-7 text-[13px]"
              style={{
                background: on ? C.primaryBg : C.chipGray,
                color: on ? C.primary : C.text,
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 overflow-y-auto flex flex-col"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex-1">
          {isVideoTab
            ? hasAnything
              ? (
                <>
                  {runningRow}
                  {seriesList}
                </>
              )
              : emptyVideo
            : emptyNovel}
        </div>

        <DownloadRecFloor
          title={s.downloadMoreContent}
          items={recommendations}
          getBind={(c) => bindTap('detail.series.open.fromDownloadRec', { params: { contentId: c.id } })}
          getLongPressBind={(c) => bindLongPress({ kind: 'action', id: 'download.mine.rec.dislike' }, {
            onTrigger: () => dislikeDownloadRec(c.id),
          })}
        />
        <div className="h-2" />
      </div>

      <StorageBar
        text={usedMb > 0
          ? `${s.downloadUsed}${fmtSizeMb(usedMb)},${s.downloadRemaining}${downloads.remaining}${s.downloadAvailable}`
          : `${s.downloadRemaining}${downloads.remaining}${s.downloadAvailable}`}
      />

      {editing && (
        <EditBottomBar
          selectAllLabel={selectedIds.length === seriesGroups.length && seriesGroups.length > 0 ? s.deselectAll : s.selectAll}
          deleteLabel={`${s.delete}(${selectedIds.length})`}
          selectAllBind={selectAllBind}
          deleteBind={deleteBind}
          deleteEnabled={selectedIds.length > 0}
        />
      )}
    </div>
  );
}
