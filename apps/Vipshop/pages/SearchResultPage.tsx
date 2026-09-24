import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { useToast, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { RESULT_SORTS, RESULT_CHIPS, catLabel } from '../constants';
import { IcNavBack, IcSearch, IcFilter, IcHeart } from '../res/icons';

export default function SearchResultPage() {
  const { bindTap, bindBack } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const [toast, showToast] = useToast();

  const q = searchParams.get('q') || '';
  const items = useVipshopStore((s) => s.items);
  const favorites = useVipshopStore((s) => s.favorites);
  const toggleFavorite = useVipshopStore((s) => s.toggleFavorite);

  const [sort, setSort] = useState<string>(RESULT_SORTS[0].id);
  const [chips, setChips] = useState<string[]>([]);

  const baseResults = useMemo(() => {
    if (!q) return items;
    const hay = (it: (typeof items)[number]) =>
      `${it.title} ${it.subCategory} ${it.brandName} ${it.tags.join('')} ${catLabel(it.category)}`;
    // 1) 关键词直接命中,或查询词包含某商品二级分类(如"平底凉鞋" → 凉鞋)
    let f = items.filter((it) => hay(it).includes(q) || (it.subCategory && q.includes(it.subCategory)));
    // 2) 兜底:查询词的二字子串命中(容错"平底凉鞋"→"凉鞋")
    if (f.length === 0 && q.length >= 2) {
      const grams: string[] = [];
      for (let i = 0; i < q.length - 1; i++) grams.push(q.slice(i, i + 2));
      f = items.filter((it) => grams.some((g) => hay(it).includes(g)));
    }
    return f.length > 0 ? f : items;
  }, [items, q]);

  const results = useMemo(() => {
    let arr = [...baseResults];
    if (sort === 'price') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'sales') arr.sort((a, b) => b.reviewCount - a.reviewCount);
    else if (sort === 'rank') arr.sort((a, b) => a.price / a.originPrice - b.price / b.originPrice);
    if (chips.length > 0) {
      // 严格筛选:命中所选 chips 的商品(标签/二级分类/标题),无命中则显示空态(可见变化)
      arr = arr.filter((it) => it.tags.some((t) => chips.includes(t)) || chips.some((c) => it.subCategory.includes(c) || it.title.includes(c)));
    }
    return arr;
  }, [baseResults, sort, chips]);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      {/* 顶部:返回 + 搜索框(回中间页) */}
      <div className="shrink-0 flex items-center gap-2 px-2 h-11 bg-white border-b border-[#EEEEEE]">
        <button {...bindBack()} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcNavBack size={24} className="text-[#222222]" />
        </button>
        <button
          {...bindTap('searchResult.searchBox-open')}
          className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5 border-none cursor-pointer text-left"
        >
          <IcSearch size={15} className="text-[#888888]" />
          <span className="flex-1 text-[13px] text-[#222222] truncate">{q || '搜索商品'}</span>
        </button>
      </div>

      {/* 排序行 + 全部筛选 */}
      <div className="shrink-0 bg-white flex items-center px-3 py-2 border-b border-[#F5F5F5]">
        <div className="flex gap-4 flex-1">
          {RESULT_SORTS.map((s) => {
            const on = s.id === sort;
            return (
              <button
                key={s.id}
                {...bindTap({ kind: 'action', id: 'searchResult.sort.select.target' }, {
                  params: { target: s.id },
                  onTrigger: () => setSort(s.id),
                })}
                className="text-[13px] bg-transparent border-none cursor-pointer"
                style={on ? { color: VIP.primary, fontWeight: 600 } : { color: '#666' }}
              >
                {s.label}
              </button>
            );
          })}
        </div>
        <button
          {...bindTap('searchResult.filter-open')}
          className="flex items-center gap-1 text-[13px] text-[#666666] bg-transparent border-none cursor-pointer"
        >
          <IcFilter size={15} />筛选
        </button>
      </div>

      {/* chips 行 */}
      <div className="shrink-0 bg-white flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-[#F5F5F5]">
        {RESULT_CHIPS.map((chip) => {
          const on = chips.includes(chip);
          return (
            <button
              key={chip}
              {...bindTap({ kind: 'action', id: 'searchResult.chips.toggle' }, {
                params: { chip },
                onTrigger: () => setChips((a) => (a.includes(chip) ? a.filter((x) => x !== chip) : [...a, chip])),
              })}
              className="shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer"
              style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#666', borderColor: '#EEE', background: '#fff' }}
            >
              {chip}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-result" data-scroll-direction="vertical">
        <div className="pt-2">
          <ItemGrid
            items={results}
            bindingOf={(it) => bindTap('searchResult.item-open', { params: { id: it.id } })}
            rightSlotOf={(it) => {
              const fav = favorites.includes(it.id);
              return (
                <button
                  {...bindTap({ kind: 'action', id: 'searchResult.favorite.toggle' }, {
                    params: { itemId: it.id },
                    onTrigger: () => { toggleFavorite(it.id); showToast(fav ? '已取消收藏' : '收藏成功'); },
                    stopPropagation: true,
                  })}
                  className="bg-transparent border-none cursor-pointer p-0"
                  aria-label="收藏"
                >
                  <IcHeart size={16} className={fav ? 'fill-current' : ''} style={{ color: fav ? VIP.primary : '#BBBBBB' }} />
                </button>
              );
            }}
          />
          {results.length === 0 && (
            <div className="text-center text-[13px] text-[#888888] py-10">未找到相关商品</div>
          )}
        </div>
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}
