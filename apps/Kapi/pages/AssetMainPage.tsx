import React from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card } from '../components/ui';
import { money } from '../components/format';
import { IcEye, IcEyeOff, IcPlus } from '../res/icons';

export default function AssetMainPage() {
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const accounts = useKapiStore((s) => s.accounts);
  const amountVisible = useKapiStore((s) => s.amountVisible);
  const toggleAmountVisible = useKapiStore((s) => s.toggleAmountVisible);
  const net = accounts.filter((a) => a.includeInTotal).reduce((acc, a) => acc + a.balance, 0);
  const show = (n: number) => (amountVisible ? money(n) : '****');

  return (
    <div className="flex flex-col h-full">
      <TopBar title="资产" backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <Card className="p-5 mt-1 bg-gradient-to-br from-[#4B6EF5] to-[#6B86F7]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-white/80">净资产</span>
            <button {...bindAction('asset.amount.toggle.visible', toggleAmountVisible)} className="bg-transparent border-none cursor-pointer">
              {amountVisible ? <IcEye size={15} className="text-white/80" /> : <IcEyeOff size={15} className="text-white/80" />}
            </button>
          </div>
          <div className="text-[30px] font-bold text-white mt-1">¥{show(net)}</div>
        </Card>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-[40px] mb-2">💳</div>
            <div className="text-[14px] text-[#8A92A6] mb-4">还没有账户,添加后可自动统计资产</div>
            <button {...bindTap('asset.addAccount.open')} className="px-6 py-2.5 rounded-full bg-[#4B6EF5] text-white text-[15px] border-none cursor-pointer flex items-center gap-1">
              <IcPlus size={18} /> 添加账户
            </button>
          </div>
        ) : (
          <>
            <Card className="mt-3">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center px-4 py-3 border-b border-[#EDEFF4] last:border-0">
                  <span className="flex-1 text-[15px] text-[#1A1D26]">{a.name}</span>
                  <span className="text-[15px] text-[#1A1D26]">¥{show(a.balance)}</span>
                </div>
              ))}
            </Card>
            <button {...bindTap('asset.addAccount.open')} className="w-full mt-3 py-3 rounded-xl bg-white text-[#4B6EF5] text-[15px] border-none cursor-pointer flex items-center justify-center gap-1">
              <IcPlus size={18} /> 添加账户
            </button>
          </>
        )}
      </div>
    </div>
  );
}
