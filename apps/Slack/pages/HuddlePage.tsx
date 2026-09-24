import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { copyToClipboard, shareText, huddleUrl } from '../utils/osCaps';
import { NEUTRAL, GREEN } from '../res/colors';
import { IcHuddle, IcHuddleLink, IcHuddleShare } from '../res/icons';
import Sheet from '../components/Sheet';
import Avatar from '../components/Avatar';

/**
 * 抱团启动弹层（IMG_2380）。据 Q4 决议不做通话中面板，
 * 「会议」按钮给「该功能暂未开放」提示。
 */
const HuddlePage: React.FC = () => {
  const { action } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const convId = params.get('convId');

  const users = useSlackStore((s) => s.users);
  const conversations = useSlackStore((s) => s.conversations);
  const workspace = useSlackStore((s) => s.workspace);
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const me = users.find((u) => u.id === ME);
  const conv = conversations.find((c) => c.id === convId);
  const link = huddleUrl(workspace.url, convId ?? 'channel');

  return (
    <div className="h-full bg-black/40">
      <Sheet handle>
        <div className="flex justify-end px-4">
          <div className="flex items-center gap-1 rounded-full bg-[#F3F3F3] px-1">
            <button
              {...action('slack.huddle.copylink', () => {
                if (!copyToClipboard(link)) {
                  notImplemented();
                  return;
                }
                showToast(t('common.copied'));
              })}
              aria-label="copy-link"
              className="border-none bg-transparent p-2"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcHuddleLink size={18} />
            </button>
            <button
              {...action('slack.huddle.share.toast', () => {
                // startActivity 无 ForResult 回调；完成/取消由微信 finishActivity 回到本页
                const launched = shareText(link);
                if (!launched) notImplemented();
              })}
              aria-label="share"
              className="border-none bg-transparent p-2"
              style={{ color: NEUTRAL.textPrimary }}
            >
              <IcHuddleShare size={18} />
            </button>
          </div>
        </div>

        <div className="flex flex-col items-center px-6 pb-2 pt-3">
          <Avatar user={me} size={64} rounded="rounded-2xl" />
          <h2 className="mt-4 text-[19px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {t('huddle.title')}
          </h2>
          <p className="mt-1 text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {conv ? t('huddle.subtitleIn', { name: conv.name }) : t('huddle.subtitle')}
          </p>
          <button
            {...action('slack.huddle.start.toast', notImplemented)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border-none py-3.5"
            style={{ backgroundColor: GREEN.primary }}
          >
            <IcHuddle size={20} className="text-white" />
            <span className="text-[17px] font-bold text-white">{t('quickAction.huddle')}</span>
          </button>
        </div>
      </Sheet>
    </div>
  );
};

export default HuddlePage;
