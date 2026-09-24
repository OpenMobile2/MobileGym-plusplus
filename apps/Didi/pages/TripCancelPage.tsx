import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C, OrangeBtn } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { IcNavBack, IcCheck } from '../res/icons';

/** 取消订单:挽留态(frames/recB_waiting.jpg 挽留层)→ 取消成功问卷(frames/recB_cancel.jpg) */
export default function TripCancelPage() {
  const trip = useDidiStore((s) => s.trip);
  return trip.phase === 'canceled' ? <CanceledSurvey /> : <KeepLayer />;
}

/** A. 挽留态 */
function KeepLayer() {
  const { bindTap, bindBack, back } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const confirmCancel = useDidiStore((s) => s.confirmCancel);
  const [blockDriver, setBlockDriver] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* 地图 + 司机距您 */}
      <div className="relative shrink-0">
        <MapCanvas route car height={200} />
        <button
          {...bindBack()}
          className="absolute left-3 top-3 w-9 h-9 rounded-full bg-white shadow flex items-center justify-center border-none text-app-text"
          aria-label="返回"
        >
          <IcNavBack size={20} />
        </button>
        <div className="absolute left-3 bottom-3 bg-white rounded-lg shadow px-2.5 py-1.5 text-[12px] text-app-text">
          司机距您 <span className="font-bold" style={{ color: C.green }}>1.6公里 3分钟</span>
        </div>
      </div>

      {/* 挽留白卡 */}
      <div
        className="flex-1 overflow-y-auto rounded-t-2xl -mt-3 relative px-4 pt-5"
        style={{ background: 'linear-gradient(180deg,#FFF3ED 0%,#FFFFFF 30%)' }}
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex justify-center gap-3 text-[34px] mb-3">🚗 🚙</div>
        <div className="text-[16px] font-semibold text-app-text text-center leading-relaxed">
          猜测您遇到了一些问题,如有需要,
          <br />
          我们可帮您<span style={{ color: C.orangeDeep }}>优先再派车辆</span>
        </div>
        <div className="text-[13px] text-app-text-muted text-center mt-2">
          如确需取消,司机接单<span className="text-app-text font-medium">2分钟内</span>可免费取消
          <button
            onClick={() => toast('该功能暂未开放')}
            className="bg-transparent border-none text-[13px] text-app-text-muted ml-1"
          >
            取消规则 ›
          </button>
        </div>

        {/* 拉黑司机黄条 */}
        <div className="rounded-xl px-3 py-2.5 mt-4" style={{ background: '#FFF6DE' }}>
          <div className="flex items-center">
            <span className="flex-1 text-[12px]" style={{ color: '#B37B00' }}>
              {blockDriver ? '已拉黑该司机,12个月内将不再为您接单' : '如对司机服务不满意,勾选此处拉黑司机'}
            </span>
            <button
              onClick={() => setBlockDriver((v) => !v)}
              className="w-5.5 h-5.5 rounded-full border flex items-center justify-center bg-transparent shrink-0"
              style={{
                width: 22, height: 22,
                borderColor: blockDriver ? C.orange : '#D9C48A',
                background: blockDriver ? C.orange : 'transparent',
              }}
              aria-label="拉黑司机"
            >
              {blockDriver && <IcCheck size={14} color="#fff" />}
            </button>
          </div>
          <div className="text-[11px] mt-1" style={{ color: '#C99C33' }}>
            {blockDriver ? '*再次点击可取消拉黑' : '*拉黑司机,12个月内无需此司机接单'}
          </div>
        </div>
      </div>

      {/* 底部双按钮 */}
      <div className="flex gap-3 px-4 pb-4 pt-2 bg-app-surface shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'trip.cancel.confirm' }, { onTrigger: () => confirmCancel() })}
          className="flex-1 py-3 rounded-full text-[15px] bg-app-surface"
          style={{ border: `1.5px solid ${C.orange}`, color: C.orangeDeep }}
        >
          不用车了
        </button>
        <span className="relative flex-1">
          <button
            {...bindTap(
              { kind: 'action', id: 'trip.cancel.redispatch' },
              {
                onTrigger: () => {
                  toast('已为您优先重新派车');
                  back();
                },
              },
            )}
            className="w-full py-3 rounded-full border-none text-[15px] text-white font-medium"
            style={{ background: C.orange }}
          >
            帮我换辆车
          </button>
          <span
            className="absolute -top-2 right-0 rounded-full px-2 py-0.5 text-[10px] text-white whitespace-nowrap"
            style={{ background: '#B37B00' }}
          >
            优先派单免排队
          </span>
        </span>
      </div>
    </div>
  );
}

/** B. 取消成功 + 原因问卷 */
function CanceledSurvey() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const cancelReasons = useDidiStore((s) => s.cancelReasons);
  const cancelPicked = useDidiStore((s) => s.cancelPicked);
  const toggleCancelReason = useDidiStore((s) => s.toggleCancelReason);
  const submitCancelSurvey = useDidiStore((s) => s.submitCancelSurvey);
  const resetTrip = useDidiStore((s) => s.resetTrip);

  return (
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg,#FFE9E4 0%,#FFF7F3 22%,#F5F6FA 40%)' }}>
      {/* 顶部:取消成功 */}
      <div className="px-4 pt-2 shrink-0">
        <button
          {...bindTap('trip.cancel.done', { beforeTrigger: () => resetTrip() })}
          className="bg-transparent border-none p-1 -ml-1 text-app-text"
          aria-label="返回首页"
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[22px] font-bold text-app-text">行程取消成功</span>
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: '#1FA96B' }}
          >
            <IcCheck size={15} color="#fff" />
          </span>
          <span className="text-[22px]">👌</span>
        </div>
        <div className="text-[12px] text-app-text-muted mt-1">着急用车,你可重新选择服务</div>
        <div className="bg-app-surface rounded-xl px-3.5 py-3 mt-3 flex items-center">
          <span className="flex-1 min-w-0">
            <span className="flex items-center text-[13px] text-app-text mb-1.5">
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
              <span className="truncate">{trip.from}</span>
            </span>
            <span className="flex items-center text-[13px] text-app-text">
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.red }} />
              <span className="truncate">{trip.to || '目的地'}</span>
            </span>
          </span>
          <button
            onClick={() => toast('该功能暂未开放')}
            className="rounded-full px-3.5 py-1.5 border-none text-[13px] text-white shrink-0"
            style={{ background: C.red }}
          >
            再来一单
          </button>
        </div>
      </div>

      {/* 原因问卷 */}
      <div
        className="flex-1 overflow-y-auto px-4 pt-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="bg-app-surface rounded-xl px-3.5 py-3.5">
          <div className="text-[16px] font-bold text-app-text mb-2">✍️ 您为什么要取消行程?</div>
          {cancelReasons.map((g) => (
            <div key={g.group} className="mb-2.5">
              <div className="text-[13px] text-app-text-muted mb-1.5">{g.group}</div>
              <div className="grid grid-cols-2 gap-2">
                {g.options.map((opt) => {
                  const picked = cancelPicked.includes(opt);
                  return (
                    <button
                      key={opt}
                      {...bindTap(
                        { kind: 'action', id: 'trip.cancel.reason.toggle' },
                        { onTrigger: () => toggleCancelReason(opt) },
                      )}
                      className="rounded-lg px-2 py-2.5 text-[13px] text-left"
                      style={{
                        background: picked ? '#FFF4EC' : '#F5F6FA',
                        border: picked ? `1.5px solid ${C.orange}` : '1.5px solid transparent',
                        color: picked ? C.orangeDeep : C.dark,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>

      {/* 提交 → 首页 */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <OrangeBtn
          bind={bindTap('trip.cancel.done', {
            beforeTrigger: () => {
              submitCancelSurvey();
              resetTrip();
            },
          })}
        >
          提交
        </OrangeBtn>
      </div>
    </div>
  );
}
