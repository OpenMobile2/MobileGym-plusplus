import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { C, CheckCircle } from '../components/ui';
import { LiveTripMap } from '../components/LiveTripMap';
import { scaleFare } from '../pricing';
import { IcNavBack } from '../res/icons';

/** 呼叫中·正在通知司机 —— 证据 frames/recB_waiting.jpg 前段 */
export default function CallWaitingPage() {
  const { bindTap, go } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const carGroups = useDidiStore((s) => s.carGroups);
  const confirmAppendCarTypes = useDidiStore((s) => s.confirmAppendCarTypes);
  const driverAccept = useDidiStore((s) => s.driverAccept);
  const strings = useDidiStrings();

  // 勾选先落在本地草稿，点「确认追加」后再写入行程
  const [draftAppended, setDraftAppended] = React.useState<string[]>(trip.appended);
  React.useEffect(() => {
    setDraftAppended(trip.appended);
  }, [trip.appended]);

  // 4秒后自动接单 → 司机页
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (useDidiStore.getState().trip.phase === 'waiting') {
        driverAccept();
        go('trip.driver.open');
      }
    }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appendCandidates = carGroups
    .flatMap((g) => g.types)
    .filter((t) => !t.checked)
    .slice(0, 4);

  const draftChanged = draftAppended.length !== trip.appended.length
    || draftAppended.some((id) => !trip.appended.includes(id));
  const canConfirm = draftAppended.length > 0 || draftChanged;

  const toggleDraft = (typeId: string) => {
    setDraftAppended((prev) => (
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    ));
  };

  const handleConfirmAppend = () => {
    if (!canConfirm) {
      toast(strings.callSelectFirst);
      return;
    }
    confirmAppendCarTypes(draftAppended);
  };

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <style>{`
        @keyframes didiPulse {
          0% { transform: scale(.4); opacity: .55; }
          100% { transform: scale(1.6); opacity: 0; }
        }
      `}</style>

      {/* 实时找车地图 + 扩散圆环 */}
      <div className="relative shrink-0">
        <LiveTripMap
          phase="waiting"
          height={240}
          totalMeters={Math.max(300, Math.round(trip.distanceKm * 80))}
          totalMinutes={Math.max(1, Math.round(trip.durationMin * 0.15))}
          pinStart={trip.from}
        />
        <button
          {...bindTap('trip.cancel.open')}
          className="absolute left-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border-none bg-white text-app-text shadow"
          aria-label="返回并取消订单"
        >
          <IcNavBack size={20} />
        </button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span
            className="absolute rounded-full"
            style={{
              width: 120, height: 120, background: 'rgba(255,125,65,.35)',
              animation: 'didiPulse 1.6s ease-out infinite',
            }}
          />
          <span
            className="absolute rounded-full"
            style={{
              width: 120, height: 120, background: 'rgba(255,125,65,.25)',
              animation: 'didiPulse 1.6s ease-out .8s infinite',
            }}
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 追加车型卡 */}
        <div className="bg-app-surface rounded-xl px-3.5 py-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[16px] font-bold text-app-text">{strings.callAppendTitle}</span>
            <span className="text-[11px] text-app-text-muted">{strings.callAppendHint}</span>
          </div>
          {appendCandidates.map((t, i) => (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'call.waiting.append.toggle' },
                { onTrigger: () => toggleDraft(t.id) },
              )}
              className={`flex items-center w-full py-2.5 bg-transparent border-none text-left ${
                i === appendCandidates.length - 1 ? '' : 'border-b border-app-border'
              }`}
            >
              <span className="flex-1 text-[15px] text-app-text">{t.name}</span>
              <span className="text-[12px] text-app-text-muted mr-1">{strings.callFixedPrice}</span>
              <span className="text-[15px] font-semibold text-app-text mr-2.5">
                ¥{scaleFare(t.price, trip.distanceKm)}{t.priceSuffix ?? ''}
              </span>
              <CheckCircle checked={draftAppended.includes(t.id)} />
            </button>
          ))}

          <button
            {...bindTap(
              { kind: 'action', id: 'call.waiting.append.confirm' },
              { onTrigger: handleConfirmAppend },
            )}
            disabled={!canConfirm}
            className="mt-3 w-full py-3 rounded-full border-none text-[15px] font-semibold text-white"
            style={{ background: canConfirm ? C.orange : '#FFC7A8' }}
            data-action="call.waiting.append.confirm"
          >
            {draftAppended.length > 0
              ? strings.callAppendConfirmCount.replace('{count}', String(draftAppended.length))
              : strings.callAppendConfirm}
          </button>
        </div>

      </div>

      {/* 取消订单 */}
      <div className="px-3 pb-3 shrink-0">
        <button
          {...bindTap('trip.cancel.open')}
          className="w-full py-3 rounded-full border-none text-[15px]"
          style={{ background: '#EDEEF2', color: '#5A5F6B' }}
        >
          {strings.callCancelOrder}
        </button>
      </div>
    </div>
  );
}
