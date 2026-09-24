import React, { useState } from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { PAUSE_NOTIFICATION_OPTIONS } from '../constants';
import { NEUTRAL } from '../res/colors';
import { IcClose } from '../res/icons';
import * as TimeService from '../../../os/TimeService';
import { startOfNextWeek, startOfTomorrow } from '../utils/timeBounds';

const PauseNotificationsPage: React.FC = () => {
  const { bindBack, action, back } = useSlackGestures();
  const { t } = useI18n();
  const pauseNotifications = useSlackStore((s) => s.pauseNotifications);
  const notImplemented = useSlackStore((s) => s.notImplemented);
  const [picked, setPicked] = useState<string | null>(null);

  const computeUntil = (opt: typeof PAUSE_NOTIFICATION_OPTIONS[number]): number | null => {
    const now = TimeService.now();
    if ('minutes' in opt && opt.minutes) return now + opt.minutes * 60 * 1000;
    if ('kind' in opt && opt.kind === 'tomorrow') return startOfTomorrow();
    if ('kind' in opt && opt.kind === 'nextWeek') return startOfNextWeek();
    return null;
  };

  const save = () => {
    const opt = PAUSE_NOTIFICATION_OPTIONS.find((o) => o.id === picked);
    if (!opt) return;
    if ('toast' in opt && opt.toast) {
      notImplemented();
      return;
    }
    pauseNotifications(computeUntil(opt));
    back();
  };

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
          {t('me.pauseNotifications')}
        </h1>
        <button
          {...action('slack.pause.save', save)}
          disabled={!picked}
          className="border-none bg-transparent px-2 text-[16px] font-bold disabled:opacity-40"
          style={{ color: '#1264A3' }}
        >
          {t('status.save')}
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {PAUSE_NOTIFICATION_OPTIONS.map((opt) => (
          <React.Fragment key={opt.id}>
            {opt.id === 'custom' && <div className="my-2 h-px bg-[#EAEAEA]" />}
            <button
              {...action(`slack.pause.pick.${opt.id}`, () => {
                if ('toast' in opt && opt.toast) {
                  notImplemented();
                  return;
                }
                setPicked(opt.id);
              })}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3.5 text-left"
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full border-2"
                style={{
                  borderColor: picked === opt.id ? '#1264A3' : '#C9C9C9',
                  backgroundColor: picked === opt.id ? '#1264A3' : 'transparent',
                }}
              >
                {picked === opt.id && <span className="h-2 w-2 rounded-full bg-white" />}
              </span>
              <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
                {t(opt.labelKey)}
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PauseNotificationsPage;
