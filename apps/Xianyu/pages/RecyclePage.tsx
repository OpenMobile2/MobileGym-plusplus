import React from 'react';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { HOME_SEGMENTS } from '../constants';
import { IcShield, IcArrowRight, IcRecycle } from '../res/icons';

const RECYCLE_CATS = [
  { id: 'phone', label: '手机', emoji: '📱' },
  { id: 'digital', label: '数码', emoji: '💻' },
  { id: 'camera', label: '相机', emoji: '📷' },
  { id: 'gold', label: '黄金', emoji: '🪙' },
  { id: 'clothes', label: '旧衣', emoji: '👕' },
];

const HOT_MODELS = [
  { model: 'iPhone 15 Pro Max', price: '最高回收 6200' },
  { model: 'iPhone 14 Pro', price: '最高回收 4300' },
  { model: 'iPhone 13', price: '最高回收 2600' },
  { model: '华为 Mate 60 Pro', price: '最高回收 4100' },
  { model: '小米 14 Ultra', price: '最高回收 3200' },
];

export default function RecyclePage() {
  const { bindTap } = useXianyuGestures();

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 顶部分段栏(当前=回收,无返回) */}
      <div className="bg-white shrink-0">
        <div className="flex items-center gap-4 px-3 pt-1 pb-2">
          {HOME_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              {...(seg.id === 'recycle' ? {} : bindTap(seg.transitionId))}
              className={`bg-transparent border-none cursor-pointer py-1.5 text-[15px] ${
                seg.id === 'recycle' ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="RecyclePage-main" data-scroll-direction="vertical">
        {/* 机型精准估价卡 */}
        <div className="mx-3 mt-3 rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg,#1CB854,#0E9E48)' }}>
          <div className="flex items-center gap-2">
            <IcRecycle size={22} />
            <span className="text-[17px] font-bold">闲鱼回收 · 机型精准估价</span>
          </div>
          <div className="mt-1 text-[12px] text-white/90">选对机型成色,3 秒出价,当天到账</div>
          <button
            {...bindTap('recycle.estimate-open', { params: { model: 'iPhone 15 Pro Max' } })}
            className="mt-3 w-full h-10 rounded-full bg-white text-[#1CB854] font-semibold text-[15px] border-none cursor-pointer"
          >
            立即估价
          </button>
        </div>

        {/* 免费上门质检说明 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3 flex items-center gap-2">
          <IcShield size={18} className="text-[#1CB854]" />
          <span className="text-[13px] text-[#333333]">免费上门质检 · 顺丰包邮 · 隐私数据全清除</span>
        </div>

        {/* 品类 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3 grid grid-cols-5 gap-2">
          {RECYCLE_CATS.map((c) => (
            <button
              key={c.id}
              {...bindTap('recycle.estimate-open', { params: { model: c.label } })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1"
            >
              <span className="w-11 h-11 rounded-full bg-[#EAF8EF] flex items-center justify-center text-[20px]">{c.emoji}</span>
              <span className="text-[12px] text-[#333333]">{c.label}</span>
            </button>
          ))}
        </div>

        {/* 热门机型列表 */}
        <div className="mx-3 mt-3 mb-3 bg-white rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111111] mb-1">热门机型报价</div>
          {HOT_MODELS.map((m) => (
            <button
              key={m.model}
              {...bindTap('recycle.estimate-open', { params: { model: m.model } })}
              className="flex items-center gap-2 w-full py-3 border-b border-[#F4F4F4] last:border-none bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[#111111] truncate">{m.model}</div>
                <div className="text-[12px] text-[#1CB854]">{m.price}</div>
              </div>
              <span className="shrink-0 text-[12px] text-[#1CB854] font-medium">立即估价</span>
              <IcArrowRight size={16} className="text-[#CCCCCC] shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
