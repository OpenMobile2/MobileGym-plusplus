import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard, fmtTime } from '../components/StatusCard';
import { useStrings, useToast, Img, VBadge, VipCrown, fmtCount, TopBar, EmptyState } from '../components/ui';
import { IcBack, IcDiscover, IcMore } from '../res/icons';

const P_TABS = ['动态', '微博', '视频号', '相册'] as const;

export default function ProfileOtherPage() {
  const s = useStrings();
  const { id = '' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const users = useWeiboStore((st) => st.users);
  const statuses = useWeiboStore((st) => st.statuses);
  const supertopics = useWeiboStore((st) => st.supertopics);
  const followUser = useWeiboStore((st) => st.followUser);
  const unfollowUser = useWeiboStore((st) => st.unfollowUser);

  const user = users.find((u) => u.id === id);
  const tab = searchParams.get('tab') ?? '动态';
  const menuOpen = searchParams.get('menu') === 'followed';
  const posts = statuses.filter((x) => x.userId === id);
  const joinedSt = supertopics.filter((t) => t.followed).slice(0, 2);

  if (!user) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar backBinding={bindBack()} title="主页" />
        <div className="flex-1 flex items-center justify-center text-[#9A9A9A]">用户不存在</div>
      </div>
    );
  }

  const closeMenu = () => setSearchParams((p) => { p.delete('menu'); return p; }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      {/* 头图区 */}
      <div className="relative shrink-0">
        <div className="h-36 overflow-hidden">
          <Img src={user.headerImage} label={user.name[0]} className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-0 left-0 right-0 flex items-center h-11 px-2">
          <button {...bindBack()} className="bg-black/25 rounded-full border-none cursor-pointer text-white p-1"><IcBack size={20} /></button>
          <span className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'profileOther.more.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-black/25 rounded-full border-none cursor-pointer text-white p-1 mr-2"
          >
            <IcDiscover size={17} />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'profileOther.more.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-black/25 rounded-full border-none cursor-pointer text-white p-1"
          >
            <IcMore size={17} />
          </button>
        </div>
        <div className="absolute -bottom-8 left-4">
          <Img src={user.avatar} label={user.name[0]} className="w-16 h-16 rounded-full object-cover border-[3px] border-white" />
        </div>
      </div>

      {/* 信息区 */}
      <div className="bg-white px-4 pt-10 pb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[18px] font-bold text-[#1A1A1A]">{user.name}</span>
          <VBadge type={user.verified} />
          <VipCrown level={user.vipLevel} />
          <span className="flex-1" />
          {user.followedByMe ? (
            <button
              {...bindTap({ kind: 'action', id: 'profileOther.followedMenu.open' }, {
                onTrigger: () => setSearchParams((p) => { p.set('menu', 'followed'); return p; }, { replace: true }),
              })}
              className="h-8 px-4 rounded-full text-[13px] text-[#7F7F7F] border border-[#DDDDDD] bg-white cursor-pointer"
            >
              ✓ {s.followed}
            </button>
          ) : (
            <button
              {...bindTap({ kind: 'action', id: 'profileOther.follow.submit' }, {
                params: { userId: user.id },
                onTrigger: () => { followUser(user.id); toast(s.followSuccess); },
              })}
              className="h-8 px-4 rounded-full text-[13px] text-white bg-[#FF8200] border-none cursor-pointer"
            >
              {s.follow}
            </button>
          )}
          <button
            {...bindTap('profileOther.chat-open', { params: { id: user.id } })}
            className="h-8 px-4 rounded-full text-[13px] text-[#FF8200] border border-[#FF8200] bg-white cursor-pointer ml-2"
          >
            {s.dm}
          </button>
        </div>
        <div className="flex gap-5 mt-2 text-[13px]">
          <button
            {...bindTap({ kind: 'action', id: 'profileOther.counts.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-transparent border-none cursor-pointer p-0 text-[#1A1A1A]"
          >
            <b>{fmtCount(user.fans)}</b> <span className="text-[#7F7F7F]">{s.fans}</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'profileOther.counts.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-transparent border-none cursor-pointer p-0 text-[#1A1A1A]"
          >
            <b>{user.follows}</b> <span className="text-[#7F7F7F]">{s.followsCount}</span>
          </button>
          <span><b>{fmtCount(user.interactions ?? 0)}</b> <span className="text-[#7F7F7F]">转评赞</span></span>
        </div>
        {user.intro && <div className="text-[13px] text-[#7F7F7F] mt-1.5">{user.verified === 'person' ? '认证:' : ''}{user.intro}</div>}
      </div>

      {/* tab 条 */}
      <div className="flex items-center gap-6 px-4 h-10 bg-white border-t border-[#FAFAFA] shrink-0">
        {P_TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'profileOther.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { t === '动态' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="profile-other" data-scroll-direction="vertical">
        {tab === '动态' && (
          <>
            <div className="bg-white px-4 py-3 mb-2">
              <div className="text-[14px] font-semibold mb-1">他今天发布了{posts.length}条微博,获得了{fmtCount(posts.reduce((a, b) => a + b.likes, 0))}次互动</div>
              <div className="text-[12px] text-[#9A9A9A]">上周最热内容 · 1年前的今天,他发博了</div>
            </div>
            {joinedSt.length > 0 && (
              <div className="bg-white px-4 py-3 mb-2">
                <div className="text-[14px] font-semibold mb-2">他最近参与的超话</div>
                {joinedSt.map((t) => (
                  <button
                    key={t.id}
                    {...bindTap('profileOther.supertopic-open', { params: { id: t.id } })}
                    className="flex items-center gap-2.5 w-full py-1.5 bg-transparent border-none cursor-pointer text-left"
                  >
                    <Img src={t.cover} label={t.name[0]} className="w-9 h-9 rounded object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] text-[#1A1A1A]">{t.name}超话</div>
                      <div className="text-[11px] text-[#9A9A9A]">{fmtCount(t.posts)}帖子 {fmtCount(t.fans)}粉丝</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="bg-white px-4 py-2 mb-2 text-[14px] font-semibold">他近期的热门内容</div>
            {posts.slice(0, 2).map((st) => (
              <StatusCard key={st.id} status={st} openTransition="profileOther.status-open" showFollow={false} />
            ))}
          </>
        )}
        {tab === '微博' && (
          posts.length
            ? posts.map((st) => <StatusCard key={st.id} status={st} openTransition="profileOther.status-open" showFollow={false} />)
            : <EmptyState text="TA 还没有发过微博" />
        )}
        {(tab === '视频号' || tab === '相册') && (
          posts.flatMap((x) => x.images).length ? (
            <div className="grid grid-cols-3 gap-0.5 px-0.5">
              {posts.flatMap((x) => x.images).map((img, i) => (
                <Img key={i} src={img} label="图" className="w-full aspect-square object-cover" />
              ))}
            </div>
          ) : <EmptyState text="暂无内容" />
        )}
        <div className="h-4" />
      </div>

      {/* 已关注菜单 */}
      {menuOpen && (
        <div className="absolute inset-0 z-40" onClick={closeMenu}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute right-4 top-52 bg-white rounded-xl py-1 w-40 shadow-lg">
            {['添加桌面组件', '设为特别关注', '设置分组', '设置备注'].map((item) => (
              <button
                key={item}
                {...bindTap({ kind: 'action', id: 'profileOther.more.stub' }, { onTrigger: () => { toast(s.notOpen); closeMenu(); } })}
                className="block w-full px-4 py-2.5 text-[14px] text-[#1A1A1A] bg-transparent border-none cursor-pointer text-left"
              >
                {item}
              </button>
            ))}
            <button
              {...bindTap({ kind: 'action', id: 'profileOther.unfollow.submit' }, {
                params: { userId: user.id },
                onTrigger: () => { unfollowUser(user.id); closeMenu(); },
              })}
              className="block w-full px-4 py-2.5 text-[14px] text-[#FF3852] bg-transparent border-none cursor-pointer text-left"
            >
              {s.unfollowAction}
            </button>
          </div>
        </div>
      )}
      {toastNode}
    </div>
  );
}
