import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, fmtTime, showToast } from '../components/common';
import { RefundReasonSheet } from '../components/RefundReasonSheet';
import { IcBack, IcBell, IcPhone, IcPlus } from '../res/icons';
import { fmt } from '../utils';
import type { OrderStatus } from '../types';
import { useStatusBarBg } from '../statusbar';

const STATUS_TEXT: Record<OrderStatus, string> = {
  unpaid: '待支付',
  preparing: '商家接单中',
  delivering: '配送中',
  delivered: '订单已送达',
  canceled: '已取消',
  refunding: '退款中',
  refunded: '退款成功',
};

const QUICK_QS = ['商品少送', '商品撒漏', '商品没收到'];

/** 智能客服/专属管家页(spec service.agent,证据 IMG_6047,黑金风) */
export default function ServiceAgentPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#1a1030');
  const [sp, setSp] = useSearchParams();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const chats = useTbsgStore((st) => st.chats);
  const sendChat = useTbsgStore((st) => st.sendChat);
  const setRefundDraft = useTbsgStore((st) => st.setRefundDraft);
  const [input, setInput] = useState('');

  const orderId = sp.get('orderId') || orders[0]?.id;
  const order = orders.find((o) => o.id === orderId);
  const shop = shops.find((x) => x.id === order?.shopId);
  const panel = sp.get('panel');
  const msgs = chats['service'] ?? [];
  const count = order?.lines.reduce((a, l) => a + l.qty, 0) ?? 0;

  const quickBtnCls = 'h-10 rounded-lg bg-white text-[15px] text-[#8A5A2A] border border-[#C9A06B] cursor-pointer';

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]" data-status-bar-foreground="light">
      {/* ---------- 黑紫渐变头图 ---------- */}
      <div className="shrink-0 h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a1030 0%,#2d1f4e 100%)' }}>
        <div className="flex items-center h-11 px-2">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-white" />
          </button>
        </div>
        <div className="flex items-center px-4 mt-1">
          <AppImg src="/@app-assets/TaobaoShangou/avatars/agent.jpg" className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-white/20" />
          <div className="ml-3 min-w-0">
            <div className="text-[14px] text-white/90">我是您的专属管家</div>
            <div className="text-[20px] font-bold text-white mt-0.5">极速召唤,一跟到底</div>
            <div className="flex items-center gap-2.5 mt-2">
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'service.human.stub' }, { onTrigger: () => showToast(s.notOpen) })}
                className="h-8 px-3 rounded-full flex items-center gap-1 text-[13px] text-[#3A2A10] font-semibold border-none cursor-pointer"
                style={{ background: 'linear-gradient(90deg,#E8C48A,#C99B62)' }}
              >
                <IcBell size={14} />
                召唤人工管家
              </button>
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'service.call.stub' }, { onTrigger: () => showToast(s.notOpen) })}
                className="flex items-center gap-1 text-[13px] text-white/90 bg-transparent border-none cursor-pointer"
              >
                <IcPhone size={13} />
                客服电话 95188
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 主滚动区:猜你想问 + 聊天流 ---------- */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mx-3 mt-3 bg-white rounded-xl p-3.5">
          <div className="flex items-center">
            <span className="text-[17px] font-bold text-[#1A1A1A]"><span className="text-[#ED6C2C]">猜你</span>想问</span>
            <div className="flex-1" />
            <button
              {...bindTap<HTMLButtonElement>('service.orderpick-open')}
              className="h-8 px-2.5 rounded-lg text-[13px] text-[#ED6C2C] border border-[#F0C9AC] bg-white cursor-pointer"
            >
              咨询其他订单
            </button>
          </div>

          {/* 关联订单卡 */}
          {order && shop && (
            <div
              {...bindTap<HTMLDivElement>('service.order-open', { params: { orderId: order.id } })}
              className="mt-3 rounded-lg bg-[#F7F8FA] p-2.5 flex items-center cursor-pointer"
            >
              <AppImg src={shop.logo} className="w-12 h-12 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0 px-2.5">
                <div className="flex items-center">
                  <span className="flex-1 text-[14px] font-semibold text-[#1A1A1A] truncate">{shop.fullName}</span>
                  <span className="text-[13px] text-[#ED6C2C] shrink-0 ml-2">{STATUS_TEXT[order.status]}</span>
                </div>
                <div className="flex items-center mt-0.5">
                  <span className="flex-1 text-[13px] text-[#666666] truncate">{order.lines[0]?.name}等 {count}件商品</span>
                  <span className="text-[14px] text-[#1A1A1A] font-semibold shrink-0 ml-2">¥{fmt(order.totalPaid)}</span>
                </div>
                <div className="text-[12px] text-[#999999] mt-0.5">{fmtTime(order.createdAt)}</div>
              </div>
            </div>
          )}

          {/* 快捷按钮组 */}
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'service.refund.open' },
                {
                  onTrigger: () => {
                    setRefundDraft({ reason: '', subReason: null });
                    setSp((p) => { p.set('panel', 'refund-reason'); return p; });
                  },
                },
              )}
              className={quickBtnCls}
            >
              申请售后
            </button>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'service.call.stub' }, { onTrigger: () => showToast(s.notOpen) })}
              className={quickBtnCls}
            >
              电话商家
            </button>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'service.call.stub' }, { onTrigger: () => showToast(s.notOpen) })}
              className={`${quickBtnCls} col-span-2`}
            >
              电话骑士
            </button>
            {QUICK_QS.map((q) => (
              <button
                key={q}
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'service.quickq.send' },
                  { params: { q }, onTrigger: () => sendChat('service', q) },
                )}
                className={`${quickBtnCls} col-span-2`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* 聊天流 */}
        <div className="px-3 py-3">
          {msgs.map((m) => (
            <div key={m.id} className={`flex mt-2.5 ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-3 py-2.5 text-[14px] leading-5 rounded-xl ${
                  m.from === 'me' ? 'bg-[#ED6C2C] text-white rounded-tr-sm' : 'bg-white text-[#1A1A1A] rounded-tl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ---------- 底部输入条 ---------- */}
      <div className="shrink-0 bg-white px-3 pt-2 pb-1.5" data-keep-keyboard="true">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-10 rounded-full bg-[#F5F6F7] flex items-center px-3.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="请输入您的问题,建议不要分句哦~"
              className="flex-1 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
            />
          </div>
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'service.human.stub' }, { onTrigger: () => showToast(s.notOpen) })}
            className="w-9 h-9 rounded-full border border-[#DDDDDD] bg-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="更多"
          >
            <IcPlus size={18} className="text-[#1A1A1A]" />
          </button>
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'service.message.send' },
              {
                onTrigger: () => {
                  const t = input.trim();
                  if (!t) return;
                  sendChat('service', t);
                  setInput('');
                },
              },
            )}
            className={`h-9 px-4 rounded-full text-[14px] font-semibold border-none cursor-pointer shrink-0 ${
              input.trim() ? 'bg-[#ED6C2C] text-white' : 'bg-[#F7C4A3] text-white'
            }`}
          >
            {s.sendBtn}
          </button>
        </div>
        <div className="text-center text-[11px] text-[#BBBBBB] mt-1.5">部分内容由AI生成</div>
      </div>

      {/* ---------- 售后原因弹层(复用) ---------- */}
      {panel === 'refund-reason' && order && shop && <RefundReasonSheet order={order} shop={shop} />}
    </div>
  );
}
