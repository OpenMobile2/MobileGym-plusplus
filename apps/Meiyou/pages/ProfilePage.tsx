/**
 * 个人主页(自己)(spec profile.self):头像/昵称/数据栏 + 任务中心/活动广场 +
 * tab 作品/赞过(?tab=works|liked)+ 筛选chips + 帖子列表 + 发帖FAB。
 * 证据 frame r4.mp4@43;qa:Q10=B 赞过可用。
 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, Img, useToast } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcNavBack, IcGift, IcStar, IcMoreH, IcArrowRight, IcPen } from '../res/icons';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

const FILTERS = [
  { id: 'all', label: '全部', enabled: true },
  { id: 'image', label: '图文', enabled: true },
  { id: 'video', label: '视频', enabled: false },
  { id: 'question', label: '提问', enabled: false },
] as const;

export default function ProfilePage() {
  const { bindTap, bindBack } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'works';
  const [filter, setFilter] = React.useState('all');

  const user = useMeiyouStore((st) => st.user);
  const posts = useMeiyouStore((st) => st.posts);
  const myPostIds = useMeiyouStore((st) => st.myPostIds);
  const likedPostIds = useMeiyouStore((st) => st.likedPostIds);

  const ids = tab === 'liked' ? likedPostIds : myPostIds;
  let list = ids.map((i) => posts.find((p) => p.id === i)).filter((p): p is Post => !!p);
  if (filter === 'image') list = list.filter((p) => p.images.length > 0);

  const selectTab = (target: 'works' | 'liked') =>
    setSearchParams((p) => { p.set('tab', target); return p; }, { replace: true });

  const stats = [
    { label: '关注', value: user.stats.follows },
    { label: '粉丝', value: user.stats.fans },
    { label: '获赞', value: user.stats.likes },
    { label: '获收藏', value: user.stats.favs },
  ];

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      {/* 顶栏:返回 + 挂件/收藏/更多 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white">
        <button
          {...bindBack()}
          className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="返回"
        >
          <IcNavBack size={24} className="text-[#1A1A1A]" />
        </button>
        <div className="flex-1" />
        {[
          { key: 'pendant', Icon: IcGift, label: '挂件' },
          { key: 'fav', Icon: IcStar, label: '收藏' },
          { key: 'more', Icon: IcMoreH, label: '更多' },
        ].map(({ key, Icon, label }) => (
          <button
            key={key}
            {...bindTap({ kind: 'action', id: 'profile.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label={label}
          >
            <Icon size={20} className="text-[#1A1A1A]" />
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="profile-body" data-scroll-direction="vertical">
        {/* 头像+昵称+微章+IP */}
        <div className="bg-white px-4 pt-2 pb-3">
          <div className="flex items-center gap-3">
            <Img src={user.avatar} className="w-16 h-16 rounded-full object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[17px] font-semibold text-[#1A1A1A] truncate">{user.nick}</div>
              <button
                {...bindTap({ kind: 'action', id: 'profile.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="mt-1 inline-flex items-center gap-0.5 px-2 h-5.5 rounded-full bg-[#F5F5F7] text-[11px] text-[#666] border-none cursor-pointer"
                style={{ height: 22 }}
              >
                微章
                <IcArrowRight size={12} />
              </button>
              <div className="text-[11px] text-[#999] mt-1">IP属地:{user.ipRegion}</div>
            </div>
          </div>
          {/* 数据栏 */}
          <div className="flex mt-3">
            {stats.map((it) => (
              <div key={it.label} className="flex-1 flex flex-col items-center">
                <span className="text-[16px] font-semibold text-[#1A1A1A]">{it.value}</span>
                <span className="text-[11px] text-[#999] mt-0.5">{it.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 任务中心/活动广场 */}
        <div className="flex gap-2.5 px-3 mt-2.5">
          {[
            { key: 'task', title: '任务中心', desc: '做任务领柚币', emoji: '🎯' },
            { key: 'activity', title: '活动广场', desc: '精彩活动等你来', emoji: '🎪' },
          ].map((card) => (
            <button
              key={card.key}
              {...bindTap({ kind: 'action', id: 'profile.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="flex-1 bg-white rounded-xl px-3 py-2.5 flex items-center gap-2 border-none cursor-pointer text-left"
            >
              <span className="text-[20px]">{card.emoji}</span>
              <span className="min-w-0">
                <span className="block text-[13px] font-medium text-[#1A1A1A]">{card.title}</span>
                <span className="block text-[10px] text-[#999] truncate">{card.desc}</span>
              </span>
            </button>
          ))}
        </div>

        {/* tab 作品/赞过/回复/回答 */}
        <div className="flex items-center gap-5 px-4 mt-3 bg-white pt-3 rounded-t-xl mx-0">
          {([
            { id: 'works', label: s.worksTab, enabled: true },
            { id: 'liked', label: s.likedTab, enabled: true },
            { id: 'reply', label: '回复', enabled: false },
            { id: 'answer', label: '回答', enabled: false },
          ] as const).map((t) => {
            const active = t.enabled && tab === t.id;
            return t.enabled ? (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'profile.tab.select.target' }, {
                  params: { target: t.id },
                  onTrigger: () => selectTab(t.id as 'works' | 'liked'),
                })}
                className="bg-transparent border-none cursor-pointer p-0 pb-2 text-[14px]"
                style={active
                  ? { color: '#1A1A1A', fontWeight: 600, borderBottom: `2px solid ${MY.primary}` }
                  : { color: '#999999' }}
              >
                {t.label}
              </button>
            ) : (
              <button
                key={t.id}
                {...bindTap({ kind: 'action', id: 'profile.tab.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="bg-transparent border-none cursor-pointer p-0 pb-2 text-[14px] text-[#999]"
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 筛选 chips */}
        <div className="flex gap-2 px-4 py-2.5 bg-white">
          {FILTERS.map((f) => {
            const active = f.enabled && filter === f.id;
            return (
              <button
                key={f.id}
                {...(f.enabled
                  ? bindTap({ kind: 'action', id: 'profile.filter.select.target' }, {
                    params: { target: f.id },
                    onTrigger: () => setFilter(f.id),
                  })
                  : bindTap({ kind: 'action', id: 'profile.tab.disabled' }, { onTrigger: () => showToast(NOT_OPEN) }))}
                className="px-3 h-7 rounded-full text-[12px] border-none cursor-pointer"
                style={active
                  ? { background: '#FFE3ED', color: MY.primary }
                  : { background: '#F5F5F7', color: '#666666' }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* 帖子列表 */}
        <div className="flex flex-col gap-2.5 px-3 py-2.5">
          {list.map((p) => (
            <PostCard key={p.id} post={p} showToast={showToast} />
          ))}
          {list.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyList}</div>
          ) : (
            <div className="py-4 text-center text-[11px] text-[#BBBBBB]">— 已显示全部 —</div>
          )}
        </div>
      </div>

      {/* 悬浮发帖 FAB */}
      <button
        {...bindTap('meiyou.publish-open')}
        className="absolute right-4 bottom-5 rounded-full flex items-center justify-center border-none cursor-pointer shadow-lg"
        style={{ background: MY.primary, width: 52, height: 52 }}
        aria-label={s.publish}
      >
        <IcPen size={22} className="text-white" />
      </button>

      {toast}
    </div>
  );
}
