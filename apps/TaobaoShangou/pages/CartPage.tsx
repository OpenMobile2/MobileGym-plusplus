import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import {
  AppImg, CenterDialog, EmptyState, Price, showToast,
} from '../components/common';
import {
  IcDown, IcMinus, IcPlus, IcRight, IcTrash,
} from '../res/icons';
import type { TbCartLine } from '../types';
import { useStatusBarBg } from '../statusbar';

/** 勾选圆框 */
function CheckCircle({ checked }: { checked: boolean }) {
  return (
    <span
      className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 ${
        checked ? 'bg-[#ED6C2C]' : 'border-2 border-[#DDDDDD] bg-white'
      }`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 6.2 5 9l5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      )}
    </span>
  );
}

/** 购物车 tab(spec cart.main,证据 IMG_6031/6052/6053/6066) */
export default function CartPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, back } = useTbsgGestures();
  useStatusBarBg('#ffffff');
  const [sp, setSp] = useSearchParams();

  const cart = useTbsgStore((st) => st.cart);
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const locationPoi = useTbsgStore((st) => st.locationPoi);
  const toggleCartSelect = useTbsgStore((st) => st.toggleCartSelect);
  const toggleCartSelectAll = useTbsgStore((st) => st.toggleCartSelectAll);
  const removeCartLines = useTbsgStore((st) => st.removeCartLines);
  const clearShopCart = useTbsgStore((st) => st.clearShopCart);
  const changeCartQty = useTbsgStore((st) => st.changeCartQty);
  const beginCheckout = useTbsgStore((st) => st.beginCheckout);

  const manage = sp.get('manage') === '1';
  const confirmDel = sp.get('confirm') === 'del';
  const delScope = sp.get('scope'); // 有值=删整店,无值=删勾选行
  /** 展开数量步进器的行(inline 展开,非弹层) */
  const [qtyOpenLine, setQtyOpenLine] = useState<string | null>(null);

  /** 按 shopId 分组(保持加入顺序) */
  const groups = useMemo(() => {
    const m = new Map<string, TbCartLine[]>();
    for (const l of cart) m.set(l.shopId, [...(m.get(l.shopId) ?? []), l]);
    return [...m.entries()];
  }, [cart]);

  const selectedLines = cart.filter((l) => l.selected);
  const selectedCount = selectedLines.reduce((a, l) => a + l.qty, 0);
  const allSelected = cart.length > 0 && cart.every((l) => l.selected);
  const delCount = delScope
    ? (cart.filter((l) => l.shopId === delScope).reduce((a, l) => a + l.qty, 0))
    : selectedCount;

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 顶栏:大标题 + 地址简称∨ + 管理 */}
      <div className="flex items-center px-4 h-12 shrink-0 bg-white">
        <span className="text-[22px] font-bold text-[#1A1A1A]">{s.cartTitle}</span>
        <button
          {...bindTap<HTMLButtonElement>('cart.address-open', { params: { from: 'cart' } })}
          className="ml-2 flex items-center gap-0.5 bg-transparent border-none cursor-pointer min-w-0"
        >
          <span className="text-[14px] font-semibold text-[#1A1A1A] truncate max-w-[140px]">{locationPoi}</span>
          <IcDown size={14} className="text-[#1A1A1A] shrink-0" />
        </button>
        <div className="flex-1" />
        {cart.length > 0 && (
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'cart.manage.toggle' },
              {
                onTrigger: () => setSp((p) => {
                  if (manage) p.delete('manage'); else p.set('manage', '1');
                  return p;
                }, { replace: true }),
              },
            )}
            className="text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer"
          >
            {manage ? s.exitManage : s.manage}
          </button>
        )}
      </div>

      {/* 列表(点击空白处收起并确认数量步进器) */}
      <div
        data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto"
        onClick={() => { if (qtyOpenLine) setQtyOpenLine(null); }}
      >
        {cart.length === 0 ? (
          <EmptyState text={s.cartEmpty} />
        ) : (
          <>
            {groups.map(([shopId, lines]) => {
              const shop = shops.find((x) => x.id === shopId);
              if (!shop) return null;
              const shopChecked = lines.every((l) => l.selected);
              const feeOff = Math.round(shop.deliveryFeeOrig - shop.deliveryFee);
              return (
                <div key={shopId} className="bg-white mb-2 px-3 py-3">
                  {/* 店铺行 */}
                  <div className="flex items-center gap-2">
                    <button
                      {...bindTap<HTMLButtonElement>(
                        { kind: 'action', id: 'cart.item.check' },
                        { params: { lineId: `shop:${shopId}` }, onTrigger: () => toggleCartSelect('', shopId) },
                      )}
                      className="bg-transparent border-none p-0 cursor-pointer"
                      aria-label="勾选店铺"
                    >
                      <CheckCircle checked={shopChecked} />
                    </button>
                    {shop.type === 'restaurant' ? (
                      <button
                        {...bindTap<HTMLButtonElement>('cart.shop-open', { params: { shopId } })}
                        className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer min-w-0 p-0"
                      >
                        <span className="text-[16px] font-bold text-[#1A1A1A] truncate max-w-[180px]">{shop.fullName}</span>
                        <IcRight size={15} className="text-[#999999] shrink-0" />
                      </button>
                    ) : (
                      <span className="text-[16px] font-bold text-[#1A1A1A] truncate max-w-[180px]">{shop.fullName}</span>
                    )}
                    <div className="flex-1" />
                    <span className="text-[13px] text-[#666666] shrink-0">{shop.deliveryMinutes}分钟</span>
                    <button
                      {...bindTap<HTMLButtonElement>(
                        { kind: 'action', id: 'cart.shop.delete' },
                        {
                          params: { shopId },
                          onTrigger: () => setSp((p) => {
                            p.set('confirm', 'del');
                            p.set('scope', shopId);
                            return p;
                          }),
                        },
                      )}
                      className="bg-transparent border-none cursor-pointer p-0.5"
                      aria-label="删除店铺分组"
                    >
                      <IcTrash size={16} className="text-[#999999]" />
                    </button>
                  </div>
                  {/* 满减标签行 */}
                  {(shop.promos.length > 0 || feeOff > 0) && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5 ml-[30px]">
                      {shop.promos.map((p) => (
                        <span key={p.full} className="text-[11px] text-[#EB493B] bg-[#FDECEA] rounded px-1.5 py-0.5">
                          {p.full}减{p.off}
                        </span>
                      ))}
                      {feeOff > 0 && (
                        <span className="text-[11px] text-[#EB493B] bg-[#FDECEA] rounded px-1.5 py-0.5">
                          配送费减{feeOff}
                        </span>
                      )}
                    </div>
                  )}
                  {/* 商品行 */}
                  {lines.map((l) => {
                    const item = items.find((i) => i.id === l.itemId);
                    return (
                      <div key={l.id} className="flex items-center gap-2 mt-3">
                        <button
                          {...bindTap<HTMLButtonElement>(
                            { kind: 'action', id: 'cart.item.check' },
                            { params: { lineId: l.id }, onTrigger: () => toggleCartSelect(l.id) },
                          )}
                          className="bg-transparent border-none p-0 cursor-pointer"
                          aria-label="勾选商品"
                        >
                          <CheckCircle checked={l.selected} />
                        </button>
                        <AppImg src={item?.image ?? ''} className="w-[72px] h-[72px] rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0 self-stretch flex flex-col">
                          <div className="text-[15px] text-[#1A1A1A] font-medium truncate">{item?.name ?? ''}</div>
                          {l.skuDesc && (
                            <div className="text-[12px] text-[#999999] truncate mt-0.5">{l.skuDesc}</div>
                          )}
                          <div className="flex-1" />
                          <div className="flex items-end justify-between">
                            <Price value={l.price} size={17} />
                            {qtyOpenLine === l.id ? (
                              <span className="flex items-center gap-2">
                                <button
                                  {...bindTap<HTMLButtonElement>(
                                    { kind: 'action', id: 'cart.item.qty' },
                                    { params: { lineId: l.id, delta: -1 }, stopPropagation: true, onTrigger: () => changeCartQty(l.id, -1) },
                                  )}
                                  className="w-6 h-6 rounded-full border border-[#ED6C2C] text-[#ED6C2C] bg-white flex items-center justify-center cursor-pointer p-0"
                                  aria-label="减少数量"
                                >
                                  <IcMinus size={13} />
                                </button>
                                <span className="text-[14px] text-[#1A1A1A] min-w-4 text-center">{l.qty}</span>
                                <button
                                  {...bindTap<HTMLButtonElement>(
                                    { kind: 'action', id: 'cart.item.qty' },
                                    { params: { lineId: l.id, delta: 1 }, stopPropagation: true, onTrigger: () => changeCartQty(l.id, 1) },
                                  )}
                                  className="w-6 h-6 rounded-full bg-[#ED6C2C] text-white flex items-center justify-center border-none cursor-pointer p-0"
                                  aria-label="增加数量"
                                >
                                  <IcPlus size={13} />
                                </button>
                              </span>
                            ) : (
                              <button
                                {...bindTap<HTMLButtonElement>(
                                  { kind: 'action', id: 'cart.item.qty' },
                                  { params: { lineId: l.id }, stopPropagation: true, onTrigger: () => setQtyOpenLine(l.id) },
                                )}
                                className="text-[13px] text-[#1A1A1A] bg-[#F3F6F8] rounded px-2 py-1 border-none cursor-pointer"
                              >
                                ×{l.qty}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
            <div className="text-center text-[13px] text-[#999999] py-4">没有更多了</div>
          </>
        )}
      </div>

      {/* 底部条 */}
      {cart.length > 0 && (
        <div className="shrink-0 bg-white px-4 py-2.5 flex items-center gap-2 border-t border-[#EEEEEE]">
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'cart.checkall.toggle' },
              { onTrigger: () => toggleCartSelectAll(!allSelected) },
            )}
            className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0"
          >
            <CheckCircle checked={allSelected} />
            <span className="text-[14px] text-[#1A1A1A]">{s.selectAll}</span>
          </button>
          <div className="flex-1" />
          {manage ? (
            <>
              <span className="text-[13px] text-[#666666]">已选{selectedCount}件商品</span>
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'cart.delete.confirm.open' },
                  {
                    onTrigger: () => setSp((p) => {
                      p.set('confirm', 'del');
                      return p;
                    }),
                  },
                )}
                className="h-10 px-8 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
              >
                {s.delete}
              </button>
            </>
          ) : selectedCount > 0 ? (
            <button
              {...bindTap<HTMLButtonElement>('cart.checkout-open', {
                beforeTrigger: () => beginCheckout(null, 'delivery'),
              })}
              className="h-10 px-6 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
            >
              {s.oneTapCheckout}
            </button>
          ) : (
            <button
              onClick={() => showToast('请先勾选商品')}
              className="h-10 px-6 rounded-full bg-[#F7C4A3] text-white text-[16px] font-semibold border-none cursor-pointer"
            >
              {s.oneTapCheckout}
            </button>
          )}
        </div>
      )}

      {/* 删除确认弹窗(IMG_6066) */}
      {confirmDel && (
        <CenterDialog>
          <div className="text-[17px] font-semibold text-[#1A1A1A] text-center">
            确认将这{delCount}件商品删除?
          </div>
          <div className="flex gap-3 mt-5">
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'cart.delete.cancel' },
                { onTrigger: () => back() },
              )}
              className="flex-1 h-10 rounded-full bg-white border border-[#DDDDDD] text-[15px] text-[#1A1A1A] cursor-pointer"
            >
              {s.cancel}
            </button>
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'cart.delete.confirm' },
                {
                  onTrigger: () => {
                    if (delScope) clearShopCart(delScope);
                    else removeCartLines(selectedLines.map((l) => l.id));
                    back();
                  },
                },
              )}
              className="flex-1 h-10 rounded-full bg-[#ED6C2C] text-white text-[15px] font-semibold border-none cursor-pointer"
            >
              {s.confirm}
            </button>
          </div>
        </CenterDialog>
      )}
    </div>
  );
}
