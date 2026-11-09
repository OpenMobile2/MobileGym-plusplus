import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useXianyuStrings } from '../hooks/useXianyuStrings';
import { HOME_SEGMENTS, HOME_CHANNELS, KINGKONG_GRID } from '../constants';
import { ItemCard } from '../components/ItemCard';
import { useToast } from '../components/ui';
import { Avatar } from '../components/ItemImage';
import { IcSearch, IcCamera } from '../res/icons';

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, go } = useXianyuGestures();
  const s = useXianyuStrings();
  const [toast, showToast] = useToast();
  const items = useXianyuStore((st) => st.items);
  const followedSellers = useXianyuStore((st) => st.followedSellers);
  const sellers = useXianyuStore((st) => st.sellers);
  const recordTaskAudit = useXianyuStore((st) => st.recordTaskAudit);

  const channel = searchParams.get('channel') ?? 'recommend';

  const followFeed = items.filter((i) => followedSellers.includes(i.sellerId));
  const showFollowEmpty = channel === 'follow' && followFeed.length === 0;
  const list = channel === 'follow' ? followFeed : items;
  const col = (mod: number) => list.filter((_, idx) => idx % 2 === mod);

  const onKingkong = (k: (typeof KINGKONG_GRID)[number]) => {
    if ('route' in k && k.route) { go('home.recycle-open', {}, { mode: 'replace' }); return; }
    if ('keyword' in k && k.keyword) { go('home.category-open', { keyword: k.keyword }); return; }
    showToast(s.wontfix);
  };

  const SEG_LABEL: Record<string, string> = {
    home: s.segHome,
    market: s.segMarket,
    circle: s.segCircle,
    recycle: s.segRecycle,
  };

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="dark">
      {/* 顶部分段栏 + 搜索 */}
      <div className="bg-app-surface shrink-0">
        <div className="flex items-center gap-4 px-3 pt-1">
          {HOME_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              {...(seg.id === 'home' ? {} : bindTap(seg.transitionId))}
              className={`bg-transparent border-none cursor-pointer py-1.5 text-[15px] ${
                seg.id === 'home' ? 'text-app-text font-bold' : 'text-app-text-muted'
              }`}
            >
              {SEG_LABEL[seg.id] ?? seg.label}
            </button>
          ))}
        </div>
        <div className="px-3 pb-2">
          <div
            {...bindTap('home.search-open')}
            className="flex items-center gap-2 bg-app-bg rounded-full h-9 px-3 cursor-pointer"
          >
            <IcSearch size={17} className="text-app-text-muted" />
            <span className="flex-1 text-[13px] text-app-text-muted">{s.searchPlaceholder}</span>
            <IcCamera size={18} className="text-app-text-muted" />
            <span className="text-[13px] text-app-text font-medium">{s.search}</span>
          </div>
        </div>
      </div>

      {/* 频道行(关注/推荐…) — 在金刚区之上 */}
      <div
        className="bg-app-surface shrink-0 flex items-center gap-4 px-3 border-b border-(--app-border) overflow-x-auto"
        data-scroll-container="home-channels" data-scroll-direction="horizontal"
      >
        {HOME_CHANNELS.map((c) => {
          const active = c.id === channel || (c.id === 'recommend' && channel === 'recommend');
          return (
            <button
              key={c.id}
              {...bindTap(
                { kind: 'action', id: 'home.channel.select.target' },
                {
                  params: { channel: c.id },
                  onTrigger: () => {
                    recordTaskAudit('homeChannelViewed', c.id);
                    setSearchParams((p) => {
                      if (c.id === 'recommend') p.delete('channel');
                      else p.set('channel', c.id);
                      return p;
                    }, { replace: true });
                  },
                },
              )}
              className={`bg-transparent border-none cursor-pointer py-2 text-[14px] whitespace-nowrap relative ${
                active ? 'text-app-text font-bold' : 'text-app-text-muted'
              }`}
            >
              {c.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-app-primary" />}
            </button>
          );
        })}
      </div>

      {/* 金刚区 */}
      <div className="bg-app-surface shrink-0 grid grid-cols-6 gap-1 px-2 pb-2">
        {KINGKONG_GRID.map((k) => (
          <button
            key={k.id}
            onClick={() => onKingkong(k)}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1"
          >
            <span className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px]" style={{ background: k.color }}>
              {k.label.slice(0, 1)}
            </span>
            <span className="text-[10px] text-app-text-muted scale-90">{k.label}</span>
          </button>
        ))}
      </div>

      {/* 双列瀑布流 */}
      <div className="flex-1 overflow-y-auto p-2" data-scroll-container="HomePage-main" data-scroll-direction="vertical">
        {showFollowEmpty ? (
          <div className="flex flex-col items-center pt-16 text-[#999999] text-sm gap-4">
            <span>还没有关注的人发布闲置</span>
            <div className="w-full">
              <div className="text-[13px] text-[#666666] mb-2 px-1">你可能感兴趣的人</div>
              <div className="flex gap-4 px-1">
                {sellers.filter((s) => s.id !== 'me').slice(0, 4).map((s) => (
                  <div key={s.id} className="flex flex-col items-center gap-1">
                    <Avatar seed={s.id} name={s.name} size={48} />
                    <span className="text-[11px] text-[#666] max-w-[56px] truncate">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">{col(0).map((it) => <ItemCard key={it.id} item={it} />)}</div>
            <div className="flex-1 min-w-0">{col(1).map((it) => <ItemCard key={it.id} item={it} />)}</div>
          </div>
        )}
      </div>
      {toast}
    </div>
  );
}
