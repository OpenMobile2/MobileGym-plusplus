import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C } from '../components/ui';
import { IcNavBack } from '../res/icons';

/** 添加途经点 —— 证据 s21,frames/recA_waypoint.jpg */
export default function TripWaypointPage() {
  const { bindTap, bindBack, back } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const trip = useDidiStore((s) => s.trip);
  const addresses = useDidiStore((s) => s.addresses);
  const addWaypoint = useDidiStore((s) => s.addWaypoint);

  const [query, setQuery] = React.useState('');
  const list = addresses
    .filter((a) => a.label === '历史')
    .filter((a) => a.name !== trip.to && !trip.waypoints.includes(a.name))
    .filter((a) => !query || a.name.includes(query));

  return (
    <div className="flex flex-col h-full bg-app-bg">
      {/* 顶部输入卡 */}
      <div className="bg-app-surface px-3 pt-2 pb-2.5 shrink-0">
        <div className="flex items-start gap-1">
          <button {...bindBack()} className="bg-transparent border-none p-1 mt-1 text-app-text" aria-label="返回">
            <IcNavBack size={22} />
          </button>
          <div className="flex-1">
            {/* ① 途经点输入 */}
            <div className="flex items-center rounded-lg px-3 py-2 mb-1.5" style={{ background: '#F5F6FA' }}>
              <span
                className="w-4 h-4 rounded-full text-[10px] leading-4 text-center text-white mr-2 shrink-0"
                style={{ background: C.blue }}
              >
                1
              </span>
              <input
                data-action="trip.waypoint.input"
                data-action-type="input"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="请输入途经点"
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-app-text"
              />
            </div>
            {/* ② 固定终点行 */}
            <div className="flex items-center rounded-lg px-3 py-2" style={{ background: '#F5F6FA' }}>
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
              <span className="text-[15px] text-app-text-muted">{trip.to || '青石桥-地铁站'}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center mt-2 pl-8">
          <span className="text-[12px] text-app-text flex-1">
            <span className="rounded-full border border-app-border px-2 py-0.5 mr-1.5">+ 途经点</span>
            <span className="text-app-text-muted">可再添加1个</span>
          </span>
          <button
            {...bindTap({ kind: 'action', id: 'trip.waypoint.done' }, { onTrigger: () => back() })}
            className="rounded-full px-4 py-1.5 border-none text-[14px] text-white"
            style={{ background: C.orange }}
          >
            完成
          </button>
        </div>
      </div>

      {/* 为你推荐 */}
      <div
        className="flex-1 overflow-y-auto bg-app-surface mt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="px-4 pt-2.5 pb-1 text-[13px]" style={{ color: C.orangeDeep }}>为你推荐</div>
        {list.map((a, i) => (
          <button
            key={a.id}
            {...bindTap(
              { kind: 'action', id: 'trip.waypoint.pick' },
              {
                onTrigger: () => {
                  addWaypoint(a.name);
                  back();
                },
              },
            )}
            className={`flex items-center w-full px-4 py-3 bg-transparent border-none text-left ${
              i === list.length - 1 ? '' : 'border-b border-app-border'
            }`}
          >
            <span className="text-app-text-muted mr-3">📍</span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-[15px] text-app-text truncate">{a.name}</span>
                {a.metro && (
                  <span
                    className="text-[10px] px-1 rounded shrink-0 border"
                    style={{ color: C.blue, borderColor: C.blue }}
                  >
                    {a.metro}
                  </span>
                )}
              </span>
              <span className="block text-[12px] text-app-text-muted truncate mt-0.5">{a.address}</span>
            </span>
            <span className="text-[12px] text-app-text-muted ml-2 shrink-0">{a.distanceKm}km</span>
          </button>
        ))}
        <div className="flex justify-center py-4">
          <button
            onClick={() => toast('语音输入暂未开放')}
            className="rounded-full px-4 py-2 text-[13px] border-none text-app-text"
            style={{ background: '#FFEFE5' }}
          >
            🎤 点我说地址
          </button>
        </div>
      </div>
    </div>
  );
}
