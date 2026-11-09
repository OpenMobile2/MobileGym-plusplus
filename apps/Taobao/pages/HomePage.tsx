import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { HOME_CHANNELS, KINGKONG_GRID } from '../constants';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { ItemGrid } from '../components/ItemCard';
import { Img, Price, useToast } from '../components/ui';
import { IcScan, IcSearch, IcCamera } from '../res/icons';
import { fmt } from '../utils/format';
import type { TaobaoStringKey } from '../res/strings';

/** 618 三栏(商品卡可点进详情,IMG_8690) */
function PromoStrip() {
  const items = useTaobaoStore((s) => s.items);
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const picks = [items[0], items[2], items[4]].filter(Boolean);
  const titles = [s.homePromoLiveTitle, s.homePromoSubsidyTitle, s.homePromoFlashTitle];
  const subs = [s.homePromoLiveSub, s.homePromoSubsidySub, s.homePromoFlashSub];
  return (
    <div className="flex gap-2 px-2.5 mt-2">
      {picks.map((it, i) => (
        <div
          key={it.id}
          {...bindTap('home.item-open', { params: { itemId: it.id } })}
          className="flex-1 bg-app-surface rounded-xl p-2 cursor-pointer"
        >
          <div className="text-[12px] font-semibold text-[#FF0036]">
            <span className="italic font-black mr-0.5">618</span>{titles[i]}
          </div>
          <Img src={it.image} className="w-full aspect-square object-cover rounded-lg mt-1" />
          <div className="mt-1 flex items-center gap-1">
            <Price value={it.price} size="s" />
            <span className="text-[9px] text-white bg-[#FF0036] rounded px-0.5">{subs[i]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** 非推荐频道的静态轻实现(wontfix 交互,仅视觉) */
function ChannelStatic({ channel }: { channel: string }) {
  const s = useStrings();
  const channelDef = HOME_CHANNELS.find((c) => c.id === channel);
  const label = channelDef ? s[channelDef.labelKey as TaobaoStringKey] : channel;
  const blocks: Record<string, TaobaoStringKey[]> = {
    follow: ['homeBlockFollow1', 'homeBlockFollow2', 'homeBlockFollow3'],
    flash: ['homeBlockFlash1', 'homeBlockFlash2', 'homeBlockFlash3', 'homeBlockFlash4', 'homeBlockFlash5', 'homeBlockFlash6'],
    gov: ['homeBlockGov1', 'homeBlockGov2', 'homeBlockGov3', 'homeBlockGov4', 'homeBlockGov5'],
    '618': ['homeBlock6181', 'homeBlock6182', 'homeBlock6183', 'homeBlock6184'],
    fliggy: ['homeBlockFliggy1', 'homeBlockFliggy2', 'homeBlockFliggy3', 'homeBlockFliggy4'],
    outfit: ['homeBlockOutfit1', 'homeBlockOutfit2', 'homeBlockOutfit3'],
  };
  return (
    <div className="px-2.5 mt-2">
      <div className="bg-app-surface rounded-xl p-4">
        <div className="text-[15px] font-semibold mb-3">{fmt(s.homeChannelBlockTitleFmt, { label })}</div>
        <div className="grid grid-cols-2 gap-2">
          {(blocks[channel] ?? ['homeBlockComingSoon']).map((k) => (
            <div key={k} className="bg-[#FFF1E8] text-[#C2410C] text-[13px] rounded-lg px-3 py-4 text-center">
              {s[k]}
            </div>
          ))}
        </div>
        <div className="text-[11px] text-app-text-muted mt-3 text-center">{s.homeChannelDemoNote}</div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const channel = searchParams.get('tab') ?? 'recommend';
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const items = useTaobaoStore((s) => s.items);
  const claimed = useTaobaoStore((s) => s.homeCouponClaimed);
  const claimHomeCoupon = useTaobaoStore((s) => s.claimHomeCoupon);
  const [toast, showToast] = useToast();

  return (
    <div className="flex flex-col h-full">
      {/* 频道 Tab 条 */}
      <div className="flex items-center gap-4 px-3 h-9 shrink-0 overflow-x-auto bg-app-bg"
        data-scroll-container="home-channels" data-scroll-direction="horizontal">
        {HOME_CHANNELS.map((c) => (
          <button
            key={c.id}
            {...bindTap({ kind: 'action', id: 'home.channelTab.select.target' }, {
              params: { tab: c.id },
              onTrigger: () =>
                setSearchParams((p) => {
                  if (c.id === 'recommend') p.delete('tab');
                  else p.set('tab', c.id);
                  return p;
                }, { replace: true }),
            })}
            className={`shrink-0 text-[15px] bg-transparent border-none cursor-pointer relative pb-0.5 ${
              channel === c.id ? 'text-[#FF5000] font-bold' : 'text-app-text'
            }`}
          >
            {s[c.labelKey as TaobaoStringKey]}
            {'tagKey' in c && c.tagKey && (
              <span className="absolute -top-1 -right-4 text-[8px] text-white bg-[#FF0036] rounded px-0.5">{s[c.tagKey as TaobaoStringKey]}</span>
            )}
            {channel === c.id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF5000]" />
            )}
          </button>
        ))}
      </div>

      {/* 搜索栏 */}
      <div className="px-2.5 pb-1.5 shrink-0">
        <div
          {...bindTap('home.search.open')}
          className="flex items-center bg-app-surface rounded-full h-9 px-3 gap-2 border border-[#FF5000] cursor-pointer"
        >
          <span onClick={(e) => { e.stopPropagation(); showToast(s.homeScanUnavailable); }}>
            <IcScan size={17} className="text-app-text-muted" />
          </span>
          <span className="flex-1 text-[13px] text-app-text-muted">{s.homeSearchPlaceholder}</span>
          <span onClick={(e) => { e.stopPropagation(); showToast(s.homePhotoSearchUnavailable); }}>
            <IcCamera size={17} className="text-app-text-muted" />
          </span>
          <span className="bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[13px] rounded-full px-3 py-1 flex items-center gap-0.5">
            <IcSearch size={13} />{s.search}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {channel !== 'recommend' ? (
          <ChannelStatic channel={channel} />
        ) : (
          <>
            {/* 二楼入口(下拉动效 wontfix,以入口条代替) */}
            <div
              {...bindTap('home.heybox-open')}
              className="mx-2.5 mb-1.5 rounded-lg bg-black text-[#D8F000] text-[11px] px-3 py-1 flex justify-between cursor-pointer"
            >
              <span>{s.homeHeyboxBannerTitle}</span>
              <span>{s.homeHeyboxBannerCta}</span>
            </div>

            {/* 金刚区(铁律①:不实现但给明确反馈) */}
            <div className="mx-2.5 bg-app-surface rounded-xl py-3 grid grid-cols-5 gap-y-3">
              {KINGKONG_GRID.map((k) => {
                const label = s[k.labelKey as TaobaoStringKey];
                return (
                  <div
                    key={k.id}
                    onClick={() => showToast(fmt(s.notAvailableBracketFmt, { name: label }))}
                    className="flex flex-col items-center gap-1 cursor-pointer"
                  >
                    <span className="w-10 h-10 rounded-xl" style={{ background: `${k.color}22` }}>
                      <span className="w-full h-full flex items-center justify-center text-[16px] font-black"
                        style={{ color: k.color }}>
                        {label[0]}
                      </span>
                    </span>
                    <span className="text-[11px] text-app-text">{label}</span>
                  </div>
                );
              })}
            </div>

            <PromoStrip />

            {/* 瀑布流 */}
            <div className="mt-2 pb-2">
              <ItemGrid
                items={items}
                bindingOf={(it) => bindTap('home.item-open', { params: { itemId: it.id } })}
              />
            </div>
          </>
        )}
      </div>

      {/* 消费券横幅 */}
      {!claimed && channel === 'recommend' && (
        <div className="shrink-0 mx-2.5 mb-1.5 rounded-lg bg-gradient-to-r from-[#FF5000] to-[#FF0036] text-white text-[12px] px-3 py-2 flex items-center justify-between">
          <span>{s.homeCouponBannerText}</span>
          <button
            {...bindTap({ kind: 'action', id: 'home.couponBanner.claim' }, {
              onTrigger: () => { claimHomeCoupon(); showToast(s.homeCouponClaimedToast); },
            })}
            className="bg-app-surface text-[#FF0036] rounded-full px-3 py-0.5 text-[12px] font-semibold border-none cursor-pointer"
          >
            {s.homeCouponBannerCta}
          </button>
        </div>
      )}
      {toast}
    </div>
  );
}
