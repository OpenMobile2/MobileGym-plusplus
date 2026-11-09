import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, TopBar, showToast } from '../components/common';
import { IcRight } from '../res/icons';

/** 设置页(spec settings.main,证据 IMG_6036) */
export default function SettingsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const user = useTbsgStore((st) => st.user);

  const stub = bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'settings.misc.stub' },
    { onTrigger: () => showToast(s.notOpen) },
  );

  const Row = ({ label, sub, binding }: {
    label: string; sub?: string; binding: React.HTMLAttributes<HTMLButtonElement>;
  }) => (
    <button
      {...binding}
      className="w-full flex items-center px-4 py-4 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
    >
      <span className="text-[16px] text-[#1A1A1A]">{label}</span>
      <div className="flex-1" />
      {sub && <span className="text-[13px] text-[#999999] mr-1">{sub}</span>}
      <IcRight size={16} className="text-[#BBBBBB]" />
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title={s.settingsTitle} titleLeft />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto pb-4">
        {/* 用户信息卡 */}
        <button
          {...bindTap<HTMLButtonElement>('settings.profile-open')}
          className="w-full flex items-center px-4 py-4 bg-white border-none cursor-pointer text-left"
        >
          <AppImg src={user.avatar} className="w-14 h-14 rounded-full object-cover shrink-0" />
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-[17px] font-semibold text-[#1A1A1A] truncate">{user.nickname}</div>
            <div className="text-[13px] text-[#999999] mt-0.5 truncate">{user.signature || '还没有个性签名哦'}</div>
          </div>
          <IcRight size={16} className="text-[#BBBBBB] shrink-0" />
        </button>

        {/* 组1 */}
        <div className="bg-white mt-2.5">
          <Row label="收货地址管理" binding={bindTap<HTMLButtonElement>('settings.address-open')} />
          <Row label="账号与安全" binding={bindTap<HTMLButtonElement>('settings.security-open')} />
          <Row label="支付设置" sub="先享后付、免密支付等" binding={bindTap<HTMLButtonElement>('settings.payment-open')} />
        </div>

        {/* 组2 */}
        <div className="bg-white mt-2.5">
          <Row label="安全中心" sub="安全问题解决与咨询" binding={stub} />
          <Row label="消息通知设置" sub="订单、优惠通知等" binding={bindTap<HTMLButtonElement>('settings.notif-open')} />
          <Row label="通用设置" sub="清理缓存、图片质量" binding={bindTap<HTMLButtonElement>('settings.general-open')} />
          <Row label="桌面小组件" sub="管理你的桌面小组件" binding={stub} />
        </div>

        {/* 组3 */}
        <div className="bg-white mt-2.5">
          <Row label="问题咨询及反馈" binding={stub} />
          <Row label="个人信息收集清单" binding={stub} />
          <Row label="第三方信息数据共享" binding={stub} />
          <Row label="规则中心" binding={stub} />
          <Row label="关于淘宝闪购" binding={stub} />
        </div>

        {/* 长辈模式 */}
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'settings.elder.stub' },
            { onTrigger: () => showToast(s.notOpen) },
          )}
          className="w-full flex items-center px-4 py-4 bg-white mt-2.5 border-none cursor-pointer text-left"
        >
          <div className="flex-1 min-w-0">
            <div className="text-[16px] text-[#1A1A1A]">长辈模式</div>
            <div className="text-[13px] text-[#999999] mt-0.5">开启后使用更简单,查看详情</div>
          </div>
          <span className="w-11 h-6 rounded-full bg-[#DDDDDD] flex items-center px-0.5 shrink-0">
            <span className="w-5 h-5 rounded-full bg-white" />
          </span>
        </button>
      </div>
    </div>
  );
}
