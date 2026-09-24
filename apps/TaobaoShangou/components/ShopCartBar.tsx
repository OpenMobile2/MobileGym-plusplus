import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { cartSubtotal, fmt, mustPickSatisfied, shopCartLines } from '../utils';
import type { TbShop } from '../types';
import { AppImg, Price, Sheet, showToast } from './common';
import { Stepper } from './Stepper';
import { IcBag, IcDown, IcRight, IcTrash } from '../res/icons';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/**
 * 店铺吸底购物车栏(spec shop.restaurant 底部区,IMG_6012/6018/6019/IMG_R022)
 * 三态:¥N起送(灰) / 差¥N起送(灰) / 未选必选品(浅橙) / 去结算(橙)
 * 上方凑单条:满起送且距下一档满减 <8 元时出现
 */
export function ShopCartBar({
  shop, mode, checkoutBinding,
}: {
  shop: TbShop;
  mode: 'delivery' | 'pickup';
  checkoutBinding: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const [, setSp] = useSearchParams();
  const cart = useTbsgStore((st) => st.cart);
  const lines = shopCartLines({ cart }, shop.id);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = cartSubtotal(lines);
  const mustOk = mustPickSatisfied(shop, lines);

  const nextTier = shop.promos
    .filter((p) => p.full > subtotal)
    .sort((a, b) => a.full - b.full)[0];
  const addonGap = nextTier ? Math.round((nextTier.full - subtotal) * 100) / 100 : 0;
  const showAddon = count > 0 && subtotal >= shop.minOrder && !!nextTier && addonGap < 8;

  const isFreeRetail = shop.type === 'retail' && shop.minOrder <= 29;

  const expandBinding = bindTap<HTMLDivElement>(
    { kind: 'action', id: 'shop.cartbar.expand' },
    { onTrigger: () => setSp((p) => { p.set('panel', 'cartbar'); return p; }) },
  );

  return (
    <div className="shrink-0">
      {/* 凑单条(IMG_R019/R022) */}
      {showAddon && (
        <div
          {...bindTap<HTMLDivElement>(
            { kind: 'action', id: 'shop.addonSheet.open' },
            { onTrigger: () => setSp((p) => { p.set('panel', 'addon'); return p; }) },
          )}
          className="flex items-center justify-between px-4 py-1.5 bg-[#FDEFE6] cursor-pointer"
        >
          <span className="text-[12px] text-[#1A1A1A]">
            {s.addonBarPrefix}<span className="text-[#F53F3F] font-semibold">¥{fmt(addonGap)}</span>
            可减<span className="text-[#F53F3F] font-semibold">¥{fmt(nextTier!.off)}</span>
          </span>
          <span className="text-[12px] text-[#ED6C2C] font-semibold inline-flex items-center">
            去凑单<IcRight size={13} />
          </span>
        </div>
      )}

      {/* 黑色胶囊主栏 */}
      <div className="px-2.5 py-2 bg-transparent">
        <div className="flex items-center bg-[#141414] rounded-full h-[52px] pl-3 pr-1.5">
          <div
            {...(count > 0 ? expandBinding : {})}
            className={`relative shrink-0 w-10 h-10 rounded-full bg-[#2A2A2A] flex items-center justify-center ${count > 0 ? 'cursor-pointer' : ''}`}
          >
            <IcBag size={20} className="text-[#ED6C2C]" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[10px] flex items-center justify-center">
                {count}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 ml-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-white font-bold">
                <span className="text-[12px]">¥</span>
                <span className="text-[20px]">{fmt(subtotal)}</span>
              </span>
              {count > 0 && (
                <span
                  {...bindTap<HTMLSpanElement>(
                    { kind: 'action', id: 'shop.cartbar.expand' },
                    { onTrigger: () => setSp((p) => { p.set('panel', 'cartbar'); return p; }) },
                  )}
                  className="text-[11px] text-white/70 inline-flex items-center cursor-pointer"
                >
                  明细<IcDown size={12} />
                </span>
              )}
            </div>
            <div className="text-[10px] text-white/55 truncate">
              {mode === 'pickup'
                ? '到店自取·免配送费'
                : isFreeRetail
                  ? (subtotal >= 29 ? '已免配送费' : `配送¥${fmt(shop.deliveryFee)}(满29免配送费)`)
                  : (
                    <>
                      {s.deliveryFeeAbout}¥{fmt(shop.deliveryFee)}
                      <span className="line-through ml-1">¥{fmt(shop.deliveryFeeOrig)}</span>
                    </>
                  )}
            </div>
          </div>
          {count === 0 ? (
            <div className="shrink-0 h-10 px-4 rounded-full bg-[#3A3A3A] text-white/60 text-[14px] font-semibold flex items-center">
              ¥{fmt(shop.minOrder)}{s.minOrderSuffix}
            </div>
          ) : subtotal < shop.minOrder ? (
            <div className="shrink-0 h-10 px-4 rounded-full bg-[#3A3A3A] text-white/60 text-[13px] font-semibold flex flex-col items-center justify-center leading-tight">
              <span>差¥{fmt(Math.round((shop.minOrder - subtotal) * 100) / 100)}{s.minOrderSuffix}</span>
            </div>
          ) : !mustOk ? (
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.mustpick.hint' },
                { onTrigger: () => showToast('请先选择必选品(餐具选择)') },
              )}
              className="shrink-0 h-10 px-4 rounded-full bg-[#F7C4A3] text-white text-[14px] font-semibold border-none cursor-pointer"
            >
              {s.mustPickMissing}
            </button>
          ) : (
            <button
              {...checkoutBinding}
              className="shrink-0 h-10 px-5 rounded-full bg-[#ED6C2C] text-white text-[15px] font-bold border-none cursor-pointer"
            >
              {s.checkoutBar}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 购物车明细浮层(?panel=cartbar,由页面渲染;spec shop.restaurant「优惠明细▾」IMG_6018)
 */
export function ShopCartDetailSheet({ shop }: { shop: TbShop }) {
  const { bindTap } = useTbsgGestures();
  const cart = useTbsgStore((st) => st.cart);
  const items = useTbsgStore((st) => st.items);
  const changeCartQty = useTbsgStore((st) => st.changeCartQty);
  const clearShopCart = useTbsgStore((st) => st.clearShopCart);
  const lines = shopCartLines({ cart }, shop.id);
  const count = lines.reduce((a, l) => a + l.qty, 0);

  return (
    <Sheet maxH="62%">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="text-[15px] font-bold text-[#1A1A1A]">
          已选商品<span className="text-[12px] text-[#999999] font-normal ml-2">已选{count}件</span>
        </div>
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'shop.item.minus' },
            { params: { itemId: 'all' }, onTrigger: () => { clearShopCart(shop.id); showToast('已清空购物车'); } },
          )}
          className="inline-flex items-center gap-1 text-[12px] text-[#999999] bg-transparent border-none cursor-pointer"
        >
          <IcTrash size={14} />清空
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="cart-detail" data-scroll-direction="vertical">
        {lines.length === 0 && (
          <div className="py-10 text-center text-[13px] text-[#999999]">购物车空空如也</div>
        )}
        {lines.map((l) => {
          const item = items.find((i) => i.id === l.itemId);
          return (
            <div key={l.id} className="flex items-center gap-3 py-2.5 border-b border-[#EEEEEE] last:border-b-0">
              <AppImg src={item?.image ?? ''} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[#1A1A1A] font-medium truncate">{item?.name ?? l.itemId}</div>
                {l.skuDesc && <div className="text-[11px] text-[#999999] truncate">{l.skuDesc}</div>}
                <div className="mt-0.5"><Price value={l.price} size={15} /></div>
              </div>
              <Stepper
                qty={l.qty}
                addBinding={bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shop.item.add' },
                  { params: { itemId: l.itemId }, onTrigger: () => changeCartQty(l.id, 1) },
                )}
                minusBinding={bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'shop.item.minus' },
                  { params: { itemId: l.itemId }, onTrigger: () => changeCartQty(l.id, -1) },
                )}
              />
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
