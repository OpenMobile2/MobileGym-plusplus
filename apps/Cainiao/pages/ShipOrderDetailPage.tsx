import React, { useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import TopBar from '../components/TopBar';
import { IcChevronRight, IcChevronDown, IcChevronUp, IcEdit, IcClose, IcCoins, IcService, IcBox } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtFull } from '../utils/appTime';
import { copyToClipboard } from '../utils/clipboard';
import { useI18n } from '../i18n';

/** 寄件订单详情(spec ship.order.detail):waiting/lockerWaiting/stationWaiting/cancelled */
export default function ShipOrderDetailPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action } = useCainiaoGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const orderId = sp.get('orderId');
  const [expanded, setExpanded] = useState(false);

  const order = useCainiaoStore((s) =>
    (orderId ? s.shipOrders.find((o) => o.id === orderId) : undefined) ?? s.shipOrders[0],
  );
  const setAddressDraft = useCainiaoStore((s) => s.setAddressDraft);
  const enterModify = useCainiaoStore((s) => s.enterModify);
  const showToast = useCainiaoStore((s) => s.showToast);
  void setAddressDraft;

  if (!order) return null;
  const cancelled = order.status === '已取消';
  const mask = (p: string) => `${p.slice(0, 3)}****${p.slice(-4)}`;

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title={t('ship.title')} />
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 状态行 + 寄件码 */}
        <div className="mt-2 flex items-center">
          <div>
            <div className="text-[21px] font-extrabold text-(--app-c-text-primary)">{order.status} ›</div>
            {!cancelled && order.slotText && (
              <div className="mt-0.5 text-[13px] text-(--app-c-text-primary)">
                预约<span className="text-[#F5222D]">{order.slotText}</span>上门取件
              </div>
            )}
          </div>
          {!cancelled && order.shipCode && (
            <div className="ml-auto flex items-center overflow-hidden rounded-lg border border-(--app-c-brand)">
              <span className="px-2.5 py-1.5 text-[14px] text-(--app-c-text-primary)">
                寄件码 <span className="text-[20px] font-extrabold text-(--app-c-brand)">{order.shipCode}</span>
              </span>
              <button
                {...action('ship.order.copy', () => { copyToClipboard(order.shipCode ?? ''); showToast(t('common.copied')); })}
                className="cursor-pointer border-none bg-(--app-c-brand) px-3 py-2.5 text-[13px] text-white"
              >
                复制
              </button>
            </div>
          )}
        </div>

        {/* 管家条 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="flex items-center gap-2.5">
            <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="h-11 w-11 shrink-0 rounded-full bg-(--app-c-brand-soft) object-contain" />
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-bold text-(--app-c-text-primary)">菜鸟裹裹提供全程保障</div>
              <div className="text-[12px] text-(--app-c-text-muted)">
                {cancelled ? '期待再次为您服务' : '明天为您分配快递员'}
              </div>
            </div>
            {!cancelled && (
              <button
                {...action('ship.order.urge', () => showToast('已提醒快递员'))}
                className="shrink-0 cursor-pointer rounded-full border border-(--app-c-brand) bg-(--app-c-card-bg) px-3.5 py-1.5 text-[13px] text-(--app-c-brand)"
              >
                催一催
              </button>
            )}
          </div>
        </div>

        {/* 地图占位 */}
        {!cancelled && (
          <div className="relative mt-3 h-48 overflow-hidden rounded-2xl">
            <Img src="/@app-assets/Cainiao/maps/map_campus.png" className="h-full w-full object-cover" />
            <div className="absolute left-1/4 top-1/4">
              <div className="rounded-xl bg-(--app-c-brand) px-3 py-2 text-[12px] leading-4 text-white">
                嗨, 很高兴为您服务<br />我将按时上门取件
              </div>
              <Img src="/@app-assets/Cainiao/misc/courier.png" className="mt-1 h-12 w-12 rounded-full border-2 border-white bg-(--app-c-brand-soft) object-cover" />
            </div>
          </div>
        )}

        {/* 操作栏 */}
        <div className="mt-3 flex rounded-2xl bg-(--app-c-card-bg) py-3">
          {cancelled ? (
            <button {...bindTap('ship.order.service.open')} className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent">
              <IcService size={20} className="text-(--app-c-text-primary)" />
              <span className="text-[12px] text-(--app-c-text-primary)">{t('ship.service')}</span>
            </button>
          ) : (
            <>
              <button
                {...bindTap('ship.order.modify.open', {
                  params: { orderId: order.id },
                  beforeTrigger: () => enterModify(order.id),
                })}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent"
              >
                <IcEdit size={20} className="text-(--app-c-text-primary)" />
                <span className="text-[12px] text-(--app-c-text-primary)">{t('ship.modify')}</span>
              </button>
              <button {...bindTap('ship.cancel.open', { params: { orderId: order.id } })} className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent">
                <IcClose size={20} className="text-(--app-c-text-primary)" />
                <span className="text-[12px] text-(--app-c-text-primary)">{t('ship.cancelOrder')}</span>
              </button>
              <button
                {...action('ship.order.pay.toast', () => showToast('包裹揽收后才可支付运费'))}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent"
              >
                <IcCoins size={20} className="text-(--app-c-text-primary)" />
                <span className="text-[12px] text-(--app-c-text-primary)">{t('ship.pay')}</span>
              </button>
              <button {...bindTap('ship.order.service.open')} className="flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent">
                <IcService size={20} className="text-(--app-c-text-primary)" />
                <span className="text-[12px] text-(--app-c-text-primary)">{t('ship.service')}</span>
              </button>
              {order.method === 'pickup' && (
                <button {...bindTap('ship.order.handover.open')} className="relative flex flex-1 cursor-pointer flex-col items-center gap-1 border-none bg-transparent">
                  <IcBox size={20} className="text-(--app-c-text-primary)" />
                  <span className="absolute right-3 top-0 h-1.5 w-1.5 rounded-full bg-[#F5222D]" />
                  <span className="text-[12px] text-(--app-c-text-primary)">{t('ship.handover')}</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* 寄收人卡 */}
        <div className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-(--app-c-brand) text-[12px] text-white">寄</span>
            <div>
              <div className="text-[15px] font-bold text-(--app-c-text-primary)">
                {order.fromName} {mask(order.fromPhone)}{' '}
                <span className="ml-1 rounded bg-(--app-c-brand-soft) px-1 text-[11px] font-normal text-(--app-c-brand)">● 隐私保护中</span>
              </div>
              <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">{order.fromDetail ? `${order.fromDetail.slice(0, 18)}******` : `${order.fromCity}******`}</div>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-2.5 border-t border-(--app-c-divider) pt-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded bg-[#00B578] text-[12px] text-white">收</span>
            <div>
              <div className="text-[15px] font-bold text-(--app-c-text-primary)">{order.toName} {mask(order.toPhone)}</div>
              <div className="mt-0.5 text-[13px] text-(--app-c-text-secondary)">{order.toDetail.slice(0, 18)}******</div>
            </div>
          </div>
          {expanded && (
            <div className="mt-3 border-t border-(--app-c-divider) pt-3 text-[13px] leading-6 text-(--app-c-text-secondary)">
              <div className="flex">
                <span>订单编号: {order.orderNo}</span>
                <button
                  {...action('ship.order.copy', () => { copyToClipboard(order.orderNo); showToast(t('common.copied')); })}
                  className="ml-1 cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-brand)"
                >
                  复制
                </button>
              </div>
              <div>下单时间: {fmtFull(order.placedAtTs)}</div>
              <div>物品信息: {order.itemLabel}</div>
              {order.itemName && <div>商品名称: {order.itemName}</div>}
              {order.remark && <div>备注: {order.remark}</div>}
              <div>运费: ¥{order.feeYuan}</div>
              {order.cancelReason && <div>取消原因: {order.cancelReason}</div>}
            </div>
          )}
          <button
            {...action('ship.order.expand.toggle', () => setExpanded((v) => !v))}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1 border-none bg-transparent pt-1 text-[13px] text-(--app-c-text-secondary)"
          >
            {expanded ? '收起' : '展开更多'} {expanded ? <IcChevronUp size={14} /> : <IcChevronDown size={14} />}
          </button>
        </div>

        {/* 计费规则 */}
        <button
          {...bindTap('ship.order.rules.open')}
          className="mt-3 flex w-full cursor-pointer items-center rounded-2xl border-none bg-(--app-c-card-bg) p-3.5 text-[15px]"
        >
          <span className="font-semibold text-(--app-c-text-primary)">计费规则</span>
          <span className="ml-auto text-[13px] text-(--app-c-text-muted)">查看报价规则</span>
          <IcChevronRight size={15} className="text-(--app-c-text-muted)" />
        </button>
      </div>
    </div>
  );
}
