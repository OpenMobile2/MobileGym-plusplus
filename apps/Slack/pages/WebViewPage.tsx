import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { shareText } from '../utils/osCaps';
import { NEUTRAL } from '../res/colors';
import { IcClose, IcText, IcShare, IcFeedback, IcGlobe } from '../res/icons';

const TOOLBAR = [
  { id: 'reader', Icon: IcText },
  { id: 'share', Icon: IcShare },
  { id: 'refresh', Icon: IcFeedback },
  { id: 'compass', Icon: IcGlobe },
] as const;

/** 内嵌网页：静态占位正文 + 底部工具栏（分享走系统 ACTION_SEND，其余暂未开放） */
const WebViewPage: React.FC = () => {
  const { bindBack, action } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const showToast = useSlackStore((s) => s.showToast);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const url = params.get('url') ?? '';
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    host = url.replace(/^https?:\/\//, '').split('/')[0];
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#EAEAEA] px-3 pb-2 pt-11">
        <button
          {...bindBack()}
          aria-label="close"
          className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcClose size={19} />
        </button>
        <span className="min-w-0 flex-1 truncate text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
          {host}
        </span>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-5 py-5"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <h1 className="text-[22px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {host}
        </h1>
        <div className="mt-4 space-y-2.5">
          {[92, 100, 78, 96, 64, 100, 88].map((w, i) => (
            <span key={i} className="block h-3 rounded bg-[#EFEFEF]" style={{ width: `${w}%` }} />
          ))}
        </div>
        <div className="mt-5 h-36 rounded-lg bg-[#E7EDF3]" />
        <div className="mt-5 space-y-2.5">
          {[100, 84, 92, 70].map((w, i) => (
            <span key={i} className="block h-3 rounded bg-[#EFEFEF]" style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center justify-around border-t border-[#EAEAEA] px-6 py-3">
        {TOOLBAR.map(({ id, Icon }) => (
          <button
            key={id}
            {...action(
              'slack.webview.toolbar.toast',
              () => {
                if (id === 'share') {
                  const launched = shareText(url || host, (ok) => {
                    if (ok) showToast(t('common.shareSuccess'));
                  });
                  if (!launched) notImplemented();
                  return;
                }
                notImplemented();
              },
              { params: { tool: id } },
            )}
            aria-label={id === 'reader' ? t('webview.readerMode') : id}
            className="border-none bg-transparent p-1"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  );
};

export default WebViewPage;
