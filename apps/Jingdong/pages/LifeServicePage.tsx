import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, wontfix } from '../components/ui';

const BIANMIN = [
  { name: '外卖', c: '#FF7A45' }, { name: '京东快递', c: '#E1251B' }, { name: '京东七鲜', c: '#1BA956' },
  { name: '充值中心', c: '#F0A020' }, { name: '护士到家', c: '#2EBF9E' }, { name: '借钱', c: '#F0B429' },
  { name: '京东到家', c: '#FF7A45' }, { name: '到家快检', c: '#1BA956' }, { name: '京东服务', c: '#2E7DF0' },
  { name: '爱回收', c: '#F0A020' }, { name: '自营秒送', c: '#FF5A3C' }, { name: '京东家政', c: '#E1251B' },
  { name: '京东互医', c: '#2EBF9E' }, { name: '京东保', c: '#E1251B' }, { name: '京东延保', c: '#E1251B' },
  { name: '闲置换钱', c: '#2E7DF0' }, { name: '京东房产', c: '#FF7A45' }, { name: '京东点评', c: '#1BA956' },
  { name: '京东租赁', c: '#F0A020' },
];

const TRAVEL = [
  { name: '酒店', c: '#2E7DF0' }, { name: '火车票', c: '#2EBF9E' },
  { name: '机票', c: '#7A6BF0' }, { name: '景区门票', c: '#F0A020' },
];

export function LifeServicePage() {
  const { bindTap } = useJingdongGestures();

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="生活服务" />
      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="lifeservice-scroll"
        data-scroll-direction="vertical"
      >
        {/* 顶部分类 tab(装饰) */}
        <div className="flex gap-6 px-4 pt-1 pb-2 text-[16px] bg-white">
          {['生活服务', '优惠权益', '互动游戏', '发现好物'].map((t, i) => (
            <span key={t} className={i === 0 ? 'text-[#E1251B] font-bold border-b-2 border-[#E1251B] pb-1' : 'text-[#333]'}>
              {t}
            </span>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-2 bg-white">
          <span className="px-3 py-1 rounded-full bg-[#FDEEEC] text-[#E1251B] text-[13px] font-semibold">便民服务</span>
          <span className="px-3 py-1 rounded-full bg-[#F5F5F5] text-[#666] text-[13px]">旅游出行</span>
        </div>

        {/* 便民服务九宫格 */}
        <div className="mx-3 mt-3 bg-white rounded-2xl p-4">
          <div className="text-[17px] font-bold text-[#1A1A1A] mb-3">便民服务</div>
          <div className="grid grid-cols-5 gap-y-4">
            {BIANMIN.map((s) => (
              <button
                key={s.name}
                {...bindTap({ kind: 'action', id: 'lifeservice.item.wontfix' }, { onTrigger: wontfix })}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-bold"
                  style={{ backgroundColor: s.c }}
                >
                  {s.name.replace('京东', '').slice(0, 1)}
                </span>
                <span className="text-[11px] text-[#333] leading-tight">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 旅游出行 → 进旅行页 */}
        <div className="mx-3 mt-3 bg-white rounded-2xl p-4">
          <div className="text-[17px] font-bold text-[#1A1A1A] mb-3">旅游出行</div>
          <div className="grid grid-cols-4 gap-y-3">
            {TRAVEL.map((s) => (
              <button
                key={s.name}
                {...bindTap('lifeservice.travel-open')}
                className="flex flex-col items-center gap-1"
              >
                <span
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-[15px] font-bold"
                  style={{ backgroundColor: s.c }}
                >
                  {s.name.slice(0, 1)}
                </span>
                <span className="text-[11px] text-[#333] leading-tight">{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
