import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useToast, TopBar } from '../components/ui';
import { ToggleRow, NavRow } from '../components/SettingsRow';

export default function SecuritySettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const g = useWeiboStore((st) => st.settings);
  const me = useWeiboStore((st) => st.me);
  const setSetting = useWeiboStore((st) => st.setSetting);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="账号与安全" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="security-list" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          <NavRow label="微博账号" value={me.name}
            binding={bindTap({ kind: 'action', id: 'security.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
          <NavRow label="绑定手机" value="130****637"
            binding={bindTap({ kind: 'action', id: 'security.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
          <NavRow label="修改密码"
            binding={bindTap({ kind: 'action', id: 'security.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
          <NavRow label="登录设备管理" value="2 台"
            binding={bindTap({ kind: 'action', id: 'security.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
        </div>
        <div className="px-4 pt-4 pb-1 text-[13px] text-[#9A9A9A]">安全保护</div>
        <div className="bg-white">
          <ToggleRow label="登录保护" sub="异地登录需短信验证" value={g.loginProtect}
            binding={bindTap({ kind: 'action', id: 'security.loginProtect.toggle' }, { onTrigger: () => setSetting('loginProtect', !g.loginProtect) })} />
          <ToggleRow label="账号安全锁" sub="打开App需身份验证" value={g.accountProtect}
            binding={bindTap({ kind: 'action', id: 'security.accountProtect.toggle' }, { onTrigger: () => setSetting('accountProtect', !g.accountProtect) })} />
        </div>
      </div>
      {toastNode}
    </div>
  );
}
