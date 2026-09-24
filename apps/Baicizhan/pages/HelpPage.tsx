import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { IcChevronRight } from '../res/icons';

const HOT = ['如何体验押韵模式?', '同桌功能入口在哪?', '如何解除同桌关系?', '如何使用同桌邀请口令?', '如何找到每日一句 / 晨读箱?', '如何获得铜板?', '如何切换词书?', '怎么升级 APP 版本?'];
const FAQ = ['学习相关问题', '账号与登录', '会员与铜板', '硬件与配套'];

export default function HelpPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title="帮助与反馈" />
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mx-4 mt-2 flex h-28 items-center justify-center rounded-2xl bg-[#2F58E8] text-3xl">🎧🎧🎧</div>
        <div className="px-4 pt-4 text-sm font-bold text-[#33405C]">热门问题</div>
        <div className="mt-2 bg-white">
          {HOT.map((q) => (
            <button key={q} {...action('help.question.wontfixToast', toast)} className="flex w-full items-center border-b border-[#F4F4F4] px-4 py-3.5 text-left text-sm text-[#33405C]">
              {q}<IcChevronRight size={16} color="#C9CDD3" className="ml-auto" />
            </button>
          ))}
        </div>
        <div className="px-4 pt-4 text-sm font-bold text-[#33405C]">常见问题</div>
        <div className="mt-2 bg-white">
          {FAQ.map((q) => (
            <button key={q} {...action('help.question.wontfixToast', toast)} className="flex w-full items-center border-b border-[#F4F4F4] px-4 py-3.5 text-left text-sm text-[#33405C]">
              {q}<IcChevronRight size={16} color="#C9CDD3" className="ml-auto" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
