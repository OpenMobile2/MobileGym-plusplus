import React from 'react';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { TopBar, useStatusBarFg } from '../components/ui';

/** 验证码输入页(r8;mock 任意6位即登录成功) */
export default function SmsCodePage() {
  const statusFg = useStatusBarFg();
  const { bindTap, go } = useMaoyanGestures();
  const [code, setCode] = React.useState('');
  const phone = useMaoyanStore((st) => st.session.phone);

  const onInput = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (digits.length === 6) {
      go('login.smscode-submit');
    }
  };

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground={statusFg}>
      <TopBar title="输入验证码" />
      <div className="px-8 mt-8">
        <div className="text-[20px] font-bold text-app-text">请输入短信验证码</div>
        <div className="text-[13px] text-(--app-c-text-3) mt-2">验证码已发送至 +86 {phone}(模拟:任意6位即可)</div>
        <input
          {...bindTap({ kind: 'action', id: 'login.smscode.input' }, { params: { value: 'code' }, onTrigger: () => { /* 受控输入 */ } }) as any}
          value={code}
          onChange={(e) => onInput(e.target.value)}
          inputMode="numeric"
          autoFocus
          placeholder="6位验证码"
          className="mt-6 w-full text-[24px] tracking-[8px] border-b-2 border-[#DC4038] outline-none pb-2 bg-transparent"
        />
      </div>
    </div>
  );
}
