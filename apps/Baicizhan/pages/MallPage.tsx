import React from 'react';
import { useBaicizhanStore, cartCount } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { ProductImage } from '../components/common';
import { IcSearch, IcHeadset, IcUser, IcCart, IcCoin } from '../res/icons';

const CATS: [string, string][] = [['stationery', '文具伴侣'], ['college', '大学备考'], ['middle', '中学备考'], ['primary', '小学备考'], ['gift', '心意礼物']];

export default function MallPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const cc = cartCount(st);
  return (
    <div className="flex h-full flex-col" style={{ background: colors.mallBg }} data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-4 pt-12">
        <button {...bindTap('mall.coin.open')} className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs text-[#8A6A2A]"><IcCoin size={14} />{st.coins}</button>
        <div className="ml-auto flex items-center gap-3">
          <button {...bindTap('mall.search.open')}><IcSearch size={20} color="#5B4A2A" /></button>
          <button {...action('mall.service.wontfixToast', toast)}><IcHeadset size={20} color="#5B4A2A" /></button>
          <button {...bindTap('mall.user.open')}><IcUser size={20} color="#5B4A2A" /></button>
          <button {...bindTap('mall.cart.open')} className="relative"><IcCart size={20} color="#5B4A2A" />{cc > 0 && <span className="absolute -right-2 -top-1 rounded-full bg-[#FF5320] px-1 text-[9px] text-white">{cc}</span>}</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <button {...bindTap('mall.member.open')} className="mt-3 flex w-full items-center rounded-2xl bg-[#FFF6E0] px-3 py-2 text-left text-sm text-[#8A6A2A]">会员88折,3单回本! <span className="ml-auto rounded-full bg-[#F5A623] px-3 py-1 text-xs text-white">加入会员</span></button>

        <div className="mt-3 grid grid-cols-5 gap-y-3 rounded-2xl bg-white p-3">
          {CATS.map(([id, c]) => (
            <button key={id} {...bindTap('mall.category.open', { params: { id } })} className="flex flex-col items-center gap-1"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF0D8]">🎒</div><span className="text-[9px] text-[#5B6B85]">{c}</span></button>
          ))}
        </div>

        <div className="mt-3 flex gap-3">
          <button {...action('mall.promo.wontfixToast', toast)} className="flex-1 rounded-2xl bg-[#FF9F5A] p-3 text-left text-white"><div className="text-sm font-bold">刮文具</div><div className="text-xs opacity-90">1铜板</div></button>
          <button {...action('mall.promo.wontfixToast', toast)} className="flex-1 rounded-2xl bg-[#FF6B4A] p-3 text-left text-white"><div className="text-sm font-bold">今日铜板超省</div><div className="text-xs opacity-90">剩8小时</div></button>
        </div>

        {/* 瀑布流 */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {st.products.map((p) => (
            <button key={p.id} {...bindTap('mall.detail.open', { params: { productId: p.id } })} className="overflow-hidden rounded-2xl bg-white text-left">
              <ProductImage id={p.id} label={p.title} className="h-32 w-full" rounded={0} />
              <div className="p-2">
                <div className="line-clamp-2 h-8 text-xs text-[#33405C]">{p.title}</div>
                <div className="mt-1 text-sm font-bold text-[#F12F2F]">¥{p.price}</div>
                {p.coinPrice && <div className="mt-1 inline-block rounded bg-[#FFF0D8] px-1 text-[10px] text-[#E8912D]">{s.coinPrice} ¥{p.coinPrice}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
