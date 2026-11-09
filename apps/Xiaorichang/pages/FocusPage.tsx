import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { colors, FOCUS_PRESET_COLORS } from '../res/colors';
import { IconRenderer, IcList, IcPlus, IcRight } from '../res/icons';
import { Sheet, Dialog } from '../components/Sheet';
import { Switch, SettingRow } from '../components/common';
import { FOCUS_MIN_MINUTES } from '../constants';

/**
 * 番茄专注(s169, R3)。
 * ⚠ 专注 <1 分钟直接取消不写记录(R3);
 *   专注完成**不自动打卡、不加光芒值**(Q8 裁定,以截图为准)。
 */
export default function FocusPage() {
  const [sp, setSp] = useSearchParams();
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const af = st._temp.activeFocus;
  const running = !!af;

  const [preset, setPreset] = useState<{ key: string; minutes: number; countUp: boolean }>({ key: 'min25', minutes: 25, countUp: false });
  const draft = (st._temp.draft ?? {}) as { focusTargetId?: string };
  const targetId = draft.focusTargetId ?? sp.get('habitId') ?? sp.get('targetId') ?? '';
  const target = st.habits.find((h) => h.id === targetId);
  const [, forceTick] = useState(0);
  const finished = useRef(false);

  // 运行中每秒刷新;倒计时归零 → 自动结算(focus.timer.finish)
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      forceTick((n) => n + 1);
      const cur = useXiaorichangStore.getState()._temp.activeFocus;
      if (cur && !cur.countUp && !finished.current) {
        const elapsed = (TimeService.now() - cur.startTs) / 60000;
        if (elapsed >= cur.targetMin) {
          finished.current = true;
          setSp((p) => { p.set('dialog', 'complete'); return p; });
        }
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [running, setSp]);

  const elapsedMs = af ? TimeService.now() - af.startTs : 0;
  const elapsedMin = Math.floor(elapsedMs / 60000);
  const remainMs = af && !af.countUp ? Math.max(0, af.targetMin * 60000 - elapsedMs) : elapsedMs;
  const mm = `${Math.floor(remainMs / 60000)}`.padStart(2, '0');
  const ss = `${Math.floor((remainMs % 60000) / 1000)}`.padStart(2, '0');

  const stopFocus = () => {
    if (elapsedMin >= FOCUS_MIN_MINUTES) {
      setSp((p) => { p.set('dialog', 'complete'); return p; });
    } else {
      st.stopFocus(false);
      st.showToast(s.focusTooShort);
    }
  };

  const PresetChip = ({ k, label, minutes, countUp, bind }: { k: string; label: string; minutes: number; countUp: boolean; bind: Record<string, any> }) => {
    void minutes; void countUp;
    const sel = preset.key === k;
    return (
      <button {...bind} disabled={running}
        className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold"
        style={{
          background: sel ? FOCUS_PRESET_COLORS.selected : FOCUS_PRESET_COLORS[k] ?? '#F2F3F5',
          color: sel ? '#fff' : '#424242',
          opacity: running ? 0.4 : 1,
        }}>
        {label}
      </button>
    );
  };

  const sheet = sp.get('sheet');
  const dialog = sp.get('dialog');

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-10">
        <div className="text-[15px] font-semibold text-[#424242]">{s.tabFocus}</div>
        <button {...bindTap('focus.records.open')} aria-label="专注记录"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F7]"><IcList size={17} /></button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-6 px-6">
        {/* 时长预设行(s169 配色) */}
        <div className="flex items-center gap-2.5">
          <PresetChip k="countUp" label={s.focusCountUp} minutes={0} countUp bind={action('focus.duration.select.countup', () => setPreset({ key: 'countUp', minutes: 0, countUp: true }))} />
          <PresetChip k="min25" label="25" minutes={25} countUp={false} bind={action('focus.duration.select.min25', () => setPreset({ key: 'min25', minutes: 25, countUp: false }))} />
          <PresetChip k="min45" label="45" minutes={45} countUp={false} bind={action('focus.duration.select.min45', () => setPreset({ key: 'min45', minutes: 45, countUp: false }))} />
          <PresetChip k="min60" label="60" minutes={60} countUp={false} bind={action('focus.duration.select.min60', () => setPreset({ key: 'min60', minutes: 60, countUp: false }))} />
          <PresetChip k="min90" label="90" minutes={90} countUp={false} bind={action('focus.duration.select.min90', () => setPreset({ key: 'min90', minutes: 90, countUp: false }))} />
          {st.settings.customDurations.map((m) => (
            <button key={m} disabled={running} onClick={() => setPreset({ key: `c${m}`, minutes: m, countUp: false })}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F3F5] text-sm font-semibold"
              style={preset.key === `c${m}` ? { background: FOCUS_PRESET_COLORS.selected, color: '#fff' } : undefined}>
              {m}
            </button>
          ))}
          <button {...bindTap('focus.duration.custom.open')} disabled={running}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[#F2F3F5] text-[#9AA5B1]"><IcPlus size={18} /></button>
        </div>

        {/* 计时盘 */}
        <div className="text-6xl font-bold tabular-nums text-[#212121]">
          {running ? `${mm}:${ss}` : preset.countUp ? '00:00' : `${`${preset.minutes}`.padStart(2, '0')}:00`}
        </div>
        {running && <div className="text-sm text-[#9AA5B1]">{s.focusElapsed} {elapsedMin} {s.minutesUnit}</div>}

        {/* 专注项目 */}
        <button {...bindTap('focus.target.open')}
          className="flex items-center gap-2 rounded-full bg-[#F5F6F7] px-4 py-2 text-sm text-[#424242]">
          {target ? (
            <><span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: target.color, color: '#fff' }}>
              <IconRenderer name={target.icon} size={13} /></span>{text(target.name)}</>
          ) : `⊞ ${s.focusPickTarget}`}
        </button>

        {/* 开始/结束 */}
        {!running ? (
          <button
            {...action('focus.timer.start', () => { finished.current = false; st.startFocus(preset.minutes, preset.countUp, target?.id); })}
            className="w-56 rounded-full py-3.5 text-[15px] font-bold text-white"
            style={{ background: colors.inkStrong }}>
            {s.focusStart}
          </button>
        ) : (
          <button
            {...action(elapsedMin >= FOCUS_MIN_MINUTES ? 'focus.timer.stop.commit' : 'focus.timer.stop.discard', stopFocus)}
            className="w-56 rounded-full py-3.5 text-[15px] font-bold text-white"
            style={{ background: colors.focusStop }}>
            {s.focusStop}
          </button>
        )}
        <button {...action('focus.liveactivity.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="text-xs text-[#C9CDD3]">{s.focusLiveActivity}</button>
      </div>

      {/* 底部工具条 */}
      <div className="flex shrink-0 items-center justify-around px-6 pb-24 pt-2 text-xs text-[#9AA5B1]">
        <button {...bindTap('focus.music.open')} className="flex flex-col items-center gap-1">♪<span>{s.focusToolMusic}</span></button>
        <button {...action('focus.keepAwake.toggle', () => st.updateSettings({ focusKeepAwake: !st.settings.focusKeepAwake }))}
          className="flex flex-col items-center gap-1" style={st.settings.focusKeepAwake ? { color: colors.vip } : undefined}>☀<span>{s.focusToolAwake}</span></button>
        <button {...action('focus.whitelist.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="flex flex-col items-center gap-1">▤<span>{s.focusToolWhitelist}</span></button>
        <button {...bindTap('focus.loop.open')} className="flex flex-col items-center gap-1">↻<span>{s.focusToolLoop}</span></button>
        <button {...action('focus.record.manualAdd', () => { st.addRecordManual(25, target?.id); st.showToast('已补记 25 分钟专注'); })}
          className="flex flex-col items-center gap-1">＋<span>{s.focusToolRecord}</span></button>
      </div>

      {sheet === 'music' && <MusicSheet />}
      {sheet === 'loop' && <LoopSheet />}
      {dialog === 'complete' && <CompleteDialog targetId={target?.id ?? ''} onDone={() => { finished.current = false; }} />}
    </div>
  );
}

/** 专注音乐(s170)。选中态可换,不实际播音(wontfix 已声明)。 */
function MusicSheet() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const [sel, setSel] = useState(st.settings.focusMusic);
  const musics = [
    { key: 'mute', label: s.focusMusicMute }, { key: 'tick', label: s.focusMusicTick },
    { key: 'meditate', label: s.focusMusicMeditate }, { key: 'forest', label: s.focusMusicForest },
    { key: 'rain', label: s.focusMusicRain }, { key: 'clock', label: s.focusMusicClock },
  ];
  const binds: Record<string, Record<string, any>> = {
    mute: action('focus.music.select.mute', () => setSel('mute')),
    tick: action('focus.music.select.tick', () => setSel('tick')),
    meditate: action('focus.music.select.meditate', () => setSel('meditate')),
    forest: action('focus.music.select.forest', () => setSel('forest')),
    rain: action('focus.music.select.rain', () => setSel('rain')),
    clock: action('focus.music.select.clock', () => setSel('clock')),
  };
  return (
    <Sheet title={s.focusMusic}>
      <div className="grid grid-cols-3 gap-3 px-5 py-4">
        {musics.map((m) => (
          <button key={m.key} {...binds[m.key]}
            className="rounded-2xl py-4 text-sm"
            style={sel === m.key ? { background: colors.brandSoft, color: '#5B4718', fontWeight: 600 } : { background: '#F5F6F7', color: '#424242' }}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="px-5">
        <button {...action('focus.music.commit', () => { st.updateSettings({ focusMusic: sel }); back(); })}
          className="w-full rounded-full py-3 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          {s.focusMusicConfirm}
        </button>
      </div>
    </Sheet>
  );
}

/** 循环设置(s207:开启自动循环) */
function LoopSheet() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <Sheet title={s.focusLoop}>
      <div className="px-5 py-3">
        <SettingRow label={s.focusAutoLoop} hint={s.focusLoopHint}>
          <Switch on={st.settings.focusAutoLoop}
            {...action('focus.loop.auto.toggle', () => st.updateSettings({ focusAutoLoop: !st.settings.focusAutoLoop }))} />
        </SettingRow>
        <button {...action('focus.loop.commit', () => back())}
          className="mt-4 w-full rounded-full py-3 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          {s.done}
        </button>
      </div>
    </Sheet>
  );
}

/** 专注完成结算(s203)。确定后仅写 focusRecords —— 不打卡、不加光芒值(Q8)。 */
function CompleteDialog({ targetId, onDone }: { targetId: string; onDone: () => void }) {
  const st = useXiaorichangStore();
  const { bindTap, action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const [note, setNote] = useState('');
  const af = st._temp.activeFocus;
  const minutes = af ? Math.max(FOCUS_MIN_MINUTES, Math.floor((TimeService.now() - af.startTs) / 60000)) : 0;
  const target = st.habits.find((h) => h.id === (af?.habitId ?? targetId));
  return (
    <Dialog>
      <div className="text-center text-base font-bold text-[#212121]">{s.focusDone}</div>
      <div className="mt-1 text-center text-3xl font-bold text-[#424242]">{minutes} {s.minutesUnit}</div>
      {target && (
        <button {...bindTap('focus.complete.target.open', { params: { habitId: target.id } })}
          className="mt-3 flex w-full items-center justify-between rounded-xl bg-[#F5F6F7] px-3 py-2.5 text-sm text-[#424242]">
          <span className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg" style={{ background: target.color, color: '#fff' }}>
              <IconRenderer name={target.icon} size={13} />
            </span>
            {text(target.name)}
          </span>
          <IcRight size={15} className="text-[#C9CDD3]" />
        </button>
      )}
      <textarea
        {...action('focus.complete.note.input', () => {}, { params: { value: note } })}
        value={note} onChange={(e) => setNote(e.target.value)} placeholder={s.noteWriteSomething}
        className="mt-3 h-16 w-full resize-none rounded-xl bg-[#F5F6F7] p-3 text-sm outline-none" />
      <button
        {...action('focus.complete.commit', () => { st.stopFocus(true, note || undefined); onDone(); back(); })}
        className="mt-3 w-full rounded-full py-3 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
        ✓ {s.confirm}
      </button>
    </Dialog>
  );
}
