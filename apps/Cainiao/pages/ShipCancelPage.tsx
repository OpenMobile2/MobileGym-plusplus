import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { CANCEL_REASONS } from '../constants';

/** 取消订单(spec ship.cancel):三组单选原因;「信息填错了」内联修改引导(装饰) */
export default function ShipCancelPage() {
  const { isDark } = useDarkMode();
  const { action, bindBack, back } = useCainiaoGestures();
  const [sp] = useSearchParams();
  const orderId = sp.get('orderId') ?? '';

  const reason = useCainiaoStore((s) => s._temp.cancelReason);
  const setTemp = useCainiaoStore((s) => s.setTemp);
  const cancelOrder = useCainiaoStore((s) => s.cancelOrder);
  void bindBack;

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="取消订单" />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 text-[14px] text-(--app-c-text-secondary)">请告知我们取消原因, 我们将做得更好</div>
        {Object.entries(CANCEL_REASONS).map(([group, reasons]) => (
          <div key={group} className="mt-3 rounded-2xl bg-(--app-c-card-bg) px-3 py-1">
            <div className="border-b border-(--app-c-divider) py-2.5 text-[14px] font-bold text-(--app-c-text-primary)">{group}</div>
            {reasons.map((r) => {
              const on = reason === r;
              return (
                <React.Fragment key={r}>
                  <button
                    {...action('ship.cancel.select.reason', () => setTemp({ cancelReason: r }), { params: { value: r } })}
                    className="flex w-full cursor-pointer items-center border-b border-(--app-c-divider) bg-transparent py-3 text-left last:border-b-0"
                  >
                    <span className="min-w-0 flex-1 text-[14px] text-(--app-c-text-primary)">{r}</span>
                    <span className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${on ? 'border-(--app-c-brand) bg-(--app-c-brand) text-white' : 'border-[#CCC] bg-(--app-c-card-bg) text-transparent'}`}>
                      ✓
                    </span>
                  </button>
                  {on && r.startsWith('信息填错了') && (
                    <div className="mb-2 flex items-center rounded-lg bg-(--app-c-brand-soft) px-3 py-2 text-[13px] text-(--app-c-text-primary)">
                      您可以直接修改订单信息
                      {/* 内联「修改订单」:纯装饰,点击无反应(scope.decorOnly,用户阶段④拍板) */}
                      <span className="ml-auto rounded-full border border-(--app-c-brand) px-3 py-1 text-[12px] text-(--app-c-brand)">
                        修改订单
                      </span>
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        ))}
      </div>
      {/* 底部按钮 */}
      <div className="flex shrink-0 gap-3 bg-(--app-c-card-bg) px-4 pb-4 pt-2.5">
        <button
          {...bindBack()}
          className="h-11 flex-1 cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) text-[15px] text-(--app-c-text-primary)"
        >
          暂不取消
        </button>
        <button
          {...action('ship.cancel.confirm', () => {
            if (!reason) return;
            cancelOrder(orderId, reason);
            back();
          })}
          className={`h-11 flex-1 rounded-full border-none text-[15px] font-semibold text-white ${reason ? 'cursor-pointer bg-(--app-c-brand)' : 'bg-[#B9CDF3]'}`}
        >
          确认取消
        </button>
      </div>
    </div>
  );
}
