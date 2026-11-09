import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcClose, IcShare, IcMore, IcStar, IcChevronRight, IcMinus, IcPlus,
  IcService, IcCart, IcStore, IcCheck, IcPlay, IcMapPin, IcTicket,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import type { Product, SkuGroup } from '../types';
import {
  defaultSelection, selectionText, selectionId, selectionPrice, productOf, shopOf,
  attrRows, fansText, type SkuSelection,
} from '../utils/detail';
import { promoLabel, searchHint, soldText, isSelfShop } from '../utils/search';
import { sharePlainText } from '@/os/shareBridge';

/** SKU 弹层的进入语境(spec:马上抢入口→结算;已选/保障入口→仅保存规格关闭) */
type SkuEntry = 'spec' | 'warranty' | 'add' | 'buy';

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * 商品详情页(spec product.detail):5 模板共用框架 + 3 种价格样式,
 * ?sheet=sku(SKU 弹层)/?sheet=cartSuccess(加购成功)/?dialog=subsidyClaim(国补领取)。
 */
export default function ProductDetailPage() {
  const { bindTap, action, bindBack, back, go } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId') ?? '';
  const sheet = searchParams.get('sheet') ?? '';
  const dialogOpen = searchParams.get('dialog') === 'subsidyClaim';
  const product = productOf(productId);

  const showToast = useSuningStore((s) => s.showToast);
  const recordHistory = useSuningStore((s) => s.recordHistory);
  const followedProducts = useSuningStore((s) => s.followedProducts);
  const toggleFollowProduct = useSuningStore((s) => s.toggleFollowProduct);
  const subsidyClaimedIds = useSuningStore((s) => s.subsidyClaimedIds);
  const claimProductSubsidy = useSuningStore((s) => s.claimProductSubsidy);
  const cartItems = useSuningStore((s) => s.cartItems);
  const addresses = useSuningStore((s) => s.addresses);
  const setTemp = useSuningStore((s) => s.setTemp);
  const wontfix = () => showToast(S.toastNotOpen);

  const [sel, setSel] = useState<SkuSelection>(() => (product ? defaultSelection(product) : {}));
  const [qty, setQty] = useState(1);
  const [warrantyId, setWarrantyId] = useState<string | null>(null);
  const [installment, setInstallment] = useState<number | null>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [galleryMode, setGalleryMode] = useState('image');
  const [recoIdx, setRecoIdx] = useState(0);
  const [skuEntry, setSkuEntry] = useState<SkuEntry>('spec');
  const [stickyOn, setStickyOn] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const reviewsRef = useRef<HTMLDivElement | null>(null);
  const detailRef = useRef<HTMLDivElement | null>(null);
  /** 主图轮播横滑起点(PointerEvent 合同) */
  const swipeStartX = useRef<number | null>(null);

  // 换商品(推荐位/猜你还需要 自跳转)时重置规格上下文;进商详记足迹(幂等,StrictMode 安全)
  useEffect(() => {
    const p = productOf(productId);
    setSel(p ? defaultSelection(p) : {});
    setQty(1);
    setWarrantyId(null);
    setInstallment(null);
    setGalleryIdx(0);
    setGalleryMode('image');
    if (productId) recordHistory(productId);
  }, [productId, recordHistory]);

  // 外部商品卡「+」快捷加购跳入时携带 skuEntryHint='add':落商详底页后再 push 一层 SKU 弹层,
  // 使弹层「×」先回到商详、再返回才回上一页(走查 0814 反馈②);ref 守卫防 StrictMode 双推。
  const skuHintRef = useRef(false);
  useEffect(() => {
    if (skuHintRef.current) return;
    skuHintRef.current = true;
    const hint = useSuningStore.getState()._temp.skuEntryHint;
    if (hint) {
      setSkuEntry(hint);
      setTemp({ skuEntryHint: null });
      if (sheet !== 'sku') go('product.detail.skuAdd.open');
    }
  }, [sheet, go, setTemp]);

  if (!product) {
    return (
      <div className="flex h-full flex-col bg-[var(--app-surface)] pt-10">
        <button {...bindBack()} className="w-10 cursor-pointer border-none bg-transparent p-2 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="py-16 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.emptyNoData}</div>
      </div>
    );
  }

  const tpl = product.detailTemplate;
  const isFan = tpl === 'fan';
  const isTablet = tpl === 'tablet';
  const isFresh = tpl === 'fresh';
  const isCola = tpl === 'cola';
  const isPlain = tpl === 'list';
  /** 价格样式:政府补贴(家电/3C)/百亿补贴(生鲜/快消)/普通(列表级) */
  const govStyle = isFan || isTablet;
  const baibuStyle = isFresh || isCola;
  const shop = shopOf(product.shopId);
  const claimed = subsidyClaimedIds.includes(product.id);
  const isFollowed = followedProducts.some((f) => f.productId === product.id);
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);
  const address = addresses.find((a) => a.isDefault) ?? addresses[0];
  const addrText = address ? `${address.province}${address.city}${address.district}${address.street}` : '';
  const { price, priceOriginal } = selectionPrice(product, sel);
  const skuText = selectionText(product, sel) || S.inStock;
  const reviews = SUNING_CONFIG.reviews[product.id];
  const firstReview = reviews?.items[0];
  const galleryTabs = isTablet ? [S.galleryVideo, S.galleryImage, S.reviewsLabel] : isCola ? [S.galleryImage, S.reviewsLabel] : [];
  const recoTabs = [S.shopReco, S.hotRank, S.pickGoods];
  const recoPool = SUNING_CONFIG.products.filter((p) => p.id !== product.id);
  const recoList = [
    recoPool.filter((p) => p.shopId === product.shopId),
    [...recoPool].sort((a, b) => b.rankFields.sales - a.rankFields.sales),
    [...recoPool].sort((a, b) => a.rankFields.discount - b.rankFields.discount),
  ][recoIdx].slice(0, 6);
  const mainBtnText = isFan ? S.grabNow : baibuStyle ? S.couponBuy : S.buyNow;
  const shopBarText = isCola ? S.suningMarket : S.shopPage;

  const onSwipeEnd = (x: number) => {
    const from = swipeStartX.current;
    swipeStartX.current = null;
    if (from === null || Math.abs(x - from) < 30) return;
    const n = product.gallery.length;
    setGalleryIdx((i) => (x < from ? Math.min(i + 1, n - 1) : Math.max(i - 1, 0)));
  };

  const scrollTo = (el: HTMLDivElement | null) => el?.scrollIntoView({ block: 'start', behavior: 'smooth' });

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 / 搜索胶囊 / 分享 / 更多(下滚后出现吸顶 Tab) */}
      <div className={`z-20 flex items-center gap-1 px-2 pb-1 pt-10 ${stickyOn ? 'bg-[var(--app-surface)]' : 'bg-gradient-to-b from-white/80 to-transparent'}`}>
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        {stickyOn ? (
          <div className="flex min-w-0 flex-1 items-center justify-center gap-4">
            <button
              {...action('product.detail.stickyTab.scrollTop', () => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' }))}
              className="cursor-pointer border-none bg-transparent text-[14px] font-bold text-[var(--app-primary)]"
            >
              {S.tabProduct}
            </button>
            <button
              {...bindTap('product.detail.reviews.open', { params: { productId: product.id } })}
              className="cursor-pointer border-none bg-transparent text-[14px] text-[var(--app-text)]"
            >
              {S.tabReview}
            </button>
            <button
              {...action('product.detail.anchor.detailSection', () => scrollTo(detailRef.current))}
              className="cursor-pointer border-none bg-transparent text-[14px] text-[var(--app-text)]"
            >
              {S.tabDetail}
            </button>
            {/* 精选:范围外,toast(spec priority=wontfix) */}
            <button
              {...action('product.detail.wontfix.toast', wontfix)}
              className="cursor-pointer border-none bg-transparent text-[14px] text-[var(--app-text)]"
            >
              {S.tabPicked}
            </button>
          </div>
        ) : (
          <div className="min-w-0 flex-1" />
        )}
        <button
          {...action('product.detail.share.open', () => {
            const text = `${product?.title ?? '苏宁商品'} ¥${product?.price ?? ''} https://suning.mock/item/${product?.id ?? ''}`;
            const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
            if (!launched) showToast(S.toastNotOpen);
          })}
          className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcShare size={20} />
        </button>
        <button {...action('product.detail.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcMore size={20} />
        </button>
      </div>

      <div
        ref={scrollRef}
        onScroll={(e) => setStickyOn(e.currentTarget.scrollTop > 120)}
        className="-mt-11 min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-11"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 主图轮播 + 页码 + 直播浮窗/弹幕装饰 */}
        <div
          data-action="product.detail.gallery.swipe"
          data-action-type="swipe"
          onPointerDown={(e) => {
            swipeStartX.current = e.clientX;
          }}
          onPointerUp={(e) => onSwipeEnd(e.clientX)}
          onPointerCancel={() => {
            swipeStartX.current = null;
          }}
          className="relative aspect-square w-full touch-pan-y bg-[var(--app-surface)]"
        >
          <Img src={product.gallery[galleryIdx] ?? product.image} className="h-full w-full object-contain" />
          <span className="absolute bottom-3 right-3 rounded-full bg-black/40 px-2 py-0.5 text-[11px] text-white">
            {galleryIdx + 1}/{product.gallery.length}
          </span>
          {/* 直播浮窗(可点仅 toast)+ 弹幕气泡(纯装饰) */}
          <button
            {...action('product.detail.wontfix.toast', wontfix)}
            className="absolute right-3 top-3 flex cursor-pointer flex-col items-center rounded-xl border-none bg-black/55 px-2 py-1.5 text-white"
          >
            <IcPlay size={16} />
            <span className="text-[9px] leading-3">{S.liveNow}</span>
            <span className="mt-0.5 rounded-full bg-[var(--app-c-danger)] px-1 text-[8px] leading-3">{S.grabRedPacket}</span>
          </button>
          <div className="absolute bottom-3 left-3 flex flex-col gap-1">
            <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] text-white">{S.danmuBuy}</span>
            <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] text-white">{S.danmuOnWay}</span>
          </div>
          {galleryTabs.length > 0 && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-2 pb-1">
              {galleryTabs.map((t) => (
                <button
                  key={t}
                  {...action('product.detail.gallery.tabSwitch', () => setGalleryMode(t), { params: { value: t } })}
                  className={`cursor-pointer rounded-full border-none px-3 py-0.5 text-[11px] ${
                    galleryMode === t ? 'bg-[#262626] text-white' : 'bg-white/80 text-[var(--app-text-muted)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 价格区:政府补贴 / 百亿补贴 / 普通 */}
        {govStyle && (
          <div className="bg-[var(--app-surface)] px-3 pb-2 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[12px] text-[var(--app-c-danger)]">{S.netPrice}</span>
              <span className="text-[26px] font-bold leading-none text-[var(--app-c-danger)]">
                <span className="text-[14px]">¥</span>
                {price}
              </span>
              <span className="text-[12px] text-[var(--app-c-text-muted)] line-through">
                {S.beforeDiscount}¥{priceOriginal}
              </span>
            </div>
            {claimed ? (
              <div className="mt-2 flex items-center gap-1 rounded-lg bg-gradient-to-r from-[#EAF1FD] to-[#F6F9FF] px-3 py-2 text-[13px] font-bold text-[#2B6BD4]">
                <IcCheck size={14} />
                {S.claimedTag}
              </div>
            ) : (
              <div
                {...bindTap('product.detail.subsidyClaim.open')}
                className="mt-2 flex cursor-pointer items-center justify-between rounded-lg bg-gradient-to-r from-[#DCE9FC] to-[#F3F7FE] px-3 py-2"
              >
                <span className="text-[13px] font-bold italic text-[#2B6BD4]">{S.govSubsidyTab}</span>
                <span className="flex items-center gap-0.5 rounded-full bg-[#2B6BD4] px-2.5 py-0.5 text-[12px] font-bold text-white">
                  {S.claimNow}
                  <IcChevronRight size={12} />
                </span>
              </div>
            )}
            {isTablet && (
              <div className="mt-1 text-[11px] text-[#2B6BD4]">{S.subsidyMinus15}</div>
            )}
          </div>
        )}
        {baibuStyle && (
          <div className="bg-gradient-to-r from-[#F13A21] to-[#FF7A45] px-3 pb-2 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="rounded-sm bg-[var(--app-surface)] px-1 text-[11px] font-bold italic leading-4 text-[var(--app-c-danger)]">
                {promoLabel(product)}
              </span>
              <span className="text-[26px] font-bold leading-none text-white">
                <span className="text-[14px]">¥</span>
                {price}
              </span>
              <span className="text-[12px] text-white/70 line-through">
                {S.beforeDiscount}¥{priceOriginal}
              </span>
              <span className="ml-auto text-[11px] text-white/90">{soldText(product)}</span>
            </div>
          </div>
        )}
        {isPlain && (
          <div className="bg-[var(--app-surface)] px-3 pb-2 pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-[26px] font-bold leading-none text-[var(--app-c-danger)]">
                <span className="text-[14px]">¥</span>
                {price}
              </span>
              <span className="text-[12px] text-[var(--app-c-text-muted)] line-through">¥{priceOriginal}</span>
              <span className="ml-auto text-[11px] text-[var(--app-c-text-muted)]">{soldText(product)}</span>
            </div>
          </div>
        )}

        {/* 已享 / 可享 优惠行(范围外,toast) */}
        {!isPlain && (
          <div className="mt-1 bg-[var(--app-surface)] px-3 py-2">
            <button
              {...action('product.detail.wontfix.toast', wontfix)}
              className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
            >
              <span className="shrink-0 rounded-sm bg-[#FDECE9] px-1 text-[11px] leading-4 text-[var(--app-c-danger)]">{S.enjoyed}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text-muted)]">
                {govStyle ? `${S.benefitSubsidy}¥${round2(priceOriginal - price)}` : S.benefitCoupon} · {S.benefitCloud}
              </span>
              <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </button>
            <button
              {...action('product.detail.wontfix.toast', wontfix)}
              className="mt-1.5 flex w-full cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
            >
              <span className="shrink-0 rounded-sm bg-[#FFF3E8] px-1 text-[11px] leading-4 text-[var(--app-primary)]">{S.enjoyable}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text-muted)]">
                {S.benefitInstallment} · {S.benefitRenxing}
              </span>
              <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </button>
          </div>
        )}

        {/* 标题区:自营标 + 标题 + 卖点 + 关注星标 */}
        <div className="mt-1 flex items-start gap-2 bg-[var(--app-surface)] px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold leading-6 text-[var(--app-text)]">
              {isSelfShop(product.shopId) && (
                <span className="mr-1 inline-block translate-y-[-2px] rounded-sm bg-[var(--app-primary)] px-0.5 text-[10px] font-bold leading-4 text-white">
                  {isFresh || isCola ? S.superMarketSelf : S.selfTag}
                </span>
              )}
              {product.title}
            </div>
            <div className="mt-1 text-[12px] text-[#B0651F]">{searchHint(product)}</div>
          </div>
          <button
            {...action('product.detail.follow.toggle', () => toggleFollowProduct(product.id))}
            className="flex w-11 shrink-0 cursor-pointer flex-col items-center border-none bg-transparent pt-1"
          >
            <IcStar size={20} className={isFollowed ? 'fill-[#FD7101] text-[var(--app-primary)]' : 'text-[#888]'} />
            <span className={`text-[10px] leading-4 ${isFollowed ? 'text-[var(--app-primary)]' : 'text-[#888]'}`}>
              {isFollowed ? S.followed : S.follow}
            </span>
          </button>
        </div>

        {/* 榜单角标条(家电) → rank.detail */}
        {isFan && (
          <button
            {...bindTap('product.detail.rank.open', { params: { rankId: 'acHot' } })}
            className="mt-1 flex w-full cursor-pointer items-center gap-1 border-none bg-gradient-to-r from-[#FDF3E3] to-white px-3 py-2 text-left"
          >
            <span className="rounded-full bg-[#3B2A1A] px-1.5 text-[10px] font-bold leading-4 text-[#F8D9A8]">TOP</span>
            <span className="text-[12px] font-bold text-[#B0651F]">
              {S.tabPicked}
              {product.attrs['type']}
              {S.rankBadgeSuffix}
            </span>
            <IcChevronRight size={14} className="ml-auto text-[#C9A063]" />
          </button>
        )}

        {/* 已选规格 / 参数 / 送至 / 活动 */}
        <div className="mt-1 bg-[var(--app-surface)] px-3">
          <div {...bindTap('product.detail.sku.open', { beforeTrigger: () => setSkuEntry('spec') })} className="flex cursor-pointer items-center gap-2 py-2.5">
            <span className="w-10 shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{S.selectedLabel}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">
              {skuText} · {qty}
              {S.unitItem}
            </span>
            <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </div>
          {!isPlain && (
            <div className="flex items-center gap-2 border-t border-[var(--app-border)] py-2.5">
              <span className="w-10 shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{S.paramsLabel}</span>
              <button
                {...action('product.detail.wontfix.toast', wontfix)}
                className="min-w-0 flex-1 cursor-pointer truncate border-none bg-transparent p-0 text-left text-[13px] text-[var(--app-text)]"
              >
                {S.brandLabel} {product.brand} · {S.modelLabel} {product.id.toUpperCase()}
              </button>
              {/* 3C 参数区「对比」→ PK 对比结果页(种子对比组为电脑品类,仅同类可比) */}
              {isTablet && (
                <button
                  {...bindTap('product.detail.compare.open')}
                  className="shrink-0 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-0.5 text-[11px] text-[var(--app-text-muted)]"
                >
                  {S.compare}
                </button>
              )}
              <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </div>
          )}
          {/* 送至行:进地址簿选择模式,选中项成为默认地址,本行文案随之联动 */}
          <button
            {...bindTap('product.detail.address.pick', {
              params: { mode: 'picker' },
              beforeTrigger: () => setTemp({ addressPickTarget: 'default' }),
            })}
            className="flex w-full cursor-pointer items-center gap-2 border-none border-t border-[var(--app-border)] bg-transparent py-2.5 text-left"
          >
            <span className="w-10 shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{S.shipTo}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">
              {addrText} · {isFresh ? S.ship48 : isCola ? S.return7 : S.inStock}
            </span>
            <IcMapPin size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
          {isFan && (
            <button
              {...action('product.detail.wontfix.toast', wontfix)}
              className="flex w-full cursor-pointer items-center gap-2 border-none border-t border-[var(--app-border)] bg-transparent py-2.5 text-left"
            >
              <span className="w-10 shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{S.activityLabel}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-c-danger)]">{S.benefitCoupon}</span>
              <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </button>
          )}
          {isFresh && (
            <div className="border-t border-[var(--app-border)] py-2.5 text-[12px] text-[var(--app-c-text-muted)]">{S.freshShipNote}</div>
          )}
        </div>

        {/* 旧机换新卡(3C) */}
        {isTablet && product.tradeInPrice != null && (
          <div className="mt-1 flex items-center gap-2 bg-[var(--app-surface)] px-3 py-2.5">
            <span className="rounded-sm bg-[#EAF1FD] px-1.5 text-[11px] leading-5 text-[#2B6BD4]">{S.tradeIn}</span>
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">
              {S.tradeInEst} ¥{product.tradeInPrice}
            </span>
            <button
              {...action('product.detail.wontfix.toast', wontfix)}
              className="shrink-0 cursor-pointer rounded-full border-none bg-[#2B6BD4] px-3 py-1 text-[12px] font-bold text-white"
            >
              {S.tradeInNow}
            </button>
          </div>
        )}

        {/* 省心购 / 保障服务(家电·3C)*/}
        {(isFan || isTablet) && (
          <div className="mt-1 bg-[var(--app-surface)] px-3">
            <div className="flex items-center gap-2 py-2.5">
              <span className="shrink-0 rounded-sm border border-[var(--app-primary)] px-1 text-[11px] leading-4 text-[var(--app-primary)]">{S.worryFree}</span>
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text-muted)]">{S.worryFreeDesc}</span>
              {isTablet && <span className="shrink-0 rounded-sm bg-[var(--app-c-chip-bg)] px-1 text-[11px] leading-4 text-[var(--app-text-muted)]">{S.pricePlus7}</span>}
            </div>
            <div
              {...bindTap('product.detail.skuWarranty.open', { beforeTrigger: () => setSkuEntry('warranty') })}
              className="flex cursor-pointer items-center gap-2 border-t border-[var(--app-border)] py-2.5"
            >
              <span className="w-16 shrink-0 text-[13px] text-[var(--app-c-text-muted)]">{S.warrantyService}</span>
              <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">
                {(product.sku?.warranty ?? []).map((w) => w.label).slice(0, 2).join(' · ')}
              </span>
              <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
            </div>
          </div>
        )}

        {/* 家电管家(家电) */}
        {isFan && (
          <div
            {...bindTap('product.detail.chatManager.open', { params: { shopId: product.shopId, productId: product.id } })}
            className="mt-1 flex cursor-pointer items-center gap-2 bg-[var(--app-surface)] px-3 py-2.5"
          >
            <IcService size={18} className="shrink-0 text-[var(--app-primary)]" />
            <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--app-text)]">{S.contactManager}</span>
            <span className="shrink-0 rounded-full border border-[var(--app-primary)] px-2.5 py-0.5 text-[12px] text-[var(--app-primary)]">
              {S.chatService}
            </span>
          </div>
        )}

        {/* 门店金牌导购卡(3C,静态展示) */}
        {isTablet && (
          <button
            {...action('product.detail.wontfix.toast', wontfix)}
            className="mt-1 flex w-full cursor-pointer items-center gap-2 border-none bg-[var(--app-surface)] px-3 py-2.5 text-left"
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--app-c-chip-bg)]" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-[var(--app-text)]">{S.storeGuide}</div>
              <div className="truncate text-[11px] text-[var(--app-c-text-muted)]">{S.storeGuideName}</div>
            </div>
            <IcChevronRight size={14} className="shrink-0 text-[var(--app-c-text-muted)]" />
          </button>
        )}

        {/* 评价摘要区(整块进评价页) */}
        {!isPlain && (
          <div ref={reviewsRef} className="mt-1 bg-[var(--app-surface)] px-3 py-2.5">
            <div {...bindTap('product.detail.reviews.open', { params: { productId: product.id } })} className="cursor-pointer">
              <div className="flex items-center">
                <span className="text-[15px] font-bold text-[var(--app-text)]">
                  {S.reviewsLabel}({product.reviewCount})
                </span>
                <span className="ml-auto text-[12px] text-[var(--app-c-text-muted)]">
                  {product.goodRate}% {S.goodRateLabel} · {S.viewAll}
                </span>
                <IcChevronRight size={14} className="text-[var(--app-c-text-muted)]" />
              </div>
              {firstReview && (
                <div className="mt-2 flex gap-2">
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#FDE8D5]" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-[var(--app-c-text-muted)]">
                      {firstReview.nick} · {firstReview.level} · {S.ipLocation}{firstReview.ip}
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-[var(--app-text)]">{firstReview.text}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 问大家(范围外,toast) */}
        {(isFan || isTablet) && (
          <div className="mt-1 flex items-center gap-2 bg-[var(--app-surface)] px-3 py-2.5">
            <span className="shrink-0 text-[15px] font-bold text-[var(--app-text)]">{S.askAll}</span>
            <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-c-text-muted)]">{S.askAllHint}</span>
            <button
              {...action('product.detail.wontfix.toast', wontfix)}
              className="shrink-0 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2.5 py-0.5 text-[12px] text-[var(--app-text-muted)]"
            >
              {S.goAsk}
            </button>
          </div>
        )}

        {/* 店铺卡:店名/进店逛逛 → tab=featured;全部宝贝 → tab=products */}
        {shop && (
          <div className="mt-1 bg-[var(--app-surface)] px-3 py-2.5">
            <div
              {...bindTap('product.detail.shop.open', { params: { shopId: shop.id, tab: 'featured' } })}
              className="flex cursor-pointer items-center gap-2"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-c-chip-bg)]">
                <Img src={shop.logo} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-bold text-[var(--app-text)]">{shop.name}</div>
                <div className="text-[11px] text-[var(--app-c-text-muted)]">
                  {fansText(shop.followers)}
                  {S.followersSuffix}
                </div>
              </div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                {...bindTap('product.detail.shop.open', { params: { shopId: shop.id, tab: 'products' } })}
                className="flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-1.5 text-[13px] text-[var(--app-text)]"
              >
                {S.allItems}
              </button>
              <button
                {...bindTap('product.detail.shopBar.open', { params: { shopId: shop.id } })}
                className="flex-1 cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] py-1.5 text-[13px] text-[var(--app-primary)]"
              >
                {S.visitShop}
              </button>
            </div>
          </div>
        )}

        {/* 推荐区:本店推荐 / 热销排行 / 精选好物 */}
        <div className="mt-1 bg-[var(--app-surface)] px-3 pb-3 pt-2">
          <div className="flex gap-4">
            {recoTabs.map((t, i) => (
              <button
                key={t}
                {...action('product.detail.recoTab.switch', () => setRecoIdx(i), { params: { value: t } })}
                className={`cursor-pointer border-none bg-transparent pb-1 text-[14px] ${
                  recoIdx === i ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {recoList.map((p) => (
              <button
                key={p.id}
                {...bindTap('product.detail.detail.open', { params: { productId: p.id } })}
                className="cursor-pointer border-none bg-transparent p-0 text-left"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </div>
                <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-[var(--app-text)]">{p.title}</div>
                <div className="text-[13px] font-bold text-[var(--app-c-danger)]">¥{p.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 图文详情(Q13=A:规格参数表 + 占位图) */}
        <div ref={detailRef} className="mt-1 bg-[var(--app-surface)] px-3 pb-4 pt-3">
          <div className="text-center text-[15px] font-bold text-[var(--app-text)]">{S.detailSection}</div>
          <div className="mt-2 text-[14px] font-bold text-[var(--app-text)]">{S.specParams}</div>
          <div className="mt-1 rounded-lg border border-[var(--app-border)]">
            <div className="flex border-b border-[var(--app-border)] px-3 py-2 text-[12px]">
              <span className="w-24 shrink-0 text-[var(--app-c-text-muted)]">{S.brandLabel}</span>
              <span className="min-w-0 flex-1 text-[var(--app-text)]">{product.brand}</span>
            </div>
            {attrRows(product).map((r) => (
              <div key={r.label} className="flex border-b border-[var(--app-border)] px-3 py-2 text-[12px]">
                <span className="w-24 shrink-0 text-[var(--app-c-text-muted)]">{r.label}</span>
                <span className="min-w-0 flex-1 text-[var(--app-text)]">{r.value}</span>
              </div>
            ))}
            <div className="flex px-3 py-2 text-[12px]">
              <span className="w-24 shrink-0 text-[var(--app-c-text-muted)]">{S.listingDate}</span>
              <span className="min-w-0 flex-1 text-[var(--app-text)]">{product.rankFields.newness}{S.daysAgoListed}</span>
            </div>
          </div>
          <div className="mt-3 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
            <Img src={product.gallery[1] ?? product.image} className="w-full object-contain" />
          </div>
        </div>
        <div className="h-16" />
      </div>

      {/* 底栏:店铺(或苏宁超市)/客服/购物车/[加购小按钮]/主按钮 */}
      <div className="flex items-center gap-2 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-2">
        <button
          {...bindTap('product.detail.shopBar.open', { params: { shopId: product.shopId } })}
          className="flex w-12 shrink-0 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
        >
          <IcStore size={19} />
          <span className="text-[10px] leading-3">{shopBarText}</span>
        </button>
        <button
          {...bindTap('product.detail.chatBar.open', { params: { shopId: product.shopId, productId: product.id } })}
          className="flex w-12 shrink-0 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
        >
          <IcService size={19} />
          <span className="text-[10px] leading-3">{S.chatService}</span>
        </button>
        <button
          {...bindTap('product.detail.cart.open')}
          className="relative flex w-12 shrink-0 cursor-pointer flex-col items-center border-none bg-transparent text-[var(--app-text-muted)]"
        >
          <IcCart size={19} />
          <span className="text-[10px] leading-3">{S.tabCart}</span>
          {cartCount > 0 && (
            <span className="absolute right-1 top-[-2px] min-w-4 rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[10px] leading-4 text-white">
              {cartCount}
            </span>
          )}
        </button>
        {!isFan && (
          <button
            {...bindTap('product.detail.skuAdd.open', { beforeTrigger: () => setSkuEntry('add') })}
            className="h-10 flex-1 cursor-pointer rounded-l-full border-none bg-gradient-to-r from-[#FFB067] to-[#FD9101] text-[14px] font-bold text-white"
          >
            {S.addToCart}
          </button>
        )}
        <button
          {...bindTap('product.detail.skuBuy.open', { beforeTrigger: () => setSkuEntry('buy') })}
          className={`h-10 flex-1 cursor-pointer border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] text-[14px] font-bold text-white ${
            isFan ? 'rounded-full' : 'rounded-r-full'
          }`}
        >
          <span>{mainBtnText}</span>
          <span className="block text-[10px] font-normal leading-3">
            {S.netPrice}¥{round2(price * qty)}
          </span>
        </button>
      </div>

      {sheet === 'sku' && (
        <SkuSheet
          product={product}
          sel={sel}
          setSel={setSel}
          qty={qty}
          setQty={setQty}
          warrantyId={warrantyId}
          setWarrantyId={setWarrantyId}
          installment={installment}
          setInstallment={setInstallment}
          entry={skuEntry}
        />
      )}
      {sheet === 'cartSuccess' && <CartSuccessSheet product={product} />}
      {dialogOpen && (
        <div className="absolute inset-0 z-40">
          <div {...bindBack()} className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-8 top-1/3 rounded-2xl bg-[var(--app-surface)] px-5 pb-5 pt-6 text-center">
            <div className="text-[17px] font-bold text-[var(--app-text)]">{S.govSubsidyTab}</div>
            <div className="mt-2 text-[13px] leading-5 text-[#666]">{S.subsidyClaimHint}</div>
            <button
              {...action('product.detail.subsidy.claim', () => {
                // 领取国补:关弹窗 + Toast + 该商品进结算页时国补行默认勾选
                claimProductSubsidy(product.id);
                showToast(S.toastSubsidyClaimed);
                back();
              })}
              className="mt-5 w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[#3D8BF2] to-[#2B6BD4] py-2.5 text-[15px] font-bold text-white"
            >
              {S.claimNow}
            </button>
            <button
              {...bindBack()}
              className="absolute right-3 top-3 cursor-pointer rounded-full border-none bg-transparent p-1 text-[var(--app-c-text-muted)]"
            >
              <IcClose size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** ?sheet=sku:规格弹层(家电=单「确定」;3C/生鲜/快消=双按钮 加购/立即购买) */
function SkuSheet(props: {
  product: Product;
  sel: SkuSelection;
  setSel: (s: SkuSelection) => void;
  qty: number;
  setQty: (n: number) => void;
  warrantyId: string | null;
  setWarrantyId: (id: string | null) => void;
  installment: number | null;
  setInstallment: (i: number | null) => void;
  entry: SkuEntry;
}) {
  const { product, sel, setSel, qty, setQty, warrantyId, setWarrantyId, installment, setInstallment, entry } = props;
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const showToast = useSuningStore((s) => s.showToast);
  const addToCart = useSuningStore((s) => s.addToCart);
  const beginBuyNow = useSuningStore((s) => s.beginBuyNow);
  const setCheckoutWarranty = useSuningStore((s) => s.setCheckoutWarranty);
  const warrantyRef = useRef<HTMLDivElement | null>(null);

  // 保障服务入口进入时滚动到保障服务段(s282 同款内容)
  useEffect(() => {
    if (entry === 'warranty') warrantyRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [entry]);

  const groups: SkuGroup[] = product.sku?.groups ?? [];
  const warranties = product.sku?.warranty ?? [];
  const installments = product.sku?.installments ?? [];
  const limit = product.sku?.limitQty ?? 99;
  const { price, priceOriginal } = selectionPrice(product, sel);
  const skuText = selectionText(product, sel) || S.inStock;
  const warrantyPrice = warranties.find((w) => w.id === warrantyId)?.price ?? 0;
  const isFan = product.detailTemplate === 'fan';
  const buyText = product.detailTemplate === 'fresh' || product.detailTemplate === 'cola' ? S.couponBuy : S.buyNow;

  const pickOption = (groupName: string, optId: string, disabled: boolean) => {
    if (disabled) {
      showToast(S.toastOutOfStock);
      return;
    }
    setSel({ ...sel, [groupName]: optId });
  };

  const stepQty = (delta: number) => {
    const next = qty + delta;
    if (next > limit) {
      showToast(S.toastLimit);
      return;
    }
    setQty(Math.max(1, Math.min(next, limit)));
  };

  const startBuy = () => {
    beginBuyNow(product.id, skuText, price, qty);
    if (warrantyId) setCheckoutWarranty(warrantyId, warrantyPrice);
  };

  return (
    <div className="absolute inset-0 z-40">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[82%] flex-col rounded-t-2xl bg-[var(--app-surface)]">
        {/* 头部:缩略图 + 价格 + 商品编码 + 已选 */}
        <div className="relative flex gap-3 px-3 pb-2 pt-4">
          <div className="-mt-6 h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)]">
            <Img src={product.image} className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1 pr-6">
            <div className="flex items-baseline gap-1">
              <span className="text-[12px] text-[var(--app-c-danger)]">{S.netPrice}</span>
              <span className="text-[22px] font-bold leading-none text-[var(--app-c-danger)]">
                <span className="text-[13px]">¥</span>
                {price}
              </span>
              <span className="text-[11px] text-[var(--app-c-text-muted)] line-through">¥{priceOriginal}</span>
            </div>
            <div className="mt-1 truncate text-[11px] text-[var(--app-c-text-muted)]">{product.sku?.codeText}</div>
            <div className="mt-0.5 truncate text-[12px] text-[var(--app-text)]">
              {S.selectedLabel} {skuText}
            </div>
          </div>
          <button
            {...bindBack()}
            className="absolute right-3 top-3 cursor-pointer rounded-full border-none bg-transparent p-1 text-[var(--app-c-text-muted)]"
          >
            <IcClose size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-2" data-scroll-container="skuSheet" data-scroll-direction="vertical">
          {groups.map((g) => (
            <div key={g.name} className="pt-2">
              <div className="text-[13px] text-[var(--app-text)]">{g.name}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {g.options.map((o) => {
                  const active = sel[g.name] === o.id;
                  return (
                    <button
                      key={o.id}
                      {...action('product.detail.sku.selectOption', () => pickOption(g.name, o.id, o.disabled === true), {
                        params: { group: g.name, value: o.id },
                      })}
                      className={`relative max-w-full cursor-pointer truncate rounded-lg px-3 py-2 text-[13px] leading-4 ${
                        o.disabled
                          ? 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-c-text-muted)] line-through'
                          : active
                            ? 'border border-[var(--app-primary)] bg-[#FFF3E8] font-semibold text-[var(--app-primary)]'
                            : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text)]'
                      }`}
                    >
                      {o.label}
                      {o.hot && (
                        <span className="absolute -top-1.5 right-0 rounded-full bg-[var(--app-c-danger)] px-1 text-[9px] leading-3 text-white">
                          {S.hotTag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {isFan && <div className="mt-3 rounded-lg bg-[#FFF7EF] px-3 py-1.5 text-[11px] text-[#B0651F]">{S.slideForWarranty}</div>}

          {/* 数量步进器(起售1件,限购 N 件) */}
          <div className="flex items-center py-3">
            <span className="flex-1 text-[13px] text-[var(--app-text)]">{S.qtyLabel}</span>
            <div className="flex items-center gap-3 rounded-lg bg-[var(--app-c-chip-bg)] px-2 py-1">
              <button
                {...action('product.detail.sku.qtyStep', () => stepQty(-1), { params: { delta: -1 } })}
                className={`cursor-pointer border-none bg-transparent p-0 ${qty <= 1 ? 'text-[#CCC]' : 'text-[var(--app-text)]'}`}
              >
                <IcMinus size={14} />
              </button>
              <span className="min-w-6 text-center text-[14px] text-[var(--app-text)]">{qty}</span>
              <button
                {...action('product.detail.sku.qtyStep', () => stepQty(1), { params: { delta: 1 } })}
                className={`cursor-pointer border-none bg-transparent p-0 ${qty >= limit ? 'text-[#CCC]' : 'text-[var(--app-text)]'}`}
              >
                <IcPlus size={14} />
              </button>
            </div>
          </div>

          {/* 保障服务档位(单选可取消) */}
          {warranties.length > 0 && (
            <div ref={warrantyRef} className="border-t border-[var(--app-border)] pt-2">
              <div className="text-[13px] text-[var(--app-text)]">{S.optionalService}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {warranties.map((w) => {
                  const active = warrantyId === w.id;
                  return (
                    <button
                      key={w.id}
                      {...action('product.detail.sku.warrantySelect', () => setWarrantyId(active ? null : w.id), {
                        params: { value: w.id },
                      })}
                      className={`relative cursor-pointer rounded-lg px-3 py-2 text-left text-[12px] leading-4 ${
                        active
                          ? 'border border-[var(--app-primary)] bg-[#FFF3E8] font-semibold text-[var(--app-primary)]'
                          : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text)]'
                      }`}
                    >
                      {w.label}
                      <span className="block text-[11px] text-[var(--app-c-danger)]">¥{w.price}</span>
                      {w.tag && (
                        <span className="absolute -top-1.5 right-0 rounded-full bg-[var(--app-c-danger)] px-1 text-[9px] leading-3 text-white">
                          {w.tag}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 花呗分期 / 任性付(展示型,不影响价格) */}
          {installments.length > 0 && (
            <div className="mt-3 border-t border-[var(--app-border)] pt-2">
              <div className="flex flex-wrap gap-2 pt-1">
                {installments.map((label, i) => (
                  <button
                    key={label}
                    {...action('product.detail.sku.installmentSelect', () => setInstallment(installment === i ? null : i), {
                      params: { value: i },
                    })}
                    className={`cursor-pointer rounded-lg px-2.5 py-1.5 text-[12px] leading-4 ${
                      installment === i
                        ? 'border border-[var(--app-primary)] bg-[#FFF3E8] text-[var(--app-primary)]'
                        : 'border border-transparent bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮:家电单按钮(马上抢入口→结算;已选/保障入口→保存规格关闭),其余双按钮 */}
        <div className="flex gap-2 border-t border-[var(--app-border)] px-3 py-2.5">
          {isFan ? (
            entry === 'buy' ? (
              <button
                {...bindTap('product.detail.checkout.open', {
                  params: { productId: product.id, skuId: selectionId(product, sel), qty },
                  beforeTrigger: startBuy,
                })}
                className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
              >
                {S.confirm}
              </button>
            ) : entry === 'add' ? (
              // 家电单主按钮模板从「商品卡+快捷加购」进入时,弹层「确定」= 加入购物车(走查 0813 反馈③)
              <button
                {...bindTap('product.detail.cartSuccess.open', {
                  beforeTrigger: () => addToCart(product.id, skuText, price, qty),
                })}
                className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
              >
                {S.addToCart}
              </button>
            ) : (
              <button
                {...bindBack()}
                className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
              >
                {S.confirm}
              </button>
            )
          ) : (
            <>
              <button
                {...bindTap('product.detail.cartSuccess.open', {
                  beforeTrigger: () => addToCart(product.id, skuText, price, qty),
                })}
                className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[#FFB067] to-[#FD9101] py-2.5 text-[15px] font-bold text-white"
              >
                {S.addToCart}
              </button>
              <button
                {...bindTap('product.detail.checkout.open', {
                  params: { productId: product.id, skuId: selectionId(product, sel), qty },
                  beforeTrigger: startBuy,
                })}
                className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-center text-[15px] font-bold leading-4 text-white"
              >
                {buyText}
                <span className="block text-[10px] font-normal">
                  {S.netPrice}¥{round2(price * qty + warrantyPrice)}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** ?sheet=cartSuccess:加购成功弹层(frame:r1@36.0) */
function CartSuccessSheet({ product }: { product: Product }) {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);
  const reco = SUNING_CONFIG.products.filter((p) => p.id !== product.id).slice(0, 4);
  const warranty = product.sku?.warranty?.[1];

  return (
    <div className="absolute inset-0 z-40">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[76%] flex-col rounded-t-2xl bg-[var(--app-surface)]">
        <div className="relative px-3 pb-2 pt-4 text-center">
          <div className="flex items-center justify-center gap-1 text-[16px] font-bold text-[var(--app-text)]">
            <IcCheck size={18} className="text-[#1BA95A]" />
            {S.addCartSuccess}
          </div>
          <div className="mt-1 text-[12px] text-[var(--app-c-text-muted)]">{S.addCartMore}</div>
          <button {...bindBack()} className="absolute right-3 top-3 cursor-pointer rounded-full border-none bg-transparent p-1 text-[var(--app-c-text-muted)]">
            <IcClose size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3" data-scroll-container="cartSuccess" data-scroll-direction="vertical">
          {/* 保障服务推荐加购(延保单独加购不做,toast) */}
          {warranty && (
            <div className="flex items-center gap-2 rounded-lg bg-[var(--app-c-chip-bg)] px-3 py-2">
              <IcTicket size={16} className="shrink-0 text-[var(--app-primary)]" />
              <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text)]">
                {warranty.label} ¥{warranty.price}
              </span>
              <button
                {...action('product.detail.wontfix.toast', wontfix)}
                className="shrink-0 cursor-pointer rounded-full border border-[var(--app-primary)] bg-[var(--app-surface)] px-2 py-0.5 text-[11px] text-[var(--app-primary)]"
              >
                {S.addToCart}
              </button>
            </div>
          )}
          <div className="mt-3 text-[14px] font-bold text-[var(--app-text)]">{S.guessNeed}</div>
          <div className="mt-2 grid grid-cols-2 gap-2 pb-2">
            {reco.map((p) => (
              <button
                key={p.id}
                {...bindTap('product.detail.detail.open', { params: { productId: p.id } })}
                className="cursor-pointer overflow-hidden rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-0 text-left"
              >
                <div className="aspect-square w-full bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </div>
                <div className="p-2">
                  <div className="line-clamp-2 text-[12px] leading-4 text-[var(--app-text)]">{p.title}</div>
                  <div className="mt-1 text-[14px] font-bold text-[var(--app-c-danger)]">¥{p.price}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border-t border-[var(--app-border)] px-3 py-2.5">
          <button
            {...bindBack()}
            className="flex-1 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2.5 text-[15px] text-[var(--app-text)]"
          >
            {S.keepBrowsing}
          </button>
          <button
            {...bindTap('product.detail.cartSuccessGoCart.open')}
            className="flex-1 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-2.5 text-[15px] font-bold text-white"
          >
            {S.goCartCheckout}
          </button>
        </div>
      </div>
    </div>
  );
}
