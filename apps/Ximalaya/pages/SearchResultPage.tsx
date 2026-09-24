import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, VipTag, formatCount, formatDuration, wontfix } from '../components/ui';
import { SEARCH_RESULT_TABS } from '../constants';
import { IcNavBack, IcSearch, IcFilter, IcPlay, IcHeadphones, IcRss, IcClose } from '../res/icons';
import { matchAlbumByKeyword, matchAnchorByKeyword, matchTrackByKeyword, sortAlbumsByRelevance } from '../utils/search';

const SORTS = ['综合', '播放最多', '最近更新'] as const;
const PAY_OPTIONS = ['不限', '付费', '免费', '会员'] as const;
// 虚拟广播(非 store 数据,合成内容)
const BROADCAST = [
  { id: 'fm1', name: '经典音乐调频', freq: 'FM 96.8', desc: '正在直播 · 午间轻音乐' },
  { id: 'fm2', name: '城市交通之声', freq: 'FM 103.9', desc: '正在直播 · 路况播报' },
  { id: 'fm3', name: '故事广播剧场', freq: 'FM 88.7', desc: '正在直播 · 长篇连播' },
];

export function SearchResultPage() {
  const { bindTap, bindBack } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const [sp] = useSearchParams();
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const anchors = useXimalayaStore((st) => st.anchors);
  const searchHistory = useXimalayaStore((st) => st.searchHistory);
  const followedAnchorIds = useXimalayaStore((st) => st.followedAnchorIds);
  const toggleFollow = useXimalayaStore((st) => st.toggleFollow);
  const playTrack = useXimalayaStore((st) => st.playTrack);

  const keyword = sp.get('q') || searchHistory[0] || '相声';
  const kw = keyword.trim();

  const [tab, setTab] = useState<string>('精选');
  const [sort, setSort] = useState<string>('综合');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pay, setPay] = useState<string>('不限');
  const [appliedPay, setAppliedPay] = useState<string>('不限');

  // —— 使用统一搜索工具(支持拼音首字母 + 多关键词) ——
  const matchedAlbums = kw ? albums.filter((a) => matchAlbumByKeyword(a, kw)) : [...albums];
  const matchedTracks = kw ? tracks.filter((t) => matchTrackByKeyword(t, albums, kw)) : [...tracks];
  const matchedAnchors = kw ? anchors.filter((an) => matchAnchorByKeyword(an, kw)) : [...anchors];

  // —— 专辑结果(付费筛选 + 排序) ——
  const albumResults = matchedAlbums
    .filter((a) => (appliedPay === '不限' ? true : appliedPay === '免费' ? !a.isVip : a.isVip))
    .sort((a, b) => {
      if (sort === '播放最多') return b.playCount - a.playCount;
      if (sort === '最近更新') return b.trackCount - a.trackCount;
      // 综合:按相关度排序
      if (!kw) return 0;
      return sortAlbumsByRelevance([a, b], kw).indexOf(a) === 0 ? -1 : 1;
    });
  // 综合排序时直接用相关度排好的列表
  const albumResultsFinal = sort === '综合' && kw
    ? sortAlbumsByRelevance(matchedAlbums.filter((a) => (appliedPay === '不限' ? true : appliedPay === '免费' ? !a.isVip : a.isVip)), kw)
    : albumResults;

  const soundResults = matchedTracks
    .filter((t) => (appliedPay === '不限' ? true : appliedPay === '免费' ? t.free : !t.free))
    .sort((a, b) => {
      if (sort === '播放最多') return b.playCount - a.playCount;
      if (sort === '最近更新') return b.updatedAt - a.updatedAt;
      return 0;
    });

  const anchorResults = matchedAnchors;
  const albumById = (id: string) => albums.find((a) => a.id === id);

  // Tab 结果计数
  const tabCounts: Record<string, number> = {
    '精选': albumResultsFinal.length,
    '声音': soundResults.length,
    '主播': anchorResults.length,
    '广播': BROADCAST.length,
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      {/* 顶栏:返回 + 搜索框(带关键词) */}
      <div className="shrink-0 flex items-center gap-2 px-2 h-12 bg-white">
        <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center text-[#333]">
          <IcNavBack size={26} />
        </button>
        <div {...bindTap('home.search-open')} className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5">
          <IcSearch size={16} className="text-[#999]" />
          <span className="flex-1 text-[13px] text-[#333] truncate">{keyword}</span>
        </div>
        <button {...bindTap('search.submit', { params: { q: keyword } })} className="shrink-0 text-[14px] text-[#FE4543] px-2">{s.search}</button>
      </div>

      {/* 结果类型 Tab(带计数) */}
      <div className="shrink-0 flex items-center gap-5 px-3 bg-white border-b border-[#F2F2F2] overflow-x-auto" data-scroll-container data-scroll-direction="horizontal">
        {SEARCH_RESULT_TABS.map((t) => {
          const on = t === tab;
          const isBroadcast = t === '广播';
          const count = tabCounts[t] ?? 0;
          return (
            <button
              key={t}
              {...(isBroadcast
                ? bindTap({ kind: 'action', id: 'result.broadcast.select.opt' }, { onTrigger: () => setTab(t) })
                : bindTap({ kind: 'action', id: 'result.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTab(t) }))}
              className={'shrink-0 py-2.5 text-[14px] flex items-center gap-1 ' + (on ? 'text-[#FE4543] font-semibold border-b-2 border-[#FE4543]' : 'text-[#666]')}
            >
              {t}
              {count > 0 && <span className={'text-[11px] ' + (on ? 'text-[#FE4543]' : 'text-[#BBB]')}>{count}</span>}
            </button>
          );
        })}
      </div>

      {/* 排序 + 筛选(广播 Tab 不显示) */}
      {tab !== '广播' && (
        <div className="shrink-0 flex items-center justify-between px-3 py-2 bg-white border-b border-[#F2F2F2]">
          <div className="flex items-center gap-4">
            {SORTS.map((so) => (
              <button
                key={so}
                {...bindTap({ kind: 'action', id: 'result.sort.select.opt' }, { params: { sort: so }, onTrigger: () => setSort(so) })}
                className={'text-[13px] ' + (sort === so ? 'text-[#FE4543] font-medium' : 'text-[#666]')}
              >
                {so}
              </button>
            ))}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'result.filter.open' }, { onTrigger: () => { setPay(appliedPay); setFilterOpen(true); } })}
            className="flex items-center gap-1 text-[13px] text-[#666]"
          >
            <IcFilter size={15} /> 筛选
          </button>
        </div>
      )}

      {/* 结果内容 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {tab === '广播' ? (
          <div className="px-3 py-2">
            {BROADCAST.map((b) => (
              <div key={b.id} className="flex items-center gap-3 bg-white rounded-xl p-3 mb-2.5">
                <div className="w-12 h-12 rounded-lg bg-[#FFF0EF] flex items-center justify-center text-[#FE4543] shrink-0"><IcRss size={22} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#333] font-medium truncate">{b.name} · {b.freq}</div>
                  <div className="text-[12px] text-[#999] truncate">{b.desc}</div>
                </div>
                <button onClick={wontfix} aria-label="收听广播" className="shrink-0 w-9 h-9 rounded-full bg-[#FE4543] flex items-center justify-center text-white"><IcPlay size={18} /></button>
              </div>
            ))}
          </div>
        ) : tab === '声音' ? (
          <div className="px-3 py-2">
            {soundResults.length === 0 && (
              <div className="py-20 text-center text-[14px] text-[#999]">没有找到与「{keyword}」相关的声音</div>
            )}
            {soundResults.slice(0, 50).map((t) => {
              const al = albumById(t.albumId);
              return (
                <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl p-2.5 mb-2">
                  <Img src={al?.cover ?? ''} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium truncate">{t.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#999]">
                      {!t.free && <VipTag />}
                      <span className="truncate">{al?.title}</span>
                      <span>{formatDuration(t.durationSec)}</span>
                    </div>
                  </div>
                  <button
                    {...bindTap('result.play', { beforeTrigger: () => playTrack(t.albumId, t.id) })}
                    aria-label="播放" className="shrink-0 w-9 h-9 rounded-full bg-[#FE4543] flex items-center justify-center text-white"
                  >
                    <IcPlay size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : tab === '主播' ? (
          <div className="px-3 py-2">
            {anchorResults.length === 0 && (
              <div className="py-20 text-center text-[14px] text-[#999]">没有找到与「{keyword}」相关的主播</div>
            )}
            {anchorResults.map((an) => {
              const followed = followedAnchorIds.includes(an.id);
              return (
                <div key={an.id} className="flex items-center gap-3 bg-white rounded-xl p-2.5 mb-2">
                  <div {...bindTap('result.anchor-open', { params: { id: an.id } })} className="shrink-0">
                    <Img src={an.avatar} className="w-12 h-12 rounded-full object-cover" />
                  </div>
                  <div {...bindTap('result.anchor-open', { params: { id: an.id } })} className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#333] font-medium truncate">{an.name}</div>
                    <div className="text-[11px] text-[#999] truncate">{formatCount(an.fansCount)} 粉丝 · {an.albumCount} 专辑</div>
                  </div>
                  <button
                    {...bindTap({ kind: 'action', id: 'result.follow.toggle' }, { params: { anchorId: an.id }, onTrigger: () => toggleFollow(an.id) })}
                    className={'shrink-0 text-[13px] rounded-full px-3.5 py-1.5 ' + (followed ? 'bg-[#F0F0F0] text-[#999]' : 'bg-[#FE4543] text-white')}
                  >
                    {followed ? s.followed : s.follow}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          /* 精选 / 专辑 */
          <div className="px-3 py-2">
            {albumResultsFinal.length === 0 && (
              <div className="py-20 text-center text-[14px] text-[#999]">没有找到与「{keyword}」相关的专辑</div>
            )}
            {albumResultsFinal.map((a) => (
              <div key={a.id} className="bg-white rounded-xl p-2.5 mb-2 flex gap-3">
                <div {...bindTap('result.album-open', { params: { id: a.id } })} className="shrink-0">
                  <Img src={a.cover} className="w-20 h-20 rounded-lg object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div {...bindTap('result.album-open', { params: { id: a.id } })} className="text-[14px] text-[#333] font-medium leading-snug line-clamp-2">{a.title}</div>
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {a.isVip && <VipTag />}
                    {a.finished && <span className="text-[11px] text-[#999]">完结</span>}
                    <span className="text-[11px] text-[#999]">{a.trackCount}集</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-[#999]">
                      <IcHeadphones size={11} />{formatCount(a.playCount)} · {a.anchorName}
                    </span>
                    <button
                      {...bindTap('result.play', { beforeTrigger: () => playTrack(a.id, a.trackIds[0]) })}
                      className="flex items-center gap-1 text-[12px] text-[#FE4543] border border-[#FE4543] rounded-full px-2.5 py-1"
                    >
                      <IcPlay size={13} /> {s.play_all}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 筛选抽屉(本地态:URL 无对应 panel 声明) */}
      {filterOpen && (
        <div className="absolute inset-0 z-40" onClick={() => setFilterOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[15px] font-semibold text-[#333]">筛选</span>
              <button onClick={() => setFilterOpen(false)} className="text-[#999]"><IcClose size={18} /></button>
            </div>
            <div className="text-[13px] text-[#999] mb-2">是否付费</div>
            <div className="grid grid-cols-2 gap-2">
              {PAY_OPTIONS.map((p) => (
                <button
                  key={p}
                  onClick={() => setPay(p)}
                  className={'py-2 rounded-lg text-[13px] ' + (pay === p ? 'bg-[#FFF0EF] text-[#FE4543] border border-[#FE4543]' : 'bg-[#F5F5F5] text-[#666]')}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="mt-auto flex gap-2 pt-4">
              <button onClick={() => setPay('不限')} className="flex-1 py-2.5 rounded-full bg-[#F0F0F0] text-[14px] text-[#666]">{s.reset}</button>
              <button
                {...bindTap({ kind: 'action', id: 'result.filter.apply' }, { onTrigger: () => { setAppliedPay(pay); setFilterOpen(false); } })}
                className="flex-1 py-2.5 rounded-full bg-[#FE4543] text-[14px] text-white"
              >
                {s.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
