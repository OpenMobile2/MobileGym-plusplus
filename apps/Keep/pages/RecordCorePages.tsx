import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { BottomSheet, CenterDialog } from '../components/Sheet';
import { WheelPicker } from '../components/WheelPicker';
import { Card, C, Chip, PrimaryBtn, Row, TopBar } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { fmtHMS, fmtPace, groupByDate, recordMeta, recordTitle, TypeDot } from '../components/recordFormat';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import type { KeepRunRecord, KeepUser } from '../types';
import { shareWithSystem as sharePlainText } from '../capabilities';
import * as TimeService from '@/os/TimeService';

const act = (id: string) => ({ kind: 'action' as const, id });

function RecordRow({ record, transition }: { record: KeepRunRecord; transition: 'record.detail.open.fromHub' | 'record.detail.open.fromAllSheet' | 'record.detail.open.fromSync' }) {
  const { bindTap } = useKeepGestures();
  const setCurrent = useKeepStore((s) => s.setCurrent);
  const options = { params: { recordId: record.id }, beforeTrigger: () => setCurrent('recordId', record.id) };
  const binding = transition === 'record.detail.open.fromHub'
    ? bindTap('record.detail.open.fromHub', options)
    : transition === 'record.detail.open.fromAllSheet'
      ? bindTap('record.detail.open.fromAllSheet', options)
      : bindTap('record.detail.open.fromSync', options);
  return <button {...binding} className="w-full flex items-center gap-3 py-3 border-x-0 border-t-0 border-b border-app-border bg-transparent text-left"><TypeDot type={record.type} /><div className="flex-1 min-w-0"><b className="text-sm text-app-text">{recordTitle(record)}</b><small className="block text-app-text-muted truncate">{record.date} {record.timeOfDay} · {recordMeta(record)}</small></div><span className="text-app-text-muted">›</span></button>;
}

function RecordDetailExtras(){const{bindTap}=useKeepGestures();const toast=useKeepStore((s)=>s.toast);return <div className="flex gap-2 mt-3"><button {...bindTap(act('record.detail.privacy.wontfix'),{onTrigger:()=>toast('该功能暂未开放')})} className="px-3 py-1.5 rounded-full border-none bg-app-bg text-xs">隐私</button><button {...bindTap(act('record.detail.share.submit'),{onTrigger:()=>{const launched=sharePlainText('【Keep】运动记录',(r)=>{if(r.resultCode==='OK')toast('分享成功');});if(!launched)toast('该功能暂未开放');}})} className="px-3 py-1.5 rounded-full border-none bg-app-bg text-xs">分享</button><button {...bindTap(act('record.detail.aiScore.wontfix'),{onTrigger:()=>toast('该功能暂未开放')})} className="px-3 py-1.5 rounded-full border-none bg-app-bg text-xs">AI 感受评分</button></div>}
function SyncAddService(){const{bindTap}=useKeepGestures();const toast=useKeepStore((s)=>s.toast);return <button {...bindTap(act('records.sync.addService.wontfix'),{onTrigger:()=>toast('该功能暂未开放')})} className="mt-3 w-full py-2 rounded-full border border-app-border bg-white">+ 添加服务</button>}

const RECORD_METRICS = ['全部运动', '总跑步', '户外跑步', '室内跑步', '室内有氧', '户外行走'] as const;
type RecordMetric = typeof RECORD_METRICS[number];

function sum(records: KeepRunRecord[], pick: (record: KeepRunRecord) => number): number {
  return records.reduce((total, record) => total + pick(record), 0);
}

function recordsForMetric(records: KeepRunRecord[], metric: RecordMetric): KeepRunRecord[] {
  if (metric === '全部运动') return records;
  if (metric === '总跑步') return records.filter((record) => record.type === '户外跑步' || record.type === '室内跑步');
  return records.filter((record) => record.type === metric);
}

function metricSummary(records: KeepRunRecord[], user: KeepUser, metric: RecordMetric): { value: number; unit: string } {
  const indoorRunKm = sum(records.filter((record) => record.type === '室内跑步'), (record) => record.km ?? 0);
  if (metric === '全部运动') return { value: user.totalMinutes, unit: '分钟' };
  if (metric === '总跑步') return { value: user.totalRunKm, unit: '公里' };
  if (metric === '户外跑步') return { value: Math.max(0, user.totalRunKm - indoorRunKm), unit: '公里' };
  if (metric === '室内跑步') return { value: indoorRunKm, unit: '公里' };
  if (metric === '户外行走') return { value: sum(records.filter((record) => record.type === metric), (record) => record.km ?? 0), unit: '公里' };
  return { value: Math.round(sum(records.filter((record) => record.type === metric), (record) => record.durationSec) / 60), unit: '分钟' };
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

function parseRecordDate(value: string): { year: number; month: number; day: number; ordinal: number } {
  const [year, month, day] = value.split('-').map(Number);
  const ordinal = MONTH_DAYS.slice(0, Math.max(0, month - 1)).reduce((total, days) => total + days, 0) + day;
  return { year, month, day, ordinal };
}

function dateFromOrdinal(ordinal: number): { month: number; day: number } {
  let remaining = Math.max(1, ordinal);
  let month = 1;
  for (const days of MONTH_DAYS) {
    if (remaining <= days) return { month, day: remaining };
    remaining -= days;
    month += 1;
  }
  return { month: 12, day: 31 };
}

function recordsForPeriod(records: KeepRunRecord[], segment: string, offset: number): KeepRunRecord[] {
  if (segment === '总') return records;
  const now = TimeService.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentOrdinal = parseRecordDate(`${currentYear}-${currentMonth}-${now.getDate()}`).ordinal;
  if (segment === '日') {
    const target = currentOrdinal + offset;
    return records.filter((record) => {
      const date = parseRecordDate(record.date);
      return date.year === currentYear && date.ordinal === target;
    });
  }
  if (segment === '周') {
    const end = currentOrdinal + offset * 7;
    return records.filter((record) => {
      const date = parseRecordDate(record.date);
      return date.year === currentYear && date.ordinal > end - 7 && date.ordinal <= end;
    });
  }
  if (segment === '月') {
    const monthIndex = currentYear * 12 + currentMonth - 1 + offset;
    const year = Math.floor(monthIndex / 12);
    const month = monthIndex % 12 + 1;
    return records.filter((record) => {
      const date = parseRecordDate(record.date);
      return date.year === year && date.month === month;
    });
  }
  const year = currentYear + offset;
  return records.filter((record) => parseRecordDate(record.date).year === year);
}

function periodLabel(segment: string, offset: number): string {
  const now = TimeService.getDate();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (segment === '日') {
    const date = dateFromOrdinal(parseRecordDate(`${currentYear}-${currentMonth}-${now.getDate()}`).ordinal + offset);
    return `${date.month}月${date.day}日`;
  }
  if (segment === '周') return offset === 0 ? '本周' : `${Math.abs(offset)}周前`;
  if (segment === '月') {
    const monthIndex = currentYear * 12 + currentMonth - 1 + offset;
    return `${Math.floor(monthIndex / 12)}年${monthIndex % 12 + 1}月`;
  }
  if (segment === '年') return `${currentYear + offset}年`;
  return '2022年10月1日 — 今日';
}

function recordMetricValue(record: KeepRunRecord, metric: RecordMetric): number {
  if (metric === '全部运动' || metric === '室内有氧') return record.durationSec / 60;
  return record.km ?? 0;
}

function periodBars(records: KeepRunRecord[], metric: RecordMetric, segment: string): number[] {
  const size = segment === '年' ? 12 : 7;
  const buckets = Array.from({ length: size }, () => 0);
  records.forEach((record, index) => {
    const date = parseRecordDate(record.date);
    const bucket = segment === '年' ? date.month - 1 : index % size;
    buckets[bucket] += recordMetricValue(record, metric);
  });
  const max = Math.max(...buckets, 1);
  return buckets.map((value) => value / max * 100);
}

function TrendChart({ value }: { value: number }) {
  const ratios = [.08, .13, .2, .27, .35, .43, .52, .61, .7, .79, .89, 1];
  const points = ratios.map((ratio, index) => `${index * 29},${118 - ratio * 100}`).join(' ');
  return <div className="mt-4"><svg viewBox="0 0 319 130" className="w-full h-36" role="img" aria-label={`累计趋势 ${value}`}><defs><linearGradient id="keep-record-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#20c788" stopOpacity=".28"/><stop offset="1" stopColor="#20c788" stopOpacity="0"/></linearGradient></defs><polygon points={`0,128 ${points} 319,128`} fill="url(#keep-record-fill)"/><polyline points={points} fill="none" stroke="#20c788" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="319" cy="18" r="5" fill="#20c788"/></svg></div>;
}

export function RecordsHubPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [params, setParams] = useSearchParams();
  const records = useKeepStore((s) => s.runRecords);
  const user = useKeepStore((s) => s.user);
  const recordRecordsView = useKeepStore((s) => s.recordRecordsView);
  const metricParam = params.get('metric');
  const metric: RecordMetric = RECORD_METRICS.includes(metricParam as RecordMetric) ? metricParam as RecordMetric : '全部运动';
  const segment = params.get('segment') ?? '总';
  const offset = Math.min(0, Number(params.get('offset') ?? 0) || 0);
  const metricRecords = recordsForMetric(records, metric);
  const periodRecords = recordsForPeriod(metricRecords, segment, offset);
  const summary = metricSummary(records, user, metric);
  const bars = periodBars(periodRecords, metric, segment);
  const periodMinutes = Math.round(sum(periodRecords, (record) => record.durationSec) / 60);
  const periodKcal = sum(periodRecords, (record) => record.kcal);
  const listRecords = [...(segment === '总' ? metricRecords : periodRecords)].sort((a,b)=>`${b.date} ${b.timeOfDay}`.localeCompare(`${a.date} ${a.timeOfDay}`));
  const setView = (next: Record<string, string>) => {
    const nextMetric = next.metric ?? metric;
    const nextSegment = next.segment ?? segment;
    const nextOffset = Number(next.offset ?? offset);
    recordRecordsView(nextMetric, nextSegment, nextOffset);
    setParams({ metric, segment, offset: String(offset), ...next }, { replace: true });
  };
  return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="运动记录" right={<><button {...bindTap(act('records.hub.share.submit'), { onTrigger: () => { const launched=sharePlainText(`【Keep】${metric}累计 ${summary.value.toFixed(summary.unit==='公里'?2:0)} ${summary.unit}`,{onResult:(result)=>{if(result.resultCode==='OK')useKeepStore.getState().toast('分享成功');}});if(!launched)useKeepStore.getState().toast(s.notOpen); } })} aria-label="分享运动记录" className="border-none bg-transparent">↗</button><button {...bindTap(act('records.hub.more.wontfix'), { onTrigger: () => useKeepStore.getState().toast(s.notOpen) })} className="border-none bg-transparent">···</button></>} /><div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical"><div data-action="records.hub.metricCards.swipe" data-action-type="swipe" className="flex gap-3 p-4 overflow-x-auto" data-scroll-container="metrics" data-scroll-direction="horizontal">{RECORD_METRICS.map((m) => { const itemSummary = metricSummary(records, user, m); const count = recordsForMetric(records, m).length; return <button key={m} {...bindTap(act('records.hub.metricCard.select'), { params: { metric: m }, onTrigger: () => setView({ metric: m, offset: '0' }) })} className={`w-36 shrink-0 p-4 rounded-xl text-left ${metric === m ? 'border-2 border-black' : 'border border-app-border'} bg-white`}><small className="text-app-text-muted">{m}</small><b className="block text-xl mt-2">{itemSummary.unit === '公里' ? itemSummary.value.toFixed(2) : Math.round(itemSummary.value)}</b><small className="text-app-text-muted">{itemSummary.unit} · {count} 次</small></button>; })}</div><div className="px-4"><div className="grid grid-cols-5 rounded-full bg-white p-1">{['日','周','月','年','总'].map((x) => <button key={x} {...bindTap(act('records.hub.segment.switch'), { params: { segment: x }, onTrigger: () => setView({ segment: x, offset: '0' }) })} className={`py-2 rounded-full border-none ${segment === x ? 'bg-black text-white' : 'bg-transparent text-app-text-muted'}`}>{x}</button>)}</div><Card className="p-4 mt-3"><div className="flex justify-between"><div><b>{segment === '总' ? '累计运动趋势' : `${periodLabel(segment, offset)}运动`}</b><small className="block text-app-text-muted">{metric} · 共 {periodRecords.length} 次</small></div><button {...bindTap(act('records.hub.datePicker.wontfix'), { onTrigger: () => useKeepStore.getState().toast(s.notOpen) })} className="border-none bg-transparent text-sm text-app-text-muted">{periodLabel(segment, offset)}⌄</button></div>{segment === '总' ? <TrendChart value={summary.value}/> : <><div className="h-36 flex items-end gap-2 mt-5">{bars.map((height,index)=><span key={index} className="flex-1 rounded-t bg-emerald-400 min-h-1" style={{ height: `${Math.max(3, height)}%`, opacity: .55 + index/30 }}/>)}</div><div className="grid grid-cols-3 text-center border-t border-app-border mt-4 pt-3"><div><b>{periodMinutes}</b><small className="block text-app-text-muted">时长(分钟)</small></div><div><b>{periodKcal}</b><small className="block text-app-text-muted">消耗(千卡)</small></div><div><b>{periodRecords.length}</b><small className="block text-app-text-muted">完成(次)</small></div></div><div className="flex justify-center gap-6 mt-3"><button {...bindTap(act('records.hub.pager.flip'), { params: { dir: 'prev' }, onTrigger: () => setView({ offset: String(offset - 1) }) })} className="border-none bg-transparent">‹</button><span className="text-sm">{periodLabel(segment, offset)}</span><button disabled={offset === 0} {...bindTap(act('records.hub.pager.flip'), { params: { dir: 'next' }, onTrigger: () => setView({ offset: String(Math.min(0, offset + 1)) }) })} className="border-none bg-transparent disabled:text-gray-300">›</button></div></>}</Card><h2 className="font-bold mt-5">近 5 条记录</h2><Card className="px-3 mt-2">{listRecords.length ? listRecords.slice(0,5).map((r)=><RecordRow key={r.id} record={r} transition="record.detail.open.fromHub" />) : <div className="py-10 text-center text-app-text-muted">{s.noSportRecord}</div>}</Card><button {...bindTap('records.all.open')} className="w-full py-3 mt-3 rounded-full border border-app-border bg-white text-app-text">{s.viewMoreRecords}</button><h2 className="font-bold mt-5">最佳纪录</h2><div className="grid grid-cols-3 gap-2 pb-6">{[['最长时间','01:04:18'],['5公里PB','00:32:46'],['最快配速',"04'42''"]].map(([title,value])=><button key={title} {...bindTap(act('records.hub.bestRecord.wontfix'), { onTrigger: () => useKeepStore.getState().toast(s.notOpen) })} className="p-3 rounded-xl border-none bg-white text-xs"><b>{title}</b><strong className="block mt-2 text-base">{value}</strong><small className="block text-app-text-muted">查看 ›</small></button>)}</div></div></div></div>;
}

export function RecordsAllPage() {
  const { bindTap } = useKeepGestures(); const records=useKeepStore((s)=>s.runRecords); const groups=groupByDate(records);
  return <BottomSheet title="全部运动记录" heightClass="h-[82%]"><div className="text-right"><button {...bindTap(act('records.all.batch.wontfix'),{onTrigger:()=>useKeepStore.getState().toast('该功能暂未开放')})} className="border-none bg-transparent text-sm text-app-text-muted">批量管理</button></div>{groups.map((g)=><div key={g.date}><h3 className="text-sm text-app-text-muted mt-3">{g.label}</h3>{g.items.map((r)=><RecordRow key={r.id} record={r} transition="record.detail.open.fromAllSheet"/>)}</div>)}</BottomSheet>;
}

export function RecordDetailPage(){const{bindTap}=useKeepGestures();const s=useKeepStrings();const setCurrent=useKeepStore((s)=>s.setCurrent);const[params,setParams]=useSearchParams();const records=useKeepStore((s)=>s.runRecords);const current=useKeepStore((s)=>s.current);const r=records.find((x)=>x.id===current.recordId);if(!r)return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="运动记录"/><div className="flex-1 flex items-center justify-center text-sm text-app-text-muted">未找到该记录</div></div>;const outdoor=r.km!=null;const ad=params.get('ad')!=='closed';const wont=(id:string)=>bindTap(act(id),{onTrigger:()=>useKeepStore.getState().toast('该功能暂未开放')});return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title={r.type} right={<button {...wont('record.detail.more.wontfix')} className="border-none bg-transparent">···</button>}/><div className="flex-1 overflow-y-auto">{outdoor?<div className="relative"><MapCanvas height={280} route/><button {...wont('record.detail.mapTools.wontfix')} className="absolute right-3 top-3 w-10 h-28 rounded-full border-none bg-white/90">◉<br/>◈<br/>▶</button><span className="absolute left-3 bottom-3 px-2 py-1 rounded-full bg-white text-xs">隐私</span></div>:<div className="h-64 bg-slate-950 flex flex-col items-center justify-center text-white"><div className="w-40 h-40 rounded-full border-[18px] border-purple-500 flex items-center justify-center"><div className="text-center"><b className="text-3xl">{r.heartAvg??128}</b><small className="block">平均心率</small></div></div></div>}<div className="p-4"><h1 className="text-xl font-bold">{r.name}</h1><RecordDetailExtras/><div className="text-sm text-app-text-muted">{r.date} {r.timeOfDay} · {r.source}</div><Card className="grid grid-cols-3 gap-y-6 p-5 mt-4 text-center">{[[r.km?.toFixed(2)??'--','公里'],[fmtHMS(r.durationSec),'用时'],[r.kcal,'千卡'],[fmtPace(r.paceSecPerKm),'平均配速'],[r.heartAvg??'--','平均心率'],[r.cadence??'--','步频']].map(([v,l])=><div key={String(l)}><b>{v}</b><small className="block text-app-text-muted">{l}</small></div>)}</Card>{['分段配速','配速区间','心率区间','训练效果'].map((title,i)=><Card key={title} className="p-4 mt-3"><div className="flex justify-between"><b>{title}</b><button {...wont('record.detail.sectionDetail.wontfix')} className="border-none bg-transparent text-xs text-app-text-muted">查看详情 ›</button></div><div className="h-16 flex items-end gap-1 mt-3">{[35,70,54,88,62,45,76,58].map((h,j)=><span key={j} className={`flex-1 rounded-t ${i%2?'bg-purple-400':'bg-emerald-400'}`} style={{height:h}}/>)}</div></Card>)}{ad&&<div className="relative w-full mt-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white"><button {...wont('record.detail.adCard.wontfix')} className="w-full p-4 pr-10 rounded-xl border-none bg-transparent text-white text-left">专业训练数据分析，升级 Keep 会员</button><button {...bindTap(act('record.detail.adCard.close'),{onTrigger:()=>setParams({ad:'closed'},{replace:true})})} aria-label="关闭会员推广" className="absolute right-2 top-2 bg-transparent border-none text-white">×</button></div>}<button {...bindTap('post.compose.open.fromRecordDetail',{beforeTrigger:()=>setCurrent('recordId',r.id)})} className="w-full py-3 mt-4 rounded-full border border-emerald-500 bg-white text-emerald-600">{s.publish}</button></div></div></div>}

export function RecordsSyncPage(){const{bindTap,back}=useKeepGestures();const[params,setParams]=useSearchParams();const records=useKeepStore((s)=>s.runRecords);const upload=useKeepStore((s)=>s.uploadRunRecord);const auto=useKeepStore((s)=>s.settings.autoUpload);const setAuto=useKeepStore((s)=>s.setAutoUpload);const tab=params.get('tab')??'待上传';const pending=records.filter((r)=>!r.uploaded);const uploaded=records.filter((r)=>r.uploaded);const dialogInitialized=React.useRef(false);React.useEffect(()=>{if(!auto&&!dialogInitialized.current&&!params.has('dialog')){dialogInitialized.current=true;setParams((previous)=>{const next=new URLSearchParams(previous);next.set('dialog','open');return next;});}},[auto,params,setParams]);const dialog=params.get('dialog')==='open'&&!auto;return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="运动数据同步" right={<button {...bindTap(act('records.sync.help.wontfix'),{onTrigger:()=>useKeepStore.getState().toast('该功能暂未开放')})} className="border-none bg-transparent">?</button>}/><div className="flex bg-white">{['待上传','已上传'].map((x)=><button key={x} {...bindTap(act('records.sync.tab.switch'),{params:{tab:x},onTrigger:()=>setParams({tab:x},{replace:true})})} className={`flex-1 py-3 border-none bg-transparent ${tab===x?'text-emerald-600 border-b-2 border-emerald-500':'text-app-text-muted'}`}>{x}</button>)}</div><div className="flex-1 overflow-y-auto p-4">{tab==='待上传'?(pending.length?pending.map((r)=><Card key={r.id} className="p-3 mb-3"><RecordRow record={r} transition="record.detail.open.fromSync"/><button {...bindTap(act('records.sync.upload'),{params:{recordId:r.id},onTrigger:()=>upload(r.id)})} className="w-full py-2 rounded-full border-none bg-emerald-500 text-white">上传运动记录</button></Card>):<div className="text-center py-20 text-app-text-muted">✓ 暂无待上传记录</div>):uploaded.map((r)=><RecordRow key={r.id} record={r} transition="record.detail.open.fromSync"/>)}<h2 className="font-bold mt-6">应用与服务</h2><Card className="mt-2">{['Apple 健康','文件导入','Garmin 佳明','自动生成运动记录'].map((x,i)=><Row key={x} label={x} value={i===3?(auto?'已开启':'未开启'):'未连接'} bind={bindTap(act('records.sync.services.wontfix'),{onTrigger:()=>useKeepStore.getState().toast('该功能暂未开放')})}/>)}</Card><SyncAddService/><PrimaryBtn bind={bindTap('records.hub.open.fromSync')} className="mt-5">查看数据</PrimaryBtn></div>{dialog&&<CenterDialog title="开启自动上传" footer={<><button {...bindTap(act('records.sync.autoUpload.dismiss'),{onTrigger:()=>back()})} className="flex-1 py-2 rounded-full border border-app-border bg-white">稍后再说</button><button {...bindTap(act('records.sync.autoUpload.enable'),{onTrigger:()=>{setAuto(true);back();}})} className="flex-1 py-2 rounded-full border-none bg-emerald-500 text-white">开启自动上传</button></>}>自动同步健康数据，记录更完整</CenterDialog>}</div>}

export function WeightEntryPage(){const{bindTap}=useKeepGestures();const user=useKeepStore((s)=>s.user);const save=useKeepStore((s)=>s.saveWeight);const[whole,setWhole]=React.useState(Math.floor(user.weightKg));const[decimal,setDecimal]=React.useState(Math.round((user.weightKg%1)*10));return <BottomSheet title="记录体重" heightClass="h-[55%]"><div data-action="weight.entry.wheel.scroll" data-action-type="drag" className="flex justify-center items-center"><WheelPicker options={Array.from({length:151},(_,i)=>40+i)} value={whole} onChange={(v)=>setWhole(Number(v))}/><span className="text-2xl">.</span><WheelPicker options={Array.from({length:10},(_,i)=>i)} value={decimal} onChange={(v)=>setDecimal(Number(v))} unit="kg"/></div><PrimaryBtn bind={bindTap('me.main.open.fromWeightSave',{beforeTrigger:()=>save(whole+decimal/10)})} className="mt-4">确定</PrimaryBtn></BottomSheet>}

export function StepsDetailPage(){const{bindTap}=useKeepGestures();const[params,setParams]=useSearchParams();const steps=useKeepStore((s)=>s.steps);const segment=params.get('segment')??'周';const values=segment==='日'?[steps.today]:segment==='月'?[6432,7310,8640,5920,10080,8175,6640,11240,7395,8860,9580,10420]:steps.week;return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="步数"/><div className="p-4"><div className="grid grid-cols-3 rounded-full bg-white p-1">{['日','周','月'].map((x)=><button key={x} {...bindTap(act('steps.detail.segment.switch'),{params:{segment:x},onTrigger:()=>setParams({segment:x},{replace:true})})} className={`py-2 rounded-full border-none ${segment===x?'bg-black text-white':'bg-transparent'}`}>{x}</button>)}</div><Card className="p-5 mt-4 text-center"><div className="text-sm text-app-text-muted">今日步数</div><div className="text-5xl font-bold mt-2">{steps.today.toLocaleString()}</div><button {...bindTap(act('steps.detail.goal.wontfix'),{onTrigger:()=>useKeepStore.getState().toast('该功能暂未开放')})} className="mt-2 border-none bg-transparent text-xs text-emerald-600">目标 10,000 步 ›</button><div className="h-52 flex items-end gap-2 mt-8">{values.map((v,i)=><div key={i} className="flex-1"><span className="block bg-emerald-400 rounded-t" style={{height:Math.max(18,v/70)}}/><small className="text-app-text-muted">{segment==='月'?i+1:['一','二','三','四','五','六','日'][i]}</small></div>)}</div></Card></div></div>}
