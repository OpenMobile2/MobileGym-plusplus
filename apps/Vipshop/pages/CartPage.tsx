import React, { useMemo, useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Price, Stepper, BottomSheet, usePanel, useToast, NOT_OPEN, VIP } from '../components/ui';
import { CART_CHIPS, SHARE_CHANNELS } from '../constants';
import { IcShare, IcCheck, IcSearch, IcArrowRight, IcArrowDown, IcTicket, IcSend, IcMessage, IcCopy, IcQrCode } from '../res/icons';
import type { VipCartItem } from '../types';

/** 分享渠道图标:constants 里存 Ic* 别名,这里映射成组件(与 TabBar 同一写法) */
const SHARE_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  IcSend, IcMessage, IcCopy, IcQrCode,
};
import { makeTextPosterDataUrl, saveImageToAlbum } from '@/os/albumBridge';
import { sharePlainText } from '@/os/shareBridge';
import { ClipboardService } from '@/os/ClipboardService';
import * as TimeService from '@/os/TimeService';

/** 圆形勾选框(真机粉色实心/空心)。用 span 避免嵌套在按钮内(全选)导致的嵌套按钮报错。 */
function Check({ on, onClick, binding }: { on: boolean; onClick?: () => void; binding?: object }) {
  const interactive = Boolean(binding || onClick);
  return (
    <span
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      role={interactive ? 'button' : undefined}
      className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center bg-white ${interactive ? 'cursor-pointer' : ''}`}
      style={on ? { background: VIP.primary, borderColor: VIP.primary } : { borderColor: '#CCC' }}
      aria-label="勾选"
    >
      {on && <IcCheck size={14} className="text-white" />}
    </span>
  );
}

export default function CartPage() {
  const { bindTap, back } = useVipshopGestures();
  const { value: panel } = usePanel();
  const [manage, setManage] = useState(false);
  const [activeChips, setActiveChips] = useState<string[]>([]);
  const [toast, showToast] = useToast();

  const cart = useVipshopStore((s) => s.cart);
  const items = useVipshopStore((s) => s.items);
  const toggleSelect = useVipshopStore((s) => s.toggleCartSelect);
  const toggleAll = useVipshopStore((s) => s.toggleCartSelectAll);
  const changeQty = useVipshopStore((s) => s.changeCartQty);
  const deleteItems = useVipshopStore((s) => s.deleteCartItems);
  const moveToFav = useVipshopStore((s) => s.moveCartToFavorites);
  const beginCheckout = useVipshopStore((s) => s.beginCheckout);

  const itemOf = (iid: string) => items.find((i) => i.id === iid);
  /** 分享/复制链接共用同一份文案,保证两条渠道给出去的内容一致 */
  const shareText = `【唯品会】购物车好物分享 https://vip.com/cart?n=${cart.length}`;
  const selectedIds = cart.filter((c) => c.selected).map((c) => c.id);
  const allSelected = cart.length > 0 && cart.every((c) => c.selected);
  const total = cart.filter((c) => c.selected).reduce((s, c) => s + c.price * c.qty, 0);
  const selCount = selectedIds.length;

  const shownCart = activeChips.length === 0
    ? cart
    : cart.filter((c) => c.tags.some((t) => activeChips.includes(t)));

  // 按店铺(品牌)分组 —— 真机购物车按 自营·品牌旗舰店 分组
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, VipCartItem[]>();
    shownCart.forEach((c) => {
      const bn = itemOf(c.itemId)?.brandName ?? '其他店铺';
      if (!map.has(bn)) { map.set(bn, []); order.push(bn); }
      map.get(bn)!.push(c);
    });
    return order.map((bn) => ({ brandName: bn, list: map.get(bn)! }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownCart, items]);

  const toggleGroup = (list: VipCartItem[]) => {
    const allOn = list.every((c) => c.selected);
    list.forEach((c) => { if (c.selected === allOn) toggleSelect(c.id); });
  };

  const doCheckout = () => {
    const sel = cart.filter((c) => c.selected);
    if (sel.length === 0) { showToast('请选择商品'); return; }
    beginCheckout({
      lines: sel.map((c) => {
        const it = itemOf(c.itemId);
        return { itemId: c.itemId, title: it?.title ?? '', image: it?.image ?? '', skuDesc: c.skuDesc, price: c.price, qty: c.qty };
      }),
      brandName: itemOf(sel[0].itemId)?.brandName ?? '唯品会',
      source: 'cart',
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      {/* 顶栏:标题 + 配送至 + 优惠券/分享/管理 */}
      <div className="shrink-0 bg-white px-3 pt-2 pb-2 border-b border-[#EEEEEE]">
        <div className="flex items-end">
          <div className="flex-1">
            <div className="text-[18px] font-semibold text-[#222222] leading-tight">购物车{cart.length > 0 ? `(${cart.length})` : ''}</div>
            <div className="text-[11px] text-[#888888] mt-0.5 flex items-center gap-0.5">配送至 栖霞区仙林街道 <IcArrowDown size={11} /></div>
          </div>
          <div className="flex items-center gap-3 text-[13px] pb-0.5">
            <button {...bindTap('cart.coupons-open')} className="bg-transparent border-none cursor-pointer flex items-center gap-0.5" style={{ color: VIP.primary }}>
              <IcTicket size={14} />优惠券
            </button>
            <span className="text-[#EEE]">|</span>
            <button
              {...bindTap('cart.share.open')}
              className="bg-transparent border-none cursor-pointer flex items-center gap-0.5 text-[#666666]"
            >
              <IcShare size={14} />分享
            </button>
            <span className="text-[#EEE]">|</span>
            <button
              {...bindTap({ kind: 'action', id: 'cart.manage.toggle' }, { onTrigger: () => setManage((m) => !m) })}
              className="bg-transparent border-none cursor-pointer text-[#666666]"
            >
              {manage ? '完成' : '管理'}
            </button>
          </div>
        </div>
        {/* 筛选 chips + 筛选/搜索 */}
        <div className="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar">
          {CART_CHIPS.map((chip) => {
            const on = activeChips.includes(chip);
            return (
              <button
                key={chip}
                {...bindTap({ kind: 'action', id: 'cart.filterChips.toggle' }, {
                  params: { chip },
                  onTrigger: () => setActiveChips((a) => (a.includes(chip) ? a.filter((x) => x !== chip) : [...a, chip])),
                })}
                className="shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer"
                style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#666', borderColor: '#EEE', background: '#fff' }}
              >
                {chip}
              </button>
            );
          })}
          <span className="flex-1" />
          <IcSearch size={16} className="text-[#888888] shrink-0" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="cart-list" data-scroll-direction="vertical">
        {shownCart.length === 0 && (
          <div className="text-center text-[13px] text-[#888888] py-16">购物车还是空的,快去逛逛吧~</div>
        )}

        {groups.map((g) => {
          const groupOn = g.list.every((c) => c.selected);
          return (
            <div key={g.brandName} className="bg-white mt-2">
              {/* 店铺头 */}
              <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
                <Check
                  on={groupOn}
                  binding={bindTap({ kind: 'action', id: 'cart.group.select.toggle' }, {
                    params: { brand: g.brandName },
                    onTrigger: () => toggleGroup(g.list),
                  })}
                />
                <span className="text-[11px] text-white rounded px-1 leading-4" style={{ background: VIP.primary }}>自营</span>
                <span className="text-[14px] font-semibold text-[#222222]">{g.brandName}官方旗舰店</span>
                <IcArrowRight size={14} className="text-[#BBBBBB]" />
              </div>
              {/* 满减 banner + 去凑单(真机位置) */}
              <div className="flex items-center gap-2 mx-3 my-1 rounded px-2 py-1.5" style={{ background: '#FDECF5' }}>
                <span className="text-[10px] text-white rounded px-1 leading-4 shrink-0" style={{ background: VIP.orange }}>满减</span>
                <span className="text-[12px] text-[#333333] flex-1 truncate">跨品牌满299减50,上不封顶</span>
                <button
                  {...bindTap('cart.addon-open')}
                  className="shrink-0 text-[12px] flex items-center gap-0.5 bg-transparent border-none cursor-pointer"
                  style={{ color: VIP.primary }}
                >
                  去凑单 <IcArrowRight size={12} />
                </button>
              </div>
              {/* 商品 */}
              {g.list.map((c) => {
                const it = itemOf(c.itemId);
                if (!it) return null;
                return (
                  <div key={c.id} className="flex gap-2.5 px-3 py-2.5">
                    <Check
                      on={c.selected}
                      binding={bindTap({ kind: 'action', id: 'cart.item.select.toggle' }, {
                        params: { cartItemId: c.id },
                        onTrigger: () => toggleSelect(c.id),
                      })}
                    />
                    <div {...bindTap('cart.item-open', { params: { id: c.itemId } })} className="cursor-pointer shrink-0 relative">
                      <Img src={it.image} className="w-[86px] h-[86px] rounded-lg object-cover" />
                      {c.tags.includes('库存紧张') && (
                        <span className="absolute left-0 bottom-0 text-[9px] text-white px-1 rounded-tr rounded-bl-lg" style={{ background: VIP.orange }}>库存紧张</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div {...bindTap('cart.item-open', { params: { id: c.itemId } })} className="text-[13px] text-[#222222] line-clamp-2 cursor-pointer leading-snug">{it.title}</div>
                      <button
                        {...bindTap('cart.sku-open', { params: { id: c.itemId } })}
                        className="mt-1 text-[11px] text-[#888888] bg-[#F5F5F5] rounded px-1.5 py-0.5 border-none cursor-pointer inline-flex items-center gap-0.5 max-w-full"
                      >
                        <span className="truncate">{c.skuDesc}</span><IcArrowDown size={11} />
                      </button>
                      <div className="text-[11px] mt-1 flex items-center gap-2" style={{ color: VIP.primary }}>
                        <span>10天价保</span>
                        {c.tags.includes('降价') && <span className="text-[#FF7A00]">↓ 距加购降价¥18</span>}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <Price value={c.price} size="m" />
                        <Stepper
                          value={c.qty}
                          onChange={(d) => changeQty(c.id, d)}
                          decrementBinding={c.qty > 1
                            ? bindTap({ kind: 'action', id: 'cart.qty.change' }, {
                                params: { cartItemId: c.id, delta: -1 },
                                stopPropagation: true,
                                onTrigger: () => changeQty(c.id, -1),
                              })
                            : undefined}
                          incrementBinding={bindTap({ kind: 'action', id: 'cart.qty.change' }, {
                            params: { cartItemId: c.id, delta: 1 },
                            stopPropagation: true,
                            onTrigger: () => changeQty(c.id, 1),
                          })}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div className="h-3" />
      </div>

      {/* 底部结算/管理栏(真机:全选 / 已选·合计 / 结算;无去凑单) */}
      <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 h-14 gap-2">
        <button
          {...bindTap({ kind: 'action', id: 'cart.selectAll.toggle' }, { onTrigger: toggleAll })}
          className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer"
        >
          <Check on={allSelected} />
          <span className="text-[13px] text-[#222222]">全选</span>
        </button>
        <span className="flex-1" />
        {manage ? (
          <>
            <button
              {...bindTap({ kind: 'action', id: 'cart.moveToFav.submit' }, {
                onTrigger: () => { if (selCount) { moveToFav(selectedIds); showToast('已移入收藏'); } },
              })}
              className="text-[13px] rounded-full px-4 py-1.5 border cursor-pointer bg-white"
              style={{ color: VIP.primary, borderColor: VIP.primary }}
            >
              移入收藏
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'cart.delete.submit' }, {
                onTrigger: () => { if (selCount) { deleteItems(selectedIds); showToast('已删除'); } },
              })}
              className="text-[13px] rounded-full px-4 py-1.5 border-none cursor-pointer text-white"
              style={{ background: VIP.ctaBlack }}
            >
              删除
            </button>
          </>
        ) : (
          <>
            <div className="text-right mr-1">
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-[12px] text-[#888888]">已选{selCount}件 合计</span>
                <Price value={total} size="m" />
              </div>
              <div className="text-[11px] text-[#888888]">不含运费</div>
            </div>
            <button
              {...bindTap('cart.checkout-open', { beforeTrigger: doCheckout })}
              className="text-[15px] rounded-full px-7 py-2 border-none cursor-pointer text-white font-semibold"
              style={{ background: VIP.ctaBlack }}
            >
              结算({selCount})
            </button>
          </>
        )}
      </div>

      {/* 分享弹层 */}
      {panel === 'share' && (
        <BottomSheet onClose={() => back()} title="分享购物车" heightClass="max-h-[40%]">
          <div className="grid grid-cols-4 gap-3 px-4 py-4">
            {SHARE_CHANNELS.map((ch) => (
              <button
                key={ch.id}
                {...bindTap({ kind: 'action', id: 'share.channel.select.target' }, {
                  params: { target: ch.id },
                  onTrigger: () => {
                    // 微信/QQ 都走系统分享(ACTION_SEND),由 IntentResolver 决定落到哪个 App
                    if (ch.id === 'wechat' || ch.id === 'qq') {
                      const launched = sharePlainText(shareText, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
                      if (launched) { back(); return; }
                      showToast(NOT_OPEN);
                      return;
                    }
                    if (ch.id === 'link') {
                      ClipboardService.copyText(shareText, 'vipshop');
                      back();
                      showToast('链接已复制到剪贴板');
                      return;
                    }
                    if (ch.id === 'poster') {
                      void (async () => {
                        const dataUrl = makeTextPosterDataUrl(
                          [`购物车 ${cart.length} 件`, ...cart.slice(0, 4).map((c) => itemOf(c.itemId)?.title || c.itemId)],
                          { title: '唯品会购物车' },
                        );
                        const saved = await saveImageToAlbum(dataUrl, {
                          album: 'Saved',
                          fileName: `vipshop_cart_${TimeService.now()}.svg`,
                          mimeType: 'image/svg+xml',
                        });
                        back();
                        showToast(saved ? '海报已保存到系统相册' : '海报保存失败');
                      })();
                    }
                  },
                })}
                className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white"
                  style={{ background: ch.color }}
                >
                  {React.createElement(SHARE_ICONS[ch.icon], { size: 20 })}
                </span>
                <span className="text-[11px] text-[#666666]">{ch.label}</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
