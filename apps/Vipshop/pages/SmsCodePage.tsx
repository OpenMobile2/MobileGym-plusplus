import React, { useEffect, useRef, useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';
import * as TimeService from '@/os/TimeService';

export default function SmsCodePage() {
  const { bindTap } = useVipshopGestures();
  const login = useVipshopStore((s) => s.login);
  const phone = useVipshopStore((s) => s.session.phone);
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);
  const timerRef = useRef<number | null>(null);

  const startCountdown = () => {
    setCountdown(60);
    if (timerRef.current) window.clearInterval(timerRef.current);
    const end = TimeService.realNow() + 60000;
    timerRef.current = window.setInterval(() => {
      const left = Math.ceil((end - TimeService.realNow()) / 1000);
      setCountdown(left);
      if (left <= 0 && timerRef.current) window.clearInterval(timerRef.current);
    }, 500);
  };

  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
  }, []);

  const canConfirm = code.replace(/\D/g, '').length >= 4;

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="" />
      <div className="px-8 pt-4">
        <div className="text-[22px] font-bold text-[#222222]">输入验证码</div>
        <div className="text-[13px] text-[#888888] mt-2">验证码已发送至 {phone || '你的手机'}</div>

        <input
          {...(bindTap({ kind: 'action', id: 'sms.code.input' }, { onTrigger: () => {} }) as any)}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode="numeric"
          maxLength={6}
          placeholder="请输入验证码"
          className="w-full mt-6 border-b border-[#EEE] py-2 text-[22px] tracking-[0.4em] text-[#222222] outline-none placeholder:text-[#CCC] placeholder:tracking-normal"
        />

        <div className="mt-3 text-[13px]">
          {countdown > 0 ? (
            <span className="text-[#BBBBBB]">{countdown}s 后可重新发送</span>
          ) : (
            <button
              {...bindTap({ kind: 'action', id: 'sms.resend.submit' }, { onTrigger: startCountdown })}
              className="bg-transparent border-none cursor-pointer p-0 text-[13px]"
              style={{ color: VIP.primary }}
            >
              重新发送验证码
            </button>
          )}
        </div>

        <button
          {...bindTap('sms.confirm-open', { beforeTrigger: () => login(phone) })}
          disabled={!canConfirm}
          className="w-full h-12 rounded-full mt-8 text-[16px] font-semibold border-none cursor-pointer"
          style={canConfirm ? { background: VIP.primary, color: '#fff' } : { background: '#E5D3DE', color: '#fff' }}
        >
          确定
        </button>
      </div>
    </div>
  );
}
