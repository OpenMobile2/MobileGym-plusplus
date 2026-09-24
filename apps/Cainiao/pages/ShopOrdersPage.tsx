import React, { useState } from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useLocation, useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import TopBar from '../components/TopBar';
import { ConfirmDialog } from '../components/Sheet';
import { IcSearch } from '../res/icons';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { useI18n } from '../i18n';

const TABS = ['全部', '待付款', '待发货', '待收货', '待评价'] as const;

/** 购物订单列表(spec me.shoporders,s161):仅列表+查看物流;确认收货带确认弹窗(Q19) */
export default function ShopOrdersPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action, back } = useCainiaoGestures();
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>('全部');
  const [q, setQ] = useState('');
  const [sp] = useSearchParams();
  const { search } = useLocation();
  const showReceipt = new URLSearchParams(search).get('dialog') === 'confirmReceipt';
  const receiptOrderId = sp.get('orderId');

  const orders = useCainiaoStore((s) => s.shopOrders);
  const confirmReceipt = useCainiaoStore((s) => s.confirmReceipt);
  const showToast = useCainiaoStore((s) => s.showToast);
  const wontfix = () => showToast(t('common.notOpen'));

  const kw = q.trim();
  const list = orders.filter((o) => {
    const okTab =
      tab === '全部' ? true
        : tab === '待收货' ? o.status === '卖家已发货'
          : tab === '待评价' ? o.status === '交易成功'
            : o.status === tab;
    if (!okTab) return false;
    if (kw && !(o.shop.includes(kw) || o.itemTitle.includes(kw))) return false;
    return true;
  });

  const actionsOf = (status: string) =>
    status === '卖家已发货' ? ['延长收货', '查看物流', '确认收货'] : ['申请开票', '查看物流', '评价'];

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title="订单列表" />
      {/* 搜索(阶段⑥反馈#14:真实搜索店铺名/商品名) */}
      <div className="bg-(--app-c-page-bg) px-3 py-2">
        <div className="flex h-10 w-full items-center rounded-full bg-(--app-c-card-bg) px-3">
          <IcSearch size={16} className="text-(--app-c-text-muted)" />
          <input
            data-action="me.shoporders.search.input"
            data-action-type="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索全部订单"
            className="ml-2 min-w-0 flex-1 border-none bg-transparent text-[13px] text-(--app-c-text-primary) outline-none placeholder:text-(--app-c-text-muted)"
          />
          <span className="rounded-full bg-[#FF7A00] px-4 py-1.5 text-[13px] font-semibold text-white">搜索</span>
        </div>
      </div>
      {/* Tab */}
      <div className="flex bg-(--app-c-card-bg)">
        {TABS.map((tb) => (
          <button
            key={tb}
            {...action('me.shoporders.select.tab', () => setTab(tb), { params: { value: tb } })}
            className={`flex-1 cursor-pointer border-none bg-transparent py-2.5 text-center text-[15px] ${
              tab === tb ? 'font-bold text-(--app-c-text-primary) underline decoration-[#FF7A00] decoration-2 underline-offset-8' : 'text-(--app-c-text-secondary)'
            }`}
          >
            {tb}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 && <div className="py-12 text-center text-[13px] text-(--app-c-text-muted)">{t('common.empty')}</div>}
        {list.map((o) => (
          <div key={o.id} className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3.5">
            <div className="flex items-center">
              <span className="rounded bg-[#FF5000] px-1 text-[10px] font-bold text-white">天猫</span>
              <button {...action('me.shoporders.misc.wontfixToast', wontfix)} className="ml-1.5 cursor-pointer border-none bg-transparent text-[15px] font-bold text-(--app-c-text-primary)">
                {o.shop} ›
              </button>
              <span className="ml-auto text-[14px] font-semibold text-[#FF7A00]">{o.status}</span>
            </div>
            <div className="mt-2.5 flex gap-2.5">
              <Img src={o.image} className="h-20 w-20 shrink-0 rounded-xl border border-(--app-c-divider) object-cover" />
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[14px] leading-5 text-(--app-c-text-primary)">{o.itemTitle}</div>
                <div className="mt-1 flex gap-1 text-[11px] text-[#FF7A00]">
                  <span>7天价保</span><span>破损包退</span><span>极速退款</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-[15px] font-bold text-(--app-c-text-primary)">¥{o.paidYuan.toFixed(2)}</div>
                <div className="text-[12px] text-(--app-c-text-muted)">×1</div>
              </div>
            </div>
            <div className="mt-2 text-right text-[13px] text-(--app-c-text-primary)">
              实付款 <span className="text-[17px] font-bold">¥{o.paidYuan.toFixed(2)}</span>
            </div>
            <div className="mt-2.5 flex items-center gap-2 border-t border-(--app-c-divider) pt-2.5">
              <button {...action('me.shoporders.misc.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-secondary)">
                更多
              </button>
              <div className="ml-auto flex gap-2">
                {actionsOf(o.status).map((label) => {
                  if (label === '查看物流') {
                    return (
                      <button
                        key={label}
                        {...bindTap('me.shoporders.logistics.open', { params: { packageId: o.packageId ?? '' } })}
                        className="cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-3.5 py-1.5 text-[13px] text-(--app-c-text-primary)"
                      >
                        查看物流
                      </button>
                    );
                  }
                  if (label === '确认收货') {
                    return (
                      <button
                        key={label}
                        {...bindTap('me.shoporders.confirm.open', { params: { orderId: o.id } })}
                        className="cursor-pointer rounded-full border border-[#FF7A00] bg-[#FFF4E8] px-3.5 py-1.5 text-[13px] font-semibold text-[#FF7A00]"
                      >
                        确认收货
                      </button>
                    );
                  }
                  return (
                    <button
                      key={label}
                      {...action('me.shoporders.misc.wontfixToast', wontfix)}
                      className="cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-3.5 py-1.5 text-[13px] text-(--app-c-text-primary)"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showReceipt && (
        <ConfirmDialog
          text="确认已收到货?"
          subText="确认后订单将变为交易成功"
          confirmLabel="确认"
          confirmBinding={action('me.shoporders.confirmReceipt.confirm', () => {
            if (receiptOrderId) confirmReceipt(receiptOrderId);
            back();
          })}
        />
      )}
    </div>
  );
}
