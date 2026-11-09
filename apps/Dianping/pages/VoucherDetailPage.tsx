import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcStar, IcStarOutline, IcShare, IcMore, IcChevronRight, IcMapMini } from '../res/icons';
import { Stars } from '../components/Stars';
import { shopCoverUrl, dishImageUrl } from '../assets';
import { sharePlainText } from '@/os/shareBridge';

const RULES = [
  ['有效期', '购买之后60天有效'],
  ['可用时间', '营业时间内可用'],
  ['适用范围', '仅适用于铁盘，红盘，黄盘，绿盘'],
  ['包间规则', '包间使用条件请咨询商家'],
  ['叠加规则', '不限使用张数'],
  ['店内优惠规则', '团购用户不可同时享受商家其他优惠'],
  ['预约规则', '无需预约，消费高峰期可能需要等位'],
  ['使用方式', '仅限堂食'],
];

export default function VoucherDetailPage() {
  const { shopId = '', dealId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const deal = shop?.deals.find((d) => d.id === dealId);
  const showToast = useDianpingStore((st) => st.showToast);
  const favKey = `${shopId}:${dealId}`;
  const faved = useDianpingStore((st) => st.favoriteDealIds.includes(favKey));
  const toggleFavoriteDeal = useDianpingStore((st) => st.toggleFavoriteDeal);

  if (!shop || !deal) {
    return (
      <div className="p-4 pt-10">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  const discount = deal.origin - deal.price - 1;
  const off = ((deal.price / deal.origin) * 10).toFixed(1);

  return (
    <div className="relative flex h-full flex-col bg-[#F2F2F2]" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex h-11 items-center justify-between bg-white px-1">
        <button type="button" className="border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="border-none bg-transparent p-1.5 cursor-pointer"
            {...action('voucher.fav.toggle', () => toggleFavoriteDeal(favKey), { params: { id: favKey } })}
          >
            {faved ? <IcStar size={18} className="text-[#FF6633]" /> : <IcStarOutline size={18} className="text-[#333]" />}
          </button>
          <button
            type="button"
            className="border-none bg-transparent p-1.5 text-[#333] cursor-pointer"
            {...action('voucher.share.open', () => {
              const text = `${deal.title} ¥${deal.price} https://dianping.mock/deal/${deal.id}`;
              const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
              if (!launched) showToast(s.notOpen);
            })}
          >
            <IcShare size={18} />
          </button>
          <button
            type="button"
            className="border-none bg-transparent p-1.5 text-[#333] cursor-pointer"
            {...action('voucher.util.open.disabled', () => showToast(s.notOpen))}
          >
            <IcMore size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-[64px]" data-scroll-container="voucher" data-scroll-direction="vertical">
        {/* 团购配图 */}
        <div className="h-[180px] w-full overflow-hidden" style={{ background: shop.coverColor }}>
          {dishImageUrl(shop.id, deal.id) || shopCoverUrl(shop.id) ? (
            <img
              src={dishImageUrl(shop.id, deal.id) || shopCoverUrl(shop.id)}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        {/* 橙色价格头 */}
        <div className="bg-gradient-to-b from-[#FF7A33] to-[#FF5A1F] px-4 pb-4 pt-3 text-white">
          <div className="text-[22px] font-black">{deal.title}</div>
          <div className="mt-0.5 text-[12px] text-white/85">
            {shop.name} · {deal.sold}
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-[16px] font-bold">¥</span>
              <span className="text-[34px] font-black leading-none">{deal.price}</span>
              <span className="ml-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[11px]">{off}折 ›</span>
            </div>
            <div className="flex items-center gap-3 text-center text-[11px] text-white/90">
              <div>
                <div>零售价</div>
                <div className="font-bold">¥{deal.origin}</div>
              </div>
              <span className="text-white/60">−</span>
              <div>
                <div>团购优惠</div>
                <div className="font-bold">¥{discount > 0 ? discount : 0}</div>
              </div>
              <span className="text-white/60">−</span>
              <div>
                <div>平台券</div>
                <div className="font-bold">¥1</div>
              </div>
            </div>
          </div>
        </div>

        {/* 券信息条 */}
        <div className="mx-3 -mt-2 rounded-[12px] bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1 text-[12px] text-[#E11D48]">
            <span className="rounded-[3px] bg-[#FFF1EA] px-1 py-0.5 text-[10px]">省</span>
            周四限量 | 1张 ¥{deal.origin} 现金券
            <IcChevronRight size={11} className="ml-auto text-[#CCC]" />
          </div>
          <div className="mt-2 border-t border-[#F5F5F5] pt-2 text-[12px] text-[#666]">
            <div className="flex gap-3">
              <span className="text-[#999]">须知</span>周一至周日可用
            </div>
            <div className="mt-1.5 flex gap-3">
              <span className="text-[#999]">保障</span>随时退 · 过期自动退
            </div>
          </div>
        </div>

        {/* 套餐内容(含什么) */}
        {deal.kind === 'setmeal' && deal.items && deal.items.length > 0 ? (
          <div className="mx-3 mt-2 rounded-[12px] bg-white p-3">
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-[15px] font-bold text-[#222]">套餐详情</span>
              <span className="text-[12px] text-[#999]">
                共 {deal.items.reduce((n, it) => n + it.qty, 0)} 件 · 价值 ¥{deal.origin}
              </span>
            </div>
            {deal.items.map((it) => (
              <div
                key={it.name}
                className="flex items-center justify-between border-b border-[#F5F5F5] py-2.5 text-[13px] last:border-none"
              >
                <span className="text-[#333]">{it.name}</span>
                <span className="text-[#999]">×{it.qty}</span>
              </div>
            ))}
          </div>
        ) : null}

        {/* 购买须知 */}
        <div className="mx-3 mt-2 rounded-[12px] bg-white p-3">
          <div className="mb-1 text-[15px] font-bold text-[#222]">购买须知</div>
          {RULES.map(([k, v]) => (
            <div key={k} className="border-b border-[#F5F5F5] py-2.5 last:border-none">
              <div className="text-[13px] font-semibold text-[#222]">{k}</div>
              <div className="mt-0.5 text-[12px] text-[#666]">{v}</div>
            </div>
          ))}
        </div>

        {/* 推荐菜 */}
        <div className="mx-3 mt-2 rounded-[12px] bg-white p-3">
          <div className="mb-2 text-[15px] font-bold text-[#222]">推荐菜</div>
          <div className="flex gap-2 overflow-x-auto">
            {shop.dishes.map((d) => (
              <div key={d.id} className="w-[96px] shrink-0">
                <div className="h-[96px] overflow-hidden rounded-[6px]" style={{ background: shop.coverColor }}>
                  {dishImageUrl(shop.id, d.id) ? (
                    <img src={dishImageUrl(shop.id, d.id)} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="mt-1 truncate text-[12px] text-[#333]">{d.name}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 适用商户 */}
        <div className="mx-3 mt-2 rounded-[12px] bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[15px] font-bold text-[#222]">适用商户</span>
            <span className="text-[12px] text-[#999]">40家门店通用 ›</span>
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 border-none bg-transparent p-0 text-left cursor-pointer"
            {...bindTap('voucher.shop-open', { params: { shopId: shop.id } })}
          >
            <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: shop.coverColor }}>
              {shopCoverUrl(shop.id) ? <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-[#222]">{shop.name}</div>
              <div className="mt-0.5 flex items-center gap-2">
                <Stars score={shop.score} size={10} />
                <span className="text-[11px] text-[#999]">¥{shop.avgPrice}/人 · {(shop.distanceM / 1000).toFixed(1)}km</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 底栏 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[56px] items-center gap-2 border-t border-[#EEE] bg-white px-3">
        <button
          type="button"
          className="flex w-12 flex-col items-center gap-0.5 border-none bg-transparent text-[10px] text-[#666] cursor-pointer"
          {...bindTap('voucher.shop-open', { params: { shopId: shop.id } })}
        >
          <IcMapMini size={18} />
          门店
        </button>
        <button
          type="button"
          className="ml-1 flex flex-1 flex-col items-center justify-center rounded-full border-none bg-[#FF6633] py-1.5 text-white cursor-pointer"
          {...bindTap('voucher.buy', { params: { shopId: shop.id, dealId: deal.id } })}
        >
          <span className="text-[15px] font-bold leading-tight">{s.buyNow}</span>
          <span className="text-[11px] leading-tight">折后 ¥{deal.price}</span>
        </button>
      </div>
    </div>
  );
}
