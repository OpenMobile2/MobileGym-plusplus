/** 分析页(经期健康报告)。spec: analysis.main */
import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, MY, NOT_OPEN, useToast } from '../components/ui';
import { fmtDate, addDays, diffDays, nextPeriodStart, daysToNextPeriod, currentPeriod } from '../utils/cycle';

function Card({ title, children, sample = false }: { title: string; children?: React.ReactNode; sample?: boolean }) {
  return (
    <div className="bg-white rounded-xl mt-3 p-4 relative">
      {sample && <span className="absolute top-3 right-3 text-[10px] text-[#CCC] border border-[#EEE] rounded px-1">示例数据</span>}
      <div className="text-[14px] font-semibold text-[#1A1A1A] mb-2">{title}</div>
      {children}
    </div>
  );
}

function Bars({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-2 h-20">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full rounded-t" style={{ height: `${(v / max) * 100}%`, minHeight: 4, background: MY.periodBlock }} />
          <span className="text-[10px] text-[#999]">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalysisPage() {
  const { bindTap } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const periods = useMeiyouStore((s) => s.periods);
  const cycle = useMeiyouStore((s) => s.cycle);
  const dayRecords = useMeiyouStore((s) => s.dayRecords);

  const today = fmtDate(TimeService.now());
  const sorted = [...periods].sort((a, b) => (a.start < b.start ? 1 : -1));
  const cur = currentPeriod(periods);
  const prev = sorted[1];
  const cycleLen = cur && prev ? diffDays(cur.start, prev.start) : cycle.cycleLen;
  const nextStart = nextPeriodStart(periods, cycle);
  const toNext = daysToNextPeriod(today, periods, cycle);

  const deep = bindTap({ kind: 'action', id: 'analysis.deep.disabled' }, { onTrigger: () => showToast(NOT_OPEN) });

  // 本周期各天流量映射(非常少量..非常大量 → 1..5)
  const flowMap: Record<string, number> = { 非常少量: 1, 少量: 2, 中量: 3, 大量: 4, 非常大量: 5 };
  const flowVals = cur
    ? Array.from({ length: cycle.periodLen }, (_, i) => flowMap[dayRecords[addDays(cur.start, i)]?.flow ?? ''] ?? 0)
    : [];

  return (
    <div className="flex flex-col h-full bg-[#FFF0F4] relative">
      <TopBar title="分析" />
      <div className="flex-1 overflow-y-auto px-3 pb-8" data-scroll-container="analysis-body" data-scroll-direction="vertical">
        {/* 健康度 */}
        <div className="rounded-xl mt-3 p-4 text-white" style={{ background: 'linear-gradient(135deg,#FE6697,#FF548C)' }}>
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-[13px] opacity-90">经期健康度</div>
              <div className="text-[40px] font-bold leading-none">81<span className="text-[16px] ml-1">一般</span></div>
              <div className="text-[12px] mt-1 opacity-90">比上周期 ↑9分</div>
            </div>
            <button {...deep} className="px-4 h-8 rounded-full bg-white/25 text-white text-[13px] border-none cursor-pointer">立即查看</button>
          </div>
        </div>

        <Card title="周期变化">
          <div className="text-[13px] text-[#666]">
            最近1个周期({prev?.start ?? '—'} ~ {cur ? fmtDate(TimeService.now()) : '—'})周期天数 <b style={{ color: MY.primary }}>{cycleLen}天</b>·正常
          </div>
          <button {...deep} className="mt-2 text-[12px] bg-transparent border-none cursor-pointer" style={{ color: MY.primary }}>深度分析已更新!查看异常和建议</button>
        </Card>

        <Card title="经期变化">
          <Bars values={[5, 6, 5, cycle.periodLen]} labels={['-3', '-2', '-1', '本次']} />
        </Card>

        <Card title="流量变化">
          {flowVals.length > 0 ? <Bars values={flowVals} labels={flowVals.map((_, i) => `第${i + 1}天`)} /> : <div className="text-[13px] text-[#999]">本周期暂无流量记录</div>}
          <button {...deep} className="mt-2 text-[12px] bg-transparent border-none cursor-pointer" style={{ color: MY.primary }}>你和同龄人流量变化一样吗?来看看</button>
        </Card>

        <Card title="颜色变化">
          <div className="flex gap-2">
            {Object.values(dayRecords).map((r) => r.color).filter(Boolean).slice(0, 6).map((c, i) => {
              const cmap: Record<string, string> = { 浅红色: '#FF9AA2', 鲜红色: '#FF2D2D', 深红色: '#B01030', 褐色: '#7A4A2B', 黑色: '#2B2B2B' };
              return <span key={i} className="w-6 h-6 rounded-full" style={{ background: cmap[c as string] ?? '#DDD' }} />;
            })}
          </div>
        </Card>

        <Card title="痛经情况">
          <div className="text-[13px] text-[#666]">本周期以轻微痛为主,近半年偶发痛经,一般出现在经期第1天。</div>
        </Card>

        <Card title="心情">
          <div className="text-[13px] text-[#666]">本周期共记录 {new Set(Object.values(dayRecords).map((r) => r.mood).filter(Boolean)).size} 种心情</div>
        </Card>

        <Card title="体重">
          <div className="text-[13px] text-[#666]">当前体重 {Object.values(dayRecords).map((r) => r.weight).filter(Boolean).slice(-1)[0] ?? '--'} 公斤</div>
          <button {...deep} className="mt-2 text-[12px] bg-transparent border-none cursor-pointer" style={{ color: MY.primary }}>BMI 立即填写</button>
        </Card>

        <Card title="爱爱"><div className="text-[13px] text-[#666]">本周期共 {Object.values(dayRecords).filter((r) => r.love).length} 次</div></Card>
        <Card title="症状" sample={Object.values(dayRecords).every((r) => !r.symptoms?.length)}>
          <div className="text-[13px] text-[#666]">持续记录症状,发现身体规律</div>
        </Card>
        <Card title="白带" sample><div className="text-[13px] text-[#999]">持续记录更好地跟踪健康状况</div></Card>
        <Card title="体温" sample><div className="text-[13px] text-[#999]">持续记录,发现体温变化规律</div></Card>

        <Card title="经期预测">
          <div className="text-[13px] text-[#666]">
            预测下次经期将于 <b style={{ color: MY.primary }}>{nextStart ? `${Number(nextStart.slice(5, 7))}月${Number(nextStart.slice(8))}日` : '—'}</b> 开始,
            距离经期开始还有 <b style={{ color: MY.primary }}>{toNext ?? '—'}</b> 天
          </div>
        </Card>
      </div>
      {toast}
    </div>
  );
}
