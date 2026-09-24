import React, { useEffect, useRef, useState } from 'react';
import { useYoukuGestures } from '../../hooks/useYoukuGestures';
import { useYoukuStore } from '../../state';
import { useI18n } from '../../i18n';
import { WONTFIX_TOAST } from '../../constants';
import { fmtDuration } from '../../utils/appTime';
import { danmakuSeeds } from './playerLib';
import Img from '../Img';
import {
  IcCast, IcTogether, IcHeadphones, IcMore, IcPlay, IcPause, IcPip, IcFullscreen, IcClose, IcTimer,
} from './playerIcons';
import type { CatalogItem } from '../../types';

/**
 * 顶部播放器区(player.main / player.series.main / episodes.sheet 共用):
 * 静态剧照 + 播放/暂停 + 可拖假进度条(PointerEvent,进度实时写历史)+ 滚动弹幕层
 * + 弹幕开关/发弹幕条 + VIP 蒙层 + 流量提示条。
 * 共享 actionId(player.playback.toggle 等)按 spec 在两播放页复用,绑定在本组件内字面量落地;
 * 页面差异的 transition(蒙层→vip / 右上更多→分享)由页面以字面量绑好后经 props 传入。
 */
export default function VideoPlayer({
  item,
  contentKey,
  historyId,
  ctype,
  episode,
  locked,
  progress,
  setProgress,
  maskBind,
  moreBind,
}: {
  item: CatalogItem;
  /** 弹幕/评论 key:电影=videoId;剧集=`${showId}:${ep}` */
  contentKey: string;
  historyId: string;
  ctype: string;
  episode?: number;
  /** VIP 内容且未开通 → 会员蒙层 + 停止走秒 */
  locked: boolean;
  progress: number;
  setProgress: React.Dispatch<React.SetStateAction<number>>;
  /** 『开通会员看完整视频』蒙层跳会员页的 bindTap 产物(选集面板无声明入边则不传=纯展示) */
  maskBind?: React.HTMLAttributes<HTMLElement>;
  /** 右上『更多』(仅电影页声明 player.more.share.open) */
  moreBind?: React.HTMLAttributes<HTMLElement>;
}) {
  const { action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const dur = item.durationSec;

  const playback = useYoukuStore((s) => s.playback);
  const toggleDanmaku = useYoukuStore((s) => s.toggleDanmaku);
  const dismissDataTip = useYoukuStore((s) => s.dismissDataTip);
  const sendDanmaku = useYoukuStore((s) => s.sendDanmaku);
  const writeProgress = useYoukuStore((s) => s.writeProgress);
  const showToast = useYoukuStore((s) => s.showToast);
  const mine = useYoukuStore((s) => s.userDanmakuByKey[contentKey]);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState('');

  // 播放走秒(假进度;VIP 蒙层/暂停时停;StrictMode 双 effect 由 cleanup 保证幂等)
  useEffect(() => {
    if (paused || locked) return undefined;
    const timer = window.setInterval(() => {
      setProgress((p) => (p + 1 >= dur ? dur : p + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [paused, locked, dur, setProgress]);

  // 观看进度实时写历史(拍板Q2;upsert 幂等,切集/拖动/走秒统一走这里)
  useEffect(() => {
    writeProgress({ id: historyId, ctype, episode, progressSec: progress, durationSec: dur });
  }, [historyId, ctype, episode, progress, dur, writeProgress]);

  // 假进度条拖动(AGENTS:连续手势必须 PointerEvent + setPointerCapture)
  const barRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const seekTo = (clientX: number) => {
    const r = barRef.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const pct = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setProgress(Math.round(pct * dur));
  };

  const seeds = danmakuSeeds(contentKey);
  const danmakuAll = [...seeds, ...(mine ?? [])];
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    sendDanmaku(contentKey, text);
    setDraft('');
  };

  return (
    <div className="shrink-0 select-none">
      <style>{`
        @keyframes ykDanmu { from { transform: translateX(0); } to { transform: translateX(calc(-420px - 100%)); } }
        @keyframes ykBar { from { transform: scaleY(0.35); } to { transform: scaleY(1); } }
      `}</style>
      {/* 16:9 静态剧照 + 全部悬浮控件 */}
      <div className="relative aspect-video w-full overflow-hidden bg-[#111111]">
        <div
          {...action('player.playback.toggle', () => setPaused((p) => !p))}
          className="absolute inset-0 cursor-pointer"
        >
          <Img src={item.still} label={item.title} ratio="landscape" className="h-full w-full object-cover" />
        </div>

        {/* 滚动弹幕层(开关可关;发一条滚动上屏,我的带描边) */}
        {playback.danmakuOn && !locked && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[86px] overflow-hidden">
            {danmakuAll.map((text, i) => (
              <span
                key={`${i}-${text}`}
                className={`absolute left-full whitespace-nowrap text-[13px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)] ${
                  i >= seeds.length ? 'rounded-full border border-[#0C7BFF] px-1.5' : ''
                }`}
                style={{
                  top: `${(i % 3) * 26 + 6}px`,
                  animation: `ykDanmu ${9 + (i % 4)}s linear infinite`,
                  animationDelay: i >= seeds.length ? '0s' : `-${(i * 2.3) % 9}s`,
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              >
                {text}
              </span>
            ))}
          </div>
        )}

        {/* 顶部:返回 + 投屏/一起看/耳机(wontfix 同组)+ 更多(电影页=分享面板) */}
        <div className="absolute inset-x-0 top-0 flex items-center bg-gradient-to-b from-black/60 to-transparent px-2 pb-3 pt-1">
          <button
            {...bindBack()}
            aria-label={t('common.back')}
            className="flex h-8 w-8 cursor-pointer items-center justify-center border-none bg-transparent text-[22px] leading-none text-white"
          >
            ‹
          </button>
          <div className="ml-auto flex items-center gap-4 pr-1 text-white">
            <button {...action('player.deviceIcons.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-white">
              <IcCast size={18} />
            </button>
            <button {...action('player.deviceIcons.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-white">
              <IcTogether size={18} />
            </button>
            <button {...action('player.deviceIcons.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-white">
              <IcHeadphones size={18} />
            </button>
            {moreBind ? (
              <button {...moreBind} className="cursor-pointer border-none bg-transparent p-0 text-white">
                <IcMore size={18} />
              </button>
            ) : (
              <button {...action('player.deviceIcons.wontfixToast', wontfix)} className="cursor-pointer border-none bg-transparent p-0 text-white">
                <IcMore size={18} />
              </button>
            )}
          </div>
        </div>

        {/* 流量提示条(× 后本会话不再出现) */}
        {!playback.dataTipDismissed && (
          <div className="absolute left-1/2 top-11 flex w-[92%] -translate-x-1/2 items-center gap-2 rounded-lg bg-[#2B2B2B]/95 px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-[13px] text-white">{t('player.dataTip.text')}</span>
            <button
              {...action('player.freeData.wontfixToast', wontfix)}
              className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[13px] text-[#0C7BFF]"
            >
              {t('player.dataTip.free')}
            </button>
            <button
              {...action('player.dataTip.dismiss', dismissDataTip)}
              aria-label="close"
              className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#CCCCCC]"
            >
              <IcClose size={15} />
            </button>
          </div>
        )}

        {/* 会员蒙层(VIP 内容且未开通;假开通后消失) */}
        {locked &&
          (maskBind ? (
            <button
              {...maskBind}
              className="absolute bottom-12 left-3 cursor-pointer rounded-full border-none bg-black/65 px-4 py-2 text-[14px] font-medium text-[#F4DFAC]"
            >
              {t('player.mask.vip')}
            </button>
          ) : (
            <div className="absolute bottom-12 left-3 rounded-full bg-black/65 px-4 py-2 text-[14px] font-medium text-[#F4DFAC]">
              {t('player.mask.vip')}
            </div>
          ))}

        {/* 暂停大按钮 */}
        {paused && !locked && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <IcPlay size={44} className="fill-white/85 text-white/85" />
          </div>
        )}

        {/* 底部控制条:播放/暂停 + 时间 + 可拖进度条 + 倍速/定时轻状态 + 小窗/全屏(wontfix) */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-4">
          <button
            {...action('player.playback.toggle', () => setPaused((p) => !p))}
            aria-label={paused ? 'play' : 'pause'}
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-white"
          >
            {paused ? <IcPlay size={18} className="fill-white" /> : <IcPause size={18} className="fill-white" />}
          </button>
          <span className="shrink-0 text-[11px] tabular-nums text-white">{fmtDuration(progress)}</span>
          <div
            ref={barRef}
            data-action="player.progress.seek"
            data-action-type="drag"
            className="flex h-6 min-w-0 flex-1 cursor-pointer touch-none items-center"
            onPointerDown={(e) => {
              dragging.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
              seekTo(e.clientX);
            }}
            onPointerMove={(e) => {
              if (dragging.current) seekTo(e.clientX);
            }}
            onPointerUp={() => {
              dragging.current = false;
            }}
            onPointerCancel={() => {
              dragging.current = false;
            }}
          >
            <div className="relative h-[3px] w-full rounded-full bg-white/25">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-white"
                style={{ width: `${dur > 0 ? (progress / dur) * 100 : 0}%` }}
              />
              <div
                className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ left: `${dur > 0 ? (progress / dur) * 100 : 0}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-[11px] tabular-nums text-white">{fmtDuration(dur)}</span>
          {playback.speed !== '1.0X' && (
            <span className="shrink-0 text-[11px] font-medium text-[#3D8BFF]">{playback.speed}</span>
          )}
          {playback.timer !== 'off' && <IcTimer size={13} className="shrink-0 text-[#3D8BFF]" />}
          <button {...action('player.screenMode.wontfixToast', wontfix)} className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-white">
            <IcPip size={15} />
          </button>
          <button {...action('player.screenMode.wontfixToast', wontfix)} className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-white">
            <IcFullscreen size={15} />
          </button>
        </div>
      </div>

      {/* 弹幕开关 + 发弹幕输入条(qa:Q16;发送后滚动上屏 拍板Q4) */}
      <div className="flex items-center gap-2 border-b border-[#1A1A1A] px-3 py-1.5">
        <button
          {...action('player.danmaku.toggle', toggleDanmaku)}
          className={`flex h-6 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[12px] font-bold ${
            playback.danmakuOn
              ? 'border-[#0C7BFF] bg-[#0C7BFF]/15 text-[#0C7BFF]'
              : 'border-[#3A3A3A] bg-transparent text-[#666666] line-through'
          }`}
        >
          弹
        </button>
        <input
          data-action="player.danmaku.send"
          data-action-type="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') send();
          }}
          placeholder={t('player.danmaku.placeholder')}
          className="h-7 min-w-0 flex-1 rounded-full border-none bg-[#1F1F1F] px-3 text-[12px] text-white outline-none placeholder:text-[#666666]"
        />
        <button
          onClick={send}
          className={`shrink-0 cursor-pointer rounded-full border-none px-3 py-1 text-[12px] ${
            draft.trim() ? 'bg-[#0C7BFF] text-white' : 'bg-transparent text-[#666666]'
          }`}
        >
          {t('player.danmaku.send')}
        </button>
      </div>
    </div>
  );
}

/** 播放中集数指示(选集chips/系列卡:三根跳动竖条) */
export function PlayingBars({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex h-3 items-end gap-[2px] ${className}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom rounded-sm bg-[#0C7BFF]"
          style={{ height: '100%', animation: `ykBar 0.9s ease-in-out ${i * 0.18}s infinite alternate` }}
        />
      ))}
    </span>
  );
}
