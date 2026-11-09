import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, VipTag, EmptyState, TopBar, formatCount, wontfix } from '../components/ui';
import { IcNavBack, IcShare, IcHeadphones, IcCheck, IcRss } from '../res/icons';

const CONTENT_TABS: { key: string; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'recommend', label: '推荐' },
];
const SORTS: { key: string; label: string }[] = [
  { key: 'comprehensive', label: '综合' },
  { key: 'play', label: '播放最多' },
  { key: 'update', label: '最近更新' },
];

export function AnchorPage() {
  const { id } = useParams<{ id: string }>();
  const { bindTap, bindBack } = useXimalayaGestures();
  const s = useXimalayaStrings();

  const anchors = useXimalayaStore((st) => st.anchors);
  const albums = useXimalayaStore((st) => st.albums);
  const followedAnchorIds = useXimalayaStore((st) => st.followedAnchorIds);
  const toggleFollow = useXimalayaStore((st) => st.toggleFollow);

  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('comprehensive');

  const anchor = anchors.find((a) => a.id === id);

  if (!anchor) {
    return (
      <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
        <TopBar title="主播" />
        <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          <EmptyState text={s.empty_list} />
        </div>
      </div>
    );
  }

  const followed = followedAnchorIds.includes(anchor.id);

  let works = anchor.albumIds
    .map((aid) => albums.find((a) => a.id === aid))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));
  if (tab === 'recommend') works = works.filter((a) => a.recommendPct != null);
  if (sort === 'play') works = [...works].sort((a, b) => b.playCount - a.playCount);
  else if (sort === 'update') works = [...works].sort((a, b) => b.trackCount - a.trackCount);

  return (
    <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
      {/* 顶栏:返回/分享 */}
      <div className="shrink-0 h-11 flex items-center px-1 text-[#333]">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
          <IcNavBack size={26} />
        </button>
        <div className="flex-1 truncate text-[16px] font-medium px-1">{anchor.name}</div>
        <button onClick={wontfix} aria-label="分享" className="w-9 h-9 flex items-center justify-center">
          <IcShare size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 主播信息 */}
        <div className="px-4 py-4 flex items-center gap-3">
          <Img src={anchor.avatar} className="w-16 h-16 rounded-full object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-semibold text-[#333] truncate">{anchor.name}</div>
            <div className="text-[12px] text-[#999] mt-0.5 line-clamp-1">{anchor.desc}</div>
            <div className="text-[12px] text-[#999] mt-1 flex items-center gap-3">
              <span>{formatCount(anchor.fansCount)} 粉丝</span>
              <span>{anchor.albumCount} 专辑</span>
            </div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'anchor.follow.toggle' }, { onTrigger: () => toggleFollow(anchor.id) })}
            className={
              'h-8 px-4 rounded-full text-[13px] font-medium flex items-center gap-1 shrink-0 ' +
              (followed ? 'bg-[#F2F2F2] text-[#999]' : 'bg-[#FE4543] text-white')
            }
          >
            {followed ? <IcCheck size={14} /> : null}
            {followed ? s.followed : s.follow}
          </button>
        </div>

        {/* 全部/推荐 Tab */}
        <div className="flex items-center gap-6 px-4 h-11 border-b border-[#F2F2F2] text-[15px] text-[#666]">
          {CONTENT_TABS.map((t) => (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'anchor.tab.select.opt' }, { params: { tab: t.key }, onTrigger: () => setTab(t.key) })}
              className={tab === t.key ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] h-11' : ''}
            >{t.label}</button>
          ))}
        </div>

        {/* 综合/播放/更新 排序 */}
        <div className="flex items-center gap-4 px-4 h-10 text-[13px] text-[#666]">
          {SORTS.map((o) => (
            <button
              key={o.key}
              {...bindTap({ kind: 'action', id: 'anchor.sort.select.opt' }, { params: { sort: o.key }, onTrigger: () => setSort(o.key) })}
              className={sort === o.key ? 'text-[#FE4543] font-medium' : ''}
            >{o.label}</button>
          ))}
        </div>

        {/* 作品(专辑)列表 */}
        {works.length === 0 ? (
          <EmptyState text={s.empty_list} />
        ) : (
          <div className="flex flex-col">
            {works.map((a) => (
              <div
                key={a.id}
                {...bindTap('anchor.album-open', { params: { id: a.id } })}
                className="flex gap-3 px-4 py-2.5 active:bg-[#F7F7F7]"
              >
                <Img src={a.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-[14px] text-[#333] font-medium leading-snug line-clamp-2">{a.title}</div>
                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                    {a.isVip && <VipTag />}
                    {a.finished ? (
                      <span className="text-[11px] text-[#999]">完结</span>
                    ) : (
                      <span className="text-[11px] text-[#999]">连载</span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center gap-3 text-[11px] text-[#999]">
                    <span className="flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(a.playCount)}</span>
                    <span className="flex items-center gap-0.5"><IcRss size={11} />{a.trackCount}集</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
