import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, BottomSheet, Stepper, usePanel, useToast, ShopBadge } from '../components/ui';
import { IcTabCart, IcShare, IcShop, IcService, IcHeart } from '../res/icons';
import { formatMoney, fmt } from '../utils/format';
import { sharePlainText } from '@/os/shareBridge';
import type { TaobaoStringKey } from '../res/strings';

export default function ItemDetailPage() {
  const { itemId = '' } = useParams();
  const { bindTap, back, go } = useTaobaoGestures();
  const { value: panel, open: openPanel, searchParams } = usePanel();
  const skuMode = searchParams.get('mode') === 'buy' ? 'buy' : 'cart';
  const s = useStrings();

  const item = useTaobaoStore((s) => s.items.find((i) => i.id === itemId));
  const shop = useTaobaoStore((s) => s.shops.find((x) => x.id === item?.shopId));
  const allReviews = useTaobaoStore((s) => s.reviews);
  const reviews = useMemo(() => allReviews.filter((r) => r.itemId === itemId), [allReviews, itemId]);
  const favorites = useTaobaoStore((s) => s.favorites);
  const cartCount = useTaobaoStore((s) => s.cart.length);
  const chats = useTaobaoStore((s) => s.chats);
  const toggleFavorite = useTaobaoStore((s) => s.toggleFavorite);
  const ensureShopChat = useTaobaoStore((s) => s.ensureShopChat);
  const recordFootprint = useTaobaoStore((s) => s.recordFootprint);
  const addToCart = useTaobaoStore((s) => s.addToCart);
  const beginCheckout = useTaobaoStore((s) => s.beginCheckout);

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [reviewTag, setReviewTag] = useState(s.reviewTagAll);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (itemId) recordFootprint(itemId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  if (!item || !shop) {
    return (
      <div className="flex flex-col h-full bg-app-surface">
        <TopBar title={s.itemDetailTitle} />
        <div className="flex-1 flex items-center justify-center text-app-text-muted">{s.itemNotFound}</div>
      </div>
    );
  }

  const isFav = favorites.includes(item.id);
  const skuDesc = item.specs
    .map((s) => `${s.name}:${selected[s.name] ?? s.options[0]}`)
    .join(';');
  const shopChat = chats.find((c) => c.shopId === shop.id);

  const confirmSku = () => {
    if (skuMode === 'cart') {
      addToCart(item.id, skuDesc, qty);
      back();
      showToast(s.addedToCartToast);
    } else {
      beginCheckout({
        lines: [{ itemId: item.id, title: item.title, image: item.image, skuDesc, price: item.price, qty }],
        shopId: item.shopId,
        source: 'buyNow',
      });
      go('sku.buyNow.confirm');
    }
  };

  const reviewTags = [s.reviewTagAll, s.reviewTagBuyerShow, s.reviewTagMedia, s.reviewTagFollowUp, ...item.reviewAiTags];
  const shownReviews = reviewTag === s.reviewTagAll ? reviews
    : reviewTag === s.reviewTagMedia || reviewTag === s.reviewTagBuyerShow ? reviews.filter((r) => r.images.length > 0)
    : reviews;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar
        title={<span className="text-[14px] text-app-text-muted">{s.itemDetailHeaderTabs}</span>}
        rightContent={
          <div className="flex items-center">
            <button
              {...bindTap({ kind: 'action', id: 'detail.share.wechat' }, {
                onTrigger: () => {
                  const launched = sharePlainText(
                    `【淘宝】${item.title} ¥${item.price}`,
                    { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } },
                  );
                  if (!launched) showToast(s.cartShareDemoToast);
                },
              })}
              aria-label={s.moreShare}
              className="bg-transparent border-none cursor-pointer w-8 h-10 flex items-center justify-center"
            >
              <IcShare size={18} className="text-app-text" />
            </button>
            <button {...bindTap('detail.cart-open')} className="relative bg-transparent border-none cursor-pointer w-8 h-10 flex items-center justify-center">
              <IcTabCart size={20} className="text-app-text" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-[#FF0036] text-white text-[10px] leading-4 text-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="item-detail" data-scroll-direction="vertical">
        {/* 主图轮播(迭代#3:gallery 多图,左右滑动) */}
        <div className="relative">
          <div
            className="flex overflow-x-auto snap-x snap-mandatory"
            data-scroll-container="detail-gallery"
            data-scroll-direction="horizontal"
            onScroll={(e) => {
              const el = e.currentTarget;
              setGalleryIdx(Math.round(el.scrollLeft / el.clientWidth));
            }}
          >
            {(item.gallery && item.gallery.length > 0 ? item.gallery : [item.image]).map((g) => (
              <Img key={g} src={g} className="w-full aspect-square object-cover bg-app-surface shrink-0 snap-center" alt={item.title} />
            ))}
          </div>
          {(item.gallery?.length ?? 1) > 1 && (
            <span className="absolute right-2 bottom-2 text-[11px] text-white bg-black/45 rounded-full px-2 py-0.5">
              {galleryIdx + 1}/{item.gallery!.length}
            </span>
          )}
        </div>

        {/* 价格区 */}
        <div className="bg-app-surface px-3 py-2.5">
          <div className="flex items-baseline gap-2">
            <Price value={item.price} size="l" />
            <span className="text-[12px] text-app-text-muted line-through">¥{formatMoney(item.originPrice)}</span>
            <span className="text-[10px] text-white bg-[#FF0036] rounded px-1 italic font-bold">618</span>
            <span className="flex-1" />
            <span className="text-[11px] text-app-text-muted">{item.sold}</span>
          </div>
          <div className="text-[15px] font-semibold leading-snug mt-1.5">{item.title}</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.tags.map((t) => (
              <span key={t} className="text-[10px] text-[#FF5000] bg-[#FFF1E8] rounded px-1 py-0.5">{t}</span>
            ))}
          </div>
        </div>

        {/* 保障条 */}
        <div className="bg-app-surface mt-2 px-3 py-2 text-[12px] text-app-text-muted flex gap-3">
          <span>{s.itemDetailGuarantee48h}</span><span>·</span><span>{s.itemDetailGuaranteeReturn}</span><span>·</span><span>{s.itemDetailGuaranteeFake}</span><span>·</span><span>{s.itemDetailGuaranteeNoReason}</span>
        </div>

        {/* 评价入口 */}
        <div
          {...bindTap({ kind: 'action', id: 'detail.reviews.open' }, { onTrigger: () => openPanel('reviews') })}
          className="bg-app-surface mt-2 px-3 py-2.5 cursor-pointer"
        >
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold">{fmt(s.itemDetailReviewCountFmt, { count: item.reviewCount > 999 ? '2000+' : item.reviewCount })}</span>
            <span className="text-[12px] text-app-text-muted">{s.itemDetailPositiveRate}</span>
          </div>
          <div className="flex gap-1.5 mt-1.5 overflow-hidden">
            {item.reviewAiTags.map((t) => (
              <span key={t} className="text-[11px] text-[#C2410C] bg-[#FFF7EC] rounded px-1.5 py-0.5 shrink-0">{t}</span>
            ))}
          </div>
        </div>

        {/* 店铺卡 */}
        <div className="bg-app-surface mt-2 px-3 py-3 flex items-center gap-2.5">
          <Img src={shop.logo} className="w-11 h-11 rounded-lg" />
          <div className="flex-1">
            <div className="flex items-center text-[14px] font-semibold"><ShopBadge badge={shop.badge} />{shop.name}</div>
            <div className="text-[11px] text-app-text-muted mt-0.5">{fmt(s.itemDetailShopStatsFmt, { rating: shop.rating, fans: shop.fans, certified: shop.certifiedText })}</div>
          </div>
          <button
            {...bindTap('detail.shop-open', { params: { shopId: shop.id } })}
            className="text-[#FF5000] border border-[#FF5000] bg-app-surface text-[12px] rounded-full px-3 py-1 cursor-pointer"
          >
            {s.itemDetailEnterShop}
          </button>
        </div>

        {/* 详情图 */}
        <div className="mt-2 bg-app-surface">
          <div className="text-center text-[12px] text-app-text-muted py-2">{s.itemDetailDividerText}</div>
          {item.detailImages.map((img) => (
            <Img key={img} src={img} className="w-full object-cover" />
          ))}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-app-surface border-t border-app-border flex items-center px-2 py-1.5 gap-1">
        <button
          {...bindTap('detail.shop-open', { params: { shopId: shop.id } })}
          className="w-12 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer text-app-text-muted"
        >
          <IcShop size={18} /><span className="text-[10px]">{s.itemDetailTabShop}</span>
        </button>
        <button
          {...bindTap('detail.chat-open', {
            params: { chatId: shopChat ? shopChat.id : `ch_${shop.id}` },
            beforeTrigger: () => ensureShopChat(shop.id),
          })}
          className="w-12 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer text-app-text-muted"
        >
          <IcService size={18} /><span className="text-[10px]">{s.itemDetailTabService}</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.favorite.toggle' }, {
            onTrigger: () => { toggleFavorite(item.id); showToast(isFav ? s.unfavoritedToast : s.favoritedToast); },
          })}
          className="w-12 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
        >
          <IcHeart size={18} className={isFav ? 'text-[#FF0036] fill-[#FF0036]' : 'text-app-text-muted'} />
          <span className={`text-[10px] ${isFav ? 'text-[#FF0036]' : 'text-app-text-muted'}`}>{isFav ? s.favoritedLabel : s.favoriteLabel}</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.sku.openForCart' }, {
            onTrigger: () => openPanel('sku', { mode: 'cart' }),
          })}
          className="flex-1 h-10 rounded-l-full bg-gradient-to-r from-[#FFB800] to-[#FF8C00] text-white text-[14px] font-medium border-none cursor-pointer"
        >
          {s.addToCart}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.sku.openForBuy' }, {
            onTrigger: () => openPanel('sku', { mode: 'buy' }),
          })}
          className="flex-1 h-10 rounded-r-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[14px] font-medium border-none cursor-pointer"
        >
          {s.buyNow}
        </button>
      </div>

      {/* SKU 面板 */}
      {panel === 'sku' && (
        <BottomSheet
          onClose={() => back()}
          closeBinding={bindTap({ kind: 'action', id: 'sku.panel.close' }, { onTrigger: () => back() })}
          title=""
        >
          <div className="px-4">
            <div className="flex gap-3">
              <Img src={item.image} className="w-24 h-24 rounded-lg object-cover" />
              <div className="flex-1">
                <Price value={item.price} size="l" />
                {item.limitPerOrder && (
                  <div className="text-[11px] text-app-text-muted mt-1">{fmt(s.skuLimitPerOrderFmt, { count: item.limitPerOrder })}</div>
                )}
                <div className="text-[12px] text-app-text-muted mt-1">{fmt(s.skuSelectedFmt, { skuDesc })}</div>
              </div>
            </div>
            {item.specs.map((spec) => (
              <div key={spec.name} className="mt-4">
                <div className="text-[13px] font-semibold mb-2">{spec.name}({spec.options.length})</div>
                <div className="flex flex-wrap gap-2">
                  {spec.options.map((opt) => {
                    const on = (selected[spec.name] ?? spec.options[0]) === opt;
                    return (
                      <button
                        key={opt}
                        {...bindTap({ kind: 'action', id: 'sku.option.select.value' }, {
                          params: { spec: spec.name, option: opt },
                          onTrigger: () => setSelected((s) => ({ ...s, [spec.name]: opt })),
                        })}
                        className={`text-[12px] rounded-lg px-3 py-2 border cursor-pointer ${
                          on ? 'bg-[#FFF1E8] text-[#FF5000] border-[#FF5000]' : 'bg-app-bg text-app-text border-transparent'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center mt-5">
              <span className="text-[13px] font-semibold">{s.skuQtyLabel}</span>
              <Stepper
                value={qty}
                max={item.limitPerOrder ?? undefined}
                onChange={(d) => setQty((v) => Math.max(1, Math.min(item.limitPerOrder ?? 99, v + d)))}
                binding={bindTap({ kind: 'action', id: 'sku.qty.change' }, { onTrigger: () => {} })}
              />
            </div>
            <button
              {...(skuMode === 'cart'
                ? bindTap({ kind: 'action', id: 'sku.addToCart.confirm' }, { onTrigger: confirmSku })
                : bindTap('sku.buyNow.confirm', { beforeTrigger: () => {
                    beginCheckout({
                      lines: [{ itemId: item.id, title: item.title, image: item.image, skuDesc, price: item.price, qty }],
                      shopId: item.shopId,
                      source: 'buyNow',
                    });
                  } }))}
              className={`w-full h-11 rounded-full text-white text-[15px] font-medium border-none cursor-pointer mt-5 mb-2 ${
                skuMode === 'cart'
                  ? 'bg-gradient-to-r from-[#FFB800] to-[#FF8C00]'
                  : 'bg-gradient-to-r from-[#FF7A00] to-[#FF2000]'
              }`}
            >
              {skuMode === 'cart' ? s.addToCart : s.buyNow}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* 评价弹层 */}
      {panel === 'reviews' && (
        <BottomSheet
          onClose={() => back()}
          closeBinding={bindTap({ kind: 'action', id: 'reviews.panel.close' }, { onTrigger: () => back() })}
          title={s.reviewsPanelTitle}
        >
          <div className="px-4">
            <div className="flex gap-2 flex-wrap">
              {reviewTags.map((t) => (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'reviews.filter.select.tag' }, {
                    params: { tag: t },
                    onTrigger: () => setReviewTag(t),
                  })}
                  className={`text-[12px] rounded-full px-3 py-1.5 border-none cursor-pointer ${
                    reviewTag === t ? 'bg-[#FFF1E8] text-[#FF5000] font-semibold' : 'bg-[#F5F5F5] text-app-text'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* AI 总结 */}
            <div className="bg-[#FFF9F2] rounded-xl p-3 mt-3">
              <div className="text-[13px] font-semibold">{s.reviewAiSummaryTitle}</div>
              <div className="text-[12px] text-app-text-muted mt-1 leading-relaxed">
                {fmt(s.reviewAiSummaryBodyFmt, { count: item.reviewCount })}
                {item.reviewAiTags.join("、")}{s.reviewAiSummaryTagsSuffix}
              </div>
            </div>
            {/* 列表 */}
            {shownReviews.map((r) => (
              <div key={r.id} className="py-3 border-b border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  <Img src={r.userAvatar} className="w-7 h-7 rounded-full" />
                  <span className="text-[13px] font-medium">{r.userNick}</span>
                  {r.vipTag && <span className="text-[9px] text-[#7E5A1E] bg-[#F4E3C1] rounded px-1">{r.vipTag}</span>}
                </div>
                <div className="text-[11px] text-app-text-muted mt-1">{r.skuDesc}</div>
                <div className="text-[13px] mt-1 leading-relaxed">{r.content}</div>
                {r.images.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5">
                    {r.images.map((img) => <Img key={img} src={img} className="w-16 h-16 rounded-lg object-cover" />)}
                  </div>
                )}
              </div>
            ))}
            {shownReviews.length === 0 && (
              <div className="text-[13px] text-app-text-muted text-center py-8">{s.reviewsEmptyText}</div>
            )}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
