import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan } from '../components/ui';
import { IcNavBack, IcChevronRight, IcCheck, IcMapPin, IcClose } from '../res/icons';
import type { OrderLine } from '../types';

const PAY_METHODS = [
  { key: 'fufei', name: '先享后付', desc: '0元下单,体验满意再付', tag: '立减 ¥0.6', green: true },
  { key: 'jd', name: '京东支付', desc: '招商银行储蓄卡(0612)' },
  { key: 'baitiao', name: '京东白条', desc: '先消费 后还款' },
  { key: 'wechat', name: '微信支付', desc: '支持微信免密' },
];

// 预约送:左列日期、右列时段,均可上下滚动(静态运营数据,避免用到 new Date)
const SCHED_DAYS = ['今天 [周三]', '明天 [周四]', '后天 [周五]', '7月18日 [周六]', '7月19日 [周日]', '7月20日 [周一]'];
const SCHED_TIMES = ['立即送出', '11:10-11:20', '11:20-11:30', '11:30-11:40', '11:40-11:50', '12:00-12:10', '12:10-12:20', '12:30-12:40'];

// 备注·口味偏好(参考真机)
const FLAVORS = ['不吃辣', '少放辣', '多放辣', '不吃蒜', '不吃香菜', '不吃葱'];
// 餐具数量选项
const UTENSIL_OPTIONS = ['无需餐具', '商家按餐量提供', '1份', '2份', '3份', '4份', '5份及以上'];

export function WaimaiConfirmPage() {
  const { bindTap, bindBack, back } = useJingdongGestures();
  const [sp, setSp] = useSearchParams();
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const cart = useJingdongStore((s) => s.cart);
  const addresses = useJingdongStore((s) => s.addresses);
  const selectedAddressId = useJingdongStore((s) => s.selectedAddressId);
  const placeOrder = useJingdongStore((s) => s.placeOrder);

  // 结算只含「本店」真实加购的秒送商品:每家店各自一份购物车(按 shopId 隔离),不跨店混在一起
  const shopIdParam = sp.get('shopId');
  const cartLines = cart.filter((c) => c.channel === 'miaosong' && (!shopIdParam || c.shopId === shopIdParam));
  const fallbackShop = lifeShops.find((s) => s.kind === 'restaurant') ?? lifeShops[0];
  // 无真实加购时兜底展示一家门店的菜品(仅演示,不会走下单)
  const dishLines = cartLines.length
    ? cartLines.map((c) => ({ key: c.key, title: c.title, image: c.image, price: c.price, qty: c.qty }))
    : (fallbackShop?.dishes.slice(0, 2).map((d) => ({ key: d.id, title: d.name, image: d.image, price: d.price, qty: 1 })) ?? []);
  const shopName = cartLines[0]?.shopName ?? fallbackShop?.name ?? '外卖商家';
  const addr = addresses.find((a) => a.id === selectedAddressId) ?? addresses.find((a) => a.isDefault) ?? addresses[0];

  const panel = sp.get('panel');
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery');
  const [timeType, setTimeType] = useState('now'); // now | express | booking
  const [bookedSlot, setBookedSlot] = useState('');
  const [schedDay, setSchedDay] = useState(0);
  const [pay, setPay] = useState('fufei');
  const [remarkText, setRemarkText] = useState('');
  const [utensils, setUtensils] = useState('商家按餐量提供');

  const goodsTotal = dishLines.reduce((t, d) => t + d.price * d.qty, 0);
  const pack = 4;
  // 补贴不超过商品金额,避免小额订单实付被减成 ¥0(打包费始终要付)
  const subsidy = Math.round(Math.min(12, goodsTotal) * 100) / 100;
  const express = timeType === 'express' ? 2.8 : 0;
  const payable = Math.max(0, Math.round((goodsTotal + pack + express - subsidy) * 100) / 100);

  const openTimeSheet = () => setSp((p) => { p.set('panel', 'time'); return p; });
  const openRemark = () => setSp((p) => { p.set('panel', 'remark'); return p; });
  const openUtensils = () => setSp((p) => { p.set('panel', 'utensils'); return p; });
  const pickTime = (time: string) => { setBookedSlot(`${SCHED_DAYS[schedDay]} ${time}`); setTimeType('booking'); back(); };
  const toggleFlavor = (f: string) => {
    setRemarkText((t) => {
      const parts = t ? t.split(/[、,，]/).map((x) => x.trim()).filter(Boolean) : [];
      const next = parts.includes(f) ? parts.filter((x) => x !== f) : [...parts, f];
      return next.join('、').slice(0, 50);
    });
  };
  const flavorOn = (f: string) => remarkText.split(/[、,，]/).map((x) => x.trim()).includes(f);
  const pickUtensils = (v: string) => { setUtensils(v); back(); };

  const submitOrder = () => {
    const payMethod = pay === 'fufei' ? '先享后付' : pay === 'wechat' ? '微信支付' : pay === 'baitiao' ? '京东白条' : '京东支付';
    if (cartLines.length) {
      // 用 keys 让 store 从真实 cart 行建单(门店/商品/自营均取自购物车),并清空这些秒送购物车行
      placeOrder({ keys: cartLines.map((c) => c.key), paidAmount: payable, channel: 'miaosong', payMethod });
    } else {
      const orderLines: OrderLine[] = dishLines.map((d) => ({ itemId: d.key, title: d.title, image: d.image, skuDesc: '', price: d.price, qty: d.qty }));
      placeOrder({ lines: orderLines, shopId: fallbackShop?.id ?? 'shop_self', shopName, self: true, paidAmount: payable, channel: 'miaosong', payMethod });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 头部:配送/自提 tab */}
      <div className="shrink-0 pt-10 bg-white flex items-center px-2">
        <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center shrink-0">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <div className="flex-1 flex justify-center gap-8">
          <button
            {...bindTap({ kind: 'action', id: 'waimaiconfirm.mode.select.pickup' }, { params: { mode: 'delivery' }, onTrigger: () => setMode('delivery') })}
            className={`relative py-2.5 text-[16px] ${mode === 'delivery' ? 'text-[#1A1A1A] font-bold' : 'text-[#999]'}`}
          >
            配送{mode === 'delivery' && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#FF2D2D]" />}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'waimaiconfirm.mode.select.pickup' }, { params: { mode: 'pickup' }, onTrigger: () => setMode('pickup') })}
            className={`relative py-2.5 text-[16px] ${mode === 'pickup' ? 'text-[#1A1A1A] font-bold' : 'text-[#999]'}`}
          >
            自提{mode === 'pickup' && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-[#FF2D2D]" />}
          </button>
        </div>
        <div className="w-8 shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="waimaiconfirm-scroll" data-scroll-direction="vertical">
        {/* 送达时间 + 地址 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <button {...bindTap('waimaiconfirm.address-open')} className="w-full flex items-center gap-2 text-left">
            <IcMapPin size={18} className="text-[#FF2D2D] shrink-0" />
            <div className="flex-1 min-w-0">
              {addr ? (
                <>
                  <div className="text-[15px] font-bold text-[#1A1A1A] truncate">{addr.region} {addr.detail}</div>
                  <div className="text-[12px] text-[#999] mt-0.5">{addr.name} {addr.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</div>
                </>
              ) : (
                <div className="text-[15px] font-bold text-[#FF2D2D]">请选择收货地址</div>
              )}
            </div>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </button>
          {/* 送达时间:立即送/1对1急送/预约送 上下排列(真机版式);预约送点开时间弹层 */}
          <div className="mt-3 pt-3 border-t border-[#F5F5F5] flex flex-col gap-2">
            <button
              {...bindTap({ kind: 'action', id: 'waimaiconfirm.time.select.type' }, { params: { time: 'now' }, onTrigger: () => setTimeType('now') })}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left ${timeType === 'now' ? 'bg-[#FFF1EE] border border-[#FF2D2D]' : 'bg-[#F7F7F7] border border-transparent'}`}
            >
              <div>
                <div className={`text-[14px] font-bold ${timeType === 'now' ? 'text-[#FF2D2D]' : 'text-[#333]'}`}>立即送</div>
                <div className="text-[11px] text-[#999] mt-0.5">预计14:35-14:45送达</div>
              </div>
              {timeType === 'now' && <IcCheck size={18} className="text-[#FF2D2D]" />}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'waimaiconfirm.time.select.type' }, { params: { time: 'express' }, onTrigger: () => setTimeType('express') })}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left ${timeType === 'express' ? 'bg-[#FFF1EE] border border-[#FF2D2D]' : 'bg-[#F7F7F7] border border-transparent'}`}
            >
              <div>
                <div className={`text-[14px] font-bold ${timeType === 'express' ? 'text-[#FF2D2D]' : 'text-[#333]'}`}>1对1急送</div>
                <div className="text-[11px] text-[#999] mt-0.5">预计14:16-14:26送达(快19分钟)</div>
              </div>
              <span className="flex items-center gap-1">
                <span className="text-[12px] text-[#FF2D2D]">¥2.8</span>
                {timeType === 'express' && <IcCheck size={18} className="text-[#FF2D2D]" />}
              </span>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'waimaiconfirm.schedule.show' }, { onTrigger: openTimeSheet })}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-left ${timeType === 'booking' ? 'bg-[#FFF1EE] border border-[#FF2D2D]' : 'bg-[#F7F7F7] border border-transparent'}`}
            >
              <div className={`text-[14px] font-bold ${timeType === 'booking' ? 'text-[#FF2D2D]' : 'text-[#333]'}`}>预约送</div>
              <span className={`flex items-center text-[13px] ${timeType === 'booking' ? 'text-[#FF2D2D]' : 'text-[#999]'}`}>
                {timeType === 'booking' && bookedSlot ? bookedSlot : '选择时间'}<IcChevronRight size={14} className="text-[#CCC]" />
              </span>
            </button>
          </div>
        </div>

        {/* 门店 + 菜品 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <div className="flex items-center gap-1.5 pb-2 border-b border-[#F5F5F5]">
            <span className="text-[10px] text-[#8A6D3B] bg-[#F3E9D6] rounded px-1">外卖</span>
            <span className="text-[15px] font-bold text-[#1A1A1A] truncate flex-1">{shopName}</span>
            <span className="text-[10px] text-[#B8860B] bg-[#FFF4E0] rounded px-1">京东秒送</span>
          </div>
          {dishLines.map((d) => (
            <div key={d.key} className="flex gap-2.5 pt-2.5">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0"><Img src={d.image} className="w-full h-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#1A1A1A] line-clamp-1">{d.title}</div>
                <div className="text-[11px] text-[#999] mt-0.5">×{d.qty}</div>
              </div>
              <div className="text-right">
                <span className="text-[12px] text-[#999]">优惠后 </span><PriceYuan value={d.price} className="text-[#FF2D2D] text-[14px]" />
              </div>
            </div>
          ))}
        </div>

        {/* 金额明细 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3 text-[13px]">
          <Row label="商品金额" value={<PriceYuan value={goodsTotal} className="text-[#1A1A1A] text-[14px]" />} />
          <Row label="打包费" value={<PriceYuan value={pack} className="text-[#1A1A1A] text-[14px]" />} />
          <Row label="运费" value={<span className="text-[#FF2D2D]">已免运费 ¥0</span>} />
          <button {...bindTap('waimaiconfirm.coupon-open')} className="w-full flex items-center justify-between py-1.5">
            <span className="text-[#666]">优惠券 <span className="text-[#FF2D2D]">已享新客补贴2元</span></span>
            <span className="flex items-center"><span className="text-[10px] text-white bg-[#1BA956] rounded px-1 mr-1">超级补贴</span><span className="text-[#FF2D2D]">-¥{subsidy}</span><IcChevronRight size={14} className="text-[#CCC]" /></span>
          </button>
        </div>

        {/* 号码保护 + 备注等 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3">
          <div className="flex items-center justify-between py-3 border-b border-[#F5F5F5]">
            <span className="text-[13px] text-[#333]">号码保护 <span className="text-[#999]">(隐藏收件人真实号码)</span></span>
            <IcCheck size={20} className="text-[#FF2D2D]" />
          </div>
          <button {...bindTap({ kind: 'action', id: 'waimaiconfirm.remark.show' }, { onTrigger: openRemark })} className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] text-left">
            <span className="text-[13px] text-[#333]">备注</span>
            <span className={`flex items-center text-[13px] ${remarkText ? 'text-[#333]' : 'text-[#999]'} max-w-[220px]`}>
              <span className="truncate">{remarkText || '请选择口味偏好'}</span><IcChevronRight size={14} className="text-[#CCC] shrink-0" />
            </span>
          </button>
          <button {...bindTap({ kind: 'action', id: 'waimaiconfirm.utensils.show' }, { onTrigger: openUtensils })} className="w-full flex items-center justify-between py-3 border-b border-[#F5F5F5] text-left">
            <span className="text-[13px] text-[#333]">餐具数量</span>
            <span className="flex items-center text-[13px] text-[#999] max-w-[220px]">
              <span className="truncate">{utensils}</span><IcChevronRight size={14} className="text-[#CCC] shrink-0" />
            </span>
          </button>
          {[['如遇缺货', '缺货时与我电话沟通'], ['发票', '未选择']].map(([a, b], i, arr) => (
            <div key={a} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}>
              <span className="text-[13px] text-[#333]">{a}</span>
              <span className="flex items-center text-[13px] text-[#999]">{b}<IcChevronRight size={14} className="text-[#CCC]" /></span>
            </div>
          ))}
        </div>

        {/* 支付方式 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-3 mb-3">
          {PAY_METHODS.map((m, i, arr) => {
            const active = pay === m.key;
            return (
              <button
                key={m.key}
                {...bindTap({ kind: 'action', id: 'waimaiconfirm.pay.select.method' }, { params: { method: m.key }, onTrigger: () => setPay(m.key) })}
                className={`w-full flex items-center gap-2.5 py-3 text-left ${i < arr.length - 1 ? 'border-b border-[#F5F5F5]' : ''}`}
              >
                <div className={`w-6 h-6 rounded flex items-center justify-center text-white text-[11px] shrink-0 ${m.green ? 'bg-[#22B24C]' : 'bg-[#FF2D2D]'}`}>
                  {m.green ? '享' : '京'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#1A1A1A] flex items-center gap-1">
                    {m.name}
                    {m.tag && <span className="text-[10px] text-[#22B24C] border border-[#22B24C]/40 rounded px-1">{m.tag}</span>}
                  </div>
                  <div className="text-[11px] text-[#999] mt-0.5">{m.desc}</div>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${active ? 'bg-[#FF2D2D] border-[#FF2D2D]' : 'border-[#CCC]'}`}>
                  {active && <IcCheck size={14} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 底部提交 */}
      <div className="shrink-0 bg-white border-t border-[#F0F0F0] flex items-center px-3 py-2 gap-3" data-hide-on-keyboard>
        <div className="flex-1">
          <span className="text-[12px] text-[#333]">应付总额 </span>
          <PriceYuan value={payable} className="text-[#FF2D2D] text-[20px]" />
          <span className="text-[11px] text-[#999] ml-1">共减¥{(goodsTotal + pack - payable).toFixed(0)}</span>
        </div>
        <button
          {...bindTap('waimaiconfirm.pay-submit', { beforeTrigger: submitOrder })}
          className="px-6 h-11 rounded-full bg-[#FF2D2D] text-white flex flex-col items-center justify-center leading-tight"
        >
          {pay === 'fufei' ? (
            <>
              <span className="text-[15px] font-semibold">先享后付</span>
              <span className="text-[10px]">0元下单 15天后再付款</span>
            </>
          ) : (
            <span className="text-[16px] font-semibold">立即支付</span>
          )}
        </button>
      </div>

      {/* 预约送 时间弹层(URL 驱动 ?panel=time):左列日期 + 右列时段,均可上下滚动 */}
      {panel === 'time' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl h-[60%] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-4 pt-4 pb-2">
              <div className="flex-1 text-[17px] font-bold text-[#1A1A1A] text-center">选择预计送达时间</div>
              <button {...bindBack()} aria-label="关闭" className="absolute right-3 w-7 h-7 flex items-center justify-center text-[#999]"><IcClose size={22} /></button>
            </div>
            <div className="mx-4 mb-2 rounded-lg bg-[#FFF7E6] text-[12px] text-[#B8860B] px-3 py-2">因订单距离较远,路程不确定因素多,送达时间可能波动</div>
            <div className="flex-1 flex min-h-0 border-t border-[#F0F0F0]">
              {/* 左:日期列(上下滚动) */}
              <div className="w-[130px] shrink-0 bg-[#F7F7F7] overflow-y-auto no-scrollbar" data-scroll-container="waimaiconfirm-days" data-scroll-direction="vertical">
                {SCHED_DAYS.map((d, i) => (
                  <button
                    key={d}
                    {...bindTap({ kind: 'action', id: 'waimaiconfirm.schedule.select.day' }, { params: { day: String(i) }, onTrigger: () => setSchedDay(i) })}
                    className={`w-full py-4 px-3 text-left text-[14px] ${schedDay === i ? 'bg-white text-[#1A1A1A] font-bold' : 'text-[#666]'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              {/* 右:时段列(上下滚动) */}
              <div className="flex-1 overflow-y-auto" data-scroll-container="waimaiconfirm-times" data-scroll-direction="vertical">
                {SCHED_TIMES.map((t) => {
                  const label = `${SCHED_DAYS[schedDay]} ${t}`;
                  const active = timeType === 'booking' && bookedSlot === label;
                  return (
                    <button
                      key={t}
                      {...bindTap({ kind: 'action', id: 'waimaiconfirm.schedule.select.slot' }, { params: { slot: t }, onTrigger: () => pickTime(t) })}
                      className="w-full flex items-center justify-between py-4 px-4 border-b border-[#F7F7F7] text-left"
                    >
                      <span className={`text-[15px] ${active ? 'text-[#FF2D2D] font-semibold' : 'text-[#333]'}`}>{t}</span>
                      {active && <IcCheck size={18} className="text-[#FF2D2D]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 备注·口味偏好弹层(URL 驱动 ?panel=remark) */}
      {panel === 'remark' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl h-[62%] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-4 pt-4 pb-3">
              <div className="flex-1 text-[17px] font-bold text-[#1A1A1A] text-center">备注</div>
              <button {...bindBack()} aria-label="关闭" className="absolute right-3 w-7 h-7 flex items-center justify-center text-[#999]"><IcClose size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <div className="relative rounded-lg bg-[#F7F7F8] p-3">
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value.slice(0, 50))}
                  placeholder="请选择口味偏好或输入备注"
                  maxLength={50}
                  rows={4}
                  data-action="waimaiconfirm.remark.input"
                  className="w-full min-h-[96px] resize-none bg-transparent text-[14px] text-[#1A1A1A] placeholder:text-[#999] outline-none pr-10"
                />
                <span className="absolute right-3 bottom-2 text-[12px] text-[#BBB] pointer-events-none">{remarkText.length}/50</span>
              </div>
              <div className="text-[15px] font-bold text-[#1A1A1A] mt-5 mb-3">口味偏好</div>
              <div className="flex flex-wrap gap-3">
                {FLAVORS.map((f) => {
                  const on = flavorOn(f);
                  return (
                    <button
                      key={f}
                      {...bindTap({ kind: 'action', id: 'waimaiconfirm.remark.toggle.flavor' }, { params: { flavor: f }, onTrigger: () => toggleFlavor(f) })}
                      className={`px-4 py-2 rounded-md border text-[14px] ${on ? 'border-[#FF2D2D] text-[#FF2D2D] bg-[#FFF1EE]' : 'border-[#DDD] text-[#333]'}`}
                    >
                      {f}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="shrink-0 p-3">
              <button {...bindTap({ kind: 'action', id: 'waimaiconfirm.remark.confirm' }, { onTrigger: () => back() })} className="w-full h-11 rounded-full bg-[#FF2D2D] text-white text-[16px] font-medium">确定</button>
            </div>
          </div>
        </div>
      )}

      {/* 餐具数量弹层 */}
      {panel === 'utensils' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl max-h-[55%] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center px-4 pt-4 pb-3">
              <div className="flex-1 text-[17px] font-bold text-[#1A1A1A] text-center">餐具数量</div>
              <button {...bindBack()} aria-label="关闭" className="absolute right-3 w-7 h-7 flex items-center justify-center text-[#999]"><IcClose size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-4">
              {UTENSIL_OPTIONS.map((opt) => {
                const on = utensils === opt;
                return (
                  <button
                    key={opt}
                    {...bindTap({ kind: 'action', id: 'waimaiconfirm.utensils.select.option' }, { params: { option: opt }, onTrigger: () => pickUtensils(opt) })}
                    className="w-full flex items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className={`text-[15px] ${on ? 'text-[#FF2D2D] font-medium' : 'text-[#1A1A1A]'}`}>{opt}</span>
                    {on ? <IcCheck size={20} className="text-[#FF2D2D]" /> : <span className="w-5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[#666]">{label}</span>
      {value}
    </div>
  );
}
