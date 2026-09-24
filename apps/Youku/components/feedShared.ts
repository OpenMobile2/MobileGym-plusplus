import { useRef } from 'react';
import type React from 'react';
import { YOUKU_CONFIG } from '../data';
import type { CatalogItem, Creator, ShortDrama, ShortVideo } from '../types';

/**
 * 短剧/淘好片模块共享工具(页面代理新建子组件层,不动 state.ts/defaults.json)。
 * - 类型化只读配置访问器
 * - 计数格式化
 * - PointerEvent 滑动手势(feed 上下滑/轮播横滑,AGENTS:连续手势必须 PointerEvent)
 * - 跨路由易失性传递(解说定位 / 发布讨论草稿):声明层无对应 searchParams,
 *   属纯 UI 易失态,用模块级单例传递(刷新即失,符合「UI 状态不持久」合同)。
 */

export const CATALOG = YOUKU_CONFIG.catalog as unknown as CatalogItem[];
export const SHORTS = YOUKU_CONFIG.shorts as unknown as ShortVideo[];
export const DRAMAS = YOUKU_CONFIG.shortDramas as unknown as ShortDrama[];
export const CREATORS = YOUKU_CONFIG.creators as unknown as Creator[];

export interface UpcomingItem {
  id: string;
  title: string;
  type: string;
  poster: string;
  dateText: string;
  dayOffset: number;
  reserveCount: number;
  desc: string;
  region: string;
  genre: string;
}
export const UPCOMING = YOUKU_CONFIG.upcoming as unknown as UpcomingItem[];

export const catalogById = (id: string | null | undefined): CatalogItem | undefined =>
  id ? CATALOG.find((c) => c.id === id) : undefined;
export const creatorById = (id: string): Creator | undefined => CREATORS.find((c) => c.id === id);

/** 计数:>=1万 显示 x.x万 */
export function fmtCount(n: number): string {
  if (n >= 10000) {
    const v = (n / 10000).toFixed(1).replace(/\.0$/, '');
    return `${v}万`;
  }
  return String(n);
}

/** 内容类型中文标签(域数据为中文,不进 i18n) */
export function typeLabel(type: string): string {
  switch (type) {
    case 'movie': return '电影';
    case 'variety': return '综艺';
    case 'anime': return '动漫';
    case 'kids': return '少儿';
    case 'drama': return '短剧';
    default: return '电视剧';
  }
}

/** 热门解说 feed 条目(全部含关联影片,滔滔/闲鱼仔等解说号) */
export const JIESHUO_IDS: readonly string[] = [
  'sv10', 'sv01', 'sv04', 'sv13', 'sv03', 'sv02', 'sv09', 'sv12', 'sv08', 'sv07', 'sv05',
];

/** 淘好片『看解说』→ 解说 feed 定位(声明层该 transition 无 searchParams,用易失单例) */
export const jieshuoLocator: { contentId: string | null } = { contentId: null };

/** 解说讨论区发布草稿(讨论区底栏『标时间』与发布面板共享;发布后清空) */
export const taoDraft: { text: string; shortId: string | null } = { text: '', shortId: null };

type SwipeHandlers<T extends HTMLElement> = Pick<
  React.HTMLAttributes<T>,
  'onPointerDown' | 'onPointerUp' | 'onPointerCancel' | 'onClickCapture'
>;

/**
 * PointerEvent 滑动:超过阈值触发 onPrev/onNext,并吞掉随后的 click(避免误触 tap)。
 * axis 'v':上滑(负位移)=onNext,下滑=onPrev;axis 'h':左滑=onNext,右滑=onPrev。
 */
export function useSwipe<T extends HTMLElement>(
  axis: 'v' | 'h',
  onNext: () => void,
  onPrev: () => void,
  threshold = 48,
): SwipeHandlers<T> {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);
  return {
    onPointerDown: (e) => {
      startRef.current = { x: e.clientX, y: e.clientY };
      firedRef.current = false;
    },
    onPointerUp: (e) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const d = axis === 'v' ? e.clientY - start.y : e.clientX - start.x;
      if (Math.abs(d) >= threshold) {
        firedRef.current = true;
        if (d < 0) onNext();
        else onPrev();
      }
    },
    onPointerCancel: () => {
      startRef.current = null;
    },
    onClickCapture: (e) => {
      if (firedRef.current) {
        firedRef.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
