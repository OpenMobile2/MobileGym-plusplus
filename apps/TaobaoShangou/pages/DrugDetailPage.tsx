import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price, TopBar, showToast } from '../components/common';
import { fmt } from '../utils';
import { useStatusBarBg } from '../statusbar';

/** 药品详情页(IMG_6095):药品信息 + 在售商家跨店列表(可进店购买) */
export default function DrugDetailPage() {
  const { bindTap } = useTbsgGestures();
  useStatusBarBg('#ffffff');
  const { drugId = '' } = useParams<{ drugId: string }>();

  const items = useTbsgStore((st) => st.items);
  const shops = useTbsgStore((st) => st.shops);

  const [tab, setTab] = useState<'sellers' | 'combo'>('sellers');

  /** 该药品在各药店的在售条目(按价格升序) */
  const sellers = useMemo(() => {
    const arr = items.filter((i) => i.drugKey === drugId);
    return arr
      .map((it) => ({ it, shop: shops.find((s) => s.id === it.shopId) }))
      .filter((r) => r.shop)
      .sort((a, b) => a.it.price - b.it.price);
  }, [items, shops, drugId]);

  if (sellers.length === 0) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <TopBar title="药品详情" />
        <EmptyState text="该药品暂无在售商家" />
      </div>
    );
  }

  const rep = sellers[0].it;
  const fastest = sellers.reduce((a, b) => ((b.shop!.deliveryMinutes < a.shop!.deliveryMinutes) ? b : a), sellers[0]);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title="药品详情" titleLeft />

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 药品信息头 */}
        <div className="bg-white px-4 pt-2 pb-4">
          <AppImg src={rep.image} className="w-full h-52 object-contain bg-[#F7F8FA] rounded-xl" />
          <div className="text-[20px] font-bold text-[#1A1A1A] mt-3 leading-snug">{rep.name}</div>
          <div className="flex items-center gap-2 mt-1.5">
            {rep.isRx
              ? <span className="text-[11px] text-[#2E90C4] border border-[#BFDCEC] rounded px-1.5 py-0.5">处方药</span>
              : <span className="text-[11px] text-[#2BB3A3] border border-[#BEE3DB] rounded px-1.5 py-0.5">OTC 甲类</span>}
            {rep.brand && <span className="text-[12px] text-[#999999]">{rep.brand}</span>}
          </div>
          {/* 功能主治 / 用法用量 */}
          <div className="flex mt-3.5 border-t border-[#F0F0F0] pt-3">
            <div className="flex-1 min-w-0 pr-3">
              <div className="text-[12px] text-[#999999]">功能主治</div>
              <div className="text-[14px] text-[#1A1A1A] mt-0.5 truncate">{(rep.funcs ?? []).join('、') || '遵医嘱'}</div>
            </div>
            <div className="w-px bg-[#F0F0F0]" />
            <div className="flex-1 min-w-0 pl-3">
              <div className="text-[12px] text-[#999999]">规格</div>
              <div className="text-[14px] text-[#1A1A1A] mt-0.5 truncate">{rep.spec ?? '—'}</div>
            </div>
          </div>
        </div>

        {/* tab:在售商家 / 组合用药 */}
        <div className="bg-white mt-2 flex items-center px-4 pt-2">
          {([['sellers', `在售商家 ${sellers.length}`], ['combo', '组合用药']] as const).map(([key, label]) => (
            <button
              key={key}
              {...(key === 'combo'
                ? bindTap<HTMLButtonElement>({ kind: 'action', id: 'drug.combo.stub' }, { onTrigger: () => showToast('该功能暂未开放') })
                : { onClick: () => setTab('sellers') })}
              className={`mr-6 pb-2 bg-transparent border-none cursor-pointer text-[16px] relative ${
                tab === key ? 'font-bold text-[#1A1A1A]' : 'text-[#5A5A5A]'
              }`}
            >
              {label}
              {tab === key && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-[3px] bg-[#1A1A1A] rounded-full" />}
            </button>
          ))}
        </div>

        {/* 在售商家列表 */}
        <div className="bg-white pb-4">
          {sellers.map(({ it, shop }, idx) => (
            <div key={it.id} className="flex items-start px-4 py-3.5 border-t border-[#F5F5F5]">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <Price value={it.price} size={20} />
                  {idx === 0 && <span className="text-[10px] text-white bg-[#EB493B] rounded px-1 py-px">附近低价</span>}
                  {shop!.id === fastest.shop!.id && <span className="text-[10px] text-white bg-[#00B45A] rounded px-1 py-px">配送最快</span>}
                  {it.origPrice != null && it.origPrice > it.price && (
                    <span className="text-[12px] text-[#999999] line-through">¥{fmt(it.origPrice)}</span>
                  )}
                </div>
                <div className="text-[15px] text-[#1A1A1A] mt-1.5 truncate">{shop!.fullName}</div>
                <div className="text-[12px] text-[#999999] mt-1">
                  配送费¥{fmt(shop!.deliveryFee)} · <span className="text-[#2BB3A3]">⚡{shop!.deliveryMinutes}分钟</span> · {shop!.distanceKm}km
                </div>
              </div>
              <button
                {...bindTap<HTMLButtonElement>('drug.pharmacy-open', { params: { shopId: shop!.id } })}
                className="ml-3 h-9 px-4 rounded-full bg-[#ED6C2C] text-white text-[14px] font-semibold border-none cursor-pointer shrink-0 self-center"
              >
                立即购买
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
