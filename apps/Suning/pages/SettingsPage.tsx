import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcChevronRight, IcClose } from '../res/icons';
import { useLocale } from '@/os/locale';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';

const AVATAR = '/@app-assets/Suning/me/avatar-lion.png';

/**
 * 账户设置(spec me.settings,s308)。
 * 唯一真功能=语言切换(?sheet=language → OS locale);其余分组 toast;
 * ?dialog=logout 确认后仍 toast「暂未开放」(不做登录流)。
 */
export default function SettingsPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const sheetOpen = searchParams.get('sheet') === 'language';
  const dialogOpen = searchParams.get('dialog') === 'logout';

  const user = useSuningStore((s) => s.user);
  const showToast = useSuningStore((s) => s.showToast);
  const setTemp = useSuningStore((s) => s.setTemp);
  const profileDot = useSuningStore((s) => s._temp.profileDot);
  const locale = useLocale();

  const wontfix = () => showToast(S.toastNotOpen);
  const isEn = locale === 'en';
  const langLabel = isEn ? 'English' : S.settingsLangZh;

  const applyLocale = (code: 'zh-Hans' | 'en') => {
    window.__OS__?.locale?.setLocale?.(code);
    back();
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">
          {S.settingsTitle}
        </span>
        <span className="w-7 shrink-0" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-8 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <button
          {...bindTap('me.settings.profile.open', {
            beforeTrigger: () => setTemp({ profileDot: false }),
          })}
          className="mb-2 flex w-full cursor-pointer items-center gap-3 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left"
        >
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[var(--app-c-chip-bg)]">
            <Img src={AVATAR} className="h-full w-full object-cover" />
            {profileDot && (
              <span className="absolute right-0 top-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--app-c-danger)]" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-bold text-[var(--app-text)]">{user.phoneMasked}</span>
            <span className="mt-0.5 block text-[12px] text-[var(--app-c-text-muted)]">{S.settingsProfileEntry}</span>
          </span>
          <IcChevronRight size={16} className="shrink-0 text-[#CCC]" />
        </button>

        <Group>
          <Row label={S.settingsAddress} bind={bindTap('me.settings.addressList.open')} />
          <Row label={S.settingsShareholder} onTap={wontfix} />
        </Group>

        <Group>
          <Row label={S.settingsAccountSafe} onTap={wontfix} />
          <Row label={S.settingsCareMode} onTap={wontfix} />
          <Row label={S.settingsRealName} onTap={wontfix} />
          <Row label={S.settingsPay} onTap={wontfix} />
          <Row
            label={S.settingsLanguage}
            value={langLabel}
            bind={bindTap('me.settings.language.open')}
          />
          <Row label={S.settingsInvoiceQual} onTap={wontfix} />
        </Group>

        <Group>
          {(
            [
              S.settingsPrivacyThird,
              S.settingsPrivacy,
              S.settingsPermissionList,
              S.settingsPersonalList,
              S.settingsShareList,
              S.settingsPrivacyPolicy,
            ] as const
          ).map((label) => (
            <Row key={label} label={label} onTap={wontfix} />
          ))}
        </Group>

        <Group>
          {(
            [
              S.settingsGeneral,
              S.settingsFeedback,
              S.settingsAbout,
              S.settingsCancelApp,
              S.settingsCancelAccount,
            ] as const
          ).map((label) => (
            <Row key={label} label={label} onTap={wontfix} />
          ))}
        </Group>

        <button
          {...bindTap('me.settings.logout.open')}
          className="mt-3 w-full cursor-pointer rounded-xl border-none bg-[var(--app-surface)] py-3.5 text-[15px] font-bold text-[var(--app-c-danger)]"
        >
          {S.settingsLogout}
        </button>
      </div>

      {sheetOpen && (
        <div className="absolute inset-0 z-20 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-2xl bg-[var(--app-surface)] pb-6">
            <div className="flex items-center px-3 py-3">
              <span className="min-w-0 flex-1 text-center text-[15px] font-bold text-[var(--app-text)]">
                {S.settingsLanguage}
              </span>
              <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-c-text-muted)]">
                <IcClose size={18} />
              </button>
            </div>
            <button
              {...action('me.settings.select.chinese', () => applyLocale('zh-Hans'))}
              className={`flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3.5 text-left text-[15px] ${
                !isEn ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              {S.settingsLangZh}
              {!isEn && <span className="text-[var(--app-primary)]">✓</span>}
            </button>
            <button
              {...action('me.settings.select.english', () => applyLocale('en'))}
              className={`flex w-full cursor-pointer items-center justify-between border-none bg-transparent px-4 py-3.5 text-left text-[15px] ${
                isEn ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text)]'
              }`}
            >
              English
              {isEn && <span className="text-[var(--app-primary)]">✓</span>}
            </button>
          </div>
        </div>
      )}

      {dialogOpen && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-[var(--app-surface)] px-4 pb-3 pt-5">
            <div className="pb-4 text-center text-[15px] text-[var(--app-text)]">{S.settingsLogoutAsk}</div>
            <div className="flex gap-2">
              <button
                {...bindBack()}
                className="min-w-0 flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2.5 text-[14px] text-[var(--app-text-muted)]"
              >
                {S.cancel}
              </button>
              <button
                {...action('me.settings.wontfix.toast', () => {
                  showToast(S.toastNotOpen);
                  back();
                })}
                className="min-w-0 flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[14px] font-bold text-white"
              >
                {S.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 overflow-hidden rounded-xl bg-[var(--app-surface)]">{children}</div>;
}

function Row({
  label,
  value,
  onTap,
  bind,
}: {
  label: string;
  value?: string;
  onTap?: () => void;
  bind?: Record<string, unknown>;
}) {
  const { action } = useSuningGestures();
  const props = bind ?? (onTap ? action('me.settings.wontfix.toast', onTap) : {});
  return (
    <button
      {...props}
      className="flex w-full cursor-pointer items-center gap-2 border-b border-[var(--app-border)] bg-transparent px-3 py-3.5 text-left last:border-b-0"
    >
      <span className="min-w-0 flex-1 text-[14px] text-[var(--app-text)]">{label}</span>
      {value && <span className="shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{value}</span>}
      <IcChevronRight size={14} className="shrink-0 text-[#CCC]" />
    </button>
  );
}
