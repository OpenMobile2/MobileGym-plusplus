import React from 'react';
import type { BossUser, Company, Job } from '../types';
import { Avatar, Chip } from './common';
import { COLORS } from '../res/colors';
import { IcClose } from '../res/icons';

/**
 * 职位卡(列表/搜索/收藏/实习专区共用)。
 * 绑定属性由父页面用字面量 transitionId 预构建后传入(静态分析器只认字面量 id)。
 */
const JobCard: React.FC<{
  job: Job;
  company: Company;
  boss: BossUser;
  cardBind: React.HTMLAttributes<HTMLElement>;
  dismissBind?: React.HTMLAttributes<HTMLElement>;
  distanceLabel?: string;
}> = ({ job, company, boss, cardBind, dismissBind, distanceLabel }) => (
  <div {...cardBind} className="relative rounded-xl bg-app-surface p-4">
    <div className="flex items-start justify-between gap-2">
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[16px] font-semibold text-app-text">{job.title}</span>
        {job.campus && (
          <span className="shrink-0 rounded border px-1 text-[10px]" style={{ color: COLORS.accent, borderColor: COLORS.accent }}>校招</span>
        )}
        {job.hotBadge && (
          <span className="shrink-0 rounded bg-[#FFF1E8] px-1 text-[10px] text-[#FF5F2E]">{job.hotBadge}</span>
        )}
      </div>
      <span className="shrink-0 text-[16px] font-semibold" style={{ color: COLORS.accent }}>{job.salary}</span>
    </div>
    <div className="mt-1 flex items-center justify-between text-[13px] text-app-text-muted">
      <span className="truncate">{company.name} {company.stage} {company.scale}</span>
      <span className="shrink-0 text-gray-400">常看的公司</span>
    </div>
    <div className="mt-2 flex flex-wrap gap-1.5">
      {job.tags.slice(0, 4).map((tag) => <Chip key={tag}>{tag}</Chip>)}
    </div>
    <div className="mt-2.5 flex items-center justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <span className="relative">
          <Avatar imgKey={boss.avatar} name={boss.name} size={28} />
          {boss.online && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#3DBE5B]" />}
        </span>
        <span className="truncate text-[13px] text-app-text-muted">{boss.name} · {boss.title}</span>
        <span className="shrink-0 text-[12px] text-app-text-muted">{boss.activity}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-[12px] text-app-text-muted">
        <span>{distanceLabel ?? `${job.city} ${job.district}`}</span>
        {dismissBind && (
          <button {...dismissBind} className="-m-1 p-1 text-gray-300" aria-label="不感兴趣">
            <IcClose size={14} />
          </button>
        )}
      </div>
    </div>
    {job.highlight && (
      <div className="mt-2 border-t border-app-border pt-2 text-[12px] text-app-text-muted">{job.highlight}</div>
    )}
  </div>
);

export default JobCard;
