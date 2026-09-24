import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, useToast } from '../components/ui';
import { IcSettings, IconRenderer } from '../res/icons';
import { WONTFIX_TOAST } from '../constants';

/** 我的 Tab(spec mine.main)。会员卡/订单宫格/功能宫格,入口全可点(Q15,完整还原)。 */
const ORDER_GRID = [
  { id: 'unpaid', label: '待付款', icon: 'IcTicket' },
  { id: 'upcoming', label: '未出行', icon: 'IcTrain' },
  { id: 'refund', label: '退款/售后', icon: 'IcService' },
  { id: 'toReview', label: '待点评', icon: 'IcCheck' },
];
const MISC_ICONS = ['IcTicket', 'IcGuide', 'IcHeart', 'IcTabTrip', 'IcCar', 'IcService', 'IcSearch', 'IcCheck'];

export default function MineMainPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const user = useCtripStore((s) => s.user);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title="我的"
        showBack={false}
        transparent
        rightContent={<button {...bindTap('mine.toSettings')} className="bg-transparent border-none cursor-pointer p-0"><IcSettings size={20} className="text-[#333333]" /></button>}
      />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 会员卡 */}
        <div className="mx-2 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2B3A55] to-[#4A5A7A] p-4 text-white">
          <div className="flex items-center gap-3">
            <Img src={user.avatar} className="w-12 h-12 rounded-full object-cover border-2 border-white/40" />
            <div className="flex-1">
              <div className="text-[16px] font-semibold">{user.name}</div>
              <div className="text-[12px] text-[#FFD98A] mt-0.5">◇ {user.memberLevel}</div>
            </div>
            <button {...bindTap('mine.toMember')} className="text-[12px] text-[#2B3A55] bg-[#FFD98A] rounded-full px-3 py-1 border-none cursor-pointer">会员中心</button>
          </div>
          <div className="flex mt-4 text-center">
            {[['收藏', user.favorites], ['浏览', user.footprints], ['积分', user.points], ['优惠券', user.coupons]].map(([k, v]) => (
              <div key={k as string} className="flex-1">
                <div className="text-[16px] font-semibold">{v}</div>
                <div className="text-[11px] text-white/70">{k}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 订单宫格 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <button {...bindTap('mine.toOrders')} className="w-full flex items-center justify-between mb-2 bg-transparent border-none cursor-pointer">
            <span className="text-[15px] font-semibold text-[#111111]">我的订单</span>
            <span className="text-[12px] text-[#999999]">全部订单 ›</span>
          </button>
          <div className="grid grid-cols-4">
            {ORDER_GRID.map((o) => (
              <button key={o.id} {...bindTap('mine.toOrders')} className="flex flex-col items-center gap-1 py-1 bg-transparent border-none cursor-pointer">
                <span className="w-9 h-9 rounded-full bg-[#EAF4FF] text-[#0086F6] flex items-center justify-center">
                  <IconRenderer name={o.icon} size={18} />
                </span>
                <span className="text-[11px] text-[#555555]">{o.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 钱包 */}
        <button {...bindTap('mine.toWallet')} className="bg-white mx-2 mt-2 w-[calc(100%-1rem)] rounded-xl px-4 py-3 flex items-center justify-between border-none cursor-pointer">
          <span className="text-[15px] font-semibold text-[#111111]">我的钱包</span>
          <span className="text-[12px] text-[#999999]">优惠券 {user.coupons} 张 ›</span>
        </button>

        {/* 功能宫格 */}
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <div className="text-[15px] font-semibold text-[#111111] mb-2">常用功能</div>
          <div className="grid grid-cols-4 gap-y-3">
            <GridItem label="常用信息" icon={MISC_ICONS[0]} binding={bindTap('mine.toTravelers')} />
            <GridItem label="报销凭证" icon={MISC_ICONS[1]} binding={bindTap('mine.toInvoice')} />
            {['礼品卡', '出行清单', '购物车', '客服', '扫一扫', '签到'].map((m, index) => (
              <GridItem key={m} label={m} icon={MISC_ICONS[index + 2]} binding={bindTap({ kind: 'action', id: 'mine.misc.wontfix' }, { params: { m }, onTrigger: () => showToast(WONTFIX_TOAST) })} />
            ))}
          </div>
        </div>

        {/* 旅行足迹 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-4 py-3 text-[13px] text-[#666666]">
          ◉ 旅行足迹:已飞行 37445 公里,打卡 18 个城市
        </div>
      </div>
      {toast}
    </div>
  );
}

function GridItem({ label, icon, binding }: { label: string; icon: string; binding: object }) {
  return (
    <button {...binding} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
      <span className="w-9 h-9 rounded-full bg-[#F2F4F7] text-[#0086F6] flex items-center justify-center">
        <IconRenderer name={icon} size={17} />
      </span>
      <span className="text-[11px] text-[#555555]">{label}</span>
    </button>
  );
}
