import React from 'react';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, useToast } from '../components/ui';

/** 设置(spec: settings.main,IMG_8736;除收货地址外其余 P2 stub) */
export default function SettingsPage() {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const [toast, showToast] = useToast();

  const Group = ({ title, rows }: { title?: string; rows: Array<{ label: string; value?: string; nav?: boolean }> }) => (
    <div className="bg-app-surface rounded-xl mt-2 px-4 py-1">
      {title && <div className="text-[13px] text-app-text-muted pt-2">{title}</div>}
      {rows.map((r) => (
        <button
          key={r.label}
          {...(r.nav
            ? bindTap('settings.address-open')
            : { onClick: () => showToast(s.settingsDisplayOnlyToast) })}
          className="w-full flex justify-between items-center py-3.5 bg-transparent border-none border-b border-[#F8F8F8] cursor-pointer last:border-0"
        >
          <span className="text-[15px]">{r.label}</span>
          <span className="text-[13px] text-app-text-muted">{r.value ?? ''} ›</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={s.settingsTitle} />
      <div className="flex-1 overflow-y-auto px-3">
        <Group title={s.groupAccountSecurity} rows={[
          { label: s.addressListTitle, nav: true },
          { label: s.groupAccountSecurity },
          { label: s.paymentSettingsLabel },
          { label: s.regionSettingsLabel },
        ]} />
        <Group title={s.groupFeatures} rows={[
          { label: s.generalSettingsLabel },
          { label: s.notificationSettingsLabel },
          { label: s.privacySettingsLabel },
          { label: s.modeSwitchLabel, value: s.modeSwitchValue },
          { label: s.skinLabel },
          { label: s.iconSwitchLabel, value: s.iconSwitchValue },
        ]} />
        <Group title={s.groupAbout} rows={[
          { label: s.merchantOnboardingLabel },
          { label: s.helpFeedbackLabel },
        ]} />
        <div className="flex gap-2 mt-3 mb-3">
          <button className="flex-1 h-11 rounded-xl bg-app-surface text-[#FF5000] text-[15px] border-none cursor-pointer"
            onClick={() => showToast(s.noLoginSystemToast)}>
            {s.switchAccountLabel}
          </button>
          <button className="flex-1 h-11 rounded-xl bg-app-surface text-[15px] border-none cursor-pointer"
            onClick={() => showToast(s.noLoginSystemToast)}>
            {s.logoutLabel}
          </button>
        </div>
      </div>
      {toast}
    </div>
  );
}
