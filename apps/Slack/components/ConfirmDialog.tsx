import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { NEUTRAL, RED } from '../res/colors';
import type { Bind } from '../types';

/** 退出 / 归档 / 转私密 共用确认框（confirm 参数区分文案） */
const ConfirmDialog: React.FC<{
  kind: 'leave' | 'archive' | 'private';
  channelName: string;
  confirmBind: Bind;
}> = ({ kind, channelName, confirmBind }) => {
  const { bindBack } = useSlackGestures();
  const { t } = useI18n();

  const titleKey =
    kind === 'leave' ? 'confirm.leaveTitle' : kind === 'archive' ? 'confirm.archiveTitle' : 'confirm.privateTitle';
  const descKey =
    kind === 'leave' ? 'confirm.leaveDesc' : kind === 'archive' ? 'confirm.archiveDesc' : 'confirm.privateDesc';
  const okKey =
    kind === 'leave' ? 'confirm.leaveOk' : kind === 'archive' ? 'confirm.archiveOk' : 'confirm.privateOk';
  const okColor = kind === 'private' ? '#007A5A' : RED.destructive;

  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center px-8">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" aria-label="cancel" />
      <div className="relative w-full max-w-[300px] rounded-xl bg-white p-5 text-center">
        <h3 className="text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t(titleKey, { name: channelName })}
        </h3>
        <p className="mt-1.5 text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
          {t(descKey)}
        </p>
        <div className="mt-4 flex gap-3">
          <button
            {...bindBack()}
            className="flex-1 rounded-lg border border-[#DDDDDD] bg-transparent py-2.5 text-[15px]"
            style={{ color: NEUTRAL.textPrimary }}
          >
            {t('common.cancel')}
          </button>
          <button
            {...confirmBind}
            className="flex-1 rounded-lg border-none py-2.5 text-[15px] font-bold text-white"
            style={{ backgroundColor: okColor }}
          >
            {t(okKey)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
