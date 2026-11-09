import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, C } from '../components/ui';
import {
  IcServiceFuel, IcZap, IcServiceDriver, IcWrench, IcServicePool,
  IcServiceRental, IcStore, IcServiceLoan, IcLifeBuoy, IcServiceMore,
  IcServiceRide, IcServiceTransit,
} from '../res/icons';

// 车主 tab 着陆页(证据 s45,浏览版)。节点: owner.home
const GRID: { label: string; Icon: LucideIcon }[] = [
  { label: '优惠加油', Icon: IcServiceFuel },
  { label: '滴滴充电', Icon: IcZap },
  { label: '叫代驾', Icon: IcServiceDriver },
  { label: '滴滴年检', Icon: IcWrench },
  { label: '特惠洗车', Icon: IcServicePool },
  { label: '成为司机', Icon: IcServiceRental },
  { label: '小桔养车', Icon: IcStore },
  { label: '高价卖车', Icon: IcServiceRide },
  { label: '车主用桔', Icon: IcStore },
  { label: '车抵贷', Icon: IcServiceLoan },
  { label: '滴滴保养', Icon: IcWrench },
  { label: '道路救援', Icon: IcLifeBuoy },
  { label: '办理ETC', Icon: IcServiceTransit },
  { label: '更多', Icon: IcServiceMore },
];

const STATIONS: [string, string, string, string][] = [
  ['云江石化兴二路加油站', '快枪 · 卫生间 · 便利店 · 24小时营业', '¥7.02/升', '820m'],
  ['安达石化云桥加油站', '卫生间 · 便利店 · 24小时营业', '¥6.99/升', '1.7km'],
  ['明辉石化落霞河加油站', '卫生间 · 便利店', '¥7.02/升', '2.8km'],
];

export default function OwnerHomePage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="车主" />
      <div className="flex-1 overflow-y-auto p-3">
        <div className="flex gap-5 px-1 mb-2.5">
          <span className="text-[16px] font-bold text-app-text" style={{ borderBottom: `2px solid ${C.orange}` }}>车主服务</span>
          <button {...bindTap('hitch.fromOwner')} className="bg-transparent border-none text-[16px] text-app-text-muted p-0">顺风车</button>
        </div>
        <button
          onClick={() => toast('车主认证暂未开放')}
          className="w-full rounded-xl p-4 mb-2.5 border-none text-left text-white"
          style={{ background: 'linear-gradient(90deg,#FF9A3D,#FF6A2B)' }}
        >
          <div className="text-[16px] font-bold">认证领 100元礼包</div>
          <div className="text-[12px] opacity-90 mt-0.5">添加爱车享专属优惠 · 车主中心 ›</div>
        </button>
        <Card className="px-2 py-3 mb-2.5">
          <div className="grid grid-cols-5 gap-y-4">
            {GRID.map(({ label, Icon }) => (
              <button
                key={label}
                {...bindTap({ kind: 'action', id: 'owner.home.stub' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="flex flex-col items-center gap-1 bg-transparent border-none"
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#FFF1E8' }}>
                  <Icon size={18} style={{ color: C.orangeDeep }} />
                </span>
                <span className="text-[11px] text-app-text">{label}</span>
              </button>
            ))}
          </div>
        </Card>
        <div className="flex gap-4 px-1 mb-2 text-[14px]">
          <span className="font-bold text-app-text">优惠加油</span>
          <button onClick={() => toast('充电站暂未开放')} className="bg-transparent border-none text-app-text-muted p-0 text-[14px]">充电站</button>
          <button onClick={() => toast('特惠洗车暂未开放')} className="bg-transparent border-none text-app-text-muted p-0 text-[14px]">特惠洗车</button>
        </div>
        <div className="flex gap-2 px-1 mb-2">
          {['排序·距离', '全部', '万元优惠券', '免费'].map((t) => (
            <button key={t} onClick={() => toast('筛选暂未开放')} className="px-2.5 py-1 rounded-full text-[12px] bg-app-surface border-none text-app-text-muted">
              {t}
            </button>
          ))}
        </div>
        <Card>
          {STATIONS.map(([name, tags, price, dist], i) => (
            <button
              key={name}
              onClick={() => toast('加油站详情暂未开放')}
              className={`flex items-center w-full px-4 py-3.5 bg-transparent border-none text-left ${i === STATIONS.length - 1 ? '' : 'border-b border-app-border'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-app-text font-medium truncate">{name}</div>
                <div className="text-[11px] text-app-text-muted mt-0.5 truncate">{tags}</div>
              </div>
              <div className="text-right ml-2">
                <div className="text-[15px] font-semibold" style={{ color: C.orangeDeep }}>{price}</div>
                <div className="text-[11px] text-app-text-muted mt-0.5">{dist}</div>
              </div>
            </button>
          ))}
        </Card>
      </div>
    </div>
  );
}
