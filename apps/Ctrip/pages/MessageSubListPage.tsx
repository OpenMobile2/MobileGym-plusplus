import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar } from '../components/ui';

/** 消息子列表：按 group 过滤通知。 */
export default function MessageSubListPage() {
  const s = useCtripStrings();
  const [sp] = useSearchParams();
  const group = sp.get('group') || '';
  const { bindTap } = useCtripGestures();
  const notifications = useCtripStore((st) => st.notifications);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const list = notifications.filter((n) => {
    if (!group) return true;
    if (group === '互动消息') return n.group.includes('互动') || n.group.includes('会员');
    return n.group.includes(group) || group.includes(n.group);
  });

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={group || s.t('通知消息')} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="py-16 text-center text-[14px] text-[#999999]">{s.t('暂无此类消息')}</div>
        ) : list.map((n) => {
          const open = expanded === n.id;
          return (
            <div key={n.id} className="bg-white mx-2 mt-2 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#0086F6] bg-[#EAF4FF] rounded px-1.5 py-0.5">{n.group}</span>
                <span className="text-[11px] text-[#999999]">{n.time}</span>
              </div>
              <div className="text-[14px] font-semibold text-[#222222] mt-2">{n.title}</div>
              <div className="text-[13px] text-[#666666] mt-1 leading-relaxed">{n.content}</div>
              {open && n.detail && (
                <div className="mt-2 pt-2 border-t border-[#F2F2F2] text-[13px] text-[#444444] whitespace-pre-line leading-relaxed">{n.detail}</div>
              )}
              {n.detail && (
                <button
                  {...bindTap({ kind: 'action', id: 'msgSub.detail.expand' }, { params: { id: n.id }, onTrigger: () => setExpanded((x) => (x === n.id ? null : n.id)) })}
                  className="mt-2 text-[13px] text-[#0086F6] bg-transparent border-none cursor-pointer p-0"
                >{open ? s.t('收起') : s.t('查看详情 ›')}</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
