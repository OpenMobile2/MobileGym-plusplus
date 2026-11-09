// apps/GoogleDrive/pages/UploadPickPage.tsx — 选择要上传的本机文件
//
// 阶段⑥反馈：「添加文件的时候，也没有让我真正去选要添加哪个文件」。
// 这里读 OS 文件系统里**真实存在**的文件（/sdcard 下的 Documents / Pictures / DCIM / Download），
// 不自己编一份假清单 —— 模拟手机里本来就有这些文件，编一份反而会和「文件」App 对不上。
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as FileSystemService from '@/os/FileSystemService';
import type { FSNode } from '@/os/types';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { UPLOAD_PICK_DIRS } from '../constants';
import { IcChevronRight, IcFolder } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { SubPageBar, EmptyState, formatSize, FileTypeGlyph } from '../components/common';
import { kindFromFileName } from '../components/listing';

export const UploadPickPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const setPending = useGoogleDriveStore(st => st.setPendingUpload);
  // 从哪个文件夹点的 ＋ 就默认上传到那里；由 create.upload 通过 ?to 带过来
  // （本页已不在 /folder/:id 上，读不到路径参数）
  const [sp] = useSearchParams();
  const targetFolderId = sp.get('to');
  const [dir, setDir] = useState<string | null>(null);

  const entries = useMemo<FSNode[]>(() => {
    if (dir) return FileSystemService.listDirectory(dir).filter(n => n.type === 'file' || n.type === 'directory');
    // 顶层只列几个常见目录，避免把整个 /sdcard 铺开
    return UPLOAD_PICK_DIRS.flatMap(path => {
      const node = FileSystemService.listDirectory(path);
      return node.length ? [{
        id: path, name: path.split('/').pop() ?? path, type: 'directory' as const,
        parentId: null, path, size: 0, createdAt: 0, modifiedAt: 0, storage: 'preset' as const,
      }] : [];
    });
  }, [dir]);

  const picked = (node: FSNode) => {
    setPending(node.name, kindFromFileName(node.name), targetFolderId, node.size);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={dir ? (dir.split('/').pop() ?? s.upload_pick_title) : s.upload_pick_title} a11yClose={s.dialog_cancel} />
      {dir && (
        <button
          data-action="googledrive.upload.pick.enterDir"
          data-action-params={JSON.stringify({ path: '' })}
          onClick={() => setDir(null)}
          className="flex items-center gap-4 px-6 text-left active:bg-black/5 shrink-0"
          style={{ height: 48 }}
        >
          <IcFolder size={20} color={GD.typeFolder} />
          <span className="text-[14px]" style={{ color: GD.text }}>..</span>
        </button>
      )}
      {entries.length === 0 ? (
        <EmptyState icon={IcFolder} title={s.upload_pick_empty} />
      ) : (
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          {entries.map(node => (
            node.type === 'directory' ? (
              <button
                key={node.path}
                data-action="googledrive.upload.pick.enterDir"
                data-action-params={JSON.stringify({ path: node.path })}
                onClick={() => setDir(node.path)}
                className="w-full flex items-center gap-4 px-6 text-left active:bg-black/5"
                style={{ height: DIM.rowH }}
              >
                <IcFolder size={24} color={GD.typeFolder} fill={GD.typeFolder} strokeWidth={1.5} />
                <span className="text-[15px] flex-1 truncate" style={{ color: GD.text }}>{node.name}</span>
                <IcChevronRight size={18} color={GD.textSecondary} />
              </button>
            ) : (
              <button
                key={node.path}
                {...bindTap('googledrive.upload.picked', {
                  params: { path: node.path },
                  beforeTrigger: () => picked(node),
                })}
                className="w-full flex items-center gap-4 px-6 text-left active:bg-black/5"
                style={{ height: DIM.rowH }}
              >
                <FileTypeGlyph kind={kindFromFileName(node.name)} size={24} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] truncate" style={{ color: GD.text }}>{node.name}</span>
                  {/* 预置文件的元数据不带大小（OS 里 size 为 0），那就别显示 —— 与其铺一行「—」不如不铺 */}
                  {node.size > 0 && (
                    <span className="block text-[12px]" style={{ color: GD.textSecondary }}>{formatSize(node.size)}</span>
                  )}
                </span>
              </button>
            )
          ))}
          <div className="h-6" />
        </div>
      )}
    </div>
  );
};
