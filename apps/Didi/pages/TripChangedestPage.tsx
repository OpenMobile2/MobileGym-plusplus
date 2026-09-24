import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { C, TopBar } from '../components/ui';

/** 修改终点 —— 无直接证据,照 dest.search 简化 */
export default function TripChangedestPage() {
  const { bindTap, back } = useDidiGestures();
  const addresses = useDidiStore((s) => s.addresses);
  const changeDest = useDidiStore((s) => s.changeDest);

  const [query, setQuery] = React.useState('');
  const list = addresses.filter((a) => !query || a.name.includes(query));

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title="修改终点" />
      <div className="bg-app-surface px-3 py-2 shrink-0">
        <div className="flex items-center rounded-lg px-3 py-2" style={{ background: '#F5F6FA' }}>
          <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
          <input
            data-action="trip.changeDest.input"
            data-action-type="input"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="请输入新终点"
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-app-text"
          />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto bg-app-surface mt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {list.map((a, i) => (
          <button
            key={a.id}
            {...bindTap(
              { kind: 'action', id: 'trip.changeDest.done' },
              {
                onTrigger: () => {
                  changeDest(a.name);
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
        {list.length === 0 && (
          <div className="px-4 py-8 text-center text-[13px] text-app-text-muted">未找到相关地点</div>
        )}
      </div>
    </div>
  );
}
