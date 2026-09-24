// apps/GoogleDrive/pages/UploadsPage.tsx
// apps/GoogleDrive/pages/drawerPages.tsx — 抽屉里的子页：最近使用 / 离线 / 上传 / 垃圾内容 / 回收站
import React from 'react';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcUploads, IcClose } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { EmptyState, SubPageBar, showToast, ItemIcon } from '../components/common';

/** 上传（IMG_2225 空态 / 上传中 / 已完成） */
export const UploadsPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const uploads = useGoogleDriveStore(st => st.uploads);
  const items = useGoogleDriveStore(st => st.items);
  const cancelUpload = useGoogleDriveStore(st => st.cancelUpload);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.uploads_title} a11yClose={s.a11y_close} />
      {uploads.length === 0 ? (
        <EmptyState icon={IcUploads} title={s.uploads_empty_title} desc={s.uploads_empty_desc}>
          <button
            {...bindTap('googledrive.uploads.pickFile')}
            className="mt-2 px-5 h-10 rounded-full text-[14px] text-white"
            style={{ background: GD.blue }}
          >
            {s.uploads_upload_files}
          </button>
        </EmptyState>
      ) : (
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          {uploads.map(task => {
            const item = items[task.id];
            return (
              <div key={task.id} className="flex items-center gap-3" style={{ height: DIM.rowH, paddingLeft: DIM.itemIconLeft, paddingRight: 8 }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] truncate" style={{ color: GD.text }}>{task.name}</div>
                  <div className="text-[12px]" style={{ color: GD.textSecondary }}>
                    {task.progress >= 100 ? s.uploads_done : s.uploads_uploading}
                  </div>
                </div>
                {task.progress < 100 && (
                  <button
                    data-action="googledrive.upload.cancelItem"
                    data-action-params={JSON.stringify({ taskId: task.id })}
                    onClick={() => { cancelUpload(task.id); showToast(s.toast_upload_canceled); }}
                    className="w-11 h-11 flex items-center justify-center"
                    aria-label={s.dialog_cancel}
                  >
                    <IcClose size={18} color={GD.textSecondary} />
                  </button>
                )}
                {task.progress >= 100 && item && <ItemIcon item={item} size={20} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
