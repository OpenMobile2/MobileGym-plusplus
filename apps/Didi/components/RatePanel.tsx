import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { Card, OrangeBtn, C, driverAvatar, imgFallback } from './ui';

const FACES: { level: 'bad' | 'mid' | 'good'; emoji: string; label: string; tint: string }[] = [
  { level: 'bad', emoji: '😡', label: '不满意', tint: '#FFECEC' },
  { level: 'mid', emoji: '😐', label: '一般般', tint: '#FFF6E3' },
  { level: 'good', emoji: '😄', label: '很满意', tint: '#FFF9E0' },
];

/**
 * 评价面板(trip.finish / order.detail 共用)。
 * 证据:frames/recD_rate_face.jpg、frames/recD_rate_tags.jpg、n05~n12。
 * 注意:order.detail 路由未声明 rate.quick / rate.anonymous.toggle,
 * 这两个控件在 ns='order.detail' 时用普通按钮直接调 store(不打 data 标)。
 */
export function RatePanel({ ns, orderId }: { ns: 'trip.finish' | 'order.detail'; orderId: string | null }) {
  const { bindTap } = useDidiGestures();
  const orders = useDidiStore((s) => s.orders);
  const trip = useDidiStore((s) => s.trip);
  const rateLevel = useDidiStore((s) => s.rateLevel);
  const rateTags = useDidiStore((s) => s.rateTags);
  const rateAnonymous = useDidiStore((s) => s.rateAnonymous);
  const rateTagsGood = useDidiStore((s) => s.rateTagsGood);
  const rateTagsBad = useDidiStore((s) => s.rateTagsBad);
  const setRateLevel = useDidiStore((s) => s.setRateLevel);
  const toggleRateTag = useDidiStore((s) => s.toggleRateTag);
  const setRateAnonymous = useDidiStore((s) => s.setRateAnonymous);
  const submitRate = useDidiStore((s) => s.submitRate);

  const order = orders.find((o) => o.id === orderId);
  if (!order) return null;

  const isFinish = ns === 'trip.finish';
  const driverName = trip.orderId === order.id && trip.driver ? trip.driver.name : '演示司机';

  // ---- 已提交态 ----
  if (order.rated) {
    const level = order.rating?.level;
    const tags = order.rating?.tags ?? [];
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2.5">
          <img src={driverAvatar(driverName)} {...imgFallback(driverName)} className="w-10 h-10 rounded-full shrink-0 object-cover" alt="" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold" style={{ color: C.green }}>感谢您的评价</div>
            <div className="text-[12px] text-app-text-muted mt-0.5 truncate">{driverName}|{order.carType}</div>
          </div>
        </div>
        <div className="flex justify-around mt-3">
          {FACES.map((f) => {
            const active = level === f.level;
            return (
              <div
                key={f.level}
                className="flex flex-col items-center gap-1 rounded-xl px-3 py-1.5"
                style={{ background: active ? f.tint : 'transparent' }}
              >
                <span style={{ fontSize: active ? 32 : 24, filter: active ? 'none' : 'grayscale(1)', opacity: active ? 1 : 0.4 }}>
                  {f.emoji}
                </span>
                <span className="text-[12px]" style={{ color: active ? C.orangeDeep : '#9AA0AA', fontWeight: active ? 600 : 400 }}>
                  {f.label}
                </span>
              </div>
            );
          })}
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((t) => (
              <span key={t} className="px-3 py-1.5 rounded-full text-[12px]" style={{ background: '#FFF2EA', color: C.orangeDeep }}>
                {t}
              </span>
            ))}
          </div>
        )}
      </Card>
    );
  }

  // ---- 未评价态 ----
  const tagPool = rateLevel === 'good' ? rateTagsGood : rateTagsBad;
  const hint =
    rateLevel === 'good'
      ? '告诉我哪里做的不错,我给您保持!'
      : '请告诉我哪里做得不好,我会努力改善';

  return (
    <Card className="p-4">
      {/* 司机行 */}
      <div className="flex items-center justify-center gap-2">
        <img src={driverAvatar(driverName)} {...imgFallback(driverName)} className="w-9 h-9 rounded-full shrink-0 object-cover" alt="" />
        <span className="text-[14px] text-app-text font-medium">{driverName}|{order.carType}</span>
      </div>
      <div className="text-center text-[17px] font-semibold text-app-text mt-2.5">您对我的服务满意吗?</div>
      <div className="text-center text-[12px] text-app-text-muted mt-1">“您的反馈将帮助我做得更好”</div>

      {/* 三个表情 */}
      <div className="flex justify-around mt-3.5">
        {FACES.map((f) => {
          const active = rateLevel === f.level;
          return (
            <button
              key={f.level}
              {...bindTap(
                { kind: 'action', id: isFinish ? 'trip.finish.rate.face' : 'order.detail.rate.face' },
                { params: { value: f.level }, onTrigger: () => setRateLevel(f.level) },
              )}
              className="flex flex-col items-center gap-1.5 border-none rounded-2xl px-4 py-2 transition-transform"
              style={{
                background: active ? f.tint : 'transparent',
                transform: active ? 'scale(1.08)' : 'scale(1)',
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  filter: active ? 'none' : 'grayscale(1)',
                  opacity: active ? 1 : 0.45,
                }}
              >
                {f.emoji}
              </span>
              <span
                className="text-[13px]"
                style={{ color: active ? C.orangeDeep : '#8A8F99', fontWeight: active ? 600 : 400 }}
              >
                {f.label}
              </span>
            </button>
          );
        })}
      </div>

      {rateLevel && (
        <>
          <div className="text-center text-[14px] text-app-text font-medium mt-4">{hint}</div>
          {/* 标签 chips */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            {tagPool.map((t) => {
              const picked = rateTags.includes(t);
              return (
                <button
                  key={t}
                  {...bindTap(
                    { kind: 'action', id: isFinish ? 'trip.finish.rate.tag.toggle' : 'order.detail.rate.tag.toggle' },
                    { params: { value: t }, onTrigger: () => toggleRateTag(t) },
                  )}
                  className="py-2.5 rounded-full text-[13px] text-center"
                  style={{
                    background: picked ? '#FFF4EC' : '#F5F6FA',
                    color: picked ? C.orangeDeep : '#555',
                    border: picked ? `1px solid ${C.orange}` : '1px solid transparent',
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* 一键好评(仅 good;order.detail 未声明该 action → 普通按钮直调 store) */}
          {rateLevel === 'good' &&
            (isFinish ? (
              <button
                {...bindTap({ kind: 'action', id: 'trip.finish.rate.quick' }, { onTrigger: () => submitRate(true) })}
                className="flex items-center w-full mt-3 px-4 py-3 rounded-xl bg-transparent text-left"
                style={{ border: '1px solid #EEE' }}
              >
                <span className="flex-1 text-[14px] text-app-text">一键好评</span>
                <QuickCheck />
              </button>
            ) : (
              <button
                onClick={() => submitRate(true)}
                className="flex items-center w-full mt-3 px-4 py-3 rounded-xl bg-transparent text-left"
                style={{ border: '1px solid #EEE' }}
              >
                <span className="flex-1 text-[14px] text-app-text">一键好评</span>
                <QuickCheck />
              </button>
            ))}

          {/* 匿名评价(order.detail 未声明该 action → 普通按钮直调 store) */}
          {isFinish ? (
            <button
              {...bindTap(
                { kind: 'action', id: 'trip.finish.rate.anonymous.toggle' },
                { onTrigger: () => setRateAnonymous(!rateAnonymous) },
              )}
              className="flex items-center w-full mt-2.5 px-1 py-1 bg-transparent border-none text-left"
            >
              <AnonDot on={rateAnonymous} />
              <span className="text-[13px] text-app-text-muted ml-2">匿名评价</span>
            </button>
          ) : (
            <button
              onClick={() => setRateAnonymous(!rateAnonymous)}
              className="flex items-center w-full mt-2.5 px-1 py-1 bg-transparent border-none text-left"
            >
              <AnonDot on={rateAnonymous} />
              <span className="text-[13px] text-app-text-muted ml-2">匿名评价</span>
            </button>
          )}
        </>
      )}

      {/* 提交 */}
      <div className="mt-3.5">
        <OrangeBtn
          bind={bindTap(
            { kind: 'action', id: isFinish ? 'trip.finish.rate.submit' : 'order.detail.rate.submit' },
            { onTrigger: () => submitRate() },
          )}
        >
          {rateAnonymous ? '匿名评价' : '署名评价'}
        </OrangeBtn>
      </div>
    </Card>
  );
}

function QuickCheck() {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{ width: 20, height: 20, background: C.orange, color: '#fff', fontSize: 12 }}
    >
      ✓
    </span>
  );
}

function AnonDot({ on }: { on: boolean }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full shrink-0"
      style={{
        width: 18,
        height: 18,
        background: on ? C.orange : 'transparent',
        border: on ? 'none' : '1.5px solid #C9CCD4',
        color: '#fff',
        fontSize: 11,
      }}
    >
      {on ? '✓' : ''}
    </span>
  );
}
