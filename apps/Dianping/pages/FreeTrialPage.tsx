import React, { useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcMore, IcChevronRight, IcTicket, IcStar, IcTabMine } from '../res/icons';
import { shopCoverUrl } from '../assets';

const BOX_TILES = [
  { key: 'coin', label: '霸气币' },
  { key: 'pass', label: 'PASS卡' },
  { key: 'taxi', label: '美团打车券' },
];
const BOTTOM_TABS = [
  { id: 'trial', label: '免费试', Icon: IcTicket },
  { id: 'vip', label: '橙V专享价', Icon: IcStar },
  { id: 'mine', label: '我的', Icon: IcTabMine },
] as const;

export default function FreeTrialPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, action, bindTap } = useDianpingGestures();
  const shops = useDianpingStore((st) => st.shops);
  const showToast = useDianpingStore((st) => st.showToast);
  const [tab, setTab] = useState('trial');
  const [claimed, setClaimed] = useState<string[]>([]);

  const draws = shops.slice(0, 6).map((sh, i) => ({
    shop: sh,
    value: [262, 205, 101, 688, 364, 158][i] ?? 199,
    quota: [300, 300, 180, 20, 20, 120][i] ?? 100,
  }));
  const freeDishes = shops.slice(0, 2);

  return (
    <div className="flex h-full flex-col bg-[#F2F2F2]" data-status-bar-foreground="light">
      {/* 顶部橙色 Banner */}
      <div className="relative bg-gradient-to-b from-[#FF7A3D] to-[#FF9A5B] px-3 pb-4 pt-2">
        <div className="flex items-center">
          <button type="button" className="cursor-pointer border-none bg-transparent p-1 text-white" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <span className="ml-1 text-[20px] font-black text-white">免费试</span>
          <span className="ml-2 text-[13px] text-white/90">0元尽享吃喝玩乐</span>
          <button
            type="button"
            className="ml-auto cursor-pointer border-none bg-transparent p-1 text-white"
            {...action('freetrial.entry.disabled', () => showToast(s.notOpen))}
          >
            <IcMore size={20} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="free-trial"
        data-scroll-direction="vertical"
      >
        {tab !== 'trial' ? (
          <div className="p-3">
            <div className="rounded-[12px] bg-white p-4">
              <div className="text-[16px] font-bold text-[#222]">
                {tab === 'vip' ? '橙V专享价' : '我的免费试'}
              </div>
              <div className="mt-1 text-[12px] text-[#999]">
                {tab === 'vip' ? '橙V会员专享折扣，精选套餐低至骨折价' : `已领 ${claimed.length} 份免费菜 · 霸气币 0`}
              </div>
              <div className="mt-3 divide-y divide-[#F5F5F5]">
                {(tab === 'vip' ? shops.slice(0, 4) : shops.filter((sh) => claimed.includes(sh.id))).map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    className="flex w-full items-center gap-2.5 border-none bg-transparent py-2.5 text-left cursor-pointer"
                    {...bindTap('food.shop-open', { params: { shopId: sh.id } })}
                  >
                    <div className="h-[48px] w-[48px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: sh.coverColor }}>
                      {shopCoverUrl(sh.id) ? <img src={shopCoverUrl(sh.id)} alt="" className="h-full w-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-[#222]">{sh.name}</div>
                      <div className="mt-0.5 text-[12px]">
                        <span className="font-bold text-[#FF5A3C]">{tab === 'vip' ? `¥${Math.round(sh.avgPrice * 0.5)}` : '¥0'}</span>
                        <span className="ml-1 text-[#CCC] line-through">¥{sh.avgPrice}</span>
                      </div>
                    </div>
                    <IcChevronRight size={14} className="shrink-0 text-[#CCC]" />
                  </button>
                ))}
                {tab === 'mine' && claimed.length === 0 ? (
                  <div className="py-8 text-center text-[13px] text-[#999]">还没有领取记录，去免费试领一份吧~</div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
        <>
        {/* 霸气宝箱 */}
        <div className="mx-3 mt-3 rounded-[12px] bg-white p-3">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-[#222]">霸气宝箱天天开</span>
          </div>
          <button
            type="button"
            className="mt-1 flex cursor-pointer items-center border-none bg-transparent p-0 text-[12px] text-[#999]"
            {...action('freetrial.entry.disabled', () => showToast(s.notOpen))}
          >
            霸气币 0 去兑换免费试 <IcChevronRight size={12} />
          </button>
          <div className="mt-2 flex items-center gap-2">
            {BOX_TILES.map((t) => (
              <button
                key={t.key}
                type="button"
                className="flex-1 cursor-pointer rounded-[10px] border-none bg-[#FFF6EF] py-3 text-center text-[12px] text-[#8A5A2B]"
                {...action('freetrial.entry.disabled', () => showToast(s.notOpen))}
              >
                {t.label}
              </button>
            ))}
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                type="button"
                className="cursor-pointer rounded-full border-none bg-[#FF5A3C] px-3 py-1.5 text-[12px] font-bold text-white"
                {...action('freetrial.draw.action', () => showToast('宝箱开启中，敬请期待~'))}
              >
                开宝箱
              </button>
              <button
                type="button"
                className="cursor-pointer rounded-full border border-[#FF5A3C] bg-white px-3 py-1.5 text-[12px] font-bold text-[#FF5A3C]"
                {...action('freetrial.entry.disabled', () => showToast(s.notOpen))}
              >
                赚宝箱
              </button>
            </div>
          </div>
        </div>

        {/* 免费菜天天领 */}
        <div className="mx-3 mt-3 rounded-[12px] bg-white p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[16px] font-bold text-[#222]">免费菜天天领</span>
            <span className="text-[11px] text-[#999]">今日可任领1份免费菜</span>
          </div>
          <div className="mt-2 space-y-2">
            {freeDishes.map((sh) => {
              const got = claimed.includes(sh.id);
              return (
                <div key={sh.id} className="flex items-center gap-2">
                  <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: sh.coverColor }}>
                    {shopCoverUrl(sh.id) ? <img src={shopCoverUrl(sh.id)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-[#222]">{sh.dishes[0]?.name ?? '招牌菜'}</div>
                    <div className="mt-0.5 text-[12px]">
                      <span className="font-bold text-[#FF5A3C]">¥0</span>
                      <span className="ml-1 text-[#999]">{(sh.distanceM / 1000).toFixed(1)}km</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={`shrink-0 cursor-pointer rounded-full border-none px-4 py-1.5 text-[13px] font-bold text-white ${
                      got ? 'bg-[#CCC]' : 'bg-[#FF5A3C]'
                    }`}
                    {...action('freetrial.claim.action', () => {
                      if (got) return;
                      setClaimed((p) => [...p, sh.id]);
                      showToast('领取成功，到店出示即可兑换');
                    })}
                  >
                    {got ? '已领' : '0元领'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 免费试天天抽 */}
        <div className="mx-3 mt-3 rounded-[12px] bg-white p-3">
          <div className="text-[16px] font-bold text-[#222]">免费试天天抽</div>

          <div className="mt-1 divide-y divide-[#F5F5F5]">
            {draws.map(({ shop, value, quota }) => (
              <div key={shop.id} className="flex items-center gap-2.5 py-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 text-left"
                  {...bindTap('food.shop-open', { params: { shopId: shop.id } })}
                >
                  <div className="h-[62px] w-[62px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: shop.coverColor }}>
                    {shopCoverUrl(shop.id) ? <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-[#222]">{shop.name}｜双人套餐</div>
                    <div className="mt-0.5 truncate text-[11px] text-[#999]">
                      {shop.district} · {(shop.distanceM / 1000).toFixed(1)}km
                    </div>
                    <div className="mt-1 text-[12px]">
                      价值<span className="text-[15px] font-bold text-[#FF5A3C]">{value}</span>元
                      <span className="ml-2 text-[#999]">{quota}个中奖名额</span>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer rounded-full border-none bg-[#FF5A3C] px-4 py-2 text-[13px] font-bold text-white"
                  {...action('freetrial.draw.action', () => showToast('已参与免费抽，结果稍后公布~'))}
                >
                  免费抽
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="py-4 text-center text-[11px] text-[#BBB]">没有更多了 ~</div>
        </>
        )}
      </div>

      {/* 底部子 Tab */}
      <div className="flex h-14 shrink-0 items-center border-t border-[#EEE] bg-white">
        {BOTTOM_TABS.map((t) => {
          const active = t.id === tab;
          const Icon = t.Icon;
          return (
            <button
              key={t.id}
              type="button"
              className={`flex flex-1 flex-col items-center gap-0.5 border-none bg-transparent text-[11px] cursor-pointer ${
                active ? 'font-bold text-[#FF5A3C]' : 'text-[#888]'
              }`}
              {...action('freetrial.tab.select.target', () => setTab(t.id), { params: { target: t.id } })}
            >
              <Icon size={20} className={active ? 'text-[#FF5A3C]' : 'text-[#888]'} />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
