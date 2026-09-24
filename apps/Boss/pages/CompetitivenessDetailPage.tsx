import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { COMP_DETAIL } from '../constants';
import { MissingContent, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

const C = BOSS_CONFIG;

/** 竞争力分析详情(Q8 推断,审核勾符合):环形图 + 标签 + 匹配度 + 开通入口 */
const CompetitivenessDetailPage: React.FC = () => {
  const { bindTap } = useBossGestures();
  const [searchParams] = useSearchParams();
  const purchasedDays = useBossStore((s) => s.purchases.competitivenessDays);
  const jobId = searchParams.get('jobId') ?? '';
  const job = C.jobs.find((j) => j.id === jobId);
  if (!job) return <MissingContent text="竞争力分析对应的职位不存在或已被移除" />;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-white"><PageHeader title="竞争力分析" /></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-[15px] font-semibold text-gray-900">{job.title}</div>
          <div className="mt-0.5 text-[13px] text-gray-500">{C.companies.find((c) => c.id === job.companyId)!.name} · {job.salary}</div>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-[17px] font-bold text-gray-900">综合实力</div>
          <div className="mx-auto mt-4 flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-[#4A9BEB] border-l-[#DCEAF8] text-center">
            <span><b className="block text-[24px] text-gray-900">{COMP_DETAIL.percentile}%</b><span className="text-[12px] text-gray-500">超过竞争者</span></span>
          </div>
          <div className="mt-4 text-[14px] text-gray-700">你与职位匹配情况</div>
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full">
            {['#9BD4F5', '#6BB8F0', '#4A9BEB', '#2E7CE6'].map((c, i) => <span key={i} className="flex-1" style={{ backgroundColor: c, opacity: i <= COMP_DETAIL.matchLevel ? 1 : 0.25 }} />)}
          </div>
          <div className="mt-1 flex justify-between text-[12px] text-gray-400">
            {COMP_DETAIL.matchLevels.map((l, i) => <span key={l} style={i === COMP_DETAIL.matchLevel ? { color: '#2E7CE6', fontWeight: 600 } : undefined}>{l}</span>)}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-[17px] font-bold text-gray-900">优秀竞争者标签</div>
          <div className="mt-1 text-[13px] text-gray-500">Boss的偏好牛人画像</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {COMP_DETAIL.tags.map((t) => <span key={t} className="rounded-lg bg-[#EAF3FE] px-2.5 py-1.5 text-[13px] text-[#3B6FA8]">{t}</span>)}
          </div>
        </div>

        {purchasedDays > 0 ? (
          <div className="mt-4 rounded-xl bg-[#EAF6F5] px-4 py-3 text-center text-[14px] font-medium" style={{ color: COLORS.primary }}>竞争力分析已解锁 · 剩余 {purchasedDays} 天</div>
        ) : (
          <button
            {...bindTap('compdetail.buy-open')}
            className="mt-4 w-full rounded-full py-3 text-center text-[15px] font-medium text-white"
            style={{ backgroundColor: COLORS.primaryBtn }}
          >
            开通竞争力分析器,解锁全部数据
          </button>
        )}
      </div>
    </div>
  );
};

export default CompetitivenessDetailPage;
