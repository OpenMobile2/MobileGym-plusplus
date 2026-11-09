import React from 'react';
import { IcChevronRight } from '../res/icons';
import { useAppNavigate } from '../navigation';
import { useMeituanStore } from '../state';

export function MePage() {
  const { go } = useAppNavigate();
  const user = useMeituanStore(s => s.user);
  const orderCount = useMeituanStore(s => s.orders.length);

  const menuItems = [
    { icon: '📋', label: '我的订单', action: () => go('meituan.open-orders') },
    { icon: '❤️', label: '我的收藏', action: () => {} },
    { icon: '🎫', label: '优惠券', badge: user.coupons, action: () => {} },
    { icon: '💰', label: '钱包余额', extra: `¥${user.balance.toFixed(2)}`, action: () => {} },
    { icon: '📍', label: '收货地址', action: () => {} },
    { icon: '⭐', label: '积分', action: () => {} },
    { icon: '🔔', label: '消息通知', action: () => {} },
    { icon: '⚙️', label: '设置', action: () => {} },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="pt-10" />

      {/* 用户信息头部 */}
      <div className="bg-[#FF6000] px-5 pt-3 pb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/40">
            👤
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">{user.name}</h2>
            <p className="text-orange-100 text-sm mt-0.5">{user.phone}</p>
          </div>
        </div>
      </div>

      {/* 数据卡片 */}
      <div className="mx-4 -mt-5 bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 gap-3 mb-3">
        <button className="flex flex-col items-center" onClick={() => go('meituan.open-orders')}>
          <span className="text-xl font-bold text-gray-900">{orderCount}</span>
          <span className="text-xs text-gray-500 mt-0.5">订单</span>
        </button>
        <div className="flex flex-col items-center border-x border-gray-100">
          <span className="text-xl font-bold text-gray-900">{user.coupons}</span>
          <span className="text-xs text-gray-500 mt-0.5">优惠券</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-[#FF6000]">¥{user.balance.toFixed(0)}</span>
          <span className="text-xs text-gray-500 mt-0.5">余额</span>
        </div>
      </div>

      {/* 功能菜单 */}
      <div className="mx-3 bg-white rounded-xl overflow-hidden">
        {menuItems.map((item, idx) => (
          <button
            key={idx}
            onClick={item.action}
            className="w-full flex items-center px-4 py-3.5 border-b border-gray-50 last:border-0 active:bg-gray-50"
          >
            <span className="text-xl mr-3">{item.icon}</span>
            <span className="flex-1 text-sm text-left text-gray-800">{item.label}</span>
            {item.badge ? (
              <span className="bg-[#FF6000] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">
                {item.badge}
              </span>
            ) : item.extra ? (
              <span className="text-sm text-gray-400 mr-2">{item.extra}</span>
            ) : null}
            <IcChevronRight size={16} className="text-gray-300" />
          </button>
        ))}
      </div>

      <div className="h-24" />
    </div>
  );
}
