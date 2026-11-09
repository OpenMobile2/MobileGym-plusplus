import React from 'react';
import { useXiaorichangStore, selectAvailableGlow } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcHelp, IcPlus } from '../res/icons';
import { PageHeader } from '../components/common';

/** 光芒与心愿(s219)。⚠ 三字段模型:可用 = 累计 − 已兑换。 */
export default function GlowPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const available = selectAvailableGlow(st);

  return (
    <div className="flex h-full flex-col" style={{ background: colors.brandWash }} data-status-bar-foreground="dark">
      <PageHeader title={s.glowTitle}
        right={<button {...action('glow.help.tip', () => st.showToast('完成打卡得光芒,标记失败扣光芒;光芒可用来兑换心愿'))}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcHelp size={17} /></button>} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-3xl bg-white/70 p-4">
          <div className="text-sm font-semibold text-[#424242]">✨ {s.glowPoints}</div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { v: available, label: s.glowAvailable },
              { v: st.glow.cumulative, label: s.glowCumulative },
              { v: st.glow.redeemed, label: s.glowRedeemed },
            ].map((b) => (
              <div key={b.label} className="rounded-2xl bg-white py-4 text-center">
                <div className="text-2xl font-bold text-[#212121]">{b.v}</div>
                <div className="mt-1 text-xs" style={{ color: colors.vip }}>{b.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 rounded-3xl bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-[#424242]">📋 {s.wishlist}</div>
            <button {...bindTap('glow.wish.create')}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-[13px] font-semibold"
              style={{ background: colors.brandSoft, color: '#8A6A1E' }}>
              <IcPlus size={14} /> {s.wishAdd}
            </button>
          </div>

          {st.wishes.length === 0 ? (
            <div className="rounded-2xl bg-white py-10 text-center">
              <div className="text-3xl text-[#D5D8DC]">♡</div>
              <div className="mt-2 text-sm text-[#9AA5B1]">{s.wishEmpty}</div>
              <div className="mt-1 text-xs text-[#C9CDD3]">{s.wishEmptyHint}</div>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {st.wishes.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
                  <div>
                    <div className="text-sm text-[#424242]" style={w.redeemedAt ? { textDecoration: 'line-through', color: '#B9BEC7' } : undefined}>{w.name}</div>
                    <div className="text-xs" style={{ color: colors.vip }}>☀ {w.cost}</div>
                  </div>
                  {w.redeemedAt ? (
                    <span className="text-xs text-[#C9CDD3]">{s.glowRedeemed}</span>
                  ) : (
                    <button
                      {...action('glow.wish.redeem', () => st.redeemWish(w.id), { params: { wishId: w.id } })}
                      className="rounded-full px-4 py-1.5 text-[13px] font-semibold"
                      style={available >= w.cost ? { background: colors.brand, color: '#5B4718' } : { background: '#F2F3F5', color: '#B9BEC7' }}>
                      {s.wishRedeem}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
