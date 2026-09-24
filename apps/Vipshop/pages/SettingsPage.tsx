import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, useToast, NOT_OPEN, VIP } from '../components/ui';
import { IcArrowRight } from '../res/icons';

const DISABLED_ROWS = [
  { id: 'security', label: '账号与安全' },
  { id: 'payment', label: '支付服务' },
  { id: 'push', label: '消息推送设置' },
] as const;

export default function SettingsPage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();
  const [dark, setDark] = useState(false);

  const logout = useVipshopStore((s) => s.logout);
  const clearCache = useVipshopStore((s) => s.clearCache);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="设置" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="settings-body" data-scroll-direction="vertical">
        {/* 未开放行 */}
        <div className="bg-white mt-2">
          {DISABLED_ROWS.map((r) => (
            <button
              key={r.id}
              {...bindTap({ kind: 'action', id: 'settings.generic.disabled' }, {
                params: { target: r.id },
                onTrigger: () => showToast(NOT_OPEN),
              })}
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
          <button
            {...bindTap({ kind: 'action', id: 'settings.appearance.toggle' }, { onTrigger: () => setDark((d) => !d) })}
            className="w-11 h-6 rounded-full relative border-none cursor-pointer"
            style={{ background: dark ? VIP.primary : '#DDDDDD' }}
            aria-label="深浅外观"
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: dark ? '22px' : '2px' }}
            />
          </button>
        </div>

        {/* 清除缓存 */}
        <div className="bg-white mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'settings.clearCache.submit' }, {
              onTrigger: () => { clearCache(); showToast('缓存已清除'); },
            })}
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
      </div>
      {toast}
    </div>
  );
}
