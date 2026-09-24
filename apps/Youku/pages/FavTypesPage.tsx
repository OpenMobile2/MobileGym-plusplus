import React, { useState } from 'react';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { YOUKU_CONFIG } from '../data';
import { contentNavParams } from '../utils/openContent';
import HScroll from './home/HScroll';
import { IcBack, IcChevron, DRAMAS, catalogById, resolveContent, typeLabel } from './me/meShared';

type FavTypeId = 'chuanqi' | 'guou' | 'nvxing' | 'youqing' | 'guoman' | 'rexue';
const FT = YOUKU_CONFIG.favTypes as unknown as {
  tabs: Array<{ id: FavTypeId; name: string }>;
} & Record<string, unknown>;
const idsOf = (tabId: FavTypeId): string[] => (FT as unknown as Record<FavTypeId, string[]>)[tabId] ?? [];

/**
 * spec 节点 me.favtypes(route /me/favtypes)—— 常看类型页(s245 传奇 / s246 古偶)。
 * 六类型tab过滤双列海报网格;橙色榜单行 wontfix;海报卡按类型 4 分支分流。
 */
export default function FavTypesPage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const showToast = useYoukuStore((s) => s.showToast);
  const [tab, setTab] = useState<FavTypeId>('chuanqi');

  const tabBind = (id: FavTypeId) => {
    switch (id) {
      case 'chuanqi':
        return action('me.favtypes.tab.select.chuanqi', () => setTab('chuanqi'));
      case 'guou':
        return action('me.favtypes.tab.select.guou', () => setTab('guou'));
      case 'nvxing':
        return action('me.favtypes.tab.select.nvxing', () => setTab('nvxing'));
      case 'youqing':
        return action('me.favtypes.tab.select.youqing', () => setTab('youqing'));
      case 'guoman':
        return action('me.favtypes.tab.select.guoman', () => setTab('guoman'));
      default:
        return action('me.favtypes.tab.select.rexue', () => setTab('rexue'));
    }
  };

  /** 橙色榜单行文案(s245:No.x·XX热度榜 / 加追破N万) */
  const rankText = (id: string, idx: number): string => {
    const c = catalogById(id);
    if (idx % 2 === 1) return `加追破${(idx + 3) * 100}万`;
    const channel = c ? typeLabel(String(c.type)) : '电视剧';
    return `No.${idx + 1} · ${channel}热度榜`;
  };

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">常看类型</span>
        <span className="w-9" />
      </div>

      {/* 横向类型tab */}
      <HScroll id="favtypes-tabs" className="shrink-0 items-baseline gap-7 px-4 pb-2.5 pt-1">
        {FT.tabs.map((t) => (
          <button
            key={t.id}
            {...tabBind(t.id)}
            className={`shrink-0 cursor-pointer border-none bg-transparent p-0 ${
              tab === t.id ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[17px] text-[#8A8A8A]'
            }`}
          >
            {t.name}
          </button>
        ))}
      </HScroll>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 px-3 pt-2">
          {idsOf(tab).map((id, idx) => {
            const isDrama = DRAMAS.some((d) => d.id === id);
            const ctype = isDrama ? 'drama' : String(catalogById(id)?.type ?? 'series');
            const r = resolveContent(id, ctype);
            if (!r) return null;
            return (
              <div key={id}>
                <div
                  {...bindTap('me.favtypes.item.open', { params: contentNavParams({ id, type: ctype }) })}
                  className="cursor-pointer"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                    <Img src={r.poster} label={r.title} ratio="poster" className="h-full w-full object-cover" />
                    {r.badge && (
                      <span className="absolute right-1 top-1 rounded bg-black/50 px-1.5 py-0.5 text-[11px] leading-none text-white">
                        {r.badge}
                      </span>
                    )}
                    <span className="absolute bottom-0 inset-x-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-[11px] text-white">
                      <span>{r.typeText}</span>
                      {r.episodeCount != null && (
                        <span>
                          {r.updatedTo != null && r.updatedTo < r.episodeCount
                            ? `更新至${r.updatedTo}集`
                            : `${r.episodeCount}集全`}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 truncate text-[17px] font-medium text-(--app-c-text-primary)">{r.title}</div>
                  <div className="mt-0.5 truncate text-[13px] text-[#999999]">
                    {catalogById(id)?.recTitle ?? DRAMAS.find((d) => d.id === id)?.desc ?? ''}
                  </div>
                </div>
                <button
                  {...action('me.favtypes.rank.wontfixToast', () => showToast('该功能暂未开放'))}
                  className="mt-1 flex cursor-pointer items-center border-none bg-transparent p-0 text-[13px] font-medium text-[#FF6000]"
                >
                  {rankText(id, idx)}
                  <IcChevron size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
