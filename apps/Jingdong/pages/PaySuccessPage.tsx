import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, PriceYuan, showToast } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { IcCheck, IcChevronRight, IcCopy, IcHeadphones, IcClock } from '../res/icons';

const QUICK = ['什么时候发货', '怎么修改订单信息', '修改订单收货信息'];

export function PaySuccessPage() {
  const { bindTap } = useJingdongGestures();
  const [sp] = useSearchParams();
  const orders = useJingdongStore((s) => s.orders);
  const items = useJingdongStore((s) => s.items);
  const addToCart = useJingdongStore((s) => s.addToCart);
  const ensureShopChat = useJingdongStore((s) => s.ensureShopChat);

  const orderId = sp.get('orderId');
  const order = (orderId && orders.find((o) => o.id === orderId)) || orders[0];
  const line = order?.lines[0];
  const chatId = order ? `ch_${order.shopId}` : 'ch_shop_self';
  const recs = items.filter((i) => i.id !== line?.itemId).slice(0, 6);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="付款成功" className="pt-10" />
      <div className="flex-1 overflow-y-auto">
        {/* 已下单状态 */}
        <div className="bg-white mx-3 mt-2 rounded-xl p-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#E1251B] flex items-center justify-center"><IcCheck size={13} className="text-white" /></span>
            <span className="text-[16px] font-semibold text-[#E1251B]">已下单</span>
            <IcChevronRight size={16} className="text-[#CCC] ml-auto" />
          </div>
          <div className="text-[13px] text-[#666] mt-1.5 ml-7">快递运输 · 您提交了订单,请等待系统确认</div>
          {order && (
            <div className="mt-2 ml-7">
              <div className="text-[15px] text-[#1A1A1A]">{order.addressSnapshot.full}</div>
              <div className="text-[12px] text-[#999] mt-0.5">{order.addressSnapshot.name} {order.addressSnapshot.phone}</div>
            </div>
          )}
        </div>

        {/* 订单卡 */}
        {order && line && (
          <div className="bg-white mx-3 mt-2 rounded-xl p-3">
            <div className="flex items-center gap-1.5 mb-2">
              {order.self && <span className="text-[10px] px-1 rounded-sm bg-[#E1251B] text-white">自营</span>}
              <span className="text-[15px] font-medium text-[#1A1A1A]">{order.shopName}</span>
              <IcChevronRight size={14} className="text-[#CCC]" />
            </div>
            <div className="flex gap-2.5">
              <Img src={line.image} className="w-20 h-20 rounded-lg object-cover bg-[#F5F5F5]" alt={line.title} />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between">
                  <div className="text-[13px] leading-[17px] text-[#1A1A1A] line-clamp-2 flex-1">{line.title}</div>
                  <div className="text-right ml-2"><span className="text-[12px] text-[#666]">到手</span><PriceYuan value={line.price} className="text-[#1A1A1A] text-[15px]" /></div>
                </div>
                {line.skuDesc && <div className="text-[11px] text-[#999] mt-0.5">数量 x{line.qty}, {line.skuDesc}</div>}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    {...bindTap({ kind: 'action', id: 'paysuccess.item.addcart' }, { onTrigger: () => { addToCart(line.itemId, 1, line.skuDesc, 'shopping'); showToast('已加入购物车'); } })}
                    className="px-3 h-7 rounded-full border border-[#DDD] text-[13px] text-[#333]"
                  >加购物车</button>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[#F5F5F5] text-[13px]">
              <div className="flex justify-between py-1"><span className="text-[#666]">实付款</span><span className="text-[#E1251B] font-medium">¥{order.paidAmount.toFixed(2)}</span></div>
              <div className="flex justify-between py-1 items-center">
                <span className="text-[#666]">订单编号</span>
                <button
                  {...bindTap({ kind: 'action', id: 'paysuccess.orderno.copy' }, { onTrigger: () => showToast('已复制') })}
                  className="flex items-center text-[#333]"
                >{order.orderNo}<IcCopy size={13} className="ml-1 text-[#999]" /></button>
              </div>
              <div className="flex justify-between py-1"><span className="text-[#666]">支付方式</span><span className="text-[#333]">{order.payMethod}</span></div>
            </div>
            <button
              {...bindTap('paysuccess.detail-open', { params: { orderId: order.id } })}
              className="w-full flex items-center justify-center text-[13px] text-[#999] pt-2"
            >全部订单信息<IcChevronRight size={13} /></button>
          </div>
        )}

        {/* 快速解决问题 */}
        <div className="bg-white mx-3 mt-2 rounded-xl p-3">
          <div className="text-[15px] font-semibold text-[#1A1A1A] mb-2">快速解决问题</div>
          <div className="flex gap-2 overflow-x-auto">
            {QUICK.map((q) => (
              <span key={q} className="shrink-0 px-3 py-2 rounded-lg bg-[#F5F5F5] text-[13px] text-[#333]">{q}</span>
            ))}
          </div>
          <div className="flex mt-3 pt-3 border-t border-[#F5F5F5]">
            <button
              {...bindTap('paysuccess.cs-open', { params: { chatId }, beforeTrigger: () => order && ensureShopChat(order.shopId) })}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <IcHeadphones size={20} className="text-[#666]" />
              <div className="text-left"><div className="text-[14px] text-[#1A1A1A]">店铺客服</div><div className="text-[11px] text-[#999]">商品/活动</div></div>
            </button>
            <button
              {...bindTap('paysuccess.cs-open', { params: { chatId: 'ch_cs' } })}
              className="flex-1 flex items-center justify-center gap-2 border-l border-[#F5F5F5]"
            >
              <IcClock size={20} className="text-[#666]" />
              <div className="text-left"><div className="text-[14px] text-[#1A1A1A]">京东客服</div><div className="text-[11px] text-[#999]">物流/售后/平台</div></div>
            </button>
          </div>
        </div>

        {/* 返回入口:回订单/首页,避免再落到确认页 */}
        <div className="flex gap-3 mx-3 mt-3">
          <button {...bindTap('paysuccess.orders-open')} className="flex-1 h-10 rounded-full border border-[#DDD] text-[14px] text-[#333]">查看订单</button>
          <button {...bindTap('paysuccess.home-open')} className="flex-1 h-10 rounded-full bg-[#E1251B] text-white text-[14px]">返回首页</button>
        </div>

        {/* 你可能还喜欢 */}
        <div className="text-center text-[15px] font-semibold text-[#1A1A1A] py-3">你可能还喜欢</div>
        <div className="grid grid-cols-2 gap-2 px-3 pb-4">
          {recs.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              openBind={bindTap('paysuccess.item-open', { params: { itemId: it.id } })}
              quickBind={bindTap('paysuccess.item-open', { params: { itemId: it.id }, stopPropagation: true })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
