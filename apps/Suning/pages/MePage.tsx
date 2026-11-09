import React from 'react';
import Img from '../components/Img';
import {
  IcChevronRight, IcScan, IcMapPin, IcGear, IcMessage, IcCrown, IcCard, IcWallet, IcTruck,
  IcStar, IcRefresh, IcInvoice, IcSign, IcTicket, IcCalendar, IcService, IcGov, IcGift, IcPiggy,
  IcPlus,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { launchGatewayPay } from '../utils/pay';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { ordersOfTab } from '../utils/order';

const AVATAR = '/@app-assets/Suning/me/avatar-lion.png';

/**
 * 我的易购(spec me.main,s306;tabbar 第 4 格,无返回键)。
 * 角标/待付款卡/退换状态条全部由 orders 实时派生,不落独立状态。
 * 设置/个人信息/足迹/卡券已补回真跳转;其余营销入口仍合并 wontfix.toast。
 */
export default function MePage() {
  const { bindTap, action, go } = useSuningGestures();
  const S = useStrings();

  const user = useSuningStore((s) => s.user);
  const orders = useSuningStore((s) => s.orders);
  const history = useSuningStore((s) => s.history);
  const followedProducts = useSuningStore((s) => s.followedProducts);
  const followedShops = useSuningStore((s) => s.followedShops);
  const setTemp = useSuningStore((s) => s.setTemp);
  const showToast = useSuningStore((s) => s.showToast);
  const paySuccess = useSuningStore((s) => s.paySuccess);

  const wontfix = () => showToast(S.toastNotOpen);

  const pendingPay = ordersOfTab(orders, 'pendingPay');
  const awaitShip = ordersOfTab(orders, 'awaitShip');
  const toReview = ordersOfTab(orders, 'toReview');
  const refundCount = orders.filter((o) => o.refund != null).length;
  // 待付款卡 = 最早一笔待支付订单;无待支付订单时整卡隐藏(uiState noPendingPay)
  const payCard = [...pendingPay].sort((a, b) => a.timestamps.placed - b.timestamps.placed)[0] ?? null;
  const payCardProduct = payCard ? SUNING_CONFIG.products.find((p) => p.id === payCard.items[0]?.productId) : null;
  const picks = SUNING_CONFIG.products.slice(6, 10);

  return (
    <div
      data-status-bar-foreground="light"
      className="h-full overflow-y-auto overflow-x-hidden bg-[var(--app-bg)]"
      data-scroll-container="main"
      data-scroll-direction="vertical"
    >
      {/* 顶部橙色区:头像账号 + 右上 地址|设置|消息 */}
      <div className="bg-gradient-to-b from-[var(--app-primary)] to-[var(--app-primary-dark)] px-3 pb-8 pt-10">
        <div className="flex items-center gap-2.5">
          <button
            {...bindTap('me.main.profile.open', {
              beforeTrigger: () => setTemp({ profileDot: false }),
            })}
            className="h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-white/70 bg-[var(--app-surface)] p-0"
          >
            <Img src={AVATAR} className="h-full w-full object-cover" />
          </button>
          <button
            {...bindTap('me.main.profile.open', {
              beforeTrigger: () => setTemp({ profileDot: false }),
            })}
            className="min-w-0 flex-1 cursor-pointer border-none bg-transparent p-0 text-left"
          >
            <span className="block text-[17px] font-bold text-white">{user.nickname}</span>
            <span className="mt-0.5 block text-[12px] text-white/80">{user.phoneMasked}</span>
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <IconBtn label="" onTap={wontfix}>
              <IcScan size={18} />
            </IconBtn>
            <button
              {...bindTap('me.main.addressList.open')}
              className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 py-0.5 text-white"
            >
              <IcMapPin size={18} />
              <span className="mt-0.5 text-[9px] leading-none">{S.meAddressEntry}</span>
            </button>
            <button
              {...bindTap('me.main.settings.open')}
              className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 py-0.5 text-white"
            >
              <IcGear size={18} />
              <span className="mt-0.5 text-[9px] leading-none">{S.meSettingsEntry}</span>
            </button>
            <button
              {...bindTap('me.main.msgCenter.open')}
              className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 py-0.5 text-white"
            >
              <IcMessage size={18} />
              <span className="mt-0.5 text-[9px] leading-none">{S.meMessageEntry}</span>
            </button>
          </div>
        </div>

        <div className="mt-2.5 flex gap-2">
          <button
            {...action('me.main.wontfix.toast', wontfix)}
            className="flex cursor-pointer items-center gap-1 rounded-full border-none bg-white/20 px-2.5 py-1 text-[11px] text-white"
          >
            <IcCrown size={12} />
            {S.meMemberCenter}
          </button>
          <button
            {...action('me.main.wontfix.toast', wontfix)}
            className="flex cursor-pointer items-center gap-1 rounded-full border-none bg-white/20 px-2.5 py-1 text-[11px] text-white"
          >
            <IcCard size={12} />
            {S.meBindCard}
          </button>
        </div>
      </div>

      <div className="-mt-6 px-2.5 pb-4">
        {/* Friend 会员津贴横幅 */}
        <button
          {...action('me.main.wontfix.toast', wontfix)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-none bg-gradient-to-r from-[#3A2416] to-[#6B4423] px-3 py-2.5 text-left"
        >
          <IcGift size={18} className="shrink-0 text-[#F5D6A0]" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-[#F5D6A0]">{S.meFriendTitle}</span>
            <span className="mt-0.5 block text-[10px] text-[#D9BC93]">{S.meFriendDesc}</span>
          </span>
          <span className="shrink-0 rounded-full bg-[#F5D6A0] px-2.5 py-1 text-[11px] font-bold text-[#5A3A1A]">
            {S.meFriendClaim}
          </span>
        </button>

        {/* 三格活动位:整组一致 toast */}
        <div className="mt-2 flex gap-2">
          <ActCell title={S.meActSubsidy} desc={S.meActSubsidyDesc} onTap={wontfix} />
          <ActCell title={S.meActMember} desc={S.meActMemberDesc} onTap={wontfix} />
          <ActCell title={S.meActCloud} desc={S.meActCloudDesc} onTap={wontfix} />
        </div>

        {/* 数据行:云钻 / 关注 / 足迹 / 常购 */}
        <div className="mt-2 flex rounded-xl bg-[var(--app-surface)] py-3">
          <DataCell value={user.yunzuan} label={S.meDataYunzuan} onTap={wontfix} />
          <DataCell
            value={followedProducts.length + followedShops.length}
            label={S.meDataFollow}
            onTap={wontfix}
            toFollow
          />
          <DataCell value={history.length} label={S.meDataHistory} onTap={wontfix} toHistory />
          <DataCell value={orders.length} label={S.meDataFrequent} onTap={wontfix} />
        </div>

        {/* 我的订单:五入口 + 退换状态条 + 待付款卡 */}
        <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-center pb-2">
            <span className="min-w-0 flex-1 text-[15px] font-bold text-[var(--app-text)]">{S.meOrderSection}</span>
            <button
              {...bindTap('me.main.orders.open', { params: { tab: 'all' } })}
              className="flex shrink-0 cursor-pointer items-center border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
            >
              {S.viewAll}
              <IcChevronRight size={12} />
            </button>
          </div>

          <div className="flex">
            <button
              {...bindTap('me.main.ordersPendingPay.open', { params: { tab: 'pendingPay' } })}
              className="relative flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent p-0"
            >
              <IcWallet size={22} className="text-[var(--app-primary)]" />
              <span className="mt-1 text-[11px] text-[var(--app-text-muted)]">{S.meOrderPendingPay}</span>
              {pendingPay.length > 0 && <Badge n={pendingPay.length} />}
            </button>
            <button
              {...bindTap('me.main.ordersAwaitShip.open', { params: { tab: 'awaitShip' } })}
              className="relative flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent p-0"
            >
              <IcTruck size={22} className="text-[var(--app-primary)]" />
              <span className="mt-1 text-[11px] text-[var(--app-text-muted)]">{S.meOrderAwaitShip}</span>
              {awaitShip.length > 0 && <Badge n={awaitShip.length} />}
            </button>
            <button
              {...bindTap('me.main.ordersToReview.open', { params: { tab: 'toReview' } })}
              className="relative flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent p-0"
            >
              <IcStar size={22} className="text-[var(--app-primary)]" />
              <span className="mt-1 text-[11px] text-[var(--app-text-muted)]">{S.meOrderToReview}</span>
              {toReview.length > 0 && <Badge n={toReview.length} />}
            </button>
            <button
              {...bindTap('me.main.aftersale.open')}
              className="relative flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent p-0"
            >
              <IcRefresh size={22} className="text-[var(--app-primary)]" />
              <span className="mt-1 text-[11px] text-[var(--app-text-muted)]">{S.meAftersale}</span>
              {refundCount > 0 && <Badge n={refundCount} />}
            </button>
            <button
              {...bindTap('me.main.invoice.open')}
              className="relative flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent p-0"
            >
              <IcInvoice size={22} className="text-[var(--app-primary)]" />
              <span className="mt-1 text-[11px] text-[var(--app-text-muted)]">{S.meInvoice}</span>
            </button>
          </div>

          {/* 有售后单时的「退换状态:审核中」提示条(frame:r2@31.2) */}
          {refundCount > 0 && (
            <div className="mt-2.5 rounded-lg bg-[var(--app-c-chip-bg)] px-2.5 py-1.5 text-[11px] text-[var(--app-text-muted)]">
              {S.meRefundReviewing}
            </div>
          )}

          {payCard && (
            <div className="mt-2.5 rounded-xl bg-[#FFF7F0] p-2.5">
              <div className="pb-1.5 text-[12px] font-bold text-[var(--app-primary)]">{S.mePendingPayCard}</div>
              <div className="flex items-center gap-2">
                <button
                  {...bindTap('me.main.orderDetail.open', { params: { orderId: payCard.id } })}
                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
                >
                  <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--app-surface)]">
                    {payCardProduct && <Img src={payCardProduct.image} className="h-full w-full object-contain" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">
                      {payCardProduct?.title ?? ''}
                    </span>
                    <span className="mt-0.5 block text-[14px] font-bold text-[var(--app-c-danger)]">
                      <span className="text-[10px]">¥</span>
                      {payCard.amount}
                    </span>
                  </span>
                </button>
                <button
                  {...bindTap('me.main.payNow.open', {
                    params: { orderId: payCard.id },
                    onTrigger: () =>
                      launchGatewayPay(payCard, () => {
                        paySuccess(payCard.id);
                        go('me.main.payNow.open', { orderId: payCard.id });
                      }),
                  })}
                  className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-4 py-1.5 text-[12px] font-bold text-white"
                >
                  {S.payNow}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 服务提醒:任性付 */}
        <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="pb-2 text-[15px] font-bold text-[var(--app-text)]">{S.meServiceRemind}</div>
          <button
            {...action('me.main.wontfix.toast', wontfix)}
            className="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
          >
            <IcPiggy size={20} className="shrink-0 text-[var(--app-primary)]" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] text-[var(--app-text)]">{S.meRenxingfu}</span>
              <span className="mt-0.5 block text-[11px] text-[var(--app-c-text-muted)]">{S.meRenxingfuDesc}</span>
            </span>
            <span className="shrink-0 rounded-full bg-[#FFF3E8] px-2.5 py-1 text-[11px] text-[var(--app-primary)]">
              {S.meActivate}
            </span>
          </button>
        </div>

        {/* 功能宫格:红包卡券真跳转;其余 toast */}
        <div className="mt-2 grid grid-cols-5 rounded-xl bg-[var(--app-surface)] py-3">
          <GridCell label={S.meGridSign} onTap={wontfix}>
            <IcSign size={22} className="text-[var(--app-primary)]" />
          </GridCell>
          <GridCell label={S.meGridCoupon} onTap={wontfix} toCoupons>
            <IcTicket size={22} className="text-[var(--app-primary)]" />
          </GridCell>
          <GridCell label={S.meGridBooking} onTap={wontfix}>
            <IcCalendar size={22} className="text-[var(--app-primary)]" />
          </GridCell>
          <GridCell label={S.meGridService} onTap={wontfix}>
            <IcService size={22} className="text-[var(--app-primary)]" />
          </GridCell>
          <GridCell label={S.meGridGovSubsidy} onTap={wontfix}>
            <IcGov size={22} className="text-[var(--app-primary)]" />
          </GridCell>
        </div>

        {/* 我的订阅(金融资产):静态展示,整组一致 toast */}
        <div className="mt-2 rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-center pb-2">
            <span className="min-w-0 flex-1 text-[15px] font-bold text-[var(--app-text)]">{S.meSubscribeTitle}</span>
            <span className="shrink-0 text-[11px] text-[var(--app-c-text-muted)]">{S.meSubscribeDesc}</span>
          </div>
          <div className="grid grid-cols-4">
            <FinanceCell label={S.meFinanceNewUser} value="88" unit={S.meFinanceUnit} onTap={wontfix} />
            <FinanceCell label={S.meRenxingfu} value="3000" unit={S.meFinanceUnit} onTap={wontfix} />
            <FinanceCell label={S.meFinanceRenxingdai} value="20000" unit={S.meFinanceUnit} onTap={wontfix} />
            <FinanceCell label={S.meFinanceLingqianbao} value="0.00" unit={S.meFinanceUnit} onTap={wontfix} />
          </div>
        </div>

        {/* 精选好物双列 */}
        <div className="mt-2">
          <div className="py-2 text-center text-[14px] font-bold text-[var(--app-text)]">{S.pickGoods}</div>
          <div className="grid grid-cols-2 gap-2">
            {picks.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
                <button
                  {...bindTap('me.main.productDetail.open', { params: { productId: p.id } })}
                  className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
                >
                  <span className="block aspect-square w-full bg-[var(--app-c-chip-bg)]">
                    <Img src={p.image} className="h-full w-full object-contain" />
                  </span>
                  <span className="block px-2 pt-2">
                    <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">{p.title}</span>
                  </span>
                </button>
                <div className="flex items-center px-2 pb-2 pt-1">
                  <span className="min-w-0 flex-1 text-[15px] font-bold text-[var(--app-c-danger)]">
                    <span className="text-[10px]">¥</span>
                    {p.price}
                  </span>
                  <span className="shrink-0 rounded-full bg-[#FFF3E8] p-1 text-[var(--app-primary)]">
                    <IcPlus size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ n }: { n: number }) {
  return (
    <span className="absolute -top-1 left-[54%] min-w-[15px] rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[9px] leading-[15px] text-white">
      {n}
    </span>
  );
}

function IconBtn({ label, onTap, children }: { label: string; onTap: () => void; children: React.ReactNode }) {
  const { action } = useSuningGestures();
  return (
    <button
      {...action('me.main.wontfix.toast', onTap)}
      className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 py-0.5 text-white"
    >
      {children}
      {label && <span className="mt-0.5 text-[9px] leading-none">{label}</span>}
    </button>
  );
}

function ActCell({ title, desc, onTap }: { title: string; desc: string; onTap: () => void }) {
  const { action } = useSuningGestures();
  return (
    <button
      {...action('me.main.wontfix.toast', onTap)}
      className="min-w-0 flex-1 cursor-pointer rounded-xl border-none bg-[var(--app-surface)] px-2 py-2 text-left"
    >
      <span className="block truncate text-[12px] font-bold text-[var(--app-text)]">{title}</span>
      <span className="mt-0.5 block truncate text-[10px] text-[var(--app-primary)]">{desc}</span>
    </button>
  );
}

function DataCell({
  value,
  label,
  onTap,
  toFollow = false,
  toHistory = false,
}: {
  value: number;
  label: string;
  onTap: () => void;
  toFollow?: boolean;
  toHistory?: boolean;
}) {
  const { action, bindTap } = useSuningGestures();
  const bind = toFollow
    ? bindTap('me.main.follow.open')
    : toHistory
      ? bindTap('me.main.history.open')
      : action('me.main.wontfix.toast', onTap);
  return (
    <button
      {...bind}
      className="flex flex-1 cursor-pointer flex-col items-center border-none bg-transparent p-0"
    >
      <span className="text-[16px] font-bold text-[var(--app-text)]">{value}</span>
      <span className="mt-0.5 text-[11px] text-[var(--app-text-muted)]">{label}</span>
    </button>
  );
}

function GridCell({
  label,
  onTap,
  children,
  toCoupons = false,
}: {
  label: string;
  onTap: () => void;
  children: React.ReactNode;
  toCoupons?: boolean;
}) {
  const { action, bindTap } = useSuningGestures();
  return (
    <button
      {...(toCoupons ? bindTap('me.main.coupons.open') : action('me.main.wontfix.toast', onTap))}
      className="flex cursor-pointer flex-col items-center border-none bg-transparent p-0"
    >
      {children}
      <span className="mt-1 line-clamp-1 px-0.5 text-[10px] text-[var(--app-text-muted)]">{label}</span>
    </button>
  );
}

function FinanceCell({
  label,
  value,
  unit,
  onTap,
}: {
  label: string;
  value: string;
  unit: string;
  onTap: () => void;
}) {
  const { action } = useSuningGestures();
  return (
    <button
      {...action('me.main.wontfix.toast', onTap)}
      className="flex cursor-pointer flex-col items-center border-none bg-transparent p-0"
    >
      <span className="text-[14px] font-bold text-[var(--app-text)]">
        {value}
        <span className="ml-0.5 text-[9px] font-normal text-[var(--app-c-text-muted)]">{unit}</span>
      </span>
      <span className="mt-0.5 line-clamp-1 px-0.5 text-[10px] text-[var(--app-text-muted)]">{label}</span>
    </button>
  );
}
