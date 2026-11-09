import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, EmptyState } from '../components/ui';

// 节点: podcast.subscriptions —— 订阅更新(我的播客):feed / mine 双态。
// evidence: IMG_0376/0352/0377
export default function PodcastSubscriptionsPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const podcastSubscriptions = useDoubanStore((s) => s.podcastSubscriptions);
  const togglePodcastSubscription = useDoubanStore((s) => s.togglePodcastSubscription);
  const startPlayer = useDoubanStore((s) => s.startPlayer);

  const podcasts = useMemo(() => subjects.filter((s) => s.type === 'podcast'), [subjects]);
  const subscribed = useMemo(() => podcasts.filter((p) => podcastSubscriptions.includes(p.id)), [podcasts, podcastSubscriptions]);

  const view: 'feed' | 'mine' = searchParams.get('view') === 'mine' ? 'mine' : 'feed';
  const [manage, setManage] = useState(false);

  const setP = (mut: (p: URLSearchParams) => void, replace = false) =>
    setSearchParams((p) => { mut(p); return p; }, replace ? { replace: true } : undefined);

  const doStart = (p: (typeof podcasts)[number]) =>
    startPlayer({
      title: p.title,
      sub: p.showName ?? '',
      cover: p.cover,
      remainingText: `剩余 ${p.durationText ?? '未知'}`,
      playing: true,
      actions: { toggle: { id: 'podcast.subscriptions.fakePlayer.start' }, close: { id: 'podcast.subscriptions.fakePlayer.start' } },
    });

  // feed 平铺列表(日期做行内 meta,非分组头)
  const feed = useMemo(() => (subscribed.length > 0 ? subscribed : podcasts), [subscribed, podcasts]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>{view === 'mine' ? '我的播客' : '订阅更新'}</div>
        <button
          {...bindTap({ kind: 'action', id: 'podcast.subscriptions.manage.toggle' }, { onTrigger: () => { setManage((v) => !v); toast(manage ? '退出管理' : '管理播客'); } })}
          className="px-3 text-sm bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
        >
          {manage ? '完成' : '管理播客'}
        </button>
      </div>

      {/* 订阅/听过(mine) tab 切换 */}
      <div className="shrink-0 flex px-4 bg-white border-b" style={{ borderColor: C.border }}>
        {([['feed', '订阅更新'], ['mine', '我的播客']] as const).map(([id, label]) => {
          const active = view === id;
          return (
            <button
              key={id}
              {...bindTap({ kind: 'action', id: 'podcast.subscriptions.tab.select.target' }, { params: { target: id }, onTrigger: () => setP((p) => (id === 'feed' ? p.delete('view') : p.set('view', 'mine')), true) })}
              className="mr-6 py-2.5 bg-transparent border-none cursor-pointer relative text-sm"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {view === 'mine' ? (
          /* ============ 我的播客态 ============ */
          subscribed.length === 0 ? (
            <EmptyState text="还没有订阅的播客" />
          ) : (
            <div className="grid grid-cols-3 gap-3 p-4">
              {subscribed.map((p) => (
                <button
                  key={p.id}
                  {...bindTap('podcast.subscriptions.show-open', { params: { episodeId: p.id } })}
                  className="bg-transparent border-none cursor-pointer text-left p-0"
                >
                  <Img src={p.cover} className="w-full aspect-square rounded-lg object-cover" />
                  <div className="mt-1.5 text-xs truncate" style={{ color: C.text }}>{p.showName ?? p.title}</div>
                </button>
              ))}
            </div>
          )
        ) : (
          /* ============ 订阅更新 feed:大封面 + 行内日期(标题上方)+ 时长独立行 + 淡橙▶ ============ */
          feed.map((p) => (
            <div key={p.id} className="flex gap-3 bg-white px-4 py-3 border-b" style={{ borderColor: '#F5F6F7' }}>
              <button
                {...bindTap('podcast.subscriptions.episode-open', { params: { episodeId: p.id } })}
                className="flex gap-3 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
              >
                <Img src={p.cover} className="w-[72px] h-[72px] rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px]" style={{ color: C.sub }}>{p.dateText} · {p.showName}</div>
                  <div className="text-sm mt-0.5 line-clamp-2" style={{ color: C.text }}>{p.title}</div>
                  <div className="text-xs mt-1" style={{ color: C.sub }}>{p.durationText}</div>
                </div>
              </button>
              <div className="flex flex-col items-center justify-end gap-2 shrink-0">
                {manage ? (
                  <button
                    {...bindTap({ kind: 'action', id: 'podcast.subscriptions.manage.toggle' }, { onTrigger: () => { togglePodcastSubscription(p.id); toast('已取消订阅'); } })}
                    className="px-3 h-7 rounded-full text-xs cursor-pointer"
                    style={{ background: 'transparent', color: C.danger, border: `1px solid ${C.danger}` }}
                  >
                    取消订阅
                  </button>
                ) : (
                  <>
                    <button
                      {...bindTap({ kind: 'action', id: 'podcast.subscriptions.playlist.add' }, { onTrigger: () => toast('已添加到播放列表') })}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer"
                      style={{ color: C.sub }}
                      aria-label="加入播放列表"
                    >
                      ＋≡
                    </button>
                    <button
                      {...bindTap({ kind: 'action', id: 'podcast.subscriptions.fakePlayer.start' }, { onTrigger: () => doStart(p) })}
                      className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer"
                      style={{ background: '#FFF0DA' }}
                      aria-label="播放"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill={C.orange}><path d="M8 5v14l11-7z" /></svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
