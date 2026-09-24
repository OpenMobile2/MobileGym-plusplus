// apps/GoogleDrive/pages/NotificationsPage.tsx
// apps/GoogleDrive/pages/otherPages.tsx — Gemini / 目标位置选择 / 详情 / 上传确认 / 设置
import React, { useState } from 'react';
import { GD } from '../res/colors';
import { NOTIFY_KEYS } from '../constants';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { SubPageBar, showToast } from '../components/common';

// ═══════════════════════════════════════════════════════════
// 通知设置（IMG_2230）
// ═══════════════════════════════════════════════════════════
export const NotificationsPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  const notify = useGoogleDriveStore(st => st.notify);
  const toggleNotify = useGoogleDriveStore(st => st.toggleNotify);
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.settings_notify_title} closeIcon="back" a11yClose={s.a11y_back} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4 py-3 text-[13px]" style={{ color: GD.textSecondary }}>{s.settings_notify_system_hint}</div>
        <div className="px-4 pb-4">
          <button
            data-action="googledrive.settings.openSystem.unavailable"
            onClick={() => showToast(s.toast_feature_unavailable)}
            className="px-4 h-9 rounded-full text-[13px]"
            style={{ border: `1px solid ${GD.divider}`, color: GD.blue }}
          >
            {s.settings_open_system}
          </button>
        </div>
        {NOTIFY_KEYS.map(k => (
          <button
            key={k.id}
            data-action="googledrive.settings.toggleNotify"
            data-action-params={JSON.stringify({ key: k.id })}
            onClick={() => toggleNotify(k.id)}
            className="w-full flex items-center px-4 text-left active:bg-black/5"
            style={{ height: 64 }}
          >
            <span className="flex-1 text-[15px]" style={{ color: GD.text }}>{s[k.labelKey as keyof typeof s]}</span>
            <span
              className="rounded-full flex items-center transition-colors"
              style={{ width: 44, height: 24, background: notify[k.id] ? GD.blue : GD.divider, padding: 2 }}
            >
              <span
                className="rounded-full bg-white transition-transform"
                style={{ width: 20, height: 20, transform: notify[k.id] ? 'translateX(20px)' : 'none' }}
              />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
