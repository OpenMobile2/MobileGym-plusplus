// 关注/被关注列表(user.followList,/user/:userId/follows,frame:a7b8cd@t0045):
// 顶部用户名 + 关注/被关注双tab(带下划线) + 用户行列表(头像/昵称/城市/签名)。
// 入口 ?tab=followers 决定初始选中。当前用户:关注=follows.users,被关注=followers。
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, C, EmptyState } from '../components/ui';
import type { DoubanUser } from '../types';

type FLTab = 'following' | 'followers';

export default function UserFollowlistPage() {
  const { bindTap } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = useDoubanStore((s) => s.currentUser);
  const users = useDoubanStore((s) => s.users);
  const followUserIds = useDoubanStore((s) => s.follows.users);
  const followerIds = useDoubanStore((s) => s.followers);

  const rawId = routeParams.userId ?? 'self';
  const isSelf = rawId === 'self' || rawId === currentUser.id;
  const owner = useMemo(
    () => (isSelf ? currentUser : users.find((u) => u.id === rawId) ?? currentUser),
    [isSelf, rawId, users, currentUser],
  );

  const tab: FLTab = searchParams.get('tab') === 'followers' ? 'followers' : 'following';

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const list: DoubanUser[] = useMemo(() => {
    if (isSelf) {
      const ids = tab === 'following' ? followUserIds : followerIds;
      return ids.map((id) => userById.get(id)).filter((u): u is DoubanUser => !!u);
    }
    // 他人:从用户池取样(排除本人/该用户)构造一份可浏览的列表
    const pool = users.filter((u) => !u.isSelf && u.id !== owner.id);
    return tab === 'following' ? pool.slice(0, Math.max(1, Math.min(pool.length, 8))) : pool.slice(0, pool.length);
  }, [isSelf, tab, followUserIds, followerIds, userById, users, owner.id]);

  const switchTab = (t: FLTab) =>
    setSearchParams(
      (p) => {
        p.set('tab', t);
        return p;
      },
      { replace: true },
    );

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:‹ + 小头像 + 昵称 */}
      <TopBar
        title={
          <span className="inline-flex items-center gap-2">
            <Avatar src={owner.avatar} size={24} />
            <span className="truncate">{owner.name}</span>
          </span>
        }
      />
      {/* 关注/被关注 双tab:左置窄间距 + 黑短下划线 */}
      <div className="flex items-center gap-5 px-4 bg-white border-b shrink-0" style={{ borderColor: C.border }}>
        {([['following', '关注'], ['followers', '被关注']] as [FLTab, string][]).map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'followList.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => switchTab(t),
              })}
              className="py-3 bg-transparent border-none cursor-pointer text-[15px] relative"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {list.length === 0 ? (
          <EmptyState text={tab === 'following' ? '暂无关注' : '暂无粉丝'} />
        ) : (
          list.map((u, idx) => {
            // 部分行头像带橙星角标(确定性:按索引间隔点亮,非随机)
            const starred = idx % 3 === 0;
            const meta = [u.ipLocation, u.signature || '这个人很懒,什么都没留下'].filter(Boolean);
            return (
              <button
                key={u.id}
                {...bindTap('followList.user-open', { params: { userId: u.id } })}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white border-b text-left cursor-pointer"
                style={{ borderColor: '#F2F3F5' }}
              >
                <span className="relative shrink-0">
                  <Avatar src={u.avatar} size={44} />
                  {starred && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] text-white border-2 border-white"
                      style={{ background: C.orange }}
                      aria-hidden
                    >
                      ★
                    </span>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: C.text }}>{u.name}</div>
                  <div className="mt-0.5 text-xs truncate flex items-center" style={{ color: C.sub }}>
                    {meta.map((m, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <span className="mx-1.5 opacity-50">｜</span>}
                        <span className="truncate">{m}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
