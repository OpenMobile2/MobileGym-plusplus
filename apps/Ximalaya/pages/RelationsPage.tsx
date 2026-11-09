import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { TopBar, Img, formatCount } from '../components/ui';

type Tab = 'fans' | 'follows';

interface RelUser {
  uid: string;
  name: string;
  desc: string;
  fans: number;
}

const FANS: RelUser[] = [
  { uid: 'f1', name: '声声慢_k7', desc: '爱听有声书的打工人', fans: 128 },
  { uid: 'f2', name: '夜航星', desc: '睡前必听一段评书', fans: 356 },
  { uid: 'f3', name: '山间清听', desc: '通勤路上的忠实听友', fans: 42 },
  { uid: 'f4', name: '一枕黄粱', desc: '相声爱好者,笑点很低', fans: 981 },
  { uid: 'f5', name: '半盏茶凉', desc: '播客重度用户', fans: 67 },
];

export function RelationsPage() {
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const [sp] = useSearchParams();
  const anchors = useXimalayaStore((st) => st.anchors);
  const followedAnchorIds = useXimalayaStore((st) => st.followedAnchorIds);
  const toggleFollow = useXimalayaStore((st) => st.toggleFollow);

  const urlTab: Tab = sp.get('tab') === 'follows' ? 'follows' : 'fans';
  const [tab, setTab] = useState<Tab>(urlTab);

  // 关注 Tab:已关注主播在前,推荐关注(未关注)在后
  const followedAnchors = anchors.filter((a) => followedAnchorIds.includes(a.id));
  const recommendAnchors = anchors.filter((a) => !followedAnchorIds.includes(a.id)).slice(0, 10);

  const TABS: { key: Tab; label: string }[] = [
    { key: 'fans', label: '粉丝' },
    { key: 'follows', label: '关注' },
  ];

  const renderAnchor = (an: typeof anchors[0], followed: boolean) => (
    <div key={an.id} className="px-4 py-3 flex items-center gap-3 border-b border-[#F5F5F5]">
      <Img src={an.avatar} className="w-12 h-12 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] text-[#333] truncate">{an.name}</div>
        <div className="text-[12px] text-[#999] truncate mt-0.5">{an.desc}</div>
        <div className="text-[11px] text-[#BBB] mt-0.5">{formatCount(an.fansCount)} 粉丝 · {an.albumCount} 专辑</div>
      </div>
      <button
        {...bindTap({ kind: 'action', id: 'relations.follow.toggle' }, { params: { uid: an.id }, stopPropagation: true, onTrigger: () => toggleFollow(an.id) })}
        className={
          'shrink-0 h-8 px-4 rounded-full text-[13px] ' +
          (followed ? 'bg-[#F2F2F2] text-[#999]' : 'bg-[#FE4543] text-white')
        }
      >
        {followed ? s.followed : s.follow}
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
      <TopBar title={tab === 'follows' ? '关注' : '粉丝'} />

      {/* 粉丝 / 关注 双 Tab */}
      <div className="shrink-0 flex items-center gap-8 px-4 h-11 border-b border-[#F2F2F2] text-[15px]">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <button
              key={t.key}
              {...bindTap({ kind: 'action', id: 'relations.tab.select.opt' }, { params: { tab: t.key }, onTrigger: () => setTab(t.key) })}
              className={active ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] h-11' : 'text-[#999] h-11'}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {tab === 'fans' ? (
          FANS.map((u, i) => (
            <div key={u.uid} className="px-4 py-3 flex items-center gap-3 border-b border-[#F5F5F5]">
              <Img src={anchors[i % anchors.length]?.avatar || ''} className="w-12 h-12 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-[#333] truncate">{u.name}</div>
                <div className="text-[12px] text-[#999] truncate mt-0.5">{u.desc}</div>
                <div className="text-[11px] text-[#BBB] mt-0.5">{formatCount(u.fans)} 粉丝</div>
              </div>
              <button className="shrink-0 h-8 px-4 rounded-full text-[13px] bg-[#F2F2F2] text-[#999]">回粉</button>
            </div>
          ))
        ) : (
          <>
            {followedAnchors.length === 0 && recommendAnchors.length === 0 && (
              <div className="py-20 text-center text-[14px] text-[#999]">还没有关注的主播</div>
            )}
            {followedAnchors.map((an) => renderAnchor(an, true))}
            {recommendAnchors.length > 0 && followedAnchors.length > 0 && (
              <div className="px-4 pt-4 pb-2 text-[12px] text-[#BBB]">推荐关注</div>
            )}
            {recommendAnchors.map((an) => renderAnchor(an, false))}
          </>
        )}
      </div>
    </div>
  );
}
