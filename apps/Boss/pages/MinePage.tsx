import React from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { Avatar } from '../components/common';
import { COLORS } from '../res/colors';
import {
  IcChat, IcResume, IcCalendar, IcStar, IcChevronRight, IcUser, IcScan, IcSettings,
  IcVerified, IcGraduation, IcEdit, IcService, IcGuide, IcHome, IcHeart, IcBriefcase,
} from '../res/icons';

/** 我的 tab(IMG_8423) */
const MinePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const vipDays = useBossStore((s) => s.purchases.vipDays);

  const quad = [
    { icon: IcChat, label: t.chatted, tid: 'mine.records-chat-open', params: { tab: 'chatted' } },
    { icon: IcResume, label: t.applied, tid: 'mine.records-applied-open', params: { tab: 'applied' } },
    { icon: IcCalendar, label: t.interviews, tid: 'mine.interview-open', params: {} },
    { icon: IcStar, label: t.favorites, tid: 'mine.favorites-open', params: {} },
  ] as const;

  const common = [
    { icon: IcResume, label: t.onlineResume, sub: '优化增加推荐', tid: 'mine.resume-open', dot: false },
    { icon: IcEdit, label: t.attachResume, sub: '上传/制作简历', tid: 'mine.attach-open', dot: true },
    { icon: IcHeart, label: t.jobIntention, sub: user.jobStatus, tid: 'mine.intention-open', dot: false },
    { icon: IcBriefcase, label: t.jobTools, sub: '提升求职效率', aid: 'mine.tools.toast', dot: false },
  ];
  const others = [
    { icon: IcVerified, label: t.resumeVerify, tid: 'mine.verify-open', dot: true },
    { icon: IcGraduation, label: t.internZone, tid: 'mine.internship-open', dot: false },
    { icon: IcEdit, label: t.careerTest, tid: 'mine.assessment2-open', dot: true },
    { icon: IcService, label: t.myService, tid: 'mine.support-open', dot: false },
    { icon: IcGuide, label: t.guidance, tid: 'mine.guidance-open', dot: false },
    { icon: IcHome, label: t.personalPage, tid: 'mine.profile-open', dot: false },
  ];

  return (
    <div className="flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${COLORS.headerTint} 0%, #FDEEE6 36%, #F5F6F7 180px)` }}>
      <div className="flex items-center justify-end gap-4 px-4 pt-12 text-gray-700">
        <button {...action('mine.switchrole.toast', () => store.showNotice('当前仅提供求职者身份，暂不能切换角色。'), { params: {} })} aria-label="切换职场人"><IcUser size={21} /></button>
        <button {...action('mine.scan.toast', () => store.showNotice('扫一扫暂未开放，请点击“我知道了”返回。'), { params: {} })} aria-label="扫一扫"><IcScan size={21} /></button>
        <button {...bindTap('mine.settings-open')} className="relative" aria-label="设置">
          <IcSettings size={21} /><span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-[#FF4D4F]" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头像行 */}
        <button {...bindTap('mine.resume-open')} className="mt-1 flex w-full items-center justify-between">
          <span className="flex items-center gap-3.5">
            <span className="relative">
              <Avatar imgKey="u_me" name={user.nickname} size={62} />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[10px] text-white" style={{ backgroundColor: COLORS.primaryBtn }}>{user.role}</span>
            </span>
            <span className="text-left">
              <span className="block text-[24px] font-bold text-gray-900">{user.nickname}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[14px] text-gray-600">在线简历 <IcEdit size={14} /></span>
            </span>
          </span>
          <IcChevronRight size={20} className="text-gray-400" />
        </button>

        {/* 四格 */}
        <div className="mt-5 grid grid-cols-4">
          {quad.map(({ icon: Icon, label, tid, params }) => (
            <button key={tid} {...bindTap(tid as never, { params })} className="flex flex-col items-center gap-1.5">
              <Icon size={24} className="text-gray-800" />
              <span className="text-[13px] text-gray-700">{label}</span>
            </button>
          ))}
        </div>

        {/* VIP 横幅 */}
        <button {...bindTap('mine.vip-open')} className="mt-5 flex w-full items-center justify-between rounded-2xl p-4" style={{ background: `linear-gradient(100deg, ${COLORS.vipCard}, #1D454C)` }}>
          <span className="text-left">
            <span className="flex items-center gap-1.5 text-[16px] font-semibold text-[#F5D9A8]">
              <span className="font-serif italic">V</span> {vipDays > 0 ? `VIP 已开通 · 剩余 ${vipDays} 天` : '想快点找到工作? 快升级VIP'}
            </span>
            <span className="mt-0.5 block text-[12px] text-white/50">今日7万人加速中,再不追就晚啦</span>
          </span>
          <span className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium text-[#5C3A1E]" style={{ background: `linear-gradient(90deg, ${COLORS.vipGoldTo}, ${COLORS.vipGoldFrom})` }}>{vipDays > 0 ? '续费' : '去升级'}</span>
        </button>

        {/* 测评/竞争力 双入口 */}
        <div className="mt-3 flex items-center rounded-2xl bg-white px-4 py-3.5">
          <button {...bindTap('mine.assessment-open')} className="flex min-w-0 flex-1 items-center justify-between border-r border-gray-100 pr-3">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[15px] font-semibold text-gray-900">⏱ 16型测评</span>
            <span className="flex items-center text-[12px] text-gray-400">求职方向 <IcChevronRight size={13} /></span>
          </button>
          <button {...bindTap('mine.competitiveness-open')} className="flex min-w-0 flex-1 items-center justify-between pl-3">
            <span className="flex items-center gap-1.5 whitespace-nowrap text-[15px] font-semibold text-gray-900">📈 竞争力分析</span>
            <span className="flex items-center text-[12px] text-gray-400">洞悉竞争 <IcChevronRight size={13} /></span>
          </button>
        </div>

        {/* 常用功能 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-[17px] font-bold text-gray-900">常用功能</div>
          <div className="mt-3.5 grid grid-cols-4 gap-y-4">
            {common.map(({ icon: Icon, label, sub, tid, aid, dot }) => (
              <button
                key={label}
                {...(tid ? bindTap(tid as never) : action(aid!, () => store.showNotice('该求职工具暂未开放，请点击“我知道了”返回。'), { params: {} }))}
                className="flex flex-col items-center gap-1"
              >
                <span className="relative">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E9F7F6]"><Icon size={22} color={COLORS.primary} /></span>
                  {dot && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-[#FF4D4F]" />}
                </span>
                <span className="text-[13px] text-gray-800">{label}</span>
                <span className="text-[10px] text-gray-400">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 其他功能 */}
        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="text-[17px] font-bold text-gray-900">其他功能</div>
          <div className="mt-3.5 grid grid-cols-4 gap-y-5">
            {others.map(({ icon: Icon, label, tid, dot }) => (
              <button key={label} {...bindTap(tid as never)} className="flex flex-col items-center gap-1.5">
                <span className="relative">
                  <Icon size={23} className="text-gray-700" />
                  {dot && <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#FF4D4F]" />}
                </span>
                <span className="text-[13px] text-gray-700">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-1 pb-2 text-center text-[12px] text-gray-400">
          <div>客服电话 400-000-0000  工作时间 8:00-22:00</div>
          <div>老年人直连热线 400-000-0001 工作时间 8:00-22:00</div>
          <div>算法举报与未成年人举报渠道同上</div>
        </div>
      </div>
    </div>
  );
};

export default MinePage;
