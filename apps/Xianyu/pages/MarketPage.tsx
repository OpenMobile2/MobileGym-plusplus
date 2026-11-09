import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { HOME_SEGMENTS } from '../constants';
import { ItemImage } from '../components/ItemImage';
import { Price } from '../components/ui';

/** 集市货源横滑 tab */
const MARKET_SOURCES = [
  { id: 'channel', label: '渠道货源' },
  { id: 'nearNew', label: '准新特价' },
  { id: 'quit', label: '玩家退坑' },
  { id: 'unused', label: '未使用急出' },
  { id: 'clearance', label: '撤柜清仓' },
  { id: 'auction', label: '官旗代拍' },
] as const;

/** 品类筛选条(与商品 category 对齐,保证过滤有结果) */
const MARKET_CATEGORIES = ['全部', '数码', '手机', '运动鞋', '家电', '家具', '图书'] as const;

export default function MarketPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const items = useXianyuStore((s) => s.items);
  const recordTaskAudit = useXianyuStore((s) => s.recordTaskAudit);

  const source = searchParams.get('source') ?? 'channel';
  const category = searchParams.get('category') ?? '全部';

  const list = category === '全部' ? items : items.filter((i) => i.category === category);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 顶部分段栏(当前=闲鱼集市,无返回) */}
      <div className="bg-white shrink-0">
        <div className="flex items-center gap-4 px-3 pt-1 pb-2">
          {HOME_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              {...(seg.id === 'market' ? {} : bindTap(seg.transitionId))}
              className={`bg-transparent border-none cursor-pointer py-1.5 text-[15px] ${
                seg.id === 'market' ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>

        {/* 货源横滑 tab */}
        <div
          className="flex items-center gap-4 px-3 overflow-x-auto"
          data-scroll-container="market-sources" data-scroll-direction="horizontal"
        >
          {MARKET_SOURCES.map((sc) => {
            const active = sc.id === source;
            return (
              <button
                key={sc.id}
                {...bindTap(
                  { kind: 'action', id: 'market.source.select.target' },
                  {
                    params: { target: sc.id },
                    onTrigger: () => {
                      recordTaskAudit('marketBrowse', { source: sc.id, category });
                      setSearchParams((p) => { p.set('source', sc.id); return p; }, { replace: true });
                    },
                  },
                )}
                className={`bg-transparent border-none cursor-pointer py-2 text-[14px] whitespace-nowrap relative ${
                  active ? 'text-[#111111] font-bold' : 'text-[#666666]'
                }`}
              >
                {sc.label}
                {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FFE411]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 品类筛选条 */}
      <div
        className="bg-white shrink-0 flex items-center gap-2 px-3 py-2 border-t border-[#F4F4F4] overflow-x-auto"
        data-scroll-container="market-categories" data-scroll-direction="horizontal"
      >
        {MARKET_CATEGORIES.map((cat) => {
          const active = cat === category;
          return (
            <button
              key={cat}
              {...bindTap(
                { kind: 'action', id: 'market.category.select.target' },
                {
                  params: { target: cat },
                  onTrigger: () => {
                    recordTaskAudit('marketBrowse', { source, category: cat });
                    setSearchParams((p) => { p.set('category', cat); return p; }, { replace: true });
                  },
                },
              )}
              className={`shrink-0 px-3 h-7 rounded-full text-[13px] border cursor-pointer ${
                active ? 'bg-[#FFF7D6] text-[#3A2E00] border-[#FFE411] font-medium' : 'bg-[#F4F4F4] text-[#666666] border-[#F4F4F4]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 比价商品流(单列比价卡:图左文右) */}
      <div className="flex-1 overflow-y-auto p-2" data-scroll-container="MarketPage-main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="text-center text-[#999999] text-[13px] pt-16">该品类暂无比价好货</div>
        ) : (
          list.map((it) => (
            <button
              key={it.id}
              {...bindTap('home.item-open', { params: { itemId: it.id } })}
              className="flex w-full text-left bg-white rounded-[10px] overflow-hidden border-none p-0 cursor-pointer mb-2"
            >
              <div className="relative w-28 h-28 shrink-0">
                <ItemImage seed={it.id} src={it.images[0]} category={it.category} label={it.title} className="w-full h-full" />
                {it.soldOut && (
                  <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-sm">已售出</span>
                )}
              </div>
              <div className="flex-1 min-w-0 px-2.5 py-2 flex flex-col">
                <div className="text-[14px] text-[#1A1A1A] leading-snug line-clamp-2">{it.title}</div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {typeof it.marketLowPct === 'number' && (
                    <span className="text-[11px] text-[#FF8A00] bg-[#FFF3E0] px-1.5 py-0.5 rounded">
                      比行情价低 {it.marketLowPct}%
                    </span>
                  )}
                </div>
                <div className="mt-auto flex items-baseline gap-2">
                  <Price value={it.price} size={19} />
                  {it.originalPrice && <span className="text-[#999999] text-[12px] line-through">¥{it.originalPrice}</span>}
                  <span className="ml-auto text-[11px] text-[#999999]">已售 {it.wantCount}</span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
