import React, { useState } from 'react';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar } from '../components/ui';

const PLATFORM_PREFS = ['活动优惠', '互动娱乐', '淘宝团队', '服务提醒', '数评关注', '售后保障', '交易物流'];
const CHAT_PREFS = ['店铺客服消息', '淘宝好友消息'];

/** 消息设置(spec: message.settings,IMG_8717,P2 轻实现) */
export default function MessageSettingsPage() {
  const { bindTap } = useTaobaoGestures();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(
    Object.fromEntries([...PLATFORM_PREFS, ...CHAT_PREFS].map((p) => [p, true])),
  );

  const Row = ({ name }: { name: string }) => (
    <button
      {...bindTap({ kind: 'action', id: 'messageSettings.pref.toggle' }, {
        params: { pref: name },
        onTrigger: () => setPrefs((p) => ({ ...p, [name]: !p[name] })),
      })}
      className="w-full flex justify-between items-center py-3 bg-transparent border-none border-b border-[#F5F5F5] cursor-pointer"
    >
      <span className="text-[14px]">{name}</span>
      <span className="text-[12px] text-[#999999]">{prefs[name] ? '接收' : '已关闭'} ›</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title="消息设置" />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="bg-white rounded-xl mt-2 px-3 py-2.5">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-[14px] font-semibold">手机系统通知</div>
              <div className="text-[11px] text-[#999999] mt-0.5">当前有消息时不会收到桌面通知,您可能会错过物流、售后保障等重要通知,建议开启</div>
            </div>
            <span className="text-[12px] text-[#FF5000] shrink-0 ml-2">去开启 ›</span>
          </div>
        </div>
        <div className="bg-white rounded-xl mt-2 px-3 py-1">
          <div className="text-[12px] text-[#999999] py-2">平台消息</div>
          {PLATFORM_PREFS.map((p) => <Row key={p} name={p} />)}
        </div>
        <div className="bg-white rounded-xl mt-2 px-3 py-1 mb-3">
          <div className="text-[12px] text-[#999999] py-2">聊天消息</div>
          {CHAT_PREFS.map((p) => <Row key={p} name={p} />)}
        </div>
      </div>
    </div>
  );
}
