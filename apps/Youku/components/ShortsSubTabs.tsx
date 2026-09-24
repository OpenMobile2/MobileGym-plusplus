import React from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { WONTFIX_TOAST } from '../constants';
import { useI18n } from '../i18n';
import { IcSearch } from './feedIcons';

/** 页面侧 bindTap 产出的绑定 props(transitionId 字面量保持在页面绑定处) */
export type TapBinding = React.HTMLAttributes<HTMLElement> & {
  'data-trigger'?: string;
  'data-trigger-type'?: string;
  'data-trigger-params'?: string;
};

/**
 * 短剧频道顶部子tab行:看过/短视频/短剧/AI短剧/剧场/福利 + 搜索图标(s185/s255)。
 * AI短剧/剧场/福利 同组 wontfix(shorts.subtab.wontfixToast,spec 拍板)。
 * 导航 transition 由页面以字面量 bindTap 后传入(checker 铁律)。
 */
export default function ShortsSubTabs({
  active,
  toWatched,
  toFeed,
  toDrama,
  search,
  overlay = false,
}: {
  active: 'watched' | 'feed' | 'drama';
  toWatched?: TapBinding;
  toFeed?: TapBinding;
  toDrama?: TapBinding;
  search: TapBinding;
  overlay?: boolean;
}) {
  const { action } = useYoukuGestures();
  const showToast = useYoukuStore((s) => s.showToast);
  const { t } = useI18n();

  // overlay=叠在视频上:白字+阴影;否则走外观 token
  const activeCls = overlay
    ? 'text-[19px] font-bold text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]'
    : 'text-[19px] font-bold text-(--app-c-text-primary)';
  const idleCls = overlay
    ? 'text-[16px] text-white/75 [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]'
    : 'text-[16px] text-(--app-c-text-muted)';
  const iconCls = overlay
    ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]'
    : 'text-(--app-c-text-primary)';

  const item = (label: string, isActive: boolean, bind?: TapBinding) => (
    <button
      {...(bind ?? {})}
      className={`shrink-0 cursor-pointer border-none bg-transparent p-0 ${isActive ? activeCls : idleCls}`}
    >
      {label}
    </button>
  );

  return (
    <div
      className={`flex h-11 shrink-0 items-center gap-4 px-3 ${
        overlay ? 'absolute inset-x-0 top-10 z-20 bg-transparent' : 'bg-(--app-c-page-bg)'
      }`}
    >
      {item(t('shorts.subtab.watched'), active === 'watched', active === 'watched' ? undefined : toWatched)}
      {item(t('shorts.subtab.feed'), active === 'feed', active === 'feed' ? undefined : toFeed)}
      {item(t('shorts.subtab.drama'), active === 'drama', active === 'drama' ? undefined : toDrama)}
      {[t('shorts.subtab.ai'), t('shorts.subtab.theater'), t('shorts.subtab.welfare')].map((label) => (
        <button
          key={label}
          {...action('shorts.subtab.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className={`shrink-0 cursor-pointer border-none bg-transparent p-0 ${idleCls}`}
        >
          {label}
        </button>
      ))}
      <div className="flex-1" />
      <button
        {...search}
        aria-label="搜索"
        className={`flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent ${iconCls}`}
      >
        <IcSearch size={20} />
      </button>
    </div>
  );
}
