import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { JOB_STATUS_OPTIONS } from '../constants';
import { Avatar, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcEdit, IcChevronRight, IcPlus, IcClose } from '../res/icons';
import type { JobStatus } from '../types';

/** 我的在线简历(IMG_8424/8425)。求职状态弹层 URL 驱动(?status=open)。 */
const ResumeOnlinePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const expects = useBossStore((s) => s.expects);
  const sections = useBossStore((s) => s.resume.sections);
  const dateRanges = useBossStore((s) => s.resume.dateRanges);
  const statusOpen = searchParams.get('status') === 'open';

  return (
    <div className="flex h-full flex-col" style={{ background: 'linear-gradient(180deg, #DFF3F2 0%, #F5F6F7 160px)' }}>
      <PageHeader title="我的在线简历" transparent />
      <div className="flex items-center justify-between px-4 py-2">
        <span className="flex items-center gap-1.5 text-[14px] text-gray-700">
          <span style={{ color: COLORS.accent }}>📊</span> 简历诊断 <b style={{ color: COLORS.accent }}>6</b> 项待优化
        </span>
        <button
          {...action('resume.preview.show', () => store.showNotice('简历预览暂未开放，已保存的简历内容不会丢失。'), { params: {} })}
          className="rounded-full border px-3.5 py-1 text-[13px]"
          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
        >
          去查看
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 基本信息 */}
        <div className="rounded-2xl bg-white p-4">
          <div className="rounded-lg bg-[#FFF3EC] px-3 py-2 text-[13px] text-[#FF7D3A]">⚠ 3 项待优化 <span className="float-right">查看 &gt;</span></div>
          <div className="mt-3 flex items-center gap-3.5">
            <Avatar imgKey="u_me" name={user.nickname} size={56} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[20px] font-bold text-gray-900">{user.nickname}</span>
                <span className="rounded px-1.5 py-0.5 text-[11px] text-white" style={{ backgroundColor: COLORS.primaryBtn }}>{user.role}</span>
              </div>
              <div className="mt-1 text-[13px] text-gray-600">{user.gradLabel}|{user.age}岁|{user.degree}</div>
              <div className="mt-1 text-[12px] text-gray-400">📱 {user.phoneMasked}  💬 {user.wechatFilled ? '已填写' : '未填写'}</div>
            </div>
          </div>
        </div>

        {/* 个人优势 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold text-gray-900">个人优势</span>
            <button {...bindTap('resume.edit-advantage', { params: { section: 'advantage' } })} aria-label="编辑个人优势"><IcEdit size={17} className="text-gray-400" /></button>
          </div>
          <p className="mt-2 text-[14px] text-gray-700">{sections.advantage || '添加个人优势'}</p>
        </div>

        {/* 求职状态 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold text-gray-900">求职状态</span>
            <button
              {...action('resume.status.open', () => setSearchParams((p) => { p.set('status', 'open'); return p; }), { params: {} })}
              aria-label="修改求职状态"
            >
              <IcEdit size={17} className="text-gray-400" />
            </button>
          </div>
          <p className="mt-2 text-[14px] text-gray-700">{user.jobStatus}</p>
        </div>

        {/* 求职期望 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[17px] font-bold text-gray-900">求职期望 <span className="text-[13px] font-normal text-gray-300">?</span></span>
            <button {...bindTap('resume.expect-open')} aria-label="管理求职期望"><IcPlus size={18} className="text-gray-400" /></button>
          </div>
          {expects.map((e) => (
            <button key={e.id} {...bindTap('resume.expect-open')} className="mt-2 flex w-full items-center justify-between">
              <span className="text-left">
                <span className="block text-[15px] text-gray-900">{e.position} {e.salary}</span>
                <span className="mt-0.5 block text-[13px] text-gray-400">{e.city}|{e.industry}</span>
              </span>
              <IcChevronRight size={16} className="text-gray-300" />
            </button>
          ))}
        </div>

        {/* 经历各段 */}
        {[
          { key: 'work', title: '工作/实习经历', tid: 'resume.edit-work' },
          { key: 'project', title: '项目经历', tid: 'resume.edit-project' },
        ].map(({ key, title, tid }) => (
          <div key={key} className="mt-3 rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[17px] font-bold text-gray-900">{title}</span>
              <button {...bindTap(tid as never, { params: { section: key } })} aria-label={`添加${title}`}><IcPlus size={18} className="text-gray-400" /></button>
            </div>
            {sections[key] && <p className="mt-2 text-[14px] text-gray-700">{dateRanges[key] ? `${dateRanges[key]}  ` : ''}{sections[key]}</p>}
          </div>
        ))}

        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="rounded-lg bg-[#FFF3EC] px-3 py-2 text-[13px] text-[#FF7D3A]">⚠ 2 项待优化 <span className="float-right">查看 &gt;</span></div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[17px] font-bold text-gray-900">教育经历</span>
            <button {...bindTap('resume.edit-education', { params: { section: 'education' } })} aria-label="编辑教育经历"><IcPlus size={18} className="text-gray-400" /></button>
          </div>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDF0EE] text-[16px]">🎓</span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-medium text-gray-900">{user.school}</span>
              <span className="block text-[13px] text-gray-500">{user.schoolYears}|{user.degree}·{user.major}</span>
            </span>
            <IcChevronRight size={16} className="text-gray-300" />
          </div>
          <span className="mt-2 inline-block rounded border border-[#5B8DEF] px-1.5 py-0.5 text-[11px] text-[#5B8DEF]">{user.schoolTag}</span>
          {sections.education && <p className="mt-2 text-[14px] text-gray-700">{dateRanges.education ? `${dateRanges.education}  ` : ''}{sections.education}</p>}
        </div>

        {/* 自定义添加 */}
        <div className="mt-4 px-1 text-[17px] font-bold text-gray-900">自定义添加</div>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          {['社团/组织经历', '所获荣誉', '资格证书', '志愿者服务经历', '专业技能'].map((label) => (
            <button key={label} {...bindTap('resume.edit-custom', { params: { section: `custom:${label}` } })} className="flex items-center justify-between rounded-xl bg-white px-4 py-4">
              <span className="text-[14px] text-gray-800">{label}</span>
              <span className="flex min-w-0 items-center gap-2">
                {sections[`custom:${label}`] && <span className="max-w-24 truncate text-[12px] text-gray-400">{sections[`custom:${label}`]}</span>}
                <IcPlus size={17} className="shrink-0 text-gray-400" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 底部预览浮条 */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-6 rounded-full bg-white px-6 py-2.5 shadow-lg">
          <button {...action('resume.preview.show', () => store.showNotice('简历预览暂未开放，已保存的简历内容不会丢失。'), { params: {} })} className="flex items-center gap-1.5 text-[15px] text-gray-800">👁 预览</button>
          <span className="text-gray-300">☰</span>
        </div>
      </div>

      {/* 求职状态弹层(IMG_8502 同款) */}
      {statusOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-2xl bg-white px-4 pb-8 pt-4">
            <div className="flex items-center justify-between">
              <div className="text-[18px] font-semibold text-gray-900">求职状态</div>
              <button onClick={() => navigate(-1)} className="p-1 text-gray-500" aria-label="关闭"><IcClose size={20} /></button>
            </div>
            {JOB_STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                {...action('resume.status.open', () => { store.setJobStatus(opt.value as JobStatus); navigate(-1); }, { params: { value: opt.value } })}
                className="flex w-full items-center justify-between border-b border-gray-50 py-4"
              >
                <span className="text-[16px]" style={user.jobStatus === opt.value ? { color: COLORS.primary, fontWeight: 600 } : { color: '#1F2937' }}>{opt.value}</span>
                {user.jobStatus === opt.value && <span style={{ color: COLORS.primary }}>✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeOnlinePage;
