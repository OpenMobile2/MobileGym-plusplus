import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useXianyuStrings } from '../hooks/useXianyuStrings';
import { ItemImage } from '../components/ItemImage';
import { Price } from '../components/ui';
import { PAY_METHODS } from '../constants';
import { IcClose, IcArrowRight, IcCheck, IcShield } from '../res/icons';

export default function OrderConfirmPage() {
  const [sp] = useSearchParams();
  const { bindTap, bindBack, go } = useXianyuGestures();
  const s = useXianyuStrings();

  const checkout = useXianyuStore((s) => s.checkout);
  const items = useXianyuStore((s) => s.items);
  const addresses = useXianyuStore((s) => s.addresses);
  const beginCheckout = useXianyuStore((s) => s.beginCheckout);
  const setCheckoutPayMethod = useXianyuStore((s) => s.setCheckoutPayMethod);
  const createOrder = useXianyuStore((s) => s.createOrder);

  const paramItem = sp.get('itemId') ?? '';
  useEffect(() => { if (!checkout && paramItem) beginCheckout(paramItem); }, [checkout, paramItem, beginCheckout]);

  const item = items.find((i) => i.id === (checkout?.itemId ?? paramItem));
  const address = addresses.find((a) => a.id === checkout?.addressId);
  if (!item) return <div className="flex flex-col h-full bg-white items-center justify-center text-[#999]">订单信息缺失</div>;

  const payMethod = checkout?.payMethod ?? '支付宝';

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="dark">
      <div className="h-11 flex items-center px-2 shrink-0 bg-app-surface">
        <button {...bindBack()} aria-label="关闭" className="bg-transparent border-none cursor-pointer"><IcClose size={22} className="text-app-text" /></button>
        <div className="flex-1 text-center font-semibold text-[16px] text-app-text">确认订单</div>
        <div className="w-8" />
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="OrderConfirmPage-main" data-scroll-direction="vertical">
        {/* 地址 */}
        <button {...bindTap('order.address-open')} className="bg-app-surface w-full flex items-center gap-2 px-3 py-3 border-none cursor-pointer text-left">
          {address ? (
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-app-text"><span className="font-medium">{address.name}</span> <span className="ml-2 text-app-text-muted">{address.phone.slice(0, 3)}****{address.phone.slice(-4)}</span></div>
              <div className="text-[12px] text-app-text-muted truncate">{address.region.replace(/ /g, '')}{address.detail}</div>
            </div>
          ) : <div className="flex-1 text-[14px] text-(--app-c-price-red)">请选择收货地址</div>}
          <IcArrowRight size={16} className="text-app-text-muted" />
        </button>

        {/* 商品 */}
        <div className="bg-app-surface mt-2 px-3 py-3 flex gap-2">
          <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-16 h-16 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-app-text line-clamp-2">{item.title}</div>
            <div className="text-[11px] text-app-text-muted mt-1">{item.condition}</div>
          </div>
          <Price value={item.price} size={15} />
        </div>

        {/* 配送方式 */}
        <div className="bg-app-surface mt-2 px-3 py-3 flex items-center justify-between text-[13px]">
          <span className="text-app-text-muted">配送方式</span>
          <span className="text-app-text">快递邮寄</span>
        </div>

        {/* 费用 */}
        <div className="bg-app-surface mt-2 px-3 py-2 text-[13px]">
          <div className="flex justify-between py-1"><span className="text-app-text-muted">商品金额</span><span>¥{item.price}</span></div>
          <div className="flex justify-between py-1"><span className="text-app-text-muted">运费</span><span>{item.freeShipping ? s.freeShipping : '¥8'}</span></div>
          <div className="flex justify-between py-1"><span className="text-app-text-muted">平台优惠</span><span className="text-(--app-c-price-red)">-¥0</span></div>
        </div>

        {/* 支付方式 (Q10 支付宝/余额) */}
        <div className="bg-app-surface mt-2 px-3 py-2">
          <div className="text-[13px] text-app-text-muted mb-1">支付方式</div>
          {PAY_METHODS.map((m) => (
            <button
              key={m.id}
              {...bindTap({ kind: 'action', id: 'order.payMethod.select.target' }, { params: { target: m.id }, onTrigger: () => setCheckoutPayMethod(m.label) })}
              className="w-full flex items-center gap-2 py-2.5 bg-transparent border-none cursor-pointer border-b border-(--app-border)"
            >
              <span className="text-[15px]">{m.id === 'alipay' ? '💙' : '🐟'}</span>
              <div className="flex-1 text-left"><div className="text-[14px] text-app-text">{m.label}</div><div className="text-[11px] text-app-text-muted">{m.desc}</div></div>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center ${payMethod === m.label ? 'bg-(--app-c-price-red) text-white' : 'border border-(--app-border)'}`}>{payMethod === m.label && <IcCheck size={14} />}</span>
            </button>
          ))}
          {item.inspected && <div className="flex items-center gap-1 text-[11px] text-(--app-c-success) pt-2"><IcShield size={12} />已开启验货宝,平台质检后发货</div>}
        </div>
      </div>

      {/* 确认购买 */}
      <div className="shrink-0 bg-app-surface border-t border-(--app-border) flex items-center px-3 py-2 gap-2">
        <div className="mr-auto text-[13px] text-app-text">实付 <Price value={item.price} size={18} /></div>
        <button
          {...bindTap('order.pay-open', { onTrigger: () => { createOrder(); go('order.pay-open'); } })}
          className="rounded-full text-white text-[15px] font-semibold px-8 py-2.5 border-none cursor-pointer"
          style={{ background: 'var(--app-c-buy-gradient)' }}
        >{s.btnConfirmBuy}</button>
      </div>
    </div>
  );
}
