import React from 'react';
import { IcNavBack, IcLocation, IcChevronRight } from '../res/icons';
import { useAppNavigate } from '../navigation';
import { useMeituanStore } from '../state';
import { MEITUAN_CONFIG } from '../data';

export function OrderConfirmPage() {
  const { go, back } = useAppNavigate();
  const { cart, placeOrder } = useMeituanStore(s => ({ cart: s.cart, placeOrder: s.placeOrder }));
  const user = MEITUAN_CONFIG.user;

  const restaurant = MEITUAN_CONFIG.restaurants.find(r => r.id === cart.restaurantId);
  const cartItems = cart.items;
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.count, 0);
  const deliveryFee = restaurant?.deliveryFee ?? 3;
  const total = subtotal + deliveryFee;

  const handleSubmit = () => {
    if (!restaurant) return;
    placeOrder(restaurant.id, restaurant.name, deliveryFee);
    go('meituan.submit-order');
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="pt-10" />

      {/* 顶部导航 */}
      <div className="bg-white flex items-center px-4 py-3 border-b border-gray-100">
        <button onClick={back} className="mr-3 active:opacity-60" data-trigger="system.back">
          <IcNavBack size={22} className="text-gray-800" />
        </button>
        <h1 className="font-semibold text-gray-900 text-[16px]">确认订单</h1>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 配送地址 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
            <IcLocation size={18} className="text-[#FF6000]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm mb-0.5">{user.name} {user.phone}</p>
            <p className="text-xs text-gray-500 truncate">{user.address}</p>
          </div>
          <IcChevronRight size={18} className="text-gray-300 flex-shrink-0" />
        </div>

        {/* 商品清单 */}
        <div className="bg-white mx-3 mt-3 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <p className="font-semibold text-gray-900 text-sm">{restaurant?.name}</p>
          </div>
          {cartItems.map(item => (
            <div key={item.dishId} className="flex items-center px-4 py-3 border-b border-gray-50 last:border-0">
              <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center text-xl flex-shrink-0">
                🍽️
              </div>
              <div className="flex-1 min-w-0 mx-3">
                <p className="text-sm text-gray-800 font-medium">{item.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">x{item.count}</p>
              </div>
              <span className="text-gray-900 font-medium text-sm">¥{(item.price * item.count).toFixed(1)}</span>
            </div>
          ))}
        </div>

        {/* 配送方式 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">配送方式</span>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>骑手配送</span>
            <IcChevronRight size={16} className="text-gray-300" />
          </div>
        </div>

        {/* 备注 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">备注</span>
          <span className="text-sm text-gray-400">口味、偏好等</span>
        </div>

        {/* 费用明细 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-4 space-y-2.5">
          <h3 className="font-semibold text-gray-900 text-sm mb-3">费用明细</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">商品合计</span>
            <span className="text-gray-800">¥{subtotal.toFixed(1)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">配送费</span>
            <span className={restaurant?.deliveryFee === 0 ? 'text-green-500' : 'text-gray-800'}>
              {restaurant?.deliveryFee === 0 ? '免费' : `¥${deliveryFee.toFixed(1)}`}
            </span>
          </div>
          <div className="border-t border-gray-100 pt-2.5 flex justify-between">
            <span className="font-semibold text-gray-900">实付款</span>
            <span className="font-bold text-[#FF6000] text-base">¥{total.toFixed(1)}</span>
          </div>
        </div>

        {/* 支付方式 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-4 flex items-center justify-between">
          <span className="text-sm text-gray-700">支付方式</span>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-gray-600">微信支付</span>
            <IcChevronRight size={16} className="text-gray-300" />
          </div>
        </div>

        <div className="h-24" />
      </div>

      {/* 底部提交按钮 */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-500 text-sm">实付款</span>
          <span className="text-[#FF6000] font-bold text-xl">¥{total.toFixed(1)}</span>
        </div>
        <button
          onClick={handleSubmit}
          className="w-full bg-[#FF6000] text-white py-3.5 rounded-full text-base font-semibold active:opacity-80"
          data-trigger="meituan.submit-order"
        >
          提交订单
        </button>
      </div>
    </div>
  );
}
