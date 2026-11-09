import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shareWithSystem } from '../capabilities';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { CenterDialog } from '../components/Sheet';
import { Img } from '../res/images';
import { IcSearch, IcClose, IcShare, IcMore, IcComment, IcStar } from '../res/icons';
import type { KeepPost } from '../types';
import { followFeedPosts, followedProfileList, profileKeyOf } from '../store/profileHelpers';

/** 发现·关注 feed —— 证据 s099/s104/s106 */
export default function DiscoverFollowPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const user = useKeepStore((st) => st.user);
  const posts = useKeepStore((st) => st.posts);
  const feedFollow = useKeepStore((st) => st.feedFollow);
  const coaches = useKeepStore((st) => st.coaches);
  const cheeredPosts = useKeepStore((st) => st.cheeredPosts) ?? [];
  const emojiReacted = useKeepStore((st) => st.emojiReacted) ?? {};
  const followedUsers = useKeepStore((st) => st.followedUsers) ?? [];
  const followedNames = useKeepStore((st) => st.followedNames) ?? [];
  const followedCoaches = useKeepStore((st) => st.followedCoaches) ?? [];
  const closedCards = useKeepStore((st) => st.closedCards) ?? [];
  const favPost = useKeepStore((st) => st.favPost);
  const favedPosts = useKeepStore((st) => st.favedPosts) ?? [];
  const cheerPost = useKeepStore((st) => st.cheerPost);
  const reactPostEmoji = useKeepStore((st) => st.reactPostEmoji);
  const toggleFollowUser = useKeepStore((st) => st.toggleFollowUser);
  const closePromoCard = useKeepStore((st) => st.closePromoCard);

  const recScroller = useRef<HTMLDivElement>(null);
  const [recPage, setRecPage] = useState(0);

  const followedProfiles = followedProfileList(
    coaches,
    posts,
    followedCoaches,
    followedUsers,
    followedNames,
  );
  const feedPosts = followFeedPosts(
    posts,
    feedFollow,
    followedCoaches,
    followedUsers,
    followedNames,
    user.nickname,
  );
  const expandedId = searchParams.get('expand');
  const morePostId = searchParams.get('more');
  const adClosed = closedCards.includes('ad_winter');

  // 推荐关注：只推还未关注的达人，关注后从这里消失并进入上方 feed
  const recPages: { id: string; name: string; fans: string; avatar: string }[][] = [];
  const recList = coaches
    .filter((c) =>
      !followedCoaches.includes(c.id)
      && !followedUsers.includes(c.name)
      && !followedNames.includes(c.name),
    )
    .map((c) => ({ id: c.id, name: c.name, fans: `${c.fans} 粉丝`, avatar: c.avatar }));
  for (let i = 0; i < recList.length; i += 3) recPages.push(recList.slice(i, i + 3));

  const renderPost = (post: KeepPost) => {
    const cheered = cheeredPosts.includes(post.id);
    const reacted = emojiReacted[post.id] ?? [];
    const longText = post.type === '图文' && post.content.length > 42;
    const expanded = expandedId === post.id;
    return (
      <div
        {...bindTap('post.detail.open.fromFollow', {
          params: { postId: post.id },
          beforeTrigger: () => setCurrent('postId', post.id),
        })}
        className="bg-app-surface px-4 py-3 mb-2"
        role="button"
      >
        {/* 作者行 */}
        <div className="flex items-center gap-2.5">
          <button
            {...bindTap('coach.profile.open.fromFollowFeed', {
              params: { coachId: profileKeyOf(post) },
              stopPropagation: true,
              beforeTrigger: () => setCurrent('coachId', profileKeyOf(post)),
            })}
            className="flex items-center gap-2.5 bg-transparent border-none p-0 text-left"
          >
            <Img id={post.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt={post.author} />
            <div>
              <div className="text-[15px] font-semibold text-app-text">{post.author}</div>
              <div className="text-[11px] text-app-text-muted mt-0.5">{post.time} {post.region}</div>
            </div>
          </button>
          <div className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'discover.follow.post.share' }, {
              params: { postId: post.id },
              stopPropagation: true,
              onTrigger: () => {
                const launched = shareWithSystem(
                  `【Keep】${post.author}：${post.content}`,
                  (result) => { if (result.resultCode === 'OK') toast('分享成功'); },
                );
                if (!launched) toast(s.notOpen);
              },
            })}
            aria-label={`分享 ${post.author} 的动态`}
            className="p-1 bg-transparent border-none"
          >
            <IcShare size={18} className="text-app-text-muted" />
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'discover.follow.more.open' },
              {
                params: { postId: post.id },
                stopPropagation: true,
                onTrigger: () => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('more', post.id); return next; }, { replace: true }),
              },
            )}
            aria-label="更多操作"
            className="p-1 bg-transparent border-none ml-1"
          >
            <IcMore size={18} className="text-app-text-muted" />
          </button>
        </div>
        {/* 正文(长文折叠 + 展开全文) */}
        <div className="mt-2.5 text-[15px] text-app-text leading-relaxed">
          {longText && !expanded ? (
            <>
              {post.content.slice(0, 42)}…
              <button
                {...bindTap(
                  { kind: 'action', id: 'discover.follow.post.expand' },
                  {
                    params: { postId: post.id },
                    stopPropagation: true,
                    onTrigger: () =>
                      setSearchParams((p) => { p.set('expand', post.id); return p; }, { replace: true }),
                  },
                )}
                className="bg-transparent border-none p-0 text-app-text font-semibold"
              >
                展开全文
              </button>
            </>
          ) : (
            post.content
          )}
        </div>
        {/* 图片 */}
        {post.images.length > 0 && (
          <Img id={post.images[0]} className="w-full h-52 rounded-xl object-cover mt-2.5" alt={post.content.slice(0, 8)} />
        )}
        {/* 运动数据卡 */}
        {post.sportData && (
          <div className="mt-2.5 rounded-xl px-3.5 py-3" style={{ background: '#F5F6F8' }}>
            <div className="text-[14px] font-semibold text-app-text">
              🚴 {post.sportData.type} {post.sportData.km} 公里{' '}
              {post.sportData.medal && <span style={{ color: '#D8A23C' }}>{post.sportData.medal}</span>}
            </div>
            <div className="text-[12px] text-app-text-muted mt-1">
              {post.sportData.duration} · {post.sportData.kcal}千卡
              {post.sportData.speed ? ` · 均速${post.sportData.speed}千米/时` : ''}
              {post.sportData.rank ? ` · ${post.sportData.rank}` : ''}
            </div>
          </div>
        )}
        {/* 加油 + 评论/收藏 */}
        <div className="flex items-center mt-3">
          <button
            {...bindTap(
              { kind: 'action', id: 'discover.follow.cheer.toggle' },
              { params: { postId: post.id }, stopPropagation: true, onTrigger: () => cheerPost(post.id) },
            )}
            className="flex items-center gap-1.5 bg-transparent border-none p-0"
            style={{ color: cheered ? C.green : '#5A5F68' }}
          >
            <span className="text-[16px]">📣</span>
            <span className="text-[13px]">{post.cheers} 次加油</span>
          </button>
          <div className="flex-1" />
          <button
            {...bindTap('post.detail.open.fromFollow', {
              params: { postId: post.id },
              stopPropagation: true,
              beforeTrigger: () => setCurrent('postId', post.id),
            })}
            className="flex items-center gap-1 text-app-text-muted text-[13px] mr-4 bg-transparent border-none p-0"
          >
            <IcComment size={16} />{post.commentsCount}
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'discover.follow.fav.toggle' },
              { params: { postId: post.id }, stopPropagation: true, onTrigger: () => favPost(post.id) },
            )}
            className="flex items-center gap-1 text-[13px] bg-transparent border-none p-0"
            style={{ color: favedPosts.includes(post.id) ? C.green : '#8A8F99' }}
          >
            <IcStar size={16} />{post.collects}
          </button>
        </div>
        {/* 表情回应 chips */}
        {Object.keys(post.emojis).length > 0 && (
          <div className="flex gap-2 mt-2.5 overflow-x-auto">
            {Object.entries(post.emojis).map(([emoji, cnt]) => {
              const on = reacted.includes(emoji);
              return (
                <button
                  key={emoji}
                  {...bindTap(
                    { kind: 'action', id: 'discover.follow.emoji.react' },
                    { params: { postId: post.id, emoji }, stopPropagation: true, onTrigger: () => reactPostEmoji(post.id, emoji) },
                  )}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full shrink-0 text-[12px]"
                  style={{
                    background: on ? '#E9F9F1' : '#F5F6F8',
                    border: on ? `1px solid ${C.green}` : '1px solid transparent',
                    color: on ? C.greenDeep : '#5A5F68',
                  }}
                >
                  <span>{emoji}</span>{cnt}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#F5F6F8' }} data-status-bar-foreground="dark">
      {/* 顶部搜索条(装饰,商城频道才有搜索交互) */}
      <div className="flex items-center gap-3 px-4 pt-1 pb-2 bg-app-surface shrink-0">
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full" style={{ background: '#F2F3F6' }}>
          <IcSearch size={16} className="text-app-text-muted" />
          <span className="text-[13px] text-app-text-muted">骑遇东方茶港</span>
        </div>
        <Img id={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="我" />
      </div>
      {/* 频道 tab：关注选中 */}
      <div className="flex items-center gap-5 px-4 py-2 bg-app-surface shrink-0 overflow-x-auto">
        <span className="text-[17px] font-bold text-app-text border-b-2 pb-0.5 shrink-0" style={{ borderColor: C.green }}>{s.discoverFollow}</span>
        <button {...bindTap('discover.community.open.fromFollow')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverCommunity}</button>
        <button {...bindTap('medal.home.open.fromFollow')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverMedal}</button>
        <button {...bindTap('race.home.open.fromFollow')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverRace}</button>
        <button {...bindTap('mall.home.open.fromFollow')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverMall}</button>
        <button {...bindTap('discover.new.open.fromFollow')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverNew}</button>
        <button {...bindTap('discover.more.open.fromFollow')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverMore}</button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 已关注博主：关注/取关后立刻更新 */}
        <div className="bg-app-surface px-4 py-3">
          <div className="flex items-center mb-2">
            <span className="text-[15px] font-semibold text-app-text">已关注博主</span>
            <span className="ml-1.5 text-[12px] text-app-text-muted">{followedProfiles.length}</span>
          </div>
          {followedProfiles.length === 0 ? (
            <div className="text-[13px] text-app-text-muted py-2">关注博主后，他们会出现在这里</div>
          ) : (
            <div className="flex gap-3 overflow-x-auto" data-scroll-container="following" data-scroll-direction="horizontal">
              {followedProfiles.map((profile) => (
                <button
                  key={profile.id}
                  {...bindTap('coach.profile.open.fromFollowFeed', {
                    params: { coachId: profile.id },
                    beforeTrigger: () => setCurrent('coachId', profile.id),
                  })}
                  className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0 shrink-0 w-16"
                >
                  <Img id={profile.avatar} className="w-13 h-13 rounded-full object-cover" style={{ width: 52, height: 52 }} alt={profile.name} />
                  <span className="text-[11px] text-app-text truncate w-full text-center">{profile.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 好友运动排行卡 */}
        <button
          {...bindTap({ kind: 'action', id: 'discover.follow.ranking.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
          className="w-full bg-app-surface border-none text-left px-4 pb-3"
        >
          <div className="rounded-xl border border-app-border">
            <div className="flex items-center gap-3 px-3.5 py-3">
              <span className="w-11 h-11 rounded-lg flex flex-col items-center justify-center text-white shrink-0" style={{ background: '#4A4656' }}>
                <span className="text-[10px]">🏆</span>
                <span className="text-[10px] italic font-bold">Top</span>
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text">
                  好友运动排行 我 <span style={{ color: C.green }}>1</span> 名
                </div>
                <div className="text-[12px] text-app-text-muted mt-0.5 truncate">{user.nickname}占领了封面</div>
              </div>
              <Img id={user.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="我" />
              <span className="text-app-text-muted">›</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 border-t border-app-border">
              <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: '#C99B4F' }}>榜单排名</span>
              <span className="text-[12px]" style={{ color: '#C9822B' }}>获得好友排行榜第 1 名 ›</span>
            </div>
          </div>
        </button>

        {/* 动态 feed：只显示已关注博主 + 自己发布的动态 */}
        {feedPosts.length === 0 && (
          <div className="bg-app-surface px-8 py-16 mb-2 text-center">
            <div className="text-[15px] font-medium text-app-text">还没有关注动态</div>
            <p className="text-[13px] text-app-text-muted mt-2">关注博主后，他们的动态会出现在这里</p>
          </div>
        )}
        {feedPosts.map((post, idx) => (
          <React.Fragment key={post.id}>
            {renderPost(post)}
            {/* 广告卡插在第 1 条动态后 */}
            {idx === 0 && !adClosed && (
              <div className="bg-app-surface px-4 py-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]" style={{ background: '#2D3A54' }}>🌐</span>
                  <span className="text-[15px] font-semibold text-app-text">无尽冬日</span>
                </div>
                <button
                  {...bindTap({ kind: 'action', id: 'discover.follow.ad.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
                  className="w-full border-none p-0 mt-2.5 rounded-xl overflow-hidden text-left"
                >
                  <div className="h-44 flex flex-col justify-center px-4" style={{ background: 'linear-gradient(150deg, #2A3B55 0%, #16202F 100%)' }}>
                    <div className="text-white text-[20px] font-bold leading-snug">极寒末日<br />生存挑战</div>
                    <div className="mt-3 self-start px-3 py-1 rounded-full text-[12px] text-white" style={{ background: 'rgba(255,255,255,.22)' }}>立即下载</div>
                  </div>
                </button>
                <div className="mt-2 text-[14px] text-app-text">一分钟上手,三分钟上头!《无尽冬日》</div>
                <div className="flex items-center mt-1.5">
                  <span className="text-[11px] text-app-text-muted border border-app-border rounded px-1">广告</span>
                  <div className="flex-1" />
                  <button
                    {...bindTap({ kind: 'action', id: 'discover.follow.ad.close' }, { onTrigger: () => closePromoCard('ad_winter') })}
                    className="bg-transparent border-none p-1 text-app-text-muted"
                    aria-label="关闭广告"
                  >
                    <IcClose size={16} />
                  </button>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {/* 推荐关注卡(横滑分页 + 指示点) */}
        {recPages.length > 0 && <div className="bg-app-surface px-4 py-3 mb-4">
          <div className="flex items-center">
            <span className="text-[16px] font-semibold text-app-text">你可能想认识他们</span>
            <div className="flex-1" />
            <span className="text-[12px] text-app-text-muted">查看更多</span>
          </div>
          <div
            ref={recScroller}
            {...bindTap(
              { kind: 'action', id: 'discover.follow.recommend.page' },
              {
                onTrigger: () => {
                  const el = recScroller.current;
                  if (!el) return;
                  const w = el.clientWidth;
                  const next = (Math.round(el.scrollLeft / Math.max(1, w)) + 1) % Math.max(1, recPages.length);
                  el.scrollTo({ left: next * w, behavior: 'smooth' });
                  setRecPage(next);
                },
              },
            )}
            onScroll={(e) => {
              const el = e.currentTarget;
              setRecPage(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
            }}
            className="flex overflow-x-auto mt-2 snap-x snap-mandatory"
            data-scroll-container="recommend"
            data-scroll-direction="horizontal"
          >
            {recPages.map((page, pi) => (
              <div key={pi} className="w-full shrink-0 snap-start">
                {page.map((u) => {
                  const followed = followedUsers.includes(u.name)
                    || followedNames.includes(u.name)
                    || followedCoaches.includes(u.id);
                  return (
                    <div key={u.id} className="flex items-center gap-3 py-2.5">
                      <Img id={u.avatar} className="w-11 h-11 rounded-full object-cover shrink-0" alt={u.name} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-app-text truncate">{u.name}</div>
                        <div className="text-[12px] text-app-text-muted mt-0.5">{u.fans}</div>
                      </div>
                      <button
                        {...bindTap(
                          { kind: 'action', id: 'discover.follow.recommend.follow.toggle' },
                          { params: { name: u.name }, stopPropagation: true, onTrigger: () => toggleFollowUser(u.name) },
                        )}
                        className="px-4 py-1.5 rounded-full border-none text-[13px] shrink-0"
                        style={followed
                          ? { background: '#F2F3F6', color: '#9AA0A8' }
                          : { background: C.green, color: '#fff' }}
                      >
                        {followed ? s.followed : s.follow}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-1">
            {recPages.map((_, i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === recPage ? '#3B3A44' : '#D9DBE0' }} />
            ))}
          </div>
        </div>}
        <div className="h-20" />
      </div>

      {/* 绿色发布 FAB */}
      <button
        {...bindTap('post.compose.open.fromFollow')}
        className="absolute right-4 bottom-6 rounded-full border-none flex items-center justify-center text-white text-[20px]"
        style={{ width: 54, height: 54, background: C.green, boxShadow: '0 4px 12px rgba(36,199,137,.4)' }}
        aria-label="发布动态"
      >
        ✏️
      </button>
      {morePostId && (
        <CenterDialog
          title="更多操作"
          footer={(
            <div className="flex flex-col gap-2 w-full">
              {['不感兴趣', '举报', '取消'].map((label) => (
                <button
                  key={label}
                  {...bindTap(
                    { kind: 'action', id: 'discover.follow.more.select' },
                    {
                      params: { postId: morePostId, option: label },
                      onTrigger: () => {
                        setSearchParams((previous) => { const next = new URLSearchParams(previous); next.delete('more'); return next; }, { replace: true });
                        if (label !== '取消') toast(label === '举报' ? '已收到举报，我们会尽快处理' : '已减少此类内容推荐');
                      },
                    },
                  )}
                  className="w-full py-2.5 rounded-full border border-app-border bg-app-surface text-app-text"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        />
      )}
    </div>
  );
}
