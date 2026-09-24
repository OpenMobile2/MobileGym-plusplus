import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, NOT_OPEN, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcClose } from '../res/icons';

/** 登录页(r8;mock:任意手机号+任意验证码) */
export default function LoginPage() {
  const statusFg = useStatusBarFg();
  const { bindTap, bindBack } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [phone, setPhone] = React.useState('');
  const [agreed, setAgreedLocal] = React.useState(false);
  const login = useMaoyanStore((st) => st.login);

  const canSubmit = phone.replace(/\D/g, '').length === 11;

  return (
    <div className="flex flex-col h-full bg-app-surface relative" data-status-bar-foreground={statusFg}>
      {toast}
      <div className="flex items-center h-11 px-2">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="关闭">
          <IcClose size={22} className="text-(--app-c-text-2)" />
        </button>
        <span className="ml-auto text-[13px] text-(--app-c-text-3) pr-2">帮助</span>
      </div>
      <div className="px-8 mt-6">
        <div className="text-[26px] font-bold text-app-text">{s.loginTitle}</div>
        <div className="flex items-center mt-8 border-b border-app-border pb-2">
          <span className="text-[15px] text-app-text shrink-0">+86</span>
          <span className="mx-2 text-(--app-c-border-strong)">▾</span>
          <input
            {...bindTap({ kind: 'action', id: 'login.phone.input' }, { params: { value: 'phone' }, onTrigger: () => { /* 受控输入 */ } }) as any}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={s.phonePlaceholder}
            inputMode="numeric"
            className="flex-1 text-[16px] border-none outline-none bg-transparent"
          />
          {phone && (
            <button onClick={() => setPhone('')} className="bg-transparent border-none cursor-pointer text-(--app-c-text-4)" aria-label="清空">✕</button>
          )}
        </div>
        <div className="text-[11px] text-(--app-c-text-3) mt-2">未注册的手机号验证后自动创建猫眼账户</div>

        <div className="flex items-start gap-1.5 mt-5">
          <button
            {...bindTap({ kind: 'action', id: 'login.agree.toggle' }, { onTrigger: () => setAgreedLocal((v) => !v) })}
            className={`mt-0.5 w-3.5 h-3.5 rounded-full border shrink-0 cursor-pointer inline-flex items-center justify-center text-[9px] text-white ${agreed ? 'bg-[#DC4038] border-[#DC4038]' : 'bg-app-surface border-(--app-c-border-strong)'}`}
            aria-label="同意协议"
          >
            {agreed ? '✓' : ''}
          </button>
          <span className="text-[11px] text-(--app-c-text-3) leading-relaxed">
            我已阅读并同意《猫眼用户服务协议》《猫眼平台基本功能隐私政策》,并授权猫眼使用该猫眼账号信息(如昵称、头像、收货地址)以便统一管理
          </span>
        </div>

        {canSubmit && agreed ? (
          <button
            {...bindTap('login.sms-open', { beforeTrigger: () => login(phone) })}
            className="mt-6 w-full h-11 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
            style={{ background: MY.cta }}
          >
            {s.getSmsCode}
          </button>
        ) : (
          <button
            onClick={() => showToast(canSubmit ? '请先勾选协议' : '请输入11位手机号')}
            className="mt-6 w-full h-11 rounded-full text-white text-[15px] font-bold border-none cursor-pointer opacity-40"
            style={{ background: MY.cta }}
          >
            {s.getSmsCode}
          </button>
        )}

        <button
          {...bindTap({ kind: 'action', id: 'login.pwd.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mt-4 text-[13px] text-app-text-muted bg-transparent border-none cursor-pointer"
        >
          {s.pwdLogin}
        </button>
      </div>

      <div className="mt-auto pb-10 flex justify-center gap-8">
        {['💚', '🐧'].map((icon, i) => (
          <button
            key={i}
            {...bindTap({ kind: 'action', id: 'login.thirdparty.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="w-11 h-11 rounded-full bg-(--app-c-fill) border-none cursor-pointer text-[20px]"
            aria-label="第三方登录"
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
