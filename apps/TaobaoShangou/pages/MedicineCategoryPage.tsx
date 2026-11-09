import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price, showToast } from '../components/common';
import { IcBack, IcSearch } from '../res/icons';
import { useStatusBarBg } from '../statusbar';
import type { TbItem } from '../types';

/** 药品分类页(IMG_6090/6091/6092):左二级类目 + 右跨店在售药品列表 */
export default function MedicineCategoryPage() {
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#ffffff');
  const [sp] = useSearchParams();
  const cat = sp.get('cat') ?? '感冒发烧';

  const items = useTbsgStore((st) => st.items);
  const shops = useTbsgStore((st) => st.shops);

  const [sub, setSub] = useState('全部');

  /** 该一级分类下的二级类目 */
  const subs = useMemo(() => {
    const seen: string[] = [];
    for (const i of items) {
      if (i.drugCat === cat && i.drugSub && !seen.includes(i.drugSub)) seen.push(i.drugSub);
    }
    return ['全部', ...seen];
  }, [items, cat]);

  /** 按 drugKey 归组 → 每个药品:代表(最低价) + 在售家数 + 最快送达 */
  const drugs = useMemo(() => {
    const inCat = items.filter((i) => i.drugCat === cat && (sub === '全部' || i.drugSub === sub) && i.drugKey);
    const byKey = new Map<string, TbItem[]>();
    for (const it of inCat) {
      const arr = byKey.get(it.drugKey!) ?? [];
      arr.push(it);
      byKey.set(it.drugKey!, arr);
    }
    return [...byKey.entries()].map(([key, arr]) => {
      const sorted = [...arr].sort((a, b) => a.price - b.price);
      const rep = sorted[0];
      const shopIds = [...new Set(arr.map((i) => i.shopId))];
      const sellerShops = shopIds.map((id) => shops.find((s) => s.id === id)).filter(Boolean) as { name: string; deliveryMinutes: number }[];
      const minMin = sellerShops.length ? Math.min(...sellerShops.map((s) => s.deliveryMinutes)) : 30;
      const monthly = Math.max(...arr.map((i) => i.monthlySales));
      return { key, rep, count: shopIds.length, minMin, firstName: sellerShops[0]?.name ?? '', monthly };
    }).sort((a, b) => b.monthly - a.monthly);
  }, [items, shops, cat, sub]);

  const fmtSales = (n: number) => (n >= 10000 ? `${Math.floor(n / 10000)}万+` : n >= 100 ? `${Math.floor(n / 100) * 100}+` : `${n}`);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 顶栏:返回 + 分类名 + 搜索 */}
      <div className="flex items-center gap-2 px-2 h-12 shrink-0">
        <button {...bindBack<HTMLButtonElement>()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcBack size={22} className="text-[#1A1A1A]" />
        </button>
        <span className="text-[19px] font-bold text-[#1A1A1A] shrink-0">{cat}</span>
        <div
          {...bindTap<HTMLDivElement>('medcat.search-open')}
          className="flex-1 h-9 rounded-full bg-[#F3F6F8] flex items-center px-3 gap-2 cursor-pointer min-w-0"
        >
          <IcSearch size={15} className="text-[#999999]" />
          <span className="text-[13px] text-[#999999] truncate">搜索药品、疾病、症状、品牌</span>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 左二级类目 */}
        <div className="w-[88px] shrink-0 overflow-y-auto bg-[#F3F6F8]" data-scroll-container="subcats" data-scroll-direction="vertical">
          {subs.map((sc) => {
            const active = sub === sc;
            return (
              <button
                key={sc}
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'medcat.subcat.select' },
                  { params: { sub: sc }, onTrigger: () => setSub(sc) },
                )}
                className={`relative w-full px-1.5 py-3.5 text-[13px] border-none cursor-pointer text-center leading-tight ${
                  active ? 'bg-white text-[#1A1A1A] font-bold' : 'bg-transparent text-[#5A5A5A]'
                }`}
              >
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-[#2BB3A3] rounded-full" />}
                {sc}
              </button>
            );
          })}
        </div>

        {/* 右药品列表 */}
        <div className="flex-1 overflow-y-auto min-w-0 bg-white" data-scroll-container="main" data-scroll-direction="vertical">
          {drugs.length === 0 && <EmptyState text="该分类暂无药品" />}
          {drugs.map(({ key, rep, count, minMin, firstName }) => (
            <div
              key={key}
              {...bindTap<HTMLDivElement>('medcat.drug-open', { params: { drugId: key } })}
              className="flex gap-2.5 px-3 py-3 border-b border-[#F5F5F5] cursor-pointer"
            >
              <AppImg src={rep.image} className="w-[92px] h-[92px] rounded-xl object-cover shrink-0 bg-[#F7F8FA]" />
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-[15px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">
                  {rep.tags.includes('健康卡') && <span className="text-[10px] text-white bg-[#8A6D3B] rounded px-1 py-px mr-1 align-middle">健康卡</span>}
                  {rep.name}
                </div>
                {rep.funcs && rep.funcs.length > 0 && (
                  <div className="text-[12px] text-[#999999] mt-1 truncate">{rep.funcs.join(' | ')}</div>
                )}
                <div className="flex items-center mt-1.5">
                  <Price value={rep.price} size={18} />
                  {rep.isRx
                    ? <span className="ml-2 text-[11px] text-[#2E90C4]">处方药</span>
                    : <span className="ml-2 text-[11px] text-[#EB493B] border border-[#F3C0BB] rounded px-1">红包可用</span>}
                  <span className="ml-auto text-[12px] text-[#999999]">月售{fmtSales(rep.monthlySales)}</span>
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-[12px] text-[#999999] truncate flex-1">{firstName}…等{count}家在售</span>
                  <span className="text-[12px] text-[#2BB3A3] shrink-0 ml-2">⚡{minMin}分钟</span>
                </div>
              </div>
            </div>
          ))}
          <div className="py-4 text-center text-[11px] text-[#999999]">- 已经到底啦 -</div>
        </div>
      </div>

      {/* 悬浮问诊 */}
      <button
        onClick={() => showToast('该功能暂未开放')}
        className="absolute right-3 bottom-6 w-14 h-14 rounded-full bg-[#2BB3A3] text-white text-[11px] font-semibold flex flex-col items-center justify-center border-none cursor-pointer shadow-lg"
      >
        <span className="text-[18px] leading-none">👩‍⚕️</span>
        问诊
      </button>
    </div>
  );
}
