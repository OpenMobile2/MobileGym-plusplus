import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, VBadge, fmtCount, TopBar, BottomSheet, CenterDialog, FollowBtn } from '../components/ui';

const F_TABS = ['关注的人', '经常访问', '推荐', '超话'] as const;

export default function FollowsPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const users = useWeiboStore((st) => st.users);
  const supertopics = useWeiboStore((st) => st.supertopics);
  const followUser = useWeiboStore((st) => st.followUser);
  const unfollowUser = useWeiboStore((st) => st.unfollowUser);
  const followSupertopic = useWeiboStore((st) => st.followSupertopic);

  const tab = searchParams.get('tab') ?? '关注的人';
  const sheetOpen = searchParams.get('sheet') === 'unfollow';
  const confirmOpen = sheetOpen && searchParams.get('confirm') === 'open';
  const targetUid = searchParams.get('uid') ?? '';
  const [widgetGuideShown, setWidgetGuideShown] = useState(false);
  const [widgetGuideDismissed, setWidgetGuideDismissed] = useState(false);
  const [kw, setKw] = useState('');
  const [recentUnfollowed, setRecentUnfollowed] = useState<string[]>([]);
  const [justFollowed, setJustFollowed] = useState<string | null>(null);

  const target = users.find((u) => u.id === targetUid);
  const following = users.filter((u) => (u.followedByMe || recentUnfollowed.includes(u.id)) && (kw ? u.name.includes(kw) : true));
  const frequent = users.filter((u) => u.frequentInfo);
  const recommend = users.filter((u) => !u.followedByMe);

  const closeSheet = () => setSearchParams((p) => { p.delete('sheet'); p.delete('confirm'); p.delete('uid'); return p; }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-white relative">
      <TopBar backBinding={bindBack()} title="关注" right={
        <button
          {...bindTap({ kind: 'action', id: 'follows.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[13px] text-[#5B5B5B] bg-transparent border-none cursor-pointer whitespace-nowrap"
        >
          发现用户
        </button>
      } />

      {/* tabs */}
      <div className="flex items-center gap-6 px-4 h-10 shrink-0 border-b border-[#F7F7F7]">
        {F_TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'follows.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => {
                setSearchParams((p) => { t === '关注的人' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true });
                if (t === '经常访问' && !widgetGuideDismissed) setWidgetGuideShown(true);
              },
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FFB300]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="follows-list" data-scroll-direction="vertical">
        {tab === '关注的人' && (
          <>
            <div className="px-3 py-2">
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="搜全部关注"
                data-action="follows.search.input"
                data-action-type="input"
                className="w-full h-8 bg-[#F5F5F5] rounded-full px-3 text-[13px] border-none outline-none"
              />
            </div>
            <div className="grid grid-cols-4 gap-2 px-3 pb-2">
              {['特别关注', '是TA的铁粉', '关注分组', '兴趣主页'].map((g, i) => (
                <button
                  key={g}
                  {...bindTap({ kind: 'action', id: 'follows.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
                  className="h-14 rounded-lg bg-[#F7F7F7] border-none cursor-pointer flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-[16px]">{['⭐', '💙', '📂', '🔮'][i]}</span>
                  <span className="text-[11px] text-[#5B5B5B]">{g}</span>
                </button>
              ))}
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'follows.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="block w-full text-center text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer py-1"
            >
              批量管理
            </button>
            {following.map((u) => {
              const unfollowed = recentUnfollowed.includes(u.id) && !u.followedByMe;
              return (
                <div key={u.id} className="border-b border-[#FAFAFA]">
                  <div className="flex items-center gap-2.5 px-3 py-2.5">
                    <div {...bindTap('follows.user-open', { params: { id: u.id } })} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[14px] text-[#E68A3C] truncate">{u.name}</span>
                          <VBadge type={u.verified} />
                        </div>
                        <div className="text-[12px] text-[#9A9A9A] truncate">{u.intro}</div>
                      </div>
                    </div>
                    {unfollowed ? (
                      <FollowBtn
                        refollow
                        binding={bindTap({ kind: 'action', id: 'follows.refollow.submit' }, {
                          params: { userId: u.id },
                          onTrigger: () => { followUser(u.id); setRecentUnfollowed((prev) => prev.filter((x) => x !== u.id)); },
                        })}
                      />
                    ) : (
                      <FollowBtn
                        followed={!u.followsMe}
                        mutual={u.followsMe}
                        binding={bindTap({ kind: 'action', id: 'follows.unfollowSheet.open' }, {
                          params: { userId: u.id },
                          onTrigger: () => setSearchParams((p) => { p.set('sheet', 'unfollow'); p.set('uid', u.id); return p; }, { replace: true }),
                        })}
                      />
                    )}
                  </div>
                  {u.id === 'u_xusong' && (
                    <div className="flex items-center gap-2 pl-16 pr-3 pb-2">
                      <span className="text-[12px] text-[#7F7F7F]">◇许嵩超话 112.4万帖子</span>
                      <span className="flex-1" />
                      <button
                        {...bindTap({ kind: 'action', id: 'follows.supertopicRow.follow' }, {
                          params: { supertopicId: 'st_xusong' },
                          onTrigger: () => { followSupertopic('st_xusong'); toast('已关注超话'); },
                        })}
                        className="text-[11px] text-[#FF8200] border border-[#FF8200] rounded-full px-2 py-0.5 bg-transparent cursor-pointer"
                      >
                        +关注超话
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="text-center text-[12px] text-[#BBBBBB] py-4">没有更多内容了</div>
          </>
        )}

        {tab === '经常访问' && (
          <>
            <button
              {...bindTap({ kind: 'action', id: 'follows.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="block w-full text-center text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer py-2"
            >
              管理经常访问
            </button>
            <div className="px-3 text-[12px] text-[#9A9A9A]">我的访问记录(仅自己可见)</div>
            <div className="px-3 py-1.5 text-[12px] text-[#7F7F7F]">今天</div>
            {frequent.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#FAFAFA]">
                <div {...bindTap('follows.user-open', { params: { id: u.id } })} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                  <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[14px] text-[#E68A3C] truncate">{u.name}</div>
                    <span className="text-[10px] text-[#7F7F7F] bg-[#F5F5F5] rounded px-1.5 py-0.5">{u.frequentInfo}</span>
                  </div>
                </div>
                {!u.followedByMe && (
                  <FollowBtn
                    binding={bindTap({ kind: 'action', id: 'follows.follow.submit' }, {
                      params: { userId: u.id },
                      onTrigger: () => { followUser(u.id); setJustFollowed(u.id); },
                    })}
                  />
                )}
              </div>
            ))}
            {justFollowed && (
              <div className="px-3 py-2 bg-[#FAFAFA]">
                <div className="text-[12px] text-[#9A9A9A] mb-1.5">关注推荐</div>
                <div className="flex gap-2 overflow-x-auto">
                  {recommend.slice(0, 4).map((u) => (
                    <div key={u.id} className="shrink-0 w-20 bg-white rounded-lg p-2 flex flex-col items-center gap-1">
                      <Img src={u.avatar} label={u.name[0]} className="w-9 h-9 rounded-full object-cover" />
                      <span className="text-[10px] truncate w-full text-center">{u.name}</span>
                      <FollowBtn size="sm" binding={bindTap({ kind: 'action', id: 'follows.follow.submit' }, { params: { userId: u.id }, onTrigger: () => followUser(u.id) })} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="text-center text-[12px] text-[#BBBBBB] py-4">已经到底啦~</div>
          </>
        )}

        {tab === '推荐' && (
          <>
            <div className="px-3 py-2 text-[13px] text-[#7F7F7F]">你可能感兴趣</div>
            {recommend.map((u) => (
              <div key={u.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#FAFAFA]">
                <div {...bindTap('follows.user-open', { params: { id: u.id } })} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                  <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[14px] text-[#E68A3C] truncate">{u.name}</div>
                    <div className="text-[12px] text-[#9A9A9A] truncate">粉丝{fmtCount(u.fans)} · {u.intro}</div>
                  </div>
                </div>
                <FollowBtn binding={bindTap({ kind: 'action', id: 'follows.follow.submit' }, { params: { userId: u.id }, onTrigger: () => followUser(u.id) })} />
              </div>
            ))}
          </>
        )}

        {tab === '超话' && supertopics.filter((t) => t.followed).map((t) => (
          <div key={t.id} className="flex items-center gap-2.5 px-3 py-2.5 border-b border-[#FAFAFA]">
            <Img src={t.cover} label={t.name[0]} className="w-11 h-11 rounded object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#1A1A1A]">◇{t.name}</div>
              <div className="text-[12px] text-[#9A9A9A]">{fmtCount(t.posts)}帖子 {fmtCount(t.fans)}{t.fanName}</div>
            </div>
            {t.signedToday ? <span className="text-[11px] text-[#9A9A9A]">连签{t.signStreak}天</span> : <span className="text-[11px] text-[#FF8200]">待签</span>}
          </div>
        ))}
      </div>

      {/* 小组件引导弹窗 */}
      {widgetGuideShown && tab === '经常访问' && (
        <BottomSheet onClose={() => { setWidgetGuideShown(false); setWidgetGuideDismissed(true); }}>
          <div className="p-4 text-center">
            <div className="text-[15px] font-semibold mb-1">添加微博经常访问</div>
            <div className="text-[12px] text-[#9A9A9A] mb-3">随时关注博主动态,连续访问不间断</div>
            <div className="h-20 bg-[#F5F5F5] rounded-lg mb-3 flex items-center justify-center text-[12px] text-[#BBBBBB]">小组件预览</div>
            <div className="flex gap-2">
              <button
                {...bindTap({ kind: 'action', id: 'follows.widgetGuide.dismiss' }, {
                  onTrigger: () => { setWidgetGuideShown(false); setWidgetGuideDismissed(true); },
                })}
                className="flex-1 h-10 rounded-full bg-[#F5F5F5] text-[14px] text-[#5B5B5B] border-none cursor-pointer"
              >
                暂不添加
              </button>
              <button
                onClick={() => { toast(s.notOpen); setWidgetGuideShown(false); setWidgetGuideDismissed(true); }}
                className="flex-1 h-10 rounded-full bg-[#FF8200] text-[14px] text-white border-none cursor-pointer"
              >
                去添加
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* 取关 sheet */}
      {sheetOpen && !confirmOpen && (
        <BottomSheet onClose={closeSheet}>
          <button
            {...bindTap({ kind: 'action', id: 'follows.unfollowConfirm.open' }, {
              onTrigger: () => setSearchParams((p) => { p.set('confirm', 'open'); return p; }, { replace: true }),
            })}
            className="block w-full py-3.5 text-[15px] text-[#FF3852] bg-transparent border-none border-b border-[#F5F5F5] cursor-pointer"
          >
            {s.unfollowAction}
          </button>
          <button onClick={closeSheet} className="block w-full py-3.5 text-[15px] text-[#1A1A1A] bg-transparent border-none cursor-pointer mb-2">
            {s.cancel}
          </button>
        </BottomSheet>
      )}

      {/* 取关二次确认 */}
      {confirmOpen && target && (
        <CenterDialog
          text={s.unfollowAsk}
          leftLabel={s.cancel}
          rightLabel={s.confirm}
          rightBinding={bindTap({ kind: 'action', id: 'follows.unfollow.submit' }, {
            params: { userId: target.id },
            onTrigger: () => {
              unfollowUser(target.id);
              setRecentUnfollowed((prev) => [...prev, target.id]);
              closeSheet();
            },
          })}
          onLeft={closeSheet}
          onRight={closeSheet}
        />
      )}
      {toastNode}
    </div>
  );
}
