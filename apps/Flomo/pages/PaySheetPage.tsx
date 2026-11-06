import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { Sheet } from '../components/Sheet';
import { C } from '../components/ui';
import { IcLauncher } from '../res/icons';
import { payWithSystem } from '../capabilities';

/**
 * iOS App Store 购买确认弹层。
 * 渲染为底部 Sheet 卡片,标题「App Store」,展示商品名 + 价格 + 购买按钮。
 * 取消/关闭(点暗背景)→ bindBack() 回到 pro.intro。
 */
export default function PaySheetPage() {
  const { bindTap, go } = useFlomoGestures();
  const toast = useFlomoStore((s) => s.toast);
  const payPlan = useFlomoStore((s) => s.payPlan);
  const paySuccess = useFlomoStore((s) => s.paySuccess);
  const isYearly = payPlan === 'yearly';
  const amount = isYearly ? 99 : 15;

  const startPayment = () => {
    const launched = payWithSystem(
      {
        amount,
        orderId: `flomo-pro-${payPlan}`,
        subject: `flomo PRO 会员(${isYearly ? '年度' : '月度'})`,
        method: '支付宝支付',
      },
      (result) => {
        if (result.resultCode === 'OK') {
          paySuccess();
          toast('支付成功，会员已续期');
          go('pay.sheet.close');
        } else {
          toast('已取消支付');
        }
      },
    );
    if (!launched) toast('未找到可用的支付应用');
  };

  return (
    <Sheet title="App Store">
      <div className="px-5 pt-1 pb-2">
        {/* 商品行:图标 / 商品名+账户 / 价格 */}
        <div className="flex items-center gap-3 pb-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: C.green, color: '#fff' }}
          >
            <IcLauncher size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate" style={{ color: C.text, fontSize: 15 }}>
              flomo PRO 会员({isYearly ? '年度' : '月度'})
            </div>
            <div className="truncate" style={{ color: C.sub, fontSize: 12 }}>
              Apple 账户 · 自动续期订阅
            </div>
          </div>
          <div className="font-semibold shrink-0" style={{ color: C.text, fontSize: 15 }}>
            {isYearly ? '¥99.00' : '¥15.00'}
          </div>
        </div>

        {/* 购买按钮 */}
        <button
          {...bindTap(
            { kind: 'action', id: 'pay.sheet.pay.mock' },
            {
              onTrigger: startPayment,
            },
          )}
          className="w-full h-11 rounded-full border-none cursor-pointer font-semibold"
          style={{ background: C.green, color: '#fff', fontSize: 15 }}
        >
          购买
        </button>

        {/* 取消:回到 pro.intro */}
        <button
          {...bindTap('pay.sheet.close')}
          className="w-full h-11 mt-1 bg-transparent border-none cursor-pointer"
          style={{ color: C.linkBlue, fontSize: 15 }}
        >
          取消
        </button>

        <div className="text-center mt-1" style={{ color: C.sub, fontSize: 11 }}>
          需要使用 Face ID 或 Apple 账户密码进行确认
        </div>
      </div>
    </Sheet>
  );
}
