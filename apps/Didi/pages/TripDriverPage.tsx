import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C, driverAvatar, imgFallback } from '../components/ui';
import { LiveTripMap } from '../components/LiveTripMap';
import { formatMeters, pickupEta } from '../pricing';
import { IcNavBack, IcSafety, IcShare, IcPhone } from '../res/icons';
import { payWithSystem, shareWithSystem } from '../capabilities';

/** 司机已接单·接驾中 —— 证据 frames/recA_driver.jpg,frames/recB_driveraccept.jpg */
export default function TripDriverPage() {
  const { bindTap, bindBack, go } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const openTripChat = useDidiStore((s) => s.openTripChat);
  const startTrip = useDidiStore((s) => s.startTrip);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (useDidiStore.getState().trip.phase === 'driver') {
        startTrip();
        go('trip.ongoing.open');
      }
    // Keep the driver-arrival state long enough for an agent to inspect and
    // explicitly start the trip. A four-second auto advance races a single
    // vision/model turn and makes the transition effectively unclickable.
    }, 30_000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const driver = trip.driver;
  const initialEta = React.useMemo(() => pickupEta(trip.distanceKm), [trip.distanceKm]);
  const [eta, setEta] = React.useState(initialEta);
  const carTypeLabel = trip.carType || '快车';

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* ① 实时地图 + 浮层 */}
      <div className="relative shrink-0">
        <LiveTripMap
          phase="driver"
          height={230}
          totalMeters={initialEta.meters}
          totalMinutes={initialEta.minutes}
          pinStart={trip.from}
          pinEnd={trip.to || undefined}
          onEtaChange={(next) => setEta({ meters: next.meters, minutes: next.minutes })}
        />
        <button
          {...bindBack()}
          className="absolute left-3 top-3 z-10 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center border-none text-app-text"
          aria-label="返回"
        >
          <IcNavBack size={20} />
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 top-3 z-10 rounded-full px-3.5 py-1.5 bg-white shadow text-[12px] text-app-text whitespace-nowrap">
          距上车点 <span className="font-bold" style={{ color: C.green }}>{formatMeters(eta.meters)} {eta.minutes}分钟</span>
        </div>
        <button
          {...bindTap(
            { kind: 'action', id: 'trip.driver.address.share' },
            {
              onTrigger: () => {
                const text = `【滴滴】我的行程地址：${trip.from} → ${trip.to || '目的地'}`;
                const launched = shareWithSystem(text, (result) => {
                  if (result.resultCode === 'OK') toast('分享成功');
                });
                if (!launched) toast('无法打开分享应用');
              },
            },
          )}
          className="absolute right-3 top-3 z-10 rounded-full bg-white shadow px-2.5 py-1 text-[11px] text-app-text border-none"
        >
          分享地址
        </button>
        <div className="absolute right-2 bottom-8 z-10 flex flex-col gap-1.5">
          <button
            {...bindTap('trip.waypoint.open')}
            className="bg-white rounded-lg shadow px-2 py-1.5 text-[11px] text-app-text border-none"
          >
            途经点
          </button>
          <button
            {...bindTap('trip.changeDest.open')}
            className="bg-white rounded-lg shadow px-2 py-1.5 text-[11px] text-app-text border-none"
          >
            修改终点
          </button>
          <button
            {...bindTap('route.select.open')}
            className="bg-white rounded-lg shadow px-2 py-1.5 text-[11px] text-app-text border-none"
          >
            选择路线
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* ② 安静提醒蓝条 */}
        <div className="flex items-center rounded-xl px-3 py-2.5 mb-2" style={{ background: '#EAF2FF' }}>
          <IcSafety size={15} color={C.blue} />
          <span className="flex-1 text-[12px] ml-1.5" style={{ color: C.blue }}>
            乘车时想更安静,平台帮您提醒司机
          </span>
          <button
            {...bindTap(
              { kind: 'action', id: 'trip.driver.quiet' },
              { onTrigger: () => toast('已提醒司机保持安静') },
            )}
            className="rounded-full px-2.5 py-1 text-[11px] border bg-transparent shrink-0"
            style={{ color: C.blue, borderColor: C.blue }}
          >
            去提醒
          </button>
        </div>

        {/* ③ 司机卡 */}
        <div className="bg-app-surface rounded-xl px-3.5 py-3 mb-2">
          <div className="flex items-center">
            <span
              className="text-[11px] text-white rounded px-1.5 py-0.5 mr-2"
              style={{ background: C.orange }}
            >
              {carTypeLabel}
            </span>
            <span className="flex-1 text-[16px] font-bold text-app-text">司机正在赶来</span>
            <span className="text-[13px] text-app-text">
              全程 <span className="font-bold">¥{trip.fare}</span> ›
            </span>
          </div>

          <div className="flex items-center mt-3">
            <img
              src={driverAvatar(driver?.name ?? '司')}
              {...imgFallback(driver?.name ?? '司')}
              alt="司机头像"
              className="w-12 h-12 rounded-full mr-3 shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-bold text-app-text truncate">
                {driver?.name ?? '演示司机'}·{driver?.plate ?? '——'}
              </div>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="text-[12px]" style={{ color: C.orangeDeep }}>⭐{(driver?.rating ?? 5.0).toFixed(1)}</span>
                {(driver?.tags ?? []).map((tag) => (
                  <span key={tag} className="text-[11px] text-app-text-muted rounded px-1.5 py-0.5" style={{ background: '#F5F6FA' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.driver.call' },
                { onTrigger: () => toast('该功能暂未开放') },
              )}
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-none"
              style={{ background: '#F5F6FA' }}
              aria-label="联系司机"
            >
              <IcPhone size={17} className="text-app-text" />
            </button>
          </div>

          {/* 功能行 五圆图标 */}
          <div className="flex mt-4 pt-3 border-t border-app-border text-center">
            <button {...bindTap('safety.center.open')} className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F5F6FA' }}>🚨</span>
              <span className="text-[11px] text-app-text">110报警</span>
            </button>
            <button onClick={() => toast('该功能暂未开放')} className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F5F6FA' }}>🙋</span>
              <span className="text-[11px] text-app-text">我没上车</span>
            </button>
            <button
              {...bindTap('chat.detail.open', { beforeTrigger: () => openTripChat() })}
              className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F5F6FA' }}>🎧</span>
              <span className="text-[11px] text-app-text">联系客服</span>
            </button>
            <button {...bindTap('trip.share.open')} className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none">
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F5F6FA' }}>
                <IcShare size={16} className="text-app-text" />
              </span>
              <span className="text-[11px] text-app-text">行程分享</span>
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.driver.thanks' },
                {
                  onTrigger: () => {
                    const launched = payWithSystem(
                      {
                        amount: 5,
                        orderId: `didi-thanks-${trip.orderId || 'active'}`,
                        subject: '感谢司机红包',
                        method: '微信支付',
                      },
                      (result) => {
                        if (result.resultCode === 'OK') toast('感谢红包已送出');
                      },
                    );
                    if (!launched) toast('无法打开支付应用');
                  },
                },
              )}
              className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none"
            >
              <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: '#F5F6FA' }}>🧧</span>
              <span className="text-[11px] text-app-text">感谢红包</span>
            </button>
          </div>
        </div>
      </div>

      {/* ④⑤ 底部操作 */}
      <div className="px-3 pb-3 shrink-0">
        <button
          {...bindTap('trip.ongoing.open', { beforeTrigger: () => startTrip() })}
          className="w-full py-3 rounded-full border-none text-white text-[16px] font-medium"
          style={{ background: C.green }}
        >
          司机已到达,开始行程(模拟)
        </button>
        <div className="flex justify-center mt-2">
          <button
            {...bindTap('trip.cancel.open')}
            className="bg-transparent border-none text-[13px] text-app-text-muted"
          >
            取消订单
          </button>
        </div>
      </div>
    </div>
  );
}
