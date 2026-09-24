import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';
import { MESSAGE_SUBTABS } from '../constants';
import {
  IcService, IcDiscount, IcBell, IcShop, IcSparkles, IcArrowRight, IcAlert, IcTruck,
} from '../res/icons';

type IconType = React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;

function Row({
  Icon, iconBg, iconColor, title, preview, unread, binding,
}: {
  Icon: IconType; iconBg: string; iconColor: string; title: string; preview: string; unread?: boolean; binding: object;
}) {
  return (
    <button {...binding} className="w-full px-3 py-3 flex items-center gap-3 border-none cursor-pointer text-left bg-white border-t border-[#F5F5F5]">
      <span className="relative w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: iconBg }}>
        <Icon size={20} style={{ color: iconColor }} />
        {unread && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: VIP.red }} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold text-[#222222]">{title}</div>
        <div className="text-[12px] text-[#888888] truncate mt-0.5">{preview}</div>
      </div>
      <IcArrowRight size={16} className="text-[#CCCCCC]" />
    </button>
  );
}

export default function MessageListPage() {
  const { bindTap } = useVipshopGestures();
  const [subtab, setSubtab] = useState<string>(MESSAGE_SUBTABS[0].id);

  const chatMessages = useVipshopStore((s) => s.chatMessages);
  const orders = useVipshopStore((s) => s.orders);
  const brands = useVipshopStore((s) => s.brands);
  const subscribedBrands = useVipshopStore((s) => s.subscribedBrands);
  const lastMsg = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1].content : '您好,唯小蜜在线为您服务~';
  const brandId = subscribedBrands[0] ?? brands[0]?.id ?? '';
  const brandName = brands.find((b) => b.id === brandId)?.name ?? '品牌';
  const shipped = orders.filter((o) => o.logistics.length > 0);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="消息中心" />

      {/* 子tab(sticky):切换下方消息分类 */}
      <div className="shrink-0 sticky top-0 z-10 bg-white flex px-2 border-b border-[#F5F5F5]">
        {MESSAGE_SUBTABS.map((t) => {
          const on = t.id === subtab;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'message.subtab.select.target' }, { params: { target: t.id }, onTrigger: () => setSubtab(t.id) })}
              className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${on ? 'font-semibold' : 'text-[#666666]'}`}
              style={on ? { color: VIP.primary } : undefined}
            >
              {t.label}
              {on && <span className="block h-0.5 w-6 mx-auto mt-1 rounded-full" style={{ background: VIP.primary }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="message-list" data-scroll-direction="vertical">
        <div className="mt-2 bg-white">
          {/* 物流:发货/物流通知 → 咨询客服 */}
          {subtab === 'logistics' && (
            <>
              {shipped.length === 0 && <div className="px-3 py-8 text-center text-[13px] text-[#888888]">暂无物流消息</div>}
              {shipped.map((o) => (
                <Row
                  key={o.id}
                  Icon={IcTruck} iconBg="#EAF6FF" iconColor="#0EA5E9"
                  title={`${o.brandName} · 物流更新`}
                  preview={o.logistics[o.logistics.length - 1]?.text ?? '包裹运输中'}
                  unread={o.status === 'pendingReceipt'}
                  binding={bindTap('message.logistics-open', { params: { id: o.id } })}
                />
              ))}
              <Row Icon={IcService} iconBg="#FDECF5" iconColor={VIP.primary} title="客服消息" preview={lastMsg} unread
                binding={bindTap('message.category-open')} />
            </>
          )}

          {/* 动态:品牌动态 / 订阅上新 / 优惠促销 */}
          {subtab === 'activity' && (
            <>
              <Row Icon={IcShop} iconBg="#FDECF5" iconColor={VIP.primary} title="品牌动态"
                preview={`${brandName}发布了新一季夏日系列,点击进入品牌主页`}
                binding={bindTap('message.brand-open', { params: { id: brandId } })} />
              <Row Icon={IcSparkles} iconBg="#FDECF5" iconColor={VIP.primary} title="订阅上新"
                preview="您订阅的品牌上新啦,速来抢先看" unread
                binding={bindTap('message.subscribe-open')} />
              <Row Icon={IcDiscount} iconBg="#FFF3E8" iconColor={VIP.orange} title="优惠促销"
                preview="超级大牌日来袭,全场低至2折起" unread
                binding={bindTap('message.category-open')} />
            </>
          )}

          {/* 降价:降价提醒 / 账户通知 */}
          {subtab === 'pricedrop' && (
            <>
              <Row Icon={IcAlert} iconBg="#FFF3E8" iconColor={VIP.orange} title="降价提醒"
                preview="您关注的商品降价啦,点击查看降幅" unread
                binding={bindTap('message.pricedrop-open')} />
              <Row Icon={IcBell} iconBg="#FDECF5" iconColor={VIP.primary} title="账户通知"
                preview="您有一张全场通用券已到账,可在优惠券中查看"
                binding={bindTap('message.account-open')} />
            </>
          )}
        </div>
        <div className="h-3" />
      </div>
    </div>
  );
}
