import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { SPEED_OPTIONS } from '../constants';
import { CATALOG } from '../components/feedShared';
import { catalogItem } from '../components/player/playerLib';
import Img from '../components/Img';
import { IcChevronRight } from '../components/player/playerIcons';

/**
 * spec 节点 player.speed.sheet(route /player/speed,preserve videoId/showId/ep)—— 倍速设置面板(s261)。
 * URL 驱动,关闭=bindBack;选中白底高亮并持久(写 store,播放页控制条显示当前倍速)。
 * 自定义>:滑条连续调节 0.5X~4.0X,确认后作为当前倍速持久(qa:Q3 推断A)。
 */
export default function SpeedSheet() {
  const { action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const item = catalogItem(sp.get('videoId') ?? sp.get('showId')) ?? CATALOG[0];

  const speed = useYoukuStore((s) => s.playback.speed);
  const setSpeed = useYoukuStore((s) => s.setSpeed);

  const isCustom = !(SPEED_OPTIONS as readonly string[]).includes(speed);
  const [customOpen, setCustomOpen] = useState(isCustom);
  const [customVal, setCustomVal] = useState<number>(() => (isCustom ? parseFloat(speed) || 1.7 : 1.7));
  const customText = `${customVal.toFixed(1)}X`;

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
        <div className="text-center text-[18px] font-bold">{t('speed.title')}</div>

        {/* 倍速宫格:4.0X~0.75X + 自定义> */}
        <div className="mt-5 grid grid-cols-4 gap-2.5 px-4">
          {SPEED_OPTIONS.map((opt) => (
            <button
              key={opt}
              {...action('player.speed.select.option', () => setSpeed(opt), { params: { value: opt } })}
              className={`h-14 cursor-pointer rounded-lg border-none text-[17px] ${
                speed === opt ? 'bg-white font-bold text-black' : 'bg-(--app-c-chip-bg) text-(--app-c-text-primary)'
              }`}
            >
              {opt}
            </button>
          ))}
          <button
            {...action('player.speed.custom.adjust', () => setCustomOpen((v) => !v))}
            className={`flex h-14 cursor-pointer items-center justify-center rounded-lg border-none text-[16px] ${
              isCustom ? 'bg-white font-bold text-black' : 'bg-(--app-c-chip-bg) text-(--app-c-text-primary)'
            }`}
          >
            {isCustom ? speed : t('speed.custom')}
            <IcChevronRight size={15} className={isCustom ? 'text-[#666666]' : 'text-[#999999]'} />
          </button>
        </div>

        {/* 自定义滑条(0.5X~4.0X 连续) + 确定 */}
        {customOpen && (
          <div className="mx-4 mt-3 flex items-center gap-3 rounded-lg bg-(--app-c-chip-bg) px-3.5 py-3">
            <span className="w-11 shrink-0 text-[15px] font-bold text-[#0C7BFF]">{customText}</span>
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.1}
              value={customVal}
              onChange={(e) => setCustomVal(Number(e.target.value))}
              className="min-w-0 flex-1 accent-[#0C7BFF]"
            />
            <button
              {...action('player.speed.custom.adjust', () => setSpeed(customText), { params: { value: customText } })}
              className="shrink-0 cursor-pointer rounded-full border-none bg-[#0C7BFF] px-4 py-1.5 text-[13px] text-(--app-c-text-primary)"
            >
              {t('speed.confirm')}
            </button>
          </div>
        )}

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
