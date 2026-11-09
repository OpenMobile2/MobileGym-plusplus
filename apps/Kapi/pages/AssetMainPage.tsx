import React from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card } from '../components/ui';
import { money } from '../components/format';
import { IcEye, IcEyeOff, IcPlus } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function AssetMainPage() {
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const accounts = useKapiStore((st) => st.accounts);
  const amountVisible = useKapiStore((st) => st.amountVisible);
  const toggleAmountVisible = useKapiStore((st) => st.toggleAmountVisible);
  const net = accounts.filter((a) => a.includeInTotal).reduce((acc, a) => acc + a.balance, 0);
  const show = (n: number) => (amountVisible ? money(n) : '****');

  return (
    <div className="flex flex-col h-full">
      <TopBar title={s.assetTitle} backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6">
        <Card className="p-5 mt-1 bg-gradient-to-br from-[#4B6EF5] to-[#6B86F7]">
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-white/80">{s.netAssetLabel}</span>
            <button {...bindAction('asset.amount.toggle.visible', toggleAmountVisible)} className="bg-transparent border-none cursor-pointer">
              {amountVisible ? <IcEye size={15} className="text-white/80" /> : <IcEyeOff size={15} className="text-white/80" />}
            </button>
          </div>
          <div className="text-[30px] font-bold text-white mt-1">¥{show(net)}</div>
        </Card>

        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-[40px] mb-2">💳</div>
            <div className="text-[14px] text-app-text-muted mb-4">{s.noAccountsHint}</div>
            <button {...bindTap('asset.addAccount.open')} className="px-6 py-2.5 rounded-full bg-[#4B6EF5] text-white text-[15px] border-none cursor-pointer flex items-center gap-1">
              <IcPlus size={18} /> {s.addAccountBtn}
            </button>
          </div>
        ) : (
          <>
            <Card className="mt-3">
              {accounts.map((a) => (
                <div key={a.id} className="flex items-center px-4 py-3 border-b border-app-border last:border-0">
                  <span className="flex-1 text-[15px] text-app-text">{a.name}</span>
                  <span className="text-[15px] text-app-text">¥{show(a.balance)}</span>
                </div>
              ))}
            </Card>
            <button {...bindTap('asset.addAccount.open')} className="w-full mt-3 py-3 rounded-xl bg-app-surface text-[#4B6EF5] text-[15px] border-none cursor-pointer flex items-center justify-center gap-1">
              <IcPlus size={18} /> {s.addAccountBtn}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
