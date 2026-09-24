import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, useToast } from '../components/ui';

/** 报销凭证(spec orders.invoice)。待开/进行中/已完成 tab;选订单+提交开票→toast。 */
const TABS = [{ id: 'todo', label: '待开票' }, { id: 'doing', label: '开票中' }, { id: 'done', label: '已完成' }];

export default function OrdersInvoicePage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const orders = useCtripStore((s) => s.orders);
  const [tab, setTab] = React.useState('todo');
  const [picked, setPicked] = React.useState<string[]>([]);
  const [title, setTitle] = React.useState('个人');

  const billable = orders.filter((o) => o.status === 'completed' || o.status === 'upcoming');
  const toggle = (id: string) => setPicked((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]));

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="报销凭证" />
      <div className="shrink-0 bg-white flex border-b border-[#F0F0F0]">
        {TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'invoice.tab.select.todo' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
            className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'todo' ? (
          <>
            <div className="bg-white mt-2">
              <div className="px-4 py-2 text-[13px] text-[#999999]">选择需开票订单</div>
              {billable.map((o) => (
                <button key={o.id} onClick={() => toggle(o.id)} className="w-full flex items-center justify-between px-4 py-3 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left">
                  <div className="min-w-0"><div className="text-[14px] line-clamp-1">{o.title}</div><div className="text-[11px] text-[#999999]">{o.date} · ¥{o.price}</div></div>
                  <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center shrink-0 ${picked.includes(o.id) ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
                </button>
              ))}
            </div>
            <div className="bg-white mt-2 px-4 py-2">
              <div className="text-[13px] text-[#999999] py-2">开票类型</div>
              <div className="flex gap-2">
                {['个人', '企业'].map((t) => (
                  <button key={t} onClick={() => setTitle(t)} className={`text-[13px] rounded-full px-4 py-1.5 border cursor-pointer ${title === t ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-[#F7F8FA] text-[#555555] border-transparent'}`}>{t}抬头</button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="py-16 text-center text-[14px] text-[#999999]">暂无{TABS.find((t) => t.id === tab)?.label}凭证</div>
        )}
      </div>

      {tab === 'todo' && (
        <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 py-2">
          <button
            {...bindTap({ kind: 'action', id: 'invoice.apply.submit' }, { onTrigger: () => showToast('开票申请已提交') })}
            disabled={picked.length === 0}
            className="w-full py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer disabled:opacity-50"
          >提交开票({picked.length})</button>
        </div>
      )}
      {toast}
    </div>
  );
}
