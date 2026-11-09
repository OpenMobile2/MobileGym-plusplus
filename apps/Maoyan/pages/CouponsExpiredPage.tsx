import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, TopBar, EmptyState, Price, MY, Chip } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 已失效优惠券(anchor_coupons_expired.jpg:已过期/已使用 tab,盖章) */
export default function CouponsExpiredPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const { value: tabRaw, setSearchParams } = usePanel('tab');
  const tab = tabRaw ?? 'expired';

  const coupons = useMaoyanStore((st) => st.coupons);
  const list = coupons.filter((c) => c.status === (tab === 'expired' ? 'expired' : 'used'));

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="light">
      <div className="shrink-0" style={{ background: MY.primary }}>
        <TopBar title="已失效优惠券" variant="red" />
      </div>
      <div className="shrink-0 flex gap-2 px-3 py-2 bg-app-surface">
        {[['expired', s.expired], ['used', s.used]].map(([t, label]) => (
          <Chip
            key={t}
            text={label}
            active={tab === t}
            binding={bindTap({ kind: 'action', id: 'couponsexp.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
            })}
          />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="couponsexp-list" data-scroll-direction="vertical">
        {list.length === 0 && <EmptyState text="这里空空如也" />}
        {list.map((c) => (
          <div key={c.id} className="bg-app-surface rounded-lg mt-2 p-3 flex items-start gap-3 relative opacity-90">
            <div className="text-center shrink-0 w-16 grayscale">
              <span className="text-(--app-c-text-3) font-semibold"><span className="text-[11px]">¥</span><span className="text-[22px]">{c.amount}</span></span>
              <div className="text-[10px] text-(--app-c-text-4) mt-0.5">{c.threshold}</div>
              <div className="text-[10px] text-(--app-c-text-4)">{c.kind}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-(--app-c-text-3) border border-(--app-c-border-strong) rounded px-0.5">{c.kind}</span>
                <span className="text-[14px] text-app-text-muted truncate">{c.title}</span>
              </div>
              <div className="text-[11px] text-(--app-c-text-4) mt-1.5">有效期至 {c.expiry}</div>
              <div className="text-[11px] text-(--app-c-text-4) mt-1">使用条件 ▾</div>
            </div>
            <div className="absolute right-4 bottom-3 rotate-[-12deg] text-[#C9B08A] border-2 border-[#C9B08A] rounded-full px-1.5 py-0.5 text-[11px] opacity-80">
              {tab === 'expired' ? '已过期' : '已使用'}
            </div>
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}
