import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import type { TaobaoStringKey } from '../res/strings';
import { TopBar, EmptyState } from '../components/ui';
import { fmt } from '../utils/format';

const ASSET_TAB_KEYS: TaobaoStringKey[] = ['assetCoupon', 'assetRedPacket', 'assetCard', 'assetRecharge', 'assetShopBenefits'];
// id 与 SCOPE_TABS(与 bench_env 判题/数据 scope 字段绑定)保持中文,labelKey 仅用于展示
const SCOPE_TABS: Array<{ id: string; labelKey: TaobaoStringKey }> = [
  { id: '全部', labelKey: 'scopeAll' },
  { id: '购物', labelKey: 'scopeShopping' },
  { id: '闪购', labelKey: 'scopeFlash' },
  { id: '外卖', labelKey: 'scopeTakeout' },
  { id: '飞猪', labelKey: 'scopeFliggy' },
  { id: '历史记录', labelKey: 'scopeHistory' },
];

/** 我的权益(spec: mine.coupons,IMG_8731;券「使用」→ 搜索结果 qa:Q8) */
export default function CouponsPage() {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const coupons = useTaobaoStore((st) => st.coupons);
  const user = useTaobaoStore((st) => st.user);
  const [scope, setScope] = useState('全部');

  const shown = coupons.filter((c) => !c.used && (scope === '全部' || c.scope === scope));

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={s.myBenefitsTitle} />

      {/* 资产 Tab */}
      <div className="bg-app-surface shrink-0 flex px-2 h-11 items-center">
        {ASSET_TAB_KEYS.map((k, i) => (
          <span key={k} className={`flex-1 text-center text-[13px] ${i === 0 ? 'font-semibold' : 'text-app-text-muted'}`}>
            {s[k]}
            <span className="block text-[10px] text-app-text-muted">
              {i === 0 ? fmt(s.mineAssetCouponCountFmt, { count: coupons.filter((c) => !c.used).length }) : i === 1 ? `¥${user.redPacketAmount}` : i === 3 ? `¥0` : ''}
            </span>
          </span>
        ))}
      </div>

      {/* 分类筛选 */}
      <div className="flex gap-2 px-3 py-2 shrink-0 overflow-x-auto" data-scroll-container="coupon-tabs" data-scroll-direction="horizontal">
        {SCOPE_TABS.map(({ id, labelKey }) => (
          <button
            key={id}
            {...bindTap({ kind: 'action', id: 'coupons.filter.select.scope' }, {
              params: { scope: id },
              onTrigger: () => setScope(id),
            })}
            className={`shrink-0 text-[12px] rounded-full px-3 py-1 border-none cursor-pointer ${
              scope === id ? 'bg-[#FFF1E8] text-[#FF5000] font-semibold' : 'bg-app-surface text-app-text-muted'
            }`}
          >
            {s[labelKey]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="coupons-list" data-scroll-direction="vertical">
        {shown.length === 0 ? (
          <EmptyState text={s.noBenefitsInCategoryText} />
        ) : (
          shown.map((c) => (
            <div key={c.id} className="bg-gradient-to-r from-[#FF4D4F] to-[#FF2442] rounded-xl mb-2 px-4 py-3 flex items-center text-white">
              <div className="w-20 shrink-0">
                <span className="text-[12px]">¥</span>
                <span className="text-[26px] font-black">{c.amount}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold">{c.title}</div>
                <div className="text-[11px] opacity-85 mt-0.5">{c.thresholdText} · {fmt(s.limitedToScopeFmt, { scope: c.scope })}</div>
                <div className="text-[10px] opacity-70 mt-0.5">{c.validText}</div>
              </div>
              <button
                {...bindTap('coupons.use-open', { params: { q: c.scope === '购物' ? '618' : c.title } })}
                className="shrink-0 bg-app-surface text-[#FF2442] text-[13px] font-semibold rounded-full px-4 py-1.5 border-none cursor-pointer"
              >
                {s.useLabel}
              </button>
            </div>
          ))
        )}
        <div className="text-center text-[12px] text-app-text-muted py-3">{s.moreOffersBelowText}</div>
      </div>
    </div>
  );
}
