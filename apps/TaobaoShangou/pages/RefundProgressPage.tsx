import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, EmptyState, TopBar, fmtDate, showToast } from '../components/common';
import { IcPhone, IcRight } from '../res/icons';
import { cents, fmt, yuan } from '../utils';

/** 圆圈问号(装饰,不可点) */
const QMark = () => (
  <span className="w-4 h-4 rounded-full border border-[#CCCCCC] text-[#999999] text-[10px] inline-flex items-center justify-center shrink-0">?</span>
);

/** 退款进度页(spec order.refundProgress,证据 IMG_6070) */
export default function RefundProgressPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, back } = useTbsgGestures();
  const { orderId } = useParams<{ orderId: string }>();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const withdrawRefund = useTbsgStore((st) => st.withdrawRefund);
  const [timelineExpand, setTimelineExpand] = useState(false);

  const order = orders.find((o) => o.id === orderId);
  const refund = order?.refund;
  const shop = shops.find((x) => x.id === order?.shopId);

  if (!order || !refund) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <TopBar title={s.refundProgress} />
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const lastTs = refund.timeline[refund.timeline.length - 1]?.[1] ?? order.statusChangedAt;
  const linesTotal = yuan(order.lines.reduce((a, l) => a + cents(l.price) * l.qty, 0));
  const shownTimeline = timelineExpand ? refund.timeline : refund.timeline.slice(-2);
  const isRetail = shop?.type === 'retail';

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title={s.refundProgress} titleLeft />

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* ---------- 状态区 ---------- */}
        <div className="bg-white px-4 pt-2 pb-5">
          {refund.status === 'processing' ? (
            <>
              <div className="text-[26px] font-bold text-[#1A1A1A]">商家处理中</div>
              <div className="text-[13px] text-[#999999] mt-1.5 leading-5">商家将尽快处理,超时将自动退款</div>
            </>
          ) : (
            <>
              <div className="text-[26px] font-bold text-[#1A1A1A]">打款成功</div>
              <div className="text-[13px] text-[#999999] mt-1.5 leading-5">
                「支付宝」已在「{fmtDate(lastTs)}」前将「¥{refund.amount.toFixed(2)}」入账至您的原支付账户,您可至「支付宝,依次点击我的→账单」查询退款进度,如有疑问可咨询「支付宝,客服电话95188转1」
              </div>
            </>
          )}

          {/* 退款金额 */}
          <div className="flex items-center mt-5">
            <span className="text-[15px] text-[#1A1A1A]">退款金额</span>
            <div className="flex-1" />
            <span className="text-[17px] font-bold text-[#1A1A1A] mr-1.5">¥{fmt(refund.amount)}</span>
            <QMark />
          </div>

          {/* 退回红包 */}
          {refund.couponsBack > 0 && (
            <div className="mt-4">
              <div className="flex items-center">
                <span className="text-[15px] text-[#1A1A1A]">退回红包</span>
                <div className="flex-1" />
                <span className="text-[15px] text-[#1A1A1A]">{refund.couponsBack}个</span>
              </div>
              <button
                {...bindTap<HTMLButtonElement>('refund.progress.wallet-open')}
                className="flex items-center mt-1 text-[13px] text-[#999999] bg-transparent border-none cursor-pointer p-0"
              >
                已退红包可去我的红包查看
                <IcRight size={14} className="text-[#999999]" />
              </button>
            </div>
          )}

          {/* 退款账户 */}
          <div className="flex items-center mt-4">
            <span className="text-[15px] text-[#1A1A1A]">退款账户</span>
            <div className="flex-1" />
            <span className="text-[15px] text-[#1A1A1A]">支付宝</span>
          </div>

          {/* 致电商家 */}
          <div className="flex justify-center mt-6">
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'refund.progress.call.stub' }, { onTrigger: () => showToast(s.notOpen) })}
              className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
            >
              <span className="w-11 h-11 rounded-full border border-[#EEEEEE] flex items-center justify-center">
                <IcPhone size={18} className="text-[#1A1A1A]" />
              </span>
              <span className="text-[14px] text-[#1A1A1A]">致电商家</span>
            </button>
          </div>
        </div>

        {/* ---------- 退款流程 ---------- */}
        <div className="bg-white px-4 py-3.5 mt-2">
          <div className="flex items-center">
            <span className="text-[17px] font-bold text-[#1A1A1A]">退款流程</span>
            <div className="flex-1" />
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'refund.progress.timeline.expand' },
                { onTrigger: () => setTimelineExpand((v) => !v) },
              )}
              className="flex items-center text-[13px] text-[#999999] bg-transparent border-none cursor-pointer p-0"
            >
              查看详细流程
              <IcRight size={14} className="text-[#999999]" />
            </button>
          </div>

          <div className="mt-3">
            {shownTimeline.map(([txt, ts], i) => {
              const isLast = i === shownTimeline.length - 1;
              return (
                <div key={i} className="flex items-stretch">
                  <div className="flex flex-col items-center mr-3 w-4">
                    <span
                      className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 ${
                        isLast ? 'bg-[#ED6C2C]' : 'bg-white border-2 border-[#CCCCCC]'
                      }`}
                    />
                    {!isLast && <span className="w-px flex-1 bg-[#F0C9AC] my-0.5" />}
                  </div>
                  <div className={`flex-1 flex items-start justify-between ${isLast ? '' : 'pb-5'}`}>
                    <span className={`text-[15px] ${isLast ? 'text-[#ED6C2C] font-bold' : 'text-[#1A1A1A]'}`}>{txt}</span>
                    <span className="text-[13px] text-[#999999]">{fmtDate(ts)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {refund.status === 'processing' && (
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'refund.progress.withdraw' },
                {
                  onTrigger: () => {
                    withdrawRefund(order.id);
                    showToast('已撤销申请');
                    back();
                  },
                },
              )}
              className="w-full h-10 mt-4 rounded-full bg-white text-[#1A1A1A] text-[15px] border border-[#DDDDDD] cursor-pointer"
            >
              撤销申请
            </button>
          )}
        </div>

        {/* ---------- 退款信息 ---------- */}
        <div className="bg-white px-4 py-3.5 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-[17px] font-bold text-[#1A1A1A]">退款信息</span>
            <span className="flex items-center gap-1 text-[13px] text-[#999999]">
              退款规则
              <QMark />
            </span>
          </div>

          {order.lines.map((l, i) => (
            <div key={i} className="flex items-start mt-3.5">
              <AppImg src={l.image} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0 px-2.5">
                <div className="text-[14px] text-[#1A1A1A] leading-5 line-clamp-2">{l.name}</div>
                {isRetail && (
                  <span className="inline-block mt-1 text-[11px] text-[#EB493B] border border-[#F5B8B2] rounded px-1 py-px">
                    7天无理由退换
                  </span>
                )}
                <div className="text-[12px] text-[#999999] mt-1">× {l.qty}</div>
              </div>
              <div className="text-[14px] text-[#1A1A1A] shrink-0">
                实付 <span className="font-bold">¥{fmt(l.price)}</span>
              </div>
            </div>
          ))}

          <div className="flex items-center mt-4 pt-3 border-t border-[#EEEEEE]">
            <span className="text-[15px] text-[#1A1A1A]">退款商品总价</span>
            <div className="flex-1" />
            <span className="text-[15px] font-bold text-[#1A1A1A]">¥{fmt(linesTotal)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
