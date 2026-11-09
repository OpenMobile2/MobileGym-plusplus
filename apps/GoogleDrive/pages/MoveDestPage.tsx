// apps/GoogleDrive/pages/MoveDestPage.tsx
// apps/GoogleDrive/pages/otherPages.tsx — Gemini / 目标位置选择 / 详情 / 上传确认 / 设置
import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcFolder, IcChevronRight } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { SubPageBar, showToast, ItemIcon } from '../components/common';
import { useChildren } from '../components/listing';

// ═══════════════════════════════════════════════════════════
// 目标位置选择（移动 / 添加快捷方式）—— IMG_2257
// ═══════════════════════════════════════════════════════════
export const MoveDestPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const { bindBack, back } = useGoogleDriveGestures();
  const items = useGoogleDriveStore(st => st.items);
  const move = useGoogleDriveStore(st => st.move);
  const setUploadLocation = useGoogleDriveStore(st => st.setPendingUploadLocation);
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const pending = useGoogleDriveStore(st => st.pendingUpload);
  const [dest, setDest] = useState<string | null>(null);

  const isShortcut = sp.get('mode') === 'shortcut';
  // 上传确认页点 Location 进来时，目标是「待上传文件」而不是已存在的条目
  const forUpload = Boolean(pending) && !items[id];
  /**
   * 是否从多选态进来。判据是「store 里有选中项且包含代表项」，不是「数量 > 1」——
   * 多选态下只勾了一项也得按多选处理，否则移完会留在「已选择 0 项」的空多选态。
   * （离开多选态时 Layout 会清空 selectedIds，所以这里不会被上一次的残留误导。）
   */
  const fromSelection = selected.length > 0 && selected.includes(id);
  const movingIds = fromSelection ? selected : [id];

  /**
   * 候选目标要排除「自己」和「自己的子孙」——
   * 把文件夹移进它自己的子目录会让这棵子树脱离根，列表里就再也找不到了。
   */
  const isInsideMoved = (folderId: string) => {
    for (const movedId of movingIds) {
      let cur: string | null = folderId;
      while (cur) {
        if (cur === movedId) return true;
        cur = items[cur]?.parentId ?? null;
      }
    }
    return false;
  };
  const folders = useChildren(dest).filter(it => it.kind === 'folder' && !isInsideMoved(it.id));

  const commit = () => {
    // 快捷方式尚无独立实体模型；绝不能冒充成 move（会改掉 parentId）
    if (isShortcut) {
      showToast(s.toast_feature_unavailable);
      back(1);
      return;
    }
    if (forUpload) setUploadLocation(dest);
    else movingIds.forEach(mid => move(mid, dest));
    showToast(s.toast_moved);
    // 多选态是「基态 → ?select=1 → 本页」，多退一格才能退出多选
    back(fromSelection ? 2 : 1);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={isShortcut ? s.shortcut_title : s.move_title} a11yClose={s.a11y_close} />
      <div className="px-4 py-2 text-[14px]" style={{ color: GD.textSecondary }}>
        {dest ? items[dest]?.name : s.move_my_drive}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {dest && (
          <button
            data-action="googledrive.move.select.level"
            data-action-params={JSON.stringify({ folderId: '' })}
            onClick={() => setDest(items[dest]?.parentId ?? null)}
            className="w-full flex items-center gap-4 px-6 text-left active:bg-black/5"
            style={{ height: DIM.rowH }}
          >
            <IcFolder size={24} color={GD.typeFolder} />
            <span className="text-[15px]" style={{ color: GD.text }}>..</span>
          </button>
        )}
        {folders.map(f => (
          <button
            key={f.id}
            data-action="googledrive.move.select.level"
            data-action-params={JSON.stringify({ folderId: f.id })}
            onClick={() => setDest(f.id)}
            className="w-full flex items-center gap-4 px-6 text-left active:bg-black/5"
            style={{ height: DIM.rowH }}
          >
            <ItemIcon item={f} />
            <span className="text-[15px] flex-1 truncate" style={{ color: GD.text }}>{f.name}</span>
            <IcChevronRight size={18} color={GD.textSecondary} />
          </button>
        ))}
      </div>
      <div className="shrink-0 flex justify-end gap-2 px-4 py-3" style={{ borderTop: `1px solid ${GD.divider}` }}>
        <button {...bindBack()} className="px-4 h-10 text-[14px]" style={{ color: GD.blue }}>{s.dialog_cancel}</button>
        <button
          data-action="googledrive.move.submit"
          data-action-params={JSON.stringify({ id })}
          onClick={commit}
          className="px-5 h-10 rounded-full text-[14px] text-white"
          style={{ background: GD.blue }}
        >
          {isShortcut ? s.shortcut_confirm : s.move_confirm}
        </button>
      </div>
    </div>
  );
};
