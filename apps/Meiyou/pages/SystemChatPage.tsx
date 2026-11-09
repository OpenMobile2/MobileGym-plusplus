/** 系统通知会话页(小柚子)。spec: message.systemChat */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, NOT_OPEN, useToast } from '../components/ui';
import { IcSettings } from '../res/icons';
import { timeAgo } from '../components/PostCard';

export default function SystemChatPage() {
  const { bindTap } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const sysNotices = useMeiyouStore((s) => s.sysNotices);
  const markRead = useMeiyouStore((s) => s.markRead);
  React.useEffect(() => { markRead('sysChat'); }, [markRead]);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F4] relative">
      <TopBar
        title="小柚子"
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'syschat.settings.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="设置"
          >
            <IcSettings size={20} className="text-[#1A1A1A]" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-4" data-scroll-container="syschat-list" data-scroll-direction="vertical">
        {sysNotices.map((n) => (
          <div key={n.id} className="flex flex-col items-center">
            <div className="text-[11px] text-[#999] mb-1.5">{timeAgo(n.createdAt)}</div>
            <div className="bg-white rounded-xl p-3 w-full">
              <div className="text-[14px] font-semibold text-[#1A1A1A]">{n.title}</div>
              <div className="mt-1 text-[13px] text-[#666] leading-snug">{n.body}</div>
            </div>
          </div>
        ))}
      </div>
      {toast}
    </div>
  );
}
