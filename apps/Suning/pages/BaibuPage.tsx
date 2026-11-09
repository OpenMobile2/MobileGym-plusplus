import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcMore, IcSearch, IcStar } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';

type Cat = 'featured' | '3c' | 'ac' | 'appliance' | 'furniture';

const CATS: { key: Cat; labelKey: 'baibuCatFeatured' | 'baibuCat3c' | 'baibuCatAc' | 'baibuCatAppliance' | 'baibuCatFurniture' }[] = [
  { key: 'featured', labelKey: 'baibuCatFeatured' },
  { key: '3c', labelKey: 'baibuCat3c' },
  { key: 'ac', labelKey: 'baibuCatAc' },
  { key: 'appliance', labelKey: 'baibuCatAppliance' },
  { key: 'furniture', labelKey: 'baibuCatFurniture' },
];

/**
 * 百亿补贴频道(spec promo.baibu,s288)。
 * ?category= 过滤 listing;商品 → 商详。
 */
export default function BaibuPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('category');
  const category: Cat =
    raw === '3c' || raw === 'ac' || raw === 'appliance' || raw === 'furniture' ? raw : 'featured';

  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const items = SUNING_CONFIG.baibuChannel.filter(
    (x) => category === 'featured' || x.category === category,
  );

  const catBind = (key: Cat) =>
    action(
      'promo.baibu.categoryTab.switch',
      () => setSearchParams({ category: key }, { replace: true }),
      { params: { category: key } },
    );

  return (
    <div className="flex h-full flex-col bg-[var(--app-c-danger)]" data-status-bar-foreground="light">
      <div className="flex shrink-0 items-center gap-1 px-2 pb-2 pt-10 text-white">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-white">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold">{S.baibuTitle}</span>
        <button
          {...action('promo.baibu.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1 text-white"
        >
          <IcStar size={18} />
        </button>
        <button
          {...action('promo.baibu.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1 text-white"
        >
          <IcSearch size={18} />
        </button>
        <button
          {...action('promo.baibu.wontfix.toast', wontfix)}
          className="cursor-pointer border-none bg-transparent p-1 text-white"
        >
          <IcMore size={18} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-t-2xl bg-[var(--app-c-chip-bg)]"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="bg-gradient-to-b from-[#F13A21] to-[#F7F7F7] px-2.5 pb-2 pt-1">
          <div className="rounded-xl bg-gradient-to-r from-[#FF6A3D] to-[#F13A21] px-3 py-3 text-white">
            <div className="text-[15px] font-bold">{S.baibuBannerTitle}</div>
            <div className="mt-0.5 text-[11px] text-white/85">{S.baibuBannerDesc}</div>
            <div className="mt-2 flex gap-2">
              <button
                {...action('promo.baibu.wontfix.toast', wontfix)}
                className="cursor-pointer rounded-full border border-white/50 bg-transparent px-2.5 py-0.5 text-[11px] text-white"
              >
                {S.baibuRules}
              </button>
              <button
                {...action('promo.baibu.wontfix.toast', wontfix)}
                className="cursor-pointer rounded-full border-none bg-[var(--app-surface)] px-2.5 py-0.5 text-[11px] font-bold text-[var(--app-c-danger)]"
              >
                {S.baibuViewDetail}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto bg-[var(--app-surface)] px-3 py-2">
          {CATS.map((c) => (
            <button
              key={c.key}
              {...catBind(c.key)}
              className={`shrink-0 cursor-pointer border-none bg-transparent pb-1 text-[13px] ${
                category === c.key
                  ? 'border-b-2 border-[var(--app-c-danger)] font-bold text-[var(--app-c-danger)]'
                  : 'text-[var(--app-text-muted)]'
              }`}
            >
              {S[c.labelKey]}
            </button>
          ))}
        </div>

        <div className="space-y-2 px-2.5 py-2 pb-20">
          {items.map((row) => {
            const p = productOf(row.productId);
            if (!p) return null;
            return (
              <button
                key={row.productId}
                {...bindTap('promo.baibu.product.open', { params: { productId: row.productId } })}
                className="flex w-full cursor-pointer gap-2.5 rounded-xl border-none bg-[var(--app-surface)] p-2.5 text-left"
              >
                <span className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                  <Img src={p.image} className="h-full w-full object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 block text-[13px] leading-4 text-[var(--app-text)]">
                    {p.title}
                  </span>
                  <span className="mt-1 block text-[11px] text-[var(--app-c-text-muted)]">{row.salesText}</span>
                  <span className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#FFE4E0]">
                      <span
                        className="block h-full rounded-full bg-[var(--app-c-danger)]"
                        style={{ width: `${row.progress}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-[10px] text-[var(--app-c-danger)]">
                      {S.baibuProgress}
                      {row.progress}%
                    </span>
                  </span>
                  <span className="mt-1.5 flex items-end gap-2">
                    <span className="text-[16px] font-bold text-[var(--app-c-danger)]">
                      <span className="text-[10px]">¥</span>
                      {row.subsidyPrice}
                    </span>
                    <span className="pb-0.5 text-[11px] text-[var(--app-c-text-muted)] line-through">
                      ¥{row.dailyPrice}
                    </span>
                    <span className="pb-0.5 text-[11px] text-[var(--app-c-danger)]">
                      {S.baibuSaved}¥{row.savedYuan}
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
          {items.length === 0 && (
            <div className="py-16 text-center text-[13px] text-[var(--app-c-text-muted)]">{S.baibuEmpty}</div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 bg-[var(--app-surface)] pb-2 pt-1 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
        <span className="flex flex-1 flex-col items-center py-1 text-[11px] font-bold text-[var(--app-c-danger)]">
          {S.baibuTitle}
        </span>
        {(
          [
            S.baibuTab99,
            S.baibuTabOfficial,
            S.baibuTabBrand,
          ] as const
        ).map((label) => (
          <button
            key={label}
            {...action('promo.baibu.wontfix.toast', wontfix)}
            className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent py-1 text-[11px] text-[var(--app-text-muted)]"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
