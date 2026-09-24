import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { DISMISS_REASON_GROUPS, PARTTIME_CATEGORY_TABS } from '../constants';
import { COLORS } from '../res/colors';
import JobCard from '../components/JobCard';
import { IcSearch, IcPlus, IcChevronDown, IcClose, IcEdit } from '../res/icons';
import type { Job, JobType, SortMode } from '../types';
import {
  matchesExpectedPosition,
  matchesJobFilters,
  matchesParttimeCategory,
  sortComprehensiveRecommendations,
} from '../utils/jobMatching';

const C = BOSS_CONFIG;
const companyOf = (j: Job) => C.companies.find((c) => c.id === j.companyId)!;
const bossOf = (j: Job) => C.bosses.find((b) => b.id === j.bossId)!;

const JOBTYPE_TABS: { v: JobType; key: 'fulltime' | 'intern' | 'parttime' }[] = [
  { v: 'fulltime', key: 'fulltime' }, { v: 'intern', key: 'intern' }, { v: 'parttime', key: 'parttime' },
];
const SORT_TABS: { v: SortMode; key: 'sortRecommend' | 'sortNearby' | 'sortLatest' }[] = [
  { v: 'recommend', key: 'sortRecommend' }, { v: 'nearby', key: 'sortNearby' }, { v: 'latest', key: 'sortLatest' },
];

/** 职位列表(职位 tab,IMG_8415/8416/8417/8494)。不感兴趣原因弹层为 URL 弹层(?dismiss=open)。 */
const JobsPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useBossStore();
  const { jobType, sortMode, city, dismissedJobIds, filter, expects, selectedExpect, parttimeCategory } = store;

  const dismissOpen = searchParams.get('dismiss') === 'open';
  const dismissJobId = searchParams.get('jobId') ?? '';
  const dismissJob = C.jobs.find((j) => j.id === dismissJobId);

  let jobs = C.jobs.filter((j) => (
    j.jobType === jobType
    && !dismissedJobIds.includes(j.id)
    && j.city === city
    && matchesExpectedPosition(j, selectedExpect)
    && matchesParttimeCategory(j, parttimeCategory)
    && matchesJobFilters(j, filter, companyOf(j), bossOf(j))
  ));
  if (sortMode === 'nearby') jobs = [...jobs].sort((a, b) => a.distanceKm - b.distanceKm);
  if (sortMode === 'latest') jobs = [...jobs].sort((a, b) => a.publishedDaysAgo - b.publishedDaysAgo);
  if (sortMode === 'recommend' && !selectedExpect && jobType === 'fulltime') {
    jobs = sortComprehensiveRecommendations(jobs);
  }

  const filterActive = Object.values(filter).some((v) => v.length > 0);

  return (
    <div
      className="flex h-full flex-col text-app-text"
      style={{ background: 'linear-gradient(180deg, var(--app-c-header-tint) 0%, var(--app-bg) 120px)' }}
    >
      {/* 顶部:全职/实习/兼职 + 搜索框(pt-12 预留状态栏) */}
      <div className="flex items-center justify-between gap-2 px-4 pt-12">
        <div className="flex shrink-0 items-end gap-2">
          {JOBTYPE_TABS.map(({ v, key }) => (
            <button
              key={v}
              {...action('jobs.select.jobtype', () => store.setJobType(v), { params: { value: v } })}
              className={jobType === v
                ? 'whitespace-nowrap text-[20px] font-bold text-app-text'
                : 'whitespace-nowrap pb-0.5 text-[14px] text-app-text-muted'}
            >
              {t[key]}
            </button>
          ))}
        </div>
        <button {...bindTap('jobs.search-open')} className="flex h-9 min-w-0 flex-1 max-w-[112px] items-center gap-1 rounded-full bg-app-surface px-2.5 text-[12px] text-app-text-muted">
          <IcSearch size={15} />
          <span className="truncate">slam算法工程师</span>
        </button>
      </div>

      {/* 期望岗位标签行:综合(全部)+ 各期望,点击过滤 */}
      <div className="mt-3 flex items-center justify-between px-4">
        <div className="flex items-end gap-4 overflow-x-auto" data-scroll-container="expect-tabs" data-scroll-direction="horizontal">
          <button
            {...action('jobs.select.expect', () => store.setSelectedExpect(''), { params: { value: '综合' } })}
            className={`relative shrink-0 pb-1 text-[15px] ${selectedExpect === '' ? 'font-semibold text-app-text' : 'text-app-text-muted'}`}
          >
            {t.sortComprehensive}
            {selectedExpect === '' && <span className="absolute inset-x-1 bottom-0 h-[3px] rounded-full" style={{ backgroundColor: COLORS.primary }} />}
          </button>
          {expects.map((e) => (
            <button
              key={e.id}
              {...action('jobs.select.expect', () => store.setSelectedExpect(e.position), { params: { value: e.position } })}
              className={`relative shrink-0 pb-1 text-[15px] ${selectedExpect === e.position ? 'font-semibold text-app-text' : 'text-app-text-muted'}`}
            >
              {e.position}
              {selectedExpect === e.position && <span className="absolute inset-x-1 bottom-0 h-[3px] rounded-full" style={{ backgroundColor: COLORS.primary }} />}
            </button>
          ))}
        </div>
        <button {...bindTap('jobs.expectadd-open')} className="shrink-0 p-1 text-app-text" aria-label="添加期望岗位"><IcPlus size={20} /></button>
      </div>

      {/* 兼职金刚区(IMG_8494) */}
      {jobType === 'parttime' && (
        <div className="mt-2 flex gap-4 overflow-x-auto px-4 pb-1" data-scroll-container="parttime-cats" data-scroll-direction="horizontal">
          {PARTTIME_CATEGORY_TABS.map(({ id, label, icon: Icon, tint }) => (
            <button
              key={id}
              {...action('jobs.select.gangqu', () => store.setParttimeCategory(label), { params: { value: label } })}
              className="flex shrink-0 flex-col items-center gap-1"
              aria-pressed={parttimeCategory === label}
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl border"
                style={{
                  backgroundColor: tint,
                  borderColor: parttimeCategory === label ? COLORS.primary : 'transparent',
                  color: parttimeCategory === label ? COLORS.primary : '#4B5563',
                }}
              >
                <Icon size={21} strokeWidth={2} />
              </span>
              <span className={parttimeCategory === label ? 'text-[11px] font-semibold' : 'text-[11px] text-gray-600'} style={parttimeCategory === label ? { color: COLORS.primary } : undefined}>{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 推荐/附近/最新 + 城市/筛选 */}
      <div className="mt-2 flex items-center justify-between gap-2 px-4 pb-2">
        <div className="flex min-w-0 items-center gap-3 overflow-x-auto">
          {SORT_TABS.map(({ v, key }) => (
            <button
              key={v}
              {...action('jobs.select.sort', () => store.setSortMode(v), { params: { value: v } })}
              className={sortMode === v
                ? 'shrink-0 whitespace-nowrap text-[14px] font-bold text-app-text'
                : 'shrink-0 whitespace-nowrap text-[14px] text-app-text-muted'}
            >
              {t[key]}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button {...bindTap('jobs.city-open')} className="flex items-center gap-0.5 whitespace-nowrap rounded-lg bg-app-surface px-2 py-1 text-[12px] text-app-text-muted">
            {city}<IcChevronDown size={13} />
          </button>
          <button {...bindTap('jobs.filter-open')} className="flex items-center gap-0.5 whitespace-nowrap rounded-lg px-2 py-1 text-[12px]" style={filterActive ? { color: COLORS.primary, backgroundColor: '#E6F5F4' } : { color: '#4B5563', backgroundColor: 'rgba(255,255,255,0.7)' }}>
            {t.filter}<IcChevronDown size={13} />
          </button>
        </div>
      </div>

      {/* 职位卡列表 */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {sortMode === 'latest' && (
          <div className="py-2 text-center text-[13px]" style={{ color: COLORS.accent }}>推荐职位已更新</div>
        )}
        <div className="flex flex-col gap-2.5">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              company={companyOf(job)}
              boss={bossOf(job)}
              cardBind={bindTap('jobs.detail-open', { params: { jobId: job.id } })}
              dismissBind={bindTap('jobs.dismiss-open', { params: { jobId: job.id }, stopPropagation: true })}
              distanceLabel={sortMode === 'nearby' ? `距家${job.distanceKm < 1 ? `${Math.round(job.distanceKm * 1000)}m` : `${job.distanceKm}km`}` : undefined}
            />
          ))}
          {jobs.length === 0 && <div className="py-16 text-center text-sm text-app-text-muted">该{parttimeCategory || selectedExpect || city}暂无更多职位<br />试试清除分类、切换城市或期望岗位</div>}
        </div>
      </div>

      {/* 不感兴趣原因弹层(IMG_8493,URL 驱动,back 关闭) */}
      {dismissOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="max-h-[75%] overflow-y-auto rounded-t-2xl bg-app-surface px-4 pb-6 pt-4" data-scroll-container="dismiss-sheet" data-scroll-direction="vertical">
            <div className="flex items-center justify-between">
              <div className="text-[17px] font-semibold text-gray-900">选择原因,减少不合适职位推荐</div>
              <button onClick={() => navigate(-1)} className="p-1 text-gray-500" aria-label="关闭"><IcClose size={20} /></button>
            </div>
            {DISMISS_REASON_GROUPS.map((group, gi) => (
              <div key={group.title} className="mt-4">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-900">
                  <span className="h-3.5 w-1 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                  {group.title}
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                  {(gi === 0 && dismissJob
                    ? [`“${dismissJob.salary}”薪资低`, `“${companyOf(dismissJob).name}”公司`, ...group.reasons.slice(2)]
                    : group.reasons
                  ).map((reason) => (
                    <button
                      key={reason}
                      {...action('dismiss.select.reason', () => {
                        store.dismissJob(dismissJobId);
                        store.showToast('将减少此类推荐');
                        navigate(-1);
                      }, { params: { reason } })}
                      className="rounded-lg bg-[#F5F5F5] px-3 py-3 text-[13px] text-gray-700 active:bg-gray-200"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-900">
                  <span className="h-3.5 w-1 rounded-full" style={{ backgroundColor: COLORS.primary }} />
                  其他原因
                </div>
                <IcEdit size={16} className="text-gray-400" />
              </div>
              <input
                {...({ 'data-action': 'dismiss.other.input', 'data-action-type': 'input' } as object)}
                data-keep-keyboard="true"
                placeholder="请输入原因"
                className="mt-2 w-full rounded-lg bg-[#F5F5F5] px-3 py-2.5 text-[13px] outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    store.dismissJob(dismissJobId);
                    store.showToast('已收到反馈');
                    navigate(-1);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
