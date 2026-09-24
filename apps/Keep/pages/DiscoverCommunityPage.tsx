import React, { useState } from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import { IcSearch, IcClose } from '../res/icons';
import type { KeepPost } from '../types';

/** 发现·社区瀑布流 —— 证据 s096/s097 */
export default function DiscoverCommunityPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const posts = useKeepStore((st) => st.posts);
  const feedCommunity = useKeepStore((st) => st.feedCommunity);
  const medals = useKeepStore((st) => st.medals);
  const closedCards = useKeepStore((st) => st.closedCards) ?? [];
  const closePromoCard = useKeepStore((st) => st.closePromoCard);
  const refreshCommunityFeed = useKeepStore((st) => st.refreshCommunityFeed);
  const [refreshing, setRefreshing] = useState(false);

  const feedPosts = feedCommunity
    .map((id) => posts.find((p) => p.id === id))
    .filter((p): p is KeepPost => Boolean(p));
  const promoClosed = closedCards.includes('community_promo');

  /** 活动卡副标题(奖牌活动帖:参赛人数/价格来自 medals 种子) */
  const medalOf = (post: KeepPost) =>
    medals.find((m) => post.images[0] === m.cover);

  return (
    <div className="flex flex-col h-full relative" style={{ background: '#F5F6F8' }} data-status-bar-foreground="dark">
      {/* 顶部搜索条(装饰) */}
      <div className="flex items-center gap-3 px-4 pt-1 pb-2 bg-app-surface shrink-0">
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-full" style={{ background: '#F2F3F6' }}>
          <IcSearch size={16} className="text-app-text-muted" />
          <span className="text-[13px] text-app-text-muted">减脂</span>
        </div>
      </div>
      {/* 频道 tab：社区选中 */}
      <div className="flex items-center gap-5 px-4 py-2 bg-app-surface shrink-0 overflow-x-auto">
        <button {...bindTap('discover.follow.open.fromCommunity')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverFollow}</button>
        <span className="text-[17px] font-bold text-app-text border-b-2 pb-0.5 shrink-0" style={{ borderColor: C.green }}>{s.discoverCommunity}</span>
        <button {...bindTap('medal.home.open.fromCommunity')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverMedal}</button>
        <button {...bindTap('race.home.open.fromCommunity')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverRace}</button>
        <button {...bindTap('mall.home.open.fromCommunity')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverMall}</button>
        <button {...bindTap('discover.new.open.fromCommunity')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverNew}</button>
        <button {...bindTap('discover.more.open.fromCommunity')} className="bg-transparent border-none p-0 text-[16px] text-app-text-muted shrink-0">{s.discoverMore}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 下拉刷新(简化为可点提示条) */}
        <button
          {...bindTap(
            { kind: 'action', id: 'discover.community.refresh' },
            {
              onTrigger: () => {
                setRefreshing(true);
                setTimeout(() => { refreshCommunityFeed(); setRefreshing(false); }, 500);
              },
            },
          )}
          className="w-full bg-transparent border-none py-1 text-[11px] text-app-text-muted"
        >
          {refreshing ? s.loading : '↓ 下拉刷新'}
        </button>

        {/* 深紫 promo 横幅(可关) */}
        {!promoClosed && (
          <div className="relative rounded-2xl overflow-hidden mx-1 mb-2" style={{ background: 'linear-gradient(160deg, #3A2D5C 0%, #241A3E 100%)' }}>
            <button
              {...bindTap({ kind: 'action', id: 'discover.community.promo.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
              className="w-full bg-transparent border-none text-left px-4 pt-4 pb-4"
            >
              <div className="text-white text-[18px] font-bold">多维专业数据分析</div>
              <div className="flex gap-2 mt-3">
                {[
                  { t: '跑步效率', v: '提升', c: '#33D6A1' },
                  { t: '肌肉能力', v: '良好', c: '#33D6A1' },
                  { t: '体重趋势', v: '平台期预警', c: '#FF7B7B' },
                ].map((x) => (
                  <div key={x.t} className="flex-1 rounded-xl px-2.5 py-3" style={{ background: 'rgba(255,255,255,.08)' }}>
                    <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.75)' }}>{x.t}</div>
                    <div className="text-[15px] font-bold mt-1" style={{ color: x.c }}>{x.v}</div>
                  </div>
                ))}
              </div>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'discover.community.promo.close' }, { onTrigger: () => closePromoCard('community_promo') })}
              className="absolute right-2 top-2 bg-transparent border-none p-1"
              style={{ color: 'rgba(255,255,255,.7)' }}
              aria-label="关闭"
            >
              <IcClose size={18} />
            </button>
          </div>
        )}

        {/* 双列瀑布流 */}
        <div className="columns-2 gap-2 px-1 pb-6">
          {feedPosts.map((post) => {
            const isActivity = post.authorId === 'coach_keepjun';
            const medal = medalOf(post);
            return isActivity ? (
              /* 活动/奖牌卡 → wontfix */
              <button
                key={post.id}
                {...bindTap(
                  { kind: 'action', id: 'discover.community.activitycard.wontfix' },
                  { params: { postId: post.id }, onTrigger: () => toast(s.notOpen) },
                )}
                className="w-full mb-2 bg-app-surface rounded-xl overflow-hidden border-none p-0 text-left break-inside-avoid"
              >
                {post.images[0] && <Img id={post.images[0]} className="w-full h-44 object-cover" alt={post.content.slice(0, 6)} />}
                <div className="px-2.5 py-2">
                  <div className="text-[14px] text-app-text leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </div>
                  {medal && (
                    <div className="mt-1.5 text-[11px] text-app-text-muted">{medal.participants.replace('已报名', '参赛')}{medal.price != null ? ` · ¥${medal.price}` : ''}</div>
                  )}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Img id={post.avatar} className="w-4 h-4 rounded-full object-cover" alt={post.author} />
                    <span className="text-[11px] text-app-text-muted truncate">{post.author}</span>
                  </div>
                </div>
              </button>
            ) : (
              /* 用户动态卡 → 帖详情 */
              <button
                key={post.id}
                {...bindTap('post.detail.open.fromCommunity', {
                  params: { postId: post.id },
                  beforeTrigger: () => setCurrent('postId', post.id),
                })}
                className="w-full mb-2 bg-app-surface rounded-xl overflow-hidden border-none p-0 text-left break-inside-avoid"
              >
                {post.images[0] && <Img id={post.images[0]} className="w-full h-40 object-cover" alt={post.content.slice(0, 6)} />}
                <div className="px-2.5 py-2">
                  {post.sportData && (
                    <div className="text-[13px] font-semibold text-app-text">
                      {post.sportData.type} {post.sportData.km ? `${Math.round((post.sportData.km ?? 0) * 1000)}米` : ''}
                    </div>
                  )}
                  <div className="text-[13px] text-app-text leading-snug mt-0.5" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {post.content}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Img id={post.avatar} className="w-4 h-4 rounded-full object-cover" alt={post.author} />
                    <span className="text-[11px] text-app-text-muted truncate flex-1">{post.author}</span>
                    <span className="text-[11px] text-app-text-muted">📣{post.cheers}</span>
                  </div>
                </div>
              </button>
            );
          })}
          {/* 拜耳广告卡(素材无图,渐变兜底) */}
          <button
            {...bindTap(
              { kind: 'action', id: 'discover.community.activitycard.wontfix' },
              { params: { postId: 'ad_bayer' }, onTrigger: () => toast(s.notOpen) },
            )}
            className="w-full mb-2 bg-app-surface rounded-xl overflow-hidden border-none p-0 text-left break-inside-avoid"
          >
            <div className="w-full h-32 flex items-center justify-center" style={{ background: 'linear-gradient(140deg, #FF9450, #E23B2E)' }}>
              <span className="text-white text-[15px] font-bold px-3 text-center leading-snug">心肝同养<br />熬夜回血</span>
            </div>
            <div className="px-2.5 py-2">
              <div className="text-[14px] text-app-text leading-snug">久坐腰酸?拜耳心肝宝护航日常活力</div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-[11px] text-app-text-muted flex-1">拜耳天猫旗舰店</span>
                <span className="text-[10px] text-app-text-muted border border-app-border rounded px-1">广告</span>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* 绿色发布 FAB */}
      <button
        {...bindTap('post.compose.open.fromCommunity')}
        className="absolute right-4 bottom-6 rounded-full border-none flex items-center justify-center text-white text-[20px]"
        style={{ width: 54, height: 54, background: C.green, boxShadow: '0 4px 12px rgba(36,199,137,.4)' }}
        aria-label="发布动态"
      >
        ✏️
      </button>
    </div>
  );
}
