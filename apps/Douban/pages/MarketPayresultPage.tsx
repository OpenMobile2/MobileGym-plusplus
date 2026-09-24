import React, { useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C } from '../components/ui';
import { payWithSystem } from '../capabilities';

// 节点: market.payResult (P0, qa:Q7=C) —— 支付验证/结果。
// 设计:三态(验证/失败/成功)全部为顶栏下方的 inline 内容,不用任何 absolute 全屏浮层,
// 顶栏 ‹ 返回键永远在最上、永远可点 —— 彻底杜绝「卡在支付页无法返回」。
// 验证~2s → payVerifyFail;失败→重新支付 repayOrder→成功→待发货;成功/失败都有明确的「查看订单」出口。

export default function MarketPayresultPage() {
  const { bindTap, bindBack } = useDoubanGestures();
  const routeParams = useParams();
  const orderId = routeParams.orderId ?? 'o1';

  const toast = useDoubanStore((s) => s.toast);
  const payFlow = useDoubanStore((s) => s.payFlow);
  const payVerifyFail = useDoubanStore((s) => s.payVerifyFail);
  const repayOrder = useDoubanStore((s) => s.repayOrder);
  const orders = useDoubanStore((s) => s.orders);

  const stage = payFlow.stage;

  // 验证计时(~2s):verifying → failed
  const firedRef = useRef(false);
  useEffect(() => {
    if (stage !== 'verifying') return;
    firedRef.current = false;
    const started = TimeService.realNow();
    const t = setInterval(() => {
      if (!firedRef.current && TimeService.realNow() - started >= 2000) {
        firedRef.current = true;
        payVerifyFail();
      }
    }, 200);
    return () => clearInterval(t);
  }, [stage, payVerifyFail]);

  const repay = () => {
    const order = orders.find((item) => item.id === orderId);
    const launched = payWithSystem(
      { amount: order?.amount ?? 0, orderId, subject: '豆瓣市集订单' },
      (result) => {
        if (result.resultCode !== 'OK') return;
        repayOrder(orderId);
        toast('支付成功');
      },
    );
    if (!launched) toast('无法打开系统支付');
  };

  const green = '#00B51D';

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:‹ 返回键永远可点(inline 布局,无浮层遮挡) */}
      <div className="flex items-center h-11 px-1 shrink-0 border-b" style={{ background: C.surface, borderColor: C.border }}>
        <button
          {...bindBack()}
          className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="返回"
        >
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>支付</div>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col items-center px-8 pt-16" data-scroll-container="main" data-scroll-direction="vertical">
        {stage === 'verifying' && (
          <div
            className="flex flex-col items-center"
            {...bindTap({ kind: 'action', id: 'market.payResult.verify.fail' }, { onTrigger: () => payVerifyFail() })}
          >
            <div className="w-12 h-12 rounded-full border-4 animate-spin" style={{ borderColor: '#E5E7EB', borderTopColor: green }} />
            <div className="mt-5 text-sm" style={{ color: C.sub }}>正在验证支付状态…</div>
          </div>
        )}

        {stage === 'success' && (
          <>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={green} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12.5l2.5 2.5L16 9.5" />
            </svg>
            <div className="mt-4 text-lg font-semibold" style={{ color: C.text }}>支付成功</div>
            <div className="mt-1 text-sm" style={{ color: C.sub }}>订单已进入「待发货」</div>
            <button
              {...bindTap('market.payResult.orders-open')}
              className="mt-10 h-11 w-full max-w-xs rounded-full text-sm text-white border-none cursor-pointer"
              style={{ background: green }}
            >
              查看我的订单
            </button>
          </>
        )}

        {(stage === 'failed' || stage === 'idle') && (
          <>
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#E0674E" strokeWidth="1.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6M12 16.5v.5" />
            </svg>
            <div className="mt-4 text-lg font-semibold" style={{ color: C.text }}>支付遇到问题</div>
            <div className="mt-1 text-sm text-center" style={{ color: C.sub }}>
              支付未能完成,你可以重新支付,或稍后在「我的订单」中付款。
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'market.payResult.repay.success' }, { onTrigger: repay })}
              className="mt-10 h-11 w-full max-w-xs rounded-full text-sm text-white border-none cursor-pointer"
              style={{ background: green }}
            >
              重新支付
            </button>
            <button
              {...bindTap('market.payResult.orders-open')}
              className="mt-3 h-11 w-full max-w-xs rounded-full text-sm bg-transparent cursor-pointer"
              style={{ color: C.text, border: `1px solid ${C.border}` }}
            >
              查看我的订单
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'market.payResult.service.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="mt-4 text-xs bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              联系客服
            </button>
          </>
        )}
      </div>
    </div>
  );
}
