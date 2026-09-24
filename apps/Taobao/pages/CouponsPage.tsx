import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, EmptyState } from '../components/ui';

const ASSET_TABS = ['券', '红包', '卡', '充值金', '店铺权益'];
const SCOPE_TABS = ['全部', '购物', '闪购', '外卖', '飞猪', '历史记录'];

/** 我的权益(spec: mine.coupons,IMG_8731;券「使用」→ 搜索结果 qa:Q8) */
export default function CouponsPage() {
  const { bindTap } = useTaobaoGestures();
  const coupons = useTaobaoStore((s) => s.coupons);
  const user = useTaobaoStore((s) => s.user);
  const [scope, setScope] = useState('全部');

  const shown = coupons.filter((c) => !c.used && (scope === '全部' || c.scope === scope));

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title="我的权益" />

      {/* 资产 Tab */}
      <div className="bg-white shrink-0 flex px-2 h-11 items-center">
        {ASSET_TABS.map((t, i) => (
          <span key={t} className={`flex-1 text-center text-[13px] ${i === 0 ? 'font-semibold' : 'text-[#666666]'}`}>
            {t}
            <span className="block text-[10px] text-[#999999]">
              {i === 0 ? `${coupons.filter((c) => !c.used).length}张` : i === 1 ? `¥${user.redPacketAmount}` : i === 3 ? `¥0` : ''}
            </span>
          </span>
        ))}
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 px-3 py-2 shrink-0 overflow-x-auto" data-scroll-container="coupon-tabs" data-scroll-direction="horizontal">
        {SCOPE_TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'coupons.filter.select.scope' }, {
              params: { scope: t },
              onTrigger: () => setScope(t),
            })}
            className={`shrink-0 text-[12px] rounded-full px-3 py-1 border-none cursor-pointer ${
              scope === t ? 'bg-[#FFF1E8] text-[#FF5000] font-semibold' : 'bg-white text-[#666666]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="coupons-list" data-scroll-direction="vertical">
        {shown.length === 0 ? (
          <EmptyState text="该分类下暂无可用权益" />
        ) : (
          shown.map((c) => (
            <div key={c.id} className="bg-gradient-to-r from-[#FF4D4F] to-[#FF2442] rounded-xl mb-2 px-4 py-3 flex items-center text-white">
              <div className="w-20 shrink-0">
                <span className="text-[12px]">¥</span>
                <span className="text-[26px] font-black">{c.amount}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">{c.title}</div>
                <div className="text-[11px] opacity-85 mt-0.5">{c.thresholdText} · 限{c.scope}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{c.validText}</div>
              </div>
              <button
                {...bindTap('coupons.use-open', { params: { q: c.scope === '购物' ? '618' : c.title } })}
                className="shrink-0 bg-white text-[#FF2442] text-[13px] font-semibold rounded-full px-4 py-1.5 border-none cursor-pointer"
              >
                使用
              </button>
            </div>
          ))
        )}
        <div className="text-center text-[12px] text-[#999999] py-3">—— 以下是更多可领优惠 ——</div>
      </div>
    </div>
  );
}
