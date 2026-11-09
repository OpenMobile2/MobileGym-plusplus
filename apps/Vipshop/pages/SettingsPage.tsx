import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, useToast, VIP } from '../components/ui';
import { IcArrowRight } from '../res/icons';
import type { VipAppSettings } from '../types';

const SECTIONS = [
  { id: 'security', label: '账号与安全' },
  { id: 'payment', label: '支付服务' },
  { id: 'push', label: '消息推送设置' },
] as const;

type PrefKey = keyof VipAppSettings;

/** 每个分区里的开关行 */
const SECTION_PREFS: Record<string, { key: PrefKey; label: string; desc: string }[]> = {
  security: [
    { key: 'fingerprintLogin', label: '指纹/面容登录', desc: '开启后打开 App 免输密码' },
  ],
  payment: [
    { key: 'noPwdPay', label: '小额免密支付', desc: '200元以下订单免输支付密码' },
  ],
  push: [
    { key: 'orderNotify', label: '订单通知', desc: '订单状态变更提醒' },
    { key: 'promoNotify', label: '优惠促销推送', desc: '专享券、大促活动' },
    { key: 'logisticsNotify', label: '物流提醒', desc: '包裹揽收/派送提醒' },
    { key: 'priceDropNotify', label: '降价提醒', desc: '收藏商品降价通知' },
  ],
};

function Switch({ on, binding }: { on: boolean; binding: React.HTMLAttributes<HTMLButtonElement> }) {
  return (
    <button
      {...binding}
      className="w-11 h-6 rounded-full relative border-none cursor-pointer shrink-0"
      style={{ background: on ? VIP.primary : '#DDDDDD' }}
      aria-label="开关"
    >
      <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: on ? '22px' : '2px' }} />
    </button>
  );
}

export default function SettingsPage() {
  const { bindTap, bindBack } = useVipshopGestures();
  const [toast, showToast] = useToast();
  const [dark, setDark] = useState(false);
  const [params] = useSearchParams();
  const sec = params.get('sec') || '';

  const session = useVipshopStore((s) => s.session);
  const appSettings = useVipshopStore((s) => s.appSettings);
  const logout = useVipshopStore((s) => s.logout);
  const clearCache = useVipshopStore((s) => s.clearCache);
  const toggleSetting = useVipshopStore((s) => s.toggleSetting);

  const activeSection = SECTIONS.find((s) => s.id === sec);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] relative">
      <TopBar title="设置" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="settings-body" data-scroll-direction="vertical">
        {/* 分区行 */}
        <div className="bg-white mt-2">
          {SECTIONS.map((r) => (
            <button
              key={r.id}
              {...bindTap('settings.section.select.target', { params: { target: r.id } })}
              className="w-full flex items-center px-3 h-12 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <span className="flex-1 text-[14px] text-[#222222]">{r.label}</span>
              <IcArrowRight size={16} className="text-[#BBBBBB]" />
            </button>
          ))}
        </div>

        {/* 深浅外观 */}
        <div className="bg-white mt-2 flex items-center px-3 h-12">
          <span className="flex-1 text-[14px] text-[#222222]">深浅外观</span>
          <Switch
            on={dark}
            binding={bindTap({ kind: 'action', id: 'settings.appearance.toggle' }, { onTrigger: () => setDark((d) => !d) })}
          />
        </div>

        {/* 清除缓存 */}
        <div className="bg-white mt-2">
          <button
            {...bindTap('settings.address-open')}
            className="w-full flex items-center px-3 h-12 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="flex-1 text-[14px] text-[#222222]">地址管理</span>
            <IcArrowRight size={16} className="text-[#BBBBBB]" />
          </button>
        </div>

        <div className="bg-white mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'settings.clearCache.submit' }, { onTrigger: () => { clearCache(); showToast('缓存已清除'); } })}
            className="w-full flex items-center px-3 h-12 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="flex-1 text-[14px] text-[#222222]">清除缓存</span>
            <span className="text-[12px] text-[#BBBBBB]">12.6MB</span>
          </button>
        </div>

        {/* 退出登录 */}
        <div className="px-3 mt-6">
          <button
            {...bindTap('settings.logout-open', { beforeTrigger: () => logout() })}
            className="w-full h-11 rounded-full text-[15px] font-semibold border cursor-pointer bg-white"
            style={{ color: VIP.primary, borderColor: VIP.primary }}
          >
            退出登录
          </button>
        </div>
        <div className="h-4" />
      </div>

      {/* 分区面板(底部弹层) */}
      {activeSection && (
        <>
          <button
            {...bindBack()}
            className="absolute inset-0 bg-black/40 z-10 border-none cursor-default"
            aria-label="关闭设置分区"
          />
          <div className="absolute left-0 right-0 bottom-0 z-20 bg-white rounded-t-2xl max-h-[75%] flex flex-col">
            <div className="flex items-center px-4 h-12 border-b border-[#F5F5F5] shrink-0">
              <span className="text-[15px] font-semibold text-[#222222] flex-1">{activeSection.label}</span>
              <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[13px] text-[#888888]">关闭</button>
            </div>
            <div className="overflow-y-auto">
              {/* 账号与安全:附带只读信息行 */}
              {sec === 'security' && (
                <div className="px-4 py-2 flex items-center border-b border-[#F5F5F5]">
                  <span className="flex-1 text-[14px] text-[#222222]">绑定手机号</span>
                  <span className="text-[13px] text-[#888888]">{session.phone}</span>
                </div>
              )}
              {(SECTION_PREFS[sec] ?? []).map((pref) => (
                <div key={pref.key} className="px-4 py-2.5 flex items-center border-b border-[#F5F5F5]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#222222]">{pref.label}</div>
                    <div className="text-[11px] text-[#999999] mt-0.5">{pref.desc}</div>
                  </div>
                  <Switch
                    on={appSettings[pref.key]}
                    binding={bindTap({ kind: 'action', id: 'settings.pref.toggle' }, { params: { key: pref.key }, onTrigger: () => toggleSetting(pref.key) })}
                  />
                </div>
              ))}
              {sec === 'payment' && (
                <div className="px-4 py-3 text-[12px] text-[#999999]">支付方式管理、实名认证等请前往「唯品钱包」。</div>
              )}
              <div className="h-3" />
            </div>
          </div>
        </>
      )}
      {toast}
    </div>
  );
}
