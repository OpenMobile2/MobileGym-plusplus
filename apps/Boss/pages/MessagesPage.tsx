import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { Avatar } from '../components/common';
import { COLORS } from '../res/colors';
import { IcBell, IcSearch, IcPlus, IcAi, IcClose } from '../res/icons';
import type { MessagesTab } from '../types';

const C = BOSS_CONFIG;

/** 消息列表(IMG_8419/8420/8422):通知横幅 + 搜索 + 全部/新招呼/仅沟通 + 会话列表 */
const MessagesPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const sessions = useBossStore((s) => s.sessions);
  const [tab, setTab] = useState<MessagesTab>('all');
  const [noticeDismissed, setNoticeDismissed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');

  const visible = sessions
    .filter((s) => !s.disliked)
    .filter((s) => (tab === 'newGreeting' ? s.isGreeting : tab === 'chatOnly' ? !s.isGreeting : true))
    .filter((s) => {
      if (!query.trim()) return true;
      const boss = C.bosses.find((b) => b.id === s.bossId);
      const job = C.jobs.find((j) => j.id === s.jobId);
      const company = C.companies.find((c) => c.id === boss?.companyId);
      const hay = `${boss?.name ?? ''} ${company?.name ?? ''} ${job?.title ?? ''} ${s.messages.map((m) => m.text).join(' ')}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    })
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));
  const greetingCount = sessions.filter((s) => s.isGreeting && s.unread > 0).length;

  const TAB_DEFS: { v: MessagesTab; label: string; badge?: number }[] = [
    { v: 'all', label: t.msgAll },
    { v: 'newGreeting', label: t.msgNewGreeting, badge: greetingCount },
    { v: 'chatOnly', label: t.msgChatOnly },
  ];

  return (
    <div className="flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${COLORS.headerTint} 0%, #FDEEE6 30%, #F5F6F7 140px)` }}>
      <div className="flex items-center justify-between px-4 pt-12">
        <span className="text-[26px] font-bold text-gray-900">{t.chats}</span>
        <IcBell size={22} className="text-gray-700" />
      </div>

      {!store.settings.notifyMsg && !noticeDismissed && (
        <div className="mx-4 mt-3 rounded-2xl bg-[#EAF6F5] p-4">
          <div className="flex items-center gap-2 text-[16px] font-semibold text-gray-900">
            <IcBell size={18} color={COLORS.primary} /> 开启消息通知
          </div>
          <div className="mt-1 text-[13px] text-gray-500">重要消息及时提醒,不再错过Boss的消息回复</div>
          <div className="mt-3 flex gap-3">
            <button
              {...action('messages.notice.dismiss', () => setNoticeDismissed(true), { params: {} })}
              className="flex-1 rounded-full border py-2 text-center text-[14px]"
              style={{ borderColor: COLORS.primary, color: COLORS.primary }}
            >
              取消
            </button>
            <button
              {...action('messages.notice.dismiss', () => { store.setSetting('notifyMsg', true); setNoticeDismissed(true); store.showToast('已开启消息通知'); }, { params: {} })}
              className="flex-1 rounded-full py-2 text-center text-[14px] text-white"
              style={{ backgroundColor: COLORS.primaryBtn }}
            >
              去设置
            </button>
          </div>
        </div>
      )}

      {searchOpen ? (
        <div className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5">
          <IcSearch size={16} className="text-gray-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索联系人、公司、聊天记录"
            className="min-w-0 flex-1 bg-transparent text-[14px] outline-none"
          />
          <button onClick={() => { setQuery(''); setSearchOpen(false); }} aria-label="取消搜索"><IcClose size={16} className="text-gray-400" /></button>
        </div>
      ) : (
        <button
          {...action('messages.search.focus', () => setSearchOpen(true), { params: {} })}
          className="mx-4 mt-3 flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5 text-[14px] text-gray-400"
        >
          <IcSearch size={16} /> 搜索联系人、公司、聊天记录
        </button>
      )}

      <div className="mt-3 flex items-center gap-5 px-4">
        {TAB_DEFS.map(({ v, label, badge }) => (
          <button
            key={v}
            {...action('messages.select.tab', () => { setTab(v); store.recordTaskAudit('messagesTab', v); }, { params: { value: v } })}
            className="relative pb-1.5"
          >
            <span className={tab === v ? 'text-[16px] font-bold text-gray-900' : 'text-[15px] text-gray-500'}>{label}</span>
            {badge ? <span className="ml-1 rounded-full bg-gray-200 px-1.5 text-[11px] text-gray-600">{badge}</span> : null}
            {tab === v && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-8 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'all' && !query.trim() && C.systemCards.map((card) => (
          <div key={card.id} className="flex items-center gap-3 px-1 py-3">
            <span className="relative flex h-12 w-12 items-center justify-center rounded-full" style={{ background: card.icon === 'ai' ? 'linear-gradient(135deg,#7AA8F8,#A67AF5)' : '#F7B94A' }}>
              {card.icon === 'ai' ? <IcAi size={22} color="white" /> : <IcPlus size={24} color="white" />}
              {card.unread ? <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D4F] px-1 text-[10px] text-white">{card.unread}</span> : null}
            </span>
            <div className="min-w-0 flex-1 border-b border-black/5 pb-3">
              <div className="flex items-center justify-between">
                <span className="truncate text-[16px] font-medium text-gray-900">{card.title}</span>
                <span className="shrink-0 text-[12px] text-gray-400">{card.timeLabel}</span>
              </div>
              <div className="mt-0.5 truncate text-[13px] text-gray-500">{card.sub}</div>
            </div>
          </div>
        ))}

        {visible.map((s) => {
          const boss = C.bosses.find((b) => b.id === s.bossId)!;
          const job = C.jobs.find((j) => j.id === s.jobId)!;
          const company = C.companies.find((c) => c.id === boss.companyId)!;
          const last = s.messages[s.messages.length - 1];
          return (
            <button
              key={s.id}
              {...bindTap('messages.chat-open', {
                params: { sessionId: s.id },
                beforeTrigger: () => store.markSessionRead(s.id),
              })}
              className={`flex w-full items-center gap-3 px-1 py-3 text-left ${s.pinned ? 'rounded-xl bg-white/70' : ''}`}
            >
              <span className="relative shrink-0">
                <Avatar imgKey={boss.avatar} name={boss.name} size={48} />
                {s.unread > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF4D4F] px-1 text-[10px] text-white">{s.unread}</span>}
              </span>
              <div className="min-w-0 flex-1 border-b border-black/5 pb-3">
                <div className="flex items-center justify-between">
                  <span className="flex min-w-0 items-baseline gap-1.5">
                    <span className="shrink-0 text-[16px] font-medium text-gray-900">{s.remark || boss.name}</span>
                    <span className="truncate text-[12px] text-gray-400">{company.name}|{job.title.replace(/(.{10}).+/, '$1…')}</span>
                  </span>
                  <span className="shrink-0 text-[12px] text-gray-400">{job.salary}</span>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <span className="truncate text-[13px] text-gray-500">
                    {s.isGreeting && s.unread > 0 ? <span style={{ color: COLORS.accent }}>[新招呼] </span> : last.from === 'me' ? <span className="text-gray-400">[送达] </span> : ''}
                    {last.text}
                  </span>
                  <span className="shrink-0 text-[12px] text-gray-400">{s.lastTimeLabel}</span>
                </div>
              </div>
            </button>
          );
        })}

        {visible.length === 0 && <div className="py-16 text-center text-[14px] text-gray-400">没有找到匹配的会话</div>}

        <div className="py-6 text-center text-[13px] text-gray-400">以上是30天内的联系人</div>
      </div>
    </div>
  );
};

export default MessagesPage;
