import React from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { fmtHMS, fmtPace } from '../components/recordFormat';
import { IcNavBack, IcShare } from '../res/icons';
import { shareWithSystem } from '../capabilities';

/** 跑步结算页(Q11=A,按 record.detail 户外跑模板裁剪)—— 证据 recG_f004/f007 */

function Section({
  title,
  detailBind,
  children,
  extra,
}: {
  title: string;
  detailBind?: object;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-app-surface rounded-2xl px-4 pt-4 pb-4 mt-3">
      <div className="flex items-center">
        <span className="text-[17px] font-bold text-app-text">{title}</span>
        {extra}
        <div className="flex-1" />
        {detailBind && (
          <button {...detailBind} className="px-2.5 py-1 rounded-full bg-app-bg border-none text-[12px] text-app-text-muted">
            查看详情
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

export default function RunSummaryPage() {
  const { bindTap, go } = useKeepGestures();
  const s = useKeepStrings();
  const toast = useKeepStore((st) => st.toast);
  const ses = useKeepStore((st) => st.runSession);
  const runRecords = useKeepStore((st) => st.runRecords);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const abandonRun = useKeepStore((st) => st.abandonRun);
  const rec = runRecords.find((r) => r.id === ses?.lastRecordId);
  const leaveToSport = () => {
    abandonRun();
    go('run.home.open.fromSummaryDone', {}, { popTo: '/sport', mode: 'replace' });
  };

  if (!rec) {
    return (
      <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-2 shrink-0 bg-app-surface">
          <button
            {...bindTap('run.home.open.fromSummaryDone', { onTrigger: leaveToSport })}
            className="p-2 bg-transparent border-none text-app-text"
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center font-semibold text-[16px] text-app-text">运动完成</div>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-[15px] font-medium text-app-text">未找到本次运动记录</div>
          <p className="text-[13px] text-app-text-muted mt-2">请返回运动页重新开始</p>
        </div>
      </div>
    );
  }

  const pace = rec?.paceSecPerKm ?? null;
  const km = rec?.km ?? 0;
  const detailWontfix = bindTap(
    { kind: 'action', id: 'run.summary.sectionDetail.wontfix' },
    { onTrigger: () => toast(s.notOpen) },
  );

  const grid: { label: string; value: string }[] = rec
    ? [
        { label: '训练时长', value: fmtHMS(rec.durationSec) },
        { label: '平均配速', value: fmtPace(pace) },
        { label: '运动消耗(千卡)', value: String(rec.kcal) },
        { label: '总时长', value: fmtHMS(rec.totalSec ?? rec.durationSec) },
        { label: '运动负荷', value: String(rec.load ?? 1) },
        { label: '平均心率(次/分)', value: String(rec.heartAvg ?? '--') },
        { label: '爬升高度(米)', value: String(rec.climb ?? 1) },
        { label: '平均步频', value: String(rec.cadence ?? '--') },
        { label: '平均功率(瓦)', value: String(rec.power ?? '--') },
      ]
    : [];

  const segCount = Math.max(1, Math.floor(km));
  const segs = Array.from({ length: Math.min(segCount, 6) }, (_, i) => {
    const p = pace != null ? Math.round(pace * (0.94 + ((i * 37) % 13) / 100)) : null;
    return { idx: i + 1, kmLabel: '1.00', pace: p, heart: rec?.heartAvg ? rec.heartAvg - 6 + ((i * 5) % 13) : null };
  });
  const fastest = segs.reduce((a, b) => ((b.pace ?? 1e9) < (a.pace ?? 1e9) ? b : a), segs[0]);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      {/* 顶部:返回(跳过 run.active 直回准备页)+分享 */}
      <div className="flex items-center h-11 px-2 shrink-0 bg-app-surface">
        <button
          {...bindTap('run.home.open.fromSummaryDone', { onTrigger: leaveToSport })}
          className="p-2 bg-transparent border-none text-app-text"
          aria-label={s.back}
        >
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 text-center font-semibold text-[16px] text-app-text">运动完成</div>
        <button
          {...bindTap({ kind: 'action', id: 'run.summary.share.submit' }, { onTrigger: () => { const launched = shareWithSystem('【Keep】跑步总结', (r) => { if (r.resultCode === 'OK') toast('分享成功'); }); if (!launched) toast(s.notOpen); } })}
          className="p-2 bg-transparent border-none text-app-text"
          aria-label="分享"
        >
          <IcShare size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 完成庆祝头部 */}
        <div className="rounded-2xl mt-3 px-4 py-5" style={{ background: 'linear-gradient(135deg,#24C789,#0FB27A)' }}>
          <div className="text-white/85 text-[13px]">恭喜完成{rec?.name ?? '跑步'}</div>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-white text-[52px] font-extrabold leading-none">{km.toFixed(2)}</span>
            <span className="text-white/85 text-[15px] mb-1.5">公里</span>
          </div>
          <div className="text-white/75 text-[12px] mt-1.5">
            {rec?.date} {rec?.timeOfDay}
          </div>
        </div>

        {/* 地图轨迹(慢→快渐变) */}
        <div className="rounded-2xl overflow-hidden mt-3 relative">
          <MapCanvas height={200} route />
          <div className="absolute left-3 bottom-2.5 flex items-center gap-1.5 text-[11px] text-app-text-muted">
            慢
            <span className="w-16 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg,#FF5A5F,#FFC53D,#24C789,#38D9F0)' }} />
            快
          </div>
        </div>

        {/* 运动数据九宫格 */}
        <Section title="运动数据" detailBind={detailWontfix}>
          <div className="grid grid-cols-3 gap-y-5 mt-4">
            {grid.map((g) => (
              <div key={g.label}>
                <div className="text-[12px] text-app-text-muted">{g.label}</div>
                <div className="text-[19px] font-bold text-app-text mt-0.5">{g.value}</div>
              </div>
            ))}
          </div>
        </Section>

        {/* 分段配速 */}
        <Section title="分段配速" detailBind={detailWontfix}>
          <div className="flex text-[12px] text-app-text-muted mt-3 px-1">
            <span className="w-10">#</span><span className="flex-1">公里</span><span className="w-16">用时</span><span className="w-16 text-right">配速</span>
          </div>
          {segs.map((seg) => {
            const isFast = seg === fastest && seg.pace != null;
            return (
              <div
                key={seg.idx}
                className={`flex items-center text-[13px] mt-1.5 px-1 py-1.5 rounded ${isFast ? 'text-white' : 'text-app-text'}`}
                style={isFast ? { background: C.green } : undefined}
              >
                <span className="w-10 font-semibold">{seg.idx}{isFast ? ' 最快' : ''}</span>
                <span className="flex-1">{seg.kmLabel}</span>
                <span className="w-16">{seg.pace != null ? fmtHMS(seg.pace).slice(3) : '--'}</span>
                <span className="w-16 text-right" style={!isFast && seg.pace != null ? { color: '#0FB27A' } : undefined}>
                  {fmtPace(seg.pace)}
                </span>
              </div>
            );
          })}
        </Section>

        {/* 跑步配速区间 */}
        <Section title="跑步配速区间" detailBind={detailWontfix}>
          <div className="flex items-center justify-between mt-3 text-[13px] text-app-text-muted">
            <span>平均 <b className="text-app-text text-[15px]">{fmtPace(pace)}</b></span>
            <span>最快 <b className="text-app-text text-[15px]">{fmtPace(pace != null ? Math.max(180, pace - 200) : null)}</b></span>
          </div>
          <svg viewBox="0 0 320 70" className="w-full h-16 mt-2">
            <polyline
              points="0,26 20,18 40,30 60,22 85,48 105,26 130,20 150,44 175,24 200,22 225,50 250,28 275,22 300,40 320,26"
              fill="none" stroke="#8FA8F0" strokeWidth="2.5"
            />
          </svg>
          <div className="flex h-3.5 rounded-full overflow-hidden mt-1">
            <span style={{ width: '74%', background: '#8FA8F0' }} className="flex items-center justify-center text-[9px] text-white">74%</span>
            <span style={{ width: '17%', background: '#3D5CB8' }} className="flex items-center justify-center text-[9px] text-white">17%</span>
            <span style={{ width: '5%', background: '#2E9E6B' }} />
            <span style={{ width: '4%', background: '#B03D4E' }} />
          </div>
        </Section>

        {/* 跑步心率区间 */}
        <Section title="跑步心率区间" detailBind={detailWontfix}>
          <div className="flex items-center gap-4 mt-3 text-[13px] text-app-text-muted">
            <span>平均 <b className="text-app-text text-[15px]">{rec?.heartAvg ?? '--'}</b> 次/分</span>
            <span className="ml-auto">最大 <b className="text-app-text">{rec?.heartMax ?? (rec?.heartAvg ? rec.heartAvg + 24 : '--')}</b></span>
            <span>最小 <b className="text-app-text">90</b></span>
          </div>
          <svg viewBox="0 0 320 70" className="w-full h-16 mt-2">
            <polyline
              points="0,58 25,30 55,26 80,34 110,22 140,30 170,20 200,28 230,16 260,26 290,18 320,22"
              fill="none" stroke="#37C978" strokeWidth="2.5"
            />
          </svg>
          <div className="flex h-3.5 rounded-full overflow-hidden mt-1">
            <span style={{ width: '17%', background: '#8FA8F0' }} className="flex items-center justify-center text-[9px] text-white">17%</span>
            <span style={{ width: '38%', background: '#3D5CB8' }} className="flex items-center justify-center text-[9px] text-white">38%</span>
            <span style={{ width: '42%', background: '#2E9E6B' }} className="flex items-center justify-center text-[9px] text-white">42%</span>
            <span style={{ width: '3%', background: '#B03D4E' }} />
          </div>
        </Section>

        {/* 训练效果 */}
        <Section title="训练效果" detailBind={detailWontfix}>
          <div className="flex mt-4">
            <div className="flex-1">
              <div className="text-[12px] text-app-text-muted">有氧效果</div>
              <div className="text-[22px] font-bold text-app-text mt-0.5">3.0 <span className="text-[12px] font-normal" style={{ color: C.greenDeep }}>提高</span></div>
              <div className="flex gap-1 mt-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < 3 ? '#2E9E6B' : '#E4E6EB' }} />
                ))}
              </div>
            </div>
            <div className="flex-1 ml-6">
              <div className="text-[12px] text-app-text-muted">无氧效果</div>
              <div className="text-[22px] font-bold text-app-text mt-0.5">1.6 <span className="text-[12px] font-normal" style={{ color: C.orange }}>恢复</span></div>
              <div className="flex gap-1 mt-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i < 2 ? '#E8843C' : '#E4E6EB' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="text-[12px] text-app-text-muted mt-3">本次训练重点为基础耐力,有氧能力显著提高,耐乳酸能力提高</div>
        </Section>
      </div>

      {/* 底部通栏：发布动态到社区 + 完成 */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0 bg-app-surface border-t border-app-border">
        <button
          {...bindTap('post.compose.open.fromRunSummary', {
            beforeTrigger: () => {
              if (ses?.lastRecordId) setCurrent('recordId', ses.lastRecordId);
            },
          })}
          className="flex-[1.4] py-3 rounded-full border-none text-white text-[15px] font-semibold"
          style={{ background: C.green }}
        >
          ✈ {s.publish}
        </button>
        <button
          {...bindTap('run.home.open.fromSummaryDone', { onTrigger: leaveToSport })}
          className="flex-1 py-3 rounded-full text-[15px] font-semibold border border-app-border bg-app-surface text-app-text"
        >
          {s.done}
        </button>
      </div>
    </div>
  );
}
