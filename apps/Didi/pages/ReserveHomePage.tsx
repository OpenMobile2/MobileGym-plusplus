import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, OrangeBtn, C } from '../components/ui';

/** 预约用车(预约打车/接送机/包时用车) —— 证据 s37、s40、s41、s42 */

const TIME_OPTIONS = ['今天 17:00', '今天 17:30', '今天 18:00', '明天 08:00'];
const AIRPORTS = ['云江国际机场T2', '云江国际机场T1'];

const GUARANTEES: Array<[string, string]> = [
  ['无车必赔', '无应答赔8折券'],
  ['准时保障', '全力确保准点出发'],
  ['免费等待', '等待乘客6分钟'],
  ['迟到必赔', '司机迟到赔9折券'],
  ['爽约必赔', '司机爽约赔7折券'],
  ['车费卫士', '8大情况极速处理'],
];

export default function ReserveHomePage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const reserveTab = useDidiStore((s) => s.reserveTab);
  const setReserveTab = useDidiStore((s) => s.setReserveTab);
  const reserveTime = useDidiStore((s) => s.reserveTime);
  const setReserveTime = useDidiStore((s) => s.setReserveTime);

  const [timeListOpen, setTimeListOpen] = React.useState(false);
  const [airportListOpen, setAirportListOpen] = React.useState(false);
  const [airport, setAirport] = React.useState<string | null>(null);
  const [airportSub, setAirportSub] = React.useState<'pickup' | 'dropoff'>('dropoff');
  const [charterSub, setCharterSub] = React.useState<'cn' | 'abroad'>('cn');
  const [flightNo, setFlightNo] = React.useState('');

  const heroTitle = reserveTab === 'airport' ? '滴滴接送机' : reserveTab === 'charter' ? '滴滴包车' : '滴滴预约打车';

  return (
    <div className="flex flex-col h-full" style={{ background: '#EFF3F8' }} data-status-bar-foreground="dark">
      {/* 顶部蓝天插画区 */}
      <div style={{ background: 'linear-gradient(180deg,#CFE3F7,#E8F1FB)' }} className="shrink-0">
        <TopBar
          transparent
          right={(
            <button
              onClick={() => toast('预约用车订单暂未开放')}
              className="text-[12px] text-app-text bg-white/80 rounded-full px-2.5 py-1 border-none"
            >
              订单
            </button>
          )}
        />
        <div className="flex items-center px-5 pb-5 pt-1">
          <div className="flex-1">
            <div className="text-[24px] font-bold leading-snug" style={{ color: '#2A3B66' }}>
              {heroTitle}
              <br />
              省时又省心
            </div>
          </div>
          {/* 小车+表盘插画 */}
          <svg width="96" height="64" viewBox="0 0 96 64">
            <ellipse cx="52" cy="40" rx="42" ry="22" fill="#DFEBF7" />
            <circle cx="40" cy="38" r="18" fill="#F3F8FD" stroke="#B9CFE8" strokeWidth="2" />
            <path d="M40 26v12l8 5" stroke="#4A6DA8" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <rect x="58" y="26" width="30" height="13" rx="6" fill={C.orange} />
            <rect x="63" y="20" width="17" height="10" rx="4" fill="#FF9A66" />
            <circle cx="66" cy="41" r="4" fill="#2B2F36" />
            <circle cx="82" cy="41" r="4" fill="#2B2F36" />
          </svg>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 pb-6 -mt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 白卡:三 tab */}
        <div className="bg-app-surface rounded-xl overflow-hidden">
          <div className="flex">
            {([['reserve', '预约打车'], ['airport', '接送机'], ['charter', '包时用车']] as const).map(([k, label]) => (
              <button
                key={k}
                {...bindTap({ kind: 'action', id: 'reserve.home.tab' }, { onTrigger: () => setReserveTab(k) })}
                className="flex-1 py-3 text-center border-none bg-transparent"
              >
                <span
                  className={`text-[15px] ${reserveTab === k ? 'font-bold text-app-text' : 'text-app-text-muted'}`}
                >
                  {label}
                </span>
                {reserveTab === k && (
                  <div className="mx-auto mt-1 rounded-full" style={{ width: 24, height: 3, background: C.orange }} />
                )}
              </button>
            ))}
          </div>

          {/* ---- 预约打车 ---- */}
          {reserveTab === 'reserve' && (
            <div className="px-4 pb-4">
              <button
                {...bindTap({ kind: 'action', id: 'reserve.home.time' }, { onTrigger: () => setTimeListOpen((v) => !v) })}
                className="flex items-center w-full py-3.5 bg-transparent border-none text-left border-b border-app-border"
              >
                <span className="text-[15px] mr-2">🕐</span>
                <span className="flex-1 text-[16px] font-semibold text-app-text">选择用车时间</span>
                <span className="text-[14px] text-app-text-muted mr-1">{reserveTime ?? '现在'}</span>
                <span className="text-app-text-muted">›</span>
              </button>
              {timeListOpen && (
                <div className="rounded-lg my-2" style={{ background: '#F7F8FA' }}>
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      {...bindTap({ kind: 'action', id: 'reserve.home.time' }, {
                        onTrigger: () => { setReserveTime(t); setTimeListOpen(false); },
                      })}
                      className="flex items-center w-full px-3 py-2.5 bg-transparent border-none text-left"
                    >
                      <span className="flex-1 text-[14px] text-app-text">{t}</span>
                      {reserveTime === t && <span style={{ color: C.orange }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={() => toast('该功能暂未开放')}
                className="flex items-center w-full py-3.5 bg-transparent border-none text-left"
              >
                <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
                <span className="flex-1 text-[14px] text-app-text truncate">
                  你将从 <span style={{ color: C.green }} className="font-medium">云溪苑-东北门(邻里便民超市旁)</span> 上车
                </span>
                <span className="text-app-text-muted">›</span>
              </button>
              <OrangeBtn bind={bindTap('car.fromReserve')}>立即选车</OrangeBtn>
            </div>
          )}

          {/* ---- 接送机 ---- */}
          {reserveTab === 'airport' && (
            <div className="px-4 pb-4">
              <div className="flex rounded-lg p-0.5 mb-3" style={{ background: '#F2F3F7' }}>
                {([['pickup', '去机场接您'], ['dropoff', '送您去机场']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setAirportSub(k)}
                    className="flex-1 py-2 rounded-lg border-none text-[14px]"
                    style={airportSub === k
                      ? { background: '#fff', color: C.orangeDeep, fontWeight: 600 }
                      : { background: 'transparent', color: '#666' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => toast('该功能暂未开放')}
                className="flex items-center w-full py-3 bg-transparent border-none text-left border-b border-app-border"
              >
                <span className="text-[15px] mr-2">🕐</span>
                <span className="flex-1 text-[15px] font-semibold text-app-text">现在出发</span>
                <span className="text-app-text-muted">›</span>
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'reserve.home.airport' }, { onTrigger: () => setAirportListOpen((v) => !v) })}
                className="flex items-center w-full py-3.5 bg-transparent border-none text-left"
              >
                <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
                <span className={`flex-1 text-[17px] font-bold ${airport ? 'text-app-text' : 'text-app-text-muted'}`}>
                  {airport ?? '选择要去的机场'}
                </span>
                <span className="text-app-text-muted">›</span>
              </button>
              {airportListOpen && (
                <div className="rounded-lg mb-2" style={{ background: '#F7F8FA' }}>
                  {AIRPORTS.map((a) => (
                    <button
                      key={a}
                      {...bindTap({ kind: 'action', id: 'reserve.home.airport' }, {
                        onTrigger: () => { setAirport(a); setAirportListOpen(false); },
                      })}
                      className="flex items-center w-full px-3 py-2.5 bg-transparent border-none text-left"
                    >
                      <span className="flex-1 text-[14px] text-app-text">{a}</span>
                      {airport === a && <span style={{ color: C.orange }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
              <input
                value={flightNo}
                onChange={(e) => setFlightNo(e.target.value)}
                placeholder="输入航班号 例:CA8371"
                className="w-full h-11 rounded-lg px-3 mb-3 text-[15px] text-app-text outline-none border-none"
                style={{ background: '#F5F6FA' }}
              />
              <OrangeBtn bind={bindTap('car.fromReserve')}>立即选车</OrangeBtn>
              <div className="flex justify-center gap-4 mt-2 text-[12px] text-app-text-muted">
                <span>✓ 提前寻找车辆</span>
                <span>✓ 实时同步航班动态</span>
              </div>
              <div className="text-[14px] font-semibold text-app-text text-center mt-4 mb-2">送机安心服务</div>
              <div className="flex gap-2">
                {[['行程关怀', '7×24h响应'], ['定制服务', '豪华车尊享'], ['提拿行李', '专豪车尊享']].map(([t, d]) => (
                  <div key={t} className="flex-1 rounded-lg py-2.5 text-center" style={{ background: '#F7F8FA' }}>
                    <div className="text-[13px] font-medium text-app-text">{t}</div>
                    <div className="text-[11px] text-app-text-muted mt-0.5">{d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ---- 包时用车 ---- */}
          {reserveTab === 'charter' && (
            <div className="px-4 pb-4">
              <div className="flex rounded-lg p-0.5 mb-3" style={{ background: '#F2F3F7' }}>
                {([['cn', '国内(含港澳台)'], ['abroad', '海外']] as const).map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setCharterSub(k)}
                    className="flex-1 py-2 rounded-lg border-none text-[14px]"
                    style={charterSub === k
                      ? { background: '#fff', color: C.orangeDeep, fontWeight: 600 }
                      : { background: 'transparent', color: '#666' }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => toast('该功能暂未开放')}
                className="flex items-center w-full py-3 bg-transparent border-none text-left border-b border-app-border"
              >
                <span className="text-[12px] text-app-text-muted mr-3 shrink-0">起终点</span>
                <span className="flex-1 text-[15px] font-semibold text-app-text truncate">
                  云江市 云溪苑-东北门(邻里便民超市旁)
                </span>
                <span className="text-app-text-muted">›</span>
              </button>
              <button
                onClick={() => toast('该功能暂未开放')}
                className="flex items-center w-full py-3.5 bg-transparent border-none text-left"
              >
                <span className="text-[12px] text-app-text-muted mr-3 shrink-0">出发时间</span>
                <span className="flex-1 text-[15px] font-semibold text-app-text">7月5日 13:50</span>
                <span className="text-[15px] font-semibold text-app-text mr-1">包车8小时</span>
                <span className="text-app-text-muted">›</span>
              </button>
              <OrangeBtn bind={bindTap('car.fromReserve')}>立即选车</OrangeBtn>
              <div className="flex items-center justify-center gap-1 mt-2 text-[12px] text-app-text-muted">
                <span style={{ color: C.blue }}>🛡 平台保障</span>
                <span>严选司机 · 透明价格 · 安心出行</span>
              </div>
              <div className="text-[14px] font-semibold text-app-text mt-4 mb-2">热门包车行程</div>
              <div className="flex gap-2">
                {[['东湖绿道一日游', '¥299起'], ['黄鹤楼半日游', '¥199起']].map(([t, p]) => (
                  <button
                    key={t}
                    onClick={() => toast('该功能暂未开放')}
                    className="flex-1 rounded-lg overflow-hidden border-none p-0 text-left bg-transparent"
                  >
                    <svg viewBox="0 0 160 80" className="w-full block">
                      <rect width="160" height="80" fill="#DCEAF7" />
                      <ellipse cx="40" cy="72" rx="46" ry="18" fill="#BFD8EE" />
                      <path d="M96 56 L116 26 L136 56 Z" fill="#8FB7DE" />
                      <path d="M112 56 L130 32 L152 56 Z" fill="#6E9CCB" />
                      <circle cx="34" cy="24" r="10" fill="#FFD98A" />
                    </svg>
                    <div className="px-2 py-1.5" style={{ background: '#F7F8FA' }}>
                      <div className="text-[13px] font-medium text-app-text">{t}</div>
                      <div className="text-[12px]" style={{ color: C.orangeDeep }}>{p}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 四步流程 */}
        <div className="bg-app-surface rounded-xl mt-2.5 px-3 py-3 flex items-center justify-between">
          {['发单预约', '司机接单', '准时接驾出发', '行程结束'].map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <span className="text-[12px]" style={{ color: C.orange }}>→</span>}
              <span className="text-[12px] text-app-text">{s}</span>
            </React.Fragment>
          ))}
        </div>

        {/* 预约保障(仅预约打车 tab 展示,照 s37) */}
        {reserveTab === 'reserve' && (
          <div className="bg-app-surface rounded-xl mt-2.5 px-3 py-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[15px] font-bold italic" style={{ color: C.orangeDeep }}>预约保障</span>
              <span className="text-[12px] text-app-text-muted">敢约敢赔 省时省心 ›</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {GUARANTEES.map(([t, d]) => (
                <div key={t} className="rounded-lg px-2 py-2.5" style={{ background: '#F7F8FA' }}>
                  <div className="text-[13px] font-semibold text-app-text">{t}</div>
                  <div className="text-[11px] text-app-text-muted mt-0.5">{d}</div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-3 text-[12px] text-app-text-muted mt-3">
              <button onClick={() => toast('该功能暂未开放')} className="bg-transparent border-none text-app-text-muted text-[12px]">联系客服</button>
              <span>|</span>
              <button onClick={() => toast('该功能暂未开放')} className="bg-transparent border-none text-app-text-muted text-[12px]">取消规则</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
