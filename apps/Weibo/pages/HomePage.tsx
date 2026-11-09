import React, { useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, Img } from '../components/ui';
import { HOME_CHANNELS, FOLLOW_GROUPS, PLUS_MENU } from '../constants';
import { IcPlus, IcDown, IcCompose, IcImage, IcCalendar, IcStar, IcVideo, IcClose } from '../res/icons';

const PLUS_ICONS = { IcCompose, IcImage, IcCalendar, IcStar, IcVideo } as const;

export default function HomePage() {
  const s = useStrings();
  const { bindTap, go } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [toastNode, toast] = useToast();

  const loggedIn = useWeiboStore((st) => st.session.loggedIn);
  const statuses = useWeiboStore((st) => st.statuses);
  const refreshFeed = useWeiboStore((st) => st.refreshFeed);

  const tab = searchParams.get('tab') === 'follow' ? 'follow' : 'recommend';
  const channel = searchParams.get('channel') ?? '热门';
  const plusOpen = searchParams.get('plus') === 'open';
  const groupsOpen = searchParams.get('groups') === 'open';

  const [redpacketVisible, setRedpacketVisible] = useState(true);
  const [refreshBanner, setRefreshBanner] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullStart = useRef<number | null>(null);

  const feed = useMemo(() => {
    if (tab === 'follow') return statuses.filter((x) => x.fromFollow && !x.supertopicId && !x.searchOnly);
    const byChannel = statuses.filter((x) => !x.supertopicId && !x.searchOnly && (channel === '热门' ? true : x.channel === channel));
    return byChannel.length ? byChannel : statuses.filter((x) => !x.supertopicId && !x.searchOnly);
  }, [statuses, tab, channel]);

  const setSearch = (mutate: (p: URLSearchParams) => void) => {
    setSearchParams((p) => { mutate(p); return p; }, { replace: true });
  };

  const showBanner = (text: string) => {
    setRefreshBanner(text);
    window.setTimeout(() => setRefreshBanner(null), 1400);
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-3 bg-white shrink-0">
        {loggedIn ? (
          <button
            {...bindTap('home.supertopicSquare-open')}
            className="text-[14px] font-bold text-[#FF8200] bg-transparent border border-[#FFD9AD] rounded px-1.5 py-0.5 cursor-pointer shrink-0"
          >
            {s.supertopic}
          </button>
        ) : (
          <button
            {...bindTap('home.login-open')}
            className="text-[15px] font-bold text-[#FF8200] bg-transparent border-none cursor-pointer shrink-0"
          >
            {s.login}
          </button>
        )}
        <div className="flex-1 flex items-center justify-center gap-6">
          <button
            {...bindTap({ kind: 'action', id: 'home.tab.select.target' }, {
              params: { target: 'recommend' },
              onTrigger: () => setSearch((p) => { p.delete('tab'); }),
            })}
            className={`text-[19px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === 'recommend' ? 'font-bold text-[#1A1A1A]' : 'text-[#7F7F7F]'}`}
          >
            {s.tabRecommend}
            {tab === 'recommend' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-[3px] rounded bg-[#FF8200]" />}
          </button>
          <span className="relative flex items-center gap-0.5">
            <button
              {...bindTap({ kind: 'action', id: 'home.tab.select.target' }, {
                params: { target: 'follow' },
                onTrigger: () => {
                  if (tab !== 'follow') {
                    setSearch((p) => { p.set('tab', 'follow'); p.delete('groups'); });
                    showBanner('更新了24条微博');
                  }
                },
              })}
              className={`text-[19px] bg-transparent border-none cursor-pointer pb-1 ${tab === 'follow' ? 'font-bold text-[#1A1A1A]' : 'text-[#7F7F7F]'}`}
            >
              {s.tabFollow}
            </button>
            {tab === 'follow' && (
              <button
                {...bindTap({ kind: 'action', id: 'home.followGroups.toggle' }, {
                  onTrigger: () => setSearch((p) => { groupsOpen ? p.delete('groups') : p.set('groups', 'open'); }),
                })}
                className="bg-transparent border-none cursor-pointer p-0 pb-1"
                data-role="follow-caret"
              >
                <IcDown size={14} className="text-[#7F7F7F]" />
              </button>
            )}
            {tab === 'follow' && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-[3px] rounded bg-[#FF8200]" />}
          </span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'home.redpacket.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[18px] bg-transparent border-none cursor-pointer mr-2 shrink-0"
        >
          🧧
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'home.plusMenu.toggle' }, {
            onTrigger: () => setSearch((p) => { plusOpen ? p.delete('plus') : p.set('plus', 'open'); }),
          })}
          className="w-8 h-8 rounded-full bg-[#F26D0D] text-white border-none cursor-pointer flex items-center justify-center shrink-0"
        >
          <IcPlus size={20} />
        </button>
      </div>

      {/* 频道 chips(推荐态) */}
      {tab === 'recommend' && (
        <div className="flex items-center gap-4 px-3 h-9 bg-white border-t border-[#FAFAFA] shrink-0 overflow-x-auto" data-scroll-container="home-channels" data-scroll-direction="horizontal">
          {HOME_CHANNELS.map((ch) => (
            <button
              key={ch}
              {...bindTap({ kind: 'action', id: 'home.channel.select.target' }, {
                params: { target: ch },
                onTrigger: () => setSearch((p) => { ch === '热门' ? p.delete('channel') : p.set('channel', ch); }),
              })}
              className={`text-[14px] bg-transparent border-none cursor-pointer whitespace-nowrap relative pb-0.5 ${channel === ch ? 'text-[#FF8200] font-semibold' : 'text-[#5B5B5B]'}`}
            >
              {ch}
              {channel === ch && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
            </button>
          ))}
        </div>
      )}

      {/* 刷新横幅 */}
      {refreshBanner && (
        <div className="absolute top-11 left-0 right-0 z-20 bg-[#FF8200] text-white text-[13px] text-center py-1.5">
          {refreshBanner}
        </div>
      )}

      {/* 信息流(带下拉刷新) */}
      <div
        ref={scrollRef}
        data-scroll-container="home-feed"
        data-scroll-direction="vertical"
        className="flex-1 overflow-y-auto"
        onPointerDown={(e) => {
          if (scrollRef.current && scrollRef.current.scrollTop <= 0) pullStart.current = e.clientY;
        }}
        onPointerUp={(e) => {
          if (pullStart.current !== null && e.clientY - pullStart.current > 70 && scrollRef.current!.scrollTop <= 0) {
            refreshFeed();
            showBanner(s.feedRefreshed);
          }
          pullStart.current = null;
        }}
      >
        <div data-action="home.feed.refresh" data-action-type="modify" className="h-0" aria-hidden />
        {feed.map((st) => (
          <StatusCard key={st.id} status={st} openTransition="home.status-open" userTransition="home.user-open" />
        ))}
        <div className="text-center text-[12px] text-[#BBBBBB] py-4">已经到底啦~</div>
      </div>

      {/* 右下红包挂件 */}
      {redpacketVisible && (
        <div className="absolute right-2 bottom-16 z-20 w-16">
          <button
            {...bindTap({ kind: 'action', id: 'home.floatRedpacket.close' }, {
              stopPropagation: true,
              onTrigger: () => setRedpacketVisible(false),
            })}
            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-black/40 text-white border-none cursor-pointer flex items-center justify-center z-10"
          >
            <IcClose size={12} />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'home.floatRedpacket.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="w-full bg-gradient-to-b from-[#FF5B4D] to-[#E62E2E] rounded-lg text-white border-none cursor-pointer py-1.5 flex flex-col items-center"
          >
            <span className="text-[10px]">必得</span>
            <span className="text-[13px] font-bold">0.29元</span>
            <span className="text-[9px] bg-[#FFD766] text-[#8A3A00] rounded px-1 mt-0.5">点击激活</span>
          </button>
        </div>
      )}

      {/* ＋下拉菜单 */}
      {plusOpen && (
        <div className="absolute inset-0 z-30" onClick={() => setSearch((p) => { p.delete('plus'); })}>
          <div className="absolute right-2 top-11 bg-[#3A3A3A]/95 rounded-xl py-1 w-40 shadow-lg">
            {PLUS_MENU.map((item) =>
              item.id === 'compose' ? (
                <button
                  key={item.id}
                  {...bindTap('home.compose-open', { stopPropagation: true })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-white text-[14px] bg-transparent border-none cursor-pointer"
                >
                  <IcCompose size={18} className="text-[#FFB300]" />
                  {s[item.labelKey]}
                </button>
              ) : item.id === 'album' ? (
                <button
                  key={item.id}
                  {...bindTap({ kind: 'action', id: 'home.plusMenu.album' }, {
                    stopPropagation: true,
                    onTrigger: () => {
                      setSearch((p) => { p.delete('plus'); });
                      void import('@/os/albumBridge').then(({ pickImages }) =>
                        pickImages({ multiple: true, maxSelect: 9 }).then((r) => {
                          if (r.cancelled || !r.selected.length) return;
                          go('home.compose-open');
                          toast(`已选 ${r.selected.length} 张`);
                        }),
                      );
                    },
                  })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-white text-[14px] bg-transparent border-none cursor-pointer"
                >
                  <IcImage size={18} className="text-[#7FD1FF]" />
                  {s[item.labelKey]}
                </button>
              ) : (
                <button
                  key={item.id}
                  {...bindTap({ kind: 'action', id: 'home.plusMenu.stub' }, {
                    stopPropagation: true,
                    onTrigger: () => { toast(s.notOpen); setSearch((p) => { p.delete('plus'); }); },
                  })}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-white text-[14px] bg-transparent border-none cursor-pointer"
                >
                  {React.createElement(PLUS_ICONS[item.icon as keyof typeof PLUS_ICONS], { size: 18, className: 'text-[#7FD1FF]' })}
                  {s[item.labelKey]}
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* 关注分组下拉面板 */}
      {groupsOpen && tab === 'follow' && (
        <div className="absolute inset-0 z-30" onClick={() => setSearch((p) => { p.delete('groups'); })}>
          <div className="absolute left-0 right-0 top-11 bg-white rounded-b-2xl p-4 shadow-lg">
            <div className="text-[13px] text-[#9A9A9A] mb-2">默认分组</div>
            <div className="grid grid-cols-4 gap-2">
              {FOLLOW_GROUPS.map((g) => (
                <button
                  key={g}
                  {...bindTap({ kind: 'action', id: 'home.followGroups.select.target' }, {
                    params: { target: g },
                    stopPropagation: true,
                    onTrigger: () => { setSearch((p) => { p.delete('groups'); }); toast(`已切换到「${g}」`); },
                  })}
                  className="h-9 rounded-lg bg-[#F5F5F5] text-[13px] text-[#1A1A1A] border-none cursor-pointer truncate px-1"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {toastNode}
    </div>
  );
}
