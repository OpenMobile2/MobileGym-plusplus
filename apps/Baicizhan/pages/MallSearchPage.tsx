import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { ProductImage } from '../components/common';
import { IcSearch } from '../res/icons';

const CHIPS = ['单词机', '词汇', '笔记本', '书签', '耳机', '真题'];

export default function MallSearchPage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [q, setQ] = useState('');
  const kw = q.trim();
  const results = kw ? st.products.filter((p) => p.title.includes(kw) || (p.subtitle ?? '').includes(kw)) : [];
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-2">
          <IcSearch size={16} color="#9AA5B1" />
          <input value={q} onChange={(e) => setQ(e.target.value)} {...action('mall.search.input', () => {}, { params: { value: q } })}
            placeholder="搜商品,如「单词机」「真题」" autoFocus className="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <button {...bindBack()} className="text-sm text-[#33405C]">{s.cancel}</button>
      </div>

      {!kw ? (
        <>
          <div className="px-4 pt-4 text-sm font-semibold text-[#33405C]">为你推荐</div>
          <div className="flex flex-wrap gap-2 p-4">
            {CHIPS.map((c) => (
              <button key={c} {...action('mall.search.chip', () => setQ(c), { params: { keyword: c } })} className="rounded-full bg-[#F2F3F5] px-3 py-1.5 text-xs text-[#5B6B85]">{c}</button>
            ))}
          </div>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="text-xs text-[#9AA5B1]">找到 {results.length} 个「{kw}」相关商品</div>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {results.map((p) => (
              <button key={p.id} {...bindTap('mall.search.detail.open', { params: { productId: p.id } })} className="overflow-hidden rounded-2xl bg-white text-left shadow-sm">
                <ProductImage id={p.id} label={p.title} className="h-28 w-full" rounded={0} />
                <div className="p-2"><div className="line-clamp-2 h-8 text-xs text-[#33405C]">{p.title}</div><div className="mt-1 text-sm font-bold text-[#F12F2F]">¥{p.price}</div></div>
              </button>
            ))}
          </div>
          {results.length === 0 && <div className="py-16 text-center text-sm text-[#9AA5B1]">没有找到相关商品</div>}
        </div>
      )}
    </div>
  );
}
