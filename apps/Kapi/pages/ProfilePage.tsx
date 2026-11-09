import React from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Avatar } from '../components/ui';
import { toast } from '../components/toast';
import { IcEdit } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function ProfilePage() {
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const user = useKapiStore((st) => st.user);
  const updateProfile = useKapiStore((st) => st.updateProfile);

  const editRow = (label: string, field: 'nick' | 'phone', value: string) => (
    <div className="flex items-center min-h-[52px] px-4 border-b border-app-border last:border-0">
      <span className="text-[15px] text-app-text w-20">{label}</span>
      <input
        data-action="profile.field.input.value"
        data-action-type="input"
        defaultValue={value}
        onBlur={(e) => updateProfile(field, e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-[15px] text-right text-app-text"
      />
      <IcEdit size={14} className="text-[#C5CAD4] ml-2 shrink-0" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title={s.aboutYouTitle} backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="flex flex-col items-center py-5">
          <Avatar src={user.avatar} size={72} />
          <div className="text-[16px] font-semibold text-app-text mt-2">{user.nick}</div>
        </div>

        <button {...bindAction('profile.benefit.noop', () => toast(s.featureNotAvailable))} className="w-full rounded-2xl bg-gradient-to-r from-[#FFF1E6] to-[#FFE8C8] p-3 text-left border-none cursor-pointer mb-3">
          <div className="text-[13px] text-[#B0743A]">{s.memberBenefitText}</div>
        </button>

        <Card>
          {editRow(s.nicknameLabel, 'nick', user.nick)}
          <Row label={s.genderLabel} value={user.gender || s.notSetLabel} bind={bindTap('profile.gender.open')} />
          {editRow(s.phoneLabel, 'phone', user.phone)}
          <Row label={s.accountTypeWechat} value={s.bindNowLabel} bind={bindAction('profile.wechat.noop', () => toast(s.featureNotAvailable))} />
        </Card>

        <Card className="mt-3">
          <Row label="ID" value={user.id} chevron={false} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.versionLabel} value={`v${user.appVersion}`} chevron={false} />
        </Card>

        <button disabled className="w-full mt-4 py-3 rounded-xl bg-app-surface text-[#C5CAD4] text-[15px] border-none cursor-not-allowed">{s.logoutBtn}</button>
      </div>
    </div>
  );
}
