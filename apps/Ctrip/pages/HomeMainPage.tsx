import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { Img, useToast, Price } from '../components/ui';
import { IconRenderer, IcSearch } from '../res/icons';
import { KINGKONG, HOME_FEED_TABS } from '../constants';
import type { CtripStringKey } from '../res/strings';

/**
 * 首页(spec home.main):会员栏 / 金刚区10入口 / 搜索框 / 运营卡 / 本地feed。
 * - 金刚区 page 类走各自 transitionId;toast 类统一「暂未开放」。
 * - 搜索框→search.result；酒店 feed 卡→对应酒店详情；景点卡→城市页。
 */
export default function HomeMainPage() {
  const { bindTap } = useCtripGestures();
  const s = useCtripStrings();
  const [toast, showToast] = useToast();
  const user = useCtripStore((st) => st.user);
  const hotels = useCtripStore((st) => st.hotels);
  const attractions = useCtripStore((st) => st.attractions);
  const [feedTab, setFeedTab] = React.useState('shanghai');

  const KK_NAV: Record<string, object> = {
    'home.hotel-open': bindTap('home.hotel-open'),
    'home.homestay-open': bindTap('home.homestay-open'),
    'home.dest-open': bindTap('home.dest-open'),
    'home.flight-open': bindTap('home.flight-open'),
    'home.train-open': bindTap('home.train-open'),
    'home.ticket2-open': bindTap('home.ticket2-open'),
    'home.carpickup-open': bindTap('home.carpickup-open'),
    'home.car-open': bindTap('home.car-open'),
  };
  const kkWontfix = bindTap({ kind: 'action', id: 'home.kingkong.wontfix' }, { onTrigger: () => showToast(s.wontfix) });
  const opsWontfix = bindTap({ kind: 'action', id: 'home.ops.wontfix' }, { onTrigger: () => showToast(s.wontfix) });
  const aiWontfix = bindTap({ kind: 'action', id: 'home.ai.wontfix' }, { onTrigger: () => showToast(s.wontfix) });

  const feedItems = React.useMemo(() => {
    const shHotels = hotels.filter((h) => h.city === '上海');
    const nearbyHotels = hotels.filter((h) => h.city === '杭州' || h.city === '上海');
    const stayHotels = hotels.filter((h) => h.star >= 4);
    const worldHotels = hotels.filter((h) => h.city === '三亚' || h.city === '北京' || h.city === '成都');
    let hotelPool = shHotels;
    if (feedTab === 'nearby') hotelPool = nearbyHotels;
    else if (feedTab === 'stay') hotelPool = stayHotels;
    else if (feedTab === 'worldwide') hotelPool = worldHotels;
    else if (feedTab === 'attraction' || feedTab === 'food') hotelPool = [];

    const hotelCards = hotelPool.slice(0, 4).map((h) => ({
      id: `h-${h.id}`,
      entityId: h.id,
      kind: 'hotel' as const,
      image: h.image,
      title: h.name,
      tag: `¥${h.price}起`,
      sub: `${h.city} · ${h.district} · ${h.score}分`,
      city: h.city,
    }));
    const attrCards = attractions.slice(0, feedTab === 'attraction' ? 4 : 2).map((a) => ({
      id: `a-${a.id}`,
      entityId: a.id,
      kind: 'attraction' as const,
      image: a.image,
      title: a.name,
      tag: `¥${a.ticketTypes[0]?.price ?? ''}起`,
      sub: `${a.district} · ${a.score}分`,
      city: a.city || '上海',
    }));
    const foodNames = ['老字号本帮菜·招牌红烧肉', '南翔小笼·现蒸鲜肉小笼', '杭帮菜·西湖醋鱼', '人气早茶·虾饺拼盘'];
    const foodCards = foodNames.map((title, index) => ({
      id: `food-${index}`,
      entityId: `food-${index}`,
      kind: 'food' as const,
      image: attractions[index % Math.max(1, attractions.length)]?.image || '',
      title,
      tag: `${48 + index * 20}元/人`,
      sub: index < 2 ? '上海 · 人气必吃' : '杭州 · 当地特色',
      city: index < 2 ? '上海' : '杭州',
    }));
    if (feedTab === 'attraction') return attrCards;
    if (feedTab === 'food') return foodCards;
    if (feedTab === 'stay') return hotelCards;
    return [...hotelCards.slice(0, 2), ...attrCards.slice(0, 2)];
  }, [hotels, attractions, feedTab]);

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <div className="shrink-0 bg-gradient-to-b from-[#128CF4] to-[#2E9AF4] px-4 pt-3 pb-4">
        <div className="flex items-center justify-between text-white">
          <span className="text-[18px] font-bold tracking-tight">◒ {s.appName}</span>
          <div className="flex items-center gap-2 text-[12px]">
            <span className="bg-white/25 rounded-full px-2 py-1">◇ {user.memberLevel}</span>
            <span className="font-semibold text-[#FFF4AE]">● {user.points}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-app-surface rounded-t-[18px] -mt-2 px-2.5 pt-3 pb-2">
          <div className="grid grid-cols-5 gap-x-1.5 gap-y-3">
          {KINGKONG.map((k, index) => {
            const isPage = k.kind === 'page';
            const binding = isPage ? KK_NAV[(k as { transitionId: string }).transitionId] : kkWontfix;
            const primary = index < 5;
            const label = s[k.labelKey as CtripStringKey];
            return (
              <button
                key={k.id}
                {...binding}
                className="flex min-w-0 flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <span
                  className={`flex items-center justify-center shrink-0 ${
                    primary ? 'w-11 h-11 rounded-[13px] shadow-sm text-white' : 'w-9 h-8 rounded-lg'
                  }`}
                  style={{
                    background: primary
                      ? `linear-gradient(145deg, ${k.color}, color-mix(in srgb, ${k.color} 78%, white))`
                      : 'transparent',
                    color: primary ? 'white' : k.color,
                  }}
                >
                  <IconRenderer name={k.icon} size={primary ? 24 : 22} />
                </span>
                <span className="w-full text-center text-[10px] leading-[12px] text-app-text">
                  {label}
                </span>
              </button>
            );
          })}
          </div>
          <button
            {...kkWontfix}
            className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border-none bg-gradient-to-r from-[#F6F8FC] to-[#EEF4FF] text-[12px] text-app-text"
          >
            <span className="text-[#756CF5]">▣</span><span className="text-[#23BFA5]">▰</span>
            <span className="text-[#FF9C36]">●</span><span>{s.moreProducts}</span>
          </button>
        </div>

        <div className="mx-2 mt-2 rounded-[16px] bg-gradient-to-br from-[#EAF6FF] to-[#F8FBFF] p-2.5 shadow-sm">
          <button
            {...bindTap('home.search-open')}
            className="flex h-11 w-full items-center gap-2 rounded-[12px] border-2 border-[#168AF0] bg-app-surface px-3 text-left"
          >
            <IcSearch size={20} className="text-[#087BE8]" />
            <span className="flex-1 truncate text-[14px] text-app-text-muted">{s.searchPlaceholder}</span>
            <span className="rounded-lg bg-[#168AF0] px-2.5 py-1.5 text-[12px] text-white">{s.t('搜索')}</span>
          </button>
        </div>

        <div className="mx-2 mt-2 grid grid-cols-5 gap-1">
          {[
            [s.t('特价/直播'), '◆'], [s.t('演出/展览'), '♪'], [s.t('行程规划'), 'AI'], [s.t('旅行热点'), '▰'], [s.t('携程榜单'), '◒'],
          ].map(([label, glyph], index) => (
            <button
              key={label}
              {...(index === 2 ? aiWontfix : opsWontfix)}
              className="flex h-[62px] flex-col items-center justify-center gap-1 rounded-lg border-none bg-app-surface text-[10px] text-app-text shadow-sm"
            >
              <span className={`text-[18px] font-bold ${index === 2 ? 'text-[#3297F4]' : 'text-[#FF8734]'}`}>{glyph}</span>
              <span className="whitespace-nowrap">{label}</span>
            </button>
          ))}
        </div>

        <div className="mt-3 px-2">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {HOME_FEED_TABS.map((t) => (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'home.feed.tab.select' }, { params: { tab: t.id }, onTrigger: () => setFeedTab(t.id) })}
                className={`text-[14px] bg-transparent border-none cursor-pointer whitespace-nowrap ${feedTab === t.id ? 'text-app-text font-semibold' : 'text-app-text-muted'}`}
              >{s[t.labelKey]}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pb-4">
            {feedItems.map((it) => (
              <button
                key={it.id}
                {...(it.kind === 'hotel'
                  ? bindTap('home.feed-hotel-open', { params: { id: it.entityId, source: 'home' } })
                  : it.kind === 'food'
                    ? bindTap({ kind: 'action', id: 'home.ops.wontfix' }, { onTrigger: () => showToast(s.wontfix) })
                    : bindTap('home.feed-open', { params: { city: it.city || '上海' } }))}
                className="bg-app-surface rounded-xl overflow-hidden border-none cursor-pointer p-0 text-left"
              >
                <Img src={it.image} className="w-full h-28 object-cover" />
                <div className="p-2">
                  <div className="text-[13px] text-app-text line-clamp-2 leading-snug">{it.title}</div>
                  <div className="text-[11px] text-app-text-muted mt-1">{it.sub}</div>
                  <Price value={Number(String(it.tag).replace(/[^\d]/g, '')) || 0} size="s" className="mt-1 block" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}
