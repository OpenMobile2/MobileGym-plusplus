import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 消息子频道空态(spec messages.channel,a172/a173) */
export default function MessagesChannelPage() {
  const { isDark } = useDarkMode();
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const channelId = sp.get('channelId') ?? 'activity';
  const showToast = useCainiaoStore((s) => s.showToast);

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar
        title={channelId === 'guojiang' ? '裹酱消息' : '活动与权益'}
        right={
          <button
            {...action('messages.channel.settings.wontfixToast', () => showToast(t('common.notOpen')))}
            className="cursor-pointer border-none bg-transparent text-[14px] text-(--app-c-text-primary)"
          >
            设置
          </button>
        }
      />
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <span className="text-[15px] text-(--app-c-text-muted)">{t('messages.emptyChannel')}</span>
      </div>
    </div>
  );
}
