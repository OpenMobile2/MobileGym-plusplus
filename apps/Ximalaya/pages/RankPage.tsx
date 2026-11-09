import React, { useState, useMemo } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, TopBar, VipTag, formatCount } from '../components/ui';
import { IcHeadphones } from '../res/icons';
import type { Album } from '../types';

const RANK_TABS = [
  { label: '新品榜', key: 'new' },
  { label: '热播榜', key: 'hot' },
  { label: '免费榜', key: 'free' },
  { label: '口碑榜', key: 'kb' },
  { label: '荣耀榜', key: 'ry' },
] as const;

export function RankPage() {
  const { bindTap } = useXimalayaGestures();
  const albums = useXimalayaStore((st) => st.albums);
  const ranks = useXimalayaStore((st) => st.ranks);
  const [tab, setTab] = useState<string>('hot');
  const [cat, setCat] = useState<string>('全部');

  const cats = useMemo(() => ['全部', ...Array.from(new Set(albums.map((a) => a.category)))], [albums]);

  // 依据榜单 key 生成有序专辑列表
  const ordered: Album[] = useMemo(() => {
    const byId = (id: string) => albums.find((a) => a.id === id);
    if (ranks[tab]) {
      return [...ranks[tab]]
        .sort((a, b) => a.rank - b.rank)
        .map((e) => byId(e.albumId))
        .filter((a): a is Album => Boolean(a));
    }
    const copy = [...albums];
    if (tab === 'kb') return copy.sort((a, b) => (b.recommendPct ?? 0) - (a.recommendPct ?? 0));
    if (tab === 'ry') return copy.sort((a, b) => b.monthlyTicket - a.monthlyTicket);
    return copy.sort((a, b) => b.playCount - a.playCount);
  }, [tab, ranks, albums]);

  const list = cat === '全部' ? ordered : ordered.filter((a) => a.category === cat);

  const badgeColor = (i: number) =>
    i === 0 ? 'bg-[#FE4543]' : i === 1 ? 'bg-[#FF8C42]' : i === 2 ? 'bg-[#FFB84D]' : 'bg-transparent text-[#BBB]';

  return (
    <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
      <TopBar title="排行榜" />

      {/* 榜单 Tab */}
      <div className="shrink-0 flex items-center gap-4 px-3 overflow-x-auto border-b border-[#F2F2F2]" data-scroll-container data-scroll-direction="horizontal">
        {RANK_TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'rank.tab.select.opt' }, { params: { tab: t.key }, onTrigger: () => setTab(t.key) })}
              className={'shrink-0 py-2.5 text-[14px] ' + (on ? 'text-[#FE4543] font-semibold border-b-2 border-[#FE4543]' : 'text-[#666]')}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex min-h-0">
        {/* 左品类栏 */}
        <div className="w-20 shrink-0 bg-[#F5F5F5] overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          {cats.map((c) => {
            const on = c === cat;
            return (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'rank.category.select.opt' }, { params: { cat: c }, onTrigger: () => setCat(c) })}
                className={'w-full px-2 py-3 text-[13px] ' + (on ? 'bg-white text-[#FE4543] font-medium' : 'text-[#666]')}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* 排名列表 */}
        <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          {list.length === 0 ? (
            <div className="text-[13px] text-[#BBB] text-center py-10">该品类下暂无榜单内容</div>
          ) : (
            list.map((a, i) => (
              <div key={a.id} {...bindTap('rank.album-open', { params: { id: a.id } })} className="flex items-center gap-3 px-3 py-2.5 border-b border-[#F7F7F7]">
                <div className={'w-6 text-center shrink-0 text-[15px] font-bold rounded ' + (i < 3 ? 'text-white ' + badgeColor(i) : badgeColor(i))}>
                  {i + 1}
                </div>
                <Img src={a.cover} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-[14px] text-[#333] font-medium truncate">{a.title}</div>
                  <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                    {a.isVip && <VipTag />}
                    {a.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[11px] text-[#999]">{t}</span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between text-[11px] text-[#999]">
                    <span className="truncate">{a.anchorName}</span>
                    <span className="flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(a.playCount)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
