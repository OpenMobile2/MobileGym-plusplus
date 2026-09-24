import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import {
  IcBuilding, IcResume, IcBriefcase, IcSearch, IcEdit, IcUser, IcHeart, IcBook, IcPlus,
} from '../res/icons';

const C = BOSS_CONFIG;
const QUICK_ICONS = [IcBuilding, IcResume, IcBriefcase, IcSearch, IcBook, IcUser, IcHeart, IcEdit];

/** 客服直直(IMG_8446):八格快捷 + FAQ 分类 */
const SupportPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();
  const [tab, setTab] = useState(C.faq.tabs[0]);
  const [openQ, setOpenQ] = useState('');

  const NAV_QUICK: Record<string, string> = {
    city: 'support.city-open',
    status: 'support.status-open',
    greeting: 'support.greeting-open',
    history: 'support.records-open',
    favorites: 'support.favorites-open',
    profile: 'support.profileedit-open',
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-white">
        <PageHeader title={<span>客服直直<span className="block text-[11px] font-normal text-gray-400">部分内容由AI生成</span></span>} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="py-2 text-center text-[12px] text-gray-400">19:14</div>
        <div className="rounded-2xl bg-white p-4">
          <div className="grid grid-cols-4 gap-y-5">
            {C.faq.quick.map((q, i) => {
              const Icon = QUICK_ICONS[i % QUICK_ICONS.length];
              const tid = NAV_QUICK[q.id];
              return (
                <button
                  key={q.id}
                  {...(tid
                    ? bindTap(tid as never)
                    : action('support.quick.toast', () => store.showNotice('该服务暂未开放，请点击“我知道了”返回。'), { params: {} }))}
                  className="flex flex-col items-center gap-1.5"
                >
                  <Icon size={22} color={COLORS.primary} />
                  <span className="text-[12px] text-gray-700">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-white p-4">
          <div className="flex items-center gap-5 border-b border-gray-100 pb-2">
            {C.faq.tabs.map((v) => (
              <button
                key={v}
                {...action('support.faq.answer', () => setTab(v), { params: {} })}
                className="relative pb-1"
              >
                <span className={tab === v ? 'text-[15px] font-bold text-gray-900' : 'text-[14px] text-gray-500'}>{v}</span>
                {tab === v && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-7 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
              </button>
            ))}
          </div>
          {(C.faq.items[tab] ?? []).map((item) => (
            <div key={item.q} className="border-b border-gray-50 last:border-0">
              <button
                {...action('support.faq.answer', () => setOpenQ(openQ === item.q ? '' : item.q), { params: {} })}
                className="block w-full py-3 text-left text-[15px]"
                style={{ color: COLORS.accent }}
              >
                {item.q}
              </button>
              {openQ === item.q && <p className="pb-3 text-[13px] leading-relaxed text-gray-600">{item.a}</p>}
            </div>
          ))}
          <div className="mt-2 text-center text-[13px] text-gray-500">查看更多 ⌄</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 bg-white px-4 py-2.5" data-keep-keyboard="true">
        <input
          data-keep-keyboard="true"
          placeholder="请尽量详细描述您的问题"
          onKeyDown={(e) => { if (e.key === 'Enter') store.showNotice('当前环境未接入人工客服，消息不会发送。请点击“我知道了”返回。'); }}
          className="h-10 min-w-0 flex-1 rounded-full bg-[#F5F5F5] px-4 text-[14px] outline-none"
        />
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-500"><IcPlus size={18} /></span>
      </div>
    </div>
  );
};

export default SupportPage;
