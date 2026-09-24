import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Countdown, useToast, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { subsOf, BRAND_SORTS } from '../constants';
import { IcFilter } from '../res/icons';

export default function BrandEventPage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [toast] = useToast();

  const brand = useVipshopStore((s) => s.brands.find((b) => b.id === id));
  const items = useVipshopStore((s) => s.items);
  const subscribedBrands = useVipshopStore((s) => s.subscribedBrands);
  const toggleSubscribe = useVipshopStore((s) => s.toggleSubscribe);

  const [subcat, setSubcat] = useState<string>('全部');
  const [sort, setSort] = useState<string>(BRAND_SORTS[0].id);

  const brandItems = useMemo(() => {
    let arr = items.filter((it) => it.brandId === id);
    if (arr.length === 0) arr = items.slice(0, 8); // 兜底:专场内容不为空
    // 二级分类筛选(按品牌类目派生的子分类)
    if (subcat !== '全部') arr = arr.filter((it) => it.subCategory === subcat);
    // 排序(销量默认 / 价格升 / 折扣深),折扣同比时用价格兜底,保证可见重排
    if (sort === 'price') arr = [...arr].sort((a, b) => a.price - b.price);
    else if (sort === 'discount') arr = [...arr].sort((a, b) => (a.price / a.originPrice - b.price / b.originPrice) || (a.price - b.price));
    else arr = [...arr].sort((a, b) => b.reviewCount - a.reviewCount);
    return arr;
  }, [items, id, subcat, sort]);

  if (!brand) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="品牌专场" />
        <div className="flex-1 flex items-center justify-center text-[#888888]">专场不存在</div>
      </div>
    );
  }

  const subscribed = subscribedBrands.includes(brand.id);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title={brand.name} />

      <div className="flex-1 overflow-y-auto" data-scroll-container="brand-body" data-scroll-direction="vertical">
        {/* 头部 banner + 倒计时 + 订阅 */}
        <div className="relative">
          <Img src={brand.banner} className="w-full h-36 object-cover" />
          <div
            className="absolute inset-0 flex flex-col justify-end px-4 pb-3"
            style={{ background: 'linear-gradient(180deg,rgba(0,0,0,0.05),rgba(228,0,127,0.6))' }}
          >
            <div className="flex items-center gap-2">
              <Img src={brand.logo} className="w-10 h-10 rounded-lg object-cover border-2 border-white" />
              <div className="flex-1 min-w-0">
                <div className="text-white text-[16px] font-bold truncate">{brand.name} · 超级大牌日</div>
                <div className="text-white text-[11px] opacity-90 truncate">{brand.slogan}</div>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'brand.subscribe.toggle' }, { onTrigger: () => toggleSubscribe(brand.id) })}
                className="shrink-0 text-[12px] rounded-full px-3 py-1 cursor-pointer border-none font-semibold"
                style={subscribed ? { background: 'rgba(255,255,255,0.85)', color: VIP.primary } : { background: VIP.ctaBlack, color: '#fff' }}
              >
                {subscribed ? '已订阅' : '订阅'}
              </button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[12px] text-[#E4007F] bg-white rounded-full px-2 py-0.5 font-semibold">{brand.discountText}</span>
              <span className="text-white text-[11px] opacity-90">距结束</span>
              <Countdown endsAt={brand.endsAt} dark={false} />
            </div>
          </div>
        </div>

        {/* 子分类 tab(按品牌类目派生) */}
        <div className="bg-white flex overflow-x-auto no-scrollbar px-2 border-b border-[#F5F5F5]">
          {subsOf(brand.category).map((sub) => {
            const on = sub === subcat;
            return (
              <button
                key={sub}
                {...bindTap({ kind: 'action', id: 'brand.subcat.select.target' }, {
                  params: { target: sub },
                  onTrigger: () => setSubcat(sub),
                })}
                className={`shrink-0 px-3 py-2 text-[14px] bg-transparent border-none cursor-pointer ${on ? 'font-semibold' : 'text-[#666666]'}`}
                style={on ? { color: VIP.primary } : undefined}
              >
                {sub}
                {on && <span className="block h-0.5 w-5 mx-auto mt-0.5 rounded-full" style={{ background: VIP.primary }} />}
              </button>
            );
          })}
        </div>

        {/* 排序行 + 筛选 */}
        <div className="bg-white flex items-center px-3 py-2 border-b border-[#F5F5F5]">
          <div className="flex gap-4 flex-1">
            {BRAND_SORTS.map((s) => {
              const on = s.id === sort;
              return (
                <button
                  key={s.id}
                  {...bindTap({ kind: 'action', id: 'brand.sort.select.target' }, {
                    params: { target: s.id },
                    onTrigger: () => setSort(s.id),
                  })}
                  className="text-[13px] bg-transparent border-none cursor-pointer"
                  style={on ? { color: VIP.primary, fontWeight: 600 } : { color: '#666' }}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
          <button
            {...bindTap('brand.filter-open')}
            className="flex items-center gap-1 text-[13px] text-[#666666] bg-transparent border-none cursor-pointer"
          >
            <IcFilter size={15} />筛选
          </button>
        </div>

        {/* 专场内商品 */}
        <div className="pt-2">
          <ItemGrid
            items={brandItems}
            bindingOf={(it) => bindTap('brand.item-open', { params: { id: it.id } })}
          />
          {brandItems.length === 0 && (
            <div className="text-center text-[13px] text-[#888888] py-10">该专场暂无商品</div>
          )}
        </div>
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
