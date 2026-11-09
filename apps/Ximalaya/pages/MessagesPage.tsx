import React from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { TopBar, EmptyState, showToast } from '../components/ui';
import { IcHeart, IcBell, IcRss, IcFeedback, IcTicket, IcCheckAll } from '../res/icons';
import type { MessageThread } from '../types';

const KIND_ICON: Record<MessageThread['kind'], React.ComponentType<{ size?: number }>> = {
  interactive: IcHeart,
  system: IcBell,
  anchor: IcRss,
  survey: IcFeedback,
  tingjian: IcTicket,
};
const KIND_BG: Record<MessageThread['kind'], string> = {
  interactive: '#FE4543',
  system: '#4C8DFF',
  anchor: '#FF9F43',
  survey: '#8E7BFF',
  tingjian: '#22C3A6',
};

export function MessagesPage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const messages = useXimalayaStore((st) => st.messages);
  const markThreadRead = useXimalayaStore((st) => st.markThreadRead);
  const markAllThreadsRead = useXimalayaStore((st) => st.markAllThreadsRead);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar
        title={s.mine_messages}
        right={
          <button
            {...bindTap({ kind: 'action', id: 'messages.readall.tap' }, { stopPropagation: true, onTrigger: () => { markAllThreadsRead(); showToast('已全部标为已读'); } })}
            className="flex items-center gap-1 text-[13px] text-[#666] pr-1"
          >
            <IcCheckAll size={16} />一键已读
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {messages.length === 0 ? (
          <EmptyState text={s.empty_messages} />
        ) : (
          <div className="bg-white mt-2">
            {messages.map((m) => {
              const Ic = KIND_ICON[m.kind];
              return (
                <div
                  key={m.id}
                  {...bindTap('messages.detail-open', { params: { id: m.id }, beforeTrigger: () => markThreadRead(m.id) })}
                  className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F5F5] active:bg-[#FAFAFA]"
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white" style={{ background: KIND_BG[m.kind] }}>
                      <Ic size={22} />
                    </div>
                    {m.unread > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FE4543] text-white text-[10px] leading-4 text-center">
                        {m.unread}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] text-[#333] font-medium">{m.name}</div>
                    <div className="text-[13px] text-[#999] truncate mt-0.5">{m.preview}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
