import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { shareWithSystem } from '../capabilities';

// 节点: time.checkin —— 每日签到。进入自动签到(当日仅一次)+ 日签卡 + 连签进度2/5 + 分享wontfix。
// evidence: IMG_0328 · IMG_F1d5e43_t0044(种子 streak=2)

const PROGRESS_LABELS = ['第一天', '第二天', '第三天', '第四天', '优惠券'];

function sameDay(a: number, b: number): boolean {
  const da = TimeService.fromTimestamp(a);
  const db = TimeService.fromTimestamp(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

// 农历日(虚构,随日期变化 —— 不再硬编码固定文案)。
const LUNAR_TENS = ['初', '十', '廿', '三'];
const LUNAR_ONES = ['十', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
const LUNAR_MONTHS = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
function lunarDayLabel(d: Date): string {
  const dayOfYear = Math.floor(
    (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 1)) / 86400000,
  );
  const lunarMonth = LUNAR_MONTHS[(d.getMonth() + 11) % 12];
  const day = ((dayOfYear + 16) % 30) + 1; // 1..30
  let dayStr: string;
  if (day === 10) dayStr = '初十';
  else if (day === 20) dayStr = '二十';
  else if (day === 30) dayStr = '三十';
  else dayStr = LUNAR_TENS[Math.floor(day / 10)] + LUNAR_ONES[day % 10];
  return `${lunarMonth}月${dayStr}`;
}

export default function TimeCheckinPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const checkin = useDoubanStore((s) => s.checkin);
  const checkinToday = useDoubanStore((s) => s.checkinToday);

  const streak = checkin.streak;
  const goal = checkin.goal;

  const now = TimeService.now();
  const alreadyToday = Boolean(checkin.lastCheckinAt && sameDay(checkin.lastCheckinAt, now));
  const signToday = () => {
    if (alreadyToday) {
      toast('今日已签到');
      return;
    }
    checkinToday();
    toast('签到成功,连续签到五天有惊喜');
  };

  const today = TimeService.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const lunar = lunarDayLabel(today);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏中央常驻绿色签到胶囊(mod7 审计 S2:取代原「每日签到」标题) */}
      <TopBar
        title={
          <button
            type="button"
            {...bindTap({ kind: 'action', id: 'time.checkin.auto.sign' }, { onTrigger: signToday })}
            className="inline-flex items-center px-3 h-7 rounded-full text-[13px] font-medium text-white border-none cursor-pointer"
            style={{ background: C.green }}
          >
            {alreadyToday ? '已签到,连续五天有惊喜' : '点击签到'}
          </button>
        }
        right={<span className="text-lg" style={{ color: C.text }}>⋯</span>}
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 日签卡(米色卡:左上日期/右上农历/居中特大日期/分割线/金句/二维码右下) */}
        <div
          {...bindTap({ kind: 'action', id: 'time.checkin.auto.sign' }, { onTrigger: signToday })}
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ background: '#F6F1E7', border: '1px solid #EAE2D2' }}
        >
          <div className="p-5" style={{ color: '#4A443A' }}>
            <div className="flex items-start justify-between">
              <div className="leading-tight">
                <div className="text-[15px] font-medium">{today.getMonth() + 1}月{today.getDate()}日</div>
                <div className="text-xs mt-0.5" style={{ color: '#9A9182' }}>{weekdays[today.getDay()]}</div>
              </div>
              <div className="text-right leading-tight">
                <div className="text-xs" style={{ color: '#9A9182' }}>农历</div>
                <div className="text-[13px] mt-0.5">{lunar}</div>
              </div>
            </div>
            {/* 居中特大日期 */}
            <div className="text-center my-4">
              <span className="text-[72px] font-bold leading-none" style={{ color: '#3A342B' }}>{today.getDate()}</span>
            </div>
            <div className="h-px w-full" style={{ background: '#E2DAC8' }} />
            <div className="mt-4 text-[15px] leading-relaxed text-center">
              “对哲学的嘲弄也是一种哲学。”
            </div>
            <div className="mt-1.5 text-xs text-center" style={{ color: '#9A9182' }}>——《切断你习以为常的想法》</div>
            <div className="mt-5 flex items-end justify-between">
              <div className="text-xs" style={{ color: '#9A9182' }}>豆瓣时间</div>
              {/* 二维码占位(右下) */}
              <div className="w-12 h-12 rounded grid grid-cols-3 grid-rows-3 gap-0.5 p-1" style={{ background: '#fff' }}>
                {Array.from({ length: 9 }).map((_, i) => (
                  <span key={i} className="rounded-sm" style={{ background: i % 2 === 0 ? '#3A342B' : 'transparent' }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 分享按钮(橙色描边橙字) */}
        <button
          {...bindTap({ kind: 'action', id: 'time.checkin.share.wontfix' }, { onTrigger: () => { const launched = shareWithSystem('【豆瓣】日签分享', (r) => { if (r.resultCode === 'OK') toast('分享成功'); }); if (!launched) toast('无法打开系统分享'); } })}
          className="w-full h-10 rounded-full text-sm cursor-pointer"
          style={{ background: 'transparent', color: '#E8702A', border: '1px solid #E8702A' }}
        >
          分享我的日签
        </button>

        {/* 连签进度(无卡片无连接线:当天橙底数字圆、优惠券卡券图标) */}
        <div className="flex items-start justify-between px-1 pt-1">
          {PROGRESS_LABELS.map((label, i) => {
            const isCoupon = i === PROGRESS_LABELS.length - 1;
            const lit = isCoupon ? streak >= goal : i < streak;
            return (
              <div key={label} className="flex flex-col items-center gap-1.5">
                {isCoupon ? (
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: lit ? '#E8702A' : '#F2F3F5' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={lit ? '#fff' : '#B9BEC6'} strokeWidth="1.8">
                      <path d="M4 8a2 2 0 012-2h12a2 2 0 012 2 2 2 0 000 4 2 2 0 000 4 2 2 0 01-2 2H6a2 2 0 01-2-2 2 2 0 000-4 2 2 0 000-4z" />
                      <path d="M14 6v12" strokeDasharray="2 2" />
                    </svg>
                  </span>
                ) : (
                  <span
                    className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] font-semibold"
                    style={{ background: lit ? '#E8702A' : '#F2F3F5', color: lit ? '#fff' : '#B9BEC6' }}
                  >
                    {i + 1}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: lit ? '#E8702A' : C.sub }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* 签到规则(居中分隔标题 + 规则文案) */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="h-px w-8" style={{ background: C.border }} />
          <span className="text-xs" style={{ color: C.sub }}>签到规则</span>
          <span className="h-px w-8" style={{ background: C.border }} />
        </div>
        <div className="text-xs leading-relaxed px-1 text-center" style={{ color: C.sub }}>
          连续签到5天,可获得优惠券一张(间断不补签,重新开启)
        </div>
      </div>
    </div>
  );
}
