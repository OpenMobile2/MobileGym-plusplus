import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { PREFS_SECTIONS } from '../constants';
import { NEUTRAL } from '../res/colors';
import { IconRenderer, IcClose, IcChevronRight, IcExternalLink } from '../res/icons';
import type { TransitionId } from '../navigation.declaration';

const ROW_NAV: Record<string, TransitionId> = {
  notifications: 'slack.prefs.opennotifications',
  language: 'slack.prefs.openlanguage',
  colorMode: 'slack.prefs.opencolormode',
};

/**
 * 首选项（IMG_2408 / 2409 / 2410）。
 */
const PrefsPage: React.FC = () => {
  const { bindBack, bindTap, action } = useSlackGestures();
  const { t } = useI18n();
  const language = useSlackStore((s) => s.settings.language);
  const notImplemented = useSlackStore((s) => s.notImplemented);

  const dynamicValue = (key: string) => {
    if (key === 'colorMode') return t('prefs.light');
    if (key === 'language') {
      if (language === 'en') return t('prefs.langEn');
      if (language === 'zh') return t('prefs.langZh');
      return t('prefs.langZh');
    }
    return '';
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
          {t('prefs.title')}
        </h1>
        <span className="w-9" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {PREFS_SECTIONS.map((sec) => (
          <div key={sec.titleKey}>
            <h2
              className="px-4 pb-1 pt-4 text-[15px] font-bold"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {t(sec.titleKey)}
            </h2>
            {sec.rows.map((row) => {
              const value =
                'dynamicValue' in row
                  ? dynamicValue(row.dynamicValue)
                  : 'valueKey' in row
                    ? t(row.valueKey)
                    : 'descKey' in row
                      ? t(row.descKey)
                      : '';
              const readonly = 'readonly' in row && row.readonly;
              const external = 'external' in row && row.external;
              const navId = ROW_NAV[row.id];
              const body = (
                <>
                  <IconRenderer
                    name={row.icon}
                    size={20}
                    style={{ color: NEUTRAL.textSecondary }}
                    className="flex-shrink-0"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[17px]" style={{ color: NEUTRAL.textPrimary }}>
                      {t(row.labelKey)}
                    </span>
                    {value && (
                      <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                        {value}
                      </span>
                    )}
                  </span>
                  {'trailing' in row && <span className="text-[17px]">{row.trailing}</span>}
                  {!readonly &&
                    (external ? (
                      <IcExternalLink size={17} style={{ color: NEUTRAL.textSecondary }} />
                    ) : (
                      <IcChevronRight size={19} style={{ color: '#B5B5B8' }} />
                    ))}
                </>
              );

              if (readonly) {
                return (
                  <div key={row.id} className="flex items-center gap-3.5 px-4 py-3">
                    {body}
                  </div>
                );
              }

              const tapProps = navId
                ? bindTap(navId)
                : external
                  ? action('slack.prefs.external.toast', notImplemented, { params: { row: row.id } })
                  : action('slack.prefs.entry.toast', notImplemented, { params: { row: row.id } });

              return (
                <button
                  key={row.id}
                  {...tapProps}
                  className="flex w-full items-center gap-3.5 border-none bg-transparent px-4 py-3 text-left"
                >
                  {body}
                </button>
              );
            })}
            <div className="mt-2 h-2 bg-[#F5F5F5]" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrefsPage;
