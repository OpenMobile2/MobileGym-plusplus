import React from 'react';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, Img, TopBar, NOT_OPEN } from '../components/ui';

/** 我的数字纪念票夹(r7;深色页) */
export default function TicketFolderPage() {
  const { bindTap } = useMaoyanGestures();
  const [toast, showToast] = useToast();
  const [tab, setTab] = React.useState('movie');
  const movies = useMaoyanStore((st) => st.movies);
  const watched = useMaoyanStore((st) => st.watched);
  const session = useMaoyanStore((st) => st.session);

  const candidates = movies.filter((m) => watched[m.id] || m.status === 'hot').slice(0, 3);

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground="light" style={{ background: '#181820' }}>
      {toast}
      <TopBar title={<span className="text-white">我的数字纪念票夹</span>} variant="dark" bg="#181820" />
      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="folder-list" data-scroll-direction="vertical">
        <div className="mt-3 rounded-xl p-4" style={{ background: 'linear-gradient(135deg,#232330,#2E2E42)' }}>
          <div className="text-[18px] font-bold text-[#E8D5A3]">数字纪念票夹</div>
          <div className="flex items-center mt-2">
            <Img src={session.avatar} className="w-8 h-8 rounded-full object-cover" />
            <span className="ml-2 text-[12px] text-white/80">{session.nick}</span>
            <span className="ml-auto text-[10px] text-white/50">纪念票根:0 演出待领取 · 赠礼记录 · 票根订单</span>
          </div>
          <div className="flex gap-4 mt-3 text-[13px]">
            {[['movie', '电影'], ['show', '演出']].map(([t, label]) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'folder.tab.select.target' }, { params: { target: t }, onTrigger: () => setTab(t) })}
                className={`bg-transparent border-none cursor-pointer pb-1 ${tab === t ? 'text-[#E8D5A3] font-bold border-b-2 border-[#E8D5A3]' : 'text-white/50'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 h-28 rounded-lg border border-dashed border-white/20 flex items-center justify-center text-[12px] text-white/40">
            {tab === 'movie' ? '数字票根 · 暂无收藏' : '演出票根 · 暂无收藏'}
          </div>
        </div>

        <div className="mt-4 text-[14px] font-semibold text-white/90">领取数字票根</div>
        <div className="text-[11px] text-white/40 mt-0.5">以下影片正参与购票领取数字票根活动,快来试试吧</div>
        {candidates.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 mt-3">
            <Img src={m.poster} className="w-10 h-[54px] object-cover rounded" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-white/90 truncate">{m.title}</div>
              <div className="text-[10px] text-white/40">{m.score > 0 ? `${m.score}分 猫眼观众评分` : `${(m.wishCount / 10000).toFixed(1)}万人想看`}</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'folder.activity.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="shrink-0 text-[11px] text-[#181820] bg-[#E8D5A3] rounded-full px-3 py-1 border-none cursor-pointer"
            >
              参加活动
            </button>
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}
