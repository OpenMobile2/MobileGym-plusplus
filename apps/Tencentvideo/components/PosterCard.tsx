// apps/Tencentvideo/components/PosterCard.tsx —— 竖版海报卡(双列/横滑楼层/宫格通用)。
// 角标(VIP/独播/上新/4K|60帧)自动按 content.badge 推断;绑定 props 由页面传入(字面量绑定)。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { TvContent } from '../types';
import { TvImg } from './Img';
import { Badge, BindProps } from './ui';

export interface PosterCardProps {
  content: TvContent;
  /** 覆写角标文案(缺省用 content.badge) */
  badge?: string;
  /** 底部副标题(如「更新至28集」「9.2分」;缺省自动:updatedTo/rating) */
  subtitle?: React.ReactNode;
  /** 图右下角遮罩文案(热度/集数) */
  cornerNote?: string;
  /** 尺寸:sm 三列宫格 / md 双列 / lg 大卡 */
  size?: 'sm' | 'md' | 'lg';
  dark?: boolean;
  /** 页面绑定的 transition/action props(spread 到最外层 button,硬规则8:不再覆写 onClick) */
  bind?: BindProps;
  /** 标题下方追加行(如「追」按钮行),由页面传入并自带绑定 */
  footer?: React.ReactNode;
  className?: string;
}

function autoSubtitle(content: TvContent): React.ReactNode {
  if (content.updatedTo && content.episodes && content.updatedTo < content.episodes) {
    return `更新至${content.updatedTo}集`;
  }
  if (content.episodes && content.episodes > 1) return `全${content.episodes}集`;
  if (typeof content.rating === 'number' && Number.isFinite(content.rating)) {
    return <span style={{ color: C.badgeOrange }}>{content.rating.toFixed(1)}分</span>;
  }
  return null;
}

export function PosterCard({
  content,
  badge,
  subtitle,
  cornerNote,
  size = 'md',
  dark = false,
  bind,
  footer,
  className,
}: PosterCardProps) {
  const badgeText = badge ?? content.badge ?? '';
  const sub = subtitle === undefined ? autoSubtitle(content) : subtitle;
  const titleSize = size === 'sm' ? 'text-[12px]' : size === 'lg' ? 'text-[15px]' : 'text-[13px]';
  // 外层用 div(非 button):footer 内可放「追」等子按钮,避免 button 嵌套非法 DOM
  return (
    <div
      className={`flex flex-col items-stretch text-left cursor-pointer ${className ?? ''}`}
      {...(bind ?? {})}
    >
      <div className="relative rounded-lg overflow-hidden aspect-[3/4] w-full">
        <TvImg id={content.poster} alt={content.title} className="w-full h-full object-cover" />
        {badgeText && (
          <div className="absolute top-0 right-0">
            <Badge text={badgeText} className="rounded-none rounded-bl-[6px] rounded-tr-[8px]" />
          </div>
        )}
        {cornerNote && (
          <div
            className="absolute bottom-0 inset-x-0 px-1.5 pb-1 pt-3 text-right text-[10px] text-white"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
          >
            {cornerNote}
          </div>
        )}
      </div>
      <div
        className={`mt-1.5 font-medium truncate ${titleSize}`}
        style={{ color: dark ? C.darkText : C.text }}
      >
        {content.title}
      </div>
      {sub && (
        <div
          className="text-[11px] truncate mt-0.5"
          style={{ color: dark ? C.darkTextSub : C.textSub }}
        >
          {sub}
        </div>
      )}
      {footer}
    </div>
  );
}
