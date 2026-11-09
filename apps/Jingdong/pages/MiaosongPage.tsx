import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, showToast } from '../components/ui';
import { IcSearch, IcMapPin, IcChevronDown, IcStar, IcPlus, IcChevronRight, IcCheck } from '../res/icons';
import type { LifeShop, Dish } from '../types';

// 主站顶 tab(真机:秒送落地页沿用 nav B,顶 tab 不消失,选中「秒送」)
const TOP_TABS = [
  { key: 'deal', label: '特价' },
  { key: 'home', label: '首页' },
  { key: 'miaosong', label: '秒送' },
  { key: 'new', label: '新品' },
];

// 金刚区分两页,可左右滑动切换(真机:品类金刚区是横向分页模块)。
// 「推荐/超市/便利店/生鲜果蔬/酒水」这些原顶部 tab 也并入本模块首页,不再单独占一行。
const KINGKONG_PAGES = [
  [
    { label: '推荐', emoji: '⭐' },
    { label: '超市', emoji: '🛒' },
    { label: '便利店', emoji: '🏪' },
    { label: '生鲜果蔬', emoji: '🥬' },
    { label: '酒水', emoji: '🍷' },
    { label: '鲜花糕点', emoji: '🌹' },
    { label: '零食', emoji: '🍿' },
    { label: '酒水饮料', emoji: '🥤' },
    { label: '家居日用', emoji: '🧴' },
    { label: '美妆个护', emoji: '💄' },
  ],
  [
    { label: '宠物', emoji: '🐾' },
    { label: '母婴玩具', emoji: '🍼' },
    { label: '服饰鞋帽', emoji: '👕' },
    { label: '养车用车', emoji: '🚗' },
    { label: '同城急送', emoji: '🛵' },
    { label: '手机数码', emoji: '📱' },
    { label: '粮油速食', emoji: '🍜' },
    { label: '清洁纸品', emoji: '🧻' },
    { label: '医药健康', emoji: '💊' },
    { label: '更多分类', emoji: '➕' },
  ],
];

export function MiaosongPage() {
  const { bindTap, bindBack, back } = useJingdongGestures();
  const [sp, setSp] = useSearchParams();
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const addToCart = useJingdongStore((s) => s.addToCart);
  const addresses = useJingdongStore((s) => s.addresses);
  const selectedAddressId = useJingdongStore((s) => s.selectedAddressId);
  const selectAddress = useJingdongStore((s) => s.selectAddress);
  const [kingCat, setKingCat] = useState('推荐');

  const view = sp.get('view');
  const addr = addresses.find((a) => a.id === selectedAddressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];
  const openAddress = () => setSp((p) => { p.set('view', 'address'); return p; });

  const KING_FILTER: Record<string, (s: LifeShop) => boolean> = {
    推荐: () => true,
    超市: (s) => /超市|盒马|七鲜|永辉/.test(s.name),
    便利店: (s) => /便利|罗森|全家|便利蜂/.test(s.name),
    生鲜果蔬: (s) => s.dishes.some((d) => /果|菜|鲜|瓜/.test(d.name + d.cat)) || /生鲜|果/.test(s.name),
    酒水: (s) => s.dishes.some((d) => /酒|啤|饮/.test(d.name + d.cat)),
    酒水饮料: (s) => s.dishes.some((d) => /酒|啤|饮|茶|咖/.test(d.name + d.cat)),
    鲜花糕点: (s) => s.dishes.some((d) => /花|糕|饼|甜/.test(d.name + d.cat)),
    零食: (s) => s.dishes.some((d) => /零食|薯|糖|瓜子/.test(d.name + d.cat)),
    家居日用: (s) => s.dishes.some((d) => /纸|洗|日用|护/.test(d.name + d.cat)),
    美妆个护: (s) => s.dishes.some((d) => /美妆|护|护肤|洗护/.test(d.name + d.cat)),
    粮油速食: (s) => s.dishes.some((d) => /米|油|面|速食|方便/.test(d.name + d.cat)),
    医药健康: (s) => /药|健康|医/.test(s.name) || s.dishes.some((d) => /药|维/.test(d.name + d.cat)),
  };

  const superShops = lifeShops.filter((s) => s.kind === 'super');
  const baseShops = superShops.length ? superShops : lifeShops;
  const filterFn = KING_FILTER[kingCat] ?? (() => true);
  const filtered = baseShops.filter(filterFn);
  const shops = filtered.length ? filtered : baseShops;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部:主站顶 tab(特价/首页/秒送/新品,秒送态)+ 搜索 + 定位 —— 与真机 nav B 一致 */}
      <div className="shrink-0 pt-10 px-3 pb-2 bg-gradient-to-b from-[#FFE0D4] to-[#FFF3EE]">
        <div className="flex items-center justify-between">
          <div className="flex items-end gap-4">
            {TOP_TABS.map((t) => {
              if (t.key === 'miaosong') {
                return (
                  <span key={t.key} className="relative leading-none text-[#E1251B] text-[22px] font-bold mr-5">
                    {t.label}
                    <span className="absolute -top-1 -right-6 bg-[#FF4E33] text-white text-[9px] px-1 rounded-sm">外卖</span>
                  </span>
                );
              }
              if (t.key === 'deal') {
                return (
                  <button key={t.key} {...bindTap('miaosong.toptab-deal')} className="leading-none text-[#333] text-[16px]">
                    {t.label}
                  </button>
                );
              }
              if (t.key === 'new') {
                return (
                  <button key={t.key} {...bindTap('miaosong.toptab-new')} className="leading-none text-[#333] text-[16px]">
                    {t.label}
                  </button>
                );
              }
              return (
                <button key={t.key} {...bindTap('miaosong.toptab-home')} className="leading-none text-[#333] text-[16px]">
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="w-[92px] h-9 rounded-lg bg-gradient-to-r from-[#FDE8DC] to-[#F8CBB3] flex flex-col items-center justify-center leading-tight">
            <span className="text-[10px] font-semibold text-[#B8460F]">京东服务</span>
            <span className="text-[10px] text-[#C4340F]">3.9元养车</span>
          </div>
        </div>
        <button
          {...bindTap('miaosong.search-open', { params: { from: 'miaosong' } })}
          className="mt-2 w-full h-9 rounded-full bg-white border-[1.5px] border-[#FF4E33] flex items-center pl-3 pr-1"
        >
          <IcSearch size={18} className="text-[#FF4E33] shrink-0" />
          <span className="flex-1 text-left px-2 text-[13px] text-[#999] truncate">塔斯汀 · 品质好物一键直达</span>
          <span className="px-3 text-[15px] font-semibold text-[#FF4E33]">搜索</span>
        </button>
        <div className="h-8 flex items-center gap-1">
          <button
            {...bindTap({ kind: 'action', id: 'miaosong.address.show' }, { onTrigger: openAddress })}
            className="flex items-center gap-1 min-w-0"
          >
            <IcMapPin size={16} className="text-[#333] shrink-0" />
            <span className="text-[15px] font-semibold text-[#1A1A1A] max-w-[150px] truncate">{addr ? addr.detail : '选择收货地址'}</span>
            <IcChevronDown size={16} className="text-[#666] shrink-0" />
          </button>
          <div className="flex-1" />
          <span className="text-[11px] font-semibold text-[#B8860B] bg-[#FFEFC9] rounded-full px-2 py-0.5">超级月卡</span>
          <span className="text-[12px] text-[#333] ml-2">周菜单</span>
          <span className="text-[16px] text-[#666] ml-2 leading-none">···</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="miaosong-feed" data-scroll-direction="vertical">
        {/* 商超品类金刚区(横向分页,可左右滑动切换) */}
        <div className="bg-white mx-2 mt-2 rounded-xl py-3">
          <div
            className="overflow-x-auto no-scrollbar snap-x snap-mandatory"
            data-scroll-container="miaosong-kingkong"
            data-scroll-direction="horizontal"
          >
            <div className="flex">
              {KINGKONG_PAGES.map((page, pi) => (
                <div key={pi} className="w-full shrink-0 snap-start grid grid-cols-5 gap-y-3">
                  {page.map((k) => {
                    const active = kingCat === k.label;
                    return (
                      <button
                        key={k.label}
                        {...bindTap({ kind: 'action', id: 'miaosong.kingkong.select.cat' }, { params: { cat: k.label }, onTrigger: () => setKingCat(k.label) })}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-[22px] ${active ? 'bg-[#FFE0D4]' : 'bg-[#F7F7F7]'}`}>
                          {k.emoji}
                        </div>
                        <span className={`text-[11px] ${active ? 'text-[#FF4E33] font-semibold' : 'text-[#333]'}`}>{k.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* 分页指示 */}
          <div className="flex justify-center gap-1 mt-2">
            {KINGKONG_PAGES.map((_, i) => (
              <span key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-[#FF4E33]' : 'w-1.5 bg-[#E5E5E5]'}`} />
            ))}
          </div>
        </div>

        {/* 限时特价 / 自提更省 / 领券中心 / 每日赚钱 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-2 py-2.5 flex items-center justify-between text-[12px]">
          <div className="flex-1 flex flex-col items-center gap-0.5 text-[#FF4E33]"><span className="text-[16px]">⚡</span>限时特价</div>
          <div className="w-px h-6 bg-[#F0F0F0]" />
          <div className="flex-1 flex flex-col items-center gap-0.5 text-[#B8860B]"><span className="text-[16px]">🛍️</span>自提更省</div>
          <div className="w-px h-6 bg-[#F0F0F0]" />
          <button {...bindTap('miaosong.couponcenter-open')} className="flex-1 flex flex-col items-center gap-0.5 text-[#FF4E33]">
            <span className="relative text-[16px]">🎫<span className="absolute -top-2 -right-4 bg-[#FF4E33] text-white text-[8px] px-1 rounded-full">20元</span></span>领券中心
          </button>
          <div className="w-px h-6 bg-[#F0F0F0]" />
          <div className="flex-1 flex flex-col items-center gap-0.5 text-[#E67E22]"><span className="text-[16px]">💰</span>每日赚钱</div>
        </div>

        {/* 超级补贴 1元冰一夏 */}
        <div className="bg-gradient-to-b from-[#FFE7DE] to-white mx-2 mt-2 rounded-xl p-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[16px] font-bold text-[#C4340F]">超级补贴</span>
            <span className="text-[12px] text-[#999] flex items-center">更多<IcChevronRight size={14} /></span>
          </div>
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2">
              {shops.flatMap((s) => s.dishes).slice(0, 6).map((d) => (
                <div key={d.id} className="w-[86px] shrink-0">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]">
                    <Img src={d.image} className="w-full h-full object-cover" />
                    <span className="absolute left-0 top-0 bg-[#C4340F] text-white text-[9px] px-1 rounded-br">爆品一口价</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <PriceYuan value={d.price} className="text-[#FF2D2D] text-[14px]" />
                    <span className="bg-[#FFEDE4] text-[#FF2D2D] text-[9px] px-1 rounded">补{(d.originPrice - d.price).toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 排序行(展示) */}
        <div className="flex items-center gap-4 px-4 py-2.5 text-[13px] text-[#333] mt-1">
          <span className="flex items-center font-medium">综合排序<IcChevronDown size={14} /></span>
          <span>自营秒送</span>
          <span className="flex items-center text-[#FF4E33]">⚡15分钟达</span>
          <span>30分钟达</span>
        </div>

        {/* 门店卡列表 */}
        <div className="px-2 pb-4 flex flex-col gap-2">
          {shops.map((shop) => (
            <MiaosongShopCard key={shop.id} shop={shop} bindTap={bindTap} />
          ))}
        </div>
      </div>

      {/* 收货地址切换弹层(URL 驱动 ?view=address,返回键/遮罩即关) */}
      {view === 'address' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="bg-white rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-12 flex items-center justify-center border-b border-[#F5F5F5] text-[16px] font-semibold text-[#1A1A1A]">
              选择收货地址
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {addresses.map((a) => {
                const active = addr?.id === a.id;
                return (
                  <button
                    key={a.id}
                    {...bindTap({ kind: 'action', id: 'miaosong.address.select.addr' }, { params: { addressId: a.id }, onTrigger: () => { selectAddress(a.id); back(); } })}
                    className="w-full flex items-start gap-2 px-4 py-3 border-b border-[#F7F7F7] text-left"
                  >
                    <IcMapPin size={16} className={`mt-0.5 shrink-0 ${active ? 'text-[#FF4E33]' : 'text-[#BBB]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[15px] truncate ${active ? 'text-[#FF4E33] font-semibold' : 'text-[#1A1A1A]'}`}>{a.detail}</div>
                      <div className="text-[12px] text-[#999] truncate mt-0.5">{a.region} · {a.name}</div>
                    </div>
                    {a.tag && <span className="text-[10px] text-[#FF4E33] border border-[#FF4E33]/40 rounded px-1 py-0.5 shrink-0">{a.tag}</span>}
                    {active && <IcCheck size={16} className="text-[#FF4E33] shrink-0" />}
                  </button>
                );
              })}
            </div>
            <button {...bindBack()} className="w-full h-12 text-[15px] text-[#666]">取消</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiaosongShopCard({ shop, bindTap }: { shop: LifeShop; bindTap: ReturnType<typeof useJingdongGestures>['bindTap'] }) {
  return (
    <div {...bindTap('miaosong.shop-open', { params: { shopId: shop.id } })} className="bg-white rounded-xl p-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white bg-[#FF4E33] rounded px-1 py-0.5">自营</span>
        <span className="text-[10px] text-[#FF4E33] border border-[#FF4E33]/40 rounded px-1 py-0.5">秒送</span>
        <span className="text-[16px] font-bold text-[#1A1A1A] truncate flex-1">{shop.name}</span>
      </div>
      <div className="flex items-center gap-2 mt-1.5 text-[12px] text-[#666]">
        <span className="flex items-center text-[#FF8C00] font-semibold"><IcStar size={13} className="fill-current" />{shop.rating}</span>
        <span>{shop.sold}</span>
        <span className="flex-1" />
        <span className="text-[#333]">{shop.eta} · {shop.distance}</span>
      </div>
      <div className="overflow-x-auto no-scrollbar mt-2.5">
        <div className="flex gap-2">
          {shop.dishes.slice(0, 4).map((d) => (
            <div key={d.id} className="w-[92px] shrink-0">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]">
                <Img src={d.image} className="w-full h-full object-cover" />
                <span className="absolute left-1 top-1 text-[9px] text-white bg-[#FF4E33] rounded px-1">自营</span>
              </div>
              <div className="text-[11px] text-[#333] line-clamp-1 mt-1">{d.name}</div>
              <div className="flex items-center justify-between mt-0.5">
                <PriceYuan value={d.price} className="text-[#FF2D2D] text-[14px]" />
                <button
                  {...bindTap('miaosong.shop-sku-open', { params: { shopId: shop.id, itemId: d.id }, stopPropagation: true })}
                  aria-label="加购"
                  className="w-6 h-6 rounded-full bg-[#FF4E33] text-white flex items-center justify-center shrink-0"
                >
                  <IcPlus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
