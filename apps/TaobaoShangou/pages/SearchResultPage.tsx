import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price } from '../components/common';
import { ShopCard } from '../components/ShopCard';
import { IcBack, IcDown, IcPin, IcPlus } from '../res/icons';
import type { TbItem, TbShop } from '../types';
import { useStatusBarBg } from '../statusbar';

/** 热卖品牌 chips(IMG_6069) */
const BRANDS: { name: string; icon: string }[] = [
  { name: '蒙牛', icon: '🥛' },
  { name: '伊利', icon: '🍼' },
  { name: '简爱', icon: '🍶' },
  { name: '君乐宝', icon: '🥛' },
  { name: '卡士', icon: '🍶' },
  { name: '光明', icon: '🥛' },
];

const SORTS: { key: string; label: string }[] = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'speed', label: '速度' },
];

const FILTER_CHIPS = ['外卖红包', '堂食店', '超市便利', '包装方式', '筛选'];

/** 品类→可搜关键词(让"烧烤/奶茶/火锅"等品类词能命中对应商家) */
const CATEGORY_LABELS: Record<string, string> = {
  bbqshop: '烧烤 龙虾 烤串', seafood: '海鲜 香辣蟹 小龙虾', milktea: '奶茶 果汁 饮品 茶',
  coffee: '咖啡', friedchicken: '炸鸡 汉堡', skewer: '炸串 串串 烤串', luwei: '卤味 鸭脖 熟食',
  dumpling: '饺子 水饺', guotie: '锅贴 煎饺', noodleshop: '面 拉面 米线 粉', malatang: '麻辣烫 冒菜',
  hotpot: '火锅 涮锅', japanese: '日料 寿司 刺身 料理', burger: '汉堡 西式快餐', salad: '轻食 沙拉 健康餐',
  cake: '蛋糕 烘焙 面包', dessert: '甜品 糖水', congee: '粥 早餐', cnfast: '快餐 盖饭 中式',
  snackshop: '小吃 夜宵', supermarket: '超市 百货', convenience: '便利店', fruitshop: '水果 生鲜',
  flowershop: '鲜花 花束', pharmacy: '药品 医药 健康',
};

/** 模糊命中:子串命中,或关键词全部字符都出现(容错) */
function fuzzyHit(text: string, kw: string): boolean {
  if (!kw) return true;
  if (text.includes(kw)) return true;
  return [...kw].every((ch) => text.includes(ch));
}

function passChip(shop: TbShop, f: string): boolean {
  switch (f) {
    case '外卖红包': return Boolean(shop.burstCoupon);
    case '堂食店': return shop.supportsPickup;
    case '超市便利': return ['supermarket', 'convenience'].includes(shop.category);
    default: return true; // 包装方式/筛选:展示型条件
  }
}

export default function SearchResultPage() {
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#FFEFE3');
  const [sp] = useSearchParams();
  const q = sp.get('q') ?? '';

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const poi = useTbsgStore((st) => st.locationPoi);

  const [brand, setBrand] = useState<string | null>(null);
  const [sort, setSort] = useState('default');
  const [chips, setChips] = useState<string[]>([]);

  /** 结果:全部商家(餐饮+零售),按商品名/描述/标签/店名/品类词模糊匹配 */
  const results = useMemo(() => {
    const kw = q.trim();
    const sales = (x: TbShop) => parseInt(x.monthlySales, 10) || 0;
    const arr = shops
      .map((shop) => {
        const shopItems = items.filter((i) => i.shopId === shop.id);
        const itemHits = kw
          ? shopItems.filter((i) => fuzzyHit(`${i.name}${i.desc}${i.tags.join('')}`, kw))
          : shopItems;
        // 店名/品类词命中(如"烧烤"命中 bbqshop 商家)
        const shopText = `${shop.name}${shop.fullName}${CATEGORY_LABELS[shop.category] ?? ''}${shop.features.join('')}`;
        const matched = kw ? (itemHits.length > 0 || fuzzyHit(shopText, kw)) : true;
        const display = (itemHits.length > 0 ? itemHits : shopItems)
          .sort((a, b) => b.monthlySales - a.monthlySales)
          .slice(0, 4);
        return { shop, matched, display };
      })
      .filter((r) => r.matched && r.display.length > 0)
      .filter((r) => (brand ? r.display.some((i) => i.name.includes(brand)) : true))
      .filter((r) => chips.every((f) => passChip(r.shop, f)));
    switch (sort) {
      case 'sales': arr.sort((a, b) => sales(b.shop) - sales(a.shop)); break;
      case 'speed': arr.sort((a, b) => a.shop.deliveryMinutes - b.shop.deliveryMinutes); break;
      default: arr.sort((a, b) => b.shop.rating - a.shop.rating);
    }
    return arr.slice(0, 30);
  }, [shops, items, q, brand, sort, chips]);

  const itemBadge = (it: TbItem) => it.tags[0] ?? (it.monthlySales >= 300 ? `已售${Math.floor(it.monthlySales / 100) * 100}+` : null);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 顶栏:返回+搜索框(显示词)+定位简称 */}
      <div className="flex items-center h-12 px-2 gap-1 shrink-0 bg-gradient-to-b from-[#FFEFE3] to-[#F3F6F8]">
        <button
          {...bindBack<HTMLButtonElement>()}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="返回"
        >
          <IcBack size={22} className="text-[#1A1A1A]" />
        </button>
        <div
          {...bindTap<HTMLDivElement>('searchresult.research')}
          className="flex-1 h-9 rounded-full bg-white flex items-center px-4 cursor-pointer"
        >
          <span className="text-[14px] text-[#1A1A1A] truncate">{q || '酸奶'}</span>
        </div>
        <span className="flex items-center gap-0.5 px-1 text-[13px] text-[#1A1A1A] max-w-[92px]">
          <IcPin size={13} className="shrink-0" />
          <span className="truncate">{poi.slice(0, 4)}</span>
          <IcDown size={12} className="shrink-0" />
        </span>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 热卖品牌 chips */}
        <div className="px-3 pt-1">
          <div className="flex items-center gap-4">
            <span className="font-bold text-[15px] text-[#1A1A1A]">热卖品牌</span>
            <span className="text-[14px] text-[#999999]">热卖类型</span>
          </div>
          <div className="flex gap-2 mt-2 overflow-x-auto" data-scroll-container="brands" data-scroll-direction="horizontal">
            {BRANDS.map((b) => (
              <button
                key={b.name}
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'searchresult.brand.filter' }, {
                  params: { brand: b.name },
                  onTrigger: () => setBrand((prev) => (prev === b.name ? null : b.name)),
                })}
                className={`shrink-0 w-[72px] rounded-lg py-2 flex flex-col items-center gap-1 border cursor-pointer ${
                  brand === b.name ? 'bg-[#FFF3EB] border-[#ED6C2C]' : 'bg-white border-transparent'
                }`}
              >
                <span className="text-[26px]">{b.icon}</span>
                <span className={`text-[12px] ${brand === b.name ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}>{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 排序行 + 筛选chips */}
        <div className="flex items-center gap-5 px-4 py-2 sticky top-0 z-10 bg-[#F3F6F8]">
          {SORTS.map((o) => (
            <button
              key={o.key}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'searchresult.sort.select' }, {
                params: { sort: o.key },
                onTrigger: () => setSort(o.key),
              })}
              className={`flex items-center text-[14px] bg-transparent border-none cursor-pointer p-0 ${
                sort === o.key ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'
              }`}
            >
              {o.label}
              {o.key === 'default' && <IcDown size={13} />}
            </button>
          ))}
        </div>
        <div className="flex gap-2 px-3 pb-1 overflow-x-auto" data-scroll-container="filterchips" data-scroll-direction="horizontal">
          {FILTER_CHIPS.map((f) => (
            <button
              key={f}
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'searchresult.filter.toggle' }, {
                params: { filter: f },
                onTrigger: () => setChips((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f])),
              })}
              className={`shrink-0 h-8 px-3 rounded-lg text-[12px] border cursor-pointer flex items-center ${
                chips.includes(f) ? 'bg-[#FFF3EB] border-[#ED6C2C] text-[#ED6C2C] font-semibold' : 'bg-white border-transparent text-[#1A1A1A]'
              }`}
            >
              {f}
              {(f === '包装方式' || f === '筛选') && <IcDown size={12} />}
            </button>
          ))}
        </div>

        {/* 结果列表:商家卡 + 爆红包/匹配商品横滑 */}
        <div className="px-3 py-1.5 flex flex-col gap-2 pb-4">
          {results.length === 0 && <EmptyState text="没有找到相关商品" />}
          {results.map(({ shop, display }) => {
            const isRest = shop.type === 'restaurant';
            return (
            <div key={shop.id} className="bg-white rounded-xl overflow-hidden">
              <ShopCard
                shop={shop}
                shopBinding={isRest
                  ? bindTap<HTMLDivElement>('searchresult.restshop-open', { params: { shopId: shop.id } })
                  : bindTap<HTMLDivElement>('searchresult.shop-open', { params: { shopId: shop.id } })}
              />
              <div className="flex gap-2 px-3 pb-3 overflow-x-auto" data-scroll-container="hits" data-scroll-direction="horizontal">
                {/* 爆红包竖卡 */}
                <div
                  {...(isRest
                    ? bindTap<HTMLDivElement>('searchresult.restshop-open', { params: { shopId: shop.id } })
                    : bindTap<HTMLDivElement>('searchresult.coupon-open', { params: { shopId: shop.id } }))}
                  className="w-[86px] shrink-0 rounded-lg border border-[#F5C1BC] bg-gradient-to-b from-[#FDEBE9] to-white flex flex-col items-center pt-2 cursor-pointer overflow-hidden"
                >
                  <span className="text-[10px] px-1.5 py-[1px] rounded-full bg-[#FDEBE9] text-[#EB493B] border border-[#F5C1BC]">爆红包</span>
                  <div className="text-[#F53F3F] font-bold mt-1.5">
                    <span className="text-[12px]">¥</span>
                    <span className="text-[22px]">{shop.burstCoupon.amount}</span>
                    <span className="text-[13px]">↑{shop.burstCoupon.amount + 2}</span>
                  </div>
                  <span className="text-[10px] text-[#C4471F]">可爆涨</span>
                  <span className="mt-auto w-full h-8 bg-[#F53F3F] text-white text-[12px] font-semibold flex items-center justify-center">去使用 &gt;</span>
                </div>
                {/* 命中商品卡 */}
                {display.map((it) => (
                  <div
                    key={it.id}
                    {...(isRest
                      ? bindTap<HTMLDivElement>('searchresult.restitem-open', { params: { shopId: shop.id } })
                      : bindTap<HTMLDivElement>('searchresult.item-open', { params: { shopId: shop.id } }))}
                    className="w-[100px] shrink-0 cursor-pointer"
                  >
                    <div className="relative">
                      <AppImg src={it.image} className="w-[100px] h-[100px] rounded-lg object-cover" />
                      {itemBadge(it) && (
                        <span className="absolute left-0 bottom-0 text-[10px] px-1 py-[1px] rounded-tr-lg bg-[#ED6C2C]/90 text-white">{itemBadge(it)}</span>
                      )}
                    </div>
                    <div className="text-[12px] text-[#1A1A1A] leading-tight mt-1 h-8 overflow-hidden">{it.name}</div>
                    <div className="flex items-center">
                      <Price value={it.price} size={15} />
                      <span className="ml-auto w-6 h-6 rounded-full bg-[#ED6C2C] text-white flex items-center justify-center">
                        <IcPlus size={14} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
