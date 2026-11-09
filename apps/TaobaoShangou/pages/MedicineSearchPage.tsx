import React, { useMemo, useState } from 'react';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, EmptyState, Price } from '../components/common';
import { IcBack, IcSearch } from '../res/icons';
import { useStatusBarBg } from '../statusbar';
import type { TbItem } from '../types';

/** 买药专属搜索发现词(与外卖不同,均为药品/症状) */
const DISCOVER = ['感冒发烧', '止咳化痰', '布洛芬', '创可贴', '维生素C', '过敏', '肠胃不适', '体温计', '退热贴', '连花清瘟'];

/** 买药独立搜索页(绿主题;搜药品/症状,不含外卖零食推荐) */
export default function MedicineSearchPage() {
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#2BB3A3');
  const items = useTbsgStore((st) => st.items);

  const [q, setQ] = useState('');

  /** 结果:药品(按 drugKey 归组),匹配名称/功效/品牌/分类 */
  const results = useMemo(() => {
    const kw = q.trim();
    if (!kw) return [];
    const drugItems = items.filter((i) => i.drugKey);
    const byKey = new Map<string, TbItem[]>();
    for (const it of drugItems) {
      const text = `${it.name}${(it.funcs ?? []).join('')}${it.brand ?? ''}${it.drugCat ?? ''}${it.drugSub ?? ''}`;
      if (text.includes(kw)) {
        const arr = byKey.get(it.drugKey!) ?? [];
        arr.push(it);
        byKey.set(it.drugKey!, arr);
      }
    }
    return [...byKey.entries()].map(([key, arr]) => {
      const rep = [...arr].sort((a, b) => a.price - b.price)[0];
      const shopIds = [...new Set(arr.map((i) => i.shopId))];
      return { key, rep, count: shopIds.length };
    });
  }, [items, q]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 绿色顶栏 */}
      <div className="shrink-0 bg-gradient-to-b from-[#2BB3A3] to-[#48C4B3]">
        <div className="flex items-center h-12 px-2 gap-1">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-white" />
          </button>
          <div className="flex-1 h-9 rounded-full bg-white flex items-center px-3 gap-2 min-w-0">
            <IcSearch size={16} className="text-[#2BB3A3]" />
            <input
              {...bindTap<HTMLInputElement>({ kind: 'action', id: 'medsearch.query.input' }, { onTrigger: () => {} })}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索药品、疾病、症状、品牌"
              className="flex-1 min-w-0 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#BBBBBB]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {q.trim() === '' ? (
          /* 搜索发现(药品专属,无零食推荐) */
          <div className="px-4 mt-4">
            <div className="font-bold text-[16px] text-[#1A1A1A]">搜索发现</div>
            <div className="flex flex-wrap gap-2 mt-3">
              {DISCOVER.map((w) => (
                <button
                  key={w}
                  {...bindTap<HTMLButtonElement>(
                    { kind: 'action', id: 'medsearch.discover.pick' },
                    { params: { q: w }, onTrigger: () => setQ(w) },
                  )}
                  className="h-9 px-3.5 rounded-full bg-[#F0F8F6] border border-[#CDE9E3] text-[13px] text-[#1A7A6C] cursor-pointer"
                >
                  {w}
                </button>
              ))}
            </div>
            <div className="mt-6 text-center text-[12px] text-[#BBBBBB]">用药请遵医嘱,处方药需凭处方购买</div>
          </div>
        ) : results.length === 0 ? (
          <EmptyState text="没有找到相关药品,换个词试试" />
        ) : (
          results.map(({ key, rep, count }) => (
            <div
              key={key}
              {...bindTap<HTMLDivElement>('medsearch.drug-open', { params: { drugId: key } })}
              className="flex gap-2.5 px-3 py-3 border-b border-[#F5F5F5] cursor-pointer"
            >
              <AppImg src={rep.image} className="w-[88px] h-[88px] rounded-xl object-cover shrink-0 bg-[#F7F8FA]" />
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-[15px] font-semibold text-[#1A1A1A] leading-snug line-clamp-2">{rep.name}</div>
                {rep.funcs && rep.funcs.length > 0 && (
                  <div className="text-[12px] text-[#999999] mt-1 truncate">{rep.funcs.join(' | ')}</div>
                )}
                <div className="flex items-center mt-auto pt-1.5">
                  <Price value={rep.price} size={18} />
                  {rep.isRx && <span className="ml-2 text-[11px] text-[#2E90C4]">处方药</span>}
                  <span className="ml-auto text-[12px] text-[#2BB3A3]">{count}家在售 &gt;</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
