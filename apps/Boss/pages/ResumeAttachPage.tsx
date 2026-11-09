import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { Avatar, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcResume, IcUpload, IcCamera, IcChat, IcScan, IcChevronRight, IcImage } from '../res/icons';

type Mode = 'make' | 'upload' | 'video';

/** 附件简历-选择上传方式(IMG_8426/8427/8428):制作/上传/视频 三档 */
const ResumeAttachPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const expects = useBossStore((s) => s.expects);
  const resumeSections = useBossStore((s) => s.resume.sections);
  const primaryExpect = expects[0];
  const [mode, setMode] = useState<Mode>('make');

  const TABS: { v: Mode; icon: typeof IcResume; label: string; sub: string }[] = [
    { v: 'make', icon: IcResume, label: '制作简历', sub: '超多免费简历模板' },
    { v: 'upload', icon: IcUpload, label: '上传简历', sub: 'BOSS会向你索要哦' },
    { v: 'video', icon: IcCamera, label: '视频简历', sub: '用视频展示经历' },
  ];

  return (
    <div className="flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.primaryBtn} 110px, #FFFFFF 240px)` }} data-status-bar-foreground="light">
      <PageHeader title={<span className="text-white">选择上传方式</span>} transparent light />
      <div className="grid grid-cols-3 gap-2.5 px-4 pb-4">
        {TABS.map(({ v, icon: Icon, label, sub }) => (
          <button
            key={v}
            {...action('attach.select.mode', () => {
              setMode(v);
              const viewed = Array.isArray(store.taskAudit.attachmentModes) ? store.taskAudit.attachmentModes as string[] : [];
              store.recordTaskAudit('attachmentModes', viewed.includes(v) ? viewed : [...viewed, v]);
            }, { params: { value: v } })}
            className={`rounded-xl p-3 text-left ${mode === v ? 'bg-white' : 'bg-white/25'}`}
          >
            <span className={`flex items-center gap-1 text-[14px] font-semibold ${mode === v ? '' : 'text-white'}`} style={mode === v ? { color: COLORS.primary } : undefined}>
              <Icon size={15} />{label}
            </span>
            <span className={`mt-0.5 block text-[10px] ${mode === v ? 'text-gray-500' : 'text-white/75'}`}>{sub}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-t-3xl bg-white px-4 pb-6 pt-5" data-scroll-container="main" data-scroll-direction="vertical">
        {mode === 'make' && (
          <>
            <div className="text-[20px] font-bold text-gray-900">请选择简历模板 <span className="text-[13px] font-normal text-gray-500">(使用在线简历极速生成)</span></div>
            <div className="mt-1 text-[13px] text-gray-500">将根据在线简历和您在平台上的联系方式制作简历</div>
            <div className="mt-4 rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[18px] font-bold text-gray-900">{user.nickname}</div>
                  <div className="mt-1 text-[12px] text-gray-500">男|年龄: {user.age}岁|📱 {user.phoneMasked}</div>
                  <div className="text-[12px] text-gray-500">求职意向: {primaryExpect?.position || '待完善'}|期望薪资: {primaryExpect?.salary || '待完善'}|期望城市: {primaryExpect?.city || '待完善'}</div>
                </div>
                <Avatar imgKey="u_me" name={user.nickname} size={52} className="rounded-lg" />
              </div>
              <div className="mt-3 border-l-4 pl-2 text-[14px] font-semibold" style={{ borderColor: COLORS.primary }}>个人优势</div>
              <div className="mt-1.5 space-y-1 text-[12px] text-gray-600">
                <div>个人优势: {resumeSections.advantage || user.advantage}</div>
                <div>教育背景: {user.degree}</div>
                <div>专业技能: python,agent相关</div>
                <div>相关经验: {resumeSections.work || resumeSections.project || '待完善'}</div>
              </div>
              <div className="mt-3 border-l-4 pl-2 text-[14px] font-semibold" style={{ borderColor: COLORS.primary }}>教育经历</div>
              <div className="mt-1.5 flex justify-between text-[12px] text-gray-600">
                <span>{user.school}  {user.degree}  {user.major}</span><span>{user.schoolYears}</span>
              </div>
              <div className="mt-4 flex gap-3">
                <button {...bindTap('attach.edit-open')} className="flex-1 rounded-full border py-2.5 text-center text-[14px]" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>编辑</button>
                <button
                  {...action('attach.make.toast', () => store.showNotice('附件简历生成暂未开放，请点击“我知道了”返回；在线简历内容已保存在统一数据源中。'), { params: {} })}
                  className="flex-1 rounded-full py-2.5 text-center text-[14px] text-white"
                  style={{ backgroundColor: COLORS.primaryBtn }}
                >
                  立即生成
                </button>
              </div>
            </div>
            <div className="mt-5 text-[17px] font-bold text-gray-900">选择其他模板新建</div>
            <div className="mt-1 text-[13px] text-gray-500">将根据在线简历和您在平台上的联系方式制作简历</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[['#2B3A67', 'VIP'], ['#F5E96B', 'VIP']].map(([bg, badge], i) => (
                <button key={i} {...action('attach.make.toast', () => store.showNotice('该简历模板暂未开放，请点击“我知道了”返回。'), { params: {} })} className="relative h-44 overflow-hidden rounded-xl" style={{ backgroundColor: bg as string }}>
                  <span className="absolute left-2 top-2 rounded bg-[#F7B733] px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>
                  <span className="absolute inset-x-3 top-8 text-left text-white" style={i === 1 ? { color: '#333' } : undefined}>
                    <span className="block text-[16px] font-bold">HELLO!直小聘</span>
                    <span className="mt-1 block h-1.5 w-16 rounded bg-current opacity-40" />
                    <span className="mt-1 block h-1.5 w-24 rounded bg-current opacity-30" />
                    <span className="mt-1 block h-1.5 w-20 rounded bg-current opacity-30" />
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {mode === 'upload' && (
          <>
            <div className="text-[22px] font-bold text-gray-900">请选择上传方式</div>
            <div className="mt-1 text-[13px] leading-relaxed text-gray-500">简历建议使用PDF文件,也支持DOC、DOCX、JPG、PNG格式,大小不超过20M</div>
            {[
              { icon: IcChat, label: '微信上传', badge: '推荐', color: '#3DBE5B' },
              { icon: IcImage, label: '从其他应用分享上传', sub: '例如: wps、QQ、百度网盘等', color: '#6B7280' },
              { icon: IcChevronRight, label: '更多上传方式', color: COLORS.primary },
            ].map(({ icon: Icon, label, badge, sub, color }) => (
              <button
                key={label}
                {...action('attach.upload.toast', () => store.showNotice('当前环境暂未接入文档上传，请点击“我知道了”返回。'), { params: {} })}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}><Icon size={20} color={color} /></span>
                  <span className="text-left">
                    <span className="flex items-center gap-2 text-[16px] font-medium text-gray-900">
                      {label}
                      {badge && <span className="rounded bg-[#E6F5F4] px-1.5 py-0.5 text-[11px]" style={{ color: COLORS.primary }}>{badge}</span>}
                    </span>
                    {sub && <span className="mt-0.5 block text-[12px] text-gray-400">{sub}</span>}
                  </span>
                </span>
                <IcChevronRight size={17} className="text-gray-300" />
              </button>
            ))}
            <div className="mt-5 text-[15px] font-semibold text-gray-900">使用专业级简历模板生成简历?</div>
            <button {...action('attach.upload.toast', () => store.showNotice('专属简历模板暂未开放，请点击“我知道了”返回。'), { params: {} })} className="mt-2.5 flex w-full items-center justify-between rounded-xl border border-[#FFD9B8] bg-[#FFF7EF] p-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF9A4D] text-white"><IcResume size={19} /></span>
                <span className="text-left">
                  <span className="block text-[15px] font-semibold text-[#C2701E]">专属简历模版</span>
                  <span className="mt-0.5 block text-[12px] text-[#C2701E]/70">专业面试官好评 | 一键生成 | 多款样式</span>
                </span>
              </span>
              <IcChevronRight size={17} className="text-[#C2701E]/60" />
            </button>
            <p className="mt-4 text-[12px] leading-relaxed text-gray-400">🛡 附件简历在BOSS向你索取且经你同意,或你主动发送时才会提供给对方。BOSS将你转发给同事时,可能会将附件简历一并转发。</p>
          </>
        )}

        {mode === 'video' && (
          <>
            <div className="text-[22px] font-bold text-gray-900">选择一种方式上传视频附件</div>
            <div className="mt-1 text-[13px] text-gray-500">视频时间需控制在10s~120s内,视频大小不超过300M</div>
            {[
              { icon: IcCamera, label: '拍摄视频简历', sub: '可以拍摄自我介绍或是才艺展示', color: '#4A9BEB' },
              { icon: IcUpload, label: '手机本地上传', color: '#3DBE5B' },
              { icon: IcScan, label: '扫码上传', color: '#4A9BEB' },
            ].map(({ icon: Icon, label, sub, color }) => (
              <button
                key={label}
                {...action('attach.video.toast', () => store.showNotice('视频简历上传暂未开放，请点击“我知道了”返回。'), { params: {} })}
                className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-100 p-4 shadow-sm"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `${color}22` }}><Icon size={20} color={color} /></span>
                  <span className="text-left">
                    <span className="block text-[16px] font-medium text-gray-900">{label}</span>
                    {sub && <span className="mt-0.5 block text-[12px] text-gray-400">{sub}</span>}
                  </span>
                </span>
                <IcChevronRight size={17} className="text-gray-300" />
              </button>
            ))}
            <p className="mt-6 text-[12px] leading-relaxed text-gray-400">🛡 附件简历在 BOSS 向你索取且经你同意,或你主动发送时才会提供给对方。BOSS将你转发给同事时,可能会将附件简历一并转发。</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ResumeAttachPage;
