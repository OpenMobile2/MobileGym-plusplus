import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { ProductImage } from '../components/common';
import { IcArrowLeft, IcSearch, IcHeadset, IcUser } from '../res/icons';

const CAT_NAME: Record<string, string> = { stationery: '文具伴侣', college: '大学备考', middle: '中学备考', primary: '小学备考', gift: '心意礼物' };

export default function MallCategoryPage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const name = CAT_NAME[sp.get('id') ?? 'college'] ?? '大学备考';
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 pb-2 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} color="#33405C" /></button>
        <div className="text-center text-base font-semibold text-[#212121]">{name}</div>
        <div />
      </div>
      <div className="flex items-center gap-2 px-4 pb-2">
        <button {...action('mall.category.search', () => st.showToast('搜索 ' + name))} className="flex flex-1 items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-2 text-xs text-[#9AA5B1]"><IcSearch size={14} color="#9AA5B1" />搜商品</button>
        <button {...action('mall.category.service.wontfixToast', toast)}><IcHeadset size={20} color="#5B6B85" /></button>
        <button {...action('mall.category.user.wontfixToast', toast)}><IcUser size={20} color="#5B6B85" /></button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="grid grid-cols-2 gap-3">
          {st.products.map((p) => (
            <button key={p.id} {...bindTap('mall.category.product.open', { params: { productId: p.id } })} className="overflow-hidden rounded-2xl bg-white text-left shadow-sm">
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
