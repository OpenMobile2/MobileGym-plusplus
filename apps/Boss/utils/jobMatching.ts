import { ACTIVE_TIERS, COMPREHENSIVE_RECOMMENDATION_JOB_IDS, SALARY_BANDS } from '../constants';
import type { BossUser, Company, Job } from '../types';

/**
 * 把 BOSS 常见薪资文案统一成月薪 K 区间。
 * 月薪直接解析；时薪按 8h × 22d、日薪按 22d 做展示级近似换算。
 */
export function salaryRangeMonthlyK(salary: string): [number, number] | null {
  const monthly = salary.match(/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?K/i);
  if (monthly) {
    const lo = Number(monthly[1]);
    return [lo, monthly[2] ? Number(monthly[2]) : lo];
  }

  const pieceRate = salary.match(/(\d+(?:\.\d+)?)(?:-(\d+(?:\.\d+)?))?元\/(时|天|月)/);
  if (!pieceRate) return null;
  const multiplier = pieceRate[3] === '时' ? 8 * 22 / 1000 : pieceRate[3] === '天' ? 22 / 1000 : 1 / 1000;
  const toMonthlyK = (value: string) => Math.round(Number(value) * multiplier * 100) / 100;
  const lo = toMonthlyK(pieceRate[1]);
  const hi = toMonthlyK(pieceRate[2] ?? pieceRate[1]);
  return [lo, hi];
}

export function matchesSalaryBand(job: Job, bandLabel: string): boolean {
  const band = SALARY_BANDS[bandLabel];
  const salary = salaryRangeMonthlyK(job.salary);
  if (!band || !salary) return false;

  // BOSS 薪资档按职位薪资下限归入唯一档位，避免区间交集导致一条职位重复出现在相邻档。
  const lowerBound = salary[0];
  const [minInclusive, maxExclusive] = band;
  if (bandLabel === '50K以上') return lowerBound >= minInclusive;
  return lowerBound >= minInclusive && lowerBound < maxExclusive;
}

export function matchesExpectedPosition(job: Job, selectedExpect: string): boolean {
  if (!selectedExpect) return true;
  const keyword = selectedExpect.replace(/工程师|设计师|分析师|师$/g, '').trim();
  const haystack = [job.title, ...job.tags, ...job.skills].join('');
  return haystack.includes(selectedExpect) || (keyword.length >= 2 && haystack.includes(keyword));
}

export function matchesParttimeCategory(job: Job, category: string): boolean {
  if (!category) return true;
  return job.parttimeCategories?.includes(category) ?? false;
}

export function matchesJobFilters(
  job: Job,
  filter: Record<string, string[]>,
  company: Company,
  boss: BossUser,
): boolean {
  const has = (group: string) => (filter[group]?.length ?? 0) > 0;
  if (has('edu') && !filter.edu.includes(job.eduReq)) return false;
  if (has('exp') && !filter.exp.some((value) => job.expReq.includes(value.replace('生', '')) || job.expReq === value)) return false;
  if (has('salary') && !matchesSalaryBand(job, filter.salary[0])) return false;
  if (has('active')) {
    const bossTier = ACTIVE_TIERS.indexOf(boss.activeTier);
    const selectedTier = ACTIVE_TIERS.indexOf(filter.active[0]);
    if (selectedTier >= 0 && (bossTier < 0 || bossTier > selectedTier)) return false;
  }
  if (has('industry') && !filter.industry.includes(company.industry)) return false;
  if (has('scale') && !filter.scale.includes(company.scale)) return false;
  if (has('stage') && !filter.stage.includes(company.stage)) return false;
  return true;
}

const comprehensiveRank = new Map<string, number>(
  COMPREHENSIVE_RECOMMENDATION_JOB_IDS.map((id, index) => [id, index]),
);

/** 让综合推荐首屏跨岗位混排；未列入的职位保持原始数据顺序。 */
export function sortComprehensiveRecommendations(jobs: Job[]): Job[] {
  return jobs
    .map((job, originalIndex) => ({ job, originalIndex }))
    .sort((a, b) => {
      const aRank = comprehensiveRank.get(a.job.id);
      const bRank = comprehensiveRank.get(b.job.id);
      if (aRank !== undefined || bRank !== undefined) {
        if (aRank === undefined) return 1;
        if (bRank === undefined) return -1;
        return aRank - bRank;
      }
      return a.originalIndex - b.originalIndex;
    })
    .map(({ job }) => job);
}
