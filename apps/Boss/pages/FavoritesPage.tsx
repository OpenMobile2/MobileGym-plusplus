import React, { useEffect, useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { EmptyBox, PageHeader, CompanyLogo } from '../components/common';
import JobCard from '../components/JobCard';
import { COLORS } from '../res/colors';

const C = BOSS_CONFIG;

/** 职位收藏 / 公司收藏(IMG_8437):双 tab,空态 + 高薪职位推荐 */
const FavoritesPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();
  const [tab, setTab] = useState<'jobs' | 'companies'>('jobs');
  const favoriteJobIds = useBossStore((s) => s.favoriteJobIds);
  const favoriteCompanyIds = useBossStore((s) => s.favoriteCompanyIds);

  const favJobs = C.jobs.filter((j) => favoriteJobIds.includes(j.id));
  const favCompanies = C.companies.filter((c) => favoriteCompanyIds.includes(c.id));
  const recommended = C.jobs.filter((j) => C.recommendedJobIds.includes(j.id));

  const recordTaskAudit = useBossStore((s) => s.recordTaskAudit);

  useEffect(() => {
    recordTaskAudit('favoritesViewed', { jobs: true, companies: tab === 'companies' });
  }, [tab, recordTaskAudit]);

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-white">
        <PageHeader
          title={
            <span className="flex items-center justify-center gap-5">
              {(['jobs', 'companies'] as const).map((v) => (
                <button
                  key={v}
                  {...action('favorites.select.tab', () => {
                    setTab(v);
                    recordTaskAudit('favoritesTab', v);
                    recordTaskAudit('favoritesViewed', { jobs: true, companies: v === 'companies' });
                  }, { params: { value: v } })}
                  className={tab === v ? 'text-[17px] font-bold text-gray-900' : 'text-[16px] font-normal text-gray-400'}
                >
                  {v === 'jobs' ? '职位收藏' : '公司收藏'}
                </button>
              ))}
            </span>
          }
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'jobs' ? (
          favJobs.length === 0 ? (
            <>
              <div className="rounded-b-xl bg-white"><EmptyBox text="仅显示最近一年的数据,暂无内容" /></div>
              <div className="my-4 flex items-center justify-center gap-3 text-[15px] text-gray-500">
                <span className="h-px w-8 bg-gray-300" />高薪职位推荐<span className="h-px w-8 bg-gray-300" />
              </div>
              <div className="flex flex-col gap-2.5">
                {recommended.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    company={C.companies.find((c) => c.id === job.companyId)!}
                    boss={C.bosses.find((b) => b.id === job.bossId)!}
                    cardBind={bindTap('favorites.detail-open', { params: { jobId: job.id } })}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2.5 pt-2.5">
              {favJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  company={C.companies.find((c) => c.id === job.companyId)!}
                  boss={C.bosses.find((b) => b.id === job.bossId)!}
                  cardBind={bindTap('favorites.detail-open', { params: { jobId: job.id } })}
                />
              ))}
            </div>
          )
        ) : favCompanies.length === 0 ? (
          <div className="rounded-b-xl bg-white"><EmptyBox text="仅显示最近一年的数据,暂无内容" /></div>
        ) : (
          <div className="flex flex-col gap-2.5 pt-2.5">
            {favCompanies.map((c) => (
              <button key={c.id} {...bindTap('favorites.company-open', { params: { companyId: c.id } })} className="flex items-center gap-3 rounded-xl bg-white p-4 text-left">
                <CompanyLogo logoKey={c.logo} name={c.name} size={44} />
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-semibold text-gray-900">{c.name}</div>
                  <div className="mt-0.5 text-[13px] text-gray-500">{c.stage}·{c.scale}·{c.industry}</div>
                </div>
                <span className="ml-auto text-[13px]" style={{ color: COLORS.accent }}>在招{C.jobs.filter((j) => j.companyId === c.id).length}个职位</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
