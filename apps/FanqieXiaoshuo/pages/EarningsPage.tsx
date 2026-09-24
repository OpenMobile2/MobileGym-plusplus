import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, fmtTime } from '../components/ui';
import { IcBack } from '../res/icons';

export default function EarningsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindBack } = useFanqieGestures();
  const s = useFanqieStrings();

  const coins = useFanqieStore((st) => st.coins);
  const coinRecords = useFanqieStore((st) => st.coinRecords);
  const tab = searchParams.get('tab') || 'coin';

  const TABS = [
    { v: 'coin', label: s.coinRecords },
    { v: 'cash', label: s.cashRecords },
  ] as const;

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      {/* 红橙渐变头 */}
      <div className="shrink-0 bg-gradient-to-b from-[#FF7A45] to-[#FF9B5C] pb-4">
        <div className="flex items-center h-11 px-1">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
            <IcBack size={22} className="text-white" />
          </button>
          <div className="flex-1 text-center text-[16px] font-semibold text-white mr-10">{s.earnings}</div>
        </div>
        <div className="flex items-center px-6 mt-2">
          <div className="flex-1">
            <div className="text-[26px] font-bold text-white leading-none">{coins}</div>
            <div className="text-[12px] text-white/80 mt-1.5">金币收益(币)</div>
          </div>
          <div className="flex-1">
            <div className="text-[26px] font-bold text-white leading-none">0.00</div>
            <div className="text-[12px] text-white/80 mt-1.5">现金收益(元)</div>
          </div>
        </div>
      </div>

      {/* tab */}
      <div className="flex items-center gap-6 px-4 h-10 bg-(--app-c-bg-card) shrink-0 border-b border-(--app-c-divider)">
        {TABS.map((t) => {
          const on = tab === t.v;
          return (
            <button
              key={t.v}
              {...bindTap({ kind: 'action', id: 'earnings.tab.select.target' }, {
                params: { target: t.v },
                onTrigger: () => setSearchParams((p) => { p.set('tab', t.v); return p; }, { replace: true }),
              })}
              className={`bg-transparent border-none cursor-pointer p-0 relative h-10 ${on ? 'text-[14px] font-semibold text-(--app-c-text-primary)' : 'text-[14px] text-(--app-c-text-secondary)'}`}
            >
              {t.label}
              {on && <span className="absolute -bottom-px left-1/2 -translate-x-1/2 w-5 h-0.5 bg-(--app-c-brand) rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* 记录列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="earnings-list" data-scroll-direction="vertical">
        {tab === 'coin' ? (
          coinRecords.length === 0 ? (
            <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-20">暂无收益记录</div>
          ) : (
            coinRecords.map((r, i) => (
              <div key={i} className="flex items-center px-4 py-3.5 bg-(--app-c-bg-card) border-b border-(--app-c-divider)">
                <div className="flex-1">
                  <div className="text-[14px] text-(--app-c-text-primary)">{r.title}</div>
                  <div className="text-[11px] text-(--app-c-text-tertiary) mt-0.5">{fmtTime(r.timestamp)}</div>
                </div>
                <span className="text-[15px] font-semibold text-(--app-c-brand)">+{r.delta}</span>
              </div>
            ))
          )
        ) : (
          <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-20">暂无现金记录</div>
        )}
        <div className="text-center text-[11px] text-(--app-c-text-disabled) py-4">仅展示近三十天内的收益记录</div>
      </div>
    </div>
  );
}
