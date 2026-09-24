import React from 'react';
import type { ActivityResult } from '@/os/types/manifest';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader, ProductImage, Toggle } from '../components/common';
import { IcChevronRight } from '../res/icons';

const PAYS = [
  { key: 'wechat', id: 'order.pay.select.wechat', label: '微信支付', icon: '🟢' },
  { key: 'alipay', id: 'order.pay.select.alipay', label: '支付宝支付', icon: '🔵' },
] as const;

export default function OrderConfirmPage() {
  const s = useStrings();
  const { bindTap, action, go } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  // 立即购买(直购)优先;否则结算购物车勾选项
  const db = st._temp.directBuy;
  const items = (db
    ? [{ productId: db.productId, qty: db.qty, spec: db.spec, checked: true }]
    : st.cart.filter((c) => c.checked)
  ).map((c) => ({ ...c, product: st.products.find((p) => p.id === c.productId)! })).filter((c) => c.product);
  const goods = items.reduce((n, c) => n + c.product.price * c.qty, 0);
  const coinCut = st.order.useCoin && st.coins >= 100 ? 1 : 0;
  const pay = (goods - coinCut).toFixed(2);
  const addr = st.addresses.find((a) => a.isDefault) ?? st.addresses[0];
  const payMethod = st.order.payMethod === 'alipay' ? 'alipay' : 'wechat';
  const [terms, setTerms] = React.useState(false);

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.confirmOrder} />
      <div className="min-h-0 flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <button {...bindTap('order.address.open')} className="flex w-full items-center bg-white p-4 text-left">
          {addr ? (
            <div><div className="text-sm font-semibold text-[#33405C]">{addr.name} {addr.phone}</div><div className="mt-0.5 text-xs text-[#9AA5B1]">{addr.region} {addr.detail}</div></div>
          ) : (
            <div className="text-sm text-[#33405C]">您还没有收货地址,请点击添加</div>
          )}
          <IcChevronRight size={16} color="#C9CDD3" className="ml-auto" />
        </button>

        <div className="mt-2 bg-white p-3">
          {items.map((c) => (
            <div key={c.productId} className="flex gap-3 py-2">
              <ProductImage id={c.productId} label={c.product.title} className="h-16 w-16" />
              <div className="min-w-0 flex-1"><div className="line-clamp-2 text-sm text-[#33405C]">{c.product.title}</div><div className="text-xs text-[#9AA5B1]">{c.spec} × {c.qty}</div></div>
              <div className="text-sm text-[#33405C]">¥{c.product.price.toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div className="mt-2 bg-white px-4">
          <div className="flex items-center justify-between border-b border-[#F4F4F4] py-3 text-sm"><span className="text-[#5B6B85]">商品总价</span><span className="text-[#33405C]">{goods.toFixed(2)}</span></div>
          <div className="flex items-center justify-between border-b border-[#F4F4F4] py-3 text-sm"><span className="text-[#5B6B85]">邮费</span><span className="text-[#33405C]">满35包邮 0.00</span></div>
          <button {...action('order.coupon.open', () => st.showToast('无可用优惠券'))} className="flex w-full items-center justify-between border-b border-[#F4F4F4] py-3 text-sm"><span className="text-[#5B6B85]">优惠券</span><span className="text-[#9AA5B1]">无可用优惠券 ›</span></button>
          <div className="flex items-center justify-between border-b border-[#F4F4F4] py-3 text-sm"><span className="text-[#5B6B85]">铜板购</span><div className="flex items-center gap-2"><span className="text-xs text-[#9AA5B1]">{st.coins >= 100 ? '100铜板可抵扣1元' : `还差 ${100 - st.coins} 铜板`}</span><Toggle on={st.order.useCoin && st.coins >= 100} bind={action('order.coin.toggle', () => st.coins >= 100 ? st.toggleOrderCoin() : st.showToast('铜板不足100，暂不可抵扣'))} /></div></div>
          <div className="flex items-center justify-between py-3 text-sm"><span className="text-[#5B6B85]">立减</span><span className="text-[#F12F2F]">-¥{coinCut.toFixed(2)}</span></div>
        </div>

        <div className="mt-2 flex items-center bg-white px-4 py-3">
          <span className="text-sm text-[#5B6B85]">{s.orderNote}</span>
          <input {...action('order.note.input', () => {}, { params: { value: st.order.note } })} onChange={(e) => st.setOrderNote(e.target.value)} value={st.order.note} placeholder="在这里说明你的要求哦" className="ml-3 flex-1 bg-transparent text-right text-sm outline-none placeholder:text-[#C9CDD3]" />
        </div>

        <div className="mt-2 bg-white px-4">
          <div className="py-2 text-sm text-[#5B6B85]">{s.payMethod}</div>
          {PAYS.map((p) => (
            <button key={p.key} {...action(p.id, () => st.setPayMethod(p.key))} className="flex w-full items-center border-t border-[#F4F4F4] py-3 text-left">
              <span className="mr-2">{p.icon}</span><span className="text-sm text-[#33405C]">{p.label}</span>
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full border" style={{ borderColor: payMethod === p.key ? colors.primary : '#D0D0D0', background: payMethod === p.key ? colors.primary : '#fff', color: '#fff' }}>{payMethod === p.key ? '✓' : ''}</span>
            </button>
          ))}
        </div>

        <button {...action('order.terms.check', () => setTerms((v) => !v))} className="flex w-full items-center gap-2 px-4 py-3 text-xs text-[#9AA5B1]">
          <span className="flex h-4 w-4 items-center justify-center rounded-full border text-white" style={{ background: terms ? colors.primary : '#fff', borderColor: terms ? colors.primary : '#D0D0D0' }}>{terms ? '✓' : ''}</span>我已同意 百词斩用户协议 和 隐私政策
        </button>
        <button {...action('order.pro.system', () => {
          const launched = window.__OS__?.startActivityForResult?.(
            'alipay',
            {
              action: 'ACTION_PAY',
              scheme: 'alipays',
              data: { amount: 9, orderId: 'bcz-order-pro-monthly', merchantName: '百词斩', subject: '百词斩PRO连续包月', source: 'baicizhan' },
            },
            (result: ActivityResult) => { if (result.resultCode === 'OK') st.activatePro('monthly'); },
          );
          if (!launched) toast();
        })} className="mx-4 flex w-[calc(100%-2rem)] items-center rounded-lg bg-[#2A3B7A] px-3 py-2 text-xs text-white">开通PRO会员,本单再省¥23 <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5">3天免费体验</span></button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex items-center bg-white px-4 py-2">
        <div className="text-sm">实付款 <span className="text-lg font-bold text-[#F12F2F]">¥{pay}</span></div>
        {/* Gate4v5:没填收货地址不允许付款 */}
        <button {...action('order.pay.submit', () => {
          if (items.length === 0) { st.showToast('请先选择商品'); return; }
          if (!addr) { st.showToast('请先添加收货地址'); return; }
          if (!terms) { st.showToast('请先同意用户协议和隐私政策'); return; }
          const finish = () => { st.placeOrder(); go('order.pay.success', {}, { mode: 'replace', popTo: '/mall' }); };
          const amount = Number(pay);
          const subject = items[0]?.product.title ?? '百词斩商城';
          if (payMethod === 'alipay') {
            const launched = window.__OS__?.startActivityForResult?.(
              'alipay',
              {
                action: 'ACTION_PAY',
                scheme: 'alipays',
                data: { amount, orderId: `bcz-${items[0]?.productId ?? '0'}`, merchantName: '百词斩', subject, source: 'baicizhan' },
              },
              (result: ActivityResult) => { if (result.resultCode === 'OK') finish(); },
            );
            if (launched) return;
          }
          if (payMethod === 'wechat') {
            const launched = window.__OS__?.startActivityForResult?.(
              'wechat',
              {
                action: 'ACTION_PAY',
                scheme: 'weixin',
                data: { amount, orderId: `bcz-${items[0]?.productId ?? '0'}`, merchantName: '百词斩', subject, source: 'baicizhan' },
              },
              (result: ActivityResult) => { if (result.resultCode === 'OK') finish(); },
            );
            if (launched) return;
          }
          toast();
        })}
          className="ml-auto rounded-full px-10 py-2.5 text-sm font-semibold text-white"
          style={{ background: addr && items.length > 0 && terms ? colors.mallBuy : '#F0B49C' }}>{s.payNow}</button>
      </div>
    </div>
  );
}
