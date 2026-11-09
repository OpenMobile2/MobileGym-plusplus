import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shareWithSystem } from '../capabilities';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { CenterDialog } from '../components/Sheet';
import { Img } from '../res/images';
import { IcNavBack, IcShare, IcMore, IcComment, IcStar } from '../res/icons';
import { profileKeyOf } from '../store/profileHelpers';

const QUICK_BULLETS = ['太强了', '加油加油', '好看的轨迹', '下次一起'];
const INPUT_EMOJIS = ['😀', '😂', '😍', '💪', '🔥', '👍', '🎉', '🏃'];

/** 动态/运动记录帖详情(含评论区)—— 证据 n14/n15/n16/n19/n20 */
export default function PostDetailPage() {
  const { bindTap, bindBack } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const current = useKeepStore((st) => st.current);
  const posts = useKeepStore((st) => st.posts);
  const routes = useKeepStore((st) => st.routes);
  const coaches = useKeepStore((st) => st.coaches);
  const cheeredPosts = useKeepStore((st) => st.cheeredPosts) ?? [];
  const favedPosts = useKeepStore((st) => st.favedPosts) ?? [];
  const emojiReacted = useKeepStore((st) => st.emojiReacted) ?? {};
  const followedUsers = useKeepStore((st) => st.followedUsers) ?? [];
  const followedNames = useKeepStore((st) => st.followedNames) ?? [];
  const followedCoaches = useKeepStore((st) => st.followedCoaches) ?? [];
  const cheerPost = useKeepStore((st) => st.cheerPost);
  const favPost = useKeepStore((st) => st.favPost);
  const reactPostEmoji = useKeepStore((st) => st.reactPostEmoji);
  const postComment = useKeepStore((st) => st.postComment);
  const toggleFollowUser = useKeepStore((st) => st.toggleFollowUser);

  const post = posts.find((p) => p.id === current.postId);
  if (!post) {
    return (
      <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-2 shrink-0 bg-app-surface">
          <button {...bindBack()} className="p-2 bg-transparent border-none text-app-text" aria-label={s.back}>
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center font-semibold text-[16px] text-app-text">动态详情</div>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-[15px] font-medium text-app-text">未找到该动态</div>
          <p className="text-[13px] text-app-text-muted mt-2">请返回列表重新选择</p>
        </div>
      </div>
    );
  }
  const cheered = cheeredPosts.includes(post.id);
  const faved = favedPosts.includes(post.id);
  const reacted = emojiReacted[post.id] ?? [];
  const followed = followedUsers.includes(post.author)
    || followedNames.includes(post.author)
    || Boolean(post.authorId && followedCoaches.includes(post.authorId));

  const sort = searchParams.get('sort') ?? 'rec';
  const showAll = searchParams.get('all') === '1';
  const expandedReplies = (searchParams.get('reps') ?? '').split(',').filter(Boolean);
  const emojiPanelOpen = searchParams.get('ep') === '1';
  const moreOpen = searchParams.get('more') === '1';
  const [draft, setDraft] = useState('');
  const commentsRef = useRef<HTMLDivElement>(null);

  const sortedComments = [...post.comments].sort((a, b) =>
    sort === 'time' ? (a.time < b.time ? 1 : -1) : b.likes - a.likes,
  );
  const visibleComments = showAll ? sortedComments : sortedComments.slice(0, 3);
  const restCount = Math.max(0, post.commentsCount - visibleComments.length);

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      {/* 顶部导航:返回 / 作者 / 关注 */}
      <div className="flex items-center h-12 px-2 shrink-0 gap-1">
        <button {...bindBack()} className="p-1.5 bg-transparent border-none text-app-text" aria-label={s.back}>
          <IcNavBack size={22} />
        </button>
        <button
          {...bindTap('coach.profile.open.fromPost', {
            params: { coachId: profileKeyOf(post) },
            beforeTrigger: () => setCurrent('coachId', profileKeyOf(post)),
          })}
          className="flex items-center gap-2 bg-transparent border-none p-0 text-left min-w-0"
        >
          <Img id={post.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt={post.author} />
          <span className="text-[15px] font-semibold text-app-text truncate">{post.author}</span>
        </button>
        <div className="flex-1" />
        <button
          {...bindTap(
            { kind: 'action', id: 'post.detail.follow.toggle' },
            { onTrigger: () => toggleFollowUser(post.author) },
          )}
          className="px-3.5 py-1.5 rounded-full border-none text-[13px] shrink-0"
          style={followed ? { background: '#F2F3F6', color: '#9AA0A8' } : { background: C.green, color: '#fff' }}
        >
          {followed ? s.followed : `+ ${s.follow}`}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'post.detail.share.submit' }, {
            onTrigger: () => {
              const launched = shareWithSystem(
                `【Keep】${post.author}：${post.content}`,
                (result) => { if (result.resultCode === 'OK') toast('分享成功'); },
              );
              if (!launched) toast(s.notOpen);
            },
          })}
          aria-label="分享"
          className="mx-1 p-1 bg-transparent border-none"
        >
          <IcShare size={18} className="text-app-text-muted" />
        </button>
        <button
          {...bindTap(
            { kind: 'action', id: 'post.detail.more.open' },
            { onTrigger: () => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('more', '1'); return next; }, { replace: true }) },
          )}
          aria-label="更多操作"
          className="mr-1 p-1 bg-transparent border-none"
        >
          <IcMore size={18} className="text-app-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 运动数据卡 */}
        {post.sportData && (
          <div className="px-4">
            <div className="flex items-center">
              <span className="text-[20px] font-bold text-app-text">
                🚴 {post.sportData.type} {post.sportData.km} 公里
              </span>
              <div className="flex-1" />
              {post.sportData.medal && (
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-[16px]" style={{ background: '#FFF3D6' }}>
                  {post.sportData.medal.includes('金') ? '🥇' : '🥈'}
                </span>
              )}
            </div>
            <div className="flex mt-3">
              <div className="flex-1">
                <div className="text-[12px] text-app-text-muted">训练时长</div>
                <div className="text-[20px] font-bold text-app-text mt-0.5">{post.sportData.duration}</div>
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-app-text-muted">运动消耗</div>
                <div className="text-[20px] font-bold text-app-text mt-0.5">{post.sportData.kcal} <span className="text-[12px] font-normal">千卡</span></div>
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-app-text-muted">平均速度</div>
                <div className="text-[20px] font-bold text-app-text mt-0.5">{post.sportData.speed ?? '--'} <span className="text-[12px] font-normal">千米/时</span></div>
              </div>
            </div>
            {(post.sportData.achievement || post.sportData.rank) && (
              <div className="flex items-center gap-1.5 mt-3 px-3 py-2 rounded-lg text-[13px]" style={{ background: '#F7F4EC', color: '#8A6D2F' }}>
                🏅 {post.sportData.achievement ?? post.sportData.rank}
              </div>
            )}
            {/* 轨迹图 + 照片 */}
            <div className="flex gap-2 mt-3">
              <Img id="map_route" className="flex-1 h-44 rounded-xl object-cover min-w-0" alt="轨迹图" />
              {post.images[0] && <Img id={post.images[0]} className="flex-1 h-44 rounded-xl object-cover min-w-0" alt="照片" />}
            </div>
          </div>
        )}

        {/* 正文 */}
        <div className="px-4 mt-3 text-[15px] text-app-text leading-relaxed">{post.content}</div>
        {!post.sportData && post.images[0] && (
          <div className="px-4 mt-3">
            <Img id={post.images[0]} className="w-full h-56 rounded-xl object-cover" alt="配图" />
          </div>
        )}

        {/* 挑战卡 */}
        <div className="px-4 mt-3">
          <button
            {...bindTap({ kind: 'action', id: 'post.detail.challenge.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
            className="w-full flex items-center gap-3 rounded-xl border-none px-3.5 py-3 text-left"
            style={{ background: 'linear-gradient(120deg, #2B2438, #4A3364)' }}
          >
            <span className="w-10 h-10 rounded-lg flex items-center justify-center text-[18px] shrink-0" style={{ background: 'rgba(255,255,255,.14)' }}>🎤</span>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-white">Keep 邀你看演唱会 | 赴约挑战赛</div>
              <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,.65)' }}>4.5 万人参与 · 作者完成</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,.65)' }}>›</span>
          </button>
        </div>

        {/* 相关路线横排 */}
        <div className="px-4 mt-4">
          <div className="text-[15px] font-semibold text-app-text mb-2">作者推荐</div>
          <div className="flex flex-col gap-2">
            {routes.slice(0, 3).map((r) => (
              <button
                key={r.id}
                {...bindTap('route.detail.open.fromPost', {
                  params: { routeId: r.id },
                  beforeTrigger: () => setCurrent('routeId', r.id),
                })}
                className="flex items-center gap-3 rounded-xl border-none px-3 py-2.5 text-left"
                style={{ background: '#F5F6F8' }}
              >
                <Img id={r.cover} className="w-16 h-12 rounded-lg object-cover shrink-0" alt={r.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-app-text truncate">{r.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[12px] text-app-text-muted">全长 {r.km} 公里</span>
                    <span className="text-[10px] px-1 rounded border" style={{ color: C.greenDeep, borderColor: C.green }}>相关路线</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="text-[12px] text-app-text-muted mt-3">{post.time} {post.region.replace('IP ', '')}</div>
        </div>

        {/* 评论区 */}
        <div ref={commentsRef} className="px-4 mt-4 pb-6">
          <div className="flex items-center">
            <span className="text-[16px] font-semibold text-app-text">评论 {post.commentsCount}</span>
            <div className="flex-1" />
            <button
              {...bindTap(
                { kind: 'action', id: 'post.detail.comment.sort' },
                {
                  params: { sort: 'rec' },
                  onTrigger: () => setSearchParams((p) => { p.set('sort', 'rec'); return p; }, { replace: true }),
                },
              )}
              className="bg-transparent border-none p-0 text-[13px]"
              style={{ color: sort === 'rec' ? '#1A1A1A' : '#9AA0A8', fontWeight: sort === 'rec' ? 600 : 400 }}
            >
              按推荐
            </button>
            <span className="text-app-text-muted mx-1.5 text-[12px]">|</span>
            <button
              {...bindTap(
                { kind: 'action', id: 'post.detail.comment.sort' },
                {
                  params: { sort: 'time' },
                  onTrigger: () => setSearchParams((p) => { p.set('sort', 'time'); return p; }, { replace: true }),
                },
              )}
              className="bg-transparent border-none p-0 text-[13px]"
              style={{ color: sort === 'time' ? '#1A1A1A' : '#9AA0A8', fontWeight: sort === 'time' ? 600 : 400 }}
            >
              按时间
            </button>
          </div>

          {visibleComments.map((cm) => {
            const expanded = expandedReplies.includes(cm.id);
            const shownReplies = expanded ? cm.replies : cm.replies.slice(0, 1);
            return (
              <div key={cm.id} className="flex gap-2.5 mt-4">
                <Img id={cm.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt={cm.author} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <span className="text-[13px] text-app-text-muted">{cm.author}</span>
                    <div className="flex-1" />
                    <span className="text-[12px] text-app-text-muted">📣 {cm.likes > 0 ? cm.likes : ''}</span>
                  </div>
                  <div className="text-[15px] text-app-text mt-1 leading-snug">{cm.content}</div>
                  <div className="text-[12px] text-app-text-muted mt-1">{cm.time} · {cm.region} 回复</div>
                  {shownReplies.map((rp) => (
                    <div key={rp.id} className="mt-2.5 pl-2">
                      <div className="text-[13px] text-app-text-muted">{rp.author}</div>
                      <div className="text-[14px] text-app-text mt-0.5 leading-snug">{rp.content}</div>
                      <div className="text-[12px] text-app-text-muted mt-0.5">{rp.time} · {rp.region} 回复</div>
                    </div>
                  ))}
                  {cm.replies.length > 1 && !expanded && (
                    <button
                      {...bindTap(
                        { kind: 'action', id: 'post.detail.replies.expand' },
                        {
                          params: { commentId: cm.id },
                          onTrigger: () =>
                            setSearchParams((p) => {
                              p.set('reps', [...expandedReplies, cm.id].join(','));
                              return p;
                            }, { replace: true }),
                        },
                      )}
                      className="bg-transparent border-none p-0 mt-2 text-[13px] flex items-center gap-1"
                      style={{ color: C.greenDeep }}
                    >
                      —— 查看更多回复 ⌄
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {!showAll && restCount > 0 && (
            <button
              {...bindTap(
                { kind: 'action', id: 'post.detail.comments.expandAll' },
                { onTrigger: () => setSearchParams((p) => { p.set('all', '1'); return p; }, { replace: true }) },
              )}
              className="w-full bg-transparent border-none py-3 mt-2 text-[14px] text-app-text"
            >
              查看 {restCount} 条评论 ›
            </button>
          )}

          {/* 相关推荐博主 */}
          <div className="text-[16px] font-semibold text-app-text mt-5 mb-1">相关推荐</div>
          {coaches.slice(0, 2).map((co) => {
            const cFollowed = followedUsers.includes(co.name)
              || followedNames.includes(co.name)
              || followedCoaches.includes(co.id);
            return (
              <div key={co.id} className="flex items-center gap-3 py-2.5">
                <button
                  {...bindTap('coach.profile.open.fromPostRecommend', {
                    params: { coachId: co.id },
                    beforeTrigger: () => setCurrent('coachId', co.id),
                  })}
                  className="flex items-center gap-3 bg-transparent border-none p-0 text-left flex-1 min-w-0"
                >
                  <Img id={co.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" alt={co.name} />
                  <div className="min-w-0">
                    <div className="text-[15px] text-app-text truncate">{co.name}</div>
                    <div className="text-[12px] text-app-text-muted mt-0.5">{co.fans} 粉丝 · {co.certs[0] ?? '运动达人'}</div>
                  </div>
                </button>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'post.detail.recommend.follow.toggle' },
                    { params: { name: co.name }, onTrigger: () => toggleFollowUser(co.name) },
                  )}
                  className="px-4 py-1.5 rounded-full border-none text-[13px] shrink-0"
                  style={cFollowed ? { background: '#F2F3F6', color: '#9AA0A8' } : { background: C.green, color: '#fff' }}
                >
                  {cFollowed ? s.followed : s.follow}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部互动区 */}
      <div className="shrink-0 border-t border-app-border bg-app-surface px-3 pt-2 pb-2" data-keep-keyboard="true">
        {/* 表情反馈条 */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Object.entries(post.emojis).map(([emoji, cnt]) => {
            const on = reacted.includes(emoji);
            return (
              <button
                key={emoji}
                {...bindTap(
                  { kind: 'action', id: 'post.detail.emoji.react' },
                  { params: { emoji }, onTrigger: () => reactPostEmoji(post.id, emoji) },
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
          {/* 快捷弹幕 chips */}
          {QUICK_BULLETS.map((qb) => (
            <button
              key={qb}
              {...bindTap(
                { kind: 'action', id: 'post.detail.quickbullet.send' },
                { params: { text: qb }, onTrigger: () => postComment(post.id, qb) },
              )}
              className="px-2.5 py-1 rounded-full shrink-0 text-[12px] border border-app-border bg-transparent text-app-text-muted"
            >
              {qb}
            </button>
          ))}
        </div>
        {/* 表情面板 */}
        {emojiPanelOpen && (
          <div className="flex gap-2 flex-wrap py-2">
            {INPUT_EMOJIS.map((e) => (
              <button
                key={e}
                {...bindTap(
                  { kind: 'action', id: 'post.detail.input.emoji' },
                  { params: { emoji: e }, onTrigger: () => setDraft((t) => t + e) },
                )}
                className="w-9 h-9 rounded-lg bg-transparent border-none text-[20px]"
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center h-9 px-3 rounded-full" style={{ background: '#F2F3F6' }}>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="说点什么"
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-app-text"
            />
            <button
              {...bindTap(
                { kind: 'action', id: 'post.detail.input.emoji' },
                {
                  onTrigger: () =>
                    setSearchParams((p) => {
                      if (emojiPanelOpen) p.delete('ep'); else p.set('ep', '1');
                      return p;
                    }, { replace: true }),
                },
              )}
              className="bg-transparent border-none p-0 text-[16px]"
              aria-label="表情"
            >
              😊
            </button>
          </div>
          {draft.trim() ? (
            <button
              {...bindTap(
                { kind: 'action', id: 'post.detail.comment.post' },
                {
                  params: { value: draft },
                  onTrigger: () => { postComment(post.id, draft); setDraft(''); },
                },
              )}
              className="px-3.5 py-1.5 rounded-full border-none text-[13px] text-white shrink-0"
              style={{ background: C.green }}
            >
              发送
            </button>
          ) : (
            <>
              <button
                {...bindTap(
                  { kind: 'action', id: 'post.detail.cheer.toggle' },
                  { onTrigger: () => cheerPost(post.id) },
                )}
                className="flex items-center gap-1 bg-transparent border-none p-0 text-[13px] shrink-0"
                style={{ color: cheered ? C.green : '#5A5F68' }}
              >
                📣 {post.cheers}
              </button>
              <button
                {...bindTap(
                  { kind: 'action', id: 'post.detail.comment.anchor' },
                  { onTrigger: () => commentsRef.current?.scrollIntoView({ behavior: 'smooth' }) },
                )}
                className="flex items-center gap-1 bg-transparent border-none p-0 text-[13px] text-app-text-muted shrink-0"
              >
                <IcComment size={16} /> {post.commentsCount}
              </button>
              <button
                {...bindTap(
                  { kind: 'action', id: 'post.detail.fav.toggle' },
                  { onTrigger: () => favPost(post.id) },
                )}
                className="flex items-center gap-1 bg-transparent border-none p-0 text-[13px] shrink-0"
                style={{ color: faved ? '#E8B33C' : '#5A5F68' }}
              >
                <IcStar size={16} /> {post.collects}
              </button>
            </>
          )}
        </div>
      </div>
      {moreOpen && (
        <CenterDialog
          title="更多操作"
          footer={(
            <div className="flex flex-col gap-2 w-full">
              {['不感兴趣', '举报', '取消'].map((label) => (
                <button
                  key={label}
                  {...bindTap(
                    { kind: 'action', id: 'post.detail.more.select' },
                    {
                      params: { option: label },
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
