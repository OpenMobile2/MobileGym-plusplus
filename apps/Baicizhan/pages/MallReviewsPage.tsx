import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { useBaicizhanStore } from '../state';

const REVIEWS = [
  { u: '娇娇', spec: '薄荷奶糖保护套', t: '可以的吧', img: false },
  { u: '>**<', spec: '小海星', t: '锁屏可更换可爱捏。。。但背单词的时候会突然闪一下', img: true },
  { u: '夏*洁', spec: '薄荷奶糖保护套', t: '用起来还不错', img: true },
];

export default function MallReviewsPage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const product = st.products.find((item) => item.id === sp.get('productId'));
  const [tab, setTab] = useState('all');
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={product ? `${product.title} · 大家晒` : '大家晒'} close />
      <div className="flex gap-2 px-4 py-2">
        <button {...action('mall.rtab.select.all', () => setTab('all'))} className="rounded-full px-4 py-1.5 text-xs" style={{ background: tab === 'all' ? '#FFEDE5' : '#F2F3F5', color: tab === 'all' ? colors.mallBuy : '#5B6B85' }}>全部(543)</button>
        <button {...action('mall.rtab.select.media', () => setTab('media'))} className="rounded-full px-4 py-1.5 text-xs" style={{ background: tab === 'media' ? '#FFEDE5' : '#F2F3F5', color: tab === 'media' ? colors.mallBuy : '#5B6B85' }}>有图/视频(269)</button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {REVIEWS.filter((r) => tab === 'all' || r.img).map((r, i) => (
          <div key={i} className="border-b border-[#EEE] py-3">
            <div className="flex items-center gap-2"><div className="h-7 w-7 rounded-full bg-[#CFD8E6]" /><span className="text-sm text-[#33405C]">{r.u}</span><span className="ml-auto text-xs text-[#9AA5B1]">已购: {r.spec}</span></div>
            <div className="mt-2 text-sm text-[#33405C]">{r.t}</div>
            {r.img && <div className="mt-2 h-32 w-32 rounded-xl bg-[#D9D9D9]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
