import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { COMP_DETAIL } from '../constants';
import { Avatar, Chip, CompanyLogo, MissingContent, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import {
  IcStar, IcShare, IcReport, IcMapPin, IcBriefcase, IcGraduation, IcChevronRight, IcChevronDown, IcShield,
} from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';

const C = BOSS_CONFIG;

/** 职位详情页(IMG_8411~8414):JD/技能/Boss/公司/地图/竞争力/猜你喜欢/安全提示/继续沟通 */
const JobDetailPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const jobId = searchParams.get('jobId') ?? '';
  const job = C.jobs.find((j) => j.id === jobId);
  const favorited = useBossStore((s) => s.favoriteJobIds.includes(jobId));
  const chatted = useBossStore((s) => s.sessions.some((x) => x.jobId === jobId));
  const [skillsExpanded, setSkillsExpanded] = useState(false);
  const [guessOffset, setGuessOffset] = useState(0);

  // 浏览记录(求职记录-我看过)
  useEffect(() => { if (job) store.addViewedRecord(job.id); }, [job?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!job) return <MissingContent text="职位不存在或已被移除" />;
  const company = C.companies.find((c) => c.id === job.companyId);
  const boss = C.bosses.find((b) => b.id === job.bossId);
  if (!company || !boss) return <MissingContent text="职位关联信息不存在或已被移除" />;

  // 猜你喜欢优先同城(避免跨城串味:郑州岗不推上海岗),不足再补其他城市
  const guessPool = C.jobs.filter((j) => j.id !== job.id && !store.dismissedJobIds.includes(j.id));
  const orderedGuess = [
    ...guessPool.filter((j) => j.city === job.city),
    ...guessPool.filter((j) => j.city !== job.city),
  ];
  const guess = [...orderedGuess, ...orderedGuess].slice(guessOffset, guessOffset + 3);
  const skills = skillsExpanded ? job.skills : job.skills.slice(0, 8);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        right={
          <div className="flex items-center gap-3 pr-1">
            <button
              {...action('jobdetail.favorite.toggle', () => {
                store.toggleFavoriteJob(job.id);
                store.showToast(favorited ? '已取消收藏' : '收藏成功');
              }, { params: { jobId: job.id } })}
              aria-label="收藏"
            >
              <IcStar size={20} className={favorited ? '' : 'text-gray-700'} color={favorited ? '#F7B733' : undefined} fill={favorited ? '#F7B733' : 'none'} />
            </button>
            <button {...action('jobdetail.share.system', () => {
              const launched = sharePlainText(`【BOSS直聘】${job.title}\n${company.name} · ${job.city}${job.district}\n薪资 ${job.salary}`, { onResult: (r) => { if (r.resultCode === 'OK') store.showToast(t.shareSuccess); } });
              if (!launched) store.showNotice('当前环境无法打开系统分享，请点击“我知道了”返回。');
            }, { params: {} })} aria-label="分享">
              <IcShare size={19} className="text-gray-700" />
            </button>
            <button {...action('jobdetail.report.toast', () => store.showNotice('举报入口暂未开放，请点击“我知道了”返回。'), { params: {} })} aria-label="举报">
              <IcReport size={19} className="text-gray-700" />
            </button>
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部:职位名 + 薪资 + 标签 */}
        <div className="px-4">
          <div className="flex items-start justify-between gap-3">
            <span className="text-[22px] font-bold leading-snug text-gray-900">{job.title}</span>
            <span className="shrink-0 pt-1 text-[19px] font-bold" style={{ color: COLORS.accent }}>{job.salary}</span>
          </div>
          {job.campus && (
            <span className="mt-2 inline-block rounded border px-1.5 py-0.5 text-[11px]" style={{ color: COLORS.accent, borderColor: COLORS.accent }}>校招</span>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-gray-600">
            <span className="flex items-center gap-1"><IcMapPin size={14} className="text-gray-400" />{job.city}·{job.district}</span>
            <span className="flex items-center gap-1"><IcBriefcase size={14} className="text-gray-400" />{job.expReq}</span>
            <span className="flex items-center gap-1"><IcGraduation size={14} className="text-gray-400" />{job.eduReq}</span>
          </div>
          <div className="mt-1.5 text-[12px] text-gray-400">该职位于{job.publishedDaysAgo === 0 ? '今日' : `${job.publishedDaysAgo}日内`}新发布</div>
        </div>

        {/* Boss 卡片 + 更多相似职位 */}
        <div className="mt-4 border-y border-gray-50 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <button {...bindTap('jobdetail.boss-open', { params: { bossId: boss.id } })} className="flex min-w-0 items-center gap-3 text-left">
              <span className="relative">
                <Avatar imgKey={boss.avatar} name={boss.name} size={46} />
                {boss.online && <span className="absolute -bottom-0.5 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#3DBE5B]" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[16px] font-semibold text-gray-900">{boss.name}</span>
                <span className="block truncate text-[13px] text-gray-500">{company.name}·{boss.title}</span>
                <span className="mt-0.5 block text-[12px] text-gray-400">{boss.activity} | 回复率高</span>
              </span>
            </button>
            <button {...bindTap('jobdetail.similar-open', { params: { jobId: job.id, similar: 1 } })} className="flex shrink-0 items-center text-[13px] text-gray-500">
              更多相似职位<IcChevronRight size={15} />
            </button>
          </div>
        </div>

        {/* 职位详情 */}
        <div className="px-4 pt-4">
          <div className="text-[18px] font-bold text-gray-900">职位详情</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => <Chip key={s} className="!py-1.5 !px-2.5">{s}</Chip>)}
            {!skillsExpanded && job.skills.length > 8 && (
              <button
                {...action('jobdetail.skills.expand', () => setSkillsExpanded(true), { params: {} })}
                className="flex items-center rounded bg-[#F5F5F5] px-2.5 py-1.5 text-xs text-gray-600"
              >
                查看全部<IcChevronDown size={13} />
              </button>
            )}
          </div>
          {job.gradYear && (
            <div className="mt-3 text-[14px] leading-relaxed text-gray-800">
              <div>毕业时间: {job.gradYear}</div>
              {job.deadline && <div>招聘截止时间: {job.deadline}</div>}
            </div>
          )}
          <div className="mt-2 text-[14px] leading-relaxed text-gray-800">
            <div className="font-medium">岗位职责</div>
            {job.desc.map((d, i) => <div key={i}>{i + 1}、{d}</div>)}
            <div className="mt-2 font-medium">任职要求</div>
            {job.reqs.map((r, i) => <div key={i}>{i + 1}、{r}</div>)}
          </div>
        </div>

        {/* 公司卡片(Q13:可点进公司详情) */}
        <button {...bindTap('jobdetail.company-open', { params: { companyId: company.id } })} className="mx-4 mt-5 flex w-[calc(100%-32px)] items-center justify-between rounded-xl bg-[#F8F9FA] p-3">
          <div className="flex min-w-0 items-center gap-3">
            <CompanyLogo logoKey={company.logo} name={company.name} size={46} />
            <span className="min-w-0 text-left">
              <span className="block truncate text-[15px] font-semibold text-gray-900">{company.name}有限公司</span>
              <span className="block truncate text-[13px] text-gray-500">{company.stage}·{company.scale}·{company.industry}</span>
            </span>
          </div>
          <IcChevronRight size={18} className="shrink-0 text-gray-300" />
        </button>

        {/* 地图(Q14:点开进静态地图页) */}
        <button {...bindTap('jobdetail.map-open', { params: { jobId: job.id } })} className="mx-4 mt-3 block w-[calc(100%-32px)] overflow-hidden rounded-xl border border-gray-100">
          <StaticMap label={job.address} />
        </button>
        <div className="mx-4 mt-2 flex items-center justify-between text-[13px]">
          <span className="text-gray-500">🏠 设置家庭住址,通勤距离一目了然</span>
          <button {...bindTap('jobdetail.map-open', { params: { jobId: job.id } })} style={{ color: COLORS.accent }}>添加住址</button>
        </div>

        {/* 竞争力分析(Q8) */}
        <div className="mx-4 mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold text-gray-900">你的竞争力分析</span>
            <button {...bindTap('jobdetail.competitiveness-open', { params: { jobId: job.id } })} className="flex items-center text-[13px] text-gray-500">
              查看详细分析<IcChevronRight size={15} />
            </button>
          </div>
          <div className="mt-2 text-[14px] text-gray-700">你与竞争者pk情况</div>
          <div className="mt-1 text-[13px] leading-relaxed text-gray-500">
            三个月内共 <span className="blur-[3px]">128</span> 位牛人沟通,你超过 <span className="blur-[3px]">67</span> %的竞争者…
          </div>
          <div className="mt-3">
            <div className="flex h-1.5 overflow-hidden rounded-full">
              {['#9BD4F5', '#6BB8F0', '#4A9BEB', '#2E7CE6'].map((c, i) => (
                <span key={i} className="flex-1" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[12px] text-gray-400">
              {COMP_DETAIL.matchLevels.map((l) => <span key={l}>{l}</span>)}
            </div>
          </div>
        </div>

        {/* 猜你喜欢 */}
        <div className="mx-4 mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[18px] font-bold text-gray-900">猜你喜欢</span>
            <button {...action('jobdetail.guess.refresh', () => setGuessOffset((offset) => orderedGuess.length > 3 ? (offset + 3) % orderedGuess.length : 0), { params: {} })} className="text-[13px] text-gray-400">⟳ 换一批</button>
          </div>
          <div className="mt-2 flex flex-col gap-2.5">
            {guess.map((g) => {
              const gc = C.companies.find((c) => c.id === g.companyId)!;
              const gb = C.bosses.find((b) => b.id === g.bossId)!;
              return (
                <button key={g.id} {...bindTap('jobdetail.guess-open', { params: { jobId: g.id } })} className="rounded-xl border border-gray-100 p-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate text-[15px] font-semibold text-gray-900">{g.title}</span>
                      {g.campus && <span className="shrink-0 rounded border px-1 text-[10px]" style={{ color: COLORS.accent, borderColor: COLORS.accent }}>校招</span>}
                    </span>
                    <span className="shrink-0 text-[15px] font-semibold" style={{ color: COLORS.accent }}>{g.salary}</span>
                  </div>
                  <div className="mt-1 truncate text-[13px] text-gray-500">{gc.name} {gc.stage} {gc.scale}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">{g.tags.slice(0, 3).map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>
                  <div className="mt-2 flex items-center justify-between text-[12px] text-gray-500">
                    <span className="flex items-center gap-1.5"><Avatar imgKey={gb.avatar} name={gb.name} size={20} />{gb.name} · {gb.title}</span>
                    <span className="text-gray-400">{g.city} {g.district}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 安全提示 */}
        <div className="mx-4 mt-5 rounded-xl bg-[#F8F9FA] p-3.5">
          <div className="flex items-center gap-1.5 text-[15px] font-semibold text-gray-900">
            <IcShield size={17} color="#3B82F6" /> BOSS安全提示
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-gray-500">
            BOSS直聘严禁用人单位和招聘者用户做出任何损害求职者合法权益的违法违规行为,包括但不限于扣押求职者证件、收取求职者财物、向求职者集资、让求职者入股、诱导求职者异地入职、异地参加培训、违法违规使用求职者简历等,您一旦发现此类行为,<span style={{ color: COLORS.accent }}>请立即举报</span>
          </p>
        </div>
      </div>

      {/* 底部主按钮 */}
      <div className="shrink-0 px-4 pb-5 pt-2" data-keep-keyboard="true">
        <button
          {...bindTap('jobdetail.chat-open', {
            params: { bossId: boss.id, jobId: job.id },
            beforeTrigger: () => { store.ensureSession(boss.id, job.id); },
          })}
          className="w-full rounded-2xl py-3.5 text-center text-[17px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          {chatted ? t.continueChat : t.chatNow}
        </button>
      </div>
    </div>
  );
};

/** 静态示意地图(不做真实地图交互,wontfix) */
export const StaticMap: React.FC<{ label: string; tall?: boolean }> = ({ label, tall }) => (
  <div className={`relative w-full ${tall ? 'h-72' : 'h-44'} bg-[#EEF3EE]`}>
    <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <path d="M0 40 L400 90" stroke="#D8E2D8" strokeWidth="14" />
      <path d="M60 0 L120 300" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M0 140 L400 120" stroke="#FFFFFF" strokeWidth="8" />
      <path d="M220 0 L260 300" stroke="#D8E2D8" strokeWidth="12" />
      <rect x="20" y="60" width="46" height="30" fill="#DDE7DD" />
      <rect x="150" y="150" width="60" height="36" fill="#E4EDE4" />
      <rect x="280" y="50" width="52" height="40" fill="#DDE7DD" />
    </svg>
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
      <div className="max-w-[240px] truncate rounded-full bg-white px-3 py-1.5 text-[12px] text-gray-800 shadow">{label}</div>
      <div className="mx-auto mt-0.5 h-5 w-4 text-center">
        <svg viewBox="0 0 24 24" fill="#E5484D"><path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" /></svg>
      </div>
    </div>
  </div>
);

export default JobDetailPage;
