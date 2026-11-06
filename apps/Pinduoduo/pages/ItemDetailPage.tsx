import React, { useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { ActivityResult } from '@/os/types/manifest';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, PriceYuan, FufeiTag, showToast, wontfix, Tag } from '../components/ui';
import { IcNavBack, IcStore, IcHeart, IcHeadphones, IcShare, IcClose, IcChevronRight, IcStar } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';
import { PayPinCapture } from '@/os/components/PayPinCapture';

const PAY_METHODS = ['先用后付', '微信支付', '支付宝', '多多钱包余额', '银行卡'];

// 正在拼单的其他用户(参团用,合成数据)
const PIN_USERS = [
  { name: '欧***耳', left: '剩 14:32:08' },
  { name: '香***林', left: '剩 08:15:44' },
  { name: '竹***义', left: '剩 21:47:19' },
];

export function ItemDetailPage() {
  const { itemId } = useParams();
  const [sp] = useSearchParams();
  const panel = sp.get('panel');
  const mode = (sp.get('mode') as 'group' | 'single' | 'join' | 'spec') || 'group';
  const { bindTap, bindBack, go, back } = usePinduoduoGestures();

  const item = usePinduoduoStore((s) => s.items.find((i) => i.id === itemId));
  const allItems = usePinduoduoStore((s) => s.items);
  const shop = usePinduoduoStore((s) => s.shops.find((sh) => sh.id === item?.shopId));
  const reviews = usePinduoduoStore((s) => s.reviews);
  const favorites = usePinduoduoStore((s) => s.favorites);
  const fufeiEnabled = usePinduoduoStore((s) => s.settings.fufeiEnabled);
  const toggleFavorite = usePinduoduoStore((s) => s.toggleFavorite);
  const addFootprint = usePinduoduoStore((s) => s.addFootprint);
  const ensureShopChat = usePinduoduoStore((s) => s.ensureShopChat);
  const placeOrder = usePinduoduoStore((s) => s.placeOrder);
  const addresses = usePinduoduoStore((s) => s.addresses);
  const selectedAddressId = usePinduoduoStore((s) => s.selectedAddressId);
  // 当前收货地址:选中 > 默认 > 首个;与 placeOrder 里的取址逻辑一致。
  const curAddr =
    addresses.find((a) => a.id === selectedAddressId) ||
    addresses.find((a) => a.isDefault) ||
    addresses[0];

  const [selected, setSelected] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [payMethod, setPayMethod] = useState('先用后付');
  const [imgIndex, setImgIndex] = useState(0);

  React.useEffect(() => {
    if (itemId) addFootprint(itemId);
  }, [itemId, addFootprint]);

  if (!item) return <div className="h-full pt-10 flex items-center justify-center text-[#999]">商品不存在</div>;
  const isFav = favorites.includes(item.id);
  const isFufei = payMethod === '先用后付' && fufeiEnabled && item.fufei;
  const buyMode: 'group' | 'single' | 'join' = mode === 'spec' ? 'group' : mode;
  const unitPrice = buyMode === 'single' ? item.singlePrice : item.pinPrice;
  const itemReviews = reviews.filter((review) => review.itemId === item.id);
  const variantImages = Array.from(new Set([
    ...(item.gallery.length ? item.gallery : [item.image]),
    ...allItems.filter((candidate) => candidate.category === item.category && candidate.id !== item.id).slice(0, 5).map((candidate) => candidate.image),
  ])).slice(0, 7);

  const submitOrder = () => {
    const skuDesc = item.specs.map((sp2) => selected[sp2.name] || sp2.options[0]).join(' ');
    if (buyMode === 'group' && isFufei) {
      placeOrder({ itemId: item.id, skuDesc, qty, mode: buyMode, payMethod, fufei: isFufei });
      go('sku.order.group');
    } else if (isFufei) {
      placeOrder({ itemId: item.id, skuDesc, qty, mode: buyMode, payMethod, fufei: true });
      go('sku.order.success');
    } else {
      go('sku.pay.open', { itemId: item.id });
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#F3F3F3] pt-10 overflow-hidden" data-status-bar-foreground="dark">
      {/* 内容滚动 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        <div className="relative w-full aspect-square bg-white">
          <div
            className="flex w-full h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
            data-scroll-container
            data-scroll-direction="horizontal"
            onScroll={(e) => {
              const el = e.currentTarget;
              const i = Math.round(el.scrollLeft / el.clientWidth);
              if (i !== imgIndex) setImgIndex(i);
            }}
          >
            {(item.gallery.length ? item.gallery : [item.image]).map((g, i) => (
              <div key={i} className="w-full h-full shrink-0 snap-center">
                <Img src={g} className="w-full h-full object-cover" alt={item.title} />
              </div>
            ))}
          </div>
          <span className="absolute right-2 bottom-3 bg-black/40 text-white text-[11px] px-2 py-0.5 rounded-full z-10">
            {imgIndex + 1}/{Math.max(item.gallery.length, 1)}
          </span>
          <div className="absolute left-2 right-2 top-2 flex items-center justify-between pointer-events-none">
            <button
              {...bindBack()}
              aria-label="返回"
              className="pointer-events-auto w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center"
            >
              <IcNavBack size={23} />
            </button>
            <div className="flex items-center gap-2">
              <button
                {...bindTap({ kind: 'action', id: 'detail.discover.wontfix' }, { onTrigger: wontfix })}
                aria-label="发现"
                className="pointer-events-auto w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center"
              >
                <IcStar size={19} />
              </button>
              <button
                {...bindTap('detail.share.show', { params: { itemId: item.id } })}
                aria-label="分享"
                className="pointer-events-auto w-9 h-9 rounded-full bg-black/45 text-white flex items-center justify-center"
              >
                <IcShare size={19} />
              </button>
            </div>
          </div>
          {item.gallery[1] && (
            <button
              {...bindTap({ kind: 'action', id: 'detail.explain.wontfix' }, { onTrigger: wontfix })}
              className="absolute right-3 top-[42%] w-[78px] z-10"
            >
              <span className="block w-[78px] h-[104px] rounded-lg overflow-hidden border border-white/80 shadow-lg">
                <Img src={item.gallery[1]} className="w-full h-full object-cover" alt="达人讲解" />
              </span>
              <span className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 text-white text-[11px]">
                <IcHeadphones size={12} fill="currentColor" />听讲解
              </span>
            </button>
          )}
          {item.gallery.length > 1 && (
            <div className="absolute left-0 right-0 bottom-3 flex justify-center gap-1 pointer-events-none">
              {item.gallery.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>

        {/* 价格区：百亿补贴商品展示惊喜特价，普通商品维持常规价格。 */}
        {item.subsidy ? (
          <div className="flex min-h-[66px]">
            <div className="flex-1 bg-[#F52E29] text-white px-3 py-2">
              <div className="flex items-end gap-2">
                <span className="text-[12px] mb-1">限1件</span>
                <PriceYuan value={item.pinPrice} className="text-[29px]" symbolClass="text-[15px]" />
                <span className="mb-1 text-[11px] bg-[#FFE4D1] text-[#E43B2E] rounded-[3px] px-1.5 py-0.5">
                  限时狂降{Math.max(item.originPrice - item.pinPrice, 0).toFixed(1)}元
                </span>
              </div>
              <div className="text-[11px] mt-0.5">
                <span className="border border-white/60 rounded-[2px] px-1 py-0.5">{item.sold}</span>
              </div>
            </div>
            <div className="w-[104px] bg-[#FFF0CD] text-[#8D451A] flex flex-col items-center justify-center">
              <span className="text-[17px] font-bold italic">惊喜特价</span>
              <span className="text-[11px] mt-0.5">先到先得</span>
            </div>
          </div>
        ) : (
          <div className="bg-white px-3 pt-2.5 pb-2">
            <div className="flex items-end gap-2">
              <PriceYuan value={item.pinPrice} className="text-[29px] text-[#E22E1F]" symbolClass="text-[15px]" />
              <span className="mb-1 text-[12px] text-[#999]">{item.sold}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#999]">
              <span>拼单价</span>
              <span>单独购买 ¥{item.singlePrice.toFixed(2)}</span>
              <span className="line-through">原价 ¥{item.originPrice.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* 款式缩略图 */}
        <div className="h-[62px] bg-white px-2 flex items-center gap-2 overflow-hidden border-b border-[#EFEFEF]">
          <div className="relative w-11 h-11 shrink-0 rounded-[3px] overflow-hidden border-2 border-[#E22E1F]">
            <Img src={item.image} className="w-full h-full object-cover" alt="商品" />
            <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[9px] text-center leading-4">商品</span>
          </div>
          {item.gallery[1] && (
            <div className="relative w-11 h-11 shrink-0 rounded-[3px] overflow-hidden border border-[#222]">
              <Img src={item.gallery[1]} className="w-full h-full object-cover" alt="达人秀" />
              <span className="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[9px] text-center leading-4">达人秀</span>
            </div>
          )}
          {variantImages.slice(1).map((image, index) => (
            <div
              key={`${image}_${index}`}
              className={`w-11 h-11 shrink-0 rounded-[3px] overflow-hidden ${
                index + 1 === imgIndex ? 'border-2 border-[#E22E1F]' : 'border border-[#E5E5E5]'
              }`}
            >
              <Img src={image} className="w-full h-full object-cover" alt={`${item.title}款式${index + 1}`} />
            </div>
          ))}
        </div>

        {/* 优惠、先用后付、标题与标签 */}
        <div className="bg-white px-3 pt-2.5 pb-2">
          <div className="flex items-center h-8 border-b border-[#F1F1F1] text-[12px]">
            <span className="text-[#E22E1F] border border-[#E9A39C] rounded-[2px] px-1.5 mr-2">领月卡券</span>
            <span className="text-[#D94338]">满40减3　立减10元 · 限1件</span>
            <IcChevronRight size={16} className="ml-auto text-[#AAA]" />
          </div>
          {item.fufei && (
            <div className="mt-2 h-8 px-2 rounded-[3px] bg-[#EAF9E8] text-[#18A432] flex items-center text-[12px]">
              <FufeiTag label="先用后付" />
              <span className="ml-1.5">支持0元下单，确认收货后再付款</span>
            </div>
          )}
          <div className="mt-2 text-[16px] font-medium leading-[23px] text-[#222]">
            <span className="inline-block mr-1 px-1 leading-[18px] border border-[#E56B62] text-[#E22E1F] text-[11px] rounded-[2px]">
              专卖店
            </span>
            {item.title}
          </div>
          <div className="flex gap-1 mt-2 overflow-hidden whitespace-nowrap">
            <Tag className="text-[#9A6B3D] border border-[#D7B38A] bg-white">{itemReviews.length}人好评</Tag>
            {item.tags.slice(0, 3).map((tag) => (
              <Tag key={tag} className="text-[#9A6B3D] border border-[#D7B38A] bg-white">{tag}</Tag>
            ))}
          </div>
          {shop && (
            <div className="w-full h-10 mt-2 px-2 rounded-[3px] bg-[#392D2A] text-[#F8E6D2] flex items-center text-left">
              <Img src={shop.logo} className="w-6 h-6 rounded-[3px] object-cover bg-white mr-2" alt={shop.name} />
              <span className="text-[13px] truncate">{shop.name}｜品牌官方正品，100%保障</span>
              <IcChevronRight size={17} className="ml-auto shrink-0" />
            </div>
          )}
        </div>

        {/* 大家都在拼(可直接参团) */}
        <div className="bg-white mt-2 px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] text-[#333]">
              <span className="text-[#E22E1F] font-medium">券后低价只剩1次</span>，全店704人在拼
            </span>
          </div>
          {PIN_USERS.slice(0, 2).map((u, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="w-7 h-7 rounded-full bg-[#FFE0D6] text-[#E22E1F] text-[12px] flex items-center justify-center shrink-0">{u.name[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#333] truncate">{u.name}</div>
                <div className="text-[11px] text-[#999]">拼单即将结束 · <span className="text-[#E22E1F]">{u.left}</span></div>
              </div>
              <button
                {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'join' } })}
                className="px-3 h-8 rounded-[4px] bg-[#E9362C] text-white text-[12px] shrink-0"
              >直接拼成</button>
            </div>
          ))}
        </div>

        {/* 选规格入口 */}
        <button {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'spec' } })} className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between text-left">
          <span className="text-[14px] text-[#333]">选择 {item.specs.map((sp2) => sp2.name).join('/')}</span>
          <IcChevronRight size={18} className="text-[#999]" />
        </button>

        {/* 商品参数 */}
        <button {...bindTap('detail.params.show', { params: { itemId: item.id } })} className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between text-left">
          <span className="text-[14px] text-[#333]">商品参数</span>
          <IcChevronRight size={18} className="text-[#999]" />
        </button>

        {/* 评价入口 */}
        <button {...bindTap('detail.reviews-open', { params: { itemId: item.id } })} className="w-full bg-white mt-2 px-3 py-3 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <IcStar size={16} className="text-[#E22E1F]" />
              <span className="text-[14px] text-[#333]">商品评价({itemReviews.length})</span>
            </div>
            <div className="flex items-center gap-1 text-[#999] text-[12px]">
              查看全部 <IcChevronRight size={16} />
            </div>
          </div>
          {itemReviews[0] && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-[12px] text-[#666]">
                <Img src={itemReviews[0].avatar} className="w-6 h-6 rounded-full object-cover" alt={itemReviews[0].user} />
                {itemReviews[0].user}
                <span className="text-[#E22E1F]">★★★★★</span>
              </div>
              <div className="mt-1.5 text-[12px] leading-[18px] text-[#555] line-clamp-2">{itemReviews[0].content}</div>
            </div>
          )}
        </button>

        {/* 举报 */}
        <button
          {...bindTap({ kind: 'action', id: 'detail.report.wontfix' }, { onTrigger: wontfix })}
          className="w-full text-center text-[12px] text-[#BBB] py-3"
        >
          举报此商品
        </button>

        {/* 图文详情 */}
        <div className="bg-white mt-2">
          <div className="text-center text-[13px] text-[#999] py-2 border-b border-[#F0F0F0]">— 图文详情 —</div>
          {item.detailImages.map((im, i) => (
            <Img key={i} src={im} className="w-full block" alt="详情" />
          ))}
        </div>
        <div className="h-16" />
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] flex items-stretch h-[58px]" data-hide-on-keyboard>
        <button {...bindTap('detail.shop-open', { params: { shopId: item.shopId } })} className="flex flex-col items-center justify-center w-[52px] text-[10px] text-[#666]">
          <IcStore size={20} strokeWidth={1.5} /> 店铺
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.favorite.toggle' }, { onTrigger: () => { toggleFavorite(item.id); showToast(isFav ? '已取消收藏' : '收藏成功'); } })}
          className="flex flex-col items-center justify-center w-[52px] text-[10px] text-[#666]"
        >
          <IcHeart size={20} strokeWidth={1.5} className={isFav ? 'text-[#E22E1F] fill-[#E22E1F]' : ''} /> 收藏
        </button>
        <button
          {...bindTap('detail.cs-open', { params: { chatId: `ch_${item.shopId}` }, beforeTrigger: () => ensureShopChat(item.shopId) })}
          className="flex flex-col items-center justify-center w-[52px] text-[10px] text-[#666]"
        >
          <IcHeadphones size={20} strokeWidth={1.5} /> 客服
        </button>
        {item.subsidy ? (
          <div className="flex-1 flex bg-[#F32B25] text-white">
            <button {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'single' } })} className="w-[48%] flex flex-col items-center justify-center leading-tight border-r border-white/20">
              <span className="text-[13px]">限量价 限1件</span>
              <PriceYuan value={item.singlePrice} className="text-[18px]" symbolClass="text-[12px]" />
            </button>
            <button {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'group' } })} className="flex-1 bg-[#E22E1F] text-white flex flex-col items-center justify-center leading-tight">
              <span className="text-[17px] font-semibold">惊喜特价</span>
              <span className="text-[11px] mt-0.5">发起拼单</span>
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-1.5 px-1">
            <button
              {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'single' } })}
              className="flex-1 h-10 rounded-l-full bg-[#FF8C1A] text-white flex flex-col items-center justify-center leading-tight"
            >
              <PriceYuan value={item.singlePrice} className="text-[15px]" symbolClass="text-[11px]" />
              <span className="text-[10px]">单独购买</span>
            </button>
            <button
              {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'group' } })}
              className="flex-1 h-10 rounded-r-full bg-[#E22E1F] text-white flex flex-col items-center justify-center leading-tight"
            >
              <PriceYuan value={item.pinPrice} className="text-[15px]" symbolClass="text-[11px]" />
              <span className="text-[10px]">发起拼单</span>
            </button>
          </div>
        )}
      </div>

      {/* —— SKU 下单弹层 —— */}
      {panel === 'sku' && (
        <SkuPanel
          item={item}
          selected={selected}
          setSelected={setSelected}
          qty={qty}
          setQty={setQty}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          isFufei={isFufei}
          unitPrice={unitPrice}
          mode={buyMode}
          addr={curAddr}
          onClose={() => back()}
          onSubmit={submitOrder}
          bindTap={bindTap}
        />
      )}

      {/* —— 收银台 —— */}
      {panel === 'pay' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">选择支付方式</span>
              <button {...bindBack()} aria-label="关闭"><IcClose size={20} className="text-[#999]" /></button>
            </div>
            <div className="text-center text-[26px] font-bold text-[#333] mb-4">¥{(unitPrice * qty).toFixed(2)}</div>
            {PAY_METHODS.filter((m) => m !== '先用后付').map((m) => (
              <button
                key={m}
                {...bindTap({ kind: 'action', id: 'cashier.method.select.option' }, { params: { method: m }, onTrigger: () => setPayMethod(m) })}
                className="w-full flex items-center justify-between py-3 border-b border-[#F2F2F2]"
              >
                <span className="text-[14px] text-[#333]">{m}</span>
                <span className={`w-4 h-4 rounded-full border ${payMethod === m ? 'border-[#E22E1F] bg-[#E22E1F]' : 'border-[#CCC]'}`} />
              </button>
            ))}
            <button
              {...bindTap('cashier.pay.confirm', {
                params: { itemId: item.id },
                onTrigger: () => {
                  const amount = unitPrice * qty;
                  const skuDesc = item.specs.map((sp2) => selected[sp2.name] || sp2.options[0]).join(' ');
                  const finishLocal = () => go('cashier.pay.confirm', { itemId: item.id });
                  const afterPaid = () => {
                    placeOrder({ itemId: item.id, skuDesc, qty, mode: buyMode, payMethod, fufei: false });
                    go('paypwd.pay.done');
                  };
                  if (payMethod === '支付宝') {
                    const launched = window.__OS__?.startActivityForResult?.(
                      'alipay',
                      {
                        action: 'ACTION_PAY',
                        scheme: 'alipays',
                        data: { amount, orderId: `pdd-${item.id}`, merchantName: '拼多多', subject: item.title, source: 'pinduoduo' },
                      },
                      (result: ActivityResult) => { if (result.resultCode === 'OK') afterPaid(); },
                    );
                    if (launched) return;
                  }
                  if (payMethod === '微信支付') {
                    const launched = window.__OS__?.startActivityForResult?.(
                      'wechat',
                      {
                        action: 'ACTION_PAY',
                        scheme: 'weixin',
                        data: { amount, orderId: `pdd-${item.id}`, merchantName: '拼多多', subject: item.title, source: 'pinduoduo' },
                      },
                      (result: ActivityResult) => { if (result.resultCode === 'OK') afterPaid(); },
                    );
                    if (launched) return;
                  }
                  finishLocal();
                },
              })}
              className="w-full mt-4 h-11 rounded-full bg-[#E22E1F] text-white font-medium"
            >
              确认支付 ¥{(unitPrice * qty).toFixed(2)}
            </button>
          </div>
        </div>
      )}

      {/* —— 支付密码键盘 —— */}
      {panel === 'pwd' && (
        <PwdPanel amount={unitPrice * qty} onDone={() => { placeOrder({ itemId: item.id, skuDesc: item.specs.map((sp2) => selected[sp2.name] || sp2.options[0]).join(' '), qty, mode: buyMode, payMethod, fufei: false }); go('paypwd.pay.done'); }} bindTap={bindTap} bindBack={bindBack} />
      )}

      {/* —— 分享弹层 —— */}
      {panel === 'share' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-4">
            <div className="text-center font-medium mb-4">分享给好友一起拼</div>
            <div className="flex justify-around text-[12px] text-[#666] mb-4">
              {['微信', '朋友圈', 'QQ好友', 'QQ空间'].map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    if (c === '微信' || c === '朋友圈') {
                      const launched = sharePlainText(`【拼多多】${item.title}`, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
                      if (launched) { back(); return; }
                    }
                    showToast('已唤起分享');
                    back();
                  }}
                  className="flex flex-col items-center gap-1"
                >
                  <span className="w-11 h-11 rounded-full bg-[#F2F2F2]" />{c}
                </button>
              ))}
            </div>
            <button {...bindBack()} className="w-full h-10 text-[#666] border-t border-[#F0F0F0]">取消</button>
          </div>
        </div>
      )}

      {/* —— 商品参数弹层 —— */}
      {panel === 'params' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-4 max-h-[70%] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">商品参数</span>
              <button {...bindBack()} aria-label="关闭"><IcClose size={20} className="text-[#999]" /></button>
            </div>
            {[['品牌', shop?.name || '拼多多'], ['品类', item.category], ['货号', item.id.toUpperCase()], ['产地', '中国大陆'], ['服务', item.tags.join('、')]].map(([k, v]) => (
              <div key={k} className="flex py-2.5 border-b border-[#F5F5F5] text-[14px]">
                <span className="w-20 text-[#999]">{k}</span>
                <span className="flex-1 text-[#333]">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ——— SKU 下单弹层 ———
function SkuPanel({
  item, selected, setSelected, qty, setQty, payMethod, setPayMethod, isFufei, unitPrice, mode, addr, onClose, onSubmit, bindTap,
}: any) {
  const modeLabel = mode === 'single' ? '单独购买' : mode === 'join' ? '直接拼成' : '发起拼单';
  const firstSpec = item.specs[0];
  const optIdx = firstSpec ? Math.max(0, firstSpec.options.indexOf(selected[firstSpec.name] || firstSpec.options[0])) : 0;
  const skuImg = item.gallery[optIdx % item.gallery.length] || item.image;
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl max-h-[85%] flex flex-col">
        <div className="flex gap-3 p-3">
          <Img src={skuImg} className="w-20 h-20 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <PriceYuan value={unitPrice} className="text-[#E22E1F] text-[22px]" />
            <div className="text-[12px] text-[#999] mt-1 truncate">
              已选:{item.specs.map((sp2: any) => selected[sp2.name] || sp2.options[0]).join(' ')}
            </div>
          </div>
          <button onClick={onClose} aria-label="关闭"><IcClose size={22} className="text-[#999]" /></button>
        </div>

        {/* 收货地址(读当前选中地址,选地址页选择后同步) */}
        <button {...bindTap('sku.address-open')} className="mx-3 mb-2 px-3 py-2 bg-[#F7F7F7] rounded-lg flex items-center justify-between text-left gap-2">
          {addr ? (
            <span className="min-w-0 flex-1">
              <span className="text-[12px] text-[#333] mr-1">{addr.name} {addr.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')}</span>
              <span className="text-[12px] text-[#666] block truncate">送至:{addr.region} {addr.detail}</span>
            </span>
          ) : (
            <span className="text-[12px] text-[#666] truncate">请选择收货地址</span>
          )}
          <IcChevronRight size={16} className="text-[#999] shrink-0" />
        </button>

        <div className="flex-1 overflow-y-auto px-3">
          {item.specs.map((sp2: any) => (
            <div key={sp2.name} className="mb-3">
              <div className="text-[13px] text-[#333] mb-2">{sp2.name}</div>
              <div className="flex flex-wrap gap-2">
                {sp2.options.map((o: string) => {
                  const on = (selected[sp2.name] || sp2.options[0]) === o;
                  return (
                    <button
                      key={o}
                      {...bindTap({ kind: 'action', id: 'sku.spec.select.option' }, { params: { spec: sp2.name, option: o }, onTrigger: () => setSelected((s: any) => ({ ...s, [sp2.name]: o })) })}
                      className={`px-3 py-1.5 rounded-full text-[13px] border ${on ? 'border-[#E22E1F] text-[#E22E1F] bg-[#FFF0E8]' : 'border-[#EEE] text-[#333] bg-[#F7F7F7]'}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between py-2">
            <span className="text-[13px] text-[#333]">购买数量</span>
            <div className="flex items-center border border-[#EEE] rounded">
              <button {...bindTap({ kind: 'action', id: 'sku.qty.step' }, { params: { delta: -1 }, onTrigger: () => setQty((q: number) => Math.max(1, q - 1)) })} className="w-8 h-7 text-[#666]">−</button>
              <span className="w-9 text-center text-[14px]">{qty}</span>
              <button {...bindTap({ kind: 'action', id: 'sku.qty.step' }, { params: { delta: 1 }, onTrigger: () => setQty((q: number) => q + 1) })} className="w-8 h-7 text-[#666]">+</button>
            </div>
          </div>
          {/* 支付方式提示 */}
          <button
            {...bindTap({ kind: 'action', id: 'sku.pay.switch' }, { params: { method: isFufei ? '多多钱包余额' : '先用后付' }, onTrigger: () => setPayMethod(isFufei ? '多多钱包余额' : '先用后付') })}
            className="w-full text-left text-[12px] text-[#20B010] py-2"
          >
            {isFufei ? '使用先用后付,0元下单 · 点此更换支付方式' : `使用${payMethod} · 点此改用先用后付`}
          </button>
        </div>

        <div className="p-3 border-t border-[#F0F0F0]">
              <button {...bindTap(mode === 'group' && isFufei ? 'sku.order.group' : (isFufei ? 'sku.order.success' : 'sku.pay.open'), (mode === 'group' && isFufei) || isFufei ? { params: {}, onTrigger: onSubmit } : { params: { itemId: item.id }, onTrigger: onSubmit })} className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium flex flex-col items-center justify-center leading-tight">
            {isFufei ? (
              <><span>0元下单,确认收货后付款 ¥{(unitPrice * qty).toFixed(2)}</span></>
            ) : (
              <span>{modeLabel} ¥{(unitPrice * qty).toFixed(2)}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ——— 支付密码键盘 ———
function PwdPanel({ amount, onDone, bindTap, bindBack }: any) {
  const [digits, setDigits] = useState('');
  const doneRef = useRef(false);
  const apply = (next: string) => {
    const clipped = next.replace(/\D/g, '').slice(0, 6);
    setDigits(clipped);
    if (clipped.length === 6 && !doneRef.current) {
      doneRef.current = true;
      setTimeout(onDone, 200);
    }
  };
  const press = (d: string) => apply(digits + d);
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" {...bindBack()} />
      <div className="relative bg-white rounded-t-2xl p-4" data-keep-keyboard>
        <PayPinCapture value={digits} onChange={apply} />
        <div className="text-center font-medium mb-1">请输入多多钱包密码</div>
        <div className="text-center text-[13px] text-[#999] mb-3">¥{amount.toFixed(2)}</div>
        <div className="flex justify-center gap-2 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="w-9 h-9 border border-[#DDD] rounded flex items-center justify-center text-lg">{digits[i] ? '●' : ''}</span>
          ))}
        </div>
        <button {...bindTap({ kind: 'action', id: 'paypwd.recover.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })} className="text-[12px] text-[#3B82F6] mb-3">找回密码</button>
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) => (
            <button
              key={i}
              {...(k && k !== '⌫'
                ? bindTap({ kind: 'action', id: 'paypwd.digit.input' }, { params: { value: k }, onTrigger: () => press(k) })
                : {})}
              onClick={k === '⌫' ? () => { doneRef.current = false; setDigits((d) => d.slice(0, -1)); } : undefined}
              className={`h-11 rounded text-lg ${k ? 'bg-[#F5F5F5]' : ''}`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
