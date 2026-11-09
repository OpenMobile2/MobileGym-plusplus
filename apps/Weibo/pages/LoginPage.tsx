import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, CenterDialog } from '../components/ui';
import { IcClose, IcSettings } from '../res/icons';
import { IcLauncher } from '../res/icons';

export default function LoginPage() {
  const s = useStrings();
  const { bindTap, bindBack, back } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const me = useWeiboStore((st) => st.me);
  const phone = useWeiboStore((st) => st.session.phone);
  const login = useWeiboStore((st) => st.login);

  const view = searchParams.get('view') === 'onekey' ? 'onekey' : 'quick';
  const agreeDialogOpen = searchParams.get('agree') === 'open';
  const [agreed, setAgreed] = useState(false);

  const doLogin = (via: string) => {
    login(via);
    toast('登录成功');
    window.setTimeout(back, 400);
  };

  const attemptOneKey = () => {
    if (!agreed) {
      setSearchParams((p) => { p.set('agree', 'open'); return p; }, { replace: true });
    } else {
      doLogin('onekey');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center h-11 px-3 shrink-0">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[#1A1A1A] p-1"><IcClose size={22} /></button>
        <span className="flex-1" />
        <IcSettings size={20} className="text-[#5B5B5B]" />
      </div>

      <div className="flex-1 flex flex-col items-center px-8 pt-8">
        {view === 'quick' ? (
          <>
            <Img src={me.avatar} label="我" className="w-16 h-16 rounded-full object-cover" />
            <div className="text-[16px] font-semibold mt-2">{me.name}</div>
            <button onClick={() => toast(s.notOpen)} className="text-[12px] text-[#5077BE] bg-transparent border-none cursor-pointer mt-1">账号管理</button>
            <label className="flex items-start gap-1.5 text-[11px] text-[#9A9A9A] mt-8 leading-relaxed">
              <button
                {...bindTap({ kind: 'action', id: 'login.agreement.toggle' }, { onTrigger: () => setAgreed((v) => !v) })}
                className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center text-[10px] cursor-pointer ${agreed ? 'bg-[#41C468] border-[#41C468] text-white' : 'border-[#CCCCCC] bg-transparent'}`}
              >
                {agreed ? '✓' : ''}
              </button>
              <span>登录注册表示同意<span className="text-[#5077BE]">用户协议</span>、<span className="text-[#5077BE]">隐私条款</span></span>
            </label>
            <button
              {...bindTap({ kind: 'action', id: 'login.quick.submit' }, {
                onTrigger: () => { if (agreed) doLogin('quick'); else setSearchParams((p) => { p.set('agree', 'open'); return p; }, { replace: true }); },
              })}
              className="w-full h-11 mt-4 rounded-full bg-gradient-to-r from-[#FF8200] to-[#FFB300] text-white text-[15px] font-semibold border-none cursor-pointer"
            >
              {s.loginThis}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'login.other.open' }, {
                onTrigger: () => setSearchParams((p) => { p.set('view', 'onekey'); return p; }, { replace: true }),
              })}
              className="w-full h-11 mt-3 rounded-full bg-white text-[#FF8200] text-[15px] border border-[#FFB380] cursor-pointer"
            >
              {s.loginOtherWay}
            </button>
          </>
        ) : (
          <>
            <img src={IcLauncher} alt="weibo" className="w-16 h-16 rounded-2xl" />
            <div className="text-[26px] font-bold tracking-wider mt-6">{phone}</div>
            <label className="flex items-start gap-1.5 text-[11px] text-[#9A9A9A] mt-8 leading-relaxed">
              <button
                {...bindTap({ kind: 'action', id: 'login.agreement.toggle' }, { onTrigger: () => setAgreed((v) => !v) })}
                className={`w-4 h-4 rounded-full border mt-0.5 shrink-0 flex items-center justify-center text-[10px] cursor-pointer ${agreed ? 'bg-[#41C468] border-[#41C468] text-white' : 'border-[#CCCCCC] bg-transparent'}`}
              >
                {agreed ? '✓' : ''}
              </button>
              <span>登录注册即表示同意<span className="text-[#5077BE]">用户协议</span>、<span className="text-[#5077BE]">隐私条款</span>和<span className="text-[#5077BE]">中国联通认证服务条款</span></span>
            </label>
            <button
              {...bindTap({ kind: 'action', id: agreed ? 'login.onekey.submit' : 'login.onekey.agreementGate' }, { onTrigger: attemptOneKey })}
              className="w-full h-11 mt-4 rounded-full bg-gradient-to-r from-[#FF8200] to-[#FFB300] text-white text-[15px] font-semibold border-none cursor-pointer"
            >
              {s.loginOneKey}
            </button>
            <button
              {...bindTap('login.sms-open')}
              className="w-full h-11 mt-3 rounded-full bg-white text-[#FF8200] text-[15px] border border-[#FFB380] cursor-pointer"
            >
              {s.loginOther}
            </button>
            <div className="flex items-center gap-2 w-full mt-3 text-[11px] text-[#9A9A9A]">
              <span className="flex-1">未注册手机号验证通过后将自动注册</span>
              <span className="text-[#5077BE]">帮助</span>
            </div>
            <div className="flex gap-6 mt-auto mb-8">
              {['✉️', '💬', '🐧', '⛶'].map((icon, i) => (
                <button
                  key={i}
                  {...bindTap({ kind: 'action', id: 'login.thirdparty.stub' }, { onTrigger: () => toast(s.notOpen) })}
                  className="w-11 h-11 rounded-full border border-[#EEEEEE] bg-white text-[18px] cursor-pointer"
                >
                  {icon}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 协议弹窗 */}
      {agreeDialogOpen && (
        <CenterDialog
          text="用户协议与隐私条款"
          subText="为保障与你相关的合法权益,请阅读并同意用户协议、隐私条款和中国联通认证服务条款"
          leftLabel={s.disagree}
          rightLabel={s.agreeAndLogin}
          leftBinding={bindTap({ kind: 'action', id: 'login.agreement.reject' }, {
            onTrigger: () => setSearchParams((p) => { p.delete('agree'); return p; }, { replace: true }),
          })}
          rightBinding={bindTap({ kind: 'action', id: 'login.agreement.confirm' }, {
            onTrigger: () => {
              setAgreed(true);
              setSearchParams((p) => { p.delete('agree'); return p; }, { replace: true });
              doLogin('agree-and-login');
            },
          })}
          onLeft={() => setSearchParams((p) => { p.delete('agree'); return p; }, { replace: true })}
          onRight={() => doLogin('agree-and-login')}
        />
      )}
      {toastNode}
    </div>
  );
}
