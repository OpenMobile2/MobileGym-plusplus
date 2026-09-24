import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { CIRCLE_TABS } from '../constants';
import { TopBar } from '../components/TopBar';
import { ItemCard } from '../components/ItemCard';
import { Avatar } from '../components/ItemImage';
import { useToast } from '../components/ui';
import { IcUsers, IcTrend } from '../res/icons';

/** 热门行情静态行(Q1 浏览壳) */
const MARKET_QUOTES = [
  { name: '第四套人民币 80版 100元', price: '2350', trend: '+3.2%' },
  { name: '熊猫币 30g 999足银', price: '520', trend: '-1.1%' },
  { name: '建国钞 面值100', price: '480', trend: '+0.8%' },
  { name: '龙年生肖纪念币', price: '36', trend: '+5.6%' },
];

export default function CircleDetailPage() {
  const { circleId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const circle = useXianyuStore((s) => s.circles.find((c) => c.id === circleId));
  const items = useXianyuStore((s) => s.items);
  const recordTaskAudit = useXianyuStore((s) => s.recordTaskAudit);

  const tab = searchParams.get('tab') ?? 'goods';

  const goods = items.filter((i) => i.sellerId !== 'me');

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title={circle ? circle.name : '圈内'} />

      {/* 圈子简介头 */}
      {circle && (
        <div className="bg-white shrink-0 px-3 py-3 flex items-center gap-3">
          <Avatar seed={circle.id} name={circle.name} size={48} />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-[#111111] truncate">{circle.name}</div>
            <div className="text-[11px] text-[#999999] truncate flex items-center gap-1">
              <IcUsers size={11} /> {circle.memberCount >= 10000 ? `${(circle.memberCount / 10000).toFixed(1)}万成员` : `${circle.memberCount}成员`} · {circle.desc}
            </div>
          </div>
          <button
            onClick={() => showToast('该功能暂未开放')}
            className="shrink-0 text-[12px] px-3 h-7 rounded-full bg-[#FFE411] text-[#3A2E00] border-none cursor-pointer font-medium"
          >
            发帖
          </button>
        </div>
      )}

      {/* 子 tab */}
      <div className="bg-white shrink-0 flex items-center gap-6 px-4 border-b border-[#EEEEEE]">
        {CIRCLE_TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'circle.tab.select.target' },
                {
                  params: { target: t.id },
                  onTrigger: () => {
                    recordTaskAudit('circleTabViewed', { circleId, tab: t.id });
                    setSearchParams((p) => { p.set('tab', t.id); return p; }, { replace: true });
                  },
                },
              )}
              className={`bg-transparent border-none cursor-pointer py-2.5 text-[14px] relative ${
                active ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-0.5 rounded bg-[#FFE411]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="CircleDetailPage-main" data-scroll-direction="vertical">
        {tab === 'goods' && (
          <div className="p-2 flex gap-2 items-start">
            <div className="flex-1 min-w-0">{goods.filter((_, i) => i % 2 === 0).map((it) => <ItemCard key={it.id} item={it} />)}</div>
            <div className="flex-1 min-w-0">{goods.filter((_, i) => i % 2 === 1).map((it) => <ItemCard key={it.id} item={it} />)}</div>
          </div>
        )}

        {tab === 'market' && (
          <div className="bg-white mt-2">
            {MARKET_QUOTES.map((q) => {
              const up = q.trend.startsWith('+');
              return (
                <div key={q.name} className="flex items-center gap-2 px-3 py-3 border-b border-[#F4F4F4]">
                  <IcTrend size={18} className="text-[#FF8A00]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#111111] truncate">{q.name}</div>
                    <div className="text-[11px] text-[#999999]">近期成交行情</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#FF3B30] font-bold text-[15px]"><span className="text-[11px]">¥</span>{q.price}</div>
                    <div className={`text-[11px] ${up ? 'text-[#FF3B30]' : 'text-[#1CB854]'}`}>{q.trend}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'talk' && (
          <div className="flex flex-col items-center gap-3 pt-16">
            <div className="text-[13px] text-[#999999]">圈内交流区 · 抢先浏览</div>
            <button
              onClick={() => showToast('该功能暂未开放')}
              className="text-[13px] px-4 h-9 rounded-full bg-[#FFE411] text-[#3A2E00] border-none cursor-pointer font-medium"
            >
              我要发帖
            </button>
          </div>
        )}
      </div>
      {toast}
    </div>
  );
}
