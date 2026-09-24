import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { usePanel, VIP } from '../components/ui';
import { IcClose } from '../res/icons';

export default function LoginPage() {
  const { bindTap, bindBack, back } = useVipshopGestures();
  const { value: privacy, open: openPanel } = usePanel('privacy');
  const login = useVipshopStore((s) => s.login);
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const canSubmit = phone.replace(/\D/g, '').length >= 11;

  const AgreeCheck = ({ onToggle, checked }: { onToggle: () => void; checked: boolean }) => (
    <span
      onClick={onToggle}
      className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 cursor-pointer"
      style={checked ? { background: VIP.primary, borderColor: VIP.primary } : { borderColor: '#BBB' }}
    >
      {checked && <span className="text-white text-[10px]">✓</span>}
    </span>
  );

  return (
    <div className="flex flex-col h-full relative" style={{ background: 'linear-gradient(160deg,#FBE4F1,#EDE4FF 60%,#FFFFFF)' }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="h-11 shrink-0 flex items-center px-2">
        <button {...bindTap('login.close-open')} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="关闭">
          <IcClose size={22} className="text-[#222222]" />
        </button>
        <span className="flex-1" />
        <span className="text-[13px] text-[#888888] pr-2">无法登录?</span>
      </div>

      {/* logo + slogan */}
      <div className="flex flex-col items-center mt-6 mb-8">
        <span className="text-[30px] font-black tracking-wide text-[#141414]">VIP.COM</span>
        <span className="text-[12px] text-[#666666] mt-2">100%正品 · 顺丰配送 · 退换无忧</span>
      </div>

      {/* 手机号输入 */}
      <div className="px-8">
        <div className="relative">
          <input
            {...(bindTap({ kind: 'action', id: 'login.phone.input' }, { onTrigger: () => {} }) as any)}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="numeric"
            placeholder="请输入手机号"
            className="w-full bg-transparent border-b border-[#E0C9DA] py-2 text-[18px] text-[#222222] outline-none placeholder:text-[#BBBBBB]"
          />
        </div>

        {/* 新用户徽标浮于按钮上方 */}
        <div className="relative mt-6">
          <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] text-white rounded-full px-2 py-0.5 z-10" style={{ background: VIP.primary }}>
            新用户注册成功可享专属福利
          </span>
          <button
            {...bindTap({ kind: 'action', id: 'login.sms.open' }, {
              onTrigger: () => openPanel('open'),
            })}
            disabled={!canSubmit}
            className="w-full h-12 rounded-full text-[16px] font-semibold border-none cursor-pointer disabled:opacity-100"
            style={canSubmit ? { background: VIP.primary, color: '#fff' } : { background: '#E5D3DE', color: '#fff' }}
          >
            获取验证码登录
          </button>
        </div>

        {/* 服务条款 */}
        <div className="flex items-start gap-1.5 mt-4 text-[11px] text-[#888888] leading-relaxed">
          <button
            {...bindTap({ kind: 'action', id: 'login.agreement.toggle' }, { onTrigger: () => setAgreed((a) => !a) })}
            className="bg-transparent border-none cursor-pointer p-0 mt-0.5"
          >
            <AgreeCheck checked={agreed} onToggle={() => setAgreed((a) => !a)} />
          </button>
          <span>
            已阅读并同意
            <span style={{ color: VIP.primary }}>《唯品会服务条款》</span>
            <span style={{ color: VIP.primary }}>《隐私政策》</span>
            ,新用户手机号验证后自动注册。
          </span>
        </div>
      </div>

      {/* 底部三方登录 */}
      <div className="mt-auto pb-8">
        <div className="flex justify-center gap-10 mb-6">
          <button {...bindTap('login.oneClick-open', { beforeTrigger: () => login('') })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[18px]">📱</span>
            <span className="text-[11px] text-[#666666]">本机号登录</span>
          </button>
          <button {...bindTap('login.wechat-open', { params: { provider: 'wechat' } })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer relative">
            <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[18px]">💬</span>
            <span className="text-[11px] text-[#666666]">微信</span>
            <span className="absolute -top-1 right-0 text-[9px] text-white rounded-full px-1" style={{ background: VIP.primary }}>上次登录</span>
          </button>
          <button {...bindTap('login.qq-open', { params: { provider: 'qq' } })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <span className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[18px]">🐧</span>
            <span className="text-[11px] text-[#666666]">QQ</span>
          </button>
        </div>
        <div className="flex justify-center gap-4 text-[12px] text-[#888888]">
          <button {...bindTap('login.pwd-open')} className="bg-transparent border-none cursor-pointer text-[#888888]">账号密码登录</button>
          <span className="text-[#DDD]">|</span>
          <button {...bindTap('login.pwd-open')} className="bg-transparent border-none cursor-pointer text-[#888888]">新用户注册</button>
        </div>
      </div>

      {/* 隐私协议弹窗 */}
      {privacy === 'open' && (
        <div className="absolute inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => back()} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] bg-white rounded-2xl p-5">
            <div className="text-center text-[16px] font-semibold text-[#222222]">服务条款和隐私政策</div>
            <div className="text-[12px] text-[#666666] leading-relaxed mt-3">
              为保障您的权益,请阅读并同意
              <span style={{ color: VIP.primary }}>《唯品会服务条款》</span>
              和<span style={{ color: VIP.primary }}>《隐私政策》</span>。
              同意后我们将向您发送短信验证码,新用户验证后自动注册。
            </div>
            <button
              {...bindTap('privacy.agree-open', { beforeTrigger: () => setAgreed(true) })}
              className="w-full h-11 rounded-full mt-5 text-[15px] font-semibold border-none cursor-pointer text-white"
              style={{ background: VIP.primary }}
            >
              同意并继续
            </button>
            <button
              {...bindBack()}
              className="w-full h-10 mt-2 text-[14px] text-[#888888] bg-transparent border-none cursor-pointer"
            >
              不同意
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
