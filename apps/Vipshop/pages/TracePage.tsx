import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, EmptyState, VIP } from '../components/ui';
import { IcShield, IcLocation, IcReceipt, IcArrowRight } from '../res/icons';

const TRACE_INFO = [
  { icon: 'location', label: '采购地', value: '法国 · 巴黎保税仓直采' },
  { icon: 'receipt', label: '报关单号', value: 'CN-IMP-2024-88213' },
  { icon: 'shield', label: '质检报告', value: 'CIQ 入境检验检疫合格' },
];

const FULL_REPORT = [
  '商品经海关正规清关,报关单可追溯。',
  '入境口岸:上海浦东国际机场保税区。',
  '由第三方质检机构 SGS 抽样检测,合格率 100%。',
  '品牌方授权书编号:AUTH-VIP-INTL-0093。',
  '支持专柜验货,唯品会承诺 100% 正品,假一赔十。',
];

const ICON: Record<string, React.ReactNode> = {
  location: <IcLocation size={18} style={{ color: VIP.gold }} />,
  receipt: <IcReceipt size={18} style={{ color: VIP.gold }} />,
  shield: <IcShield size={18} style={{ color: VIP.gold }} />,
};

export default function TracePage() {
  const { id = '' } = useParams();
  const { bindTap } = useVipshopGestures();
  const [reportOpen, setReportOpen] = useState(false);

  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id));
  const line = order?.lines[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="商品溯源" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="trace-body" data-scroll-direction="vertical">
        {/* 溯源横幅 */}
        <div className="px-4 py-4 text-white flex items-center gap-2" style={{ background: `linear-gradient(135deg,#D8B672,${VIP.gold})` }}>
          <IcShield size={22} className="text-white" />
          <div>
            <div className="text-[16px] font-semibold">唯品国际 · 正品溯源</div>
            <div className="text-[12px] opacity-90 mt-0.5">全程可追溯,海外直采保真</div>
          </div>
        </div>

        {/* 商品 */}
        {line && (
          <div className="bg-white mt-2 px-3 py-3 flex items-center gap-3">
            <Img src={line.image} className="w-14 h-14 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-2">{line.title}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">{line.skuDesc}</div>
            </div>
          </div>
        )}
        {!order && <EmptyState text="订单不存在" />}

        {/* 溯源信息 */}
        <div className="bg-white mt-2">
          {TRACE_INFO.map((info) => (
            <div key={info.label} className="flex items-center gap-3 px-3 py-3 border-b border-[#F5F5F5]">
              <span className="shrink-0">{ICON[info.icon]}</span>
              <span className="text-[13px] text-[#888888] w-20 shrink-0">{info.label}</span>
              <span className="text-[13px] text-[#222222] flex-1">{info.value}</span>
            </div>
          ))}
        </div>

        {/* 查看溯源报告 */}
        <div className="bg-white mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'trace.report.toggle' }, { onTrigger: () => setReportOpen((v) => !v) })}
            className="w-full px-3 py-3.5 flex items-center justify-between border-none cursor-pointer text-left bg-white"
          >
            <span className="text-[14px] font-semibold text-[#222222]">查看溯源报告</span>
            <IcArrowRight size={16} className={`text-[#BBBBBB] transition-transform ${reportOpen ? 'rotate-90' : ''}`} />
          </button>
          {reportOpen && (
            <div className="px-3 pb-4 border-t border-[#F5F5F5] pt-2">
              {FULL_REPORT.map((line2, i) => (
                <div key={i} className="flex gap-2 text-[12px] text-[#666666] leading-relaxed py-1">
                  <span style={{ color: VIP.gold }}>{i + 1}.</span>
                  <span>{line2}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="h-3" />
      </div>
    </div>
  );
}
