// apps/GoogleDrive/pages/UploadConfirmPage.tsx
// apps/GoogleDrive/pages/otherPages.tsx — Gemini / 目标位置选择 / 详情 / 上传确认 / 设置
import React, { useState } from 'react';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { IcFolder, IcChevronRight } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { SubPageBar, showToast, formatTemplate } from '../components/common';

// ═══════════════════════════════════════════════════════════
// 上传确认（IMG_2283）
// ═══════════════════════════════════════════════════════════
export const UploadConfirmPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap, back } = useGoogleDriveGestures();
  const pending = useGoogleDriveStore(st => st.pendingUpload);
  const items = useGoogleDriveStore(st => st.items);
  const commitUpload = useGoogleDriveStore(st => st.commitUpload);

  const locationName = pending?.parentId ? (items[pending.parentId]?.name ?? s.move_my_drive) : s.move_my_drive;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.upload_confirm_title} a11yClose={s.dialog_cancel} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center justify-center py-6">
          <button
            data-action="googledrive.upload.preview.unavailable"
            onClick={() => showToast(s.toast_feature_unavailable)}
            className="w-32 h-32 rounded-lg flex items-center justify-center"
            style={{ background: GD.cardBg }}
          >
            <IcFolder size={40} color={GD.textSecondary} />
          </button>
        </div>
        {/* Name 行：改的是「待上传的这个文件」，不是 Drive 里已存在的条目 */}
        <button
          {...bindTap('googledrive.upload.rename.open')}
          className="w-full flex items-center px-4 text-left active:bg-black/5"
          style={{ height: DIM.rowH }}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[12px]" style={{ color: GD.textSecondary }}>{s.upload_name}</span>
            <span className="block text-[15px] truncate" style={{ color: GD.text }}>{pending?.name ?? ''}</span>
          </span>
          <IcChevronRight size={18} color={GD.textSecondary} />
        </button>
        <button
          {...bindTap('googledrive.upload.location.open', { params: { id: 'pending' } })}
          className="w-full flex items-center px-4 text-left active:bg-black/5"
          style={{ height: DIM.rowH }}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[12px]" style={{ color: GD.textSecondary }}>{s.upload_location}</span>
            <span className="block text-[15px] truncate" style={{ color: GD.text }}>{locationName}</span>
          </span>
          <IcChevronRight size={18} color={GD.textSecondary} />
        </button>
      </div>
      <div className="shrink-0 px-4 py-3" style={{ borderTop: `1px solid ${GD.divider}` }}>
        {/*
          「提交后返回来处」按平台规范建模为 submit action，不是跳某个页面的 transition。
          阶段⑥ 操作者标注：「上传完文件后应该返回刚才的页面，并且 toast 已上传。
          而不是显示在上传记录页面」。
          Toast 里点明落在哪个文件夹，回到列表就能当场核对。
        */}
        <button
          data-action="googledrive.upload.submit"
          onClick={() => {
            commitUpload();
            showToast(formatTemplate(s.toast_uploaded, { where: locationName }));
            back();
          }}
          className="w-full h-11 rounded-full text-[15px] text-white"
          style={{ background: GD.blue }}
        >
          {s.upload_confirm}
        </button>
      </div>
    </div>
  );
};
