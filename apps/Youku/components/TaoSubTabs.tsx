import React from 'react';
import { useI18n } from '../i18n';
import { IcSearch } from './feedIcons';
import type { TapBinding } from './ShortsSubTabs';

/**
 * 淘好片顶部子tab行:全球新热/热门解说/新片预告 + 搜索图标(s189/s190/s196)。
 * 导航 transition 由页面以字面量 bindTap 后传入(checker 铁律)。
 */
export default function TaoSubTabs({
  active,
  toHot,
  toJieshuo,
  toUpcoming,
  search,
  overlay = false,
}: {
  active: 'hot' | 'jieshuo' | 'upcoming';
  toHot?: TapBinding;
  toJieshuo?: TapBinding;
  toUpcoming?: TapBinding;
  search: TapBinding;
  overlay?: boolean;
}) {
  const { t } = useI18n();
  const item = (label: string, isActive: boolean, bind?: TapBinding) => (
    <button
      {...(bind ?? {})}
      className={`shrink-0 cursor-pointer border-none bg-transparent p-0 ${
        isActive ? 'text-[19px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-(--app-c-text-muted)'
      }`}
    >
      {label}
    </button>
  );
  return (
    <div
      className={`flex h-11 shrink-0 items-center gap-5 px-3 ${
        overlay ? 'absolute inset-x-0 top-10 z-20 bg-transparent' : 'bg-(--app-c-page-bg)'
      }`}
    >
      {item(t('tao.subtab.hot'), active === 'hot', active === 'hot' ? undefined : toHot)}
      {item(t('tao.subtab.jieshuo'), active === 'jieshuo', active === 'jieshuo' ? undefined : toJieshuo)}
      {item(t('tao.subtab.upcoming'), active === 'upcoming', active === 'upcoming' ? undefined : toUpcoming)}
      <div className="flex-1" />
      <button
        {...search}
        aria-label="搜索"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-(--app-c-text-primary)"
      >
        <IcSearch size={20} />
      </button>
    </div>
  );
}
