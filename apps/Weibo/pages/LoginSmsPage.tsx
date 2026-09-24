import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, TopBar } from '../components/ui';
import * as TimeService from '@/os/TimeService';

export default function LoginSmsPage() {
  const s = useStrings();
  const { bindTap, bindBack, go } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();
  const login = useWeiboStore((st) => st.login);

  const step = searchParams.get('step') === 'code' ? 'code' : 'phone';
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (step !== 'code' || countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [step, countdown]);

  const phoneOk = /^1\d{10}$/.test(phone);
  const codeOk = /^\d{6}$/.test(code);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <TopBar backBinding={bindBack()} title="" />
      <div className="flex-1 px-6 pt-6">
        {step === 'phone' ? (
          <>
            <div className="text-[22px] font-bold">身份验证</div>
            <div className="text-[13px] text-[#9A9A9A] mt-2 leading-relaxed">
              请输入当前可用的手机号,验证短信,完成登录。手机号仅用于身份验证,请放心填写
            </div>
            <div className="flex items-center gap-3 mt-8 border-b border-[#EEEEEE] pb-2">
              <span className="text-[15px] text-[#1A1A1A]">中国 +86 &gt;</span>
              <input
                autoFocus
                value={phone}
                inputMode="numeric"
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="手机号"
                data-action="loginsms.phone.input"
                data-action-type="input"
                className="flex-1 text-[17px] border-none outline-none"
              />
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'loginsms.phone.next' }, {
                onTrigger: () => {
                  if (!phoneOk) return;
                  setCountdown(60);
                  setSearchParams((p) => { p.set('step', 'code'); return p; }, { replace: true });
                },
              })}
              disabled={!phoneOk}
              className={`w-full h-11 mt-8 rounded-full text-white text-[15px] font-semibold border-none cursor-pointer ${phoneOk ? 'bg-[#FF8200]' : 'bg-[#FFCC99]'}`}
            >
              {s.next}
            </button>
          </>
        ) : (
          <>
            <div className="text-[22px] font-bold">请输入验证码</div>
            <div className="text-[13px] text-[#9A9A9A] mt-2">验证码已通过短信发送至 +86 {phone || '138****0000'}</div>
            <div className="flex items-center gap-3 mt-8 border-b border-[#EEEEEE] pb-2">
              <input
                autoFocus
                value={code}
                inputMode="numeric"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="输入验证码"
                data-action="loginsms.code.input"
                data-action-type="input"
                className="flex-1 text-[17px] border-none outline-none"
              />
              {countdown > 0 ? (
                <span className="text-[13px] text-[#BBBBBB] shrink-0">{countdown}秒后可重新获取</span>
              ) : (
                <button
                  {...bindTap({ kind: 'action', id: 'loginsms.code.resend' }, { onTrigger: () => { setCountdown(60); toast('验证码已重新发送'); } })}
                  className="text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer shrink-0"
                >
                  重新获取
                </button>
              )}
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'loginsms.code.submit' }, {
                onTrigger: () => {
                  if (!codeOk) return;
                  login('sms');
                  toast('登录成功');
                  window.setTimeout(() => go('loginsms.home-open', {}), 400);
                },
              })}
              disabled={!codeOk}
              className={`w-full h-11 mt-8 rounded-full text-white text-[15px] font-semibold border-none cursor-pointer ${codeOk ? 'bg-[#FF8200]' : 'bg-[#FFCC99]'}`}
            >
              {s.confirm}
            </button>
            <div className="text-[13px] text-[#5077BE] mt-4">收不到验证码? 查看帮助</div>
          </>
        )}
      </div>
      {toastNode}
    </div>
  );
}
