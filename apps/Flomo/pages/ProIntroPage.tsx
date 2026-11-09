import React, { useState } from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import {
  IcClose, IcArrowRight, IcAi, IcMic, IcInbox, IcReview, IcMindMap,
  IcNetwork, IcArrowDown, IcArrowUp, IcCheck,
} from '../res/icons';

type Benefit = {
  icon: React.ReactNode;
  title: string;
  value: React.ReactNode;
};

const CHECK = <IcCheck size={16} style={{ color: C.green }} />;

const BASE_BENEFITS: Benefit[] = [
  { icon: <IcAi size={18} />, title: 'AI 洞察笔记', value: <span style={{ color: C.sub }}>2 次/天</span> },
  { icon: <IcMic size={18} />, title: '语音记录', value: <span style={{ color: C.sub }}>10 分/条 500 分/月</span> },
  { icon: <IcInbox size={18} />, title: '存储空间', value: <span style={{ color: C.sub }}>20 G</span> },
  { icon: <IcReview size={18} />, title: '每日回顾', value: CHECK },
  { icon: <IcMindMap size={18} />, title: '认知地图', value: CHECK },
  { icon: <IcNetwork size={18} />, title: '发现相关笔记', value: CHECK },
];

const MORE_BENEFITS: Benefit[] = [
  { icon: <IcReview size={18} />, title: '随机漫步', value: CHECK },
  { icon: <IcInbox size={18} />, title: '历史记录统计', value: CHECK },
  { icon: <IcNetwork size={18} />, title: '导入/导出', value: CHECK },
];

function BenefitRow({ b }: { b: Benefit }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span style={{ color: C.text }}>{b.icon}</span>
      <span className="flex-1" style={{ color: C.text, fontSize: 14 }}>{b.title}</span>
      <span style={{ fontSize: 13 }}>{b.value}</span>
    </div>
  );
}

export default function ProIntroPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const toast = useFlomoStore((s) => s.toast);
  const setPayPlan = useFlomoStore((s) => s.setPayPlan);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:关闭 / flomo / 账号详情 */}
      <div className="flex items-center h-12 px-3 shrink-0">
        <button
          {...bindBack()}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer"
          style={{ color: C.text }}
          aria-label="关闭"
        >
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-bold text-lg lowercase" style={{ color: C.text }}>
          flomo
        </div>
        <button
          {...bindTap('pro.intro.account')}
          className="bg-transparent border-none cursor-pointer"
          style={{ color: C.linkBlue, fontSize: 13 }}
        >
          账号详情
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">
        {/* PRO 权益卡 */}
        <div className="rounded-2xl p-4 mt-1" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="font-extrabold tracking-wide" style={{ color: C.green, fontSize: 26 }}>PRO</div>
          <div className="mt-1" style={{ color: C.sub, fontSize: 13 }}>记录更高效,回顾更从容</div>

          <div className="mt-3 divide-y" style={{ borderColor: C.border }}>
            {BASE_BENEFITS.map((b) => (
              <BenefitRow key={b.title} b={b} />
            ))}
            {expanded && MORE_BENEFITS.map((b) => (
              <BenefitRow key={b.title} b={b} />
            ))}
          </div>

          {/* 更多专属功能(state: 本地展开 + toast) */}
          <button
            {...bindTap(
              { kind: 'action', id: 'pro.intro.more.expand' },
              {
                onTrigger: () => {
                  setExpanded((v) => !v);
                  if (!expanded) toast('已展开更多权益');
                },
              },
            )}
            className="w-full flex items-center justify-center gap-1 pt-3 bg-transparent border-none cursor-pointer"
            style={{ color: C.sub, fontSize: 13 }}
          >
            更多专属功能
            {expanded ? <IcArrowUp size={14} /> : <IcArrowDown size={14} />}
          </button>
        </div>

        {/* 认证专享优惠 + 书单(装饰,不可点) */}
        <div className="mt-4" style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>认证专享优惠</div>
        <div
          className="rounded-2xl p-4 mt-2 flex items-center gap-3"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}
        >
          <div className="flex-1">
            <div style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>教育优惠 · 专属折扣</div>
            <div className="mt-1" style={{ color: C.sub, fontSize: 12 }}>买 1 年送 3 个月</div>
            <div className="mt-2" style={{ color: C.sub, fontSize: 12 }}>学生/教师/毕业 2 年内可享</div>
          </div>
          <div className="w-12 h-12 rounded-full shrink-0" style={{ background: C.tagBg }} />
        </div>

        <div className="mt-4" style={{ color: C.text, fontSize: 14, fontWeight: 600 }}>被众多畅销书推荐</div>
        <div className="flex gap-2 overflow-x-auto py-2 mt-1">
          {['笔记的方法', '卡片笔记', '好好思考', '高效学习'].map((t) => (
            <div
              key={t}
              className="shrink-0 rounded-lg flex items-end p-2"
              style={{ width: 70, height: 96, background: C.tagBg, color: C.tagText, fontSize: 12, fontWeight: 700 }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>

      {/* 底部价格按钮:连续包月 / 连续包年 */}
      <div
        className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-6"
        style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}
      >
        <div className="flex gap-3">
          <button
            {...bindTap('pay.sheet.monthly', { beforeTrigger: () => setPayPlan('monthly') })}
            className="flex-1 h-12 rounded-xl border-none cursor-pointer flex items-center justify-center font-semibold"
            style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, fontSize: 15 }}
          >
            连续包月 ¥15
          </button>
          <button
            {...bindTap('pay.sheet.yearly', { beforeTrigger: () => setPayPlan('yearly') })}
            className="flex-1 h-12 rounded-xl border-none cursor-pointer flex items-center justify-center font-semibold relative"
            style={{ background: C.green, color: '#fff', fontSize: 15 }}
          >
            连续包年 ¥99
            <span
              className="absolute -top-2 right-2 px-1.5 rounded text-white"
              style={{ background: '#E5484D', fontSize: 10 }}
            >
              立省 45%
            </span>
            <IcArrowRight size={16} className="ml-1" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3" style={{ color: C.sub, fontSize: 11 }}>
          <span>会员服务协议</span>
          <span>自动续费协议</span>
        </div>
      </div>
    </div>
  );
}
