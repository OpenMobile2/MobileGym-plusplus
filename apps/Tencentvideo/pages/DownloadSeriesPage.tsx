// 单剧下载列表(离线播放)。节点 download.series(spec v1.0.0,4 条交互)。
// 视觉证据:7130a7@12(本页只在过场帧露出:返回 + 剧名 + 已下载视频卡)、
// 7130a7@13(点集卡进横屏播放器,左上角 toast「已下载 720P · 省流播放中」)。
// spec note 已说明本页编辑态与「下载更多」入口是低置信推断,按最小结构 + 与 download.mine
// 同款编辑模式实现(勾选圈 + 底部 全选|删除(n))。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { EmptyState, TopBar } from '../components/ui';
import { stillOf } from '../components/detail';
import {
  DownloadThumb,
  EditBottomBar,
  SelectCircle,
  StorageBar,
  fmtSizeMb,
  usedMbOf,
} from '../components/download';
import { IcDownload, IcPlus } from '../res/icons';

const UI_EDITING = 'download.series.editing';
/** 勾选的任务 id(ui 只存标量,用逗号串) */
const UI_SELECTED = 'download.series.selected';

export default function DownloadSeriesPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const content = useTvContent('tv_');
  const downloads = useTencentvideoStore((st) => st.downloads);
  const ui = useTencentvideoStore((st) => st.ui);

  const setUi = useTencentvideoStore((st) => st.setUi);
  const toast = useTencentvideoStore((st) => st.toast);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const deleteDownloads = useTencentvideoStore((st) => st.deleteDownloads);

  const contentId = content?.id ?? '';
  const editing = ui[UI_EDITING] === true;
  const selectedRaw = String(ui[UI_SELECTED] ?? '');
  const selectedIds = useMemo(() => selectedRaw.split(',').filter(Boolean), [selectedRaw]);

  /** 本剧已下载完成的集(只有下完的才能离线播放) */
  const items = useMemo(
    () => downloads.items.filter((t) => t.contentId === contentId && t.status === 'done'),
    [downloads.items, contentId],
  );

  const usedMb = useMemo(() => usedMbOf(downloads.items), [downloads.items]);

  if (!content) return null;

  /* ---------- 绑定 ---------- */

  const setSelected = (ids: string[]) => setUi(UI_SELECTED, ids.join(','));

  // spec 只给本页一条 edit.delete 交互(进多选/勾选/删除同组),统一挂这个 actionId
  const editToggle = bindTap({ kind: 'action', id: 'download.series.edit.delete' }, {
    onTrigger: () => {
      setUi(UI_EDITING, !editing);
      setSelected([]);
    },
  });

  const selectBind = (taskId: string) =>
    bindTap({ kind: 'action', id: 'download.series.edit.delete' }, {
      onTrigger: () => setSelected(
        selectedIds.includes(taskId) ? selectedIds.filter((x) => x !== taskId) : [...selectedIds, taskId],
      ),
    });

  const selectAllBind = bindTap({ kind: 'action', id: 'download.series.edit.delete' }, {
    onTrigger: () => setSelected(
      selectedIds.length === items.length ? [] : items.map((t) => t.id),
    ),
  });

  const deleteBind = bindTap({ kind: 'action', id: 'download.series.edit.delete' }, {
    onTrigger: () => {
      if (selectedIds.length === 0) return;
      deleteDownloads(selectedIds);
      setSelected([]);
      setUi(UI_EDITING, false);
    },
  });

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <TopBar
        title={content.title}
        right={
          items.length > 0 ? (
            <button
              {...editToggle}
              className="bg-transparent border-none p-0 text-[15px] whitespace-nowrap"
              style={{ color: C.text }}
            >
              {editing ? s.cancel : s.edit}
            </button>
          ) : undefined
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {items.length === 0 ? (
          <EmptyState
            icon={<span className="mb-3" style={{ color: C.divider }}><IcDownload size={46} /></span>}
            text={<span className="text-[16px]" style={{ color: C.text }}>{s.downloadEmptySeries}</span>}
            sub="下完的集会出现在这里,可离线播放"
          />
        ) : (
          items.map((t) => {
            const card = (
              <>
                <DownloadThumb imgId={stillOf(content)} alt={content.title} play />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: C.text }}>
                    {t.label}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: C.textSub }}>
                    {t.sizeText} · 未观看
                  </div>
                </div>
              </>
            );
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
                {...(editing
                  ? selectBind(t.id)
                  : // 离线播放:先把播放上下文切到这一集,再进横屏播放器;
                    // 「已下载 720P,省流播放中」toast 按 spec note 挂在这条转场上
                    bindTap('player.fullscreen.open.offlinePlay', {
                      beforeTrigger: () => {
                        openPlayback(contentId, t.episode);
                        toast(downloads.offlineToast);
                      },
                    }))}
              >
                {editing && <SelectCircle checked={selectedIds.includes(t.id)} />}
                {card}
              </div>
            );
          })
        )}

        {/* 下载更多入口(spec:inferred 通用「+下载更多」) */}
        {!editing && (
          <div className="px-3 pt-3">
            <button
              {...bindTap('download.select.open.fromSeries', { params: { contentId } })}
              className="w-full h-11 rounded-[10px] border-none flex items-center justify-center gap-1 text-[14px]"
              style={{ background: C.chipGray, color: C.text }}
            >
              <IcPlus size={16} />下载更多
            </button>
          </div>
        )}
        <div className="h-3" />
      </div>

      <StorageBar text={`已使用${fmtSizeMb(usedMb)},剩余${downloads.remaining}可用`} />

      {editing && (
        <EditBottomBar
          selectAllLabel={selectedIds.length === items.length && items.length > 0 ? s.deselectAll : s.selectAll}
          deleteLabel={`${s.delete}(${selectedIds.length})`}
          selectAllBind={selectAllBind}
          deleteBind={deleteBind}
          deleteEnabled={selectedIds.length > 0}
        />
      )}
    </div>
  );
}
