import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { IcNavBack, IcStar, IcClock, IcDeliver, IcPlus, IcMinus, IcCart, IcClose } from '../res/icons';
import { useAppNavigate } from '../navigation';
import { MEITUAN_CONFIG } from '../data';
import { useMeituanStore } from '../state';

export function RestaurantPage() {
  const { rid } = useParams<{ rid: string }>();
  const { go, back } = useAppNavigate();
  const [searchParams] = useSearchParams();
  const isCartOpen = searchParams.get('cart') === 'open';
  const activeTab = searchParams.get('tab') || 'menu';

  const restaurant = MEITUAN_CONFIG.restaurants.find(r => r.id === rid)!;
  const { addToCart, removeFromCart, cart } = useMeituanStore(s => ({
    addToCart: s.addToCart,
    removeFromCart: s.removeFromCart,
    cart: s.cart,
  }));

  const cartItems = cart.restaurantId === rid ? cart.items : [];
  const cartTotal = cartItems.reduce((sum, i) => sum + i.price * i.count, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.count, 0);

  const getCount = (dishId: string) => cartItems.find(i => i.dishId === dishId)?.count ?? 0;

  const categories = [...new Set(restaurant.dishes.map(d => d.category))];
  const [activeMenuCat, setActiveMenuCat] = useState(categories[0]);

  const filteredDishes = restaurant.dishes.filter(d => d.category === activeMenuCat);

  const comments = [
    { id: 'c1', user: '小红书用户K***', avatar: '👤', rating: 5, content: '超级好吃！配送也很快，下次还来！', time: '3天前' },
    { id: 'c2', user: '美团用户L***', avatar: '👤', rating: 5, content: '食材新鲜，量足，性价比超高，强烈推荐！', time: '5天前' },
    { id: 'c3', user: '用户M***', avatar: '👤', rating: 4, content: '味道不错，就是包装稍微简单了点', time: '1周前' },
  ];

  if (!restaurant) return null;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="pt-10" />

      {/* 顶部导航 */}
      <div className="bg-white flex items-center px-4 py-3 border-b border-gray-100">
        <button onClick={back} className="mr-3 active:opacity-60" data-trigger="system.back">
          <IcNavBack size={22} className="text-gray-800" />
        </button>
        <h1 className="font-semibold text-gray-900 flex-1 truncate text-[16px]">{restaurant.name}</h1>
      </div>

      {/* 餐厅头部信息 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl bg-orange-50 flex items-center justify-center text-3xl flex-shrink-0">
            {restaurant.category === '汉堡' ? '🍔' :
             restaurant.category === '火锅' ? '🍲' :
             restaurant.category === '奶茶' ? '🧋' :
             restaurant.category === '快餐' ? '🍱' :
             restaurant.category === '披萨' ? '🍕' :
             restaurant.category === '咖啡' ? '☕' : '🍽️'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-[17px] mb-1">{restaurant.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
              <span className="flex items-center gap-1">
                <IcStar size={12} className="text-yellow-400 fill-yellow-400" />
                <b className="text-gray-700">{restaurant.rating}</b>
                <span>({restaurant.ratingCount}评)</span>
              </span>
              <span className="flex items-center gap-1">
                <IcClock size={11} />
                约{restaurant.deliveryTime}分钟
              </span>
              <span className="flex items-center gap-1">
                <IcDeliver size={11} />
                {restaurant.deliveryFee === 0 ? '免配送费' : `¥${restaurant.deliveryFee}`}
              </span>
            </div>
            <p className="text-xs text-gray-400 truncate">{restaurant.notice}</p>
          </div>
        </div>
      </div>

      {/* Tab切换 */}
      <div className="bg-white flex border-b border-gray-200">
        <button
          onClick={() => go('meituan.restaurant-menu', { rid: rid! })}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab !== 'comments' ? 'text-[#FF6000] border-[#FF6000]' : 'text-gray-500 border-transparent'
          }`}
          data-trigger="meituan.restaurant-menu"
          data-param-rid={rid}
        >
          点菜
        </button>
        <button
          onClick={() => go('meituan.restaurant-comments', { rid: rid! })}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'comments' ? 'text-[#FF6000] border-[#FF6000]' : 'text-gray-500 border-transparent'
          }`}
          data-trigger="meituan.restaurant-comments"
          data-param-rid={rid}
        >
          评价
        </button>
      </div>

      {/* 菜单/评价内容 */}
      {activeTab !== 'comments' ? (
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧分类 */}
          <div className="w-20 bg-gray-50 overflow-y-auto flex-shrink-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveMenuCat(cat)}
                className={`w-full py-3 px-2 text-center text-xs transition-colors ${
                  activeMenuCat === cat
                    ? 'bg-white text-[#FF6000] font-semibold border-l-2 border-[#FF6000]'
                    : 'text-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* 右侧菜品列表 */}
          <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
            <div className="p-3 space-y-3">
              {filteredDishes.map(dish => {
                const count = getCount(dish.id);
                return (
                  <div key={dish.id} className="flex gap-3">
                    <div className="w-20 h-20 rounded-lg bg-orange-50 flex items-center justify-center text-3xl flex-shrink-0">
                      🍽️
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm mb-0.5">{dish.name}</p>
                      {dish.desc && (
                        <p className="text-xs text-gray-400 mb-1 line-clamp-1">{dish.desc}</p>
                      )}
                      <p className="text-xs text-gray-400 mb-2">月售{dish.sales}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-[#FF6000] font-bold text-base">¥{dish.price}</span>
                          {dish.originalPrice > 0 && (
                            <span className="text-gray-400 text-xs line-through">¥{dish.originalPrice}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {count > 0 && (
                            <>
                              <button
                                onClick={() => removeFromCart(dish.id)}
                                className="w-7 h-7 rounded-full border border-[#FF6000] flex items-center justify-center active:opacity-70"
                                data-action="restaurant.cartItem.remove"
                                data-param-dish-id={dish.id}
                              >
                                <IcMinus size={14} className="text-[#FF6000]" />
                              </button>
                              <span className="text-sm font-bold text-gray-800 w-5 text-center">{count}</span>
                            </>
                          )}
                          <button
                            onClick={() => addToCart(rid!, { id: dish.id, name: dish.name, price: dish.price })}
                            className="w-7 h-7 rounded-full bg-[#FF6000] flex items-center justify-center active:opacity-70"
                            data-action="restaurant.cartItem.add"
                            data-param-dish-id={dish.id}
                          >
                            <IcPlus size={14} className="text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* 评价Tab */
        <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4 p-3 bg-orange-50 rounded-xl">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#FF6000]">{restaurant.rating}</p>
                <p className="text-xs text-gray-500">综合评分</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span>口味</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-[#FF6000] rounded-full" style={{width:'92%'}}/></div>
                  <span className="text-gray-700">9.2</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <span>包装</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-[#FF6000] rounded-full" style={{width:'88%'}}/></div>
                  <span className="text-gray-700">8.8</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>配送</span>
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full"><div className="h-full bg-[#FF6000] rounded-full" style={{width:'90%'}}/></div>
                  <span className="text-gray-700">9.0</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {comments.map(c => (
                <div key={c.id} className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-base">{c.avatar}</div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.user}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <IcStar key={s} size={10} className={s <= c.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">{c.time}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部购物车栏 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        {cartCount === 0 ? (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <IcCart size={22} className="text-gray-300" />
            </div>
            <div>
              <p className="text-sm text-gray-400">还未选择商品</p>
              <p className="text-xs text-gray-300">起送价 ¥{restaurant.minOrder}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => go('meituan.cart-open', { rid: rid! })}
              className="relative w-12 h-12 rounded-full bg-[#FF6000] flex items-center justify-center"
              data-trigger="meituan.cart-open"
              data-param-rid={rid}
            >
              <IcCart size={22} className="text-white" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </button>
            <div className="flex-1">
              <p className="font-bold text-gray-900">
                <span className="text-[#FF6000] text-lg">¥{cartTotal.toFixed(1)}</span>
              </p>
              <p className="text-xs text-gray-400">
                {cartTotal >= restaurant.minOrder
                  ? `再加¥${restaurant.deliveryFee}配送费`
                  : `还差¥${(restaurant.minOrder - cartTotal).toFixed(1)}起送`}
              </p>
            </div>
            {cartTotal >= restaurant.minOrder && (
              <button
                onClick={() => go('meituan.open-order-confirm')}
                className="bg-[#FF6000] text-white px-6 py-2.5 rounded-full text-sm font-semibold active:opacity-80"
                data-trigger="meituan.open-order-confirm"
              >
                去结算
              </button>
            )}
          </div>
        )}
      </div>

      {/* 购物车展开面板 */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50" onClick={() => go('meituan.cart-close', { rid: rid! })}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 flex-1">已选商品</h3>
              <button onClick={() => go('meituan.cart-close', { rid: rid! })} data-trigger="meituan.cart-close" data-param-rid={rid}>
                <IcClose size={20} className="text-gray-400" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-4 py-2">
              {cartItems.map(item => (
                <div key={item.dishId} className="flex items-center py-3 border-b border-gray-50">
                  <span className="flex-1 text-sm text-gray-800">{item.name}</span>
                  <span className="text-[#FF6000] font-medium text-sm mr-3">¥{(item.price * item.count).toFixed(1)}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFromCart(item.dishId)}
                      className="w-6 h-6 rounded-full border border-[#FF6000] flex items-center justify-center"
                      data-action="restaurant.cartItem.remove"
                      data-param-dish-id={item.dishId}
                    >
                      <IcMinus size={12} className="text-[#FF6000]" />
                    </button>
                    <span className="text-sm font-bold w-4 text-center">{item.count}</span>
                    <button
                      onClick={() => {
                        const dish = restaurant.dishes.find(d => d.id === item.dishId)!;
                        addToCart(rid!, { id: dish.id, name: dish.name, price: dish.price });
                      }}
                      className="w-6 h-6 rounded-full bg-[#FF6000] flex items-center justify-center"
                      data-action="restaurant.cartItem.add"
                      data-param-dish-id={item.dishId}
                    >
                      <IcPlus size={12} className="text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-gray-100 flex items-center">
              <div className="flex-1">
                <span className="text-[#FF6000] font-bold text-lg">¥{cartTotal.toFixed(1)}</span>
                <span className="text-gray-400 text-xs ml-1">+配送费¥{restaurant.deliveryFee}</span>
              </div>
              <button
                onClick={() => go('meituan.open-order-confirm')}
                className="bg-[#FF6000] text-white px-8 py-2.5 rounded-full text-sm font-semibold"
                data-trigger="meituan.open-order-confirm"
              >
                去结算
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
