import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, Img, EmptyState } from '../components/ui';
import { IcBack } from '../res/icons';

const TABS = ['精选', '微博', '相册'] as const;

export default function ProfileSelfPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const me = useWeiboStore((st) => st.me);
  const statuses = useWeiboStore((st) => st.statuses);
  const myPostIds = useWeiboStore((st) => st.myPostIds);
  const users = useWeiboStore((st) => st.users);

  const tab = searchParams.get('tab') ?? '微博';
  const myPosts = statuses.filter((x) => x.userId === 'me' || myPostIds.includes(x.id));
  const followsCount = users.filter((u) => u.followedByMe).length;
  const fansCount = users.filter((u) => u.followsMe).length;

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      <div className="relative shrink-0">
        <div className="h-32 overflow-hidden">
          <Img src={me.headerImage} label="头" className="w-full h-full object-cover" />
        </div>
        <div className="absolute top-0 left-0 flex items-center h-11 px-2">
          <button {...bindBack()} className="bg-black/25 rounded-full border-none cursor-pointer text-white p-1"><IcBack size={20} /></button>
        </div>
        <div className="absolute -bottom-8 left-4">
          <Img src={me.avatar} label="我" className="w-16 h-16 rounded-full object-cover border-[3px] border-white" />
        </div>
      </div>

      <div className="bg-white px-4 pt-10 pb-3 shrink-0">
        <div className="text-[18px] font-bold text-[#1A1A1A]">{me.name}</div>
        <span className="inline-flex text-[11px] text-[#41C468] bg-[#EDF9EF] rounded-full px-2 py-0.5 mt-1">在线 &gt;</span>
        <div className="flex gap-4 mt-1.5 text-[13px]">
          <span><b>{fansCount}</b> <span className="text-[#7F7F7F]">{s.fans}</span></span>
          <span><b>{followsCount}</b> <span className="text-[#7F7F7F]">{s.followsCount}</span></span>
        </div>
        <div className="text-[13px] text-[#9A9A9A] mt-1">暂无简介 ∨</div>
        <button
          {...bindTap({ kind: 'action', id: 'profileSelf.edit.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="w-full h-9 mt-2 rounded-full bg-[#F5F5F5] text-[14px] text-[#1A1A1A] border-none cursor-pointer"
        >
          ✎ {s.editProfile}
        </button>
      </div>

      <div className="flex items-center gap-6 px-4 h-10 bg-white border-t border-[#FAFAFA] shrink-0">
        {TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'profileSelf.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { t === '微博' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
          </button>
        ))}
        <span className="flex-1" />
        <button
          {...bindTap({ kind: 'action', id: 'profileSelf.edit.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[12px] text-[#7F7F7F] bg-transparent border-none cursor-pointer"
        >
          筛选
        </button>
      </div>

      <div className="flex items-center bg-white px-4 py-2 border-t border-[#FAFAFA] shrink-0 gap-4">
        <button
          {...bindTap({ kind: 'action', id: 'profileSelf.edit.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer"
        >
          管理定时发博
        </button>
        <span className="text-[#DDDDDD]">|</span>
        <button {...bindTap('profileSelf.drafts-open')} className="text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer">
          草稿箱
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="profile-self" data-scroll-direction="vertical">
        {tab === '相册' ? (
          myPosts.flatMap((x) => x.images).length ? (
            <div className="grid grid-cols-3 gap-0.5 px-0.5">
              {myPosts.flatMap((x) => x.images).map((img, i) => (
                <Img key={i} src={img} label="图" className="w-full aspect-square object-cover" />
              ))}
            </div>
          ) : <EmptyState text="还没有照片" />
        ) : (
          myPosts.length
            ? myPosts.map((st) => <StatusCard key={st.id} status={st} openTransition="profileSelf.status-open" showFollow={false} />)
            : <EmptyState text={s.emptyFeed} hint="点右上＋发一条微博吧" />
        )}
        <div className="h-4" />
      </div>
      {toastNode}
    </div>
  );
}
