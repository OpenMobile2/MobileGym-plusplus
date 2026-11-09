import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL } from '../res/colors';
import SecondaryCloseHeader from '../components/SecondaryCloseHeader';
import Switch from '../components/Switch';

const LEVELS = [
  { id: 'all', labelKey: 'prefs.notify.all' },
  { id: 'mentions', labelKey: 'prefs.notify.mentions' },
  { id: 'nothing', labelKey: 'prefs.notify.nothing' },
] as const;

const PrefsNotificationsPage: React.FC = () => {
  const { action } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const convId = params.get('convId');

  const conversations = useSlackStore((s) => s.conversations);
  const settings = useSlackStore((s) => s.settings);
  const setSetting = useSlackStore((s) => s.setSetting);
  const toggleMute = useSlackStore((s) => s.toggleMute);

  const conv = convId ? conversations.find((c) => c.id === convId) : null;
  const title = conv
    ? conv.kind === 'channel'
      ? `#${conv.name}`
      : conv.name
    : t('prefs.notifications');

  return (
    <div className="flex h-full flex-col bg-white">
      <SecondaryCloseHeader title={title} />
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <h2 className="px-4 pb-1 pt-3 text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('prefs.notify.section')}
        </h2>
        {LEVELS.map((lv) => (
          <button
            key={lv.id}
            {...action(`slack.prefs.notifications.select.${lv.id}`, () => setSetting('notifyMode', lv.id), {
              params: { level: lv.id },
            })}
            className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
          >
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full border-2"
              style={{
                borderColor: settings.notifyMode === lv.id ? '#1264A3' : '#C9C9C9',
                backgroundColor: settings.notifyMode === lv.id ? '#1264A3' : 'transparent',
              }}
            >
              {settings.notifyMode === lv.id && (
                <span className="h-2 w-2 rounded-full bg-white" />
              )}
            </span>
            <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
              {t(lv.labelKey)}
            </span>
          </button>
        ))}

        {conv && (
          <div className="mt-4 border-t border-[#EAEAEA] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
                {t('chSettings.mute')}
              </span>
              <Switch
                on={conv.muted}
                bindProps={action('slack.prefs.notifications.mute', () => toggleMute(conv.id))}
              />
            </div>
            <p className="mt-1 text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('chSettings.muteDesc')}
            </p>
          </div>
        )}

        <h2 className="mt-4 px-4 pb-1 text-[13px] font-bold" style={{ color: NEUTRAL.textSecondary }}>
          {t('prefs.notify.other')}
        </h2>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('prefs.notify.preview')}
          </span>
          <Switch
            on={settings.messagePreview}
            bindProps={action('slack.prefs.notifications.toggle', () =>
              setSetting('messagePreview', !settings.messagePreview),
            )}
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
            {t('prefs.notify.sound')}
          </span>
          <Switch
            on={settings.soundEnabled}
            bindProps={action('slack.prefs.notifications.toggle', () =>
              setSetting('soundEnabled', !settings.soundEnabled),
            )}
          />
        </div>
      </div>
    </div>
  );
};

export default PrefsNotificationsPage;
