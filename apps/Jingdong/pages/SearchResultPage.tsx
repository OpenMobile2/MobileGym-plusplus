import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, Tag, showToast, wontfix } from '../components/ui';
import { IcNavBack, IcCamera, IcGrid, IcFilter, IcChevronDown, IcMapPin, IcCheck, IcStar, IcPlus } from '../res/icons';

const TABS = ['全部', '新品', '秒送', '口碑'];
const CHIPS = ['清凉季', '京东物流', '国家补贴', '内存容量'];
const FILTER_GROUPS: { title: string; options: string[] }[] = [
  { title: '配送方式', options: ['京东物流', '当日达', '次日达', '货到付款'] },
  { title: '商品服务', options: ['自营', '国家补贴', '包邮', '30天价保', '先用后付'] },
];
// 秒送结果·筛选(与真机一致的维度)
const FILTER_GROUPS_FOOD: { title: string; options: string[] }[] = [
  { title: '优惠活动', options: ['免运费', '领满减券'] },
  { title: '品质', options: ['4星以上'] },
  { title: '商家特色', options: ['支持跨天预订', '开发票'] },
  { title: '分类', options: ['面点', '啤酒', '白酒', '水果', '乳品', '零食'] },
];

type SortMode = 'comprehensive' | 'price_desc' | 'price_asc' | 'reviews_desc' | 'sales';

/** 综合推荐下拉(参考真机):不含销量,销量仍在栏上单独一项 */
const SORT_OPTIONS: { id: SortMode; label: string; short: string }[] = [
  { id: 'comprehensive', label: '综合推荐', short: '综合推荐' },
  { id: 'price_desc', label: '价格从高到低', short: '价格降序' },
  { id: 'price_asc', label: '价格从低到高', short: '价格升序' },
  { id: 'reviews_desc', label: '评论数从高到低', short: '评论数' },
];

/** 解析「已售1万+ / 已售8000+」等为可比数值,用于销量排序 */
function parseSold(sold: string): number {
  const s = sold.replace(/已售|,/g, '');
  const wan = s.match(/([\d.]+)\s*万/);
  if (wan) return Math.round(parseFloat(wan[1]) * 10000);
  const n = s.match(/([\d.]+)/);
  return n ? Math.round(parseFloat(n[1])) : 0;
}

export function SearchResultPage() {
  const { bindTap, bindBack, back } = useJingdongGestures();
  const [sp, setSp] = useSearchParams();
  const items = useJingdongStore((s) => s.items);
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const addToCart = useJingdongStore((s) => s.addToCart);
  const addresses = useJingdongStore((s) => s.addresses);
  const selectedAddressId = useJingdongStore((s) => s.selectedAddressId);
  const selectAddress = useJingdongStore((s) => s.selectAddress);
  const recordTaskAudit = useJingdongStore((s) => s.recordTaskAudit);
  const [tab, setTab] = useState('全部');
  const [sort, setSort] = useState<SortMode>('comprehensive');
  const [chip, setChip] = useState('');
  const [filters, setFilters] = useState<string[]>([]);
  const [draftQ, setDraftQ] = useState('');

  const view = sp.get('view');
  const from = sp.get('from');
  const food = from === 'miaosong' || from === 'waimai'; // 秒送/外卖入口 → 门店(秒送)结果页
  const q = sp.get('q') || (food ? '盒马' : '联想thinkbook14+');
  const address = addresses.find((a) => a.id === selectedAddressId) || addresses.find((a) => a.isDefault) || addresses[0];

  // 结果页搜索框可再编辑;URL 上的 q 变化时同步本地草稿
  useEffect(() => { setDraftQ(q); }, [q]);
  useEffect(() => {
    recordTaskAudit({ searchResult: { query: q, sort, filters, addressId: selectedAddressId } });
  }, [filters, q, recordTaskAudit, selectedAddressId, sort]);

  const commitSearch = (next?: string) => {
    const kw = (next ?? draftQ).trim();
    if (!kw) return;
    // replace:不把每次改词压进历史,返回直接回到搜索页
    setSp((p) => {
      p.set('q', kw);
      p.delete('view');
      return p;
    }, { replace: true });
  };

  const openView = (v: string) => setSp((p) => { p.set('view', v); return p; });
  const toggleFilter = (o: string) => setFilters((f) => (f.includes(o) ? f.filter((x) => x !== o) : [...f, o]));

  const pickSort = (id: SortMode) => {
    setSort(id);
    if (view === 'sortSheet') back();
  };

  const sortOpen = view === 'sortSheet';
  const sortOpt = SORT_OPTIONS.find((o) => o.id === sort);
  const sortBtnLabel = sort === 'sales' ? '综合推荐' : (sortOpt?.short ?? '综合推荐');
  const sortBtnActive = sort !== 'sales';

  // 秒送结果:按搜索词过滤门店(店名或菜品命中),不同词落到不同门店
  const foodShops = useMemo(() => {
    const kw = q.trim();
    if (!kw) return lifeShops;
    const m = lifeShops.filter((s) => s.name.includes(kw) || s.dishes.some((d) => d.name.includes(kw) || d.cat.includes(kw)));
    return m.length ? m : lifeShops;
  }, [lifeShops, q]);

  const list = useMemo(() => {
    // 按搜索词过滤;全不命中时展示空列表(不再兜底全站电子品)。
    const kw = q.trim().toLowerCase();
    const tokens = new Set<string>();
    (kw.match(/[a-z0-9]{2,}/g) || []).forEach((t) => tokens.add(t));
    const cjk = kw.match(/[一-龥]+/g) || [];
    cjk.forEach((run) => {
      if (run.length === 1) tokens.add(run);
      for (let i = 0; i < run.length - 1; i++) tokens.add(run.slice(i, i + 2));
    });
    // 饮食相关词:额外按品类召回
    const foodHint = /吃|食|饮|奶|罐|果|零食|罐头|黄桃|西瓜|饺|咖啡|榨菜|水|牙膏|餐|菜|肉|面|粉/.test(kw);
    const hay = (it: typeof items[number]) => `${it.title} ${it.category} ${it.tags.join(' ')}`.toLowerCase();
    let matched = tokens.size
      ? items.filter((it) => {
          const h = hay(it);
          return [...tokens].some((t) => h.includes(t));
        })
      : [...items];
    if (!matched.length && foodHint) {
      matched = items.filter((it) => it.category === '食品酒饮' || it.category === '生鲜' || it.category === '美妆个护');
    }
    let arr = [...matched];

    // Tab
    if (tab === '新品') arr = arr.filter((it) => it.tags.includes('新品') || it.id.includes('new') || it.reviewCount < 5000);
    else if (tab === '秒送') arr = arr.filter((it) => it.category === '食品酒饮' || it.category === '生鲜' || it.jdLogistics);
    else if (tab === '口碑') arr = arr.filter((it) => parseFloat(it.goodRate) >= 97);

    // Chip
    if (chip === '京东物流') arr = arr.filter((it) => it.jdLogistics);
    else if (chip === '国家补贴') arr = arr.filter((it) => it.guobu);
    else if (chip === '清凉季') arr = arr.filter((it) => /西瓜|冰|水|空调|风扇|吹风/.test(it.title + it.category));
    else if (chip === '内存容量') arr = arr.filter((it) => it.category === '电脑办公' || it.category === '手机');

    // 筛选抽屉
    if (filters.includes('京东物流') || filters.includes('当日达') || filters.includes('次日达')) {
      arr = arr.filter((it) => it.jdLogistics);
    }
    if (filters.includes('自营')) arr = arr.filter((it) => it.self);
    if (filters.includes('国家补贴')) arr = arr.filter((it) => it.guobu);
    if (filters.includes('包邮')) arr = arr.filter((it) => it.jdLogistics || it.self);
    if (filters.includes('先用后付')) arr = arr.filter((it) => it.price < 200 || it.category === '食品酒饮');

    if (sort === 'price_asc') arr.sort((a, b) => a.price - b.price);
    else if (sort === 'price_desc') arr.sort((a, b) => b.price - a.price);
    else if (sort === 'reviews_desc') arr.sort((a, b) => b.reviewCount - a.reviewCount);
    else if (sort === 'sales') arr.sort((a, b) => parseSold(b.sold) - parseSold(a.sold));
    else arr.sort((a, b) => b.reviewCount * parseFloat(b.goodRate) - a.reviewCount * parseFloat(a.goodRate));
    return arr;
  }, [items, q, sort, tab, chip, filters]);

  // —— 秒送/外卖 搜索结果:门店卡列表(与首页商品结果完全不同) ——
  if (food) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
        {/* 顶部:搜秒送 + 门店搜索词 + 定位 */}
        <div className="shrink-0 pt-10 px-2 pb-1.5 bg-white flex items-center gap-2">
          <button {...bindBack()} aria-label="返回" className="w-7 h-8 flex items-center justify-center">
            <IcNavBack size={22} className="text-[#333]" />
          </button>
          <div className="flex-1 h-9 rounded-full border border-[#FF4E33] bg-white flex items-center px-3">
            <span className="text-[13px] text-[#FF4E33] font-semibold flex items-center shrink-0">搜秒送<IcChevronDown size={13} /></span>
            <span className="w-px h-4 bg-[#EEE] mx-2" />
            <input
              value={draftQ}
              onChange={(e) => setDraftQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(); }}
              onBlur={() => { if (draftQ.trim() && draftQ.trim() !== q) commitSearch(); }}
              className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1A1A1A] outline-none"
              placeholder="搜索门店或商品"
            />
          </div>
          <div className="flex items-center gap-0.5 text-[12px] text-[#333] max-w-[80px]">
            <IcMapPin size={13} className="shrink-0 text-[#FF4E33]" /><span className="truncate">{address ? address.detail : '定位'}</span>
          </div>
        </div>

        {/* 排序 + 筛选 */}
        <div className="shrink-0 bg-white flex items-center px-3 py-2 border-t border-[#F5F5F5] text-[14px]">
          <button
            {...bindTap({ kind: 'action', id: 'result.sort.select.comprehensive' }, { onTrigger: () => setSort('comprehensive') })}
            className="flex items-center gap-0.5 text-[#1A1A1A] font-semibold mr-auto"
          >综合排序 <IcChevronDown size={14} /></button>
          <button
            {...bindTap({ kind: 'action', id: 'result.filter.show' }, { onTrigger: () => openView('filterDrawer') })}
            className={`flex items-center gap-0.5 ${filters.length ? 'text-[#FF4E33] font-semibold' : 'text-[#333]'}`}
          >筛选{filters.length ? `(${filters.length})` : ''} <IcFilter size={15} /></button>
        </div>
        {/* 优惠 chips */}
        <div className="shrink-0 bg-white flex gap-2 px-3 pb-2">
          {['免运费', '领满减券'].map((c) => {
            const active = chip === c;
            return (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'result.chip.select.category' }, { params: { category: c }, onTrigger: () => setChip(active ? '' : c) })}
                className={`px-3 py-1 rounded-full text-[13px] ${active ? 'bg-[#FDECEA] text-[#FF4E33]' : 'bg-[#F4F4F4] text-[#666]'}`}
              >{c}</button>
            );
          })}
        </div>

        {/* 门店卡列表 */}
        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2" data-scroll-container="result-feed" data-scroll-direction="vertical">
          {foodShops.map((shop) => {
            const openBind = shop.kind === 'super'
              ? bindTap('result.lifeshop-open', { params: { shopId: shop.id } })
              : bindTap('result.restaurant-open', { params: { shopId: shop.id } });
            return (
              <div key={shop.id} className="bg-white rounded-xl p-3">
                <div {...openBind} className="flex gap-2.5">
                  <Img src={shop.logo} className="w-14 h-14 rounded-lg object-cover bg-[#F5F5F5] shrink-0" alt={shop.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-white bg-[#FF4E33] rounded px-1 shrink-0">秒送</span>
                      <span className="text-[15px] font-bold text-[#1A1A1A] truncate">{shop.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-[12px] text-[#666]">
                      <span className="text-[#FF8C00] font-semibold flex items-center"><IcStar size={12} className="fill-current" />{shop.rating}</span>
                      <span>{shop.sold}</span>
                      <span className="ml-auto">{shop.eta} · {shop.distance}</span>
                    </div>
                    <div className="text-[11px] text-[#FF2D2D] mt-1">起送¥0 · 满¥49免运费</div>
                  </div>
                </div>
                {/* 门店菜品横滑 */}
                <div className="overflow-x-auto no-scrollbar mt-2.5">
                  <div className="flex gap-2">
                    {shop.dishes.slice(0, 6).map((d) => (
                      <div key={d.id} className="w-[92px] shrink-0">
                        <div className="relative aspect-square rounded-lg overflow-hidden bg-[#F5F5F5]">
                          <Img src={d.image} className="w-full h-full object-cover" />
                          <span className="absolute left-1 top-1 text-[9px] text-white bg-[#FF4E33] rounded px-1">秒送</span>
                        </div>
                        <div className="text-[11px] text-[#333] line-clamp-1 mt-1">{d.name}</div>
                        <div className="flex items-center justify-between mt-0.5">
                          <PriceYuan value={d.price} className="text-[#FF2D2D] text-[14px]" />
                          <button
                            {...bindTap('result.restaurant-sku-open', { params: { shopId: shop.id, itemId: d.id }, stopPropagation: true })}
                            aria-label="加购"
                            className="w-6 h-6 rounded-full bg-[#FF4E33] text-white flex items-center justify-center shrink-0"
                          ><IcPlus size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 秒送结果·筛选抽屉(复用同一 URL 驱动弹层) */}
        {view === 'filterDrawer' && (
          <div className="absolute inset-0 z-40 flex" onClick={() => back()}>
            <div className="flex-1 bg-black/40" />
            <div className="w-[80%] h-full bg-white flex flex-col pt-10" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 overflow-y-auto p-4">
                {FILTER_GROUPS_FOOD.map((g) => (
                  <div key={g.title} className="mb-5">
                    <div className="text-[15px] font-bold text-[#1A1A1A] mb-2">{g.title}</div>
                    <div className="flex flex-wrap gap-2">
                      {g.options.map((x) => {
                        const on = filters.includes(x);
                        return (
                          <button
                            key={x}
                            {...bindTap({ kind: 'action', id: 'result.filteroption.toggle' }, { params: { option: x }, onTrigger: () => toggleFilter(x) })}
                            className={`px-3 py-1.5 rounded text-[13px] ${on ? 'bg-[#FDECEA] text-[#FF4E33] font-semibold' : 'bg-[#F4F4F4] text-[#333]'}`}
                          >{x}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="shrink-0 flex gap-3 p-3 border-t border-[#F0F0F0]">
                <button {...bindTap({ kind: 'action', id: 'result.filter.reset' }, { onTrigger: () => setFilters([]) })} className="flex-1 h-10 rounded-full bg-[#F4F4F4] text-[15px] text-[#333]">重置</button>
                <button {...bindTap({ kind: 'action', id: 'result.filter.apply' }, { onTrigger: () => back() })} className="flex-1 h-10 rounded-full bg-[#FF4E33] text-white text-[15px] font-semibold">确认</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部搜索栏 */}
      <div className="shrink-0 pt-10 px-2 pb-1.5 bg-white flex items-center gap-2">
        <button {...bindBack()} aria-label="返回" className="w-7 h-8 flex items-center justify-center">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <div className="flex-1 h-9 rounded-full border border-[#E1251B] bg-white flex items-center px-3 gap-2">
          <input
            value={draftQ}
            onChange={(e) => setDraftQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') commitSearch(); }}
            onBlur={() => { if (draftQ.trim() && draftQ.trim() !== q) commitSearch(); }}
            className="flex-1 min-w-0 bg-transparent text-[14px] text-[#1A1A1A] outline-none"
            placeholder="搜索京东商品"
          />
          <button {...bindTap({ kind: 'action', id: 'result.camera.wontfix' }, { onTrigger: wontfix })} aria-label="拍照搜" className="text-[#666] shrink-0">
            <IcCamera size={18} />
          </button>
        </div>
        <button {...bindTap({ kind: 'action', id: 'result.chip.select.category' }, { params: { category: '全部' }, onTrigger: wontfix })} aria-label="更多" className="w-8 h-8 flex items-center justify-center text-[#333]">
          <IcGrid size={20} />
        </button>
      </div>

      {/* 结果类型 tab */}
      <div className="shrink-0 bg-white flex items-center justify-around py-2">
        {TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'result.tab.select.type' }, { params: { type: t }, onTrigger: () => setTab(t) })}
            className={`text-[16px] ${tab === t ? 'text-[#E1251B] font-bold' : 'text-[#333]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 排序栏:地址 · 综合推荐(下拉) · 销量 · 筛选 —— 不再单独放「价格」 */}
      <div className="shrink-0 bg-white flex items-center px-3 py-2 border-t border-[#F5F5F5] text-[14px]">
        <button
          {...bindTap({ kind: 'action', id: 'result.address.show' }, { onTrigger: () => openView('address') })}
          className="flex items-center gap-0.5 text-[#666] mr-3 max-w-[110px]"
        >
          <IcMapPin size={14} className="shrink-0" />
          <span className="truncate">{address ? address.detail : '选择地址'}</span>
          <IcChevronDown size={14} className="shrink-0" />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.show' }, {
            onTrigger: () => (sortOpen ? back() : openView('sortSheet')),
          })}
          className={`flex items-center gap-0.5 mr-4 ${sortBtnActive ? 'text-[#E1251B] font-semibold' : 'text-[#333]'}`}
        >
          {sortBtnLabel}
          <IcChevronDown size={14} className={`shrink-0 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.sort.select.sales' }, {
            onTrigger: () => {
              if (sortOpen) back();
              setSort('sales');
            },
          })}
          className={`mr-auto ${sort === 'sales' ? 'text-[#E1251B] font-semibold' : 'text-[#333]'}`}
        >
          销量
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'result.filter.show' }, { onTrigger: () => openView('filterDrawer') })}
          className={`flex items-center gap-0.5 ${filters.length ? 'text-[#E1251B] font-semibold' : 'text-[#333]'}`}
        >
          筛选{filters.length ? `(${filters.length})` : ''} <IcFilter size={15} />
        </button>
      </div>

      {/* 列表区:综合推荐下拉覆盖在 chips + 商品列表上 */}
      <div className="relative flex-1 min-h-0 flex flex-col">
        {sortOpen && (
          <div className="absolute inset-0 z-30 flex flex-col">
            <div className="bg-white shrink-0 shadow-sm">
              {SORT_OPTIONS.map((o) => {
                const on = sort === o.id;
                return (
                  <button
                    key={o.id}
                    {...bindTap({ kind: 'action', id: 'result.sort.select.option' }, {
                      params: { sort: o.id },
                      onTrigger: () => pickSort(o.id),
                    })}
                    className="w-full flex items-center gap-2 px-4 h-12 text-left border-b border-[#F7F7F7]"
                  >
                    {on
                      ? <IcCheck size={16} className="text-[#E1251B] shrink-0" />
                      : <span className="w-4 shrink-0" />}
                    <span className={`text-[15px] ${on ? 'text-[#E1251B] font-semibold' : 'text-[#1A1A1A]'}`}>{o.label}</span>
                  </button>
                );
              })}
            </div>
            <div {...bindBack()} className="flex-1 bg-black/40" />
          </div>
        )}

        {/* 品类 chips */}
        <div className="shrink-0 bg-white overflow-x-auto no-scrollbar pb-2">
          <div className="flex gap-2 px-3 whitespace-nowrap">
            {CHIPS.map((c) => {
              const filterChip = c === '京东物流' || c === '国家补贴';
              const active = filterChip ? filters.includes(c) : chip === c;
              return (
                <button
                  key={c}
                  {...bindTap({ kind: 'action', id: 'result.chip.select.category' }, {
                    params: { category: c },
                    onTrigger: () => {
                      if (filterChip) toggleFilter(c);
                      else setChip(active ? '' : c);
                    },
                  })}
                  className={`px-3 py-1 rounded-full text-[13px] shrink-0 flex items-center gap-0.5 ${
                    active ? 'bg-[#FDECEA] text-[#E1251B]' : c === '国家补贴' ? 'bg-[#F0F9F3] text-[#1BA956]' : 'bg-[#F4F4F4] text-[#666]'
                  }`}
                >
                  {c}
                  {c === '内存容量' && <IcChevronDown size={13} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto" data-scroll-container="result-feed" data-scroll-direction="vertical">
          {list.length === 0 ? (
            <div className="text-center text-[#BBB] text-[14px] py-16">暂无相关商品</div>
          ) : (
            <div className="flex flex-col">
              {list.map((it) => (
                <button key={it.id} {...bindTap('result.item-open', { params: { itemId: it.id } })} className="flex gap-3 bg-white p-3 border-b border-[#F5F5F5] text-left">
                  <div className="relative w-[110px] h-[110px] shrink-0 rounded-lg overflow-hidden bg-[#F5F5F5]">
                    <Img src={it.image} className="w-full h-full object-cover" alt={it.title} />
                    {it.guobu && <span className="absolute left-0 bottom-0 bg-[#1BA956] text-white text-[10px] px-1">国补15%</span>}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="text-[15px] leading-[20px] text-[#1A1A1A] line-clamp-2">
                      {it.jdLogistics && <span className="text-[#E1251B] text-[12px] mr-1">京东物流</span>}
                      {it.title}
                    </div>
                    <div className="text-[12px] text-[#999] mt-1">{Math.floor(it.reviewCount / 100) + 9}万+人浏览</div>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {it.baitiaoPeriods?.[0] && <Tag className="text-[#1BA956] bg-[#F0F9F3]">{it.baitiaoPeriods[0]}期免息</Tag>}
                      {it.self && <Tag className="text-[#E1251B] bg-[#FDECEA]">自营</Tag>}
                    </div>
                    <div className="flex items-end gap-2 mt-auto pt-2">
                      <PriceYuan value={it.price} className="text-[#E1251B] text-[19px]" />
                      <span className="text-[12px] text-[#BBB] line-through mb-0.5">¥{it.originPrice}</span>
                      <span className="ml-auto text-[11px] text-[#999] mb-0.5">{it.sold} {it.goodRate}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 收货地址切换弹层(URL 驱动:?view=address,返回键即关闭) */}
      {view === 'address' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="bg-white rounded-t-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="h-12 flex items-center justify-center border-b border-[#F5F5F5] text-[16px] font-semibold text-[#1A1A1A]">
              选择收货地址
            </div>
            <div className="max-h-[320px] overflow-y-auto">
              {addresses.map((a) => {
                const active = address?.id === a.id;
                return (
                  <button
                    key={a.id}
                    {...bindTap({ kind: 'action', id: 'result.address.select.addr' }, { params: { addressId: a.id }, onTrigger: () => { selectAddress(a.id); back(); } })}
                    className="w-full flex items-start gap-2 px-4 py-3 border-b border-[#F7F7F7] text-left"
                  >
                    <IcMapPin size={16} className={`mt-0.5 shrink-0 ${active ? 'text-[#E1251B]' : 'text-[#BBB]'}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-[15px] truncate ${active ? 'text-[#E1251B] font-semibold' : 'text-[#1A1A1A]'}`}>{a.detail}</div>
                      <div className="text-[12px] text-[#999] truncate mt-0.5">{a.region} · {a.name}</div>
                    </div>
                    {a.tag && <span className="text-[10px] text-[#E1251B] border border-[#E1251B]/40 rounded px-1 py-0.5 shrink-0">{a.tag}</span>}
                    {active && <IcCheck size={16} className="text-[#E1251B] shrink-0" />}
                  </button>
                );
              })}
            </div>
            <button {...bindBack()} className="w-full h-12 text-[15px] text-[#666]">取消</button>
          </div>
        </div>
      )}

      {/* 筛选抽屉(URL 驱动:?view=filterDrawer,返回键即关闭) */}
      {view === 'filterDrawer' && (
        <div className="absolute inset-0 z-40 flex" onClick={() => back()}>
          <div className="flex-1 bg-black/40" />
          <div className="w-[80%] h-full bg-white flex flex-col pt-10" onClick={(e) => e.stopPropagation()}>
            <div className="flex-1 overflow-y-auto p-4">
              {FILTER_GROUPS.map((g) => (
                <div key={g.title} className="mb-5">
                  <div className="text-[15px] font-bold text-[#1A1A1A] mb-2">{g.title}</div>
                  <div className="flex flex-wrap gap-2">
                    {g.options.map((x) => {
                      const on = filters.includes(x);
                      return (
                        <button
                          key={x}
                          {...bindTap({ kind: 'action', id: 'result.filteroption.toggle' }, { params: { option: x }, onTrigger: () => toggleFilter(x) })}
                          className={`px-3 py-1.5 rounded text-[13px] ${on ? 'bg-[#FDECEA] text-[#E1251B] font-semibold' : 'bg-[#F4F4F4] text-[#333]'}`}
                        >
                          {x}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 flex gap-3 p-3 border-t border-[#F0F0F0]">
              <button
                {...bindTap({ kind: 'action', id: 'result.filter.reset' }, { onTrigger: () => setFilters([]) })}
                className="flex-1 h-10 rounded-full bg-[#F4F4F4] text-[15px] text-[#333]"
              >
                重置
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'result.filter.apply' }, { onTrigger: () => back() })}
                className="flex-1 h-10 rounded-full bg-[#E1251B] text-white text-[15px] font-semibold"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
