import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { Card, C, TopBar } from '../components/ui';
import type { DidiOrder } from '../types';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { matchesOrderServiceFilters, matchesOrderStatusFilter } from '../orderFilters';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtOrderTime = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const STATUS_TEXT: Record<DidiOrder['status'], string> = {
  completed: '已完成',
  canceled: '已取消',
  toDepart: '待出发',
  unpaid: '待支付',
};

/** 行程 Tab：我的行程(空态留白) / 全部订单。证据:微信图片_20260727231407 + s13~s16 */
export default function TripsListPage({ standalone = false }: { standalone?: boolean }) {
  const { bindTap } = useDidiGestures();
  const orders = useDidiStore((s) => s.orders);
  const tripsSection = useDidiStore((s) => s.tripsSection) ?? 'mine';
  const tripsTab = useDidiStore((s) => s.tripsTab);
  const tripsFilterTypes = useDidiStore((s) => s.tripsFilterTypes);
  const setTripsSection = useDidiStore((s) => s.setTripsSection);
  const setTripsTab = useDidiStore((s) => s.setTripsTab);
  const openRate = useDidiStore((s) => s.openRate);
  const chooseDest = useDidiStore((s) => s.chooseDest);
  const setInvoiceSelected = useDidiStore((s) => s.setInvoiceSelected);
  const toast = useDidiStore((s) => s.toast);
  const s = useDidiStrings();
  const tabs: { id: typeof tripsTab; label: string }[] = [
    { id: 'all', label: s.all },
    { id: 'completed', label: s.completed },
    { id: 'unrated', label: s.unrated },
    { id: 'toDepart', label: s.toDepart },
    { id: 'unpaid', label: s.unpaid },
    { id: 'canceled', label: s.canceled },
  ];

  const filtered = orders.filter((o) => {
    if (!matchesOrderStatusFilter(o, tripsTab)) return false;
    if (!matchesOrderServiceFilters(o, tripsFilterTypes)) return false;
    return true;
  });

  const mineActive = !standalone && tripsSection === 'mine';
  const recentMine = [...orders]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <div
      className="flex flex-col h-full bg-app-bg"
      data-status-bar-foreground="dark"
      data-testid="didi-trips-page"
      data-page={standalone ? 'orders' : 'trips'}
      data-automation-label={standalone ? '全部订单' : '行程'}
      aria-label={standalone ? '全部订单' : '行程'}
    >
      <h1 className="sr-only" data-testid="didi-trips-title" data-automation-label={standalone ? '全部订单' : '行程'}>
        {standalone ? s.allOrders : s.tabTrips}
      </h1>
      {standalone && <TopBar title={s.allOrders} />}
      {/* 顶部：我的行程 | 全部订单 */}
      <div className="shrink-0 px-4 pt-2">
        <div className="flex items-end">
          {!standalone && <button
            type="button"
            data-testid="didi-trips-section-mine"
            data-automation-label="我的行程"
            {...bindTap(
              { kind: 'action', id: 'trips.list.section' },
              { params: { value: 'mine' }, onTrigger: () => setTripsSection('mine') },
            )}
            className="bg-transparent border-none p-0 mr-5 pb-0.5 relative"
            style={{
              fontSize: mineActive ? 21 : 17,
              fontWeight: mineActive ? 700 : 400,
              color: mineActive ? 'var(--app-text, #1a1a1a)' : 'var(--app-text-muted, #8a8a8a)',
            }}
          >
            {s.tripsTitle}
            {mineActive && (
              <span
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{ bottom: -6, width: 28, height: 3, background: C.orange }}
              />
            )}
          </button>}
          {!standalone && <button
            type="button"
            data-testid="didi-trips-section-all"
            data-automation-label="全部订单"
            {...bindTap(
              { kind: 'action', id: 'trips.list.section' },
              { params: { value: 'all' }, onTrigger: () => setTripsSection('all') },
            )}
            className="bg-transparent border-none p-0 pb-0.5 relative"
            style={{
              fontSize: mineActive ? 17 : 21,
              fontWeight: mineActive ? 400 : 700,
              color: mineActive ? 'var(--app-text-muted, #8a8a8a)' : 'var(--app-text, #1a1a1a)',
            }}
          >
            {s.allOrders}
            {!mineActive && (
              <span
                className="absolute left-1/2 -translate-x-1/2 rounded-full"
                style={{ bottom: -6, width: 28, height: 3, background: C.orange }}
              />
            )}
          </button>}
          <span className="flex-1" />
          {!mineActive && (
            <>
              <button
                {...bindTap('trips.filter.open')}
                className="flex flex-col items-center bg-transparent border-none mr-3"
                aria-label={s.filter}
              >
                <span className="text-[16px] leading-none">▽</span>
                <span className="text-[10px] text-app-text mt-0.5">{s.filter}</span>
              </button>
              <button
                {...bindTap('invoice.fromTrips', { beforeTrigger: () => setInvoiceSelected([]) })}
                className="flex flex-col items-center bg-transparent border-none"
                aria-label={s.invoice}
              >
                <span className="text-[16px] leading-none">🧾</span>
                <span className="text-[10px] text-app-text mt-0.5">{s.invoice}</span>
              </button>
            </>
          )}
        </div>

        {!mineActive && (
          <div className="flex items-center gap-2.5 mt-4 overflow-x-auto pb-1">
            {tabs.map((t) => {
              const active = tripsTab === t.id;
              return (
                <button
                  key={t.id}
                  {...bindTap(
                    { kind: 'action', id: 'trips.list.tab' },
                    { params: { value: t.id }, onTrigger: () => setTripsTab(t.id) },
                  )}
                  className="shrink-0 px-4 py-1.5 rounded-full text-[14px] border-none"
                  style={{
                    background: active ? '#FFEFE5' : '#F0F1F5',
                    color: active ? C.orangeDeep : '#555',
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {mineActive ? (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical" data-testid="didi-trips-mine">
          {recentMine.length === 0 ? (
            <div className="flex flex-col items-center px-8" style={{ paddingTop: '18%' }} data-testid="didi-trips-mine-empty">
              <div className="text-[26px] font-bold text-app-text tracking-wide">{s.tripsEmptyTitle}</div>
              <div className="text-[14px] text-app-text-muted mt-3 text-center leading-relaxed">{s.tripsEmptyHint}</div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {recentMine.map((o) => (
                <div
                  key={o.id}
                  {...bindTap('order.detail.open', { beforeTrigger: () => openRate(o.id) })}
                  className="bg-app-surface rounded-xl p-3.5"
                >
                  <div className="flex items-center">
                    <span className="text-[11px] text-white px-1.5 py-0.5 rounded shrink-0" style={{ background: C.orange }}>{o.carType}</span>
                    <span className="flex-1" />
                    <span className="text-[13px] text-app-text-muted">{STATUS_TEXT[o.status]}</span>
                  </div>
                  <div className="flex mt-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center text-[14px] text-app-text mb-1.5">
                        <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
                        <span className="truncate">起点:{o.from}</span>
                      </div>
                      <div className="flex items-center text-[14px] text-app-text">
                        <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
                        <span className="truncate">终点:{o.to}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-[16px] font-semibold text-app-text ml-2">¥{o.fare.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center mt-3">
                    <span className="flex-1" />
                    <button
                      {...bindTap('car.rebookFromTrips', { stopPropagation: true, beforeTrigger: () => chooseDest(o.from) })}
                      className="text-[13px] px-3 py-1.5 rounded-full bg-transparent border border-app-border text-app-text mr-2"
                    >
                      一键返程
                    </button>
                    <button
                      {...bindTap('car.rebookFromTrips', { stopPropagation: true, beforeTrigger: () => chooseDest(o.to) })}
                      className="text-[13px] px-3 py-1.5 rounded-full bg-transparent"
                      style={{ border: `1px solid ${C.orange}`, color: C.orangeDeep }}
                    >
                      再来一单
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-3 pt-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
          <Card className="flex items-center px-3 py-2.5 mb-3">
            <span className="text-[14px] mr-2">🧾</span>
            <span className="text-[13px] text-app-text flex-1">查看出行消费</span>
            <button
              onClick={() => toast('该功能暂未开放')}
              className="text-[12px] px-3 py-1 rounded-full bg-transparent"
              style={{ border: `1px solid ${C.orange}`, color: C.orangeDeep }}
            >
              去查看
            </button>
          </Card>

          {filtered.length === 0 ? (
            <button
              onClick={() => toast('已重新加载')}
              className="w-full flex flex-col items-center pt-24 bg-transparent border-none"
            >
              <svg viewBox="0 0 96 96" width="88" height="88">
                <rect x="30" y="24" width="44" height="26" rx="6" fill="#C9CCD4" />
                <rect x="60" y="30" width="8" height="6" rx="1" fill="#EDEFF3" />
                <path d="M30 30 c-10 2 -14 16 -6 22 l6 -4 Z" fill="#B4B8C2" />
                <rect x="50" y="50" width="4" height="30" rx="1" fill="#B4B8C2" />
                <rect x="50" y="62" width="4" height="4" fill={C.orange} />
                <ellipse cx="52" cy="84" rx="14" ry="3" fill="#E4E6EB" />
              </svg>
              <div className="text-[15px] text-app-text mt-4">{s.emptyOrders}</div>
              <div className="text-[13px] text-app-text-muted mt-1.5">{s.reloadHint}</div>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((o) => (
                <div
                  key={o.id}
                  {...bindTap('order.detail.open', { beforeTrigger: () => openRate(o.id) })}
                  className="bg-app-surface rounded-xl p-3.5"
                >
                  <div className="flex items-center">
                    <span
                      className="text-[11px] text-white px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: C.orange }}
                    >
                      {o.carType}
                    </span>
                    <span className="flex-1" />
                    <span className="text-[13px] text-app-text-muted">{STATUS_TEXT[o.status]}</span>
                  </div>
                  <div className="flex mt-2.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center text-[14px] text-app-text mb-1.5">
                        <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
                        <span className="truncate">起点:{o.from}</span>
                      </div>
                      <div className="flex items-center text-[14px] text-app-text">
                        <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
                        <span className="truncate">终点:{o.to}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-[16px] font-semibold text-app-text ml-2">
                      ¥{o.fare.toFixed(2)}
                    </div>
                  </div>
                  <div className="text-[12px] text-app-text-muted mt-2">下单时间:{fmtOrderTime(o.createdAt)}</div>
                  <div className="flex items-center mt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toast('该功能暂未开放'); }}
                      className="text-[13px] text-app-text-muted bg-transparent border-none px-0"
                    >
                      更多
                    </button>
                    <span className="flex-1" />
                    <button
                      {...bindTap('invoice.fromTrips', {
                        stopPropagation: true,
                        beforeTrigger: () => setInvoiceSelected(
                          o.status === 'completed' && !o.invoiced ? [o.id] : [],
                        ),
                      })}
                      className="text-[13px] px-3 py-1.5 rounded-full bg-transparent border border-app-border text-app-text mr-2"
                    >
                      开发票
                    </button>
                    <button
                      {...bindTap('car.rebookFromTrips', {
                        stopPropagation: true,
                        beforeTrigger: () => chooseDest(o.from),
                      })}
                      className="text-[13px] px-3 py-1.5 rounded-full bg-transparent border border-app-border text-app-text mr-2"
                    >
                      一键返程
                    </button>
                    <button
                      {...bindTap('car.rebookFromTrips', {
                        stopPropagation: true,
                        beforeTrigger: () => chooseDest(o.to),
                      })}
                      className="text-[13px] px-3 py-1.5 rounded-full bg-transparent"
                      style={{ border: `1px solid ${C.orange}`, color: C.orangeDeep }}
                    >
                      再来一单
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={() => toast('该功能暂未开放')}
                className="text-[13px] text-app-text-muted text-center bg-transparent border-none py-2"
              >
                轻按查看26年06月订单
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
