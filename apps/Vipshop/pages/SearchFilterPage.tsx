import React, { useState } from 'react';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, VIP } from '../components/ui';
import { FILTER_GROUPS } from '../constants';

export default function SearchFilterPage() {
  const { bindTap } = useVipshopGestures();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (opt: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="筛选" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="filter-body" data-scroll-direction="vertical">
        {FILTER_GROUPS.map((group) => (
          <div key={group.id} className="px-3 pt-3 pb-1">
            <div className="text-[14px] font-semibold text-[#222222] mb-2">{group.label}</div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((opt) => {
                const on = selected.has(opt);
                return (
                  <button
                    key={opt}
                    {...bindTap({ kind: 'action', id: 'searchFilter.option.toggle' }, {
                      params: { option: opt },
                      onTrigger: () => toggle(opt),
                    })}
                    className="text-[12px] rounded-full px-3 py-1.5 border cursor-pointer"
                    style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#333', borderColor: '#EEE', background: '#F8F8F8' }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="h-3" />
      </div>

      {/* 底部固定:重置 | 确认 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 h-14 gap-3">
        <button
          {...bindTap({ kind: 'action', id: 'searchFilter.reset.submit' }, { onTrigger: () => setSelected(new Set()) })}
          className="text-[14px] rounded-full px-6 py-2 border cursor-pointer bg-white"
          style={{ color: '#666', borderColor: '#DDD' }}
        >
          重置
        </button>
        <button
          {...bindTap('searchFilter.confirm-open')}
          className="flex-1 text-[15px] rounded-full py-2 border-none cursor-pointer text-white font-semibold"
          style={{ background: VIP.primary }}
        >
          确认{selected.size > 0 ? `(${selected.size})` : ''}
        </button>
      </div>
    </div>
  );
}
