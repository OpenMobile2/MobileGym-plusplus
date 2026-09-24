import React from 'react';
import Img from '../components/Img';
import { IcNavBack, IcBrush, IcUser, IcGear, IcTruck, IcBell, IcSmile, IcService } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { fmtMdHm } from '../utils/appTime';
import type { RuntimeMessageEntry } from '../types';

const EMPTY_LION = '/@app-assets/Suning/me/empty-lion-cry.png';

/**
 * 消息中心(spec msg.center,s301)。
 * 三频道入口卡:未读红点 + 最新一条摘要行;交易物流摘要行 → order.detail(v1.8.0 补漏)。
 * 频道页 / 消息设置已补回真跳转。
 */
export default function MsgCenterPage() {
  const { action, bindTap, bindBack } = useSuningGestures();
  const S = useStrings();

  const transMsgs = useSuningStore((s) => s.transMsgs);
  const unread = useSuningStore((s) => s.unread);
  const markAllRead = useSuningStore((s) => s.markAllRead);
  const showToast = useSuningStore((s) => s.showToast);

  const wontfix = () => showToast(S.toastNotOpen);
  const latestOf = (channel: RuntimeMessageEntry['channel']) =>
    transMsgs.filter((m) => m.channel === channel).sort((a, b) => b.ts - a.ts)[0] ?? null;
  const isEmpty = transMsgs.length === 0;

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶栏:返回 + 消息 + 清空 + 人形 + 设置 */}
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-[16px] font-bold text-[var(--app-text)]">{S.msgCenterTitle}</span>
        <button
          {...action('msg.center.clear.run', () => {
            markAllRead();
            showToast(S.toastAllRead);
          })}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcBrush size={19} />
        </button>
        <button
          {...action('msg.center.wontfix.toast', wontfix)}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcUser size={19} />
        </button>
        <button
          {...bindTap('msg.center.settings.open')}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcGear size={19} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="rounded-xl bg-[var(--app-surface)] px-3">
          <ChannelRow
            icon={<IcTruck size={20} className="text-white" />}
            bg="from-[#FF9A4D] to-[#FD7101]"
            title={S.msgChannelTrade}
            desc={S.msgChannelTradeDesc}
            unread={unread.trade}
            latest={latestOf('trade')}
            channel="trade"
            linkTarget
          />
          <ChannelRow
            icon={<IcBell size={20} className="text-white" />}
            bg="from-[#6E9BF7] to-[#4666E8]"
            title={S.msgChannelNotice}
            desc={S.msgChannelNoticeDesc}
            unread={unread.notice}
            latest={latestOf('notice')}
            channel="notice"
          />
          <ChannelRow
            icon={<IcSmile size={20} className="text-white" />}
            bg="from-[#5ECC62] to-[#2FA742]"
            title={S.msgChannelInteract}
            desc={S.msgChannelInteractDesc}
            unread={unread.interact}
            latest={latestOf('interact')}
            channel="interact"
          />
        </div>

        {isEmpty && (
          <div className="flex flex-col items-center py-16">
            <span className="h-24 w-24 overflow-hidden">
              <Img src={EMPTY_LION} className="h-full w-full object-contain" />
            </span>
            <span className="mt-2 text-[14px] text-[var(--app-text-muted)]">{S.emptyNoData}</span>
            <span className="mt-1 text-[12px] text-[var(--app-c-text-muted)]">{S.msgEmptyDesc}</span>
          </div>
        )}
      </div>

      {/* 右下蓝色浮标(客服入口,spec 标 wontfix) */}
      <button
        {...action('msg.center.wontfix.toast', wontfix)}
        className="absolute bottom-6 right-4 cursor-pointer rounded-full border-none bg-gradient-to-br from-[#4FA8F5] to-[#2E7CE8] p-3 text-white shadow-lg"
      >
        <IcService size={20} />
      </button>
    </div>
  );
}

/**
 * 频道入口卡:卡头(→ msg.channel)与摘要行是**兄弟节点**而非嵌套,
 * 避免同一 gesture 上既挂 action 又挂 transition。
 */
function ChannelRow({
  icon,
  bg,
  title,
  desc,
  unread,
  latest,
  channel,
  linkTarget = false,
}: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  desc: string;
  unread: number;
  latest: RuntimeMessageEntry | null;
  channel: 'trade' | 'notice' | 'interact';
  linkTarget?: boolean;
}) {
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  const readChannel = useSuningStore((s) => s.readChannel);
  // 进频道即置该频道已读:红点/角标随 store 更新(走查 0813 反馈①)
  const channelBind =
    channel === 'trade'
      ? bindTap('msg.center.trade.open', { params: { channel: 'trade' }, beforeTrigger: () => readChannel('trade') })
      : channel === 'notice'
        ? bindTap('msg.center.notice.open', { params: { channel: 'notice' }, beforeTrigger: () => readChannel('notice') })
        : bindTap('msg.center.interact.open', { params: { channel: 'interact' }, beforeTrigger: () => readChannel('interact') });

  return (
    <div className="border-b border-[var(--app-border)] py-3 last:border-b-0">
      <button
        {...channelBind}
        className="flex w-full cursor-pointer items-center gap-2.5 border-none bg-transparent p-0 text-left"
      >
        <span className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${bg}`}>
          {icon}
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[var(--app-c-danger)]" />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-bold text-[var(--app-text)]">{title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[var(--app-c-text-muted)]">{desc}</span>
        </span>
        {unread > 0 && (
          <span className="shrink-0 rounded-full bg-[var(--app-c-danger)] px-1.5 text-[10px] leading-4 text-white">{unread}</span>
        )}
      </button>

      {latest == null ? (
        <div className="mt-2 rounded-lg bg-[var(--app-c-chip-bg)] px-2.5 py-2 text-[11px] text-[var(--app-c-text-muted)]">{S.msgChannelEmpty}</div>
      ) : linkTarget && latest.orderId ? (
        <button
          {...bindTap('msg.center.tradeMsg.open', {
            params: { orderId: latest.orderId },
            beforeTrigger: () => readChannel('trade'),
          })}
          className="mt-2 flex w-full cursor-pointer items-center gap-2 rounded-lg border-none bg-[var(--app-c-chip-bg)] px-2.5 py-2 text-left"
        >
          <SummaryBody msg={latest} />
        </button>
      ) : (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-[var(--app-c-chip-bg)] px-2.5 py-2">
          <SummaryBody msg={latest} />
        </div>
      )}
    </div>
  );
}

function SummaryBody({ msg }: { msg: RuntimeMessageEntry }) {
  return (
    <>
      {msg.image && (
        <span className="h-9 w-9 shrink-0 overflow-hidden rounded bg-[var(--app-surface)]">
          <Img src={msg.image} className="h-full w-full object-contain" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-bold text-[var(--app-text)]">{msg.title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-[var(--app-c-text-muted)]">{msg.desc}</span>
      </span>
      <span className="shrink-0 text-[10px] text-[var(--app-c-text-muted)]">{fmtMdHm(msg.ts)}</span>
    </>
  );
}
