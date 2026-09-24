import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Img } from '../components/ui';
import { Sheet, SheetRow, SheetIconRow, CenterDialog } from '../components/Sheet';
import { copyToClipboard, shareWithSystem } from '../capabilities';

// 节点: podcast.detail —— 播客详情(单集/播客主页 + 假播放器 + 分享/好友选择)。
// evidence: frame:52270a@t0094/t0095/t0096 / IMG_0278 / qa:Q1
// 播客主页态(view=show)深蓝主题皮肤(IMG_0278)
const SHOW_NAVY = '#26314E';
export default function PodcastDetailPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const users = useDoubanStore((s) => s.users);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const follows = useDoubanStore((s) => s.follows);
  const podcastSubscriptions = useDoubanStore((s) => s.podcastSubscriptions);
  const startPlayer = useDoubanStore((s) => s.startPlayer);
  const togglePodcastSubscription = useDoubanStore((s) => s.togglePodcastSubscription);
  const sendMessage = useDoubanStore((s) => s.sendMessage);
  const likes = useDoubanStore((s) => s.likes);
  const toggleLike = useDoubanStore((s) => s.toggleLike);

  const podcasts = useMemo(() => subjects.filter((s) => s.type === 'podcast'), [subjects]);
  const epId = routeParams.episodeId ?? podcasts[0]?.id ?? 'pc1';
  const ep = useMemo(() => podcasts.find((s) => s.id === epId) ?? podcasts[0], [podcasts, epId]);

  const me = currentUser.id;
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const friends = useMemo(() => follows.users.map((id) => userById.get(id)).filter((u): u is NonNullable<typeof u> => u != null), [follows.users, userById]);

  const view: 'episode' | 'show' = searchParams.get('view') === 'show' ? 'show' : 'episode';
  const showTab: 'episodes' | 'intro' = searchParams.get('showTab') === 'intro' ? 'intro' : 'episodes';
  const sheet = searchParams.get('sheet'); // share | friend
  const sendTo = searchParams.get('sendTo');
  const liked = !!(ep && likes.some((l) => l.targetType === 'subject' && l.targetId === ep.id && l.userId === me));

  const setP = (mut: (p: URLSearchParams) => void, replace = false) =>
    setSearchParams((p) => { mut(p); return p; }, replace ? { replace: true } : undefined);

  const subscribed = ep ? podcastSubscriptions.includes(ep.id) : false;

  const doStart = (chapterTitle?: string) => {
    if (!ep) return;
    startPlayer({
      title: chapterTitle ? `${ep.title} · ${chapterTitle}` : ep.title,
      sub: ep.showName ?? '',
      cover: ep.cover,
      remainingText: `剩余 ${ep.durationText ?? ep.duration ?? '未知'}`,
      playing: true,
      actions: { toggle: { id: 'podcast.detail.fakePlayer.toggle' }, close: { id: 'podcast.detail.fakePlayer.close' } },
    });
  };

  if (!ep) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>播客不存在</div>
      </div>
    );
  }

  const sendTarget = sendTo ? userById.get(sendTo) : undefined;
  const podcastShareText = `【豆瓣播客】${ep.showName}《${ep.title}》`;
  const podcastUrl = `https://www.douban.com/podcast/${ep.id}`;
  const shareExternally = () => {
    const launched = shareWithSystem(podcastShareText, (r) => { if (r.resultCode === 'OK') toast('分享成功'); });
    if (!launched) toast('无法打开系统分享');
    back();
  };
  const copyPodcastLink = () => {
    toast(copyToClipboard(podcastUrl) ? '链接已复制' : '无法访问剪切板');
    back();
  };

  const showView = view === 'show';
  const barFg = showView ? '#fff' : C.text;

  return (
    <div className="flex flex-col h-full relative" style={{ background: showView ? SHOW_NAVY : C.bg }} data-status-bar-foreground={showView ? 'light' : 'dark'}>
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-1 shrink-0" style={{ background: showView ? SHOW_NAVY : C.surface, borderBottom: showView ? 'none' : `1px solid ${C.border}` }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: barFg }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: barFg }}>
          {showView ? ep.showName : ''}
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'podcast.detail.share.open' }, { onTrigger: () => setP((p) => p.set('sheet', 'share')) })}
          className="w-10 h-10 flex items-center justify-center text-lg tracking-widest bg-transparent border-none cursor-pointer"
          style={{ color: barFg }}
        >
          ···
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {view === 'show' ? (
          /* ============ 播客主页态:深蓝主题 hero + 评分/订阅人数双卡 + 单集|播客介绍 tab ============ */
          <div>
            <div className="px-4 pt-4 pb-4" style={{ background: SHOW_NAVY }}>
              <div className="flex gap-3">
                <Img src={ep.cover} className="w-24 h-24 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-lg font-bold" style={{ color: '#fff' }}>{ep.showName}</div>
                  <div className="mt-1 text-xs" style={{ color: '#B7C2D6' }}>播客 {ep.genres?.[0] ?? '商业科技'} · 共 {ep.episodeCount ?? podcasts.length} 集</div>
                  <div className="flex-1" />
                  <button
                    {...bindTap({ kind: 'action', id: 'podcast.detail.subscribe.toggle' }, { onTrigger: () => { togglePodcastSubscription(ep.id); toast(subscribed ? '已取消订阅' : '订阅成功'); } })}
                    className="w-full h-9 rounded-full text-sm cursor-pointer flex items-center justify-center gap-1"
                    style={subscribed ? { background: 'rgba(255,255,255,0.12)', color: '#B7C2D6', border: '1px solid rgba(255,255,255,0.3)' } : { background: C.orange, color: '#fff', border: 'none' }}
                  >
                    {subscribed ? '✓ 已订阅' : '♡ 订阅'}
                  </button>
                </div>
              </div>
              {/* 豆瓣评分 / 订阅人数 双卡 */}
              <div className="mt-3 flex rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="flex-1 px-3 py-2.5 text-center">
                  <div className="text-[11px]" style={{ color: '#B7C2D6' }}>豆瓣评分®</div>
                  <div className="text-xs mt-1" style={{ color: '#fff' }}>暂无评分 <span style={{ color: C.orange }}>去评价 ›</span></div>
                </div>
                <div className="w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
                <div className="flex-1 px-3 py-2.5 text-center">
                  <div className="text-[11px]" style={{ color: '#B7C2D6' }}>订阅人数</div>
                  <div className="text-base font-bold mt-0.5" style={{ color: '#fff' }}>556</div>
                </div>
              </div>
            </div>
            {/* 单集|播客介绍 tab */}
            <div className="flex px-4 border-b bg-white" style={{ borderColor: C.border }}>
              {([['episodes', '单集'], ['intro', '播客介绍']] as const).map(([id, label]) => {
                const active = showTab === id;
                return (
                  <button
                    key={id}
                    {...bindTap({ kind: 'action', id: 'podcast.detail.showTab.select.target' }, { params: { target: id }, onTrigger: () => setP((p) => p.set('showTab', id), true) })}
                    className="mr-6 py-2.5 bg-transparent border-none cursor-pointer relative text-sm"
                    style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
                  >
                    {label}
                    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
                  </button>
                );
              })}
            </div>
            {showTab === 'intro' ? (
              <div className="px-4 py-4 text-sm leading-relaxed bg-white" style={{ color: C.text }}>{ep.intro ?? '暂无介绍'}</div>
            ) : (
              <div className="pb-6 bg-white">
                {/* 期数 + 排序行 */}
                <div className="flex items-center px-4 py-2.5 border-b" style={{ borderColor: '#F5F6F7' }}>
                  <span className="text-sm font-semibold" style={{ color: C.text }}>{ep.episodeCount ?? podcasts.length}期</span>
                  <span className="flex-1" />
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.8"><path d="M3 6h18M6 12h12M10 18h4" /></svg>
                </div>
                {podcasts.map((p) => (
                  <button
                    key={p.id}
                    {...bindTap({ kind: 'action', id: 'podcast.detail.showTab.select.target' }, { params: { target: p.id }, onTrigger: () => setP((pp) => { pp.delete('view'); pp.delete('showTab'); }, true) })}
                    className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left border-b"
                    style={{ borderColor: '#F5F6F7' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: C.text }}>{p.title}</div>
                      <div className="text-xs mt-1" style={{ color: C.sub }}>{p.dateText} · {p.durationText}</div>
                    </div>
                    <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FFF0DA' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={C.orange}><path d="M8 5v14l11-7z" /></svg>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ============ 单集详情态 ============ */
          <>
            {/* 单集头 */}
            <div className="bg-white px-4 pt-3 pb-4">
              <div className="text-xs" style={{ color: C.sub }}>{ep.dateText}</div>
              <div className="mt-1 text-[20px] font-bold leading-snug" style={{ color: C.text }}>{ep.title}</div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-xs" style={{ color: C.sub }}>{ep.durationText}</span>
                <button
                  {...bindTap({ kind: 'action', id: 'podcast.detail.playlist.add' }, { onTrigger: () => toast('已添加到播放列表') })}
                  className="flex items-center text-lg bg-transparent border-none cursor-pointer"
                  style={{ color: C.sub }}
                  aria-label="加入播放列表"
                >
                  ＋≡
                </button>
                <div className="flex-1" />
                <button
                  {...bindTap({ kind: 'action', id: 'podcast.detail.fakePlayer.start' }, { onTrigger: () => doStart() })}
                  className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer"
                  style={{ background: '#FFF0DA' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={C.orange}><path d="M8 5v14l11-7z" /></svg>
                </button>
              </div>
            </div>

            {/* 播客卡:米粉底、meta 含分类、米底橙字订阅 */}
            <div className="mt-2 mx-4 rounded-xl px-3 py-3" style={{ background: '#FBEFEE' }}>
              <div className="flex items-center gap-3">
                <button
                  {...bindTap({ kind: 'action', id: 'podcast.detail.show.open' }, { onTrigger: () => setP((p) => { p.set('view', 'show'); p.set('showTab', 'episodes'); }) })}
                  className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left"
                >
                  <Img src={ep.cover} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{ep.showName}</div>
                    <div className="text-xs mt-0.5" style={{ color: C.sub }}>播客 {ep.genres?.[0] ?? '商业科技'} / 共{ep.episodeCount ?? podcasts.length}集</div>
                  </div>
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'podcast.detail.subscribe.toggle' }, { onTrigger: () => { togglePodcastSubscription(ep.id); toast(subscribed ? '已取消订阅' : '订阅成功'); } })}
                  className="px-3.5 h-8 rounded-full text-sm cursor-pointer shrink-0 flex items-center gap-1"
                  style={subscribed ? { background: '#F2F3F5', color: C.sub, border: 'none' } : { background: '#FFF4E5', color: C.orange, border: 'none' }}
                >
                  {subscribed ? '✓ 已订阅' : '♡ 订阅'}
                </button>
              </div>
            </div>

            {/* 本期嘉宾 */}
            {ep.guests && ep.guests.length > 0 && (
              <div className="mt-2 bg-white px-4 py-3">
                <div className="text-base font-bold mb-1.5" style={{ color: C.text }}>🎤本期嘉宾:</div>
                <div className="text-sm" style={{ color: C.text }}>{ep.guests.join(' / ')}</div>
              </div>
            )}

            {/* 本期简介 */}
            {ep.intro && (
              <div className="mt-2 bg-white px-4 py-3">
                <div className="text-base font-bold mb-1.5" style={{ color: C.text }}>▶️本期简介:</div>
                <div className="text-sm leading-relaxed" style={{ color: C.text }}>{ep.intro}</div>
              </div>
            )}

            {/* 时间轴 */}
            {ep.chapters && ep.chapters.length > 0 && (
              <div className="mt-2 bg-white px-4 py-3">
                <div className="text-base font-bold mb-2" style={{ color: C.text }}>🎯时间轴</div>
                {ep.chapters.map((ch, i) => (
                  <button
                    key={i}
                    {...bindTap({ kind: 'action', id: 'podcast.detail.chapter.play' }, { onTrigger: () => doStart(ch.title) })}
                    className="w-full flex items-start gap-3 py-2 bg-transparent border-none cursor-pointer text-left"
                  >
                    <span className="text-xs font-mono shrink-0 mt-0.5 underline" style={{ color: C.green }}>{ch.time}</span>
                    <span className="text-sm" style={{ color: C.text }}>{ch.title}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="h-24" />
          </>
        )}
      </div>

      {/* 底部两层:①按钮行(灰 加入播放列表 pill + 橙 立即收听)②工具行 💬/👍/🔁/🔖(带计数) */}
      {view === 'episode' && (
        <div className="shrink-0 border-t bg-white" style={{ borderColor: C.border }} data-hide-on-keyboard="true">
          <div className="flex items-center gap-2 px-3 pt-2">
            <button
              {...bindTap({ kind: 'action', id: 'podcast.detail.playlist.add' }, { onTrigger: () => toast('已添加到播放列表') })}
              className="flex items-center justify-center gap-1 flex-1 h-9 rounded-full text-sm cursor-pointer"
              style={{ background: '#F2F3F5', color: C.text, border: 'none' }}
            >
              ＋≡ 加入播放列表
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'podcast.detail.fakePlayer.start' }, { onTrigger: () => doStart() })}
              className="flex items-center justify-center gap-1 flex-1 h-9 rounded-full text-sm text-white cursor-pointer"
              style={{ background: C.orange, border: 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              立即收听
            </button>
          </div>
          <div className="flex items-center justify-around px-3 py-1.5">
            <span className="flex items-center gap-1 text-xs" style={{ color: C.sub }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 01-8.5 8.5 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 010-7.6A8.38 8.38 0 0112.5 3 8.38 8.38 0 0121 11.5z" /></svg>
              评论
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'podcast.detail.like.toggle' }, {
                onTrigger: () => { if (ep) toggleLike('subject', ep.id); },
              })}
              className="flex items-center gap-1 text-xs bg-transparent border-none cursor-pointer"
              style={{ color: liked ? C.orange : C.sub }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? C.orange : 'none'} stroke="currentColor" strokeWidth="1.8"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" /></svg>
              {12 + (liked ? 1 : 0)}
            </button>
            <span className="flex items-center gap-1 text-xs" style={{ color: C.sub }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" /></svg>
              2
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'podcast.detail.collect.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="flex items-center gap-1 text-xs bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" /></svg>
              3
            </button>
          </div>
        </div>
      )}

      {/* ============ 分享面板 ============ */}
      {sheet === 'share' && (
        <Sheet title="分享">
          <SheetRow
            label="提醒和私信"
            icon={<span>💬</span>}
            bind={bindTap({ kind: 'action', id: 'podcast.detail.shareFriend.open' }, { onTrigger: () => setP((p) => p.set('sheet', 'friend'), true) })}
          />
          {/* 行1:分享海报/动态/小组/微信/朋友圈 */}
          <SheetIconRow
            items={[
              { icon: <span>🖼️</span>, label: '分享海报', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareExternal.wontfix' }, { onTrigger: shareExternally }) },
              { icon: <span>📣</span>, label: '动态', bind: bindTap('podcast.detail.shareCompose-open') },
              { icon: <span>👥</span>, label: '小组', bind: bindTap('podcast.detail.shareCompose-open') },
              { icon: <span>💚</span>, label: '微信', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareExternal.wontfix' }, { onTrigger: shareExternally }) },
              { icon: <span>🌈</span>, label: '朋友圈', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareExternal.wontfix' }, { onTrigger: shareExternally }) },
            ]}
          />
          {/* 行2:认证播客/分享到聊天/复制链接/更多(真机含「收藏到豆列」,锁定规则:播客无豆列收藏,故略去;真机无「投诉」) */}
          <SheetIconRow
            items={[
              { icon: <span>⭐</span>, label: '认证播客', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareExternal.wontfix' }, { onTrigger: shareExternally }) },
              { icon: <span>💬</span>, label: '分享到聊天', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareFriend.open' }, { onTrigger: () => setP((p) => p.set('sheet', 'friend'), true) }) },
              { icon: <span>🔗</span>, label: '复制链接', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareExternal.wontfix' }, { onTrigger: copyPodcastLink }) },
              { icon: <span>···</span>, label: '更多', bind: bindTap({ kind: 'action', id: 'podcast.detail.shareExternal.wontfix' }, { onTrigger: shareExternally }) },
            ]}
          />
          <div className="px-4 pt-1">
            <button {...bindBack()} className="w-full h-11 rounded-full text-[15px] cursor-pointer" style={{ background: '#F2F3F5', color: C.text, border: 'none' }}>取消</button>
          </div>
        </Sheet>
      )}

      {/* ============ 好友选择页 ============ */}
      {sheet === 'friend' && (
        <div className="absolute inset-0 z-40 flex flex-col bg-white" data-status-bar-foreground="dark">
          <div className="flex items-center h-11 px-1 border-b shrink-0" style={{ borderColor: C.border }}>
            <button {...bindBack()} className="px-3 text-sm bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>取消</button>
            <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>选择好友</div>
            <div className="w-14" />
          </div>
          <div className="px-4 py-2 text-xs" style={{ color: C.sub }}>查找所有友邻</div>
          <div className="flex-1 overflow-y-auto" data-scroll-container="friends" data-scroll-direction="vertical">
            {friends.map((u) => (
              <button
                key={u.id}
                onClick={() => setP((p) => p.set('sendTo', u.id))}
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-transparent border-none cursor-pointer text-left"
              >
                <Avatar src={u.avatar} size={40} />
                <span className="text-sm" style={{ color: C.text }}>{u.name}</span>
              </button>
            ))}
          </div>
          {/* 发送确认卡 */}
          {sendTarget && (
            <CenterDialog
              title={`发送给 ${sendTarget.name}`}
              buttons={[
                { label: '取消', bind: { onClick: () => setP((p) => p.delete('sendTo'), true) } },
                {
                  label: '发送',
                  primary: true,
                  bind: bindTap({ kind: 'action', id: 'podcast.detail.shareFriend.send' }, {
                    onTrigger: () => {
                      sendMessage(sendTarget.id, `[播客分享] ${ep.showName}《${ep.title}》`);
                      toast('已发送');
                      back();
                      back();
                    },
                  }),
                },
              ]}
            >
              <div className="flex items-center gap-2.5 py-1">
                <Img src={ep.cover} className="w-11 h-11 rounded object-cover shrink-0" />
                <div className="text-left min-w-0">
                  <div className="text-sm truncate" style={{ color: C.text }}>{ep.title}</div>
                  <div className="text-xs" style={{ color: C.sub }}>{ep.showName}</div>
                </div>
              </div>
            </CenterDialog>
          )}
        </div>
      )}
    </div>
  );
}
