import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, EmptyState, showToast } from '../components/ui';
import { IcMinus, IcPlus, IcCheck, IcFilter, IcChevronRight } from '../res/icons';
import type { CartLine } from '../types';
import type { TransitionId } from '../navigation.declaration';

const TABS = [
  { id: 'all', label: '全部' },
  { id: 'shopping', label: '购物' },
  { id: 'miaosong', label: '秒送外卖' },
  { id: 'service', label: '服务' },
];

function CheckDot({ on }: { on: boolean }) {
  return (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${on ? 'bg-[#E1251B]' : 'border border-[#CCC]'}`}>
      {on && <IcCheck size={14} className="text-white" />}
    </span>
  );
}

export function CartPage() {
  const { bindTap } = useJingdongGestures();
  const cart = useJingdongStore((s) => s.cart);
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const toggleCartCheck = useJingdongStore((s) => s.toggleCartCheck);
  const toggleShopCheck = useJingdongStore((s) => s.toggleShopCheck);
  const setCartQty = useJingdongStore((s) => s.setCartQty);
  const toggleSelectAll = useJingdongStore((s) => s.toggleSelectAll);
  const removeCartLine = useJingdongStore((s) => s.removeCartLine);

  const [tab, setTab] = useState('all');
  const [manage, setManage] = useState(false);
  const visible = cart.filter((c) => (tab === 'all' ? true : c.channel === tab));

  // 按店铺分组
  const groups: { shopId: string; shopName: string; self: boolean; channel: CartLine['channel']; lines: typeof cart }[] = [];
  visible.forEach((line) => {
    let g = groups.find((x) => x.shopId === line.shopId);
    if (!g) {
      g = { shopId: line.shopId, shopName: line.shopName, self: line.self, channel: line.channel, lines: [] };
      groups.push(g);
    }
    g.lines.push(line);
  });

  const checkedLines = cart.filter((c) => c.checked);
  const checkedCount = checkedLines.reduce((n, c) => n + c.qty, 0);
  const total = checkedLines.reduce((t, c) => t + c.price * c.qty, 0);
  const allChecked = cart.length > 0 && cart.every((c) => c.checked);
  const miaosongChecked = checkedLines.length > 0 && checkedLines.every((c) => c.channel === 'miaosong');

  const deleteChecked = () => {
    const keys = checkedLines.map((c) => c.key);
    if (!keys.length) return showToast('请先勾选商品');
    keys.forEach((k) => removeCartLine(k));
    showToast(`已删除${keys.length}件商品`);
    setManage(false);
  };

  const shopOpenTransition = (g: (typeof groups)[number]): TransitionId => {
    if (g.channel === 'miaosong') {
      const life = lifeShops.find((s) => s.id === g.shopId);
      return life?.kind === 'restaurant' ? 'cart.restaurant-open' : 'cart.lifeshop-open';
    }
    return 'cart.shop-open';
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部标题 + tabs: pt-10 避开状态栏 */}
      <div className="shrink-0 bg-white pt-10">
        <div className="flex items-center px-3 h-10">
          <span className="text-[18px] font-semibold text-[#1A1A1A]">购物车</span>
          <span className="text-[13px] text-[#999] ml-1">({cart.length})</span>
          <button
            {...bindTap({ kind: 'action', id: 'cart.manage.toggle' }, { onTrigger: () => setManage((v) => !v) })}
            className="ml-auto text-[14px] text-[#333] mr-3"
          >{manage ? '完成' : '管理'}</button>
          <button
            {...bindTap({ kind: 'action', id: 'cart.filter.show' }, { onTrigger: () => showToast('筛选') })}
            className="flex items-center text-[13px] text-[#666]"
          ><IcFilter size={15} className="mr-1" />筛选</button>
        </div>
        <div className="flex items-center px-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'cart.tab.select.channel' }, { onTrigger: () => setTab(t.id) })}
              className={`px-3 py-2 text-[15px] ${tab === t.id ? 'text-[#1A1A1A] font-semibold' : 'text-[#666]'}`}
            >
              {t.label}
              {tab === t.id && <div className="mx-auto mt-1 w-4 h-0.5 rounded bg-[#E1251B]" />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="cart-list" data-scroll-direction="vertical">
        {visible.length === 0 ? (
          <EmptyState text="购物车还是空的" />
        ) : (
          groups.map((g) => {
            const shopAllOn = g.lines.every((l) => l.checked);
            return (
              <div key={g.shopId} className="bg-white mt-2">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#F5F5F5]">
                  <button
                    {...bindTap({ kind: 'action', id: 'cart.shop.check' }, { params: { shopId: g.shopId }, onTrigger: () => toggleShopCheck(g.shopId) })}
                    aria-label="店铺全选"
                    className="shrink-0"
                  >
                    <CheckDot on={shopAllOn} />
                  </button>
                  <button
                    {...bindTap(shopOpenTransition(g), { params: { shopId: g.shopId } })}
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                  >
                    {g.self && <span className="text-[10px] px-1 rounded-sm bg-[#E1251B] text-white shrink-0">自营</span>}
                    <span className="text-[14px] font-medium text-[#1A1A1A] truncate">{g.shopName}</span>
                    <IcChevronRight size={14} className="text-[#CCC] shrink-0" />
                  </button>
                </div>
                {g.lines.map((line) => (
                  <div key={line.key} className="flex gap-2.5 px-3 py-3 border-b border-[#F5F5F5]">
                    <button
                      {...bindTap({ kind: 'action', id: 'cart.item.check' }, { onTrigger: () => toggleCartCheck(line.key) })}
                      aria-label="勾选" className="self-center"
                    ><CheckDot on={line.checked} /></button>
                    <Img src={line.image} className="w-20 h-20 rounded-lg object-cover bg-[#F5F5F5]" alt={line.title} />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="text-[13px] leading-[17px] text-[#1A1A1A] line-clamp-2">{line.title}</div>
                      {line.skuDesc && <div className="text-[11px] text-[#999] bg-[#F7F7F7] rounded px-1.5 py-0.5 self-start mt-1">{line.skuDesc}</div>}
                      <div className="flex items-end justify-between mt-auto">
                        <PriceYuan value={line.price} className="text-[#E1251B] text-[16px]" />
                        {manage ? (
                          <button
                            {...bindTap({ kind: 'action', id: 'cart.item.remove' }, { onTrigger: () => { removeCartLine(line.key); showToast('已删除'); } })}
                            className="px-3 h-7 rounded-full border border-[#E1251B] text-[12px] text-[#E1251B]"
                          >删除</button>
                        ) : (
                          <div className="flex items-center border border-[#EEE] rounded">
                            <button
                              {...bindTap({ kind: 'action', id: 'cart.item.qtystep' }, { onTrigger: () => setCartQty(line.key, -1) })}
                              aria-label="减少" className="w-7 h-7 flex items-center justify-center"
                            ><IcMinus size={13} className="text-[#666]" /></button>
                            <span className="w-8 text-center text-[13px]">{line.qty}</span>
                            <button
                              {...bindTap({ kind: 'action', id: 'cart.item.qtystep' }, { onTrigger: () => setCartQty(line.key, 1) })}
                              aria-label="增加" className="w-7 h-7 flex items-center justify-center"
                            ><IcPlus size={13} className="text-[#666]" /></button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}

        {/* 凑单入口 */}
        <button
          {...bindTap('cart.addon-open', { params: { q: '凑单换购' } })}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between text-[13px] text-[#333]"
        >
          <span>去换购 · 凑单享优惠</span>
          <IcChevronRight size={15} className="text-[#CCC]" />
        </button>
      </div>

      {/* 底部结算栏 */}
      <div className="shrink-0 flex items-center gap-2 px-3 h-14 bg-white border-t border-[#EEE]">
        <button
          {...bindTap({ kind: 'action', id: 'cart.selectall.toggle' }, { onTrigger: () => toggleSelectAll(!allChecked) })}
          className="flex items-center gap-1.5 text-[13px] text-[#333]"
        >
          <CheckDot on={allChecked} />全选
        </button>
        {manage ? (
          <button
            {...bindTap({ kind: 'action', id: 'cart.item.remove' }, { onTrigger: deleteChecked })}
            className="ml-auto rounded-full border border-[#E1251B] text-[#E1251B] text-[15px] font-medium px-6 h-9"
          >删除所选</button>
        ) : (
          <>
            <div className="ml-auto text-right">
              <div className="text-[12px] text-[#666]">合计 <PriceYuan value={total} className="text-[#E1251B] text-[18px]" /></div>
            </div>
            {miaosongChecked ? (
              <button
                {...bindTap('cart.checkout-miaosong', { params: { shopId: checkedLines[0].shopId } })}
                className="rounded-full bg-[#E1251B] text-white text-[15px] font-medium px-6 h-9 flex items-center"
              >去结算({checkedCount})</button>
            ) : (
              <button
                {...bindTap('cart.checkout-open')}
                className="rounded-full bg-[#E1251B] text-white text-[15px] font-medium px-6 h-9 flex items-center"
              >去结算({checkedCount})</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
