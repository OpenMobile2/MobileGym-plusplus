import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, fmtCount, TopBar, FollowBtn } from '../components/ui';

export default function FansPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const users = useWeiboStore((st) => st.users);
  const followUser = useWeiboStore((st) => st.followUser);
  const tab = searchParams.get('tab') ?? '新的好友';

  const fans = users.filter((u) => u.followsMe);
  const recommend = users.filter((u) => !u.followedByMe && !u.followsMe).slice(0, 6);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <TopBar backBinding={bindBack()} title={s.fans} right={
        <button onClick={() => toast(s.notOpen)} className="text-[13px] text-[#5B5B5B] bg-transparent border-none cursor-pointer whitespace-nowrap">发现用户</button>
      } />
      <div className="flex items-center gap-6 px-4 h-10 shrink-0 border-b border-[#F7F7F7]">
        {(['新的好友', '全部粉丝'] as const).map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'fans.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { t === '新的好友' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FFB300]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="fans-list" data-scroll-direction="vertical">
        {tab === '新的好友' && (
          <div className="px-3 py-2 text-[13px] text-[#9A9A9A]">{s.emptyFans} 全部&gt;</div>
        )}
        {fans.map((u) => (
          <div key={u.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#FAFAFA]">
            <div {...bindTap('fans.user-open', { params: { id: u.id } })} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
              <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="min-w-0">
                <div className="text-[14px] text-[#E68A3C] truncate">{u.name}</div>
                <div className="text-[12px] text-[#9A9A9A] truncate">{u.intro} · 来自微博推荐</div>
              </div>
            </div>
            {u.followedByMe ? (
              <FollowBtn mutual binding={{}} onClick={() => toast('已是互相关注')} />
            ) : (
              <FollowBtn
                refollow
                binding={bindTap({ kind: 'action', id: 'fans.refollow.submit' }, {
                  params: { userId: u.id },
                  onTrigger: () => followUser(u.id),
                })}
              />
            )}
          </div>
        ))}
        <div className="px-3 py-2 text-[13px] text-[#7F7F7F]">你可能感兴趣</div>
        {recommend.map((u) => (
          <div key={u.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#FAFAFA]">
            <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#E68A3C] truncate">{u.name}</div>
              <div className="text-[12px] text-[#9A9A9A] truncate">粉丝{fmtCount(u.fans)}</div>
            </div>
            <FollowBtn binding={bindTap({ kind: 'action', id: 'fans.recoFollow.submit' }, { params: { userId: u.id }, onTrigger: () => followUser(u.id) })} />
          </div>
        ))}
      </div>
      {toastNode}
    </div>
  );
}
