import React, { useState } from 'react';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';

const FAQS = [
  { q: '如何补打卡?', a: '进入习惯详情的打卡日历,点击对应日期的空格子即可就地补打卡。' },
  { q: '标记失败会怎样?', a: '标记失败后,将扣除相应的光芒值。' },
  { q: '归档的习惯数据还在吗?', a: '在。归档只是移出今日页与打卡管理,历史打卡仍计入统计。' },
  { q: '光芒值有什么用?', a: '光芒值可以在「光芒与心愿」中兑换你设定的心愿。' },
];

/** 热门问题(s213)。问题行展开/折叠。 */
export default function FaqPage() {
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.faq} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {FAQS.map((f, i) => (
          <div key={i} className="mb-2 overflow-hidden rounded-2xl bg-white">
            <button {...action('support.faq.item.toggle', () => setOpen((o) => (o === i ? null : i)))}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm text-[#424242]">
              {f.q}<span className="text-[#C9CDD3]">{open === i ? '−' : '+'}</span>
            </button>
            {open === i && <div className="border-t border-[#F5F5F5] px-4 py-3 text-xs leading-relaxed text-[#6B7280]">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
