// 我的钱包(wallet.mine,IMG_0471):豆米卡(橙渐变)/零钱卡(蓝)/优惠券卡(红),标签左上+›右上,金额大字。
// 充值走系统支付;明细/优惠券仍为非本次能力范围的占位。豆米明细页(IMG_0469/0470:支出|收入 tabs)未建模。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, C } from '../components/ui';
import { payWithSystem } from '../capabilities';

/** 卡面波纹纹理:同心圆弧叠加(右下角发散),用作卡背景装饰层 */
const RIPPLE_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='150' viewBox='0 0 240 150'><g fill='none' stroke='white' stroke-opacity='0.14' stroke-width='1'><circle cx='210' cy='140' r='34'/><circle cx='210' cy='140' r='58'/><circle cx='210' cy='140' r='82'/><circle cx='210' cy='140' r='106'/><circle cx='210' cy='140' r='130'/></g></svg>\")";

export default function WalletMinePage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const doumi = useDoubanStore((s) => s.currentUser.doumi) ?? 0;
  const rechargeDoumi = useDoubanStore((s) => s.rechargeDoumi);
  const coupons = useDoubanStore((s) => s.coupons);
  const ownedCouponCount = coupons.filter((c) => c.owned).length;
  const wontfix = (id: 'wallet.doumi.recharge.wontfix' | 'wallet.doumi.detail.wontfix' | 'wallet.cash.detail.wontfix' | 'wallet.coupon.list.wontfix') =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast('该功能暂未开放') });
  const recharge = bindTap(
    { kind: 'action', id: 'wallet.doumi.recharge.wontfix' },
    {
      onTrigger: () => {
        const launched = payWithSystem(
          { amount: 100, orderId: 'doumi-recharge-100', subject: '豆米充值' },
          (result) => { if (result.resultCode === 'OK') { rechargeDoumi(100); toast('充值成功'); } },
        );
        if (!launched) toast('无法打开系统支付');
      },
    },
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="我的钱包" />
      <div
        className="flex-1 overflow-y-auto p-3 space-y-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 豆米卡(橙色渐变):标签+›首行,Φ余额大字,右侧白色充值圆角矩形 */}
        <div className="relative rounded-2xl px-5 pt-4 pb-5 overflow-hidden" style={{ background: 'linear-gradient(105deg,#FFA02E,#F5761A)', backgroundImage: `${RIPPLE_BG}, linear-gradient(105deg,#FFA02E,#F5761A)`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom' }}>
          <button {...wontfix('wallet.doumi.detail.wontfix')} className="relative w-full text-left bg-transparent border-none cursor-pointer p-0">
            <div className="flex items-center justify-between">
              <span className="text-base text-white">豆米</span>
              <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.85)' }}>›</span>
            </div>
            <div className="mt-2 text-4xl font-bold text-white leading-none">Φ{doumi.toFixed(2)}</div>
          </button>
          <button {...recharge} className="absolute bottom-4 right-5 px-6 h-10 rounded-lg text-base font-semibold border-none cursor-pointer bg-white" style={{ color: '#F5761A' }}>
            充值
          </button>
        </div>

        {/* 零钱卡(蓝色渐变):标签+›首行,¥余额大字 */}
        <button {...wontfix('wallet.cash.detail.wontfix')} className="w-full text-left rounded-2xl px-5 pt-4 pb-5 border-none cursor-pointer overflow-hidden" style={{ backgroundImage: `${RIPPLE_BG}, linear-gradient(105deg,#3E86F5,#2E6BDB)`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom' }}>
          <div className="flex items-center justify-between">
            <span className="text-base text-white">零钱</span>
            <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.85)' }}>›</span>
          </div>
          <div className="mt-2 text-4xl font-bold text-white leading-none">¥ 0.00</div>
        </button>

        {/* 优惠券卡(红色渐变):标签+›首行,数量/暂无,右下角说明 */}
        <button {...wontfix('wallet.coupon.list.wontfix')} className="w-full text-left rounded-2xl px-5 pt-4 pb-3 border-none cursor-pointer overflow-hidden" style={{ backgroundImage: `${RIPPLE_BG}, linear-gradient(105deg,#F95355,#EE3B3F)`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right bottom' }}>
          <div className="flex items-center justify-between">
            <span className="text-base text-white">优惠券</span>
            <span className="text-lg leading-none" style={{ color: 'rgba(255,255,255,0.85)' }}>›</span>
          </div>
          <div className="mt-2 text-base font-medium" style={{ color: 'rgba(255,255,255,0.78)' }}>
            {ownedCouponCount > 0 ? `${ownedCouponCount}张可用` : '暂无优惠券'}
          </div>
          <div className="mt-3 text-[11px] text-right" style={{ color: 'rgba(255,255,255,0.8)' }}>优惠券仅用于实体商品使用</div>
        </button>
      </div>
    </div>
  );
}
