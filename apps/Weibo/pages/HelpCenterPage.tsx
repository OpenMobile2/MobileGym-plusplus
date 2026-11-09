import React, { useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useToast, TopBar } from '../components/ui';
import { NavRow } from '../components/SettingsRow';

const FAQ = [
  { q: '如何找回被盗账号?', a: '通过「账号与安全 - 登录设备管理」冻结异常设备,并用绑定手机号重置密码。' },
  { q: '为什么我的微博没人看到?', a: '请检查「隐私设置 - 谁可以看我的微博」是否设置了限制,以及是否被限流。' },
  { q: '如何注销账号?', a: '在「账号管理 - 注销账号」提交申请,15 天冷静期后自动注销。' },
  { q: '会员到期后内容会丢失吗?', a: '不会。会员权益到期后仅停用专属功能,已发布内容与数据均保留。' },
];

export default function HelpCenterPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="客服中心" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="help-list" data-scroll-direction="vertical">
        <div className="px-4 pt-3 pb-1 text-[13px] text-[#9A9A9A]">常见问题</div>
        <div className="bg-white">
          {FAQ.map((f, i) => (
            <div key={i} className="border-b border-[#FAFAFA]">
              <button
                {...bindTap({ kind: 'action', id: 'help.faq.toggle' }, { onTrigger: () => setOpen((v) => (v === i ? null : i)) })}
                className="flex items-center w-full px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
              >
                <span className="flex-1 text-[15px] text-[#1A1A1A]">{f.q}</span>
                <span className="text-[#CCCCCC] text-[14px]">{open === i ? '∧' : '∨'}</span>
              </button>
              {open === i && <div className="px-4 pb-3 text-[13px] text-[#7F7F7F] leading-relaxed">{f.a}</div>}
            </div>
          ))}
        </div>
        <div className="bg-white mt-2">
          <NavRow label="联系人工客服"
            binding={bindTap({ kind: 'action', id: 'help.contact.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
          <NavRow label="意见反馈"
            binding={bindTap({ kind: 'action', id: 'help.contact.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
        </div>
      </div>
      {toastNode}
    </div>
  );
}
