import React, { useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, Tag, showToast, wontfix } from '../components/ui';
import {
  IcNavBack, IcSearch, IcHeart, IcShare, IcStore, IcHeadphones, IcTabCart,
  IcMinus, IcPlus, IcClose, IcChevronRight, IcGrid,
} from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';

const ANCHORS = ['商品', '大家评', '详情', '推荐'];

// 附加服务(优选服务/保障),按品类给对应服务——不能所有商品都套笔记本的延保。
const ADDONS_BY_CAT: Record<string, { name: string; price: number }[]> = {
  电脑办公: [
    { name: '只换不修 4年全保换新', price: 569 },
    { name: '官方服务 延保至3年', price: 240 },
    { name: '+69元起 支架防护套餐', price: 69 },
  ],
  手机: [
    { name: '碎屏保 1年(含屏幕维修)', price: 199 },
    { name: '延保服务 2年', price: 159 },
    { name: '意外保 进水/摔落', price: 99 },
  ],
  家电: [
    { name: '送装一体 + 旧机回收', price: 0 },
    { name: '延保服务 3年', price: 129 },
  ],
  服饰鞋包: [
    { name: '退货运费险', price: 0.5 },
    { name: '7天无忧试穿', price: 0 },
  ],
  居家日用: [{ name: '退货运费险', price: 0.5 }],
  美妆个护: [
    { name: '正品保障 假一赔十', price: 0 },
    { name: '退货运费险', price: 0.5 },
  ],
  食品酒饮: [{ name: '破损包退 · 极速退款', price: 0 }],
  生鲜: [{ name: '坏果包赔 · 不新鲜退款', price: 0 }],
};

export function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const { bindTap, bindBack, back } = useJingdongGestures();
  const [sp, setSp] = useSearchParams();
  const items = useJingdongStore((s) => s.items);
  const favorites = useJingdongStore((s) => s.favorites);
  const cart = useJingdongStore((s) => s.cart);
  const toggleFavorite = useJingdongStore((s) => s.toggleFavorite);
  const addToCart = useJingdongStore((s) => s.addToCart);
  const addFootprint = useJingdongStore((s) => s.addFootprint);
  const ensureShopChat = useJingdongStore((s) => s.ensureShopChat);

  const item = items.find((i) => i.id === itemId) || items[0];
  const cartCount = cart.reduce((n, c) => n + c.qty, 0);
  const faved = favorites.includes(item.id);
  const chatId = `ch_${item.shopId}`;

  // 进详情即记足迹
  useEffect(() => {
    if (item?.id) addFootprint(item.id);
  }, [item?.id, addFootprint]);

  const [anchor, setAnchor] = useState(0);
  // 锚点 tab → 滚动定位到对应板块(商品/大家评/详情/推荐)
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const gotoSection = (i: number) => { setAnchor(i); sectionRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  // 规格选择:每个维度选中的下标
  const [sel, setSel] = useState<number[]>(() => item.specs.map(() => 0));
  const [qty, setQty] = useState(1);
  const [addons, setAddons] = useState<number[]>([]);
  const ADDONS = ADDONS_BY_CAT[item.category] ?? [];

  const panel = sp.get('panel');
  const skuMode = sp.get('skumode') || 'cart'; // cart | buy
  const skuDesc = item.specs.map((spx, i) => spx.options[sel[i] ?? 0]).join(' ');

  const openSku = (mode: 'cart' | 'buy') => {
    setSp((p) => { p.set('panel', 'sku'); p.set('skumode', mode); return p; });
  };
  const confirmAddCart = () => {
    addToCart(item.id, qty, skuDesc, 'shopping');
    showToast('已加入购物车');
    back();
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部:返回 + 搜索 + 收藏 + 分享。pt-10 预留状态栏;不与 h-11 同层(否则内容被挤回状态栏底下) */}
      <div className="shrink-0 pt-10 pb-1.5 flex items-center gap-2 px-2 bg-white">
        <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <div className="flex-1 h-8 rounded-full border border-[#E1251B] flex items-center px-3 gap-1 text-[13px] text-[#333]">
          <IcSearch size={14} className="text-[#999]" />
          <span className="truncate">{item.title.slice(0, 10)}</span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'detail.favorite.toggle' }, { onTrigger: () => { toggleFavorite(item.id); showToast(faved ? '已取消收藏' : '已收藏'); } })}
          aria-label="收藏" className="w-8 h-8 flex items-center justify-center"
        >
          <IcHeart size={20} className={faved ? 'text-[#E1251B]' : 'text-[#333]'} fill={faved ? '#E1251B' : 'none'} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.share.wontfix' }, {
            onTrigger: () => {
              const launched = sharePlainText(`【京东】${item.title}`, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
              if (!launched) wontfix();
            },
          })}
          aria-label="分享" className="w-8 h-8 flex items-center justify-center"
        >
          <IcShare size={19} className="text-[#333]" />
        </button>
      </div>

      {/* 锚点tab */}
      <div className="shrink-0 flex items-center bg-white border-b border-[#F0F0F0]">
        {ANCHORS.map((a, i) => (
          <button
            key={a}
            {...bindTap({ kind: 'action', id: 'detail.anchor.select.section' }, { onTrigger: () => gotoSection(i) })}
            className={`flex-1 py-2 text-[15px] ${anchor === i ? 'text-[#1A1A1A] font-semibold' : 'text-[#666]'}`}
          >
            {a}
            {anchor === i && <div className="mx-auto mt-1 w-5 h-0.5 rounded bg-[#E1251B]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="item-detail" data-scroll-direction="vertical">
        {/* 主图(锚点:商品) */}
        <div ref={(el) => { sectionRefs.current[0] = el; }} className="w-full aspect-square bg-white">
          <Img src={item.gallery[0]} className="w-full h-full object-contain" alt={item.title} />
        </div>

        {/* 价格区(白条区红) */}
        <div className="bg-gradient-to-r from-[#E1251B] to-[#FF5A45] px-3 py-2.5 text-white">
          <div className="flex items-end gap-2">
            {item.guobu && <span className="text-[12px] bg-white/20 rounded px-1 py-0.5 mb-1">国补领后价</span>}
            <PriceYuan value={item.price} className="text-[28px] leading-none" symbolClass="text-[15px]" />
            <span className="text-[12px] text-white/70 line-through mb-1">¥{item.originPrice}</span>
          </div>
          {item.guobu && (
            <div className="mt-1 text-[12px] text-white/90">国家补贴领后减{item.guobuOff.toFixed(2)}</div>
          )}
          {item.baitiaoPeriods.length > 0 && (
            <div className="mt-1 inline-flex items-center gap-1 bg-white/15 rounded px-1.5 py-0.5 text-[11px]">
              白条 {item.baitiaoPeriods[item.baitiaoPeriods.length - 1]}期免息
            </div>
          )}
        </div>

        {/* 标题 + 标签 */}
        <div className="bg-white px-3 py-2.5">
          <div className="text-[16px] leading-[22px] text-[#1A1A1A]">
            {item.self && <span className="text-[#E1251B] font-semibold mr-1">自营</span>}
            {item.title}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.jdLogistics && <Tag className="text-[#E1251B] border border-[#E1251B]/30">京东物流</Tag>}
            {item.tags.filter((t) => t !== '自营' && t !== '京东物流').map((t) => (
              <Tag key={t} className="text-[#1BA956] bg-[#1BA956]/8">{t}</Tag>
            ))}
            <span className="text-[11px] text-[#999]">{item.sold}</span>
          </div>
        </div>

        {/* 大家评入口(锚点:大家评) */}
        <button
          ref={(el) => { sectionRefs.current[1] = el as unknown as HTMLDivElement; }}
          {...bindTap('detail.reviews-open', { params: { itemId: item.id } })}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between"
        >
          <span className="text-[14px] font-medium text-[#1A1A1A]">大家评 <span className="text-[#999] font-normal">({item.reviewCount})</span></span>
          <span className="flex items-center text-[12px] text-[#999]">好评率{item.goodRate} 查看全部<IcChevronRight size={14} /></span>
        </button>

        {/* 店铺入口 */}
        <button
          {...bindTap('detail.shop-open', { params: { shopId: item.shopId } })}
          className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between"
        >
          <span className="flex items-center gap-2">
            <IcStore size={18} className="text-[#E1251B]" />
            <span className="text-[14px] text-[#1A1A1A]">进入店铺</span>
          </span>
          <IcChevronRight size={16} className="text-[#CCC]" />
        </button>

        {/* 规格参数(锚点:详情) */}
        <div ref={(el) => { sectionRefs.current[2] = el; }} className="bg-white mt-2 px-3 py-3">
          <div className="text-[15px] font-semibold text-[#1A1A1A] mb-2">规格参数</div>
          <div className="border border-[#F0F0F0] rounded">
            {item.specs.map((spx, i) => (
              <div key={spx.name} className={`flex text-[13px] ${i > 0 ? 'border-t border-[#F0F0F0]' : ''}`}>
                <div className="w-24 px-3 py-2 text-[#999] bg-[#FAFAFA]">{spx.name}</div>
                <div className="flex-1 px-3 py-2 text-[#333]">{spx.options.join(' / ')}</div>
              </div>
            ))}
            <div className="flex text-[13px] border-t border-[#F0F0F0]">
              <div className="w-24 px-3 py-2 text-[#999] bg-[#FAFAFA]">分类</div>
              <div className="flex-1 px-3 py-2 text-[#333]">{item.category}</div>
            </div>
          </div>
        </div>

        {/* 图文详情(锚点:推荐) */}
        <div ref={(el) => { sectionRefs.current[3] = el; }} className="bg-white mt-2 pb-4">
          <div className="px-3 py-3 text-[15px] font-semibold text-[#1A1A1A]">图文详情</div>
          {item.detailImages.map((src, i) => (
            <Img key={i} src={src} className="w-full object-cover" alt="详情" />
          ))}
        </div>
      </div>

      {/* 底栏 */}
      <div className="shrink-0 flex items-stretch bg-white border-t border-[#EEE] h-14">
        <button {...bindTap('detail.shop-open', { params: { shopId: item.shopId } })} className="w-14 flex flex-col items-center justify-center gap-0.5">
          <IcStore size={18} className="text-[#666]" /><span className="text-[10px] text-[#666]">店铺</span>
        </button>
        <button
          {...bindTap('detail.cs-open', { params: { chatId }, beforeTrigger: () => ensureShopChat(item.shopId) })}
          className="w-14 flex flex-col items-center justify-center gap-0.5"
        >
          <IcHeadphones size={18} className="text-[#666]" /><span className="text-[10px] text-[#666]">客服</span>
        </button>
        <button {...bindTap('detail.cart-open')} className="w-14 flex flex-col items-center justify-center gap-0.5 relative">
          <IcTabCart size={18} className="text-[#666]" />
          {cartCount > 0 && <span className="absolute top-1.5 right-2 min-w-3.5 h-3.5 px-0.5 rounded-full bg-[#E1251B] text-white text-[9px] leading-[14px] text-center">{cartCount}</span>}
          <span className="text-[10px] text-[#666]">购物车</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.sku.show' }, { onTrigger: () => openSku('cart') })}
          className="flex-1 m-2 ml-1 rounded-l-full bg-[#FFB000] text-white text-[15px] font-medium"
        >加入购物车</button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.buy.show' }, { onTrigger: () => openSku('buy') })}
          className="flex-1 my-2 mr-2 rounded-r-full bg-[#E1251B] text-white text-[15px] font-medium flex flex-col items-center justify-center leading-tight"
        >
          <span>立即购买</span>
          {item.baitiaoPeriods.length > 0 && <span className="text-[10px] font-normal">白条{item.baitiaoPeriods[item.baitiaoPeriods.length - 1]}期免息</span>}
        </button>
      </div>

      {/* SKU 规格弹层 */}
      {panel === 'sku' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1 bg-black/40" />
          <div className="bg-white rounded-t-2xl max-h-[82%] flex flex-col">
            {/* 头部 */}
            <div className="flex gap-3 p-3 relative">
              <Img src={item.image} className="w-24 h-24 rounded-lg object-cover -mt-8 border-2 border-white bg-white" alt={item.title} />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-end gap-2">
                  <PriceYuan value={item.price} className="text-[#E1251B] text-[22px]" />
                  {item.guobu && <span className="text-[11px] text-[#1BA956] border border-[#1BA956]/40 rounded px-1 mb-1">国补领后价</span>}
                  <span className="text-[12px] text-[#BBB] line-through mb-1">¥{item.originPrice}</span>
                </div>
                {item.guobu && <div className="text-[11px] text-[#E1251B] mt-0.5">国家补贴领后减{item.guobuOff.toFixed(2)}</div>}
                <div className="text-[11px] text-[#999] mt-0.5">已选 {skuDesc} · {qty}件</div>
              </div>
              <button {...bindBack()} aria-label="关闭" className="absolute right-2 top-2 w-7 h-7 flex items-center justify-center">
                <IcClose size={20} className="text-[#999]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-2">
              {/* 规格维度 */}
              {item.specs.map((spx, dim) => (
                <div key={spx.name} className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[14px] text-[#1A1A1A]">{spx.name}</span>
                    {dim === 0 && <span className="flex items-center text-[12px] text-[#666]"><IcGrid size={13} className="mr-0.5" />大图</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {spx.options.map((opt, oi) => {
                      const active = (sel[dim] ?? 0) === oi;
                      return (
                        <button
                          key={opt}
                          {...bindTap({ kind: 'action', id: 'sku.spec.select.variant' }, { onTrigger: () => setSel((s) => s.map((v, i) => (i === dim ? oi : v))) })}
                          className={`px-3 py-2 rounded text-[13px] border ${active ? 'border-[#E1251B] text-[#E1251B] bg-[#FFF0EF]' : 'border-[#EEE] text-[#333] bg-[#F7F7F7]'}`}
                        >{opt}</button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* 优选服务/保障(按品类,无则不展示) */}
              {ADDONS.length > 0 && (
                <div className="mb-3">
                  <div className="text-[14px] text-[#1A1A1A] mb-2">优选服务 / 保障</div>
                  <div className="flex flex-col gap-2">
                    {ADDONS.map((ad, i) => {
                      const on = addons.includes(i);
                      return (
                        <button
                          key={ad.name}
                          {...bindTap({ kind: 'action', id: 'sku.addon.toggle' }, { onTrigger: () => setAddons((a) => (a.includes(i) ? a.filter((x) => x !== i) : [...a, i])) })}
                          className={`flex items-center justify-between px-3 py-2 rounded border text-[13px] ${on ? 'border-[#E1251B] bg-[#FFF0EF]' : 'border-[#EEE] bg-[#F7F7F7]'}`}
                        >
                          <span className="text-[#333]">{ad.name}</span>
                          <span className="flex items-center gap-2">
                            <span className="text-[#E1251B]">{ad.price > 0 ? `¥${ad.price}` : '免费'}</span>
                            <span className={`w-4 h-4 rounded-full border ${on ? 'bg-[#E1251B] border-[#E1251B]' : 'border-[#CCC]'}`} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 数量 */}
              <div className="flex items-center justify-between py-2">
                <span className="text-[14px] text-[#1A1A1A]">数量</span>
                <div className="flex items-center border border-[#EEE] rounded">
                  <button
                    {...bindTap({ kind: 'action', id: 'sku.qty.step' }, { onTrigger: () => setQty((q) => Math.max(1, q - 1)) })}
                    aria-label="减少" className="w-9 h-8 flex items-center justify-center"
                  ><IcMinus size={15} className="text-[#666]" /></button>
                  <span className="w-10 text-center text-[14px]">{qty}</span>
                  <button
                    {...bindTap({ kind: 'action', id: 'sku.qty.step' }, { onTrigger: () => setQty((q) => q + 1) })}
                    aria-label="增加" className="w-9 h-8 flex items-center justify-center"
                  ><IcPlus size={15} className="text-[#666]" /></button>
                </div>
              </div>
            </div>

            {/* 确定 */}
            <div className="p-3 pt-2">
              {skuMode === 'buy' ? (
                <button
                  {...bindTap('sku.confirm-buy', {
                    params: { buyItemId: item.id, qty: String(qty), skuDesc },
                  })}
                  className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-medium"
                >确定</button>
              ) : (
                <button
                  {...bindTap({ kind: 'action', id: 'sku.confirm.addcart' }, { onTrigger: confirmAddCart })}
                  className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-medium"
                >确定</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
