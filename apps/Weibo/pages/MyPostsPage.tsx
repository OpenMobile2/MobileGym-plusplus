import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, TopBar, EmptyState } from '../components/ui';
import { IcSettings } from '../res/icons';

const TABS = ['全部', '原创', '视频', '文章', '图片'] as const;

export default function MyPostsPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const statuses = useWeiboStore((st) => st.statuses);
  const myPostIds = useWeiboStore((st) => st.myPostIds);
  const tab = searchParams.get('tab') ?? '全部';

  const mine = statuses.filter((x) => x.userId === 'me' || myPostIds.includes(x.id));
  const filtered = mine.filter((x) => {
    if (tab === '原创') return !x.repostOf;
    if (tab === '视频') return x.isVideo;
    if (tab === '图片') return x.images.length > 0;
    if (tab === '文章') return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      <TopBar backBinding={bindBack()} title={s.myWeibo} right={
        <button {...bindTap({ kind: 'action', id: 'myPosts.misc.stub' }, { onTrigger: () => toast(s.notOpen) })} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-0">
          <IcSettings size={18} />
        </button>
      } />
      <div className="flex items-center gap-5 px-4 h-10 bg-white shrink-0">
        {TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'myPosts.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { t === '全部' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
          </button>
        ))}
      </div>
      <div className="flex items-center bg-white px-4 py-2 border-t border-[#FAFAFA] shrink-0">
        <button {...bindTap({ kind: 'action', id: 'myPosts.misc.stub' }, { onTrigger: () => toast(s.notOpen) })} className="flex-1 h-8 bg-[#F5F5F5] rounded-full text-left px-3 text-[13px] text-[#9A9A9A] border-none cursor-pointer">
          🔍 搜我的微博
        </button>
      </div>
      <div className="flex items-center bg-white px-4 py-1.5 shrink-0">
        <span className="text-[13px] text-[#7F7F7F]">全部微博({mine.length})</span>
        <span className="flex-1" />
        <button {...bindTap({ kind: 'action', id: 'myPosts.misc.stub' }, { onTrigger: () => toast(s.notOpen) })} className="text-[13px] text-[#7F7F7F] bg-transparent border-none cursor-pointer">筛选</button>
      </div>
      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="myposts-list" data-scroll-direction="vertical">
        {filtered.length ? filtered.map((st) => (
          <div key={st.id}>
            <div className="bg-white px-3 pt-2 text-[12px] text-[#9A9A9A]">🔓 公开 ∨</div>
            <StatusCard status={st} openTransition="myPosts.status-open" showFollow={false} />
          </div>
        )) : <EmptyState text="这个分类下还没有微博" />}
      </div>
      {toastNode}
    </div>
  );
}
