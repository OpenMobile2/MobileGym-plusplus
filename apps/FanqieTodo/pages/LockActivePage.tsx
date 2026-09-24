import React from 'react';
import { useLocation } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { cardBgUrl } from '../assets';

const QUOTE = '东风随春归,发我枝上花。';

export default function LockActivePage() {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const dialog = sp.get('dialog');
  const minutes = Number(sp.get('minutes') ?? '2');
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { bindTap, action, back } = useFanqieTodoGestures();
  const { t } = useI18n();
  const toast = () => showToast(t('toast.unavailable'));

  // 锁机开始时刻(仅在进入本页时确定一次)
  const startMsRef = React.useRef(TimeService.now());
  const startRealRef = React.useRef(TimeService.realNow());
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const elapsedSec = Math.floor((TimeService.realNow() - startRealRef.current) / 1000);
  const ended = elapsedSec >= minutes * 60;
  // 到达锁机时长 → 显示「锁机结束」并自动返回锁机页(栈:锁机→快速锁机弹窗→进行中)
  const endedRef = React.useRef(false);
  React.useEffect(() => {
    if (ended && !endedRef.current) {
      endedRef.current = true;
      const id = window.setTimeout(() => back(2), 1500);
      return () => window.clearTimeout(id);
    }
  }, [ended, back]);

  const pad = (n: number) => String(n).padStart(2, '0');
  const now = TimeService.getDate(); // 实时跳动的当前时间
  const hh = pad(now.getHours());
  const mm = pad(now.getMinutes());
  const ss = pad(now.getSeconds());
  const startD = TimeService.fromTimestamp(startMsRef.current);
  const endD = TimeService.fromTimestamp(startMsRef.current + minutes * 60000);
  const rangeText = `${pad(startD.getHours())}:${pad(startD.getMinutes())} - ${pad(endD.getHours())}:${pad(endD.getMinutes())}`;
  const bg = cardBgUrl('starlight');

  return (
    <div className="relative flex h-full flex-col items-center justify-center" data-status-bar-foreground="light"
      style={{ background: bg ? `center/cover url(${bg})` : '#8A6FB0' }}>
      <div className="absolute left-0 right-0 top-14 px-8 text-center text-white/90">
        <div className="text-[15px]">“{QUOTE}”</div>
      </div>
      {ended ? (
        <>
          <div className="text-4xl font-bold text-white">锁机结束</div>
          <div className="mt-3 text-sm text-white/80">即将返回锁机页</div>
        </>
      ) : (
        <>
          <div className="text-5xl font-bold text-white">{hh}:{mm}:{ss}</div>
          <div className="mt-2 text-sm text-white/80">{now.getFullYear()}-{String(now.getMonth() + 1).padStart(2, '0')}-{String(now.getDate()).padStart(2, '0')} 星期{'日一二三四五六'[now.getDay()]}</div>
          <div className="mt-6 text-center text-white/80">
            <div className="text-sm">本次锁机时间</div>
            <div className="text-sm">{rangeText}</div>
          </div>
        </>
      )}
      <div className="absolute bottom-10 flex w-full items-center justify-around px-16 text-white/85">
        <button {...action('lock.active.music.wontfixToast', toast)} aria-label="音乐">♪</button>
        <button {...bindTap('lock.active.exit.open')} aria-label="停止" className="text-2xl">■</button>
        <button {...action('lock.active.whitelist.wontfixToast', toast)} aria-label="白名单">APP</button>
      </div>

      {dialog === 'exit' && <ExitConfirm />}
    </div>
  );
}

function ExitConfirm() {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const store = useFanqieTodoStore();
  const monthly = useFanqieTodoStore((s) => s.stats.monthlyLockExit);
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-6 w-full max-w-[320px] rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-2 text-base font-semibold">{t('lock.exitConfirm')}</div>
        <div className="mb-4 text-sm leading-relaxed text-[#666]">注意,您本月已退出 {monthly} 次,还可退出 {Math.max(0, 3 - monthly)} 次,建议仅在必要情况下使用。中途退出的锁机将不会记入专注时长。</div>
        <div className="flex justify-end gap-6 text-sm">
          <button {...bindBack()} className="text-[#4A90D9]">取消</button>
          <button {...action('lock.exit.confirm.commit', () => { store.incMonthlyLockExit(); back(3); })} className="text-[#4A90D9]">确定</button>
        </div>
      </div>
    </div>
  );
}
