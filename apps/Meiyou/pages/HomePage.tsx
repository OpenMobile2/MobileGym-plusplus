/**
 * 首页(美柚tab):经期状态大卡 + 月经走喽快捷条 + 社区feed。
 * spec: home.feed + record.periodEndSheet;证据 anchor 105/115。
 */
import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, useToast, useFlowerToast, usePanel } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcSearch, IcPen, IcClose, IcHeart, IcComment, IcArrowDown, IcArrowUp } from '../res/icons';
import { fmtDate, addDays, dayInfo, daysToPeriodEnd, pregnancyProb, currentPeriod } from '../utils/cycle';
import { PostCard } from '../components/PostCard';

const PREP_TOOLS_ROW1 = ['好孕计划', '能不能吃', '排卵试纸', '黄金受孕期'] as const;
const PREP_TOOLS_ROW2 = ['体温测排', '备孕食谱', '倒数日', '备孕锦囊', '备孕全攻略'] as const;

export default function HomePage() {
  const { bindTap, go, back } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [flower, showFlower] = useFlowerToast();
  const { value: panel, open: openPanel } = usePanel('sheet');

  const mode = useMeiyouStore((st) => st.mode);
  const cycle = useMeiyouStore((st) => st.cycle);
  const periods = useMeiyouStore((st) => st.periods);
  const posts = useMeiyouStore((st) => st.posts);
  const dismissedAds = useMeiyouStore((st) => st.dismissedAds);
  const confirmPeriodEnd = useMeiyouStore((st) => st.confirmPeriodEnd);
  const [prepExpanded, setPrepExpanded] = React.useState(false);
  const [endPick, setEndPick] = React.useState('');

  const today = fmtDate(TimeService.now());
  const info = dayInfo(today, periods, cycle);
  const cur = currentPeriod(periods);
  const inPeriod = info.kind === 'period';
  const periodEnded = !!cur?.end && cur.end <= today;
  const endDays = daysToPeriodEnd(today, periods, cycle);
  const prob = pregnancyProb(today, periods, cycle);
  const sheetOpen = panel === 'periodEnd';

  const endOptions = [
    { label: `${Number(addDays(today, -2).slice(8))}日(前天)`, value: addDays(today, -2) },
    { label: `${Number(addDays(today, -1).slice(8))}日(昨天)`, value: addDays(today, -1) },
    { label: `${today.slice(0, 4)}年  ${Number(today.slice(5, 7))}月  ${Number(today.slice(8))}日(今天)`, value: today },
  ];
  const pickValue = endPick || today;

  const feed = posts.filter((p) => !dismissedAds.includes(p.id));

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-3 shrink-0">
        <button {...bindTap('meiyou.search-open')} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="搜索">
          <IcSearch size={21} className="text-[#1A1A1A]" />
        </button>
        <div className="flex-1 text-center font-semibold text-[17px] text-[#1A1A1A]">{s.navHome}</div>
        <button {...bindTap('meiyou.publish-open')} className="flex flex-col items-center bg-transparent border-none cursor-pointer" aria-label={s.publish}>
          <IcPen size={19} className="text-[#1A1A1A]" />
          <span className="text-[9px] text-[#1A1A1A]">{s.publish}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {/* 经期状态大卡 */}
        <div
          className="rounded-2xl p-4 text-white relative overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${MY.cardGradFrom}, ${MY.cardGradTo})` }}
        >
          {mode === 'prep' && (
            <div className="flex gap-4 text-[11px] mb-2 opacity-90">
              <span>周六({addDays(today, -1).slice(5).replace('-', '月')}日)</span>
              <span className="font-bold border-b-2 border-white pb-0.5">今天({today.slice(5).replace('-', '月')}日)</span>
              <span>周一({addDays(today, 1).slice(5).replace('-', '月')}日)</span>
            </div>
          )}
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-[24px] font-bold">
                {inPeriod ? s.periodDayN.replace('{n}', String(info.periodDay)) : periodEnded ? '经期已结束' : '安全期'}
              </div>
              <button
                {...bindTap('meiyou.dailyreport-open')}
                className="mt-1 text-[13px] text-white/95 bg-transparent border-none cursor-pointer p-0 flex items-center"
              >
                {mode === 'prep'
                  ? `预测下次排卵日${(() => { const c = currentPeriod(periods); return c ? addDays(c.start, cycle.cycleLen - 14).slice(5).replace('-', '月') + '日' : ''; })()}`
                  : inPeriod && endDays !== null
                    ? endDays === 0 ? '预计在今天结束' : endDays === 1 ? '预计在明天结束' : `预计${endDays}天后结束`
                    : '记录让预测更准确'}
                <span className="ml-0.5">›</span>
              </button>
              <button
                {...bindTap('meiyou.dailyreport-open')}
                className="mt-3 px-4 h-8 rounded-full border border-white/90 bg-transparent text-white text-[13px] cursor-pointer"
              >
                {s.viewDetail}
              </button>
            </div>
            {cycle.showPregProb && (
              <button
                {...bindTap('meiyou.dailyreport-open', { params: { focus: 'pregprob' } })}
                className="w-24 h-24 shrink-0 border-none cursor-pointer flex flex-col items-center justify-center text-white"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                  borderRadius: '48% 52% 55% 45% / 50% 46% 54% 50%',
                }}
                aria-label={s.pregnancyProb}
              >
                <span className="text-[11px]">{s.pregnancyProb}</span>
                <span className="text-[20px] font-bold">{prob.toFixed(1)}%</span>
              </button>
            )}
          </div>
        </div>

        {/* 月经走喽快捷条 */}
        <div className="bg-white rounded-xl mt-2.5 px-3 h-13 flex items-center" style={{ height: 52 }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center mr-2" style={{ background: '#FFE3ED' }}>
            <span className="text-[15px]">🩸</span>
          </div>
          <span className="flex-1 text-[15px] font-medium text-[#1A1A1A]">{s.periodGone}</span>
          <div className="flex rounded-lg overflow-hidden">
            <button
              {...bindTap({ kind: 'action', id: 'home.periodend.open' }, {
                onTrigger: () => openPanel('periodEnd'),
              })}
              className="px-5 h-9 text-[14px] border-none cursor-pointer"
              style={periodEnded ? { background: MY.primary, color: '#fff' } : { background: '#F2F2F4', color: '#666' }}
            >
              {s.yes}
            </button>
            <button
              className="px-5 h-9 text-[14px] border-none cursor-default"
              style={!periodEnded ? { background: MY.primary, color: '#fff' } : { background: '#F2F2F4', color: '#666' }}
            >
              {s.no}
            </button>
          </div>
        </div>

        {/* 备孕工具行(mode-prep) */}
        {mode === 'prep' && (
          <div className="bg-white rounded-xl mt-2.5 p-3">
            <div className="grid grid-cols-5 gap-2">
              {PREP_TOOLS_ROW1.map((t) => (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'home.preptools.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px]" style={{ background: '#FFF0F5' }}>🌸</div>
                  <span className="text-[10px] text-[#666]">{t}</span>
                </button>
              ))}
              <button
                {...bindTap({ kind: 'action', id: 'home.preptools.expand' }, { onTrigger: () => setPrepExpanded((v) => !v) })}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#F5F5F7' }}>
                  {prepExpanded ? <IcArrowUp size={18} className="text-[#999]" /> : <IcArrowDown size={18} className="text-[#999]" />}
                </div>
                <span className="text-[10px] text-[#666]">{prepExpanded ? '收起' : '更多'}</span>
              </button>
            </div>
            {prepExpanded && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {PREP_TOOLS_ROW2.map((t) => (
                  <button
                    key={t}
                    {...bindTap({ kind: 'action', id: 'home.preptools.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                    className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[16px]" style={{ background: '#F0EBFC' }}>🍀</div>
                    <span className="text-[10px] text-[#666]">{t}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 社区 feed */}
        <div className="flex flex-col gap-2.5 mt-2.5">
          {feed.map((p) => (
            <PostCard key={p.id} post={p} showToast={showToast} />
          ))}
        </div>
      </div>

      {/* 悬浮发帖 FAB */}
      <button
        {...bindTap('meiyou.publish-open')}
        className="absolute right-4 bottom-5 w-13 h-13 rounded-full flex items-center justify-center border-none cursor-pointer shadow-lg"
        style={{ background: MY.primary, width: 52, height: 52 }}
        aria-label={s.publish}
      >
        <IcPen size={22} className="text-white" />
      </button>

      {/* 选择经期结束日期弹层(sheet=periodEnd,URL驱动,返回键可关) */}
      {sheetOpen && (
        <PeriodEndSheet
          options={endOptions}
          value={pickValue}
          onPick={setEndPick}
          onConfirm={() => {
            confirmPeriodEnd(pickValue);
            back();
            showFlower();
          }}
        />
      )}

      {toast}
      {flower}
    </div>
  );
}

/** 经期结束日期弹层(独立组件避免上面 BottomSheet 占位干扰) */
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
            {...bindTap({ kind: 'action', id: 'home.periodend.confirm' }, { onTrigger: onConfirm })}
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
              {...bindTap({ kind: 'action', id: 'home.periodend.select.target' }, { params: { target: o.value }, onTrigger: () => onPick(o.value) })}
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
