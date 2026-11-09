import React from 'react';
import { useParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { NEUTRAL, GREEN } from '../res/colors';
import PageHeader from '../components/PageHeader';
import { IcCompose, IcHuddle, IcEdit } from '../res/icons';
import Avatar from '../components/Avatar';
import { formatTime } from '../utils/format';
import * as TimeService from '../../../os/TimeService';

/** 个人档案页：自己（编辑档案 / 设置状态）与他人（发消息 / 抱团）两种按钮组 */
const ProfilePage: React.FC = () => {
  const { bindTap, action, go } = useSlackGestures();
  const { t, locale } = useI18n();
  const { userId = '' } = useParams();

  const user = useSlackStore((s) => s.users.find((u) => u.id === userId));
  const status = useSlackStore((s) => s.status);
  const openDm = useSlackStore((s) => s.openDm);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  if (!user) return null;
  const isSelf = user.id === ME;
  const emoji = isSelf ? status.emoji : user.statusEmoji;
  const statusText = isSelf ? status.text : user.statusText;

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('profile.title')} />

      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex flex-col items-center pt-2">
          <Avatar user={user} size={112} rounded="rounded-2xl" />
          <h2 className="mt-3 text-[22px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {user.displayName}
          </h2>
          <p className="text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {user.title}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: user.online ? GREEN.online : '#B9B9B9' }}
            />
            {user.online ? t('profile.active') : t('profile.away')}
            {' · '}
            {t('profile.localTime', { time: formatTime(TimeService.now(), locale) })}
          </p>
          {(emoji || statusText) && (
            <p className="mt-1.5 text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
              {emoji} {statusText}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2.5">
          {isSelf ? (
            <>
              <button
                {...bindTap('slack.profile.openstatus')}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#DDDDDD] bg-transparent py-2.5 text-[15px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                {t('profile.setStatus')}
              </button>
              <button
                {...bindTap('slack.profile.openedit', { params: { userId: user.id } })}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#DDDDDD] bg-transparent py-2.5 text-[15px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                <IcEdit size={16} />
                {t('profile.editProfile')}
              </button>
            </>
          ) : (
            <>
              <button
                {...bindTap('slack.profile.openmessage', {
                  // 私信会话可能还不存在，先建再跳
                  onTrigger: () => go('slack.profile.openmessage', { convId: openDm(user.id) }),
                })}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#DDDDDD] bg-transparent py-2.5 text-[15px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                <IcCompose size={16} />
                {t('profile.message')}
              </button>
              <button
                {...action('slack.profile.huddle.toast', notImplemented)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#DDDDDD] bg-transparent py-2.5 text-[15px] font-bold"
                style={{ color: NEUTRAL.textPrimary }}
              >
                <IcHuddle size={16} />
                {t('profile.huddle')}
              </button>
            </>
          )}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
              {t('profile.contactInfo')}
            </h3>
            {isSelf && (
              <button
                {...action('slack.profile.editcontact.toast', notImplemented)}
                className="border-none bg-transparent p-0 text-[14px] font-bold"
                style={{ color: NEUTRAL.textSecondary }}
              >
                {t('profile.edit')}
              </button>
            )}
          </div>
          <div className="mt-2 rounded-xl border border-[#EAEAEA] px-3 py-2.5">
            <p className="text-[12px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('profile.email')} · {t('profile.emailLabel')}
            </p>
            <p className="text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
              {user.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
