import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useStrings, useToast, TopBar } from '../components/ui';
import { MSG_SETTINGS_ITEMS } from '../constants';
import { IcRight } from '../res/icons';

export default function MessageSettingsPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      <TopBar backBinding={bindBack()} title="消息设置" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="msg-settings" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          {MSG_SETTINGS_ITEMS.map((item) => (
            <button
              key={item}
              {...bindTap({ kind: 'action', id: 'msgSettings.item.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="flex items-center w-full px-4 py-3.5 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
            >
              <span className="flex-1 text-[15px] text-[#1A1A1A]">{item}</span>
              <span className="text-[12px] text-[#9A9A9A] mr-1">接收动态</span>
              <IcRight size={16} className="text-[#CCCCCC]" />
            </button>
          ))}
        </div>
      </div>
      {toastNode}
    </div>
  );
}
