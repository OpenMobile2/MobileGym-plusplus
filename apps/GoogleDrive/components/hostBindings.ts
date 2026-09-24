// apps/GoogleDrive/components/hostBindings.ts
//
// 浮层组件统一渲染在 Layout 里（这样才能叠在任意宿主页面之上、底层页面不卸载），
// 但浮层内部的跳转是「开在当前路由上的 query 态」，transitionId 逐宿主不同。
// 共享组件里不能按 prop 拼 ID —— 所以这里把每个宿主的 ID 全部以字面量列出，
// 运行时只按 pathname 挑一个。静态分析器能看到全部字面量，不会漏边。
import { matchPath, useLocation } from 'react-router-dom';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import type { BindProps } from './common';

type Bindings = BindProps;

const HOST_PATTERNS = [
  ['home', '/'],
  ['starred', '/starred'],
  ['shared', '/shared'],
  ['files', '/files'],
  ['folder', '/folder/:id'],
  ['recent', '/recent'],
  ['offline', '/offline'],
  ['results', '/search/results'],
  ['preview', '/preview/:id'],
  ['trash', '/trash'],
  ['upload', '/upload/confirm'],
] as const;

export type HostKey = (typeof HOST_PATTERNS)[number][0];

export function useHostKey(): HostKey | null {
  const { pathname } = useLocation();
  for (const [key, pattern] of HOST_PATTERNS) {
    if (matchPath({ path: pattern, end: true }, pathname)) return key;
  }
  return null;
}

/**
 * 当前所在文件夹的 id（不在文件夹页时为 null）。
 * 浮层挂在 Layout 里、不在路由内，拿不到 useParams()，只能从 pathname 反解。
 */
export function useCurrentFolderId(): string | null {
  const { pathname } = useLocation();
  const m = matchPath({ path: '/folder/:id', end: true }, pathname);
  return m?.params.id ?? null;
}

/**
 * 当前路由的路径参数。
 * 浮层是「开在当前路由上的 query 态」，所以 transition 的 to 就是当前路由本身；
 * 若该路由带 :id（/folder/:id、/preview/:id），go() 必须拿到这个参数才能拼出目标 URL，
 * 否则会抛 Missing param "id" —— 表现为「在文件夹里点 ⋮ 毫无反应」。
 */
export function useCurrentPathParams(): Record<string, string> {
  const { pathname } = useLocation();
  for (const pattern of ['/folder/:id', '/preview/:id']) {
    const m = matchPath({ path: pattern, end: true }, pathname);
    if (m?.params.id) return { id: m.params.id };
  }
  return {};
}

/** 浮层内部要用到的逐宿主跳转，全部字面量列出 */
export function useOverlayBindings() {
  const host = useHostKey();
  const { bindTap } = useGoogleDriveGestures();
  const params = useCurrentPathParams();

  const rename: Partial<Record<HostKey, Bindings>> = {
    home: bindTap('googledrive.home.rename.open', { params }),
    starred: bindTap('googledrive.starred.rename.open', { params }),
    shared: bindTap('googledrive.shared.rename.open', { params }),
    files: bindTap('googledrive.files.rename.open', { params }),
    folder: bindTap('googledrive.folder.rename.open', { params }),
    recent: bindTap('googledrive.recent.rename.open', { params }),
    offline: bindTap('googledrive.offline.rename.open', { params }),
    results: bindTap('googledrive.results.rename.open', { params }),
    preview: bindTap('googledrive.preview.rename.open', { params }),
    upload: bindTap('googledrive.upload.rename.open', { params }),
  };

  const confirmTrash: Partial<Record<HostKey, Bindings>> = {
    home: bindTap('googledrive.home.confirm.trash', { params }),
    starred: bindTap('googledrive.starred.confirm.trash', { params }),
    shared: bindTap('googledrive.shared.confirm.trash', { params }),
    files: bindTap('googledrive.files.confirm.trash', { params }),
    folder: bindTap('googledrive.folder.confirm.trash', { params }),
    recent: bindTap('googledrive.recent.confirm.trash', { params }),
    offline: bindTap('googledrive.offline.confirm.trash', { params }),
    results: bindTap('googledrive.results.confirm.trash', { params }),
    preview: bindTap('googledrive.preview.confirm.trash', { params }),
  };

  const color: Partial<Record<HostKey, Bindings>> = {
    files: bindTap('googledrive.files.color.open', { params }),
    folder: bindTap('googledrive.folder.color.open', { params }),
    shared: bindTap('googledrive.shared.color.open', { params }),
  };

  const newFolder: Partial<Record<HostKey, Bindings>> = {
    home: bindTap('googledrive.home.newfolder.open', { params }),
    starred: bindTap('googledrive.starred.newfolder.open', { params }),
    files: bindTap('googledrive.files.newfolder.open', { params }),
    folder: bindTap('googledrive.folder.newfolder.open', { params }),
  };

  const storage: Partial<Record<HostKey, Bindings>> = {
    home: bindTap('googledrive.home.storage.open', { params }),
    starred: bindTap('googledrive.starred.storage.open', { params }),
    shared: bindTap('googledrive.shared.storage.open', { params }),
    files: bindTap('googledrive.files.storage.open', { params }),
  };

  const selectionConfirm: Partial<Record<HostKey, Bindings>> = {
    home: bindTap('googledrive.home.selection.confirm', { params }),
    files: bindTap('googledrive.files.selection.confirm', { params }),
    folder: bindTap('googledrive.folder.selection.confirm', { params }),
  };

  const pick = (map: Partial<Record<HostKey, Bindings>>) => (host ? map[host] : undefined);

  return {
    host,
    renameProps: pick(rename),
    confirmTrashProps: pick(confirmTrash),
    colorProps: pick(color),
    newFolderProps: pick(newFolder),
    storageProps: pick(storage),
    selectionConfirmProps: pick(selectionConfirm),
  };
}
