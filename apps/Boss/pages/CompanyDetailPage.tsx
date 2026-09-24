import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { COMPANY_IMGS } from '../assets';
import { CompanyLogo, PageHeader, Chip, Avatar, MissingContent } from '../components/common';
import { COLORS } from '../res/colors';
import { IcStar, IcShare, IcReport, IcClock, IcCalendar, IcBriefcase, IcChevronRight } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';

const C = BOSS_CONFIG;

/** 公司详情页(IMG_8495):深色背景 + 福利/地址/介绍/相册/在招职位。 */
const CompanyDetailPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const companyId = searchParams.get('companyId') ?? '';
  const company = C.companies.find((c) => c.id === companyId);
  const favorited = useBossStore((s) => s.favoriteCompanyIds.includes(companyId));
  const [album, setAlbum] = useState<'photo' | 'environment'>('photo');
  const [introExpanded, setIntroExpanded] = useState(false);
  if (!company) return <MissingContent text="公司不存在或已被移除" />;
  const jobs = C.jobs.filter((j) => j.companyId === company.id);

  return (
    <div className="flex h-full flex-col bg-[#2A211D] text-white" data-status-bar-foreground="light">
      <PageHeader
        transparent
        light
        right={
          <div className="flex items-center gap-3 pr-1 text-white">
            <button
              {...action('company.favorite.toggle', () => { store.toggleFavoriteCompany(company.id); store.showToast(favorited ? '已取消收藏' : '收藏成功'); }, { params: { companyId: company.id } })}
              aria-label="收藏公司"
            >
              <IcStar size={19} color={favorited ? '#F7B733' : 'white'} fill={favorited ? '#F7B733' : 'none'} />
            </button>
            <button {...action('company.share.system', () => {
              const launched = sharePlainText(`【BOSS直聘】${company.name}\n${company.stage} · ${company.scale} · ${company.industry}`, {
                onResult: (r) => { if (r.resultCode === 'OK') store.showToast(t.shareSuccess); },
              });
              if (!launched) store.showNotice('当前环境无法打开系统分享，请点击“我知道了”返回。');
            }, { params: {} })} aria-label="分享公司">
              <IcShare size={18} />
            </button>
            <button {...action('company.report.notice', () => store.showNotice('举报入口暂未开放，请点击“我知道了”返回。'), { params: {} })} aria-label="举报公司"><IcReport size={18} /></button>
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[26px] font-bold">{company.name}</div>
            <div className="mt-1.5 text-[13px] text-white/60">{company.stage} · {company.scale} · {company.industry}</div>
          </div>
          <CompanyLogo logoKey={company.logo} name={company.name} size={56} className="rounded-xl" />
        </div>

        <div className="mt-5 flex items-center gap-5 text-[14px]">
          <span className="flex items-center gap-1.5"><IcClock size={15} className="text-white/60" />{company.workHours}</span>
          <span className="flex items-center gap-1.5"><IcCalendar size={15} className="text-white/60" />{company.restDays}</span>
          <span className="flex items-center gap-1.5"><IcBriefcase size={15} className="text-white/60" />{company.overtime}</span>
          <IcChevronRight size={15} className="ml-auto text-white/40" />
        </div>

        <div className="mt-4 flex gap-2.5 overflow-x-auto" data-scroll-container="welfare" data-scroll-direction="horizontal">
          {company.welfare.map((w) => (
            <span key={w} className="shrink-0 rounded-lg border border-white/20 px-4 py-3 text-[13px] text-white/85">{w}</span>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[18px] font-bold">公司地址</span>
          <button {...action('company.navigate.toast', () => store.showNotice(`当前仅有 1 个办公地址：${company.address}`), { params: {} })} className="flex items-center text-[13px] text-white/60">全部地址 <IcChevronRight size={14} /></button>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="min-w-0 truncate text-[14px] text-white/85">{company.address}</span>
          <button
            {...action('company.navigate.toast', () => store.showNotice('当前环境暂未接入地图导航，请点击“我知道了”返回。'), { params: {} })}
            className="shrink-0 rounded-full border border-white/40 px-4 py-1.5 text-[13px]"
          >
            A 导航
          </button>
        </div>

        <div className="mt-6 text-[18px] font-bold">公司介绍</div>
        <p className={`mt-2 text-[14px] leading-relaxed text-white/80 ${introExpanded ? '' : 'line-clamp-4'}`}>{company.intro}</p>
        {!introExpanded && (
          <button {...action('company.intro.expand', () => { setIntroExpanded(true); store.recordTaskAudit('companyIntroExpanded', company.id); }, { params: {} })} className="mt-1 text-[13px]" style={{ color: COLORS.primary }}>
            查看更多
          </button>
        )}

        <div className="mt-6 flex items-center justify-between">
          <span className="text-[18px] font-bold">公司相册</span>
          <button {...action('company.album.notice', () => store.showNotice(`已展示全部 ${company.photos.length} 张公司照片，可横向滑动查看。`), { params: {} })} className="flex items-center text-[13px] text-white/60">查看全部 <IcChevronRight size={14} /></button>
        </div>
        <div className="mt-3 flex gap-2">
          {(['photo', 'environment'] as const).map((v) => (
            <button
              key={v}
              {...action('company.select.album', () => { setAlbum(v); store.recordTaskAudit('companyAlbum', { companyId: company.id, album: v }); }, { params: { value: v } })}
              className={`rounded-full px-3.5 py-1.5 text-[13px] ${album === v ? 'bg-white text-gray-900' : 'bg-white/15 text-white/80'}`}
            >
              {v === 'photo' ? '公司照片' : '工作环境'}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2.5 overflow-x-auto" data-scroll-container="album" data-scroll-direction="horizontal">
          {(album === 'photo' ? company.photos : [...company.photos].reverse()).map((p) => (
            COMPANY_IMGS[p]
              ? <img key={p} src={COMPANY_IMGS[p]} alt="" className="h-44 w-64 shrink-0 rounded-xl object-cover" />
              : <div key={p} className="h-44 w-64 shrink-0 rounded-xl bg-white/10" />
          ))}
        </div>

        {/* 在招职位(白色抽屉) */}
        <div className="-mx-4 mt-6 rounded-t-3xl bg-white px-4 pb-2 pt-3 text-gray-900">
          <div className="mx-auto h-1 w-10 rounded-full bg-gray-200" />
          <div className="mt-2 text-[17px] font-bold">职位 <span className="text-[13px] font-normal text-gray-400">{jobs.length}</span></div>
          <div className="mt-2 flex flex-col gap-2.5 pb-2">
            {jobs.map((job) => {
              const boss = C.bosses.find((b) => b.id === job.bossId)!;
              return (
                <button key={job.id} {...bindTap('company.job-open', { params: { jobId: job.id } })} className="rounded-xl border border-gray-100 p-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="truncate text-[15px] font-semibold">{job.title}</span>
                    <span className="shrink-0 text-[15px] font-semibold" style={{ color: COLORS.accent }}>{job.salary}</span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">{job.tags.slice(0, 3).map((tag) => <Chip key={tag}>{tag}</Chip>)}</div>
                  <div className="mt-2 flex items-center gap-1.5 text-[12px] text-gray-500">
                    <Avatar imgKey={boss.avatar} name={boss.name} size={20} />{boss.name} · {boss.title}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailPage;
