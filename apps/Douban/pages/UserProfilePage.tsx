// 他人主页(user.profile,/user/:userId,IMG_0244-0275,frame:a7b8cd@*):
// 头图(头像/昵称/ID/IP/签名) + 关注/被关注 + 右侧操作组(送礼🎁/关注/私信💬) +
// 关注成功后「你可能还感兴趣」推荐条 + 4tab(主页/动态/相册/徽章N) + 主页模块流。
// 三档隐私:public / albumHidden(相册tab被挡) / allHidden(全主页挡,无tab)。
// 关注→toast+推荐条;已关注→取关确认sheet;送礼物→GiftSheet(购买并送出=余额不足)。
import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, Img, C, fmtCount, EmptyState, SegRow, TheEnd, fmtAbsDateTime } from '../components/ui';
import { GiftSheet, GIFTS, type GiftTab } from '../components/GiftSheet';
import { payWithSystem } from '../capabilities';
import { setImageViewerPayload } from './MediaImageviewerPage';

type UTab = 'home' | 'status' | 'album' | 'badge';
type StatusFilter = 'status' | 'all';

const BLOCKED_ALBUM = '由于用户的设置,无法查看更多内容';
const BLOCKED_ALL = '由于用户的设置,无法查看主页内容';

export default function UserProfilePage() {
  const { bindTap, bindBack } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const users = useDoubanStore((s) => s.users);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const subjects = useDoubanStore((s) => s.subjects);
  const top10s = useDoubanStore((s) => s.top10s);
  const essaySets = useDoubanStore((s) => s.essaySets);
  const groups = useDoubanStore((s) => s.groups);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const followUserIds = useDoubanStore((s) => s.follows.users);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);
  const sendGift = useDoubanStore((s) => s.sendGift);

  const userId = routeParams.userId ?? '';
  const user = useMemo(() => users.find((u) => u.id === userId), [users, userId]);
  const isFollowing = followUserIds.includes(userId);

  const tab: UTab = (['home', 'status', 'album', 'badge'] as UTab[]).find((t) => t === searchParams.get('utab')) ?? 'home';
  const statusFilter: StatusFilter = searchParams.get('sf') === 'all' ? 'all' : 'status';
  const unfollowSheet = searchParams.get('unfollowSheet') === 'open';
  const giftOpen = searchParams.get('gift') === 'open';
  const giftTab: GiftTab = searchParams.get('giftTab') === 'store' ? 'store' : 'bag';
  const giftId = searchParams.get('giftId') ?? GIFTS[0].id;
  const [recommendOpen, setRecommendOpen] = useState(false);
  const [top10Open, setTop10Open] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const subjById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const userTop10 = useMemo(() => top10s.find((t) => t.ownerId === userId), [top10s, userId]);
  const top10Subjects = useMemo(
    () => (userTop10?.subjectIds ?? []).map((id) => subjById.get(id)).filter(Boolean),
    [userTop10, subjById],
  );
  const userEssaySets = useMemo(() => essaySets.filter((e) => e.ownerId === userId), [essaySets, userId]);
  const userGroups = useMemo(() => groups.filter((g) => g.joined).slice(0, 4), [groups]);
  const userBroadcasts = useMemo(
    () => broadcasts.filter((b) => b.authorId === userId).sort((a, b) => b.createdAt - a.createdAt),
    [broadcasts, userId],
  );
  const statusList = useMemo(
    () => (statusFilter === 'all' ? userBroadcasts : userBroadcasts.filter((b) => !b.isRepost)),
    [userBroadcasts, statusFilter],
  );
  const recommendUsers = useMemo(
    () => users.filter((u) => !u.isSelf && u.id !== userId && !followUserIds.includes(u.id)).slice(0, 6),
    [users, userId, followUserIds],
  );
  const albumImages = useMemo(
    () => userBroadcasts.flatMap((b) => b.images).filter(Boolean).slice(0, 8),
    [userBroadcasts],
  );

  const setParam = (key: string, val: string | null) =>
    setSearchParams(
      (p) => {
        if (val === null) p.delete(key);
        else p.set(key, val);
        return p;
      },
      { replace: true },
    );

  if (!user) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <TopBar title="他人主页" />
        <EmptyState text="用户不存在" />
      </div>
    );
  }

  const privacy = user.privacy;
  const allBlocked = privacy === 'allHidden';
  const albumBlocked = privacy === 'albumHidden';

  const onFollow = () => {
    followUser(userId);
    toast('关注成功');
    setRecommendOpen(true);
  };
  const onConfirmUnfollow = () => {
    unfollowUser(userId);
    toast('取消关注成功');
    setParam('unfollowSheet', null);
    setRecommendOpen(false);
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="light">
      <TopBar
        dark
        borderless
        bg="transparent"
        title=""
        right={
          <button
            {...bindTap({ kind: 'action', id: 'user.more.menu.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-xl"
            style={{ color: C.darkText }}
            aria-label="更多"
          >
            ⋯
          </button>
        }
      />

      <div
        className="flex-1 overflow-y-auto pb-6 -mt-11"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 头图区(深色、头像居中、由头像虚化铺底 + 深色叠加 + 白字) */}
        <div className="relative px-4 pt-12 pb-4 overflow-hidden">
          {/* 头像虚化铺底 */}
          <div
            className="absolute inset-0 -z-0"
            style={{
              backgroundImage: `url(${user.avatar})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(40px)',
              transform: 'scale(1.4)',
              opacity: 0.85,
            }}
          />
          <div className="absolute inset-0 -z-0" style={{ background: 'linear-gradient(180deg,rgba(20,22,26,0.35),rgba(20,22,26,0.72))' }} />

          <div className="relative">
            {/* 居中头像 */}
            <div className="flex justify-center pt-2 pb-3">
              <Avatar src={user.avatar} size={92} className="border-2 border-white shadow" />
            </div>

            {/* 昵称/ID + 右侧操作(已关注/私信深色方块) */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold truncate text-white">{user.name}</div>
                <div className="text-xs mt-1 text-white/70">ID: {user.id} / IP: {user.ipLocation}</div>
              </div>
              <div className="flex items-center gap-2.5 pt-1 shrink-0">
                {isFollowing ? (
                  <button
                    {...bindTap({ kind: 'action', id: 'user.follow.unfollowSheet.open' }, { onTrigger: () => setParam('unfollowSheet', 'open') })}
                    className="h-9 px-4 rounded-full text-sm cursor-pointer border-none"
                    style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                  >
                    ✓ 已关注
                  </button>
                ) : (
                  <button
                    {...bindTap({ kind: 'action', id: 'user.follow.toggle.on' }, { onTrigger: onFollow })}
                    className="h-9 px-4 rounded-full text-sm cursor-pointer border-none"
                    style={{ background: C.green, color: '#fff' }}
                  >
                    + 关注
                  </button>
                )}
                {/* 私信:深色圆角方块气泡图标 */}
                <button
                  {...bindTap('user.chat-open', { params: { userId } })}
                  className="w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer border-none"
                  style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                  aria-label="私信"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 01-.9-3.8 8.5 8.5 0 018.5-8.5A8.38 8.38 0 0121 11.5z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* 关于我 ▾ 可展开简介(纯展示态,不改 URL、不产生导航/动作绑定) */}
            <button
              onClick={() => setAboutOpen((v) => !v)}
              className="mt-2 flex items-center gap-1 bg-transparent border-none cursor-pointer text-sm text-white/75"
            >
              <span>关于我</span>
              <span>{aboutOpen ? '▴' : '▾'}</span>
            </button>
            {aboutOpen && (
              <div className="mt-1 text-[13px] leading-relaxed text-white/85">
                {user.signature || '这个人很懒,只留下了满墙的观影记录和一句待续的书评。偶尔冒泡,长期潜水。'}
              </div>
            )}

            <div className="mt-3 h-px" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {/* 关注/被关注 + 送礼物 同一行 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-6">
                <button {...bindTap('user.followList-open', { params: { userId } })} className="bg-transparent border-none cursor-pointer text-left">
                  <span className="text-sm text-white/70">关注 </span>
                  <span className="font-semibold text-white">{user.following}</span>
                </button>
                <button {...bindTap('user.followList-open', { params: { userId } })} className="bg-transparent border-none cursor-pointer text-left">
                  <span className="text-sm text-white/70">被关注 </span>
                  <span className="font-semibold text-white">{fmtCount(user.followers)}</span>
                </button>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'user.gift.sheet.open' }, {
                  onTrigger: () => setSearchParams((p) => { p.set('gift', 'open'); p.set('giftTab', 'store'); return p; }),
                })}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-sm text-white"
                aria-label="送礼物"
              >
                <span className="text-lg">🎁</span>
                <span>送礼物</span>
              </button>
            </div>
          </div>
        </div>

        {/* 你可能还感兴趣 推荐条(关注成功后展开,展示型不可点导航) */}
        {recommendOpen && isFollowing && recommendUsers.length > 0 && (
          <div className="bg-white px-4 py-3 border-b" style={{ borderColor: '#F2F3F5' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: C.text }}>你可能还感兴趣</span>
              <button onClick={() => setRecommendOpen(false)} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>✕</button>
            </div>
            <div className="flex gap-3 overflow-x-auto" data-scroll-container="recommend-strip" data-scroll-direction="horizontal">
              {recommendUsers.map((u) => (
                <div key={u.id} className="w-14 shrink-0 flex flex-col items-center gap-1">
                  <Avatar src={u.avatar} size={44} />
                  <span className="text-[10px] truncate w-full text-center" style={{ color: C.text }}>{u.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {allBlocked ? (
          /* 隐私档2:全主页被挡,无tab */
          <div className="py-16">
            <EmptyState text={BLOCKED_ALL} />
          </div>
        ) : (
          <>
            {/* 4tab条:左置窄间距 + 黑短下划线,徽章右缘 */}
            <div className="flex items-center bg-white border-b shrink-0" style={{ borderColor: C.border }}>
              <div className="flex items-center gap-5 px-4 flex-1">
                {([['home', '主页'], ['status', '动态'], ['album', '相册']] as [UTab, string][]).map(([t, label]) => {
                  const active = tab === t;
                  return (
                    <button
                      key={t}
                      {...bindTap({ kind: 'action', id: 'user.tab.select.target' }, { params: { target: t }, onTrigger: () => setParam('utab', t) })}
                      className="py-3 bg-transparent border-none cursor-pointer text-[15px] relative"
                      style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
                    >
                      {label}
                      {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
                    </button>
                  );
                })}
              </div>
              <button
                {...bindTap('user.badgeWall-open', { params: { userId } })}
                className="pr-4 py-3 bg-transparent border-none cursor-pointer text-[15px]"
                style={{ color: tab === 'badge' ? C.text : C.sub, fontWeight: tab === 'badge' ? 700 : 400 }}
              >
                🏅徽章 {user.badges}
              </button>
            </div>

            {/* 主页 */}
            {tab === 'home' && (
              <div className="p-3 space-y-3">
                {/* TOP10 展示卡 */}
                {top10Subjects.length > 0 && (
                  <div className="rounded-2xl bg-white p-4">
                    <button
                      {...bindTap({ kind: 'action', id: 'user.top10.card.toggle' }, { onTrigger: () => setTop10Open((v) => !v) })}
                      className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer"
                    >
                      <span className="text-[15px] font-bold" style={{ color: C.text }}>{userTop10?.title ?? '我最爱的'}</span>
                      <span className="text-xs" style={{ color: C.sub }}>{top10Open ? '收起 ▲' : '展开 ▼'}</span>
                    </button>
                    <div className="mt-3 flex gap-2.5 overflow-x-auto" data-scroll-container="user-top10-strip" data-scroll-direction="horizontal">
                      {(top10Open ? top10Subjects : top10Subjects.slice(0, 4)).map((s) => s && (
                        <div key={s.id} className="w-16 shrink-0">
                          <Img src={s.cover} className="w-16 rounded object-cover" style={{ height: 88 }} />
                          <div className="mt-1 text-[11px] truncate" style={{ color: C.text }}>{s.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 书影音档案卡:标题 + 各类目封面堆 + 看过/读过/玩过 计数(IMG_0259) */}
                <button
                  {...bindTap({ kind: 'action', id: 'user.archive.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="w-full rounded-2xl bg-white p-4 border-none cursor-pointer text-left"
                >
                  <span className="flex items-center justify-between">
                    <span className="text-[15px] font-bold" style={{ color: C.text }}>书影音档案</span>
                    <span style={{ color: C.sub }}>›</span>
                  </span>
                  {/* 封面堆(取 TOP10 封面近似类目扇形堆) */}
                  {top10Subjects.length > 0 && (
                    <span className="mt-3 flex -space-x-3">
                      {top10Subjects.slice(0, 5).map((s) => s && (
                        <Img key={s.id} src={s.cover} className="w-12 rounded object-cover border-2 border-white shadow-sm" style={{ height: 66 }} />
                      ))}
                    </span>
                  )}
                  <span className="mt-3 flex gap-6 text-sm" style={{ color: C.text }}>
                    <span>看过 <b>{user.stats.movieDone}</b></span>
                    <span>读过 <b>{user.stats.bookDone}</b></span>
                    <span>玩过 <b>{user.stats.musicDone}</b></span>
                  </span>
                </button>

                {/* 书影音打卡热力图(确定性模拟:按 user.id 派生格子强度,IMG_0259) */}
                <div className="w-full rounded-2xl bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px] font-bold" style={{ color: C.text }}>2026 书影音打卡</span>
                    <span className="text-xs" style={{ color: C.sub }}>{user.stats.movieDone + user.stats.bookDone} 次标记 ›</span>
                  </div>
                  <div className="mt-3 flex gap-[3px] overflow-x-auto">
                    {Array.from({ length: 26 }).map((_, col) => (
                      <span key={col} className="flex flex-col gap-[3px]">
                        {Array.from({ length: 7 }).map((__, row) => {
                          // 确定性强度:hash(user.id + col*7+row) → 0..3 档,无随机
                          let h = 0;
                          const seed = `${user.id}:${col * 7 + row}`;
                          for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) & 0xffff;
                          const lv = h % 5; // 0..4,0/1 空白,越大越深
                          const bg = lv <= 1 ? '#EDEFF2' : lv === 2 ? '#BEE6C6' : lv === 3 ? '#6FCF88' : C.green;
                          return <span key={row} className="w-[9px] h-[9px] rounded-[2px]" style={{ background: bg }} />;
                        })}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px]" style={{ color: C.sub }}>
                    <span>少</span>
                    {['#EDEFF2', '#BEE6C6', '#6FCF88', C.green].map((c) => (
                      <span key={c} className="w-[9px] h-[9px] rounded-[2px]" style={{ background: c }} />
                    ))}
                    <span>多</span>
                  </div>
                </div>

                {/* 共同爱好条 */}
                <button
                  {...bindTap({ kind: 'action', id: 'user.commonTaste.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="w-full rounded-2xl bg-white px-4 py-3.5 flex items-center justify-between border-none cursor-pointer text-left"
                >
                  <span className="text-[15px] font-medium" style={{ color: C.text }}>💫 你们的共同爱好</span>
                  <span style={{ color: C.sub }}>›</span>
                </button>

                {/* 文集卡 */}
                {userEssaySets.map((e) => (
                  <button
                    key={e.id}
                    {...bindTap('user.essaySet-open', { params: { essaySetId: e.id } })}
                    className="w-full rounded-2xl bg-white px-4 py-3.5 flex items-center gap-3 border-none cursor-pointer text-left"
                  >
                    <span className="w-11 h-11 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: '#F3EEF9' }}>📖</span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{e.title}</span>
                      <span className="block text-xs mt-0.5" style={{ color: C.sub }}>{e.articles.length}篇内容</span>
                    </span>
                    <span style={{ color: C.sub }}>›</span>
                  </button>
                ))}

                {/* 加入的小组横滑 */}
                {userGroups.length > 0 && (
                  <div className="rounded-2xl bg-white p-4">
                    <div className="text-[15px] font-bold mb-3" style={{ color: C.text }}>加入的小组</div>
                    <div className="flex gap-3 overflow-x-auto" data-scroll-container="user-groups-strip" data-scroll-direction="horizontal">
                      {userGroups.map((g) => (
                        <button
                          key={g.id}
                          {...bindTap('user.group-open', { params: { groupId: g.id } })}
                          className="w-14 shrink-0 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                        >
                          <Img src={g.icon} className="w-12 h-12 rounded-lg object-cover" style={{ borderBottom: `3px solid ${g.themeColor}` }} />
                          <span className="text-[10px] truncate w-full text-center" style={{ color: C.text }}>{g.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 动态 */}
            {tab === 'status' && (
              <>
                <div className="flex justify-end px-4 py-2.5 bg-white border-b" style={{ borderColor: '#F2F3F5' }}>
                  <SegRow
                    options={['动态', '全部'] as const}
                    value={statusFilter === 'all' ? '全部' : '动态'}
                    size="sm"
                    bindFor={(label) => {
                      const f: StatusFilter = label === '全部' ? 'all' : 'status';
                      return bindTap({ kind: 'action', id: 'user.statusFilter.select.target' }, { params: { target: f }, onTrigger: () => setParam('sf', f) });
                    }}
                  />
                </div>
                {statusList.length === 0 ? (
                  <EmptyState text="TA还没有动态" />
                ) : (
                  statusList.map((b) => {
                    const u = user;
                    return (
                      <button
                        key={b.id}
                        {...bindTap('user.broadcast-open', { params: { id: b.id } })}
                        className="w-full text-left px-4 py-3 bg-white border-b cursor-pointer"
                        style={{ borderColor: '#F2F3F5' }}
                      >
                        {/* 作者行:头像+昵称+时间+⋯ */}
                        <div className="flex items-center gap-2">
                          <Avatar src={u.avatar} size={30} />
                          <span className="flex-1 min-w-0">
                            <span className="block text-[13px] font-medium truncate" style={{ color: C.text }}>{u.name}</span>
                            <span className="block text-[11px]" style={{ color: '#B9BEC6' }}>{fmtAbsDateTime(b.createdAt)}</span>
                          </span>
                          <span
                            onClick={(e) => { e.stopPropagation(); toast('该功能暂未开放'); }}
                            className="text-lg px-1 cursor-pointer" style={{ color: C.sub }} role="button" aria-label="更多"
                          >⋯</span>
                        </div>
                        <div className="mt-2 text-[15px] leading-relaxed line-clamp-4" style={{ color: C.text }}>{b.text}</div>
                        {/* 赞/回复/转发 三等分动作行 */}
                        <div className="mt-2.5 flex items-center text-xs" style={{ color: C.sub }}>
                          <span className="flex-1 inline-flex items-center gap-1">↗ 转发</span>
                          <span className="flex-1 inline-flex items-center justify-center gap-1">💬 {fmtCount(b.replyCount)}</span>
                          <span className="flex-1 inline-flex items-center justify-end gap-1">👍 {fmtCount(b.likeCount)}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </>
            )}

            {/* 相册 */}
            {tab === 'album' && (
              albumBlocked ? (
                <div className="py-14"><EmptyState text={BLOCKED_ALBUM} /></div>
              ) : (
                <div className="pb-4">
                  <div className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm" style={{ color: C.sub }}>1个</span>
                  </div>
                  <div className="px-3">
                    <button
                      {...bindTap('user.album-open', { beforeTrigger: () => setImageViewerPayload({ images: albumImages.length > 0 ? albumImages : [user?.avatar || '/@app-assets/Douban/images/bc_photo1.svg'], index: 0 }) })}
                      className="w-full flex gap-3 items-center p-3 bg-white rounded-lg border-none cursor-pointer text-left"
                    >
                      {/* 2×2 拼贴 */}
                      <span className="grid grid-cols-2 gap-0.5 shrink-0 rounded overflow-hidden" style={{ width: 72, height: 72 }}>
                        {[0, 1, 2, 3].map((i) => <Img key={i} src={albumImages[i % Math.max(1, albumImages.length)] ?? user?.avatar ?? ''} className="w-full h-full object-cover" />)}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[15px] font-medium" style={{ color: C.text }}>动态相册</span>
                        <span className="block mt-1 text-xs" style={{ color: C.sub }}>4 张</span>
                      </span>
                    </button>
                  </div>
                  <TheEnd />
                </div>
              )
            )}

            {/* 徽章:tab 直接进徽章墙,此处内容区兜底 */}
            {tab === 'badge' && (
              <div className="p-6">
                <EmptyState text={`共 ${user.badges} 枚徽章`} sub="点击上方「徽章」进入徽章墙" />
              </div>
            )}
          </>
        )}
      </div>

      {/* 取关确认 sheet(URL驱动) */}
      {unfollowSheet && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <button
            {...bindTap({ kind: 'action', id: 'user.follow.unfollowSheet.close' }, { onTrigger: () => setParam('unfollowSheet', null) })}
            className="flex-1 border-none cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            aria-label="关闭"
          />
          <div className="rounded-t-2xl bg-white pb-5 shrink-0">
            <div className="text-center py-4 text-sm" style={{ color: C.sub }}>确定不再关注?</div>
            <div className="h-px" style={{ background: C.border }} />
            <button
              {...bindTap({ kind: 'action', id: 'user.follow.toggle.off' }, { onTrigger: onConfirmUnfollow })}
              className="w-full h-13 py-4 bg-transparent border-none cursor-pointer text-[15px]"
              style={{ color: C.danger }}
            >
              确定
            </button>
            <div className="h-2" style={{ background: C.bg }} />
            <button
              {...bindTap({ kind: 'action', id: 'user.follow.unfollowSheet.close' }, { onTrigger: () => setParam('unfollowSheet', null) })}
              className="w-full py-4 bg-transparent border-none cursor-pointer text-[15px]"
              style={{ color: C.text }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 送礼物弹层 */}
      {giftOpen && (
        <GiftSheet
          tab={giftTab}
          activeGiftId={giftId}
          bindTabSelect={(t) => bindTap({ kind: 'action', id: 'user.gift.tab.select.target' }, { params: { target: t }, onTrigger: () => setParam('giftTab', t) })}
          bindGiftSelect={(gid) => bindTap({ kind: 'action', id: 'user.gift.item.select.target' }, { params: { target: gid }, onTrigger: () => setParam('giftId', gid) })}
          bindPurchase={bindTap({ kind: 'action', id: 'user.gift.send.insufficientToast' }, { onTrigger: () => {
            const gift = GIFTS.find((item) => item.id === giftId) ?? GIFTS[0];
            const launched = payWithSystem(
              { amount: gift.beans, orderId: `gift-${gift.id}`, subject: `购买并送出${gift.name}` },
              (result) => { if (result.resultCode === 'OK') { sendGift('user', userId, gift.id); toast('礼物已送出'); } },
            );
            if (!launched) toast('无法打开系统支付');
          } })}
          closeProps={bindBack()}
        />
      )}
    </div>
  );
}
