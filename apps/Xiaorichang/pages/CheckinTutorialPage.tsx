import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

/** 打卡教程(s222)。文案为真机官方原文,是计分规则的独立证据链。 */
export default function CheckinTutorialPage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.checkinTutorial} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="space-y-4 text-sm leading-relaxed text-[#424242]">
          <div className="rounded-2xl bg-[#F8F8F8] p-4">
            <b>完成打卡</b>
            <p className="mt-1 text-[#6B7280]">点击习惯图标即可完成打卡,并获得相应的光芒值。</p>
          </div>
          <div className="rounded-2xl bg-[#F8F8F8] p-4">
            <b>标记失败</b>
            <p className="mt-1 text-[#6B7280]">标记失败后,将扣除相应的光芒值。</p>
          </div>
          <div className="rounded-2xl bg-[#F8F8F8] p-4">
            <b>【待定】</b>
            <p className="mt-1 text-[#6B7280]">【待定】即未完成状态,不获得也不扣除光芒值。</p>
          </div>
        </div>
        <button {...action('checkin.tutorial.guide.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="mt-4 w-full rounded-2xl bg-[#F8F8F8] py-3 text-sm text-[#9AA5B1]">阅读入门指南 ›</button>
      </div>
      <div className="px-5 pb-8">
        <button {...action('checkin.tutorial.dismiss', () => back())}
          className="w-full rounded-full py-3 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          我知道了
        </button>
      </div>
    </div>
  );
}
