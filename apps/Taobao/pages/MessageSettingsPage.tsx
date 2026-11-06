import React, { useState } from 'react';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar } from '../components/ui';
import type { TaobaoStringKey } from '../res/strings';

const PLATFORM_PREF_KEYS: TaobaoStringKey[] = [
  'activityDiscountLabel', 'prefInteractive', 'prefTaobaoTeam', 'prefServiceReminder',
  'prefReviewFollow', 'prefAfterSales', 'prefTradeLogistics',
];
const CHAT_PREF_KEYS: TaobaoStringKey[] = ['prefShopService', 'prefFriendMsg'];

/** 消息设置(spec: message.settings,IMG_8717,P2 轻实现) */
export default function MessageSettingsPage() {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries([...PLATFORM_PREF_KEYS, ...CHAT_PREF_KEYS].map((p) => [p, true])),
  );

  const Row = ({ nameKey }: { nameKey: TaobaoStringKey }) => (
    <button
      {...bindTap({ kind: 'action', id: 'messageSettings.pref.toggle' }, {
        params: { pref: s[nameKey] },
        onTrigger: () => setPrefs((p) => ({ ...p, [nameKey]: !p[nameKey] })),
      })}
      className="w-full flex justify-between items-center py-3 bg-transparent border-none border-b border-[#F5F5F5] cursor-pointer"
    >
      <span className="text-[14px]">{s[nameKey]}</span>
      <span className="text-[12px] text-app-text-muted">{prefs[nameKey] ? s.receiveLabel : s.disabledLabel} ›</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={s.messageSettingsLabel} />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-2.5">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[14px] font-semibold">{s.systemNotificationTitle}</div>
              <div className="text-[11px] text-app-text-muted mt-0.5">{s.systemNotificationDesc}</div>
            </div>
            <span className="text-[12px] text-[#FF5000] shrink-0 ml-2">{s.goEnableLabel}</span>
          </div>
        </div>
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-1">
          <div className="text-[12px] text-app-text-muted py-2">{s.platformMessagesLabel}</div>
          {PLATFORM_PREF_KEYS.map((p) => <Row key={p} nameKey={p} />)}
        </div>
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-1 mb-3">
          <div className="text-[12px] text-app-text-muted py-2">{s.chatMessagesLabel}</div>
          {CHAT_PREF_KEYS.map((p) => <Row key={p} nameKey={p} />)}
        </div>
      </div>
    </div>
  );
}
