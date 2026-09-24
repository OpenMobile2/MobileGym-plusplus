import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { useToast, NOT_OPEN, VIP } from '../components/ui';
import { IcNavBack, IcSearch, IcCamera } from '../res/icons';

const SUFFIXES = ['连衣裙', '套装', '女', '2024新款', '专柜正品'];

export default function SearchSuggestPage() {
  const { bindTap, bindBack } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const [toast, showToast] = useToast();

  const q = searchParams.get('q') || '';
  const items = useVipshopStore((s) => s.items);

  const [keyword, setKeyword] = useState(q);

  const suggestions = useMemo(() => {
    const base = keyword.trim();
    const fromItems = items
      .filter((it) => base && it.title.includes(base))
      .map((it) => it.title)
      .slice(0, 6);
    const derived = base ? SUFFIXES.map((s) => `${base} ${s}`) : [];
    return Array.from(new Set([...fromItems, ...derived])).slice(0, 12);
  }, [keyword, items]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 顶部:返回 + 输入框(显示 q) + 相机 */}
      <div className="shrink-0 flex items-center gap-2 px-2 h-11 border-b border-[#EEEEEE]">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcNavBack size={24} className="text-[#222222]" />
        </button>
        <div className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5">
          <IcSearch size={15} className="text-[#888888]" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索商品"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#222222] placeholder:text-[#BBBBBB]"
          />
          <button
            {...bindTap({ kind: 'action', id: 'suggest.camera.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="bg-transparent border-none cursor-pointer p-0"
            aria-label="相机搜索"
          >
            <IcCamera size={16} className="text-[#888888]" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-suggest" data-scroll-direction="vertical">
        {suggestions.length === 0 && (
          <div className="text-center text-[13px] text-[#888888] py-16">输入关键词查看联想</div>
        )}
        {suggestions.map((word) => (
          <button
            key={word}
            {...bindTap('suggest.word-open', { params: { q: word } })}
            className="w-full flex items-center gap-2.5 px-3 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
          >
            <IcSearch size={15} className="text-[#BBBBBB]" />
            <span className="text-[14px] text-[#222222] flex-1">{word}</span>
          </button>
        ))}
      </div>
      {toast}
    </div>
  );
}
