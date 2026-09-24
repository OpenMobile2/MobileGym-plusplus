// 我的-个人主页(mine.profile,/mine,IMG_0390-0393,frame:800dd2@t0002/t0020/t0026):
// 深色头图区(头像/昵称/ID/IP/介绍下自己) + 关注/被关注 + ☰抽屉/耳机/信封 +
// 4tab(主页/动态/相册/徽章)+搜索 + 主页模块流(创建TOP10入口行/快速记录/我的小组/文集引导/创作灵感) +
// 动态tab(本人广播流+动态/全部筛选) + 相册tab + 徽章tab空态 + 右下发布FAB。
// NO 书影音统计(Q3);TOP10创建→toast暂未开放(Q4)。
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, Img, C, fmtCount, fmtAbsDateTime, EmptyState, SegRow, TheEnd } from '../components/ui';
import { setImageViewerPayload } from './MediaImageviewerPage';
import {
  IcLike,
  IcMedal,
  IcMessage,
  IcPencil,
  IcRepost,
  IcSearch,
  IcSparkles,
  IcTabBm,
} from '../res/icons';

type MTab = 'home' | 'status' | 'album' | 'badge';
type StatusFilter = 'status' | 'all';

export default function MineProfilePage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const groups = useDoubanStore((s) => s.groups);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const topics = useDoubanStore((s) => s.topics);
  const subjects = useDoubanStore((s) => s.subjects);
  const notifications = useDoubanStore((s) => s.notifications);
  const users = useDoubanStore((s) => s.users);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const discussions = useDoubanStore((s) => s.discussions);
  const reviews = useDoubanStore((s) => s.reviews);

  const tab: MTab = (['home', 'status', 'album', 'badge'] as MTab[]).find((t) => t === searchParams.get('mt')) ?? 'home';
  // 默认「全部」= 原创 + 转发(转发也是动态,应可见);「原创」才排除转发
  const statusFilter: StatusFilter = searchParams.get('sf') === 'status' ? 'status' : 'all';
  const [aboutOpen, setAboutOpen] = useState(false);

  const joinedGroups = useMemo(() => groups.filter((g) => g.joined), [groups]);
  const myBroadcasts = useMemo(
    () => broadcasts.filter((b) => b.authorId === currentUser.id).sort((a, b) => b.createdAt - a.createdAt),
    [broadcasts, currentUser.id],
  );
  const statusList = useMemo(
    () => (statusFilter === 'all' ? myBroadcasts : myBroadcasts.filter((b) => !b.isRepost)),
    [myBroadcasts, statusFilter],
  );
  // 转发动态的「引用原文」解析:按 origType/origId 找到原内容作者+摘要
  const nameOf = React.useCallback(
    (uid: string) => users.find((u) => u.id === uid)?.name ?? '豆友',
    [users],
  );
  const quoteOf = React.useCallback(
    (b: (typeof myBroadcasts)[number]): { name: string; text: string } | null => {
      if (!b.isRepost || !b.origId) return null;
      if (b.origType === 'groupPost') {
        const p = groupPosts.find((x) => x.id === b.origId);
        return p ? { name: nameOf(p.authorId), text: p.title || p.content } : null;
      }
      if (b.origType === 'discussion') {
        const d = discussions.find((x) => x.id === b.origId);
        return d ? { name: nameOf(d.authorId), text: d.title || d.content } : null;
      }
      if (b.origType === 'review') {
        const r = reviews.find((x) => x.id === b.origId);
        return r ? { name: nameOf(r.authorId), text: r.title || r.text } : null;
      }
      const o = broadcasts.find((x) => x.id === b.origId);
      return o ? { name: nameOf(o.authorId), text: o.text } : null;
    },
    [broadcasts, groupPosts, discussions, reviews, nameOf],
  );

  const inspireTopics = useMemo(() => topics.slice(0, 3), [topics]);
  const collageCovers = useMemo(() => subjects.slice(0, 3).map((s) => s.cover).filter(Boolean), [subjects]);
  const unread = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const setTabParam = (t: MTab) =>
    setSearchParams(
      (p) => {
        p.set('mt', t);
        return p;
      },
      { replace: true },
    );
  const setStatusFilter = (f: StatusFilter) =>
    setSearchParams(
      (p) => {
        p.set('sf', f);
        return p;
      },
      { replace: true },
    );

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="light">
      {/* 深色头图区 */}
      <div className="shrink-0 px-4 pt-3 pb-4" style={{ background: 'linear-gradient(150deg,#3A3F45,#2B3036)' }}>
        {/* 顶部图标行:☰ / 耳机 / 信封 */}
        <div className="flex items-center justify-between mb-3">
          <button
            {...bindTap('mine.drawer-open')}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: C.darkText }}
            aria-label="菜单"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-1">
            <button
              {...bindTap({ kind: 'action', id: 'mine.quickRecord.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
              style={{ color: C.darkText }}
              aria-label="播放列表"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M3 18v-6a9 9 0 0118 0v6" />
                <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
              </svg>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'mine.essaySet.create.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer relative"
              style={{ color: C.darkText }}
              aria-label="消息"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M22 6l-10 7L2 6" />
              </svg>
              {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: '#F0453E' }} />}
            </button>
          </div>
        </div>

        {/* 大号居中头像 + 相机角标 */}
        <div className="flex flex-col items-center">
          <button
            {...bindTap('mine.editProfile-open')}
            className="relative bg-transparent border-none cursor-pointer p-0"
            aria-label="编辑头像"
          >
            <Avatar src={currentUser.avatar} size={84} className="border-2 border-white/40" />
            <span
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white"
              style={{ background: '#3A3F45' }}
              aria-hidden
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </span>
          </button>
          <div className="mt-2 text-xl font-bold text-white truncate max-w-full">{currentUser.name}</div>
          <div className="text-xs text-white/60 mt-0.5">ID: {currentUser.id} · IP属地 {currentUser.ipLocation}</div>
        </div>

        {/* 介绍下自己 / 编辑(铅笔在前) + 关于我 ▾ */}
        <div className="mt-3 flex items-center justify-center gap-4">
          <button
            {...bindTap('mine.editProfile-open')}
            className="flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <IcPencil size={14} strokeWidth={1.9} aria-hidden />
            <span>{currentUser.signature || '介绍下自己'}</span>
          </button>
          <button
            onClick={() => setAboutOpen((v) => !v)}
            className="flex items-center gap-1 text-sm bg-transparent border-none cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.75)' }}
          >
            <span>关于我</span>
            <span className="text-[10px]">{aboutOpen ? '▴' : '▾'}</span>
          </button>
        </div>
        {aboutOpen && (
          <div className="mt-2 text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            {currentUser.signature || '安静记录书影音的普通豆友,慢慢看,慢慢写。'}
            {currentUser.joinedText ? ` · ${currentUser.joinedText}` : ''}
          </div>
        )}

        {/* 关注 / 被关注 */}
        <div className="mt-3 flex justify-center gap-8">
          <button
            {...bindTap('mine.follows-open', { params: { userId: currentUser.id } })}
            className="bg-transparent border-none cursor-pointer text-left"
          >
            <span className="text-white font-semibold">{currentUser.following}</span>
            <span className="text-white/60 text-xs ml-1">关注</span>
          </button>
          <button
            {...bindTap('mine.followers-open', { params: { userId: currentUser.id } })}
            className="bg-transparent border-none cursor-pointer text-left"
          >
            <span className="text-white font-semibold">{currentUser.followers}</span>
            <span className="text-white/60 text-xs ml-1">被关注</span>
          </button>
        </div>
      </div>

      {/* 4tab条 + 搜索:左置窄间距 + 黑短下划线 + 徽章前「｜」分隔 */}
      <div className="flex items-center bg-white border-b shrink-0" style={{ borderColor: C.border }}>
        <div className="flex items-center gap-5 px-4 flex-1">
          {([['home', '主页'], ['status', '动态'], ['album', '相册']] as [MTab, string][]).map(([t, label]) => {
            const active = tab === t;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'mine.tab.select.target' }, { params: { target: t }, onTrigger: () => setTabParam(t) })}
                className="py-3 bg-transparent border-none cursor-pointer text-[15px] relative"
                style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
              >
                {label}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
              </button>
            );
          })}
          <span className="self-center text-sm" style={{ color: '#DADDE1' }}>｜</span>
          <button
            {...bindTap({ kind: 'action', id: 'mine.tab.select.target' }, { params: { target: 'badge' }, onTrigger: () => setTabParam('badge') })}
            className="py-3 bg-transparent border-none cursor-pointer text-[15px] relative"
            style={{ color: tab === 'badge' ? C.text : C.sub, fontWeight: tab === 'badge' ? 700 : 400 }}
          >
            <span className="inline-flex items-center gap-1">
              <IcMedal size={15} strokeWidth={1.9} aria-hidden />
              徽章
            </span>
            {tab === 'badge' && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
          </button>
        </div>
        <button
          {...bindTap('mine.selfSearch-open', { params: { scope: 'mine' } })}
          className="w-11 h-11 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
          aria-label="搜索"
        >
          <IcSearch size={19} strokeWidth={2} aria-hidden />
        </button>
      </div>

      {/* 内容区 */}
      <div
        className="flex-1 overflow-y-auto pb-20"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === 'home' && (
          <div className="p-3 space-y-3">
            {/* 创建我的书影音 卡:行首头像 + 红 TOP10 徽 + 右侧拼贴图 */}
            <button
              {...bindTap({ kind: 'action', id: 'mine.top10.create.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-full rounded-2xl bg-white px-4 py-3.5 flex items-center gap-3 border-none cursor-pointer text-left"
            >
              <Avatar src={currentUser.avatar} size={36} />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="text-[15px] font-medium" style={{ color: C.text }}>创建我的书影音</span>
                  <span className="px-1 rounded text-[10px] font-bold text-white" style={{ background: '#E5484D' }}>TOP10</span>
                </span>
                <span className="block text-xs mt-0.5" style={{ color: C.sub }}>把最爱的书影音收进你的年度榜单</span>
              </span>
              {/* 右侧拼贴图 */}
              <span className="flex -space-x-2 shrink-0">
                {collageCovers.map((c, i) => (
                  <Img key={i} src={c} className="w-8 rounded object-cover border border-white" style={{ height: 44 }} />
                ))}
              </span>
              <span style={{ color: C.sub }}>›</span>
            </button>

            {/* 快速记录我看过的影视 */}
            <button
              {...bindTap({ kind: 'action', id: 'mine.quickRecord.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-full rounded-2xl bg-white px-4 py-3.5 flex items-center justify-between border-none cursor-pointer"
            >
              <span className="inline-flex items-center gap-2 text-[15px] font-medium" style={{ color: C.text }}>
                <IcTabBm size={18} strokeWidth={1.9} style={{ color: C.green }} aria-hidden />
                快速记录我看过的影视
              </span>
              <span style={{ color: C.sub }}>›</span>
            </button>

            {/* 我的小组 */}
            <div className="rounded-2xl bg-white p-4">
              <button
                {...bindTap('mine.groupMine-open')}
                className="w-full flex items-center justify-between bg-transparent border-none cursor-pointer"
              >
                <span className="text-[15px] font-bold" style={{ color: C.text }}>我的小组 {joinedGroups.length}</span>
                <span className="text-xs" style={{ color: C.sub }}>›</span>
              </button>
              <div className="mt-3 flex gap-3 overflow-x-auto" data-scroll-container="mygroups-strip" data-scroll-direction="horizontal">
                {joinedGroups.map((g) => (
                  <button
                    key={g.id}
                    {...bindTap('mine.group-open', { params: { groupId: g.id } })}
                    className="w-14 shrink-0 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <Img src={g.icon} className="w-12 h-12 rounded-lg object-cover" style={{ borderBottom: `3px solid ${g.themeColor}` }} />
                    <span className="text-[10px] truncate w-full text-center" style={{ color: C.text }}>{g.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 文集引导条:白卡「文集 / 把你的精彩内容按主题收录到文集里吧 ›」 */}
            <button
              {...bindTap({ kind: 'action', id: 'mine.essaySet.create.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-full rounded-2xl px-4 py-3.5 flex items-center justify-between border-none cursor-pointer text-left bg-white"
            >
              <span className="min-w-0">
                <span className="block text-[15px] font-bold" style={{ color: C.text }}>文集</span>
                <span className="block text-xs mt-0.5" style={{ color: C.sub }}>把你的精彩内容按主题收录到文集里吧</span>
              </span>
              <span style={{ color: C.sub }}>›</span>
            </button>

            {/* 创作灵感:紫色药丸 + 话题区 */}
            <div className="rounded-2xl bg-white p-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold mb-3" style={{ background: '#F3EEF9', color: '#7A6BD6' }}>
                <IcSparkles size={13} strokeWidth={1.9} aria-hidden />
                创作灵感
              </span>
              {inspireTopics.map((t) => (
                <button
                  key={t.id}
                  {...bindTap('mine.inspireTopic-open', { params: { id: t.id } })}
                  className="w-full flex items-center justify-between py-2.5 border-b last:border-b-0 bg-transparent border-none cursor-pointer text-left"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  <span className="text-sm min-w-0 truncate" style={{ color: C.text }}># {t.name}</span>
                  <span className="text-[11px] shrink-0 ml-2" style={{ color: C.sub }}>{fmtCount(t.views)}浏览</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'status' && (
          <>
            {/* 动态/全部 筛选:右置灰轨分段 */}
            <div className="flex justify-end px-4 py-2.5 bg-white border-b" style={{ borderColor: '#F2F3F5' }}>
              <SegRow
                options={['全部', '原创'] as const}
                value={statusFilter === 'all' ? '全部' : '原创'}
                size="sm"
                bindFor={(label) => {
                  const f: StatusFilter = label === '原创' ? 'status' : 'all';
                  return bindTap({ kind: 'action', id: 'mine.statusFilter.select.target' }, { params: { target: f }, onTrigger: () => setStatusFilter(f) });
                }}
              />
            </div>
            {statusList.length === 0 ? (
              <EmptyState text="还没有动态" />
            ) : (
              statusList.map((b) => (
                <button
                  key={b.id}
                  {...bindTap('mine.broadcast-open', { params: { id: b.id } })}
                  className="w-full text-left px-4 py-3 bg-white border-b cursor-pointer"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  {/* 作者行:头像+昵称+时间+⋯ */}
                  <div className="flex items-center gap-2">
                    <Avatar src={currentUser.avatar} size={30} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-medium truncate" style={{ color: C.text }}>{currentUser.name}</span>
                      <span className="block text-[11px]" style={{ color: '#B9BEC6' }}>{fmtAbsDateTime(b.createdAt)}</span>
                    </span>
                    <span
                      onClick={(e) => { e.stopPropagation(); toast('该功能暂未开放'); }}
                      className="text-lg px-1 cursor-pointer" style={{ color: C.sub }} role="button" aria-label="更多"
                    >⋯</span>
                  </div>
                  {(() => {
                    const q = quoteOf(b);
                    if (!q) {
                      return <div className="mt-2 text-[15px] leading-relaxed line-clamp-4" style={{ color: C.text }}>{b.text}</div>;
                    }
                    return (
                      <>
                        <div className="mt-2 text-[15px] leading-relaxed line-clamp-3" style={{ color: C.text }}>
                          {b.text || '转发动态'}
                        </div>
                        <div className="mt-2 px-3 py-2 rounded-lg text-[13px] leading-snug line-clamp-3" style={{ background: '#F7F7F7', color: C.sub }}>
                          {q.name}:{q.text.slice(0, 60)}
                        </div>
                      </>
                    );
                  })()}
                  {/* 赞/回复/转发 三等分动作行 */}
                  <div className="mt-2.5 flex items-center text-xs" style={{ color: C.sub }}>
                    <span className="flex-1 inline-flex items-center gap-1"><IcRepost size={14} aria-hidden />转发</span>
                    <span className="flex-1 inline-flex items-center justify-center gap-1"><IcMessage size={14} aria-hidden />{fmtCount(b.replyCount)}</span>
                    <span className="flex-1 inline-flex items-center justify-end gap-1"><IcLike size={14} aria-hidden />{fmtCount(b.likeCount)}</span>
                  </div>
                </button>
              ))
            )}
          </>
        )}

        {tab === 'album' && (
          <div className="pb-4">
            {/* 「1个」左 + 「+新相册」绿按钮右上 */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <span className="text-sm" style={{ color: C.sub }}>1个</span>
              <button
                {...bindTap({ kind: 'action', id: 'mine.album.create.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="text-sm font-medium bg-transparent border-none cursor-pointer"
                style={{ color: C.green }}
              >
                + 新相册
              </button>
            </div>
            {/* 相册卡:2×2拼贴 + 标题 + 4张 */}
            <div className="px-3">
              <button
                {...bindTap('mine.album-open', { beforeTrigger: () => setImageViewerPayload({ images: collageCovers.length > 0 ? collageCovers : ['/@app-assets/Douban/images/bc_photo1.svg'], index: 0 }) })}
                className="w-full flex gap-3 items-center p-3 bg-white rounded-lg border-none cursor-pointer text-left"
              >
                <span className="grid grid-cols-2 gap-0.5 shrink-0 rounded overflow-hidden" style={{ width: 72, height: 72 }}>
                  {[0, 1, 2, 3].map((i) => <Img key={i} src={collageCovers[i % Math.max(1, collageCovers.length)] ?? ''} className="w-full h-full object-cover" />)}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium" style={{ color: C.text }}>动态相册</span>
                  <span className="block mt-1 text-xs" style={{ color: C.sub }}>4 张</span>
                </span>
              </button>
            </div>
            <TheEnd />
          </div>
        )}

        {tab === 'badge' && (
          <div className="p-3">
            <button
              {...bindTap('mine.badgeWall-open', { params: { userId: currentUser.id } })}
              className="w-full rounded-2xl bg-white p-4 border-none cursor-pointer text-left"
            >
              <div className="flex items-center justify-between">
                <span className="text-[15px] font-bold" style={{ color: C.text }}>我的徽章 {currentUser.badges}</span>
                <span className="text-xs" style={{ color: C.sub }}>查看全部 ›</span>
              </div>
              <div className="mt-3 flex flex-col gap-2 text-xs" style={{ color: C.sub }}>
                <div className="flex items-center justify-between"><span>活动徽章</span><span>0/319</span></div>
                <div className="flex items-center justify-between"><span>大师徽章</span><span>0/21</span></div>
              </div>
            </button>
            <div className="mt-6">
              <EmptyState text="还没有获得徽章" sub="多参与豆瓣活动即可点亮徽章" />
            </div>
          </div>
        )}
      </div>

      {/* 发布 FAB */}
      <button
        {...bindTap('mine.compose-open')}
        className="absolute right-4 bottom-6 rounded-full flex items-center justify-center border-none cursor-pointer z-20"
        style={{ background: '#1A1A1A', width: 52, height: 52, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        aria-label="发布"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      </button>
    </div>
  );
}
