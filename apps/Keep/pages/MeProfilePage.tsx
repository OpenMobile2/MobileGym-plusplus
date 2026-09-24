import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { pickImagesWithSystem, shareWithSystem } from '../capabilities';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import { IcNavBack, IcShare, IcZap, IcMedal, IcArrowRight, IcScan } from '../res/icons';
import { followedProfileList } from '../store/profileHelpers';

const FILTERS = ['动态', '视频', '相册', '可跟练'];
/** 近12个月总运动分钟折线（确定性虚构演示数据，峰值 320）。 */
const CHART = [80, 120, 95, 140, 110, 320, 210, 160, 175, 240, 280, 0];

/** 个人主页(封面/编辑/动态tab)—— 节点 me.profile(证据 recF_f002) */
export default function MeProfilePage() {
  const { bindTap, bindBack } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const user = useKeepStore((st) => st.user);
  const coaches = useKeepStore((st) => st.coaches);
  const followedCoaches = useKeepStore((st) => st.followedCoaches) ?? [];
  const followedUsers = useKeepStore((st) => st.followedUsers) ?? [];
  const followedNames = useKeepStore((st) => st.followedNames) ?? [];
  const posts = useKeepStore((st) => st.posts);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const coachFollowSet = useKeepStore((st) => st.coachFollowSet);
  const toggleFollowUser = useKeepStore((st) => st.toggleFollowUser);

  const filter = searchParams.get('filter') ?? '动态';
  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const maxV = Math.max(...CHART);
  const points = CHART.map((v, i) => `${8 + (i * 224) / (CHART.length - 1)},${54 - (v / maxV) * 44}`).join(' ');

  const favedPosts = useKeepStore((st) => st.favedPosts) ?? [];
  const cheeredPosts = useKeepStore((st) => st.cheeredPosts) ?? [];

  if (searchParams.get('social') === 'favorites') {
    const saved = posts.filter((p) => favedPosts.includes(p.id) || cheeredPosts.includes(p.id));
    return (
      <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-3 bg-app-surface border-b border-app-border">
          <button {...bindBack()} aria-label={s.back} className="p-1 bg-transparent border-none text-app-text"><IcNavBack size={22} /></button>
          <h1 className="flex-1 text-center text-[16px] font-semibold">收藏与加油</h1>
          <span className="w-7" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2" data-scroll-container="main" data-scroll-direction="vertical">
          {saved.length > 0 ? saved.map((post) => (
            <button
              key={post.id}
              {...bindTap('post.detail.open.fromFavorites', {
                params: { postId: post.id },
                beforeTrigger: () => setCurrent('postId', post.id),
              })}
              className="w-full text-left py-3 border-b border-app-border bg-transparent border-x-0 border-t-0"
            >
              <div className="text-[15px] font-semibold text-app-text">{post.author}</div>
              <div className="text-[13px] text-app-text-muted mt-1 line-clamp-2">{post.content}</div>
            </button>
          )) : <div className="pt-24 text-center text-app-text-muted">还没有收藏或加油</div>}
        </div>
      </div>
    );
  }

  if (searchParams.get('social') === 'following') {
    const followed = followedProfileList(coaches, posts, followedCoaches, followedUsers, followedNames);
    return (
      <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-3 bg-app-surface border-b border-app-border">
          <button {...bindBack()} aria-label={s.back} className="p-1 bg-transparent border-none text-app-text"><IcNavBack size={22} /></button>
          <h1 className="flex-1 text-center text-[16px] font-semibold">我的关注</h1>
          <span className="w-7" />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-2" data-scroll-container="main" data-scroll-direction="vertical">
          {followed.length > 0 ? followed.map((profile) => (
            <div key={profile.id} className="flex items-center gap-3 py-3 border-b border-app-border">
              <button
                {...bindTap('coach.profile.open.fromFollowing', {
                  params: { coachId: profile.id },
                  beforeTrigger: () => setCurrent('coachId', profile.id),
                })}
                className="flex flex-1 items-center gap-3 min-w-0 bg-transparent border-none p-0 text-left"
              >
                <Img id={profile.avatar} className="w-12 h-12 rounded-full object-cover" alt={profile.name} />
                <span className="min-w-0"><b className="block truncate text-[15px]">{profile.name}</b><small className="text-app-text-muted">{profile.fans} 粉丝</small></span>
              </button>
              <button
                {...bindTap(
                  { kind: 'action', id: 'me.profile.following.toggle' },
                  {
                    params: { coachId: profile.id, name: profile.name },
                    onTrigger: () => {
                      if (coaches.some((c) => c.id === profile.id)) coachFollowSet(profile.id, false);
                      else toggleFollowUser(profile.name);
                    },
                  },
                )}
                className="px-3 py-1.5 rounded-full border border-app-border bg-app-surface text-[12px] text-app-text-muted"
              >
                已关注
              </button>
            </div>
          )) : <div className="pt-24 text-center text-app-text-muted">暂未关注任何人</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="light">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 紫色封面 */}
        <div className="relative px-4 pt-2 pb-14" style={{ background: 'linear-gradient(160deg, #5B37E8, #6D46F2)' }}>
          <div className="flex items-center h-10">
            <button {...bindBack()} className="p-1 bg-transparent border-none text-white -ml-1" aria-label={s.back}>
              <IcNavBack size={22} />
            </button>
            <div className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'me.profile.share.submit' }, {
                onTrigger: () => {
                  const launched = shareWithSystem(
                    `【Keep】${user.nickname}的个人主页`,
                    (result) => { if (result.resultCode === 'OK') toast('分享成功'); },
                  );
                  if (!launched) toast(s.notOpen);
                },
              })}
              aria-label="分享"
              className="p-1 bg-transparent border-none text-white"
            >
              <IcShare size={20} />
            </button>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'me.profile.cover.pick' }, {
              onTrigger: () => {
                void pickImagesWithSystem({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  useKeepStore.getState().setUserCover(r.selected[0].uri);
                });
              },
            })}
            className="absolute right-4 bottom-4 px-2.5 py-1.5 rounded-full border-none text-[11px] text-white"
            style={{
              background: user.cover
                ? `linear-gradient(0deg,rgba(0,0,0,.35),rgba(0,0,0,.35)), url(${user.cover}) center/cover`
                : 'rgba(0,0,0,.35)',
            }}
          >
            👆 点击更换封面图
          </button>
        </div>

        <div className="px-4 -mt-10">
          {/* 头像 + 三数据 */}
          <div className="flex items-end">
            <Img id={user.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-white shrink-0" alt={user.nickname} />
            <div className="flex-1 flex justify-around pb-1">
              <button
                {...bindTap(
                  { kind: 'action', id: 'me.profile.following.open' },
                  { onTrigger: () => setSearchParams((previous) => { const next = new URLSearchParams(previous); next.set('social', 'following'); return next; }) },
                )}
                className="flex flex-col items-center bg-transparent border-none"
              >
                <span className="text-[18px] font-bold text-app-text">{user.following}</span><span className="text-[12px] text-app-text-muted">关注</span>
              </button>
              <button {...wontfix('me.profile.social.wontfix')} className="flex flex-col items-center bg-transparent border-none">
                <span className="text-[18px] font-bold text-app-text">{user.followers}</span><span className="text-[12px] text-app-text-muted">粉丝</span>
              </button>
              <button {...wontfix('me.profile.social.wontfix')} className="flex flex-col items-center bg-transparent border-none">
                <span className="text-[18px] font-bold text-app-text">{user.cheers}</span><span className="text-[12px] text-app-text-muted">收获加油</span>
              </button>
            </div>
          </div>

          {/* 用户名 + 编辑主页 + 名片二维码 */}
          <div className="flex items-center mt-3">
            <span className="text-[20px] font-bold text-app-text flex-1 truncate">{user.nickname}</span>
            <button
              {...wontfix('me.profile.edit.wontfix')}
              className="px-3.5 py-1.5 rounded-full border-none text-[13px] text-app-text mr-2"
              style={{ background: '#F0F1F5' }}
            >
              编辑主页
            </button>
            <button
              {...wontfix('me.profile.qrcard.wontfix')}
              className="p-1.5 rounded-full border-none text-app-text"
              style={{ background: '#F0F1F5' }}
              aria-label="名片二维码"
            >
              <IcScan size={16} />
            </button>
          </div>

          {/* 胶囊行(同组 wontfix) */}
          <div className="flex gap-2 mt-3 overflow-x-auto" data-scroll-container="capsules" data-scroll-direction="horizontal">
            {[
              { icon: <IcZap size={12} />, text: '激励连动1天' },
              { icon: null, text: `KG ${user.kgLevel}` },
              { icon: <IcMedal size={12} />, text: '24 新挑战' },
              { icon: <IcZap size={12} />, text: '累计运动天数 42' },
            ].map((it) => (
              <button
                key={it.text}
                {...wontfix('me.profile.capsule.wontfix')}
                className="flex items-center gap-1 shrink-0 px-2.5 py-1.5 rounded-full bg-app-surface border border-app-border text-[12px] text-app-text"
              >
                {it.icon}{it.text}
              </button>
            ))}
          </div>

          {/* 资料行(IP 虚构化:云江) */}
          <div className="text-[12px] text-app-text-muted mt-3">
            {user.gender} · 示例星球 · IP 示例区
          </div>

          {/* 总运动数据卡 */}
          <button
            {...bindTap('records.hub.open.fromProfile')}
            className="flex items-center w-full mt-3 rounded-2xl bg-app-surface border-none px-4 py-3.5 text-left"
          >
            <div className="shrink-0">
              <div className="flex items-center gap-1 text-[13px] text-app-text">
                总运动数据 <IcArrowRight size={14} className="text-app-text-muted" />
              </div>
              <div className="text-[22px] font-bold text-app-text mt-1">
                {user.totalMinutes} <span className="text-[12px] font-normal text-app-text-muted">分钟</span>
              </div>
              <div className="text-[11px] text-app-text-muted mt-0.5">近 12 个月</div>
            </div>
            <svg viewBox="0 0 240 60" className="flex-1 ml-3 h-14">
              <polyline points={points} fill="none" stroke={C.green} strokeWidth="2" strokeLinejoin="round" />
              {CHART.map((v, i) => (
                <circle
                  key={i}
                  cx={8 + (i * 224) / (CHART.length - 1)}
                  cy={54 - (v / maxV) * 44}
                  r="2.2"
                  fill="#fff"
                  stroke={C.green}
                  strokeWidth="1.5"
                />
              ))}
              <text x={8 + (5 * 224) / 11} y="8" fontSize="9" fill={C.greenDeep} textAnchor="middle">320</text>
            </svg>
          </button>

          {/* tab:动态 / 装备 / 运动圈 */}
          <div className="flex items-center gap-8 mt-5 border-b border-app-border">
            <span className="text-[15px] font-bold text-app-text pb-2 border-b-2 border-app-text -mb-px">动态</span>
            <button {...wontfix('me.profile.geartab.wontfix')} className="bg-transparent border-none p-0 pb-2 text-[15px] text-app-text-muted">
              装备
            </button>
            <button {...wontfix('me.profile.circletab.wontfix')} className="bg-transparent border-none p-0 pb-2 text-[15px] text-app-text-muted">
              运动圈
            </button>
          </div>

          {/* 动态筛选 chips */}
          <div className="flex gap-2 mt-3">
            {FILTERS.map((f) => {
              const sel = filter === f;
              return (
                <button
                  key={f}
                  {...bindTap(
                    { kind: 'action', id: 'me.profile.filter.switch' },
                    {
                      params: { filter: f },
                      onTrigger: () =>
                        setSearchParams((p) => { p.set('filter', f); return p; }, { replace: true }),
                    },
                  )}
                  className="px-3 py-1.5 rounded-full border-none text-[12px]"
                  style={{
                    background: sel ? '#26202E' : '#F0F1F5',
                    color: sel ? '#fff' : '#4A4E57',
                  }}
                >
                  {f}{f === '动态' ? ' 0' : ''}
                </button>
              );
            })}
          </div>

          {/* 空态 */}
          <div className="flex flex-col items-center py-16">
            <span className="w-16 h-16 rounded-xl flex items-center justify-center text-[26px]" style={{ background: '#EDFBF4' }}>
              🗂️
            </span>
            <div className="text-[13px] text-app-text-muted mt-3">{s.emptyNoContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
