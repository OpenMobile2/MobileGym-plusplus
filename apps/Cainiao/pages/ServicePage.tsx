import React, { useEffect, useRef, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import Img from '../components/Img';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtMonthDay, fmtFull } from '../utils/appTime';
import { useI18n } from '../i18n';
import type { ShipOrder } from '../types';

const FAQ_TABS = ['查件', '寄件', '取件'] as const;
type FaqTab = (typeof FAQ_TABS)[number];

const FAQ: Record<FaqTab, Array<{ q: string; a: string }>> = {
  查件: [
    { q: '包裹一直显示运输中怎么办?', a: '物流节点更新可能有延迟,一般24小时内会刷新。也可联系承运快递公司查询。' },
    { q: '陌生包裹如何处理?', a: '可在包裹详情里选择拒收或联系客服核实寄件方;疑似诈骗请勿取件并报警。' },
    { q: '查不到运单号怎么办?', a: '请核对单号是否完整、快递公司是否正确;新寄出包裹可能需2-6小时入库后才可查。' },
  ],
  寄件: [
    { q: '寄件费用怎么算?', a: '按首重+续重计费,可在「寄件收费标准」查看明细;实际以快递员揽收称重为准。' },
    { q: '下单后可以修改地址吗?', a: '快递员揽收前可取消订单后重新下单;揽收后请联系快递员或在线客服协助修改。' },
    { q: '哪些物品不能寄?', a: '易燃易爆、活体、未绝缘锂电池等禁寄。可在「禁寄查询」页输入物品名称快速判定。' },
  ],
  取件: [
    { q: '取件码在哪里看?', a: '首页到站包裹卡、取包裹页和包裹详情都会展示取件码;也可到「查取件码」入口查询。' },
    { q: '一键开柜失败怎么办?', a: '请靠近柜机后重试;仍失败可联系站长现场开柜,或使用柜机屏幕输入取件码。' },
    { q: '代取需要注意什么?', a: '请把取件码发给代取人,并提醒及时关门;贵重物品建议本人领取。' },
  ],
};

function orderSummary(o: ShipOrder): string {
  return [
    `订单 ${o.orderNo}`,
    `状态：${o.status}`,
    `寄件：${o.fromName}（${o.fromCity}）→ 收件：${o.toName}（${o.toCity}）`,
    `物品：${o.itemLabel} · 运费 ¥${o.feeYuan}`,
    `下单时间：${fmtFull(o.placedAtTs)}`,
  ].join('\n');
}

/** 菜鸟服务中心:订单横滑可点 + FAQ/订单对话持久化 */
export default function ServicePage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const orders = useCainiaoStore((s) => s.shipOrders);
  const chat = useCainiaoStore((s) => s.serviceChat);
  const pushServiceChat = useCainiaoStore((s) => s.pushServiceChat);
  const enterModify = useCainiaoStore((s) => s.enterModify);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));
  const [faqTab, setFaqTab] = useState<FaqTab>('查件');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const orderScrollRef = useRef<HTMLDivElement>(null);
  // 阈值后再 capture,保证轻点能点、拖动能滑
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startScroll: number;
    dragging: boolean;
  } | null>(null);
  const suppressClickUntilRef = useRef(0);
  const recent = orders;

  useEffect(() => {
    if (chat.length === 0) return;
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat.length]);

  const askFaq = (item: { q: string; a: string }) => {
    pushServiceChat([
      { role: 'user', text: item.q },
      { role: 'bot', text: item.a },
    ]);
  };

  const selectOrder = (o: ShipOrder) => {
    if (TimeService.realNow() < suppressClickUntilRef.current) return;
    const canModify = o.status === '待上门取件' || o.status === '待投柜' || o.status === '待到店自寄';
    pushServiceChat([
      { role: 'user', text: `咨询订单 ${o.orderNo}` },
      {
        role: 'bot',
        text: `已为你查到该寄件单：\n${orderSummary(o)}\n\n需要我帮你做什么？`,
        orderId: o.id,
        canModify,
      },
    ]);
  };

  const onOrderPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = orderScrollRef.current;
    if (!el) return;
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      dragging: false,
    };
  };
  const onOrderPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = orderScrollRef.current;
    const d = dragRef.current;
    if (!el || !d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    if (!d.dragging && Math.abs(dx) > 8) {
      d.dragging = true;
      el.setPointerCapture(e.pointerId);
    }
    if (d.dragging) {
      el.scrollLeft = d.startScroll - dx;
    }
  };
  const onOrderPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = orderScrollRef.current;
    const d = dragRef.current;
    if (el && d?.pointerId === e.pointerId && d.dragging) {
      try { el.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
      // 拖滑后短时吞 click
      suppressClickUntilRef.current = TimeService.realNow() + 280;
    }
    dragRef.current = null;
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-(--app-c-wash-from) to-(--app-c-wash-to)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="菜鸟服务中心" transparent />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-1 flex items-center px-1">
          <div className="text-[15px] leading-6 text-(--app-c-text-primary)">
            <div className="text-[18px] font-bold text-(--app-c-text-primary)">Hi, 我是菜鸟服务助手</div>
            遇到问题都可以找我哦
          </div>
          <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="ml-auto h-20 w-20 object-contain" />
        </div>

        {/* 近期订单:阈值后才横滑 capture,卡片可点可拖 */}
        <div
          ref={orderScrollRef}
          className="mt-2 flex cursor-grab gap-2 overflow-x-auto pb-1 active:cursor-grabbing"
          data-scroll-container="serviceOrders"
          data-scroll-direction="horizontal"
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          onPointerDown={onOrderPointerDown}
          onPointerMove={onOrderPointerMove}
          onPointerUp={onOrderPointerUp}
          onPointerCancel={onOrderPointerUp}
        >
          {recent.map((o) => (
            <button
              key={o.id}
              type="button"
              {...action('me.service.order.select', () => selectOrder(o), { params: { orderId: o.id } })}
              className="w-[260px] shrink-0 cursor-pointer select-none rounded-2xl border-none bg-(--app-c-card-bg) p-3 text-left"
            >
              <div className="text-[12px] text-(--app-c-text-muted)">订单号 {o.orderNo}</div>
              <div className="mt-1.5 flex items-center justify-between gap-1">
                <span className="truncate text-[15px] font-bold text-(--app-c-text-primary)">{o.fromName}({o.fromCity})</span>
                <span className="shrink-0 text-[12px] text-(--app-c-brand)">{o.status}</span>
                <span className="truncate text-[15px] font-bold text-(--app-c-text-primary)">{o.toName}({o.toCity})</span>
              </div>
              <div className="mt-1 text-[11px] text-(--app-c-text-muted)">
                {fmtMonthDay(o.placedAtTs)} 下单 · {o.status === '已取消' ? '无物流信息' : o.typeLabel}
              </div>
            </button>
          ))}
          <div className="w-8 shrink-0" aria-hidden />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button {...bindTap('me.service.ship.open')} className="cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) py-3.5 text-center text-[14px] font-semibold text-(--app-c-text-primary)">
            重新下单寄件
          </button>
          <button {...bindTap('me.service.pricing.open')} className="cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) py-3.5 text-center text-[14px] font-semibold text-(--app-c-text-primary)">
            寄件收费标准
          </button>
          <button {...action('me.service.misc.wontfixToast', wontfix)} className="cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) py-3.5 text-center text-[14px] font-semibold text-(--app-c-text-primary)">
            快递员联系方式
          </button>
          <button {...action('me.service.misc.wontfixToast', wontfix)} className="cursor-pointer rounded-2xl border-none bg-(--app-c-card-bg) py-3.5 text-center text-[14px] font-semibold text-(--app-c-text-primary)">
            转在线咨询
          </button>
        </div>

        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="text-[16px] font-bold text-(--app-c-text-primary)">常见问题</div>
          <div className="mt-2 flex gap-4 text-[14px]">
            {FAQ_TABS.map((tb) => (
              <button
                key={tb}
                {...action('me.service.faq.select.tab', () => setFaqTab(tb), { params: { value: tb } })}
                className={`cursor-pointer border-none bg-transparent ${faqTab === tb ? 'font-bold text-(--app-c-brand)' : 'text-(--app-c-text-secondary)'}`}
              >
                {tb}
              </button>
            ))}
          </div>
          {FAQ[faqTab].map((item) => (
            <button
              key={item.q}
              {...action('me.service.faq.answer', () => askFaq(item), { params: { q: item.q } })}
              className="block w-full cursor-pointer border-b border-(--app-c-divider) bg-transparent py-2.5 text-left text-[14px] text-(--app-c-text-primary) last:border-b-0"
            >
              {item.q}
            </button>
          ))}
        </div>

        {chat.length > 0 && (
          <div className="mt-4 space-y-2 pb-2" data-service-chat="1">
            {chat.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-(--app-c-brand) px-3 py-2 text-[13px] leading-5 text-white">
                    {m.text}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex items-start gap-2">
                  <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="mt-0.5 h-8 w-8 shrink-0 object-contain" />
                  <div className="min-w-0 max-w-[85%]">
                    <div
                      data-service-bot-msg="1"
                      className="whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-(--app-c-card-bg) px-3 py-2 text-[13px] leading-5 text-(--app-c-text-primary) shadow-sm"
                    >
                      {m.text}
                    </div>
                    {m.orderId && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          {...bindTap('me.service.order.detail.open', { params: { orderId: m.orderId } })}
                          className="cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) px-3 py-1.5 text-[12px] font-semibold text-(--app-c-brand)"
                        >
                          查看详情
                        </button>
                        {m.canModify ? (
                          <button
                            {...bindTap('me.service.order.modify.open', {
                              params: { orderId: m.orderId },
                              beforeTrigger: () => enterModify(m.orderId!),
                            })}
                            className="cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) px-3 py-1.5 text-[12px] font-semibold text-(--app-c-brand)"
                          >
                            修改地址
                          </button>
                        ) : (
                          <button
                            {...action('me.service.order.modify.disabled', () =>
                              showToast('当前订单状态不可修改地址'))}
                            className="cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-3 py-1.5 text-[12px] text-(--app-c-text-muted)"
                          >
                            修改地址
                          </button>
                        )}
                        <button
                          {...action('me.service.misc.wontfixToast', wontfix)}
                          className="cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-3 py-1.5 text-[12px] text-(--app-c-text-primary)"
                        >
                          联系快递员
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ),
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 gap-3 bg-(--app-c-card-bg) px-4 pb-4 pt-2.5">
        <button {...action('me.service.misc.wontfixToast', wontfix)} className="h-11 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)">
          服务进度
        </button>
        <button {...action('me.service.misc.wontfixToast', wontfix)} className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white">
          在线咨询
        </button>
      </div>
    </div>
  );
}
