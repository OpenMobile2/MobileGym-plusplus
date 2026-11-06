import React, { useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ItemCard } from '../components/ItemCard';
import { Img, PriceYuan, wontfix } from '../components/ui';
import {
  IcSearch, IcCamera, IcTabSubsidy, IcGrid, IcTicket, IcGift,
  IcWallet, IcTruck, IcBell, IcStore, IcUsers, IcChevronRight,
} from '../res/icons';

// 推荐页真机首屏只露出一排 5 个营销入口。
const KINGKONG = [
  { key: 'seckill', label: '限时秒杀', Icon: IcTruck, kind: 'wontfix' as const },
  { key: 'grocery', label: '多多买菜', Icon: IcStore, kind: 'wontfix' as const },
  { key: 'cash', label: '现金大转盘', Icon: IcGift, kind: 'wontfix' as const },
  { key: 'special', label: '9块9特卖', Icon: IcTicket, kind: 'wontfix' as const },
  { key: 'more', label: '其他', Icon: IcGrid, kind: 'category' as const },
];

// 稳定字符串哈希(djb2),用于双击刷新时确定性重排,避免 Math.random。
function hashStr(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return h;
}

export function HomePage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const items = usePinduoduoStore((st) => st.items);
  const homeFeedTabs = usePinduoduoStore((st) => st.homeFeedTabs);
  const [activeTab, setActiveTab] = useState(0);
  // 无限滚动:海量商品分批渲染,避免一次性挂载上千卡片(切分类时重置)。
  const [visible, setVisible] = useState(40);
  // 双击标签刷新排序用的种子(每次双击 +1,重排瀑布流顺序)。
  const [feedSeed, setFeedSeed] = useState(0);
  const swipeRef = React.useRef<{ x: number; y: number } | null>(null);
  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  const tapRef = React.useRef<{ i: number; t: number }>({ i: -1, t: 0 });
  React.useEffect(() => { setVisible(40); }, [activeTab]);

  // 按当前分类过滤瀑布流:推荐=全部,百亿补贴=补贴品,其余按品类。
  const tabName = homeFeedTabs[activeTab] || '推荐';
  const categoryItems =
    tabName === '推荐' ? items
    : tabName === '百亿补贴' ? items.filter((i) => i.subsidy)
    : (() => {
        const hit = items.filter((i) => i.category === tabName);
        return hit.length ? hit : items;
      })();

  // 刷新排序:按 (商品id + 种子) 的稳定哈希重排,确保每次双击顺序明显变化且可复现。
  const feedItems = React.useMemo(() => {
    if (feedSeed === 0) return categoryItems;
    return [...categoryItems].sort((a, b) => hashStr(a.id + '#' + feedSeed) - hashStr(b.id + '#' + feedSeed));
  }, [categoryItems, feedSeed]);
  const circleAvatars = items.slice(0, 3).map((item) => item.image);
  const subsidyItems = items.filter((item) => item.subsidy).slice(0, 4);

  // 单击切分类;双击当前分类(≤300ms)→ 回到顶部 + 重置增量渲染 + 刷新排序。
  const onFeedTab = (i: number) => {
    const now = TimeService.realNow();
    const prev = tapRef.current;
    const isDouble = prev.i === i && now - prev.t < 300;
    tapRef.current = { i, t: now };
    if (i !== activeTab) { setActiveTab(i); return; }
    if (isDouble) {
      scrollRef.current?.scrollTo({ top: 0 });
      setVisible(40);
      setFeedSeed((n) => n + 1);
    }
  };

  const onSwipeEnd = (x: number, y: number) => {
    const st = swipeRef.current;
    swipeRef.current = null;
    if (!st) return;
    const dx = x - st.x;
    const dy = y - st.y;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setActiveTab((t) => Math.min(Math.max(t + (dx < 0 ? 1 : -1), 0), homeFeedTabs.length - 1));
    }
  };

  return (
    <div
      className="h-full flex flex-col pt-10 overflow-hidden bg-white"
      data-status-bar-foreground="dark"
    >
      {/* 浅灰搜索框，相机收进搜索框内。 */}
      <div className="shrink-0 bg-white px-3 pt-1.5 pb-1">
        <div
          {...bindTap('home.search-open')}
          className="h-[38px] bg-[#F1F1F1] rounded-[9px] flex items-center px-3 gap-1.5"
        >
          <IcSearch size={18} strokeWidth={1.7} className="text-[#999]" />
          <span className="flex-1 text-center text-[14px] text-[#999] truncate">
            {activeTab === 0 ? '男士裤子 🔥' : s.search_placeholder}
          </span>
          <button
            {...bindTap(
              { kind: 'action', id: 'home.camera.wontfix' },
              { stopPropagation: true, onTrigger: wontfix },
            )}
            aria-label="拍照购"
            className="w-7 h-7 flex items-center justify-center text-[#999] shrink-0"
          >
            <IcCamera size={20} />
          </button>
        </div>
      </div>

      {/* 白底内容区(可上下滚动) */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#F5F5F5]"
        data-scroll-container
        data-scroll-direction="vertical"
        onPointerDown={(e) => { swipeRef.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => onSwipeEnd(e.clientX, e.clientY)}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (el.scrollHeight - el.scrollTop - el.clientHeight < 500) {
            setVisible((v) => (v < feedItems.length ? v + 40 : v));
          }
        }}
      >
        {/* 横向分类 tab 行(可左右滑) */}
        <div className="bg-white sticky top-0 z-10 border-b border-[#EEEEEE]">
          <div className="flex overflow-x-auto no-scrollbar px-1">
            {homeFeedTabs.map((tab, i) => {
              const active = i === activeTab;
              return (
                <button
                  key={tab}
                  {...bindTap(
                    { kind: 'action', id: 'home.feedtab.switch' },
                    { params: { tab }, onTrigger: () => onFeedTab(i) },
                  )}
                  className={`relative shrink-0 px-3 py-2 text-[15px] whitespace-nowrap ${
                    active ? 'text-[#E22E1F] font-semibold' : 'text-[#222]'
                  }`}
                >
                  {tab === '百亿补贴' ? '⚡最快明天达' : tab === '数码' ? '手机' : tab}
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[#E22E1F]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 推荐首屏：拼小圈 + 五入口 + 百亿补贴横栏。 */}
        {tabName === '推荐' && (
          <div className="bg-white border-b-8 border-[#F5F5F5]">
            <button
              {...bindTap({ kind: 'action', id: 'home.marketing.wontfix' }, { onTrigger: wontfix })}
              className="w-full h-[54px] px-4 flex items-center border-b border-[#F1F1F1]"
            >
              <span className="relative w-9 h-7 mr-3">
                <span className="absolute left-0 top-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#8D4DFF] to-[#6B42F4]" />
                <span className="absolute right-0 top-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#FF4CA5] to-[#EF2B88] opacity-95" />
              </span>
              <span className="text-[16px] font-medium text-[#222]">拼小圈</span>
              <span className="ml-auto flex items-center">
                <span className="flex -space-x-2 mr-2">
                  {circleAvatars.map((avatar, index) => (
                    <Img
                      key={avatar}
                      src={avatar}
                      className="w-7 h-7 rounded-full object-cover border-2 border-white"
                      alt={`拼小圈好友${index + 1}`}
                    />
                  ))}
                </span>
                <span className="text-[12px] text-[#AAA]">新动态和提醒</span>
                <span className="ml-1 min-w-5 h-5 px-1 rounded-full bg-[#E9332C] text-white text-[10px] leading-5">6</span>
                <IcChevronRight size={16} className="text-[#AAA]" />
              </span>
            </button>

            <div className="grid grid-cols-5 py-3 border-b-8 border-[#F5F5F5]">
              {KINGKONG.map((entry, index) => {
                const inner = (
                  <>
                    <span className={`relative w-11 h-11 rounded-[16px] flex items-center justify-center ${
                      index === 3
                        ? 'bg-white text-[#E62E25]'
                        : 'bg-gradient-to-br from-[#FF6253] to-[#E92323] text-white'
                    }`}>
                      <entry.Icon size={index === 3 ? 25 : 22} strokeWidth={2} />
                      {index === 0 && (
                        <span className="absolute -right-1 -top-1 text-[9px] leading-4 px-1 rounded-full bg-[#E72724] text-white border border-white">抢</span>
                      )}
                      {index === 3 && (
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold leading-3 text-center">0.99元<br/>限时抢</span>
                      )}
                    </span>
                    <span className="text-[11px] text-[#666] whitespace-nowrap">{entry.label}</span>
                  </>
                );
                return entry.kind === 'category' ? (
                  <button key={entry.key} {...bindTap('home.category-open')} className="flex flex-col items-center gap-1.5">
                    {inner}
                  </button>
                ) : (
                  <button
                    key={entry.key}
                    {...bindTap({ kind: 'action', id: 'home.marketing.wontfix' }, { onTrigger: wontfix })}
                    className="flex flex-col items-center gap-1.5"
                  >
                    {inner}
                  </button>
                );
              })}
            </div>

            <div className="px-3 pt-2 pb-3">
              <button
                {...bindTap('home.subsidy-open')}
                className="w-full flex items-center h-8"
              >
                <span className="text-[18px] italic font-black text-[#F03275]">百亿补贴</span>
                <span className="ml-auto text-[12px] text-[#888]">官方补贴 · 100%正品</span>
                <IcChevronRight size={15} className="text-[#999]" />
              </button>
              <div className="grid grid-cols-4 gap-2">
                {subsidyItems.map((item) => (
                  <button
                    key={item.id}
                    {...bindTap('home.item-open', { params: { itemId: item.id } })}
                    className="min-w-0 text-left"
                  >
                    <Img src={item.image} className="w-full aspect-square object-cover rounded-[3px] bg-[#F5F5F5]" alt={item.title} />
                    <PriceYuan
                      value={item.pinPrice}
                      className="block mt-1 text-center text-[#E22E1F] text-[14px]"
                      symbolClass="text-[10px]"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 商品瀑布流双列 */}
        <div className="grid grid-cols-2 gap-px bg-[#EAEAEA]">
          {feedItems.slice(0, visible).map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              openBind={bindTap('home.item-open', { params: { itemId: it.id } })}
              quickBind={bindTap('home.item-quickbuy', { params: { itemId: it.id, mode: 'group' }, stopPropagation: true })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
