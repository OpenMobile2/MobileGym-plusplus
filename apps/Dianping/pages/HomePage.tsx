import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { DIAMOND_ITEMS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcScan, IcChevronDown, IcHeart } from '../res/icons';
import { DiamondIcon } from '../res/diamondIcons';
import { shopCoverUrl, noteCoverUrl, newbieGiftUrl } from '../assets';
import { NewbieFeed } from '../components/NewbieFeed';
import { DpAvatar } from '../components/DpAvatar';

const CHANNELS = [
  { id: 'newbie', key: 'newbie' as const },
  { id: 'nearby', key: 'nearby' as const },
  { id: 'hot', key: 'hot' as const },
  { id: 'weekend', key: 'weekend' as const },
  { id: 'travel', key: 'travel' as const },
];

export default function HomePage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, action } = useDianpingGestures();
  const city = useDianpingStore((st) => st.city);
  const shops = useDianpingStore((st) => st.shops);
  const notes = useDianpingStore((st) => st.notes);
  const showToast = useDianpingStore((st) => st.showToast);
  const [channel, setChannel] = useState('home');
  const top = shops[0];
  const second = shops[1] ?? shops[0];

  // 频道切换真实改变信息流(非仅高亮):附近按关联店铺距离排序
  const feedNotes = useMemo(() => {
    if (channel !== 'nearby') return notes;
    const distOf = (shopId?: string) =>
      shopId ? shops.find((x) => x.id === shopId)?.distanceM ?? 1e9 : 1e9;
    return [...notes].sort((a, b) => distOf(a.shopId) - distOf(b.shopId));
  }, [channel, notes, shops]);

  return (
    <div
      className="flex h-full flex-col bg-(--app-c-page-bg)"
      data-status-bar-foreground="dark"
      data-scroll-container="home-feed"
      data-scroll-direction="vertical"
    >
      <div className="flex-1 overflow-y-auto">
        <div className="bg-(--app-c-wash) pb-1 pt-1">
          {/* 顶栏: 城市 + 频道 Tab */}
          <div className="flex items-end gap-2 px-3 pt-1">
            <button
              type="button"
              className="relative mb-[2px] flex shrink-0 items-center gap-0.5 border-none bg-transparent pb-1 text-[15px] font-bold text-(--app-c-text-primary) cursor-pointer"
              {...bindTap('home.city-open')}
            >
              {city}
              <IcChevronDown size={12} className="text-(--app-c-text-secondary)" />
              {channel === 'home' ? (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[#FF6633]" />
              ) : null}
            </button>
            <div className="flex min-w-0 flex-1 items-end gap-3 overflow-x-auto pb-[1px]">
              {CHANNELS.map((c) => {
                const active = channel === c.id;
                const binding =
                  c.id === 'newbie' || c.id === 'nearby'
                    ? action('home.channel.select.target', () => setChannel(c.id), {
                        params: { target: c.id },
                      })
                    : action('home.channel.open.disabled', () => showToast(s.notOpen));
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`relative shrink-0 border-none bg-transparent pb-1 text-[14px] cursor-pointer ${
                      active ? 'font-bold text-(--app-c-text-primary)' : 'font-medium text-(--app-c-text-secondary)'
                    }`}
                    {...binding}
                  >
                    {s[c.key]}
                    {active ? (
                      <span className="absolute bottom-0 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[#FF6633]" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 搜索条: 左侧新人礼 + 橙描边搜索 */}
          <div className="mt-2.5 flex items-center gap-2 px-3">
            <button
              type="button"
              className="relative flex h-11 w-11 shrink-0 flex-col items-center justify-center overflow-hidden rounded-full border-none bg-gradient-to-b from-[#FF8A5C] to-[#FF5A2A] text-white shadow-sm cursor-pointer"
              {...action('home.gift.open.disabled', () => showToast(s.notOpen))}
            >
              {newbieGiftUrl() ? (
                <img src={newbieGiftUrl()} alt="" className="h-full w-full object-cover" />
              ) : (
                <>
                  <span className="text-[13px] leading-none">礼</span>
                  <span className="text-[8px] leading-tight opacity-90">新人礼</span>
                </>
              )}
            </button>
            <div className="flex h-9 flex-1 items-center overflow-hidden rounded-full border-[1.5px] border-[#FF6633] bg-(--app-c-card-bg) pl-2.5">
              <IcScan size={16} className="shrink-0 text-[#FF6633]" />
              <button
                type="button"
                className="min-w-0 flex-1 truncate border-none bg-transparent px-2 text-left text-[13px] text-(--app-c-text-muted) cursor-pointer"
                {...bindTap('home.search-open')}
              >
                0元免费试
              </button>
              <button
                type="button"
                className="h-full shrink-0 border-none bg-[#FF6633] px-3.5 text-[13px] font-medium text-white cursor-pointer"
                {...bindTap('home.search-open')}
              >
                {s.search}
              </button>
            </div>
          </div>

          {channel === 'newbie' ? null : (
            <>
          {/* 金刚区 2×5 */}
          <div className="mt-3 grid grid-cols-5 gap-y-2.5 px-1.5">
            {DIAMOND_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="flex flex-col items-center gap-[4px] border-none bg-transparent cursor-pointer"
                {...(item.enabled
                  ? bindTap('home.food-open')
                  : action('home.diamond.open.disabled', () => showToast(s.notOpen)))}
              >
                <DiamondIcon id={item.id} size={46} />
                <span className="text-[11px] leading-none text-(--app-c-text-primary)">{s[item.labelKey]}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-center gap-1.5">
            <span className="h-[4px] w-[10px] rounded-full bg-[#FF6633]" />
            <span className="h-[4px] w-[4px] rounded-full bg-[#D0D0D0]" />
          </div>

          {/* 榜单 / 免费试 */}
          <div className="mt-2.5 grid grid-cols-2 gap-2 px-3">
            <button
              type="button"
              className="overflow-hidden rounded-[10px] border-none bg-(--app-c-card-bg) p-2.5 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-pointer"
              {...bindTap('home.rank-open')}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] font-bold text-(--app-c-text-primary)">{s.rankCard}</span>
                <span className="text-[10px] text-[#FF6633]">新人玩转指南</span>
              </div>
              <div className="mt-2 flex gap-2">
                <div
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-md"
                  style={{ background: top?.coverColor ?? '#FF6633' }}
                >
                  {top && shopCoverUrl(top.id) ? (
                    <img src={shopCoverUrl(top.id)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-(--app-c-text-primary)">{top?.name}</div>
                  <div className="mt-0.5 text-[10px] text-[#FF6633]">好评榜第1名 · 3.3km</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              className="overflow-hidden rounded-[10px] border-none bg-(--app-c-card-bg) p-2.5 text-left shadow-[0_1px_4px_rgba(0,0,0,0.04)] cursor-pointer"
              {...bindTap('home.free-trial-open')}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] font-bold text-(--app-c-text-primary)">{s.freeTrial}</span>
                <span className="text-[10px] text-[#FF6633]">新人写评有礼 ›</span>
              </div>
              <div className="mt-2 flex gap-2">
                <div
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-md"
                  style={{ background: second?.coverColor ?? '#F4A261' }}
                >
                  {second && shopCoverUrl(second.id) ? (
                    <img src={shopCoverUrl(second.id)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[12px] font-medium text-(--app-c-text-primary)">{second?.name ?? '¥0 试吃'}</div>
                  <div className="mt-0.5 text-[10px] text-(--app-c-text-muted)">
                    <span className="font-semibold text-[#FF6633]">¥0</span>
                    <span className="ml-1 line-through">¥485</span>
                    <span className="ml-1">· 5.6km</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
            </>
          )}
        </div>

        {channel === 'newbie' ? (
          <NewbieFeed />
        ) : (
        <div className="mt-2 grid grid-cols-2 gap-1.5 px-1.5 pb-3">
          {feedNotes.map((n, i) => {
            const h = i % 3 === 0 ? 'h-[150px]' : i % 3 === 1 ? 'h-[120px]' : 'h-[136px]';
            const cover = noteCoverUrl(n.id);
            const body = (
              <>
                <div className={`${h} w-full overflow-hidden`} style={{ background: n.coverColor }}>
                  {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="px-2 py-1.5">
                  <div className="line-clamp-2 text-[13px] font-semibold leading-snug text-(--app-c-text-primary)">
                    {n.title}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <DpAvatar seed={n.author} size={16} className="shrink-0 rounded-full" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-(--app-c-text-muted)">{n.author}</span>
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-(--app-c-text-muted)">
                      <IcHeart size={11} className="text-[#CCC]" />
                      {n.likes}
                    </span>
                  </div>
                </div>
              </>
            );
            return (
              <button
                key={n.id}
                type="button"
                className="overflow-hidden rounded-[8px] border-none bg-(--app-c-card-bg) text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] cursor-pointer"
                {...bindTap('home.note-open', { params: { noteId: n.id } })}
              >
                {body}
              </button>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}
