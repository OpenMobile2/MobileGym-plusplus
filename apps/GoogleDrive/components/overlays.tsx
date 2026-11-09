// apps/GoogleDrive/components/overlays.tsx — 13 个 URL 驱动浮层
//
// 全部渲染在 Layout 里：这样浮层能叠在任意宿主页面之上，底层页面不卸载
// （遮罩后面看得见原来的列表，与真机一致）。可见性一律由 searchParams 推导，
// 绝不用 useState —— 否则系统返回键看不到它，会直接穿透到上一页。
import React, { useEffect, useState } from 'react';
import { matchPath, useLocation, useSearchParams } from 'react-router-dom';
import { sharePlainText } from '@/os/shareBridge';
import { pickImages, saveImageToAlbum, makeTextPosterDataUrl } from '@/os/albumBridge';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';
import * as TimeService from '@/os/TimeService';
import { GD, FOLDER_COLORS } from '../res/colors';
import { DIM } from '../res/dimens';
import {
  IcShare, IcManageAccess, IcStar, IcOffline, IcGemini, IcDownload, IcCopyLink, IcSendCopy,
  IcOpenIn, IcRename, IcMove, IcMakeCopy, IcDetails, IcShortcut, IcPrint, IcRemove, IcChangeColor,
  IcRecent, IcUploads, IcOfflineNav, IcSpam, IcTrash, IcSettings, IcHelp, IcStorage,
  IcUploadFile, IcScanDoc, IcTakePhoto, IcNewFolder, IcFileDoc, IcFileSheet, IcFileSlide,
  IcRestore, IcDeleteForever, IcClose, IcCheck, IcChevronDown, IcChevronRight, IcPerson,
} from '../res/icons';
import { SORT_FIELDS, SEARCH_SORT_FIELDS } from '../constants';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useAppNavigate } from '../navigation';
import { useGoogleDriveStore } from '../state';
import type { AccessRole, SortField } from '../types';
import {
  BottomSheet, SheetHeader, SheetItem, CenterDialog, DialogActions, DialogTextButton,
  showToast, formatSize, formatTemplate, useDateFormat,
  type BindProps,
} from './common';
import { useCurrentFolderId, useOverlayBindings } from './hostBindings';
import { driveShareText } from '../utils/shareLink';

/** 取当前浮层作用的对象 */
function useTargetItem() {
  const [sp] = useSearchParams();
  const items = useGoogleDriveStore(s => s.items);
  const id = sp.get('item');
  return { id, item: id ? items[id] : undefined };
}

function copyDriveLink(name: string, id: string) {
  window.__OS__?.clipboard?.copyText?.(driveShareText(name, id), 'googledrive');
}

function shareDriveItem(name: string, id: string, okToast: string, failToast: string) {
  const launched = sharePlainText(driveShareText(name, id), {
    onResult: (r) => { if (r.resultCode === 'OK') showToast(okToast); },
  });
  if (!launched) showToast(failToast);
}

function payForStorage(subject: string, okToast: string, failToast: string) {
  // 约 100 GB，与模拟套餐价位大致匹配；成功必须写回 store，不能只 toast
  const EXTRA_BYTES = 100 * 1024 * 1024 * 1024;
  const launched = window.__OS__?.startActivityForResult?.(
    {
      action: 'ACTION_PAY',
      scheme: 'alipays',
      data: {
        amount: 29.99,
        orderId: `googledrive-storage-${TimeService.now()}`,
        merchantName: 'Google One',
        subject,
        source: 'googledrive',
      },
    },
    (result) => {
      if (result.resultCode !== 'OK') return;
      useGoogleDriveStore.getState().expandStorage(EXTRA_BYTES);
      showToast(okToast);
    },
  );
  if (!launched) showToast(failToast);
}

// ═══════════════════════════════════════════════════════════
// 文件 ⋮ 菜单（16 项，可上拖展开 —— IMG_2277 + IMG_2291）
// ═══════════════════════════════════════════════════════════
export const FileMenuSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, back } = useGoogleDriveGestures();
  const { renameProps, confirmTrashProps } = useOverlayBindings();
  const { id, item } = useTargetItem();
  const starred = useGoogleDriveStore(st => st.starredIds);
  const offline = useGoogleDriveStore(st => st.offlineIds);
  const toggleStar = useGoogleDriveStore(st => st.toggleStar);
  const toggleOffline = useGoogleDriveStore(st => st.toggleOffline);
  const duplicate = useGoogleDriveStore(st => st.duplicate);
  const fmt = useDateFormat();

  if (sp.get('menu') !== 'file' || !item || !id) return null;
  const isStarred = starred.includes(id);
  const isOffline = offline.includes(id);
  const run = (fn: () => void, toast: string) => () => { fn(); showToast(toast); back(); };
  const nope = () => { showToast(s.toast_feature_unavailable); back(); };
  const params = { item: id };

  return (
    <BottomSheet expandable header={<SheetHeader item={item} subtitle={`${s.sub_modified} ${fmt(item.modifiedAt)}`} />}>
      <SheetItem
        icon={IcShare}
        label={s.menu_share}
        bind={{ 'data-action': 'googledrive.item.share', 'data-action-params': JSON.stringify(params) }}
        onClick={() => { shareDriveItem(item.name, id, s.toast_shared, s.toast_feature_unavailable); back(); }}
      />
      <SheetItem icon={IcManageAccess} label={s.menu_manage_access} bind={bindTap('googledrive.item.access.open', { params: { id } })} />
      <SheetItem
        icon={IcStar}
        label={isStarred ? s.menu_remove_from_starred : s.menu_add_to_starred}
        bind={{ 'data-action': 'googledrive.item.star.toggle', 'data-action-params': JSON.stringify(params) }}
        onClick={run(() => toggleStar(id), isStarred ? s.toast_unstarred : s.toast_starred)}
      />
      <SheetItem
        icon={IcOffline}
        label={isOffline ? s.menu_remove_offline : s.menu_make_offline}
        bind={{ 'data-action': 'googledrive.item.offline.toggle', 'data-action-params': JSON.stringify(params) }}
        onClick={run(() => toggleOffline(id), isOffline ? s.toast_offline_off : s.toast_offline_on)}
      />
      <SheetItem icon={IcGemini} label={s.menu_ask_gemini} badge={s.menu_badge_new} bind={bindTap('googledrive.item.gemini.open', { params: { ctx: id } })} />
      <SheetItem
        icon={IcDownload}
        label={s.menu_download}
        bind={{ 'data-action': 'googledrive.item.download', 'data-action-params': JSON.stringify(params) }}
        onClick={() => {
          const dataUrl = makeTextPosterDataUrl([item.name, formatSize(item.size)], { title: 'Google Drive' });
          void saveImageToAlbum(dataUrl, {
            album: 'Saved',
            fileName: `drive_${id}_${TimeService.now()}.svg`,
            mimeType: 'image/svg+xml',
          }).then((saved) => {
            showToast(saved ? s.toast_saved_album : s.toast_feature_unavailable);
            back();
          });
        }}
      />
      <SheetItem
        icon={IcCopyLink}
        label={s.menu_copy_link}
        bind={{ 'data-action': 'googledrive.item.copyLink', 'data-action-params': JSON.stringify(params) }}
        onClick={run(() => copyDriveLink(item.name, id), s.toast_link_copied)}
      />
      <SheetItem
        icon={IcSendCopy}
        label={s.menu_send_copy}
        bind={{ 'data-action': 'googledrive.item.sendCopy', 'data-action-params': JSON.stringify(params) }}
        onClick={() => { shareDriveItem(item.name, id, s.toast_shared, s.toast_feature_unavailable); back(); }}
      />
      <SheetItem icon={IcOpenIn} label={s.menu_open_in} bind={{ 'data-action': 'googledrive.item.openIn.unavailable' }} onClick={nope} />
      <SheetItem icon={IcRename} label={s.menu_rename} bind={renameProps} />
      <SheetItem icon={IcMove} label={s.menu_move} bind={bindTap('googledrive.item.move.open', { params: { id } })} />
      <SheetItem
        icon={IcMakeCopy}
        label={s.menu_make_copy}
        bind={{ 'data-action': 'googledrive.item.duplicate', 'data-action-params': JSON.stringify(params) }}
        onClick={run(() => duplicate(id, formatTemplate(s.copy_of_name, { name: item.name })), s.toast_copy_made)}
      />
      <SheetItem icon={IcDetails} label={s.menu_details} bind={bindTap('googledrive.item.details.open', { params: { id } })} />
      <SheetItem icon={IcShortcut} label={s.menu_add_shortcut} bind={bindTap('googledrive.item.shortcut.open', { params: { id } })} />
      <SheetItem icon={IcPrint} label={s.menu_print} bind={{ 'data-action': 'googledrive.item.print.unavailable' }} onClick={nope} />
      <SheetItem icon={IcRemove} label={s.menu_remove} bind={confirmTrashProps} />
    </BottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════
// 文件夹 ⋮ 菜单（11 项 —— IMG_2252）
// ═══════════════════════════════════════════════════════════
export const FolderMenuSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, back } = useGoogleDriveGestures();
  const { renameProps, confirmTrashProps, colorProps } = useOverlayBindings();
  const { id, item } = useTargetItem();
  const starred = useGoogleDriveStore(st => st.starredIds);
  const toggleStar = useGoogleDriveStore(st => st.toggleStar);

  if (sp.get('menu') !== 'folder' || !item || !id) return null;
  const isStarred = starred.includes(id);
  const run = (fn: () => void, toast: string) => () => { fn(); showToast(toast); back(); };
  const nope = () => { showToast(s.toast_feature_unavailable); back(); };
  const params = { item: id };

  return (
    <BottomSheet header={<SheetHeader item={item} />}>
      <SheetItem
        icon={IcShare}
        label={s.menu_share}
        bind={{ 'data-action': 'googledrive.folder.share', 'data-action-params': JSON.stringify(params) }}
        onClick={() => { shareDriveItem(item.name, id, s.toast_shared, s.toast_feature_unavailable); back(); }}
      />
      <SheetItem icon={IcManageAccess} label={s.menu_manage_access} bind={bindTap('googledrive.item.access.open', { params: { id } })} />
      <SheetItem
        icon={IcStar}
        label={isStarred ? s.menu_remove_from_starred : s.menu_add_to_starred}
        bind={{ 'data-action': 'googledrive.folder.star.toggle', 'data-action-params': JSON.stringify(params) }}
        onClick={run(() => toggleStar(id), isStarred ? s.toast_unstarred : s.toast_starred)}
      />
      <SheetItem icon={IcGemini} label={s.menu_ask_gemini} badge={s.menu_badge_new} bind={bindTap('googledrive.item.gemini.open', { params: { ctx: id } })} />
      <SheetItem
        icon={IcCopyLink}
        label={s.menu_copy_link}
        bind={{ 'data-action': 'googledrive.folder.copyLink', 'data-action-params': JSON.stringify(params) }}
        onClick={run(() => copyDriveLink(item.name, id), s.toast_link_copied)}
      />
      <SheetItem icon={IcChangeColor} label={s.menu_change_color} bind={colorProps} />
      <SheetItem icon={IcRename} label={s.menu_rename} bind={renameProps} />
      <SheetItem icon={IcMove} label={s.menu_move} bind={bindTap('googledrive.item.move.open', { params: { id } })} />
      <SheetItem icon={IcDetails} label={s.menu_details} bind={bindTap('googledrive.item.details.open', { params: { id } })} />
      <SheetItem icon={IcShortcut} label={s.menu_add_shortcut} bind={bindTap('googledrive.item.shortcut.open', { params: { id } })} />
      <SheetItem icon={IcRemove} label={s.menu_remove} bind={confirmTrashProps} />
    </BottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════
// 多选态 ⋮ 菜单（4 项，Ask Gemini 在含文件夹时置灰 —— IMG_2261）
// ═══════════════════════════════════════════════════════════
export const SelectionMenuSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, back } = useGoogleDriveGestures();
  const { selectionConfirmProps } = useOverlayBindings();
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const starred = useGoogleDriveStore(st => st.starredIds);
  const items = useGoogleDriveStore(st => st.items);
  const toggleStar = useGoogleDriveStore(st => st.toggleStar);

  if (sp.get('menu') !== 'selection') return null;
  const hasFolder = selected.some(id => items[id]?.kind === 'folder');
  const first = selected[0];

  return (
    <BottomSheet
      header={
        <div className="px-4 py-4 text-[15px]" style={{ borderBottom: `1px solid ${GD.divider}`, color: GD.text }}>
          {formatTemplate(s.selection_count, { n: selected.length })}
        </div>
      }
    >
      <SheetItem
        icon={IcStar}
        label={s.menu_add_to_starred}
        bind={{ 'data-action': 'googledrive.selection.star' }}
        onClick={() => {
          // 「添加到星标」只加不取消；已加星的保持不变
          selected.forEach(id => { if (!starred.includes(id)) toggleStar(id); });
          showToast(s.toast_starred);
          back();
        }}
      />
      <SheetItem
        icon={IcGemini}
        label={s.menu_ask_gemini}
        disabled={hasFolder}
        bind={{ 'data-action': hasFolder ? 'googledrive.selection.gemini.disabled' : 'googledrive.selection.gemini.unavailable' }}
        onClick={hasFolder ? undefined : () => { showToast(s.toast_feature_unavailable); back(); }}
      />
      {/* 目标位置选择页按 :id 取一个代表项，实际移动作用于全部选中项（见 MoveDestPage） */}
      <SheetItem
        icon={IcMove}
        label={s.menu_move}
        bind={first ? bindTap('googledrive.selection.move.open', { params: { id: first } }) : undefined}
      />
      <SheetItem icon={IcRemove} label={s.menu_remove} bind={selectionConfirmProps} />
    </BottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════
// 回收站项 ⋮ 菜单（3 项 —— IMG_2293）
// ═══════════════════════════════════════════════════════════
export const TrashItemMenuSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, back } = useGoogleDriveGestures();
  const { id, item } = useTargetItem();
  const restore = useGoogleDriveStore(st => st.restore);

  if (sp.get('menu') !== 'trash' || !item || !id) return null;

  return (
    <BottomSheet header={<SheetHeader item={item} />}>
      <SheetItem icon={IcDetails} label={s.menu_details} bind={bindTap('googledrive.item.details.open', { params: { id } })} />
      <SheetItem
        icon={IcRestore}
        label={s.trash_restore}
        bind={{ 'data-action': 'googledrive.trash.restore', 'data-action-params': JSON.stringify({ item: id }) }}
        onClick={() => { restore(id); showToast(s.toast_restored); back(); }}
      />
      <SheetItem icon={IcDeleteForever} label={s.trash_delete_forever} bind={bindTap('googledrive.trash.confirm.deleteForever')} />
    </BottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════
// 重命名对话框（IMG_2256）；scope=upload 时改的是待上传文件名
// ═══════════════════════════════════════════════════════════
export const RenameDialog: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { back } = useGoogleDriveGestures();
  const { host } = useOverlayBindings();
  const { id, item } = useTargetItem();
  const pending = useGoogleDriveStore(st => st.pendingUpload);
  const rename = useGoogleDriveStore(st => st.rename);
  const renamePending = useGoogleDriveStore(st => st.renamePendingUpload);
  const isUpload = host === 'upload';
  const initial = isUpload ? (pending?.name ?? '') : (item?.name ?? '');
  const [value, setValue] = useState(initial);
  const open = sp.get('dialog') === 'rename';

  useEffect(() => { if (open) setValue(initial); }, [open, initial]);

  if (!open) return null;
  if (!isUpload && !item) return null;

  const title = isUpload
    ? s.dialog_rename_file
    : item?.kind === 'folder' ? s.dialog_rename_folder : s.dialog_rename_file;
  const commit = () => {
    if (isUpload) renamePending(value);
    else if (id) rename(id, value);
    showToast(s.toast_renamed);
    back();
  };

  return (
    <CenterDialog>
      <div className="px-6 pt-6 pb-2">
        <div className="text-[18px] mb-4" style={{ color: GD.text }}>{title}</div>
        <label className="block text-[11px] mb-1" style={{ color: GD.blue }}>{s.dialog_name_label}</label>
        <input
          data-action="googledrive.rename.input"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          className="w-full text-[15px] outline-none pb-1"
          style={{ color: GD.text, borderBottom: `2px solid ${GD.blue}` }}
        />
      </div>
      <DialogActions>
        <DialogTextButton label={s.dialog_cancel} onClick={() => back()} />
        <DialogTextButton
          label={s.dialog_rename_confirm}
          disabled={!value.trim()}
          bind={{ 'data-action': 'googledrive.rename.submit', 'data-action-params': JSON.stringify({ item: id ?? '' }) }}
          onClick={commit}
        />
      </DialogActions>
    </CenterDialog>
  );
};

// ═══════════════════════════════════════════════════════════
// 新建文件夹对话框（IMG_2247 的结果态反推）
// ═══════════════════════════════════════════════════════════
export const NewFolderDialog: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { back } = useGoogleDriveGestures();
  const createFolder = useGoogleDriveStore(st => st.createFolder);
  // 在文件夹页新建就建在当前文件夹下，其余情况建在我的云端硬盘根。
  // 之前读的是一个从没人设过的 ?parent 参数，导致在文件夹里新建也落到了根目录。
  const parentId = useCurrentFolderId();
  const [value, setValue] = useState('');
  const open = sp.get('dialog') === 'newfolder';

  useEffect(() => { if (open) setValue(''); }, [open]);
  if (!open) return null;

  return (
    <CenterDialog>
      <div className="px-6 pt-6 pb-2">
        <div className="text-[18px] mb-4" style={{ color: GD.text }}>{s.dialog_new_folder}</div>
        <label className="block text-[11px] mb-1" style={{ color: GD.blue }}>{s.dialog_name_label}</label>
        <input
          data-action="googledrive.newfolder.input"
          value={value}
          onChange={e => setValue(e.target.value)}
          autoFocus
          placeholder={s.untitled_folder}
          className="w-full text-[15px] outline-none pb-1"
          style={{ color: GD.text, borderBottom: `2px solid ${GD.blue}` }}
        />
      </div>
      <DialogActions>
        <DialogTextButton label={s.dialog_cancel} onClick={() => back()} />
        <DialogTextButton
          label={s.dialog_create}
          bind={{ 'data-action': 'googledrive.newfolder.submit' }}
          onClick={() => { createFolder(value, parentId, s.untitled_folder); showToast(s.toast_folder_created); back(); }}
        />
      </DialogActions>
    </CenterDialog>
  );
};

// ═══════════════════════════════════════════════════════════
// Select color 对话框（居中，每行 7 个共 24 色 —— IMG_2296）
// ═══════════════════════════════════════════════════════════
export const ColorDialog: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { back } = useGoogleDriveGestures();
  const { id, item } = useTargetItem();
  const setColor = useGoogleDriveStore(st => st.setFolderColor);

  if (sp.get('dialog') !== 'color' || !item || !id) return null;

  return (
    <CenterDialog wide>
      <div className="px-5 pt-5 pb-2">
        <div className="text-[18px] mb-4" style={{ color: GD.text }}>{s.dialog_select_color}</div>
        <div className="grid grid-cols-7 gap-2">
          {FOLDER_COLORS.map(c => (
            <button
              key={c}
              data-action="googledrive.folder.select.color"
              data-action-params={JSON.stringify({ item: id, color: c })}
              onClick={() => { setColor(id, c); showToast(s.toast_color_changed); back(); }}
              className="rounded-full flex items-center justify-center"
              style={{ width: 30, height: 30, background: c, outline: item.color === c ? `2px solid ${GD.text}` : 'none', outlineOffset: 2 }}
              aria-label={c}
            >
              {item.color === c && <IcCheck size={16} color="#fff" />}
            </button>
          ))}
        </div>
      </div>
      <DialogActions>
        <DialogTextButton label={s.dialog_cancel} onClick={() => back()} />
      </DialogActions>
    </CenterDialog>
  );
};

// ═══════════════════════════════════════════════════════════
// 确认对话框（trash / deleteForever / emptyTrash 三态 —— IMG_2258 / 2281）
// ═══════════════════════════════════════════════════════════
export const ConfirmDialog: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { back } = useGoogleDriveGestures();
  const { id, item } = useTargetItem();
  const selected = useGoogleDriveStore(st => st.selectedIds);
  const moveToTrash = useGoogleDriveStore(st => st.moveToTrash);
  const moveManyToTrash = useGoogleDriveStore(st => st.moveManyToTrash);
  const deleteForever = useGoogleDriveStore(st => st.deleteForever);
  const emptyTrash = useGoogleDriveStore(st => st.emptyTrash);

  const kind = sp.get('confirm');
  const isMulti = sp.get('select') === '1';
  if (!kind) return null;

  const name = item?.name ?? '';
  const conf =
    kind === 'emptyTrash'
      ? { title: s.dialog_empty_trash_title, body: s.dialog_empty_trash_body, ok: s.dialog_empty_trash_confirm, danger: true,
          run: () => { emptyTrash(); showToast(s.toast_trash_emptied); } }
      : kind === 'deleteForever'
        ? { title: s.dialog_delete_forever_title, body: formatTemplate(s.dialog_delete_forever_body, { name }), ok: s.dialog_delete_forever_confirm, danger: true,
            run: () => { if (id) deleteForever(id); showToast(s.toast_deleted_forever); } }
        : { title: s.dialog_trash_title,
            body: isMulti
              ? formatTemplate(s.dialog_trash_body_multi, { n: selected.length })
              : formatTemplate(s.dialog_trash_body, { name }),
            ok: s.dialog_trash_confirm, danger: false,
            run: () => {
              if (isMulti) moveManyToTrash(selected);
              else if (id) moveToTrash(id);
              showToast(s.toast_moved_to_trash);
            } };

  // 多选态的历史是「基态 → ?select=1 → 本对话框」，只退一格会停在「已选择 0 项」的空多选态
  const popSteps = isMulti ? 2 : 1;

  return (
    <CenterDialog>
      <div className="px-6 pt-6 pb-2">
        <div className="text-[18px] mb-3" style={{ color: GD.text }}>{conf.title}</div>
        {conf.body && <div className="text-[14px] leading-relaxed" style={{ color: GD.textSecondary }}>{conf.body}</div>}
      </div>
      <DialogActions>
        <DialogTextButton label={s.dialog_cancel} onClick={() => back()} />
        <DialogTextButton
          label={conf.ok}
          danger={conf.danger}
          bind={{ 'data-action': 'googledrive.confirm.submit' }}
          onClick={() => { conf.run(); back(popSteps); }}
        />
      </DialogActions>
    </CenterDialog>
  );
};

// ═══════════════════════════════════════════════════════════
// ＋ 新建菜单（7 项 —— IMG_2225）
// ═══════════════════════════════════════════════════════════
export const CreateMenuSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, back } = useGoogleDriveGestures();
  const { go } = useAppNavigate();
  const { newFolderProps } = useOverlayBindings();
  const currentFolderId = useCurrentFolderId();
  const setPending = useGoogleDriveStore(st => st.setPendingUpload);
  const createDocument = useGoogleDriveStore(st => st.createDocument);

  if (sp.get('create') !== 'open') return null;

  const pickThenConfirm = (
    fallbackName: string,
    kind: 'image' | 'pdf',
    which: 'photo' | 'scan',
  ) => {
    void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
      if (r.cancelled || !r.selected.length) return;
      const sel = r.selected[0];
      setPending(sel.name || fallbackName, kind, currentFolderId, sel.size || 0);
      try {
        if (which === 'scan') {
          go('googledrive.create.scan.confirm', currentFolderId ? { to: currentFolderId } : {});
        } else {
          go('googledrive.create.photo.confirm', currentFolderId ? { to: currentFolderId } : {});
        }
      } catch {
        showToast(s.toast_feature_unavailable);
      }
    });
  };

  const makeDoc = (kind: 'doc' | 'sheet' | 'slide', name: string, toast: string) => {
    createDocument(kind, currentFolderId, name);
    showToast(toast);
    back();
  };

  return (
    <BottomSheet>
      <div className="h-2" />
      {/*
        先进本机文件选择器真正挑一个文件，不再硬编码文件名（阶段⑥反馈）。
        当前所在文件夹要随 URL 带到选择器：选择器已经不在 /folder/:id 上，
        否则不管在哪个文件夹点 ＋ 都会上传到根目录。
      */}
      <SheetItem
        icon={IcUploadFile}
        label={s.create_upload_file}
        bind={bindTap('googledrive.create.upload', currentFolderId ? { params: { to: currentFolderId } } : undefined)}
      />
      <SheetItem
        icon={IcScanDoc}
        label={s.create_scan}
        bind={{ 'data-action': 'googledrive.create.scan' }}
        onClick={() => pickThenConfirm('Scan.pdf', 'pdf', 'scan')}
      />
      <SheetItem
        icon={IcTakePhoto}
        label={s.create_take_photo}
        bind={{ 'data-action': 'googledrive.create.photo' }}
        onClick={() => pickThenConfirm('IMG.jpg', 'image', 'photo')}
      />
      <SheetItem icon={IcNewFolder} label={s.create_folder} bind={newFolderProps} />
      <SheetItem
        icon={IcFileDoc}
        label={s.create_gdoc}
        bind={{ 'data-action': 'googledrive.create.newDoc', 'data-action-params': JSON.stringify({ kind: 'doc' }) }}
        onClick={() => makeDoc('doc', s.untitled_doc, s.toast_doc_created)}
      />
      <SheetItem
        icon={IcFileSheet}
        label={s.create_gsheet}
        bind={{ 'data-action': 'googledrive.create.newDoc', 'data-action-params': JSON.stringify({ kind: 'sheet' }) }}
        onClick={() => makeDoc('sheet', s.untitled_sheet, s.toast_sheet_created)}
      />
      <SheetItem
        icon={IcFileSlide}
        label={s.create_gslide}
        bind={{ 'data-action': 'googledrive.create.newDoc', 'data-action-params': JSON.stringify({ kind: 'slide' }) }}
        onClick={() => makeDoc('slide', s.untitled_slide, s.toast_slide_created)}
      />
    </BottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════
// 排序菜单（锚定左上的弹出浮层，非底部弹层 —— IMG_2250）
// ═══════════════════════════════════════════════════════════
export const SortMenu: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindBack, back } = useGoogleDriveGestures();
  const { host } = useOverlayBindings();
  const sort = useGoogleDriveStore(st => st.sort);
  const searchSort = useGoogleDriveStore(st => st.searchSort);
  const setSort = useGoogleDriveStore(st => st.setSort);
  const setSearchSort = useGoogleDriveStore(st => st.setSearchSort);

  if (sp.get('sort') !== 'open') return null;
  const onResults = host === 'results';
  // 锚点按真实的排序 chip 位置算：文件夹页和搜索结果页没有顶部搜索栏，
  // 写死 topBarH + 44 会让浮层浮在错误的高度上。
  const chip = typeof document !== 'undefined'
    ? document.querySelector('[data-gd-sortchip]')?.getBoundingClientRect()
    : undefined;
  const anchorTop = chip ? chip.bottom + 4 : DIM.topBarH + 44;
  const cur = onResults ? searchSort : sort;
  const apply = onResults ? setSearchSort : setSort;
  const fields = onResults ? SEARCH_SORT_FIELDS : SORT_FIELDS;

  const Row: React.FC<{ label: string; active: boolean; bind: BindProps; onClick: () => void }> =
    ({ label, active, bind, onClick }) => (
      <button {...bind} onClick={onClick} className="w-full flex items-center gap-3 px-4 h-12 text-left active:bg-black/5">
        <span className="w-5 shrink-0">{active && <IcCheck size={18} color={GD.blue} />}</span>
        <span className="text-[14px]" style={{ color: active ? GD.blue : GD.text }}>{label}</span>
      </button>
    );

  return (
    <div data-gd-overlay="popup" className="absolute inset-0 z-[210]">
      <div {...bindBack()} className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.06)' }} />
      <div
        className="absolute bg-white rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.22)] overflow-hidden py-1"
        style={{ left: DIM.pagePadding, top: anchorTop, minWidth: 240 }}
      >
        <div className="px-4 pt-2 pb-1 text-[11px]" style={{ color: GD.textSecondary }}>{s.sort_by}</div>
        {fields.map(f => (
          <Row
            key={f.id}
            label={s[f.labelKey as keyof typeof s]}
            active={cur.field === f.id}
            bind={{ 'data-action': 'googledrive.sort.select.field', 'data-action-params': JSON.stringify({ field: f.id }) }}
            onClick={() => { apply(f.id as SortField, cur.order); back(); }}
          />
        ))}
        <div style={{ borderTop: `1px solid ${GD.divider}` }} />
        <Row
          label={s.sort_a_to_z}
          active={cur.order === 'asc'}
          bind={{ 'data-action': 'googledrive.sort.select.order', 'data-action-params': JSON.stringify({ order: 'asc' }) }}
          onClick={() => { apply(cur.field, 'asc'); back(); }}
        />
        <Row
          label={s.sort_z_to_a}
          active={cur.order === 'desc'}
          bind={{ 'data-action': 'googledrive.sort.select.order', 'data-action-params': JSON.stringify({ order: 'desc' }) }}
          onClick={() => { apply(cur.field, 'desc'); back(); }}
        />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 左侧抽屉（IMG_2223 / 2286）
// ═══════════════════════════════════════════════════════════
export const DrawerPanel: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, bindBack } = useGoogleDriveGestures();
  const { storageProps } = useOverlayBindings();
  const storage = useGoogleDriveStore(st => st.storage);

  if (sp.get('drawer') !== 'open') return null;
  const used = storage.driveBytes + storage.gmailBytes + storage.photosBytes;
  const pct = Math.min(100, (used / storage.totalBytes) * 100);

  return (
    <div data-gd-overlay="drawer" className="absolute inset-0 z-[200] flex">
      <div className="relative bg-white flex flex-col" style={{ width: 300 }}>
        <div className="pt-10" />
        <div className="px-5 py-4 text-[20px]" style={{ color: GD.blue }}>{s.app_name}</div>
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          <SheetItem icon={IcRecent} label={s.drawer_recent} bind={bindTap('googledrive.drawer.recent')} />
          <SheetItem icon={IcUploads} label={s.drawer_uploads} bind={bindTap('googledrive.drawer.uploads')} />
          <SheetItem icon={IcOfflineNav} label={s.drawer_offline} bind={bindTap('googledrive.drawer.offline')} />
          <SheetItem icon={IcSpam} label={s.drawer_spam} bind={bindTap('googledrive.drawer.spam')} />
          <SheetItem icon={IcTrash} label={s.drawer_trash} bind={bindTap('googledrive.drawer.trash')} />
          <div style={{ borderTop: `1px solid ${GD.divider}` }} />
          <SheetItem icon={IcSettings} label={s.drawer_settings} bind={bindTap('googledrive.drawer.settings')} />
          <SheetItem icon={IcHelp} label={s.drawer_help} bind={bindTap('googledrive.drawer.help')} />
          <div style={{ borderTop: `1px solid ${GD.divider}` }} />
          <button {...(storageProps ?? {})} className="w-full text-left px-4 pt-4 pb-2">
            <div className="flex items-center gap-3 mb-2">
              <IcStorage size={20} color={GD.textSecondary} />
              <span className="text-[14px]" style={{ color: GD.text }}>{s.drawer_storage}</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: GD.divider }}>
              <div className="h-full" style={{ width: `${pct}%`, background: GD.blue }} />
            </div>
            <div className="text-[12px] mt-2" style={{ color: GD.textSecondary }}>
              {formatTemplate(s.drawer_storage_used, { used: formatSize(used), total: formatSize(storage.totalBytes) })}
            </div>
          </button>
          <div className="px-4 pb-6 pt-1">
            <button
              data-action="googledrive.storage.get"
              onClick={() => payForStorage(s.storage_get, s.toast_pay_success, s.toast_feature_unavailable)}
              className="px-4 h-9 rounded-full text-[13px]"
              style={{ border: `1px solid ${GD.divider}`, color: GD.blue }}
            >
              {s.drawer_get_more_storage}
            </button>
          </div>
        </div>
      </div>
      <div {...bindBack()} className="flex-1" style={{ background: GD.scrim }} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 账号面板（IMG_2226 / 2227 / 2228）
// ═══════════════════════════════════════════════════════════
export const AccountPanel: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindTap, bindBack } = useGoogleDriveGestures();
  const user = useGoogleDriveStore(st => st.user);
  const setUserAvatar = useGoogleDriveStore(st => st.setUserAvatar);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [manage, setManage] = useState(false);

  if (sp.get('account') !== 'open') return null;
  const nope = () => showToast(s.toast_feature_unavailable);

  return (
    <div data-gd-overlay="panel" className="absolute inset-0 z-[200] flex flex-col">
      <div {...bindBack()} className="flex-1" style={{ background: GD.scrim }} />
      <div className="bg-white rounded-t-2xl max-h-[86%] overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[16px]" style={{ color: GD.text }}>{s.app_name}</span>
          <button {...bindBack()} className="px-3 py-1.5 text-[14px]" style={{ color: GD.blue }}>{s.account_done}</button>
        </div>
        <div className="flex flex-col items-center py-4 gap-2" style={{ borderTop: `1px solid ${GD.divider}` }}>
          <button
            data-action="googledrive.account.avatar"
            onClick={() => {
              void pickImages({ multiple: false, maxSelect: 1 }).then((r) => {
                if (r.cancelled || !r.selected.length) return;
                // 存 FS path，展示走 AsyncFsImage（IndexedDB 素材的 uri 可能为空）
                setUserAvatar(r.selected[0].path || r.selected[0].uri);
                showToast(s.toast_avatar_updated);
              });
            }}
            className="w-16 h-16 rounded-full flex items-center justify-center text-[24px] text-white overflow-hidden"
            style={{ background: user.avatarColor }}
          >
            {user.avatar
              ? <AsyncFsImage path={user.avatar} alt="" className="w-full h-full object-cover" />
              : user.name.slice(0, 1)}
          </button>
          <div className="text-[16px]" style={{ color: GD.text }}>{user.name}</div>
          <div className="text-[13px]" style={{ color: GD.textSecondary }}>{user.email}</div>
          <button
            data-action="googledrive.account.google.unavailable"
            onClick={nope}
            className="mt-2 px-4 h-9 rounded-full text-[13px]"
            style={{ border: `1px solid ${GD.divider}`, color: GD.text }}
          >
            {s.account_manage_google}
          </button>
        </div>
        <div style={{ borderTop: `1px solid ${GD.divider}` }} />
        <button
          data-action="googledrive.account.switch.toggle"
          onClick={() => setSwitchOpen(v => !v)}
          className="w-full flex items-center gap-4 px-4 h-14 text-left active:bg-black/5"
        >
          <IcPerson size={20} color={GD.textSecondary} />
          <span className="text-[15px] flex-1" style={{ color: GD.text }}>{s.account_switch}</span>
          {switchOpen ? <IcChevronDown size={18} color={GD.textSecondary} /> : <IcChevronRight size={18} color={GD.textSecondary} />}
        </button>
        {switchOpen && (
          <div className="pl-4">
            <SheetItem
              icon={IcPerson}
              label={s.account_add}
              bind={{ 'data-action': 'googledrive.account.add.unavailable' }}
              onClick={nope}
            />
            <SheetItem
              icon={IcSettings}
              label={manage ? s.account_remove_device : s.account_manage_devices}
              bind={manage
                ? { 'data-action': 'googledrive.account.remove.unavailable' }
                : { 'data-action': 'googledrive.account.manage' }}
              onClick={manage ? nope : () => setManage(true)}
            />
          </div>
        )}
        <div style={{ borderTop: `1px solid ${GD.divider}` }} />
        <SheetItem icon={IcSettings} label={s.account_drive_settings} bind={bindTap('googledrive.account.settings')} />
        <SheetItem icon={IcHelp} label={s.drawer_help} bind={bindTap('googledrive.account.help')} />
        <div className="h-6" />
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 存储空间弹层（只保留 storage 态 —— googleOne 购买态已 wontfix）
// ═══════════════════════════════════════════════════════════
export const StorageSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { bindBack } = useGoogleDriveGestures();
  const storage = useGoogleDriveStore(st => st.storage);

  if (sp.get('sheet') !== 'storage') return null;
  const used = storage.driveBytes + storage.gmailBytes + storage.photosBytes;
  const seg = (v: number) => `${(v / storage.totalBytes) * 100}%`;
  const nope = () => showToast(s.toast_feature_unavailable);

  return (
    <BottomSheet
      header={
        <div className="flex items-center justify-end px-2 pt-2">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center" aria-label={s.a11y_close}>
            <IcClose size={20} color={GD.text} />
          </button>
        </div>
      }
    >
      <div className="px-5 pb-2">
        <div className="text-[20px] leading-snug mb-2" style={{ color: GD.text }}>{s.storage_title}</div>
        <div className="text-[13px] mb-5" style={{ color: GD.textSecondary }}>
          {formatTemplate(s.storage_desc, { total: formatSize(storage.totalBytes) })}
        </div>
        <div className="h-2 rounded-full overflow-hidden flex" style={{ background: GD.divider }}>
          <div style={{ width: seg(storage.driveBytes), background: GD.brandBlue }} />
          <div style={{ width: seg(storage.gmailBytes), background: GD.brandRed }} />
          <div style={{ width: seg(storage.photosBytes), background: GD.brandYellow }} />
        </div>
        <div className="text-[12px] mt-2 mb-4" style={{ color: GD.textSecondary }}>
          {formatTemplate(s.storage_used_of, { used: formatSize(used), total: formatSize(storage.totalBytes) })}
        </div>
        <div className="flex flex-col gap-2 mb-5">
          {[
            { c: GD.brandBlue, k: s.storage_item_drive, v: storage.driveBytes },
            { c: GD.brandRed, k: s.storage_item_gmail, v: storage.gmailBytes },
            { c: GD.brandYellow, k: s.storage_item_photos, v: storage.photosBytes },
          ].map(row => (
            <div key={row.k} className="flex items-center gap-2 text-[13px]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: row.c }} />
              <span className="flex-1" style={{ color: GD.text }}>{row.k}</span>
              <span style={{ color: GD.textSecondary }}>{formatSize(row.v)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mb-4">
          <button
            data-action="googledrive.storage.get"
            onClick={() => payForStorage(s.storage_get, s.toast_pay_success, s.toast_feature_unavailable)}
            className="flex-1 h-10 rounded-full text-[14px] text-white"
            style={{ background: GD.blue }}
          >
            {s.storage_get}
          </button>
          <button
            data-action="googledrive.storage.cleanup.unavailable"
            onClick={nope}
            className="flex-1 h-10 rounded-full text-[14px]"
            style={{ border: `1px solid ${GD.divider}`, color: GD.blue }}
          >
            {s.storage_cleanup}
          </button>
        </div>
        <button
          data-action="googledrive.storage.learnMore.unavailable"
          onClick={nope}
          className="text-[13px]"
          style={{ color: GD.blue }}
        >
          {s.storage_learn_more}
        </button>
      </div>
    </BottomSheet>
  );
};

// ═══════════════════════════════════════════════════════════
// 管理访问权限：修改协作者角色（挂在 Layout，避免被页面裁切）
// ═══════════════════════════════════════════════════════════
const PERSON_ROLES: AccessRole[] = ['viewer', 'commenter', 'editor'];

export const PersonRoleSheet: React.FC = () => {
  const s = useGoogleDriveStrings();
  const [sp] = useSearchParams();
  const { pathname } = useLocation();
  const { bindBack, back } = useGoogleDriveGestures();
  const contacts = useGoogleDriveStore(st => st.contacts);
  const items = useGoogleDriveStore(st => st.items);
  const setCollaboratorRole = useGoogleDriveStore(st => st.setCollaboratorRole);
  const removeCollaborator = useGoogleDriveStore(st => st.removeCollaborator);

  if (sp.get('dialog') !== 'personRole') return null;
  const itemId = matchPath({ path: '/access/:id', end: true }, pathname)?.params.id;
  const personId = sp.get('person');
  if (!itemId || !personId) return null;

  const contact = contacts.find(c => c.id === personId);
  const item = items[itemId];
  if (!contact || !item) return null;

  const currentRole = item.collaborators?.find(c => c.contactId === personId)?.role;
  const roleLabel = (r: AccessRole) => (
    r === 'viewer' ? s.access_role_viewer : r === 'commenter' ? s.access_role_commenter : s.access_role_editor
  );

  return (
    <BottomSheet
      header={
        <div className="flex items-center gap-2 px-2 py-2" style={{ borderBottom: `1px solid ${GD.divider}` }}>
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center" aria-label={s.a11y_close}>
            <IcClose size={20} color={GD.text} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] truncate" style={{ color: GD.text }}>{contact.name}</div>
            <div className="text-[12px] truncate" style={{ color: GD.textSecondary }}>{s.access_change_role}</div>
          </div>
        </div>
      }
    >
      {PERSON_ROLES.map(r => (
        <button
          key={r}
          data-action="googledrive.access.select.personRole"
          data-action-params={JSON.stringify({ item: itemId, contactId: contact.id, role: r })}
          onClick={() => {
            setCollaboratorRole(itemId, contact.id, r);
            showToast(s.toast_role_updated);
            back();
          }}
          className="w-full flex items-center gap-4 px-4 h-14 text-left active:bg-black/5"
        >
          <span className="w-5 shrink-0">{currentRole === r && <IcCheck size={18} color={GD.blue} />}</span>
          <span className="text-[15px]" style={{ color: currentRole === r ? GD.blue : GD.text }}>{roleLabel(r)}</span>
        </button>
      ))}
      <button
        data-action="googledrive.access.remove.person"
        data-action-params={JSON.stringify({ item: itemId, contactId: contact.id })}
        onClick={() => {
          removeCollaborator(itemId, contact.id);
          showToast(s.toast_access_removed);
          back();
        }}
        className="w-full flex items-center gap-4 px-4 h-14 text-left active:bg-black/5"
        style={{ color: GD.danger }}
      >
        <span className="w-5 shrink-0" />
        <span className="text-[15px]">{s.access_remove_person}</span>
      </button>
    </BottomSheet>
  );
};

/** 一次性挂载全部浮层（放在 Layout 里，保证底层页面不卸载） */
export const Overlays: React.FC = () => (
  <>
    <FileMenuSheet />
    <FolderMenuSheet />
    <SelectionMenuSheet />
    <TrashItemMenuSheet />
    <CreateMenuSheet />
    <SortMenu />
    <StorageSheet />
    <DrawerPanel />
    <AccountPanel />
    <RenameDialog />
    <NewFolderDialog />
    <ColorDialog />
    <ConfirmDialog />
    <PersonRoleSheet />
  </>
);
