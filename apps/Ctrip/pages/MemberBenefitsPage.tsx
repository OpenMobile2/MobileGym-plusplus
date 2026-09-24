import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 会员权益中心(spec member.benefits)。家庭/学生/职场 tab;权益图标wontfix(展示为主)。 */
const TABS = [{ id: 'family', label: '家庭' }, { id: 'student', label: '学生' }, { id: 'work', label: '职场' }];
const BENEFITS = ['机场贵宾厅', '报销免邮', '里程兑换', '机票专享价', '酒店延迟退房', '专属客服', '积分加速', '生日礼遇'];

export default function MemberBenefitsPage() {
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const user = useCtripStore((s) => s.user);
  const [tab, setTab] = React.useState('family');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="会员中心" />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 会员头卡 */}
        <div className="mx-2 mt-2 rounded-2xl bg-gradient-to-br from-[#2B3A55] to-[#4A5A7A] p-4 text-white">
          <div className="text-[16px] font-semibold">◇ {user.memberLevel}</div>
          <div className="text-[13px] text-[#FFD98A] mt-1">当前积分 {user.points} · 距下一等级还需 713</div>
        </div>

        {/* tab */}
        <div className="bg-white mx-2 mt-2 rounded-t-xl flex">
          {TABS.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'member.tab.select.family' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
              className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
            >{t.label}权益</button>
          ))}
        </div>

        {/* 权益网格 */}
        <div className="bg-white mx-2 rounded-b-xl grid grid-cols-4 gap-y-4 py-4">
          {BENEFITS.map((b) => (
            <button key={b} {...bindTap({ kind: 'action', id: 'member.benefit.wontfix' }, { params: { b }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
              <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFE9B0] to-[#FFD07A] flex items-center justify-center text-[16px]">★</span>
              <span className="text-[11px] text-[#555555] text-center px-1 leading-tight">{b}</span>
            </button>
          ))}
        </div>

        {/* 推荐活动 */}
        <div className="bg-white mx-2 mt-2 rounded-xl px-4 py-3 text-[13px] text-[#666666]">◆ 推荐活动:积分兑换好礼,限时加倍</div>
      </div>
      {toast}
    </div>
  );
}
