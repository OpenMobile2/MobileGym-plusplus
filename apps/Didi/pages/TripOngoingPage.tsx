import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import { LiveTripMap } from '../components/LiveTripMap';
import { formatMeters, remainEta } from '../pricing';
import { IcSafety, IcRoute, IcShare } from '../res/icons';

/** 行程中(前往目的地+互动流)—— 证据 frames/recA_ongoing.jpg */
export default function TripOngoingPage() {
  const { bindTap, go } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const arriveTrip = useDidiStore((s) => s.arriveTrip);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (useDidiStore.getState().trip.phase === 'ongoing') {
        arriveTrip();
        go('trip.finish.open');
      }
    // Route editing is a first-class task path. Preserve a deterministic,
    // usable interaction window before the simulated automatic arrival.
    }, 60_000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const driver = trip.driver;
  const initialEta = React.useMemo(
    () => remainEta(trip.distanceKm, trip.durationMin),
    [trip.distanceKm, trip.durationMin],
  );
  const [eta, setEta] = React.useState(initialEta);

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* ① 顶部深色行程条 */}
      <div className="flex items-center px-3 py-2.5 shrink-0" style={{ background: '#1E2228' }}>
        <span className="text-white text-[15px] mr-2">↓</span>
        <span className="text-white text-[14px] font-semibold mr-2 truncate">
          {driver?.plate ?? '测试·A004'}·{driver?.plateColor ?? '黑'}
        </span>
        <span className="text-[13px] flex-1 truncate" style={{ color: '#C6CBD4' }}>
          前往目的地 <span className="font-bold" style={{ color: C.orange }}>{formatMeters(eta.meters)} {eta.minutes}分钟</span>
        </span>
        <button
          {...bindTap('trip.share.open')}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none mr-1.5"
          style={{ background: 'rgba(255,255,255,.14)' }}
          aria-label="行程分享"
        >
          <IcShare size={16} color="#fff" />
        </button>
        <button
          {...bindTap('route.fromOngoing')}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none mr-1.5"
          style={{ background: 'rgba(255,255,255,.14)' }}
          aria-label="选择路线"
        >
          <IcRoute size={16} color="#fff" />
        </button>
        <button
          {...bindTap('safety.fromOngoing')}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none"
          style={{ background: 'rgba(255,255,255,.14)' }}
          aria-label="安全中心"
        >
          <IcSafety size={16} color="#fff" />
        </button>
      </div>

      {/* ② 实时行程地图 */}
      <div className="relative shrink-0">
        <LiveTripMap
          phase="ongoing"
          height={200}
          totalMeters={initialEta.meters}
          totalMinutes={initialEta.minutes}
          pinStart={trip.from}
          pinEnd={trip.to || undefined}
          onEtaChange={(next) => setEta({ meters: next.meters, minutes: next.minutes })}
        />
      </div>

      {/* ③ 互动流 */}
      <div
        className="flex-1 overflow-y-auto px-3 pt-3 pb-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 空调反馈卡 */}
        <div className="rounded-xl px-3.5 py-3 mb-2.5" style={{ background: 'linear-gradient(135deg,#F2FBEF,#E8F6FF)' }}>
          <div className="text-[12px] mb-1" style={{ color: C.green }}>❄️ 夏日小乘凉</div>
          <div className="text-[16px] font-bold text-app-text mb-2.5">司机是否配合您开关空调?</div>
          <div className="flex gap-2">
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.ongoing.acFeedback' },
                { onTrigger: () => toast('感谢反馈') },
              )}
              className="flex-1 py-2 rounded-full border-none text-[14px] text-app-text bg-white"
            >
              😠 提了,不配合
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.ongoing.acFeedback' },
                { onTrigger: () => toast('感谢反馈') },
              )}
              className="flex-1 py-2 rounded-full border-none text-[14px] font-medium"
              style={{ background: '#FFE8DB', color: C.orangeDeep }}
            >
              😊 配合
            </button>
          </div>
        </div>

        {/* 游戏 banner */}
        <div
          className="rounded-xl px-4 py-3.5 mb-2.5 flex items-center justify-between"
          style={{ background: 'linear-gradient(90deg,#E8F8D8,#D4F0BC)' }}
        >
          <div>
            <div className="text-[11px] text-app-text-muted">🏆 轻松一下,等你来挑战</div>
            <div className="text-[17px] font-bold text-app-text mt-0.5">冲冲冲鸭!</div>
            <div className="text-[11px] text-app-text-muted mt-0.5">看看你能坚持多少秒</div>
          </div>
          <button
            onClick={() => toast('该功能暂未开放')}
            className="rounded-full px-5 py-2 border-none text-[14px] font-bold text-app-text"
            style={{ background: '#FFE24A' }}
          >
            START
          </button>
        </div>

        {/* 王安宇活动 banner */}
        <button
          onClick={() => toast('该功能暂未开放')}
          className="w-full rounded-xl px-4 py-3 mb-2.5 border-none flex items-center justify-between text-left"
          style={{ background: 'linear-gradient(90deg,#EFE2FF,#E0D0FF)' }}
        >
          <div>
            <div className="text-[16px] font-bold" style={{ color: '#7B3FE4' }}>王安宇亲签好礼</div>
            <div className="text-[11px] mt-0.5" style={{ color: '#9B7BD0' }}>抽奖进行中!!</div>
          </div>
          <span className="rounded-full px-3.5 py-1.5 text-[13px] text-white" style={{ background: '#7B3FE4' }}>抽</span>
        </button>

        {/* V3 会员权益卡 */}
        <div className="bg-app-surface rounded-xl px-3.5 py-3 mb-2.5">
          <div className="flex items-center mb-2.5">
            <span className="text-[15px] font-bold text-app-text">V3会员</span>
            <span className="text-[13px] text-app-text ml-2 flex-1">行程中专享<span style={{ color: C.orangeDeep }}>1项</span>权益</span>
            <button onClick={() => toast('该功能暂未开放')} className="bg-transparent border-none text-[12px] text-app-text-muted">
              查看更多 ›
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg px-2 py-2.5 text-center" style={{ background: '#FBF6EC' }}>
              <div className="text-[12px] font-medium text-app-text">行程意外险</div>
              <div className="text-[10px] text-app-text-muted mt-0.5">20次/月</div>
              <button
                onClick={() => toast('该功能暂未开放')}
                className="mt-1.5 rounded-full px-2.5 py-0.5 border-none text-[11px] text-white"
                style={{ background: '#C9A05A' }}
              >
                免费领
              </button>
            </div>
            <div className="rounded-lg px-2 py-2.5 text-center" style={{ background: '#F5F6FA' }}>
              <div className="text-[12px] font-medium text-app-text">VIP客服</div>
              <div className="text-[10px] text-app-text-muted mt-0.5">会员专属服务</div>
              <div className="mt-1.5 text-[11px] text-app-text-muted">🔒 V7解锁</div>
            </div>
            <div className="rounded-lg px-2 py-2.5 text-center" style={{ background: '#F5F6FA' }}>
              <div className="text-[12px] font-medium text-app-text">免取消费</div>
              <div className="text-[10px] text-app-text-muted mt-0.5">1次/月</div>
              <div className="mt-1.5 text-[11px] text-app-text-muted">🔒 V5解锁</div>
            </div>
          </div>
        </div>

        {/* 匿名反馈墙 */}
        <div className="bg-app-surface rounded-xl px-3.5 py-3 mb-2.5">
          <div className="flex items-center mb-2">
            <span className="text-[15px] font-bold text-app-text">匿名反馈墙</span>
            <span className="text-[11px] text-app-text-muted ml-2">75.2万+人参与中</span>
          </div>
          <div className="rounded-lg px-3 py-2.5 text-[14px] text-app-text mb-2.5" style={{ background: '#F5F6FA' }}>
            司机是否私自变更路线?
          </div>
          <div className="flex gap-2">
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.ongoing.wall.vote' },
                { onTrigger: () => toast('已反馈') },
              )}
              className="flex-1 py-2 rounded-full border border-app-border bg-transparent text-[14px] text-app-text"
            >
              💔 是
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.ongoing.wall.vote' },
                { onTrigger: () => toast('已反馈') },
              )}
              className="flex-1 py-2 rounded-full border border-app-border bg-transparent text-[14px] text-app-text"
            >
              ❤️ 否
            </button>
          </div>
        </div>

        {/* 问卷调研 */}
        <button
          onClick={() => toast('该功能暂未开放')}
          className="w-full rounded-xl px-4 py-3 border-none flex items-center justify-between text-left"
          style={{ background: '#EFF5FF' }}
        >
          <span className="text-[13px]" style={{ color: C.blue }}>📋 参与问卷调研,帮助我们做得更好</span>
          <span className="text-[13px]" style={{ color: C.blue }}>›</span>
        </button>
      </div>

      {/* ④ 底部到达按钮 */}
      <div className="px-3 pb-3 shrink-0">
        <button
          {...bindTap('trip.finish.open', { beforeTrigger: () => arriveTrip() })}
          className="w-full py-3 rounded-full border-none text-white text-[16px] font-medium"
          style={{ background: C.orange }}
        >
          到达目的地(模拟)
        </button>
      </div>
    </div>
  );
}
