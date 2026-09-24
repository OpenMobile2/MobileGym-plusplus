import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, wontfix } from '../components/ui';
import {
  IcHeadphones, IcMapPin, IcSettings, IcChevronRight, IcWallet,
  IcTruck, IcTicket, IcStar, IcRefresh,
} from '../res/icons';

// 我的 — Tab 根页,无 TopBar。按截图 206 充实。
export function MinePage() {
  const { bindTap } = useJingdongGestures();
  const user = useJingdongStore((s) => s.user);
  const favoriteCount = useJingdongStore((s) => s.favorites.length);
  const recordTaskAudit = useJingdongStore((s) => s.recordTaskAudit);

  React.useEffect(() => {
    recordTaskAudit({ mineFavoriteCount: favoriteCount });
  }, [favoriteCount, recordTaskAudit]);

  const orderCells: { label: string; status: string; Icon: typeof IcWallet; badge?: number }[] = [
    { label: '待付款', status: 'unpaid', Icon: IcWallet },
    { label: '待收货', status: 'undelivered', Icon: IcTruck },
    { label: '待使用', status: 'unused', Icon: IcTicket },
    { label: '待评价', status: 'review', Icon: IcStar, badge: 10 },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container="mine-scroll" data-scroll-direction="vertical">
        {/* 顶部粉色头区 */}
        <div className="pt-10 px-3 pb-3 bg-gradient-to-b from-[#FDE1DD] to-[#F5F5F5]">
          {/* 签到 pill + 右上功能 */}
          <div className="flex items-start justify-between gap-2">
            <button
              {...bindTap('mine.jingdou-open')}
              className="flex items-center gap-1.5 h-9 pl-1 pr-3 rounded-full bg-white/90 shadow-sm max-w-[54%]"
            >
              <span className="text-[11px] font-medium text-white bg-[#1BA956] rounded-full px-1.5 py-0.5">点评</span>
              <span className="text-[12px] text-[#333] truncate">每日签到必得10京豆!</span>
              <IcChevronRight size={14} className="text-[#999] shrink-0" />
            </button>
            <div className="flex items-center gap-4 pt-0.5">
              <button {...bindTap('mine.cs-open', { params: { chatId: 'ch_cs' } })} className="flex flex-col items-center text-[#333]">
                <IcHeadphones size={20} />
                <span className="text-[10px] mt-0.5">客户服务</span>
              </button>
              <button {...bindTap('mine.address-open')} className="flex flex-col items-center text-[#333]">
                <IcMapPin size={20} />
                <span className="text-[10px] mt-0.5">地址</span>
              </button>
              <button {...bindTap('mine.settings-open')} className="flex flex-col items-center text-[#333]">
                <IcSettings size={20} />
                <span className="text-[10px] mt-0.5">设置</span>
              </button>
            </div>
          </div>

          {/* 头像 + 昵称 + 会员 */}
          <div className="flex items-center gap-3 mt-3">
            <Img src={user.avatar} className="w-16 h-16 rounded-full object-cover bg-white" alt="头像" />
            <div className="flex-1 min-w-0">
              <div className="text-[19px] font-bold text-[#1A1A1A] truncate">{user.name}</div>
              <div className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#8A6A4B] bg-[#F3E4D2] rounded-full px-2 py-0.5">
                <span className="font-semibold">JD</span>{user.memberLevel}
              </div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'mine.finance.wontfix' }, { onTrigger: wontfix })}
              className="flex items-center gap-1 rounded-xl bg-[#DCEBFF] px-3 py-2 text-[#2860C4]"
            >
              <div className="text-right leading-tight">
                <div className="text-[13px] font-bold flex items-center gap-0.5">学生会员 <IcChevronRight size={12} /></div>
                <div className="text-[11px]">领海底捞69折</div>
              </div>
            </button>
          </div>

          {/* 数字栏 */}
          <div className="flex items-stretch bg-white rounded-xl mt-3 py-2.5">
            <button {...bindTap('mine.coupon-open')} className="flex-1 flex flex-col items-center">
              <span className="text-[16px] font-bold text-[#1A1A1A]">{user.couponCount}张</span>
              <span className="text-[11px] text-[#888] mt-0.5">优惠券</span>
            </button>
            <button {...bindTap({ kind: 'action', id: 'mine.finance.wontfix' }, { onTrigger: wontfix })} className="flex-1 flex flex-col items-center border-l border-[#F2F2F2]">
              <span className="text-[16px] font-bold text-[#1A1A1A]">¥{user.redpacket}</span>
              <span className="text-[11px] text-[#888] mt-0.5">红包</span>
            </button>
            <button {...bindTap('mine.jingdou-open')} className="flex-1 flex flex-col items-center border-l border-[#F2F2F2]">
              <span className="text-[16px] font-bold text-[#1A1A1A]">{user.jingdou}</span>
              <span className="text-[11px] text-[#888] mt-0.5">京豆</span>
            </button>
            <button {...bindTap({ kind: 'action', id: 'mine.finance.wontfix' }, { onTrigger: wontfix })} className="flex-1 flex flex-col items-center border-l border-[#F2F2F2]">
              <span className="text-[16px] font-bold text-[#1A1A1A]">¥{user.baitiao}</span>
              <span className="text-[11px] text-[#888] mt-0.5">白条取现</span>
            </button>
          </div>
        </div>

        {/* 订单九宫格 */}
        <div className="mx-3 bg-white rounded-xl p-3">
          <button {...bindTap('mine.orders-open')} className="w-full flex items-center justify-between mb-3">
            <span className="text-[15px] font-semibold text-[#1A1A1A]">我的订单</span>
            <span className="flex items-center text-[12px] text-[#888]">全部 <IcChevronRight size={14} /></span>
          </button>
          <div className="grid grid-cols-5 gap-1">
            {orderCells.map((c) => (
              <button
                key={c.status}
                {...bindTap('mine.orders-open-status', { params: { status: c.status } })}
                className="flex flex-col items-center py-1"
              >
                <div className="relative">
                  <c.Icon size={26} className="text-[#333]" />
                  {c.badge ? (
                    <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#E1251B] text-white text-[10px] leading-4 text-center">{c.badge}</span>
                  ) : null}
                </div>
                <span className="text-[12px] text-[#555] mt-1">{c.label}</span>
              </button>
            ))}
            <button {...bindTap('mine.aftersale-open')} className="flex flex-col items-center py-1">
              <IcRefresh size={26} className="text-[#333]" />
              <span className="text-[12px] text-[#555] mt-1">退换/售后</span>
            </button>
          </div>
        </div>

        {/* 足迹 / 收藏 / 关注 / 种草 */}
        <div className="mx-3 mt-3 bg-white rounded-xl grid grid-cols-4 py-3">
          <button {...bindTap('mine.footprint-open')} className="flex flex-col items-center">
            <span className="text-[16px] font-bold text-[#1A1A1A]">{user.footprintCount}</span>
            <span className="text-[12px] text-[#888] mt-0.5">足迹</span>
          </button>
          <button {...bindTap('mine.favorites-open')} className="flex flex-col items-center border-l border-[#F2F2F2]">
            <span className="text-[16px] font-bold text-[#1A1A1A]">{favoriteCount}</span>
            <span className="text-[12px] text-[#888] mt-0.5">收藏</span>
          </button>
          <button {...bindTap('mine.favorites-open')} className="flex flex-col items-center border-l border-[#F2F2F2]">
            <span className="text-[16px] font-bold text-[#1A1A1A]">{user.followCount}</span>
            <span className="text-[12px] text-[#888] mt-0.5">关注</span>
          </button>
          <button {...bindTap({ kind: 'action', id: 'mine.finance.wontfix' }, { onTrigger: wontfix })} className="flex flex-col items-center border-l border-[#F2F2F2]">
            <span className="text-[13px] font-medium text-[#888] mt-1">种草</span>
            <span className="text-[12px] text-[#888] mt-0.5">发现</span>
          </button>
        </div>

        {/* 钱包 / 京东服务 / 互动游戏 */}
        <div className="mx-3 my-3 grid grid-cols-3 gap-3">
          {[
            { t: '钱包', d: '大额现金' },
            { t: '京东服务', d: '专属惊喜' },
            { t: '互动游戏', d: '领1.21元红包' },
          ].map((b) => (
            <button
              key={b.t}
              {...bindTap({ kind: 'action', id: 'mine.finance.wontfix' }, { onTrigger: wontfix })}
              className="bg-white rounded-xl p-3 text-left"
            >
              <div className="flex items-center text-[14px] font-semibold text-[#1A1A1A]">{b.t}<IcChevronRight size={14} /></div>
              <div className="text-[11px] text-[#E1251B] mt-1 truncate">{b.d}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
