import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { STATUS_CLEAR_OPTIONS, STATUS_PRESETS } from '../constants';
import { NEUTRAL, RED, BLUE } from '../res/colors';
import { IcClose, IcChevronRight } from '../res/icons';
import Sheet from '../components/Sheet';
import * as TimeService from '../../../os/TimeService';
import { endOfToday, endOfWeek } from '../utils/timeBounds';

const StatusPage: React.FC = () => {
  const { bindBack, bindTap, action, back } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const sheet = params.get('sheet');

  const status = useSlackStore((s) => s.status);
  const workspace = useSlackStore((s) => s.workspace);
  const noticeDismissed = useSlackStore((s) => s._temp.statusNoticeDismissed);
  const setStatus = useSlackStore((s) => s.setStatus);
  const clearStatus = useSlackStore((s) => s.clearStatus);
  const dismissStatusNotice = useSlackStore((s) => s.dismissStatusNotice);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const applyClearOption = (opt: typeof STATUS_CLEAR_OPTIONS[number]) => {
    if ('toast' in opt && opt.toast) {
      notImplemented();
      return;
    }
    const now = TimeService.now();
    let clearAtTs: number | null = null;
    let clearAfter = t(opt.labelKey);
    if ('minutes' in opt && opt.minutes) {
      clearAtTs = now + opt.minutes * 60 * 1000;
    } else if ('clearKind' in opt && opt.clearKind === 'today') {
      clearAtTs = endOfToday();
    } else if ('clearKind' in opt && opt.clearKind === 'week') {
      clearAtTs = endOfWeek();
    } else if (opt.id === 'never') {
      clearAtTs = null;
      clearAfter = t('status.dontClear');
    }
    setStatus({ clearAfter, clearAtTs });
    back();
  };

  const applyPreset = (preset: typeof STATUS_PRESETS[number]) => {
    const now = TimeService.now();
    const text = t(preset.textKey);
    let clearAtTs: number | null = null;
    let clearAfter = t('status.dontClear');
    if ('clearMinutes' in preset && preset.clearMinutes) {
      clearAtTs = now + preset.clearMinutes * 60 * 1000;
      clearAfter = t('status.clear.1h');
    } else if ('clearKind' in preset && preset.clearKind === 'today') {
      clearAtTs = endOfToday();
      clearAfter = t('status.clear.today');
    }
    setStatus({ emoji: preset.emoji, text, clearAfter, clearAtTs });
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
          {t('status.title')}
        </h1>
        <button
          {...action('slack.status.clear', () => {
            clearStatus();
            back();
          })}
          className="border-none bg-transparent px-2 text-[16px] font-bold"
          style={{ color: RED.primary }}
        >
          {t('status.clear')}
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {!noticeDismissed && (
          <div
            className="mx-4 mt-2 flex items-start gap-2 rounded-lg px-3 py-2.5"
            style={{ backgroundColor: BLUE.noticeBg }}
          >
            <p className="min-w-0 flex-1 text-[14px]" style={{ color: NEUTRAL.textPrimary }}>
              {t('status.widgetNotice')}
            </p>
            <button
              {...action('slack.status.dismissnotice', dismissStatusNotice)}
              className="border-none bg-transparent p-0"
              style={{ color: NEUTRAL.textSecondary }}
            >
              <IcClose size={16} />
            </button>
          </div>
        )}

        {(status.emoji || status.text) && (
          <button
            {...action('slack.status.editcustom', notImplemented)}
            className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center gap-2 rounded-lg border border-[#DDDDDD] px-3 py-2.5 text-left"
          >
            <span className="text-[20px]">{status.emoji}</span>
            <span className="flex-1 text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
              {status.text}
            </span>
          </button>
        )}

        <button
          {...bindTap('slack.status.openclearafter')}
          className="mx-4 mt-3 flex w-[calc(100%-2rem)] items-center justify-between border-none bg-transparent py-2 text-left"
        >
          <span className="text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('status.clearAfterLabel')}
          </span>
          <span className="flex items-center gap-1 text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
            {status.clearAfter || t('status.dontClear')}
            <IcChevronRight size={16} style={{ color: '#B5B5B8' }} />
          </span>
        </button>

        <h2 className="mt-4 px-4 pb-1 text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('status.forWorkspace', { name: workspace.name })}
        </h2>
        {STATUS_PRESETS.map((p) => (
          <button
            key={p.id}
            {...action(`slack.status.setpreset.${p.id}`, () => applyPreset(p))}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <span className="text-[22px]">{p.emoji}</span>
            <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
              {t(p.textKey)}
            </span>
          </button>
        ))}
      </div>

      {sheet === 'clearAfter' && (
        <Sheet handle={false}>
          <h2 className="px-4 pb-2 pt-3 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {t('status.clearAfter')}
          </h2>
          {STATUS_CLEAR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              {...action(`slack.status.clearafter.select.${opt.id}`, () => applyClearOption(opt))}
              className="flex w-full border-none bg-transparent px-4 py-3.5 text-left text-[17px]"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {t(opt.labelKey)}
            </button>
          ))}
        </Sheet>
      )}
    </div>
  );
};

export default StatusPage;
