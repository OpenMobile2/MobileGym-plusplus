import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { DISMISS_REASON_GROUPS } from '../constants';
import { COLORS } from '../res/colors';
import JobCard from '../components/JobCard';
import { MissingContent } from '../components/common';
import { IcBack, IcChevronDown, IcClose } from '../res/icons';
import type { Job } from '../types';
import { matchesJobFilters, sortComprehensiveRecommendations } from '../utils/jobMatching';

const C = BOSS_CONFIG;
const isSubsequence = (needle: string, haystack: string) => {
  let index = 0;
  for (const char of haystack) {
    if (char === needle[index]) index += 1;
    if (index === needle.length) return true;
  }
  return needle.length === 0;
};
/** 搜索结果页(IMG_8504)。也复用为「更多相似职位」列表(similar=1)。 */
const SearchResultPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const kw = searchParams.get('kw') ?? '';
  const similar = searchParams.get('similar') === '1';
  const sourceJobId = searchParams.get('jobId') ?? '';
  const sourceJob = C.jobs.find((j) => j.id === sourceJobId);
  const [tab, setTab] = useState<'job' | 'company'>('job');
  const [related, setRelated] = useState('不限');

  const dismissOpen = searchParams.get('dismiss') === 'open';
  const dismissJobId = searchParams.get('jobId') ?? '';

  if (similar && !sourceJob) return <MissingContent text="相似职位对应的原职位不存在或已被移除" />;

  const resultCity = sourceJob?.city ?? store.city;
  let jobs: Job[] = C.jobs.filter((j) => (
    !store.dismissedJobIds.includes(j.id)
    && j.city === resultCity
    && matchesJobFilters(
      j,
      store.filter,
      C.companies.find((c) => c.id === j.companyId)!,
      C.bosses.find((b) => b.id === j.bossId)!,
    )
  ));
  const cityFilteredJobs = [...jobs];
  if (similar && sourceJob) {
    const shared = jobs.filter((j) => (
      j.id !== sourceJob.id
      && j.jobType === sourceJob.jobType
      && (j.skills.some((skill) => sourceJob.skills.includes(skill)) || j.title.includes(sourceJob.title.replace(/工程师|实习生|兼职/g, '')))
    ));
    jobs = shared.length > 0 ? shared : jobs.filter((j) => j.id !== sourceJob.id && j.jobType === sourceJob.jobType);
  }
  if (kw && !similar) {
    // 分词匹配:kw 按 中/英文边界 拆 token,全部 token 命中(标题+技能+要求+公司名)才算
    const tokens = kw.toLowerCase().split(/(?<=[\u4e00-\u9fa5])(?=[a-z0-9])|(?<=[a-z0-9])(?=[\u4e00-\u9fa5])|\s+/).filter(Boolean);
    jobs = jobs.filter((j) => {
      const company = C.companies.find((c) => c.id === j.companyId)!;
      const hay = `${j.title} ${j.skills.join(' ')} ${j.reqs.join(' ')} ${company.name}`.toLowerCase();
      const compactHay = hay.replace(/\s+/g, '');
      return tokens.every((tk) => hay.includes(tk) || isSubsequence(tk.replace(/\s+/g, ''), compactHay));
    });
  }
  if (related !== '不限') jobs = jobs.filter((j) => j.title.includes(related.replace('算法', '')) || j.skills.some((s) => s.includes(related)));
  if (store.sortMode === 'nearby') jobs = [...jobs].sort((a, b) => a.distanceKm - b.distanceKm);
  else if (store.sortMode === 'latest') jobs = [...jobs].sort((a, b) => a.publishedDaysAgo - b.publishedDaysAgo);
  else jobs = sortComprehensiveRecommendations(jobs);

  const relatedOptions = [...new Set([
    '不限',
    ...(kw ? [kw] : []),
    ...jobs.flatMap((j) => [j.title, ...j.skills]).filter(Boolean),
  ])].slice(0, 6);
  const roleKeyword = kw.match(/(?:算法|开发|测试|产品|运营|设计)[^\s]{0,4}(?:工程师|经理|师)/)?.[0] ?? '';
  const companyIds = new Set(cityFilteredJobs.filter((job) => {
    if (!kw) return true;
    const company = C.companies.find((c) => c.id === job.companyId)!;
    const hay = `${job.title} ${job.skills.join(' ')} ${job.reqs.join(' ')} ${company.name} ${company.industry}`.toLowerCase();
    const compactHay = hay.replace(/\s+/g, '');
    return isSubsequence(kw.toLowerCase().replace(/\s+/g, ''), compactHay)
      || Boolean(roleKeyword && compactHay.includes(roleKeyword.toLowerCase()));
  }).map((job) => job.companyId));
  const companies = C.companies.filter((c) => companyIds.has(c.id));
  const sortLabel = store.sortMode === 'nearby' ? '距离优先' : store.sortMode === 'latest' ? '最新发布' : '综合排序';
  const cycleSort = () => store.setSortMode(store.sortMode === 'recommend' ? 'nearby' : store.sortMode === 'nearby' ? 'latest' : 'recommend');

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-white pb-2">
        <div className="flex items-center gap-2 px-3 pt-12">
          <BackBtn />
          <div className="flex h-9 flex-1 items-center rounded-full bg-[#F5F5F5] px-3 text-[14px] text-gray-800">{similar ? '相似职位' : kw || '搜索职位'}</div>
        </div>
        <div className="mt-2 flex items-center gap-5 px-4 text-[15px]">
          {(['job', 'company'] as const).map((v) => (
            <button
              key={v}
              {...action('searchresult.select.tab', () => { setTab(v); store.recordTaskAudit('searchResultTab', { keyword: kw, tab: v, sort: store.sortMode }); }, { params: { value: v } })}
              className={tab === v ? 'font-bold text-gray-900' : 'text-gray-500'}
            >
              {v === 'job' ? '职位' : '公司'}
            </button>
          ))}
          <button {...action('searchresult.ai.toast', () => store.showNotice('AI 问闪闪暂未开放，请点击“我知道了”继续查看搜索结果。'), { params: {} })} className="flex items-center gap-0.5 text-gray-500">
            <span className="font-semibold text-[#5B8DEF]">Ai</span> 问闪闪
          </button>
        </div>
        <div className="mt-2 flex items-center gap-4 px-4 text-[13px] text-gray-600">
          <button {...bindTap('searchresult.city-open')} className="flex items-center gap-0.5">{resultCity}<IcChevronDown size={12} /></button>
          <button
            {...action('searchresult.select.sort', cycleSort, { params: { field: 'sort', value: store.sortMode } })}
            className="flex items-center gap-0.5 font-medium"
            style={{ color: COLORS.accent }}
          >
            {sortLabel}<IcChevronDown size={12} />
          </button>
          <button {...bindTap('searchresult.filter-open')} className="flex items-center gap-0.5">筛选<IcChevronDown size={12} /></button>
          <button {...bindTap('searchresult.filter-open')} className="flex items-center gap-0.5">行业<IcChevronDown size={12} /></button>
          <button {...bindTap('searchresult.filter-open')} className="flex items-center gap-0.5">职位<IcChevronDown size={12} /></button>
        </div>
        {tab === 'job' && (
          <div className="mt-2 flex gap-2 overflow-x-auto px-4" data-scroll-container="related" data-scroll-direction="horizontal">
            {relatedOptions.map((r) => (
              <button
                key={r}
                {...action('searchresult.select.related', () => setRelated(r), { params: { value: r } })}
                className="shrink-0 rounded-lg px-3 py-1.5 text-[13px]"
                style={related === r ? { backgroundColor: '#E6F5F4', color: COLORS.primary } : { backgroundColor: '#F5F5F5', color: '#4B5563' }}
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'job' ? (
          <div className="flex flex-col gap-2.5">
            <div className="py-1 text-center text-[13px]" style={{ color: COLORS.accent }}>推荐职位已更新</div>
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                company={C.companies.find((c) => c.id === job.companyId)!}
                boss={C.bosses.find((b) => b.id === job.bossId)!}
                cardBind={bindTap('searchresult.detail-open', { params: { jobId: job.id } })}
                dismissBind={bindTap('searchresult.dismiss-open', { params: { jobId: job.id }, stopPropagation: true })}
              />
            ))}
            {jobs.length === 0 && <div className="py-16 text-center text-sm text-gray-400">没有找到相关职位</div>}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {companies.map((c) => (
              <button key={c.id} {...bindTap('searchresult.company-open', { params: { companyId: c.id } })} className="rounded-xl bg-white p-4 text-left">
                <div className="text-[15px] font-semibold text-gray-900">{c.name}</div>
                <div className="mt-1 text-[13px] text-gray-500">{c.stage}·{c.scale}·{c.industry}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 不感兴趣原因弹层(与职位列表同款,URL 驱动) */}
      {dismissOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-2xl bg-white px-4 pb-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-[17px] font-semibold text-gray-900">选择原因,减少不合适职位推荐</div>
              <button onClick={() => navigate(-1)} className="p-1 text-gray-500" aria-label="关闭"><IcClose size={20} /></button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {DISMISS_REASON_GROUPS.flatMap((g) => g.reasons).map((reason) => (
                <button
                  key={reason}
                  {...action('dismiss.select.reason', () => { store.dismissJob(dismissJobId); store.showToast('将减少此类推荐'); navigate(-1); }, { params: { reason } })}
                  className="rounded-lg bg-[#F5F5F5] px-3 py-3 text-[13px] text-gray-700"
                >
                  {reason}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BackBtn: React.FC = () => {
  const { bindBack } = useBossGestures();
  return (
    <button {...bindBack()} className="flex h-10 w-9 items-center justify-center text-gray-800" aria-label="返回">
      <IcBack size={20} />
    </button>
  );
};

export default SearchResultPage;
