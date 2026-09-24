import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { Avatar, EmptyBox, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcClose } from '../res/icons';

const C = BOSS_CONFIG;

/** 面试日程(IMG_8429/8430/8433):日程/历史 + 加入面试间弹层(URL 驱动)+ 添加面试 */
const InterviewSchedulePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const store = useBossStore();
  const interviews = useBossStore((s) => s.interviews);
  const [tab, setTab] = useState<'schedule' | 'history'>('schedule');
  const roomOpen = searchParams.get('room') === 'open';
  const [link, setLink] = useState('');

  const list = tab === 'schedule' ? interviews : store.interviewHistory;

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader
        title="面试日程"
        right={
          <button
            {...action('interview.select.tab', () => { const next = tab === 'schedule' ? 'history' : 'schedule'; setTab(next); store.recordTaskAudit('interviewTab', next); }, { params: { value: tab === 'schedule' ? 'history' : 'schedule' } })}
            className="whitespace-nowrap pr-1 text-[15px] text-gray-700"
          >
            {tab === 'schedule' ? '历史面试' : '面试日程'}
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <div className="pt-24"><EmptyBox text={tab === 'schedule' ? '暂无未完成面试' : '暂无历史面试'} /></div>
        ) : (
          <div className="px-4 pt-3">
            {list.map((iv) => {
              const boss = C.bosses.find((b) => b.id === iv.bossId)!;
              const company = C.companies.find((c) => c.id === boss.companyId)!;
              return (
                <div key={iv.id} className="mb-3 rounded-xl border border-gray-100 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar imgKey={boss.avatar} name={boss.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-semibold text-gray-900">{boss.name} · {company.name}</div>
                      <div className="mt-0.5 text-[13px] text-gray-500">{iv.type === 'online' ? '线上面试' : '线下面试'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[15px] font-semibold" style={{ color: COLORS.accent }}>{iv.date}</div>
                      <div className="text-[13px] text-gray-500">{iv.time}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {tab === 'schedule' && list.length === 0 && (
          <div className="mx-8 -mt-4 rounded-lg bg-gray-700/90 px-4 py-2.5 text-center text-[13px] text-white">
            添加Boss未正式邀约的面试,统一管理更方便
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-3 border-t border-gray-100 px-4 py-3">
        <button
          {...action('interview.room.open', () => setSearchParams((p) => { p.set('room', 'open'); return p; }), { params: {} })}
          className="flex-1 rounded-full border py-3 text-center text-[15px]"
          style={{ borderColor: COLORS.primary, color: COLORS.primary }}
        >
          加入面试间
        </button>
        <button
          {...bindTap('interview.add-open')}
          className="flex-1 rounded-full py-3 text-center text-[15px] font-medium text-white"
          style={{ backgroundColor: COLORS.primaryBtn }}
        >
          添加面试
        </button>
      </div>

      {/* 加入面试间弹层(IMG_8433,URL 驱动) */}
      {roomOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40">
          <div className="rounded-t-2xl bg-white px-4 pb-8 pt-4" data-keep-keyboard="true">
            <div className="flex items-center justify-between">
              <span className="text-[18px] font-semibold text-gray-900">加入面试间</span>
              <button onClick={() => navigate(-1)} className="p-1 text-gray-500" aria-label="关闭"><IcClose size={20} /></button>
            </div>
            <input
              {...({ 'data-action': 'interview.link.input', 'data-action-type': 'input' } as object)}
              data-keep-keyboard="true"
              autoFocus
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="请输入面试链接"
              className="mt-4 w-full border-b border-gray-200 pb-2 text-[15px] outline-none placeholder:text-gray-300"
            />
            <button
              data-keep-keyboard="true"
              {...action('interview.room.join', () => {
                if (!link.trim()) { store.showToast('请输入面试链接'); return; }
                store.showNotice('当前环境暂未接入在线视频面试，请点击“我知道了”返回。');
              }, { params: { value: link } })}
              className={`mt-5 w-full rounded-full py-3 text-center text-[15px] text-white ${link ? '' : 'opacity-50'}`}
              style={{ backgroundColor: '#BFE8E6', color: link ? '#0E8F8B' : undefined }}
            >
              加入面试间
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InterviewSchedulePage;
