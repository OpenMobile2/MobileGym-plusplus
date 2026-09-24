// apps/GoogleDrive/pages/SpamPage.tsx
// apps/GoogleDrive/pages/drawerPages.tsx — 抽屉里的子页：最近使用 / 离线 / 上传 / 垃圾内容 / 回收站
import React from 'react';
import { IcSpam } from '../res/icons';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { EmptyState, SubPageBar } from '../components/common';

/** 垃圾内容（空态） */
export const SpamPage: React.FC = () => {
  const s = useGoogleDriveStrings();
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="pt-10" />
      <SubPageBar title={s.spam_title} a11yClose={s.a11y_close} />
      <EmptyState icon={IcSpam} title={s.spam_empty_title} desc={s.spam_empty_desc} />
    </div>
  );
};
