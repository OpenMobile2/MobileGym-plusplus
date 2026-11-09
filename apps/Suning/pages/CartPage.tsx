import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import HScroll from '../components/HScroll';
import { IcMapPin, IcMessage, IcChevronRight, IcCheck, IcMinus, IcPlus } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf, shopOf } from '../utils/detail';
import {
  shopGroups, selectedTotal, totalQty, hasCouponItem, hasFreeShipping, cartPkGroups, compareProducts, COUPON_TAG,
} from '../utils/cart';
import type { CartItem } from '../types';

/** 勾选圈(橙实心=选中 / 灰描边=未选) */
function Circle({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ${
        on ? 'bg-[var(--app-primary)] text-white' : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-transparent'
      }`}
    >
      <IcCheck size={12} strokeWidth={3} />
    </span>
  );
}

/**
 * 购物车 Tab(spec cart.main,s296~s299 + frame:r1@39.6):
 * ?tab=all|pk 切 Tab、?edit=1 编辑态、?dialog=deleteConfirm 删除确认弹窗(均 URL 驱动)。
 */
export default function CartPage() {
  const { bindTap, action, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'pk' ? 'pk' : 'all';
  const editMode = searchParams.get('edit') === '1' && tab === 'all';
  const dialogOpen = searchParams.get('dialog') === 'deleteConfirm';

  const cartItems = useSuningStore((s) => s.cartItems);
  const addresses = useSuningStore((s) => s.addresses);
  const editSelect = useSuningStore((s) => s._temp.editSelect);
  const showToast = useSuningStore((s) => s.showToast);
  const setTemp = useSuningStore((s) => s.setTemp);
  const toggleCartItem = useSuningStore((s) => s.toggleCartItem);
  const toggleCartShop = useSuningStore((s) => s.toggleCartShop);
  const toggleCartSelectAll = useSuningStore((s) => s.toggleCartSelectAll);
  const setCartQty = useSuningStore((s) => s.setCartQty);
  const moveCartToFollow = useSuningStore((s) => s.moveCartToFollow);
  const removeCartItems = useSuningStore((s) => s.removeCartItems);
  const clearInvalidCartItems = useSuningStore((s) => s.clearInvalidCartItems);
  const beginCheckout = useSuningStore((s) => s.beginCheckout);

  const [qtyOpen, setQtyOpen] = useState<string | null>(null);
  const pkGroups = cartPkGroups(cartItems);
  /** 各品类勾选 ids;缺省=组内全部(便于直接「去对比」) */
  const [pkSelected, setPkSelected] = useState<Record<string, string[]>>({});
  const selectedOf = (cat: string, fallback: string[]) => pkSelected[cat] ?? fallback;
  const togglePk = (cat: string, productId: string, fallback: string[]) => {
    const cur = selectedOf(cat, fallback);
    setPkSelected((m) => ({
      ...m,
      [cat]: cur.includes(productId) ? cur.filter((x) => x !== productId) : [...cur, productId],
    }));
  };

  /** 编辑态用 _temp.editSelect(进出清零重计,s298),浏览态用条目 selected */
  const selectedIds = editMode ? editSelect : cartItems.filter((i) => i.selected).map((i) => i.id);
  const selectedItems = cartItems.filter((i) => selectedIds.includes(i.id));
  const total = selectedTotal(cartItems, selectedIds);
  const selectedQty = totalQty(selectedItems);
  const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;
  const groups = shopGroups(cartItems);

  const setQuery = (patch: Record<string, string | null>) =>
    setSearchParams(
      (p) => {
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) p.delete(k);
          else p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );

  const setEditSelect = (next: string[]) => setTemp({ editSelect: next });

  const toggleItem = (itemId: string) => {
    if (!editMode) {
      toggleCartItem(itemId);
      return;
    }
    setEditSelect(editSelect.includes(itemId) ? editSelect.filter((x) => x !== itemId) : [...editSelect, itemId]);
  };

  const toggleShop = (shopId: string) => {
    if (!editMode) {
      toggleCartShop(shopId);
      return;
    }
    const ids = cartItems.filter((i) => i.shopId === shopId).map((i) => i.id);
    const allOn = ids.every((id) => editSelect.includes(id));
    setEditSelect(allOn ? editSelect.filter((x) => !ids.includes(x)) : [...new Set([...editSelect, ...ids])]);
  };

  const toggleAll = () => {
    if (!editMode) {
      toggleCartSelectAll();
      return;
    }
    setEditSelect(allSelected ? [] : cartItems.map((i) => i.id));
  };

  const stepQty = (it: CartItem, delta: number) => {
    const limit = productOf(it.productId)?.sku?.limitQty ?? 99;
    if (it.qty + delta > limit) {
      showToast(S.toastLimit);
      return;
    }
    setCartQty(it.id, it.qty + delta);
  };

  const doMoveToFollow = () => {
    if (editSelect.length === 0) {
      showToast(S.toastSelectFirst);
      return;
    }
    moveCartToFollow(editSelect);
    showToast(S.toastMovedToFollow);
  };

  const doQuickClean = () => {
    clearInvalidCartItems();
    showToast(S.toastNothingToClean);
  };

  const wontfix = () => showToast(S.toastNotOpen);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  const recommends = SUNING_CONFIG.products
    .filter((p) => !cartItems.some((i) => i.productId === p.id))
    .slice(0, 6);

  const pkProductCount = pkGroups.reduce((n, g) => n + g.productIds.length, 0);
  const checkoutLabel = hasCouponItem(selectedItems) ? S.couponCheckout : S.goCheckout;

  return (
    <div className="relative flex h-full min-w-0 w-full flex-col overflow-hidden bg-[var(--app-bg)]">
      {/* 顶栏:标题 + 定位 + 编辑/完成 + 消息图标 */}
      <div className="flex items-center gap-2 bg-[var(--app-surface)] px-3 pb-2 pt-10">
        <span className="text-[19px] font-bold text-[var(--app-text)]">{S.tabCart}</span>
        {/* 定位「⌾栖霞区」:进地址簿选择模式,选中项成为默认地址,本处文案随之联动 */}
        <button
          {...bindTap('cart.main.address.pick', {
            params: { mode: 'picker' },
            beforeTrigger: () => setTemp({ addressPickTarget: 'default' }),
          })}
          className="flex cursor-pointer items-center gap-0.5 border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
        >
          <IcMapPin size={13} />
          {defaultAddress?.district ?? S.cartLocation}
        </button>
        <span className="min-w-0 flex-1" />
        {tab === 'all' &&
          (editMode ? (
            <button
              {...action('cart.main.editMode.exit', () => setQuery({ edit: null }))}
              className="cursor-pointer border-none bg-transparent p-0 text-[14px] font-bold text-[var(--app-primary)]"
            >
              {S.done}
            </button>
          ) : (
            <button
              {...action('cart.main.editMode.enter', () => {
                setEditSelect([]);
                setQuery({ edit: '1' });
              })}
              className="cursor-pointer border-none bg-transparent p-0 text-[14px] text-[var(--app-text)]"
            >
              {S.edit}
            </button>
          ))}
        {/* 顶栏消息图标 → 消息中心 */}
        <button
          {...bindTap('cart.main.msg.open')}
          className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcMessage size={20} />
        </button>
      </div>

      {/* Tab 行:全部 / PK对比(n) */}
      <div className="flex items-center gap-5 bg-[var(--app-surface)] px-3 pb-1.5">
        {(
          [
            { key: 'all' as const, label: S.cartTabAll, bind: action('cart.main.tab.all', () => setQuery({ tab: 'all' })) },
            {
              key: 'pk' as const,
              label: `${S.cartTabPk}(${pkProductCount})`,
              bind: action('cart.main.tab.pk', () => setQuery({ tab: 'pk', edit: null })),
            },
          ]
        ).map(({ key, label, bind }) => (
          <button
            key={key}
            {...bind}
            className={`relative cursor-pointer border-none bg-transparent px-0 py-1 text-[15px] ${
              tab === key ? 'font-bold text-[var(--app-text)]' : 'text-[var(--app-text-muted)]'
            }`}
          >
            {label}
            {tab === key && <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />}
          </button>
        ))}
      </div>

      {/* overflow-x-hidden:避免竖向滚动父级连带算出可横向滚,抢走 PK 横滑手势 */}
      <div
        className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === 'all' ? (
          <>
            {groups.map(({ shopId, items }) => {
              const shop = shopOf(shopId);
              const shopOn = items.every((i) => selectedIds.includes(i.id));
              const shopFree = items.some((i) => i.freeShipping && selectedIds.includes(i.id));
              return (
                <div key={shopId} className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
                  {/* 店铺行 */}
                  <div className="flex items-center gap-2">
                    <button
                      {...action('cart.main.shop.select.toggle', () => toggleShop(shopId), { params: { shopId } })}
                      className="cursor-pointer border-none bg-transparent p-0"
                    >
                      <Circle on={shopOn} />
                    </button>
                    <button
                      {...bindTap('cart.main.shop.open', { params: { shopId } })}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left"
                    >
                      <span className="h-5 w-5 shrink-0 overflow-hidden rounded-sm bg-[var(--app-c-chip-bg)]">
                        {shop && <Img src={shop.logo} className="h-full w-full object-cover" />}
                      </span>
                      <span className="truncate text-[14px] font-bold text-[var(--app-text)]">{shop?.name}</span>
                      <IcChevronRight size={13} className="shrink-0 text-[var(--app-c-text-muted)]" />
                    </button>
                    {items.some((i) => (i.tags ?? []).includes(COUPON_TAG)) && (
                      <button
                        {...action('cart.main.wontfix.toast', wontfix)}
                        className="shrink-0 cursor-pointer rounded-sm border border-[var(--app-c-danger)] bg-[var(--app-surface)] px-1 text-[10px] leading-4 text-[var(--app-c-danger)]"
                      >
                        {S.couponTag}
                      </button>
                    )}
                    {shopFree && (
                      <span className="shrink-0 rounded-sm bg-[#FFF3E8] px-1 text-[10px] leading-4 text-[var(--app-primary)]">
                        {S.freeShipTag}
                      </span>
                    )}
                  </div>

                  {/* 商品行 */}
                  {items.map((it) => {
                    const p = productOf(it.productId);
                    const on = selectedIds.includes(it.id);
                    const qtyEditing = qtyOpen === it.id;
                    return (
                      <div key={it.id} className="mt-2.5 flex gap-2.5">
                        <button
                          {...action('cart.main.item.select.toggle', () => toggleItem(it.id), { params: { itemId: it.id } })}
                          className="cursor-pointer self-center border-none bg-transparent p-0"
                        >
                          <Circle on={on} />
                        </button>
                        <button
                          {...bindTap('cart.main.detail.open', { params: { productId: it.productId } })}
                          className="h-[86px] w-[86px] shrink-0 cursor-pointer overflow-hidden rounded-lg border-none bg-[var(--app-c-chip-bg)] p-0"
                        >
                          {p && <Img src={p.image} className="h-full w-full object-contain" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            {...bindTap('cart.main.detail.open', { params: { productId: it.productId } })}
                            className="line-clamp-2 w-full cursor-pointer border-none bg-transparent p-0 text-left text-[13px] leading-[18px] text-[var(--app-text)]"
                          >
                            {p?.title}
                          </button>
                          <span className="mt-1 inline-flex max-w-full items-center gap-0.5 truncate rounded bg-[var(--app-c-chip-bg)] px-1.5 py-0.5 text-[11px] text-[var(--app-text-muted)]">
                            {it.skuText}
                          </span>
                          {(it.priceOriginal != null || it.serviceText) && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className="rounded-sm bg-[#FDECE9] px-1 text-[10px] leading-4 text-[var(--app-c-danger)]">
                                {it.priceOriginal != null ? S.promoCoupon5000 : S.promoBank6}
                              </span>
                            </div>
                          )}
                          <div className="mt-1 flex items-end gap-1.5">
                            <span className="text-[16px] font-bold leading-none text-[var(--app-c-danger)]">
                              <span className="text-[11px]">¥</span>
                              {it.price}
                            </span>
                            {it.priceOriginal != null && (
                              <span className="text-[11px] text-[var(--app-c-text-muted)] line-through">¥{it.priceOriginal}</span>
                            )}
                            <span className="min-w-0 flex-1" />
                            {qtyEditing ? (
                              <span className="flex items-center gap-2 rounded bg-[var(--app-c-chip-bg)] px-1.5 py-0.5">
                                <button
                                  {...action('cart.main.item.qty.edit', () => stepQty(it, -1), { params: { itemId: it.id } })}
                                  className={`cursor-pointer border-none bg-transparent p-0 ${it.qty <= 1 ? 'text-[#CCC]' : 'text-[var(--app-text)]'}`}
                                >
                                  <IcMinus size={13} />
                                </button>
                                <span className="min-w-4 text-center text-[13px] text-[var(--app-text)]">{it.qty}</span>
                                <button
                                  {...action('cart.main.item.qty.edit', () => stepQty(it, 1), { params: { itemId: it.id } })}
                                  className="cursor-pointer border-none bg-transparent p-0 text-[var(--app-text)]"
                                >
                                  <IcPlus size={13} />
                                </button>
                              </span>
                            ) : (
                              <button
                                {...action('cart.main.item.qty.edit', () => setQtyOpen(it.id), { params: { itemId: it.id } })}
                                className="cursor-pointer rounded border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-0.5 text-[12px] text-[var(--app-text)]"
                              >
                                x{it.qty}
                              </button>
                            )}
                          </div>
                          {it.subsidyHint && <div className="mt-1 text-[11px] text-[#2B6BD4]">{it.subsidyHint}</div>}
                        </div>
                      </div>
                    );
                  })}

                  {/* 服务行:领券打9折(领券体系放弃 → toast) */}
                  {items.some((i) => i.serviceText) && (
                    <div className="mt-2 flex items-center gap-2 border-t border-[var(--app-border)] pt-2">
                      <span className="min-w-0 flex-1 truncate text-[12px] text-[var(--app-text-muted)]">
                        {items.find((i) => i.serviceText)?.serviceText}
                      </span>
                      <button
                        {...action('cart.main.wontfix.toast', wontfix)}
                        className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-primary)]"
                      >
                        {S.couponDiscount9} &gt;
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {cartItems.length === 0 && <div className="py-16 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.cartEmpty}</div>}
            <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.listEnd}</div>
          </>
        ) : (
          /* PK 对比 Tab:按购物车品类分组(电脑/手机/空调等),同品类可对比 */
          pkGroups.length === 0 ? (
            <div className="mb-2 rounded-xl bg-[var(--app-surface)] px-3 py-10 text-center text-[13px] text-[var(--app-c-text-muted)]">
              {S.toastCompareNeedTwo}
            </div>
          ) : (
            pkGroups.map((group) => {
              const pkProducts = compareProducts(group);
              const picked = selectedOf(group.category, group.productIds);
              return (
                <div key={group.category} className="mb-2 w-full min-w-0 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-[var(--app-text)]">{group.name}</span>
                    {picked.length >= 2 ? (
                      <button
                        {...bindTap('cart.main.compare.open', {
                          params: { groupId: group.category, ids: picked.join(',') },
                        })}
                        className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1 text-[13px] font-bold text-white"
                      >
                        {S.goCompare}
                      </button>
                    ) : (
                      <button disabled className="shrink-0 rounded-full border-none bg-[#F0C9A6] px-4 py-1 text-[13px] font-bold text-white">
                        {S.goCompare}
                      </button>
                    )}
                  </div>
                  <HScroll id={`pk-${group.category}`} className="mt-2 w-full gap-2.5">
                    {pkProducts.map((p) => {
                      const on = picked.includes(p.id);
                      return (
                        <div key={p.id} className="w-[118px] shrink-0 grow-0">
                          <button
                            {...action(
                              'cart.main.pk.select.toggle',
                              () => togglePk(group.category, p.id, group.productIds),
                              { params: { productId: p.id } },
                            )}
                            className="flex w-full cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left"
                          >
                            <Circle on={on} />
                            <span className="truncate text-[11px] text-[var(--app-text-muted)]">{p.brand}</span>
                          </button>
                          <div className="mt-1 aspect-square w-full overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                            <Img src={p.image} className="h-full w-full object-contain" />
                          </div>
                          <div className="mt-1 line-clamp-2 text-[12px] leading-4 text-[var(--app-text)]">{p.title}</div>
                          <div className="mt-0.5 text-[14px] font-bold text-[var(--app-c-danger)]">
                            <span className="text-[10px]">¥</span>
                            {p.price}
                          </div>
                        </div>
                      );
                    })}
                  </HScroll>
                </div>
              );
            })
          )
        )}

        {/* 精选好物双列推荐 */}
        <div className="pb-4">
          <div className="py-2 text-center text-[14px] font-bold text-[var(--app-text)]">{S.pickGoods}</div>
          <div className="grid grid-cols-2 gap-2">
            {recommends.map((p) => (
              <button
                key={p.id}
                {...bindTap('cart.main.recommend.open', { params: { productId: p.id } })}
                className="cursor-pointer overflow-hidden rounded-xl border-none bg-[var(--app-surface)] p-0 text-left"
              >
                <div className="aspect-square w-full bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </div>
                <div className="p-2">
                  <div className="line-clamp-2 text-[12px] leading-4 text-[var(--app-text)]">{p.title}</div>
                  <div className="mt-1 text-[15px] font-bold text-[var(--app-c-danger)]">
                    <span className="text-[10px]">¥</span>
                    {p.price}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底栏:结算栏(base)/ 编辑栏(editMode);PK Tab 无底栏 */}
      {tab === 'all' && (
        <div className="flex shrink-0 items-center gap-2 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2">
          <button
            {...action('cart.main.selectAll.toggle', toggleAll)}
            className="flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[13px] text-[var(--app-text)]"
          >
            <Circle on={allSelected} />
            {S.selectAll}
            {editMode ? `(${selectedIds.length})` : ''}
          </button>
          {editMode ? (
            <>
              <span className="min-w-0 flex-1" />
              <button
                {...action('cart.main.edit.moveToFollow', doMoveToFollow)}
                className="shrink-0 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[13px] text-[var(--app-text)]"
              >
                {S.moveToFollow}
              </button>
              <button
                {...action('cart.main.wontfix.toast', doQuickClean)}
                className="shrink-0 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5 text-[13px] text-[var(--app-text)]"
              >
                {S.quickClean}
              </button>
              {editSelect.length > 0 ? (
                <button
                  {...bindTap('cart.main.deleteConfirm.open')}
                  className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[13px] font-bold text-white"
                >
                  {S.deleteBtn}
                </button>
              ) : (
                /* 无勾选置灰不可点(s298) */
                <button disabled className="shrink-0 rounded-full border-none bg-[var(--app-c-chip-bg)] px-4 py-1.5 text-[13px] font-bold text-[var(--app-c-text-muted)]">
                  {S.deleteBtn}
                </button>
              )}
            </>
          ) : (
            <>
              <div className="min-w-0 flex-1 text-right">
                <div className="text-[13px] text-[var(--app-text)]">
                  {S.totalLabel}
                  <span className="text-[17px] font-bold text-[var(--app-c-danger)]">¥{total}</span>
                </div>
                <div className="text-[11px] text-[var(--app-c-text-muted)]">
                  {S.shippingFee}
                  {hasFreeShipping(selectedItems) ? S.freeShipping : '¥0'}
                </div>
              </div>
              {selectedIds.length > 0 ? (
                <button
                  {...bindTap('cart.main.checkout.open', {
                    params: { itemIds: selectedIds.join(',') },
                    beforeTrigger: () => beginCheckout(selectedIds),
                  })}
                  className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-6 py-2 text-[15px] font-bold text-white"
                >
                  {checkoutLabel}({selectedQty})
                </button>
              ) : (
                <button
                  {...action('cart.main.wontfix.toast', () => showToast(S.toastNoSelection))}
                  className="shrink-0 cursor-pointer rounded-full border-none bg-[#FBC79A] px-6 py-2 text-[15px] font-bold text-white"
                >
                  {S.goCheckout}
                </button>
              )}
            </>
          )}
        </div>
      )}

      {dialogOpen && (
        <DeleteConfirmDialog
          count={editSelect.length}
          onConfirm={() => {
            removeCartItems(editSelect);
            back();
          }}
        />
      )}
    </div>
  );
}

/** ?dialog=deleteConfirm:删除确认弹窗(「取消」= bindBack 关闭) */
function DeleteConfirmDialog({ count, onConfirm }: { count: number; onConfirm: () => void }) {
  const { action, bindBack } = useSuningGestures();
  const S = useStrings();
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[70%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[15px] text-[var(--app-text)]">
          {S.deleteAskHead}
          {count}
          {S.deleteAskTail}
        </div>
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button
            {...bindBack()}
            className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]"
          >
            {S.cancel}
          </button>
          <button
            {...action('cart.main.delete.confirm', onConfirm)}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
