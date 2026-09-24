import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { OrangeBtn, C } from '../components/ui';
import { IcNavBack } from '../res/icons';

/** 登录 —— 证据 recF:两步式(嗨,欢迎回来 → 请输入验证码 6 格),底部第三方图标行 */
export default function AuthLoginPage() {
  const { bindTap, bindBack } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const [step, setStep] = React.useState<1 | 2>(1);
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [agreed, setAgreed] = React.useState(false);
  const [sentCard, setSentCard] = React.useState(true);

  const phoneOk = phone.replace(/\D/g, '').length >= 11;

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-2 shrink-0">
        {step === 1 ? (
          <button {...bindBack()} className="bg-transparent border-none p-1 text-app-text" aria-label="返回">
            <IcNavBack size={22} />
          </button>
        ) : (
          <button onClick={() => setStep(1)} className="bg-transparent border-none p-1 text-app-text" aria-label="上一步">
            <IcNavBack size={22} />
          </button>
        )}
      </div>

      {step === 1 ? (
        <div className="flex-1 overflow-y-auto px-8 pt-8">
          <div className="text-[24px] font-bold text-app-text mb-1">嗨,欢迎回来</div>
          <div className="text-[13px] text-app-text-muted mb-10">登录后更精彩,美好出行即将开始</div>

          <div className="flex items-center border-b border-app-border pb-2.5 mb-5">
            <span className="text-[16px] text-app-text mr-3 shrink-0">+86</span>
            <span className="w-px h-4 bg-app-border mr-3" />
            <input
              data-action="auth.login.phone"
              data-action-type="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="请输入手机号码"
              inputMode="numeric"
              className="flex-1 bg-transparent border-none outline-none text-[17px] text-app-text"
            />
          </div>

          <button
            onClick={() => setAgreed((v) => !v)}
            className="flex items-start gap-2 bg-transparent border-none text-left mb-8 p-0"
          >
            <span
              className="inline-flex items-center justify-center rounded-full shrink-0 mt-0.5"
              style={{
                width: 15, height: 15, fontSize: 10, color: '#fff',
                background: agreed ? C.orange : 'transparent',
                border: agreed ? 'none' : '1.5px solid #C9CDD4',
              }}
            >
              {agreed ? '✓' : ''}
            </span>
            <span className="text-[11px] text-app-text-muted leading-relaxed">
              未注册的手机号验证后将自动创建账号,登录即代表您已阅读并同意
              <span style={{ color: C.blue }}>《法律条款与隐私政策》</span>和
              <span style={{ color: C.blue }}>《个人信息处理规则》</span>
            </span>
          </button>

          {phoneOk && agreed ? (
            <button
              {...bindTap({ kind: 'action', id: 'auth.login.next' }, {
                onTrigger: () => { setStep(2); setSentCard(true); toast('验证码已发送(演示:任意6位)'); },
              })}
              className="w-full py-3 rounded-full text-white text-[16px] font-medium border-none"
              style={{ background: '#1A1E29' }}
            >
              下一步
            </button>
          ) : (
            <button
              onClick={() => toast(!phoneOk ? '请输入完整手机号' : '请先勾选并同意协议')}
              className="w-full py-3 rounded-full text-white text-[16px] font-medium border-none"
              style={{ background: '#C4C7CE' }}
            >
              下一步
            </button>
          )}

          <div className="text-center text-[12px] text-app-text-muted mt-10 mb-4">登录遇到问题</div>
          <div className="flex justify-center gap-6">
            {[
              ['支', '#3C7CFC'],
              ['微', '#04B578'],
              ['', '#1A1E29'],
            ].map(([ch, color], i) => (
              <button
                key={i}
                {...bindTap({ kind: 'action', id: 'auth.login.thirdparty' }, { onTrigger: () => toast('第三方登录暂未开放') })}
                className="w-10 h-10 rounded-full border-none text-white text-[15px]"
                style={{ background: color as string }}
              >
                {ch || ''}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-8 pt-8">
          <div className="text-[24px] font-bold text-app-text mb-1">请输入验证码</div>
          <div className="text-[13px] text-app-text-muted mb-8">
            验证码已发送至 +86 {phone || '1**********'}
          </div>

          {/* 6 格验证码 */}
          <div className="relative mb-6">
            <div className="flex gap-2.5">
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className="flex-1 h-12 rounded-lg flex items-center justify-center text-[20px] font-semibold text-app-text"
                  style={{
                    background: '#F5F6FA',
                    border: code.length === i ? `1.5px solid ${C.orange}` : '1.5px solid transparent',
                  }}
                >
                  {code[i] ?? ''}
                </span>
              ))}
            </div>
            <input
              data-action="auth.login.code"
              data-action-type="input"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              className="absolute inset-0 opacity-0 w-full h-full"
              aria-label="验证码"
            />
          </div>

          {sentCard && (
            <div className="flex flex-col items-center my-8">
              <div
                className="rounded-xl px-6 py-4 text-white text-[13px] flex flex-col items-center gap-2"
                style={{ background: 'rgba(26,30,41,.92)' }}
              >
                <span className="w-7 h-7 rounded-full bg-white text-[15px] flex items-center justify-center" style={{ color: '#1A1E29' }}>✓</span>
                验证码已经发送成功
              </div>
            </div>
          )}

          {code.length === 6 ? (
            <OrangeBtn bind={bindTap('auth.login.done')}>登录</OrangeBtn>
          ) : (
            <div className="text-center text-[12px] text-app-text-muted">60s 后可重新获取</div>
          )}
        </div>
      )}
      <div className="h-8 shrink-0" />
    </div>
  );
}
