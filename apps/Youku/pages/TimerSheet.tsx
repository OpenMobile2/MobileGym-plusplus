import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { TIMER_OPTIONS } from '../constants';
import { CATALOG } from '../components/feedShared';
import { catalogItem } from '../components/player/playerLib';
import Img from '../components/Img';

/**
 * spec 节点 player.timer.sheet(route /player/timer,preserve videoId/showId/ep)—— 定时关闭面板(s262)。
 * URL 驱动,关闭=bindBack;选中白底高亮并持久;选非『不启动』时播放页控制条显示定时轻状态
 * (不做真实倒计时关闭)。
 */
export default function TimerSheet() {
  const { action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const item = catalogItem(sp.get('videoId') ?? sp.get('showId')) ?? CATALOG[0];

  const timer = useYoukuStore((s) => s.playback.timer);
  const setTimer = useYoukuStore((s) => s.setTimer);
  const label = (opt: string) => (opt === 'off' ? t('timer.off') : opt === 'current' ? t('timer.current') : opt);

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 压暗背景(点击空白处关闭) */}
      <div {...bindBack<HTMLDivElement>()} className="relative min-h-0 flex-1 cursor-pointer">
        <div className="aspect-video w-full overflow-hidden">
          <Img src={item.still} label={item.title} ratio="landscape" className="h-full w-full object-cover opacity-40" />
        </div>
        <div className="px-3 pt-4 opacity-40">
          <div className="text-[22px] font-bold">{item.title}</div>
        </div>
      </div>

      {/* 面板 */}
      <div className="shrink-0 rounded-t-2xl bg-(--app-c-card-bg) pt-5">
        <div className="text-center text-[18px] font-bold">{t('timer.title')}</div>

        {/* 选项列表:不启动(默认) / 播完当前 / 30:00 / 60:00 */}
        <div className="mt-5 flex flex-col gap-2.5 px-4">
          {TIMER_OPTIONS.map((opt) => (
            <button
              key={opt}
              {...action('player.timer.select.option', () => setTimer(opt), { params: { value: opt } })}
              className={`h-13 cursor-pointer rounded-lg border-none text-[16px] ${
                timer === opt ? 'bg-white font-bold text-black' : 'bg-(--app-c-chip-bg) text-(--app-c-text-primary)'
              }`}
            >
              {label(opt)}
            </button>
          ))}
        </div>

        {/* 底部:取消 */}
        <button
          {...bindBack()}
          className="mt-5 flex h-13 w-full cursor-pointer items-center justify-center border-x-0 border-b-0 border-t border-solid border-[#242424] bg-transparent text-[16px] text-(--app-c-text-primary)"
        >
          {t('common.cancel')}
        </button>
      </div>
    </div>
  );
}
