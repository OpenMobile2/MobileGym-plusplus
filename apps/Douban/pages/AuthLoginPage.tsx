// 登录页(auth.login,inferred:手机号+任意验证码 mock 登录,豆瓣绿品牌门面)。
import React, { useEffect, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, C } from '../components/ui';

export default function AuthLoginPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [countdown]);

  const phoneOk = /^1\d{10}$/.test(phone);
  const codeOk = code.length === 6;
  const canSubmit = phoneOk && codeOk && agreed;

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      <TopBar title="登录" />
      <div
        className="flex-1 overflow-y-auto px-8"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 品牌区 */}
        <div className="flex flex-col items-center pt-16 pb-10">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold text-white"
            style={{ background: C.green }}
          >
            豆
          </div>
          <div className="mt-3 text-xl font-bold" style={{ color: C.text }}>豆瓣</div>
          <div className="mt-1 text-xs" style={{ color: C.sub }}>和有趣的人做有趣的事</div>
        </div>

        {/* 手机号 */}
        <div className="flex items-center h-12 border-b" style={{ borderColor: C.border }}>
          <span className="text-[15px] pr-3" style={{ color: C.text }}>+86</span>
          <span className="w-px h-4 mr-3" style={{ background: C.border }} />
          <input
            {...bindTap<HTMLInputElement>({ kind: 'action', id: 'auth.phone.input' }, { onTrigger: () => undefined })}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
            placeholder="请输入手机号"
            inputMode="numeric"
            className="flex-1 h-full outline-none border-none text-[15px] bg-transparent"
            style={{ color: C.text }}
          />
        </div>

        {/* 验证码 */}
        <div className="flex items-center h-12 border-b" style={{ borderColor: C.border }}>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="请输入验证码"
            inputMode="numeric"
            className="flex-1 h-full outline-none border-none text-[15px] bg-transparent"
            style={{ color: C.text }}
          />
          <button
            {...bindTap({ kind: 'action', id: 'auth.smscode.request' }, {
              onTrigger: () => {
                if (!phoneOk) {
                  toast('请输入 11 位手机号');
                  return;
                }
                if (countdown > 0) return;
                setCountdown(60);
                toast('验证码已发送(模拟:任意6位可登录)');
              },
            })}
            className="text-sm bg-transparent border-none cursor-pointer shrink-0 pl-3"
            style={{ color: phoneOk && countdown === 0 ? C.green : '#B9BEC6' }}
          >
            {countdown > 0 ? `重新获取(${countdown}s)` : '获取验证码'}
          </button>
        </div>

        {/* 协议 */}
        <button
          {...bindTap({ kind: 'action', id: 'auth.agreement.toggle' }, { onTrigger: () => setAgreed((a) => !a) })}
          className="flex items-start gap-2 mt-5 bg-transparent border-none cursor-pointer text-left p-0"
        >
          <span
            className="w-4 h-4 mt-0.5 rounded-full flex items-center justify-center shrink-0"
            style={{
              border: agreed ? 'none' : `1.5px solid ${C.border}`,
              background: agreed ? C.green : 'transparent',
            }}
          >
            {agreed && (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className="text-xs leading-relaxed" style={{ color: C.sub }}>
            已阅读并同意豆瓣<span style={{ color: C.green }}>《使用协议》</span>和
            <span style={{ color: C.green }}>《隐私政策》</span>
          </span>
        </button>

        {/* 登录按钮 */}
        {canSubmit ? (
          <button
            {...bindTap('auth.login-submit', { beforeTrigger: () => toast('登录成功') })}
            className="w-full h-11 mt-8 rounded-full text-[15px] font-semibold text-white border-none cursor-pointer"
            style={{ background: C.green }}
          >
            登录
          </button>
        ) : (
          <button
            {...bindTap('auth.login-submit', {
              onTrigger: () => {
                if (!phoneOk || !codeOk) toast('请输入手机号和 6 位验证码');
                else toast('请先勾选同意协议');
              },
            })}
            className="w-full h-11 mt-8 rounded-full text-[15px] font-semibold text-white border-none cursor-pointer"
            style={{ background: '#B7E5BE' }}
          >
            登录
          </button>
        )}

        {/* 第三方登录 */}
        <div className="flex items-center gap-3 mt-14 mb-4">
          <div className="flex-1 h-px" style={{ background: C.border }} />
          <span className="text-[11px]" style={{ color: '#B9BEC6' }}>其他登录方式</span>
          <div className="flex-1 h-px" style={{ background: C.border }} />
        </div>
        <div className="flex justify-center gap-10 pb-10">
          <button
            {...bindTap({ kind: 'action', id: 'auth.thirdparty.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: '#F2F3F5' }}
            aria-label="微信登录"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#09BB07">
              <path d="M8.5 3C4.9 3 2 5.5 2 8.6c0 1.8 1 3.3 2.5 4.4l-.6 2 2.2-1.2c.8.2 1.5.4 2.4.4h.6a5 5 0 01-.2-1.5c0-3 2.9-5.4 6.4-5.4h.5C15.3 4.9 12.2 3 8.5 3zm-2 2.8a.9.9 0 110 1.8.9.9 0 010-1.8zm4.6 0a.9.9 0 110 1.8.9.9 0 010-1.8zM22 12.7c0-2.6-2.6-4.7-5.7-4.7s-5.7 2.1-5.7 4.7 2.6 4.7 5.7 4.7c.7 0 1.3-.1 1.9-.3l1.9 1-.5-1.7c1.5-.9 2.4-2.2 2.4-3.7zm-7.6-1.3a.8.8 0 110 1.5.8.8 0 010-1.5zm3.8 0a.8.8 0 110 1.5.8.8 0 010-1.5z" />
            </svg>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'auth.thirdparty.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-11 h-11 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: '#F2F3F5' }}
            aria-label="Apple 登录"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1A1A">
              <path d="M16.7 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-3.7zM14.4 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.2 1.9-1 3 1 .1 2-.5 2.7-1.4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
