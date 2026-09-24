import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcStar, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import type { RankBoardType } from '../types';

const BOARDS: RankBoardType[] = ['sales', 'rebuy', 'discount', 'trend', 'new'];

function sortByBoard(productIds: string[], board: RankBoardType): string[] {
  const field =
    board === 'rebuy'
      ? 'rebuy'
      : board === 'discount'
        ? 'discount'
        : board === 'trend'
          ? 'trend'
          : board === 'new'
            ? 'newness'
            : 'sales';
  return [...productIds].sort((a, b) => {
    const pa = productOf(a)?.rankFields;
    const pb = productOf(b)?.rankFields;
    if (!pa || !pb) return 0;
    // newness: smaller = newer; discount: smaller = deeper; others: larger better
    if (field === 'newness' || field === 'discount') return pa[field] - pb[field];
    return pb[field] - pa[field];
  });
}

/**
 * 苏宁榜单频道(spec rank.hub,s289)。
 * ?cat=&board=;榜型复用销量池按 rankFields 重排(Q25=B)。
 */
export default function RankHubPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const board = (searchParams.get('board') as RankBoardType) || 'sales';
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const ranks = useMemo(() => {
    return SUNING_CONFIG.ranks.map((r) => {
      const ids = sortByBoard(
        r.items.map((i) => i.productId),
        board,
      );
      return { ...r, top3: ids.slice(0, 3) };
    });
  }, [board]);

  const patch = (next: Record<string, string>) => {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) p.set(k, v);
    setSearchParams(p, { replace: true });
  };

  const boardLabel = (b: RankBoardType) => {
    switch (b) {
      case 'rebuy':
        return S.rankBoardRebuy;
      case 'discount':
        return S.rankBoardDiscount;
      case 'trend':
        return S.rankBoardTrend;
      case 'new':
        return S.rankBoardNew;
      default:
        return S.rankBoardSales;
    }
  };

  return (
    <div className="flex h-full flex-col bg-[#1A1410]" data-status-bar-foreground="light">
      <div className="flex shrink-0 items-center gap-1 px-2 pb-2 pt-10 text-[#F8D9A8]">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[#F8D9A8]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[15px] font-bold">{S.rankHubTitle}</span>
        <button
          {...action('rank.hub.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1"
        >
          <IcStar size={18} />
        </button>
        <button
          {...action('rank.hub.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1"
        >
          <IcMore size={18} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-3 pb-2 text-center">
          <div className="text-[18px] font-bold text-[#F8D9A8]">{S.rankHubHeadline}</div>
          <div className="mt-1 text-[11px] text-[#C4A574]">{S.rankHubSub}</div>
          <button
            {...action('rank.hub.wontfix.toast', wontfix)}
            className="mt-2 cursor-pointer border-none bg-transparent text-[11px] text-[#C4A574]"
          >
            {S.baibuRules}
          </button>
        </div>

        <div className="flex gap-2 overflow-x-auto px-3 pb-3">
          {ranks.map((r) => {
            const cover = productOf(r.top3[0]);
            return (
              <button
                key={r.id}
                {...bindTap('rank.hub.detailCard.open', { params: { rankId: r.id } })}
                className="w-[120px] shrink-0 cursor-pointer overflow-hidden rounded-xl border-none bg-[#2A2118] p-0 text-left"
              >
                <span className="block h-20 w-full bg-[#3A2E22]">
                  {cover && <Img src={cover.image} className="h-full w-full object-contain" />}
                </span>
                <span className="block px-2 py-1.5">
                  <span className="line-clamp-1 block text-[11px] font-bold text-[#F8D9A8]">
                    {r.title}
                  </span>
                  <span className="mt-0.5 block text-[10px] text-[#C4A574]">{r.soldText}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="rounded-t-2xl bg-[var(--app-c-chip-bg)] px-2.5 pb-6 pt-2">
          {/* 分类子 Tab(精选/粮油…)走查 0729 要求删除 */}
          <div className="flex gap-2 overflow-x-auto py-1">
            {BOARDS.map((b) => (
              <button
                key={b}
                {...action(
                  'rank.hub.select.boardType',
                  () => patch({ board: b }),
                  { params: { board: b } },
                )}
                className={`shrink-0 cursor-pointer rounded-full border-none px-2.5 py-1 text-[11px] ${
                  board === b
                    ? 'bg-[#3B2A1A] font-bold text-[#F8D9A8]'
                    : 'bg-[var(--app-surface)] text-[var(--app-text-muted)]'
                }`}
              >
                {boardLabel(b)}
              </button>
            ))}
          </div>

          <div className="mt-2 space-y-2">
            {ranks.map((r) => (
              <button
                key={r.id}
                {...bindTap('rank.hub.detail.open', { params: { rankId: r.id } })}
                className="w-full cursor-pointer rounded-xl border-none bg-[var(--app-surface)] p-2.5 text-left"
              >
                <div className="flex items-center">
                  <span className="min-w-0 flex-1 text-[14px] font-bold text-[var(--app-text)]">{r.title}</span>
                  <span className="shrink-0 text-[11px] text-[#B0651F]">{r.soldText}</span>
                  <IcChevronRight size={14} className="text-[#CCC]" />
                </div>
                <div className="mt-2 flex gap-2">
                  {r.top3.map((pid, i) => {
                    const p = productOf(pid);
                    return (
                      <span key={pid} className="relative h-16 w-16 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                        {p && <Img src={p.image} className="h-full w-full object-contain" />}
                        <span className="absolute left-0.5 top-0.5 rounded bg-[#3B2A1A] px-1 text-[9px] text-[#F8D9A8]">
                          {i + 1}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
