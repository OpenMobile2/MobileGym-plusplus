import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';

export default function PwdLoginPage() {
  const { bindTap } = useVipshopGestures();
  const login = useVipshopStore((s) => s.login);
  const [account, setAccount] = useState('');
  const [pwd, setPwd] = useState('');
  const can = account.length > 0 && pwd.length >= 6;

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="账号密码登录" />
      <div className="px-8 pt-6">
        <input
          {...(bindTap({ kind: 'action', id: 'pwd.field.input' }, { onTrigger: () => {} }) as any)}
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="手机号/邮箱"
          className="w-full border-b border-[#EEE] py-3 text-[16px] text-[#222222] outline-none placeholder:text-[#BBB]"
        />
        <input
          {...(bindTap({ kind: 'action', id: 'pwd.field.input' }, { onTrigger: () => {} }) as any)}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          type="password"
          placeholder="请输入密码"
          className="w-full border-b border-[#EEE] py-3 mt-3 text-[16px] text-[#222222] outline-none placeholder:text-[#BBB]"
        />
        <button
          {...bindTap('pwd.login-open', { beforeTrigger: () => login(account) })}
          disabled={!can}
          className="w-full h-12 rounded-full mt-8 text-[16px] font-semibold border-none cursor-pointer"
          style={can ? { background: VIP.primary, color: '#fff' } : { background: '#E5D3DE', color: '#fff' }}
        >
          登录
        </button>
        <div className="text-right mt-3">
          <span className="text-[12px] text-[#888888]">忘记密码?</span>
        </div>
      </div>
    </div>
  );
}
