import type { RuntimeOrder } from '../types';

/**
 * 走系统支付网关(标准 ACTION_PAY → 支付宝/微信系统收银台),支付成功回调 onOk。
 * 已删除自建「苏宁支付」密码页:桥接不可用(无处理方)时本地直接成功,不再回落密码页。
 */
export function launchGatewayPay(order: RuntimeOrder, onOk: () => void, amount = order.amount): void {
  const wechat = order.chosenPayMethod === '微信';
  let settled = false;
  let unregister: (() => void) | undefined;
  const settle = () => {
    if (settled) return;
    settled = true;
    unregister?.();
    onOk();
  };

  // 微信收银台成功后通过 `<source>.PAY_RESULT` 广播回传；finishActivity 本身返回 CANCELED。
  if (wechat) {
    unregister = window.__OS__?.broadcast?.registerReceiver?.('suning.PAY_RESULT', (intent) => {
      if (intent?.data?.resultCode === 'OK') settle();
    });
  }

  const launched = window.__OS__?.startActivityForResult?.(
    wechat ? 'wechat' : 'alipay',
    {
      action: 'ACTION_PAY',
      scheme: wechat ? 'weixin' : 'alipays',
      data: {
        amount,
        orderId: order.batchId ?? order.id,
        source: 'suning',
        merchantName: '苏宁易购',
        subject: '苏宁订单',
      },
    },
    (result) => {
      if (result?.resultCode === 'OK') settle();
      else if (wechat) unregister?.();
    },
  );
  if (!launched) settle();
}
