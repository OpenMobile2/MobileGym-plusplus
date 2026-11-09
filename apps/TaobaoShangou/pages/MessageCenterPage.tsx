import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, fmtTime, showToast } from '../components/common';
import { IcRight, IcSettings, IcTrash, IcClose } from '../res/icons';
import { useStatusBarBg } from '../statusbar';

/** 消息中心 tab(spec message.center,证据 IMG_6027) */
export default function MessageCenterPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();

  useStatusBarBg('#ffffff');
  const messages = useTbsgStore((st) => st.messages);
  const shops = useTbsgStore((st) => st.shops);
  const markAllRead = useTbsgStore((st) => st.markAllRead);
  const markMessageRead = useTbsgStore((st) => st.markMessageRead);
  const dismissBanner = useTbsgStore((st) => st.dismissBanner);

  const banners = messages.filter((m) => m.kind === 'banner');
  const notices = messages.filter((m) => m.kind === 'notice');
  const convs = messages.filter((m) => m.kind === 'rider' || m.kind === 'shop');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 大标题 + 清扫/设置 */}
      <div className="flex items-center px-4 pt-2 pb-1 shrink-0">
        <span className="text-[24px] font-bold text-[#1A1A1A]">{s.messagesTitle}</span>
        <div className="flex-1" />
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'message.clean.all' },
            { onTrigger: () => { markAllRead(); showToast('已全部已读'); } },
          )}
          aria-label="清扫"
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
        >
          <IcTrash size={20} className="text-[#1A1A1A]" />
        </button>
        <button
          {...bindTap<HTMLButtonElement>('message.settings-open')}
          aria-label="消息设置"
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
        >
          <IcSettings size={20} className="text-[#1A1A1A]" />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        {/* 平台消息 */}
        <div className="flex items-center px-4 pt-2 pb-1">
          <span className="text-[17px] font-semibold text-[#1A1A1A]">平台消息</span>
          <div className="flex-1" />
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'message.viewall.stub' },
              { onTrigger: () => showToast(s.notOpen) },
            )}
            className="flex items-center text-[13px] text-[#666666] bg-transparent border-none cursor-pointer"
          >
            {s.viewAll}
            <IcRight size={13} />
          </button>
        </div>

        {/* 推广横幅(可关) */}
        {banners.map((m) => (
          <div
            key={m.id}
            className="flex items-center px-4 py-3"
            style={{ background: 'linear-gradient(90deg,#CBBDF5 0%,#E4DBFA 60%,#EFEAFC 100%)' }}
          >
            <AppImg src="/@app-assets/TaobaoShangou/banners/banner_redpacket.jpg" className="w-13 h-13 rounded-xl object-cover shrink-0" />
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-[16px] font-bold text-[#1A1A1A] truncate">{m.title}</div>
              <div className="text-[13px] text-[#555555] mt-0.5">真的很哇塞😄</div>
            </div>
            <button
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'message.banner.close' },
                { onTrigger: () => dismissBanner(m.id) },
              )}
              aria-label="关闭横幅"
              className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            >
              <IcClose size={18} className="text-[#666666]" />
            </button>
          </div>
        ))}

        {/* 平台通知行 */}
        {notices.map((m) => (
          <div
            key={m.id}
            {...bindTap<HTMLDivElement>('message.order-open', { params: { orderId: m.orderId ?? '' } })}
            className="flex items-start px-4 py-3 cursor-pointer"
          >
            <span
              className={`w-13 h-13 rounded-xl flex items-center justify-center text-[24px] shrink-0 ${
                m.icon === 'delivered' ? 'bg-[#E4F5E7]' : 'bg-[#FCF0D8]'
              }`}
            >
              {m.icon === 'delivered' ? '🛵' : '📢'}
            </span>
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-[16px] font-semibold text-[#1A1A1A] truncate">{m.title}</div>
              <div className="text-[13px] text-[#999999] mt-0.5 truncate">{m.sub}</div>
            </div>
            {m.ts != null && <span className="text-[12px] text-[#BBBBBB] ml-2 shrink-0">{fmtTime(m.ts)}</span>}
          </div>
        ))}

        {/* 全部消息 */}
        <div className="px-4 pt-4 pb-1">
          <span className="text-[17px] font-semibold text-[#1A1A1A]">全部消息</span>
        </div>
        {convs.map((m) => {
          if (m.kind === 'rider') {
            return (
              <div
                key={m.id}
                {...bindTap<HTMLDivElement>('message.rider-open', { params: { orderId: m.orderId ?? '' }, beforeTrigger: () => markMessageRead(m.id) })}
                className="flex items-start px-4 py-3 cursor-pointer"
              >
                <span className="relative shrink-0">
                  <AppImg src="/@app-assets/TaobaoShangou/avatars/rider.jpg" className="w-13 h-13 rounded-full object-cover" />
                  {(m.unread ?? 0) > 0 && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#F53F3F]" />}
                </span>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-[16px] font-semibold text-[#1A1A1A] truncate">{m.title}</div>
                  <div className="text-[13px] text-[#999999] mt-0.5 truncate">{m.sub}</div>
                </div>
                {m.ts != null && <span className="text-[12px] text-[#BBBBBB] ml-2 shrink-0">{fmtTime(m.ts)}</span>}
              </div>
            );
          }
          const shop = shops.find((x) => x.id === m.shopId);
          return (
            <div
              key={m.id}
              {...bindTap<HTMLDivElement>('message.shop-open', { params: { shopId: m.shopId ?? '' }, beforeTrigger: () => markMessageRead(m.id) })}
              className="flex items-start px-4 py-3 cursor-pointer"
            >
              <span className="relative shrink-0">
                <AppImg src={shop?.logo ?? ''} className="w-13 h-13 rounded-xl object-cover" />
                {(m.unread ?? 0) > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#F53F3F] text-white text-[10px] font-semibold flex items-center justify-center">
                    {m.unread}
                  </span>
                )}
              </span>
              <div className="ml-3 flex-1 min-w-0">
                <div className="text-[16px] font-semibold text-[#1A1A1A] truncate">{m.title}</div>
                <div className="text-[13px] text-[#999999] mt-0.5 truncate">{m.sub}</div>
              </div>
              {m.ts != null && <span className="text-[12px] text-[#BBBBBB] ml-2 shrink-0">{fmtTime(m.ts)}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
