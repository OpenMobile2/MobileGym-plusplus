import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, ShopBadge, usePanel, useToast } from '../components/ui';
import { IcMore, IcSearch } from '../res/icons';

const SHOP_TABS = [
  { id: 'home', label: '首页' },
  { id: 'items', label: '宝贝' },
  { id: 'posts', label: '晒单' },
  { id: 'member', label: '会员' },
] as const;

const MORE_ITEMS = ['消息', '回到首页', '分享', '我的淘宝', '购物车', '我的足迹', '我的收藏', '官方客服', '意见反馈', '举报', '添加到桌面'];

/** 店铺页(spec: shop.home 四 Tab + morePanel,IMG_8703/8704/8710/8711/8712) */
export default function ShopPage() {
  const { shopId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'home';
  const { value: panel, open: openPanel } = usePanel();
  const { bindTap, back } = useTaobaoGestures();
  const [toast, showToast] = useToast();
  const [shopQuery, setShopQuery] = useState('');

  const shop = useTaobaoStore((s) => s.shops.find((x) => x.id === shopId));
  const allItems = useTaobaoStore((s) => s.items);
  const allReviews = useTaobaoStore((s) => s.reviews);
  const items = useMemo(() => {
    const base = allItems.filter((i) => i.shopId === shopId);
    const kw = shopQuery.trim().toLowerCase();
    return kw ? base.filter((i) => i.title.toLowerCase().includes(kw)) : base;
  }, [allItems, shopId, shopQuery]);
  const reviews = useMemo(
    () => allReviews.filter((r) => items.some((i) => i.id === r.itemId)),
    [allReviews, items],
  );
  const followedShops = useTaobaoStore((s) => s.followedShops);
  const memberShops = useTaobaoStore((s) => s.memberShops);
  const toggleFollowShop = useTaobaoStore((s) => s.toggleFollowShop);
  const joinShopMember = useTaobaoStore((s) => s.joinShopMember);

  if (!shop) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F7]">
        <TopBar title="店铺" />
        <div className="flex-1 flex items-center justify-center text-[#999999]">店铺不存在</div>
      </div>
    );
  }

  const followed = followedShops.includes(shop.id);
  const isMember = memberShops.includes(shop.id);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar
        title={
          <span className="flex items-center justify-center gap-1.5 text-[14px]">
            <Img src={shop.logo} className="w-6 h-6 rounded" />{shop.name}
          </span>
        }
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'shop.more.open' }, { onTrigger: () => openPanel('more') })}
            className="bg-transparent border-none cursor-pointer"
          >
            <IcMore size={20} className="text-[#333333]" />
          </button>
        }
      />

      {/* 店内搜索框 */}
      <div className="bg-white px-3 pb-1.5 shrink-0">
        <div className="flex items-center bg-[#F5F5F5] rounded-full h-8 px-3 gap-1.5">
          <IcSearch size={14} className="text-[#999999]" />
          <input
            value={shopQuery}
            {...bindTap({ kind: 'action', id: 'shop.search.input' }, { onTrigger: () => {} })}
            onChange={(e) => {
              setShopQuery(e.target.value);
              if (e.target.value.trim() && tab !== 'items') {
                setSearchParams((p) => { p.set('tab', 'items'); return p; }, { replace: true });
              }
            }}
            placeholder="搜索店内宝贝"
            className="flex-1 bg-transparent border-none outline-none text-[13px]"
            data-keep-keyboard="true"
          />
        </div>
      </div>

      {/* 店铺头 */}
      <div className="bg-white px-3 py-2.5 shrink-0 flex items-center gap-2.5">
        <Img src={shop.logo} className="w-12 h-12 rounded-xl" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center text-[15px] font-semibold"><ShopBadge badge={shop.badge} />{shop.name}</div>
          <div className="text-[11px] text-[#999999] mt-0.5">
            ★ {shop.rating} · {shop.fans}粉丝 · ✓ {shop.certifiedText}
          </div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'shop.follow.toggle' }, {
            onTrigger: () => toggleFollowShop(shop.id),
          })}
          className={`text-[13px] rounded-full px-3.5 py-1.5 cursor-pointer ${
            followed
              ? 'bg-[#F5F5F5] text-[#999999] border-none'
              : 'bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white border-none'
          }`}
        >
          {followed ? '已关注' : '+ 关注'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="shop-body" data-scroll-direction="vertical">
        {tab === 'home' && (
          <>
            <div className="m-2.5 rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#4A4236] text-[#E8DCC3] p-5">
              <div className="text-[18px] font-bold">年中臻礼</div>
              <div className="text-[12px] opacity-80 mt-1">天猫618狂欢节 · 热门优惠</div>
            </div>
            <div className="mx-2.5 grid grid-cols-2 gap-2">
              {items.slice(0, 4).map((it) => (
                <div
                  key={it.id}
                  {...bindTap('shop.item-open', { params: { itemId: it.id } })}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer"
                >
                  <Img src={it.image} className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <div className="text-[13px] line-clamp-1">{it.title}</div>
                    <Price value={it.price} size="m" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'items' && (
          <div className="mx-2.5 mt-2">
            <div className="flex gap-4 text-[13px] text-[#666666] px-1 mb-2">
              <span className="text-[#FF5000] font-semibold">综合</span><span>销量</span><span>新品</span><span>价格</span>
            </div>
            {items.map((it) => (
              <div
                key={it.id}
                {...bindTap('shop.item-open', { params: { itemId: it.id } })}
                className="bg-white rounded-xl p-2.5 mb-2 flex gap-2.5 cursor-pointer"
              >
                <Img src={it.image} className="w-24 h-24 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] line-clamp-2 leading-snug">{it.title}</div>
                  <div className="flex gap-1 mt-1">
                    {it.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] text-[#FF5000] bg-[#FFF1E8] rounded px-1">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-baseline justify-between mt-1.5">
                    <Price value={it.price} size="m" />
                    <span className="text-[11px] text-[#999999]">{it.sold}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'posts' && (
          <div className="mx-2.5 mt-2">
            <div className="flex gap-3 text-[13px] mb-2 px-1">
              <span className="text-[#FF5000] font-semibold"># 笔记</span>
              <span className="text-[#666666]"># 直播</span>
              <span className="text-[#666666]"># 讲解</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {reviews.filter((r) => r.images.length > 0).concat(reviews.slice(0, 2)).slice(0, 6).map((r, i) => (
                <div key={r.id + i} className="bg-white rounded-xl overflow-hidden">
                  {r.images[0] && <Img src={r.images[0]} className="w-full aspect-square object-cover" />}
                  <div className="p-2">
                    <div className="text-[12px] line-clamp-2">{r.content}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Img src={r.userAvatar} className="w-4 h-4 rounded-full" />
                      <span className="text-[10px] text-[#999999]">{r.userNick}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'member' && (
          <div className="mx-2.5 mt-2">
            <div className="rounded-xl bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] text-white p-5">
              <div className="text-[16px] font-bold">邀请您加入店铺会员</div>
              <div className="text-[12px] opacity-70 mt-1">尊享丰富特权</div>
              <button
                {...bindTap({ kind: 'action', id: 'shop.member.join' }, {
                  onTrigger: () => { joinShopMember(shop.id); showToast('入会成功'); },
                })}
                disabled={isMember}
                className="mt-3 w-full h-10 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] border-none cursor-pointer disabled:opacity-50"
              >
                {isMember ? '已是会员' : '立即加入会员'}
              </button>
            </div>
            <div className="text-[13px] font-semibold mt-3 mb-2 px-1">优先购 · 提前抢购专享优品</div>
            <div className="grid grid-cols-2 gap-2">
              {items.slice(0, 2).map((it) => (
                <div
                  key={it.id}
                  {...bindTap('shop.item-open', { params: { itemId: it.id } })}
                  className="bg-white rounded-xl overflow-hidden cursor-pointer"
                >
                  <Img src={it.image} className="w-full aspect-square object-cover" />
                  <div className="p-2">
                    <div className="text-[12px] line-clamp-1">{it.title}</div>
                    <Price value={it.price} size="s" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="h-3" />
      </div>

      {/* 店铺底部 Tab */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex">
        {SHOP_TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'shop.tab.select.target' }, {
              params: { tab: t.id },
              onTrigger: () => setSearchParams((p) => {
                if (t.id === 'home') p.delete('tab');
                else p.set('tab', t.id);
                return p;
              }, { replace: true }),
            })}
            className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${
              tab === t.id ? 'text-[#FF5000] font-semibold' : 'text-[#666666]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 更多面板 */}
      {panel === 'more' && (
        <div className="absolute inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => back()} />
          <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl p-4">
            <div className="grid grid-cols-5 gap-y-4">
              {MORE_ITEMS.map((m) => (
                <button
                  key={m}
                  onClick={() => showToast(`${m}(演示入口)`)}
                  className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
                >
                  <span className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[15px]">{m[0]}</span>
                  <span className="text-[10px] text-[#666666]">{m}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => back()}
              className="w-full h-11 rounded-full bg-[#F5F5F5] text-[14px] border-none cursor-pointer mt-4"
            >
              取消
            </button>
            <div className="h-2" />
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}
