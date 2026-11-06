import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { ItemCard } from '../components/ItemCard';
import { EmptyState } from '../components/ui';
import { IcNavBack, IcSearch, IcFilter } from '../res/icons';

type SortKey = 'comprehensive' | 'sales' | 'price';

const FILTER_CHIPS = ['包邮', '百亿补贴', '先用后付', '48小时发货', '旗舰店'];

export function SearchResultPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') || '';
  const drawer = sp.get('drawer');
  const { bindTap, bindBack, back } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const items = usePinduoduoStore((st) => st.items);
  const shops = usePinduoduoStore((st) => st.shops);
  const recordTaskAudit = usePinduoduoStore((st) => st.recordTaskAudit);
  const [sort, setSort] = useState<SortKey>('comprehensive');
  const [dir, setDir] = useState<'asc' | 'desc'>('desc');
  const [chips, setChips] = useState<string[]>([]);

  // 相关度检索:对 title/category/tags/店铺名 分词打分,按分排序取有命中的。
  // q 为空 → 展示全部;q 有词但无命中 → 空态(不再兜底全量)。
  const shopName = React.useMemo(() => {
    const m = new Map(shops.map((sh) => [sh.id, sh.name]));
    return (it: (typeof items)[number]) => m.get(it.shopId) || '';
  }, [shops]);

  const base = React.useMemo(() => {
    const query = q.trim();
    if (!query) return items;
    const phrases = query.toLowerCase().split(/\s+/).filter(Boolean);
    return items
      .map((it) => ({ it, sc: scoreItem(it, query, phrases, shopName(it)) }))
      .filter((x) => x.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .map((x) => x.it);
  }, [items, q, shopName]);

  // 排序:综合=默认顺序;销量按「已拼件数」;价格按拼单价。方向 asc/desc。
  const list = React.useMemo(() => {
    if (sort === 'comprehensive') return base;
    const arr = [...base];
    const mul = dir === 'asc' ? 1 : -1;
    if (sort === 'sales') arr.sort((a, b) => (parseSold(a.sold) - parseSold(b.sold)) * mul);
    else arr.sort((a, b) => (a.pinPrice - b.pinPrice) * mul);
    return arr;
  }, [base, sort, dir]);

  // 点排序标签:换标签→设默认方向(价格首点升序/销量首点降序);再点同一标签→切换升/降序。
  const onSortTab = (k: SortKey) => {
    recordTaskAudit({ searchResult: { query: q, sort: k } });
    if (k === 'comprehensive') { setSort('comprehensive'); return; }
    if (sort === k) setDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSort(k); setDir(k === 'price' ? 'asc' : 'desc'); }
  };

  const toggleChip = (c: string) =>
    setChips((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const sortCls = (k: SortKey) =>
    `px-1 text-[13px] ${sort === k ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}`;

  return (
    <div className="h-full flex flex-col pt-10 overflow-hidden bg-white" data-status-bar-foreground="dark">
      {/* 顶部:返回 + 搜索条 + 筛选 */}
      <div className="shrink-0 h-12 flex items-center gap-1 px-1.5 border-b border-[#F0F0F0]">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={24} />
        </button>
        <div
          {...bindTap('result.search-open', { params: { q } })}
          className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5"
        >
          <IcSearch size={16} className="text-[#999]" />
          <span className="flex-1 text-[14px] text-[#333] truncate">{q || s.search_placeholder}</span>
        </div>
        <button
          {...bindTap('result.filter.show')}
          className="px-2 flex items-center gap-0.5 text-[13px] text-[#666]"
        >
          <IcFilter size={16} /> {s.filter}
        </button>
      </div>

      {/* 排序行 */}
      <div className="shrink-0 h-10 flex items-center gap-6 px-4 border-b border-[#F0F0F0]">
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.comprehensive' }, { onTrigger: () => onSortTab('comprehensive') })}
          className={sortCls('comprehensive')}
        >
          {s.sort_comprehensive}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.sales' }, { onTrigger: () => onSortTab('sales') })}
          className={sortCls('sales') + ' flex items-center'}
        >
          {s.sort_sales}
          <SortArrows active={sort === 'sales'} dir={dir} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.price' }, { onTrigger: () => onSortTab('price') })}
          className={sortCls('price') + ' flex items-center'}
        >
          {s.sort_price}
          <SortArrows active={sort === 'price'} dir={dir} />
        </button>
      </div>

      {/* 结果双列 */}
      <div
        className="flex-1 overflow-y-auto bg-[#F5F5F5]"
        data-scroll-container
        data-scroll-direction="vertical"
      >
        {list.length === 0 ? (
          <EmptyState text={s.empty_search} />
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2">
            {list.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                openBind={bindTap('result.item-open', { params: { itemId: it.id } })}
              />
            ))}
          </div>
        )}
      </div>

      {/* 筛选抽屉(URL 驱动) */}
      {drawer === 'filter' && (
        <div className="absolute inset-0 z-40 flex">
          <div className="flex-1 bg-black/50" {...bindBack()} />
          <div className="w-72 max-w-[80%] bg-white flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[15px] font-medium text-[#333] mb-3">筛选</div>
              <div className="flex flex-wrap gap-2">
                {FILTER_CHIPS.map((c) => {
                  const on = chips.includes(c);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleChip(c)}
                      className={`px-3 py-1.5 rounded-full text-[13px] border ${
                        on ? 'border-[#E22E1F] text-[#E22E1F] bg-[#FFF0E8]' : 'border-[#EEE] text-[#333] bg-[#F7F7F7]'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-3 border-t border-[#F0F0F0]">
              <button
                {...bindTap({ kind: 'action', id: 'result.filter.apply' }, { onTrigger: () => back() })}
                className="w-full h-11 rounded-full bg-[#E22E1F] text-white font-medium"
              >
                {s.btn_confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 相关度打分:完整短语命中标题权重最高,再按各字段分词命中累加;
// 中文长词补二元组部分命中,提升召回(如「男士用品」→「男士」「士用」「用品」)。
function scoreItem(
  item: { title: string; category: string; tags: string[] },
  query: string,
  phrases: string[],
  shopName: string,
): number {
  const title = item.title.toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const tags = (item.tags || []).join(' ').toLowerCase();
  const shop = shopName.toLowerCase();
  let sc = 0;
  const full = query.toLowerCase();
  if (full && title.includes(full)) sc += 100; // 整串命中标题
  for (const p of phrases) {
    if (!p) continue;
    if (title.includes(p)) sc += 20;
    else if (p.length >= 2 && /[一-龥]/.test(p)) {
      let hit = 0;
      for (let i = 0; i < p.length - 1; i++) if (title.includes(p.slice(i, i + 2))) hit++;
      sc += hit * 3; // 标题部分命中
    }
    if (cat.includes(p)) sc += 8;
    if (tags.includes(p)) sc += 5;
    if (shop.includes(p)) sc += 6;
  }
  return sc;
}

// 「已拼14.5万件」「已拼550件」「已拼回购6067件」→ 数值(万→×10000),用于销量排序
function parseSold(sold: string): number {
  const wan = sold.match(/([\d.]+)\s*万/);
  if (wan) return parseFloat(wan[1]) * 10000;
  const n = sold.match(/([\d.]+)/);
  return n ? parseFloat(n[1]) : 0;
}

// 升/降序双箭头指示:当前排序项高亮对应方向
function SortArrows({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className="inline-flex flex-col ml-0.5 leading-[0.55]">
      <span className={`text-[8px] ${active && dir === 'asc' ? 'text-[#E22E1F]' : 'text-[#CCC]'}`}>▲</span>
      <span className={`text-[8px] ${active && dir === 'desc' ? 'text-[#E22E1F]' : 'text-[#CCC]'}`}>▼</span>
    </span>
  );
}
