import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcNavBack, IcGear } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { fmtMdHm } from '../utils/appTime';

const EMPTY_LION = '/@app-assets/Suning/me/empty-lion-cry.png';

type Channel = 'trade' | 'notice' | 'interact';

const asChannel = (v: string | null): Channel =>
  v === 'notice' || v === 'interact' ? v : 'trade';

/**
 * 消息频道(spec msg.channel,s303~s305 + added_2)。
 * ?channel=trade|notice|interact;各频道读 transMsgs 对应 channel。
 */
export default function MsgChannelPage() {
  const { bindTap, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const channel = asChannel(searchParams.get('channel'));

  const transMsgs = useSuningStore((s) => s.transMsgs);
  const readChannel = useSuningStore((s) => s.readChannel);

  const title =
    channel === 'trade'
      ? S.msgChannelTrade
      : channel === 'notice'
        ? S.msgChannelNotice
        : S.msgChannelInteract;

  const list = [...transMsgs].filter((m) => m.channel === channel).sort((a, b) => b.ts - a.ts);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">{title}</span>
        <button
          {...bindTap('msg.channel.settings.open')}
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
        {list.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span className="h-24 w-24 overflow-hidden">
              <Img src={EMPTY_LION} className="h-full w-full object-contain" />
            </span>
            <span className="mt-2 text-[14px] text-[var(--app-text-muted)]">{S.emptyNoData}</span>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {list.map((m) => (
              <div key={m.id}>
                <div className="mb-1.5 text-center text-[11px] text-[var(--app-c-text-muted)]">{fmtMdHm(m.ts)}</div>
                <button
                  {...bindTap('msg.channel.orderDetail.open', {
                    params: { orderId: m.orderId ?? '' },
                    beforeTrigger: () => readChannel(channel),
                  })}
                  className="flex w-full cursor-pointer items-start gap-2.5 rounded-xl border-none bg-[var(--app-surface)] px-3 py-3 text-left shadow-sm"
                >
                  {m.image ? (
                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                      <Img src={m.image} className="h-full w-full object-cover" />
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-bold text-[var(--app-text)]">{m.title}</span>
                    <span className="mt-1 block text-[12px] leading-5 text-[var(--app-text-muted)]">{m.desc}</span>
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
