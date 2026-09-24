import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { Img, Price, BottomSheet, Stepper, SwipeRow, EmptyState, ShopBadge, usePanel, useToast } from '../components/ui';
import { IcSearch, IcQrCode } from '../res/icons';
import { formatMoney } from '../utils/format';
import type { TbCartItem } from '../types';

/**
 * 购物车(spec: cart.main + sharePanel + pricePanel)
 * - 管理模式走 ?manage=1(uiState)
 * - 左滑按钮组:更多/移入收藏/加入分组/找同款/删除(qa:Q6)
 * - 价格走势:点商品行「明细」(qa:Q7)
 */
export default function CartPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const manage = searchParams.get('manage') === '1';
  const { value: panel, open: openPanel, searchParams: sp } = usePanel();
  const priceItemId = sp.get('item');
  const { bindTap, back, go } = useTaobaoGestures();
  const [toast, showToast] = useToast();

  const cart = useTaobaoStore((s) => s.cart);
  const items = useTaobaoStore((s) => s.items);
  const shops = useTaobaoStore((s) => s.shops);
  const user = useTaobaoStore((s) => s.user);
  const priceAlerts = useTaobaoStore((s) => s.priceAlerts);
  const toggleCartSelect = useTaobaoStore((s) => s.toggleCartSelect);
  const toggleCartShopSelect = useTaobaoStore((s) => s.toggleCartShopSelect);
  const toggleCartSelectAll = useTaobaoStore((s) => s.toggleCartSelectAll);
  const changeCartQty = useTaobaoStore((s) => s.changeCartQty);
  const deleteCartItems = useTaobaoStore((s) => s.deleteCartItems);
  const moveCartToFavorites = useTaobaoStore((s) => s.moveCartToFavorites);
  const setPriceAlert = useTaobaoStore((s) => s.setPriceAlert);
  const beginCheckout = useTaobaoStore((s) => s.beginCheckout);

  const [manageChecked, setManageChecked] = useState<string[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartQuery, setCartQuery] = useState('');

  const itemOf = (c: TbCartItem) => items.find((i) => i.id === c.itemId);
  const groups = useMemo(() => {
    const kw = cartQuery.trim().toLowerCase();
    const visible = kw
      ? cart.filter((c) => itemOf(c)?.title.toLowerCase().includes(kw))
      : cart;
    const m = new Map<string, TbCartItem[]>();
    for (const c of visible) {
      const shopId = itemOf(c)?.shopId ?? 'unknown';
      m.set(shopId, [...(m.get(shopId) ?? []), c]);
    }
    return [...m.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, items, cartQuery]);

  const validSelected = cart.filter((c) => c.selected && !c.invalid);
  const total = validSelected.reduce((s, c) => s + c.price * c.qty, 0);
  const allSelected = cart.filter((c) => !c.invalid).length > 0 &&
    cart.filter((c) => !c.invalid).every((c) => c.selected);
  const priceItem = priceItemId ? items.find((i) => i.id === priceItemId) : undefined;

  const checkout = () => {
    if (validSelected.length === 0) return;
    const first = itemOf(validSelected[0]);
    beginCheckout({
      lines: validSelected.map((c) => {
        const it = itemOf(c);
        return {
          itemId: c.itemId, title: it ? it.title : '', image: it ? it.image : '',
          skuDesc: c.skuDesc, price: c.price, qty: c.qty,
        };
      }),
      shopId: first ? first.shopId : '',
      source: 'cart',
    });
    go('cart.checkout.open');
  };

  const setManage = (on: boolean) => {
    setSearchParams((p) => {
      if (on) p.set('manage', '1');
      else p.delete('manage');
      return p;
    }, { replace: true });
    setManageChecked([]);
  };

  const manageTargets = manage ? manageChecked : validSelected.map((c) => c.id);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      {/* 头部 */}
      <div className="flex items-center px-3 h-11 shrink-0">
        <span className="text-[17px] font-bold">购物车({cart.length})</span>
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'cart.search.open' }, {
            onTrigger: () => { setSearchOpen((v) => !v); if (searchOpen) setCartQuery(''); },
          })}
          className="bg-transparent border-none cursor-pointer mr-4"
        >
          <IcSearch size={18} className="text-[#333333]" />
        </button>
        <span className="text-[13px] text-[#333333] mr-4">对比</span>
        <button
          {...bindTap({ kind: 'action', id: 'cart.manage.toggle' }, { onTrigger: () => setManage(!manage) })}
          className="text-[13px] text-[#333333] bg-transparent border-none cursor-pointer"
        >
          {manage ? '退出管理' : '管理'}
        </button>
      </div>

      {searchOpen && (
        <div className="px-3 pb-1.5 shrink-0">
          <div className="flex items-center bg-white rounded-full h-8 px-3 gap-1.5">
            <IcSearch size={14} className="text-[#999999]" />
            <input
              autoFocus
              value={cartQuery}
              {...bindTap({ kind: 'action', id: 'cart.search.input' }, { onTrigger: () => {} })}
              onChange={(e) => setCartQuery(e.target.value)}
              placeholder="搜索购物车的宝贝"
              className="flex-1 bg-transparent border-none outline-none text-[13px]"
              data-keep-keyboard="true"
            />
            {cartQuery && (
              <button onClick={() => setCartQuery('')} className="bg-transparent border-none cursor-pointer text-[#999999] text-[12px]">x</button>
            )}
          </div>
        </div>
      )}

      {/* 筛选条(铁律①:给明确反馈) */}
      <div className="flex gap-2 px-3 pb-1.5 shrink-0 text-[11px] text-[#666666]">
        {['🎫 消费券', '官方立减', '降价', '分组', '常购'].map((c2) => (
          <span key={c2} className="bg-white rounded-full px-2 py-0.5 cursor-pointer"
            onClick={() => showToast('筛选维度暂未开放')}>{c2}</span>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="cart-list" data-scroll-direction="vertical">
        {cart.length === 0 ? (
          <EmptyState text="购物车还是空的" hint="快去挑选心仪的宝贝吧" />
        ) : (
          groups.map(([shopId, list]) => {
            const shop = shops.find((s) => s.id === shopId);
            const shopAllSelected = list.filter((c) => !c.invalid).every((c) => c.selected);
            return (
              <div key={shopId} className="mx-2.5 mt-2 bg-white rounded-xl overflow-hidden">
                {/* 店铺行 */}
                <div className="flex items-center px-3 pt-2.5 pb-1">
                  <Check
                    checked={shopAllSelected}
                    binding={bindTap({ kind: 'action', id: 'cart.shop.select.toggle' }, {
                      params: { shopId },
                      onTrigger: () => toggleCartShopSelect(shopId),
                    })}
                  />
                  {shop && <ShopBadge badge={shop.badge} />}
                  <span className="text-[14px] font-semibold">{shop ? shop.name : '失效商品'}</span>
                  <span className="text-[#999999] text-[12px] ml-1">›</span>
                </div>
                {list.map((c) => {
                  const it = itemOf(c);
                  if (!it) return null;
                  return (
                    <SwipeRow
                      key={c.id}
                      actionsWidth={200}
                      swipeBinding={bindTap({ kind: 'action', id: 'cart.item.swipeActions' }, {
                        params: { cartItemId: c.id }, onTrigger: () => {},
                      })}
                      actions={
                        <>
                          <SwipeBtn label="更多" color="#8B8B8B" onClick={() => showToast('更多功能开发中')} />
                          <SwipeBtn
                            label="移入收藏"
                            color="#FF8C00"
                            binding={bindTap({ kind: 'action', id: 'cart.item.swipe.moveToFavorites' }, {
                              params: { cartItemId: c.id },
                              onTrigger: () => { moveCartToFavorites([c.id]); showToast('已移入收藏'); },
                            })}
                          />
                          <SwipeBtn
                            label="删除"
                            color="#FF0036"
                            binding={bindTap({ kind: 'action', id: 'cart.item.swipe.delete' }, {
                              params: { cartItemId: c.id },
                              onTrigger: () => deleteCartItems([c.id]),
                            })}
                          />
                        </>
                      }
                    >
                      <div className="flex items-center px-3 py-2.5 gap-2">
                        <Check
                          checked={manage ? manageChecked.includes(c.id) : c.selected}
                          disabled={!manage && c.invalid}
                          binding={bindTap({ kind: 'action', id: 'cart.item.select.toggle' }, {
                            params: { cartItemId: c.id },
                            onTrigger: () => {
                              if (manage) {
                                setManageChecked((m) =>
                                  m.includes(c.id) ? m.filter((x) => x !== c.id) : [...m, c.id]);
                              } else {
                                toggleCartSelect(c.id);
                              }
                            },
                          })}
                        />
                        <div
                          {...bindTap('cart.item-open', { params: { itemId: c.itemId } })}
                          className="flex flex-1 gap-2 cursor-pointer min-w-0"
                        >
                          <div className="relative shrink-0">
                            <Img src={it.image} className={`w-20 h-20 rounded-lg object-cover ${c.invalid ? 'grayscale opacity-60' : ''}`} />
                            {c.invalid && (
                              <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] text-white bg-black/60 rounded-b-lg">款式缺货</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] leading-snug line-clamp-2">{it.title}</div>
                            <div className="text-[11px] text-[#999999] bg-[#F8F8F8] rounded inline-block px-1 mt-1 max-w-full truncate">
                              {c.skuDesc} ▾
                            </div>
                            {c.invalid ? (
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[11px] text-[#999999]">所选款式缺货,请重新选择</span>
                                <span className="text-[12px] text-[#FF5000] border border-[#FF5000] rounded-full px-2">重选</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="flex items-baseline gap-1.5">
                                  <Price value={c.price} size="m" />
                                  <button
                                    {...bindTap({ kind: 'action', id: 'cart.pricePanel.open' }, {
                                      params: { itemId: c.itemId },
                                      onTrigger: () => openPanel('price', { item: c.itemId }),
                                      stopPropagation: true,
                                    })}
                                    className="text-[11px] text-[#999999] bg-transparent border-none cursor-pointer p-0"
                                  >
                                    明细 ▾
                                  </button>
                                </span>
                                <Stepper
                                  value={c.qty}
                                  onChange={(d) => changeCartQty(c.id, d)}
                                  binding={bindTap({ kind: 'action', id: 'cart.item.qty.change' }, {
                                    params: { cartItemId: c.id }, onTrigger: () => {}, stopPropagation: true,
                                  })}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </SwipeRow>
                  );
                })}
              </div>
            );
          })
        )}
        <div className="h-3" />
      </div>

      {/* 底部结算/管理栏 */}
      {cart.length > 0 && (
        <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 h-13 py-2 gap-2">
          <Check
            checked={manage ? manageChecked.length === cart.length : allSelected}
            binding={bindTap({ kind: 'action', id: 'cart.selectAll.toggle' }, {
              onTrigger: () => {
                if (manage) {
                  setManageChecked((m) => (m.length === cart.length ? [] : cart.map((c) => c.id)));
                } else {
                  toggleCartSelectAll();
                }
              },
            })}
          />
          <span className="text-[13px]">全选</span>
          <span className="flex-1" />
          {manage ? (
            <>
              <button
                {...bindTap({ kind: 'action', id: 'cart.share.open' }, { onTrigger: () => openPanel('share') })}
                className="text-[13px] rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5 cursor-pointer"
              >
                分享
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'cart.item.moveToFavorites' }, {
                  onTrigger: () => {
                    if (manageTargets.length) { moveCartToFavorites(manageTargets); setManageChecked([]); showToast('已移入收藏'); }
                  },
                })}
                className="text-[13px] rounded-full border border-[#DDDDDD] bg-white px-3 py-1.5 cursor-pointer"
              >
                移入收藏
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'cart.item.delete' }, {
                  onTrigger: () => {
                    if (manageTargets.length) { deleteCartItems(manageTargets); setManageChecked([]); }
                  },
                })}
                className="text-[13px] rounded-full bg-[#FF0036] text-white px-4 py-1.5 border-none cursor-pointer"
              >
                删除
              </button>
            </>
          ) : (
            <>
              <div className="text-right mr-1">
                <div className="text-[13px]">
                  合计: <Price value={total} size="m" />
                </div>
                {total > 0 && total < 300 && (
                  <div className="text-[10px] text-[#FF5000]">再买¥{formatMoney(300 - total)}享满300减40</div>
                )}
              </div>
              <button
                {...bindTap('cart.checkout.open', { beforeTrigger: checkout, preventDefault: validSelected.length === 0 })}
                disabled={validSelected.length === 0}
                className="rounded-full bg-gradient-to-r from-[#FF7A00] to-[#FF2000] text-white text-[14px] font-medium px-5 py-2 border-none cursor-pointer disabled:opacity-40"
              >
                结算{validSelected.length > 0 ? `(${validSelected.length})` : ''}
              </button>
            </>
          )}
        </div>
      )}

      {/* 分享弹层 */}
      {panel === 'share' && (
        <BottomSheet
          onClose={() => back()}
          title=""
          closeBinding={bindTap({ kind: 'action', id: 'cart.share.close' }, { onTrigger: () => back() })}
        >
          <div className="px-4 pb-2">
            <div className="bg-[#FFF7EC] rounded-xl p-3">
              <div className="text-[14px] font-semibold">{user.nick}的购物车</div>
              <div className="text-[12px] text-[#999999]">分享{manageTargets.length || 1}个宝贝给你</div>
            </div>
            <div className="flex justify-around mt-4">
              {['复制链接', '保存画报', '当面扫码', '微信', 'QQ'].map((c2) => (
                <button
                  key={c2}
                  onClick={() => showToast('仅演示,分享未真实发出')}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <span className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[16px]">
                    {c2 === '当面扫码' ? <IcQrCode size={20} /> : c2[0]}
                  </span>
                  <span className="text-[11px] text-[#666666]">{c2}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-4 mb-1">
              <div className="w-28 h-28 bg-[#F5F5F5] rounded-lg flex items-center justify-center">
                <IcQrCode size={64} className="text-[#333333]" />
              </div>
            </div>
            <div className="text-center text-[11px] text-[#999999]">让好友扫一扫,分享并加他为淘友</div>
          </div>
        </BottomSheet>
      )}

      {/* 价格走势弹层 */}
      {panel === 'price' && priceItem && (
        <BottomSheet onClose={() => back()} title="价格走势">
          <div className="px-4 pb-2">
            <div className="flex gap-2 items-center">
              <Img src={priceItem.image} className="w-12 h-12 rounded-lg" />
              <div className="flex-1 text-[13px] line-clamp-1">{priceItem.title}</div>
            </div>
            <div className="text-center mt-3">
              <Price value={priceItem.price} size="l" />
              <div className="text-[12px] text-[#999999]">商品价格</div>
            </div>
            {/* 近3个月走势(静态绘制) */}
            <svg viewBox="0 0 300 110" className="w-full mt-2">
              <line x1="30" y1="10" x2="30" y2="90" stroke="#EEEEEE" />
              <line x1="30" y1="90" x2="290" y2="90" stroke="#EEEEEE" />
              <path d="M30 40 L290 38" stroke="#FF5000" strokeDasharray="4 3" fill="none" />
              <path d="M30 40 L290 38 L290 90 L30 90 Z" fill="#FF5000" opacity="0.08" />
              <text x="28" y="100" fontSize="9" fill="#999">26-03-10</text>
              <text x="252" y="100" fontSize="9" fill="#999">26-06-10</text>
              <text x="4" y="44" fontSize="9" fill="#999">¥{formatMoney(priceItem.price)}</text>
            </svg>
            <div className="flex items-center justify-between mt-2 mb-1">
              <span className="text-[13px] font-semibold">降价提醒 <span className="text-[11px] text-[#999999] font-normal">商品低于当前价格时提醒</span></span>
              <button
                {...bindTap({ kind: 'action', id: 'cart.priceAlert.set' }, {
                  onTrigger: () => { setPriceAlert(priceItem.id); showToast('已设置降价提醒'); },
                })}
                className={`rounded-full text-[13px] px-4 py-1.5 border-none cursor-pointer ${
                  priceAlerts.includes(priceItem.id)
                    ? 'bg-[#F5F5F5] text-[#999999]'
                    : 'bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white'
                }`}
              >
                {priceAlerts.includes(priceItem.id) ? '已设置' : '🔔 提醒我'}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}

function Check({
  checked, binding, disabled,
}: { checked: boolean; binding?: object; disabled?: boolean }) {
  return (
    <button
      {...(binding ?? {})}
      disabled={disabled}
      className={`w-5 h-5 rounded-full border shrink-0 mr-1 cursor-pointer p-0 ${
        disabled
          ? 'bg-[#F5F5F5] border-[#EEEEEE]'
          : checked
            ? 'bg-[#FF5000] border-[#FF5000] text-white text-[12px] leading-4'
            : 'bg-white border-[#CCCCCC]'
      }`}
    >
      {checked && !disabled ? '✓' : ''}
    </button>
  );
}

function SwipeBtn({
  label, color, onClick, binding,
}: { label: string; color: string; onClick?: () => void; binding?: object }) {
  return (
    <button
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      className="flex-1 h-full text-white text-[12px] border-none cursor-pointer"
      style={{ background: color }}
    >
      {label}
    </button>
  );
}
