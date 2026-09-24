import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useLocale } from '@/os/locale';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, Img, TopBar, Price, Chip, EmptyState, MY, useStatusBarFg } from '../components/ui';
import { SHOW_CATEGORIES } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcHeart } from '../res/icons';

/** 演出分类列表页(r6:分类tab+筛选+收藏♡) */
export default function ShowCategoryPage() {
  const s = useAppStrings(strings, stringsEn);
  const locale = useLocale();
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const { searchParams, setSearchParams } = usePanel('cat');
  const cat = searchParams.get('cat') ?? 'concert';
  const [sort, setSort] = React.useState('智能排序');

  const shows = useMaoyanStore((st) => st.shows);
  const wishShows = useMaoyanStore((st) => st.wishShows);
  const toggleWishShow = useMaoyanStore((st) => st.toggleWishShow);

  let list = shows.filter((x) => x.category === cat);
  if (list.length === 0) list = shows; // 品类空时兜底展示全部,避免死页
  if (sort === '价格低') list = [...list].sort((a, b) => a.priceMin - b.priceMin);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground={statusFg}>
      <TopBar title={(() => { const c = SHOW_CATEGORIES.find((x) => x.id === cat); return c ? (locale === 'en' ? c.labelEn : c.label) : s.tabShow; })()} />
      {/* 分类tab */}
      <div className="shrink-0 flex bg-app-surface overflow-x-auto border-b border-app-border" data-scroll-container="cat-tabs" data-scroll-direction="horizontal">
        {SHOW_CATEGORIES.map((c) => (
          <button
            key={c.id}
            {...bindTap({ kind: 'action', id: 'showcat.tab.select.target' }, {
              params: { target: c.id },
              onTrigger: () => setSearchParams((p) => { p.set('cat', c.id); return p; }, { replace: true }),
            })}
            className={`shrink-0 px-3 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${cat === c.id ? 'text-[#DC4038] font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
          >
            {locale === 'en' ? c.labelEn : c.label}
          </button>
        ))}
      </div>
      {/* 筛选 */}
      <div className="shrink-0 flex gap-2 px-3 py-2 bg-app-surface">
        {['时间', '艺人', '智能排序', '价格低'].map((f) => (
          <Chip
            key={f}
            text={f}
            active={sort === f}
            binding={bindTap({ kind: 'action', id: 'showcat.filter.select.option' }, {
              params: { option: f },
              onTrigger: () => setSort(f),
            })}
          />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="showcat-list" data-scroll-direction="vertical">
        {list.length === 0 && <EmptyState text="暂无相关演出" />}
        {list.map((x) => {
          const wished = wishShows.includes(x.id);
          return (
            <button key={x.id} {...bindTap('showcat.item-open', { params: { id: x.id } })}
              className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left">
              <Img src={x.poster} className="w-16 h-[85px] object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-app-text line-clamp-2">{x.title}</div>
                <div className="text-[11px] text-(--app-c-text-3) mt-1">{x.dateDesc}</div>
                <div className="text-[11px] text-(--app-c-text-3) mt-0.5 truncate">{x.city} · {x.venue}</div>
                <div className="mt-1">
                  <Price value={x.priceMin} size="s" suffix=" 起" />
                  {x.discount && <span className="ml-1 text-[10px] text-[#FF6F00] bg-[#FFF3E0] rounded px-1">{x.discount}</span>}
                </div>
              </div>
              <span
                {...bindTap({ kind: 'action', id: 'showcat.fav.toggle' }, {
                  params: { id: x.id }, stopPropagation: true, onTrigger: () => toggleWishShow(x.id),
                })}
                className="self-start shrink-0 cursor-pointer p-1"
                aria-label="收藏"
              >
                <IcHeart size={18} fill={wished ? MY.cta : 'none'} className={wished ? 'text-[#F5303E]' : 'text-(--app-c-text-4)'} />
              </span>
            </button>
          );
        })}
        <div className="h-3" />
      </div>
    </div>
  );
}
