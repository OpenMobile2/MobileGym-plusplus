import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useToast, coverBg, WY } from '../components/ui';
import { IcCheck } from '../res/icons';

export default function LoginPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [agree, setAgree] = React.useState(false);
  const login = useWangyiyunStore((s) => s.login);
  const nick = useWangyiyunStore((s) => s.session.nick);
  const seed = useWangyiyunStore((s) => s.session.seed);

  const doLogin = () => {
    if (!agree) { showToast('请先勾选协议'); return; }
    login();
    go('login.done');
  };

  return (
    <div className="flex flex-col h-full items-center" data-status-bar-foreground="dark" style={{ background: '#fff' }}>
      <div className="h-20" />
      <div className="w-16 h-16 rounded-2xl mb-3" style={{ background: WY.primary }} />
      <div className="text-[20px] font-semibold mb-10" style={{ color: WY.primary }}>网易云音乐</div>
      {toast}
      <div className="w-full px-8">
        {[{ n: nick, p: '139****4313', s: seed }, { n: 'RyanPan_', p: '未绑定手机号', s: 'ryan' }].map((acc) => (
          <div key={acc.n} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: WY.divider }}>
            <div className="w-10 h-10 rounded-full" style={{ background: coverBg(acc.s) }} />
            <div className="flex-1">
              <div className="text-[15px]" style={{ color: WY.textPrimary }}>{acc.n}</div>
              <div className="text-[12px]" style={{ color: WY.textSecondary }}>{acc.p}</div>
            </div>
            <button onClick={doLogin} className="px-4 py-1.5 rounded-full text-[13px] text-white border-none cursor-pointer" style={{ background: WY.primary }}>登录</button>
          </div>
        ))}
      </div>
      <button {...bindTap({ kind: 'action', id: 'login.agree.toggle' }, { onTrigger: () => setAgree((a) => !a) })}
        className="flex items-start gap-2 px-8 mt-8 bg-transparent border-none cursor-pointer text-left">
        <span className="w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 shrink-0" style={{ borderColor: agree ? WY.primary : WY.textTertiary, background: agree ? WY.primary : 'transparent' }}>
          {agree && <IcCheck size={11} className="text-white" />}
        </span>
        <span className="text-[12px]" style={{ color: WY.textSecondary }}>我已阅读并同意《服务条款》《隐私政策》</span>
      </button>
      <div className="flex-1" />
      <button onClick={() => showToast('该功能暂未开放')} className="text-[12px] mb-8 bg-transparent border-none cursor-pointer" style={{ color: WY.textTertiary }}>登录遇到问题 | 以其他账号登录</button>
    </div>
  );
}
