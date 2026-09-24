import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { COMPANY_IMGS } from '../assets';
import { Avatar, Chip, CompanyLogo, EmptyBox, MissingContent, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcChevronRight } from '../res/icons';

const C = BOSS_CONFIG;

/** HR 个人主页(补拍 15_30):头部 + 任职企业卡 + 发布职位/动态。职位详情Boss卡片、会话⋯名片行进此页。 */
const BossProfilePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const [searchParams] = useSearchParams();
  const bossId = searchParams.get('bossId') ?? '';
  const boss = C.bosses.find((b) => b.id === bossId);
  const [tab, setTab] = useState<'jobs' | 'dynamic'>('jobs');
  if (!boss) return <MissingContent text="Boss 主页不存在或已被移除" />;
  const company = C.companies.find((c) => c.id === boss.companyId);
  if (!company) return <MissingContent text="Boss 关联公司不存在或已被移除" />;
  const jobs = C.jobs.filter((j) => j.bossId === boss.id);

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-gradient-to-b from-[#3A6DF0] to-[#6E94F5]" data-status-bar-foreground="light">
        <PageHeader transparent light />
        <div className="px-4 pb-3 pt-2">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center gap-3.5">
              <Avatar imgKey={boss.avatar} name={boss.name} size={64} />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[22px] font-bold text-gray-900">{boss.name}</span>
                  <span className="text-[12px] text-gray-400">IP归属地: {company.district.replace(/区$/, '')}</span>
                </div>
                <div className="mt-1 text-[14px] text-gray-600">{company.name} · {boss.title}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 任职企业 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-[17px] font-bold text-gray-900">任职企业</div>
          <button {...bindTap('bossprofile.company-open', { params: { companyId: company.id } })} className="mt-3 flex w-full items-center gap-3 border-t border-gray-50 pt-3">
            <CompanyLogo logoKey={company.logo} name={company.name} size={46} />
            <span className="min-w-0 flex-1 text-left">
              <span className="block truncate text-[16px] font-semibold text-gray-900">{company.name}</span>
              <span className="block truncate text-[13px] text-gray-500">{company.stage}·{company.scale}·{company.industry}</span>
            </span>
            <IcChevronRight size={18} className="text-gray-300" />
          </button>
          <div className="mt-3 flex gap-2 overflow-x-auto" data-scroll-container="album" data-scroll-direction="horizontal">
            {company.photos.map((ph) => (
              COMPANY_IMGS[ph]
                ? <img key={ph} src={COMPANY_IMGS[ph]} alt="" className="h-24 w-40 shrink-0 rounded-lg object-cover" />
                : <div key={ph} className="h-24 w-40 shrink-0 rounded-lg bg-gray-100" />
            ))}
          </div>
          <button {...bindTap('bossprofile.jobs-open', { params: { companyId: company.id } })} className="mt-3 flex w-full items-center justify-between border-t border-gray-50 pt-3 text-[14px]">
            <span className="text-gray-700">🏢 查看 <span style={{ color: COLORS.accent }}>{company.name}</span> 在招职位</span>
            <IcChevronRight size={16} className="text-gray-300" />
          </button>
        </div>

        {/* 发布职位 / 动态 */}
        <div className="mt-3 flex gap-6 border-b border-gray-100 px-1">
          {(['jobs', 'dynamic'] as const).map((v) => (
            <button key={v} {...action('bossprofile.select.tab', () => setTab(v), { params: { value: v } })} className="relative pb-2 pt-1">
              <span className={tab === v ? 'text-[16px] font-bold text-gray-900' : 'text-[15px] text-gray-500'}>
                {v === 'jobs' ? '发布职位' : '动态'}
                {v === 'jobs' && <span className="ml-1 text-[13px] font-normal text-gray-400">{jobs.length}</span>}
              </span>
              {tab === v && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-7 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
            </button>
          ))}
        </div>

        {tab === 'jobs' ? (
          <div className="mt-3 flex flex-col gap-2.5">
            {jobs.map((job) => (
              <button key={job.id} {...bindTap('bossprofile.job-open', { params: { jobId: job.id } })} className="rounded-xl bg-white p-4 text-left">
                <div className="flex items-center justify-between">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-[16px] font-semibold text-gray-900">{job.title}</span>
                    {job.campus && <span className="shrink-0 rounded border px-1 text-[10px]" style={{ color: COLORS.accent, borderColor: COLORS.accent }}>校招</span>}
                  </span>
                  <span className="shrink-0 text-[15px] font-semibold" style={{ color: COLORS.accent }}>{job.salary}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Chip>{job.city} {job.district}</Chip><Chip>{job.expReq}</Chip><Chip>{job.eduReq}</Chip>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <EmptyBox text="暂无发布动态" />
        )}
      </div>
    </div>
  );
};

export default BossProfilePage;
