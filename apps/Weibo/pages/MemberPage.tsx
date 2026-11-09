import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useStrings, useToast, TopBar } from '../components/ui';

export default function MemberPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  return (
    <div className="flex flex-col h-full bg-[#1D1B26] relative" data-status-bar-foreground="light">
      <TopBar backBinding={bindBack()} title="微博会员" transparent />
      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="member-scroll" data-scroll-direction="vertical">
        <div className="bg-gradient-to-r from-[#F5D08A] to-[#E8B45E] rounded-xl p-4 mt-3">
          <div className="text-[18px] font-bold text-[#4A2E00]">👑 微博会员</div>
          <div className="text-[12px] text-[#6A4A10] mt-1">专属装扮 · 评论表情 · 定时发博 · 更多曝光</div>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-4">
          {['专属皮肤', '动态头像', '会员表情', '粉丝头条券', '评论置顶', '微博编辑'].map((p) => (
            <div key={p} className="h-20 rounded-xl bg-white/10 flex flex-col items-center justify-center gap-1.5">
              <span className="text-[20px]">✨</span>
              <span className="text-[12px] text-[#E8D5AC]">{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-4 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'member.purchase.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#F5D08A] to-[#E8B45E] text-[15px] font-bold text-[#4A2E00] border-none cursor-pointer"
        >
          开通会员
        </button>
      </div>
      {toastNode}
    </div>
  );
}
