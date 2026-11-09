import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, TopBar, EmptyState, Price, NOT_OPEN, MY } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcArrowDown, IcArrowUp } from '../res/icons';

/** 我的优惠券(anchor_coupons_empty.jpg;种子给2张可用) */
export default function CouponsPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [openCond, setOpenCond] = React.useState<string>('');

  const coupons = useMaoyanStore((st) => st.coupons);
  const valid = coupons.filter((c) => c.status === 'valid');

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="light">
      {toast}
      <div className="shrink-0" style={{ background: MY.primary }}>
        <TopBar title="我的优惠券" variant="red" />
      </div>
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="coupons-list" data-scroll-direction="vertical">
        {valid.length === 0 && <EmptyState text={s.emptyCoupons} />}
        {valid.map((c) => (
          <div key={c.id} className="bg-app-surface rounded-lg mt-2 p-3 flex items-start gap-3">
            <div className="text-center shrink-0 w-16">
              <Price value={c.amount} size="l" />
              <div className="text-[10px] text-(--app-c-text-3) mt-0.5">{c.threshold}</div>
              <div className="text-[10px] text-(--app-c-text-3)">{c.kind}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-(--app-c-brand-tint-text) border border-[#F2C7C4] rounded px-0.5">{c.kind}</span>
                <span className="text-[14px] text-app-text truncate">{c.title}</span>
              </div>
              <div className="text-[11px] text-(--app-c-text-3) mt-1.5">有效期至 {c.expiry}</div>
              <button
                {...bindTap({ kind: 'action', id: 'coupons.condition.toggle' }, {
                  params: { id: c.id },
                  onTrigger: () => setOpenCond(openCond === c.id ? '' : c.id),
                })}
                className="text-[11px] text-(--app-c-text-3) mt-1 bg-transparent border-none cursor-pointer flex items-center gap-0.5"
              >
                使用条件 {openCond === c.id ? <IcArrowUp size={11} /> : <IcArrowDown size={11} />}
              </button>
              {openCond === c.id && (
                <div className="text-[11px] text-(--app-c-text-4) mt-1">仅限购买电影票时使用,不可与其他优惠叠加,单笔订单限用一张。</div>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* 底部:添加优惠券 / 查看失效券 */}
      <div className="shrink-0 flex bg-app-surface border-t border-app-border">
        <button
          {...bindTap({ kind: 'action', id: 'coupons.add.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="flex-1 py-3 text-[14px] text-(--app-c-text-2) bg-transparent border-none cursor-pointer"
        >
          + {s.addCoupon}
        </button>
        <button
          {...bindTap('coupons.expired-open')}
          className="flex-1 py-3 text-[14px] text-(--app-c-text-2) bg-transparent border-none cursor-pointer border-l border-app-border"
        >
          {s.viewExpired}
        </button>
      </div>
    </div>
  );
}
