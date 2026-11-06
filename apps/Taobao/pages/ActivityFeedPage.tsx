import React from 'react';
import { useTaobaoStore } from '../state';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, useToast } from '../components/ui';
import { IcSettings } from '../res/icons';
import { fmt } from '../utils/format';

/** 活动优惠聚合(spec: message.activity,IMG_8718,P2 展示页) */
export default function ActivityFeedPage() {
  const items = useTaobaoStore((st) => st.items);
  const s = useStrings();
  const [toast, showToast] = useToast();
  const cards = [
    { source: s.activitySourceLimitedOffer, time: '09:06', title: s.activityCardTitle1, item: items[9], action: s.activityActionBuyNow },
    { source: s.activitySourceGold, time: s.activityTimeSunday, title: s.activityCardTitle2, item: items[14], action: s.activityActionGoBuy },
    { source: s.activitySourceCompare, time: s.activityTimeSaturday, title: s.activityCardTitle3, item: items[12], action: s.activityActionFindSimilar },
  ];

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar
        title={s.activityDiscountLabel}
        rightContent={
          <button onClick={() => showToast(s.subscriptionSettingsUnavailable)} className="bg-transparent border-none cursor-pointer">
            <IcSettings size={17} className="text-app-text" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="activity-list" data-scroll-direction="vertical">
        {cards.map((c, i) => (
          <div key={i} className="bg-app-surface rounded-xl mt-2 p-3">
            <div className="flex justify-between text-[12px] text-app-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-[#FF5000] text-white text-[9px] flex items-center justify-center">{s.appName[0]}</span>
                {c.source}
              </span>
              <span>{c.time}</span>
            </div>
            <div className="text-[14px] font-semibold mt-1.5">{c.title}</div>
            {c.item && (
              <div className="flex gap-2.5 mt-2 items-center">
                <Img src={c.item.image} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-app-text-muted line-clamp-1">{fmt(s.productInfoFmt, { title: c.item.title })}</div>
                  <div className="text-[11px] text-app-text-muted mt-0.5">{s.exclusiveOfferExpiringText}</div>
                </div>
              </div>
            )}
            <button className="mt-2 text-[12px] text-[#FF5000] border border-[#FF5000] rounded-full px-3 py-1 bg-app-surface cursor-pointer">
              {c.action}
            </button>
          </div>
        ))}
        <div className="text-center text-[12px] text-app-text-muted py-4">{s.onlyRecent30DaysText}</div>
      </div>
      {toast}
    </div>
  );
}
