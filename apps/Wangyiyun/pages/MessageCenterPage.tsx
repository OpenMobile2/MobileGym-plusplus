import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, Cover, WY } from '../components/ui';

const ENTRIES: { key: string; label: string; seed: string; badge?: string }[] = [
  { key: 'fans', label: '新增粉丝', seed: 'alin' },
  { key: 'at', label: '评论和@提及', seed: 'cover7', badge: '3' },
  { key: 'like', label: '赞和通知', seed: 'cover4', badge: '12' },
  { key: 'news', label: '音乐新动向', seed: 'hot' },
];

export default function MessageCenterPage() {
  const { go } = useWangyiyunGestures();
  const conversations = useWangyiyunStore((s) => s.conversations);
  return (
    <Screen>
      <TopBar title="消息" />
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-4 py-3">
          {ENTRIES.map((e) => (
            <button key={e.key} onClick={() => e.key === 'news' ? go('msg.news-open') : go('msg.notice-open', { kind: e.key })} className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer relative">
              <Cover seed={e.seed} className="w-11 h-11" rounded={22} />
              {e.badge && <span className="absolute top-0 right-4 min-w-[16px] h-4 px-1 rounded-full text-[10px] text-white flex items-center justify-center" style={{ background: WY.primary }}>{e.badge}</span>}
              <span className="text-[11px]" style={{ color: WY.textSecondary }}>{e.label}</span>
            </button>
          ))}
        </div>
        <div className="h-2" style={{ background: WY.pageBg }} />
        {conversations.map((c) => (
          <button key={c.id} onClick={() => go('msg.chat-open', { id: c.id })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
            <Cover seed={c.seed} className="w-12 h-12 shrink-0" rounded={24} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <div className="text-[15px] truncate" style={{ color: WY.textPrimary }}>{c.name}</div>
                {c.official && <span className="text-[9px] px-1 rounded text-white shrink-0" style={{ background: '#5B8FF9' }}>官方</span>}
              </div>
              <div className="text-[12px] truncate mt-0.5" style={{ color: WY.textSecondary }}>{c.summary}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10px]" style={{ color: WY.textTertiary }}>{c.time}</div>
              {c.unread > 0 && <div className="inline-block mt-1 text-[10px] text-white rounded-full px-1.5 min-w-[18px] text-center" style={{ background: WY.primary }}>{c.unread > 99 ? '99+' : c.unread}</div>}
            </div>
          </button>
        ))}
      </div>
    </Screen>
  );
}
