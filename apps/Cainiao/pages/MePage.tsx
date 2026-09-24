import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import Img from '../components/Img';
import {
  IcIdCard, IcSettings, IcChevronRight, IcPhone, IcFriends, IcAddressBook, IcService,
  IcSend, IcShopping, IcTruck, IcRecycle,
} from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

/** 我的(spec me.main) */
export default function MePage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const user = useCainiaoStore((s) => s.user);
  const coupons = useCainiaoStore((s) => s.coupons);
  const packages = useCainiaoStore((s) => s.packages);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  const pendingPkg = packages.filter((p) => p.status === '待取件').length;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-(--app-c-wash-from) to-(--app-c-wash-to)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部 */}
        <div className="flex items-center pt-12">
          <Img src={user.avatar} className="h-14 w-14 shrink-0 rounded-full bg-(--app-c-card-bg) object-cover" />
          <div className="ml-3 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-[18px] font-bold text-(--app-c-text-primary)">{user.nick}</span>
              <button
                {...bindTap('me.idcode.open')}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-(--app-c-text-primary)/25 bg-(--app-c-card-bg)/60 px-2 py-0.5 text-[12px] text-(--app-c-text-primary)"
              >
                <IcIdCard size={12} /> {t('home.idcode')}
              </button>
            </div>
            <button {...action('me.station.wontfixToast', wontfix)} className="mt-1 flex cursor-pointer items-center border-none bg-transparent p-0 text-[12px] text-(--app-c-text-secondary)">
              常用驿站 | {user.station}… <IcChevronRight size={12} />
            </button>
          </div>
          <button {...bindTap('me.settings.open')} className="shrink-0 cursor-pointer border-none bg-transparent p-1.5 text-(--app-c-text-primary)">
            <IcSettings size={22} />
          </button>
        </div>

        {/* V2 会员横幅(装饰 + 去看看 wontfix) */}
        <div className="mt-3 flex items-center rounded-t-2xl bg-gradient-to-r from-[#FFE7C2] to-[#FFC98A] px-3 py-2.5">
          <span className="text-[15px] font-bold italic text-[#8A4B12]">V2萌新会员</span>
          <span className="ml-2 text-[13px] text-[#8A4B12]">| 领最高15元话费</span>
          <button
            {...action('me.vip.wontfixToast', wontfix)}
            className="ml-auto cursor-pointer rounded-full border-none bg-gradient-to-b from-[#A9683B] to-[#7A4A12] px-3.5 py-1 text-[13px] font-semibold text-white"
          >
            去看看
          </button>
        </div>

        {/* 四格 */}
        <div className="flex rounded-b-2xl bg-(--app-c-card-bg) py-3.5">
          <button {...action('me.stats.wontfixToast', wontfix)} className="flex-1 cursor-pointer border-none bg-transparent text-center">
            <div className="text-[19px] font-extrabold text-(--app-c-text-primary)">{user.points}</div>
            <div className="mt-0.5 text-[12px] text-(--app-c-text-secondary)">裹酱积分</div>
          </button>
          <button {...action('me.stats.wontfixToast', wontfix)} className="flex-1 cursor-pointer border-none bg-transparent text-center">
            <div className="text-[19px] font-extrabold text-(--app-c-text-primary)">{user.timeoutPerk}<span className="text-[13px] font-normal">个</span></div>
            <div className="mt-0.5 text-[12px] text-(--app-c-text-secondary)">超时享</div>
          </button>
          <button {...bindTap('me.benefits.open')} className="flex-1 cursor-pointer border-none bg-transparent text-center">
            <div className="text-[19px] font-extrabold text-(--app-c-text-primary)">{coupons.length}<span className="text-[13px] font-normal">个</span></div>
            <div className="mt-0.5 text-[12px] text-(--app-c-text-secondary)">红包卡券</div>
          </button>
          <button {...bindTap('me.benefits.coupon.open')} className="flex-1 cursor-pointer border-none bg-transparent text-center">
            <div className="text-[19px] font-extrabold text-(--app-c-text-primary)">{user.shipDiscountYuan}<span className="text-[13px] font-normal">元</span></div>
            <div className="mt-0.5 text-[12px] text-(--app-c-text-secondary)">寄件优惠</div>
          </button>
        </div>

        {/* 常用功能 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="text-[16px] font-bold text-(--app-c-text-primary)">常用功能</div>
          <div className="mt-3 flex">
            <button {...bindTap('me.phone.open')} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcPhone size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">手机号</span>
            </button>
            <button {...action('me.friends.wontfixToast', wontfix)} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcFriends size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">我的好友</span>
            </button>
            <button {...bindTap('me.addressbook.open', { params: { mode: 'manage' } })} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcAddressBook size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">地址簿</span>
            </button>
            <button {...bindTap('me.service.open')} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcService size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">我的客服</span>
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <button {...bindTap('me.packages.open')} className="flex-1 cursor-pointer rounded-xl border-none bg-(--app-c-chip-bg) p-2.5 text-left">
              <div className="text-[14px] font-semibold text-(--app-c-text-primary)">我的包裹</div>
              <div className="mt-0.5 text-[11px] text-(--app-c-text-muted)">{pendingPkg > 0 ? `${pendingPkg}个包裹待取` : '暂无包裹信息'}</div>
            </button>
            <button {...action('me.wallet.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-xl border-none bg-(--app-c-chip-bg) p-2.5 text-left">
              <div className="text-[14px] font-semibold text-(--app-c-text-primary)">分享赚现金</div>
              <div className="mt-0.5 text-[11px] text-[#F5222D]">最高1000元</div>
            </button>
            <button {...action('me.wallet.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-xl border-none bg-(--app-c-chip-bg) p-2.5 text-left">
              <div className="text-[14px] font-semibold text-(--app-c-text-primary)">包裹账单</div>
              <div className="mt-0.5 text-[11px] text-(--app-c-text-muted)">统计你的包裹</div>
            </button>
          </div>
        </div>

        {/* 我的钱包(装饰行) */}
        <button {...action('me.wallet.wontfixToast', wontfix)} className="mt-3 flex w-full cursor-pointer items-center rounded-2xl border-none bg-(--app-c-card-bg) p-3.5 text-left">
          <span className="text-[16px] font-bold text-(--app-c-text-primary)">我的钱包</span>
          <span className="ml-auto flex items-center gap-1 text-[12px] text-(--app-c-text-secondary)">
            <span className="rounded bg-(--app-c-chip-bg) px-1 text-[11px] text-[#00B578]">绿色回收</span>
            旧衣回收最高0.7元/kg <IcChevronRight size={13} />
          </span>
        </button>

        {/* 我的订单 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="text-[16px] font-bold text-(--app-c-text-primary)">我的订单</div>
          <div className="mt-3 flex">
            <button {...bindTap('me.shiporders.open')} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcSend size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">寄件订单</span>
            </button>
            <button {...bindTap('me.shoporders.open')} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcShopping size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">购物订单</span>
            </button>
            <button {...action('me.orders.other.wontfixToast', wontfix)} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcTruck size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">送货订单</span>
            </button>
            <button {...action('me.orders.other.wontfixToast', wontfix)} className="flex flex-1 cursor-pointer flex-col items-center gap-1.5 border-none bg-transparent">
              <IcRecycle size={24} className="text-(--app-c-text-primary)" strokeWidth={1.8} />
              <span className="text-[12px] text-(--app-c-text-primary)">回收订单</span>
            </button>
          </div>
        </div>

        {/* 热门活动(同组一致 wontfix) */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="text-[16px] font-bold text-(--app-c-text-primary)">热门活动</div>
          <div className="mt-3 flex gap-2">
            {[
              { name: '红包乐园', sub: '大家都在玩 越玩越省钱', img: '/@app-assets/Cainiao/misc/activity_redpacket.png' },
              { name: '欢乐赢红包', sub: '赢100万红包', img: '/@app-assets/Cainiao/misc/activity_win.png' },
              { name: '地图寻宝', sub: '寻宝藏 赢免单', img: '/@app-assets/Cainiao/misc/activity_treasure.png' },
            ].map((a) => (
              <button key={a.name} {...action('me.activity.wontfixToast', wontfix)} className="flex-1 cursor-pointer rounded-xl border-none bg-[#FFF6F0] p-2 text-left">
                <div className="text-[13px] font-bold text-(--app-c-text-primary)">{a.name}</div>
                <div className="mt-0.5 line-clamp-1 text-[10px] text-(--app-c-text-muted)">{a.sub}</div>
                <Img src={a.img} className="mt-1 aspect-square w-full rounded-lg object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
