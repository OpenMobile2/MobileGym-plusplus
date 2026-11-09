import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { Avatar, EmptyBox, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcShare, IcChevronRight, IcShield } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';
import { BOSS_CONFIG } from '../data';

/** 个人主页(IMG_8450):动态/收藏 + 勋章 + 关注 */
const ProfileHomePage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const store = useBossStore();
  const user = useBossStore((s) => s.user);
  const favoritePostIds = useBossStore((s) => s.favoritePostIds);
  const myPosts = useBossStore((s) => s.myPosts);
  const [tab, setTab] = useState<'dynamic' | 'favorites'>('dynamic');
  const favoritePosts = [...myPosts, ...BOSS_CONFIG.feedPosts].filter((post) => favoritePostIds.includes(post.id));
  const visiblePosts = tab === 'dynamic' ? myPosts : favoritePosts;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-gradient-to-b from-[#D8D2C8] to-[#F5F6F7]">
        <PageHeader transparent right={
          <button {...action('profile.share.system', () => {
            const launched = sharePlainText(`【BOSS直聘】${user.communityNick || user.nickname}的个人主页\n${user.major} · ${user.gradLabel}`, {
              onResult: (r) => { if (r.resultCode === 'OK') store.showToast(t.shareSuccess); },
            });
            if (!launched) store.showNotice('当前环境无法打开系统分享，请点击“我知道了”返回。');
          }, { params: {} })} aria-label="分享">
            <IcShare size={19} className="text-gray-700" />
          </button>
        } />
        <div className="px-4 pb-3">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-start justify-between">
              <Avatar imgKey="u_me" name={user.nickname} size={64} className="-mt-10 border-4 border-white" />
              <button {...bindTap('profile.follow-open')} className="flex gap-6 text-center">
                <span><b className="block text-[18px] text-gray-900">{user.followCount}</b><span className="text-[12px] text-gray-500">我关注</span></span>
                <span><b className="block text-[18px] text-gray-900">{user.fansCount}</b><span className="text-[12px] text-gray-500">关注我</span></span>
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[22px] font-bold text-gray-900">{user.communityNick || user.nickname}</span>
              <button {...bindTap('profile.edit-open')} className="rounded-full border px-3.5 py-1.5 text-[13px]" style={{ borderColor: COLORS.primary, color: COLORS.primary }}>编辑资料</button>
            </div>
            <div className="mt-1 text-[13px] text-gray-600">{user.major}·{user.gradLabel.replace('年应届生', '届')}</div>
            <div className="mt-1 text-[12px] text-gray-400">IP归属地: {user.ipLocation}</div>
          </div>

          <button
            {...action('profile.badge.toast', () => store.showNotice('勋章功能暂未开放，请点击“我知道了”返回。'), { params: {} })}
            className="mt-3 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5"
          >
            <span className="flex items-center gap-2 text-[15px] font-medium text-gray-900"><IcShield size={18} color={COLORS.primary} /> 我的勋章</span>
            <IcChevronRight size={17} className="text-gray-300" />
          </button>
        </div>
      </div>

      <div className="mx-4 flex gap-6 rounded-t-2xl bg-white px-4 pt-3">
        {(['dynamic', 'favorites'] as const).map((v) => (
          <button key={v} {...action('profile.select.tab', () => setTab(v), { params: { value: v } })} className="relative pb-2">
            <span className={tab === v ? 'text-[16px] font-bold text-gray-900' : 'text-[15px] text-gray-500'}>{v === 'dynamic' ? '动态' : '收藏'}</span>
            {tab === v && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-7 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
          </button>
        ))}
      </div>
      <div className="mx-4 min-h-0 flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
        {visiblePosts.length === 0 ? (
          <EmptyBox text={tab === 'dynamic' ? '暂无发布内容' : '还没有收藏内容'} />
        ) : (
          <div className="space-y-2 px-3 py-3">
            {visiblePosts.map((post) => (
              <button key={post.id} {...bindTap('profile.post-open', { params: { postId: post.id } })} className="block w-full rounded-xl bg-[#F8F9FA] p-3 text-left">
                <span className="block text-[14px] font-medium leading-relaxed text-gray-900">{post.text}</span>
                <span className="mt-1 block text-[12px] text-gray-400">{post.topics.map((topic) => `#${topic}`).join(' ') || '我的动态'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default ProfileHomePage;
