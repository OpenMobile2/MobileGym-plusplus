import React from 'react';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { NEUTRAL, GREEN } from '../res/colors';
import { IcBack, IcClose } from '../res/icons';
import type { Bind } from '../types';

/**
 * 二级页白色头部（IMG_2417）：左侧圆形浅灰底返回键、居中粗体标题、右侧操作区。
 * 关闭型页面（建立频道、首选项等）左侧是 ✕。
 */
export const PageHeader: React.FC<{
  title: string;
  close?: boolean;
  right?: React.ReactNode;
}> = ({ title, close = false, right }) => {
  const { bindBack } = useSlackGestures();
  return (
    <div className="flex flex-shrink-0 items-center gap-2 bg-white px-4 pb-2 pt-11">
      <button
        {...bindBack()}
        aria-label={close ? 'close' : 'back'}
        className="flex h-9 w-9 items-center justify-center rounded-full border-none bg-[#F3F3F3]"
        style={{ color: NEUTRAL.textPrimary }}
      >
        {close ? <IcClose size={19} /> : <IcBack size={21} />}
      </button>
      <h1
        className="flex-1 truncate text-center text-[17px] font-bold"
        style={{ color: NEUTRAL.textPrimary }}
      >
        {title}
      </h1>
      <div className="flex min-w-9 items-center justify-end gap-1">{right}</div>
    </div>
  );
};

/** 页内分段 tab（留待以后处理 / 草稿和已发送）：选中项加粗 + 绿色下划线 */
export const SegmentTabs: React.FC<{
  items: Array<{ key: string; label: string; count?: number; bind: Bind }>;
  active: string;
}> = ({ items, active }) => (
  <div className="flex flex-shrink-0 border-b border-[#EAEAEA] bg-white">
    {items.map((it) => {
      const on = it.key === active;
      return (
        <button
          key={it.key}
          {...it.bind}
          className="flex-1 border-none bg-transparent pb-2.5 pt-1.5"
          style={{
            color: on ? NEUTRAL.textPrimary : NEUTRAL.textSecondary,
            boxShadow: on ? `inset 0 -3px 0 0 ${GREEN.primary}` : 'none',
          }}
        >
          <span className={`text-[15px] ${on ? 'font-bold' : ''}`}>
            {it.label}
            {it.count ? <span className="ml-1 font-normal">{it.count}</span> : null}
          </span>
        </button>
      );
    })}
  </div>
);

export default PageHeader;
