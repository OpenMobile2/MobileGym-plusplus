import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { Avatar, Chip, EmptyBox, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import type { RecordsTab } from '../types';

const C = BOSS_CONFIG;
const TABS: { v: RecordsTab; label: string }[] = [
  { v: 'viewed', label: '我看过' },
  { v: 'chatted', label: '沟通过' },
  { v: 'applied', label: '已投简历' },
  { v: 'exchanged', label: '交换过' },
  { v: 'interviewed', label: '面试' },
];

/** 求职记录(IMG_8432/8433/8435):四档切换,切档列表变化(坑一断言点) */
const RecordsPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();
  const [searchParams] = useSearchParams();
  const records = useBossStore((s) => s.records);
  const requestedTab = searchParams.get('tab') as RecordsTab | null;
  const [tab, setTab] = useState<RecordsTab>(TABS.some((item) => item.v === requestedTab) ? requestedTab! : 'viewed');

  const list = records[tab];

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader />
      <div className="flex items-center justify-between px-4">
        <span className="text-[26px] font-bold text-gray-900">求职记录</span>
        <button
          {...action('records.restat.refresh', () => { store.recordTaskAudit('recordsRestat', true); store.showNotice('求职记录会在浏览、沟通、投递和保存面试后自动更新；当前已展示统一数据源中的最新记录。'); }, { params: {} })}
          className="text-[14px] text-gray-500"
        >
          重新统计
        </button>
      </div>
      <p className="mt-2 px-4 text-[13px] leading-relaxed text-gray-500">
        当前记录仅自己可见,BOSS是无法看到您所浏览过或投递过的其他职位,当前记录为2025-07-12至今的数据,如想查看其他记录可重新选择统计时间
      </p>
      <div className="mt-3 grid grid-cols-5 border-b border-gray-100">
        {TABS.map(({ v, label }) => (
          <button key={v} {...action('records.select.tab', () => {
            setTab(v);
            const viewed = Array.isArray(store.taskAudit.recordsTabs) ? store.taskAudit.recordsTabs as string[] : ['viewed'];
            store.recordTaskAudit('recordsTabs', viewed.includes(v) ? viewed : [...viewed, v]);
          }, { params: { value: v } })} className="relative pb-2.5">
            <span className={tab === v ? 'text-[16px] font-bold text-gray-900' : 'text-[15px] text-gray-500'}>{label}</span>
            {tab === v && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-8 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-[#F5F6F7] px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'chatted' && <div className="px-1 py-2 text-[13px] text-gray-500">累计沟通职位数量{list.length}</div>}
        {list.length === 0 ? (
          <div className="mt-2 rounded-xl bg-white"><EmptyBox text={`在2025-07-12及之后暂无${TABS.find((x) => x.v === tab)!.label}记录`} /></div>
        ) : (
          <>
            <div className="px-1 py-2 text-[15px] font-semibold text-gray-900">{list[0].dateLabel}</div>
            <div className="flex flex-col gap-2.5">
              {list.map((r, i) => {
                const job = C.jobs.find((j) => j.id === r.jobId);
                if (!job) return null;
                const company = C.companies.find((c) => c.id === job.companyId)!;
                const boss = C.bosses.find((b) => b.id === job.bossId)!;
                return (
                  <button key={`${r.jobId}-${i}`} {...bindTap('records.detail-open', { params: { jobId: job.id } })} className="rounded-xl bg-white p-4 text-left">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-[16px] font-semibold text-gray-900">{job.title}</span>
                      <span className="shrink-0 text-[15px] font-semibold" style={{ color: COLORS.accent }}>{job.salary}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[13px] text-gray-500">
                      <span className="truncate">{company.name} {company.stage} {company.scale}</span>
                      <span className="shrink-0 text-gray-400">约{job.distanceKm}千米</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <Chip>{job.city}</Chip><Chip>{job.expReq}</Chip><Chip>{job.eduReq}</Chip>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[13px] text-gray-600">
                      <span className="flex items-center gap-2"><Avatar imgKey={boss.avatar} name={boss.name} size={24} />{boss.name} · {boss.title}</span>
                      <span className="text-[12px] text-gray-400">{r.timeLabel}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="py-5 text-center text-[13px] text-gray-400">仅显示2025-07-12及之后的数据,已删除的职位不展示,最多200个</div>
          </>
        )}
      </div>
    </div>
  );
};

export default RecordsPage;
