import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { TopBar, wontfix } from '../components/ui';
import { IcChevronRight, IcInvoice, IcCard, IcTicket, IcRefresh } from '../res/icons';

// 多多钱包入口
export function WalletPage() {
  const { bindTap } = usePinduoduoGestures();

  const entries: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; desc: string }[] = [
    { icon: IcCard, label: '银行卡', desc: '未绑定' },
    { icon: IcTicket, label: '零钱明细', desc: '' },
    { icon: IcRefresh, label: '安全保障', desc: '账户安全险' },
  ];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="多多钱包" />

      {/* 余额卡 */}
      <div className="mx-3 mt-2 rounded-2xl bg-gradient-to-br from-[#FF5A3C] to-[#E22E1F] text-white px-4 py-5 shrink-0">
        <div className="text-[13px] opacity-90">账户余额(元)</div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="text-[20px]">¥</span>
          <span className="text-[34px] font-bold leading-none">0.27</span>
        </div>
        <div className="mt-3 flex gap-3">
          <button
            {...bindTap({ kind: 'action', id: 'wallet.security.wontfix' }, { onTrigger: wontfix })}
            className="flex-1 h-9 rounded-full bg-white/20 text-white text-[13px] font-medium"
          >
            充值
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'wallet.security.wontfix' }, { onTrigger: wontfix })}
            className="flex-1 h-9 rounded-full bg-white text-[#E22E1F] text-[13px] font-medium"
          >
            提现
          </button>
        </div>
      </div>

      {/* 交易记录入口 */}
      <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden shrink-0">
        <button {...bindTap('wallet.txns-open')} className="w-full flex items-center px-4 py-3.5 text-left">
          <IcInvoice size={20} className="text-[#E22E1F]" />
          <span className="ml-3 flex-1 text-[15px] text-[#333]">交易记录</span>
          <IcChevronRight size={18} className="text-[#CCC]" />
        </button>
      </div>

      {/* 其它入口(暂未开放) */}
      <div className="mx-3 mt-2 bg-white rounded-xl overflow-hidden">
        {entries.map((e) => {
          const Icon = e.icon;
          return (
            <button
              key={e.label}
              {...bindTap({ kind: 'action', id: 'wallet.security.wontfix' }, { onTrigger: wontfix })}
              className="w-full flex items-center px-4 py-3.5 text-left border-b border-[#F5F5F5] last:border-b-0"
            >
              <Icon size={20} className="text-[#E22E1F]" />
              <span className="ml-3 flex-1 text-[15px] text-[#333]">{e.label}</span>
              {e.desc && <span className="text-[12px] text-[#999] mr-1">{e.desc}</span>}
              <IcChevronRight size={18} className="text-[#CCC]" />
            </button>
          );
        })}
      </div>

      <div className="text-center text-[11px] text-[#BBB] mt-4">多多钱包由持牌机构提供支付服务</div>
    </div>
  );
}
