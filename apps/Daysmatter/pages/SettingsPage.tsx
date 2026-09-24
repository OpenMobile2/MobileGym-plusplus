import { useState } from 'react';
import { ChevronRight, Check, Palette, ListOrdered, StickyNote, Image as ImageIcon, Camera, Bell, LayoutGrid, Lock, Cloud, GraduationCap, FileText, User } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { SORT_OPTIONS } from '../constants';
import type { SortKind } from '../types';
import TopBar from '../components/TopBar';
import { APP_ICON_VARIANTS, IconTile, useSelectedIconId, setSelectedIconId } from '../res/appIcon';
import { useI18n, optionLabel } from '../i18n';

export default function SettingsPage() {
  const { bindTap, action } = useDaysmatterGestures();
  const { t, locale } = useI18n();
  const settings = useDaysmatterStore((s) => s.settings);
  const user = useDaysmatterStore((s) => s.user);
  const patchSettings = useDaysmatterStore((s) => s.patchSettings);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const [sw, setSw] = useState({ camRaw: false, dailyPin: false, backupImg: false, iCal: false, recommend: false });
  const appIcon = useSelectedIconId();

  const sortLabel = optionLabel(t, 'sort', settings.sortBy);
  const cycleSort = () => {
    const i = SORT_OPTIONS.findIndex((o) => o.id === settings.sortBy);
    return SORT_OPTIONS[(i + 1) % SORT_OPTIONS.length].id as SortKind;
  };
  const toggleSw = (k: keyof typeof sw) => setSw((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('settings.title')} back solid />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <button {...bindTap<HTMLButtonElement>('settings.login-open')} className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left active:bg-[#ECEAE4]">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E4E2DC] text-[#9A9A9A]"><User size={22} /></div>
          <div className="flex-1 text-[16px] text-[#1A1A1A]">{user.loggedIn ? user.name : t('common.login')}</div>
          <ChevronRight size={18} className="text-[#C4C4C4]" />
        </button>

        <GroupHeader icon={<Palette size={14} />} text={t('settings.design')} />
        <Card>
          <NavRow
            label={t('settings.language')}
            value={locale === 'zh' ? t('settings.languageZh') : t('settings.languageEn')}
            {...bindTap<HTMLButtonElement>('settings.language-open')}
          />
          <NavRow label={t('settings.style')} value={t('settings.styleFlat')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.styleUnavailable')), { params: { key: 'style' } })} />
          <NavRow label={t('settings.bgImage')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.bgPro')), { params: { key: 'bg' } })} />
          <SwitchRow label={t('settings.bigFont')} on={settings.bigFont} {...action<HTMLButtonElement>('settings.bigFont.toggle', () => patchSettings({ bigFont: !settings.bigFont }))} />
          <SwitchRow label={t('settings.cardAnim')} on={settings.cardAnim} {...action<HTMLButtonElement>('settings.cardAnim.toggle', () => patchSettings({ cardAnim: !settings.cardAnim }))} />
          <div className="px-4 py-3.5">
            <div className="mb-2.5 flex items-center gap-1.5 text-[15px] text-[#1A1A1A]">{t('settings.changeIcon')} <ProBadge /></div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar">
              {APP_ICON_VARIANTS.map((ic) => (
                <button
                  key={ic.id}
                  {...action<HTMLButtonElement>('settings.appIcon.tap', () => { setSelectedIconId(ic.id); showToast(t('toast.iconUpdated')); }, { params: { value: ic.id } })}
                  className="relative flex-shrink-0"
                >
                  <span className="block overflow-hidden rounded-[11px] shadow-sm ring-1 ring-black/5">
                    <IconTile variant={ic} side={44} />
                  </span>
                  {appIcon === ic.id && <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#4CAF50] text-white ring-2 ring-white"><Check size={10} strokeWidth={4} /></span>}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <GroupHeader icon={<ListOrdered size={14} />} text={t('settings.eventList')} />
        <Card>
          <NavRow label={t('settings.sortBy')} value={sortLabel} {...action<HTMLButtonElement>('settings.sort.pick', () => patchSettings({ sortBy: cycleSort() }), { params: { value: cycleSort() } })} />
          <SwitchRow label={t('settings.autoPin')} on={settings.autoPin} {...action<HTMLButtonElement>('settings.autoPin.toggle', () => patchSettings({ autoPin: !settings.autoPin }))} />
          <SwitchRow label={t('settings.hideAffix')} on={settings.hideAffix} last {...action<HTMLButtonElement>('settings.hideAffix.toggle', () => patchSettings({ hideAffix: !settings.hideAffix }))} />
        </Card>

        <GroupHeader icon={<StickyNote size={14} />} text={t('settings.notes')} />
        <Card>
          <NavRow label={t('settings.notesSettings')} value={t('settings.notesValue')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.notesUnavailable')), { params: { key: 'note' } })} last />
        </Card>

        <GroupHeader icon={<ImageIcon size={14} />} text={t('settings.album')} />
        <Card>
          <NavRow label={t('settings.albumManage')} {...bindTap<HTMLButtonElement>('notebook.album-open')} />
          <NavRow label={t('settings.albumSort')} value={t('settings.albumSortRecent')} last {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.albumSortUnavailable')), { params: { key: 'albumSort' } })} />
        </Card>

        <GroupHeader icon={<Camera size={14} />} text={t('settings.transparentCam')} />
        <Card>
          <SwitchRow label={t('settings.camSaveRaw')} pro on={sw.camRaw} last {...action<HTMLButtonElement>('settings.switch.toggle', () => toggleSw('camRaw'), { params: { key: 'camRaw' } })} />
        </Card>

        <GroupHeader icon={<Bell size={14} />} text={t('settings.notifications')} />
        <Card>
          <NavRow label={t('settings.badge')} value={t('settings.badgeOff')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.badgeUnavailable')), { params: { key: 'badge' } })} />
          <SwitchRow label={t('settings.dailyPin')} on={sw.dailyPin} {...action<HTMLButtonElement>('settings.switch.toggle', () => toggleSw('dailyPin'), { params: { key: 'dailyPin' } })} />
          <NavRow label={t('settings.pushSettings')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.pushUnavailable')), { params: { key: 'push' } })} />
          <NavRow label={t('settings.strongReminder')} pro value={t('settings.strongProOnly')} last {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.strongPro')), { params: { key: 'strong' } })} />
        </Card>

        <GroupHeader icon={<LayoutGrid size={14} />} text={t('settings.widgets')} />
        <Card>
          <NavRow label={t('settings.addWidget')} {...bindTap<HTMLButtonElement>('notebook.widgets-open')} />
          <NavRow label={t('settings.watch')} last {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.watchUnavailable')), { params: { key: 'watch' } })} />
        </Card>

        <GroupHeader icon={<Lock size={14} />} text={t('settings.privacy')} />
        <Card>
          <NavRow label={t('settings.password')} last {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.lockUnavailable')), { params: { key: 'lock' } })} />
        </Card>

        <GroupHeader icon={<Cloud size={14} />} text={t('settings.data')} />
        <Card>
          <NavRow label={t('settings.backupIcloud')} {...action<HTMLButtonElement>('settings.backup.tap', () => showToast(t('toast.backupUnavailable')))} />
          <NavRow label={t('settings.exportBackup')} {...action<HTMLButtonElement>('settings.backup.tap', () => showToast(t('toast.exportUnavailable')))} />
          <NavRow label={t('settings.restoreBackup')} {...action<HTMLButtonElement>('settings.backup.tap', () => showToast(t('toast.restoreUnavailable')))} />
          <SwitchRow label={t('settings.backupImages')} on={sw.backupImg} {...action<HTMLButtonElement>('settings.switch.toggle', () => toggleSw('backupImg'), { params: { key: 'backupImg' } })} />
          <SwitchRow label={t('settings.syncIcal')} on={sw.iCal} last {...action<HTMLButtonElement>('settings.switch.toggle', () => toggleSw('iCal'), { params: { key: 'iCal' } })} />
        </Card>

        <GroupHeader icon={<GraduationCap size={14} />} text={t('settings.tutorial')} />
        <Card>
          <NavRow label={t('settings.howToUse')} {...bindTap<HTMLButtonElement>('notebook.faq-open')} />
          <NavRow label={t('settings.upgradePro')} {...bindTap<HTMLButtonElement>('notebook.pro-open')} />
          <SwitchRow label={t('settings.showRecommend')} on={sw.recommend} {...action<HTMLButtonElement>('settings.switch.toggle', () => toggleSw('recommend'), { params: { key: 'recommend' } })} />
          <NavRow label={t('settings.hideAds')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.hideAdPro')), { params: { key: 'noad' } })} />
          <NavRow label={t('settings.resetGuide')} {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.resetGuide')), { params: { key: 'resetGuide' } })} />
          <NavRow label={t('settings.clearCache')} last {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.cacheCleared')), { params: { key: 'clearCache' } })} />
        </Card>

        <GroupHeader icon={<FileText size={14} />} text={t('settings.terms')} />
        <Card>
          <NavRow label={t('settings.termsOfService')} {...action<HTMLButtonElement>('settings.terms.tap', () => showToast(t('toast.termsUnavailable')))} />
          <NavRow label={t('settings.privacyPolicy')} {...action<HTMLButtonElement>('settings.terms.tap', () => showToast(t('toast.termsUnavailable')))} />
          <NavRow label={t('settings.personalInfo')} {...action<HTMLButtonElement>('settings.terms.tap', () => showToast(t('toast.termsUnavailable')))} />
          <NavRow label={t('settings.thirdParty')} {...action<HTMLButtonElement>('settings.terms.tap', () => showToast(t('toast.termsUnavailable')))} />
          <NavRow label={t('settings.about')} value={t('settings.aboutVersion')} last {...action<HTMLButtonElement>('settings.item.tap', () => showToast(t('toast.about')), { params: { key: 'about' } })} />
        </Card>
        <div className="h-6" />
      </div>
    </div>
  );
}

function GroupHeader({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mb-1.5 mt-4 flex items-center gap-1.5 px-2 text-[13px] text-[#9A9A9A]">
      {icon}{text}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-xl bg-white">{children}</div>;
}

function ProBadge() {
  return <span className="rounded bg-[#F2A23C] px-1.5 py-0.5 text-[10px] font-bold text-white">Pro</span>;
}

function NavRow({ label, value, pro, last, ...rest }: { label: string; value?: string; pro?: boolean; last?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`flex w-full items-center px-4 py-3.5 text-left active:bg-[#F2F1EC] ${last ? '' : 'border-b border-[#F2F1EC]'}`}>
      <span className="flex flex-1 items-center gap-1.5 text-[15px] text-[#1A1A1A]">{label}{pro && <ProBadge />}</span>
      {value && <span className="text-[14px] text-[#3E7CB1]">{value}</span>}
      <ChevronRight size={16} className="ml-1 flex-shrink-0 text-[#C4C4C4]" />
    </button>
  );
}

function SwitchRow({ label, on, pro, last, ...rest }: { label: string; on: boolean; pro?: boolean; last?: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`flex w-full items-center px-4 py-3.5 text-left active:bg-[#F2F1EC] ${last ? '' : 'border-b border-[#F2F1EC]'}`}>
      <span className="flex flex-1 items-center gap-1.5 text-[15px] text-[#1A1A1A]">{label}{pro && <ProBadge />}</span>
      <span className={`relative h-6 w-10 flex-shrink-0 rounded-full ${on ? 'bg-[#3E7CB1]' : 'bg-[#D8D6D0]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
