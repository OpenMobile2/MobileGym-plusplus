import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { Img } from '../components/ui';
import { IcNavBack, IcUsers, IcComment, IcClock, IcShop, IcPackage, IcBell, IcCard } from '../res/icons';
import type { TaobaoStringKey } from '../res/strings';

const CATEGORIES: { icon: typeof IcUsers; labelKey: TaobaoStringKey }[] = [
  { icon: IcUsers, labelKey: 'catContacts' },
  { icon: IcComment, labelKey: 'catGroupChat' },
  { icon: IcClock, labelKey: 'catChatHistory' },
  { icon: IcShop, labelKey: 'catShop' },
  { icon: IcPackage, labelKey: 'catChatItems' },
  { icon: IcBell, labelKey: 'catMsgAccount' },
  { icon: IcCard, labelKey: 'catAllItems' },
];

/** 搜索聊天记录(spec: message.search,IMG_8714) */
export default function MessageSearchPage() {
  const { bindTap, bindBack } = useTaobaoGestures();
  const s = useStrings();
  const chats = useTaobaoStore((st) => st.chats);
  const [q, setQ] = useState('');

  const results = q.trim()
    ? chats.filter((c) =>
        c.name.includes(q.trim()) ||
        c.messages.some((m) => m.content.includes(q.trim())))
    : [];

  return (
    <div className="flex flex-col h-full bg-app-surface">
      <div className="flex items-center gap-2 px-2 h-12 shrink-0">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer">
          <IcNavBack size={24} />
        </button>
        <input
          autoFocus
          value={q}
          {...bindTap({ kind: 'action', id: 'messageSearch.query.input' }, { onTrigger: () => {} })}
          onChange={(e) => setQ(e.target.value)}
          placeholder={s.searchChatHistoryPlaceholder}
          className="flex-1 bg-[#F5F5F5] rounded-full h-9 px-3 text-[14px] border-none outline-none"
          data-keep-keyboard="true"
        />
        <span className="text-[14px] text-white bg-gradient-to-r from-[#FF9402] to-[#FF5000] rounded-full px-4 py-1.5">{s.search}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4">
        {q.trim() ? (
          results.length === 0 ? (
            <div className="text-[13px] text-app-text-muted text-center py-10">{s.noChatResultsText}</div>
          ) : (
            results.map((c) => (
              <div
                key={c.id}
                {...bindTap('message.chat-open', { params: { chatId: c.id } })}
                className="flex items-center gap-2.5 py-2.5 border-b border-[#F5F5F5] cursor-pointer"
              >
                <Img src={c.avatar} className="w-10 h-10 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px]">{c.name}</div>
                  <div className="text-[12px] text-app-text-muted truncate">
                    {c.messages.find((m) => m.content.includes(q.trim()))?.content ?? ''}
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          <>
            <div className="text-[14px] font-semibold mt-3 mb-3">{s.searchSpecificContentTitle}</div>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((c) => (
                <div key={c.labelKey} className="flex items-center gap-1.5 bg-app-bg rounded-lg px-3 py-3">
                  <c.icon size={16} className="text-app-text" />
                  <span className="text-[13px]">{s[c.labelKey]}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
