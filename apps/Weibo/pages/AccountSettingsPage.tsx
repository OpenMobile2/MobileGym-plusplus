import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useToast, TopBar, Img } from '../components/ui';
import { NavRow } from '../components/SettingsRow';

export default function AccountSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const me = useWeiboStore((st) => st.me);
  const stub = () => toast('该功能暂未开放');

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="账号管理" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="account-list" data-scroll-direction="vertical">
        <div className="bg-white mt-2 flex items-center px-4 py-4 border-b border-[#FAFAFA]">
          <Img src={me.avatar} label="我" className="w-14 h-14 rounded-full object-cover" />
          <div className="ml-3 flex-1 min-w-0">
            <div className="text-[16px] font-semibold text-[#1A1A1A] truncate">{me.name}</div>
            <div className="text-[12px] text-[#9A9A9A] mt-0.5">微博ID:1024637</div>
          </div>
        </div>
        <div className="bg-white mt-2">
          <NavRow label="头像" binding={bindTap({ kind: 'action', id: 'account.item.stub' }, { onTrigger: stub })} />
          <NavRow label="昵称" value={me.name} binding={bindTap({ kind: 'action', id: 'account.item.stub' }, { onTrigger: stub })} />
          <NavRow label="个性域名" value="未设置" binding={bindTap({ kind: 'action', id: 'account.item.stub' }, { onTrigger: stub })} />
          <NavRow label="实名认证" value="已认证" binding={bindTap({ kind: 'action', id: 'account.item.stub' }, { onTrigger: stub })} />
        </div>
        <div className="bg-white mt-2">
          <NavRow label="第三方账号绑定" binding={bindTap({ kind: 'action', id: 'account.item.stub' }, { onTrigger: stub })} />
          <NavRow label="注销账号" binding={bindTap({ kind: 'action', id: 'account.item.stub' }, { onTrigger: stub })} />
        </div>
      </div>
      {toastNode}
    </div>
  );
}
