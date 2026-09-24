import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

/** 支付方式(免密设置)—— 证据 n28(渠道列表,已开通橙字/去开通灰字)。 */

const CHANNEL_COLORS: Record<string, string> = {
  wechat: '#07C160',
  applepay: '#111111',
  didipay: '#FF7D41',
  intlcard: '#F59E0B',
  ecny: '#E02020',
  unionpay: '#D6001C',
  cmb: '#C7000B',
  alipay: '#1677FF',
};

export default function PayMethodsPage() {
  const { bindTap } = useDidiGestures();
  const payChannels = useDidiStore((s) => s.payChannels);
  const togglePayChannel = useDidiStore((s) => s.togglePayChannel);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="支付方式" />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex items-center px-4 pt-4 pb-1">
          <span className="flex-1 text-[16px] font-bold text-app-text">免密设置</span>
          <span className="text-[12px] text-app-text-muted">ⓘ 先扣款后享受</span>
        </div>
        <div className="bg-app-surface mt-2">
          {payChannels.map((ch, i) => (
            <button
              key={ch.id}
              {...bindTap(
                { kind: 'action', id: 'pay.methods.toggle' },
                { onTrigger: () => togglePayChannel(ch.id), params: { id: ch.id } },
              )}
              className={`flex items-center w-full px-4 py-4 bg-transparent border-none text-left ${
                i === payChannels.length - 1 ? '' : 'border-b border-app-border'
              }`}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[13px] shrink-0 mr-3"
                style={{ background: CHANNEL_COLORS[ch.id] ?? '#8A8F99' }}
              >
                {ch.name.slice(0, 1)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] text-app-text truncate">{ch.name}</span>
                {ch.id === 'wechat' && ch.on && (
                  <span className="block text-[11px] text-app-text-muted mt-0.5">
                    已开通·免密支付中
                  </span>
                )}
              </span>
              {ch.on ? (
                <span className="text-[13px] shrink-0" style={{ color: C.orangeDeep }}>
                  已开通 去关闭
                </span>
              ) : (
                <span className="text-[13px] text-app-text-muted shrink-0">去开通 ›</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
