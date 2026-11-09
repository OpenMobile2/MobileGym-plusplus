import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, OrangeBtn, C } from '../components/ui';
import {
  IcServiceTour, IcServiceBus, IcPlane, IcServiceTransit,
} from '../res/icons';

// 旅行 tab 着陆页(证据 s44,浏览版)。节点: travel.home
const TOP_ENTRIES: { Icon: LucideIcon; label: string; color: string }[] = [
  { Icon: IcServiceTour, label: '私家团', color: '#7C5CFC' },
  { Icon: IcServiceBus, label: '包车', color: '#3C7CFC' },
  { Icon: IcPlane, label: '包车+接送机', color: '#04B578' },
  { Icon: IcServiceTransit, label: '跨城出行', color: '#FF7D41' },
];

export default function TravelHomePage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const [cat, setCat] = React.useState<'hotel' | 'flight' | 'train'>('hotel');

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="旅行" />
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-4 gap-2 mb-2.5">
          {TOP_ENTRIES.map(({ Icon, label, color }) => (
            <button
              key={label}
              onClick={() => toast('该功能暂未开放')}
              className="rounded-xl py-3 border-none text-white text-[12px]"
              style={{ background: color }}
            >
              <Icon size={22} className="mx-auto mb-1" strokeWidth={2} />
              {label}
            </button>
          ))}
        </div>

        <Card className="p-4 mb-2.5">
          <div className="flex gap-5 mb-3">
            {([['hotel', '酒店'], ['flight', '机票'], ['train', '火车票']] as const).map(([k, label]) => (
              <button
                key={k}
                {...bindTap({ kind: 'action', id: 'travel.home.tab' }, { onTrigger: () => setCat(k) })}
                className="bg-transparent border-none text-[16px] p-0"
                style={{
                  color: cat === k ? C.dark : C.sub,
                  fontWeight: cat === k ? 700 : 400,
                  borderBottom: cat === k ? `2px solid ${C.orange}` : '2px solid transparent',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {cat === 'hotel' ? (
            <>
              <div className="flex gap-3 text-[12px] text-app-text-muted mb-2">
                <span style={{ color: C.orangeDeep, fontWeight: 600 }}>国内</span>
                <span>钟点房</span>
                <span>民宿</span>
                <span>海外</span>
              </div>
              <div className="text-[22px] font-bold text-app-text pb-2 border-b border-app-border">云江市</div>
              <button onClick={() => toast('位置搜索暂未开放')} className="w-full text-left py-2.5 border-b border-app-border bg-transparent border-x-0 border-t-0 text-[14px] text-app-text-muted">
                酒店名/位置/品牌 <span className="float-right">附近 ›</span>
              </button>
              <div className="flex items-center py-2.5 border-b border-app-border text-[14px] text-app-text">
                <span className="font-semibold">今天 7月13日</span>
                <span className="mx-2 text-app-text-muted">—</span>
                <span className="font-semibold">明天 7月14日</span>
                <span className="ml-auto text-[12px] text-app-text-muted">共1晚</span>
              </div>
              <div className="flex gap-2 py-2.5 text-[12px] text-app-text-muted">
                {['价格/星级', '4.8分以上', '大床房', '双床房', '免费取消'].map((t) => (
                  <button key={t} onClick={() => toast('筛选暂未开放')} className="px-2 py-1 rounded bg-app-bg border-none text-[12px] text-app-text-muted shrink-0">
                    {t}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="py-4 text-[14px] text-app-text-muted">
              {cat === 'flight' ? '云江 → 北京 · 今天 7月13日' : '云江 → 长沙 · 今天 7月13日'}
            </div>
          )}
          <OrangeBtn
            className="mt-3"
            bind={bindTap(
              { kind: 'action', id: 'travel.home.search' },
              { onTrigger: () => toast('该功能暂未开放') },
            )}
          >
            查询
          </OrangeBtn>
        </Card>
      </div>
    </div>
  );
}
