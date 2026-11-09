import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { YOUKU_CONFIG } from '../data';
import { IcBack, CREATORS, ConfirmSheet, EmptyBox, creatorById } from './me/meShared';

const RECOMMEND_IDS = YOUKU_CONFIG.recommendCreatorIds as unknown as string[];

/**
 * spec 节点 me.following(route /me/following)—— 我的关注(s212)。
 * 关注的人计数与 me.profile 联动;取关走确认弹层(URL 驱动,取消=back);
 * 推荐关注 +关注 后移入已关注列表;条目/头像 → creator.profile。
 */
export default function FollowingPage() {
  const { bindTap, action, bindBack, back } = useYoukuGestures();
  const [sp, setSearchParams] = useSearchParams();
  const followingCreators = useYoukuStore((s) => s.followingCreators);
  const toggleFollowCreator = useYoukuStore((s) => s.toggleFollowCreator);

  const [tab, setTab] = useState<'user' | 'topic'>('user');

  const followed = followingCreators.map((id) => creatorById(id)).filter((c) => c != null);
  const recommends = RECOMMEND_IDS.map((id) => creatorById(id)).filter((c) => c != null);

  // 取关确认弹层:?unfollow=<userId>(URL 驱动)
  const unfollowId = sp.get('unfollow');
  const unfollowTarget = unfollowId ? CREATORS.find((c) => c.id === unfollowId) : undefined;

  return (
    <div className="relative flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">我的关注</span>
        <span className="w-9" />
      </div>

      {/* 分段:关注的人 N / 话题 */}
      <div className="flex shrink-0 items-baseline gap-6 px-4 pb-2">
        <button
          {...action('me.following.tab.select.user', () => setTab('user'))}
          className={`cursor-pointer border-none bg-transparent p-0 ${
            tab === 'user' ? 'text-[19px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
          }`}
        >
          关注的人 {followed.length}
        </button>
        <button
          {...action('me.following.tab.select.topic', () => setTab('topic'))}
          className={`cursor-pointer border-none bg-transparent p-0 ${
            tab === 'topic' ? 'text-[19px] font-bold text-(--app-c-text-primary)' : 'text-[16px] text-[#8A8A8A]'
          }`}
        >
          话题
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {tab === 'user' && (
          <>
            {/* 推荐关注横滑卡 */}
            {recommends.length > 0 && (
              <>
                <div className="px-4 pt-2 text-[17px] font-bold">🤗 看看这些推荐的人吧~</div>
                <div className="mt-3 flex gap-2.5 overflow-x-auto px-4 [scrollbar-width:none]">
                  {recommends.map((c) => {
                    const isFollowed = followingCreators.includes(c.id);
                    return (
                      <div key={c.id} className="w-36 shrink-0 rounded-2xl bg-(--app-c-card-bg) px-3 py-4 text-center">
                        <div {...bindTap('me.following.user.open', { params: { userId: c.id } })} className="cursor-pointer">
                          <Img src={c.avatar} label={c.name} ratio="square" className="mx-auto h-16 w-16 rounded-full bg-(--app-c-chip-bg) object-cover" />
                          <div className="mt-2 truncate text-[15px] font-medium">{c.name}</div>
                          <div className="mt-1 truncate text-[12px] text-[#999999]">粉丝:{c.fansText}</div>
                        </div>
                        <button
                          {...action('me.following.recommend.follow.toggle', () => toggleFollowCreator(c.id), {
                            params: { userId: c.id },
                          })}
                          className={`mt-3 h-9 w-full cursor-pointer rounded-lg border-none text-[14px] font-medium ${
                            isFollowed ? 'bg-(--app-c-chip-bg) text-[#999999]' : 'bg-white text-black'
                          }`}
                        >
                          {isFollowed ? '已关注' : '+关注'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* 已关注列表 */}
            <div className="mt-4">
              {followed.map((c) => {
                const latest = c.dynamics[0];
                return (
                  <div key={c.id} className="flex items-center gap-3 border-b border-[#222222] px-4 py-4">
                    <div
                      {...bindTap('me.following.user.open', { params: { userId: c.id } })}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                    >
                      <Img src={c.avatar} label={c.name} ratio="square" className="h-14 w-14 shrink-0 rounded-full bg-(--app-c-chip-bg) object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[16px] font-medium">{c.name}</div>
                        <div className="mt-1 truncate text-[13px] text-[#999999]">{c.bio}</div>
                        {latest && <div className="mt-1 truncate text-[12px] text-[#666666]">{latest.text}</div>}
                      </div>
                    </div>
                    {/* 打开确认弹层(URL 驱动);声明的 unfollow.confirm 绑在弹层确认按钮上 */}
                    <button
                      onClick={() =>
                        setSearchParams((p) => {
                          p.set('unfollow', c.id);
                          return p;
                        })
                      }
                      className="shrink-0 cursor-pointer rounded-lg border-none bg-(--app-c-chip-bg) px-4 py-2 text-[13px] text-[#999999]"
                    >
                      已关注
                    </button>
                  </div>
                );
              })}
              {followed.length === 0 && <EmptyBox text="还没有关注的人,去发现有趣的创作者吧" />}
            </div>
          </>
        )}

        {/* 话题tab(内容未拍,空态 inferred) */}
        {tab === 'topic' && <EmptyBox text="还没有关注的话题" />}
      </div>

      {/* 取关确认弹层:确认后移出列表,计数联动 me.profile(取消=back) */}
      {unfollowTarget && (
        <ConfirmSheet
          text={`确定不再关注「${unfollowTarget.name}」吗?`}
          confirmText="取消关注"
          confirmBind={action(
            'me.following.unfollow.confirm',
            () => {
              toggleFollowCreator(unfollowTarget.id);
              back();
            },
            { params: { userId: unfollowTarget.id } },
          )}
        />
      )}
    </div>
  );
}
