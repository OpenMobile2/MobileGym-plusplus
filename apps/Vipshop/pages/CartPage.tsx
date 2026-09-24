import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { Img, Price, Stepper, BottomSheet, usePanel, useToast, NOT_OPEN, VIP } from '../components/ui';
import { CART_CHIPS, SHARE_CHANNELS } from '../constants';
import { IcShare, IcCheck } from '../res/icons';

export default function CartPage() {
  const { bindTap, back } = useVipshopGestures();
  const { value: panel, open: openPanel } = usePanel();
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
  const selectedIds = cart.filter((c) => c.selected).map((c) => c.id);
  const allSelected = cart.length > 0 && cart.every((c) => c.selected);
  const total = cart.filter((c) => c.selected).reduce((s, c) => s + c.price * c.qty, 0);
  const selCount = selectedIds.length;

  const shownCart = activeChips.length === 0
    ? cart
    : cart.filter((c) => c.tags.some((t) => activeChips.includes(t)));

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
      <div className="h-11 shrink-0 bg-white border-b border-[#EEEEEE] flex items-center px-3">
        <span className="text-[16px] font-semibold text-[#222222]">购物车({cart.length})</span>
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'cart.share.open' }, { onTrigger: () => openPanel('share') })}
          className="bg-transparent border-none cursor-pointer mr-3 text-[#222222]"
          aria-label="分享"
        >
          <IcShare size={18} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'cart.manage.toggle' }, { onTrigger: () => setManage((m) => !m) })}
          className="bg-transparent border-none cursor-pointer text-[14px] text-[#222222]"
        >
          {manage ? '完成' : '管理'}
        </button>
      </div>

      {/* 筛选 chips */}
      <div className="shrink-0 bg-white flex gap-2 px-3 py-2 border-b border-[#F5F5F5]">
        {CART_CHIPS.map((chip) => {
          const on = activeChips.includes(chip);
          return (
            <button
              key={chip}
              {...bindTap({ kind: 'action', id: 'cart.filterChips.toggle' }, {
                params: { chip },
                onTrigger: () => setActiveChips((a) => (a.includes(chip) ? a.filter((x) => x !== chip) : [...a, chip])),
              })}
              className="text-[12px] rounded-full px-3 py-1 border cursor-pointer"
              style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#666', borderColor: '#EEE', background: '#fff' }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="cart-list" data-scroll-direction="vertical">
        {shownCart.length === 0 && (
          <div className="text-center text-[13px] text-[#888888] py-16">购物车还是空的,快去逛逛吧~</div>
        )}
        {shownCart.map((c) => {
          const it = itemOf(c.itemId);
          if (!it) return null;
          return (
            <div key={c.id} className="bg-white mt-2 mx-2 rounded-lg p-2.5 flex gap-2.5">
              <button
                {...bindTap({ kind: 'action', id: 'cart.item.select.toggle' }, {
                  params: { cartItemId: c.id },
                  onTrigger: () => toggleSelect(c.id),
                })}
                className="shrink-0 self-center w-5 h-5 rounded-full border flex items-center justify-center bg-white cursor-pointer"
                style={c.selected ? { background: VIP.primary, borderColor: VIP.primary } : { borderColor: '#CCC' }}
                aria-label="勾选"
              >
                {c.selected && <IcCheck size={14} className="text-white" />}
              </button>
              <div {...bindTap('cart.item-open', { params: { id: c.itemId } })} className="cursor-pointer shrink-0">
                <Img src={it.image} className="w-20 h-20 rounded-lg object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div {...bindTap('cart.item-open', { params: { id: c.itemId } })} className="text-[13px] text-[#222222] line-clamp-2 cursor-pointer">{it.title}</div>
                <button
                  {...bindTap('cart.sku-open', { params: { id: c.itemId } })}
                  className="mt-1 text-[11px] text-[#888888] bg-[#F5F5F5] rounded px-1.5 py-0.5 border-none cursor-pointer"
                >
                  {c.skuDesc} ›
                </button>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.tags.map((t) => (
                    <span key={t} className="text-[10px] rounded px-1" style={{ color: VIP.orange, background: '#FFF3E8' }}>{t}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <Price value={c.price} size="m" />
                  <Stepper value={c.qty} onChange={(d) => changeQty(c.id, d)} />
                </div>
              </div>
            </div>
          );
        })}
        <div className="h-3" />
      </div>

      {/* 底部结算/管理栏 */}
      <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 h-14 gap-2">
        <button onClick={toggleAll} className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer">
          <span
            className="w-5 h-5 rounded-full border flex items-center justify-center"
            style={allSelected ? { background: VIP.primary, borderColor: VIP.primary } : { borderColor: '#CCC' }}
          >
            {allSelected && <IcCheck size={14} className="text-white" />}
          </span>
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
              <div className="text-[12px] text-[#888888]">合计</div>
              <Price value={total} size="m" />
            </div>
            <button
              {...bindTap('cart.addon-open')}
              className="text-[13px] rounded-full px-3 py-1.5 border cursor-pointer bg-white"
              style={{ color: VIP.primary, borderColor: VIP.primary }}
            >
              去凑单
            </button>
            <button
              {...bindTap('cart.checkout-open', { beforeTrigger: doCheckout })}
              className="text-[14px] rounded-full px-5 py-2 border-none cursor-pointer text-white font-semibold"
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
                    if (ch.id === 'wechat' || ch.id === 'qq') { showToast(NOT_OPEN); return; }
                    back();
                    showToast(ch.id === 'link' ? '链接已复制' : '海报已生成');
                  },
                })}
                className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
              >
                <span className="w-11 h-11 rounded-full" style={{ background: '#FDECF5' }} />
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
