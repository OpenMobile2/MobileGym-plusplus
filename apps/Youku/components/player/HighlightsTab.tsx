import React from 'react';
import { useYoukuGestures } from '../../hooks/useYoukuGestures';
import { useI18n } from '../../i18n';
import { creatorById } from '../feedShared';
import { fmtDuration } from '../../utils/appTime';
import { highlightShorts } from './playerLib';
import Img from '../Img';

/**
 * 看点tab(player.main / player.series.main 共用,s239/s259):
 * 二创短视频双列(封面+时长+标题+作者,百万播放标签);点击跳竖屏 shorts feed 播放该条(拍板Q5)。
 * 绑定放在共享组件内:player.highlights.shorts.open 声明 from=/player,series 页按 spec 复用同一交互。
 */
export default function HighlightsTab({ contentId }: { contentId: string }) {
  const { bindTap } = useYoukuGestures();
  const { t } = useI18n();
  const items = highlightShorts(contentId);
  return (
    <div
      data-scroll-container="main"
      data-scroll-direction="vertical"
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 px-3 pb-6 pt-3">
        {items.map((sv) => (
          <div
            key={sv.id}
            {...bindTap('player.highlights.shorts.open', { params: { shortId: sv.id } })}
            className="cursor-pointer"
          >
            <div className="relative aspect-video overflow-hidden rounded-lg bg-[#1A1A1A]">
              <Img src={sv.cover} label={sv.title} ratio="landscape" className="h-full w-full object-cover" />
              <span className="absolute bottom-1 right-1.5 text-[12px] font-medium text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                {fmtDuration(sv.durationSec)}
              </span>
            </div>
            <div className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-white">{sv.title}</div>
            <div className="mt-1 flex items-center gap-1.5">
              {sv.likes >= 100000 && (
                <span className="shrink-0 text-[12px] text-[#FF6000]">{t('player.highlights.millionPlays')}</span>
              )}
              <span className="min-w-0 truncate text-[12px] text-[#999999]">
                {creatorById(sv.creatorId)?.name ?? ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
