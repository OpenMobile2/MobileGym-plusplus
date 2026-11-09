import React from 'react';
import { useLocation } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { cardBgUrl } from '../assets';
import { IcPause, IcReset, IcStop, IcBrightness, IcMusic, IcPlay } from '../res/icons';

const QUOTE = '当你努力奔跑的时候,全世界都会给你让路。';

function fmt(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function FocusPage() {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const dialog = sp.get('dialog');
  const todoId = sp.get('todoId') ?? '';
  const todos = useFanqieTodoStore((s) => s.todos);
  const activeFocus = useFanqieTodoStore((s) => s._temp.activeFocus);
  // 打开暂停/停止弹窗时 URL 会丢 todoId,退回 activeFocus 记录的会话,避免误跳到第一条待办。
  const effTodoId = todoId || activeFocus?.todoId || '';
  const todo = todos.find((x) => x.id === effTodoId) ?? todos[0];
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const finishFocus = useFanqieTodoStore((s) => s.finishFocus);
  const { bindTap, action, go } = useFanqieTodoGestures();
  const { t } = useI18n();
  const toast = () => showToast(t('toast.unavailable'));

  // 会话开始:记录 startTs(模拟时间)
  React.useEffect(() => {
    if (todo) {
      useFanqieTodoStore.setState((s) =>
        s._temp.activeFocus?.todoId === todo.id
          ? {}
          : { _temp: { ...s._temp, activeFocus: { todoId: todo.id, startTs: TimeService.now() } } },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todo?.id]);

  const isCountdown = todo?.timing === 'countdown';
  const total = (todo?.durationMin ?? 25) * 60;
  const [, setTick] = React.useState(0);
  const startRef = React.useRef(TimeService.realNow());
  // 暂停:累计暂停时长,计时冻结。
  const accumPausedRef = React.useRef(0);
  const pauseStartRef = React.useRef<number | null>(null);
  const paused = dialog === 'pause';
  React.useEffect(() => {
    if (paused) {
      if (pauseStartRef.current === null) pauseStartRef.current = TimeService.realNow();
    } else if (pauseStartRef.current !== null) {
      accumPausedRef.current += TimeService.realNow() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    setTick((v) => v + 1);
  }, [paused]);
  React.useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const effNow = paused && pauseStartRef.current !== null ? pauseStartRef.current : TimeService.realNow();
  const elapsed = Math.floor((effNow - startRef.current - accumPausedRef.current) / 1000);
  const display = isCountdown ? total - elapsed : elapsed;
  const bg = cardBgUrl(todo?.bgKey ?? 'snow');
  const elapsedMin = Math.max(1, Math.round(elapsed / 60));

  // 倒计时归零 → 自动结束并进入休息(popTo '/' 收起本次专注会话,休息页返回直达待办)
  const autoFiredRef = React.useRef(false);
  React.useEffect(() => {
    if (isCountdown && !paused && !dialog && display <= 0 && !autoFiredRef.current && todo) {
      autoFiredRef.current = true;
      finishFocus(todo.id, todo.durationMin || elapsedMin);
      go('focus.stop.finish', {}, { popTo: '/' });
    }
  });

  return (
    <div className="relative flex h-full flex-col items-center" data-status-bar-foreground="light"
      style={{ background: bg ? `center/cover url(${bg})` : '#5B79A8' }}>
      <div className="mt-16 w-full px-8 text-white/90">
        <div className="text-3xl">“</div>
        <div className="-mt-2 text-[17px] leading-relaxed">{QUOTE}</div>
      </div>
      <div className="mt-10 flex flex-col items-center">
        {isCountdown ? (
          <div className="flex h-64 w-64 items-center justify-center rounded-full border-2 border-white/80">
            <span className="text-5xl font-bold text-white">{fmt(display)}</span>
          </div>
        ) : (
          <span className="text-6xl font-bold text-white">{fmt(display)}</span>
        )}
        <div className="mt-6 text-lg text-white/90">{todo?.name}</div>
        <div className="mt-1 text-sm text-white/70">{t('focus.doing')}</div>
      </div>
      <div className="mt-auto flex w-full items-center justify-around px-10 pb-8 text-white/85">
        <button {...action('focus.brightness.toggle', () => showToast('屏幕常亮'))} aria-label="亮度"><IcBrightness size={24} /></button>
        <button {...action('focus.music.wontfixToast', toast)} aria-label="音乐"><IcMusic size={24} /></button>
        <button {...bindTap('focus.pause.open')} aria-label="暂停"><IcPause size={30} /></button>
        <button {...action('focus.reset.wontfixToast', toast)} aria-label="重置"><IcReset size={24} /></button>
        <button {...bindTap('focus.stop.open')} aria-label="停止"><IcStop size={26} /></button>
      </div>

      {dialog === 'pause' && <PauseDialog />}
      {dialog === 'stop' && <StopDialog todoId={todo?.id ?? todoId} isCountdown={isCountdown} elapsedMin={elapsedMin} />}
    </div>
  );
}

function PauseDialog() {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-[280px] rounded-3xl bg-white p-6 text-center shadow-xl">
        <div className="text-3xl font-bold text-[#222]">{t('focus.paused')}</div>
        <button {...action('focus.resume.action', () => back())}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#EAF2FB] py-3 text-[#4A90D9]">
          <IcPlay size={18} />{t('focus.resume')}
        </button>
      </div>
    </div>
  );
}

function StopDialog({ todoId, isCountdown, elapsedMin }: { todoId: string; isCountdown: boolean; elapsedMin: number }) {
  const { bindTap, bindBack, action, back } = useFanqieTodoGestures();
  const store = useFanqieTodoStore();
  const { t } = useI18n();
  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-6">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-3 w-full max-w-[340px] overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="px-4 py-3 text-sm text-[#8A8F99]">{t('focus.chooseAction')}</div>
        <button {...action('focus.abandon.action', () => { useFanqieTodoStore.setState((s) => ({ _temp: { ...s._temp, activeFocus: null } })); back(2); })}
          className="block w-full border-t border-[#F0F0F0] px-4 py-3.5 text-left text-[#B8BCC4]">{t('focus.abandon')}</button>
        <button {...bindTap('focus.stop.finish', { beforeTrigger: () => store.finishFocus(todoId, elapsedMin), nav: { popTo: '/' } })}
          className="block w-full border-t border-[#F0F0F0] px-4 py-3.5 text-left font-medium text-[#222]">
          {isCountdown ? '提前完成计时' : '结束本次正向计时'}
        </button>
        <button {...bindBack()} className="block w-full border-t border-[#F0F0F0] px-4 py-3.5 text-left font-medium text-[#222]">{t('focus.cancel')}</button>
      </div>
    </div>
  );
}
