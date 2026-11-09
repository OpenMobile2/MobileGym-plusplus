import React from 'react';
import { useDarkMode } from '../../../os/hooks/useDarkMode';
import { useLocation, useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import TopBar from '../components/TopBar';
import { ConfirmDialog } from '../components/Sheet';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';
import { fmtFull } from '../utils/appTime';
import { copyToClipboard } from '../utils/clipboard';
import { useI18n } from '../i18n';
import type { ShipOrderStatus } from '../types';

const TAB_MATCH: Record<string, (s: ShipOrderStatus) => boolean> = {
  待寄出: (s) => s === '待上门取件' || s === '待投柜' || s === '待到店自寄',
  已寄出: (s) => s === '已寄出',
  已取消: (s) => s === '已取消',
};

/** 寄件订单列表(spec ship.orders):Tab 待寄出/已寄出/已取消(签约横幅/券包浮窗已按阶段④移除) */
export default function ShipOrdersPage() {
  const { isDark } = useDarkMode();
  const { bindTap, action, back } = useCainiaoGestures();
  const { t } = useI18n();
  const [tab, setTab] = React.useState<'待寄出' | '已寄出' | '已取消'>('待寄出');
  const [query, setQuery] = React.useState('');
  const [sp] = useSearchParams();
  const { search } = useLocation();
  const showDeleteConfirm = new URLSearchParams(search).get('dialog') === 'deleteConfirm';
  const deleteTargetId = sp.get('orderId');

  const orders = useCainiaoStore((s) => s.shipOrders);
  const deleteShipOrder = useCainiaoStore((s) => s.deleteShipOrder);
  const showToast = useCainiaoStore((s) => s.showToast);

  const keyword = query.trim();
  const list = orders.filter((o) => TAB_MATCH[tab](o.status) && (!keyword || `${o.orderNo} ${o.itemName} ${o.remark}`.includes(keyword)));
  const tabLabel = { 待寄出: t('orders.pending'), 已寄出: t('orders.shipped'), 已取消: t('orders.cancelled') };

  return (
    <div className="relative flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground={isDark ? 'light' : 'dark'}>
      <TopBar title={t('ship.title')} />
      <div className="bg-(--app-c-card-bg) px-3 pb-2">
        <input
          data-action="ship.orders.search.input"
          data-action-type="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索订单号、商品名称或备注"
          className="h-9 w-full rounded-full border-none bg-(--app-c-chip-bg) px-4 text-[14px] text-(--app-c-text-primary) outline-none placeholder:text-(--app-c-text-muted)"
        />
      </div>
      {/* Tab */}
      <div className="flex bg-(--app-c-card-bg)">
        {(['待寄出', '已寄出', '已取消'] as const).map((tb) => (
          <button
            key={tb}
            {...action('ship.orders.select.tab', () => setTab(tb), { params: { value: tb } })}
            className={`flex-1 cursor-pointer border-none bg-transparent py-3 text-center text-[16px] ${
              tab === tb ? 'font-bold text-(--app-c-brand) underline decoration-2 underline-offset-8' : 'text-(--app-c-text-primary)'
            }`}
          >
            {tabLabel[tb]}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="mt-24 flex flex-col items-center">
            <Img src="/@app-assets/Cainiao/misc/mascot_bird.png" className="h-24 w-24 object-contain opacity-80" />
            <div className="mt-3 text-[14px] text-(--app-c-text-muted)">{t('orders.empty')}</div>
          </div>
        ) : (
          <>
            {list.map((o) => (
              <div key={o.id} className="mt-3 rounded-2xl bg-(--app-c-card-bg) p-3.5">
                <div
                  {...bindTap('ship.orders.item.open', { params: { orderId: o.id } })}
                  className="cursor-pointer"
                >
                  <div className="flex items-start text-[13px] text-(--app-c-text-secondary)">
                    <div>
                      <div className="flex items-center">
                        订单号: {o.orderNo}
                        <button
                          {...action('ship.orders.copyNo', () => { copyToClipboard(o.orderNo); showToast(t('common.copied')); }, { stopPropagation: true })}
                          className="ml-1 cursor-pointer border-none bg-transparent text-[13px] text-(--app-c-text-muted)"
                        >
                          ⧉
                        </button>
                      </div>
                      <div className="mt-0.5">下单时间: {fmtFull(o.placedAtTs)}</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="text-(--app-c-text-primary)">{o.typeLabel}</div>
                      {o.shipCode && o.status !== '已取消' && (
                        <div className="mt-0.5">
                          寄件码 <span className="text-[16px] font-extrabold text-(--app-c-brand)">{o.shipCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-around pb-1">
                    <div className="text-center">
                      <div className="text-[17px] font-bold text-(--app-c-text-primary)">{o.fromName}</div>
                      <div className="text-[13px] text-(--app-c-text-muted)">{o.fromCity}</div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[14px] font-semibold text-(--app-c-text-primary)">
                        {o.status === '已取消' ? '已取消' : o.status === '已寄出' ? '已寄出' : '下单成功'}
                      </span>
                      <span className="mt-1 text-[13px] tracking-widest text-(--app-c-brand)">•••➤•••</span>
                    </div>
                    <div className="text-center">
                      <div className="text-[17px] font-bold text-(--app-c-text-primary)">{o.toName}</div>
                      <div className="text-[13px] text-(--app-c-text-muted)">{o.toCity}</div>
                    </div>
                  </div>
                  {(o.itemName || o.remark) && (
                    <div className="mt-2 border-t border-(--app-c-divider) pt-2 text-[12px] text-(--app-c-text-secondary)">
                      {o.itemName && <span>商品：{o.itemName}</span>}
                      {o.itemName && o.remark && <span className="mx-2">|</span>}
                      {o.remark && <span>备注：{o.remark}</span>}
                    </div>
                  )}
                </div>
                {(o.status === '已寄出' || o.status === '已取消') && (
                  <div className="mt-2 flex justify-end border-t border-(--app-c-divider) pt-2.5">
                    <button
                      {...bindTap('ship.orders.delete.open', { params: { orderId: o.id } })}
                      className="cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-card-bg) px-4 py-1.5 text-[13px] text-(--app-c-text-primary)"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div className="py-4 text-center text-[12px] text-(--app-c-text-muted)">展示近1年的包裹</div>
          </>
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          text="确认删除该订单?"
          subText="删除后订单记录不可恢复"
          confirmLabel="删除"
          confirmBinding={action('ship.orders.deleteConfirm.confirm', () => {
            if (deleteTargetId) deleteShipOrder(deleteTargetId);
            back();
          })}
        />
      )}
    </div>
  );
}
