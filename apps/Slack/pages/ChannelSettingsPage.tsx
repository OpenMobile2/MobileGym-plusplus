import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { CHANNEL_SETTING_SWITCHES } from '../constants';
import { NEUTRAL, RED, BLUE } from '../res/colors';
import { IconRenderer, IcOverflow, IcEdit, IcChevronRight } from '../res/icons';
import PageHeader from '../components/PageHeader';
import Avatar from '../components/Avatar';
import Switch from '../components/Switch';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDayLabel } from '../utils/format';
import * as TimeService from '../../../os/TimeService';

/** 「设置和详情」页（IMG_2427） */
const ChannelSettingsPage: React.FC = () => {
  const { bindTap, action, back } = useSlackGestures();
  const { t, locale } = useI18n();
  const { convId = '' } = useParams();
  const [params] = useSearchParams();
  const dialog = params.get('dialog');
  const confirmKind = params.get('confirm') as 'leave' | 'archive' | 'private' | null;

  const conv = useSlackStore((s) => s.conversations.find((c) => c.id === convId));
  const users = useSlackStore((s) => s.users);
  const toggleMute = useSlackStore((s) => s.toggleMute);
  const toggleMemberSuggestion = useSlackStore((s) => s.toggleMemberSuggestion);
  const leaveChannel = useSlackStore((s) => s.leaveChannel);
  const archiveChannel = useSlackStore((s) => s.archiveChannel);
  const convertToPrivate = useSlackStore((s) => s.convertToPrivate);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  if (!conv) return null;

  const admin = users.find((u) => u.id === conv.creatorId);
  const memberUsers = conv.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter(Boolean);

  const createdWhen = formatDayLabel(conv.createdTs, locale);
  const todayLabel = locale === 'en' ? 'Today' : '今天';
  const whenLabel =
    Math.abs(conv.createdTs - TimeService.now()) < 86_400_000 ? todayLabel : createdWhen;

  const switchBind = (id: string) => {
    if (id === 'mute')
      return action('slack.chsettings.mute.toggle', () => toggleMute(convId));
    return action('slack.chsettings.membersuggestion.toggle', () =>
      toggleMemberSuggestion(convId),
    );
  };

  const confirmBind =
    confirmKind === 'leave'
      ? bindTap('slack.chsettings.leave', {
          beforeTrigger: () => leaveChannel(convId),
          nav: { mode: 'replace', popTo: '/', popToInclusive: true },
        })
      : confirmKind === 'archive'
        ? bindTap('slack.chsettings.archive', {
            beforeTrigger: () => {
              archiveChannel(convId);
              showToast(t('confirm.archivedToast', { name: conv.name }));
            },
            nav: { mode: 'replace', popTo: '/', popToInclusive: true },
          })
        : action('slack.chsettings.convertprivate.submit', () => {
            convertToPrivate(convId);
            back();
          });

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title={t('chSettings.title')}
        right={
          <>
            <button
              {...bindTap('slack.chsettings.openedit', { params: { convId } })}
              aria-label="edit"
              className="flex h-9 w-9 items-center justify-center border-none bg-transparent"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcEdit size={20} />
            </button>
            <button
              {...action('slack.chsettings.more.toast', notImplemented)}
              aria-label="more"
              className="flex h-9 w-9 items-center justify-center border-none bg-transparent"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcOverflow size={20} />
            </button>
          </>
        }
      />

      <div
        className="min-h-0 flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-4 pt-2">
          <p className="text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
            {t('chSettings.membersCount', { n: conv.memberIds.length })}
          </p>
          {admin && (
            <button
              {...bindTap('slack.chsettings.openmemberprofile', { params: { userId: admin.id } })}
              className="mt-2 flex w-full items-center gap-3 border-none bg-transparent py-2 text-left"
            >
              <Avatar user={admin} size={40} presence rounded="rounded-lg" />
              <span className="min-w-0 flex-1">
                <span className="block text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                  {admin.displayName}
                </span>
                <span className="block text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
                  {t('chSettings.admin', { name: admin.displayName })}
                </span>
              </span>
            </button>
          )}
        </div>

        <h3 className="mt-4 px-4 text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('chSettings.inThisConversation')}
        </h3>
        <div className="mt-1 flex gap-2 overflow-x-auto px-4 py-2">
          {memberUsers.map((u) =>
            u ? (
              <button
                key={u.id}
                {...bindTap('slack.chsettings.openmemberprofile', { params: { userId: u.id } })}
                className="flex-shrink-0 border-none bg-transparent p-0"
              >
                <Avatar user={u} size={44} presence rounded="rounded-lg" />
              </button>
            ) : null,
          )}
        </div>

        <button
          {...action('slack.chsettings.apps.toast', notImplemented)}
          className="mt-3 flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IconRenderer name="IcApps" size={22} style={{ color: NEUTRAL.textSecondary }} />
          <span className="min-w-0 flex-1">
            <span className="block text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
              {t('chSettings.apps')}
            </span>
            <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('chSettings.appsDesc')}
            </span>
          </span>
        </button>

        <h3 className="mt-4 px-4 text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('chSettings.settings')}
        </h3>

        <button
          {...bindTap('slack.chsettings.opennotifications', { params: { convId } })}
          className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
        >
          <IconRenderer name="IcBell" size={22} style={{ color: NEUTRAL.textSecondary }} />
          <span className="min-w-0 flex-1">
            <span className="block text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
              {t('chSettings.notifications')}
            </span>
            <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('chSettings.notificationsDesc')}
            </span>
          </span>
          <IcChevronRight size={18} style={{ color: NEUTRAL.textSecondary }} />
        </button>

        {CHANNEL_SETTING_SWITCHES.map((sw) => (
          <div key={sw.id} className="flex items-start gap-3 px-4 py-3">
            <IconRenderer
              name={sw.icon}
              size={22}
              style={{ color: NEUTRAL.textSecondary }}
              className="mt-0.5 flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>{t(sw.labelKey)}</p>
              <p className="text-[13px]" style={{ color: NEUTRAL.textSecondary }}>{t(sw.descKey)}</p>
            </div>
            <Switch
              on={sw.id === 'mute' ? conv.muted : conv.memberSuggestion}
              bindProps={switchBind(sw.id)}
            />
          </div>
        ))}

        {!conv.isPrivate && (
          <button
            {...bindTap('slack.chsettings.confirmconvert', { params: { convId } })}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <IconRenderer name="IcLock" size={22} style={{ color: NEUTRAL.textSecondary }} />
            <span className="min-w-0 flex-1">
              <span className="block text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
                {t('chSettings.convertPrivate')}
              </span>
              <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                {t('chSettings.convertPrivateDesc')}
              </span>
            </span>
          </button>
        )}

        <div className="mt-4 px-4">
          <button
            {...bindTap('slack.chsettings.confirmleave', { params: { convId } })}
            className="w-full rounded-lg border border-[#DDDDDD] bg-transparent py-3 text-[16px] font-bold"
            style={{ color: RED.destructive }}
          >
            {t('chSettings.leave')}
          </button>
          <button
            {...bindTap('slack.chsettings.confirmarchive', { params: { convId } })}
            className="mt-2 w-full rounded-lg border border-[#DDDDDD] bg-transparent py-3 text-[16px] font-bold"
            style={{ color: NEUTRAL.textPrimary }}
          >
            {t('chSettings.archive')}
          </button>
        </div>

        <p className="mt-4 px-4 text-center text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
          {t('chSettings.createdBy', {
            name: admin?.displayName ?? '',
            when: whenLabel,
          })}
        </p>
      </div>

      {dialog === 'confirm' && confirmKind && (
        <ConfirmDialog
          kind={confirmKind}
          channelName={conv.name}
          confirmBind={confirmBind}
        />
      )}
    </div>
  );
};

export default ChannelSettingsPage;
