import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcCart, IcMore, IcClose, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import type { RankBoardType } from '../types';

function sortIds(productIds: string[], board: RankBoardType): string[] {
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
    if (field === 'newness' || field === 'discount') return pa[field] - pb[field];
    return pb[field] - pa[field];
  });
}

/**
 * 榜单详情(spec rank.detail,s290~s292)。
 * ?rankId=&board=&float=;细分子 Tab toast(Q26=A)。
 */
export default function RankDetailPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const rankId = searchParams.get('rankId') || 'acHot';
  const board = (searchParams.get('board') as RankBoardType) || 'sales';
  const floatOn = searchParams.get('float') !== '0';

  const cartItems = useSuningStore((s) => s.cartItems);
  const showToast = useSuningStore((s) => s.showToast);
  const recordTaskAudit = useSuningStore((s) => s.recordTaskAudit);
  const wontfix = () => showToast(S.toastNotOpen);
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);

  const rank = SUNING_CONFIG.ranks.find((r) => r.id === rankId) ?? SUNING_CONFIG.ranks[0];
  const ordered = useMemo(() => {
    const ids = sortIds(
      rank.items.map((i) => i.productId),
      board,
    );
    return ids.map((id) => rank.items.find((i) => i.productId === id)!).filter(Boolean);
  }, [rank, board]);

  const patch = (next: Record<string, string | null>) => {
    if (next.board) recordTaskAudit({ rankBoard: { rankId, board: next.board as RankBoardType } });
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) {
      if (v == null) p.delete(k);
      else p.set(k, v);
    }
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
    <div className="relative flex h-full flex-col bg-[var(--app-c-chip-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-gradient-to-b from-[#3B2A1A] to-[#5A4030] px-2 pb-2 pt-10 text-[#F8D9A8]">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[#F8D9A8]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 truncate text-center text-[15px] font-bold">{rank.title}</span>
        <button
          {...bindTap('rank.detail.cart.open')}
          className="relative cursor-pointer border-none bg-transparent p-1 text-[#F8D9A8]"
        >
          <IcCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[14px] rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[9px] leading-[14px] text-white">
              {cartCount}
            </span>
          )}
        </button>
        <button
          {...action('rank.detail.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1 text-[#F8D9A8]"
        >
          <IcMore size={18} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-24 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="text-[14px] font-bold text-[var(--app-text)]">{rank.title}</div>
          <div className="mt-0.5 text-[11px] text-[#B0651F]">{rank.soldText}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {rank.boardTypes.map((b) => {
              const bind =
                rankId === 'phonePop' && (b === 'trend' || b === 'new')
                  ? action(
                      'rank.detail.select.boardType',
                      () => patch({ board: b }),
                      { params: { board: b } },
                    )
                  : action(
                      'rank.detail.boardType.switch',
                      () => patch({ board: b }),
                      { params: { board: b } },
                    );
              return (
                <button
                  key={b}
                  {...bind}
                  className={`cursor-pointer rounded-full border-none px-2.5 py-1 text-[11px] ${
                    board === b
                      ? 'bg-[#3B2A1A] font-bold text-[#F8D9A8]'
                      : 'bg-[var(--app-c-chip-bg)] text-[var(--app-text-muted)]'
                  }`}
                >
                  {boardLabel(b)}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {['总榜', '热销', '好评', '新品'].map((t) => (
              <button
                key={t}
                {...action('rank.detail.wontfix.toast', wontfix)}
                className="shrink-0 cursor-pointer rounded-full border-none bg-[#FFF7F0] px-2.5 py-1 text-[11px] text-[#B0651F]"
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-2 space-y-2">
          {ordered.map((entry, i) => {
            const p = productOf(entry.productId);
            if (!p) return null;
            return (
              <div key={entry.productId} className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
                <button
                  {...bindTap('rank.detail.product.open', {
                    params: { productId: entry.productId },
                  })}
                  className="flex w-full cursor-pointer gap-2.5 border-none bg-transparent p-2.5 text-left"
                >
                  <span className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                    <Img src={p.image} className="h-full w-full object-contain" />
                    <span className="absolute left-1 top-1 rounded bg-[#3B2A1A] px-1.5 text-[10px] font-bold text-[#F8D9A8]">
                      {i + 1}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[13px] leading-4 text-[var(--app-text)]">
                      {p.title}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      {entry.badges.map((b) => (
                        <span
                          key={b}
                          className="rounded bg-[#FFF7F0] px-1 text-[9px] text-[#B0651F]"
                        >
                          {b}
                        </span>
                      ))}
                    </span>
                    <span className="mt-1 block text-[11px] text-[var(--app-c-text-muted)]">
                      {entry.quote.nick}:{entry.quote.text}
                    </span>
                    <span className="mt-1.5 block text-[15px] font-bold text-[var(--app-c-danger)]">
                      <span className="text-[10px]">¥</span>
                      {p.price}
                    </span>
                  </span>
                </button>
                <div className="flex justify-end px-2.5 pb-2.5">
                  <button
                    {...bindTap('rank.detail.product.open', {
                      params: { productId: entry.productId },
                    })}
                    className="cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[12px] font-bold text-white"
                  >
                    {S.buyNow}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button
          {...bindTap('rank.detail.hub.open')}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-1 border-none bg-transparent py-3 text-[13px] text-[#B0651F]"
        >
          {S.rankMoreBoards}
          <IcChevronRight size={14} />
        </button>

        {(
          [
            S.rankCompare,
            S.rankOfficial,
            S.rankAllBoards,
          ] as const
        ).map((label) => (
          <button
            key={label}
            {...action('rank.detail.wontfix.toast', wontfix)}
            className="mt-1 w-full cursor-pointer rounded-xl border-none bg-[var(--app-surface)] py-2.5 text-[12px] text-[var(--app-text-muted)]"
          >
            {label}
          </button>
        ))}
      </div>

      {floatOn && (
        <div className="absolute bottom-4 left-3 right-3 z-10 flex items-center gap-2 rounded-full bg-[#3B2A1A] px-3 py-2 text-[#F8D9A8] shadow-lg">
          <button
            {...bindTap('rank.detail.hubFloat.open')}
            className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left text-[12px] font-bold text-[#F8D9A8]"
          >
            {S.rankFloatAll}
          </button>
          <button
            {...bindTap('rank.detail.hubChannel.open')}
            className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[11px] text-[#C4A574]"
          >
            {S.rankChannel}
          </button>
          <button
            {...action('rank.detail.floatBar.close', () => patch({ float: '0' }))}
            className="shrink-0 cursor-pointer border-none bg-transparent p-0.5 text-[#C4A574]"
          >
            <IcClose size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
