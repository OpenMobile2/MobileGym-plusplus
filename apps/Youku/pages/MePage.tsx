import React, { useMemo } from 'react';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuDark } from '../hooks/useYoukuDark';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import HScroll from './home/HScroll';
import {
  IcBell, IcCalendarCheck, IcChevron, IcCirclePlay, IcDownload, IcOrder, IcScan, IcSettings,
  IcStar, IcTicket, IcTv, IcTvHelper, GOLD_BTN_STYLE, historyTitle, resolveContent, vipExpireParts,
} from './me/meShared';
import type { HistoryEntry } from '../types';

/**
 * spec 节点 me.main(route /me)—— 我的页(s197 楼层复刻;SLG 广告/外卖红包 banner 按硬性约定移除)。
 * 会员横幅随 membership 联动 novip/vip 两态;历史横滑按内容类型 openContent 分流。
 */
export default function MePage() {
  const { bindTap, action } = useYoukuGestures();
  const { t, s } = useI18n();
  const isDark = useYoukuDark();
  const user = useYoukuStore((st) => st.user);
  const membership = useYoukuStore((st) => st.membership);
  const history = useYoukuStore((st) => st.history);
  const unread = useYoukuStore((st) => st.unread);
  const showToast = useYoukuStore((st) => st.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const hasUnread = Object.values(unread).some((n) => n > 0);
  const tierText = membership.tier === 'svip' ? 'SVIP' : 'VIP';
  const expire = t('meVipExpire', vipExpireParts(membership.sinceTs, membership.expireTs));

  const benefitGroups = useMemo(
    () => [
      { title: s.meBenefitVip, color: '#E9C177', items: [s.meBenefitSale, s.meBenefitJoint, s.meBenefitClub], hot: s.meBenefitSale },
      { title: s.meBenefitInterest, color: '#4D9BF0', items: [s.meBenefitPublic, s.meBenefitPlay, s.meBenefitCard], hot: '' },
      { title: s.meBenefitWelfare, color: '#B78BF0', items: [s.meBenefitShop, s.meBenefitFinance, s.meBenefitFreeData], hot: '' },
    ],
    [s],
  );

  // 历史横滑:短视频折叠为一张「合辑」卡(s197);短剧同剧只留最新一条
  const shorts = history.filter((h) => h.ctype === 'short');
  const rest = history
    .filter((h) => h.ctype !== 'short')
    .filter((h, i, arr) =>
      h.ctype === 'drama' ? arr.findIndex((x) => x.ctype === 'drama' && x.id === h.id) === i : true,
    );
  const firstShort = shorts[0];

  /** 专属推荐(s197 六宫格,片库同类补位) */
  const recIds = ['m_xunyao1', 'a_shenzhong', 'm_langchao', 'm_kuangben', 'm_yueguang', 's_qiaochu'];

  const quickCls = 'flex flex-1 cursor-pointer flex-col items-center gap-2 py-3.5';

  const epBadge = (updatedTo?: number | null, episodeCount?: number | null) => {
    if (episodeCount == null) return null;
    if (updatedTo != null && updatedTo < episodeCount) return t('meEpUpdated', { n: updatedTo });
    return t('meEpAll', { n: episodeCount });
  };

  const historyCard = (h: HistoryEntry) => {
    const r = resolveContent(h.id, String(h.ctype));
    if (!r) return null;
    const params = contentNavParams({ id: h.id, type: h.ctype }, h.episode != null ? { ep: h.episode } : undefined);
    const badge = epBadge(r.updatedTo, r.episodeCount);
    const inner = (
      <>
        <div className="relative h-[72px] w-32 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
          <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
          {badge && (
            <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] leading-none text-white">
              {badge}
            </span>
          )}
        </div>
        <div className="mt-1.5 w-32 truncate text-[13px] text-(--app-c-text-primary)">{historyTitle(r, h.episode)}</div>
      </>
    );
    const key = `${h.id}#${h.episode ?? 0}`;
    if (h.ctype === 'series') {
      return (
        <div key={key} {...bindTap('me.history.card.series.open', { params })} className="shrink-0 cursor-pointer">
          {inner}
        </div>
      );
    }
    return (
      <div key={key} {...bindTap('me.history.card.open', { params })} className="shrink-0 cursor-pointer">
        {inner}
      </div>
    );
  };

  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <div className="flex h-11 shrink-0 items-center justify-end gap-5 px-4">
        <button {...action('me.tv.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcTv size={22} strokeWidth={1.8} />
        </button>
        <button {...bindTap('me.msg.open')} className="relative cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBell size={22} strokeWidth={1.8} />
          {hasUnread && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-(--app-c-danger)" />}
        </button>
        <button {...action('me.scan.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcScan size={22} strokeWidth={1.8} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div {...bindTap('me.profile.open')} className="flex cursor-pointer items-center gap-3 px-4 pt-2">
          <Img src={user.avatar} label={user.nickname} ratio="square" className="h-16 w-16 rounded-full bg-(--app-c-chip-bg) object-cover" />
          <div className="min-w-0">
            <div className="truncate text-[20px] font-bold">{user.nickname}</div>
            <button
              {...action('me.coin.wontfixToast', wontfix, { stopPropagation: true })}
              className="mt-1.5 cursor-pointer rounded-full border-none bg-(--app-c-chip-bg) px-2.5 py-1 text-[12px] text-(--app-c-text-secondary)"
            >
              {user.coinText}
            </button>
          </div>
        </div>

        <div
          {...bindTap('me.vip.open')}
          className="mx-3 mt-3 flex cursor-pointer items-center rounded-2xl px-4 py-4"
          style={{ background: 'linear-gradient(120deg,#26221A 0%,#2E2818 60%,#1A160E 100%)' }}
        >
          {membership.active ? (
            <>
              <div className="min-w-0">
                <div className="text-[16px] font-bold text-[#E8C87E]">
                  {t('meVipActive', { tier: tierText, expire })}
                </div>
                <div className="mt-1 text-[13px] text-[#999999]">{t('meVipActiveSub', { tier: tierText })}</div>
              </div>
              <span className="ml-auto shrink-0 rounded-full px-4 py-2 text-[14px] font-bold" style={GOLD_BTN_STYLE}>
                {s.meVipRenew}
              </span>
            </>
          ) : (
            <>
              <div className="min-w-0">
                <div className="text-[16px] font-bold text-[#E8C87E]">{s.meVipInactive}</div>
                <div className="mt-1 text-[13px] text-[#999999]">{t('meVipInactiveSub', { price: 12 })}</div>
              </div>
              <span className="ml-auto shrink-0 rounded-full px-4 py-2 text-[14px] font-bold" style={GOLD_BTN_STYLE}>
                {s.meVipOpen}
              </span>
            </>
          )}
        </div>

        <div className="mx-3 mt-3 flex rounded-2xl bg-(--app-c-card-bg)">
          <div {...bindTap('me.downloads.open')} className={quickCls}>
            <IcDownload size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meDownloads}</span>
          </div>
          <div {...bindTap('me.library.fav.open')} className={quickCls}>
            <IcStar size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meFavorites}</span>
          </div>
          <div {...bindTap('me.library.zhui.open')} className={quickCls}>
            <IcCalendarCheck size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meFollowing}</span>
          </div>
          <div {...bindTap('me.favtypes.open')} className={quickCls}>
            <IcCirclePlay size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meFavTypes}</span>
          </div>
        </div>

        <div className="mt-5 flex items-center px-4">
          <span className="text-[18px] font-bold">{s.meHistory}</span>
          <button
            {...bindTap('me.history.open')}
            className="ml-auto flex cursor-pointer items-center border-none bg-transparent p-0 text-[14px] text-(--app-c-text-muted)"
          >
            {s.meMore}
            <IcChevron size={15} />
          </button>
        </div>
        <HScroll className="mt-3 gap-2.5 px-4">
          {firstShort && (() => {
            const r = resolveContent(firstShort.id, 'short');
            if (!r) return null;
            return (
              <div
                {...bindTap('me.history.card.open', { params: contentNavParams({ id: firstShort.id, type: 'short' }) })}
                className="shrink-0 cursor-pointer"
              >
                <div className="relative h-[72px] w-32">
                  <div className="absolute -right-1.5 top-2 h-[64px] w-32 rounded-lg bg-(--app-c-chip-bg)" />
                  <div className="absolute -right-0.5 top-1 h-[68px] w-32 rounded-lg bg-(--app-c-border)" />
                  <div className="relative h-[72px] w-32 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                    <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
                  </div>
                </div>
                <div className="mt-1.5 w-32 truncate text-[13px] text-(--app-c-text-primary)">{s.meHistoryAlbum}</div>
              </div>
            );
          })()}
          {rest.slice(0, 8).map(historyCard)}
        </HScroll>

        <div
          {...bindTap('me.vipPromo.open')}
          className="mx-3 mt-4 flex cursor-pointer items-center rounded-xl px-3.5 py-3"
          style={{ background: 'linear-gradient(90deg,#2E2414,#3A2C16)' }}
        >
          <span className="text-[14px] font-bold text-[#E8C87E]">{s.meVipPromo}</span>
          <span className="ml-2 min-w-0 truncate text-[13px] text-[#CCB07A]">{s.meVipPromoSub}</span>
          <span className="ml-auto shrink-0 rounded-full px-3 py-1.5 text-[12px] font-bold" style={GOLD_BTN_STYLE}>
            {s.meVipGrab}
          </span>
        </div>

        <div className="mx-3 mt-3 rounded-2xl bg-(--app-c-card-bg) p-3">
          <div className="grid grid-cols-3 gap-2">
            {benefitGroups.map((g) => (
              <div key={g.title} className="flex flex-col gap-2">
                <div
                  {...action('me.benefits.wontfixToast', wontfix)}
                  className="flex cursor-pointer items-center justify-center gap-1 py-1"
                >
                  <span className="h-2 w-2 rounded-full" style={{ background: g.color }} />
                  <span className="text-[14px] font-medium">{g.title}</span>
                  <IcChevron size={13} className="text-(--app-c-text-muted)" />
                </div>
                {g.items.map((it) => (
                  <button
                    key={it}
                    {...action('me.benefits.wontfixToast', wontfix)}
                    className={`h-11 cursor-pointer rounded-lg border-none bg-(--app-c-chip-bg) text-[14px] ${
                      it === g.hot ? 'font-bold text-(--app-c-danger)' : 'text-(--app-c-text-primary)'
                    }`}
                  >
                    {it}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center px-4">
          <span className="text-[18px] font-bold">{s.meAssets}</span>
          <button
            {...action('me.assets.wontfixToast', wontfix)}
            className="ml-auto flex cursor-pointer items-center border-none bg-transparent p-0 text-[14px] text-(--app-c-text-muted)"
          >
            {s.meMore}
            <IcChevron size={15} />
          </button>
        </div>
        <div className="mx-3 mt-2 flex rounded-2xl bg-(--app-c-card-bg)">
          <div {...bindTap('me.orders.open')} className={quickCls}>
            <IcOrder size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meOrders}</span>
          </div>
          <div {...action('me.coupons.wontfixToast', wontfix)} className={quickCls}>
            <IcTicket size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meCoupons}</span>
          </div>
          <div {...action('me.tvhelper.wontfixToast', wontfix)} className={quickCls}>
            <IcTvHelper size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meTvHelper}</span>
          </div>
          <div {...bindTap('me.settings.open')} className={quickCls}>
            <IcSettings size={24} strokeWidth={1.6} />
            <span className="text-[13px]">{s.meSettings}</span>
          </div>
        </div>

        <div className="mt-5 px-4 text-[18px] font-bold">{s.meTodayRec}</div>
        <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
          {recIds.map((id) => {
            const ctype = id.startsWith('s_') ? 'series' : id.startsWith('a_') ? 'anime' : 'movie';
            const r = resolveContent(id, ctype);
            if (!r) return null;
            const badge = epBadge(r.updatedTo, r.episodeCount);
            return (
              <div
                key={id}
                {...bindTap('me.recommend.item.open', { params: contentNavParams({ id, type: ctype }) })}
                className="cursor-pointer"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                  <Img src={r.poster} label={r.title} ratio="poster" className="h-full w-full object-cover" />
                  {r.badge && (
                    <span className="absolute right-0 top-0 rounded-bl-md rounded-tr-lg bg-black/45 px-1.5 py-0.5 text-[10px] leading-none text-[#E8C87E]">
                      {r.badge}
                    </span>
                  )}
                  {badge && (
                    <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                      {badge}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 truncate text-[14px] text-(--app-c-text-primary)">{r.title}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
