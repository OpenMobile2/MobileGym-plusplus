import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Price, DiscountTag, EmptyState, VIP } from '../components/ui';
import { FAVORITE_TABS } from '../constants';
import { IcBell } from '../res/icons';

export default function FavoritesPage() {
  const { bindTap } = useVipshopGestures();
  const [tab, setTab] = useState<string>('item');
  const [manage, setManage] = useState(false);

  const items = useVipshopStore((s) => s.items);
  const brands = useVipshopStore((s) => s.brands);
  const favorites = useVipshopStore((s) => s.favorites);
  const favoriteBrands = useVipshopStore((s) => s.favoriteBrands);

  const favItems = items.filter((it) => favorites.includes(it.id));
  const favBrandList = brands.filter((b) => favoriteBrands.includes(b.id));

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部标题栏(底部tab页,无返回) */}
      <div className="h-11 shrink-0 bg-white border-b border-[#EEEEEE] flex items-center px-3 pt-1">
        <span className="text-[16px] font-semibold text-[#222222]">我的收藏</span>
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'favorites.manage.toggle' }, { onTrigger: () => setManage((m) => !m) })}
          className="bg-transparent border-none cursor-pointer text-[14px] text-[#222222]"
        >
          {manage ? '完成' : '管理'}
        </button>
      </div>

      {/* tab */}
      <div className="shrink-0 bg-white flex border-b border-[#F5F5F5]">
        {FAVORITE_TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'favorites.tab.select.target' }, {
                params: { target: t.id },
                onTrigger: () => setTab(t.id),
              })}
              className="flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer relative"
              style={on ? { color: VIP.primary, fontWeight: 600 } : { color: '#666666' }}
            >
              {t.label}
              {on && <span className="block h-0.5 w-6 mx-auto mt-1 rounded-full" style={{ background: VIP.primary }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="favorites-list" data-scroll-direction="vertical">
        {/* 商品 tab */}
        {tab === 'item' && (
          favItems.length === 0 ? (
            <EmptyState text="还没有收藏的商品" hint="快去逛逛心仪好物吧~" />
          ) : (
            <div className="p-2 flex flex-col gap-2">
              {favItems.map((it) => (
                <div key={it.id} className="bg-white rounded-lg p-2.5 flex gap-2.5">
                  <div {...bindTap('favorites.buy-open', { params: { id: it.id } })} className="cursor-pointer shrink-0">
                    <Img src={it.image} className="w-24 h-24 rounded-lg object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[13px] text-[#222222] line-clamp-2">{it.title}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Price value={it.price} size="m" />
                      <span className="text-[10px] text-[#BBBBBB] line-through">¥{it.originPrice}</span>
                      <DiscountTag text={it.discountText} />
                    </div>
                    <div className="flex-1" />
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <button
                        {...bindTap('favorites.findSimilar-open', { params: { q: it.title.slice(0, 4) } })}
                        className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white text-[#666666]"
                        style={{ borderColor: '#DDDDDD' }}
                      >
                        找相似
                      </button>
                      <button
                        {...bindTap('favorites.priceAlert-open')}
                        className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white text-[#666666] flex items-center gap-0.5"
                        style={{ borderColor: '#DDDDDD' }}
                      >
                        <IcBell size={12} />降价提醒
                      </button>
                      <button
                        {...bindTap('favorites.addCart-open', { params: { id: it.id } })}
                        className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white"
                        style={{ color: VIP.primary, borderColor: VIP.primary }}
                      >
                        加购
                      </button>
                      <button
                        {...bindTap('favorites.buy-open', { params: { id: it.id } })}
                        className="text-[12px] rounded-full px-4 py-1 border-none cursor-pointer text-white"
                        style={{ background: VIP.ctaBlack }}
                      >
                        去购买
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 品牌 tab */}
        {tab === 'brand' && (
          favBrandList.length === 0 ? (
            <EmptyState text="还没有收藏的品牌" />
          ) : (
            <div className="p-2 flex flex-col gap-2">
              {favBrandList.map((b) => (
                <div key={b.id} className="bg-white rounded-lg p-3 flex items-center gap-3">
                  <Img src={b.logo} className="w-12 h-12 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-[#222222] truncate">{b.name}</div>
                    <div className="text-[11px] text-[#888888] mt-0.5">{b.subscribers}人订阅 · {b.discountText}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 穿搭 tab */}
        {tab === 'outfit' && <EmptyState text="暂无收藏的穿搭" hint="发现更多灵感搭配" />}
      </div>
    </div>
  );
}
