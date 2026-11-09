import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Img } from '../components/ui';
import { Sheet, SheetIconRow } from '../components/Sheet';
import { CartSvg, fmtPrice } from './marketShared';
import { copyToClipboard, shareWithSystem } from '../capabilities';

// 节点: market.product —— 市集商品详情页。
// 图集轮播 n/8 · 限时立减真倒计时 · SKU 弹层(颜色select/数量步进/加购→toast+角标/立即购买→orderConfirm)
// · 豆友说→broadcast.detail · 客服/分享→wontfix。

/** 倒计时格式「29天15时29分35秒」(天/时/分/秒) */
function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const dd = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${dd}天${hh}时${mm}分${ss}秒`;
}

const P_UNITS = ['件', '枚', '只', '套'];
const unitOfProduct = (id: string) =>
  P_UNITS[[...id].reduce((s, ch) => s + ch.charCodeAt(0), 0) % P_UNITS.length];
// 稳定派生「N人在逛」(虚构)
const viewingOf = (id: string) =>
  100000 + ([...id].reduce((s, ch) => s + ch.charCodeAt(0) * 7, 0) % 400000);

export default function MarketProductPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const products = useDoubanStore((s) => s.products);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const users = useDoubanStore((s) => s.users);
  const cart = useDoubanStore((s) => s.cart);
  const addToCart = useDoubanStore((s) => s.addToCart);
  const beginDirectBuy = useDoubanStore((s) => s.beginDirectBuy);

  const productId = routeParams.productId ?? 'pd1';
  const product = useMemo(() => products.find((p) => p.id === productId) ?? products[0], [products, productId]);

  const cartCount = useMemo(() => cart.reduce((n, c) => n + c.count, 0), [cart]);
  const isLimited = (product.tag ?? '').includes('限时');

  // 图集轮播:横向滚动 + n/8 指示器
  const galleryRef = useRef<HTMLDivElement>(null);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const onGalleryScroll = () => {
    const el = galleryRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== galleryIdx) setGalleryIdx(i);
  };

  // 限时立减真倒计时(基于真实墙钟,~29天窗口内递减,天/时/分/秒展示)
  const endRef = useRef(TimeService.realNow() + (29 * 86400 + 15 * 3600 + 29 * 60 + 35) * 1000);
  const [remain, setRemain] = useState(endRef.current - TimeService.realNow());
  useEffect(() => {
    if (!isLimited) return;
    const t = setInterval(() => setRemain(endRef.current - TimeService.realNow()), 1000);
    return () => clearInterval(t);
  }, [isLimited]);

  // SKU 弹层状态(URL 驱动:sheet=sku|skuBuy|coupon|share)
  const sheet = searchParams.get('sheet');
  const [skuColor, setSkuColor] = useState(product.skuOptions[0]?.values[0] ?? '');
  const [skuQty, setSkuQty] = useState(1);

  const openSheet = (name: string) =>
    setSearchParams((p) => {
      p.set('sheet', name);
      return p;
    });

  const skuName = product.skuOptions[0]?.name ?? '款式';
  const skuValues = product.skuOptions[0]?.values ?? [];

  const confirmAddToCart = () => {
    addToCart(product.id, skuColor || skuValues[0] || '默认', skuQty);
    toast('已加入购物车');
    // 关闭弹层(弹栈)
    setSearchParams((p) => {
      p.delete('sheet');
      return p;
    });
  };

  // 豆友说(引用广播)
  const buyerBroadcasts = useMemo(
    () => (product.buyerBroadcastIds ?? []).map((id) => broadcasts.find((b) => b.id === id)).filter(Boolean),
    [product, broadcasts],
  );

  const isBuy = sheet === 'skuBuy';
  const skuSheetOpen = sheet === 'sku' || sheet === 'skuBuy';

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-1 shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <button {...bindBack()} className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.green }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>{product.title}</div>
        <button
          {...bindTap({ kind: 'action', id: 'market.product.shareSheet.open' }, { onTrigger: () => openSheet('share') })}
          className="w-12 text-right pr-2 text-xl bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
        >
          …
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 图集轮播 n/8 */}
        <div className="relative bg-white">
          <div
            ref={galleryRef}
            onScroll={onGalleryScroll}
            {...bindTap({ kind: 'action', id: 'market.product.gallery.swipe' }, { onTrigger: () => {} })}
            className="flex overflow-x-auto snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none' }}
            data-scroll-container="gallery"
            data-scroll-direction="horizontal"
          >
            {product.images.map((src, i) => (
              <Img key={i} src={src} className="w-full aspect-square object-cover shrink-0 snap-center" style={{ width: '100%' }} />
            ))}
          </div>
          <div
            className="absolute right-3 bottom-3 px-2 py-0.5 rounded-full text-[11px] text-white"
            style={{ background: 'rgba(0,0,0,0.5)' }}
          >
            {galleryIdx + 1}/{product.images.length}
          </div>
        </div>

        {/* 商品名(无 tag,在价格上方) */}
        <div className="bg-white px-4 pt-3">
          <div className="text-[16px] font-semibold leading-snug" style={{ color: C.text }}>
            {product.title}
          </div>
          {/* 价格行:¥78.00/件 ¥88.00 (建议零售价) + 右侧双头像 + N人在逛 */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold" style={{ color: C.danger }}>
              <span className="text-sm">¥</span>{product.price.toFixed(2)}
              <span className="text-xs font-normal" style={{ color: C.sub }}>/{unitOfProduct(product.id)}</span>
            </span>
            {product.origPrice != null && (
              <span className="text-sm mb-0.5" style={{ color: '#B9BEC6' }}>
                ¥{product.origPrice.toFixed(2)}<span className="text-[11px]"> (建议零售价)</span>
              </span>
            )}
            <span className="ml-auto flex items-center gap-1 shrink-0">
              <span className="flex -space-x-1.5">
                {users.slice(0, 2).map((u, i) => (
                  <Avatar key={i} src={u.avatar} size={18} />
                ))}
              </span>
              <span className="text-[11px]" style={{ color: C.sub }}>{viewingOf(product.id)}人在逛</span>
            </span>
          </div>
        </div>

        {/* 限时立减价胶囊(浅红底红字,天/时/分/秒) */}
        {isLimited && remain > 0 && (
          <div className="bg-white px-4 pt-2 pb-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md" style={{ background: '#FDECEC', color: C.danger }}>
              <span className="text-xs">🕐</span>
              <span className="text-xs font-semibold">限时立减价</span>
              <span className="text-xs">剩余 {fmtCountdown(remain)}</span>
            </div>
          </div>
        )}

        {/* 优惠行:优惠 [🫘领取代金券 绿pill] › */}
        <button
          {...bindTap({ kind: 'action', id: 'market.product.couponSheet.open' }, { onTrigger: () => openSheet('coupon') })}
          className="w-full flex items-center gap-3 px-4 py-2.5 mt-2 bg-white border-none cursor-pointer text-left"
        >
          <span className="text-[13px]" style={{ color: C.sub }}>优惠</span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px]"
            style={{ background: C.greenSoft, color: C.green }}
          >
            🫘 领取代金券
          </span>
          <span className="ml-auto text-base" style={{ color: '#C7CCD4' }}>›</span>
        </button>

        {/* 豆友说 */}
        {buyerBroadcasts.length > 0 && (
          <div className="mt-2 bg-white px-4 py-3">
            <div className="text-base font-bold mb-2" style={{ color: C.text }}>豆友说</div>
            {buyerBroadcasts.map((b) => {
              if (!b) return null;
              const author = users.find((u) => u.id === b.authorId);
              return (
                <div
                  key={b.id}
                  {...bindTap('market.product.broadcast-open', { params: { id: b.id } })}
                  className="flex gap-3 py-2 cursor-pointer"
                >
                  <Avatar src={author?.avatar ?? ''} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name ?? '豆友'}</div>
                    <div className="text-[13px] mt-0.5 line-clamp-2" style={{ color: '#3A3F45' }}>{b.text}</div>
                    <div className="text-[11px] mt-1" style={{ color: C.sub }}>{b.likeCount} 赞 · {b.replyCount} 回复</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="h-20" />
      </div>

      {/* 底部操作条:icon 无文字 + 圆角胶囊对钮(加入购物车橙 / 立即购买红) */}
      <div className="flex items-center gap-2 h-14 px-3 shrink-0 border-t bg-white" style={{ borderColor: C.border }}>
        <button {...bindTap('market.product.home-open')} className="w-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z" strokeLinejoin="round" /></svg>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'market.product.service.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ color: C.sub }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 12a8 8 0 0116 0v5a3 3 0 01-3 3h-2" strokeLinecap="round" /><rect x="3" y="12" width="4" height="6" rx="1.5" /><rect x="17" y="12" width="4" height="6" rx="1.5" /></svg>
        </button>
        <button {...bindTap('market.product.cart-open')} className="relative w-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
          <CartSvg size={22} color={C.sub} />
          {cartCount > 0 && (
            <span className="absolute -top-0.5 right-0 min-w-4 h-4 px-1 rounded-full text-[10px] text-white flex items-center justify-center" style={{ background: C.danger }}>{cartCount}</span>
          )}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'market.product.sku.open' }, { onTrigger: () => { setSkuQty(1); openSheet('sku'); } })}
          className="flex-1 h-10 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
          style={{ background: '#FF9F1C' }}
        >
          加入购物车
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'market.product.skuBuy.open' }, { onTrigger: () => { setSkuQty(1); openSheet('skuBuy'); } })}
          className="flex-1 h-10 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
          style={{ background: C.danger }}
        >
          立即购买
        </button>
      </div>

      {/* SKU 弹层(加购 / 立即购买 共用) */}
      {skuSheetOpen && (
        <Sheet>
          <div className="px-4 pb-1">
            <div className="flex gap-3 items-end pt-1">
              <Img src={product.cover} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1 min-w-0 pb-1">
                <div className="text-xl font-bold" style={{ color: C.danger }}>
                  <span className="text-sm">¥</span>{fmtPrice(product.price)}
                </div>
                <div className="text-xs mt-1" style={{ color: C.sub }}>
                  已选:{skuColor || skuValues[0]} × {skuQty}
                </div>
              </div>
            </div>

            {/* 颜色/款式 chips */}
            <div className="mt-4 text-[13px] font-semibold" style={{ color: C.text }}>{skuName}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {skuValues.map((v) => {
                const on = (skuColor || skuValues[0]) === v;
                return (
                  <button
                    key={v}
                    {...bindTap(
                      { kind: 'action', id: 'market.product.sku.select.color' },
                      { params: { target: v }, onTrigger: () => setSkuColor(v) },
                    )}
                    className="px-3.5 py-1.5 rounded-md text-[13px] border cursor-pointer"
                    style={{
                      background: on ? C.greenSoft : '#F5F6F7',
                      color: on ? C.green : C.text,
                      borderColor: on ? C.green : 'transparent',
                    }}
                  >
                    {v}
                  </button>
                );
              })}
            </div>

            {/* 数量步进 */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[13px] font-semibold" style={{ color: C.text }}>数量</span>
              <div className="flex items-center gap-3">
                <button
                  {...bindTap(
                    { kind: 'action', id: 'market.product.sku.qty.step' },
                    { params: { target: 'minus' }, onTrigger: () => setSkuQty((q) => Math.max(1, q - 1)) },
                  )}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-lg cursor-pointer bg-white"
                  style={{ borderColor: C.border, color: skuQty <= 1 ? '#C9CDD3' : C.text }}
                >
                  −
                </button>
                <span className="w-8 text-center text-[15px]" style={{ color: C.text }}>{skuQty}</span>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'market.product.sku.qty.step' },
                    { params: { target: 'plus' }, onTrigger: () => setSkuQty((q) => q + 1) },
                  )}
                  className="w-7 h-7 rounded-full border flex items-center justify-center text-lg cursor-pointer bg-white"
                  style={{ borderColor: C.border, color: C.text }}
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 确认按钮 */}
          <div className="px-4 pt-4">
            {isBuy ? (
              <button
                {...bindTap('market.product.orderConfirm-open', {
                  beforeTrigger: () => beginDirectBuy(product.id, skuColor || skuValues[0] || '默认', skuQty),
                })}
                className="w-full h-11 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
                style={{ background: C.green }}
              >
                确认(立即购买)
              </button>
            ) : (
              <button
                {...bindTap({ kind: 'action', id: 'market.product.sku.addToCart' }, { onTrigger: confirmAddToCart })}
                className="w-full h-11 rounded-full text-white text-sm font-semibold border-none cursor-pointer"
                style={{ background: '#FF9F1C' }}
              >
                加入购物车
              </button>
            )}
          </div>
        </Sheet>
      )}

      {/* 代金券弹层 */}
      {sheet === 'coupon' && (
        <Sheet title="领取代金券">
          <div className="px-4 pb-2">
            <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: C.border }}>
              <div className="text-center px-3" style={{ color: C.danger }}>
                <span className="text-xs">¥</span><span className="text-2xl font-bold">5</span>
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold" style={{ color: C.text }}>市集通用代金券</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>有效期 3 天 · 用小豆兑换</div>
              </div>
            </div>
            <div className="mt-2 text-[11px]" style={{ color: C.sub }}>提示:在确认订单页可用小豆兑换并抵扣。</div>
          </div>
        </Sheet>
      )}

      {/* 分享面板 */}
      {sheet === 'share' && (
        <Sheet title="分享到">
          <SheetIconRow
            items={['微信', '朋友圈', '微博', '复制链接'].map((label) => ({
              label,
              icon: <span style={{ fontSize: 18 }}>◦</span>,
              bind: bindTap({ kind: 'action', id: 'market.product.share.wontfix' }, { onTrigger: () => {
                if (label === '复制链接') {
                  toast(copyToClipboard(`https://www.douban.com/market/product/${product.id}`) ? '链接已复制' : '无法访问剪切板');
                  return;
                }
                const launched = shareWithSystem(`【豆瓣市集】${product.title}`, (r) => { if (r.resultCode === 'OK') toast('分享成功'); });
                if (!launched) toast('无法打开系统分享');
              } }),
            }))}
          />
        </Sheet>
      )}
    </div>
  );
}
