import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import HScroll from '../components/HScroll';
import { IcNavBack, IcMore, IcCheck } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { etaTs, fmtCnDateWeek } from '../utils/appTime';
import { compareGroupOf, compareProducts, compareRows } from '../utils/cart';

type CompareTab = 'comprehensive' | 'allParams' | 'reputation' | 'service';

const TABS: CompareTab[] = ['comprehensive', 'allParams', 'reputation', 'service'];

/**
 * PK 对比结果页(spec cart.compare,a353 + s299):
 * ?tab=comprehensive|allParams|reputation|service 四 Tab + ?diff=1「只看不同」(与任一 Tab 叠加)。
 * 阶段④强调:仅同品类对比组,参数表字段按品类定义。
 */
export default function ComparePage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('tab');
  const tab: CompareTab = (TABS as string[]).includes(raw ?? '') ? (raw as CompareTab) : 'comprehensive';
  const onlyDiff = searchParams.get('diff') === '1';

  const showToast = useSuningStore((s) => s.showToast);
  const cartItems = useSuningStore((s) => s.cartItems);
  const recordTaskAudit = useSuningStore((s) => s.recordTaskAudit);
  const wontfix = () => showToast(S.toastNotOpen);

  const group = compareGroupOf(searchParams.get('groupId'), searchParams.get('ids'), cartItems);
  const products = compareProducts(group);
  const rows = compareRows(group, products).filter((r) => !onlyDiff || !r.same);

  const setQuery = (patch: Record<string, string | null>) =>
    setSearchParams(
      (p) => {
        for (const [k, v] of Object.entries(patch)) {
          if (v === null) p.delete(k);
          else p.set(k, v);
        }
        return p;
      },
      { replace: true },
    );

  const tabLabel: Record<CompareTab, string> = {
    comprehensive: S.compareTabAll,
    allParams: S.compareTabParams,
    reputation: S.compareTabReputation,
    service: S.compareTabService,
  };

  const showParams = tab === 'comprehensive' || tab === 'allParams';
  const showReputation = tab === 'comprehensive' || tab === 'reputation';
  const showService = tab === 'comprehensive' || tab === 'service';

  const paramTable = (
    <div className="mt-2 rounded-xl bg-[var(--app-surface)] pb-2">
      <div className="px-3 pt-2.5 text-[14px] font-bold text-[var(--app-text)]">
        {tab === 'allParams' ? S.compareTabParams : S.coreParams}
      </div>
      {rows.map((r) => (
        <div key={r.key} className="px-3">
          <div className="py-1.5 text-center text-[11px] text-[var(--app-c-text-muted)]">{r.label}</div>
          <div className="flex items-start gap-2 border-b border-[var(--app-border)] pb-2">
            {r.values.map((v, i) => (
              <span
                key={i}
                className={`min-w-0 flex-1 text-center text-[13px] ${r.same ? 'text-[var(--app-text-muted)]' : 'font-semibold text-[var(--app-text)]'}`}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      ))}
      {rows.length === 0 && <div className="py-6 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.noDiffRow}</div>}
      {tab === 'comprehensive' && (
        <button
          {...action('cart.compare.tab.allParams.jump', () => setQuery({ tab: 'allParams' }))}
          className="mx-3 mt-2 block w-[calc(100%-24px)] cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] py-2 text-[13px] text-[var(--app-text)]"
        >
          {S.compareTabParams}
        </button>
      )}
    </div>
  );

  return (
    <div className="flex h-full min-w-0 w-full flex-col overflow-hidden bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 标题「电脑对比」+「···」 */}
      <div className="flex items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{S.compareTitle}</div>
        <button {...action('cart.compare.wontfix.toast', wontfix)} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcMore size={20} />
        </button>
      </div>

      {/* 商品卡区:3+ 固定宽可横滑(与 PK Tab 同 HScroll) */}
      <HScroll id="compareCards" className="w-full gap-2 bg-[var(--app-surface)] px-3 pb-3">
        {products.map((p) => (
          <div key={p.id} className={products.length > 2 ? 'w-[140px] shrink-0 grow-0' : 'min-w-0 flex-1'}>
            <div className="aspect-square w-full overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
              <Img src={p.image} className="h-full w-full object-contain" />
            </div>
            <div className="mt-1 line-clamp-2 text-[12px] leading-4 text-[var(--app-text)]">{p.title}</div>
            <div className="mt-1 text-[16px] font-bold text-[var(--app-c-danger)]">
              <span className="text-[10px]">¥</span>
              {p.promoTag === 'gov' ? Math.round(p.price * 0.85 * 100) / 100 : p.price}
            </div>
            {p.promoTag === 'gov' && (
              <>
                <div className="text-[10px] text-[var(--app-c-danger)]">
                  {S.discountedLabel}
                  {Math.round((p.priceOriginal - p.price * 0.85) * 100) / 100}
                </div>
                <div className="mt-0.5 truncate rounded-sm bg-[#EAF1FD] px-1 text-[10px] leading-4 text-[#2B6BD4]">
                  {S.subsidyRule}
                </div>
              </>
            )}
            <button
              {...bindTap('cart.compare.detail.open', {
                params: { productId: p.id },
              })}
              className="mt-1.5 w-full cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] py-1.5 text-[13px] font-bold text-white"
            >
              {S.buyNow}
            </button>
          </div>
        ))}
      </HScroll>

      {/* Tab 行 + 「只看不同」开关 */}
      <div className="flex items-center gap-3 border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1.5">
        {TABS.map((t) => (
          <button
            key={t}
            {...action('cart.compare.tab.select', () => setQuery({ tab: t }), { params: { tab: t } })}
            className={`relative shrink-0 cursor-pointer border-none bg-transparent px-0 py-1 text-[13px] ${
              tab === t ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
            }`}
          >
            {tabLabel[t]}
            {tab === t && <span className="absolute -bottom-0.5 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />}
          </button>
        ))}
        <span className="min-w-0 flex-1" />
        <button
          {...action('cart.compare.onlyDiff.toggle', () => {
            const next = !onlyDiff;
            recordTaskAudit({ compareOnlyDiff: next, compareProductIds: products.map((p) => p.id) });
            setQuery({ diff: next ? '1' : null });
          })}
          className="flex shrink-0 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
        >
          <span
            className={`flex h-[16px] w-[16px] items-center justify-center rounded-sm ${
              onlyDiff ? 'bg-[var(--app-primary)] text-white' : 'border border-[var(--app-border)] bg-[var(--app-surface)] text-transparent'
            }`}
          >
            <IcCheck size={11} strokeWidth={3} />
          </span>
          {S.onlyDiff}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {showParams && paramTable}

        {showReputation && (
          <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
            <div className="text-[14px] font-bold text-[var(--app-text)]">{S.reputationTitle}</div>
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {products.map((p) => {
                const rep = group.reputation?.find((r) => r.productId === p.id);
                return (
                  <div key={p.id} className={`text-center ${products.length > 2 ? 'w-[140px] shrink-0' : 'min-w-0 flex-1'}`}>
                    <div className="text-[13px] text-[var(--app-text)]">{rep?.reviewText ?? `${p.reviewCount}评价·${p.goodRate}%好评`}</div>
                    {rep?.rankText && (
                      <button
                        {...action('cart.compare.wontfix.toast', wontfix)}
                        className="mt-1 cursor-pointer rounded-full border-none bg-[#FDF3E3] px-2 py-0.5 text-[11px] text-[#B0651F]"
                      >
                        {rep.rankText} &gt;
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showService && (
          <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
            <div className="text-[14px] font-bold text-[var(--app-text)]">{S.serviceTitle}</div>
            <div className="mt-1 py-1.5 text-center text-[11px] text-[var(--app-c-text-muted)]">{S.deliveryLabel}</div>
            <div className="flex gap-2 overflow-x-auto border-b border-[var(--app-border)] pb-2">
              {products.map((p, i) => (
                <div
                  key={p.id}
                  className={`text-center text-[13px] text-[var(--app-text)] ${products.length > 2 ? 'w-[140px] shrink-0' : 'min-w-0 flex-1'}`}
                >
                  {group.service?.delivery[i] ?? '苏宁发货'}
                  <div className="text-[11px] text-[var(--app-c-text-muted)]">
                    {S.etaPrefix}
                    {fmtCnDateWeek(etaTs(group.service?.deliveryEtaDayOffsets[i] ?? 2))}
                    {S.etaSuffix}
                  </div>
                </div>
              ))}
            </div>
            <div className="py-1.5 text-center text-[11px] text-[var(--app-c-text-muted)]">{S.installLabel}</div>
            <div className="border-b border-[var(--app-border)] pb-2 text-center text-[13px] text-[var(--app-text-muted)]">
              {group.service?.install ?? '均无需安装'}
            </div>
            <div className="py-1.5 text-center text-[11px] text-[var(--app-c-text-muted)]">{S.warrantyLabel}</div>
            <div className="text-center text-[13px] text-[var(--app-text-muted)]">{group.service?.warranty ?? '支持延长保'}</div>
          </div>
        )}
      </div>
    </div>
  );
}
