import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcLauncher } from '../res/icons';

export default function AuthLoginPage() {
  const { bindTap } = useFlomoGestures();
  const toast = useFlomoStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full items-center" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* logo 区 */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: C.green }}>
          <IcLauncher size={40} color="#fff" />
        </div>
        <span className="font-bold text-2xl lowercase" style={{ color: C.text }}>flomo</span>
        <span style={{ color: C.sub, fontSize: 13 }}>记录你的每一个想法</span>
      </div>

      {/* 登录按钮 */}
      <div className="w-full px-8 pb-16 flex flex-col gap-3">
        <button
          {...bindTap({ kind: 'action', id: 'auth.login.wechat.do' }, { onTrigger: () => toast('已登录(模拟)') })}
          className="w-full h-12 rounded-xl border-none cursor-pointer font-semibold"
          style={{ background: C.green, color: '#fff', fontSize: 15 }}
        >
          微信登录
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'auth.login.phone.do' }, { onTrigger: () => toast('已登录(模拟)') })}
          className="w-full h-12 rounded-xl cursor-pointer font-semibold"
          style={{ background: C.surface, color: C.text, fontSize: 15, border: `1px solid ${C.border}` }}
        >
          手机号登录
        </button>
      </div>
    </div>
  );
}
