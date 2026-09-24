import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { Img, Price, useToast } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import {
  IcLocation, IcService, IcSettings, IcWallet, IcTicket, IcSparkles, IcMoney,
  IcClock, IcCard, IcTruck, IcHeart, IcShop, IcFootprint, IcStar,
} from '../res/icons';

/** 我的淘宝(spec: mine.main,IMG_8727/8732) */
export default function MinePage() {
  const { bindTap } = useTaobaoGestures();
  const user = useTaobaoStore((s) => s.user);
  const orders = useTaobaoStore((s) => s.orders);
  const coupons = useTaobaoStore((s) => s.coupons);
  const favorites = useTaobaoStore((s) => s.favorites);
  const followedShops = useTaobaoStore((s) => s.followedShops);
  const footprints = useTaobaoStore((s) => s.footprints);
  const items = useTaobaoStore((s) => s.items);
  const claimedCenter = useTaobaoStore((s) => s.claimedCenterCoupons ?? []);
  const claimCenterCoupon = useTaobaoStore((s) => s.claimCenterCoupon);
  const [toast, showToast] = useToast();

  const count = (st: string) => orders.filter((o) => o.status === st).length;
  const reviewCount = orders.filter((o) => o.status === 'completed' && !o.reviewed).length;

  const ORDER_ENTRIES = [
    { label: '待付款', tab: 'pendingPayment', icon: IcWallet, badge: count('pendingPayment') },
    { label: '待发货', tab: 'pendingShip', icon: IcClock, badge: count('pendingShip') },
    { label: '待收货', tab: 'shipped', icon: IcTruck, badge: count('shipped') },
    { label: '待评价', tab: 'review', icon: IcStar, badge: reviewCount, reviewCenter: true },
    { label: '退款/售后', tab: 'refund', icon: IcCard, badge: 0 },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <div className="flex-1 overflow-y-auto" data-scroll-container="mine-body" data-scroll-direction="vertical">
        {/* 头部 */}
        <div className="bg-gradient-to-b from-[#FFE9DC] to-[#F5F6F7] px-3 pt-3 pb-1">
          <div className="flex items-center gap-2.5">
            <Img src={user.avatar} className="w-12 h-12 rounded-full" />
            <div className="flex-1">
              <div className="text-[16px] font-bold">{user.nick}</div>
              <div className="flex gap-1.5 mt-0.5">
                <span className="text-[10px] text-[#8A6116] bg-[#F4E3C1] rounded px-1">{user.level}</span>
                {!user.is88Vip && <span className="text-[10px] text-[#333333] bg-white rounded px-1">88VIP ›</span>}
              </div>
            </div>
            <span {...bindTap('mine.address-open')} className="text-[12px] text-[#333333] mr-3 cursor-pointer inline-flex items-center gap-0.5">
              <IcLocation size={14} />地址
            </span>
            <span {...bindTap('message.chat-open', { params: { chatId: 'ch_ai' } })} className="text-[12px] text-[#333333] mr-3 cursor-pointer inline-flex items-center gap-0.5">
              <IcService size={14} />官方客服
            </span>
            <span {...bindTap('mine.settings-open')} className="text-[12px] text-[#333333] cursor-pointer inline-flex items-center gap-0.5">
              <IcSettings size={14} />设置
            </span>
          </div>

          {/* 省钱卡片 */}
          <div className="bg-gradient-to-r from-[#3D3528] to-[#56492F] rounded-xl mt-3 px-3 py-2 flex items-center justify-between">
            <span className="text-[#F4E3C1] text-[13px]">累计省钱 <b className="text-[16px]">{user.savedTotal}</b> 元</span>
            <span className="text-[#F4E3C1] text-[11px]">会员中心 · 1毛钱抢剧集包 ›</span>
          </div>

          {/* 资产四格 */}
          <div className="bg-white rounded-xl mt-2 grid grid-cols-4 py-2.5">
            <Asset label="红包" value={`¥${user.redPacketAmount}`} binding={bindTap('mine.coupons-open')} />
            <Asset label="优惠券" value={`${coupons.filter((c) => !c.used).length}张`} binding={bindTap('mine.coupons-open')} />
            <Asset label="天猫积分" value={String(user.tmallPoints)} />
            <Asset label="充值金" value={`¥${user.rechargeBalance.toFixed(2)}`} />
          </div>
        </div>

        {/* 我的订单 */}
        <div className="mx-2.5 bg-white rounded-xl px-3 py-2.5">
          <div
            {...bindTap('mine.orders-open')}
            className="flex justify-between items-center cursor-pointer"
          >
            <span className="text-[15px] font-semibold">我的订单</span>
            <span className="text-[12px] text-[#999999]">全部 ›</span>
          </div>
          <div className="grid grid-cols-5 mt-2.5">
            {ORDER_ENTRIES.map((e) => (
              <button
                key={e.label}
                {...(e.reviewCenter
                  ? bindTap('mine.reviewCenter-open')
                  : bindTap('mine.orders-open', { params: { tab: e.tab } }))}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer relative"
              >
                <span className="relative">
                  <e.icon size={22} className="text-[#333333]" />
                  {e.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-[#FF0036] text-white text-[10px] leading-4">
                      {e.badge}
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-[#333333]">{e.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 快捷四格 */}
        <div className="mx-2.5 mt-2 bg-white rounded-xl grid grid-cols-4 py-2.5">
          <Asset label="快递" value="1件已签收" small binding={bindTap('mine.orders-open', { params: { tab: 'shipped' } })} icon={<IcTruck size={15} />} />
          <Asset label="收藏" value={`${favorites.length}件宝贝`} small binding={bindTap('mine.favorites-open')} icon={<IcHeart size={15} />} />
          <Asset label="关注店铺" value={`${followedShops.length}家`} small binding={bindTap('mine.followShops-open')} icon={<IcShop size={15} />} />
          <Asset label="足迹" value={`今天浏览${footprints.filter((f) => f.date >= footprints[0]?.date).length}件`} small binding={bindTap('mine.footprints-open')} icon={<IcFootprint size={15} />} />
        </div>

        {/* 领券中心 */}
        <div className="mx-2.5 mt-2 bg-white rounded-xl px-3 py-2.5">
          <div className="flex justify-between items-center">
            <span className="text-[14px] font-semibold"><span className="text-[#FF0036] italic font-black">618</span>品类周 领券中心</span>
            <span className="text-[12px] text-[#999999]">更多 ›</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[
              { amt: 250, label: '消费券', th: '满500可用' }, { amt: 200, label: '美妆加补券', th: '满990可用' },
              { amt: 12, label: '服装加补券', th: '满120可用' }, { amt: 5, label: '手配加补券', th: '满50可用' },
            ].map((c) => {
              const got = claimedCenter.includes(c.label);
              return (
                <div
                  key={c.label}
                  {...bindTap({ kind: 'action', id: 'mine.couponCenter.claim' }, {
                    params: { title: c.label },
                    onTrigger: () => {
                      if (!got) { claimCenterCoupon(c.label, c.amt, c.th); showToast('领取成功,已放入我的权益'); }
                    },
                  })}
                  className="bg-[#FFF1E8] rounded-lg p-1.5 text-center cursor-pointer"
                >
                  <Price value={c.amt} size="m" />
                  <div className="text-[10px] text-[#C2410C] mt-0.5 truncate">{c.label}</div>
                  <div className={`text-[10px] rounded-full mt-1 py-0.5 ${got ? 'text-[#999999] bg-[#EEEEEE]' : 'text-white bg-[#FF5000]'}`}>
                    {got ? '已领取' : '领取'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 应用宫格(铁律①:给明确反馈) */}
        <div className="mx-2.5 mt-2 bg-white rounded-xl grid grid-cols-5 py-2.5 mb-2">
          {['芭芭农场', '红包签到', '发票中心', '斗地主', '连连消'].map((g, i) => (
            <div key={g} onClick={() => showToast(`「${g}」暂未开放`)} className="flex flex-col items-center gap-1 cursor-pointer">
              <span className="w-9 h-9 rounded-xl bg-[#FFF1E8] flex items-center justify-center text-[14px] font-black text-[#FF5000]">
                {g[0]}
              </span>
              <span className="text-[10px] text-[#333333]">{g}</span>
            </div>
          ))}
        </div>

        {/* 猜你喜欢 */}
        <div className="flex gap-5 px-4 py-1 text-[14px]">
          <span className="font-semibold border-b-2 border-[#FF5000] pb-0.5">猜你喜欢</span>
          <span {...bindTap('mine.favorites-open')} className="text-[#666666] cursor-pointer">我的收藏</span>
          <span className="text-[#666666]">好友动态</span>
        </div>
        <div className="pb-3 mt-1">
          <ItemGrid
            items={items.slice(2, 8)}
            bindingOf={(it) => bindTap('home.item-open', { params: { itemId: it.id } })}
          />
        </div>
      </div>
      {toast}
    </div>
  );
}

function Asset({
  label, value, binding, small, icon,
}: { label: string; value: string; binding?: object; small?: boolean; icon?: React.ReactNode }) {
  return (
    <button {...(binding ?? {})} className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer">
      <span className={`font-bold ${small ? 'text-[12px]' : 'text-[15px]'} flex items-center gap-1`}>{icon}{small ? label : value}</span>
      <span className="text-[11px] text-[#999999]">{small ? value : label}</span>
    </button>
  );
}
