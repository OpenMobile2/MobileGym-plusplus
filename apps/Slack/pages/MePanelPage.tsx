import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { shareText, inviteUrl } from '../utils/osCaps';
import { NEUTRAL } from '../res/colors';
import { IcClose, IcMembers, IcWorkspace, IcGear, IcProfile, IcBell } from '../res/icons';
import Avatar from '../components/Avatar';
import * as TimeService from '../../../os/TimeService';

const MePanelPage: React.FC = () => {
  const { bindTap, bindBack, action } = useSlackGestures();
  const { t } = useI18n();

  const me = useSlackStore((s) => s.users.find((u) => u.id === ME));
  const status = useSlackStore((s) => s.status);
  const settings = useSlackStore((s) => s.settings);
  const workspace = useSlackStore((s) => s.workspace);
  const clearStatus = useSlackStore((s) => s.clearStatus);
  const togglePresence = useSlackStore((s) => s.togglePresence);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const paused =
    settings.notificationsPausedUntil != null &&
    settings.notificationsPausedUntil > TimeService.now();

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 px-4 pb-2 pt-11">
        <button
          {...bindBack()}
          aria-label="close"
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcClose size={19} />
        </button>
        <h1 className="flex-1 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('me.title')}
        </h1>
        <span className="w-9" />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <Avatar user={me} size={48} rounded="rounded-xl" presence paused={paused} />
        <div>
          <p className="text-[19px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {me?.displayName}
          </p>
          <p className="text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {me?.online ? t('me.online') : t('me.offline')}
          </p>
        </div>
      </div>

      <div className="mx-4 flex items-center gap-2 rounded-lg border border-[#DDDDDD] px-3 py-2.5">
        <button
          {...bindTap('slack.me.openstatus')}
          className="flex min-w-0 flex-1 items-center gap-2 border-none bg-transparent p-0 text-left"
        >
          <span className="text-[17px]">{status.emoji || '📝'}</span>
          <span
            className="min-w-0 flex-1 truncate text-[16px]"
            style={{ color: status.text ? NEUTRAL.textPrimary : NEUTRAL.textSecondary }}
          >
            {status.text || t('status.placeholder')}
          </span>
        </button>
        {(status.text || status.emoji) && (
          <button
            {...action('slack.me.status.clear', clearStatus)}
            aria-label="clear-status"
            className="border-none bg-transparent p-1"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcClose size={17} />
          </button>
        )}
      </div>

      <div className="mt-3">
        <button
          {...bindTap('slack.me.openpause')}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcBell size={20} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {paused ? t('me.notificationsPaused') : t('me.pauseNotifications')}
          </span>
        </button>

        <button
          {...action('slack.me.presence.toggle', togglePresence)}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcMembers size={20} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('me.setPresencePrefix')}
            <b>{me?.online ? t('me.offline') : t('me.online')}</b>
          </span>
        </button>

        <div className="my-1 h-px bg-[#EAEAEA]" />

        <button
          {...action('slack.me.invite.toast', () => {
            const launched = shareText(inviteUrl(workspace.url), (ok) => {
              if (ok) showToast(t('common.shareSuccess'));
            });
            if (!launched) notImplemented();
          })}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcWorkspace size={20} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('me.invite')}
          </span>
        </button>
        <button
          {...bindTap('slack.me.openprofile', { params: { userId: ME } })}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcProfile size={20} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('me.viewProfile')}
          </span>
        </button>
        <button
          {...bindTap('slack.me.opennotifications')}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcBell size={20} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('me.notifications')}
          </span>
        </button>
        <button
          {...bindTap('slack.me.openprefs')}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IcGear size={20} style={{ color: NEUTRAL.textSecondary }} />
          <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('me.prefs')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default MePanelPage;
