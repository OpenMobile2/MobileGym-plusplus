import React from 'react';
import { useI18n } from '../i18n';
import { NEUTRAL } from '../res/colors';
import PageHeader from '../components/PageHeader';

/** 分派给你的（IMG_2390）：纯空状态页。 */
const AssignedPage: React.FC = () => {
  const { t } = useI18n();
  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('assigned.title')} />
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <h2 className="text-[19px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('assigned.emptyTitle')}
        </h2>
        <p className="mt-1 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
          {t('assigned.emptyDesc')}
        </p>
      </div>
    </div>
  );
};

export default AssignedPage;
