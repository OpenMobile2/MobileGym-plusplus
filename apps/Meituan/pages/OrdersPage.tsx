import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack, IcDeliver, IcCheck } from '../res/icons';
import { useAppNavigate } from '../navigation';
import { useMeituanStore } from '../state';

const STATUS_LABEL: Record<string, string> = {
  pending: '待接单',
  preparing: '备餐中',
  delivering: '配送中',
  delivered: '已送达',
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-yellow-500',
  preparing: 'text-blue-500',
  delivering: 'text-[#FF6000]',
  delivered: 'text-green-500',
};

export function OrdersPage() {
  const { back } = useAppNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const orders = useMeituanStore(s => s.orders);
  const activeTab = searchParams.get('tab') || 'all';

  const filtered = activeTab === 'ongoing'
    ? orders.filter(o => o.status !== 'delivered')
    : orders;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="pt-10" />

      {/* 顶部导航 */}
      <div className="bg-white flex items-center px-4 py-3 border-b border-gray-100">
        <button onClick={back} className="mr-3 active:opacity-60" data-trigger="system.back">
          <IcNavBack size={22} className="text-gray-800" />
        </button>
        <h1 className="font-semibold text-gray-900 text-[16px] flex-1">我的订单</h1>
      </div>

      {/* Tab */}
      <div className="bg-white flex border-b border-gray-100">
        {[{id:'all',label:'全部'},{id:'ongoing',label:'进行中'}].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSearchParams(tab.id === 'all' ? {} : { tab: tab.id })}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'text-[#FF6000] border-[#FF6000]' : 'text-gray-500 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-scroll-container="main" data-scroll-direction="vertical">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="text-5xl mb-4">📋</span>
            <p className="text-sm">暂无订单</p>
          </div>
        ) : (
          filtered.map(order => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-[15px]">{order.restaurantName}</h3>
                <span className={`text-sm font-medium ${STATUS_COLOR[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm text-gray-600">
                    <span>{item.name} x{item.count}</span>
                    <span>¥{(item.price * item.count).toFixed(1)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">{order.time}</p>
                  <p className="text-sm text-gray-700 mt-0.5">
                    共{order.items.reduce((s,i) => s+i.count,0)}件  实付 <span className="font-bold text-gray-900">¥{order.total.toFixed(1)}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  {order.status === 'delivered' ? (
                    <button className="border border-[#FF6000] text-[#FF6000] text-xs px-3 py-1.5 rounded-full">
                      再来一单
                    </button>
                  ) : (
                    <button className="bg-[#FF6000] text-white text-xs px-3 py-1.5 rounded-full">
                      查看进度
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
