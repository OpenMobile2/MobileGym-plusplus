// 搜索无结果空态。节点 search.empty(spec v1.0.0,5 条交互)。
// 视觉证据:f_032(搜索框里是乱码词「aizbs」+ 清除 × + 取消;正文区居中「暂无相关内容,换个搜索词试试」
// + 灰色小字「仍有问题,我要反馈 ›」;下方咏春木人桩水墨插画 + 「兵无常势,水无常形。」;
// 再下「更多精彩内容」三列宫格,卡片左上年份、右上角标、右下集数;不露种子片名)。
//
// spec note:空态词也写进历史(store.submitSearch 已经负责),空态本身是 result 的无命中形态。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { GridResultCard, SearchTopBar } from '../components/search';
import { IcArrowRight } from '../res/icons';

/** 结构性标签(spec 未给种子,证据 f_032 逐字抄录) */
const LABEL_FEEDBACK = '仍有问题,我要反馈';
const LABEL_MORE = '更多精彩内容';
/** 推荐宫格条数(证据 f_032:三列 × 三行以上,首屏露两行半) */
const RECOMMEND_COUNT = 9;

/**
 * 咏春木人桩水墨插画(证据 f_032 中部)。res/img 里没有空态插画资源,
 * 且 res/* 是只读共享文件 —— 用同构图的浅灰线稿内联 SVG 顶上,不引入新资源。
 */
function DummyIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="54" y="14" width="12" height="82" rx="6" fill={C.divider} />
      <rect x="28" y="34" width="30" height="9" rx="4.5" fill={C.divider} />
      <rect x="62" y="34" width="30" height="9" rx="4.5" fill={C.divider} />
      <rect x="54" y="56" width="26" height="8" rx="4" fill={C.divider} />
      <rect x="36" y="96" width="48" height="8" rx="4" fill={C.chipGray} />
      <circle cx="60" cy="14" r="9" fill={C.chipGray} />
    </svg>
  );
}

export default function SearchEmptyPage() {
  const { bindTap, bindBack, go, back } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const searchHub = useTencentvideoStore((s) => s.searchHub);
  const contents = useTencentvideoStore((s) => s.contents);
  const search = useTencentvideoStore((s) => s.search);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);

  const toast = useTencentvideoStore((s) => s.toast);
  const setSearchInput = useTencentvideoStore((s) => s.setSearchInput);
  const clearSearchInput = useTencentvideoStore((s) => s.clearSearchInput);

  /** 「更多精彩内容」= 内容库按实时热度取前 9(确定性排序,无随机) */
  const recommends = useMemo(
    () => [...contents].sort((a, b) => (b.heat ?? 0) - (a.heat ?? 0)).slice(0, RECOMMEND_COUNT),
    [contents],
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <SearchTopBar
        value={search.submitted ?? search.input}
        placeholder={searchHub.placeholder}
        onValueChange={(v) => {
          setSearchInput(v);
          // 再次输入即回到联想态(spec:type → search.suggest.open.fromEmpty)
          if (v.trim()) go('search.suggest.open.fromEmpty');
        }}
        clearBind={bindTap({ kind: 'action', id: 'search.hub.input.clear' }, {
          onTrigger: () => {
            clearSearchInput();
            back();
          },
        })}
        cancelBind={bindBack()}
        cancelLabel={s.searchCancel}
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="flex flex-col items-center pt-16">
          <div className="text-[15px] font-semibold" style={{ color: C.text }}>
            {searchHub.noResult.text}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'search.empty.feedback.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="mt-1.5 flex items-center gap-0.5 bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.textSub }}
          >
            {LABEL_FEEDBACK}
            <IcArrowRight size={12} />
          </button>
          <div className="pt-8">
            <DummyIllustration />
          </div>
          <div className="pt-2 text-[12px]" style={{ color: C.textTertiary }}>
            {searchHub.noResult.sub}
          </div>
        </div>

        <div className="px-3 pt-8 text-[16px] font-semibold" style={{ color: C.text }}>
          {LABEL_MORE}
        </div>
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-3 pt-2 pb-6">
          {recommends.map((c) => (
            <GridResultCard
              key={c.id}
              content={c}
              // 空搜推荐架只露海报/角标/集数,不露种子片名(评审:勿当伪主命中)
              showTitle={false}
              subtitle=""
              bind={bindTap('detail.series.open.fromSearchEmpty', {
                params: { contentId: c.id },
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
