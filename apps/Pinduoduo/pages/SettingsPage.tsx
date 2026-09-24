import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { TopBar, showToast, wontfix } from '../components/ui';
import { IcChevronRight } from '../res/icons';

// 设置
export function SettingsPage() {
  const { bindTap } = usePinduoduoGestures();

  const Row = ({
    label,
    value,
    bind,
  }: {
    label: string;
    value?: string;
    bind: React.HTMLAttributes<HTMLElement>;
  }) => (
    <button {...bind} className="w-full flex items-center px-4 py-3.5 text-left border-b border-[#F5F5F5] last:border-b-0">
      <span className="flex-1 text-[15px] text-[#333]">{label}</span>
      {value && <span className="text-[13px] text-[#999] mr-1">{value}</span>}
      <IcChevronRight size={18} className="text-[#CCC]" />
    </button>
  );

  const miscBind = () => bindTap({ kind: 'action', id: 'settings.misc.stub' }, { onTrigger: wontfix });

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="设置" />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 账户 */}
        <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
          <Row label="账号与安全" bind={miscBind()} />
          <Row label="隐私设置" bind={miscBind()} />
          <Row label="收货地址" bind={miscBind()} />
        </div>

        {/* 交易 / 外观 */}
        <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
          <Row label="先用后付设置" bind={bindTap('settings.fufei-open')} />
          <Row label="外观与语言" value="深色模式 / 字体大小 / 语言" bind={bindTap('settings.appearance-open')} />
        </div>

        {/* 通用 */}
        <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
          <Row label="通用" bind={miscBind()} />
          <Row label="消息通知" bind={miscBind()} />
          <Row label="清理缓存" value="26.4MB" bind={miscBind()} />
          <Row label="关于拼多多" value="v6.0.0" bind={miscBind()} />
        </div>

        {/* 退出登录 */}
        <div className="mx-3 mt-3 mb-4">
          <button
            {...bindTap({ kind: 'action', id: 'settings.logout.confirm' }, { onTrigger: () => showToast('已退出(模拟)') })}
            className="w-full h-11 rounded-xl bg-white text-[#E22E1F] text-[15px] font-medium"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
