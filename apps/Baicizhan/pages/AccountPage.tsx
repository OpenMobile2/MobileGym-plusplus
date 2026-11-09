import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';

export default function AccountPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <PageHeader title={s.accountManage} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-xs text-[#9AA5B1]">当前登录方式</div>
        <div className="mt-2 flex items-center rounded-xl bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#3DBE6B] text-white">微</div>
          <div className="ml-3"><div className="text-sm text-[#212121]">微信</div><div className="text-xs text-[#9AA5B1]">{st.profile.name}</div></div>
          <button {...action('account.delete.wontfixToast', toast)} className="ml-auto rounded-full bg-[#F2F3F5] px-4 py-1.5 text-xs text-[#9AA5B1]">注销</button>
        </div>
        <div className="mt-5 text-xs text-[#9AA5B1]">已绑定账号</div>
        <div className="mt-2 flex items-center rounded-xl bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5A623] text-white">📱</div>
          {/* 虚构号码:真机截图里的手机号属个人信息,一律不入代码(pipeline 安全红线) */}
          <div className="ml-3"><div className="text-sm text-[#212121]">手机号</div><div className="text-xs text-[#9AA5B1]">138****0000</div></div>
          <button {...action('account.unbind.wontfixToast', toast)} className="ml-auto rounded-full bg-[#F2F3F5] px-4 py-1.5 text-xs text-[#9AA5B1]">解绑</button>
        </div>
        <div className="mt-5 text-xs text-[#9AA5B1]">以下账号绑定后可用于登录</div>
        <div className="mt-2 flex items-center rounded-xl bg-white p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#BFC7D2] text-white">Q</div>
          <div className="ml-3 text-sm text-[#212121]">QQ</div>
          <button {...action('account.bind.wontfixToast', toast)} className="ml-auto rounded-full bg-[#2F58E8] px-4 py-1.5 text-xs text-white">绑定</button>
        </div>
      </div>
    </div>
  );
}
