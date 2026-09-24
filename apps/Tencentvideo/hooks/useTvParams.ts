// URL 查询参数读取。参数白名单由 assets/scaffold_l0.py 的 ROUTE_QUERY_PARAMS 生成到
// navigation.declaration.ts(routes[].queryParams + transitions[].searchParams),
// 这里只负责读取 —— 页面不再自己拼 URL。
import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useTencentvideoStore } from '../state';
import type { TvContent } from '../types';

export function useTvQuery(key: string): string | null {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search).get(key), [search, key]);
}

/**
 * 详情族页面的主角内容。缺省回退到首个匹配 kinds 的种子内容 ——
 * 直接敲 URL / 走查工具进页时也有东西可渲染,不会白屏。
 */
export function useTvContent(fallbackIdPrefix?: string): TvContent | undefined {
  const contentId = useTvQuery('contentId');
  const contents = useTencentvideoStore((s) => s.contents);
  return useMemo(() => {
    if (contentId) {
      const hit = contents.find((c) => c.id === contentId);
      if (hit) return hit;
    }
    if (fallbackIdPrefix) {
      const hit = contents.find((c) => c.id.startsWith(fallbackIdPrefix));
      if (hit) return hit;
    }
    return contents[0];
  }, [contentId, contents, fallbackIdPrefix]);
}
