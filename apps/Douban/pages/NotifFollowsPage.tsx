// 关注/被关注/发现友邻(notif.follows,frame:ac79b0@t0012/t0013)。
// 三 Tab URL 驱动(?tab=following|follower|discover,默认 follower:从提醒「xx关注了你」进入)。
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, EmptyState, TopBar } from '../components/ui';
import type { DoubanUser } from '../types';

type FollowTab = 'following' | 'follower' | 'discover';

const TABS: { id: FollowTab; label: string }[] = [
  { id: 'following', label: '关注' },
  { id: 'follower', label: '被关注' },
  { id: 'discover', label: '发现友邻' },
];

export default function NotifFollowsPage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const users = useDoubanStore((s) => s.users);
  const follows = useDoubanStore((s) => s.follows);
  const followers = useDoubanStore((s) => s.followers);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);

  const tab = (searchParams.get('tab') as FollowTab) || 'follower';

  const userOf = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u]));
    return (id: string) => m.get(id);
  }, [users]);

  const followingUsers = useMemo(
    () => follows.users.map(userOf).filter((u): u is DoubanUser => Boolean(u)),
    [follows.users, userOf],
  );
  const followerUsers = useMemo(
    () => followers.map(userOf).filter((u): u is DoubanUser => Boolean(u)),
    [followers, userOf],
  );
  const discoverUsers = useMemo(
    () =>
      users.filter(
        (u) => !u.isSelf && !follows.users.includes(u.id) && !followers.includes(u.id),
      ),
    [users, follows.users, followers],
  );

  const switchTab = (t: FollowTab) =>
    setSearchParams(
      (p) => {
        p.set('tab', t);
        return p;
      },
      { replace: true },
    );

  const toggleFollow = (userId: string) => {
    if (follows.users.includes(userId)) {
      unfollowUser(userId);
      toast('已取消关注');
    } else {
      followUser(userId);
      toast('关注成功');
    }
  };

  /** 用户行:头像+名字+「城市 ｜ 签名」副行(IMG_0482);关注/被关注 tab 行右侧无按钮 */
  const renderRow = (u: DoubanUser, rowTab: FollowTab) => {
    const iFollow = follows.users.includes(u.id);
    const sub = [u.ipLocation, u.signature].filter(Boolean).join(' ｜ ');
    return (
      <div key={u.id} className="flex items-center gap-3 px-4 py-3 bg-white">
        <div
          {...bindTap('follows.user-open', { params: { userId: u.id } })}
          className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
        >
          <Avatar src={u.avatar} size={42} />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-medium truncate" style={{ color: C.text }}>{u.name}</div>
            {sub && <div className="mt-0.5 text-[13px] truncate" style={{ color: C.sub }}>{sub}</div>}
          </div>
        </div>
        {rowTab === 'discover' && (
          <button
            {...bindTap({ kind: 'action', id: 'follows.discover.follow' }, {
              params: { userId: u.id },
              onTrigger: () => toggleFollow(u.id),
            })}
            className="px-4 h-8 rounded-full text-sm cursor-pointer shrink-0"
            style={
              iFollow
                ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
                : { background: C.green, color: '#fff', border: 'none' }
            }
          >
            {iFollow ? '已关注' : '关注'}
          </button>
        )}
      </div>
    );
  };

  const list =
    tab === 'following' ? followingUsers : tab === 'follower' ? followerUsers : discoverUsers;

  return (
    /* 列表结束后为明显中灰底(frame:ac79b0@t0015) */
    <div className="flex flex-col h-full" style={{ background: '#EBECED' }} data-status-bar-foreground="dark">
      <TopBar
        borderless
        title={
          <span className="inline-flex items-center gap-1.5">
            <Avatar src={currentUser.avatar} size={22} />
            <span className="text-[15px]">{currentUser.name}</span>
          </span>
        }
      />
      {/* 三 Tab(与「N人」同处白区,无下边线) */}
      <div className="flex bg-white shrink-0">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'follows.tab.select.target' }, {
                params: { target: t.id },
                onTrigger: () => switchTab(t.id),
              })}
              className="px-5 py-2.5 bg-transparent border-none cursor-pointer text-[15px] relative"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {t.label}
              {active && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
                  style={{ background: C.text }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center justify-between px-4 py-2.5 text-sm bg-white" style={{ color: C.text }}>
          <span>{tab === 'discover' ? '可能感兴趣的人' : `${list.length}人`}</span>
          {tab === 'following' && (
            <button
              onClick={() => toast('该功能暂未开放')}
              className="w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer"
              style={{ background: '#F2F3F5', color: C.sub }}
              aria-label="搜索关注"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
        {list.length === 0 ? (
          <EmptyState text={tab === 'follower' ? '还没有人关注你' : '暂无内容'} icon="cat" />
        ) : (
          list.map((u) => renderRow(u, tab))
        )}
      </div>
    </div>
  );
}
