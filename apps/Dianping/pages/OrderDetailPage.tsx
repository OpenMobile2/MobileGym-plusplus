import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcHeadset, IcMapMini, IcComment, IcChevronRight } from '../res/icons';
import { shopCoverUrl } from '../assets';

function FakeBarcode() {
  const bars = Array.from({ length: 34 }, (_, i) => (i * 37) % 5 < 2);
  return (
    <div className="flex h-[64px] items-stretch gap-[2px]">
      {bars.map((wide, i) => (
        <span key={i} style={{ width: wide ? 3 : 1.5, background: '#111' }} />
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const order = useDianpingStore((st) => st.orders.find((o) => o.id === orderId));
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === order?.shopId));
  const completeRefund = useDianpingStore((st) => st.completeRefund);
  const showToast = useDianpingStore((st) => st.showToast);

  useEffect(() => {
    if (order?.status === 'refunding') {
      const t = setTimeout(() => completeRefund(order.id), 800);
      return () => clearTimeout(t);
    }
  }, [order?.status, order?.id, completeRefund]);

  if (!order) {
    return (
      <div className="p-4 pt-10">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  const usable = order.status === 'usable';
  const refunding = order.status === 'refunding';
  const refunded = order.status === 'refunded';
  const statusTitle = usable
    ? '待到店使用'
    : refunding
      ? s.orderRefunding
      : refunded
        ? s.orderRefunded
        : order.status === 'used'
          ? s.orderUsed
          : order.status;
  const codeStatus = usable ? '待使用' : refunding ? s.orderRefunding : refunded ? s.orderRefunded : s.orderUsed;
  const codeFmt = order.code.replace(/(\d{4})(?=\d)/g, '$1 ');

  return (
    <div className="flex h-full flex-col bg-(--app-c-page-bg)" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center bg-(--app-c-page-bg) px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <button
          type="button"
          className="absolute right-3 border-none bg-transparent p-1 text-(--app-c-text-primary) cursor-pointer"
          {...action('order.cs.open.disabled', () => showToast(s.notOpen))}
        >
          <IcHeadset size={20} />
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto pb-4"
        data-scroll-container="order-detail"
        data-scroll-direction="vertical"
      >
        {/* 状态标题 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 text-[22px] font-black text-(--app-c-text-primary)">
            <span className="text-[#FF6633]">◷</span>
            {statusTitle}
          </div>
          {usable ? (
            <div className="mt-1 text-[13px] text-(--app-c-text-muted)">请在有效期内到店消费</div>
          ) : null}
        </div>

        {/* 券主体卡 */}
        <div className="mx-3 rounded-[12px] bg-(--app-c-card-bg) p-3">
          <div className="flex items-center gap-2.5 border-b border-[#F5F5F5] pb-3">
            <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: order.coverColor }}>
              {shopCoverUrl(order.shopId) ? <img src={shopCoverUrl(order.shopId)} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-semibold text-(--app-c-text-primary)">{order.dealTitle}</div>
              <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">随时退 · 过期自动退 · 免预约</div>
            </div>
            <div className="text-right">
              <div className="text-[14px] font-bold text-[#FF6633]">¥{order.payAmount}</div>
              <div className="text-[11px] text-(--app-c-text-muted)">x{order.qty}</div>
            </div>
          </div>

          {/* 条码 + 券码 */}
          <div className="flex flex-col items-center py-4">
            <FakeBarcode />
            <div className="mt-2 font-mono text-[20px] font-bold tracking-[3px] text-(--app-c-text-primary)">{codeFmt}</div>
            <div className="mt-1 text-[12px] text-(--app-c-text-muted)">到店向商家出示此券码核销</div>
          </div>

          <div className="flex items-center justify-between border-t border-[#F5F5F5] pt-3">
            <div>
              <div className="text-[14px] font-bold text-(--app-c-text-primary)">待使用券码 1 张</div>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-(--app-c-text-primary)">
                · {codeFmt}
                <button
                  type="button"
                  className="rounded border-none bg-[#F0F0F0] px-1.5 py-0.5 text-[11px] text-(--app-c-text-secondary) cursor-pointer"
                  {...action('order.code.copy.action', () => {
                    const clipboard = window.__OS__?.clipboard;
                    if (!clipboard) {
                      showToast(s.notOpen);
                      return;
                    }
                    clipboard.copyText(codeFmt, 'dianping');
                    showToast('券码已复制');
                  })}
                >
                  复制
                </button>
              </div>
            </div>
            {usable ? (
              <button
                type="button"
                className="rounded-full border border-[#DDD] bg-(--app-c-card-bg) px-3 py-1.5 text-[12px] text-(--app-c-text-secondary) cursor-pointer"
                {...bindTap('order.refund-open', { params: { orderId: order.id } })}
              >
                {s.applyRefund}
              </button>
            ) : (
              <span className="text-[13px] text-[#FF6633]">{codeStatus}</span>
            )}
          </div>
        </div>

        {/* 商户卡 */}
        {shop ? (
          <div className="mx-3 mt-2 flex items-center gap-2 rounded-[12px] bg-(--app-c-card-bg) p-3">
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold text-(--app-c-text-primary)">{shop.name}</div>
              <div className="mt-1 text-[12px] text-(--app-c-text-muted)">{shop.address}</div>
              <div className="mt-0.5 text-[12px] text-(--app-c-text-muted)">距你 {(shop.distanceM / 1000).toFixed(1)}km</div>
            </div>
            <div className="flex shrink-0 gap-3">
              <button
                type="button"
                className="flex flex-col items-center gap-0.5 border-none bg-transparent text-[10px] text-(--app-c-text-secondary) cursor-pointer"
                {...action('order.cs.open.disabled', () => showToast(s.notOpen))}
              >
                <IcMapMini size={18} className="text-[#FF6633]" />
                导航
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-0.5 border-none bg-transparent text-[10px] text-(--app-c-text-secondary) cursor-pointer"
                {...action('order.cs.open.disabled', () => showToast(s.notOpen))}
              >
                <IcComment size={18} className="text-[#FF6633]" />
                联系商家
              </button>
            </div>
          </div>
        ) : null}

        {/* 使用须知 */}
        <div className="mx-3 mt-2 rounded-[12px] bg-(--app-c-card-bg) p-3">
          <div className="mb-1 text-[15px] font-bold text-(--app-c-text-primary)">使用须知</div>
          {[
            ['有效期', '购买之后60天有效'],
            ['使用时间', '营业时间内可用'],
            ['适用范围', '仅适用于铁盘，红盘，黄盘，绿盘'],
            ['适用规则', '本单发票由商家提供，仅限堂食'],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-3 border-b border-[#F5F5F5] py-2 text-[13px] last:border-none">
              <span className="w-16 shrink-0 text-(--app-c-text-muted)">{k}</span>
              <span className="text-(--app-c-text-primary)">{v}</span>
            </div>
          ))}
        </div>

        {/* 订单信息 */}
        <div className="mx-3 mt-2 rounded-[12px] bg-(--app-c-card-bg) p-3">
          <div className="mb-1 text-[15px] font-bold text-(--app-c-text-primary)">订单信息</div>
          {[
            ['订单号', order.code + '095461'],
            ['实付金额', `¥${order.payAmount}`],
            ['交易方式', '微信支付'],
            ['退款原因', order.refundReason || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-[#F5F5F5] py-2 text-[13px] last:border-none">
              <span className="text-(--app-c-text-muted)">{k}</span>
              <span className="flex items-center gap-1 text-(--app-c-text-primary)">
                {v}
                {k === '订单号' ? <IcChevronRight size={11} className="text-[#CCC]" /> : null}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
