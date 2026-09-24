import React, { useEffect, useState } from 'react';
import { IcCheck, IcDeliver } from '../res/icons';
import { useAppNavigate } from '../navigation';
import { useMeituanStore } from '../state';

export function OrderSuccessPage() {
  const { go } = useAppNavigate();
  const [progress, setProgress] = useState(20);
  const latestOrder = useMeituanStore(s => s.orders[0]);

  useEffect(() => {
    const t = setInterval(() => {
      setProgress(p => Math.min(p + 5, 75));
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      <div className="pt-10" />

      <div className="flex-1 flex flex-col items-center justify-center px-8">
        {/* 成功图标 */}
        <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
          <IcCheck size={40} className="text-green-500" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">下单成功！</h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          骑手正在赶往商家，请保持手机畅通
        </p>

        {/* 配送进度 */}
        <div className="w-full bg-orange-50 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">配送中</span>
            <span className="text-xs text-[#FF6000]">预计{latestOrder ? '25' : '30'}分钟送达</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FF6000] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>✅ 已下单</span>
            <span className={progress >= 40 ? 'text-[#FF6000]' : ''}>🍳 商家备餐</span>
            <span className={progress >= 60 ? 'text-[#FF6000]' : ''}>🛵 配送中</span>
            <span className={progress >= 100 ? 'text-[#FF6000]' : ''}>✅ 已送达</span>
          </div>
        </div>

        {/* 订单信息 */}
        {latestOrder && (
          <div className="w-full bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">订单号</span>
              <span className="text-gray-700 font-mono text-xs">{latestOrder.id}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">商家</span>
              <span className="text-gray-700">{latestOrder.restaurantName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">实付金额</span>
              <span className="text-[#FF6000] font-bold">¥{latestOrder.total.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="w-full space-y-3">
          <button
            onClick={() => go('meituan.open-orders')}
            className="w-full bg-[#FF6000] text-white py-3.5 rounded-full font-semibold active:opacity-80"
            data-trigger="meituan.open-orders"
          >
            查看订单详情
          </button>
          <button
            onClick={() => go('meituan.home-open')}
            className="w-full border border-gray-200 text-gray-600 py-3.5 rounded-full font-semibold active:opacity-80"
            data-trigger="meituan.home-open"
          >
            继续点餐
          </button>
        </div>
      </div>
    </div>
  );
}
