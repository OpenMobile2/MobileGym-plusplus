import React from 'react';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card } from '../components/ui';
import { ACCOUNT_TYPE_GROUPS } from '../constants';
import {
  IcCard, IcCash, IcWallet, IcBus, IcFood, IcTrend, IcChart, IcLock, IcHandCoins, IcWechat, IcAlipay,
} from '../res/icons';

const ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  IcCard, IcCash, IcWallet, IcBus, IcFood, IcTrend, IcChart, IcLock, IcHandCoins, IcWechat, IcAlipay,
};

export default function AssetAddAccountPage() {
  const { bindBack, bindTap } = useKapiGestures();
  return (
    <div className="flex flex-col h-full">
      <TopBar title="添加账户" backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {ACCOUNT_TYPE_GROUPS.map((g) => (
          <div key={g.id} className="mt-3">
            <div className="text-[13px] text-[#8A92A6] px-1 mb-1">{g.label}</div>
            <Card>
              {g.items.map((it) => {
                const Icon = ICONS[it.icon] ?? IcWallet;
                return (
                  <button
                    key={it.id}
                    {...bindTap('addAccount.type.open', { params: { type: it.id } })}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b border-[#EDEFF4] last:border-0 bg-transparent cursor-pointer text-left"
                  >
                    <span className="w-9 h-9 rounded-full bg-[#F4F6FA] flex items-center justify-center">
                      <Icon size={18} className="text-[#4B6EF5]" />
                    </span>
                    <span className="text-[15px] text-[#1A1D26]">{it.label}</span>
                  </button>
                );
              })}
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
}
