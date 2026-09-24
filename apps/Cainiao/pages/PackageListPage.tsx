import React, { useEffect } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useLocation } from 'react-router-dom';
import Img from '../components/Img';
import Sheet from '../components/Sheet';
import { IcBack, IcSearch, IcChevronRight } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { FILTER_GROUPS } from '../constants';
import { fmtMdHm } from '../utils/appTime';
import { useI18n } from '../i18n';
import type { PackageFilter, PackageItem } from '../types';

function matchFilter(p: PackageItem, f: PackageFilter): boolean {
  if (f.packageType.length && !f.packageType.includes(p.kind)) return false;
  if (f.owner.length && !f.owner.includes(p.owner)) return false;
  if (f.logistics.length && !f.logistics.includes(p.status)) return false;
  if (f.trade.length && !(p.tradeStatus && f.trade.includes(p.tradeStatus))) return false;
  if (f.company.length && !f.company.some((c) => p.company.includes(c))) return false;
  return true;
}

/** 全部包裹列表(spec package.list)+ 筛选弹层(package.filter.sheet) */
export default function PackageListPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action, bindBack, back } = useCainiaoGestures();
  const { t } = useI18n();
  const { search } = useLocation();
  const showFilter = new URLSearchParams(search).get('sheet') === 'filter';

  const packages = useCainiaoStore((s) => s.packages);
  const query = useCainiaoStore((s) => s._temp.packageSearch);
  const filter = useCainiaoStore((s) => s._temp.filter);
  const filterApplied = useCainiaoStore((s) => s._temp.filterApplied);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const showToast = useCainiaoStore((s) => s.showToast);

  // 搜索词不跨入口串页；筛选条件保留，确保进入详情后返回仍维持原筛选。
  useEffect(() => {
    setTemp({ packageSearch: '' });
  }, [setTemp]);

  let list = packages;
  if (query.trim()) list = list.filter((p) => p.title.includes(query.trim()));
  if (filterApplied) list = list.filter((p) => matchFilter(p, filter));
  list = [...list].sort((a, b) => b.statusTs - a.statusTs);

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      {/* 搜索顶栏 */}
      <div className="flex items-center gap-2 bg-(--app-c-card-bg) px-2 pb-2 pt-12">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-(--app-c-text-primary)">
          <IcBack size={24} />
        </button>
        <div className="flex h-10 flex-1 items-center rounded-full bg-(--app-c-chip-bg) px-3">
          <IcSearch size={17} className="shrink-0 text-(--app-c-text-muted)" />
          <input
            data-action="package.list.search"
            data-action-type="input"
            value={query}
            onChange={(e) => setTemp({ packageSearch: e.target.value })}
            placeholder="搜索包裹名称或备注"
            className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[14px] outline-none placeholder:text-(--app-c-text-muted)"
          />
        </div>
      </div>
      {/* 筛选条 */}
      <div
        {...bindTap('package.filter.open')}
        className="flex cursor-pointer items-center border-b border-(--app-c-border) bg-(--app-c-card-bg) px-4 py-2.5"
      >
        <span className="text-[15px] font-semibold text-(--app-c-text-primary)">▽ 筛选</span>
        <span className="ml-6 text-[13px] text-(--app-c-text-muted)">筛选物流状态、签收时间、快递公司等</span>
        <IcChevronRight size={15} className="ml-auto text-(--app-c-text-muted)" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 && <div className="py-10 text-center text-[13px] text-(--app-c-text-muted)">{t('common.empty')}</div>}
        {list.map((p) => (
          <div key={p.id} className="mt-2.5 rounded-xl bg-(--app-c-card-bg) p-3">
            <div {...bindTap('package.list.item.open', { params: { packageId: p.id } })} className="flex cursor-pointer gap-2.5">
              <Img src={p.image} className="h-16 w-16 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center">
                  <span className="text-[16px] font-bold text-(--app-c-text-primary)">{p.status}</span>
                  {p.status === '已签收' && (
                    <span className="ml-2 text-[13px] text-(--app-c-brand)">{fmtMdHm(p.statusTs)}签收</span>
                  )}
                  <button
                    {...action('package.list.more.wontfixToast', () => showToast(t('common.notOpen')))}
                    className="ml-auto cursor-pointer border-none bg-transparent px-1 text-[16px] leading-4 text-(--app-c-text-muted)"
                  >
                    ⋮
                  </button>
                </div>
                <div className="mt-1 truncate text-[14px] text-(--app-c-text-primary)">{p.source} | {p.title}</div>
                <div className="mt-0.5 text-[13px] text-(--app-c-text-muted)">
                  {p.official && <span className="mr-1 rounded bg-(--app-c-brand-soft) px-1 text-[11px] text-(--app-c-brand)">官方</span>}
                  {p.company}
                  {p.status === '已签收' ? `: ${fmtMdHm(p.statusTs)}签收` : ''}
                </div>
                {p.staleHint && (
                  <div className="mt-1.5 rounded bg-(--app-c-chip-bg) px-2 py-1 text-[12px] text-(--app-c-text-muted)">
                    🔔 很久没更新了,不再关注可左滑删除
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showFilter && <FilterSheet onApply={() => back()} />}
    </div>
  );
}

const GROUP_LABELS: Array<{ key: keyof PackageFilter; label: string; options: readonly string[] }> = [
  { key: 'packageType', label: '包裹类型', options: FILTER_GROUPS.packageType },
  { key: 'owner', label: '包裹所属', options: FILTER_GROUPS.owner },
  { key: 'logistics', label: '物流状态', options: FILTER_GROUPS.logistics },
  { key: 'trade', label: '交易状态', options: FILTER_GROUPS.trade },
  { key: 'company', label: '快递公司', options: FILTER_GROUPS.company },
];

function FilterSheet({ onApply }: { onApply: () => void }) {
  const { action } = useCainiaoGestures();
  const filter = useCainiaoStore((s) => s._temp.filter);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const showToast = useCainiaoStore((s) => s.showToast);

  const toggle = (key: keyof PackageFilter, v: string) => {
    const cur = filter[key];
    const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    setTemp({ filter: { ...filter, [key]: next } });
  };

  return (
    <Sheet title="筛选">
      {GROUP_LABELS.map(({ key, label, options }) => (
        <div key={key} className="mb-3">
          <div className="mb-2 text-[15px] font-bold text-(--app-c-text-primary)">{label}</div>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => {
              const on = filter[key].includes(o);
              return (
                <button
                  key={o}
                  {...action('package.filter.select.chip', () => toggle(key, o), { params: { value: o } })}
                  className={`cursor-pointer rounded-lg border px-4 py-1.5 text-[13px] ${
                    on ? 'border-(--app-c-brand) bg-[#E5F1FF] text-(--app-c-brand)' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-primary)'
                  }`}
                >
                  {o}
                </button>
              );
            })}
            {key === 'company' && (
              <button
                {...action('package.filter.morecompany.wontfixToast', () => showToast('该功能暂未开放'))}
                className="cursor-pointer rounded-lg border border-(--app-c-border) bg-(--app-c-card-bg) px-4 py-1.5 text-[13px] text-(--app-c-text-primary)"
              >
                更多 ›
              </button>
            )}
          </div>
        </div>
      ))}
      <div className="mt-4 flex gap-3">
        <button
          {...action('package.filter.reset', () => setTemp({ filter: { packageType: [], owner: [], logistics: [], trade: [], company: [] }, filterApplied: false }))}
          className="h-11 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)"
        >
          重置
        </button>
        <button
          {...action('package.filter.apply', () => { setTemp({ filterApplied: true }); onApply(); })}
          className="h-11 flex-1 cursor-pointer rounded-full border-none bg-(--app-c-brand) text-[15px] font-semibold text-white"
        >
          确认
        </button>
      </div>
    </Sheet>
  );
}
