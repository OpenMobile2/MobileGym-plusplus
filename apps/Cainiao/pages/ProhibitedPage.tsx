import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import TopBar from '../components/TopBar';
import { IcSearch } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { PROHIBITED_HOT } from '../constants';
import { useI18n } from '../i18n';

/** 禁寄品查询(spec ship.prohibited,a181) */
export default function ProhibitedPage() {
  const { isDark } = useDarkMode();
  const { action } = useCainiaoGestures();
  const { t } = useI18n();
  const query = useCainiaoStore((s) => s._temp.prohibitedQuery);
  const result = useCainiaoStore((s) => s._temp.prohibitedResult);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const queryProhibited = useCainiaoStore((s) => s.queryProhibited);
  const showToast = useCainiaoStore((s) => s.showToast);

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <div className="bg-(--app-c-card-bg) pb-4">
        <TopBar title="禁寄品查询" />
        <div className="mx-4 flex h-10 items-center rounded-full bg-(--app-c-chip-bg) px-3">
          <IcSearch size={17} className="shrink-0 text-(--app-c-text-muted)" />
          <input
            data-action="ship.prohibited.input"
            data-action-type="input"
            value={query}
            onChange={(e) => setTemp({ prohibitedQuery: e.target.value, prohibitedResult: null })}
            placeholder="请输入物品名称"
            className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[14px] outline-none placeholder:text-(--app-c-text-muted)"
          />
        </div>
        <div className="mx-4 mt-4 text-[16px] font-bold text-(--app-c-text-primary)">热门查询</div>
        <div className="mx-4 mt-2 grid grid-cols-4 gap-2">
          {PROHIBITED_HOT.map((h) => (
            <button
              key={h}
              {...action('ship.prohibited.select.hot', () => setTemp({ prohibitedQuery: h, prohibitedResult: null }), { params: { value: h } })}
              className={`cursor-pointer rounded-lg border py-2 text-[14px] ${query === h ? 'border-(--app-c-brand) bg-[#E5F1FF] text-(--app-c-brand)' : 'border-(--app-c-border) bg-(--app-c-card-bg) text-(--app-c-text-primary)'}`}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="mt-5 text-center">
          <button
            {...action('ship.prohibited.query', () => {
              if (!query.trim()) { showToast('请输入物品名称'); return; }
              queryProhibited(query);
            })}
            className={`h-11 w-40 rounded-full border-none text-[16px] font-semibold text-white ${query.trim() ? 'cursor-pointer bg-(--app-c-brand)' : 'bg-[#9BC0F5]'}`}
          >
            查询
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        {result && (
          <div className="mt-4 rounded-2xl bg-(--app-c-card-bg) p-4">
            <div className="flex items-center">
              <span className="text-[17px] font-bold text-(--app-c-text-primary)">{result.name}</span>
              <span
                className={`ml-auto rounded px-2 py-0.5 text-[13px] font-semibold ${
                  result.verdict === '禁止寄递' ? 'bg-[#FFECEC] text-[#F5222D]' : result.verdict === '限制寄递' ? 'bg-[#FFF7EC] text-[#D48806]' : 'bg-(--app-c-chip-bg) text-[#00B578]'
                }`}
              >
                {result.verdict}
              </span>
            </div>
            <div className="mt-2 text-[13px] leading-5 text-(--app-c-text-secondary)">{result.note}</div>
          </div>
        )}
      </div>

      <div className="shrink-0 pb-4 text-center">
        <button
          {...action('ship.prohibited.notice.wontfixToast', () => showToast(t('common.notOpen')))}
          className="cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-secondary) underline"
        >
          禁寄物品告知
        </button>
      </div>
    </div>
  );
}
