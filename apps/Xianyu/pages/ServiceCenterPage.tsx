import React from 'react';
import { TopBar } from '../components/TopBar';
import { useToast } from '../components/ui';
import { IcAlert, IcShield, IcTruck, IcUsers, IcArrowRight, IcService } from '../res/icons';

const QUICK = [
  { id: 'report', label: '快速举报', Icon: IcAlert },
  { id: 'aftersale', label: '售后维权', Icon: IcShield },
  { id: 'urge', label: '订单催促', Icon: IcTruck },
  { id: 'account', label: '账号管理', Icon: IcUsers },
] as const;

const HOT_QUESTIONS = [
  '如何申请退款/退货?',
  '卖家迟迟不发货怎么办?',
  '验货宝服务是如何保障的?',
  '收到的商品与描述不符怎么维权?',
  '如何修改或删除收货地址?',
  '账号被限制登录如何申诉?',
];

export default function ServiceCenterPage() {
  const [toast, showToast] = useToast();
  const wontfix = () => showToast('该功能暂未开放');

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="自助服务" />

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="ServiceCenterPage-main" data-scroll-direction="vertical">
        {/* 快捷入口网格 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111] mb-3">快捷服务</div>
          <div className="grid grid-cols-4 gap-2">
            {QUICK.map((q) => (
              <button
                key={q.id}
                onClick={wontfix}
                className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer py-1"
              >
                <span className="w-11 h-11 rounded-full bg-[#FFF7D6] flex items-center justify-center">
                  <q.Icon size={20} className="text-[#FF8A00]" />
                </span>
                <span className="text-[11px] text-[#666]">{q.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 热点问题 */}
        <div className="bg-white mx-3 mt-3 rounded-xl overflow-hidden">
          <div className="text-[14px] font-semibold text-[#111] px-3 pt-3 pb-1">热点问题</div>
          {HOT_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={wontfix}
              className="w-full flex items-center gap-2 px-3 h-12 bg-transparent border-none border-t border-[#F4F4F4] cursor-pointer"
            >
              <span className="flex-1 text-left text-[14px] text-[#333] truncate">{q}</span>
              <IcArrowRight size={16} className="text-[#CCC]" />
            </button>
          ))}
        </div>

        {/* 在线客服 */}
        <button
          onClick={wontfix}
          className="w-[calc(100%-24px)] mx-3 mt-4 h-11 rounded-full bg-[#FFE411] text-[#3A2E00] text-[15px] font-semibold border-none cursor-pointer flex items-center justify-center gap-1.5"
        >
          <IcService size={18} /> 在线客服
        </button>
      </div>
      {toast}
    </div>
  );
}
