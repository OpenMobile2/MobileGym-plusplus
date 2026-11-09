// 正在下载子页。节点 download.running(spec v1.0.0,7 条交互)。
// 视觉证据:857(顶栏「正在下载」+ 右上「编辑」;按钮行「全部暂停」「同时下载个数1」;
// 任务卡:剧照缩略图 + 标题 + 右侧「720P · 626M」+ 进度条 +「9.8MB/s + VIP加速1.9MB/s」;
// 「更多精彩内容」3 封面;存储条「已使用78M,剩余46.2G可用」)、
// 7130a7@18/@36(全部暂停后按钮变「全部开始」、任务显示「已暂停」)、
// 7130a7@64(多选模式:底部 取消全选|删除(n))。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useDownloadTicker } from '../hooks/useDownloadTicker';
import { useTencentvideoStore } from '../state';
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
  usedMbOf,
} from '../components/download';
import { IcDownload } from '../res/icons';

const UI_EDITING = 'download.running.editing';
/** 勾选的任务 id(ui 只存标量,用逗号串) */
const UI_SELECTED = 'download.running.selected';
/** 「同时下载个数」枚举弹层(spec qa:Q1 —— 真机点按钮弹 1/2/3) */
const UI_CONCURRENCY = 'download.running.concurrencySheet';

/** 同时下载个数可选值(spec download.running.concurrency.set:「弹枚举选项(1/2/3)」) */
const CONCURRENCY_OPTIONS = [1, 2, 3];

export default function DownloadRunningPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  useDownloadTicker();

  const contents = useTencentvideoStore((st) => st.contents);
  const downloads = useTencentvideoStore((st) => st.downloads);
  const settings = useTencentvideoStore((st) => st.settings);
  const downloadPausedAll = useTencentvideoStore((st) => st.downloadPausedAll);
  const ui = useTencentvideoStore((st) => st.ui);

  const setUi = useTencentvideoStore((st) => st.setUi);
  const toggleDownloadTask = useTencentvideoStore((st) => st.toggleDownloadTask);
  const toggleDownloadPauseAll = useTencentvideoStore((st) => st.toggleDownloadPauseAll);
  const setDownloadConcurrency = useTencentvideoStore((st) => st.setDownloadConcurrency);
  const deleteDownloads = useTencentvideoStore((st) => st.deleteDownloads);
  const tickDownloads = useTencentvideoStore((st) => st.tickDownloads);

  const editing = ui[UI_EDITING] === true;
  const concurrencyOpen = ui[UI_CONCURRENCY] === true;
  const selectedRaw = String(ui[UI_SELECTED] ?? '');
  const selectedIds = useMemo(() => selectedRaw.split(',').filter(Boolean), [selectedRaw]);

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /** 本页只列未完成任务(完成的会移进「我的下载」单剧列表并从本页消失) */
  const tasks = useMemo(
    () => downloads.items.filter((t) => t.status !== 'done'),
    [downloads.items],
  );

  const usedMb = useMemo(() => usedMbOf(downloads.items), [downloads.items]);

  const recommendations = useMemo(
    () => downloads.recommendations.map((id) => byId.get(id)).filter((c) => c !== undefined),
    [downloads.recommendations, byId],
  );

  /* ---------- 绑定 ---------- */

  const setSelected = (ids: string[]) => setUi(UI_SELECTED, ids.join(','));

  const editEnter = bindTap({ kind: 'action', id: 'download.running.edit.enter' }, {
    onTrigger: () => {
      setUi(UI_EDITING, true);
      setSelected([]);
    },
  });

  // 多选模式的「勾选 / 取消全选 / 删除(n) / 退出」在 spec 里同属一条 edit.delete 交互
  const editSelect = (taskId: string) =>
    bindTap({ kind: 'action', id: 'download.running.edit.delete' }, {
      onTrigger: () => setSelected(
        selectedIds.includes(taskId) ? selectedIds.filter((x) => x !== taskId) : [...selectedIds, taskId],
      ),
    });

  const selectAllBind = bindTap({ kind: 'action', id: 'download.running.edit.delete' }, {
    onTrigger: () => setSelected(
      selectedIds.length === tasks.length ? [] : tasks.map((t) => t.id),
    ),
  });

  const deleteBind = bindTap({ kind: 'action', id: 'download.running.edit.delete' }, {
    onTrigger: () => {
      if (selectedIds.length === 0) return;
      deleteDownloads(selectedIds);
      setSelected([]);
      setUi(UI_EDITING, false);
    },
  });

  const editExit = bindTap({ kind: 'action', id: 'download.running.edit.delete' }, {
    onTrigger: () => {
      setUi(UI_EDITING, false);
      setSelected([]);
    },
  });

  const concurrencyToggle = bindTap({ kind: 'action', id: 'download.running.concurrency.set' }, {
    onTrigger: () => setUi(UI_CONCURRENCY, !concurrencyOpen),
  });

  /* ---------- 任务卡(证据 857) ---------- */

  const taskList = tasks.map((t) => {
    const c = byId.get(t.contentId);
    const paused = t.status === 'paused';
    const body = (
      <>
        <DownloadThumb imgId={c ? stillOf(c) : undefined} alt={c?.title} play />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="flex-1 min-w-0 truncate text-[15px] font-medium" style={{ color: C.text }}>
              {c?.title ?? t.contentId}({t.label})
            </span>
            <span className="shrink-0 text-[12px]" style={{ color: C.textSub }}>
              {t.qualityLabel} · {t.sizeText}
            </span>
          </div>
          {/* 进度由 useDownloadTicker 按 TimeService 自动推进;进度条自身也接
              autoprogress action(stopPropagation 免得连带触发卡片的暂停切换),
              让走查器能显式触发这条 gesture:auto 的交互。 */}
          <div
            {...bindTap({ kind: 'action', id: 'download.running.task.autoprogress' }, {
              stopPropagation: true,
              onTrigger: tickDownloads,
            })}
          >
            <TaskProgress pct={t.progressPct} />
          </div>
          <SpeedLine
            speedText={downloads.speedText}
            accelText={downloads.accelText}
            pausedText={paused ? s.paused : undefined}
          />
        </div>
      </>
    );
    return (
      <div
        key={t.id}
        className="flex items-center gap-3 px-3 py-2 cursor-pointer"
        {...(editing
          ? editSelect(t.id)
          : bindTap({ kind: 'action', id: 'download.running.task.toggle' }, {
            onTrigger: () => toggleDownloadTask(t.id),
          }))}
      >
        {editing && <SelectCircle checked={selectedIds.includes(t.id)} />}
        {body}
      </div>
    );
  });

  /* ---------- 「同时下载个数」枚举弹层 ---------- */

  const concurrencySheet = (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" {...concurrencyToggle} />
      <div className="relative rounded-t-2xl pb-4" style={{ background: C.pageBg }}>
        <div className="text-center py-3 text-[15px] font-semibold" style={{ color: C.text }}>
          {s.downloadConcurrency}
        </div>
        {CONCURRENCY_OPTIONS.map((n) => {
          const on = n === settings.download.concurrent;
          return (
            <button
              key={n}
              {...bindTap({ kind: 'action', id: 'download.running.concurrency.set' }, {
                onTrigger: () => {
                  setDownloadConcurrency(n);
                  setUi(UI_CONCURRENCY, false);
                },
              })}
              className="w-full h-12 bg-transparent border-none text-[15px]"
              style={{ color: on ? C.primary : C.text }}
            >
              {n}个
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar
        title={s.downloadRunning}
        right={
          tasks.length > 0 ? (
            <button
              {...(editing ? editExit : editEnter)}
              className="bg-transparent border-none p-0 text-[15px] whitespace-nowrap"
              style={{ color: C.text }}
            >
              {editing ? s.cancel : s.edit}
            </button>
          ) : undefined
        }
      />

      {/* 按钮行(证据 857:两个等宽浅灰圆角按钮) */}
      <div className="shrink-0 flex items-center gap-3 px-3 py-2">
        <button
          {...bindTap({ kind: 'action', id: 'download.running.pauseAll.toggle' }, {
            onTrigger: toggleDownloadPauseAll,
          })}
          className="flex-1 h-11 rounded-[10px] border-none text-[15px]"
          style={{ background: C.chipGray, color: C.text }}
        >
          {downloadPausedAll ? s.downloadResumeAll : s.downloadPauseAll}
        </button>
        <button
          {...concurrencyToggle}
          className="flex-1 h-11 rounded-[10px] border-none text-[15px]"
          style={{ background: C.chipGray, color: C.text }}
        >
          {s.downloadConcurrency}{settings.download.concurrent}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto flex flex-col"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex-1">
          {tasks.length > 0 ? taskList : (
            <EmptyState
              icon={<span className="mb-3" style={{ color: C.divider }}><IcDownload size={46} /></span>}
              text={<span className="text-[16px]" style={{ color: C.text }}>{s.downloadEmptyRunning}</span>}
              sub={s.downloadEmptyVideoHint}
            />
          )}
        </div>

        <DownloadRecFloor
          title={s.downloadMoreContent}
          items={recommendations}
          getBind={(c) => bindTap('detail.series.open.fromDownloadRec', { params: { contentId: c.id } })}
        />
        <div className="h-2" />
      </div>

      <StorageBar text={`${s.downloadUsed}${fmtSizeMb(usedMb)},${s.downloadRemaining}${downloads.remaining}${s.downloadAvailable}`} />

      {editing && (
        <EditBottomBar
          selectAllLabel={selectedIds.length === tasks.length && tasks.length > 0 ? s.deselectAll : s.selectAll}
          deleteLabel={`${s.delete}(${selectedIds.length})`}
          selectAllBind={selectAllBind}
          deleteBind={deleteBind}
          deleteEnabled={selectedIds.length > 0}
        />
      )}

      {concurrencyOpen && concurrencySheet}
    </div>
  );
}
