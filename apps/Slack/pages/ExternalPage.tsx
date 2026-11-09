import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { shareText, inviteUrl } from '../utils/osCaps';
import { NEUTRAL, GREEN, PURPLE } from '../res/colors';
import { IcWorkspace } from '../res/icons';
import PageHeader from '../components/PageHeader';

/** 外部连接（IMG_2391）。右上 ＋ 的菜单属 Layer 3，这一层先不渲染。 */
const ExternalPage: React.FC = () => {
  const { action } = useSlackGestures();
  const { t } = useI18n();
  const workspace = useSlackStore((s) => s.workspace);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('external.title')} />

      {/* 付费横幅按 Q2 已从范围里移除，这里不渲染 */}
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <span style={{ color: PURPLE.aubergine }}>
          <IcWorkspace size={64} />
        </span>
        <p className="mt-4 text-center text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
          {t('external.emptyDesc')}
        </p>
        <button
          {...action('slack.external.invite.toast', () => {
            const launched = shareText(inviteUrl(workspace.url), (ok) => {
              if (ok) showToast(t('common.shareSuccess'));
            });
            if (!launched) notImplemented();
          })}
          className="mt-5 rounded-lg border-none px-4 py-2.5 text-[15px] font-bold text-white"
          style={{ backgroundColor: GREEN.primary }}
        >
          {t('external.shareInvite')}
        </button>
      </div>
    </div>
  );
};

export default ExternalPage;
