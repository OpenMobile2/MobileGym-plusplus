/** 一键登录页(微信快捷,mock 跳过真实授权)。spec: auth.login */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, useToast, Img } from '../components/ui';
import { IcClose, IcCheck } from '../res/icons';

export default function LoginPage() {
  const { bindTap, bindBack } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const user = useMeiyouStore((s) => s.user);
  const [agreed, setAgreed] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center justify-between h-11 px-3 shrink-0">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="关闭">
          <IcClose size={22} className="text-[#1A1A1A]" />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'login.other.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="text-[13px] text-[#999] bg-transparent border-none cursor-pointer"
        >
          遇到问题
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-8 pt-10">
        <Img src={user.avatar} className="w-20 h-20 rounded-full object-cover" />
        <div className="mt-3 text-[18px] font-semibold text-[#1A1A1A]">{user.wechatMask}</div>
        <div className="mt-1 text-[13px] text-[#999]">上次使用微信({user.wechatMask})登录</div>

        {agreed ? (
          <button
            {...bindTap('meiyou.restore-open')}
            className="mt-10 w-full h-12 rounded-full text-white text-[16px] font-semibold border-none cursor-pointer"
            style={{ background: MY.primary }}
          >
            登录该账号
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'login.agree.toggle' }, { onTrigger: () => { setAgreed(true); showToast('已同意协议,请再次点击登录'); } })}
            className="mt-10 w-full h-12 rounded-full text-white text-[16px] font-semibold border-none cursor-pointer opacity-60"
            style={{ background: MY.primary }}
          >
            登录该账号
          </button>
        )}

        <button
          {...bindTap({ kind: 'action', id: 'login.other.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mt-4 text-[13px] text-[#999] bg-transparent border-none cursor-pointer"
        >
          登录其他账号 &gt;
        </button>

        <div className="mt-auto mb-8 flex items-start gap-2">
          <button
            {...bindTap({ kind: 'action', id: 'login.agree.toggle' }, { onTrigger: () => setAgreed((v) => !v) })}
            className="w-4 h-4 rounded-full flex items-center justify-center border shrink-0 mt-0.5 cursor-pointer"
            style={{ background: agreed ? MY.primary : '#fff', borderColor: agreed ? MY.primary : '#CCC' }}
            aria-label="同意协议"
          >
            {agreed && <IcCheck size={11} className="text-white" />}
          </button>
          <div className="text-[11px] text-[#999] leading-snug">
            我已阅读并同意 <span style={{ color: MY.primary }}>美柚用户服务协议</span> 和 <span style={{ color: MY.primary }}>隐私政策</span>
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}
