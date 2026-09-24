import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { EmptyBox, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';

/** 关注列表(IMG_8451):我关注 / 关注我 */
const ProfileFollowPage: React.FC = () => {
  const { action } = useBossGestures();
  const user = useBossStore((s) => s.user);
  const followedAuthors = useBossStore((s) => s.followedAuthors);
  const [tab, setTab] = useState<'following' | 'followers'>('following');

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={user.communityNick || user.nickname} />
      <div className="grid grid-cols-2 border-b border-gray-100">
        {(['following', 'followers'] as const).map((v) => (
          <button key={v} {...action('follow.select.tab', () => setTab(v), { params: { value: v } })} className="relative pb-2.5 pt-1">
            <span className={tab === v ? 'text-[16px] font-bold text-gray-900' : 'text-[15px] text-gray-400'}>
              {v === 'following' ? `${followedAuthors.length} 我关注` : `${user.fansCount} 关注我`}
            </span>
            {tab === v && <span className="absolute inset-x-0 bottom-0 mx-auto h-[3px] w-8 rounded-full" style={{ backgroundColor: COLORS.primary }} />}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'following' && followedAuthors.length > 0 ? (
          followedAuthors.map((name) => (
            <div key={name} className="flex items-center justify-between border-b border-gray-50 px-4 py-3.5">
              <span className="text-[15px] text-gray-900">{name}</span>
              <span className="rounded-full border border-gray-200 px-3 py-1 text-[12px] text-gray-400">已关注</span>
            </div>
          ))
        ) : (
          <EmptyBox text="这里空荡荡的还没有人" />
        )}
      </div>
    </div>
  );
};

export default ProfileFollowPage;
