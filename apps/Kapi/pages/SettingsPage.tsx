import React, { useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Switch } from '../components/ui';
import { toast } from '../components/toast';
import { useStrings } from '../hooks/useStrings';
import type { strings } from '../res/strings';

const FLAGS: Array<{ key: 'autoScreenshot' | 'location' | 'coupon' | 'push'; labelKey: keyof typeof strings }> = [
  { key: 'autoScreenshot', labelKey: 'settingFlagAutoScreenshot' },
  { key: 'location', labelKey: 'settingFlagLocation' },
  { key: 'coupon', labelKey: 'settingFlagCoupon' },
  { key: 'push', labelKey: 'settingFlagPush' },
];

const PUSH_ITEMS: Array<{ key: string; labelKey: keyof typeof strings }> = [
  { key: 'budgetAlert', labelKey: 'pushItemBudgetAlert' },
  { key: 'billRemind', labelKey: 'pushItemBillRemind' },
  { key: 'weeklyReport', labelKey: 'pushItemWeeklyReport' },
];

export default function SettingsPage() {
  const { bindBack, bindAction, back } = useKapiGestures();
  const s = useStrings();
  const settings = useKapiStore((st) => st.settings);
  const toggleSettingFlag = useKapiStore((st) => st.toggleSettingFlag);
  const togglePushItem = useKapiStore((st) => st.togglePushItem);
  const purgeAllBills = useKapiStore((st) => st.purgeAllBills);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <TopBar title={s.settingsTitle} backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="settings" data-scroll-direction="vertical">
        <Card className="mt-2">
          <Row label={s.monthStartDayLabel} value={`${s.monthlyDayPrefix}${settings.monthStartDay}${s.monthlyDaySuffix}`} bind={bindAction('settings.entry.noop', () => toast(s.featureNotAvailable))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.catReplyStyleLabel} value={settings.catReplyStyle} bind={bindAction('settings.entry.noop', () => toast(s.featureNotAvailable))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.currencyLabel} value={settings.currency} bind={bindAction('settings.entry.noop', () => toast(s.featureNotAvailable))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.appIconLabel} value={s.defaultLabel} bind={bindAction('settings.entry.noop', () => toast(s.featureNotAvailable))} />
        </Card>

        <Card className="mt-3">
          {FLAGS.map((f, i) => (
            <div key={f.key}>
              {i > 0 && <div className="h-px bg-[#EDEFF4] mx-4" />}
              <Row label={s[f.labelKey]} chevron={false} value={<Switch on={settings.flags[f.key]} bind={bindAction('settings.flag.toggle.option', () => toggleSettingFlag(f.key), { value: f.key })} />} />
            </div>
          ))}
        </Card>

        <div className="text-[13px] text-app-text-muted mt-4 mb-1 px-1">{s.pushSubItemsTitle}</div>
        <Card>
          {PUSH_ITEMS.map((p, i) => (
            <div key={p.key}>
              {i > 0 && <div className="h-px bg-[#EDEFF4] mx-4" />}
              <Row label={s[p.labelKey]} chevron={false} value={<Switch on={!!settings.pushItems[p.key]} bind={bindAction('settings.pushItem.toggle.option', () => togglePushItem(p.key), { value: p.key })} />} />
            </div>
          ))}
        </Card>

        <Card className="mt-3">
          <Row label={s.helpFeedbackLabel} bind={bindAction('settings.help.noop', () => toast(s.featureNotAvailable))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.aboutAppLabel} bind={bindAction('settings.help.noop', () => toast(s.featureNotAvailable))} />
        </Card>

        <button
          {...bindAction('settings.purge.confirm.delete', () => setConfirming(true))}
          className="w-full mt-4 py-3 rounded-xl bg-app-surface text-[#F0524B] text-[15px] border-none cursor-pointer"
        >
          {s.deleteAllBillsBtn}
        </button>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/40" onClick={() => setConfirming(false)}>
          <div className="bg-app-surface rounded-2xl w-64 p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-[16px] text-app-text mb-1">{s.confirmDeleteAllTitle}</div>
            <div className="text-[13px] text-app-text-muted mb-4">{s.irreversibleHint}</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl bg-[#F0F2F8] text-[#5A6172] border-none cursor-pointer">{s.cancelBtn}</button>
              <button onClick={() => { purgeAllBills(); setConfirming(false); toast(s.clearedToast); back(); }} className="flex-1 py-2 rounded-xl bg-[#F0524B] text-white border-none cursor-pointer">{s.deleteBtn}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
