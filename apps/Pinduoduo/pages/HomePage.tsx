import React, { useState } from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ItemCard } from '../components/ItemCard';
import { wontfix } from '../components/ui';
import {
  IcSearch, IcCamera, IcTabSubsidy, IcGrid, IcTicket, IcGift,
  IcWallet, IcTruck, IcBell, IcStore,
} from '../res/icons';

// 金刚区宫格:前两格为真实入口(transition),其余为营销位(wontfix)。
const KINGKONG = [
  { key: 'subsidy', label: '百亿补贴', Icon: IcTabSubsidy, kind: 'subsidy' as const },
  { key: 'category', label: '分类', Icon: IcGrid, kind: 'category' as const },
  { key: 'seckill', label: '限时秒杀', Icon: IcTruck, kind: 'wontfix' as const },
  { key: 'coupon', label: '领券中心', Icon: IcTicket, kind: 'wontfix' as const },
  { key: 'orchard', label: '多多果园', Icon: IcGift, kind: 'wontfix' as const },
  { key: 'recharge', label: '充值中心', Icon: IcWallet, kind: 'wontfix' as const },
  { key: 'checkin', label: '签到领现金', Icon: IcBell, kind: 'wontfix' as const },
  { key: 'grocery', label: '多多买菜', Icon: IcStore, kind: 'wontfix' as const },
  { key: 'brand', label: '品牌馆', Icon: IcTabSubsidy, kind: 'wontfix' as const },
  { key: 'free', label: '天天领现金', Icon: IcGift, kind: 'wontfix' as const },
];

export function HomePage() {
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const items = usePinduoduoStore((st) => st.items);
  const homeFeedTabs = usePinduoduoStore((st) => st.homeFeedTabs);
  const [activeTab, setActiveTab] = useState(0);
  const swipeRef = React.useRef<{ x: number; y: number } | null>(null);

  // 按当前分类过滤瀑布流:推荐=全部,百亿补贴=补贴品,其余按品类。
  const tabName = homeFeedTabs[activeTab] || '推荐';
  const feedItems =
    tabName === '推荐' ? items
    : tabName === '百亿补贴' ? items.filter((i) => i.subsidy)
    : (() => {
        const hit = items.filter((i) => i.category === tabName);
        return hit.length ? hit : items;
      })();

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
      className="h-full flex flex-col pt-10 overflow-hidden bg-[#E22E1F]"
      data-status-bar-foreground="light"
    >
      {/* 红色渐变头:搜索框 + 相机 */}
      <div className="shrink-0 px-3 pb-2 bg-gradient-to-b from-[#E22E1F] to-[#F53D2D] flex items-center gap-2">
        <div
          {...bindTap('home.search-open')}
          className="flex-1 h-8 bg-white rounded-full flex items-center px-3 gap-1.5"
        >
          <IcSearch size={16} className="text-[#E22E1F]" />
          <span className="text-[13px] text-[#BBB] truncate">{s.search_placeholder}</span>
          <span className="ml-auto text-[12px] bg-[#E22E1F] text-white rounded-full px-3 py-0.5">
            {s.btn_search}
          </span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'home.camera.wontfix' }, { onTrigger: wontfix })}
          aria-label="拍照购"
          className="w-8 h-8 flex items-center justify-center text-white shrink-0"
        >
          <IcCamera size={22} />
        </button>
      </div>

      {/* 白底内容区(可上下滚动) */}
      <div
        className="flex-1 overflow-y-auto bg-[#F5F5F5]"
        data-scroll-container
        data-scroll-direction="vertical"
        onPointerDown={(e) => { swipeRef.current = { x: e.clientX, y: e.clientY }; }}
        onPointerUp={(e) => onSwipeEnd(e.clientX, e.clientY)}
      >
        {/* 横向分类 tab 行(可左右滑) */}
        <div className="bg-white sticky top-0 z-10 border-b border-[#F0F0F0]">
          <div className="flex overflow-x-auto no-scrollbar px-1">
            {homeFeedTabs.map((tab, i) => {
              const active = i === activeTab;
              return (
                <button
                  key={tab}
                  {...bindTap(
                    { kind: 'action', id: 'home.feedtab.switch' },
                    { params: { tab }, onTrigger: () => setActiveTab(i) },
                  )}
                  className={`shrink-0 px-3 py-2.5 text-[14px] whitespace-nowrap ${
                    active ? 'text-[#E22E1F] font-medium' : 'text-[#666]'
                  }`}
                >
                  {tab}
                  {active && <span className="block h-0.5 mt-1 rounded-full bg-[#E22E1F]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 金刚区宫格(仅推荐页展示) */}
        {tabName === '推荐' && (
        <div className="bg-white grid grid-cols-5 gap-y-3 py-3">
          {KINGKONG.map((k) => {
            const inner = (
              <>
                <span className="w-10 h-10 rounded-full bg-[#FFF0E8] flex items-center justify-center">
                  <k.Icon size={22} className="text-[#E22E1F]" />
                </span>
                <span className="text-[11px] text-[#666]">{k.label}</span>
              </>
            );
            const cls = 'flex flex-col items-center gap-1';
            if (k.kind === 'subsidy') {
              return (
                <button key={k.key} {...bindTap('home.subsidy-open')} className={cls}>
                  {inner}
                </button>
              );
            }
            if (k.kind === 'category') {
              return (
                <button key={k.key} {...bindTap('home.category-open')} className={cls}>
                  {inner}
                </button>
              );
            }
            return (
              <button
                key={k.key}
                {...bindTap({ kind: 'action', id: 'home.marketing.wontfix' }, { onTrigger: wontfix })}
                className={cls}
              >
                {inner}
              </button>
            );
          })}
        </div>
        )}

        {/* 商品瀑布流双列 */}
        <div className="grid grid-cols-2 gap-2 p-2">
          {feedItems.map((it) => (
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
