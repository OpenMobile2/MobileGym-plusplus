import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { useToast, usePanel, VIP } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { FilterSheet } from '../components/FilterSheet';
import { RESULT_SORTS } from '../constants';
import { matchItems, lockPrimaryCategory, applyFilters, soldCount } from '../utils/search';
import { IcNavBack, IcSearch, IcFilter, IcHeart } from '../res/icons';

export default function SearchResultPage() {
  const { bindTap, bindBack, back } = useVipshopGestures();
  const [searchParams] = useSearchParams();
  const [toast, showToast] = useToast();
  const { value: panel } = usePanel('filter');

  const q = searchParams.get('q') || '';
  const items = useVipshopStore((s) => s.items);
  const favorites = useVipshopStore((s) => s.favorites);
  const toggleFavorite = useVipshopStore((s) => s.toggleFavorite);

  const [sort, setSort] = useState<string>(RESULT_SORTS[0].id);
  const [chips, setChips] = useState<string[]>([]);
  // filters=已生效条件;draft=筛选弹层里改到一半的条件,点确认才落地
  const [filters, setFilters] = useState<string[]>([]);
  const [draft, setDraft] = useState<string[]>([]);

  // 关键词命中集合。匹配不到时为空数组(显示空态),不再回落成全部商品——
  // 那正是"搜裙子再按价格排序却跳出保温杯/袜子"的根因。
  const scopedResults = useMemo(() => lockPrimaryCategory(matchItems(items, q)), [items, q]);

  // 动态筛选词:从当前结果的二级分类/标签按出现频次取前 8(男士休闲裤不会再出现"碎花/收腰")
  const dynamicChips = useMemo(() => {
    const freq = new Map<string, number>();
    scopedResults.forEach((it) => {
      [it.subCategory, ...it.tags].forEach((t) => { if (t) freq.set(t, (freq.get(t) ?? 0) + 1); });
    });
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1]).map((e) => e[0]).slice(0, 8);
  }, [scopedResults]);

  // 排序和筛选一律在 scopedResults 内部进行,不会引入集合外的商品
  const results = useMemo(() => {
    let arr = [...scopedResults];
    // 次序键兜到 id:比较值并列时 sort 保持原序,看上去像"没排"
    if (sort === 'price') arr.sort((a, b) => (a.price - b.price) || a.id.localeCompare(b.id));
    else if (sort === 'sales') arr.sort((a, b) => (soldCount(b.sold) - soldCount(a.sold)) || a.id.localeCompare(b.id));
    else if (sort === 'rank') arr.sort((a, b) => (a.price / a.originPrice - b.price / b.originPrice) || a.id.localeCompare(b.id));
    if (chips.length > 0) {
      arr = arr.filter((it) => it.tags.some((t) => chips.includes(t)) || chips.some((c) => it.subCategory.includes(c) || it.title.includes(c)));
    }
    return applyFilters(arr, filters);
  }, [scopedResults, sort, chips, filters]);

  const openFilter = () => setDraft(filters);
  const confirmFilter = () => { setFilters(draft); back(); };

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
          {...bindTap('searchResult.filter-open', { beforeTrigger: openFilter })}
          className="flex items-center gap-1 text-[13px] bg-transparent border-none cursor-pointer"
          style={filters.length > 0 ? { color: VIP.primary, fontWeight: 600 } : { color: '#666666' }}
        >
          <IcFilter size={15} />筛选{filters.length > 0 ? `(${filters.length})` : ''}
        </button>
      </div>

      {/* chips 行 */}
      <div className="shrink-0 bg-white flex gap-2 px-3 py-2 overflow-x-auto no-scrollbar border-b border-[#F5F5F5]">
        {dynamicChips.map((chip) => {
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
            <div className="text-center text-[13px] text-[#888888] py-10">
              {scopedResults.length === 0 ? `没有找到与「${q}」相关的商品` : '当前筛选条件下没有商品,换个条件试试'}
            </div>
          )}
        </div>
        <div className="h-3" />
      </div>

      {panel === 'open' && (
        <FilterSheet
          candidates={scopedResults}
          draft={draft}
          onToggle={(token) => setDraft((prev) => (prev.includes(token) ? prev.filter((t) => t !== token) : [...prev, token]))}
          onClose={() => back()}
          optionBindingOf={(token, onTrigger) =>
            bindTap({ kind: 'action', id: 'searchFilter.option.toggle' }, { params: { option: token }, onTrigger })}
          resetBinding={bindTap({ kind: 'action', id: 'searchFilter.reset.submit' }, { onTrigger: () => setDraft([]) })}
          confirmBinding={bindTap({ kind: 'action', id: 'searchFilter.confirm.submit' }, { onTrigger: confirmFilter })}
        />
      )}
      {toast}
    </div>
  );
}
