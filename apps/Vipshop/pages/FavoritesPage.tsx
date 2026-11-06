import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Price, DiscountTag, Countdown, EmptyState, useToast, VIP } from '../components/ui';
import { IcSearch, IcBell, IcArrowRight } from '../res/icons';
import type { VipItem, VipBrand } from '../types';

const TABS = [
  { id: 'item', label: '商品收藏' },
  { id: 'brand', label: '品牌订阅' },
  { id: 'outfit', label: '穿搭收藏' },
] as const;

const FILTER_CHIPS = [
  { id: 'pricedrop', label: '降价' },
  { id: 'cat', label: '分类/品牌', caret: true },
  { id: 'stock', label: '库存状态', caret: true },
  { id: 'time', label: '收藏时间', caret: true },
] as const;

/** 由商品 id 派生一个稳定的「收藏后降价」数值 + 倒计时,避免随机数 */
function dropInfo(it: VipItem): { drop: number; endsAt: number } {
  const h = it.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const drop = Math.max(3, Math.round((it.originPrice - it.price) * ((h % 5) + 3) / 100));
  const endsAt = TimeService.now() + ((h % 20) + 4) * 3600_000;
  return { drop, endsAt };
}

const OUTFIT_CAPTIONS = [
  '夏日通勤运动风✨灰黑配清爽不闷汗', '波点衬衫搭高腰裙,尽显优雅魅力',
  '早秋通勤甜辣杀!开叉牛仔配印花衬衫', '法式泡泡袖衬衫阔腿牛仔裤,清爽自在',
  '夏日氛围感拿捏✨蕾丝背心+碎花裙绝配', '夏日防晒穿搭新思路⚡运动风也能穿出高级感',
  '到了该拿下冲锋衣的季节✨', '公牛世家棕色气质休闲裤|轻盈透气百搭',
  '夏日清爽男友穿搭➕蓝调cp锁死这个夏天', '气质长袖T恤与休闲直筒裤穿搭',
];

export default function FavoritesPage() {
  const { bindTap } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const [toast, showToast] = useToast();
  // 进入 tab 可由入口指定(「我的」的订阅入口直接落到品牌订阅)
  const initialTab = TABS.some((t) => t.id === searchParams.get('tab')) ? searchParams.get('tab')! : 'item';
  const [tab, setTab] = useState<string>(initialTab);
  const [manage, setManage] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [chip, setChip] = useState('');
  const [bannerOn, setBannerOn] = useState(true);

  const items = useVipshopStore((s) => s.items);
  const brands = useVipshopStore((s) => s.brands);
  const favorites = useVipshopStore((s) => s.favorites);
  const favoriteBrands = useVipshopStore((s) => s.favoriteBrands);
  const setPriceAlert = useVipshopStore((s) => s.setPriceAlert);
  const subscribedBrands = useVipshopStore((s) => s.subscribedBrands);
  const favoriteOutfits = useVipshopStore((s) => s.favoriteOutfits);
  const toggleFavorite = useVipshopStore((s) => s.toggleFavorite);
  const removeBrandFavorites = useVipshopStore((s) => s.removeBrandFavorites);
  const removeFavoriteOutfits = useVipshopStore((s) => s.removeFavoriteOutfits);
  const claimCoupon = useVipshopStore((s) => s.claimCoupon);

  const favItems = useMemo(() => {
    let list = items.filter((it) => favorites.includes(it.id));
    if (chip === 'pricedrop') list = [...list].sort((a, b) => dropInfo(b).drop - dropInfo(a).drop);
    return list;
  }, [items, favorites, chip]);
  const favBrandList = brands.filter((b) => favoriteBrands.includes(b.id) || subscribedBrands.includes(b.id));
  const subCircles = brands.filter((b) => subscribedBrands.includes(b.id)).slice(0, 8);
  const outfitCards = useMemo(
    () => favoriteOutfits.map((id) => items.find((it) => it.id === id)).filter(Boolean) as VipItem[],
    [items, favoriteOutfits],
  );

  // 三个 tab 共用一套管理态:当前 tab 决定"可勾选的是谁""删除意味着什么"
  const manageTargets = tab === 'item' ? favItems.map((it) => it.id)
    : tab === 'brand' ? favBrandList.map((b) => b.id)
      : outfitCards.map((it) => it.id);
  const deleteLabel = tab === 'brand' ? '取消订阅' : '取消收藏';

  const changeTab = (id: string) => { setTab(id); setManage(false); setChecked(new Set()); };
  const toggleCheck = (id: string) => setChecked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const allChecked = manageTargets.length > 0 && manageTargets.every((id) => checked.has(id));
  const toggleAll = () => setChecked(allChecked ? new Set() : new Set(manageTargets));
  const deleteChecked = () => {
    if (checked.size === 0) { showToast(tab === 'brand' ? '请先选择品牌' : '请先选择商品'); return; }
    const ids = [...checked];
    if (tab === 'brand') removeBrandFavorites(ids);
    else if (tab === 'outfit') removeFavoriteOutfits(ids);
    else ids.forEach((id) => toggleFavorite(id));
    showToast(`已${deleteLabel} ${ids.length} ${tab === 'brand' ? '个' : '件'}`);
    setChecked(new Set());
    setManage(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      {/* 顶部三 tab + 管理 */}
      <div className="h-11 shrink-0 bg-white flex items-center px-3 pt-1">
        {TABS.map((t) => {
          const on = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'favorites.tab.select.target' }, { params: { target: t.id }, onTrigger: () => changeTab(t.id) })}
              className="bg-transparent border-none cursor-pointer mr-4 relative"
              style={on ? { fontSize: 17, fontWeight: 700, color: '#222' } : { fontSize: 15, color: '#888' }}
            >
              {t.label}
              {on && <span className="block h-1 w-5 mx-auto mt-0.5 rounded-full" style={{ background: VIP.primary }} />}
            </button>
          );
        })}
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'favorites.manage.toggle' }, { onTrigger: () => { setManage((m) => !m); setChecked(new Set()); } })}
          className="bg-transparent border-none cursor-pointer text-[14px] text-[#222222]"
        >
          {manage ? '完成' : '管理'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="favorites-list" data-scroll-direction="vertical">
        {/* ============ 商品收藏 ============ */}
        {tab === 'item' && (
          favItems.length === 0 ? (
            <EmptyState text="还没有收藏的商品" hint="快去逛逛心仪好物吧~" />
          ) : (
            <>
              {/* 筛选 chips */}
              <div className="bg-white flex items-center gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-[#F5F5F5]">
                {FILTER_CHIPS.map((c) => {
                  const on = chip === c.id;
                  return (
                    <button
                      key={c.id}
                      {...bindTap({ kind: 'action', id: 'favorites.filter.select.target' }, { params: { target: c.id }, onTrigger: () => setChip(on ? '' : c.id) })}
                      className="shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer"
                      style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#555', borderColor: '#E5E5E5', background: '#fff' }}
                    >
                      {c.label}{'caret' in c && c.caret ? ' ▾' : ''}
                    </button>
                  );
                })}
                <IcSearch size={15} className="text-[#888888] shrink-0" />
                <span className="text-[12px] text-[#888888] shrink-0">更多</span>
              </div>

              {/* 降价提示 banner */}
              {bannerOn && (
                <div className="mx-2 mt-2 rounded-lg bg-[#FDECF5] flex items-center px-3 py-2">
                  <span className="text-[13px] text-[#222222] flex-1">
                    有<span style={{ color: VIP.primary }}>{Math.min(3, favItems.length)}</span>件收藏最高降
                    <span style={{ color: VIP.primary }}>25%</span> <span style={{ color: VIP.primary }}>去看看 ›</span>
                  </span>
                  <button
                    {...bindTap({ kind: 'action', id: 'favorites.banner.dismiss' }, { onTrigger: () => setBannerOn(false) })}
                    className="bg-transparent border-none cursor-pointer text-[#BBBBBB] text-[14px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div className="p-2 flex flex-col gap-2">
                {favItems.map((it) => {
                  const { drop, endsAt } = dropInfo(it);
                  return (
                    <div key={it.id} className="bg-white rounded-lg p-2.5 flex gap-2.5 relative">
                      {!manage && (
                        <button
                          {...bindTap({ kind: 'action', id: 'favorites.quickRemove.submit' }, { params: { id: it.id }, onTrigger: () => { toggleFavorite(it.id); showToast('已取消收藏'); }, stopPropagation: true })}
                          className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full border cursor-pointer bg-white flex items-center justify-center text-[#999999] text-[13px] leading-none z-10"
                          style={{ borderColor: '#E5E5E5' }}
                          aria-label="取消收藏"
                        >
                          ✕
                        </button>
                      )}
                      {manage && (
                        <button
                          {...bindTap({ kind: 'action', id: 'favorites.select.toggle' }, { params: { id: it.id }, onTrigger: () => toggleCheck(it.id) })}
                          className="self-center w-5 h-5 rounded-full border shrink-0 flex items-center justify-center"
                          style={checked.has(it.id) ? { background: VIP.primary, borderColor: VIP.primary, color: '#fff' } : { borderColor: '#CCC', background: '#fff' }}
                          aria-label="选择"
                        >
                          {checked.has(it.id) ? '✓' : ''}
                        </button>
                      )}
                      <div {...bindTap('favorites.buy-open', { params: { id: it.id } })} className="cursor-pointer shrink-0">
                        <Img src={it.image} className="w-24 h-24 rounded-lg object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="text-[13px] text-[#222222] line-clamp-2">{it.brandName}｜{it.title}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <Price value={it.price} size="m" />
                          <span className="text-[10px] text-[#BBBBBB] line-through">¥{it.originPrice}</span>
                          <DiscountTag text={it.discountText} />
                        </div>
                        <div className="text-[11px] mt-0.5 flex items-center gap-1" style={{ color: VIP.primary }}>
                          <span>比收藏时降¥{drop},剩</span><Countdown endsAt={endsAt} dark={false} />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] rounded px-1 py-0.5 border" style={{ color: VIP.primary, borderColor: VIP.primary }}>⚡60天低价</span>
                          <span className="text-[10px] rounded px-1 py-0.5" style={{ color: VIP.gold, background: '#FBF3E0' }}>回购已减¥{Math.max(3, Math.round(drop / 2))}</span>
                        </div>
                        <div className="flex items-center mt-1.5 whitespace-nowrap">
                          <button {...bindTap('favorites.findSimilar-open', { params: { q: it.title.slice(0, 4) } })} className="text-[11px] text-[#888888] bg-transparent border-none cursor-pointer flex items-center gap-0.5">
                            <IcSearch size={11} />找相似
                          </button>
                          <span className="flex-1" />
                          <button {...bindTap('favorites.priceAlert-open', { beforeTrigger: () => setPriceAlert(it.id) })} className="w-7 h-7 rounded-full border cursor-pointer bg-white flex items-center justify-center mr-1.5" style={{ borderColor: '#DDDDDD' }} aria-label="降价提醒">
                            <IcBell size={13} className="text-[#666666]" />
                          </button>
                          <button {...bindTap('favorites.addCart-open', { params: { id: it.id } })} className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white mr-1.5" style={{ color: '#222', borderColor: '#DDDDDD' }}>
                            加购
                          </button>
                          <button {...bindTap('favorites.buy-open', { params: { id: it.id } })} className="text-[12px] rounded-full px-3.5 py-1 border-none cursor-pointer text-white" style={{ background: VIP.ctaBlack }}>
                            去购买
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )
        )}

        {/* ============ 品牌订阅 ============ */}
        {tab === 'brand' && (
          <>
            {/* 订阅圈 */}
            <div className="bg-white flex items-center gap-3 px-3 py-3 overflow-x-auto no-scrollbar border-b border-[#F5F5F5]">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-12 h-12 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[10px] text-[#888]">全部<br/>订阅</div>
              </div>
              {subCircles.map((b) => (
                <button key={b.id} {...bindTap('favorites.brand-open', { params: { id: b.id } })} className="flex flex-col items-center gap-1 shrink-0 bg-transparent border-none cursor-pointer">
                  <Img src={b.logo} className="w-12 h-12 rounded-full object-cover" style={{ border: `1px solid ${VIP.primary}` }} />
                  <span className="text-[10px] text-[#666] max-w-12 truncate">{b.name}</span>
                </button>
              ))}
            </div>

            {favBrandList.length === 0 ? (
              <EmptyState text="您还没有订阅任何品牌~" hint="「订阅」喜欢的品牌,获取品牌最新动态" />
            ) : (
              <div className="flex flex-col">
                {favBrandList.map((b) => (
                  <BrandSubCard
                    key={b.id}
                    brand={b}
                    items={items}
                    bindTap={bindTap}
                    manage={manage}
                    checked={checked.has(b.id)}
                    onCheck={() => toggleCheck(b.id)}
                    onClaim={() => { claimCoupon(`${b.name}复购礼金`, 5, '会员专享'); showToast('礼金已领取'); }}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* ============ 穿搭收藏 ============ */}
        {tab === 'outfit' && (
          outfitCards.length === 0 ? (
            <EmptyState text="还没有收藏的穿搭" hint="逛逛穿搭推荐,收藏喜欢的搭配" />
          ) : (
            <div className="px-1 pt-2">
              <div className="text-center text-[13px] text-[#888888] py-2">- 穿搭推荐 -</div>
              <div className="columns-2 gap-2 px-1">
                {outfitCards.map((it, i) => (
                  <div key={it.id} className="mb-2 w-full bg-white rounded-lg overflow-hidden break-inside-avoid relative">
                    {manage && (
                      <button
                        {...bindTap({ kind: 'action', id: 'favorites.select.toggle' }, { params: { id: it.id }, onTrigger: () => toggleCheck(it.id) })}
                        className="absolute left-1.5 top-1.5 z-10 w-5 h-5 rounded-full border flex items-center justify-center text-[11px]"
                        style={checked.has(it.id) ? { background: VIP.primary, borderColor: VIP.primary, color: '#fff' } : { borderColor: '#CCC', background: '#fff' }}
                        aria-label="选择穿搭"
                      >
                        {checked.has(it.id) ? '✓' : ''}
                      </button>
                    )}
                    <button {...bindTap('favorites.buy-open', { params: { id: it.id } })} className="w-full bg-transparent border-none cursor-pointer block text-left p-0">
                      <Img src={it.image} className="w-full object-cover" style={{ height: 120 + (i % 4) * 30 }} />
                      <div className="p-2 text-[12px] text-[#333333] leading-snug">{OUTFIT_CAPTIONS[i % OUTFIT_CAPTIONS.length]}</div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
        <div className="h-16" />
      </div>

      {/* 管理态底部栏:三个 tab 都有(此前只在商品 tab 出现,品牌/穿搭点了管理没有任何可删的东西) */}
      {manage && (
        <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 h-14 gap-3">
          <button
            {...bindTap({ kind: 'action', id: 'favorites.selectAll.toggle' }, { onTrigger: toggleAll })}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer text-[13px] text-[#333]"
          >
            <span className="w-5 h-5 rounded-full border flex items-center justify-center" style={allChecked ? { background: VIP.primary, borderColor: VIP.primary, color: '#fff' } : { borderColor: '#CCC' }}>{allChecked ? '✓' : ''}</span>
            全选
          </button>
          <span className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'favorites.delete.submit' }, { onTrigger: deleteChecked })}
            className="text-[14px] rounded-full px-6 py-1.5 border-none cursor-pointer text-white font-semibold"
            style={{ background: VIP.ctaBlack }}
          >
            {deleteLabel}{checked.size > 0 ? `(${checked.size})` : ''}
          </button>
        </div>
      )}
      {toast}
    </div>
  );
}

/** 品牌订阅卡:礼金 + 立即使用/入会领取 + 2 个商品。整个标题行点进该品牌专场。 */
function BrandSubCard({ brand, items, bindTap, manage, checked, onCheck, onClaim }: {
  brand: VipBrand; items: VipItem[];
  bindTap: ReturnType<typeof useVipshopGestures>['bindTap'];
  manage: boolean;
  checked: boolean;
  onCheck: () => void;
  onClaim: () => void;
}) {
  const products = brand.itemIds.map((id) => items.find((it) => it.id === id)).filter(Boolean).slice(0, 2) as VipItem[];
  return (
    <div className="bg-white mt-2 px-3 py-3">
      <div className="flex items-center gap-2">
        {manage && (
          <button
            {...bindTap({ kind: 'action', id: 'favorites.select.toggle' }, { params: { id: brand.id }, onTrigger: onCheck })}
            className="w-5 h-5 rounded-full border shrink-0 flex items-center justify-center text-[11px]"
            style={checked ? { background: VIP.primary, borderColor: VIP.primary, color: '#fff' } : { borderColor: '#CCC', background: '#fff' }}
            aria-label="选择品牌"
          >
            {checked ? '✓' : ''}
          </button>
        )}
        <button
          {...bindTap('favorites.brand-open', { params: { id: brand.id } })}
          className="flex items-center gap-2 flex-1 min-w-0 bg-transparent border-none cursor-pointer p-0 text-left"
        >
          <Img src={brand.logo} className="w-8 h-8 rounded object-cover" />
          <span className="text-[15px] font-bold text-[#222222]">{brand.name}</span>
          <span className="text-[9px] rounded px-1 py-0.5" style={{ color: VIP.primary, background: '#FDECF5' }}>有优惠</span>
          <span className="flex-1" />
          <IcArrowRight size={14} className="text-[#BBBBBB]" />
        </button>
      </div>
      <div className="text-[13px] text-[#444444] mt-1">精选超值好物,强势来袭!</div>
      <div className="flex gap-2 mt-2">
        {/* 礼金块 */}
        <div className="w-20 shrink-0 rounded-lg flex flex-col items-center justify-center py-2" style={{ background: 'linear-gradient(180deg,#FDE7F1,#FBD3E6)' }}>
          <span className="text-[11px]" style={{ color: VIP.primary }}>复购礼金</span>
          <span className="text-[18px] font-bold" style={{ color: VIP.primary }}>¥{5 + (brand.name.length % 15)}</span>
          <button
            {...bindTap(
              { kind: 'action', id: 'favorites.brandCoupon.claim' },
              { params: { brandId: brand.id }, onTrigger: onClaim },
            )}
            className="text-[10px] text-white rounded-full px-2 py-0.5 mt-1 border-none cursor-pointer"
            style={{ background: VIP.primary }}
          >
            立即领取
          </button>
        </div>
        {products.map((p) => (
          <button key={p.id} {...bindTap('favorites.buy-open', { params: { id: p.id } })} className="flex-1 min-w-0 bg-transparent border-none cursor-pointer p-0 text-left">
            <Img src={p.image} className="w-full aspect-square rounded object-cover" />
            <div className="mt-0.5"><Price value={p.price} size="s" /></div>
            <div className="text-[10px] text-[#888888] truncate">近7天最低价</div>
          </button>
        ))}
      </div>
    </div>
  );
}
