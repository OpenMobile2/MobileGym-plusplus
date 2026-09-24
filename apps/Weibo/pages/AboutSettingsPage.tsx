import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useToast, TopBar } from '../components/ui';
import { NavRow } from '../components/SettingsRow';
import { IcLauncher } from '../res/icons';

export default function AboutSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const [checked, setChecked] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="关于微博" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="about-list" data-scroll-direction="vertical">
        <div className="flex flex-col items-center pt-10 pb-6">
          <img src={IcLauncher} alt="weibo" className="w-16 h-16 rounded-2xl" />
          <div className="text-[16px] font-semibold mt-3">微博</div>
          <div className="text-[12px] text-[#9A9A9A] mt-1">版本 14.6.0</div>
        </div>
        <div className="bg-white">
          <NavRow label="检查更新" value={checked ? '已是最新版本 ✓' : '点击检查'}
            binding={bindTap({ kind: 'action', id: 'about.checkUpdate.submit' }, {
              onTrigger: () => { setChecked(true); toast('当前已是最新版本'); },
            })} />
          <NavRow label="功能介绍"
            binding={bindTap({ kind: 'action', id: 'about.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
        </div>
        <div className="bg-white mt-2">
          <NavRow label="用户协议"
            binding={bindTap({ kind: 'action', id: 'about.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
          <NavRow label="隐私政策"
            binding={bindTap({ kind: 'action', id: 'about.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
          <NavRow label="个人信息收集清单"
            binding={bindTap({ kind: 'action', id: 'about.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
        </div>
        <div className="text-center text-[11px] text-[#BBBBBB] py-6">© 2026 微博 Weibo · 复刻演示版</div>
      </div>
      {toastNode}
    </div>
  );
}
