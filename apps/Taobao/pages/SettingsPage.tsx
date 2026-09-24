import React from 'react';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, useToast } from '../components/ui';

/** 设置(spec: settings.main,IMG_8736;除收货地址外其余 P2 stub) */
export default function SettingsPage() {
  const { bindTap } = useTaobaoGestures();
  const [toast, showToast] = useToast();

  const Group = ({ title, rows }: { title?: string; rows: Array<{ label: string; value?: string; nav?: boolean }> }) => (
    <div className="bg-white rounded-xl mt-2 px-4 py-1">
      {title && <div className="text-[13px] text-[#999999] pt-2">{title}</div>}
      {rows.map((r) => (
        <button
          key={r.label}
          {...(r.nav
            ? bindTap('settings.address-open')
            : { onClick: () => showToast('该设置项为展示项') })}
          className="w-full flex justify-between items-center py-3.5 bg-transparent border-none border-b border-[#F8F8F8] cursor-pointer last:border-0"
        >
          <span className="text-[15px]">{r.label}</span>
          <span className="text-[13px] text-[#999999]">{r.value ?? ''} ›</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title="设置" />
      <div className="flex-1 overflow-y-auto px-3">
        <Group title="账号与安全" rows={[
          { label: '收货地址', nav: true },
          { label: '账号与安全' },
          { label: '支付设置' },
          { label: '国家与地区' },
        ]} />
        <Group title="功能" rows={[
          { label: '通用设置' },
          { label: '消息通知' },
          { label: '隐私设置' },
          { label: '模式切换', value: '标准/长辈大字/未成年人模式' },
          { label: '个性皮肤' },
          { label: '图标切换', value: '默认/88VIP' },
        ]} />
        <Group title="关于" rows={[
          { label: '商家入驻' },
          { label: '帮助与反馈' },
        ]} />
        <div className="flex gap-2 mt-3 mb-3">
          <button className="flex-1 h-11 rounded-xl bg-white text-[#FF5000] text-[15px] border-none cursor-pointer"
            onClick={() => showToast('无登录体系(wontfix)')}>
            切换账号
          </button>
          <button className="flex-1 h-11 rounded-xl bg-white text-[15px] border-none cursor-pointer"
            onClick={() => showToast('无登录体系(wontfix)')}>
            退出登录
          </button>
        </div>
      </div>
      {toast}
    </div>
  );
}
