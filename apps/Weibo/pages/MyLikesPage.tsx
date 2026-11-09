import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, TopBar, EmptyState } from '../components/ui';

const TABS = ['赞', '收藏', '视频', '文章', '问答', '图片'] as const;

export default function MyLikesPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();

  const statuses = useWeiboStore((st) => st.statuses);
  const likedIds = useWeiboStore((st) => st.likedStatusIds);
  const favorites = useWeiboStore((st) => st.favorites);
  const removeDeletedLike = useWeiboStore((st) => st.removeDeletedLike);

  const tab = searchParams.get('tab') ?? '赞';
  const liked = statuses.filter((x) => likedIds.includes(x.id));
  const faved = statuses.filter((x) => favorites.includes(x.id));
  const shown = tab === '收藏' ? faved : tab === '视频' ? liked.filter((x) => x.isVideo) : tab === '图片' ? liked.filter((x) => x.images.length) : tab === '赞' ? liked : [];

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="我的赞" />
      <div className="flex items-center gap-4 px-4 h-10 bg-white overflow-x-auto shrink-0" data-scroll-container="likes-tabs" data-scroll-direction="horizontal">
        {TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'myLikes.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { t === '赞' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 whitespace-nowrap ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="mylikes-list" data-scroll-direction="vertical">
        {shown.length ? (
          <>
            <div className="px-4 py-1 text-[13px] text-[#7F7F7F]">2026/07</div>
            {shown.map((st) => <StatusCard key={st.id} status={st} openTransition="myLikes.status-open" showFollow={false} />)}
            {tab === '赞' && (
              <div className="bg-white mx-0 px-4 py-3 flex items-center">
                <span className="text-[13px] text-[#9A9A9A] flex-1">抱歉,此微博已被删除。查看帮助:网页链接</span>
                <button
                  {...bindTap({ kind: 'action', id: 'myLikes.deleted.remove' }, {
                    params: { statusId: 'deleted' },
                    onTrigger: () => removeDeletedLike('deleted'),
                  })}
                  className="text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer shrink-0"
                >
                  删除
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState text={tab === '收藏' ? '还没有收藏内容' : '这个分类下暂无内容'} hint={tab === '收藏' ? '在微博详情页点星标即可收藏' : undefined} />
        )}
      </div>
    </div>
  );
}
