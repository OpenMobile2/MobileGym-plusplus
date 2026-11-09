import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuDark } from '../hooks/useYoukuDark';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { IcBack, IcChevron, IcCheck, ConfirmSheet, Switch } from './me/meShared';
import type { AppearanceMode } from '../types';

/** 行类型:开关(switch)/ 值+wontfix / 纯wontfix / 特殊(profile/theme) */
type Row =
  | { kind: 'switch'; label: string; key: string; sub?: string }
  | { kind: 'wontfix'; label: string; value?: string; valueBlue?: boolean }
  | { kind: 'profile'; label: string }
  | { kind: 'theme'; label: string; value: string }
  | { kind: 'version'; label: string; value: string };

/**
 * spec 节点 me.settings(route /me/settings)—— 设置页(s251 长列表)。
 * 外观三档(深色默认 / 浅色 / 跟随系统)经 ?theme=1 弹层选择;退出登录走确认弹层。
 */
export default function SettingsPage() {
  const { bindTap, action, bindBack, back } = useYoukuGestures();
  const [sp, setSearchParams] = useSearchParams();
  const { s } = useI18n();
  const isDark = useYoukuDark();
  const settings = useYoukuStore((st) => st.settings);
  const appearanceMode = useYoukuStore((st) => st.appearanceMode);
  const setAppearanceMode = useYoukuStore((st) => st.setAppearanceMode);
  const toggleSetting = useYoukuStore((st) => st.toggleSetting);
  const showToast = useYoukuStore((st) => st.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const logoutOpen = sp.get('logout') === '1';
  const themeOpen = sp.get('theme') === '1';
  const rowCls = 'flex min-h-[52px] items-center px-4';

  const themeLabel =
    appearanceMode === 'light'
      ? s.settingsThemeLight
      : appearanceMode === 'system'
        ? s.settingsThemeSystem
        : s.settingsThemeDark;

  const groups = useMemo((): Array<{ title?: string; rows: Row[] }> => {
    return [
      {
        rows: [
          { kind: 'profile', label: s.settingsProfile },
          { kind: 'wontfix', label: s.settingsAccountSafe },
          { kind: 'wontfix', label: s.settingsRecover, value: s.settingsRecoverHint },
          { kind: 'switch', label: s.settingsTouchId, key: 'touchId' },
        ],
      },
      {
        title: s.settingsDisplay,
        rows: [
          { kind: 'theme', label: s.settingsAppearance, value: themeLabel },
          { kind: 'wontfix', label: s.settingsElder },
          { kind: 'wontfix', label: s.settingsMinor, value: s.settingsMinorOff },
          { kind: 'wontfix', label: s.settingsChild },
        ],
      },
      {
        title: s.settingsPlayback,
        rows: [
          { kind: 'switch', label: s.settingsSkipIntro, key: 'skipIntro' },
          { kind: 'switch', label: s.settingsAutoPlayNoWifi, key: 'autoPlayNoWifi' },
          { kind: 'switch', label: s.settingsDataTip, key: 'dataTip' },
          { kind: 'switch', label: s.settingsBgAutoPlay, key: 'bgAutoPlay', sub: s.settingsBgAutoPlaySub },
        ],
      },
      {
        title: s.settingsDownload,
        rows: [
          { kind: 'switch', label: s.settingsDataDownload, key: 'dataDownload' },
          { kind: 'wontfix', label: s.settingsDownloadPath },
          { kind: 'wontfix', label: s.settingsDownloadQuality, value: s.settingsDownloadQualityVal },
          { kind: 'wontfix', label: s.settingsDownloadCount, value: s.settingsDownloadCountVal },
          { kind: 'switch', label: s.settingsDownloadSound, key: 'downloadSound' },
        ],
      },
      { title: s.settingsCar, rows: [{ kind: 'wontfix', label: s.settingsCarLink, value: s.settingsCarLinkOn }] },
      {
        title: s.settingsMsg,
        rows: [
          { kind: 'wontfix', label: s.settingsPushOut, value: s.settingsPushOutHint, valueBlue: true },
          { kind: 'wontfix', label: s.settingsPushIn },
        ],
      },
      {
        title: s.settingsOther,
        rows: [
          { kind: 'wontfix', label: s.settingsClearCache },
          { kind: 'wontfix', label: s.settingsPrivacy },
          { kind: 'wontfix', label: s.settingsPrivacyBasic },
          { kind: 'wontfix', label: s.settingsPrivacyPolicy },
          { kind: 'wontfix', label: s.settingsPrivacySummary },
          { kind: 'wontfix', label: s.settingsPersonalList },
          { kind: 'wontfix', label: s.settingsShareList },
          { kind: 'wontfix', label: s.settingsPersonalDownload },
          { kind: 'wontfix', label: s.settingsLegal },
          { kind: 'wontfix', label: s.settingsPartner },
          { kind: 'wontfix', label: s.settingsLicense },
          { kind: 'wontfix', label: s.settingsAvLicense },
          { kind: 'wontfix', label: s.settingsValueLicense },
          { kind: 'wontfix', label: s.settingsCultureLicense },
          { kind: 'wontfix', label: s.settingsAlgo },
          { kind: 'wontfix', label: s.settingsNetwork, value: s.settingsNetworkVal },
          { kind: 'wontfix', label: s.settingsMore },
          { kind: 'wontfix', label: s.settingsRecManage },
          { kind: 'version', label: s.settingsVersion, value: 'V11.2.1' },
        ],
      },
    ];
  }, [s, themeLabel]);

  const openTheme = () =>
    setSearchParams((p) => {
      p.set('theme', '1');
      return p;
    });

  const pickTheme = (mode: AppearanceMode) => {
    setAppearanceMode(mode);
    back();
  };

  const themeOptions: Array<{ mode: AppearanceMode; label: string }> = [
    { mode: 'dark', label: s.settingsThemeDark },
    { mode: 'light', label: s.settingsThemeLight },
    { mode: 'system', label: s.settingsThemeSystem },
  ];

  const renderRow = (r: Row, i: number) => {
    if (r.kind === 'profile') {
      return (
        <div key={i} {...bindTap('me.settings.profile.open')} className={`${rowCls} cursor-pointer`}>
          <span className="text-[15px]">{r.label}</span>
          <IcChevron size={17} className="ml-auto text-(--app-c-text-muted)" />
        </div>
      );
    }
    if (r.kind === 'theme') {
      return (
        <div key={i} {...action('me.settings.theme.toggle', openTheme)} className={`${rowCls} cursor-pointer`}>
          <span className="text-[15px]">{r.label}</span>
          <span className="ml-auto text-[14px] text-(--app-c-text-muted)">{r.value}</span>
          <IcChevron size={17} className="ml-1 text-(--app-c-text-muted)" />
        </div>
      );
    }
    if (r.kind === 'switch') {
      return (
        <div key={i} {...action('me.settings.switch.toggle', () => toggleSetting(r.key))} className={`${rowCls} cursor-pointer py-2.5`}>
          <div className="min-w-0 flex-1">
            <div className="text-[15px]">{r.label}</div>
            {r.sub && <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">{r.sub}</div>}
          </div>
          <Switch on={!!settings[r.key]} />
        </div>
      );
    }
    if (r.kind === 'version') {
      return (
        <div key={i} className={rowCls}>
          <span className="text-[15px]">{r.label}</span>
          <span className="ml-auto text-[14px] text-(--app-c-text-muted)">{r.value}</span>
        </div>
      );
    }
    return (
      <div key={i} {...action('me.settings.item.wontfixToast', wontfix)} className={`${rowCls} cursor-pointer`}>
        <span className="text-[15px]">{r.label}</span>
        <span className={`ml-auto text-[14px] ${r.valueBlue ? 'text-(--app-c-brand)' : 'text-(--app-c-text-muted)'}`}>{r.value ?? ''}</span>
        <IcChevron size={17} className="ml-1 text-(--app-c-text-muted)" />
      </div>
    );
  };

  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="relative flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <div className="flex h-12 shrink-0 items-center px-3">
        <button
          {...bindBack()}
          aria-label={s.commonBack}
          className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)"
        >
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">{s.settingsTitle}</span>
        <span className="w-9" />
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {groups.map((g, gi) => (
          <div key={gi}>
            {g.title && <div className="px-4 pb-1.5 pt-4 text-[13px] text-(--app-c-text-muted)">{g.title}</div>}
            <div className={`mx-3 divide-y divide-(--app-c-border) rounded-xl bg-(--app-c-card-bg) ${g.title ? '' : 'mt-2'}`}>
              {g.rows.map(renderRow)}
            </div>
          </div>
        ))}

        <button
          {...action('me.settings.switchAccount.wontfixToast', wontfix)}
          className="mx-3 mt-5 block h-12 w-[calc(100%-24px)] cursor-pointer rounded-xl border-none bg-(--app-c-card-bg) text-[16px] text-(--app-c-text-primary)"
        >
          {s.settingsSwitchAccount}
        </button>
        <button
          onClick={() =>
            setSearchParams((p) => {
              p.set('logout', '1');
              return p;
            })
          }
          className="mx-3 mt-3 block h-12 w-[calc(100%-24px)] cursor-pointer rounded-xl border-none bg-(--app-c-card-bg) text-[16px] text-(--app-c-text-primary)"
        >
          {s.settingsLogout}
        </button>
      </div>

      {themeOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="min-h-0 flex-1 cursor-pointer bg-black/55" />
          <div className="shrink-0 rounded-t-3xl bg-(--app-c-card-bg) px-2 pb-6 pt-3">
            <div className="mb-2 text-center text-[15px] font-medium text-(--app-c-text-secondary)">{s.settingsAppearance}</div>
            {themeOptions.map((opt) => {
              const selected = appearanceMode === opt.mode;
              const onPick = () => pickTheme(opt.mode);
              const bind =
                opt.mode === 'dark'
                  ? action('me.settings.theme.select.dark', onPick)
                  : opt.mode === 'light'
                    ? action('me.settings.theme.select.light', onPick)
                    : action('me.settings.theme.select.system', onPick);
              return (
                <button
                  key={opt.mode}
                  {...bind}
                  className="flex h-14 w-full cursor-pointer items-center border-none bg-transparent px-4 text-[16px] text-(--app-c-text-primary)"
                >
                  <span className="flex-1 text-left">{opt.label}</span>
                  {selected && <IcCheck size={20} strokeWidth={2.4} className="text-(--app-c-brand)" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {logoutOpen && (
        <ConfirmSheet
          text={s.settingsLogoutConfirm}
          confirmText={s.settingsLogout}
          cancelText={s.commonCancel}
          confirmBind={action('me.settings.logout.confirm', () => {
            showToast(s.settingsLogoutDone);
            back();
          })}
        />
      )}
    </div>
  );
}
