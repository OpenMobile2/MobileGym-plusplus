import React, { useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, TopBar } from '../components/ui';
import { IcRight } from '../res/icons';

export default function NewChatPage() {
  const s = useStrings();
  const { bindTap, bindBack, go } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const users = useWeiboStore((st) => st.users);
  const [picked, setPicked] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <TopBar
        backBinding={bindBack()}
        title="发起聊天"
        right={
          <button
            {...bindTap('newChat.chat-open', {
              params: { id: picked ?? '' },
              preventDefault: !picked,
            })}
            disabled={!picked}
            className={`text-[14px] bg-transparent border-none ${picked ? 'text-[#FF8200] cursor-pointer' : 'text-[#FFCC99]'}`}
          >
            聊天
          </button>
        }
      />
      <div className="px-3 py-2 shrink-0">
        <div className="w-full h-8 bg-[#F5F5F5] rounded-full px-3 text-[13px] text-[#9A9A9A] flex items-center">🔍 搜索</div>
      </div>
      {['新建一个群', '选择已有群'].map((g) => (
        <button
          key={g}
          {...bindTap({ kind: 'action', id: 'newChat.group.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="flex items-center w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left shrink-0"
        >
          <span className="flex-1 text-[15px] text-[#1A1A1A]">{g}</span>
          <IcRight size={16} className="text-[#CCCCCC]" />
        </button>
      ))}
      <div className="flex-1 overflow-y-auto" data-scroll-container="newchat-list" data-scroll-direction="vertical">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setPicked((p) => (p === u.id ? null : u.id))}
            className="flex items-center gap-3 w-full px-4 py-2.5 bg-transparent border-none cursor-pointer text-left"
          >
            <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] shrink-0 ${picked === u.id ? 'bg-[#FF8200] border-[#FF8200] text-white' : 'border-[#CCCCCC]'}`}>
              {picked === u.id ? '✓' : ''}
            </span>
            <Img src={u.avatar} label={u.name[0]} className="w-10 h-10 rounded-full object-cover shrink-0" />
            <span className="text-[15px] text-[#1A1A1A]">{u.name}</span>
          </button>
        ))}
      </div>
      {toastNode}
    </div>
  );
}
