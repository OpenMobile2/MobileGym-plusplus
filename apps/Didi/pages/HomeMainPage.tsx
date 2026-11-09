import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import { DidiGoogleMap, type DidiGeoMarker } from '../components/DidiGoogleMap';
import {
  IcSearch, IcLocate, IcMic, IcReserve, IcUsers, IcPlane,
  IcServiceRide, IcServiceHitch, IcServiceDriver, IcServiceDelivery, IcServiceMore,
  IcServiceBike, IcServicePool, IcServiceExpress, IcServiceTransit, IcServiceFuel,
} from '../res/icons';
import { useDidiStrings } from '../hooks/useDidiStrings';
import type { LucideIcon } from 'lucide-react';
import {
  distanceBetweenMapPoints,
  getMapPlace,
  getNearbyPlaces,
  getPickupPointLatLng,
  getPickupPoints,
  getPlaceLatLng,
} from '../data/mapPlaces';

type HomeMapCandidate = DidiGeoMarker & {
  placeId: string;
  pickupId: string;
};

/** 首页·出行 —— 证据 s01,s02,s03,s04,frames/recA_home.jpg */
export default function HomeMainPage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const pickupPoint = useDidiStore((s) => s.pickupPoint);
  const mapAnchorId = useDidiStore((s) => s.mapAnchorId);
  const homeCouponsClaimed = useDidiStore((state) =>
    state.coupons.some((coupon) => coupon.id === 'cp_home_ride_bundle'),
  );
  const claimHomeCoupons = useDidiStore((state) => state.claimHomeCoupons);
  const setMapPickerSource = useDidiStore((state) => state.setMapPickerSource);
  const setMapPickerMode = useDidiStore((state) => state.setMapPickerMode);
  const setPlaceSearchTarget = useDidiStore((state) => state.setPlaceSearchTarget);
  const setReserveTab = useDidiStore((state) => state.setReserveTab);
  const selectPickupCandidate = useDidiStore((state) => state.selectPickupCandidate);
  const s = useDidiStrings();
  const mapAnchor = getMapPlace(mapAnchorId);
  const mapAnchorPosition = getPlaceLatLng(mapAnchor);
  const initialMapAnchor = React.useRef(mapAnchor);
  const [homeMapCenter, setHomeMapCenter] = React.useState(mapAnchorPosition);
  const [homeMapRecenterToken, setHomeMapRecenterToken] = React.useState(0);
  const [mapMoving, setMapMoving] = React.useState(false);
  const activePickup = getPickupPoints(mapAnchor).find((point) => point.name === pickupPoint)
    ?? getPickupPoints(mapAnchor)[0];
  const homeMapCandidates = React.useMemo<HomeMapCandidate[]>(() => (
    getNearbyPlaces(mapAnchor, 7).flatMap((place) => {
      const points = getPickupPoints(place);
      const visiblePoints = place.id === mapAnchor.id ? points : points.slice(0, 1);
      return visiblePoints.map((point) => ({
        id: `${place.id}:${point.id}`,
        placeId: place.id,
        pickupId: point.id,
        label: point.name,
        detail: point.detail,
        position: getPickupPointLatLng(place, point),
        recommended: point.official,
      }));
    })
  ), [mapAnchor]);
  const selectedHomeMarkerId = `${mapAnchor.id}:${activePickup.id}`;

  const tripActive = trip.phase === 'driver' || trip.phase === 'ongoing';
  const destinationSearchBind = bindTap('dest.search.open', {
    beforeTrigger: () => setPlaceSearchTarget('destination', false),
  });
  const pickupPickerBind = bindTap('pickup.confirm.fromHome', {
    beforeTrigger: () => {
      setMapPickerSource('home');
      setMapPickerMode('pickup');
    },
  });
  const resumeTripBind = trip.phase === 'ongoing'
    ? bindTap('trip.resume.ongoing')
    : bindTap('trip.resume');

  const pickHomeMapCandidate = React.useCallback((markerId: string) => {
    const candidate = homeMapCandidates.find((item) => item.id === markerId);
    if (!candidate) return;
    selectPickupCandidate(candidate.placeId, candidate.pickupId);
  }, [homeMapCandidates, selectPickupCandidate]);

  const settleHomeMap = React.useCallback((center: { lat: number; lng: number }) => {
    const nearest = [...homeMapCandidates].sort((left, right) => (
      distanceBetweenMapPoints(left.position, center)
      - distanceBetweenMapPoints(right.position, center)
    ))[0];
    if (nearest) pickHomeMapCandidate(nearest.id);
  }, [homeMapCandidates, pickHomeMapCandidate]);

  const recenterHomeMap = () => {
    const anchor = initialMapAnchor.current;
    const officialPoint = getPickupPoints(anchor)[0];
    setHomeMapCenter(getPlaceLatLng(anchor));
    setHomeMapRecenterToken((value) => value + 1);
    selectPickupCandidate(anchor.id, officialPoint.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-app-bg">
      {/* ① 顶部大类 tab 行 */}
      <div className="flex items-center px-4 pt-1 pb-1.5 shrink-0 bg-app-surface">
        <div className="flex items-end gap-6 flex-1">
          <div className="relative pb-1">
            <span className="text-[19px] font-bold" style={{ color: C.orangeDeep }}>{s.categoryTravel}</span>
            <span
              className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-full"
              style={{ width: 22, height: 3, background: C.orangeDeep }}
            />
          </div>
          <button
            {...bindTap('delivery.home.open')}
            className="text-[17px] text-app-text bg-transparent border-none p-0 pb-1"
          >
            {s.categoryDelivery}
          </button>
          <button
            {...bindTap('travel.home.open')}
            className="text-[17px] text-app-text bg-transparent border-none p-0 pb-1"
          >
            {s.categoryJourney}
          </button>
          <button
            {...bindTap('owner.home.open')}
            className="text-[17px] text-app-text bg-transparent border-none p-0 pb-1"
          >
            {s.categoryOwner}
          </button>
        </div>
        <button
          onClick={() => toast('扫码服务暂未开放')}
          className="bg-transparent border-none p-1 text-app-text"
          aria-label="扫码"
        >
          {/* 扫码图标 */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3" />
            <path d="M4 12h16" />
          </svg>
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* ② recH 27–44s: 起点确定后可直接操纵的共享离线 Google 地图 */}
        <div
          className="relative h-[430px] overflow-hidden"
          data-action="home.map.pan"
          data-testid="didi-home-map"
        >
          <DidiGoogleMap
            height={430}
            center={homeMapCenter}
            initialZoom={17}
            markers={homeMapCandidates}
            selectedMarkerId={selectedHomeMarkerId}
            markerColor={C.green}
            interactive
            showSelectionLabel
            recenterToken={homeMapRecenterToken}
            onMarkerSelect={pickHomeMapCandidate}
            onInteractionStateChange={setMapMoving}
            onViewportSettled={settleHomeMap}
          />
          <div className="pointer-events-none absolute left-3 top-3 z-[4]">
            <div className="bg-white rounded-full shadow px-3 py-1 text-[13px] font-medium text-app-text">
              北京 ›
            </div>
          </div>
          <button
            onClick={() => toast('乘车码暂未开放')}
            className="absolute right-3 top-3 z-[4] bg-white rounded-lg shadow px-2 py-1 border-none flex flex-col items-center"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM19 19h2v2h-2z" />
            </svg>
            <span className="text-[10px] text-app-text mt-0.5">乘车码</span>
          </button>
          <button
            {...bindTap(
              { kind: 'action', id: 'home.map.locate' },
              { onTrigger: recenterHomeMap },
            )}
            className="absolute bottom-3 right-3 z-[4] flex h-10 w-10 items-center justify-center rounded-full border-none bg-white text-app-text shadow"
            aria-label="回到当前上车区域"
          >
            <IcLocate size={16} color={C.blue} />
          </button>
        </div>

        <div className="px-3 -mt-6 relative z-[3] flex flex-col gap-2.5 pb-4">
          {/* ③ 一起5折横条 */}
          <div
            className="flex items-center rounded-t-xl px-3 py-2"
            style={{ background: 'linear-gradient(90deg,#FFF0E3,#FFE0D2)' }}
          >
            <span className="text-[13px] font-bold mr-1.5" style={{ color: C.orangeDeep }}>🎉 一起5折</span>
            <span className="text-[13px] text-app-text flex-1" aria-live="polite">
              {homeCouponsClaimed ? (
                <>3张<span style={{ color: C.red }}>5折</span>打车券已到账</>
              ) : (
                <>打一次车,得多张<span style={{ color: C.red }}>5折</span>券</>
              )}
            </span>
            <button
              {...bindTap(
                { kind: 'action', id: 'home.coupon.claim' },
                { onTrigger: () => claimHomeCoupons() },
              )}
              disabled={homeCouponsClaimed}
              className="text-[12px] text-white rounded-full px-3 py-1 border-none"
              style={{ background: homeCouponsClaimed ? '#B8A69E' : C.orange }}
            >
              {homeCouponsClaimed ? '已领取' : '收下'}
            </button>
          </div>

          {/* ④ 进行中行程条 */}
          {tripActive && (
            <button
              {...resumeTripBind}
              className="flex items-center w-full rounded-xl px-3 py-2.5 border-none text-left"
              style={{ background: '#E7F8F1' }}
            >
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
              <span className="flex-1 text-[13px]" style={{ color: C.green }}>
                {trip.phase === 'driver' ? '司机正在赶来·点击查看' : '行程进行中·点击查看'}
              </span>
              <span className="text-[13px]" style={{ color: C.green }}>›</span>
            </button>
          )}

          {/* ⑤ 叫车白卡 */}
          <div className="bg-app-surface rounded-xl shadow-sm px-3 pt-3 pb-2.5">
            <button
              {...pickupPickerBind}
              className="mb-2.5 flex w-full items-center border-none bg-transparent p-0 text-left"
              aria-label="打开上车点候选列表"
            >
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
              <span className="text-[14px] text-app-text truncate">
                {mapMoving ? (
                  '正在获取上车地点…'
                ) : (
                  <>从 <span className="font-medium" style={{ color: C.green }}>{pickupPoint}</span> 上车</>
                )}
              </span>
              <span className="ml-auto pl-2 text-[16px] text-app-text-muted">›</span>
            </button>
            <button
              {...destinationSearchBind}
              className="flex items-center w-full rounded-full px-4 py-3 border-2 text-left bg-app-surface"
              style={{ borderColor: C.orange }}
            >
              <IcSearch size={20} className="text-app-text mr-2" />
              <span className="text-[19px] font-bold text-app-text">{s.enterDestination}</span>
            </button>
            <div className="flex items-center mt-2.5 text-[13px]">
              <button
                onClick={() => toast('该功能暂未开放')}
                className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none p-1"
                style={{ color: '#7B5CFA' }}
              >
                <IcMic size={14} />
                <span className="font-medium">{s.aiRide}</span>
              </button>
              <span className="w-px h-3.5 bg-app-border" />
              <button
                {...bindTap('reserve.home.open')}
                className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none p-1 text-app-text"
              >
                <IcReserve size={14} />
                {s.reserve}
              </button>
              <span className="w-px h-3.5 bg-app-border" />
              <button
                onClick={() => toast('该功能暂未开放')}
                className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none p-1 text-app-text"
              >
                <IcUsers size={14} />
                {s.rideForOthers}
              </button>
              <span className="w-px h-3.5 bg-app-border" />
              <button
                {...bindTap('reserve.airport.open', { beforeTrigger: () => setReserveTab('airport') })}
                className="flex-1 flex items-center justify-center gap-1 bg-transparent border-none p-1 text-app-text"
              >
                <IcPlane size={14} />
                {s.airportTransfer}
              </button>
            </div>
          </div>

          {/* ⑥ 金刚区：可走通入口 + 少量暂未开放（正式图标，无 Emoji） */}
          <div className="bg-app-surface rounded-xl px-2 py-3 grid grid-cols-5 gap-y-4">
            <GridItem Icon={IcServiceRide} color="#FF7A45" label={s.serviceRide} bind={destinationSearchBind} />
            <GridItem Icon={IcServiceHitch} color="#2BB0ED" label={s.serviceHitch} bind={bindTap('hitch.home.open')} />
            <GridItem Icon={IcServiceDriver} color="#5B8DEF" label={s.serviceDriver} bind={bindTap('driver.home.open')} />
            <GridItem Icon={IcServiceDelivery} color="#F5A623" label="送货" bind={bindTap('delivery.home.open')} />
            <GridItem Icon={IcServiceMore} color="#8B93A7" label={s.serviceMore} bind={bindTap('services.all.open')} />
            <GridStub Icon={IcServiceBike} color="#13B879" label="青桔骑行" />
            <GridStub Icon={IcServicePool} color="#FF9A6B" label="特价拼车" />
            <GridStub Icon={IcServiceExpress} color="#7C6AF2" label="快送跑腿" />
            <GridStub Icon={IcServiceTransit} color="#4A90D9" label="公交地铁" />
            <GridStub Icon={IcServiceFuel} color="#36B37E" label="加油充电" />
          </div>

          {/* ⑦ 活动 banner + 推荐 */}
          <button
            onClick={() => toast('该功能暂未开放')}
            className="w-full rounded-xl border-none px-4 py-4 flex items-center justify-between text-left"
            style={{ background: 'linear-gradient(90deg,#FFE9D9,#FFD8C2)' }}
          >
            <div>
              <div className="text-[16px] font-bold" style={{ color: C.orangeDeep }}>王安宇亲签好礼</div>
              <div className="text-[11px] text-app-text-muted mt-0.5">留言夺冠中!!</div>
            </div>
            <span
              className="text-[13px] text-white rounded-full px-3.5 py-1.5"
              style={{ background: C.orangeDeep }}
            >
              抽
            </span>
          </button>

          <div className="bg-app-surface rounded-xl px-3 py-3">
            <div className="text-[14px] font-semibold text-app-text mb-2">为您推荐省钱包</div>
            <div className="flex gap-2">
              <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: '#FFF4EC' }}>
                <div className="text-[13px] font-medium text-app-text">打车省钱包</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.orangeDeep }}>最高省¥66</div>
              </div>
              <div className="flex-1 rounded-lg px-3 py-2.5" style={{ background: '#EFF5FF' }}>
                <div className="text-[13px] font-medium text-app-text">拼车月卡</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.blue }}>9.5折起</div>
              </div>
            </div>
            <div className="text-center text-[11px] text-app-text-muted mt-3">一个滴滴 畅行全城</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GridIcon({ Icon, color }: { Icon: LucideIcon; color: string }) {
  return (
    <span
      className="flex h-10 w-10 items-center justify-center rounded-2xl"
      style={{ background: `${color}1A` }}
    >
      <Icon size={22} strokeWidth={2.1} style={{ color }} />
    </span>
  );
}

function GridItem({
  Icon,
  color,
  label,
  bind,
}: {
  Icon: LucideIcon;
  color: string;
  label: string;
  bind: object;
}) {
  return (
    <button {...bind} className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0">
      <GridIcon Icon={Icon} color={color} />
      <span className="text-[11px] text-app-text">{label}</span>
    </button>
  );
}

/** 未实现服务 —— 统一绑 home.main.stub → 暂未开放 */
function GridStub({ Icon, color, label }: { Icon: LucideIcon; color: string; label: string }) {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  return (
    <button
      {...bindTap({ kind: 'action', id: 'home.main.stub' }, { onTrigger: () => toast('该功能暂未开放') })}
      className="flex flex-col items-center gap-1.5 bg-transparent border-none p-0"
    >
      <GridIcon Icon={Icon} color={color} />
      <span className="text-[11px] text-app-text">{label}</span>
    </button>
  );
}
