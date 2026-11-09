import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, Img, showToast, wontfix } from '../components/ui';
import { useJingdongStore } from '../state';
import {
  IcMapPin, IcInvoice, IcCard, IcGlobe, IcSettings, IcBell, IcMoon, IcType,
  IcChevronRight, IcWallet, IcRefresh, IcUsers, IcGift,
} from '../res/icons';

type RowBind = React.HTMLAttributes<HTMLButtonElement>;

function Row({
  icon,
  label,
  hint,
  dot,
  bind,
}: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  dot?: boolean;
  bind: RowBind;
}) {
  return (
    <button
      {...bind}
      className="w-full flex items-center gap-3 px-4 h-[52px] text-left active:bg-[#F7F7F7]"
    >
      <span className="text-[#666]">{icon}</span>
      <span className="flex-1 text-[15px] text-[#1A1A1A]">{label}</span>
      {hint && <span className="text-[12px] text-[#999]">{hint}</span>}
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-[#E1251B]" />}
      <IcChevronRight size={18} className="text-[#CCC]" />
    </button>
  );
}

export function SettingsPage() {
  const { bindTap } = useJingdongGestures();
  const user = useJingdongStore((s) => s.user);

  const miscBind = bindTap({ kind: 'action', id: 'settings.misc.stub' }, { onTrigger: wontfix });
  const tools = [
    { label: '账单', icon: <IcWallet size={22} /> },
    { label: '闲置换钱', icon: <IcRefresh size={22} /> },
    { label: '京东快递', icon: <IcGift size={22} /> },
    { label: '实名认证', icon: <IcUsers size={22} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="设置" />
      <div
        className="flex-1 overflow-y-auto pb-8"
        data-scroll-container="settings-scroll"
        data-scroll-direction="vertical"
      >
        {/* 用户头卡 */}
        <div className="bg-white mx-3 mt-2 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Img src={user.avatar} className="w-14 h-14 rounded-full object-cover bg-[#F0F0F0]" />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold text-[#1A1A1A] truncate">{user.name}</div>
              <div className="text-[12px] text-[#999] mt-0.5">账号名:jd_demo_acct</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'settings.misc.stub' }, { onTrigger: wontfix })}
              className="text-[#999] text-[13px]"
            >
              ✎
            </button>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[13px] text-[#666]">必备工具</span>
            <button
              {...bindTap({ kind: 'action', id: 'settings.misc.stub' }, { onTrigger: wontfix })}
              className="text-[12px] text-[#999] flex items-center"
            >
              更多 <IcChevronRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-3">
            {tools.map((t) => (
              <button
                key={t.label}
                {...bindTap({ kind: 'action', id: 'settings.misc.stub' }, { onTrigger: wontfix })}
                className="flex flex-col items-center gap-1"
              >
                <span className="w-11 h-11 rounded-xl bg-[#FDEEEC] text-[#E1251B] flex items-center justify-center">
                  {t.icon}
                </span>
                <span className="text-[11px] text-[#666]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 账号设置 */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">账号设置</div>
        <div className="bg-white mx-3 rounded-xl overflow-hidden">
          <Row icon={<IcMapPin size={20} />} label="地址管理" bind={bindTap('settings.address-open')} />
          <Row icon={<IcInvoice size={20} />} label="发票抬头管理" hint="添加增票资质" bind={miscBind} />
          <Row icon={<IcCard size={20} />} label="账户与安全" hint="账户保障可升级" bind={miscBind} />
          <Row icon={<IcWallet size={20} />} label="支付设置" bind={miscBind} />
          <Row
            icon={<IcGlobe size={20} />}
            label="国家与地区/语言/币种"
            hint="已选择中国大陆"
            dot
            bind={bindTap('settings.language-open')}
          />
        </div>

        {/* 功能设置 */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">功能设置</div>
        <div className="bg-white mx-3 rounded-xl overflow-hidden">
          <Row icon={<IcSettings size={20} />} label="通用设置" hint="播放设置等" bind={miscBind} />
          <Row icon={<IcSettings size={20} />} label="隐私设置" bind={miscBind} />
          <Row icon={<IcBell size={20} />} label="消息通知" hint="设置短信通知等" bind={miscBind} />
          <Row icon={<IcGift size={20} />} label="主题换肤" hint="超丰富皮肤广场" dot bind={miscBind} />
          <Row icon={<IcCard size={20} />} label="PLUS设置" hint="生活服务免费兑换" bind={miscBind} />
          <Row icon={<IcSettings size={20} />} label="模式切换" dot bind={bindTap('settings.appearance-open')} />
          <Row icon={<IcType size={20} />} label="字体大小" dot bind={bindTap('settings.appearance-open')} />
          <Row icon={<IcMoon size={20} />} label="暗黑模式" dot bind={bindTap('settings.appearance-open')} />
        </div>

        {/* 关于京东 */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">关于京东</div>
        <div className="bg-white mx-3 rounded-xl overflow-hidden">
          <Row icon={<IcInvoice size={20} />} label="功能反馈" bind={miscBind} />
          <Row icon={<IcSettings size={20} />} label="关于京东APP" hint="发现新版本" dot bind={miscBind} />
          <Row icon={<IcRefresh size={20} />} label="清除本地缓存" dot bind={miscBind} />
        </div>

        {/* 隐私说明 */}
        <div className="px-4 pt-4 pb-1.5 text-[12px] text-[#999]">隐私说明</div>
        <div className="bg-white mx-3 rounded-xl overflow-hidden">
          {['个人信息收集清单', '第三方共享信息清单', '应用权限说明', '隐私协议简要版', '京东隐私政策'].map(
            (t) => (
              <Row key={t} icon={<IcInvoice size={20} />} label={t} bind={miscBind} />
            ),
          )}
        </div>

        {/* 切换账号 / 退出登录 */}
        <div className="mx-3 mt-4 space-y-3">
          <button
            {...bindTap({ kind: 'action', id: 'settings.misc.stub' }, { onTrigger: wontfix })}
            className="w-full h-12 bg-white rounded-xl text-[15px] text-[#1A1A1A]"
          >
            切换账号
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'settings.logout.confirm' },
              { onTrigger: () => showToast('演示环境,暂不支持退出登录') },
            )}
            className="w-full h-12 bg-white rounded-xl text-[15px] text-[#E1251B]"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
