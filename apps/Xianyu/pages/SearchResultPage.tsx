import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { ItemCard } from '../components/ItemCard';
import { BottomSheet, usePanel, useToast } from '../components/ui';
import { IcNavBack, IcSearch, IcArrowDown, IcFilter, IcLocation, IcBell } from '../res/icons';

const RESULT_TABS = [
  { id: 'all', label: '全部' },
  { id: 'ai', label: 'AI智搜' },
  { id: 'personal', label: '个人闲置' },
  { id: 'select', label: '严选' },
  { id: 'market', label: '行情' },
] as const;

const FILTER_CATEGORIES = ['数码', '手机', '二次元', '运动鞋', '图书', '家具', '潮流', '收藏'];
const PRICE_RANGES = ['0-100', '100-500', '500-1000', '1000-3000', '3000以上'];
const CONDITION_OPTS = ['全新', '几乎全新', '95新', '9成新', '8成新及以下'];
const REGIONS = ['附近', '本市', '上海', '北京', '广东', '浙江', '江苏', '不限'];

export default function SearchResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindBack } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const panel = usePanel('panel');

  const items = useXianyuStore((s) => s.items);
  const submitSearch = useXianyuStore((s) => s.submitSearch);
  const subscribeSearch = useXianyuStore((s) => s.subscribeSearch);
  const subscribedSearches = useXianyuStore((s) => s.subscribedSearches);
  const recordTaskAudit = useXianyuStore((s) => s.recordTaskAudit);
  const keyword = searchParams.get('keyword') ?? '';
  const tab = searchParams.get('tab') ?? 'all';
  const sort = searchParams.get('sort') ?? 'default';
  const region = searchParams.get('region') ?? '';

  // mount / keyword 变化时写入搜索历史
  useEffect(() => {
    if (keyword) submitSearch(keyword);
  }, [keyword, submitSearch]);

  const selectTab = (target: string) =>
    setSearchParams((p) => { p.set('tab', target); return p; }, { replace: true });
  const selectSort = (v: string) =>
    setSearchParams((p) => { if (v === 'default') p.delete('sort'); else p.set('sort', v); return p; }, { replace: true });
  const selectRegion = (value: string) => {
    recordTaskAudit('searchRegion', { keyword, region: value });
    setSearchParams((p) => { if (!value || value === '不限') p.delete('region'); else p.set('region', value); return p; }, { replace: true });
  };

  // 过滤:keyword 命中标题;无命中则展示全部作推荐
  const keywordTokens = keyword.toLowerCase().match(/[a-z0-9]+|[\u4e00-\u9fff]/g) ?? [];
  const matched = keyword
    ? items.filter((it) => keywordTokens.every((token) => it.title.toLowerCase().includes(token)))
    : items;
  const base = (matched.length > 0 ? matched : items).filter((it) => !region || region === '不限' || it.location.includes(region));
  const list = sort === 'price' ? [...base].sort((a, b) => a.price - b.price) : base;
  const col = (mod: number) => list.filter((_, idx) => idx % 2 === mod);

  const sortActive = (id: string) => sort === id || (id === 'default' && sort === 'default');

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4] relative" data-status-bar-foreground="dark">
      {/* 顶部搜索框 */}
      <div className="bg-white shrink-0 flex items-center gap-1 px-2 py-2">
        <button {...bindBack()} aria-label="返回" className="bg-transparent border-none cursor-pointer p-1 text-[#111]">
          <IcNavBack size={26} />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#F4F4F4] rounded-full h-9 px-3">
          <IcSearch size={17} className="text-[#999999]" />
          <span className="flex-1 text-[13px] text-[#111] truncate">{keyword || '搜索闲置好物'}</span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.subscribe.add' }, { onTrigger: () => { subscribeSearch(keyword); showToast('已订阅上新降价提醒'); } })}
          className="bg-transparent border-none cursor-pointer text-[13px] text-[#FF8A00] inline-flex items-center gap-0.5 px-1"
        >
          <IcBell size={15} />{subscribedSearches.includes(keyword) ? '已订阅' : '订阅'}
        </button>
      </div>

      {/* 结果 tab */}
      <div
        className="bg-white shrink-0 flex items-center gap-4 px-3 border-b border-[#F2F2F2] overflow-x-auto"
        data-scroll-container="search-result-tabs" data-scroll-direction="horizontal"
      >
        {RESULT_TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'searchResult.tab.select.target' },
                { params: { target: t.id }, onTrigger: () => selectTab(t.id) },
              )}
              className={`bg-transparent border-none cursor-pointer py-2 text-[14px] whitespace-nowrap relative ${active ? 'text-[#111] font-bold' : 'text-[#666]'}`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      {/* 排序 / 区域 / 筛选行 */}
      <div className="bg-white shrink-0 flex items-center px-3 py-2 border-b border-[#EEEEEE] text-[13px]">
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.sort.select.comprehensive' }, { onTrigger: () => selectSort('default') })}
          className={`bg-transparent border-none cursor-pointer mr-4 ${sortActive('default') ? 'text-[#111] font-semibold' : 'text-[#666]'}`}
        >
          综合
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.sort.select.price' }, { onTrigger: () => selectSort('price') })}
          className={`bg-transparent border-none cursor-pointer mr-4 inline-flex items-center gap-0.5 ${sortActive('price') ? 'text-[#111] font-semibold' : 'text-[#666]'}`}
        >
          价格<IcArrowDown size={12} />
        </button>
        <button
          onClick={() => selectSort('reduce')}
          className={`bg-transparent border-none cursor-pointer mr-4 ${sortActive('reduce') ? 'text-[#111] font-semibold' : 'text-[#666]'}`}
        >
          降价
        </button>
        <button
          onClick={() => selectSort('fresh')}
          className={`bg-transparent border-none cursor-pointer ${sortActive('fresh') ? 'text-[#111] font-semibold' : 'text-[#666]'}`}
        >
          新发
        </button>
        <div className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.region.open' }, { onTrigger: () => panel.open('region') })}
          className="bg-transparent border-none cursor-pointer text-[#666] inline-flex items-center gap-0.5 mr-3"
        >
          <IcLocation size={13} />区域
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.filter.open' }, { onTrigger: () => panel.open('filter') })}
          className="bg-transparent border-none cursor-pointer text-[#666] inline-flex items-center gap-0.5"
        >
          <IcFilter size={13} />筛选
        </button>
      </div>

      {/* 双列结果流 */}
      <div className="flex-1 overflow-y-auto p-2" data-scroll-container="SearchResultPage-main" data-scroll-direction="vertical">
        {matched.length === 0 && keyword && (
          <div className="text-center text-[13px] text-[#999] py-3">没有找到「{keyword}」,为你推荐相似好物</div>
        )}
        <div className="flex gap-2 items-start">
          <div className="flex-1 min-w-0">{col(0).map((it) => <ItemCard key={it.id} item={it} />)}</div>
          <div className="flex-1 min-w-0">{col(1).map((it) => <ItemCard key={it.id} item={it} />)}</div>
        </div>
      </div>

      {/* 筛选大面板 */}
      {panel.value === 'filter' && (
        <BottomSheet title="筛选" onClose={panel.close} closeBinding={bindBack()}>
          <div className="px-3 py-2">
            <div className="text-[14px] font-semibold text-[#111] mb-2">分类</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {FILTER_CATEGORIES.map((c) => (
                <span key={c} className="text-[13px] text-[#666] bg-[#F4F4F4] rounded-full px-3 py-1.5">{c}</span>
              ))}
            </div>
            <div className="text-[14px] font-semibold text-[#111] mb-2">价格区间</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRICE_RANGES.map((p) => (
                <span key={p} className="text-[13px] text-[#666] bg-[#F4F4F4] rounded-full px-3 py-1.5">{p}</span>
              ))}
            </div>
            <div className="text-[14px] font-semibold text-[#111] mb-2">成色</div>
            <div className="flex flex-wrap gap-2">
              {CONDITION_OPTS.map((c) => (
                <span key={c} className="text-[13px] text-[#666] bg-[#F4F4F4] rounded-full px-3 py-1.5">{c}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-3 px-3 py-2 border-t border-[#EEE]">
            <button onClick={panel.close} className="flex-1 h-10 rounded-full bg-[#F4F4F4] text-[#666] border-none cursor-pointer text-[14px]">清空</button>
            <button onClick={panel.close} className="flex-1 h-10 rounded-full bg-[#FFE411] text-[#111] font-semibold border-none cursor-pointer text-[14px]">确定</button>
          </div>
        </BottomSheet>
      )}

      {/* 区域弹层 */}
      {panel.value === 'region' && (
        <BottomSheet title="选择区域" onClose={panel.close} closeBinding={bindBack()}>
          <div className="px-3 py-2 grid grid-cols-3 gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                {...bindTap({ kind: 'action', id: 'searchResult.region.select.target' }, { params: { target: r }, onTrigger: () => selectRegion(r) })}
                className={`text-[13px] rounded-lg px-3 py-2 text-center border-none cursor-pointer ${region === r || (r === '不限' && !region) ? 'text-[#FF3B30] bg-[#FFF3F0]' : 'text-[#666] bg-[#F4F4F4]'}`}
              >{r}</button>
            ))}
          </div>
          <div className="flex gap-3 px-3 py-2 border-t border-[#EEE]">
            <button onClick={() => { selectRegion(''); panel.close(); }} className="flex-1 h-10 rounded-full bg-[#F4F4F4] text-[#666] border-none cursor-pointer text-[14px]">清空</button>
            <button onClick={panel.close} className="flex-1 h-10 rounded-full bg-[#FFE411] text-[#111] font-semibold border-none cursor-pointer text-[14px]">确定</button>
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
