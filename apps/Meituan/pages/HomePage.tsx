import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcSearch, IcLocation, IcChevronRight, IcStar, IcClock, IcDeliver } from '../res/icons';
import { useAppNavigate } from '../navigation';
import { MEITUAN_CONFIG } from '../data';
import { useMeituanStore } from '../state';

const CATEGORY_COLORS = ['#FF6000', '#FF4757', '#2ED573', '#1E90FF', '#FF6B81', '#FFA502', '#70A1FF'];

export function HomePage() {
  const { go } = useAppNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchText, setSearchText] = useState('');
  const [activeCategory, setActiveCategory] = useState('c1');
  const cartItems = useMeituanStore(s => s.cart.items);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.count, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.count, 0);

  const filteredRestaurants = activeCategory === 'c1'
    ? MEITUAN_CONFIG.restaurants
    : MEITUAN_CONFIG.restaurants.filter(r =>
        MEITUAN_CONFIG.categories.find(c => c.id === activeCategory)?.name === r.category
      );

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 状态栏占位 */}
      <div className="pt-10" />

      {/* 顶部：位置 + 搜索 */}
      <div className="bg-[#FF6000] px-4 pb-3">
        <div className="flex items-center gap-1 mb-3">
          <IcLocation size={14} className="text-white opacity-90" />
          <span className="text-white text-sm font-medium truncate max-w-[180px]">
            {MEITUAN_CONFIG.user.address}
          </span>
          <IcChevronRight size={14} className="text-white opacity-80" />
        </div>
        <div
          className="flex items-center bg-white rounded-full px-4 py-2.5 gap-2"
          onClick={() => setSearchParams({ mode: 'search' })}
          data-trigger="meituan.home-search"
        >
          <IcSearch size={16} className="text-gray-400" />
          <span className="text-gray-400 text-sm">搜索餐厅、菜品</span>
        </div>
      </div>

      {/* 分类导航 */}
      <div className="bg-white px-2 py-3 flex gap-1 overflow-x-auto scrollbar-hide border-b border-gray-100">
        {MEITUAN_CONFIG.categories.map((cat, idx) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex flex-col items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-xl transition-all ${
              activeCategory === cat.id ? 'bg-orange-50' : ''
            }`}
          >
            <span className="text-xl">{cat.icon}</span>
            <span className={`text-[11px] font-medium ${activeCategory === cat.id ? 'text-[#FF6000]' : 'text-gray-600'}`}>
              {cat.name}
            </span>
          </button>
        ))}
      </div>

      {/* 活动 Banner */}
      <div className="mx-3 mt-3 rounded-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#FF6000] to-[#FF8C42] p-3 flex items-center justify-between">
          <div>
            <p className="text-white font-bold text-sm">新用户专享</p>
            <p className="text-orange-100 text-xs mt-0.5">首单立减20元 · 免配送费</p>
          </div>
          <button className="bg-white text-[#FF6000] text-xs font-bold px-3 py-1.5 rounded-full">
            立即领取
          </button>
        </div>
      </div>

      {/* 餐厅列表 */}
      <div className="flex-1 overflow-y-auto mt-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-800">附近餐厅</span>
          <span className="text-xs text-gray-400">{filteredRestaurants.length}家</span>
        </div>

        <div className="space-y-2 px-3 pb-6">
          {filteredRestaurants.map(restaurant => (
            <div
              key={restaurant.id}
              className="bg-white rounded-xl overflow-hidden active:scale-[0.99] transition-transform cursor-pointer shadow-sm"
              onClick={() => go('meituan.open-restaurant', { rid: restaurant.id })}
              data-trigger="meituan.open-restaurant"
              data-param-rid={restaurant.id}
            >
              {/* 餐厅封面图 */}
              <div className="relative h-32 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                <div className="text-5xl">
                  {restaurant.category === '汉堡' ? '🍔' :
                   restaurant.category === '火锅' ? '🍲' :
                   restaurant.category === '奶茶' ? '🧋' :
                   restaurant.category === '快餐' ? '🍱' :
                   restaurant.category === '披萨' ? '🍕' :
                   restaurant.category === '咖啡' ? '☕' : '🍽️'}
                </div>
                {restaurant.tags[0] && (
                  <span className="absolute top-2 left-2 bg-[#FF6000] text-white text-[10px] px-1.5 py-0.5 rounded">
                    {restaurant.tags[0]}
                  </span>
                )}
                {restaurant.monthSales && (
                  <span className="absolute bottom-2 right-2 bg-black/40 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    月售{restaurant.monthSales}
                  </span>
                )}
              </div>

              {/* 餐厅信息 */}
              <div className="p-3">
                <div className="flex items-start justify-between mb-1.5">
                  <h3 className="font-semibold text-gray-900 text-[15px] flex-1">{restaurant.name}</h3>
                  <div className="flex items-center gap-1 ml-2">
                    <IcStar size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-xs font-semibold text-gray-700">{restaurant.rating}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <IcClock size={11} />
                    {restaurant.deliveryTime}分钟
                  </span>
                  <span className="flex items-center gap-1">
                    <IcDeliver size={11} />
                    {restaurant.deliveryFee === 0 ? '免配送费' : `配送费¥${restaurant.deliveryFee}`}
                  </span>
                  <span>{restaurant.distance}</span>
                </div>

                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {restaurant.tags.map(tag => (
                    <span key={tag} className="bg-orange-50 text-[#FF6000] text-[10px] px-1.5 py-0.5 rounded">
                      {tag}
                    </span>
                  ))}
                  <span className="text-[10px] text-gray-400 ml-auto">起送¥{restaurant.minOrder}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 购物车悬浮按钮（有商品时显示） */}
      {cartCount > 0 && (
        <div className="fixed bottom-[72px] left-0 right-0 max-w-[480px] mx-auto px-4 pointer-events-none">
          <div className="flex justify-end pointer-events-auto">
            <button className="bg-[#FF6000] text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
              <span className="text-sm font-bold">¥{cartTotal.toFixed(1)}</span>
              <span className="bg-white text-[#FF6000] rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center">
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
