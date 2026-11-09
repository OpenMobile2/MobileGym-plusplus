// apps/GoogleDrive/pages/SettingsPage.tsx
// apps/GoogleDrive/pages/otherPages.tsx — Gemini / 目标位置选择 / 详情 / 上传确认 / 设置
import React, { useState } from 'react';
import { IcBell, IcChevronRight } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { SubPageBar, showToast, SheetItem } from '../components/common';

// ═══════════════════════════════════════════════════════════
// 设置（IMG_2229）—— 7 行里只有「通知」仍进二级页，其余已判不做
// ═══════════════════════════════════════════════════════════
export const SettingsPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const nope = () => showToast(s.toast_feature_unavailable);
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.settings_title} closeIcon="back" a11yClose={s.a11y_back} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <SheetItem icon={IcBell} label={s.settings_notifications} bind={bindTap('googledrive.settings.notifications.open')} />
        <SheetItem icon={IcChevronRight} label={s.settings_backup} bind={{ 'data-action': 'googledrive.settings.backup.unavailable' }} onClick={nope} />
        <SheetItem icon={IcChevronRight} label={s.settings_default_apps} bind={{ 'data-action': 'googledrive.settings.defaultApps.unavailable' }} onClick={nope} />
        <SheetItem icon={IcChevronRight} label={s.settings_privacy_screen} bind={{ 'data-action': 'googledrive.settings.privacyScreen.unavailable' }} onClick={nope} />
        <SheetItem icon={IcChevronRight} label={s.settings_siri} bind={{ 'data-action': 'googledrive.settings.siri.unavailable' }} onClick={nope} />
        <SheetItem icon={IcChevronRight} label={s.settings_smart_features} bind={{ 'data-action': 'googledrive.settings.smartFeatures.unavailable' }} onClick={nope} />
        <SheetItem icon={IcChevronRight} label={s.settings_about} bind={{ 'data-action': 'googledrive.settings.about.unavailable' }} onClick={nope} />
      </div>
    </div>
  );
};
