/**
 * 记录页(记录tab):月历 + 当日记录项 + 记录弹层。
 * spec: record.calendar + record.entrySheet + record.periodEndSheet;
 * 证据 anchor 106/108/148/149/150/151。选中日期等离散态走 URL(?date= / ?sheet= / ?view=)。
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, MODE_NOT_OPEN, useToast, useFlowerToast, usePanel, BottomSheet, WheelPicker } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcNavBack, IcArrowRight, IcArrowUp, IcArrowDown, IcAnalysis, IcCheck, IcPlus, IcDrop, IcCamera } from '../res/icons';
import {
  FLOW_OPTIONS, COLOR_OPTIONS, PAIN_OPTIONS, POOP_OPTIONS, LEUKORRHEA_OPTIONS, MOOD_OPTIONS, LOVE_OPTIONS,
  SYMPTOM_BODY, SYMPTOM_DISCHARGE, type SheetKind,
} from '../constants';
import { fmtDate, parseDate, addDays, diffDays, dayInfo, currentPeriod } from '../utils/cycle';
import type { DayRecord } from '../types';

/* ---------------- 日期纯工具(无 Date 构造) ---------------- */
function monthAdd(ym: string, delta: number): string {
  const y = Number(ym.slice(0, 4));
  const m0 = Number(ym.slice(5, 7)) - 1 + delta;
  const ny = y + Math.floor(m0 / 12);
  const nm = ((m0 % 12) + 12) % 12 + 1;
  return `${ny}-${String(nm).padStart(2, '0')}`;
}
function weekdayOf(date: string): number {
  return TimeService.fromTimestamp(parseDate(date)).getDay();
}

const WEEK_HEADER = ['日', '一', '二', '三', '四', '五', '六'] as const;
const MOOD_EMOJI: Record<string, string> = { 好伤心: '😭', 不开心: '🙁', 一般: '😐', 开心: '😊', 超开心: '😄' };
const COLOR_SWATCH: Record<string, string> = { 浅红色: '#F49A9A', 鲜红色: '#E93B3B', 深红色: '#9E1F1F', 褐色: '#8B5A2B', 黑色: '#2B2B2B' };
const PAIN_BG = ['#FFF0F6', '#FFDCEA', '#FFBBD6', '#FC7FAE', '#FA4B85'] as const;
const POOP_EMOJI: Record<string, string> = { 舒畅: '😌', 有残便感: '😅', 排便困难: '😖' };
const LOVE_EMOJI: Record<string, string> = {
  无措施: '🔓', 避孕套: '🎈', 体外排精: '💦', 未射精: '🚫', 紧急避孕药: '💊',
  短效避孕药: '💊', 长效避孕药: '💊', 节育环: '➿', 其他措施: '☂️', 自慰: '💗',
};
const SYMPTOM_EMOJI: Record<string, string> = {
  没有症状: '👍', 腰酸: '🧘', 腹痛: '😖', 小腹坠胀: '⬇️', 乳房胀痛: '🎈', 身体酸痛: '💢', 头痛: '🤯', 眩晕: '💫',
  失眠: '🌙', 粉刺: '🔴', 皮肤干燥: '🏜️', 食欲不振: '😶', 食欲旺盛: '😋', 腹泻: '🚽', 便秘: '🧱', 疲惫: '😪',
  褐色分泌物: '🟤', 出血: '🩸', 有血块: '�man', 白带增多: '⚪',
};
const LEUKORRHEA_DESC: Record<string, string> = {
  干燥: '内裤干爽,分泌物量少,无水分',
  粘稠: '分泌物稠厚,触感像胶状物',
  稀糊状: '含水量偏多偏黄色,触感像乳液',
  水状: '呈白色或透明,触感似水滴',
  蛋清状: '呈透明状,两指间可拉丝',
};
const TIME_OPTIONS = ['06:00', '08:00', '10:00', '12:00', '15:00', '18:00', '20:00', '22:00'] as const;

const SHEET_TITLES: Record<SheetKind, string> = {
  flow: '流量', color: '颜色', pain: '痛经', poop: '便便', weight: '体重',
  love: '爱爱', symptom: '症状', leukorrhea: '白带', temperature: '基础体温',
};

export default function RecordPage() {
  const { bindTap } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [flower, showFlower] = useFlowerToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const { value: sheet, open: openSheet } = usePanel('sheet');

  const mode = useMeiyouStore((st) => st.mode);
  const prepEnabled = useMeiyouStore((st) => st.prepEnabled);
  const cycle = useMeiyouStore((st) => st.cycle);
  const periods = useMeiyouStore((st) => st.periods);
  const dayRecords = useMeiyouStore((st) => st.dayRecords);
  const analysisBadge = useMeiyouStore((st) => st.analysisBadge);
  const saveRecord = useMeiyouStore((st) => st.saveRecord);
  const switchMode = useMeiyouStore((st) => st.switchMode);
  const clearAnalysisBadge = useMeiyouStore((st) => st.clearAnalysisBadge);
  const confirmPeriodEnd = useMeiyouStore((st) => st.confirmPeriodEnd);

  const today = fmtDate(TimeService.now());
  const selDate = searchParams.get('date') ?? today;
  const weekView = searchParams.get('view') === 'week';

  const selectDate = React.useCallback(
    (d: string) => {
      setSearchParams((p) => { p.set('date', d); return p; }, { replace: true });
    },
    [setSearchParams],
  );
  const setWeekView = React.useCallback(
    (on: boolean) => {
      setSearchParams((p) => { if (on) p.set('view', 'week'); else p.delete('view'); return p; }, { replace: true });
    },
    [setSearchParams],
  );

  /* ---------- 月历数据 ---------- */
  const ym = selDate.slice(0, 7);
  const cells = React.useMemo<(string | null)[]>(() => {
    if (weekView) {
      const start = addDays(selDate, -weekdayOf(selDate));
      return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }
    const first = `${ym}-01`;
    const total = diffDays(`${monthAdd(ym, 1)}-01`, first);
    const lead = weekdayOf(first);
    const list: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let i = 0; i < total; i++) list.push(addDays(first, i));
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [ym, weekView, selDate]);

  /* ---------- 左右滑翻月 / 上滑折叠(PointerEvent 判位移) ---------- */
  const ptStart = React.useRef<{ x: number; y: number } | null>(null);
  const onCalPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    ptStart.current = { x: e.clientX, y: e.clientY };
  };
  const onCalPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ptStart.current) return;
    const dx = e.clientX - ptStart.current.x;
    const dy = e.clientY - ptStart.current.y;
    ptStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      selectDate(`${monthAdd(ym, dx < 0 ? 1 : -1)}-01`);
    } else if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      setWeekView(dy < 0);
    }
  };

  /* ---------- 选中日状态 ---------- */
  const info = dayInfo(selDate, periods, cycle);
  const inPeriod = info.kind === 'period';
  const isToday = selDate === today;
  const isFuture = selDate > today;
  const cur = currentPeriod(periods);
  const periodEnded = !!cur?.end && cur.end <= today;
  const rec: DayRecord = dayRecords[selDate] ?? {};
  const prep = mode === 'prep';

  const sheetKind = sheet as SheetKind | 'periodEnd' | 'time' | null;

  /* ---------- 弹层保存 ---------- */
  const saveAndClose = (patch: Partial<DayRecord>) => {
    saveRecord(selDate, patch);
    window.__OS__?.handleBack();
    showFlower(s.analysisUpdated);
  };

  /* ---------- 经期结束弹层选项(同 HomePage) ---------- */
  const endOptions = [
    { label: `${Number(addDays(today, -2).slice(8))}日(前天)`, value: addDays(today, -2) },
    { label: `${Number(addDays(today, -1).slice(8))}日(昨天)`, value: addDays(today, -1) },
    { label: `${today.slice(0, 4)}年  ${Number(today.slice(5, 7))}月  ${Number(today.slice(8))}日(今天)`, value: today },
  ];
  const [endPick, setEndPick] = React.useState('');

  /* ---------- 记录行值 ---------- */
  const symptomText = rec.symptoms?.length
    ? `${rec.symptoms.slice(0, 2).join('、')}${rec.symptoms.length > 2 ? `、...共${rec.symptoms.length}种` : ''}`
    : '';

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      {/* 顶栏:<月份 + 模式tab + 分析 */}
      <div className="flex items-center h-11 px-2 shrink-0">
        <button
          {...bindTap('meiyou.yearview-open')}
          className="flex items-center bg-transparent border-none cursor-pointer shrink-0 pr-1"
          aria-label="年历"
        >
          <IcNavBack size={20} className="text-[#1A1A1A]" />
          <span className="text-[17px] font-semibold text-[#1A1A1A]">{Number(ym.slice(5, 7))}月</span>
        </button>
        {!isToday && (
          <button
            {...bindTap({ kind: 'action', id: 'record.calendar.backtoday' }, { onTrigger: () => selectDate(today) })}
            className="ml-1 px-2 h-6 rounded-full border border-[#DDD] bg-white text-[11px] text-[#666] cursor-pointer shrink-0"
          >
            {s.backToday}
          </button>
        )}
        <div className="flex-1 flex items-center justify-center gap-4">
          {/* 经期 tab:period 态为当前态;prep 态无声明的切回动作(缺口),仅展示 */}
          <span className={`text-[15px] ${!prep ? 'font-bold' : 'text-[#666]'}`} style={!prep ? { color: MY.primary, borderBottom: `3px solid ${MY.primary}`, paddingBottom: 2 } : {}}>
            经期
          </span>
          {prep ? (
            <span className="text-[15px] font-bold" style={{ color: MY.primary, borderBottom: `3px solid ${MY.primary}`, paddingBottom: 2 }}>备孕</span>
          ) : prepEnabled ? (
            <button
              {...bindTap({ kind: 'action', id: 'record.mode.prep.switch' }, { onTrigger: () => switchMode('prep') })}
              className="text-[15px] text-[#666] bg-transparent border-none cursor-pointer p-0"
            >
              备孕
            </button>
          ) : (
            <button {...bindTap('meiyou.prepintro-open')} className="text-[15px] text-[#666] bg-transparent border-none cursor-pointer p-0">
              备孕
            </button>
          )}
          {(['怀孕', '育儿'] as const).map((m) => (
            <button
              key={m}
              {...bindTap({ kind: 'action', id: 'record.mode.disabled' }, { onTrigger: () => showToast(MODE_NOT_OPEN) })}
              className="text-[15px] text-[#666] bg-transparent border-none cursor-pointer p-0"
            >
              {m}
            </button>
          ))}
        </div>
        <button
          {...bindTap('meiyou.analysis-open', { beforeTrigger: () => clearAnalysisBadge() })}
          className="flex flex-col items-center bg-transparent border-none cursor-pointer relative shrink-0 px-1"
          aria-label={s.analysis}
        >
          <IcAnalysis size={19} className="text-[#1A1A1A]" />
          <span className="text-[9px] text-[#1A1A1A]">{s.analysis}</span>
          {analysisBadge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-0.5 rounded-full bg-[#FF2D2D] text-white text-[9px] flex items-center justify-center">
              {analysisBadge}
            </span>
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-3" data-scroll-container="record-body" data-scroll-direction="vertical">
        {/* 月历(左右滑翻月 swipe) */}
        <div
          data-action="record.month.select.target"
          data-action-type="swipe"
          onPointerDown={onCalPointerDown}
          onPointerUp={onCalPointerUp}
          className="bg-white px-1 pb-1"
        >
          <div className="grid grid-cols-7">
            {WEEK_HEADER.map((w) => (
              <div key={w} className="text-center text-[12px] text-[#BBB] py-1.5">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((d, i) =>
              d === null ? (
                <div key={`e${i}`} />
              ) : (
                <DayCell
                  key={d}
                  date={d}
                  info={dayInfo(d, periods, cycle)}
                  selected={d === selDate}
                  isToday={d === today}
                  hasRecord={!!dayRecords[d]}
                  prep={prep}
                  bind={bindTap({ kind: 'action', id: 'record.day.select.target' }, { params: { target: d }, onTrigger: () => selectDate(d) })}
                />
              ),
            )}
          </div>
          {/* 图例 + 折叠把手 */}
          <div className="flex items-center px-2 pt-1.5 text-[11px] text-[#666]">
            <span className="w-2.5 h-2.5 rounded-sm mr-1" style={{ background: MY.periodBlock }} />月经期
            <span className="w-2.5 h-2.5 rounded-sm ml-2.5 mr-1" style={{ background: MY.periodPredict }} />预测经期
            <span className="w-2.5 h-2.5 rounded-sm ml-2.5 mr-1" style={{ background: MY.fertile }} />{prep ? '易孕期' : '排卵期'}
            <span className="ml-2.5 mr-1 text-[12px]" style={{ color: MY.ovulation }}>✿</span>排卵日
            <span className="flex-1" />
            <IcArrowRight size={14} className="text-[#CCC]" />
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'record.calendar.collapse.toggle' }, { onTrigger: () => setWeekView(!weekView) })}
            className="w-full h-5 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label={weekView ? '展开月历' : '折叠为周条'}
          >
            {weekView ? <IcArrowDown size={16} className="text-[#CCC]" /> : <IcArrowUp size={16} className="text-[#CCC]" />}
          </button>
        </div>

        {/* 解读横幅 */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl px-3 py-3 flex items-center">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-[17px] shrink-0" style={{ background: '#FFE3ED' }}>📋</div>
          <div className="flex-1 min-w-0 ml-2.5">
            <div className="text-[14px] font-semibold truncate" style={{ color: MY.primary }}>经期健康报告更新了</div>
            <div className="text-[12px] text-[#999] truncate">立即查看你的个性化分析 &gt;&gt;</div>
          </div>
          <button
            {...bindTap('meiyou.analysis-open')}
            className="px-3.5 h-8 rounded-full text-[13px] text-white border-none cursor-pointer shrink-0"
            style={{ background: MY.primary }}
          >
            去查看
          </button>
        </div>

        {/* 记录项列表 */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl overflow-hidden">
          {isFuture ? (
            <>
              <div className="px-3 py-4 text-[13px] text-[#999] text-center">未来的日子,到时再来记录哦~</div>
              <Row emoji="📋" bg="#E3F2FD" label="计划" bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })} />
            </>
          ) : (
            <>
              {/* 月经来了/走喽 */}
              <div className="flex items-center px-3" style={{ height: 52 }}>
                <RowIcon emoji="🩸" bg="#FFE3ED" />
                <span className="flex-1 text-[15px] font-medium text-[#1A1A1A]">{isToday && inPeriod ? s.periodGone : s.periodCame}</span>
                <div className="flex rounded-lg overflow-hidden">
                  {isToday && inPeriod ? (
                    <>
                      <button
                        {...bindTap({ kind: 'action', id: 'record.period.toggle' }, { onTrigger: () => openSheet('periodEnd') })}
                        className="px-5 h-9 text-[14px] border-none cursor-pointer"
                        style={periodEnded ? { background: MY.primary, color: '#fff' } : { background: '#F2F2F4', color: '#666' }}
                      >
                        {s.yes}
                      </button>
                      <button className="px-5 h-9 text-[14px] border-none cursor-default" style={!periodEnded ? { background: MY.primary, color: '#fff' } : { background: '#F2F2F4', color: '#666' }}>
                        {s.no}
                      </button>
                    </>
                  ) : inPeriod ? (
                    <>
                      <button className="px-5 h-9 text-[14px] border-none cursor-default" style={{ background: MY.primary, color: '#fff' }}>{s.yes}</button>
                      <button className="px-5 h-9 text-[14px] border-none cursor-default" style={{ background: '#F2F2F4', color: '#666' }}>{s.no}</button>
                    </>
                  ) : (
                    <>
                      <button
                        {...bindTap('meiyou.periodform-open', { params: { date: selDate } })}
                        className="px-5 h-9 text-[14px] border-none cursor-pointer"
                        style={{ background: '#F2F2F4', color: '#666' }}
                      >
                        {s.yes}
                      </button>
                      <button className="px-5 h-9 text-[14px] border-none cursor-default" style={{ background: MY.primary, color: '#fff' }}>{s.no}</button>
                    </>
                  )}
                </div>
              </div>

              {/* 记下具体时间(经期第1天) */}
              {inPeriod && info.periodDay === 1 && (
                <Row
                  emoji="🕐" bg="#FFE9F1" label="记下具体时间" value={rec.startTime}
                  bind={bindTap({ kind: 'action', id: 'record.time.set' }, { onTrigger: () => openSheet('time') })}
                />
              )}

              {/* 经期专属:流量/颜色/痛经 */}
              {inPeriod && (
                <>
                  <Row emoji="🧧" bg="#FFE3ED" label="流量" value={rec.flow} bind={bindSheetOpen(bindTap, openSheet, 'flow')} />
                  <Row emoji="🎨" bg="#FFE3ED" label="颜色" value={rec.color} bind={bindSheetOpen(bindTap, openSheet, 'color')} />
                  <Row emoji="⚡" bg="#FFD6E5" label="痛经" value={rec.pain} bind={bindSheetOpen(bindTap, openSheet, 'pain')} />
                </>
              )}

              <Row emoji="💕" bg="#FFE3ED" label="爱爱" value={rec.love ? `${rec.love.count}次` : ''} bind={bindSheetOpen(bindTap, openSheet, 'love')} />

              {/* 备孕模式追加行 */}
              {prep && (
                <>
                  <Row emoji="🧪" bg="#F0EBFC" label="排卵试纸" bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })} />
                  <Row emoji="🌡️" bg="#F0EBFC" label="基础体温" value={rec.temperature ? `${rec.temperature}℃` : ''} bind={bindSheetOpen(bindTap, openSheet, 'temperature')} />
                  <Row emoji="🔬" bg="#F0EBFC" label="卵泡监测" bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })} />
                  <Row emoji="💊" bg="#F0EBFC" label="营养补充" bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })} />
                </>
              )}

              <Row emoji="🏥" bg="#DBF0FF" label="症状" value={symptomText} bind={bindSheetOpen(bindTap, openSheet, 'symptom')} />

              {/* 心情:5个表情直接点选 */}
              <div className="flex items-center px-3" style={{ height: 52 }}>
                <RowIcon emoji="😊" bg="#FFF3D6" />
                <span className="text-[15px] font-medium text-[#1A1A1A]">心情</span>
                <div className="flex-1 flex items-center justify-end gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m}
                      {...bindTap({ kind: 'action', id: 'record.mood.select.target' }, {
                        params: { target: m },
                        onTrigger: () => { saveRecord(selDate, { mood: m }); showFlower(m); },
                      })}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[18px] bg-transparent border-none cursor-pointer"
                      style={rec.mood === m ? { background: '#FFF3D6' } : { filter: 'grayscale(1)', opacity: 0.55 }}
                      aria-label={m}
                    >
                      {MOOD_EMOJI[m]}
                    </button>
                  ))}
                </div>
              </div>

              <Row emoji="💠" bg="#F0EBFC" label="白带" value={rec.leukorrhea} bind={bindSheetOpen(bindTap, openSheet, 'leukorrhea')} />
              {!prep && (
                <Row emoji="🌡️" bg="#F0EBFC" label="体温" value={rec.temperature ? `${rec.temperature}℃` : ''} bind={bindSheetOpen(bindTap, openSheet, 'temperature')} />
              )}
              <Row emoji="⚖️" bg="#F0EBFC" label="体重" value={rec.weight ? `${rec.weight}公斤` : ''} bind={bindSheetOpen(bindTap, openSheet, 'weight')} />
              <Row
                emoji="📔" bg="#FFF3D6" label="日记"
                right={<span className="flex items-center text-[#CCC]"><IcCamera size={16} className="mr-1" /><IcArrowRight size={15} /></span>}
                bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              />
              <Row
                emoji="👍" bg="#DBF0FF" label="好习惯"
                right={<span className="flex items-center gap-1.5 text-[13px]" style={{ filter: 'grayscale(1)', opacity: 0.4 }}>⚡🍎🥤🎾</span>}
                bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              />
              <Row emoji="💩" bg="#FFF3D6" label="便便" value={rec.poop ? `${rec.poop.count}次` : ''} bind={bindSheetOpen(bindTap, openSheet, 'poop')} />
              <Row emoji="📋" bg="#E3F2FD" label="计划" bind={bindTap({ kind: 'action', id: 'record.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })} />
            </>
          )}
        </div>
      </div>

      {/* ---------------- 弹层(URL ?sheet= 驱动) ---------------- */}
      {sheetKind === 'flow' && (
        <SingleOptionSheet
          key={`flow-${selDate}`} title={SHEET_TITLES.flow} options={[...FLOW_OPTIONS]} initial={rec.flow}
          renderIcon={(o, i) => (
            <OptionCircle bg="#FFE3ED"><IcDrop size={12 + i * 3} style={{ color: MY.primary }} fill={MY.primary} /></OptionCircle>
          )}
          onConfirm={(v) => saveAndClose({ flow: v })}
        />
      )}
      {sheetKind === 'color' && (
        <SingleOptionSheet
          key={`color-${selDate}`} title={SHEET_TITLES.color} options={[...COLOR_OPTIONS]} initial={rec.color}
          renderIcon={(o) => <OptionCircle bg={COLOR_SWATCH[o]}><span /></OptionCircle>}
          onConfirm={(v) => saveAndClose({ color: v })}
        />
      )}
      {sheetKind === 'pain' && (
        <SingleOptionSheet
          key={`pain-${selDate}`} title={SHEET_TITLES.pain} options={[...PAIN_OPTIONS]} initial={rec.pain}
          renderIcon={(o, i) => <OptionCircle bg={PAIN_BG[i]}><span className="text-[16px]">⚡</span></OptionCircle>}
          onConfirm={(v) => saveAndClose({ pain: v })}
        />
      )}
      {sheetKind === 'poop' && (
        <PoopSheet key={`poop-${selDate}`} initial={rec} onConfirm={(feel, time) => saveAndClose({ poop: { feel, time, count: (rec.poop?.count ?? 0) + 1 } })} />
      )}
      {sheetKind === 'love' && (
        <LoveSheet key={`love-${selDate}`} nth={(rec.love?.count ?? 0) + 1} initial={rec.love?.measure} onConfirm={(measure, time) => saveAndClose({ love: { count: (rec.love?.count ?? 0) + 1, measure, time } })} />
      )}
      {sheetKind === 'leukorrhea' && (
        <LeukorrheaSheet key={`leu-${selDate}`} initial={rec.leukorrhea} onConfirm={(v) => saveAndClose({ leukorrhea: v })} />
      )}
      {sheetKind === 'symptom' && (
        <SymptomSheet
          key={`sym-${selDate}`} initial={rec.symptoms ?? []} showToast={showToast}
          onConfirm={(list) => saveAndClose({ symptoms: list })}
        />
      )}
      {sheetKind === 'weight' && (
        <NumberPadSheet
          key={`w-${selDate}`} title={SHEET_TITLES.weight} kind="weight" showToast={showToast}
          onConfirm={(v) => saveAndClose({ weight: v })}
        />
      )}
      {sheetKind === 'temperature' && (
        <NumberPadSheet
          key={`t-${selDate}`} title={SHEET_TITLES.temperature} kind="temperature" showToast={showToast}
          onConfirm={(v) => saveAndClose({ temperature: v })}
        />
      )}
      {sheetKind === 'time' && (
        <TimeWheelSheet key={`time-${selDate}`} initial={rec.startTime} onConfirm={(v) => saveAndClose({ startTime: v })} />
      )}
      {sheetKind === 'periodEnd' && (
        <PeriodEndSheet
          options={endOptions}
          value={endPick || today}
          onPick={setEndPick}
          onConfirm={() => {
            confirmPeriodEnd(endPick || today);
            window.__OS__?.handleBack();
            showFlower(s.analysisUpdated);
          }}
        />
      )}

      {toast}
      {flower}
    </div>
  );
}

/** 记录行打开对应弹层(record.sheet.open,target=弹层kind);弹层内的档位选择才用 option.select.target */
function bindSheetOpen(
  bindTap: ReturnType<typeof useMeiyouGestures>['bindTap'],
  openSheet: (v: string) => void,
  kind: SheetKind,
) {
  return bindTap({ kind: 'action', id: 'record.sheet.open' }, {
    params: { target: kind },
    onTrigger: () => openSheet(kind),
  });
}

/* ---------------- 日历格 ---------------- */
function DayCell({
  date, info, selected, isToday, hasRecord, prep, bind,
}: {
  date: string;
  info: ReturnType<typeof dayInfo>;
  selected: boolean;
  isToday: boolean;
  hasRecord: boolean;
  prep: boolean;
  bind: object;
}) {
  const day = Number(date.slice(8));
  let style: React.CSSProperties = { color: '#3EC06B' };
  if (info.kind === 'period') style = { background: MY.periodBlock, color: '#fff' };
  else if (info.kind === 'predict') style = { background: MY.periodPredict, color: '#fff' };
  else if (info.kind === 'fertile') style = prep ? { background: MY.fertile, color: MY.ovulation } : { color: MY.ovulation };
  else if (info.kind === 'ovulation') style = prep ? { background: MY.fertile, color: MY.ovulation } : { color: MY.ovulation };
  if (selected) style = { ...style, boxShadow: `inset 0 0 0 2px #B01A50` };
  else if (isToday) style = { ...style, boxShadow: `inset 0 0 0 2px ${MY.primary}` };

  return (
    <button
      {...bind}
      className="relative mx-0.5 h-11 rounded-lg flex items-center justify-center text-[16px] font-medium bg-transparent border-none cursor-pointer"
      style={style}
      aria-label={date}
    >
      {info.kind === 'ovulation' && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] leading-none" style={{ color: MY.ovulation }}>✿</span>
      )}
      {isToday && info.kind === 'period' ? '今' : day}
      {hasRecord && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: MY.accentYellow }} />}
    </button>
  );
}

/* ---------------- 记录行 ---------------- */
function RowIcon({ emoji, bg }: { emoji: string; bg: string }) {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center text-[15px] mr-2.5 shrink-0" style={{ background: bg }}>
      {emoji}
    </div>
  );
}

function Row({
  emoji, bg, label, value, right, bind,
}: {
  emoji: string;
  bg: string;
  label: string;
  value?: string;
  right?: React.ReactNode;
  bind: object;
}) {
  return (
    <button {...bind} className="w-full flex items-center px-3 bg-transparent border-none border-t border-[#F5F5F7] cursor-pointer text-left" style={{ height: 52 }}>
      <RowIcon emoji={emoji} bg={bg} />
      <span className="flex-1 text-[15px] font-medium text-[#1A1A1A]">{label}</span>
      {right ?? (value ? (
        <span className="text-[15px] font-medium" style={{ color: MY.primary }}>{value}</span>
      ) : (
        <span className="w-6 h-6 rounded-full border flex items-center justify-center" style={{ borderColor: MY.primary }}>
          <IcPlus size={14} style={{ color: MY.primary }} />
        </span>
      ))}
    </button>
  );
}

/* ---------------- 通用弹层小件 ---------------- */
function OptionCircle({ bg, children }: { bg: string; children: React.ReactNode }) {
  return (
    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: bg }}>
      {children}
    </div>
  );
}

function CheckBadge() {
  return (
    <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center" style={{ background: '#3EC06B', width: 18, height: 18 }}>
      <IcCheck size={12} className="text-white" />
    </span>
  );
}

function useSheetGestures() {
  const { bindTap, bindBack } = useMeiyouGestures();
  return { bindTap, bindBack };
}

/** 单选档位弹层(流量/颜色/痛经) */
function SingleOptionSheet({
  title, options, initial, renderIcon, onConfirm,
}: {
  title: string;
  options: string[];
  initial?: string;
  renderIcon: (opt: string, index: number) => React.ReactNode;
  onConfirm: (v: string) => void;
}) {
  const { bindTap, bindBack } = useSheetGestures();
  const [pick, setPick] = React.useState(initial ?? '');
  return (
    <BottomSheet
      title={title}
      cancelBind={bindBack()}
      confirmBind={bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: () => { if (pick) onConfirm(pick); } })}
    >
      <div className="grid grid-cols-5 gap-2 py-2">
        {options.map((o, i) => (
          <button
            key={o}
            {...bindTap({ kind: 'action', id: 'record.sheet.option.select.target' }, { params: { target: o }, onTrigger: () => setPick(o) })}
            className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
          >
            <div className="relative">
              {renderIcon(o, i)}
              {pick === o && <CheckBadge />}
            </div>
            <span className="text-[11px] text-[#666]">{o}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

/** 时间滚轮(简化为点选列表) */
function TimeWheel({ value, onPick }: { value: string; onPick: (v: string) => void }) {
  const { bindTap } = useSheetGestures();
  return (
    <WheelPicker
      options={[...TIME_OPTIONS]}
      value={value}
      bindFor={(v) => bindTap({ kind: 'action', id: 'record.sheet.time.select.target' }, { params: { target: v }, onTrigger: () => onPick(v) })}
    />
  );
}

/** 便便弹层:感受3档 + 时间 + 折叠项 */
function PoopSheet({ initial, onConfirm }: { initial: DayRecord; onConfirm: (feel: string, time: string) => void }) {
  const { bindTap, bindBack } = useSheetGestures();
  const [pick, setPick] = React.useState(initial.poop?.feel ?? '');
  const [time, setTime] = React.useState(initial.poop?.time ?? '20:00');
  const [extra, setExtra] = React.useState(false);
  return (
    <BottomSheet
      title="便便"
      cancelBind={bindBack()}
      confirmBind={bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: () => { if (pick) onConfirm(pick, time); } })}
    >
      <div className="text-[13px] text-[#999] pt-1">感受</div>
      <div className="grid grid-cols-3 gap-2 py-2">
        {POOP_OPTIONS.map((o) => (
          <button
            key={o}
            {...bindTap({ kind: 'action', id: 'record.sheet.option.select.target' }, { params: { target: o }, onTrigger: () => setPick(o) })}
            className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
          >
            <div className="relative">
              <OptionCircle bg="#FFF3D6"><span className="text-[20px]">{POOP_EMOJI[o]}</span></OptionCircle>
              {pick === o && <CheckBadge />}
            </div>
            <span className="text-[11px] text-[#666]">{o}</span>
          </button>
        ))}
      </div>
      <div className="text-[13px] text-[#999] pt-1">时间</div>
      <TimeWheel value={time} onPick={setTime} />
      <button
        {...bindTap({ kind: 'action', id: 'record.sheet.poopextra.toggle' }, { onTrigger: () => setExtra((v) => !v) })}
        className="w-full flex items-center justify-center gap-1 py-2 text-[13px] text-[#999] bg-transparent border-none cursor-pointer"
      >
        形状、便便量、用时 {extra ? <IcArrowUp size={14} /> : <IcArrowDown size={14} />}
      </button>
      {extra && (
        <div className="flex flex-col gap-1 pb-2">
          {['形状', '便便量', '用时'].map((k) => (
            <div key={k} className="flex items-center justify-between px-2 py-2 bg-[#F7F7F9] rounded-lg text-[13px] text-[#666]">
              <span>{k}</span><span className="text-[#BBB]">未记录</span>
            </div>
          ))}
        </div>
      )}
    </BottomSheet>
  );
}

/** 爱爱弹层:措施10项 + 时间滚轮 */
function LoveSheet({ nth, initial, onConfirm }: { nth: number; initial?: string; onConfirm: (measure: string, time: string) => void }) {
  const { bindTap, bindBack } = useSheetGestures();
  const [pick, setPick] = React.useState(initial ?? '');
  const [time, setTime] = React.useState('20:00');
  return (
    <BottomSheet
      title={`第${nth}次爱爱记录`}
      cancelBind={bindBack()}
      confirmBind={bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: () => { if (pick) onConfirm(pick, time); } })}
    >
      <div className="text-[15px] font-semibold text-[#1A1A1A] pt-1">爱爱 <span className="text-[12px] text-[#CCC]">ⓘ</span></div>
      <div className="grid grid-cols-5 gap-x-1 gap-y-3 py-2">
        {LOVE_OPTIONS.map((o) => (
          <button
            key={o}
            {...bindTap({ kind: 'action', id: 'record.sheet.option.select.target' }, { params: { target: o }, onTrigger: () => setPick(o) })}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <div className="relative">
              <OptionCircle bg="#FFE3ED"><span className="text-[18px]">{LOVE_EMOJI[o]}</span></OptionCircle>
              {pick === o && <CheckBadge />}
            </div>
            <span className="text-[10px] text-[#666] whitespace-nowrap">{o}</span>
          </button>
        ))}
      </div>
      <div className="text-[13px] text-[#999] pt-1">时间</div>
      <TimeWheel value={time} onPick={setTime} />
    </BottomSheet>
  );
}

/** 白带弹层:5档带说明,右侧单选圈 */
function LeukorrheaSheet({ initial, onConfirm }: { initial?: string; onConfirm: (v: string) => void }) {
  const { bindTap, bindBack } = useSheetGestures();
  const [pick, setPick] = React.useState(initial ?? '');
  return (
    <BottomSheet
      title="白带"
      cancelBind={bindBack()}
      confirmBind={bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: () => { if (pick) onConfirm(pick); } })}
    >
      <div className="flex flex-col gap-2 py-1">
        {LEUKORRHEA_OPTIONS.map((o) => (
          <button
            key={o}
            {...bindTap({ kind: 'action', id: 'record.sheet.option.select.target' }, { params: { target: o }, onTrigger: () => setPick(o) })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F7F7F9] border-none cursor-pointer text-left"
          >
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-[18px] shrink-0" style={{ background: '#FFE3ED' }}>💧</div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-[#1A1A1A]">{o}</div>
              <div className="text-[12px] text-[#999] truncate">{LEUKORRHEA_DESC[o]}</div>
            </div>
            <span
              className="w-5.5 h-5.5 rounded-full shrink-0 flex items-center justify-center"
              style={{ width: 22, height: 22, border: pick === o ? 'none' : '1.5px solid #DDD', background: pick === o ? '#3EC06B' : 'transparent' }}
            >
              {pick === o && <IcCheck size={14} className="text-white" />}
            </span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

/** 症状全屏选择页(身体症状16 + 阴道分泌物4,多选) */
function SymptomSheet({
  initial, showToast, onConfirm,
}: {
  initial: string[];
  showToast: (m: string) => void;
  onConfirm: (list: string[]) => void;
}) {
  const { bindTap, bindBack } = useSheetGestures();
  const [picks, setPicks] = React.useState<string[]>(initial);
  const toggle = (o: string) => setPicks((p) => (p.includes(o) ? p.filter((x) => x !== o) : [...p, o]));

  const grid = (items: readonly string[]) => (
    <div className="grid grid-cols-4 gap-x-1 gap-y-3 py-2">
      {items.map((o) => (
        <button
          key={o}
          {...bindTap({ kind: 'action', id: 'record.sheet.option.select.target' }, { params: { target: o }, onTrigger: () => toggle(o) })}
          className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
        >
          <div className="relative">
            <OptionCircle bg="#FFE3ED"><span className="text-[18px]">{SYMPTOM_EMOJI[o] ?? '🌸'}</span></OptionCircle>
            {picks.includes(o) && <CheckBadge />}
          </div>
          <span className="text-[11px] text-[#666] whitespace-nowrap">{o}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="absolute inset-0 z-40 flex flex-col" style={{ background: MY.bg }}>
      <div className="flex items-center justify-between px-4 h-12 shrink-0">
        <button {...bindBack()} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
        <div className="text-[16px] font-semibold text-[#1A1A1A]">症状</div>
        <button
          {...bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: () => onConfirm(picks) })}
          className="text-[14px] font-semibold bg-transparent border-none cursor-pointer"
          style={{ color: MY.primary }}
        >
          确定
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="symptom-sheet" data-scroll-direction="vertical">
        <div className="bg-white rounded-xl px-3 py-3">
          <div className="text-[16px] font-bold text-[#1A1A1A]">身体症状</div>
          {grid(SYMPTOM_BODY)}
        </div>
        <div className="bg-white rounded-xl px-3 py-3 mt-2.5">
          <div className="text-[16px] font-bold text-[#1A1A1A]">阴道分泌物</div>
          {grid(SYMPTOM_DISCHARGE)}
        </div>
        <div className="bg-white rounded-xl px-3 py-3 mt-2.5">
          <div className="text-[16px] font-bold text-[#1A1A1A]">更多症状</div>
          <button
            {...bindTap({ kind: 'action', id: 'record.sheet.symptomadd.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex flex-col items-center gap-1 mt-2 bg-transparent border-none cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: '#EEEEEE' }}>
              <IcPlus size={20} className="text-[#999]" />
            </div>
            <span className="text-[11px] text-[#666]">添加症状</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** 体重/体温数字键盘弹层 */
function NumberPadSheet({
  title, kind, showToast, onConfirm,
}: {
  title: string;
  kind: 'weight' | 'temperature';
  showToast: (m: string) => void;
  onConfirm: (v: number) => void;
}) {
  const { bindTap, bindBack } = useSheetGestures();
  const [input, setInput] = React.useState('');
  const [jin, setJin] = React.useState(false);
  const nowD = TimeService.fromTimestamp(TimeService.now());
  const nowHM = `${String(nowD.getHours()).padStart(2, '0')}:${String(nowD.getMinutes()).padStart(2, '0')}`;

  const press = (k: string) => {
    if (k === 'back') { setInput((v) => v.slice(0, -1)); return; }
    setInput((v) => {
      if (k === '.' && (v.includes('.') || v === '')) return v;
      if (v.length >= 6) return v;
      return v + k;
    });
  };
  const confirm = () => {
    const n = parseFloat(input);
    if (!Number.isFinite(n) || n <= 0) return;
    onConfirm(kind === 'weight' && jin ? Math.round((n / 2) * 100) / 100 : n);
  };
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative rounded-t-2xl flex flex-col pb-3" style={{ background: '#F2F2F4' }}>
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <button {...bindBack()} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
          <div className="text-[15px] font-semibold text-[#1A1A1A]">{title}</div>
          <button
            {...bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: confirm })}
            className="text-[14px] font-semibold bg-transparent border-none cursor-pointer"
            style={{ color: MY.primary }}
          >
            确定
          </button>
        </div>
        {kind === 'temperature' && (
          <div className="mx-3 mb-2 bg-white rounded-xl px-3 h-11 flex items-center justify-between text-[14px]">
            <span className="text-[#1A1A1A] font-medium">测温时间</span>
            <span className="text-[#666]">{nowHM}</span>
          </div>
        )}
        {kind === 'weight' && (
          <div className="mx-3 mb-2 flex items-center justify-between">
            <button
              {...bindTap({ kind: 'action', id: 'record.sheet.weight.unit.toggle' }, { onTrigger: () => setJin((v) => !v) })}
              className="px-3 h-8 rounded-full bg-white text-[13px] text-[#666] border-none cursor-pointer"
            >
              {jin ? '切换为公斤' : '切换为斤'}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'record.sheet.scale.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="px-3 h-8 rounded-full bg-white text-[13px] text-[#666] border-none cursor-pointer"
            >
              ⚖️ 连接体重/体脂秤
            </button>
          </div>
        )}
        <div className="mx-3 mb-3 bg-white rounded-xl h-28 flex items-center justify-center">
          <span className="text-[44px] font-light" style={{ color: input ? '#1A1A1A' : '#CCC' }}>{input || '0'}</span>
          <span className="text-[15px] text-[#999] ml-1 mt-4">{kind === 'weight' ? (jin ? '斤' : '公斤') : '℃'}</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 px-2">
          {keys.map((k) => (
            <button
              key={k}
              {...bindTap({ kind: 'action', id: 'record.sheet.number.input' }, { params: { value: k }, onTrigger: () => press(k) })}
              className="h-12 rounded-lg bg-white text-[20px] text-[#1A1A1A] border-none cursor-pointer active:bg-[#EEEEEE]"
            >
              {k === 'back' ? '⌫' : k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 记下具体时间弹层(时间滚轮) */
function TimeWheelSheet({ initial, onConfirm }: { initial?: string; onConfirm: (v: string) => void }) {
  const { bindTap, bindBack } = useSheetGestures();
  const [time, setTime] = React.useState(initial ?? '08:00');
  return (
    <BottomSheet
      title="记下具体时间"
      cancelBind={bindBack()}
      confirmBind={bindTap({ kind: 'action', id: 'record.sheet.confirm' }, { onTrigger: () => onConfirm(time) })}
    >
      <TimeWheel value={time} onPick={setTime} />
    </BottomSheet>
  );
}

/** 经期结束日期弹层(record.periodend.*,逻辑同 HomePage) */
function PeriodEndSheet({
  options, value, onPick, onConfirm,
}: {
  options: Array<{ label: string; value: string }>;
  value: string;
  onPick: (v: string) => void;
  onConfirm: () => void;
}) {
  const { bindTap, bindBack } = useMeiyouGestures();
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-2xl flex flex-col pb-6">
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <button {...bindBack()} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
          <div className="text-[15px] font-semibold text-[#1A1A1A]">选择经期结束日期</div>
          <button
            {...bindTap({ kind: 'action', id: 'record.periodend.confirm' }, { onTrigger: onConfirm })}
            className="text-[14px] font-semibold bg-transparent border-none cursor-pointer"
            style={{ color: MY.primary }}
          >
            确定
          </button>
        </div>
        <div className="px-6 py-2">
          {options.map((o) => (
            <button
              key={o.value}
              {...bindTap({ kind: 'action', id: 'record.periodend.select.target' }, { params: { target: o.value }, onTrigger: () => onPick(o.value) })}
              className={`w-full py-2.5 text-center border-none cursor-pointer rounded-lg ${
                o.value === value ? 'bg-[#F7F7F9] text-[20px] font-semibold text-[#1A1A1A]' : 'bg-transparent text-[15px] text-[#999]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
