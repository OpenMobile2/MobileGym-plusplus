import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, CheckCircle, C } from '../components/ui';
import type { DidiOrder } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
const monthKey = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}年${pad(d.getMonth() + 1)}月`;
};
const mdhm = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${pad(d.getMonth() + 1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CATEGORY_TABS = ['网约车', '香港打车', '海外打车', '自动驾驶', '包车'];

/** 开发票·选择行程。证据:frames/recC_invoice_pick.jpg */
export default function InvoiceEntryPage() {
  const { bindTap } = useDidiGestures();
  const orders = useDidiStore((s) => s.orders);
  const invoiceSelected = useDidiStore((s) => s.invoiceSelected);
  const toggleInvoiceTrip = useDidiStore((s) => s.toggleInvoiceTrip);
  const toast = useDidiStore((s) => s.toast);

  const rows = orders.filter((o) => o.status === 'completed' && !o.invoiced);
  const groups: { month: string; items: DidiOrder[] }[] = [];
  for (const o of rows) {
    const m = monthKey(o.createdAt);
    const g = groups.find((x) => x.month === m);
    if (g) g.items.push(o);
    else groups.push({ month: m, items: [o] });
  }

  const selCount = invoiceSelected.length;
  const sum = rows
    .filter((o) => invoiceSelected.includes(o.id))
    .reduce((acc, o) => acc + o.fare, 0);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title="开发票"
        right={
          <button
            onClick={() => toast('该功能暂未开放')}
            className="text-[12px] text-app-text bg-transparent border-none whitespace-nowrap"
          >
            开票记录
          </button>
        }
      />
      {/* 品类 tab */}
      <div className="shrink-0 bg-app-surface border-b border-app-border px-3 flex items-center gap-4 overflow-x-auto">
        {CATEGORY_TABS.map((t, i) =>
          i === 0 ? (
            <div key={t} className="py-2.5 shrink-0 relative">
              <span className="text-[14px] font-semibold" style={{ color: C.orangeDeep }}>{t}</span>
              <span
                className="absolute left-1/2 -translate-x-1/2 bottom-0 rounded-full"
                style={{ width: 24, height: 3, background: C.orange }}
              />
            </div>
          ) : (
            <button
              key={t}
              {...bindTap(
                { kind: 'action', id: 'invoice.entry.tab' },
                { params: { value: t }, onTrigger: () => toast('该品类暂无可开票行程') },
              )}
              className="py-2.5 shrink-0 text-[14px] text-app-text-muted bg-transparent border-none"
            >
              {t}
            </button>
          ),
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3" data-scroll-container="main" data-scroll-direction="vertical">
        {groups.length === 0 && (
          <div className="text-center text-[13px] text-app-text-muted pt-20">暂无可开票行程</div>
        )}
        {groups.map((g) => (
          <div key={g.month} className="mb-3">
            <div className="flex items-center px-1 pb-1.5">
              <span className="text-[14px] font-semibold text-app-text">{g.month}</span>
              <span className="flex-1" />
              <button
                {...bindTap(
                  { kind: 'action', id: 'invoice.entry.trip.toggle' },
                  {
                    params: { value: g.month },
                    onTrigger: () => {
                      const allSelected = g.items.every((item) => invoiceSelected.includes(item.id));
                      g.items.forEach((item) => {
                        if (allSelected || !invoiceSelected.includes(item.id)) {
                          toggleInvoiceTrip(item.id);
                        }
                      });
                    },
                  },
                )}
                data-testid={`didi-invoice-month-toggle-${g.month}`}
                className="text-[12px] text-app-text-muted bg-transparent border-none"
              >
                {g.items.every((item) => invoiceSelected.includes(item.id)) ? '取消全选' : '本月全选'}
              </button>
            </div>
            <Card>
              {g.items.map((o, i) => (
                <button
                  key={o.id}
                  {...bindTap(
                    { kind: 'action', id: 'invoice.entry.trip.toggle' },
                    { params: { value: o.id }, onTrigger: () => toggleInvoiceTrip(o.id) },
                  )}
                  className={`w-full flex items-center px-3.5 py-3 bg-transparent border-none text-left ${
                    i < g.items.length - 1 ? 'border-b border-app-border' : ''
                  }`}
                >
                  <CheckCircle checked={invoiceSelected.includes(o.id)} />
                  <div className="flex-1 min-w-0 ml-3">
                    <div className="text-[14px] text-app-text font-medium">
                      {o.carType} <span className="font-normal text-app-text-muted text-[12px]">{mdhm(o.createdAt)}</span>
                    </div>
                    <div className="text-[12px] text-app-text-muted mt-1 truncate">
                      {o.from} → {o.to}
                    </div>
                  </div>
                  <span className="shrink-0 text-[15px] font-semibold text-app-text ml-2">
                    ¥{o.fare.toFixed(2)}
                  </span>
                </button>
              ))}
            </Card>
          </div>
        ))}
      </div>

      {/* 底部 bar */}
      <div className="shrink-0 bg-app-surface border-t border-app-border px-4 py-3 flex items-center">
        <div className="flex-1 text-[13px] text-app-text">
          已选{selCount}笔 合计 <span className="text-[17px] font-bold">¥{sum.toFixed(2)}</span>
        </div>
        {selCount > 0 ? (
          <button
            {...bindTap('invoice.form.open')}
            className="px-8 py-2.5 rounded-full text-[15px] font-medium text-white border-none"
            style={{ background: C.orange }}
          >
            去开票
          </button>
        ) : (
          <button
            onClick={() => toast('请先选择行程')}
            className="px-8 py-2.5 rounded-full text-[15px] font-medium text-white border-none"
            style={{ background: '#FFC7A8' }}
          >
            去开票
          </button>
        )}
      </div>
    </div>
  );
}
