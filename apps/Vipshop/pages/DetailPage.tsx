import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, DiscountTag, BottomSheet, Stepper, usePanel, useToast, VIP } from '../components/ui';
import { IcHeart, IcShop, IcService, IcRuler, IcSearch, IcShield } from '../res/icons';

const SIZE_TABLE = [
  { size: 'S', bust: '84', waist: '66', rec: '80-95斤' },
  { size: 'M', bust: '88', waist: '70', rec: '95-110斤' },
  { size: 'L', bust: '92', waist: '74', rec: '110-125斤' },
  { size: 'XL', bust: '96', waist: '78', rec: '125-140斤' },
];

export default function DetailPage() {
  const { id = '' } = useParams();
  const { bindTap, back, go } = useVipshopGestures();
  const { value: panel, open: openPanel, searchParams } = usePanel();
  const skuMode = searchParams.get('mode') === 'buy' ? 'buy' : 'cart';

  const item = useVipshopStore((s) => s.items.find((i) => i.id === id));
  const brand = useVipshopStore((s) => s.brands.find((b) => b.id === item?.brandId));
  const allReviews = useVipshopStore((s) => s.reviews);
  const favorites = useVipshopStore((s) => s.favorites);
  const cartCount = useVipshopStore((s) => s.cart.length);
  const toggleFavorite = useVipshopStore((s) => s.toggleFavorite);
  const recordFootprint = useVipshopStore((s) => s.recordFootprint);
  const addToCart = useVipshopStore((s) => s.addToCart);
  const beginCheckout = useVipshopStore((s) => s.beginCheckout);

  const reviews = useMemo(() => allReviews.filter((r) => r.itemId === id), [allReviews, id]);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [reviewTag, setReviewTag] = useState('全部');
  const [galleryIdx, setGalleryIdx] = useState(0);
  const galleryRef = React.useRef<HTMLDivElement>(null);
  const scrollGallery = (i: number) => {
    setGalleryIdx(i);
    const el = galleryRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };
  const [sizeUnit, setSizeUnit] = useState<'cm' | 'in'>('cm');
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (id) recordFootprint(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!item) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="商品详情" />
        <div className="flex-1 flex items-center justify-center text-[#888888]">商品不存在</div>
      </div>
    );
  }

  const isFav = favorites.includes(item.id);
  const skuDesc = item.specs.map((s) => `${s.name}:${selected[s.name] ?? s.options[0]}`).join(';');
  const gallery = item.gallery && item.gallery.length > 0 ? item.gallery : [item.image];

  const confirmAddCart = () => {
    addToCart(item.id, skuDesc, qty);
    back();
    showToast('已加入购物车');
  };

  const reviewTags = ['全部', '买家秀', '尺码偏大', '尺码偏小'];
  const shownReviews = reviewTag === '全部' ? reviews : reviews.filter((r) => r.tag === reviewTag);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar
        title="商品详情"
        rightContent={
          <button {...bindTap('detail.findSimilar-open', { params: { q: item.title.slice(0, 4) } })} className="bg-transparent border-none cursor-pointer" aria-label="找相似">
            <IcSearch size={20} className="text-[#222222]" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="detail-body" data-scroll-direction="vertical">
        {/* 主图轮播 */}
        <div className="relative bg-white">
          <div
            ref={galleryRef}
            className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
            data-scroll-container="detail-gallery"
            data-scroll-direction="horizontal"
            onScroll={(e) => setGalleryIdx(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          >
            {gallery.map((g, gi) => (
              <Img key={gi} src={g} className="w-full aspect-square object-cover shrink-0 snap-center" alt={item.title} />
            ))}
          </div>
          {/* 圆点指示(点击切换=detail.gallery.select.target) */}
          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 flex gap-1.5">
            {gallery.map((_, i) => (
              <button
                key={i}
                {...bindTap({ kind: 'action', id: 'detail.gallery.select.target' }, {
                  params: { target: String(i) },
                  onTrigger: () => scrollGallery(i),
                })}
                className="w-1.5 h-1.5 rounded-full border-none cursor-pointer p-0"
                style={{ background: i === galleryIdx ? VIP.primary : 'rgba(0,0,0,0.2)' }}
              />
            ))}
          </div>
        </div>

        {/* 价格区 */}
        <div className="bg-white px-3 py-2.5">
          <div className="flex items-baseline gap-2">
            <Price value={item.price} size="l" label />
            <span className="text-[12px] text-[#BBBBBB] line-through">¥{item.originPrice}</span>
            <DiscountTag text={item.discountText} />
            <span className="flex-1" />
            <span className="text-[11px] text-[#888888]">{item.sold}</span>
          </div>
          <div className="text-[15px] font-semibold leading-snug mt-1.5 text-[#222222]">{item.title}</div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {item.tags.map((t) => (
              <span key={t} className="text-[10px] rounded px-1 py-0.5" style={{ color: VIP.primary, background: '#FDECF5' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* 正品保障 */}
        <div className="bg-white mt-2 px-3 py-2 text-[12px] text-[#666666] flex items-center gap-2">
          <IcShield size={14} style={{ color: VIP.gold }} />
          <span style={{ color: VIP.gold }}>100%正品</span><span>·</span><span>顺丰包邮</span><span>·</span><span>7天无理由</span><span>·</span><span>假一赔十</span>
        </div>

        {/* 选规格入口 */}
        <button
          {...bindTap({ kind: 'action', id: 'detail.sku.openForCart' }, { onTrigger: () => openPanel('sku', { mode: 'cart' }) })}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between border-none cursor-pointer text-left"
        >
          <span className="text-[13px] text-[#888888]">已选</span>
          <span className="flex-1 text-[13px] text-[#222222] ml-3 truncate">{skuDesc}</span>
          <span className="text-[12px] text-[#888888]">›</span>
        </button>

        {/* 尺码信息入口 */}
        <button
          {...bindTap({ kind: 'action', id: 'detail.sizeInfo.open' }, { onTrigger: () => openPanel('size') })}
          className="w-full bg-white mt-px px-3 py-3 flex items-center justify-between border-none cursor-pointer text-left"
        >
          <span className="flex items-center gap-1.5 text-[13px] text-[#222222]"><IcRuler size={15} />尺码信息 · 尺码对照表</span>
          <span className="text-[12px] text-[#888888]">›</span>
        </button>

        {/* 评价入口 */}
        <button
          {...bindTap({ kind: 'action', id: 'detail.reviews.open' }, { onTrigger: () => openPanel('reviews') })}
          className="w-full bg-white mt-2 px-3 py-3 border-none cursor-pointer text-left"
        >
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold text-[#222222]">评价({item.reviewCount})</span>
            <span className="text-[12px] text-[#888888]">好评率 {item.goodRate} ›</span>
          </div>
          <div className="flex gap-1.5 mt-1.5 overflow-hidden">
            {item.reviewTags.map((t) => (
              <span key={t} className="text-[11px] rounded px-1.5 py-0.5 shrink-0" style={{ color: VIP.primary, background: '#FDECF5' }}>{t}</span>
            ))}
          </div>
        </button>

        {/* 品牌店铺入口 */}
        {brand && (
          <div className="bg-white mt-2 px-3 py-3 flex items-center gap-2.5">
            <Img src={brand.logo} className="w-11 h-11 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[#222222] truncate">{brand.name}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">{brand.subscribers}人订阅 · {brand.discountText}</div>
            </div>
            <button
              {...bindTap('detail.brand-open', { params: { id: brand.id } })}
              className="text-[12px] rounded-full px-3 py-1 cursor-pointer bg-white"
              style={{ color: VIP.primary, border: `1px solid ${VIP.primary}` }}
            >
              进入专场
            </button>
          </div>
        )}

        {/* 详情图 */}
        <div className="mt-2 bg-white">
          <div className="text-center text-[12px] text-[#888888] py-2">—— 商品详情 ——</div>
          {item.detailImages.map((img, i) => (
            <Img key={i} src={img} className="w-full object-cover" />
          ))}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-2 py-1.5 gap-1">
        <button
          {...bindTap('detail.brand-open', { params: { id: item.brandId } })}
          className="w-11 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer text-[#666666]"
        >
          <IcShop size={18} /><span className="text-[10px]">店铺</span>
        </button>
        <button
          {...bindTap('detail.service-open')}
          className="w-11 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer text-[#666666]"
        >
          <IcService size={18} /><span className="text-[10px]">客服</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.favorite.toggle' }, {
            onTrigger: () => { toggleFavorite(item.id); showToast(isFav ? '已取消收藏' : '收藏成功'); },
          })}
          className="w-11 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
        >
          <IcHeart size={18} className={isFav ? 'fill-current' : ''} style={{ color: isFav ? VIP.primary : '#666666' }} />
          <span className="text-[10px]" style={{ color: isFav ? VIP.primary : '#666666' }}>{isFav ? '已收藏' : '收藏'}</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.sku.openForCart' }, { onTrigger: () => openPanel('sku', { mode: 'cart' }) })}
          className="flex-1 h-10 rounded-l-full text-[14px] font-semibold border-none cursor-pointer"
          style={{ background: VIP.ctaYellow, color: '#222' }}
        >
          加入购物车
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.sku.openForBuy' }, { onTrigger: () => openPanel('sku', { mode: 'buy' }) })}
          className="flex-1 h-10 rounded-r-full text-[14px] font-semibold border-none cursor-pointer text-white"
          style={{ background: VIP.ctaBlack }}
        >
          立即购买
        </button>
      </div>

      {/* SKU 面板 */}
      {panel === 'sku' && (
        <BottomSheet onClose={() => back()} closeBinding={undefined} title="选择规格">
          <div className="px-4 pb-2">
            <div className="flex gap-3 pb-3 border-b border-[#F5F5F5]">
              <Img src={item.image} className="w-20 h-20 rounded-lg object-cover" />
              <div className="flex-1">
                <Price value={item.price} size="l" />
                <div className="text-[11px] text-[#BBBBBB] line-through mt-0.5">¥{item.originPrice}</div>
                <div className="text-[12px] text-[#666666] mt-1">已选:{skuDesc}</div>
              </div>
            </div>
            {item.specs.map((spec) => {
              const isSize = spec.name === '尺码';
              return (
                <div key={spec.name} className="mt-3">
                  <div className="text-[13px] font-semibold mb-2 text-[#222222]">{spec.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {spec.options.map((opt) => {
                      const on = (selected[spec.name] ?? spec.options[0]) === opt;
                      const binding = isSize
                        ? bindTap({ kind: 'action', id: 'sku.size.select.target' }, {
                            params: { target: opt },
                            onTrigger: () => setSelected((s) => ({ ...s, [spec.name]: opt })),
                          })
                        : bindTap({ kind: 'action', id: 'sku.color.select.target' }, {
                            params: { target: opt },
                            onTrigger: () => setSelected((s) => ({ ...s, [spec.name]: opt })),
                          });
                      return (
                        <button
                          key={opt}
                          {...binding}
                          className="text-[12px] rounded px-3 py-1.5 border cursor-pointer"
                          style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#333', borderColor: '#EEE', background: '#F8F8F8' }}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <button
              {...bindTap({ kind: 'action', id: 'sku.sizeInfo.open' }, { onTrigger: () => openPanel('size') })}
              className="mt-3 flex items-center gap-1 text-[12px] bg-transparent border-none cursor-pointer p-0"
              style={{ color: VIP.primary }}
            >
              <IcRuler size={13} />尺码对照表
            </button>
            <div className="flex justify-between items-center mt-4">
              <span className="text-[13px] font-semibold text-[#222222]">购买数量</span>
              <Stepper
                value={qty}
                onChange={(d) => setQty((v) => Math.max(1, v + d))}
                binding={bindTap({ kind: 'action', id: 'sku.qty.change' }, { onTrigger: () => {} })}
              />
            </div>
          </div>
          <div className="px-4 mt-3">
            {skuMode === 'cart' ? (
              <button
                {...bindTap({ kind: 'action', id: 'sku.addToCart.submit' }, { onTrigger: confirmAddCart })}
                className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer"
                style={{ background: VIP.ctaYellow, color: '#222' }}
              >
                加入购物车
              </button>
            ) : (
              <button
                {...bindTap('sku.buyNow-open', {
                  beforeTrigger: () => addToCart(item.id, skuDesc, qty),
                })}
                className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white"
                style={{ background: VIP.ctaBlack }}
              >
                立即购买
              </button>
            )}
          </div>
        </BottomSheet>
      )}

      {/* 尺码对照表 */}
      {panel === 'size' && (
        <BottomSheet onClose={() => back()} title="尺码对照表" heightClass="max-h-[60%]">
          <div className="px-4 pb-4">
            <div className="flex justify-end mb-2">
              <button
                {...bindTap({ kind: 'action', id: 'size.unit.toggle' }, { onTrigger: () => setSizeUnit((u) => (u === 'cm' ? 'in' : 'cm')) })}
                className="text-[12px] rounded-full px-3 py-1 border cursor-pointer bg-white"
                style={{ color: VIP.primary, borderColor: VIP.primary }}
              >
                单位:{sizeUnit === 'cm' ? '厘米' : '英寸'}
              </button>
            </div>
            <table className="w-full text-[12px] text-center">
              <thead>
                <tr className="text-[#888888]">
                  <th className="py-2">尺码</th><th>胸围</th><th>腰围</th><th>建议体重</th>
                </tr>
              </thead>
              <tbody>
                {SIZE_TABLE.map((r) => {
                  const f = (v: string) => (sizeUnit === 'cm' ? v : (Number(v) / 2.54).toFixed(1));
                  return (
                    <tr key={r.size} className="border-t border-[#F5F5F5] text-[#222222]">
                      <td className="py-2 font-semibold">{r.size}</td><td>{f(r.bust)}</td><td>{f(r.waist)}</td><td>{r.rec}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </BottomSheet>
      )}

      {/* 评价弹层 */}
      {panel === 'reviews' && (
        <BottomSheet onClose={() => back()} title={`评价(${item.reviewCount})`}>
          <div className="px-4 pb-4">
            <div className="flex gap-2 flex-wrap">
              {reviewTags.map((t) => (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'reviews.filter.select.target' }, {
                    params: { target: t },
                    onTrigger: () => setReviewTag(t),
                  })}
                  className="text-[12px] rounded-full px-3 py-1.5 border-none cursor-pointer"
                  style={reviewTag === t ? { color: VIP.primary, background: '#FDECF5', fontWeight: 600 } : { color: '#333', background: '#F5F5F5' }}
                >
                  {t}
                </button>
              ))}
            </div>
            {shownReviews.map((r) => (
              <div key={r.id} className="py-3 border-b border-[#F5F5F5]">
                <div className="flex items-center gap-2">
                  <Img src={r.userAvatar} className="w-7 h-7 rounded-full" />
                  <span className="text-[13px] font-medium text-[#222222]">{r.userNick}</span>
                  <span className="text-[10px] text-[#888888]">{r.skuDesc}</span>
                </div>
                <div className="text-[13px] mt-1 leading-relaxed text-[#222222]">{r.content}</div>
                {r.images.length > 0 && (
                  <div className="flex gap-1.5 mt-1.5">
                    {r.images.map((img) => (
                      <button
                        key={img}
                        {...bindTap({ kind: 'action', id: 'reviews.media.open' }, { params: { reviewId: r.id }, onTrigger: () => showToast('查看大图') })}
                        className="border-none p-0 bg-transparent cursor-pointer"
                      >
                        <Img src={img} className="w-16 h-16 rounded-lg object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {shownReviews.length === 0 && <div className="text-[13px] text-[#888888] text-center py-8">该分类下暂无评价</div>}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
