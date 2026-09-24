import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import { IcHelp, IcSettings, IcArrowRight } from '../res/icons';
import { useDidiStrings } from '../hooks/useDidiStrings';

/** 「我的」tab 页 —— 证据 frames/recD_me.jpg、s18。浅紫→白渐变头部,自绘无 TopBar。 */

const KINGKONG = [
  '成为司机', '家庭账户', '企业版', '个性化', '充值中心',
  '我的收藏', '绿色出行', '滴滴公益', '评价有礼', '地图找店',
  '省钱月卡', '学生权益', '福利社', '精选商城',
]; // 「常用地址」单独接线(address.manage.open),渲染在金刚区首位

const VIP_PERKS = [
  { title: '月月领券', sub: '最高省20元' },
  { title: '直通华住会', sub: '金卡·银卡' },
  { title: '包车专享券', sub: '最高省150元' },
];

export default function MeMainPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const user = useDidiStore((s) => s.user);
  const avatarUri = useDidiStore((s) => s.avatarUri);
  const setTripsTab = useDidiStore((s) => s.setTripsTab);
  const setInvoiceSelected = useDidiStore((s) => s.setInvoiceSelected);
  const s = useDidiStrings();

  /** 未实现入口:统一绑 me.main.stub(id 字面量集中于此一处) */
  const stub = (name: string) =>
    bindTap(
      { kind: 'action', id: 'me.main.stub' },
    { onTrigger: () => toast(`${name}暂未开放`), params: { name } },
    );

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        style={{ background: 'linear-gradient(180deg,#EDE7FD 0%,#F3F0FB 120px,#F5F6FA 220px)' }}
      >
        {/* ① 头部:头像 + 手机号 + 小字 + 右上客服/设置 */}
        <div className="flex items-center px-4 pt-3 pb-2">
          <button
            {...bindTap('profile.edit.open')}
            className="bg-transparent border-none p-0 shrink-0"
            aria-label="个人信息"
          >
            <img
              src={avatarUri ?? '/@app-assets/Didi/avatars/user_me.png'}
              alt=""
              className="w-13 h-13 rounded-full object-cover"
              style={{ width: 52, height: 52 }}
              onError={(e) => {
                const el = e.currentTarget;
                if (el.dataset.fb) return;
                el.dataset.fb = '1';
                el.src =
                  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 52 52'><circle cx='26' cy='26' r='26' fill='%23FFE3D2'/><circle cx='26' cy='20' r='9' fill='%23FF9A62'/><path d='M8 48c3-11 11-15 18-15s15 4 18 15' fill='%23FF9A62'/></svg>";
              }}
            />
          </button>
          <div className="flex-1 min-w-0 ml-3">
            <div className="text-[19px] font-bold text-app-text">{user.phone}</div>
            <button
              onClick={() => toast('该功能暂未开放')}
              className="flex items-center gap-0.5 bg-transparent border-none p-0 mt-0.5 text-[12px]"
              style={{ color: '#8B7BB8' }}
            >
              <span>⚡4小时 · 今日已减¥3</span>
              <IcArrowRight size={12} />
            </button>
          </div>
          <button
            {...bindTap('help.fromMe')}
            className="flex flex-col items-center bg-transparent border-none p-1 mr-2 text-app-text"
            aria-label={s.customerService}
          >
            <IcHelp size={22} />
            <span className="text-[10px] mt-0.5">{s.customerService}</span>
          </button>
          <button
            {...bindTap('settings.main.open')}
            className="flex flex-col items-center bg-transparent border-none p-1 text-app-text"
            data-testid="didi-me-settings"
            data-automation-label="设置"
            aria-label="设置"
          >
            <IcSettings size={22} />
            <span className="text-[10px] mt-0.5" data-automation-label="设置">{s.settings}</span>
          </button>
        </div>

        <div className="px-3 pb-6 flex flex-col gap-3">
          {/* ② V3 会员渐变紫卡 */}
          <div
            className="rounded-xl px-4 pt-3 pb-4 text-white"
            style={{ background: 'linear-gradient(135deg,#8E7CF3 0%,#A78BFA 55%,#C4B5FD 100%)' }}
          >
            <div className="flex items-center">
              <span className="italic font-black text-[18px]">V3会员</span>
              <span className="ml-2 text-[11px] opacity-90">{user.growth}/2300</span>
              <div className="flex-1 mx-3 h-1 rounded-full bg-white/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${Math.min(100, (user.growth / 2300) * 100)}%` }}
                />
              </div>
              <button
                onClick={() => toast('该功能暂未开放')}
                className="bg-white/90 border-none rounded-full px-3 py-1 text-[12px] font-medium"
                style={{ color: '#7C5CE0' }}
              >
                会员中心 ›
              </button>
            </div>
            <div className="flex mt-3">
              {VIP_PERKS.map((p) => (
                <button
                  key={p.title}
                  onClick={() => toast('该功能暂未开放')}
                  className="flex-1 flex flex-col items-center bg-transparent border-none p-0"
                >
                  <span className="text-[13px] font-semibold text-white">{p.title}</span>
                  <span className="text-[11px] text-white/80 mt-0.5">{p.sub} ›</span>
                </button>
              ))}
            </div>
          </div>

          {/* ③ 订单卡 */}
          <div className="bg-app-surface rounded-xl px-4 py-3">
            <button
              {...bindTap('trips.fromMe', { beforeTrigger: () => setTripsTab('all') })}
              data-testid="didi-me-trips-all"
              className="flex items-center w-full bg-transparent border-none p-0"
            >
              <span className="flex-1 text-left text-[15px] font-semibold text-app-text">{s.allOrders}</span>
              <IcArrowRight size={16} className="text-app-text-muted" />
            </button>
            <div className="flex mt-3">
              <button
                {...bindTap('trips.fromMe', { beforeTrigger: () => setTripsTab('toDepart') })}
                data-testid="didi-me-trips-toDepart"
                className="flex-1 flex flex-col items-center bg-transparent border-none p-0"
              >
                <OrderIcon d="M12 6v6l4 2" />
                <span className="text-[12px] text-app-text mt-1">{s.toDepart}</span>
              </button>
              <button
                {...bindTap('trips.fromMe', { beforeTrigger: () => setTripsTab('unpaid') })}
                data-testid="didi-me-trips-unpaid"
                className="flex-1 flex flex-col items-center bg-transparent border-none p-0"
              >
                <OrderIcon d="M9 12h6M12 9v6" />
                <span className="text-[12px] text-app-text mt-1">{s.unpaid}</span>
              </button>
              <button {...bindTap('invoice.fromMe', { beforeTrigger: () => setInvoiceSelected([]) })} className="flex-1 flex flex-col items-center bg-transparent border-none p-0">
                <OrderIcon d="M9 9h6M9 13h4" />
                <span className="text-[12px] text-app-text mt-1">{s.invoice}</span>
              </button>
              <button
                {...bindTap('trips.fromMe', { beforeTrigger: () => setTripsTab('all') })}
                data-testid="didi-me-trips-more"
                className="flex-1 flex flex-col items-center bg-transparent border-none p-0"
              >
                <OrderIcon d="M8 12h.01M12 12h.01M16 12h.01" />
                <span className="text-[12px] text-app-text mt-1">查看更多</span>
              </button>
            </div>
          </div>

          {/* ④ 资产四格 */}
          <div className="bg-app-surface rounded-xl px-2 py-3 flex">
            <button
              {...bindTap('coupons.list.open')}
              className="flex-1 flex flex-col items-center bg-transparent border-none p-0"
            >
              <span className="text-[17px] font-bold text-app-text">{user.couponCount}<span className="text-[12px] font-normal">张</span></span>
              <span className="text-[12px] text-app-text-muted mt-0.5">{s.coupons}</span>
            </button>
            <button
              {...bindTap('wallet.main.open')}
              className="flex-1 flex flex-col items-center bg-transparent border-none p-0"
            >
              <span className="text-[17px] font-bold text-app-text">{user.balance}<span className="text-[12px] font-normal">元</span></span>
              <span className="text-[12px] text-app-text-muted mt-0.5">{s.wallet}</span>
            </button>
            <button {...stub('出行保障')} className="flex-1 flex flex-col items-center bg-transparent border-none p-0">
              <span className="text-[17px] font-bold text-app-text">100万</span>
              <span className="text-[12px] text-app-text-muted mt-0.5">出行保障</span>
            </button>
            <button {...stub('借钱额度')} className="flex-1 flex flex-col items-center bg-transparent border-none p-0 relative">
              <span
                className="absolute -top-2 right-2 text-[9px] text-white rounded-full px-1"
                style={{ background: C.orange }}
              >
                推荐
              </span>
              <span className="text-[17px] font-bold text-app-text">20万</span>
              <span className="text-[12px] text-app-text-muted mt-0.5">借钱额度</span>
            </button>
          </div>

          {/* ⑤ 单单返现 banner */}
          <button
            {...stub('单单返现')}
            className="flex items-center rounded-xl px-4 py-2.5 border-none text-left"
            style={{ background: '#FFF0E5' }}
          >
            <span className="text-[13px] font-semibold" style={{ color: C.orangeDeep }}>🔔 单单返现</span>
            <span className="flex-1 ml-2 text-[12px] text-app-text-muted truncate">开通立返3元,单单可领现金</span>
            <span
              className="text-[12px] text-white rounded-full px-3 py-1"
              style={{ background: C.orange }}
            >
              去领取
            </span>
          </button>

          {/* ⑥ 金刚区 5列 */}
          <div className="bg-app-surface rounded-xl px-2 py-3 grid grid-cols-5 gap-y-4">
            <button
              {...bindTap('address.manage.open')}
              className="flex flex-col items-center bg-transparent border-none p-0"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                style={{ background: '#FFF3EA', color: C.orangeDeep }}
              >
                址
              </span>
              <span className="text-[11px] text-app-text mt-1">常用地址</span>
            </button>
            {KINGKONG.map((name) => (
              <button
                key={name}
                {...stub(name)}
                className="flex flex-col items-center bg-transparent border-none p-0"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[15px]"
                  style={{ background: '#FFF3EA', color: C.orangeDeep }}
                >
                  {name.slice(0, 1)}
                </span>
                <span className="text-[11px] text-app-text mt-1">{name}</span>
              </button>
            ))}
          </div>

          {/* ⑦ 底部 banner */}
          <button
            {...stub('打车赢5折券')}
            className="rounded-xl px-4 py-4 border-none text-left"
            style={{ background: 'linear-gradient(90deg,#FFF3D6,#FFE7C2)' }}
          >
            <div className="text-[16px] font-bold" style={{ color: '#8A4B0F' }}>
              打车赢<span style={{ color: C.orangeDeep }}>5折券</span>
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: '#B07B44' }}>
              一张自己用,其他送好友 ›
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function OrderIcon({ d }: { d: string }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#3A3F4A" strokeWidth="1.6" strokeLinecap="round">
      <rect x="5" y="4" width="14" height="17" rx="2.5" />
      <path d={d} />
    </svg>
  );
}
