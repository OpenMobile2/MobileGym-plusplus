// apps/Tencentvideo/components/RankRow.tsx —— 榜单行(榜单页/搜索榜卡/频道子榜通用)。
// 前三名序号橙红,其余灰;右侧动作(「追」/热度)由页面传入并自带绑定。
import React from 'react';
import { TV_COLORS as C } from '../constants';
import type { TvContent } from '../types';
import { TvImg } from './Img';
import { Badge, BindProps } from './ui';

export interface RankRowProps {
  rank: number;
  content: TvContent;
  /** 副标题(缺省 = tags 拼接) */
  subtitle?: React.ReactNode;
  /** 右侧热度红字/注记(如「25452」「黑马」) */
  note?: React.ReactNode;
  /** 行尾插槽(「追」按钮等,页面自带绑定) */
  trailing?: React.ReactNode;
  dark?: boolean;
  /** 整行绑定 props(页面字面量绑定;硬规则8:内部不覆写 onClick) */
  bind?: BindProps;
  className?: string;
}

export function RankRow({
  rank,
  content,
  subtitle,
  note,
  trailing,
  dark = false,
  bind,
  className,
}: RankRowProps) {
  const sub = subtitle ?? [content.category, ...(content.tags ?? [])].filter(Boolean).slice(0, 3).join(' · ');
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${className ?? ''}`}
      {...(bind ?? {})}
    >
      <div
        className="w-5 shrink-0 text-center text-[15px] font-bold italic"
        style={{ color: rank <= 3 ? C.badgeOrange : dark ? C.darkTextSub : C.textTertiary }}
      >
        {rank}
      </div>
      <div className="relative w-[52px] h-[70px] rounded-md overflow-hidden shrink-0">
        <TvImg id={content.poster} alt={content.title} className="w-full h-full object-cover" />
        {content.badge && (
          <div className="absolute top-0 right-0">
            <Badge text={content.badge} className="rounded-none rounded-bl-[6px]" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[14px] font-medium truncate"
          style={{ color: dark ? C.darkText : C.text }}
        >
          {content.title}
        </div>
        <div
          className="text-[11px] truncate mt-1"
          style={{ color: dark ? C.darkTextSub : C.textSub }}
        >
          {sub}
        </div>
        {note && (
          <div className="text-[11px] mt-1" style={{ color: C.redDot }}>
            {note}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
