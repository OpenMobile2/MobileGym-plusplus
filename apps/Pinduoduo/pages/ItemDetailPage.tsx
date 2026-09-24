import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, PriceYuan, FufeiTag, showToast, wontfix, Tag } from '../components/ui';
import { IcNavBack, IcStore, IcHeart, IcHeadphones, IcShare, IcClose, IcChevronRight, IcStar } from '../res/icons';

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
  const shop = usePinduoduoStore((s) => s.shops.find((sh) => sh.id === item?.shopId));
  const favorites = usePinduoduoStore((s) => s.favorites);
  const fufeiEnabled = usePinduoduoStore((s) => s.settings.fufeiEnabled);
  const toggleFavorite = usePinduoduoStore((s) => s.toggleFavorite);
  const addFootprint = usePinduoduoStore((s) => s.addFootprint);
  const ensureShopChat = usePinduoduoStore((s) => s.ensureShopChat);
  const placeOrder = usePinduoduoStore((s) => s.placeOrder);

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

  const submitOrder = () => {
    const skuDesc = item.specs.map((sp2) => selected[sp2.name] || sp2.options[0]).join(' ');
    if (buyMode === 'group') {
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
    <div className="h-full flex flex-col bg-[#F5F5F5] pt-10 overflow-hidden" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="shrink-0 h-11 flex items-center px-2 bg-white">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center font-medium">商品</div>
        <button {...bindTap('detail.share.show', { params: { itemId: item.id } })} aria-label="分享" className="w-9 h-9 flex items-center justify-center">
          <IcShare size={20} />
        </button>
      </div>

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
          <span className="absolute right-2 bottom-2 bg-black/40 text-white text-[11px] px-2 py-0.5 rounded-full">
            {imgIndex + 1}/{Math.max(item.gallery.length, 1)}
          </span>
          {item.gallery.length > 1 && (
            <div className="absolute left-0 right-0 bottom-2 flex justify-center gap-1 pointer-events-none">
              {item.gallery.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full ${i === imgIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </div>

        {/* 价格区 */}
        <div className="bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white px-3 py-2.5">
          <div className="flex items-end gap-2">
            <PriceYuan value={item.pinPrice} className="text-[26px]" symbolClass="text-[15px]" />
            <span className="text-[13px] line-through opacity-80">¥{item.originPrice}</span>
            <span className="ml-auto text-[12px] bg-white/20 rounded px-1.5 py-0.5">{item.sold}</span>
          </div>
          <div className="text-[12px] mt-1 opacity-95">拼单价 · 单独购买 ¥{item.singlePrice}</div>
        </div>

        {/* 标题 + 标签 */}
        <div className="bg-white px-3 py-2">
          <div className="flex gap-1 flex-wrap mb-1">
            {item.fufei && <FufeiTag />}
            {item.tags.map((t) => (
              <Tag key={t} className="text-[#E22E1F] bg-[#FFF0E8]">{t}</Tag>
            ))}
          </div>
          <div className="text-[15px] font-medium leading-snug text-[#333]">{item.title}</div>
        </div>

        {/* 大家都在拼(可直接参团) */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-medium text-[#333]">大家都在拼</span>
            <span className="text-[12px] text-[#999]">{item.sold}</span>
          </div>
          {PIN_USERS.map((u, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <span className="w-7 h-7 rounded-full bg-[#FFE0D6] text-[#E22E1F] text-[12px] flex items-center justify-center shrink-0">{u.name[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#333] truncate">{u.name}</div>
                <div className="text-[11px] text-[#999]">还差 1 人成团 · <span className="text-[#E22E1F]">{u.left}</span></div>
              </div>
              <button
                {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'join' } })}
                className="px-3.5 h-7 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white text-[12px] shrink-0"
              >去拼单</button>
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
        <button {...bindTap('detail.reviews-open', { params: { itemId: item.id } })} className="w-full bg-white mt-2 px-3 py-3 flex items-center justify-between text-left">
          <div className="flex items-center gap-1">
            <IcStar size={16} className="text-[#E22E1F]" />
            <span className="text-[14px] text-[#333]">商品评价({item.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-[#999] text-[12px]">
            {item.reviewTags.slice(0, 2).join(' · ')} <IcChevronRight size={16} />
          </div>
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
      <div className="shrink-0 bg-white border-t border-[#EEE] flex items-center px-1 h-14" data-hide-on-keyboard>
        <button {...bindTap('detail.shop-open', { params: { shopId: item.shopId } })} className="flex flex-col items-center justify-center w-12 text-[10px] text-[#666]">
          <IcStore size={19} /> 店铺
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'detail.favorite.toggle' }, { onTrigger: () => { toggleFavorite(item.id); showToast(isFav ? '已取消收藏' : '收藏成功'); } })}
          className="flex flex-col items-center justify-center w-12 text-[10px] text-[#666]"
        >
          <IcHeart size={19} className={isFav ? 'text-[#E22E1F] fill-[#E22E1F]' : ''} /> 收藏
        </button>
        <button
          {...bindTap('detail.cs-open', { params: { chatId: `ch_${item.shopId}` }, beforeTrigger: () => ensureShopChat(item.shopId) })}
          className="flex flex-col items-center justify-center w-12 text-[10px] text-[#666]"
        >
          <IcHeadphones size={19} /> 客服
        </button>
        <div className="flex-1 flex ml-1 rounded-full overflow-hidden h-10">
          <button {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'single' } })} className="flex-1 bg-[#FF8C1A] text-white flex flex-col items-center justify-center leading-tight">
            <PriceYuan value={item.singlePrice} className="text-[15px]" symbolClass="text-[11px]" />
            <span className="text-[10px]">单独购买</span>
          </button>
          <button {...bindTap('detail.sku.show', { params: { itemId: item.id, mode: 'group' } })} className="flex-1 bg-[#E22E1F] text-white flex flex-col items-center justify-center leading-tight">
            <PriceYuan value={item.pinPrice} className="text-[15px]" symbolClass="text-[11px]" />
            <span className="text-[10px]">发起拼单</span>
          </button>
        </div>
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
            <button {...bindTap('cashier.pay.confirm', { params: { itemId: item.id } })} className="w-full mt-4 h-11 rounded-full bg-[#E22E1F] text-white font-medium">
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
                <button key={c} onClick={() => { showToast('已唤起分享'); back(); }} className="flex flex-col items-center gap-1">
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
  item, selected, setSelected, qty, setQty, payMethod, setPayMethod, isFufei, unitPrice, mode, onClose, onSubmit, bindTap,
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

        {/* 收货地址 */}
        <button {...bindTap('sku.address-open')} className="mx-3 mb-2 px-3 py-2 bg-[#F7F7F7] rounded-lg flex items-center justify-between text-left">
          <span className="text-[12px] text-[#666] truncate">送至:江苏省南京市栖霞区仙林大道…</span>
          <IcChevronRight size={16} className="text-[#999]" />
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
          <button {...bindTap(mode === 'group' ? 'sku.order.group' : (isFufei ? 'sku.order.success' : 'sku.pay.open'), mode === 'group' || isFufei ? { params: {}, onTrigger: onSubmit } : { params: { itemId: item.id }, onTrigger: onSubmit })} className="w-full h-12 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium flex flex-col items-center justify-center leading-tight">
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
  const press = (d: string) => {
    const next = (digits + d).slice(0, 6);
    setDigits(next);
    if (next.length === 6) setTimeout(onDone, 200);
  };
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" {...bindBack()} />
      <div className="relative bg-white rounded-t-2xl p-4" data-keep-keyboard>
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
              onClick={k === '⌫' ? () => setDigits((d) => d.slice(0, -1)) : undefined}
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
