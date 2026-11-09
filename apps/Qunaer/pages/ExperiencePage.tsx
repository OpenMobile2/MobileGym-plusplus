import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import * as TimeService from '@/os/TimeService';
import { ROUTE_CATALOG } from '../routeCatalog';
import { Card, Img, Price, Score, SectionTitle, StaticChip, TopBar } from '../components/ui';
import { useQunaerGestures } from '../hooks/useQunaerGestures';
import { useQunaerStore } from '../state';
import type { RoundTripLeg } from '../types';
import type { TransitionId } from '../navigation.declaration';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import {
  IcBack, IcBed, IcCalendar, IcCar, IcCheck, IcDiscount, IcDown, IcFilter, IcGift,
  IcHeart, IcHotel, IcMessage, IcMinus, IcNavigate, IcPin, IcPlane, IcPlus, IcRight, IcSearch,
  IcSend, IcShare, IcSparkles, IcStar, IcTicket, IcTrain, IcUser, IcUsers,
} from '../res/icons';

const image = (name: string) => `/@app-assets/Qunaer/images/${name}.png`;

function Feedback() {
  const feedback = useQunaerStore((state) => state.lastFeedback);
  const clearFeedback = useQunaerStore((state) => state.clearFeedback);
  // 轻提示只闪现约 1.8 秒后自动消失，避免像日期条一样一直挂在页面上。
  React.useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => clearFeedback(), 1800);
    return () => window.clearTimeout(timer);
  }, [feedback, clearFeedback]);
  if (!feedback) return null;
  return (
    <div className="fixed left-3 right-3 bottom-20 z-50 rounded-lg bg-[#202A2E]/90 text-white text-[12px] px-3 py-2 text-center pointer-events-none">
      {feedback}
    </div>
  );
}

function HomeContent() {
  const hotels = useQunaerStore((state) => state.hotels);
  const scenics = useQunaerStore((state) => state.scenics);
  const world = useQunaerStore((state) => state.world);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setCurrentWorld = useQunaerStore((state) => state.setCurrentWorld);
  const { bindTap } = useQunaerGestures();
  const s = useAppStrings(strings, stringsEn);
  const [deal, setDeal] = React.useState<null | 'coupon' | 'hotel' | 'flight'>(null);

  const small = (
    label: string,
    Icon: typeof IcBed,
    color: string,
    binding: React.HTMLAttributes<HTMLButtonElement>,
    badge?: string,
  ) => (
    <button
      type="button"
      {...binding}
      className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer p-0 min-h-[52px]"
    >
      <span className="relative w-8 h-8 rounded-[9px] flex items-center justify-center text-white" style={{ background: color }}>
        <Icon size={16} />
        {badge && (
          <span className="absolute -top-1.5 -right-2 text-[8px] leading-none px-1 py-[1px] rounded bg-[#FF4D3A] text-white">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[10px] text-[#39464B] whitespace-nowrap">{label}</span>
    </button>
  );

  return (
    <>
      <div className="relative bg-gradient-to-b from-[#7ED9F5] via-[#B8F0F4] to-[#F3F6F7] px-3 pt-2 pb-1">
        <div className="absolute inset-x-0 top-0 h-[120px] opacity-40 pointer-events-none overflow-hidden">
          <Img src={image('world_6')} className="w-full h-full object-cover" alt="" />
        </div>
        <button
          type="button"
          {...bindTap('home.main.4.open')}
          className="relative h-9 rounded-full bg-white shadow-sm flex items-center px-3 gap-2 border-none w-full cursor-pointer text-left"
        >
          <IcSearch size={16} className="text-[#93A0A5]" />
          <span className="text-[12px] text-[#7B898E] flex-1">烟台旅游度假</span>
          <span className="h-7 rounded-full px-4 inline-flex items-center bg-[#23C8CB] text-white text-[12px] font-medium">
            {s.search}
          </span>
        </button>
        <div className="relative mt-2.5 h-[78px] rounded-xl overflow-hidden bg-gradient-to-r from-[#5EC8F5] to-[#7BE0C8] text-white px-4 py-3">
          <div className="text-[18px] font-extrabold italic tracking-wide">暑你最惠玩儿</div>
          <div className="text-[11px] mt-1 opacity-95">酒店 · 机票 · 景点 暑期大促</div>
          <span className="absolute right-2 top-2 text-[9px] bg-black/25 px-1.5 py-0.5 rounded">广告</span>
          <IcSparkles className="absolute right-6 bottom-2 opacity-50" size={40} />
        </div>
      </div>

      <section className="mx-3 -mt-0.5 rounded-2xl bg-white p-2 shadow-sm">
        <div className="grid grid-cols-[1.15fr_1fr_1fr_1fr] gap-1.5">
          <button
            type="button"
            {...bindTap('home.main.1.open')}
            className="row-span-1 rounded-xl bg-gradient-to-br from-[#FF9B46] to-[#FF6A32] text-white p-2 h-[72px] border-none cursor-pointer text-left"
          >
            <IcHotel size={22} />
            <div className="font-bold text-[15px] mt-0.5">{s.hotels}</div>
            <div className="text-[9px] opacity-90">爆款酒店</div>
          </button>
          {small('民宿·客栈', IcBed, '#FF914D', bindTap('home.main.5.open'), '补贴')}
          {small('海外酒店', IcHotel, '#FF914D', bindTap('home.main.6.open'))}
          {small('特价酒店', IcDiscount, '#FF914D', bindTap('home.main.10.open'))}

          <button
            type="button"
            {...bindTap('home.main.0.open')}
            className="rounded-xl bg-gradient-to-br from-[#5BA9FF] to-[#3A7CF4] text-white p-2 h-[72px] border-none cursor-pointer text-left"
          >
            <IcPlane size={22} />
            <div className="font-bold text-[15px] mt-0.5">{s.flights}</div>
            <div className="text-[9px] opacity-90">立省¥100</div>
          </button>
          {small(s.trains, IcTrain, '#4C91F7', bindTap('home.main.2.open'))}
          {small('租车自驾', IcCar, '#4C91F7', bindTap('home.main.7.open'), '低价')}
          {small('接机送机', IcNavigate, '#4C91F7', bindTap('home.main.8.open'))}

          <button
            type="button"
            {...bindTap('home.main.9.open')}
            className="rounded-xl bg-gradient-to-br from-[#37D5A0] to-[#08A66D] text-white p-2 h-[72px] border-none cursor-pointer text-left"
          >
            <IcTicket size={22} />
            <div className="font-bold text-[15px] mt-0.5">旅游</div>
            <div className="text-[9px] opacity-90">出境/国内游</div>
          </button>
          {small(s.scenicTickets, IcTicket, '#24B88A', bindTap('home.main.3.open'))}
          {small('跟团游', IcUsers, '#24B88A', bindTap('home.main.9.open'))}
          {small(
            '借钱/分期',
            IcGift,
            '#FF6A32',
            bindTap({ kind: 'action', id: 'home.main.11.other' }, {
              onTrigger: () => recordAction('home.main.11.other', '借钱/分期暂未开放'),
            }),
          )}
        </div>
      </section>

      <section className="mx-3 mt-2.5 rounded-xl overflow-hidden bg-gradient-to-r from-[#FF3D7A] to-[#FF6B4A] h-[56px] px-3 flex items-center text-white">
        <div>
          <div className="text-[15px] font-extrabold">抢 0 元机票</div>
          <div className="text-[10px] opacity-90">暑期旅行福利 · 每日开抢</div>
        </div>
        <button
          type="button"
          {...bindTap({ kind: 'action', id: 'home.main.15.other' }, {
            onTrigger: () => recordAction('home.main.15.other', '抢0元机票暂未实现'),
          })}
          className="ml-auto rounded-full bg-white text-[#FF4A3A] text-[11px] font-bold px-3 py-1.5 border-none cursor-pointer"
        >
          抢
        </button>
      </section>

      <div className="mx-3 mt-2.5 flex justify-around px-1">
        {([
          ['天天神券', IcGift, 'coupon', '#FF4D3A'],
          ['低价酒店', IcHotel, 'hotel', '#FF914D'],
          ['机票捡漏', IcPlane, 'flight', '#4C91F7'],
        ] as const).map(([label, Icon, target, color]) => {
          const C = Icon as typeof IcGift;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setDeal(target)}
              className="flex flex-col items-center gap-1 text-[11px] text-[#546066] bg-transparent border-none cursor-pointer p-0"
            >
              <span
                className="w-11 h-11 rounded-full shadow-sm flex items-center justify-center text-white"
                style={{ background: color }}
              >
                <C size={20} />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <SectionTitle>本周热门</SectionTitle>
      <div className="px-3 grid grid-cols-2 gap-2">
        {[scenics[0], hotels[0]].map((item, index) => (
          <button
            key={item.id}
            type="button"
            {...(index === 0 ? bindTap('home.main.13.open') : bindTap('home.main.14.open'))}
            className="overflow-hidden bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer p-0"
          >
            <Img src={item.image} className="w-full h-[105px] object-cover" alt={item.name} />
            <div className="p-2">
              <div className="text-[12px] font-medium line-clamp-2">{item.name}</div>
              {'score' in item && (
                <div className="mt-1">
                  <Score value={item.score} />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      <SectionTitle>旅行灵感</SectionTitle>
      <div className="px-3 columns-2 gap-2 pb-3">
        {world.map((item) => (
          <button
            key={item.id}
            type="button"
            {...bindTap('home.main.12.open', { beforeTrigger: () => setCurrentWorld(item.id) })}
            className="break-inside-avoid mb-2 rounded-xl overflow-hidden bg-white w-full text-left border-none p-0 cursor-pointer block"
          >
            <Img src={item.image} className="w-full h-[122px] object-cover" alt={item.title} />
            <div className="p-2">
              <div className="text-[12px] leading-snug font-medium">{item.title}</div>
              <div className="mt-1 text-[10px] text-[#8A9499]">
                {item.author} · ♡ {item.likes}
              </div>
            </div>
          </button>
        ))}
      </div>
      {deal && <HomeDealSheet kind={deal} onClose={() => setDeal(null)} />}
    </>
  );
}

const DEAL_COUPONS = [
  { id: 'c1', cat: '酒店', face: '¥30', amount: 30, cond: '满300可用', tag: '限今日' },
  { id: 'c2', cat: '酒店', face: '¥88', amount: 88, cond: '高星满888', tag: '铂金专享' },
  { id: 'c3', cat: '机票', face: '¥50', amount: 50, cond: '国内机票立减', tag: '限量' },
  { id: 'c4', cat: '机票', face: '¥20', amount: 20, cond: '国际机票专享', tag: '新客' },
  { id: 'c5', cat: '火车票', face: '¥11', amount: 11, cond: '火车票立减11', tag: '12306' },
  { id: 'c6', cat: '门票', face: '¥20', amount: 20, cond: '景点门票满100', tag: '周末' },
  { id: 'c7', cat: '门票', face: '¥15', amount: 15, cond: '亲子门票专享', tag: '亲子' },
  { id: 'c8', cat: '酒店', face: '¥60', amount: 60, cond: '连住2晚可用', tag: '连住' },
];

const DEAL_HOTELS = [
  { city: '三亚', name: '亚龙湾海景度假酒店', img: 'hotel_5', was: 788, now: 499 },
  { city: '成都', name: '春熙路智选假日酒店', img: 'hotel_1', was: 459, now: 266 },
  { city: '杭州', name: '西湖畔精品设计酒店', img: 'hotel_3', was: 620, now: 398 },
  { city: '重庆', name: '解放碑轻奢公寓酒店', img: 'hotel_4', was: 388, now: 218 },
  { city: '厦门', name: '鼓浪屿海景民宿', img: 'homestay_1', was: 520, now: 329 },
  { city: '南京', name: '夫子庙秦淮河客栈', img: 'homestay_4', was: 410, now: 248 },
];

const DEAL_FLIGHTS = [
  { from: '北京', to: '三亚', date: '8月28日', price: 459, discount: '2.5折' },
  { from: '上海', to: '重庆', date: '9月02日', price: 288, discount: '3折' },
  { from: '广州', to: '成都', date: '8月30日', price: 330, discount: '3.5折' },
  { from: '杭州', to: '西安', date: '9月05日', price: 266, discount: '2.8折' },
  { from: '深圳', to: '昆明', date: '8月26日', price: 399, discount: '4折' },
  { from: '南京', to: '厦门', date: '9月01日', price: 210, discount: '2.2折' },
];

// 首页运营位的全屏浮层：领券中心 / 特价酒店清单 / 特价机票清单。
function HomeDealSheet({ kind, onClose }: { kind: 'coupon' | 'hotel' | 'flight'; onClose: () => void }) {
  const { bindTap } = useQunaerGestures();
  const [claimed, setClaimed] = React.useState<Record<string, boolean>>({});
  const claimedTotal = DEAL_COUPONS.filter((c) => claimed[c.id]).reduce((sum, c) => sum + c.amount, 0);

  const title = kind === 'coupon' ? '天天神券 · 领券中心' : kind === 'hotel' ? '特价酒店 · 全国清仓' : '机票捡漏 · 特价专区';
  const headerBg =
    kind === 'coupon'
      ? 'from-[#FF5A3C] to-[#FF2D55]'
      : kind === 'hotel'
        ? 'from-[#FF9A5A] to-[#FF6A2C]'
        : 'from-[#4C91F7] to-[#2D6BF0]';

  return (
    <div className="fixed inset-0 z-[60] bg-[#F3F6F7] flex flex-col" data-status-bar-foreground="light">
      <div className={`bg-gradient-to-br ${headerBg} text-white px-4 pb-4 relative pt-[54px]`}>
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-[52px] w-8 h-8 rounded-full bg-white/25 flex items-center justify-center border-none cursor-pointer text-white"
        >
          <IcBack size={18} />
        </button>
        <div className="text-center text-[16px] font-semibold">{title}</div>
        {kind === 'coupon' ? (
          <div className="mt-4 text-center">
            <div className="text-[13px] opacity-90">已领取可省</div>
            <div className="text-[38px] font-extrabold leading-none mt-1">
              ¥{claimedTotal}
            </div>
            <div className="text-[11px] opacity-90 mt-1">最高可省 ¥503 · 每日 0 点更新</div>
          </div>
        ) : (
          <div className="mt-2 text-center text-[12px] opacity-95">
            {kind === 'hotel' ? '跨城精选特价房 · 抢完即止' : '不同城市不同日期 · 特价清仓机票'}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {kind === 'coupon' && (
          <div className="grid grid-cols-2 gap-2.5">
            {DEAL_COUPONS.map((c) => {
              const got = claimed[c.id];
              return (
                <div key={c.id} className="rounded-xl overflow-hidden bg-white border border-[#FFE0D4] flex">
                  <div className="w-[86px] shrink-0 bg-gradient-to-b from-[#FFF3EC] to-[#FFE2D3] flex flex-col items-center justify-center py-3">
                    <div className="text-[20px] font-extrabold text-[#FF3B2F]">{c.face}</div>
                    <div className="text-[9px] text-[#FF7A4D] mt-0.5">{c.cat}券</div>
                  </div>
                  <div className="flex-1 p-2 flex flex-col">
                    <div className="text-[11px] text-[#39464B]">{c.cond}</div>
                    <span className="mt-1 text-[9px] text-[#FF6A2C] bg-[#FFF1EA] rounded px-1 py-0.5 self-start">{c.tag}</span>
                    <button
                      type="button"
                      onClick={() => setClaimed((cur) => ({ ...cur, [c.id]: !cur[c.id] }))}
                      className={`mt-auto h-7 rounded-full text-[11px] font-semibold border-none cursor-pointer ${
                        got ? 'bg-[#FFE2D3] text-[#FF6A2C]' : 'bg-gradient-to-r from-[#FF6A2C] to-[#FF3B2F] text-white'
                      }`}
                    >
                      {got ? '已领取' : '立即领取'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {kind === 'hotel' && (
          <div className="grid gap-2">
            {DEAL_HOTELS.map((h) => (
              <button
                key={h.name}
                type="button"
                {...bindTap('home.main.14.open', { beforeTrigger: onClose })}
                className="p-2 flex gap-2.5 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer"
              >
                <Img src={image(h.img)} className="w-[104px] h-[84px] rounded-lg object-cover shrink-0" alt={h.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold line-clamp-1">{h.name}</div>
                  <div className="mt-1 flex items-center gap-1">
                    <span className="text-[10px] text-[#17B7BB] bg-[#E8F9F9] rounded px-1.5 py-0.5">{h.city}</span>
                    <span className="text-[10px] text-[#FF3B2F] bg-[#FFF1EA] rounded px-1.5 py-0.5">特价</span>
                  </div>
                  <div className="mt-2 flex items-end">
                    <span className="text-[10px] text-[#B4BBBF] line-through mr-1">¥{h.was}</span>
                    <Price value={h.now} />
                    <span className="ml-auto text-[10px] text-[#FF6A2C]">立减¥{h.was - h.now}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {kind === 'flight' && (
          <div className="grid gap-2">
            {DEAL_FLIGHTS.map((f) => (
              <button
                key={`${f.from}-${f.to}`}
                type="button"
                {...bindTap('home.main.0.open', { beforeTrigger: onClose })}
                className="p-3 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer flex items-center"
              >
                <div>
                  <div className="text-[15px] font-semibold">
                    {f.from} <span className="text-[#8A9499]">→</span> {f.to}
                  </div>
                  <div className="text-[10px] text-[#8A9499] mt-1">{f.date} 出发 · 经济舱</div>
                </div>
                <span className="ml-3 text-[10px] text-[#FF3B2F] bg-[#FFF1EA] rounded px-1.5 py-0.5">{f.discount}</span>
                <div className="ml-auto text-right">
                  <Price value={f.price} suffix="起" />
                  <div className="text-[10px] text-[#FF6A2C] mt-0.5">抢</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchChip({ text }: { text: string }) {
  const { bindTap } = useQunaerGestures();
  return (
    <button
      type="button"
      {...bindTap('home.search.landing.1.open')}
      className="bg-transparent border-none p-0 cursor-pointer"
    >
      <StaticChip>{text}</StaticChip>
    </button>
  );
}

function SearchLanding() {
  const hotels = useQunaerStore((state) => state.hotels);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const { bindTap } = useQunaerGestures();
  return (
    <div className="px-3 py-3">
      <button
        type="button"
        {...bindTap('home.search.landing.0.open')}
        className="h-9 rounded-full border border-[#27C8CB] bg-white flex items-center px-3 gap-2 w-full cursor-pointer text-left"
      >
        <IcSearch size={15} className="text-[#23BFC3]" />
        <span className="text-[12px] text-[#68757B] flex-1">灵谷景区</span>
        <span className="text-[12px] text-white bg-[#22C7CB] rounded-full px-3 py-1">搜索</span>
      </button>
      <div className="mt-3 rounded-lg bg-[#FFF8EE] text-[#B47A3E] text-[11px] px-3 py-2">
        开启定位，为您提供更优质的搜索体验
      </div>
      <div className="flex gap-2 mt-3">
        {['酒店', '机票', '火车票', '门票'].map((text) => (
          <SearchChip key={text} text={text} />
        ))}
      </div>
      <SectionTitle>历史搜索</SectionTitle>
      <div className="flex gap-2">
        {['烟台', '威海'].map((text) => (
          <SearchChip key={text} text={text} />
        ))}
      </div>
      <div className="flex items-center px-0 pt-3 pb-2">
        <h2 className="m-0 text-[16px] font-bold text-[#202A2E]">热门推荐</h2>
        <button
          type="button"
          {...bindTap({ kind: 'action', id: 'home.search.landing.3.other' }, {
            onTrigger: () => recordAction('home.search.landing.3.other', '换一换'),
          })}
          className="ml-auto inline-flex items-center text-[11px] text-[#8A9499] bg-transparent border-none cursor-pointer"
        >
          换一换
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {['南京到鞍山的火车票', '灵谷景区', '南京欢乐谷', '汉庭酒店', '明孝陵', '中山陵景区'].map((text) => (
          <SearchChip key={text} text={text} />
        ))}
      </div>
      <SectionTitle>精选酒店</SectionTitle>
      <div className="grid gap-2">
        {hotels.slice(0, 3).map((hotel, index) => (
          <button
            key={hotel.id}
            type="button"
            {...bindTap('home.search.landing.2.open')}
            className="p-2 flex gap-2 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer w-full"
          >
            <span className="w-7 h-7 rounded bg-[#FF8B36] text-white text-[10px] flex items-center justify-center shrink-0">
              NO.{index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium truncate">{hotel.name}</div>
              <Score value={hotel.score} />
            </div>
            <span className="text-[11px] text-[#FF6A2B]">↑{hotel.reviews}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchForm({ nodeId }: { nodeId: string }) {
  const search = useQunaerStore((state) => state.search);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setCityTarget = useQunaerStore((state) => state.setCityTarget);
  const setHotelKeyword = useQunaerStore((state) => state.setHotelKeyword);
  const [showPax, setShowPax] = React.useState(false);
  const setTripType = useQunaerStore((state) => state.setTripType);
  const setTrainTripType = useQunaerStore((state) => state.setTrainTripType);
  const setTrainHighSpeed = useQunaerStore((state) => state.setTrainHighSpeed);
  const setDateTarget = useQunaerStore((state) => state.setDateTarget);
  const swapTrainCities = useQunaerStore((state) => state.swapTrainCities);
  const { bindTap } = useQunaerGestures();
  const isHotel = nodeId.startsWith('hotel');
  const isTrain = nodeId.startsWith('train');
  const tripTabs = isTrain ? ['单程', '往返', '中转'] : ['单程', '往返', '多程'];
  const tripType = isTrain ? search.trainTripType : search.tripType;
  const setTrip = isTrain ? setTrainTripType : setTripType;
  const roundtrip = tripType === '往返';
  // 去程/返程日期都进价格日历，用直接字面量绑定以便静态一致性校验识别。
  const departBind = isTrain
    ? bindTap('train.search.3.open', { beforeTrigger: () => setDateTarget('depart') })
    : bindTap('flight.search.3.open', { beforeTrigger: () => setDateTarget('depart') });
  const returnBind = isTrain
    ? bindTap('train.search.3.open', { beforeTrigger: () => setDateTarget('return') })
    : bindTap('flight.search.3.open', { beforeTrigger: () => setDateTarget('return') });

  return (
    <div className="px-3 py-3">
      <div className="h-[118px] rounded-xl bg-gradient-to-br from-[#35CEE0] to-[#4A92F6] p-4 text-white overflow-hidden relative">
        <div className="text-[21px] font-extrabold">
          {isHotel ? '住得好 · 玩得美' : isTrain ? '坐火车 · 去旅行' : '夏日进行时'}
        </div>
        <div className="text-[12px] mt-2 opacity-90">天天抢旅行神券 · 最高立减50元</div>
        {isHotel ? (
          <IcHotel className="absolute right-5 bottom-2 opacity-50" size={62} />
        ) : isTrain ? (
          <IcTrain className="absolute right-5 bottom-2 opacity-50" size={62} />
        ) : (
          <IcPlane className="absolute right-5 bottom-2 opacity-50" size={62} />
        )}
      </div>
      <Card className="-mt-6 relative z-10 p-3">
        {!isHotel && (
          <div className="flex justify-around text-[13px] mb-4">
            {tripTabs.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTrip(label)}
                className={`bg-transparent border-none cursor-pointer pb-2 ${
                  tripType === label ? 'text-[#22BCC0] border-b-2 border-[#22C7CB]' : 'text-[#8A9499]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        {isHotel ? (
          <>
            <button
              type="button"
              {...bindTap('hotel.search.0.open', { beforeTrigger: () => setCityTarget('hotel') })}
              className="bg-transparent border-none p-0 text-left cursor-pointer w-full"
            >
              <div className="text-[22px] font-medium">{search.hotelCity}</div>
            </button>
            <button
              type="button"
              {...bindTap('hotel.search.1.open')}
              className="border-t border-[#edf0f2] mt-3 pt-3 flex items-center justify-between bg-transparent border-x-0 border-b-0 w-full cursor-pointer"
            >
              <div>
                <span className="text-[17px] font-medium">{search.hotelCheckIn}</span>
                <span className="text-[10px] text-[#8A9499] ml-1">入住</span>
              </div>
              <IcCalendar size={15} className="text-[#22C7CB]" />
              <div>
                <span className="text-[17px] font-medium">{search.hotelCheckOut}</span>
                <span className="text-[10px] text-[#8A9499] ml-1">离店</span>
              </div>
            </button>
            <div className="border-t border-[#edf0f2] mt-3 pt-3">
              <input
                type="text"
                value={search.hotelKeyword}
                onChange={(event) => setHotelKeyword(event.target.value)}
                placeholder="位置 / 酒店名 / 关键字"
                className="w-full text-[13px] text-[#202A2E] placeholder:text-[#8A9499] bg-transparent border-none outline-none"
              />
            </div>
            <button
              type="button"
              {...bindTap('hotel.search.2.open')}
              className="mt-4 h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white flex items-center justify-center font-semibold text-[15px] border-none w-full cursor-pointer"
            >
              搜索
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <button
                type="button"
                {...(isTrain
                  ? bindTap('train.search.0.open', { beforeTrigger: () => setCityTarget('train-from') })
                  : bindTap('flight.search.0.open', { beforeTrigger: () => setCityTarget('flight-from') }))}
                className="bg-transparent border-none p-0 text-left cursor-pointer"
              >
                <div className="text-[23px] font-medium">{isTrain ? search.trainFrom : search.fromCity}</div>
                <div className="text-[10px] text-[#9AA3A7]">出发地</div>
              </button>
              {isTrain ? (
                <button
                  type="button"
                  onClick={swapTrainCities}
                  className="w-8 h-8 rounded-full bg-[#EDF9FA] flex items-center justify-center text-[#22C7CB] border-none cursor-pointer text-[16px]"
                >
                  ⇄
                </button>
              ) : (
                <button
                  type="button"
                  {...bindTap({ kind: 'action', id: 'flight.search.2.other' }, {
                    onTrigger: () => recordAction('flight.search.2.other', '换向按钮'),
                  })}
                  className="w-8 h-8 rounded-full bg-[#EDF9FA] flex items-center justify-center text-[#22C7CB] border-none cursor-pointer"
                >
                  ⇄
                </button>
              )}
              <button
                type="button"
                {...(isTrain
                  ? bindTap('train.search.0.open', { beforeTrigger: () => setCityTarget('train-to') })
                  : bindTap('flight.search.1.open', { beforeTrigger: () => setCityTarget('flight-to') }))}
                className="bg-transparent border-none p-0 text-right cursor-pointer"
              >
                <div className="text-[23px] font-medium">{isTrain ? search.trainTo : search.toCity}</div>
                <div className="text-[10px] text-[#9AA3A7]">目的地</div>
              </button>
            </div>
            <div className="border-t border-[#edf0f2] mt-3 pt-3 flex items-end">
              <button
                type="button"
                {...departBind}
                className="flex flex-col items-start bg-transparent border-none p-0 cursor-pointer text-left"
              >
                <span className="text-[10px] text-[#9AA3A7]">{roundtrip ? '去程' : '出发'}</span>
                <span className="text-[17px] font-medium flex items-end">
                  {search.departDate}
                  <IcCalendar size={13} className="text-[#22C7CB] ml-1 mb-0.5" />
                </span>
              </button>
              {roundtrip && (
                <button
                  type="button"
                  {...returnBind}
                  className="flex flex-col items-start bg-transparent border-none p-0 cursor-pointer text-left ml-5"
                >
                  <span className="text-[10px] text-[#9AA3A7]">返程</span>
                  <span className="text-[17px] font-medium flex items-end">
                    {search.returnDate}
                    <IcCalendar size={13} className="text-[#22C7CB] ml-1 mb-0.5" />
                  </span>
                </button>
              )}
              {isTrain ? (
                <button
                  type="button"
                  onClick={() => setTrainHighSpeed(!search.trainHighSpeed)}
                  className="ml-auto flex items-center gap-1 text-[12px] text-[#69757A] bg-transparent border-none cursor-pointer"
                >
                  <span
                    className={`w-4 h-4 rounded-[5px] flex items-center justify-center ${
                      search.trainHighSpeed ? 'bg-[#22C7CB]' : 'border border-[#CBD3D6]'
                    }`}
                  >
                    {search.trainHighSpeed && <IcCheck size={11} className="text-white" />}
                  </span>
                  只看高铁动车
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowPax(true)}
                  className="ml-auto text-[12px] text-[#69757A] bg-transparent border-none cursor-pointer self-end"
                >
                  选择乘机人 ›
                </button>
              )}
            </div>
            <button
              type="button"
              {...(isTrain ? bindTap('train.search.2.open') : bindTap('flight.search.4.open'))}
              className="mt-4 h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white flex items-center justify-center font-semibold text-[15px] border-none w-full cursor-pointer"
            >
              搜索
            </button>
          </>
        )}
      </Card>
      {!isHotel && (
        <div className="grid grid-cols-4 gap-2 mt-3">
          {(isTrain
            ? ['学生特惠', '时刻表', '退改政策', '常用信息']
            : ['低价助手', '值机选座', '常用信息', '领券中心']
          ).map((label) => (
            <div key={label} className="text-center">
              <span className="mx-auto w-9 h-9 rounded-xl bg-[#E8F9F9] text-[#17B7BB] flex items-center justify-center">
                {isTrain ? <IcTrain size={18} /> : <IcGift size={18} />}
              </span>
              <div className="text-[10px] mt-1">{label}</div>
            </div>
          ))}
        </div>
      )}
      {showPax && <PassengerPickerSheet onClose={() => setShowPax(false)} />}
    </div>
  );
}

// 机票搜索页「选择乘机人」底部弹层：每行点击 = 勾选/取消，人数决定按几成人计价。
function PassengerPickerSheet({ onClose }: { onClose: () => void }) {
  const passengers = useQunaerStore((state) => state.passengers);
  const selectedIds = useQunaerStore((state) => state.selectedPassengerIds);
  const toggle = useQunaerStore((state) => state.togglePassengerSelected);
  const setEditingPassenger = useQunaerStore((state) => state.setEditingPassenger);
  const { bindTap } = useQunaerGestures();
  const adults = passengers.filter((p) => selectedIds.includes(p.id) && p.type !== '学生票').length;
  const students = passengers.filter((p) => selectedIds.includes(p.id) && p.type === '学生票').length;
  const summary = [adults ? `${adults}成人` : '', students ? `${students}学生` : ''].filter(Boolean).join(' + ') || '未选择';

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-2xl max-h-[76%] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 pt-4 pb-2 flex items-start">
          <div className="flex-1">
            <div className="text-[16px] font-semibold">选择出行偏好</div>
            <div className="text-[12px] text-[#8A9499] mt-1">请选择出行偏好，获取 <span className="text-[#17B7BB] font-medium">专属优惠报价</span></div>
          </div>
          <button type="button" onClick={onClose} className="text-[#8A9499] text-[20px] bg-transparent border-none cursor-pointer leading-none">×</button>
        </div>
        <div className="px-4 flex gap-2">
          {['商旅出行', '家庭出行'].map((t) => (
            <span key={t} className="text-[12px] text-[#59666C] border border-[#DDE3E5] rounded-lg px-4 py-1.5">{t}</span>
          ))}
        </div>
        <div className="px-4 mt-4">
          <div className="text-[15px] font-semibold">选择乘机人</div>
          <div className="text-[12px] text-[#8A9499] mt-1">将为您推荐符合 <span className="text-[#FF7A2E] font-medium">{summary}</span> 出行的最优惠票价</div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 grid gap-2.5">
          {passengers.map((person) => {
            const on = selectedIds.includes(person.id);
            return (
              <div
                key={person.id}
                className={`rounded-xl border p-3 flex items-center ${on ? 'border-[#22C7CB] bg-[#F2FCFC]' : 'border-[#E7ECEE] bg-white'}`}
              >
                <button
                  type="button"
                  {...bindTap('mine.passengers.0.open', { beforeTrigger: () => setEditingPassenger(person.id) })}
                  className="text-[#B4BBBF] bg-transparent border-none cursor-pointer mr-2"
                  aria-label="编辑"
                >
                  <IcUser size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(person.id)}
                  className="flex-1 flex items-center bg-transparent border-none cursor-pointer text-left p-0"
                >
                  <div className="flex-1">
                    <div className="text-[15px] font-medium">
                      {person.name} <span className="text-[10px] text-[#879399]">{person.type}</span>
                    </div>
                    <div className="text-[11px] text-[#8A9499] mt-0.5">身份证 {person.idNo}</div>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      on ? 'bg-[#22C7CB]' : 'border-2 border-[#CBD3D6]'
                    }`}
                  >
                    {on && <IcCheck size={14} className="text-white" />}
                  </span>
                </button>
              </div>
            );
          })}
          <button
            type="button"
            {...bindTap('mine.passengers.0.open', { beforeTrigger: () => setEditingPassenger(null) })}
            className="text-[13px] text-[#17B7BB] font-medium py-2 bg-transparent border border-dashed border-[#B7E7E8] rounded-xl cursor-pointer"
          >
            ＋ 添加乘机人
          </button>
        </div>
        <div className="px-4 py-3 border-t border-[#eef1f2]">
          <button
            type="button"
            onClick={onClose}
            className="w-full h-11 rounded-full bg-gradient-to-r from-[#2CD3D8] to-[#22B8BD] text-white font-semibold border-none cursor-pointer"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

function weekOf(day: number): string {
  return WEEK_LABELS[TimeService.fromLocalParts(2026, 7, day).getDay()];
}

// 解析「M月D日」文案
function parseMonthDay(text: string): { month: number; day: number } | null {
  const match = /(\d+)月(\d+)日/.exec(text);
  return match ? { month: Number(match[1]), day: Number(match[2]) } : null;
}

// 计算入住到离店的实际晚数（默认至少 1 晚）
function nightsBetween(checkIn: string, checkOut: string): number {
  const a = parseMonthDay(checkIn);
  const b = parseMonthDay(checkOut);
  if (!a || !b) return 1;
  const start = TimeService.fromLocalParts(2026, a.month - 1, a.day);
  const end = TimeService.fromLocalParts(2026, b.month - 1, b.day);
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff > 0 ? diff : 1;
}

function CalendarView({ nodeId }: { nodeId: string }) {
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setDepartDate = useQunaerStore((state) => state.setDepartDate);
  const setReturnDate = useQunaerStore((state) => state.setReturnDate);
  const setHotelDates = useQunaerStore((state) => state.setHotelDates);
  const dateTarget = useQunaerStore((state) => state.dateTarget);
  const search = useQunaerStore((state) => state.search);
  const { back } = useQunaerGestures();
  const { bindTap } = useQunaerGestures();
  const isHotel = nodeId.startsWith('hotel');
  const isTrain = nodeId.startsWith('train');
  // 往返机票/往返火车：价格日历改为区间选择（去程 → 返程），和酒店入离店同构。
  const roundtrip = !isHotel && (isTrain ? search.trainTripType === '往返' : search.tripType === '往返');
  const range = isHotel || roundtrip;
  const daysInMonth = 31;
  const leadingBlanks = TimeService.fromLocalParts(2026, 7, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);

  const [single, setSingle] = React.useState(26);
  const [checkIn, setCheckIn] = React.useState<number | null>(null);
  const [checkOut, setCheckOut] = React.useState<number | null>(null);
  const actionId = isHotel ? 'hotel.calendar.0.other' : 'flight.calendar.0.other';

  const startLabel = isHotel ? '入住' : '去程';
  const endLabel = isHotel ? '离店' : '返程';

  const pickRange = (day: number) => {
    if (checkIn === null || checkOut !== null) {
      setCheckIn(day);
      setCheckOut(null);
    } else if (day <= checkIn) {
      setCheckIn(day);
    } else {
      setCheckOut(day);
    }
    recordAction(actionId, `8月${day}日`);
  };

  const pickSingle = (day: number) => {
    setSingle(day);
    recordAction(actionId, `8月${day}日`);
  };

  const confirm = () => {
    if (range) {
      if (checkIn === null) return;
      const end = checkOut ?? checkIn + 1;
      if (isHotel) {
        setHotelDates(`8月${checkIn}日`, `8月${end}日`);
      } else {
        setDepartDate(`8月${checkIn}日 周${weekOf(checkIn)}`);
        setReturnDate(`8月${end}日 周${weekOf(end)}`);
      }
    } else {
      const label = `8月${single}日 周${weekOf(single)}`;
      if (dateTarget === 'return') setReturnDate(label);
      else setDepartDate(label);
    }
    back();
  };

  const dayState = (day: number): 'in' | 'start' | 'end' | 'mid' | 'off' => {
    if (!range) return day === single ? 'in' : 'off';
    if (day === checkIn) return 'start';
    if (day === checkOut) return 'end';
    if (checkIn !== null && checkOut !== null && day > checkIn && day < checkOut) return 'mid';
    return 'off';
  };

  const summary = range
    ? checkIn === null
      ? `请选择${startLabel}日期`
      : checkOut === null
        ? `${startLabel} 8月${checkIn}日 · 请选择${endLabel}日期`
        : `8月${checkIn}日 - 8月${checkOut}日 · ${isHotel ? `共${checkOut - checkIn}晚` : '往返'}`
    : `出发 8月${single}日 周${weekOf(single)}`;

  return (
    <div className="bg-white flex flex-col min-h-full">
      <div className="px-3 py-3 flex-1">
        <div className="text-center text-[15px] font-semibold mb-3">
          {isHotel ? '选择入住/离店日期' : roundtrip ? '选择去程/返程日期' : '选择出发日期'}
        </div>
        <div className="grid grid-cols-7 text-center text-[11px] text-[#7A858B] mb-2">
          {WEEK_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
        <div className="bg-[#F6F8F9] px-2 py-2 text-[14px] font-semibold rounded">2026年8月</div>
        <div className="grid grid-cols-7 gap-y-1.5 mt-2">
          {Array.from({ length: leadingBlanks }, (_, index) => (
            <span key={`blank-${index}`} />
          ))}
          {days.map((day) => {
            const st = dayState(day);
            const highlight = st === 'in' || st === 'start' || st === 'end';
            return (
              <button
                key={day}
                type="button"
                {...bindTap({ kind: 'action', id: actionId }, {
                  onTrigger: () => (range ? pickRange(day) : pickSingle(day)),
                })}
                className={`h-12 flex flex-col items-center justify-center text-[13px] border-none cursor-pointer ${
                  st === 'mid'
                    ? 'bg-[#EAFAFB] text-[#202A2E]'
                    : highlight
                      ? 'bg-[#D6F3F4] text-[#0E9AA0] font-bold rounded-lg ring-1 ring-[#22C7CB]'
                      : 'bg-transparent text-[#202A2E]'
                }`}
              >
                <span>{day}</span>
                <span className={`text-[8px] ${highlight ? 'text-[#0E9AA0] font-semibold' : 'text-[#AA7A45]'}`}>
                  {st === 'start' ? startLabel : st === 'end' ? endLabel : `¥${day % 3 === 0 ? 320 : 350}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-[#edf0f2] px-3 py-2.5 flex items-center gap-3">
        <span className="text-[12px] text-[#59666C] flex-1">{summary}</span>
        <button
          type="button"
          onClick={confirm}
          disabled={range && checkIn === null}
          className={`h-10 px-6 rounded-full text-white text-[14px] font-semibold border-none ${
            range && checkIn === null ? 'bg-[#Bfe7e8] cursor-not-allowed' : 'bg-[#22C7CB] cursor-pointer'
          }`}
        >
          确定
        </button>
      </div>
    </div>
  );
}

function PickerView({ nodeId }: { nodeId: string }) {
  const passengers = useQunaerStore((state) => state.passengers);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setCity = useQunaerStore((state) => state.setCity);
  const cityTarget = useQunaerStore((state) => state.cityTarget);
  const { bindTap, back } = useQunaerGestures();
  const actionId = nodeId.includes('passenger')
    ? 'train.passenger.pick.0.other'
    : nodeId.startsWith('hotel')
      ? 'hotel.citypicker.0.other'
      : nodeId.startsWith('train')
        ? 'train.stationpicker.0.other'
        : 'flight.citypicker.0.other';

  if (nodeId.includes('passenger')) {
    return (
      <div className="px-3 py-3 grid gap-2">
        <Card className="p-3 text-[12px] text-[#69757A]">12306账号　139****0000</Card>
        <div className="grid grid-cols-2 gap-2">
          <Card className="p-3 text-center">邀请好友填写</Card>
          <Card className="p-3 text-center text-[#22BFC3]">＋ 新增乘客</Card>
        </div>
        {passengers.map((person) => (
          <button
            key={person.id}
            type="button"
            {...bindTap({ kind: 'action', id: actionId }, {
              onTrigger: () => recordAction(actionId, '勾选乘车人'),
            })}
            className="p-3 flex items-center gap-3 bg-white rounded-xl border border-[#edf0f2] cursor-pointer text-left"
          >
            <span className="w-5 h-5 rounded-full border-2 border-[#22C7CB]" />
            <div>
              <div className="text-[14px] font-medium">
                {person.name} <span className="text-[10px] text-[#879399]">{person.type}</span>
              </div>
              <div className="text-[11px] text-[#8A9499] mt-1">{person.idNo}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="px-3 py-3">
      <div className="h-9 rounded-full bg-[#F2F5F6] flex items-center px-3 gap-2">
        <IcSearch size={15} />
        <span className="text-[12px] text-[#9AA3A7]">输入城市或机场</span>
      </div>
      <SectionTitle>热门城市</SectionTitle>
      <div className="grid grid-cols-4 gap-2">
        {['北京', '上海', '广州', '深圳', '南京', '成都', '长沙', '烟台'].map((city) => (
          <button
            key={city}
            type="button"
            {...bindTap({ kind: 'action', id: actionId }, {
              onTrigger: () => {
                recordAction(actionId, city);
                setCity(cityTarget, city);
                back();
              },
            })}
            className="bg-[#F5F7F8] rounded-md px-2.5 py-1.5 text-[11px] text-[#667177] border-none cursor-pointer"
          >
            {city}
          </button>
        ))}
      </div>
    </div>
  );
}

interface TransitEntry {
  d: string;
  a: string;
  dur: string;
  carrier: string;
  price: number;
  stops: number;
  via: string;
  cat: string;
  info: string;
  freeBag: boolean;
  hasTicket: boolean;
}

const FLIGHT_ENTRIES: TransitEntry[] = [
  { d: '07:15', a: '08:50', dur: '1h35m', carrier: '深航 ZH9102', price: 259, stops: 0, via: '', cat: '经济舱', info: '经济舱 · 免费托运20kg', freeBag: true, hasTicket: true },
  { d: '09:20', a: '10:50', dur: '1h30m', carrier: '南航 CZ3308', price: 278, stops: 0, via: '', cat: '经济舱', info: '经济舱 · 地铁直达', freeBag: true, hasTicket: true },
  { d: '15:00', a: '16:30', dur: '1h30m', carrier: '厦航 MF2388', price: 309, stops: 0, via: '', cat: '经济舱', info: '经济舱 · 含餐食', freeBag: true, hasTicket: true },
  { d: '18:45', a: '20:20', dur: '1h35m', carrier: '东航 MU2810', price: 338, stops: 0, via: '', cat: '经济舱', info: '经济舱 · 免费托运20kg', freeBag: true, hasTicket: true },
  { d: '22:30', a: '23:55', dur: '1h25m', carrier: '吉祥航空 HO1234', price: 249, stops: 0, via: '', cat: '特价', info: '特价舱 · 不含托运行李', freeBag: false, hasTicket: true },
  { d: '06:10', a: '12:40', dur: '6h30m', carrier: '南航 CZ 经武汉', price: 199, stops: 1, via: '武汉', cat: '中转', info: '武汉中转1次 · 同航司', freeBag: true, hasTicket: true },
  { d: '13:20', a: '19:05', dur: '5h45m', carrier: '东航 MU 经南昌', price: 218, stops: 1, via: '南昌', cat: '中转', info: '南昌中转1次 · 换乘45分', freeBag: true, hasTicket: true },
];

const TRAIN_ENTRIES: TransitEntry[] = [
  { d: '08:10', a: '14:36', dur: '6h26m', carrier: 'G1228', price: 328, stops: 0, via: '', cat: '高铁', info: '二等座有票 · 可选座', freeBag: true, hasTicket: true },
  { d: '09:15', a: '16:40', dur: '7h25m', carrier: 'G2601', price: 299, stops: 0, via: '', cat: '高铁', info: '二等座有票 · 可选座', freeBag: true, hasTicket: true },
  { d: '22:57', a: '07:25', dur: '8h28m', carrier: 'D118', price: 187, stops: 0, via: '', cat: '动车', info: '动卧有票 · 过夜', freeBag: true, hasTicket: true },
  { d: '20:29', a: '06:12', dur: '9h43m', carrier: 'K705', price: 158, stops: 0, via: '', cat: '普速', info: '硬卧候补 · 过夜', freeBag: true, hasTicket: false },
  { d: '07:30', a: '15:10', dur: '7h40m', carrier: 'G+沈阳换乘', price: 176, stops: 1, via: '沈阳', cat: '高铁', info: '沈阳换乘 · 停留38分', freeBag: true, hasTicket: true },
  { d: '11:00', a: '20:30', dur: '9h30m', carrier: 'D+天津换乘', price: 165, stops: 1, via: '天津', cat: '动车', info: '天津换乘 · 停留52分', freeBag: true, hasTicket: true },
];

const DAY_DELTA = [0, 28, -18, 46, 12];

function FlightTrainList({ train }: { train: boolean }) {
  const recordAction = useQunaerStore((state) => state.recordAction);
  const search = useQunaerStore((state) => state.search);
  const setTrainHighSpeed = useQunaerStore((state) => state.setTrainHighSpeed);
  const setRoundTrip = useQunaerStore((state) => state.setRoundTrip);
  const { bindTap } = useQunaerGestures();
  const openId = train ? 'train.list.0.open' : 'flight.list.0.open';
  const [activeDay, setActiveDay] = React.useState(0);
  const [chips, setChips] = React.useState<string[]>([]);
  const toggleChip = (chip: string) =>
    setChips((cur) => (cur.includes(chip) ? cur.filter((item) => item !== chip) : [...cur, chip]));

  const roundtrip = train ? search.trainTripType === '往返' : search.tripType === '往返';
  // 往返：两段各自选一班（去程 / 返程），各列独立日期与选择。
  const [departSel, setDepartSel] = React.useState<TransitEntry | null>(null);
  const [returnSel, setReturnSel] = React.useState<TransitEntry | null>(null);
  const [departDay, setDepartDay] = React.useState(2);
  const [returnDay, setReturnDay] = React.useState(2);

  const cityFrom = train ? search.trainFrom : '广州';
  const cityTo = train ? search.trainTo : '长沙';
  const fromLabel = train ? search.trainFrom : '广州T2';
  const toLabel = train ? search.trainTo : '长沙T2';
  // 多程机票 / 中转火车：本页应主推中转方案
  const transferMode = train ? search.trainTripType === '中转' : search.tripType === '多程';
  const highSpeed = train && search.trainHighSpeed;
  const base = train ? TRAIN_ENTRIES : FLIGHT_ENTRIES;

  const legDateLabel = (isReturn: boolean) => {
    const anchor = isReturn ? 28 : 26;
    const day = anchor - 2 + (isReturn ? returnDay : departDay);
    return `8月${day}日 周${weekOf(day)}`;
  };
  const legInfo = (e: TransitEntry, isReturn: boolean) => ({
    d: e.d,
    a: e.a,
    carrier: e.carrier,
    price: e.price,
    date: legDateLabel(isReturn),
    from: isReturn ? cityTo : cityFrom,
    to: isReturn ? cityFrom : cityTo,
  });

  // ========== 往返：左右两栏（左去程 / 右返程），各栏独立滚动 ==========
  if (roundtrip) {
    const total = (departSel?.price ?? 0) + (returnSel?.price ?? 0);
    const bothPicked = !!departSel && !!returnSel;

    const buildLegList = (isReturn: boolean, dayIdx: number) => {
      const delta = (DAY_DELTA[dayIdx] ?? 0) + (isReturn ? 100 : 0);
      return base
        .filter((e) => (highSpeed ? e.cat === '高铁' || e.cat === '动车' : true))
        .map((e) => ({ ...e, price: e.price + delta }))
        .sort((a, b) => a.price - b.price);
    };

    const renderColumn = (isReturn: boolean) => {
      const dayIdx = isReturn ? returnDay : departDay;
      const setDay = isReturn ? setReturnDay : setDepartDay;
      const sel = isReturn ? returnSel : departSel;
      const setSel = isReturn ? setReturnSel : setDepartSel;
      const legFrom = isReturn ? toLabel : fromLabel;
      const legTo = isReturn ? fromLabel : toLabel;
      const anchor = isReturn ? 28 : 26;
      const items = buildLegList(isReturn, dayIdx);
      return (
        <div className="flex-1 min-w-0 flex flex-col">
          <div
            className={`px-2 py-1.5 flex items-center text-white text-[12px] font-semibold ${
              isReturn ? 'bg-[#22B36B]' : 'bg-[#22AEE0]'
            }`}
          >
            {isReturn ? '返程' : '去程'}
            <span className="ml-auto text-[10px] font-normal opacity-90">日历▾</span>
          </div>
          <div className="flex bg-white text-center">
            {Array.from({ length: 5 }, (_, i) => anchor - 2 + i).map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => setDay(i)}
                className={`flex-1 py-1 text-[9px] border-none bg-transparent cursor-pointer ${
                  dayIdx === i ? 'text-[#22BFC3] font-semibold' : 'text-[#7A858B]'
                }`}
              >
                08-{day}
                <br />周{weekOf(day)}
              </button>
            ))}
          </div>
          <div className="flex bg-white text-[9px] border-t border-[#f0f2f3] px-1 pb-1 gap-1">
            <span className="text-[#22BFC3] font-medium">价格低-高</span>
            <span className="text-[#8A9499]">时间</span>
            <span className="text-[#8A9499] ml-auto">筛选▾</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-[#F4F6F7] px-1.5 py-1.5 grid gap-1.5 content-start">
            {items.map((e) => {
              const on = sel?.carrier === e.carrier;
              return (
                <button
                  key={e.carrier}
                  type="button"
                  onClick={() => setSel(e)}
                  className={`p-2 bg-white rounded-lg border text-left cursor-pointer ${
                    on ? 'border-[#22C7CB] ring-1 ring-[#22C7CB]' : 'border-[#eaeef0]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[15px] font-semibold leading-tight">
                    <span>{e.d}</span>
                    <span className="text-[#B4BBBF] text-[10px]">→</span>
                    <span>{e.a}</span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#8A9499] mt-0.5">
                    <span>{legFrom}</span>
                    <span>{legTo}</span>
                  </div>
                  <div className="text-[9px] text-[#8A9499] mt-1">
                    {e.stops === 1 ? `一转 ${e.dur}` : e.dur}
                    {!e.hasTicket && <span className="text-[#FF7A2E]"> · 候补</span>}
                  </div>
                  <div className="text-[9px] text-[#9AA3A7] truncate">{e.carrier}</div>
                  <div className="mt-1 text-right text-[#FF3B2F] font-semibold text-[14px]">
                    ¥{e.price}
                    <span className="text-[9px] font-normal">起</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      );
    };

    return (
      <div className="h-full flex flex-col bg-[#EEF1F2]">
        <div className="bg-[#EAF3FF] text-[11px] px-3 py-1.5 flex items-center">
          <span className="text-[#2B6CB0] font-medium">多人专享</span>
          <span className="ml-1 text-[#5B6B76] truncate">多人出行暑期起飞最高额外补贴</span>
        </div>
        <div className="flex-1 flex min-h-0">
          {renderColumn(false)}
          <div className="w-px bg-[#dfe5e7]" />
          {renderColumn(true)}
        </div>
        <div className="bg-white border-t border-[#edf0f2] px-3 py-2.5 flex items-center gap-3">
          <div className="flex-1 leading-tight">
            <div>
              <span className="text-[#FF3B2F] font-bold text-[18px]">¥{total}</span>
              <span className="text-[10px] text-[#8A9499] ml-1">往返价格</span>
            </div>
            <div className="text-[9px] text-[#8A9499]">
              {departSel ? `去程 ${departSel.d}` : '未选去程'} · {returnSel ? `返程 ${returnSel.d}` : '未选返程'}
            </div>
          </div>
          <button
            type="button"
            disabled={!bothPicked}
            {...(bothPicked
              ? bindTap(openId, {
                  beforeTrigger: () =>
                    setRoundTrip({
                      train,
                      depart: legInfo(departSel as TransitEntry, false),
                      return: legInfo(returnSel as TransitEntry, true),
                    }),
                })
              : {})}
            className={`h-11 px-8 rounded-full text-white text-[15px] font-semibold border-none ${
              bothPicked ? 'bg-gradient-to-r from-[#FF9A67] to-[#FF385C] cursor-pointer' : 'bg-[#F0B9A6] cursor-not-allowed'
            }`}
          >
            下一步
          </button>
        </div>
      </div>
    );
  }

  // ========== 单程：单列航班/车次列表 ==========
  const dayDelta = DAY_DELTA[activeDay] ?? 0;
  const list = base
    .filter((e) => (transferMode ? e.stops === 1 : true))
    .filter((e) => (chips.includes('只看直达') ? e.stops === 0 : true))
    .filter((e) => (chips.includes('免费行李') ? e.freeBag : true))
    .filter((e) => (chips.includes('只看有票') ? e.hasTicket : true))
    .filter((e) => (highSpeed ? e.cat === '高铁' || e.cat === '动车' : true))
    .filter((e) => (chips.includes('不看早晚班') ? Number(e.d.slice(0, 2)) >= 8 && Number(e.d.slice(0, 2)) <= 20 : true))
    .map((e) => ({ ...e, price: e.price + dayDelta }));

  const chipList = train
    ? ['只看直达', '只看高铁动车', '只看有票', '筛选']
    : ['只看直达', '免费行李', '不看早晚班', '筛选'];
  const chipActive = (chip: string) => (chip === '只看高铁动车' ? highSpeed : chips.includes(chip));
  const onChip = (chip: string) => {
    if (chip === '只看高铁动车') setTrainHighSpeed(!highSpeed);
    else toggleChip(chip);
  };

  return (
    <div className="px-3 py-3">
      <div className="flex justify-between bg-white rounded-xl p-2 text-[11px]">
        {['今天', '周三', '周四', '周五', '周六'].map((day, index) => (
          <button
            key={day}
            type="button"
            {...(!train
              ? bindTap({ kind: 'action', id: 'flight.list.1.other' }, {
                  onTrigger: () => {
                    recordAction('flight.list.1.other', `已切换到 8.${26 + index}`);
                    setActiveDay(index);
                  },
                })
              : { onClick: () => setActiveDay(index) })}
            className={`bg-transparent border-none cursor-pointer ${activeDay === index ? 'text-[#22BFC3] font-semibold' : 'text-[#667177]'}`}
          >
            {day}
            <br />
            <small>8.{26 + index}</small>
          </button>
        ))}
      </div>
      <div className="flex gap-2 mt-2 overflow-x-auto">
        {chipList.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onChip(chip)}
            className="bg-transparent border-none p-0 cursor-pointer shrink-0"
          >
            <StaticChip active={chipActive(chip)}>{chip}</StaticChip>
          </button>
        ))}
      </div>
      {transferMode && (
        <div className="mt-2 text-[11px] text-[#FF7A2E] bg-[#FFF3EC] rounded-lg px-3 py-2">
          已为你优选「{train ? '中转换乘' : '多程中转'}」方案，可在上方点「只看直达」切回直达
        </div>
      )}
      <div className="grid gap-2 mt-2">
        {list.length === 0 && (
          <div className="py-12 text-center text-[13px] text-[#8A9499]">没有符合条件的{train ? '车次' : '航班'}，试试减少筛选</div>
        )}
        {list.map((e) => (
          <button
            key={e.carrier}
            type="button"
            {...bindTap(openId, { beforeTrigger: () => setRoundTrip(null) })}
            className="p-3 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer"
          >
            <div className="flex items-center">
              <div className="text-[19px] font-semibold">
                {e.d}
                <div className="text-[10px] font-normal text-[#8A9499]">{fromLabel}</div>
              </div>
              <div className="mx-3 flex-1 text-center text-[10px] text-[#8A9499]">
                <div>{e.dur}</div>
                <div className="border-t mt-1 relative">
                  {e.stops === 1 && (
                    <span className="absolute left-1/2 -translate-x-1/2 -top-[7px] text-[9px] text-[#FF7A2E] bg-white px-1">
                      {e.via}中转
                    </span>
                  )}
                </div>
                <div className="mt-0.5">{e.stops === 1 ? '中转' : '直达'}</div>
              </div>
              <div className="text-[19px] font-semibold">
                {e.a}
                <div className="text-[10px] font-normal text-[#8A9499]">{toLabel}</div>
              </div>
              <div className="ml-auto pl-2">
                <Price value={e.price} suffix="" />
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[#718087]">
              {e.carrier}　{e.info}
              {!e.hasTicket && <span className="ml-1 text-[#FF7A2E]">· 候补</span>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function HotelScenicList({ scenic = false, nodeId = '' }: { scenic?: boolean; nodeId?: string }) {
  const hotels = useQunaerStore((state) => state.hotels);
  const scenics = useQunaerStore((state) => state.scenics);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const { bindTap } = useQunaerGestures();
  const items = scenic ? scenics : hotels;
  const openId = scenic
    ? 'ticket.channel.0.open'
    : nodeId.includes('homestay')
      ? 'homestay.list.0.open'
      : nodeId.includes('oversea')
        ? 'oversea.list.0.open'
        : 'hotel.list.0.open';

  return (
    <div className="px-3 py-3">
      <div className="h-9 bg-white rounded-full px-3 flex items-center gap-2">
        <IcSearch size={14} className="text-[#22BFC3]" />
        <span className="text-[12px] text-[#8A9499]">
          {scenic ? '南京 · 搜1658元出行礼包' : '烟台 · 搜酒店/地标'}
        </span>
      </div>
      <div className="flex justify-between mt-2 text-[11px] bg-white rounded-lg px-2 py-2">
        <button
          type="button"
          {...(!scenic
            ? bindTap({ kind: 'action', id: 'hotel.list.1.other' }, {
                onTrigger: () => recordAction('hotel.list.1.other', '排序'),
              })
            : scenic
              ? bindTap({ kind: 'action', id: 'ticket.channel.1.other' }, {
                  onTrigger: () => recordAction('ticket.channel.1.other', '定位弹窗确定'),
                })
              : {})}
          className="bg-transparent border-none cursor-pointer"
        >
          智能排序
          <IcDown size={11} className="inline" />
        </button>
        <span>位置区域</span>
        <span>{scenic ? '全部景点' : '星级/价格'}</span>
        <button
          type="button"
          {...(!scenic
            ? bindTap({ kind: 'action', id: 'hotel.list.2.other' }, {
                onTrigger: () => recordAction('hotel.list.2.other', '筛选'),
              })
            : {})}
          className="bg-transparent border-none cursor-pointer"
        >
          筛选
        </button>
      </div>
      <div className="grid gap-2 mt-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            {...bindTap(openId)}
            className="p-2 flex gap-2 overflow-hidden bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer"
          >
            <Img src={item.image} className="w-[108px] h-[94px] rounded-lg object-cover shrink-0" alt={item.name} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold line-clamp-2">{item.name}</div>
              <div className="mt-1 flex items-center gap-1">
                <Score value={item.score} />
                <span className="text-[10px] text-[#8A9499]">{item.distance}</span>
              </div>
              <div className="mt-1 flex gap-1">
                <StaticChip>暑期优惠</StaticChip>
                <StaticChip>{scenic ? '可订今日' : '免费取消'}</StaticChip>
              </div>
              <div className="text-right mt-1">
                <Price value={item.price} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

const HOTEL_AREAS = ['烟台港·滨海', '芝罘区', '莱山区', '福山区', '经济开发区', '牟平区'];
const HOTEL_STARS = ['经济型', '舒适型', '高档型', '豪华型'];
const HOTEL_SORTS = ['智能排序', '好评优先', '低价优先', '高价优先', '距离最近'];
const HOTEL_TAGS = ['免费取消', '含早餐', '近地铁', '评分4.5+', '钟点房'];

function hotelStarTier(price: number): string {
  if (price >= 500) return '豪华型';
  if (price >= 330) return '高档型';
  if (price >= 200) return '舒适型';
  return '经济型';
}

function hotelKm(distance: string): number {
  const match = distance.match(/([\d.]+)\s*公里/);
  return match ? parseFloat(match[1]) : 50;
}

const HOTEL_BRANDS = ['华住', '斯维登', '美豪', '亚朵', '全季', '如家'];
const HOTEL_QUOTES = [
  '服务热情贴心，住得安心又舒心',
  '总台服务热情周到，离火车站很近',
  '近滨海广场，坐拥山海美景',
  '房间干净整洁，性价比很高',
  '早餐丰富，前台服务很热情',
  '交通便利，出行非常方便',
];
const HOTEL_FACILITIES = [
  ['免费停车场', '自助早餐'],
  ['延迟退房', '家庭房'],
  ['近海景房', '双床房'],
  ['行政酒廊', '健身房'],
  ['商务中心', '接机服务'],
  ['24h前台', '洗衣服务'],
];

function wanFmt(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万` : String(n);
}

function HotelMapPanel() {
  return (
    <div className="relative h-[150px] bg-gradient-to-br from-[#E8EFE6] via-[#EAF1F3] to-[#DDE9EC] overflow-hidden">
      <span className="absolute left-4 top-3 w-px h-8 bg-[#C6D2CE] rotate-[24deg]" />
      <span className="absolute left-14 top-6 right-10 h-px bg-[#CBD6D2]" />
      <span className="absolute left-24 top-0 bottom-0 w-px bg-[#CBD6D2] rotate-[10deg]" />
      <span className="absolute right-16 top-8 w-24 h-px bg-[#CBD6D2] -rotate-[18deg]" />
      <span className="absolute left-6 bottom-4 text-[10px] text-[#8A9A94]">吾悦广场</span>
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] text-[#7C8C86]">芝罘区</span>
      <span className="absolute right-8 bottom-6 text-[10px] text-[#8A9A94]">莱山区</span>
      <span className="absolute left-3 top-2 text-[10px] text-[#5C6C66] bg-white/70 rounded px-1">2公里</span>
      <span className="absolute left-1/3 top-[38%]"><IcPin size={20} className="text-[#12B0C0]" fill="#12B0C0" /></span>
      <span className="absolute left-1/2 top-1/3"><IcPin size={18} className="text-[#12B0C0]" fill="#12B0C0" /></span>
      <span className="absolute right-1/3 top-1/2"><IcPin size={18} className="text-[#12B0C0]" fill="#12B0C0" /></span>
      <span className="absolute right-2 top-2 w-6 h-6 rounded-full bg-black/25 text-white text-[13px] flex items-center justify-center">×</span>
      <span className="absolute left-1/2 bottom-3 -translate-x-1/2 h-7 rounded-full bg-[#22C7CB] text-white text-[11px] px-3 flex items-center gap-1">
        <IcNavigate size={12} /> 大地图
      </span>
    </div>
  );
}

function HotelListRich({ nodeId }: { nodeId: string }) {
  const hotels = useQunaerStore((state) => state.hotels);
  const search = useQunaerStore((state) => state.search);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setHotelKeyword = useQunaerStore((state) => state.setHotelKeyword);
  const { bindTap, bindBack } = useQunaerGestures();
  const isHotel = nodeId.includes('hotel.list');
  const openId = nodeId.includes('homestay')
    ? 'homestay.list.0.open'
    : nodeId.includes('oversea')
      ? 'oversea.list.0.open'
      : 'hotel.list.0.open';

  const [panel, setPanel] = React.useState<'' | 'sort' | 'area' | 'star' | 'filter'>('');
  const [sort, setSort] = React.useState('智能排序');
  const [area, setArea] = React.useState('');
  const [stars, setStars] = React.useState<string[]>([]);
  const [tags, setTags] = React.useState<string[]>([]);
  const toggle = (target: typeof panel) => setPanel((cur) => (cur === target ? '' : target));
  const toggleIn = (arr: string[], set: (v: string[]) => void, value: string) =>
    set(arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value]);

  const enriched = hotels.map((hotel, index) => ({
    ...hotel,
    area: HOTEL_AREAS[index % HOTEL_AREAS.length],
    star: hotelStarTier(hotel.price),
    km: hotelKm(hotel.distance),
  }));
  let list = enriched;
  if (area) list = list.filter((hotel) => hotel.area === area);
  if (stars.length) list = list.filter((hotel) => stars.includes(hotel.star));
  if (tags.includes('评分4.5+')) list = list.filter((hotel) => hotel.score >= 4.5);
  if (tags.includes('近地铁')) list = list.filter((hotel) => /地铁/.test(hotel.distance));
  const sorted = [...list].sort((a, b) => {
    if (sort === '好评优先') return b.score - a.score || b.reviews - a.reviews;
    if (sort === '低价优先') return a.price - b.price;
    if (sort === '高价优先') return b.price - a.price;
    if (sort === '距离最近') return a.km - b.km;
    return 0;
  });

  const barBtn = (active: boolean) =>
    `flex items-center gap-0.5 bg-transparent border-none cursor-pointer text-[13px] ${
      active ? 'text-[#12C3CE] font-semibold' : 'text-[#2C3439]'
    }`;
  const chip = (on: boolean) =>
    `text-[12px] px-3 py-1.5 rounded-full border cursor-pointer ${
      on ? 'border-[#12C3CE] text-[#12C3CE] bg-[#EAFAFB]' : 'border-[#E1E6E8] text-[#59666C] bg-white'
    }`;
  const quickTags = [`${search.hotelCity}站`, '积分当钱花', '特价好房', '4.7分以上', '亚朵', '全季'];

  return (
    <div className="min-h-full bg-[#F2F4F5]">
      {/* 顶部：返回 + 城市/日期/关键词 + 地图 + 更多 */}
      <div className="bg-white px-2 pt-2 pb-2">
        <div className="flex items-center gap-1">
          <button {...bindBack()} className="w-7 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#263238]" aria-label="返回">
            <IcBack size={22} />
          </button>
          <div className="flex-1 h-9 rounded-full bg-[#F3F5F6] border border-[#E7EBEC] flex items-center overflow-hidden">
            <button {...bindBack()} className="px-2.5 shrink-0 bg-transparent border-none cursor-pointer text-left leading-tight">
              <div className="text-[13px] font-semibold text-[#202A2E]">{search.hotelCity}</div>
            </button>
            <div className="flex flex-col shrink-0 text-[9px] text-[#7A858B] leading-tight pr-2 border-r border-[#E1E6E8]">
              <span>{search.hotelCheckIn} 1间</span>
              <span>{search.hotelCheckOut} 1晚</span>
            </div>
            <IcSearch size={14} className="text-[#98A2A6] mx-2 shrink-0" />
            <input
              value={search.hotelKeyword}
              onChange={(e) => setHotelKeyword(e.target.value)}
              placeholder="地名/酒店/关键词"
              className="flex-1 min-w-0 bg-transparent border-none outline-none text-[13px] text-[#202A2E] placeholder:text-[#98A2A6]"
            />
            {search.hotelKeyword && (
              <button type="button" onClick={() => setHotelKeyword('')} className="w-7 h-7 shrink-0 bg-transparent border-none cursor-pointer text-[#B4BBBF] text-[15px]">×</button>
            )}
          </div>
          <button type="button" onClick={() => toggle('')} className="flex flex-col items-center justify-center w-9 bg-transparent border-none cursor-pointer text-[#2C3439]">
            <IcPin size={17} />
            <span className="text-[9px] mt-0.5">地图</span>
          </button>
          <button type="button" onClick={() => toggle('')} className="flex flex-col items-center justify-center w-9 bg-transparent border-none cursor-pointer text-[#2C3439]">
            <IcNavigate size={16} />
            <span className="text-[9px] mt-0.5">更多</span>
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="relative z-20 bg-white">
        <div className="flex justify-between px-4 py-2.5 border-t border-[#F0F2F3]">
          <button
            type="button"
            {...(isHotel
              ? bindTap({ kind: 'action', id: 'hotel.list.1.other' }, {
                  onTrigger: () => {
                    recordAction('hotel.list.1.other', '排序');
                    toggle('sort');
                  },
                })
              : { onClick: () => toggle('sort') })}
            className={barBtn(sort !== '智能排序' || panel === 'sort')}
          >
            {sort}
            <IcDown size={12} />
          </button>
          <button type="button" onClick={() => toggle('area')} className={barBtn(!!area || panel === 'area')}>
            {area || '位置区域'}
            <span className="w-3.5 h-3.5 rounded-full border border-current text-[8px] flex items-center justify-center">i</span>
            <IcDown size={12} />
          </button>
          <button type="button" onClick={() => toggle('star')} className={barBtn(stars.length > 0 || panel === 'star')}>
            星级/价格{stars.length ? `·${stars.length}` : ''}
            <IcDown size={12} />
          </button>
          <button
            type="button"
            {...(isHotel
              ? bindTap({ kind: 'action', id: 'hotel.list.2.other' }, {
                  onTrigger: () => {
                    recordAction('hotel.list.2.other', '筛选');
                    toggle('filter');
                  },
                })
              : { onClick: () => toggle('filter') })}
            className={barBtn(tags.length > 0 || panel === 'filter')}
          >
            筛选{tags.length ? `·${tags.length}` : ''}
            <IcDown size={12} />
          </button>
        </div>

        {/* 快捷标签 */}
        <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
          {quickTags.map((tag, index) => {
            const on = tags.includes(tag);
            const promo = index === 1 || index === 2;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleIn(tags, setTags, tag)}
                className={`shrink-0 text-[12px] px-2.5 py-1 rounded-md cursor-pointer border ${
                  on
                    ? 'border-[#12C3CE] text-[#12C3CE] bg-[#EAFAFB]'
                    : promo
                      ? 'border-[#FFE0CC] text-[#FF6A2C] bg-[#FFF3EC] font-medium'
                      : 'border-[#EAEDEE] text-[#59666C] bg-[#F6F8F9]'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {panel && (
          <div className="absolute left-0 right-0 top-full bg-white shadow-lg border-t border-[#eef1f2] p-3">
            {panel === 'sort' && (
              <div className="grid gap-1">
                {HOTEL_SORTS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setSort(option);
                      setPanel('');
                    }}
                    className={`flex items-center text-left text-[13px] py-2 px-2 rounded cursor-pointer ${
                      sort === option ? 'text-[#12C3CE] font-semibold' : 'text-[#3A464B]'
                    }`}
                  >
                    {option}
                    {sort === option && <IcCheck size={14} className="ml-auto" />}
                  </button>
                ))}
              </div>
            )}
            {panel === 'area' && (
              <div className="flex flex-wrap gap-2">
                {['不限', ...HOTEL_AREAS].map((option) => {
                  const value = option === '不限' ? '' : option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        setArea(value);
                        setPanel('');
                      }}
                      className={chip(area === value)}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            )}
            {panel === 'star' && (
              <>
                <div className="flex flex-wrap gap-2">
                  {HOTEL_STARS.map((option) => (
                    <button key={option} type="button" onClick={() => toggleIn(stars, setStars, option)} className={chip(stars.includes(option))}>
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setStars([])} className="flex-1 h-9 rounded-full border border-[#E1E6E8] text-[13px] text-[#59666C] bg-white cursor-pointer">重置</button>
                  <button type="button" onClick={() => setPanel('')} className="flex-1 h-9 rounded-full bg-[#12C3CE] text-white text-[13px] border-none cursor-pointer">确定</button>
                </div>
              </>
            )}
            {panel === 'filter' && (
              <>
                <div className="flex flex-wrap gap-2">
                  {HOTEL_TAGS.map((option) => (
                    <button key={option} type="button" onClick={() => toggleIn(tags, setTags, option)} className={chip(tags.includes(option))}>
                      {option}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => setTags([])} className="flex-1 h-9 rounded-full border border-[#E1E6E8] text-[13px] text-[#59666C] bg-white cursor-pointer">重置</button>
                  <button type="button" onClick={() => setPanel('')} className="flex-1 h-9 rounded-full bg-[#12C3CE] text-white text-[13px] border-none cursor-pointer">确定</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 地图 */}
      <HotelMapPanel />

      {/* V4 券包横幅 */}
      <div className="mx-2.5 my-2 h-9 rounded-lg bg-gradient-to-r from-[#3B4A63] to-[#2E3A4E] flex items-center px-3 text-white text-[12px]">
        <span className="font-semibold text-[#F5D79A]">V4铂金&火车票</span>
        <span className="ml-2 text-[#F5D79A]">¥60券包</span>
        <span className="ml-1 rounded-full bg-[#FF6A2C] text-white text-[10px] px-1.5">抢</span>
        <span className="ml-auto text-[#F5D79A]">最高¥227</span>
        <span className="ml-2 flex items-center">领取<IcRight size={12} /></span>
      </div>

      {/* 酒店卡片 */}
      <div className="px-2.5 pb-3 grid gap-2.5">
        {sorted.length === 0 && (
          <div className="py-16 text-center text-[13px] text-[#8A9499]">没有符合条件的酒店，试试放宽筛选</div>
        )}
        {sorted.map((item, index) => {
          const brand = HOTEL_BRANDS[index % HOTEL_BRANDS.length];
          const quote = HOTEL_QUOTES[index % HOTEL_QUOTES.length];
          const facilities = HOTEL_FACILITIES[index % HOTEL_FACILITIES.length];
          const favorites = Math.round(item.reviews * 2.5);
          const km = item.km;
          const minutes = Math.max(3, Math.round(km * 3));
          const near = search.hotelKeyword || `${search.hotelCity}站`;
          const strike = item.price + 83;
          const coupon = 60 + (item.price % 40);
          const starTierColor = item.star === '高档型' || item.star === '豪华型' ? 'text-[#9A6B2E] bg-[#FBF1E1]' : 'text-[#3D82C4] bg-[#EAF2FB]';
          return (
            <button
              key={item.id}
              type="button"
              {...bindTap(openId)}
              className="flex overflow-hidden bg-white rounded-xl text-left cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            >
              <div className="relative w-[128px] h-[150px] shrink-0">
                <Img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                <span className="absolute left-1.5 top-1.5 text-[9px] bg-white/90 text-[#4A5459] rounded px-1.5 py-0.5 font-medium">{brand}</span>
                <span className="absolute left-0 bottom-0 text-[10px] bg-gradient-to-r from-[#12C3CE] to-[#2FD3B9] text-white px-2 py-0.5 rounded-tr-lg font-medium">特价好房</span>
                <span className="absolute right-1.5 bottom-1.5 w-6 h-6 rounded-full bg-black/35 flex items-center justify-center">
                  <span className="ml-0.5 border-y-[5px] border-y-transparent border-l-[8px] border-l-white" />
                </span>
              </div>
              <div className="flex-1 min-w-0 p-2">
                <div className="flex items-start gap-1">
                  <span className="text-[15px] font-bold leading-snug line-clamp-2 flex-1">{item.name}</span>
                </div>
                <div className="mt-1">
                  <span className={`text-[10px] rounded px-1 py-0.5 ${starTierColor}`}>{item.star}</span>
                </div>
                <div className="mt-1 flex items-center gap-1 flex-wrap">
                  <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-white bg-[#12C3CE] rounded px-1">
                    {item.score.toFixed(1)}
                  </span>
                  <span className="text-[11px] text-[#12C3CE] font-medium">超棒</span>
                  <span className="text-[11px] text-[#8A9499]">· {wanFmt(item.reviews)}评论 · {wanFmt(favorites)}收藏</span>
                </div>
                <div className="mt-1 text-[11px] text-[#5A6A70] bg-[#F4F8F8] rounded px-1.5 py-0.5 truncate">“{quote}”</div>
                <div className="mt-1 text-[11px] text-[#8A9499]">距{near}驾车{km}公里，约{minutes}分钟</div>
                <div className="mt-1 flex gap-1">
                  {facilities.map((f) => (
                    <span key={f} className="text-[10px] text-[#7A858B] border border-[#EAEDEE] rounded px-1 py-0.5">{f}</span>
                  ))}
                </div>
                {index === 0 && (
                  <div className="mt-1 text-[10px] text-[#FF6A2C]">热卖！低价房仅剩3间</div>
                )}
                <div className="mt-1 flex items-end justify-end gap-1">
                  <span className="text-[10px] text-[#B4BBBF] line-through">¥{strike}</span>
                  <span className="text-[#FA5A4B] font-bold leading-none">
                    <span className="text-[11px]">¥</span><span className="text-[20px]">{item.price}</span><span className="text-[10px] font-normal">起</span>
                  </span>
                </div>
                <div className="flex justify-end mt-0.5">
                  <span className="text-[9px] text-[#FF6A2C] border border-[#FFD9C4] rounded px-1">券后价·优惠{coupon}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MuteIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4z" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

const HOTEL_REVIEWS = [
  { id: 'r1', avatar: 'avatar_1_v2', name: '骆**', level: 'V4铂金会员', score: 5.0, room: '高级双床房', date: '2026-07-18', tags: ['服务热情', '干净卫生'], text: '前台服务特别热情，帮忙免费升级了高层房间。房间干净整洁，隔音很好，离火车站和烟台港都近，出行很方便，下次还会再来住。', reply: '感谢您的认可，期待再次为您服务！' },
  { id: 'r2', avatar: 'avatar_2', name: 'Mr***陈', level: 'V3黄金会员', score: 5.0, room: '高级大床房', date: '2026-07-15', tags: ['位置优越', '早餐丰富'], text: '位置很好，楼下就是公交站，步行十分钟到滨海广场。早餐种类丰富，房间采光好，性价比很高。', reply: '' },
  { id: 'r3', avatar: 'avatar_3', name: '圈圈**', level: 'V2白银会员', score: 4.8, room: '高级双床房', date: '2026-07-12', tags: ['干净卫生', '隔音好'], text: '房间打扫得很干净，床品柔软，晚上很安静。就是停车位稍微有点紧张，建议早点回来。', reply: '' },
  { id: 'r4', avatar: 'avatar_4', name: 'travel**', level: 'V4铂金会员', score: 4.9, room: '商务大床房', date: '2026-07-08', tags: ['服务热情', '性价比高'], text: '第二次来住了，整体体验很稳定，服务态度好，价格也实惠，高层海景房视野很不错。', reply: '感谢老客户的支持，欢迎常来！' },
  { id: 'r5', avatar: 'avatar_1_v2', name: '向阳**', level: 'V3黄金会员', score: 5.0, room: '高级大床房', date: '2026-07-03', tags: ['早餐丰富', '位置优越'], text: '早餐很丰富，有海鲜粥和现做的鸡蛋饼。位置离烟台港很近，第二天坐船非常方便。', reply: '' },
];

function HotelReviews({
  hotel,
  onBack,
}: {
  hotel: { name: string; score: number; reviews: number };
  onBack: () => void;
}) {
  const [tag, setTag] = React.useState('全部');
  const dims: [string, number][] = [['卫生', 4.9], ['服务', 4.9], ['位置', 4.8], ['设施', 4.7]];
  const tagCloud: [string, number][] = [
    ['全部', hotel.reviews],
    ['服务热情', 328],
    ['干净卫生', 256],
    ['位置优越', 198],
    ['早餐丰富', 142],
    ['隔音好', 97],
    ['性价比高', 88],
  ];
  const list = tag === '全部' ? HOTEL_REVIEWS : HOTEL_REVIEWS.filter((r) => r.tags.includes(tag));

  return (
    <div className="min-h-full bg-[#F2F4F5]">
      <div className="h-11 bg-white flex items-center px-1 border-b border-[#eef0f1] sticky top-0 z-10">
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#263238]" aria-label="返回">
          <IcBack size={22} />
        </button>
        <div className="flex-1 text-center text-[16px] font-semibold">住客评价</div>
        <div className="w-10" />
      </div>

      <div className="bg-white px-4 py-4 flex items-center">
        <div className="flex items-end">
          <span className="text-[32px] font-bold text-[#12C3CE] leading-none">{hotel.score.toFixed(1)}</span>
          <span className="text-[12px] text-[#8A9499] mb-1 ml-1">/5</span>
        </div>
        <div className="ml-3">
          <div className="text-[14px] font-semibold text-[#12C3CE]">超棒</div>
          <div className="text-[11px] text-[#8A9499]">{hotel.reviews}条真实点评</div>
        </div>
        <div className="ml-auto grid grid-cols-2 gap-x-4 gap-y-1">
          {dims.map(([name, value]) => (
            <div key={name} className="text-[11px] text-[#59666C]">
              {name} <b className="text-[#202A2E]">{value}</b>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white mt-2 px-3 py-3">
        <div className="text-[13px] font-semibold mb-2">大家都在说</div>
        <div className="flex flex-wrap gap-2">
          {tagCloud.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setTag(name)}
              className={`text-[12px] px-3 py-1.5 rounded-full border cursor-pointer ${
                tag === name ? 'border-[#12C3CE] text-[#12C3CE] bg-[#EAFAFB]' : 'border-[#EAEDEE] text-[#59666C] bg-[#F6F8F9]'
              }`}
            >
              {name} {count}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2">
        {list.map((review) => (
          <div key={review.id} className="bg-white px-4 py-3 border-b border-[#F2F4F5]">
            <div className="flex items-center gap-2">
              <Img src={image(review.avatar)} className="w-8 h-8 rounded-full object-cover" alt={review.name} />
              <div>
                <div className="text-[13px] font-medium">{review.name}</div>
                <div className="text-[10px] text-[#B49A5A]">{review.level}</div>
              </div>
              <span className="ml-auto text-[14px] font-bold text-[#12C3CE]">
                {review.score.toFixed(1)}
                <span className="text-[10px] font-normal">分</span>
              </span>
            </div>
            <div className="mt-1 text-[10px] text-[#9AA3A7]">{review.room} · {review.date}入住</div>
            <div className="mt-2 text-[13px] leading-relaxed text-[#2C3439]">{review.text}</div>
            <div className="mt-2 flex flex-wrap gap-1">
              {review.tags.map((t) => (
                <span key={t} className="text-[10px] text-[#12A0A8] bg-[#E7F8F9] rounded px-1.5 py-0.5">{t}</span>
              ))}
            </div>
            {review.reply && (
              <div className="mt-2 bg-[#F6F8F9] rounded-lg p-2 text-[12px] text-[#59666C] leading-relaxed">
                <span className="text-[#12C3CE] font-medium">店家回复：</span>
                {review.reply}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HotelDetail() {
  const hotels = useQunaerStore((state) => state.hotels);
  const search = useQunaerStore((state) => state.search);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setSelectedRoom = useQunaerStore((state) => state.setSelectedRoom);
  const { bindTap, bindBack } = useQunaerGestures();
  const hotel = hotels[0];
  const [galleryTab, setGalleryTab] = React.useState(0);
  const [fav, setFav] = React.useState(false);
  const [roomFilter, setRoomFilter] = React.useState<string[]>([]);
  const [showReviews, setShowReviews] = React.useState(false);
  const toggleRoom = (value: string) =>
    setRoomFilter((cur) => (cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value]));

  if (showReviews) {
    return <HotelReviews hotel={hotel} onBack={() => setShowReviews(false)} />;
  }

  const near = search.hotelKeyword || `${search.hotelCity}站`;
  const galleryTabs = ['封面', '精选', '位置', '点评'];
  const facilityRow: [string, React.ComponentType<{ size?: number; className?: string }>][] = [
    ['2025年开业', IcCalendar],
    ['免费停车场', IcCar],
    ['自助早餐', IcGift],
    ['充电桩', IcSparkles],
    ['干衣机', IcHotel],
    ['详情设施', IcRight],
  ];
  const rooms = [
    { img: 'hotel_2', name: '高级双床房-护脊床垫+安睡记忆枕+静谧隔音耳塞', coupon: '烟台张裕酒文化博物馆门票8折券（每日1张）', beds: '2张1.2米单床', size: '26㎡', floor: '1-5层', meal: '无餐食', cancel: '1小时内免费取消', strike: 529, price: 435 },
    { img: 'hotel_3', name: '高级大床房-护脊床垫+云感被+静谧隔音耳塞', coupon: '入住赠迎宾水果·免费升级会员', beds: '1张1.8米大床', size: '28㎡', floor: '3-8层', meal: '含双早', cancel: '免费取消', strike: 569, price: 468 },
    { img: 'hotel_4', name: '商务大床房-高层海景+行政酒廊', coupon: '延迟退房至14:00·赠洗衣券', beds: '1张2米大床', size: '32㎡', floor: '9-15层', meal: '含双早', cancel: '限时取消', strike: 649, price: 528 },
  ];
  const roomMatch = (room: (typeof rooms)[number]) =>
    roomFilter.every((tag) =>
      tag === '含早餐'
        ? room.meal.includes('早')
        : tag === '双床房'
          ? room.beds.includes('单床')
          : tag === '大床房'
            ? room.beds.includes('大床')
            : tag === '免费取消'
              ? room.cancel.includes('免费取消')
              : true,
    );
  const visibleRooms = rooms.filter(roomMatch);

  return (
    <div className="min-h-full bg-[#F2F4F5]">
      {/* 头图 */}
      <div className="relative h-[230px]">
        <Img src={hotel.image} className="w-full h-full object-cover" alt={hotel.name} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/25" />
        <div className="absolute top-2 left-2 right-2 flex items-center">
          <button {...bindBack()} className="w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center border-none cursor-pointer" aria-label="返回">
            <IcBack size={20} />
          </button>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setFav((v) => !v)} className="w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center border-none cursor-pointer">
              <IcHeart size={17} fill={fav ? '#FF4E4E' : 'none'} className={fav ? 'text-[#FF4E4E]' : 'text-white'} />
            </button>
            <button type="button" onClick={() => undefined} className="w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center border-none cursor-pointer">
              <IcShare size={16} />
            </button>
            <button type="button" onClick={() => undefined} className="w-8 h-8 rounded-full bg-black/30 text-white flex items-center justify-center border-none cursor-pointer">
              <IcNavigate size={16} />
            </button>
          </div>
        </div>
        <div className="absolute bottom-2 left-3 right-3 flex items-center gap-4 text-white text-[13px]">
          {galleryTabs.map((tab, index) => (
            <button
              key={tab}
              type="button"
              {...bindTap({ kind: 'action', id: 'hotel.detail.1.other' }, {
                onTrigger: () => {
                  setGalleryTab(index);
                  recordAction('hotel.detail.1.other', '相册入口');
                },
              })}
              className={`bg-transparent border-none cursor-pointer pb-0.5 ${
                galleryTab === index ? 'font-semibold border-b-2 border-white' : 'opacity-90 border-b-0'
              }`}
            >
              {tab}
            </button>
          ))}
          <button
            type="button"
            {...bindTap({ kind: 'action', id: 'hotel.detail.1.other' }, {
              onTrigger: () => recordAction('hotel.detail.1.other', '相册入口'),
            })}
            className="bg-transparent border-none cursor-pointer opacity-90 flex items-center"
          >
            相册<IcRight size={13} />
          </button>
          <span className="ml-auto text-white/90"><MuteIcon size={16} /></span>
        </div>
      </div>

      {/* 标题 + 设施 */}
      <div className="bg-white px-3 pt-3 pb-3 -mt-3 rounded-t-2xl relative">
        <div className="flex items-start gap-1">
          <h1 className="text-[18px] font-bold leading-snug m-0 flex-1">{hotel.name}</h1>
        </div>
        <div className="mt-1">
          <span className="text-[10px] text-[#3D82C4] bg-[#EAF2FB] rounded px-1.5 py-0.5">舒适型</span>
        </div>
        <div className="mt-3 flex justify-between">
          {facilityRow.map(([label, Icon]) => (
            <div key={label} className="flex flex-col items-center gap-1 text-[10px] text-[#59666C]">
              <Icon size={18} className="text-[#4A5459]" />
              <span className="whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 评分 + 地址 */}
      <div className="bg-white mt-2 px-3 py-3 flex items-stretch gap-3">
        <button type="button" onClick={() => setShowReviews(true)} className="shrink-0 max-w-[46%] bg-transparent border-none p-0 cursor-pointer text-left">
          <div className="flex items-center gap-1">
            <span className="text-[16px] font-bold text-[#12C3CE]">{hotel.score.toFixed(1)}</span>
            <IcStar size={13} className="text-[#12C3CE]" fill="currentColor" />
            <span className="text-[12px] text-[#3A464B]">超棒</span>
            <span className="text-[11px] text-[#8A9499]">{hotel.reviews}条</span>
            <IcRight size={12} className="text-[#B4BBBF]" />
          </div>
          <div className="mt-1 text-[11px] text-[#12C3CE] leading-snug">“服务热情贴心，住得安心又舒心”</div>
        </button>
        <div className="w-px bg-[#EEF0F1]" />
        <div className="flex-1 min-w-0 text-[11px] text-[#5A6A70] leading-relaxed">
          <div>距{near}驾车3.7公里，约11分钟</div>
          <div className="truncate">距渤海轮渡客运站步行距离约780米</div>
          <div className="text-[#202A2E] mt-0.5">芝罘区环海路27号</div>
        </div>
        <button type="button" onClick={() => undefined} className="shrink-0 flex flex-col items-center justify-center text-[10px] text-[#12C3CE] bg-transparent border-none cursor-pointer">
          <IcPin size={17} />
          地图
        </button>
      </div>

      {/* V4 横幅 */}
      <div className="mx-2.5 my-2 h-9 rounded-lg bg-gradient-to-r from-[#3B4A63] to-[#2E3A4E] flex items-center px-3 text-[12px]">
        <span className="font-semibold text-[#F5D79A]">V4铂金&火车票</span>
        <span className="ml-2 text-[#F5D79A]">¥60券包</span>
        <span className="ml-1 rounded-full bg-[#FF6A2C] text-white text-[10px] px-1.5">抢</span>
        <span className="ml-2 text-[#F5D79A]">98折</span>
        <span className="ml-2 text-white/80">拼好房发</span>
        <span className="ml-auto text-[#F5D79A] flex items-center">查看<IcRight size={12} /></span>
      </div>

      {/* 日期行 */}
      <div className="bg-white px-3 py-3 flex items-center text-[13px]">
        <span className="font-semibold text-[#202A2E]">{search.hotelCheckIn}</span>
        <span className="text-[#8A9499] ml-1">今天</span>
        <span className="ml-2 text-[10px] text-[#12C3CE] border border-[#BFEDEF] rounded px-1.5 py-0.5">1晚</span>
        <span className="font-semibold text-[#202A2E] ml-2">{search.hotelCheckOut}</span>
        <span className="text-[#8A9499] ml-1">明天</span>
        <span className="ml-auto text-[#202A2E]">1间</span>
      </div>

      {/* 房型筛选 */}
      <div className="bg-white flex gap-2 px-3 pb-2 overflow-x-auto border-t border-[#F3F5F6]">
        {['含早餐', '双床房', '大床房', '免费取消'].map((tag) => {
          const on = roomFilter.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleRoom(tag)}
              className={`shrink-0 text-[12px] px-2.5 py-1 rounded-md cursor-pointer border ${
                on ? 'border-[#12C3CE] text-[#12C3CE] bg-[#EAFAFB]' : 'border-[#EAEDEE] text-[#59666C] bg-[#F6F8F9]'
              }`}
            >
              {tag}
            </button>
          );
        })}
        <button type="button" onClick={() => undefined} className="shrink-0 flex items-center gap-0.5 text-[12px] text-[#59666C] bg-transparent border-none cursor-pointer">
          筛选<IcDown size={12} />
        </button>
      </div>

      {/* 房型卡 */}
      <div className="px-2.5 pb-3 grid gap-2">
        {visibleRooms.length === 0 && (
          <div className="py-12 text-center text-[13px] text-[#8A9499]">没有符合条件的房型，试试减少筛选</div>
        )}
        {visibleRooms.map((room) => (
          <div key={room.name} className="bg-white rounded-xl p-2.5 flex gap-2.5">
            <Img src={image(room.img)} className="w-[84px] h-[84px] rounded-lg object-cover shrink-0" alt={room.name} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold leading-snug flex items-start">
                <span className="line-clamp-2 flex-1">{room.name}</span>
                <IcRight size={14} className="text-[#B4BBBF] mt-0.5 shrink-0" />
              </div>
              <div className="mt-1 text-[10px] text-[#FF6A2C] bg-[#FFF3EC] rounded px-1.5 py-0.5 inline-block max-w-full truncate">{room.coupon}</div>
              <div className="mt-1 text-[11px] text-[#8A9499]">{room.beds} · {room.size} · {room.floor} · {room.meal}</div>
              <div className="mt-1 text-[11px] text-[#12C3CE]">{room.cancel}</div>
              <div className="text-[10px] text-[#9AA3A7]">5分钟内确认</div>
              <div className="mt-1 flex items-end">
                <span className="text-[10px] text-[#B4BBBF] line-through mr-1">¥{room.strike}</span>
                <span className="text-[#FA5A4B] font-bold leading-none">
                  <span className="text-[11px]">¥</span><span className="text-[19px]">{room.price}</span><span className="text-[10px] font-normal">起</span>
                </span>
                <button
                  type="button"
                  {...bindTap('hotel.detail.0.open', {
                    beforeTrigger: () =>
                      setSelectedRoom({ title: `${hotel?.name ?? '汉庭酒店'} · ${room.name.split('-')[0]}`, price: room.price }),
                  })}
                  className="ml-auto relative rounded-lg bg-gradient-to-b from-[#FF8A3D] to-[#FF6A2C] text-white text-[13px] font-semibold px-5 py-1.5 border-none cursor-pointer"
                >
                  订
                  <span className="absolute -top-2 -right-1 text-[8px] bg-[#FA5A4B] text-white rounded-full px-1 leading-tight">领券</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 各频道主题数据（民宿/海外酒店/租车/接送机），频道页与列表页共用，避免出现无关内容。
const HOMESTAY_ITEMS = [
  { img: 'homestay_1', title: '海棠湾无边泳池海景别墅', tag: '整租 · 可住6人 · 3卧', place: '三亚·海棠湾', score: 4.9, price: 1288 },
  { img: 'homestay_2', title: '莫干山谷景木屋·私汤露台', tag: '整租 · 2卧2卫', place: '湖州·莫干山', score: 4.8, price: 768 },
  { img: 'homestay_3', title: '春熙路奶油风loft公寓', tag: '整租 · 近地铁口', place: '成都·锦江', score: 4.7, price: 458 },
  { img: 'homestay_4', title: '平江路古巷庭院客栈', tag: '含双早 · 宠物友好', place: '苏州·姑苏', score: 4.9, price: 398 },
];

const OVERSEA_ITEMS = [
  { img: 'hotel_5', title: 'Bangkok Riverside Hotel 曼谷河畔酒店', tag: '★★★★★ · 含双早 · 河景房', place: '泰国·曼谷', score: 4.8, price: 612 },
  { img: 'tour_4', title: 'Bali Ocean Pool Villa 巴厘岛海景泳池别墅', tag: '★★★★★ · 私人泳池', place: '印尼·巴厘岛', score: 4.9, price: 899 },
  { img: 'scenic_6', title: 'Marina Bay View Hotel 新加坡滨海湾', tag: '★★★★★ · 天际泳池', place: '新加坡·滨海湾', score: 4.7, price: 1088 },
  { img: 'hotel_6', title: 'Osaka Namba Boutique 大阪难波精品酒店', tag: '★★★★ · 近心斋桥', place: '日本·大阪', score: 4.6, price: 528 },
];

const CAR_ITEMS = [
  { img: 'car_1', title: '大众朗逸 或同级', tag: '经济型 · 自动挡 · 5座', place: '门店取车 · 免费送车上门', score: 4.9, price: 74 },
  { img: 'car_2', title: '比亚迪秦PLUS 或同级', tag: '新能源 · 纯电续航500km', place: '门店取车 · 可代充满电', score: 4.8, price: 99 },
  { img: 'car_4', title: '大众途观L 或同级', tag: '舒适SUV · 自动挡 · 5座', place: '门店取车 · 全程无忧保障', score: 4.9, price: 158 },
  { img: 'car_3', title: '别克GL8 或同级', tag: '商务MPV · 7座', place: '门店取车 · 商务差旅首选', score: 4.8, price: 268 },
];

const TRANSFER_ITEMS = [
  { img: 'car_1', title: '经济型接送 · 5座轿车', tag: '含1件行李 · 免费等待60分钟', place: '专业司机 · 实时追踪航班', score: 4.9, price: 88 },
  { img: 'car_4', title: '舒适型接送 · 5座SUV', tag: '含2件行李 · 空间宽敞', place: '专业司机 · 实时追踪航班', score: 4.8, price: 128 },
  { img: 'car_3', title: '商务型接送 · 7座MPV', tag: '含4件行李 · 团队出行', place: '专业司机 · 实时追踪航班', score: 4.9, price: 198 },
];

function ChannelItemCard({
  item,
  transition,
  suffix = '起',
  booking,
}: {
  item: { img: string; title: string; tag: string; place: string; score: number; price: number };
  transition: TransitionId;
  suffix?: string;
  booking?: { title: string; amount: number };
}) {
  const { bindTap } = useQunaerGestures();
  const setBookingDraft = useQunaerStore((state) => state.setBookingDraft);
  const bind = booking
    ? bindTap(transition, { beforeTrigger: () => setBookingDraft(booking) })
    : bindTap(transition);
  return (
    <button
      type="button"
      {...bind}
      className="p-2 flex gap-2.5 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer"
    >
      <Img src={image(item.img)} className="w-[112px] h-[88px] object-cover rounded-lg shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold line-clamp-2">{item.title}</div>
        <div className="text-[10px] text-[#22808A] bg-[#E7F8F9] rounded px-1.5 py-0.5 mt-1 inline-block">{item.tag}</div>
        <div className="text-[10px] text-[#8A9499] mt-1 flex items-center gap-1">
          <IcPin size={10} className="text-[#22C7CB]" />
          {item.place}
        </div>
        <div className="flex items-end mt-1">
          <span className="text-[10px] text-[#FF8A00]">★ {item.score}</span>
          <span className="ml-auto">
            <Price value={item.price} suffix={suffix} />
          </span>
        </div>
      </div>
    </button>
  );
}

function GenericList({ nodeId }: { nodeId: string }) {
  const carDays = useQunaerStore((state) => state.car.days);
  const transfer = useQunaerStore((state) => state.transfer);
  if (nodeId === 'flight.list') return <FlightTrainList train={false} />;
  if (nodeId === 'train.list') return <FlightTrainList train />;
  if (nodeId === 'ticket.channel') return <HotelScenicList scenic nodeId={nodeId} />;
  if (nodeId.includes('hotel.list')) return <HotelListRich nodeId={nodeId} />;
  if (nodeId.includes('search.results')) return <HotelScenicList scenic nodeId={nodeId} />;

  // 民宿 / 海外酒店 列表：使用各自主题数据，不再复用烟台酒店列表。
  if (nodeId === 'homestay.list' || nodeId === 'oversea.list') {
    const oversea = nodeId === 'oversea.list';
    const items = oversea ? OVERSEA_ITEMS : HOMESTAY_ITEMS;
    const openId = oversea ? 'oversea.list.0.open' : 'homestay.list.0.open';
    return (
      <div className="px-3 py-3 grid gap-2">
        <div className="flex gap-2 overflow-x-auto">
          <StaticChip active>综合推荐</StaticChip>
          <StaticChip>低价优先</StaticChip>
          <StaticChip>好评优先</StaticChip>
          <StaticChip>{oversea ? '钻级/价格' : '居室/人数'}</StaticChip>
        </div>
        {items.map((item) => (
          <ChannelItemCard key={item.title} item={item} transition={openId} suffix={oversea ? '含税起' : '/晚'} />
        ))}
      </div>
    );
  }

  // 租车 / 接送机 车型列表
  const isTransfer = nodeId.startsWith('transfer');
  const carItems = isTransfer ? TRANSFER_ITEMS : CAR_ITEMS;
  const openId = isTransfer ? 'transfer.carlist.0.open' : 'carrental.carlist.0.open';
  // 接送机按下车点里程加收费用，报价随用户填写的下车点变化。
  const transferSurcharge = Math.round(transfer.distanceKm * 3.6);
  return (
    <div className="px-3 py-3 grid gap-2">
      {!isTransfer && <CarConfigCard />}
      {isTransfer && transfer.drop && (
        <Card className="p-3 flex items-center bg-[#F3F1FF]">
          <IcPin size={15} className="text-[#6C6FF2] mr-2 shrink-0" />
          <div className="text-[12px] text-[#4A4E7A]">下车点：{transfer.drop} · 约{transfer.distanceKm}公里</div>
        </Card>
      )}
      <div className="flex gap-2 overflow-x-auto">
        <StaticChip active>综合推荐</StaticChip>
        <StaticChip>低价优先</StaticChip>
        <StaticChip>{isTransfer ? '车型/人数' : '车型/座位'}</StaticChip>
        <StaticChip>更多筛选</StaticChip>
      </div>
      {carItems.map((item) => {
        const amount = isTransfer ? item.price + transferSurcharge : item.price * carDays;
        return (
          <ChannelItemCard
            key={item.title}
            item={{ ...item, price: amount }}
            transition={openId}
            suffix=""
            booking={{
              title: isTransfer ? `${item.title} · 至${transfer.drop || '市区'}` : `${item.title.split(' ')[0]} · ${carDays}天`,
              amount,
            }}
          />
        );
      })}
    </div>
  );
}

// 租车配置卡：取车点 / 还车点 / 取还时间，均可选择，供租车首页与车型列表复用。
function CarConfigCard() {
  const car = useQunaerStore((state) => state.car);
  const setCar = useQunaerStore((state) => state.setCar);
  const [sheet, setSheet] = React.useState<null | 'pick' | 'drop' | 'date'>(null);
  return (
    <Card className="p-3">
      <ChannelFieldRow
        onClick={() => setSheet('pick')}
        icon={<IcPin size={16} className="text-[#3D9BE0] mr-2" />}
        label="取车点"
        value={car.city}
      />
      <ChannelFieldRow
        onClick={() => setSheet('drop')}
        icon={<IcPin size={16} className="text-[#3D9BE0] mr-2" />}
        label="还车点"
        value={car.dropCity}
        extra={car.dropCity === car.city ? '同点还车' : '异地还车'}
      />
      <ChannelFieldRow
        onClick={() => setSheet('date')}
        icon={<IcCalendar size={16} className="text-[#3D9BE0] mr-2" />}
        label="取还时间"
        value={`${car.pickup} — ${car.ret}`}
        extra={`共${car.days}天`}
      />
      {sheet === 'pick' && (
        <CitySheet
          title="选择取车点"
          options={CAR_PICKUP_CITIES}
          value={car.city}
          onPick={(city) => {
            setCar({ city, dropCity: car.dropCity === car.city ? city : car.dropCity });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'drop' && (
        <CitySheet
          title="选择还车点（可异地还车）"
          options={CAR_PICKUP_CITIES}
          value={car.dropCity}
          onPick={(city) => {
            setCar({ dropCity: city });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'date' && (
        <CarDateSheet
          pickup={car.pickup}
          days={car.days}
          onApply={(patch) => {
            setCar(patch);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </Card>
  );
}

const SCENIC_TICKETS = [
  { name: '成人票', tag: '标准', desc: '身高1.5米以上 · 随买随用 · 无需换票', price: 153.7, strike: 180 },
  { name: '学生票', tag: '优惠', desc: '全日制在校学生 · 凭学生证入园', price: 99, strike: 153.7 },
  { name: '老人票', tag: '优待', desc: '65周岁以上 · 凭身份证入园', price: 76, strike: 120 },
  { name: '家庭票(2大1小)', tag: '超值', desc: '2成人+1儿童 · 比单买省¥60', price: 358, strike: 418 },
];

const SCENIC_REVIEWS = [
  { user: '旅行的小鹿', score: 5, text: '项目很多，过山车超刺激！暑期人气很旺，建议早点入园先玩热门项目。检票扫码很快，无需换票。', tag: '亲子游', date: '2026-07-18' },
  { user: 'Coco酱', score: 5, text: '夜场灯光秀特别漂亮，氛围感拉满，性价比很高。学生票便宜了不少，很划算。', tag: '情侣出行', date: '2026-07-12' },
  { user: '老王爱旅行', score: 4, text: '整体体验不错，就是餐饮略贵，建议自带点水和干粮。工作人员态度很好。', tag: '朋友结伴', date: '2026-06-30' },
];

const SCENIC_NEARBY = [
  { name: '南京欢乐谷·主题度假酒店', type: '酒店', dist: '园区内 · 步行3分钟', price: 428, img: 'hotel_2' },
  { name: '欢乐谷夜场灯光秀', type: '景点', dist: '园区内 · 21:00开场', price: 88, img: 'scenic_7' },
  { name: '玄武湖公园', type: '景点', dist: '距景区 6.2km', price: 0, img: 'scenic_8' },
  { name: '汤山温泉度假区', type: '景点', dist: '距景区 12km', price: 198, img: 'scenic_3' },
];

function DetailView({ nodeId, title }: { nodeId: string; title: string }) {
  const hotels = useQunaerStore((state) => state.hotels);
  const scenics = useQunaerStore((state) => state.scenics);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setSelectedFare = useQunaerStore((state) => state.setSelectedFare);
  const setSelectedRoom = useQunaerStore((state) => state.setSelectedRoom);
  const setBookingDraft = useQunaerStore((state) => state.setBookingDraft);
  const stay = useQunaerStore((state) => state.stay);
  const roundTrip = useQunaerStore((state) => state.roundTrip);
  const { bindTap } = useQunaerGestures();
  const [cabinTab, setCabinTab] = React.useState(0);
  const [detailTab, setDetailTab] = React.useState(0);
  const scenic = nodeId.startsWith('ticket');
  const hero = scenic ? scenics[0] : hotels[0];
  const imageName = nodeId.startsWith('tour')
    ? image('tour_1')
    : nodeId.startsWith('car')
      ? image('car_1')
      : nodeId.startsWith('homestay')
        ? image(HOMESTAY_ITEMS[0].img)
        : nodeId.startsWith('oversea')
          ? image(OVERSEA_ITEMS[0].img)
          : hero.image;

  const bookBinding = nodeId.startsWith('flight')
    ? bindTap('flight.cabins.1.open')
    : nodeId.startsWith('ticket')
      ? bindTap('ticket.detail.0.open')
      : nodeId.startsWith('train')
        ? bindTap('train.detail.1.open')
        : nodeId.startsWith('homestay')
          ? bindTap('homestay.detail.0.open')
          : nodeId.startsWith('oversea')
            ? bindTap('oversea.detail.0.open')
            : nodeId.startsWith('tour')
              ? bindTap('tour.detail.0.open')
              : bindTap('hotel.detail.0.open');

  if (nodeId === 'flight.cabins' || nodeId === 'train.detail') {
    const isTrain = nodeId.startsWith('train');
    const cabins: [string, number][] = isTrain
      ? [
          ['二等座', 198],
          ['一等座', 318],
          ['商务座', 698],
        ]
      : cabinTab === 0
        ? [
            ['经济舱 · 优惠票', 249],
            ['经济舱 · 标准票', 318],
            ['明珠经济舱', 468],
          ]
        : [
            ['公务舱 · 灵活退改', 1420],
            ['头等舱 · 尊享服务', 1980],
          ];
    // 舱位/席别「订」与底部预订统一进入下单页，并把选中的单价写入 selectedFare。
    const fareTransition = isTrain ? 'train.detail.1.open' : 'flight.cabins.1.open';
    const pickFare = (name: string, price: number) => ({
      ...bindTap(fareTransition, { beforeTrigger: () => setSelectedFare({ title: name, price }) }),
    });

    // 往返：把去程 + 返程两段上下堆叠展示，合并计价后一起进入下单。
    if (roundTrip && roundTrip.train === isTrain) {
      const rtTotal = roundTrip.depart.price + roundTrip.return.price;
      const rtTitle = `${roundTrip.depart.from} ⇄ ${roundTrip.depart.to} · 往返`;
      const legCard = (leg: RoundTripLeg, tag: string, tagColor: string) => (
        <Card className="p-3">
          <div className="flex items-center text-[11px] text-[#8A9499]">
            <span className={`text-white text-[10px] rounded px-1.5 py-0.5 mr-2 ${tagColor}`}>{tag}</span>
            {leg.date}
          </div>
          <div className="flex items-center mt-2">
            <div className="text-[19px] font-semibold">{leg.d}<div className="text-[10px] font-normal text-[#8A9499]">{leg.from}</div></div>
            <div className="mx-3 flex-1 text-center text-[10px] text-[#8A9499]">
              <div className="border-t relative"><span className="absolute left-1/2 -translate-x-1/2 -top-2 bg-white px-1">→</span></div>
            </div>
            <div className="text-[19px] font-semibold text-right">{leg.a}<div className="text-[10px] font-normal text-[#8A9499]">{leg.to}</div></div>
          </div>
          <div className="mt-2 text-[10px] text-[#718087]">{leg.carrier} · 免费行李20kg · 支持退改</div>
        </Card>
      );
      return (
        <div className="px-3 py-3 grid gap-2 pb-24">
          <div className="text-[15px] font-semibold">{rtTitle}</div>
          {legCard(roundTrip.depart, '去程', 'bg-[#22C7CB]')}
          {legCard(roundTrip.return, '返程', 'bg-[#FF7A2E]')}
          <Card className="p-3 text-[11px] text-[#59666C] leading-relaxed">
            <div className="text-[13px] font-semibold text-[#202A2E] mb-1">行李与退改</div>
            免费直挂行李 20kg / 人 · 起飞前 4 小时可退改（收取手续费）。往返合并出票，价格更优。
          </Card>
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#edf0f2] px-3 py-2.5 flex items-center gap-3 max-w-[480px] mx-auto">
            <div className="flex-1">
              <div className="text-[9px] text-[#8A9499]">往返合计（含去程+返程）</div>
              <Price value={rtTotal} suffix="/人" />
            </div>
            <button
              type="button"
              {...pickFare(rtTitle, rtTotal)}
              className="h-11 px-8 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white font-semibold border-none cursor-pointer"
            >
              预订
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="px-3 py-3">
        <Card className="p-3">
          <div className="text-[17px] font-semibold">广州 → 长沙</div>
          <div className="text-[11px] text-[#8A9499] mt-1">8月26日 · 吉祥航空 HO1234 · 1h25m</div>
        </Card>
        <div className="flex gap-3 mt-3 text-[12px]">
          {[
            nodeId.startsWith('train') ? '席别' : '经济舱',
            nodeId.startsWith('train') ? '余票' : '公务/头等',
          ].map((tab, index) => (
            <button
              key={tab}
              type="button"
              {...bindTap({ kind: 'action', id: nodeId.startsWith('train') ? 'train.detail.0.other' : 'flight.cabins.2.other' }, {
                onTrigger: () => {
                  setCabinTab(index);
                  recordAction(
                    nodeId.startsWith('train') ? 'train.detail.0.other' : 'flight.cabins.2.other',
                    '舱位tab',
                  );
                },
              })}
              className={`pb-1 bg-transparent border-x-0 border-t-0 cursor-pointer ${
                cabinTab === index ? 'text-[#22BFC3] border-b-2 border-[#22C7CB]' : 'text-[#8A9499] border-b-0'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="grid gap-2 mt-3">
          {cabins.map(([name, price]) => (
            <Card key={name} className="p-3 flex items-center">
              <div>
                <div className="text-[14px] font-semibold">{name}</div>
                <div className="text-[10px] text-[#8A9499] mt-1">免费行李 · 支持退改</div>
              </div>
              <div className="ml-auto text-right">
                <Price value={price} suffix="" />
                <button
                  type="button"
                  {...pickFare(name, price)}
                  className="mt-1 rounded-full bg-[#FF5C2E] text-white text-[11px] px-4 py-1.5 border-none cursor-pointer"
                >
                  订
                </button>
              </div>
            </Card>
          ))}
        </div>
        <button
          type="button"
          {...pickFare(cabins[0][0], cabins[0][1])}
          className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white font-semibold border-none cursor-pointer"
        >
          {isTrain ? '继续预订' : '立即预订'}
        </button>
      </div>
    );
  }

  if (nodeId.startsWith('tour')) {
    const itinerary = [
      ['D1', '昆明集合', '入住昆明市区酒店，自由活动，晚可逛南屏街夜市。'],
      ['D2', '昆明 → 大理', '游洱海生态廊道、大理古城，入住洱海畔客栈。'],
      ['D3', '大理 → 丽江', '崇圣寺三塔、束河古镇，夜游丽江古城。'],
      ['D4', '玉龙雪山', '大索道登雪山、蓝月谷、印象丽江演出。'],
      ['D5', '丽江自由活动', '可自选拉市海骑马或古城休闲，全天自由安排。'],
      ['D6', '返程', '睡到自然醒，送机返程，行程结束。'],
    ];
    return (
      <div>
        <div className="relative h-[205px] w-full">
          <Img src={imageName} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="text-[19px] font-bold">云南昆明大理丽江6日5晚跟团游</div>
            <div className="text-[11px] mt-1">纯玩0购物 · 4钻酒店 · 专业领队全程陪同</div>
          </div>
        </div>
        <div className="px-3 py-3 grid gap-2">
          <Card className="p-3">
            <div className="flex items-center">
              <Score value={4.9} />
              <span className="ml-2 text-[12px] text-[#22BFC3]">口碑推荐 · 3620人已报名</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {['纯玩无购物', '含往返机票', '4钻酒店', '赠玉龙雪山', '专业领队'].map((tag) => (
                <span key={tag} className="text-[10px] text-[#22808A] bg-[#E7F8F9] rounded px-2 py-0.5">{tag}</span>
              ))}
            </div>
          </Card>
          <SectionTitle>行程安排</SectionTitle>
          <div className="relative pl-4">
            <span className="absolute left-[5px] top-1 bottom-1 w-px bg-[#D7E7E8]" />
            {itinerary.map(([day, spot, desc]) => (
              <div key={day} className="relative pb-4">
                <span className="absolute -left-4 top-1 w-[11px] h-[11px] rounded-full bg-[#22C7CB] border-2 border-white" />
                <div className="text-[13px] font-semibold text-[#202A2E]">
                  <span className="text-[#22BFC3] mr-2">{day}</span>{spot}
                </div>
                <div className="text-[11px] text-[#7A858B] mt-1 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
          <Card className="p-3 text-[11px] text-[#59666C] leading-relaxed">
            <div className="text-[13px] font-semibold text-[#202A2E] mb-1">费用说明</div>
            费用包含：往返机票、5晚酒店、行程内交通及门票、每日早餐、专业领队服务。<br />
            费用不含：个人消费、自选自费项目、单房差。
          </Card>
          <button
            type="button"
            {...bindTap({ kind: 'action', id: 'tour.detail.1.other' }, {
              onTrigger: () => recordAction('tour.detail.1.other', '收藏线路'),
            })}
            className="h-10 rounded-full border border-[#DDE3E5] bg-white text-[13px] cursor-pointer"
          >
            ♡ 收藏线路
          </button>
          <button
            type="button"
            {...bookBinding}
            className="h-12 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white font-semibold border-none cursor-pointer flex items-center justify-center gap-2"
          >
            立即报名　¥3280 起
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        {...(nodeId.startsWith('hotel')
          ? bindTap({ kind: 'action', id: 'hotel.detail.1.other' }, {
              onTrigger: () => recordAction('hotel.detail.1.other', '相册入口'),
            })
          : nodeId.startsWith('ticket')
            ? bindTap({ kind: 'action', id: 'ticket.detail.1.other' }, {
                onTrigger: () => recordAction('ticket.detail.1.other', '锚点侧栏'),
              })
            : {})}
        className="relative h-[205px] w-full border-none p-0 cursor-pointer"
      >
        <Img src={imageName} className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/65 to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-white text-left">
          <div className="text-[19px] font-bold">
            {scenic
              ? '南京欢乐谷'
              : nodeId.startsWith('flight')
                ? '广州 → 长沙'
                : nodeId.startsWith('homestay') || nodeId.startsWith('oversea')
                  ? stay.city
                  : title}
          </div>
          <div className="text-[11px] mt-1">真实用户好评 · 平台服务保障</div>
        </div>
      </button>
      <div className="px-3 py-3 grid gap-2">
        <Card className="p-3">
          <div className="flex items-center">
            <Score value={4.8} />
            <span className="ml-2 text-[12px] text-[#22BFC3]">超棒 · 1243条评价</span>
          </div>
          <div className="mt-2 text-[12px] text-[#59666C] flex items-center gap-1">
            <IcPin size={14} className="text-[#22C7CB]" />
            距市中心2.7公里 · 地图
          </div>
        </Card>
        {scenic ? (
          <>
            <div className="flex gap-4 text-[13px] border-b border-[#eef1f2] pb-1">
              {['门票', '点评', '周边'].map((tab, index) => (
                <button
                  key={tab}
                  type="button"
                  {...bindTap({ kind: 'action', id: 'ticket.detail.2.other' }, {
                    onTrigger: () => {
                      setDetailTab(index);
                      recordAction('ticket.detail.2.other', tab);
                    },
                  })}
                  className={`pb-1 bg-transparent border-x-0 border-t-0 cursor-pointer ${
                    detailTab === index ? 'text-[#22BFC3] border-b-2 border-[#22C7CB] font-semibold' : 'text-[#8A9499] border-b-0'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {detailTab === 0 && SCENIC_TICKETS.map((ticket) => (
              <Card key={ticket.name} className="p-3">
                <div className="flex items-center">
                  <div className="text-[14px] font-semibold">{ticket.name}</div>
                  <span className="ml-2 text-[10px] text-[#FF6A2C] bg-[#FFF3EC] rounded px-1.5 py-0.5">{ticket.tag}</span>
                </div>
                <div className="text-[10px] text-[#7A858B] mt-1">{ticket.desc}</div>
                <div className="text-[10px] text-[#12C3CE] mt-1">免费取消 · 极速确认 · 平台保障</div>
                <div className="mt-2 flex items-end">
                  {ticket.strike > ticket.price && (
                    <span className="text-[10px] text-[#B4BBBF] line-through mr-1">¥{ticket.strike}</span>
                  )}
                  <Price value={ticket.price} />
                  <button
                    type="button"
                    {...bindTap('ticket.detail.0.open', {
                      beforeTrigger: () => setSelectedFare({ title: `南京欢乐谷 · ${ticket.name}`, price: ticket.price }),
                    })}
                    className="ml-auto rounded-full bg-[#FF5C2E] text-white text-[11px] px-4 py-1.5 border-none cursor-pointer"
                  >
                    预订
                  </button>
                </div>
              </Card>
            ))}
            {detailTab === 1 && (
              <>
                <Card className="p-3 flex items-center">
                  <div className="text-[30px] font-extrabold text-[#FF8A00] leading-none">4.8</div>
                  <div className="ml-3 text-[11px] text-[#59666C]">
                    <div className="text-[#22BFC3] font-semibold">超棒 · 好评率98%</div>
                    <div className="mt-1">共1243条真实评价</div>
                  </div>
                </Card>
                {SCENIC_REVIEWS.map((rv) => (
                  <Card key={rv.user} className="p-3">
                    <div className="flex items-center">
                      <span className="w-7 h-7 rounded-full bg-[#E8F9F9] text-[#17B7BB] flex items-center justify-center text-[12px] font-semibold">
                        {rv.user.slice(0, 1)}
                      </span>
                      <span className="ml-2 text-[13px] font-medium">{rv.user}</span>
                      <span className="ml-auto text-[11px] text-[#FF8A00]">{'★'.repeat(rv.score)}</span>
                    </div>
                    <div className="text-[12px] text-[#465359] mt-2 leading-relaxed">{rv.text}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] text-[#22808A] bg-[#E7F8F9] rounded px-2 py-0.5">{rv.tag}</span>
                      <span className="text-[10px] text-[#9AA3A7]">{rv.date}</span>
                    </div>
                  </Card>
                ))}
              </>
            )}
            {detailTab === 2 && SCENIC_NEARBY.map((nb) => (
              <Card key={nb.name} className="p-2 flex gap-2.5">
                <Img src={image(nb.img)} className="w-[92px] h-[72px] rounded-lg object-cover shrink-0" alt={nb.name} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold line-clamp-1">{nb.name}</div>
                  <div className="mt-1 text-[10px] text-[#22808A] bg-[#E7F8F9] rounded px-1.5 py-0.5 inline-block">{nb.type}</div>
                  <div className="mt-1 text-[11px] text-[#8A9499] flex items-center gap-1">
                    <IcPin size={12} className="text-[#22C7CB]" />{nb.dist}
                  </div>
                  <div className="text-right">
                    {nb.price > 0 ? <Price value={nb.price} /> : <span className="text-[13px] font-semibold text-[#22BFC3]">免费</span>}
                  </div>
                </div>
              </Card>
            ))}
          </>
        ) : nodeId.startsWith('homestay') || nodeId.startsWith('oversea') ? (
          <>
            <div className="flex items-center text-[12px] text-[#7A858B] bg-[#F5F9FA] rounded-lg px-3 py-2">
              <IcCalendar size={13} className="text-[#22C7CB] mr-1.5" />
              {stay.checkIn} — {stay.checkOut} · {stay.nights}晚 · {stay.rooms}间
            </div>
            {(nodeId.startsWith('homestay') ? HOMESTAY_ROOMS : OVERSEA_ROOMS).map((room) => {
              const total = room.unit * stay.nights * stay.rooms;
              const roomTitle = `${stay.city} · ${room.name}`;
              const isHomestay = nodeId.startsWith('homestay');
              const roomBind = isHomestay
                ? bindTap('homestay.detail.0.open', {
                    beforeTrigger: () => setBookingDraft({ title: roomTitle, amount: total }),
                  })
                : bindTap('oversea.detail.0.open', {
                    beforeTrigger: () => setSelectedRoom({ title: roomTitle, price: room.unit }),
                  });
              return (
                <Card key={room.name} className="p-2.5 flex gap-2.5">
                  <Img src={image(room.img)} className="w-[96px] h-[78px] rounded-lg object-cover shrink-0" alt={room.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold line-clamp-1">{room.name}</div>
                    <div className="text-[11px] text-[#7A858B] mt-1">{room.bed} · {room.size}</div>
                    <div className="text-[11px] text-[#12C3CE] mt-0.5">{room.meal}</div>
                    <div className="mt-1.5 flex items-end">
                      <div>
                        <Price value={room.unit} suffix="/晚" />
                        <div className="text-[10px] text-[#8A9499]">{stay.nights}晚×{stay.rooms}间 合计¥{total}</div>
                      </div>
                      <button
                        type="button"
                        {...roomBind}
                        className="ml-auto rounded-full bg-[#FF5C2E] text-white text-[12px] px-4 py-1.5 border-none cursor-pointer self-center"
                      >
                        订
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </>
        ) : (
          [1, 2, 3].map((number) => (
            <Card key={number} className="p-3">
              <div className="text-[14px] font-semibold">高级大床房 · 含早餐</div>
              <div className="text-[10px] text-[#7A858B] mt-1">免费取消 · 极速确认 · 平台保障</div>
              <div className="mt-2 flex items-center">
                <Price value={368 + number * 20} />
                <button
                  type="button"
                  {...bookBinding}
                  className="ml-auto rounded-full bg-[#FF5C2E] text-white text-[11px] px-4 py-1.5 border-none cursor-pointer"
                >
                  预订
                </button>
              </div>
            </Card>
          ))
        )}
        {nodeId.startsWith('homestay') && (
          <button
            type="button"
            {...bindTap('homestay.detail.1.open')}
            className="h-11 rounded-full border border-[#22C7CB] text-[#22C7CB] bg-white cursor-pointer"
          >
            咨询房东
          </button>
        )}
      </div>
    </div>
  );
}

// 各产品下单页的单价（酒店走选中房型，其余走产品基准价）
const PRODUCT_UNIT: Record<string, { amount: number; title: string; kind: string }> = {
  flight: { amount: 318, title: '广州 → 长沙 HO1234', kind: '机票' },
  ticket: { amount: 153, title: '南京欢乐谷 · 成人票', kind: '门票' },
  train: { amount: 198, title: '南京 → 鞍山 G1234', kind: '火车票' },
  oversea: { amount: 512, title: '曼谷素坤逸酒店 · 高级房', kind: '海外酒店' },
};

function BookingView({ nodeId }: { nodeId: string }) {
  const passengers = useQunaerStore((state) => state.passengers);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const search = useQunaerStore((state) => state.search);
  const selectedRoom = useQunaerStore((state) => state.selectedRoom);
  const selectedFare = useQunaerStore((state) => state.selectedFare);
  const setBookingDraft = useQunaerStore((state) => state.setBookingDraft);
  const roundTrip = useQunaerStore((state) => state.roundTrip);
  const stay = useQunaerStore((state) => state.stay);
  const { bindTap } = useQunaerGestures();
  const isHotel = nodeId.startsWith('hotel');
  const isOversea = nodeId.startsWith('oversea');
  // 酒店与海外酒店都按「单价 × 晚数 × 间数」计价。
  const isStay = isHotel || isOversea;
  // 往返机票/火车下单页：标题与日期显示去程 ⇄ 返程。
  const isRound = !!roundTrip && (nodeId.startsWith('flight') || nodeId.startsWith('train')) && roundTrip.train === nodeId.startsWith('train');
  const [rooms, setRooms] = React.useState(1);
  // 乘机人勾选与「选择乘机人」弹层共用全局选择，人数直接决定票价。
  const selectedIds = useQunaerStore((state) => state.selectedPassengerIds);
  const togglePassenger = useQunaerStore((state) => state.togglePassengerSelected);

  const productKey = (['flight', 'ticket', 'train', 'oversea'] as const).find((key) => nodeId.startsWith(key));
  const base = PRODUCT_UNIT[productKey ?? 'flight'] ?? PRODUCT_UNIT.flight;
  // 机票/火车/门票用详情页选中的舱位/席别/票种单价；海外酒店走房型单价。
  const useFare = productKey === 'flight' || productKey === 'train' || productKey === 'ticket';
  const nights = isHotel ? nightsBetween(search.hotelCheckIn, search.hotelCheckOut) : isOversea ? stay.nights : 1;
  const roomsCount = isHotel ? rooms : isOversea ? stay.rooms : 1;
  const guests = Math.max(1, selectedIds.length);
  const hotelUnit = selectedRoom?.price ?? (isOversea ? 512 : 368);
  const fareUnit = useFare ? selectedFare?.price ?? base.amount : base.amount;
  const fareTitle = useFare ? selectedFare?.title ?? base.title : base.title;
  // 住宿：单价 × 晚数 × 间数；其它产品：单价 × 人数（至少 1 人）
  const payTitle = isStay ? selectedRoom?.title ?? (isOversea ? '曼谷素坤逸酒店 · 高级房' : '汉庭酒店(烟台火车站烟台港客运站店)') : fareTitle;
  const payTotal = isStay ? hotelUnit * nights * roomsCount : fareUnit * guests;

  const payOptions = { beforeTrigger: () => setBookingDraft({ title: payTitle, amount: payTotal }) };
  const payBinding = nodeId.startsWith('flight')
    ? bindTap('flight.booking.1.open', payOptions)
    : nodeId.startsWith('ticket')
      ? bindTap('ticket.booking.0.open', payOptions)
      : nodeId.startsWith('train')
        ? bindTap('train.booking.2.open', payOptions)
        : nodeId.startsWith('oversea')
          ? bindTap('oversea.booking.0.open', payOptions)
          : bindTap('hotel.booking.0.open', payOptions);

  return (
    <div className="px-3 py-3 grid gap-2">
      <Card className="p-3 bg-gradient-to-r from-[#22C7CB] to-[#3AA8E7] text-white">
        <div className="text-[13px] opacity-90">订单填写</div>
        <div className="text-[17px] font-semibold mt-1">
          {isRound && roundTrip
            ? `${roundTrip.depart.from} ⇄ ${roundTrip.depart.to}　往返`
            : nodeId.startsWith('flight')
              ? `广州 → 长沙　${search.departDate}`
              : nodeId.startsWith('ticket')
                ? '南京欢乐谷门票'
                : isOversea
                  ? stay.city
                  : '高品质旅行产品'}
        </div>
        {isRound && roundTrip && (
          <div className="text-[11px] opacity-90 mt-1">
            去 {roundTrip.depart.date} {roundTrip.depart.d} · 返 {roundTrip.return.date} {roundTrip.return.d}
          </div>
        )}
      </Card>
      <button
        type="button"
        {...(isHotel
          ? bindTap('hotel.booking.2.open')
          : nodeId.startsWith('flight')
            ? bindTap('flight.booking.2.open')
            : nodeId.startsWith('train')
              ? bindTap('train.booking.3.open')
              : nodeId.startsWith('ticket')
                ? bindTap('ticket.booking.3.open')
                : nodeId.startsWith('oversea')
                  ? bindTap('oversea.booking.1.open')
                  : {})}
        className="p-3 bg-white rounded-xl border border-[#edf0f2] flex items-center cursor-pointer text-left"
      >
        <IcCalendar size={17} className="text-[#22C7CB]" />
        <span className="ml-2 font-semibold text-[14px]">选择日期</span>
        <span className="ml-auto text-[12px] text-[#FF6A2B]">
          {isHotel
            ? `${search.hotelCheckIn} - ${search.hotelCheckOut}`
            : isOversea
              ? `${stay.checkIn} - ${stay.checkOut}`
              : isRound
                ? `${search.departDate} - ${search.returnDate}`
                : search.departDate}
        </span>
      </button>
      {isHotel && (
        <Card className="p-3 flex items-center">
          <IcBed size={17} className="text-[#22C7CB]" />
          <span className="ml-2 font-semibold text-[14px]">房间数量</span>
          <span className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRooms((n) => Math.max(1, n - 1))}
              className="w-7 h-7 rounded-full border border-[#DDE3E5] bg-white flex items-center justify-center cursor-pointer"
            >
              <IcMinus size={14} />
            </button>
            <span className="text-[15px] font-semibold w-4 text-center">{rooms}</span>
            <button
              type="button"
              {...bindTap({ kind: 'action', id: 'hotel.booking.1.other' }, {
                onTrigger: () => {
                  setRooms((n) => Math.min(5, n + 1));
                  recordAction('hotel.booking.1.other', '增加间数');
                },
              })}
              className="w-7 h-7 rounded-full border border-[#22C7CB] text-[#22C7CB] bg-white flex items-center justify-center cursor-pointer"
            >
              <IcPlus size={14} />
            </button>
          </span>
        </Card>
      )}
      <Card className="p-3">
        <button
          type="button"
          {...(nodeId.startsWith('train')
            ? bindTap('train.booking.0.open')
            : nodeId.startsWith('ticket')
              ? bindTap({ kind: 'action', id: 'ticket.booking.2.other' }, {
                  onTrigger: () => recordAction('ticket.booking.2.other', '游客编辑'),
                })
              : nodeId.startsWith('flight')
                ? bindTap({ kind: 'action', id: 'flight.booking.0.other' }, {
                    onTrigger: () => recordAction('flight.booking.0.other', '去支付准备'),
                  })
                : isHotel
                  ? bindTap('hotel.booking.3.open')
                  : {})}
          className="flex items-center bg-transparent border-none p-0 w-full cursor-pointer text-left"
        >
          <IcUsers size={17} className="text-[#22C7CB]" />
          <span className="ml-2 font-semibold text-[14px]">旅客信息</span>
          <span className="ml-auto text-[11px] text-[#22BFC3]">＋新增</span>
        </button>
        {passengers.map((person) => {
          const on = selectedIds.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => togglePassenger(person.id)}
              className="mt-3 w-full flex items-center gap-2 border-t border-[#edf0f2] pt-3 bg-transparent border-x-0 border-b-0 cursor-pointer text-left"
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                  on ? 'bg-[#22C7CB]' : 'border-2 border-[#CBD3D6]'
                }`}
              >
                {on && <IcCheck size={12} className="text-white" />}
              </span>
              <div>
                <div className="text-[13px] font-medium">{person.name}</div>
                <div className="text-[10px] text-[#8A9499]">{person.idNo}</div>
              </div>
            </button>
          );
        })}
      </Card>
      {nodeId.startsWith('train') && (
        <button
          type="button"
          {...bindTap({ kind: 'action', id: 'train.booking.1.other' }, {
            onTrigger: () => recordAction('train.booking.1.other', '普通预订'),
          })}
          className="p-3 bg-white rounded-xl border border-[#edf0f2] text-[13px] cursor-pointer"
        >
          普通预订
        </button>
      )}
      <Card className="p-3">
        <div className="font-semibold text-[14px]">优惠与保障</div>
        <div className="mt-3 flex justify-between text-[12px]">
          <span>
            <IcDiscount size={15} className="inline text-[#FF6A2B]" /> 随机立减
          </span>
          <span className="text-[#FF5B2D]">-¥18.64</span>
        </div>
      </Card>
      <Card className="p-3">
        <div className="flex items-end">
          <div>
            <div className="text-[10px] text-[#8A9499]">待支付</div>
            <Price value={payTotal} large suffix="" />
            <div className="text-[10px] text-[#8A9499] mt-0.5">
              {isStay ? `¥${hotelUnit} × ${nights}晚 × ${roomsCount}间` : `¥${fareUnit} × ${guests}人`}
            </div>
          </div>
          <button
            type="button"
            {...payBinding}
            className="ml-auto h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white px-7 flex items-center font-semibold border-none cursor-pointer"
          >
            去支付
          </button>
        </div>
      </Card>
    </div>
  );
}

const PAY_METHODS = [
  ['支付宝支付', '#1677FF', '支'],
  ['微信支付', '#18B35B', '微'],
  ['银行卡支付', '#FF8C34', '卡'],
] as const;

function PayView({ success }: { success: boolean }) {
  const recordAction = useQunaerStore((state) => state.recordAction);
  const pendingBooking = useQunaerStore((state) => state.pendingBooking);
  const pendingOrderId = useQunaerStore((state) => state.pendingOrderId);
  const lastOrderId = useQunaerStore((state) => state.lastOrderId);
  const orders = useQunaerStore((state) => state.orders);
  const { bindTap, bindBack } = useQunaerGestures();
  const [method, setMethod] = React.useState(0);

  // 收银台阶段读待支付金额；支付成功页读刚生成的实付订单金额，避免回落到 318 占位价。
  const payingOrder = pendingOrderId ? orders.find((o) => o.id === pendingOrderId) : undefined;
  const paidOrder = orders.find((o) => o.id === lastOrderId);
  const cashierAmount = payingOrder?.amount ?? pendingBooking?.amount ?? 318;
  const amount = success ? paidOrder?.amount ?? cashierAmount : cashierAmount;

  if (success) {
    return (
      <div className="px-5 py-16 flex flex-col items-center">
        <span className="w-20 h-20 rounded-full bg-[#22C7CB] text-white flex items-center justify-center">
          <IcCheck size={48} />
        </span>
        <div className="text-[20px] font-semibold mt-5">支付成功</div>
        <div className="text-[12px] text-[#8A9499] mt-2">订单已提交，行程服务正在确认</div>
        <div className="mt-5">
          <Price value={amount} large suffix="" />
        </div>
        <button
          type="button"
          {...bindTap('pay.success.0.open')}
          className="mt-8 w-full h-11 rounded-full bg-[#22C7CB] text-white font-semibold border-none cursor-pointer"
        >
          查看订单
        </button>
        <button
          type="button"
          {...bindBack()}
          className="mt-3 text-[12px] text-[#8A9499] bg-transparent border-none cursor-pointer"
        >
          返回首页
        </button>
      </div>
    );
  }
  return (
    <div className="px-3 py-3">
      <Card className="p-4 text-center bg-gradient-to-b from-[#E8FAFB] to-white">
        <div className="text-[12px] text-[#67757A]">支付剩余时间 14:56</div>
        <div className="mt-2">
          <Price value={amount} large suffix="" />
        </div>
      </Card>
      <SectionTitle>支付方式</SectionTitle>
      <div className="grid gap-2">
        {PAY_METHODS.map(([name, color, glyph], index) => (
          <button
            key={name}
            type="button"
            onClick={() => setMethod(index)}
            className="p-3 flex items-center bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer w-full"
          >
            <span
              className="w-9 h-9 rounded-xl text-white flex items-center justify-center"
              style={{ background: color }}
            >
              {glyph}
            </span>
            <span className="ml-3 text-[14px] font-medium">{name}</span>
            <span
              className={`ml-auto w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                method === index ? 'border-[#22C7CB] bg-[#22C7CB] text-white' : 'border-[#D7DEE1]'
              }`}
            >
              {method === index && <IcCheck size={12} />}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        {...bindTap('pay.cashier.0.open')}
        className="mt-5 h-12 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white flex items-center justify-center font-semibold border-none w-full cursor-pointer"
      >
        {PAY_METHODS[method][0]} ¥{amount}
      </button>
      <button
        type="button"
        {...bindTap({ kind: 'action', id: 'pay.cashier.1.other' }, {
          onTrigger: () => recordAction('pay.cashier.1.other', '返回'),
        })}
        className="mt-3 w-full text-[12px] text-[#9AA3A7] bg-transparent border-none cursor-pointer"
      >
        暂不支付，返回
      </button>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  待支付: '#FF6A2B',
  待出行: '#22BFC3',
  已完成: '#8A9499',
  已取消: '#B0B8BC',
};

function OrderDetailView({ nodeId }: { nodeId: string }) {
  const orders = useQunaerStore((state) => state.orders);
  const currentOrderId = useQunaerStore((state) => state.currentOrderId);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const cancelOrder = useQunaerStore((state) => state.cancelOrder);
  const setPendingOrder = useQunaerStore((state) => state.setPendingOrder);
  const { bindTap, back } = useQunaerGestures();

  const order = orders.find((o) => o.id === currentOrderId) ?? orders[0];
  const cancelActionId = nodeId.includes('hotel')
    ? 'orders.detail.hotel.0.other'
    : nodeId.includes('ticket')
      ? 'orders.detail.ticket.0.other'
      : 'flight.order.detail.0.other';

  const headerText = order.status === '待支付'
    ? '待支付'
    : order.status === '已取消'
      ? '订单已取消'
      : order.status === '已完成'
        ? '行程已完成'
        : '预订成功';

  return (
    <div className="px-3 py-3 grid gap-2">
      <div className={`rounded-xl p-4 text-white ${order.status === '已取消' ? 'bg-gradient-to-r from-[#9AA6AB] to-[#7C888D]' : 'bg-gradient-to-r from-[#35CCB5] to-[#24A8D8]'}`}>
        <div className="text-[21px] font-semibold">{headerText}</div>
        <div className="text-[11px] mt-1">
          {order.status === '待支付' ? '请在30分钟内完成支付，逾期自动取消' : `出行日期 ${order.date}`}
        </div>
      </div>
      <Card className="p-3">
        <div className="flex items-center">
          <span className="text-[11px] text-[#22BFC3] font-semibold">{order.kind}</span>
          <span className="ml-auto text-[11px]" style={{ color: STATUS_COLOR[order.status] }}>{order.status}</span>
        </div>
        <div className="font-semibold text-[15px] mt-2">{order.title}</div>
        <div className="text-[11px] text-[#718087] mt-2">出行日期 {order.date}</div>
        <div className="mt-2 flex items-center">
          <span className="text-[11px] text-[#8A9499]">在线付</span>
          <span className="ml-auto"><Price value={order.amount} suffix="" /></span>
        </div>
      </Card>
      <Card className="p-3 text-[11px] text-[#718087] leading-relaxed">
        订单号：QN{order.id.replace(/[^0-9]/g, '').slice(-10) || '2026082600'}<br />
        订单信息与出行凭证已妥善保存，可在「我的-订单」中随时查看。
      </Card>
      <div className="flex gap-2">
        {(order.status === '待支付' || order.status === '待出行') && (
          <button
            type="button"
            {...bindTap({ kind: 'action', id: cancelActionId }, {
              onTrigger: () => {
                cancelOrder(order.id);
                recordAction(cancelActionId, '取消订单');
                back();
              },
            })}
            className="flex-1 h-10 rounded-full border border-[#DDE3E5] bg-white text-[12px] cursor-pointer"
          >
            取消订单
          </button>
        )}
        {order.status === '待支付' ? (
          <button
            type="button"
            {...(nodeId.includes('hotel')
              ? bindTap('orders.detail.hotel.1.open', { beforeTrigger: () => setPendingOrder(order.id) })
              : nodeId.includes('ticket')
                ? bindTap('orders.detail.ticket.2.open', { beforeTrigger: () => setPendingOrder(order.id) })
                : bindTap('flight.order.detail.1.open', { beforeTrigger: () => setPendingOrder(order.id) }))}
            className="flex-1 h-10 rounded-full bg-[#FF5B2D] text-white text-[12px] border-none cursor-pointer"
          >
            立即支付
          </button>
        ) : nodeId.includes('ticket') ? (
          <button
            type="button"
            {...bindTap('orders.detail.ticket.1.open')}
            className="flex-1 h-10 rounded-full bg-[#FF5B2D] text-white text-[12px] border-none cursor-pointer"
          >
            再次预订
          </button>
        ) : (
          <button
            type="button"
            {...(nodeId.includes('hotel')
              ? bindTap('orders.detail.hotel.2.open')
              : bindTap('flight.order.detail.2.open'))}
            className="flex-1 h-10 rounded-full bg-[#FF5B2D] text-white text-[12px] border-none cursor-pointer"
          >
            联系客服
          </button>
        )}
      </div>
    </div>
  );
}

function OrdersView({ nodeId }: { nodeId: string }) {
  const orders = useQunaerStore((state) => state.orders);
  const setCurrentOrder = useQunaerStore((state) => state.setCurrentOrder);
  const setPendingOrder = useQunaerStore((state) => state.setPendingOrder);
  const { bindTap } = useQunaerGestures();
  const isTrip = nodeId === 'trip.main';
  const [statusFilter, setStatusFilter] = React.useState('全部');

  if (nodeId.startsWith('orders.detail') || nodeId === 'flight.order.detail') {
    return <OrderDetailView nodeId={nodeId} />;
  }

  const filters = ['全部', '待支付', '待出行', '退款/售后', '待点评'];
  const visibleOrders = orders.filter((order) => {
    if (statusFilter === '全部') return true;
    if (statusFilter === '退款/售后') return order.status === '已取消';
    if (statusFilter === '待点评') return order.status === '已完成';
    return order.status === statusFilter;
  });

  return (
    <div className="px-3 py-3">
      {isTrip && (
        <div className="flex gap-6 text-[15px] mb-3 px-1">
          <span className="font-semibold text-[#202A2E] border-b-2 border-[#22C7CB] pb-1">我的行程</span>
          <button
            type="button"
            {...bindTap('trip.main.0.open')}
            className="text-[#8A9499] bg-transparent border-none cursor-pointer pb-1"
          >
            全部订单
          </button>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto mb-3">
        {filters.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setStatusFilter(label)}
            className="bg-transparent border-none p-0 cursor-pointer"
          >
            <StaticChip active={statusFilter === label}>{label}</StaticChip>
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {visibleOrders.length === 0 && (
          <div className="py-16 text-center text-[13px] text-[#8A9499]">该状态下暂无订单</div>
        )}
        {visibleOrders.map((order) => (
          <Card key={order.id} className="p-3">
            <div className="flex items-center">
              <span className="text-[11px] text-[#22BFC3] font-semibold">{order.kind}</span>
              <span className="ml-auto text-[11px]" style={{ color: STATUS_COLOR[order.status] }}>{order.status}</span>
            </div>
            <div className="text-[14px] font-semibold mt-2">{order.title}</div>
            <div className="text-[10px] text-[#8A9499] mt-1">{order.date}</div>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Price value={order.amount} suffix="" />
              <button
                type="button"
                {...(isTrip
                  ? bindTap('trip.main.2.open', { beforeTrigger: () => setCurrentOrder(order.id) })
                  : order.kind === '机票'
                    ? bindTap('orders.center.1.open', { beforeTrigger: () => setCurrentOrder(order.id) })
                    : bindTap('orders.center.2.open', { beforeTrigger: () => setCurrentOrder(order.id) }))}
                className="rounded-full border border-[#DDE3E5] px-3 py-1 text-[10px] bg-white cursor-pointer"
              >
                订单详情
              </button>
              {order.status === '待支付' && (
                <button
                  type="button"
                  {...(isTrip
                    ? bindTap('trip.main.1.open', { beforeTrigger: () => setPendingOrder(order.id) })
                    : bindTap('orders.center.0.open', { beforeTrigger: () => setPendingOrder(order.id) }))}
                  className="rounded-full bg-[#FF5B2D] text-white px-3 py-1 text-[10px] border-none cursor-pointer"
                >
                  立即支付
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// 代金券数据：我的页角标、优惠券页与首页神券弹层共用，保证数量一致。
const QUNAER_COUPONS = [
  { face: '¥30', name: '国内酒店满300减30', cat: '酒店', expire: '2026-08-31到期', rule: '限国内酒店，单笔满300元可用', tag: '即将过期' },
  { face: '¥20', name: '国内机票立减券', cat: '机票', expire: '2026-09-15到期', rule: '限国内经济舱，不与其它优惠叠加', tag: '' },
  { face: '¥10', name: '火车票支付券', cat: '火车票', expire: '2026-08-20到期', rule: '火车票在线支付可用，每单限1张', tag: '即将过期' },
  { face: '9.5折', name: '门票玩乐折扣券', cat: '景点', expire: '2026-10-01到期', rule: '景点门票通用，最高抵扣50元', tag: '' },
  { face: '¥50', name: '跟团游满2000减50', cat: '度假', expire: '2026-12-31到期', rule: '国内跟团游，单笔满2000元可用', tag: '限首单' },
  { face: '¥15', name: '接送机专享券', cat: '用车', expire: '2026-09-30到期', rule: '接送机订单立减，每单限1张', tag: '' },
];
const COUPON_TABS = ['全部', '酒店', '机票', '火车票', '景点'] as const;

// 我的页-常用工具的各自内容（发票/权益卡/点评/笔记），以底部弹层呈现，避免都跳常用信息。
function MineToolSheet({ tool, onClose }: { tool: string; onClose: () => void }) {
  const collectedWorld = useQunaerStore((state) => state.collectedWorld);
  const world = useQunaerStore((state) => state.world);
  const myNotes = collectedWorld.length
    ? world.filter((w) => collectedWorld.includes(w.id))
    : world.slice(0, 2);
  return (
    <ChannelSheet title={tool} onClose={onClose}>
      {tool === '我的发票' && (
        <div className="grid gap-2">
          <Card className="p-3">
            <div className="text-[14px] font-semibold">个人 · 骆小驼</div>
            <div className="text-[11px] text-[#8A9499] mt-1">增值税普通发票 · 抬头默认</div>
          </Card>
          <Card className="p-3">
            <div className="text-[14px] font-semibold">企业 · 去哪儿网络科技</div>
            <div className="text-[11px] text-[#8A9499] mt-1">税号 913301****** · 可开专票</div>
          </Card>
          <button type="button" onClick={onClose} className="h-10 rounded-full border border-[#22C7CB] text-[#22C7CB] bg-white cursor-pointer">＋ 新增抬头</button>
        </div>
      )}
      {tool === '权益卡' && (
        <div className="grid gap-2">
          <div className="rounded-xl p-4 text-white bg-gradient-to-r from-[#2A79B8] to-[#22C7CB]">
            <div className="text-[17px] font-extrabold">鲸喜 PLUS 年卡</div>
            <div className="text-[11px] opacity-90 mt-1">有效期至 2027-07-30 · 已省 ¥862</div>
          </div>
          {[['酒店免费取消', '每月3次'], ['延迟退房至14点', '不限次'], ['专属客服', '7×24h'], ['积分1.5倍', '长期有效']].map(([k, v]) => (
            <div key={k} className="flex items-center bg-white rounded-xl border border-[#edf0f2] p-3 text-[13px]">
              <IcStar size={15} className="text-[#FFB000] mr-2" />{k}
              <span className="ml-auto text-[11px] text-[#8A9499]">{v}</span>
            </div>
          ))}
        </div>
      )}
      {tool === '我的点评' && (
        <div className="grid gap-2">
          {[['云南昆明大理6日5晚', '领队专业，风景太美了，下次还来！', 5], ['汉庭酒店(烟台火车站店)', '干净卫生，交通方便，性价比高。', 4]].map(([title, text, score]) => (
            <Card key={title as string} className="p-3">
              <div className="text-[13px] font-semibold">{title}</div>
              <div className="text-[11px] text-[#FF8A00] mt-1">{'★'.repeat(score as number)}</div>
              <div className="text-[12px] text-[#465359] mt-1 leading-relaxed">{text}</div>
            </Card>
          ))}
          <div className="text-center text-[11px] text-[#8A9499] py-2">共 2 条点评 · 获得 600 积分</div>
        </div>
      )}
      {tool === '我的笔记' && (
        <div className="grid gap-2">
          <div className="text-[11px] text-[#8A9499] px-1">
            {collectedWorld.length ? '你收藏/发布的旅行笔记' : '还没有发布笔记，先看看收藏的攻略吧'}
          </div>
          {myNotes.map((note) => (
            <Card key={note.id} className="p-2 flex gap-2.5">
              <Img src={note.image} className="w-[92px] h-[70px] rounded-lg object-cover shrink-0" alt={note.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold line-clamp-2">{note.title}</div>
                <div className="text-[10px] text-[#8A9499] mt-1">{note.author} · {note.likes}赞</div>
              </div>
            </Card>
          ))}
          <button type="button" onClick={onClose} className="h-10 rounded-full bg-[#22C7CB] text-white border-none cursor-pointer">＋ 写笔记</button>
        </div>
      )}
    </ChannelSheet>
  );
}

function MineView({ login = false }: { login?: boolean }) {
  const session = useQunaerStore((state) => state.session);
  const orders = useQunaerStore((state) => state.orders);
  const collectedWorld = useQunaerStore((state) => state.collectedWorld);
  const [tool, setTool] = React.useState<string | null>(null);
  const { bindTap } = useQunaerGestures();
  const orderCount = (status: string) => orders.filter((o) => o.status === status).length;
  const orderGrid: [string, number][] = [
    ['待付款', orderCount('待支付')],
    ['待出行', orderCount('待出行')],
    ['待点评', orderCount('已完成')],
    ['退款/售后', orderCount('已取消')],
    ['我的订单', orders.length],
  ];
  if (login) {
    return (
      <div className="px-6 pt-16">
        <div className="text-[26px] font-bold">登录即刻享受低价</div>
        <div className="mt-8 h-12 border-b border-[#DDE3E5] flex items-center text-[15px]">
          <span className="mr-3">+86</span>
          <span className="text-[#A1A9AD]">请输入手机号</span>
        </div>
        <button
          type="button"
          {...bindTap('auth.login.0.open')}
          className="mt-6 h-12 rounded-full bg-[#22C7CB] text-white flex items-center justify-center font-semibold border-none w-full cursor-pointer"
        >
          获取验证码并登录
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="bg-gradient-to-br from-[#E4F4FF] to-[#EFE8FF] px-4 pt-4 pb-5">
        <div className="flex items-center">
          <button
            type="button"
            {...bindTap('mine.main.5.open')}
            className="flex items-center bg-transparent border-none p-0 cursor-pointer text-left"
          >
            <Img src={session.avatar} className="w-14 h-14 rounded-full object-cover border-2 border-white" />
            <div className="ml-3">
              <div className="text-[18px] font-semibold">{session.loggedIn ? session.name : '登录/注册'}</div>
              <div className="text-[10px] text-[#7A858B] mt-1">{session.level}</div>
            </div>
          </button>
          <button
            type="button"
            {...bindTap('mine.main.4.open')}
            className="ml-auto bg-transparent border-none cursor-pointer text-[16px]"
          >
            ⚙
          </button>
        </div>
        <Card className="mt-3 p-3 bg-gradient-to-r from-[#E2F7FF] to-[#D5E5FF]">
          <div className="text-[18px] font-extrabold text-[#2A79B8]">V4 铂金会员</div>
          <div className="text-[10px] text-[#5D7790] mt-1">积分当钱花 · 酒店免费取消 · 延迟退房</div>
        </Card>
      </div>
      <div className="px-3 -mt-2 grid gap-2">
        <Card className="p-3 grid grid-cols-3 text-center">
          <button type="button" {...bindTap('mine.main.2.open')} className="bg-transparent border-none cursor-pointer">
            <b>{QUNAER_COUPONS.length}</b>
            <small className="block text-[#8A9499]">优惠券</small>
          </button>
          <button type="button" {...bindTap('mine.main.3.open')} className="bg-transparent border-none cursor-pointer">
            <b>{collectedWorld.length}</b>
            <small className="block text-[#8A9499]">收藏浏览</small>
          </button>
          <div>
            <b>6327</b>
            <small className="block text-[#8A9499]">积分</small>
          </div>
        </Card>
        <Card className="p-3">
          <button
            type="button"
            {...bindTap('mine.main.0.open')}
            className="grid grid-cols-5 text-center text-[10px] bg-transparent border-none w-full cursor-pointer p-0"
          >
            {orderGrid.map(([label, count]) => (
              <div key={label} className="relative">
                <span className="mx-auto w-8 h-8 rounded-full bg-[#ECFAFA] text-[#22BFC3] flex items-center justify-center">
                  <IcTicket size={16} />
                </span>
                {count > 0 && (
                  <span className="absolute top-0 right-3 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF3B2F] text-white text-[9px] flex items-center justify-center">
                    {count}
                  </span>
                )}
                <div className="mt-1">{label}</div>
              </div>
            ))}
          </button>
        </Card>
        <Card className="p-3 grid grid-cols-5 text-center text-[10px]">
          {[
            ['常用信息', null],
            ['我的发票', '我的发票'],
            ['权益卡', '权益卡'],
            ['我的点评', '我的点评'],
            ['我的笔记', '我的笔记'],
          ].map(([label, sheet]) =>
            sheet ? (
              <button
                key={label as string}
                type="button"
                onClick={() => setTool(sheet as string)}
                className="bg-transparent border-none cursor-pointer p-0"
              >
                <IcUser className="mx-auto text-[#65737A]" size={18} />
                <div className="mt-2">{label}</div>
              </button>
            ) : (
              <button
                key={label as string}
                type="button"
                {...bindTap('mine.main.1.open')}
                className="bg-transparent border-none cursor-pointer p-0"
              >
                <IcUser className="mx-auto text-[#65737A]" size={18} />
                <div className="mt-2">{label}</div>
              </button>
            ),
          )}
        </Card>
      </div>
      {tool && <MineToolSheet tool={tool} onClose={() => setTool(null)} />}
    </div>
  );
}

function ChatView({ nodeId }: { nodeId: string }) {
  const isMerchant = nodeId.includes('merchant');
  const thread = isMerchant ? 'merchant' : 'ai';
  const messages = useQunaerStore((state) => state.chat[thread]);
  const sendChat = useQunaerStore((state) => state.sendChat);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const { bindTap } = useQunaerGestures();
  const [draft, setDraft] = React.useState('');

  const sendId = isMerchant ? 'support.chat.merchant.0.other' : 'support.chat.ai.0.other';
  const extraId = isMerchant ? 'support.chat.merchant.1.other' : 'support.chat.ai.1.other';
  const quickReplies = isMerchant
    ? ['订单还没确认', '可以修改入住人吗', '发票怎么开', '联系电话']
    : ['如何退款', '入离园时间', '身份证没带', '在线选座', '联系人工'];

  const submit = (text: string) => {
    const value = text.trim();
    if (!value) return;
    sendChat(thread, value);
    recordAction(sendId, value);
    setDraft('');
  };

  const avatar = image(isMerchant ? 'avatar_4' : 'avatar_1_v2');

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-3 py-3 grid gap-3 content-start">
        <div className="text-center text-[10px] text-[#9AA3A7]">以上为历史消息</div>
        {messages.map((msg) =>
          msg.role === 'user' ? (
            <div key={msg.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-xl rounded-tr-sm bg-[#22C7CB] text-white p-3 text-[12px] leading-relaxed">
                {msg.text}
              </div>
            </div>
          ) : (
            <div key={msg.id} className="flex gap-2">
              <Img src={avatar} className="w-9 h-9 rounded-full object-cover shrink-0" />
              <div className="max-w-[75%] rounded-xl rounded-tl-sm bg-white p-3 text-[12px] leading-relaxed">
                {msg.text}
              </div>
            </div>
          ),
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          {quickReplies.map((text) => (
            <button
              key={text}
              type="button"
              {...bindTap({ kind: 'action', id: sendId }, { onTrigger: () => submit(text) })}
              className="bg-transparent border-none p-0 cursor-pointer"
            >
              <StaticChip>{text}</StaticChip>
            </button>
          ))}
        </div>
        <button
          type="button"
          {...bindTap({ kind: 'action', id: extraId }, {
            onTrigger: () => recordAction(extraId, isMerchant ? '电话联系' : '转人工客服'),
          })}
          className="justify-self-start text-[12px] text-[#22BFC3] bg-transparent border-none cursor-pointer"
        >
          {isMerchant ? '电话联系商家' : '转人工客服'}
        </button>
      </div>
      <div className="sticky bottom-0 bg-white border-t border-[#edf0f2] px-3 py-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') submit(draft);
          }}
          placeholder="请输入您的问题…"
          className="flex-1 h-9 rounded-full bg-[#F2F5F6] px-4 text-[13px] text-[#202A2E] placeholder:text-[#9AA3A7] border-none outline-none"
        />
        <button
          type="button"
          {...bindTap({ kind: 'action', id: sendId }, { onTrigger: () => submit(draft) })}
          className="w-9 h-9 rounded-full bg-[#22C7CB] text-white flex items-center justify-center border-none cursor-pointer shrink-0"
        >
          <IcSend size={16} />
        </button>
      </div>
    </div>
  );
}

function SupportView({ nodeId }: { nodeId: string }) {
  const recordAction = useQunaerStore((state) => state.recordAction);
  const { bindTap } = useQunaerGestures();
  if (nodeId.includes('chat')) {
    return <ChatView nodeId={nodeId} />;
  }
  if (nodeId === 'support.faq') {
    return (
      <div className="px-3 py-3">
        <Card className="p-3 text-[13px] leading-relaxed">
          顺利登机需要提前打印行程单或使用电子登机牌，建议提前2小时到达机场。
        </Card>
        <button
          type="button"
          {...bindTap({ kind: 'action', id: 'support.faq.0.other' }, {
            onTrigger: () => recordAction('support.faq.0.other', '返回'),
          })}
          className="mt-4 w-full h-10 rounded-full border border-[#DDE3E5] bg-white cursor-pointer"
        >
          返回
        </button>
      </div>
    );
  }
  return (
    <div>
      <div className="bg-gradient-to-b from-[#D8F1FF] to-[#EEF6FF] px-4 py-4">
        <div className="flex items-center">
          <Img src={image('avatar_1_v2')} className="w-12 h-12 rounded-full object-cover" />
          <div className="ml-3">
            <div className="font-semibold">去哪儿客服，全程为您服务</div>
            <div className="text-[10px] text-[#6D7B82] mt-1">7×24小时守护您的每段行程</div>
          </div>
        </div>
        <Card className="p-3 mt-3">
          <div className="font-semibold text-[13px]">汉庭酒店(威海山大十字店)</div>
          <div className="text-[10px] text-[#8A9499] mt-1">2026-07-24至2026-07-26 · 1间</div>
          <button
            type="button"
            {...bindTap('support.main.0.open')}
            className="mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] bg-white cursor-pointer"
          >
            联系客服
          </button>
        </Card>
      </div>
      <div className="px-3">
        <SectionTitle>找客服帮忙</SectionTitle>
        {[['机票在线客服', IcPlane], ['酒店在线客服', IcHotel], ['其他客服', IcMessage]].map(
          ([label, Icon]) => {
            const C = Icon as typeof IcPlane;
            return (
              <button
                key={String(label)}
                type="button"
                {...bindTap('support.main.0.open')}
                className="p-3 mb-2 flex items-center bg-white rounded-xl border border-[#edf0f2] w-full cursor-pointer text-left"
              >
                <span className="w-9 h-9 rounded-xl bg-[#E8F9FA] text-[#22BFC3] flex items-center justify-center">
                  <C size={19} />
                </span>
                <div className="ml-3">
                  <div className="text-[13px] font-medium">{label as string}</div>
                  <div className="text-[10px] text-[#8A9499]">轻松解决您的问题</div>
                </div>
                <span className="ml-auto">›</span>
              </button>
            );
          },
        )}
        <SectionTitle>大家常问</SectionTitle>
        {['顺利登机，我要了解什么？', '在线选座，锁定心仪座位', '带行李乘机，要知道什么'].map(
          (text, index) => (
            <button
              key={text}
              type="button"
              {...bindTap('support.main.1.open')}
              className="bg-white px-3 py-3 border-b border-[#edf0f2] text-[12px] w-full text-left cursor-pointer border-x-0 border-t-0"
            >
              <span className="mr-2 text-[#22BFC3]">({index + 1})</span>
              {text}
              <span className="float-right">›</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}

const WORLD_CITIES = ['南京', '杭州', '成都', '三亚'];

function WorldView({ nodeId }: { nodeId: string }) {
  const world = useQunaerStore((state) => state.world);
  const currentWorldId = useQunaerStore((state) => state.currentWorldId);
  const setCurrentWorld = useQunaerStore((state) => state.setCurrentWorld);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const collectedWorld = useQunaerStore((state) => state.collectedWorld);
  const toggleWorldCollect = useQunaerStore((state) => state.toggleWorldCollect);
  const { bindTap } = useQunaerGestures();
  const [liked, setLiked] = React.useState(false);
  const [city, setCity] = React.useState('南京');
  if (nodeId !== 'world.main') {
    const isTopic = nodeId.includes('topic');
    const actionId = isTopic
      ? 'world.topic.0.other'
      : nodeId.includes('note')
        ? 'world.note.0.other'
        : 'world.article.0.other';
    const item = world.find((w) => w.id === currentWorldId) ?? world[0];
    const likeCount = item.likes + (liked ? 1 : 0);
    const collected = collectedWorld.includes(item.id);
    return (
      <div className="pb-20">
        <Img src={item.image} className="w-full h-[250px] object-cover" alt={item.title} />
        <article className="px-4 py-4 bg-white">
          <h1 className="text-[20px] leading-tight m-0">
            {isTopic ? `#${item.title}` : item.title}
          </h1>
          <div className="flex items-center mt-3">
            <span className="w-7 h-7 rounded-full bg-[#E8F9F9] text-[#17B7BB] flex items-center justify-center text-[12px] font-semibold">
              {item.author.slice(0, 1)}
            </span>
            <span className="ml-2 text-[12px] text-[#465359]">{item.author}</span>
            <span className="ml-auto text-[11px] text-[#8A9499]">12.8万次浏览</span>
          </div>
          <p className="text-[13px] leading-7 text-[#465359] mt-3">
            {isTopic
              ? '和大家一起分享这个夏天的旅行故事，发布带话题的笔记即可参与，还有机会赢取旅行基金和门票好礼。'
              : `${item.title}。从城市出发，沿着山海与古镇慢慢旅行，我们整理了交通、住宿、门票与游玩路线，让每一段旅程都轻松自在。沿途的风景值得你慢下来细细品味。`}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded-xl bg-[#F5F7F8] p-3 text-[11px] text-[#59666C]">🚄 交通：高铁直达，站内换乘方便</div>
            <div className="rounded-xl bg-[#F5F7F8] p-3 text-[11px] text-[#59666C]">🏨 住宿：老城区民宿，出行都便利</div>
          </div>
        </article>
        <div className="fixed left-0 right-0 bottom-0 max-w-[440px] mx-auto bg-white border-t border-[#eef1f2] px-4 py-2.5 flex items-center gap-3">
          <div className="flex-1 h-9 rounded-full bg-[#F2F5F6] px-4 flex items-center text-[12px] text-[#9AA3A7]">
            说点什么…
          </div>
          <button
            type="button"
            {...bindTap({ kind: 'action', id: actionId }, {
              onTrigger: () => {
                setLiked((v) => !v);
                recordAction(actionId, liked ? '取消点赞' : '点赞');
              },
            })}
            className="flex flex-col items-center bg-transparent border-none cursor-pointer"
          >
            <IcHeart size={20} className={liked ? 'text-[#FF385C]' : 'text-[#8A9499]'} fill={liked ? '#FF385C' : 'none'} />
            <span className="text-[9px] text-[#8A9499]">{likeCount}</span>
          </button>
          <button
            type="button"
            onClick={() => toggleWorldCollect(item.id)}
            className="flex flex-col items-center bg-transparent border-none cursor-pointer"
          >
            <IcStar size={20} className={collected ? 'text-[#FFB000]' : 'text-[#8A9499]'} fill={collected ? '#FFB000' : 'none'} />
            <span className="text-[9px] text-[#8A9499]">{collected ? '已收藏' : '收藏'}</span>
          </button>
        </div>
      </div>
    );
  }
  const cityNotes = world.filter((item) => (item.city ?? '南京') === city);
  const topics = cityNotes.slice(0, 2).length ? cityNotes.slice(0, 2) : world.slice(0, 2);
  return (
    <div>
      <div className="bg-gradient-to-b from-[#DBF6FF] to-white px-3 py-3">
        <div className="flex justify-around text-[13px]">
          <span>宝藏百城</span>
          <span className="text-[#22BFC3] border-b-2 border-[#22C7CB] pb-2">{city}攻略</span>
          <span>看世界</span>
        </div>
        <div className="mt-3 h-9 rounded-full bg-white flex items-center px-3 text-[12px] text-[#8A9499]">
          <IcSearch size={15} className="mr-2" />
          搜一搜 {city} 的吃住玩
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {WORLD_CITIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              className={`shrink-0 h-8 px-4 rounded-full text-[13px] border cursor-pointer ${
                c === city ? 'bg-[#22C7CB] text-white border-[#22C7CB] font-semibold' : 'bg-white text-[#5A666B] border-[#DDE3E5]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <SectionTitle>{city} · 热门话题</SectionTitle>
      <div className="px-3 grid grid-cols-2 gap-2">
        {topics.map((item, index) => (
          <button
            key={item.id}
            type="button"
            {...bindTap(index === 0 ? 'world.main.1.open' : 'world.main.0.open', {
              beforeTrigger: () => setCurrentWorld(item.id),
            })}
            className="overflow-hidden bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer p-0"
          >
            <Img src={item.image} className="w-full h-[110px] object-cover" />
            <div className="p-2 text-[12px] font-medium line-clamp-1">#{item.title}</div>
          </button>
        ))}
      </div>
      <SectionTitle>{city} · 攻略笔记</SectionTitle>
      <div className="px-3 columns-2 gap-2 pb-3">
        {cityNotes.map((item, index) => (
          <button
            key={item.id}
            type="button"
            {...bindTap(index % 2 === 0 ? 'world.main.0.open' : 'world.main.2.open', {
              beforeTrigger: () => setCurrentWorld(item.id),
            })}
            className="break-inside-avoid mb-2 bg-white rounded-xl overflow-hidden border-none p-0 text-left cursor-pointer w-full"
          >
            <Img src={item.image} className="w-full h-[125px] object-cover" />
            <div className="p-2 text-[12px]">
              {item.title}
              <div className="text-[9px] text-[#8A9499] mt-1">
                {item.author} · {item.likes}人推荐{collectedWorld.includes(item.id) ? ' · 已收藏' : ''}
              </div>
            </div>
          </button>
        ))}
      </div>
      <div className="px-3 pb-4">
        <button
          type="button"
          {...bindTap('world.main.3.open')}
          className="w-full p-3 rounded-xl bg-gradient-to-r from-[#FFF2E1] to-[#FFE4CF] text-left border-none cursor-pointer"
        >
          <div className="text-[14px] font-extrabold text-[#FF4E2B]">低价机票推荐</div>
          <div className="text-[10px] text-[#986344] mt-1">{city} 出发特价航线</div>
        </button>
      </div>
    </div>
  );
}

const VACATION_CITIES = ['南京', '杭州', '成都', '西安', '厦门', '昆明', '三亚', '重庆'];

function ChannelFieldRow({
  icon,
  label,
  value,
  extra,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: string;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {icon}
      <span className="text-[12px] text-[#8A9499] w-16 shrink-0">{label}</span>
      <span className="text-[13px] font-medium text-[#202A2E] truncate">{value}</span>
      {extra && <span className="ml-auto text-[11px] text-[#8A9499]">{extra}</span>}
      {onClick && <IcDown size={13} className="ml-1 text-[#B4BBBF] shrink-0" />}
    </>
  );
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center border-t border-[#edf0f2] pt-3 mt-3 bg-transparent border-x-0 border-b-0 cursor-pointer text-left"
      >
        {inner}
      </button>
    );
  }
  return <div className="flex items-center border-t border-[#edf0f2] pt-3 mt-3">{inner}</div>;
}

// ---- 频道选择：底部弹层 + 步进器 + 日期工具 ----
function ChannelSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-2xl max-h-[72%] flex flex-col" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center px-4 h-12 border-b border-[#f0f2f3] shrink-0">
          <div className="text-[15px] font-semibold">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto w-7 h-7 rounded-full bg-[#F2F4F5] text-[#8A9499] border-none cursor-pointer flex items-center justify-center text-[16px] leading-none"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-3 py-3">{children}</div>
      </div>
    </div>
  );
}

function Stepper({ value, min, max, onChange }: { value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-7 h-7 rounded-full border border-[#DDE3E5] bg-white flex items-center justify-center cursor-pointer"
      >
        <IcMinus size={14} />
      </button>
      <span className="text-[15px] font-semibold w-5 text-center">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-7 h-7 rounded-full border border-[#22C7CB] text-[#22C7CB] bg-white flex items-center justify-center cursor-pointer"
      >
        <IcPlus size={14} />
      </button>
    </span>
  );
}

const STAY_DOMESTIC_CITIES = ['三亚·海棠湾', '杭州·西湖', '成都·锦江', '苏州·姑苏', '厦门·思明', '大理·古城', '莫干山', '重庆·渝中'];
const STAY_OVERSEA_CITIES = ['泰国·曼谷', '泰国·普吉', '日本·大阪', '日本·东京', '新加坡', '印尼·巴厘岛', '马来·吉隆坡', '越南·岘港'];
const CAR_PICKUP_CITIES = ['南京禄口国际机场', '上海虹桥机场', '北京大兴机场', '成都天府机场', '广州白云机场', '杭州萧山机场', '西安咸阳机场', '三亚凤凰机场'];
const TRANSFER_AIRPORTS = ['南京禄口国际机场 T2', '上海浦东国际机场 T2', '北京大兴国际机场', '广州白云国际机场 T2', '成都天府国际机场', '深圳宝安国际机场 T3'];
const TRANSFER_FLIGHTS = ['HO1234', 'MU5678', 'CA1830', 'CZ3901', 'MF8109'];
const CHANNEL_TIMES = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

// 生成从 App 当前时间（7月28日）起的连续日期，供入住/取车日期选择。
function buildChannelDays(count: number): { label: string; week: string }[] {
  const out: { label: string; week: string }[] = [];
  for (let i = 0; i < count; i += 1) {
    const date = TimeService.fromLocalParts(2026, 6, 28 + i);
    out.push({ label: `${date.getMonth() + 1}月${date.getDate()}日`, week: WEEK_LABELS[date.getDay()] });
  }
  return out;
}

function CitySheet({
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  title: string;
  options: string[];
  value: string;
  onPick: (city: string) => void;
  onClose: () => void;
}) {
  return (
    <ChannelSheet title={title} onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {options.map((city) => (
          <button
            key={city}
            type="button"
            onClick={() => onPick(city)}
            className={`h-10 rounded-lg text-[13px] border cursor-pointer px-2 truncate ${
              city === value ? 'bg-[#FFF1EC] text-[#FF4E2B] border-[#FF6B6B]' : 'bg-[#F5F7F8] text-[#39464B] border-transparent'
            }`}
          >
            {city}
          </button>
        ))}
      </div>
    </ChannelSheet>
  );
}

function StayDateSheet({
  checkIn,
  nights,
  onApply,
  onClose,
}: {
  checkIn: string;
  nights: number;
  onApply: (patch: { checkIn: string; checkOut: string; nights: number }) => void;
  onClose: () => void;
}) {
  const days = React.useMemo(() => buildChannelDays(30), []);
  const found = days.findIndex((day) => day.label === checkIn);
  const [idx, setIdx] = React.useState(found < 0 ? 0 : found);
  const [n, setN] = React.useState(nights);
  const outIdx = Math.min(days.length - 1, idx + n);
  return (
    <ChannelSheet title="选择入住 / 离店日期" onClose={onClose}>
      <div className="grid grid-cols-4 gap-2">
        {days.slice(0, 20).map((day, i) => (
          <button
            key={day.label}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-14 rounded-lg border text-center cursor-pointer ${
              i === idx
                ? 'bg-[#FFF1EC] border-[#FF6B6B]'
                : i > idx && i <= outIdx
                  ? 'bg-[#FFF7F4] border-transparent'
                  : 'bg-[#F5F7F8] border-transparent'
            }`}
          >
            <div className="text-[13px] font-semibold">{day.label}</div>
            <div className="text-[10px] text-[#8A9499]">周{day.week}</div>
          </button>
        ))}
      </div>
      <div className="flex items-center mt-4">
        <span className="text-[13px] font-medium flex-1">住几晚</span>
        <Stepper value={n} min={1} max={14} onChange={setN} />
      </div>
      <div className="text-[12px] text-[#8A9499] mt-3">
        入住 {days[idx].label} · 离店 {days[outIdx].label} · 共 {n} 晚
      </div>
      <button
        type="button"
        onClick={() => onApply({ checkIn: days[idx].label, checkOut: days[outIdx].label, nights: n })}
        className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white font-semibold border-none cursor-pointer"
      >
        确定
      </button>
    </ChannelSheet>
  );
}

function StayGuestSheet({
  rooms,
  guests,
  oversea,
  onApply,
  onClose,
}: {
  rooms: number;
  guests: number;
  oversea: boolean;
  onApply: (patch: { rooms: number; guests: number }) => void;
  onClose: () => void;
}) {
  const [r, setR] = React.useState(rooms);
  const [g, setG] = React.useState(guests);
  return (
    <ChannelSheet title={oversea ? '房间 / 住客' : '居室 / 住客'} onClose={onClose}>
      <div className="flex items-center py-2">
        <span className="flex-1 text-[13px]">{oversea ? '房间数' : '居室数'}</span>
        <Stepper value={r} min={1} max={8} onChange={setR} />
      </div>
      <div className="flex items-center py-2 border-t border-[#f0f2f3]">
        <span className="flex-1 text-[13px]">入住人数</span>
        <Stepper value={g} min={1} max={16} onChange={setG} />
      </div>
      <button
        type="button"
        onClick={() => onApply({ rooms: r, guests: g })}
        className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white font-semibold border-none cursor-pointer"
      >
        确定
      </button>
    </ChannelSheet>
  );
}

function CarDateSheet({
  pickup,
  days,
  onApply,
  onClose,
}: {
  pickup: string;
  days: number;
  onApply: (patch: { pickup: string; ret: string; days: number }) => void;
  onClose: () => void;
}) {
  const dayList = React.useMemo(() => buildChannelDays(30), []);
  const pickLabel = pickup.split(' ')[0];
  const pickTime = pickup.split(' ')[1] ?? '10:00';
  const found = dayList.findIndex((day) => day.label === pickLabel);
  const [idx, setIdx] = React.useState(found < 0 ? 0 : found);
  const [time, setTime] = React.useState(pickTime);
  const [d, setD] = React.useState(days);
  const retIdx = Math.min(dayList.length - 1, idx + d);
  return (
    <ChannelSheet title="取车 / 还车时间" onClose={onClose}>
      <div className="text-[12px] text-[#8A9499] mb-2">取车日期</div>
      <div className="grid grid-cols-4 gap-2">
        {dayList.slice(0, 16).map((day, i) => (
          <button
            key={day.label}
            type="button"
            onClick={() => setIdx(i)}
            className={`h-14 rounded-lg border text-center cursor-pointer ${
              i === idx ? 'bg-[#EAF3FE] border-[#3D9BE0]' : i > idx && i <= retIdx ? 'bg-[#F2F8FE] border-transparent' : 'bg-[#F5F7F8] border-transparent'
            }`}
          >
            <div className="text-[13px] font-semibold">{day.label}</div>
            <div className="text-[10px] text-[#8A9499]">周{day.week}</div>
          </button>
        ))}
      </div>
      <div className="text-[12px] text-[#8A9499] mt-3 mb-2">取车时间</div>
      <div className="flex flex-wrap gap-2">
        {CHANNEL_TIMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTime(t)}
            className={`h-8 px-3 rounded-full text-[12px] border cursor-pointer ${
              t === time ? 'bg-[#EAF3FE] text-[#2D6BF0] border-[#3D9BE0]' : 'bg-[#F5F7F8] text-[#39464B] border-transparent'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex items-center mt-4">
        <span className="text-[13px] font-medium flex-1">租期（天）</span>
        <Stepper value={d} min={1} max={30} onChange={setD} />
      </div>
      <div className="text-[12px] text-[#8A9499] mt-3">
        取车 {dayList[idx].label} {time} · 还车 {dayList[retIdx].label} {time} · 共 {d} 天
      </div>
      <button
        type="button"
        onClick={() => onApply({ pickup: `${dayList[idx].label} ${time}`, ret: `${dayList[retIdx].label} ${time}`, days: d })}
        className="mt-3 w-full h-11 rounded-full bg-gradient-to-r from-[#3DA0E6] to-[#4C6FF0] text-white font-semibold border-none cursor-pointer"
      >
        确定
      </button>
    </ChannelSheet>
  );
}

// 住宿类详情页的可预定房型（单价 × 晚数 × 间数）
const HOMESTAY_ROOMS = [
  { img: 'homestay_1', name: '整套一居 · 大床房', bed: '1张1.8米大床', size: '可住2人 · 45㎡', meal: '独立厨房 · 免费取消', unit: 398 },
  { img: 'homestay_2', name: '整套两居 · 双床房', bed: '2张1.5米床', size: '可住4人 · 78㎡', meal: '含双早 · 极速确认', unit: 598 },
  { img: 'homestay_3', name: '海景大平层 · 三居', bed: '3张大床', size: '可住6人 · 120㎡', meal: '专属管家 · 含双早', unit: 1288 },
];
const OVERSEA_ROOMS = [
  { img: 'hotel_5', name: '高级大床房', bed: '1张特大床', size: '2人 · 含双早', meal: '免费取消 · 中文前台', unit: 612 },
  { img: 'hotel_6', name: '豪华双床房', bed: '2张单人床', size: '2人 · 含双早', meal: '免费取消 · 接机可选', unit: 728 },
  { img: 'tour_4', name: '行政海景套房', bed: '1张特大床', size: '2人 · 行政酒廊', meal: '限时取消 · 延迟退房', unit: 1188 },
];

// 民宿·客栈 / 海外酒店 频道（住宿类）
function StayChannel({ title, oversea }: { title: string; oversea: boolean }) {
  const recordAction = useQunaerStore((state) => state.recordAction);
  const stay = useQunaerStore((state) => state.stay);
  const setStay = useQunaerStore((state) => state.setStay);
  const { bindTap } = useQunaerGestures();
  const [sheet, setSheet] = React.useState<null | 'city' | 'date' | 'guest'>(null);
  const items = oversea ? OVERSEA_ITEMS : HOMESTAY_ITEMS;
  const searchId = oversea ? 'oversea.channel.0.open' : 'homestay.channel.0.open';

  // 进入频道时按国内/海外初始化默认城市，同一频道内保留用户后续选择。
  React.useEffect(() => {
    if (stay.overseas !== oversea) {
      setStay({ overseas: oversea, city: oversea ? '泰国·曼谷' : '三亚·海棠湾' });
    }
  }, [oversea, stay.overseas, setStay]);

  return (
    <div className="px-3 py-3">
      <div className="h-[122px] rounded-xl bg-gradient-to-br from-[#FF9A5B] via-[#FF6E6E] to-[#F5515F] text-white p-4 relative overflow-hidden">
        <div className="text-[22px] font-bold">{title}</div>
        <div className="text-[12px] mt-2 opacity-90">
          {oversea ? '境外直连 · 中文客服 · 免费取消' : '房东实拍 · 到店无忧 · 整租独栋'}
        </div>
        <IcSparkles className="absolute right-4 bottom-2 opacity-40" size={72} />
      </div>
      <Card className="-mt-3 relative z-10 p-3">
        <button
          type="button"
          onClick={() => setSheet('city')}
          className="flex items-center text-[16px] font-semibold bg-transparent border-none p-0 cursor-pointer w-full"
        >
          <IcPin size={16} className="text-[#FF6B6B] mr-2" />
          {stay.city}
          <IcDown size={14} className="ml-1 text-[#8A9499]" />
        </button>
        <ChannelFieldRow
          onClick={() => setSheet('date')}
          icon={<IcCalendar size={16} className="text-[#FF6B6B] mr-2" />}
          label="入住/离店"
          value={`${stay.checkIn} — ${stay.checkOut}`}
          extra={`共${stay.nights}晚`}
        />
        <ChannelFieldRow
          onClick={() => setSheet('guest')}
          icon={<IcUser size={16} className="text-[#FF6B6B] mr-2" />}
          label={oversea ? '房间/住客' : '居室/住客'}
          value={`${stay.rooms}间 · ${stay.guests}人`}
        />
        {!oversea && (
          <button
            type="button"
            {...bindTap({ kind: 'action', id: 'homestay.channel.1.other' }, {
              onTrigger: () => recordAction('homestay.channel.1.other', '入住条件'),
            })}
            className="mt-3 w-full text-left text-[11px] text-[#FF6B6B] bg-transparent border-none p-0 cursor-pointer"
          >
            设置入住条件 · 可住人数/可否做饭/宠物友好 ›
          </button>
        )}
        <button
          type="button"
          {...bindTap(searchId)}
          className="mt-4 h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white flex items-center justify-center font-semibold border-none w-full cursor-pointer"
        >
          {oversea ? '搜索海外酒店' : '搜索民宿'}
        </button>
      </Card>
      <SectionTitle>{oversea ? '热门目的地酒店' : '热门民宿'}</SectionTitle>
      <div className="grid gap-2">
        {items.map((item) => (
          <ChannelItemCard key={item.title} item={item} transition={searchId} suffix={oversea ? '含税起' : '/晚'} />
        ))}
      </div>
      {sheet === 'city' && (
        <CitySheet
          title="选择目的地"
          options={oversea ? STAY_OVERSEA_CITIES : STAY_DOMESTIC_CITIES}
          value={stay.city}
          onPick={(city) => {
            setStay({ city });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'date' && (
        <StayDateSheet
          checkIn={stay.checkIn}
          nights={stay.nights}
          onApply={(patch) => {
            setStay(patch);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'guest' && (
        <StayGuestSheet
          rooms={stay.rooms}
          guests={stay.guests}
          oversea={oversea}
          onApply={(patch) => {
            setStay(patch);
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

// 去哪儿租车 频道
function CarChannel({ title }: { title: string }) {
  const { bindTap } = useQunaerGestures();
  return (
    <div className="px-3 py-3">
      <div className="h-[122px] rounded-xl bg-gradient-to-br from-[#2FB6C6] via-[#3D9BE0] to-[#4C6FF0] text-white p-4 relative overflow-hidden">
        <div className="text-[22px] font-bold">{title}</div>
        <div className="text-[12px] mt-2 opacity-90">车辆消毒 · 车损无忧 · 门店超6万家</div>
        <IcSparkles className="absolute right-4 bottom-2 opacity-40" size={72} />
      </div>
      <div className="-mt-3 relative z-10">
        <CarConfigCard />
      </div>
      <button
        type="button"
        {...bindTap('carrental.channel.0.open')}
        className="mt-3 h-11 rounded-full bg-gradient-to-r from-[#3DA0E6] to-[#4C6FF0] text-white flex items-center justify-center font-semibold border-none w-full cursor-pointer"
      >
        立即选车
      </button>
      <button
        type="button"
        {...bindTap('carrental.channel.1.open')}
        className="mt-3 w-full p-3 rounded-xl bg-white border border-[#edf0f2] text-[13px] text-left cursor-pointer flex items-center"
      >
        <IcSparkles size={15} className="text-[#3D9BE0] mr-2" />
        新手租车指南 · 证件/取还车/保障说明
        <span className="ml-auto text-[#B4BBBF]">›</span>
      </button>
      <SectionTitle>热门车型</SectionTitle>
      <div className="grid gap-2">
        {CAR_ITEMS.map((item) => (
          <ChannelItemCard key={item.title} item={item} transition="carrental.channel.0.open" suffix="/天" />
        ))}
      </div>
    </div>
  );
}

// 接送机/站 频道
function TransferChannel({ title }: { title: string }) {
  const { bindTap } = useQunaerGestures();
  const transfer = useQunaerStore((state) => state.transfer);
  const setTransfer = useQunaerStore((state) => state.setTransfer);
  const { mode, airport, flight, time } = transfer;
  const [sheet, setSheet] = React.useState<null | 'airport' | 'flight' | 'time'>(null);
  return (
    <div className="px-3 py-3">
      <div className="h-[122px] rounded-xl bg-gradient-to-br from-[#5A6BF0] via-[#6C6FF2] to-[#8A5BF0] text-white p-4 relative overflow-hidden">
        <div className="text-[22px] font-bold">{title}</div>
        <div className="text-[12px] mt-2 opacity-90">实时追踪航班 · 免费等待 · 专业司机</div>
        <IcPlane className="absolute right-4 bottom-2 opacity-40" size={64} />
      </div>
      <Card className="-mt-3 relative z-10 p-3">
        <div className="flex bg-[#F1F3F5] rounded-full p-1 mb-1">
          {(['pickup', 'dropoff'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setTransfer({ mode: m })}
              className={`flex-1 h-8 rounded-full text-[13px] border-none cursor-pointer ${
                mode === m ? 'bg-white text-[#5A6BF0] font-semibold shadow-sm' : 'bg-transparent text-[#8A9499]'
              }`}
            >
              {m === 'pickup' ? '接机' : '送机'}
            </button>
          ))}
        </div>
        <ChannelFieldRow
          onClick={() => setSheet('airport')}
          icon={<IcPin size={16} className="text-[#6C6FF2] mr-2" />}
          label={mode === 'pickup' ? '到达机场' : '目的机场'}
          value={airport}
        />
        <ChannelFieldRow
          onClick={() => setSheet('flight')}
          icon={<IcPlane size={16} className="text-[#6C6FF2] mr-2" />}
          label={mode === 'pickup' ? '航班号' : '出发地'}
          value={mode === 'pickup' ? flight : '南京市·新街口'}
        />
        <ChannelFieldRow
          onClick={() => setSheet('time')}
          icon={<IcCalendar size={16} className="text-[#6C6FF2] mr-2" />}
          label="用车时间"
          value={`7月28日 ${time}`}
          extra={mode === 'pickup' ? '落地后接' : '提前2小时'}
        />
        <button
          type="button"
          {...bindTap('transfer.channel.0.open')}
          className="mt-4 h-11 rounded-full bg-gradient-to-r from-[#5A6BF0] to-[#8A5BF0] text-white flex items-center justify-center font-semibold border-none w-full cursor-pointer"
        >
          {mode === 'pickup' ? '关联航班 · 查看接机报价' : '确认送机 · 查看报价'}
        </button>
      </Card>
      <SectionTitle>推荐车型</SectionTitle>
      <div className="grid gap-2">
        {TRANSFER_ITEMS.map((item) => (
          <ChannelItemCard key={item.title} item={item} transition="transfer.channel.0.open" suffix="起" />
        ))}
      </div>
      {sheet === 'airport' && (
        <CitySheet
          title="选择机场航站楼"
          options={TRANSFER_AIRPORTS}
          value={airport}
          onPick={(value) => {
            setTransfer({ airport: value });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'flight' && (
        <CitySheet
          title="选择航班号"
          options={TRANSFER_FLIGHTS}
          value={flight}
          onPick={(value) => {
            setTransfer({ flight: value });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'time' && (
        <CitySheet
          title="选择用车时间"
          options={CHANNEL_TIMES}
          value={time}
          onPick={(value) => {
            setTransfer({ time: value });
            setSheet(null);
          }}
          onClose={() => setSheet(null)}
        />
      )}
    </div>
  );
}

function GenericChannel({ title, nodeId }: { title: string; nodeId: string }) {
  if (nodeId.startsWith('homestay')) return <StayChannel title={title} oversea={false} />;
  if (nodeId.startsWith('oversea')) return <StayChannel title={title} oversea />;
  if (nodeId.startsWith('car')) return <CarChannel title={title} />;
  if (nodeId.startsWith('transfer')) return <TransferChannel title={title} />;
  return <VacationChannel title={title} nodeId={nodeId} />;
}

function VacationChannel({ title, nodeId }: { title: string; nodeId: string }) {
  const search = useQunaerStore((state) => state.search);
  const setVacationCity = useQunaerStore((state) => state.setVacationCity);
  const { bindTap } = useQunaerGestures();
  const isVacation = nodeId.startsWith('vacation');
  const [cityOpen, setCityOpen] = React.useState(false);
  const cityName = isVacation ? search.vacationCity : '南京';
  const searchId = isVacation ? 'vacation.channel.0.open' : 'hotel.search.2.open';

  return (
    <div className="px-3 py-3">
      <div className="h-[122px] rounded-xl bg-gradient-to-br from-[#24C9CA] via-[#42B8D8] to-[#6C91E7] text-white p-4 relative overflow-hidden">
        <div className="text-[22px] font-bold">{title}</div>
        <div className="text-[12px] mt-2 opacity-90">暑期特惠 · 平台保障 · 低价放心订</div>
        <IcSparkles className="absolute right-4 bottom-2 opacity-40" size={72} />
      </div>
      <Card className="-mt-3 relative z-10 p-3">
        {isVacation ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setCityOpen((v) => !v)}
              className="flex items-center text-[16px] font-semibold bg-transparent border-none p-0 cursor-pointer"
            >
              <IcPin size={16} className="text-[#22C7CB] mr-2" />
              {cityName}
              <IcDown size={14} className="ml-1 text-[#8A9499]" />
            </button>
            {cityOpen && (
              <div className="absolute z-20 mt-2 left-0 right-0 bg-white rounded-xl shadow-lg border border-[#edf0f2] p-2 grid grid-cols-4 gap-2">
                {VACATION_CITIES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setVacationCity(city);
                      setCityOpen(false);
                    }}
                    className={`h-8 rounded-lg text-[12px] border cursor-pointer ${
                      city === cityName
                        ? 'bg-[#E8F9F9] text-[#17B7BB] border-[#22C7CB]'
                        : 'bg-[#F5F7F8] text-[#39464B] border-transparent'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center text-[16px] font-semibold">
            <IcPin size={16} className="text-[#22C7CB] mr-2" />
            {cityName}
          </div>
        )}
        <button
          type="button"
          {...(isVacation ? bindTap('vacation.channel.1.open') : {})}
          className="mt-3 flex items-center border-t border-[#edf0f2] pt-3 bg-transparent border-x-0 border-b-0 w-full cursor-pointer text-left"
        >
          <IcCalendar size={16} className="text-[#22C7CB] mr-2" />
          <span className="text-[13px]">{isVacation ? search.departDate : '7月28日 — 7月30日'}</span>
          <span className="ml-auto text-[11px] text-[#8A9499]">{isVacation ? '出发' : '2晚'}</span>
        </button>
        <button
          type="button"
          {...bindTap(searchId)}
          className="mt-4 h-11 rounded-full bg-gradient-to-r from-[#FF9A67] to-[#FF385C] text-white flex items-center justify-center font-semibold border-none w-full cursor-pointer"
        >
          开始搜索
        </button>
      </Card>
      <SectionTitle>热门推荐</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {['world_2', 'world_3', 'world_5', 'world_6'].map((asset, index) => (
          <button
            key={asset}
            type="button"
            {...bindTap(searchId)}
            className="overflow-hidden bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer p-0"
          >
            <Img src={image(asset)} className="w-full h-[110px] object-cover" />
            <div className="p-2">
              <div className="text-[12px] font-medium">精选旅行灵感 {index + 1}</div>
              <Price value={99 + index * 80} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function PassengerEditView() {
  const addPassenger = useQunaerStore((state) => state.addPassenger);
  const editingId = useQunaerStore((state) => state.editingPassengerId);
  const editing = useQunaerStore((state) => state.passengers.find((p) => p.id === state.editingPassengerId));
  const { back } = useQunaerGestures();
  const [name, setName] = React.useState(editing?.name ?? '');
  const [idNo, setIdNo] = React.useState(editing?.idNo ?? '');
  const isEdit = Boolean(editingId && editing);
  // 编辑已有旅客时证件号已脱敏，只做展示；新增时需要用户手填。
  const valid = isEdit || (name.trim().length > 0 && idNo.trim().length >= 6);

  return (
    <div className="px-3 py-3 grid gap-3">
      <Card className="p-3 flex items-center text-[13px]">
        <span className="w-16 text-[#8A9499]">姓名</span>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="请输入证件上的姓名"
          className="flex-1 bg-transparent border-none outline-none text-[#202A2E] placeholder:text-[#B4BBBF]"
        />
      </Card>
      <Card className="p-3 flex items-center text-[13px]">
        <span className="w-16 text-[#8A9499]">证件号</span>
        <input
          value={idNo}
          onChange={(event) => setIdNo(event.target.value)}
          readOnly={isEdit}
          placeholder="请输入身份证号"
          className="flex-1 bg-transparent border-none outline-none text-[#202A2E] placeholder:text-[#B4BBBF]"
        />
      </Card>
      <div className="text-[11px] text-[#9AA3A7] px-1">
        {isEdit ? '证件信息已通过实名认证，如需修改请联系客服。' : '请填写与证件一致的信息，以免影响正常出行。'}
      </div>
      <button
        type="button"
        onClick={() => {
          if (!valid) return;
          if (!isEdit) addPassenger(name.trim(), idNo.trim());
          back();
        }}
        className={`h-11 rounded-full font-semibold border-none cursor-pointer ${
          valid ? 'bg-[#22C7CB] text-white' : 'bg-[#CFEFF0] text-white'
        }`}
      >
        {isEdit ? '完成' : '保存'}
      </button>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative transition-colors border-none cursor-pointer ${on ? 'bg-[#22C7CB]' : 'bg-[#D7DDE0]'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

function SettingRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center px-3 h-12 bg-white text-[13px] cursor-pointer border-x-0 border-t-0 border-b border-[#f2f4f5] last:border-b-0 text-left"
    >
      <span>{label}</span>
      <span className="ml-auto text-[#9AA3A7] text-[12px]">{value}</span>
      <span className="ml-1 text-[#C2C9CD]">›</span>
    </button>
  );
}

// 设置页：分组开关 + 各功能项弹层说明 + 退出登录，均可交互。
function SettingsPage() {
  const session = useQunaerStore((state) => state.session);
  const { bindTap } = useQunaerGestures();
  const [tripSync, setTripSync] = React.useState(true);
  const [push, setPush] = React.useState(true);
  const [reco, setReco] = React.useState(true);
  const [dnd, setDnd] = React.useState(false);
  const [lang, setLang] = React.useState('简体中文');
  const [sheet, setSheet] = React.useState<string | null>(null);
  const SHEET_TEXT: Record<string, string> = {
    实名认证: '当前状态：已实名（骆**）。实名后可购买火车票、部分景点门票及机票，信息全程加密。',
    账号安全: '登录密码：已设置｜手机绑定：138****6666｜微信/支付宝：已关联。建议定期修改密码并开启登录保护。',
    账号关联: '已关联：微信、支付宝、Apple ID。关联后可一键登录并同步会员权益。',
    支付设置: '免密支付：小额免密已开启（≤¥200）｜优先支付方式：支付宝｜已绑定 2 张银行卡。',
    登录设备管理: '当前设备：iPhone（本机）｜近期登录：iPad、Chrome。可远程退出可疑设备。',
    隐私政策: '我们仅在提供服务所必需的范围内收集信息，你可在「系统权限」中管理定位、相册、通讯录授权，并可随时申请注销账号。',
    系统权限: '定位：使用期间｜相册：已允许｜通知：已允许｜通讯录：未授权。点击可前往系统设置调整。',
    关于去哪儿: '去哪儿旅行 v12.6.8｜隐私政策｜用户协议｜第三方信息共享清单｜个人信息收集清单。',
  };
  return (
    <div className="pb-6">
      <div className="bg-white flex items-center px-4 py-4 border-b border-[#f2f4f5]">
        <Img src={session.avatar} className="w-14 h-14 rounded-full object-cover" />
        <div className="ml-3">
          <div className="text-[16px] font-semibold">{session.name}</div>
          <div className="text-[11px] text-[#8A9499] mt-1">138****6666</div>
        </div>
        <button type="button" onClick={() => setSheet('账号安全')} className="ml-auto text-[12px] text-[#22BFC3] bg-transparent border-none cursor-pointer">修改资料</button>
      </div>

      <div className="mt-2 rounded-xl overflow-hidden mx-3 border border-[#f2f4f5]">
        <SettingRow label="实名认证" value="已实名" onClick={() => setSheet('实名认证')} />
        <SettingRow label="账号安全" onClick={() => setSheet('账号安全')} />
        <SettingRow label="账号关联" value="微信/支付宝" onClick={() => setSheet('账号关联')} />
        <SettingRow label="支付设置" onClick={() => setSheet('支付设置')} />
        <SettingRow label="登录设备管理" onClick={() => setSheet('登录设备管理')} />
      </div>

      <div className="mt-3 rounded-xl overflow-hidden mx-3 border border-[#f2f4f5]">
        {[
          ['行程同步到日历', tripSync, setTripSync] as const,
          ['接收推送通知', push, setPush] as const,
          ['个性化推荐', reco, setReco] as const,
          ['夜间免打扰', dnd, setDnd] as const,
        ].map(([label, val, setter]) => (
          <div key={label} className="flex items-center px-3 h-12 bg-white text-[13px] border-b border-[#f2f4f5] last:border-b-0">
            <span>{label}</span>
            <span className="ml-auto"><Toggle on={val} onChange={setter} /></span>
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl overflow-hidden mx-3 border border-[#f2f4f5]">
        <SettingRow label="多语言 Language" value={lang} onClick={() => setLang((l) => (l === '简体中文' ? 'English' : l === 'English' ? '繁體中文' : '简体中文'))} />
        <SettingRow label="清除缓存" value="42.6 MB" onClick={() => setSheet('清除缓存')} />
        <SettingRow label="系统权限" onClick={() => setSheet('系统权限')} />
        <SettingRow label="隐私政策" onClick={() => setSheet('隐私政策')} />
        <SettingRow label="关于去哪儿" value="v12.6.8" onClick={() => setSheet('关于去哪儿')} />
      </div>

      <div className="px-3 mt-4">
        <button
          type="button"
          {...bindTap('mine.settings.0.open')}
          className="w-full h-11 rounded-full bg-white border border-[#FF5B2D] text-[#FF5B2D] font-semibold cursor-pointer"
        >
          退出登录
        </button>
      </div>

      {sheet && (
        <ChannelSheet title={sheet} onClose={() => setSheet(null)}>
          <div className="text-[13px] leading-7 text-[#465359]">
            {sheet === '清除缓存' ? '缓存已清除，共释放 42.6 MB 空间。' : SHEET_TEXT[sheet]}
          </div>
          <button type="button" onClick={() => setSheet(null)} className="mt-4 w-full h-10 rounded-full bg-[#22C7CB] text-white border-none cursor-pointer">我知道了</button>
        </ChannelSheet>
      )}
    </div>
  );
}

// 优惠券页：橙红头图 + 分类 tab + 券卡列表（数量与我的页一致）。
function CouponsPage() {
  const [tab, setTab] = React.useState<string>('全部');
  const list = QUNAER_COUPONS.filter((c) => tab === '全部' || c.cat === tab);
  return (
    <div className="pb-6">
      <div className="bg-gradient-to-r from-[#FF3D7A] to-[#FF6B4A] text-white px-4 py-5">
        <div className="text-[20px] font-extrabold">代金券：共 {QUNAER_COUPONS.length} 张</div>
        <div className="text-[12px] opacity-90 mt-1">最高可省 503 元 · 天天领神券</div>
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {['租车 9.5折', '接送机立减15', '酒店满300减30'].map((t) => (
            <span key={t} className="shrink-0 bg-white/20 rounded-full px-3 py-1 text-[11px]">{t} 立即抢</span>
          ))}
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto px-3 py-3">
        {COUPON_TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className="bg-transparent border-none p-0 cursor-pointer">
            <StaticChip active={tab === t}>{t}</StaticChip>
          </button>
        ))}
      </div>
      <div className="px-3 grid gap-2">
        {list.map((c) => (
          <div key={c.name} className="flex bg-white rounded-xl overflow-hidden border border-[#f4e3e3]">
            <div className="w-[92px] bg-gradient-to-br from-[#FF6B6B] to-[#FF3D5A] text-white flex flex-col items-center justify-center shrink-0">
              <div className="text-[22px] font-extrabold leading-none">{c.face}</div>
              <div className="text-[10px] mt-1 opacity-90">{c.cat}</div>
            </div>
            <div className="flex-1 min-w-0 p-3">
              <div className="flex items-center">
                <div className="text-[13px] font-semibold truncate">{c.name}</div>
                {c.tag && <span className="ml-2 shrink-0 text-[9px] text-[#FF5B2D] bg-[#FFF0EC] rounded px-1 py-0.5">{c.tag}</span>}
              </div>
              <div className="text-[10px] text-[#8A9499] mt-1">{c.rule}</div>
              <div className="text-[10px] text-[#B4BBBF] mt-1">{c.expire}</div>
            </div>
            <button type="button" className="self-center mr-3 shrink-0 rounded-full bg-[#FF5B2D] text-white text-[11px] px-4 py-1.5 border-none cursor-pointer">
              使用
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// 收藏页：收藏 / 降价提醒 / 足迹 三 tab；收藏展示用户收藏的攻略笔记。
function FavoritesPage() {
  const collectedWorld = useQunaerStore((state) => state.collectedWorld);
  const world = useQunaerStore((state) => state.world);
  const currentWorld = useQunaerStore((state) => state.setCurrentWorld);
  const { bindTap } = useQunaerGestures();
  const [tab, setTab] = React.useState<'收藏' | '降价提醒' | '足迹'>('收藏');
  const collected = world.filter((w) => collectedWorld.includes(w.id));
  const footprints = world.slice(0, 3);
  return (
    <div className="pb-6">
      <div className="flex gap-5 text-[14px] px-4 py-3 border-b border-[#f0f2f3]">
        {(['收藏', '降价提醒', '足迹'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`bg-transparent border-none cursor-pointer pb-1 ${tab === t ? 'text-[#22BFC3] border-b-2 border-[#22C7CB] font-semibold' : 'text-[#8A9499]'}`}
          >
            {t}{t === '降价提醒' && <span className="ml-0.5 text-[9px] text-[#FF5B2D]">新</span>}
          </button>
        ))}
      </div>
      {tab === '收藏' && (
        collected.length === 0 ? (
          <div className="px-3 py-16 text-center text-[13px] text-[#8A9499]">
            这里还没有收藏，去「南京攻略」看看吧~
          </div>
        ) : (
          <div className="px-3 py-3 grid gap-2">
            {collected.map((note) => (
              <button
                key={note.id}
                type="button"
                {...bindTap('world.main.2.open', { beforeTrigger: () => currentWorld(note.id) })}
                className="p-2 flex gap-2.5 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer"
              >
                <Img src={note.image} className="w-[104px] h-[80px] rounded-lg object-cover shrink-0" alt={note.title} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold line-clamp-2">{note.title}</div>
                  <div className="text-[10px] text-[#22808A] bg-[#E7F8F9] rounded px-1.5 py-0.5 mt-1 inline-block">{note.city}攻略</div>
                  <div className="text-[10px] text-[#8A9499] mt-1">{note.author} · {note.likes}人推荐</div>
                </div>
              </button>
            ))}
          </div>
        )
      )}
      {tab === '降价提醒' && (
        <div className="px-3 py-3 grid gap-2">
          {[['汉庭酒店(烟台火车站店)', 398, 368], ['广州 → 长沙 CZ3308', 360, 318]].map(([name, was, now]) => (
            <Card key={name as string} className="p-3 flex items-center">
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{name}</div>
                <div className="text-[10px] text-[#8A9499] mt-1">已降 ¥{(was as number) - (now as number)}，可蹲更低价</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#B4BBBF] line-through block">¥{was}</span>
                <Price value={now as number} />
              </div>
            </Card>
          ))}
        </div>
      )}
      {tab === '足迹' && (
        <div className="px-3 py-3 grid gap-2">
          <div className="text-[11px] text-[#8A9499] px-1">最近浏览</div>
          {footprints.map((note) => (
            <Card key={note.id} className="p-2 flex gap-2.5">
              <Img src={note.image} className="w-[92px] h-[70px] rounded-lg object-cover shrink-0" alt={note.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold line-clamp-2">{note.title}</div>
                <div className="text-[10px] text-[#8A9499] mt-1">{note.city} · 浏览于今天</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// 租车新手指南：证件/收费/取还车/保险等分区，底部「去租车」回到租车首页。
const CAR_GUIDE_SECTIONS: [string, string, string[]][] = [
  ['如何预订', '#22C7CB', ['选择取车城市/门店与取还时间', '挑选心仪车型并核对押金与套餐', '在线支付确认，凭订单到店取车']],
  ['租车证件', '#3D9BE0', ['本人二代身份证（港澳台/外籍用护照）', '本人有效期内的驾驶证正本', '一张可预授权的信用卡（车行押金）']],
  ['如何收费', '#FF8A34', ['按「日租金 × 租期天数」计费，跨天不足一天按一天算', '异地还车会收取一定的异地服务费', '超时取车/还车按小时加收，请预留缓冲']],
  ['保险选择', '#7C5BF0', ['基础保障已含车损/三者险', '可加购「尊享无忧」免赔额降为 0', '如遇事故先报警并联系门店客服']],
  ['如何取车', '#22B07D', ['到店出示身份证、驾驶证与订单', '与门店一起验车拍照留证', '确认油量/电量与随车工具']],
  ['如何还车', '#E0574A', ['按约定时间返回门店或指定还车点', '加满油/充好电，避免额外费用', '与门店验车无误后解除押金']],
];

function CarGuidePage() {
  const { bindTap } = useQunaerGestures();
  return (
    <div className="pb-24">
      <div className="bg-gradient-to-br from-[#2FB6C6] via-[#3D9BE0] to-[#4C6FF0] text-white px-4 py-6">
        <div className="text-[22px] font-extrabold">国内租车 · 新手指南</div>
        <div className="text-[12px] opacity-90 mt-2">证件准备 · 取还车流程 · 收费与保险，一次讲清</div>
      </div>
      <div className="px-3 py-3 grid gap-2">
        <Card className="p-3 flex items-center bg-[#EAF6FF]">
          <IcCar size={18} className="text-[#3D9BE0] mr-2" />
          <div className="text-[12px] text-[#2A5B84]">出行前请备好「两证一卡」：身份证 + 驾驶证 + 信用卡</div>
        </Card>
        {CAR_GUIDE_SECTIONS.map(([title, color, points], index) => (
          <Card key={title} className="p-3">
            <div className="flex items-center">
              <span className="w-6 h-6 rounded-full text-white text-[12px] flex items-center justify-center" style={{ background: color }}>
                {index + 1}
              </span>
              <div className="ml-2 text-[15px] font-semibold">{title}</div>
            </div>
            <ul className="mt-2 pl-1 grid gap-1.5">
              {points.map((p) => (
                <li key={p} className="text-[12px] text-[#59666C] flex gap-2 leading-relaxed">
                  <span className="text-[#22C7CB] mt-1.5 w-1 h-1 rounded-full bg-[#22C7CB] shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <div className="fixed left-0 right-0 bottom-0 max-w-[440px] mx-auto bg-white border-t border-[#eef1f2] px-4 py-2.5">
        <button
          type="button"
          {...bindTap('carrental.guide.0.open')}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#3DA0E6] to-[#4C6FF0] text-white font-semibold border-none cursor-pointer"
        >
          去租车
        </button>
      </div>
    </div>
  );
}

// 接送机关联航班后：填写/选择下车点，按里程给出不同价格，写入 store 供报价页计价。
const TRANSFER_DROP_PRESETS: [string, number][] = [
  ['新街口 · 市中心', 12],
  ['南京南站', 18],
  ['河西 · 江东中路', 22],
  ['仙林大学城', 35],
  ['江宁 · 万达广场', 28],
  ['汤山温泉度假区', 46],
];

function TransferFlightLinkPage() {
  const transfer = useQunaerStore((state) => state.transfer);
  const setTransfer = useQunaerStore((state) => state.setTransfer);
  const { bindTap } = useQunaerGestures();
  const [drop, setDrop] = React.useState(transfer.drop);
  const [km, setKm] = React.useState(transfer.distanceKm);
  const matched = TRANSFER_DROP_PRESETS.find(([name]) => name === drop);
  const distance = matched ? matched[1] : km;
  const price = 39 + Math.round(distance * 3.6);
  const canNext = drop.trim().length > 0;
  return (
    <div className="px-3 py-3 grid gap-2">
      <Card className="p-3">
        <div className="text-[11px] text-[#8A9499]">已关联航班</div>
        <div className="text-[15px] font-semibold mt-1">{transfer.flight} · 落地 {transfer.airport}</div>
        <div className="text-[11px] text-[#22BFC3] mt-1">航班实时追踪 · 免费等待 60 分钟</div>
      </Card>
      <Card className="p-3">
        <div className="text-[13px] font-semibold mb-2">请填写下车点</div>
        <input
          value={drop}
          onChange={(e) => {
            setDrop(e.target.value);
            const hit = TRANSFER_DROP_PRESETS.find(([name]) => name === e.target.value.trim());
            setKm(hit ? hit[1] : Math.max(8, e.target.value.trim().length * 3));
          }}
          placeholder="输入详细下车地址，如「新街口德基广场」"
          className="w-full h-10 rounded-lg bg-[#F2F5F6] px-3 text-[13px] text-[#202A2E] placeholder:text-[#9AA3A7] border-none outline-none"
        />
        <div className="text-[11px] text-[#8A9499] mt-2">常用下车点</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {TRANSFER_DROP_PRESETS.map(([name, d]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setDrop(name);
                setKm(d);
              }}
              className={`h-8 px-3 rounded-full text-[12px] border cursor-pointer ${
                drop === name ? 'bg-[#EEF0FF] text-[#5A6BF0] border-[#8A5BF0]' : 'bg-[#F5F7F8] text-[#39464B] border-transparent'
              }`}
            >
              {name} · {d}km
            </button>
          ))}
        </div>
      </Card>
      {canNext && (
        <Card className="p-3 flex items-end">
          <div>
            <div className="text-[11px] text-[#8A9499]">预估里程 {distance} 公里</div>
            <div className="text-[10px] text-[#8A9499] mt-0.5">起步 ¥39 + 里程费</div>
            <Price value={price} />
          </div>
          <span className="ml-auto text-[11px] text-[#8A9499]">下一步查看车型报价 →</span>
        </Card>
      )}
      <button
        type="button"
        {...bindTap('transfer.flightlink.0.open', {
          beforeTrigger: () => setTransfer({ drop, distanceKm: distance }),
        })}
        disabled={!canNext}
        className={`h-11 rounded-full text-white border-none ${canNext ? 'bg-[#FF5B2D] cursor-pointer' : 'bg-[#F0B7A6] cursor-not-allowed'}`}
      >
        选定下车点 · 查看接送报价
      </button>
    </div>
  );
}

function SettingsAndMisc({ nodeId }: { nodeId: string }) {
  const passengers = useQunaerStore((state) => state.passengers);
  const recordAction = useQunaerStore((state) => state.recordAction);
  const setEditingPassenger = useQunaerStore((state) => state.setEditingPassenger);
  const { bindTap } = useQunaerGestures();

  if (nodeId === 'mine.settings') {
    return <SettingsPage />;
  }

  if (nodeId === 'mine.passengers') {
    return (
      <div className="px-3 py-3 grid gap-2">
        <div className="text-[11px] text-[#8A9499] px-1">点击旅客可查看/编辑证件信息，用于下单时快速选择。</div>
        {passengers.map((person) => (
          <button
            key={person.id}
            type="button"
            {...bindTap('mine.passengers.0.open', { beforeTrigger: () => setEditingPassenger(person.id) })}
            className="p-3 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer flex items-center"
          >
            <div className="flex-1">
              <div className="text-[14px] font-medium">
                {person.name}
                <span className="ml-2 text-[10px] text-[#22BFC3] bg-[#E8F9F9] rounded px-1 py-0.5">{person.type}</span>
              </div>
              <div className="text-[11px] text-[#8A9499] mt-1">{person.idNo}</div>
            </div>
            <IcRight size={16} className="text-[#C2C9CD]" />
          </button>
        ))}
        <button
          type="button"
          {...bindTap('mine.passengers.0.open', { beforeTrigger: () => setEditingPassenger(null) })}
          className="h-11 rounded-full border border-[#22C7CB] text-[#22C7CB] cursor-pointer bg-white"
        >
          ＋ 新增旅客
        </button>
      </div>
    );
  }

  if (nodeId === 'mine.passenger.edit') {
    return <PassengerEditView />;
  }

  if (nodeId === 'mine.coupons') {
    return <CouponsPage />;
  }

  if (nodeId === 'mine.favorites') {
    return <FavoritesPage />;
  }

  if (nodeId === 'home.search.sug') {
    return (
      <div className="px-3 py-3 grid gap-2">
        {['烟台', '烟台蓬莱国际机场', '烟台山景区'].map((text) => (
          <button
            key={text}
            type="button"
            {...bindTap('home.search.sug.0.open')}
            className="p-3 bg-white rounded-xl border border-[#edf0f2] text-left text-[13px] cursor-pointer"
          >
            {text}
          </button>
        ))}
      </div>
    );
  }

  if (nodeId === 'home.search.results') {
    return (
      <div className="px-3 py-3">
        <div className="flex gap-3 text-[13px] mb-3">
          {['综合', '酒店', '门票', '跟团游', '一日游'].map((tab, index) => (
            <button
              key={tab}
              type="button"
              {...(index === 3
                ? bindTap('home.search.results.2.open')
                : index === 4
                  ? bindTap({ kind: 'action', id: 'home.search.results.3.other' }, {
                      onTrigger: () => recordAction('home.search.results.3.other', '一日游 tab'),
                    })
                  : bindTap({ kind: 'action', id: 'home.search.results.0.other' }, {
                      onTrigger: () => recordAction('home.search.results.0.other', 'tab 切换'),
                    }))}
              className={`bg-transparent border-none cursor-pointer pb-1 ${
                index === 2 ? 'text-[#22BFC3] border-b-2 border-[#22C7CB]' : 'text-[#667177]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <button
          type="button"
          {...bindTap('home.search.results.1.open')}
          className="w-full p-3 bg-white rounded-xl border border-[#edf0f2] text-left cursor-pointer"
        >
          <div className="text-[14px] font-semibold">南京欢乐谷</div>
          <div className="text-[11px] text-[#8A9499] mt-1">门票 · 今日可订</div>
        </button>
      </div>
    );
  }

  if (nodeId === 'carrental.guide') {
    return <CarGuidePage />;
  }

  if (nodeId === 'transfer.flightlink') {
    return <TransferFlightLinkPage />;
  }

  return <GenericChannel title={ROUTE_CATALOG[nodeId]?.title ?? '频道'} nodeId={nodeId} />;
}

export default function ExperiencePage({ nodeId }: { nodeId: string }) {
  const item = ROUTE_CATALOG[nodeId];
  const isMain = ['home.main', 'trip.main', 'support.main', 'world.main', 'mine.main'].includes(nodeId);
  const customChrome = nodeId === 'hotel.list' || nodeId === 'hotel.detail';
  let content: React.ReactNode;

  if (nodeId === 'home.main') content = <HomeContent />;
  else if (nodeId === 'home.search.landing') content = <SearchLanding />;
  else if (nodeId === 'flight.calendar' || nodeId === 'hotel.calendar') content = <CalendarView nodeId={nodeId} />;
  else if (nodeId.includes('picker') || nodeId === 'train.passenger.pick') content = <PickerView nodeId={nodeId} />;
  else if (nodeId === 'flight.search' || nodeId === 'hotel.search' || nodeId === 'train.search') {
    content = <SearchForm nodeId={nodeId} />;
  } else if (nodeId === 'pay.cashier') content = <PayView success={false} />;
  else if (nodeId === 'pay.success') content = <PayView success />;
  else if (
    nodeId === 'trip.main' ||
    nodeId === 'orders.center' ||
    nodeId.startsWith('orders.detail') ||
    nodeId === 'flight.order.detail'
  ) {
    content = <OrdersView nodeId={nodeId} />;
  } else if (nodeId === 'mine.main') content = <MineView />;
  else if (nodeId === 'auth.login') content = <MineView login />;
  else if (nodeId.startsWith('support')) content = <SupportView nodeId={nodeId} />;
  else if (nodeId.startsWith('world')) content = <WorldView nodeId={nodeId} />;
  else if (item?.kind === 'booking') content = <BookingView nodeId={nodeId} />;
  else if (nodeId === 'hotel.detail') content = <HotelDetail />;
  else if (nodeId === 'carrental.guide') content = <SettingsAndMisc nodeId={nodeId} />;
  else if (item?.kind === 'detail' || nodeId === 'flight.cabins' || nodeId === 'train.detail') {
    content = <DetailView nodeId={nodeId} title={item?.title ?? '详情'} />;
  } else if (item?.kind === 'list' || nodeId === 'ticket.channel' || nodeId.includes('carlist')) {
    content = <GenericList nodeId={nodeId} />;
  } else if (
    nodeId.startsWith('mine.') ||
    nodeId.startsWith('home.search.') ||
    nodeId === 'carrental.guide' ||
    nodeId === 'transfer.flightlink'
  ) {
    content = <SettingsAndMisc nodeId={nodeId} />;
  } else content = <GenericChannel title={item?.title ?? '频道'} nodeId={nodeId} />;

  return (
    <div className="h-full flex flex-col bg-[#F3F6F7] text-[#202A2E]" data-status-bar-foreground="dark">
      {!isMain && !customChrome && <TopBar title={item?.title ?? ''} />}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {content}
        <Feedback />
      </div>
    </div>
  );
}
