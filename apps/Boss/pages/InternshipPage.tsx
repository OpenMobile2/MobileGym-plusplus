import React from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { INTERNSHIP_PAGE } from '../constants';
import { PageHeader } from '../components/common';
import JobCard from '../components/JobCard';
import { IcShare } from '../res/icons';
import { COLORS } from '../res/colors';
import { sharePlainText } from '@/os/shareBridge';

const C = BOSS_CONFIG;

/** 实习专区 0实习冲刺计划(IMG_8443) */
const InternshipPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const interns = C.jobs.filter((j) => j.jobType === 'intern');

  return (
    <div className="flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${COLORS.primary} 0%, #9FE0DC 90px, #F5F6F7 260px)` }} data-status-bar-foreground="light">
      <PageHeader transparent light right={
        <button {...action('internship.share.system', () => {
          const launched = sharePlainText(`【BOSS直聘】${INTERNSHIP_PAGE.title}：${INTERNSHIP_PAGE.slogans.join('、')}`, {
            onResult: (r) => { if (r.resultCode === 'OK') store.showToast(t.shareSuccess); },
          });
          if (!launched) store.showNotice('当前环境无法打开系统分享，请点击“我知道了”返回。');
        }, { params: {} })} aria-label="分享">
          <IcShare size={19} className="text-white" />
        </button>
      } />
      <div className="px-4">
        <div className="text-[28px] font-black italic text-white [text-shadow:0_1px_0_rgba(0,0,0,0.08)]">{INTERNSHIP_PAGE.title}</div>
        <div className="mt-1.5 flex gap-3 text-[13px] text-white/90">
          {INTERNSHIP_PAGE.slogans.map((s) => <span key={s} className="flex items-center gap-1">💼 {s}</span>)}
        </div>
        <div className="mt-3 rounded-2xl bg-white/95 p-4">
          <div className="text-[17px] font-bold text-gray-900">Hi~ {user.nickname}同学</div>
          <div className="mt-1 text-[14px] text-gray-600">{INTERNSHIP_PAGE.greeting}</div>
        </div>
        <div className="mt-3 inline-block border-b-[3px] pb-1 text-[17px] font-bold text-gray-900" style={{ borderColor: COLORS.primary }}>
          {INTERNSHIP_PAGE.category}
        </div>
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex flex-col gap-2.5">
          {interns.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              company={C.companies.find((c) => c.id === job.companyId)!}
              boss={C.bosses.find((b) => b.id === job.bossId)!}
              cardBind={bindTap('internship.detail-open', { params: { jobId: job.id } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InternshipPage;
