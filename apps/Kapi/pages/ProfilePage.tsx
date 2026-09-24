import React from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Avatar } from '../components/ui';
import { toast } from '../components/toast';
import { IcEdit } from '../res/icons';

export default function ProfilePage() {
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const user = useKapiStore((s) => s.user);
  const updateProfile = useKapiStore((s) => s.updateProfile);

  const editRow = (label: string, field: 'nick' | 'phone', value: string) => (
    <div className="flex items-center min-h-[52px] px-4 border-b border-[#EDEFF4] last:border-0">
      <span className="text-[15px] text-[#1A1D26] w-20">{label}</span>
      <input
        data-action="profile.field.input.value"
        data-action-type="input"
        defaultValue={value}
        onBlur={(e) => updateProfile(field, e.target.value)}
        className="flex-1 bg-transparent border-none outline-none text-[15px] text-right text-[#1A1D26]"
      />
      <IcEdit size={14} className="text-[#C5CAD4] ml-2 shrink-0" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <TopBar title="关于你" backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <div className="flex flex-col items-center py-5">
          <Avatar src={user.avatar} size={72} />
          <div className="text-[16px] font-semibold text-[#1A1D26] mt-2">{user.nick}</div>
        </div>

        <button {...bindAction('profile.benefit.noop', () => toast('该功能暂未开放'))} className="w-full rounded-2xl bg-gradient-to-r from-[#FFF1E6] to-[#FFE8C8] p-3 text-left border-none cursor-pointer mb-3">
          <div className="text-[13px] text-[#B0743A]">👑 卡皮会员权益 · 查看详情 ›</div>
        </button>

        <Card>
          {editRow('昵称', 'nick', user.nick)}
          <Row label="性别" value={user.gender || '未设置'} bind={bindTap('profile.gender.open')} />
          {editRow('手机', 'phone', user.phone)}
          <Row label="微信" value="去绑定" bind={bindAction('profile.wechat.noop', () => toast('该功能暂未开放'))} />
        </Card>

        <Card className="mt-3">
          <Row label="ID" value={user.id} chevron={false} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="版本号" value={`v${user.appVersion}`} chevron={false} />
        </Card>

        <button disabled className="w-full mt-4 py-3 rounded-xl bg-white text-[#C5CAD4] text-[15px] border-none cursor-not-allowed">退出登录</button>
      </div>
    </div>
  );
}
