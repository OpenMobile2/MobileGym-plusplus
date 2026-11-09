import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore, cartCount } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { ProductImage } from '../components/common';
import { IcArrowLeft, IcHeadset, IcCart, IcStar } from '../res/icons';

const DTABS = [
  { key: 'goods', id: 'mall.dtab.select.goods', labelKey: 'mallDetailGoods' },
  { key: 'reviews', id: 'mall.dtab.select.reviews', labelKey: 'mallDetailReviews' },
  { key: 'recommend', id: 'mall.dtab.select.recommend', labelKey: 'mallDetailRecommend' },
  { key: 'intro', id: 'mall.dtab.select.intro', labelKey: 'mallDetailIntro' },
] as const;
type DetailTab = (typeof DTABS)[number]['key'];

const REVIEW_PREVIEWS = [
  { name: '背单词的小橘', text: '实物和图片一致，包装很仔细，学习时用起来也很顺手。' },
  { name: '一颗小词豆', text: '发货速度快，颜色清爽，已经推荐给一起备考的同学。' },
];

export default function MallDetailPage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const product = st.products.find((p) => p.id === sp.get('productId')) ?? st.products[0];
  const [dtab, setDtab] = useState<DetailTab>('goods');
  const fav = st.favoriteProductIds.includes(product.id);
  const [spec, setSpec] = useState(product.specs?.[0] ?? '默认');
  const [specOpen, setSpecOpen] = useState(false);
  const others = st.products.filter((p) => p.id !== product.id).slice(0, 4);
  const scrollRef = useRef<HTMLDivElement>(null);
  const goodsRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const recommendRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const sectionRefs = { goods: goodsRef, reviews: reviewsRef, recommend: recommendRef, intro: introRef };

  const selectDetailTab = (key: DetailTab) => {
    setDtab(key);
    const scroller = scrollRef.current;
    const target = sectionRefs[key].current;
    if (!scroller || !target) return;
    const top = target.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top: Math.max(0, top - 8), behavior: 'smooth' });
  };

  useEffect(() => {
    setDtab('goods');
    setSpec(product.specs?.[0] ?? '默认');
    scrollRef.current?.scrollTo({ top: 0 });
  }, [product.id, product.specs]);

  return (
    <div className="flex h-full flex-col bg-app-bg text-app-text">
      <div className="flex items-center gap-3 px-3 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} color="var(--app-text)" /></button>
        <div className="flex gap-4 text-sm">
          {DTABS.map((t) => <button key={t.key} {...action(t.id, () => selectDetailTab(t.key))} aria-pressed={dtab === t.key} style={{ color: dtab === t.key ? colors.mallBuy : '#5B6B85', fontWeight: dtab === t.key ? 700 : 400 }}>{s[t.labelKey]}</button>)}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pb-32" data-scroll-container="main" data-scroll-direction="vertical" data-mall-detail-active={dtab}>
        <div ref={goodsRef} data-mall-detail-section="goods">
          <button {...action('mall.detail.carousel', () => st.showToast('下一张'))} className="block w-full">
            <ProductImage id={product.id} label={product.title} className="h-64 w-full" rounded={0} />
          </button>
          <div className="bg-app-surface p-3">
            <button {...bindTap('mall.gocoin.open')} className="mb-2 inline-block rounded bg-[#FFF0D8] px-2 py-0.5 text-xs text-[#E8912D]">差190铜板可省¥2,去攒 ›</button>
            <div className="flex items-end">
              <div className="text-2xl font-bold text-[#F12F2F]">¥{product.price}</div>
              <button {...bindTap('mall.unavailable.open', { params: { feature: '商品优惠券' } })} className="ml-auto text-xs text-[#9AA5B1]">优惠 ›</button>
              <button {...action('mall.detail.fav', () => st.toggleProductFavorite(product.id))} className="ml-3"><IcStar size={20} color={fav ? '#FF5320' : '#C9CDD3'} /></button>
            </div>
            <div className="mt-2 text-sm text-app-text">{product.title}</div>
            <div className="mt-1 text-xs text-app-text-muted">已售 {product.sold} 件</div>
          </div>

          <button {...action('mall.spec.open', () => setSpecOpen(true))} className="mt-2 flex w-full items-center bg-app-surface px-3 py-3 text-left text-sm">
            <span className="text-[#9AA5B1]">选择</span><span className="ml-3 text-[#33405C]">{spec}</span>
            <span className="ml-auto text-xs text-[#9AA5B1]">共 {product.specs?.length ?? 1} 种分类可选 ›</span>
          </button>
          <div className="mt-0.5 bg-app-surface px-3 py-3 text-sm"><span className="text-app-text-muted">发货</span><span className="ml-3 text-app-text">四川成都 · 快递满35元包邮</span></div>
        </div>

        <div ref={reviewsRef} data-mall-detail-section="reviews" className="mt-2 bg-app-surface px-3 py-3">
          <button {...bindTap('mall.reviews.open', { params: { productId: product.id } })} className="flex w-full items-center text-left"><span className="text-sm font-semibold text-[#33405C]">大家晒 (1091)</span><span className="ml-auto text-xs text-[#9AA5B1]">好评93% · 查看全部 ›</span></button>
          <div className="mt-3 space-y-3">
            {REVIEW_PREVIEWS.map((review, index) => (
              <div key={review.name} className="rounded-xl bg-[#F7F8FA] p-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[#33405C]"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#FFE5D8] text-[#FF6B35]">{index + 1}</span>{review.name}<span className="ml-auto text-[#FF9B42]">★★★★★</span></div>
                <p className="mt-2 text-xs leading-5 text-[#5B6B85]">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div ref={recommendRef} data-mall-detail-section="recommend" className="mt-2 bg-app-surface p-3">
          <div className="text-sm font-semibold text-[#33405C]">{s.guessLike}</div>
          {/* 猜你喜欢用 replace 跳转:详情→详情不压栈,返回直接回商城(Gate4v5) */}
          <div className="mt-3 grid grid-cols-2 gap-3">
            {others.map((p) => (
              <button key={p.id} {...bindTap('mall.detail.self', { params: { productId: p.id }, nav: { mode: 'replace' } })} className="text-left">
                <ProductImage id={p.id} label={p.title} className="h-24 w-full" /><div className="mt-1 line-clamp-1 text-xs text-[#33405C]">{p.title}</div><div className="text-sm font-bold text-[#F12F2F]">¥{p.price}</div>
              </button>
            ))}
          </div>
        </div>

        <div ref={introRef} data-mall-detail-section="intro" className="mt-2 min-h-[520px] bg-app-surface p-3">
          <div className="text-sm font-semibold text-[#33405C]">商品详情</div>
          <p className="mt-2 text-xs leading-5 text-[#5B6B85]">{product.subtitle ?? `${product.title}，为日常学习与复习场景设计。`}</p>
          <ProductImage id={product.id} label={`${product.title} · 详情`} className="mt-4 h-52 w-full" />
          <div className="mt-4 rounded-xl bg-[#F7F8FA] p-3 text-xs leading-6 text-[#5B6B85]">
            <div><span className="inline-block w-16 text-[#9AA5B1]">商品名称</span>{product.title}</div>
            <div><span className="inline-block w-16 text-[#9AA5B1]">可选规格</span>{(product.specs ?? ['默认']).join(' / ')}</div>
            <div><span className="inline-block w-16 text-[#9AA5B1]">配送服务</span>满 35 元包邮 · 7 天无理由</div>
          </div>
          <div className="mt-4 rounded-xl bg-[#FFF7F2] p-3 text-xs leading-5 text-[#8A5A44]">百词斩商城正品保障 · 商品颜色可能因屏幕显示略有差异，请以实物为准。</div>
        </div>
      </div>

      {/* 底部栏 */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 bg-app-surface px-3 py-2">
        <button {...bindTap('mall.unavailable.open', { params: { feature: '商城客服' } })} className="flex flex-col items-center text-[10px] text-[#5B6B85]"><IcHeadset size={20} color="#5B6B85" />客服</button>
        <button {...bindTap('mall.detail.cart.open')} className="relative flex flex-col items-center text-[10px] text-[#5B6B85]">
          <IcCart size={20} color="#5B6B85" />
          {cartCount(st) > 0 && <span className="absolute -right-1 top-0 rounded-full bg-[#FF5320] px-1 text-[9px] leading-4 text-white">{cartCount(st)}</span>}
          购物车
        </button>
        <button {...action('mall.cart.add', () => st.addToCart(product.id, spec))} className="ml-auto rounded-l-full bg-[#FF8A4A] px-6 py-3 text-sm font-semibold text-white">{s.addCart}</button>
        <button {...bindTap('mall.buynow.submit', { beforeTrigger: () => st.buyNow(product.id, spec) })} className="rounded-r-full bg-[#FF5320] px-6 py-3 text-sm font-semibold text-white">{s.buyNow}</button>
      </div>

      {/* 规格弹层 */}
      {specOpen && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/30" onClick={() => setSpecOpen(false)}>
          <div className="rounded-t-2xl bg-app-surface p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-[#33405C]">选择规格</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(product.specs ?? ['默认']).map((sp2) => (
                <button key={sp2} onClick={() => setSpec(sp2)} className="rounded-full px-4 py-2 text-sm" style={{ background: spec === sp2 ? '#FFEDE5' : '#F2F3F5', color: spec === sp2 ? colors.mallBuy : '#5B6B85' }}>{sp2}</button>
              ))}
            </div>
            <button onClick={() => { st.addToCart(product.id, spec); setSpecOpen(false); }} className="mt-4 w-full rounded-full bg-[#FF5320] py-3 text-sm font-semibold text-white">确定</button>
          </div>
        </div>
      )}
    </div>
  );
}
