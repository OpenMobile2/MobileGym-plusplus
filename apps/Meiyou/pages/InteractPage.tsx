/** 互动消息页(赞/回复/新增粉丝)。spec: message.interact */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, NOT_OPEN, useToast, Img, MY } from '../components/ui';
import { timeAgo } from '../components/PostCard';

const TABS = [
  { id: 'like', label: '赞' },
  { id: 'reply', label: '回复' },
  { id: 'fans', label: '新增粉丝' },
] as const;

export default function InteractPage() {
  const { bindTap, go } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const [sp, setSp] = useSearchParams();
  const cur = sp.get('tab') ?? 'like';
  // 页内 tab 切换用 replace,避免堆历史(否则 back 先弹 tab 变化而非退回消息页)
  const setTab = (id: string) => setSp((p) => { p.set('tab', id); return p; }, { replace: true });
  const notices = useMeiyouStore((s) => s.notices);
  const markRead = useMeiyouStore((s) => s.markRead);
  const recordNoticeOpened = useMeiyouStore((s) => s.recordNoticeOpened);
  React.useEffect(() => { markRead('interact'); }, [markRead]);

  const kindFor = cur === 'reply' ? 'reply' : cur === 'fans' ? 'fan' : 'like';
  const list = notices.filter((n) => n.kind === kindFor);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F4] relative">
      <TopBar
        title="互动消息"
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'interact.gift.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="text-[13px] px-2 h-7 rounded-full text-white border-none cursor-pointer"
            style={{ background: MY.primary }}
          >
            领惊喜
          </button>
        }
      />
      <div className="px-3 py-2 text-[12px]" style={{ color: MY.primary }}>真诚交流,从一句回应开始</div>
      <div className="flex bg-white border-b border-[#EEE]">
        {TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'interact.tab.select.target' }, { params: { target: t.id }, onTrigger: () => setTab(t.id) })}
            className="flex-1 h-10 bg-transparent border-none cursor-pointer text-[14px]"
            style={{ color: cur === t.id ? MY.primary : '#666', fontWeight: cur === t.id ? 600 : 400 }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="interact-list" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-20 text-[#999]">
            <Img src="/@app-assets/Meiyou/gen/illu_empty.png" className="w-32 h-32 object-contain opacity-90" />
            <div className="mt-2 text-[13px]">暂无消息</div>
          </div>
        ) : (
          list.map((n) => (
            <button
              key={n.id}
              {...bindTap({ kind: 'action', id: 'interact.notice.open' }, {
                params: { target: n.id },
                onTrigger: () => {
                  recordNoticeOpened(n.id);
                  go('meiyou.postdetail-open', { id: n.postId ?? '' });
                },
              })}
              className="w-full flex items-center gap-3 px-3 py-3 bg-white border-b border-[#F2F2F4] cursor-pointer text-left"
            >
              <Img src={n.user.avatar} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[#1A1A1A]">{n.user.name}</div>
                <div className="text-[12px] text-[#999] truncate">{n.text}</div>
              </div>
              <div className="text-[11px] text-[#BBB]">{timeAgo(n.createdAt)}</div>
            </button>
          ))
        )}
      </div>
      {toast}
    </div>
  );
}
