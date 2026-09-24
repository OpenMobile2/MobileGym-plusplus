import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar, showToast } from '../components/common';
import { IcRight } from '../res/icons';

/** 开关(视觉组件) */
function Toggle({ on }: { on: boolean }) {
  return (
    <span className={`w-11 h-6 rounded-full flex items-center px-0.5 shrink-0 ${on ? 'bg-[#ED6C2C] justify-end' : 'bg-[#DDDDDD] justify-start'}`}>
      <span className="w-5 h-5 rounded-full bg-white" />
    </span>
  );
}

/** 支付设置页(spec settings.payment,证据 IMG_6041) */
export default function PaymentSettingsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const settings = useTbsgStore((st) => st.settings);
  const updateSettings = useTbsgStore((st) => st.updateSettings);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title="支付设置" titleLeft />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3">
        {/* 支付宝免密支付 */}
        <div className="bg-white rounded-xl mt-3">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'paymentset.nopwd.toggle' },
              { params: { which: 'ali' }, onTrigger: () => updateSettings({ aliNoPwdPay: !settings.aliNoPwdPay }) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-none cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1A1A]">支付宝免密支付</div>
              <div className="text-[13px] text-[#999999] mt-1">支持淘宝闪购app、支付宝小程序免密使用</div>
            </div>
            <Toggle on={settings.aliNoPwdPay} />
          </button>
        </div>

        {/* 余额支付 */}
        <div className="text-[13px] text-[#999999] px-1 mt-4 mb-2">余额支付</div>
        <div className="bg-white rounded-xl">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'paymentset.nopwd.toggle' },
              { params: { which: 'balance' }, onTrigger: () => updateSettings({ balanceNoPwdPay: !settings.balanceNoPwdPay }) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1A1A]">余额免密支付</div>
              <div className="text-[13px] text-[#999999] mt-1">开启免密,50元以下无需密码付款</div>
            </div>
            <Toggle on={settings.balanceNoPwdPay} />
          </button>
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'paymentset.misc.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-none cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1A1A]">余额支付密码</div>
              <div className="text-[13px] text-[#999999] mt-1">钱包余额支付密码设置</div>
            </div>
            <span className="text-[14px] text-[#999999]">去设置</span>
            <IcRight size={15} className="text-[#BBBBBB]" />
          </button>
        </div>

        {/* 常见问题 */}
        <div className="bg-white rounded-xl mt-3 mb-4">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'paymentset.misc.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="text-[17px] font-semibold text-[#1A1A1A]">常见问题</span>
            <div className="flex-1" />
            <span className="text-[14px] text-[#999999]">查看</span>
            <IcRight size={15} className="text-[#BBBBBB]" />
          </button>
        </div>
      </div>
    </div>
  );
}
