import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Price } from '../components/common';
import { fmt } from '../utils';
import { ORDER_REWARD_BEANS } from '../constants';
import { useStatusBarBg } from '../statusbar';

/** 支付成功页(spec order.paySuccess,证据 IMG_6074) */
export default function PaySuccessPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  useStatusBarBg('#D8EAF9');
  const { orderId = '' } = useParams<{ orderId: string }>();

  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const claimOrderBeans = useTbsgStore((st) => st.claimOrderBeans);

  const order = orders.find((o) => o.id === orderId);
  const claimed = !!order?.beansClaimed;

  /** 为你推荐:零售店商品 4-6 个(双列) */
  const recs = useMemo(() => {
    const retailShops = shops.filter((x) => x.type === 'retail').slice(0, 3);
    const list: { itemId: string; shopId: string }[] = [];
    for (const shop of retailShops) {
      for (const it of items.filter((i) => i.shopId === shop.id).slice(0, 2)) {
        list.push({ itemId: it.id, shopId: shop.id });
      }
    }
    return list.slice(0, 6);
  }, [shops, items]);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        {/* 浅蓝渐变地图纹理头 */}
        <div
          className="relative pb-6"
          style={{
            background: 'linear-gradient(180deg,#D8EAF9 0%,#E9F3FB 55%,#F3F6F8 100%)',
          }}
        >
          {/* 地图纹理(简化线条) */}
          <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 360 220" preserveAspectRatio="none">
            <path d="M-10 60 L120 40 L250 90 L380 60" stroke="#BFD9F0" strokeWidth="10" fill="none" />
            <path d="M60 -10 L90 80 L60 230" stroke="#BFD9F0" strokeWidth="8" fill="none" />
            <path d="M230 -10 L260 100 L220 230" stroke="#CFE3F4" strokeWidth="12" fill="none" />
          </svg>
          {/* 右上 首页 */}
          <div className="relative flex justify-end px-4 pt-3">
            <button
              {...bindTap<HTMLButtonElement>('paysuccess.home-open')}
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[15px] font-semibold text-[#1A1A1A]"
            >
              <span>🏠</span>首页
            </button>
          </div>
          <div className="relative text-center mt-4">
            <div className="text-[22px] font-bold text-[#1A1A1A]">{s.paySuccess}</div>
            <button
              {...bindTap<HTMLButtonElement>('paysuccess.order-open', { params: { orderId } })}
              className="mt-4 h-9 px-6 rounded-lg bg-white/90 border border-[#DDDDDD] text-[14px] text-[#1A1A1A] cursor-pointer"
            >
              {s.viewOrder}
            </button>
          </div>

          {/* 下单奖励卡 */}
          <div className="relative bg-white rounded-xl mx-3 mt-5 p-4 text-center">
            <div className="text-[15px] font-semibold text-[#1A1A1A]">
              恭喜获得下单奖励<span className="text-[#D9A21B]">🫘×{ORDER_REWARD_BEANS}</span>,额外加赠一份
            </div>
            <div className="text-[16px] font-bold text-[#C97F12] mt-2">1000吃货豆</div>
            <div className="relative w-20 h-20 mx-auto mt-2">
              <div
                className="w-full h-full rounded-2xl flex items-center justify-center text-white text-[20px] font-bold"
                style={{ background: 'linear-gradient(135deg,#FFD972,#F3B434)', transform: 'rotate(-6deg)' }}
              >
                1000
              </div>
              <span className="absolute -left-3 bottom-0 w-5 h-5 rounded-md" style={{ background: 'linear-gradient(135deg,#FFE29B,#F5C155)' }} />
              <span className="absolute -right-2 bottom-2 w-4 h-4 rounded-md" style={{ background: 'linear-gradient(135deg,#FFE29B,#F5C155)' }} />
            </div>
            <div className="text-[12px] text-[#999999] mt-2">「超赚挑战」吃货豆任务</div>
            {claimed ? (
              <div className="mt-3 h-10 mx-8 rounded-full bg-[#E5E5E5] text-[#999999] text-[15px] font-semibold flex items-center justify-center">
                已领取
              </div>
            ) : (
              <button
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'paysuccess.beans.claim' },
                  { params: { orderId }, onTrigger: () => claimOrderBeans(orderId) },
                )}
                className="mt-3 h-10 w-[calc(100%-64px)] rounded-full text-white text-[15px] font-semibold border-none cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#D9A75C,#B37E33)' }}
              >
                立即领取
              </button>
            )}
          </div>
        </div>

        {/* 为你推荐 */}
        <div className="px-3 pt-4 pb-4">
          <div className="text-[16px] font-bold text-[#1A1A1A] text-center">— 为你推荐 —</div>
          <div className="grid grid-cols-2 gap-2.5 mt-3">
            {recs.map(({ itemId, shopId }) => {
              const item = items.find((i) => i.id === itemId);
              const shop = shops.find((x) => x.id === shopId);
              if (!item || !shop) return null;
              return (
                <button
                  key={itemId}
                  {...bindTap<HTMLButtonElement>('paysuccess.rec-open', { params: { shopId } })}
                  className="bg-white rounded-xl overflow-hidden border-none cursor-pointer p-0 text-left"
                >
                  <AppImg src={item.image} className="w-full h-[140px] object-cover" />
                  <div className="p-2.5">
                    <div className="text-[14px] text-[#1A1A1A] font-medium leading-5 line-clamp-2">{item.name}</div>
                    <div className="flex items-center gap-1 mt-1.5">
                      {shop.deliveryFee === 0 ? (
                        <span className="text-[10px] text-[#00B45A] border border-[#BCE5CF] rounded px-1 py-0.5">免配送费</span>
                      ) : (
                        <span className="text-[10px] text-[#666666] border border-[#E5E5E5] rounded px-1 py-0.5">{shop.deliveryMinutes}分钟</span>
                      )}
                      <span className="text-[10px] text-[#F53F3F] border border-[#F8C9C5] rounded px-1 py-0.5">省{fmt(Math.max(1, Math.round((item.origPrice ?? item.price) - item.price)))}元</span>
                    </div>
                    <div className="mt-1.5">
                      <Price value={item.price} size={17} orig={item.origPrice} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
