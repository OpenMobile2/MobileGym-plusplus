import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, fmtCount, FollowBtn } from '../components/ui';
import { IcSettings, IcScan, IcAddFriend, IcRight } from '../res/icons';

const GRID = [
  { label: '我的相册', icon: '🖼️', action: 'stub' },
  { label: '赞/收藏', icon: '⭐', action: 'likes' },
  { label: '浏览记录', icon: '🕐', action: 'history' },
  { label: '草稿箱', icon: '📝', action: 'drafts' },
  { label: '我的钱包', icon: '💰', action: 'stub' },
  { label: '微博购订单', icon: '🛍️', action: 'stub' },
  { label: '创作中心', icon: '✨', action: 'stub' },
  { label: '粉丝头条', icon: '📣', action: 'stub' },
] as const;

export default function MinePage() {
  const s = useStrings();
  const { bindTap } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  const me = useWeiboStore((st) => st.me);
  const loggedIn = useWeiboStore((st) => st.session.loggedIn);
  const statuses = useWeiboStore((st) => st.statuses);
  const users = useWeiboStore((st) => st.users);
  const supertopics = useWeiboStore((st) => st.supertopics);
  const followUser = useWeiboStore((st) => st.followUser);

  const frequent = users.filter((u) => u.frequentInfo);
  const recommend = users.filter((u) => !u.followedByMe).slice(0, 3);
  // 计数一律从数据派生,保证与列表页一致(走查反馈:微博/粉丝数对不上)
  const followsCount = users.filter((u) => u.followedByMe).length;
  const fansCount = users.filter((u) => u.followsMe).length;
  const postCount = statuses.filter((x) => x.userId === 'me').length;

  // 未登录守卫(走查反馈:退出后点「我」应引导登录)
  if (!loggedIn) {
    return (
      <div className="flex flex-col h-full bg-[#F2F2F2] items-center justify-center gap-4 px-8">
        <Img src={me.avatar} label="我" className="w-20 h-20 rounded-full object-cover opacity-40" />
        <div className="text-[15px] text-[#7F7F7F] text-center">登录后查看你的微博、关注与消息</div>
        <button
          {...bindTap('home.login-open')}
          className="h-10 px-10 rounded-full bg-[#FF8200] text-white text-[15px] border-none cursor-pointer"
        >
          {s.login}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      <div className="flex-1 overflow-y-auto" data-scroll-container="mine-scroll" data-scroll-direction="vertical">
        {/* 顶部个人区 */}
        <div className="bg-white px-4 pt-2 pb-3">
          <div className="flex items-center justify-end gap-4 mb-1">
            <button {...bindTap({ kind: 'action', id: 'mine.marketing.stub' }, { onTrigger: () => toast(s.notOpen) })} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-0 relative">
              <IcAddFriend size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#FF3852]" />
            </button>
            <button {...bindTap({ kind: 'action', id: 'mine.marketing.stub' }, { onTrigger: () => toast(s.notOpen) })} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-0">
              <IcScan size={20} />
            </button>
            <button {...bindTap('mine.settings-open')} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-0">
              <IcSettings size={20} />
            </button>
          </div>
          <div {...bindTap('mine.profile-open')} className="flex items-center gap-3 cursor-pointer">
            <Img src={me.avatar} label="我" className="w-16 h-16 rounded-full object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[18px] font-bold text-[#1A1A1A] truncate">{me.name}</div>
              <div className="text-[12px] text-[#9A9A9A] mt-0.5">简介:{me.intro || '暂无简介'}</div>
              <span className="inline-flex items-center text-[11px] text-[#41C468] bg-[#EDF9EF] rounded-full px-2 py-0.5 mt-1">在线 &gt;</span>
            </div>
          </div>
          {/* 领会员 banner */}
          <button
            {...bindTap({ kind: 'action', id: 'mine.marketing.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="flex items-center w-full mt-3 bg-gradient-to-r from-[#FFF3D6] to-[#FFE3B8] rounded-lg px-3 py-2 border-none cursor-pointer"
          >
            <span className="text-[13px] text-[#8A5A00]">👑 领会员 点亮VIP皇冠 &gt;</span>
            <span className="flex-1" />
            <span className="text-[11px] text-white bg-[#FF8200] rounded-full px-2 py-0.5">速领</span>
          </button>
          {/* 计数行 */}
          <div className="flex mt-3">
            <button {...bindTap('mine.myPosts-open')} className="flex-1 flex flex-col items-center bg-transparent border-none cursor-pointer">
              <span className="text-[17px] font-bold text-[#1A1A1A]">{fmtCount(postCount)}</span>
              <span className="text-[12px] text-[#7F7F7F]">{s.myWeibo}</span>
            </button>
            <button {...bindTap('mine.follows-open')} className="flex-1 flex flex-col items-center bg-transparent border-none cursor-pointer">
              <span className="text-[17px] font-bold text-[#1A1A1A]">{fmtCount(followsCount)}</span>
              <span className="text-[12px] text-[#7F7F7F]">{s.followsCount}</span>
            </button>
            <button {...bindTap('mine.fans-open')} className="flex-1 flex flex-col items-center bg-transparent border-none cursor-pointer">
              <span className="text-[17px] font-bold text-[#1A1A1A]">{fmtCount(fansCount)}</span>
              <span className="text-[12px] text-[#7F7F7F]">{s.fans}</span>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'mine.visitors.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="flex-1 flex flex-col items-center bg-transparent border-none cursor-pointer"
            >
              <span className="text-[17px] font-bold text-[#1A1A1A]">{me.visitors}</span>
              <span className="text-[12px] text-[#7F7F7F]">{s.visitors}</span>
            </button>
          </div>
        </div>

        {/* 宫格 */}
        <div className="bg-white rounded-xl mx-2 mt-2 p-3 grid grid-cols-4 gap-y-4">
          {GRID.map((g) => (
            <button
              key={g.label}
              {...(g.action === 'likes' ? bindTap('mine.likes-open')
                : g.action === 'history' ? bindTap('mine.history-open')
                : g.action === 'drafts' ? bindTap('mine.drafts-open')
                : bindTap({ kind: 'action', id: 'mine.grid.stub' }, { onTrigger: () => toast(s.notOpen) }))}
              className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer"
            >
              <span className="text-[24px]">{g.icon}</span>
              <span className="text-[12px] text-[#1A1A1A]">{g.label}</span>
            </button>
          ))}
        </div>

        {/* 任务/签到卡(wontfix) */}
        <div className="grid grid-cols-2 gap-2 mx-2 mt-2">
          {['任务中心 今日待领645积分', '每日签到 点击领0.05元'].map((label) => (
            <button
              key={label}
              {...bindTap({ kind: 'action', id: 'mine.marketing.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="h-14 rounded-xl bg-white text-[12px] text-[#5B5B5B] border-none cursor-pointer px-2"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 我的访问记录 */}
        <div className="bg-white rounded-xl mx-2 mt-2 p-3">
          <div className="flex items-center mb-2">
            <span className="text-[14px] font-bold">我的访问记录</span>
            <span className="flex-1" />
            <button {...bindTap('mine.history-open')} className="text-[12px] text-[#9A9A9A] bg-transparent border-none cursor-pointer flex items-center">
              查看全部 <IcRight size={13} />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto" data-scroll-container="visited-users" data-scroll-direction="horizontal">
            {frequent.map((u) => (
              <button
                key={u.id}
                {...bindTap('mine.visitedUser-open', { params: { id: u.id } })}
                className="shrink-0 w-14 bg-transparent border-none cursor-pointer p-0"
              >
                <Img src={u.avatar} label={u.name[0]} className="w-12 h-12 rounded-full object-cover mx-auto" />
                <div className="text-[10px] text-[#5B5B5B] truncate mt-1">{u.name}</div>
                <div className="text-[9px] text-[#BBBBBB] truncate">{u.frequentInfo}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 超话社区 */}
        <div className="bg-white rounded-xl mx-2 mt-2 p-3">
          <div className="flex items-center mb-2">
            <span className="text-[14px] font-bold">超话社区</span>
            <span className="flex-1" />
            <span className="text-[12px] text-[#9A9A9A]">查看全部</span>
          </div>
          <div className="flex gap-2 overflow-x-auto" data-scroll-container="mine-supertopics" data-scroll-direction="horizontal">
            {supertopics.slice(0, 6).map((t) => (
              <button
                key={t.id}
                {...bindTap('mine.supertopic-open', { params: { id: t.id } })}
                className="shrink-0 w-20 bg-transparent border-none cursor-pointer p-0"
              >
                <Img src={t.cover} label={t.name[0]} className="w-20 h-14 rounded-lg object-cover" />
                <div className="text-[11px] text-[#1A1A1A] truncate mt-1">{t.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 运营区块(wontfix) */}
        <div className="grid grid-cols-2 gap-2 mx-2 mt-2">
          {['微博购 兴趣周边在售', '账号与安全 立即确认', '超友趣 组队找搭子', '更多功能'].map((label) => (
            <button
              key={label}
              {...bindTap({ kind: 'action', id: 'mine.marketing.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="h-12 rounded-xl bg-white text-[12px] text-[#5B5B5B] border-none cursor-pointer px-2"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 为你推荐 */}
        <div className="bg-white rounded-xl mx-2 mt-2 mb-3 p-3">
          <div className="text-[14px] font-bold mb-2">为你推荐</div>
          {recommend.map((u) => (
            <div key={u.id} className="flex items-center gap-2.5 py-2">
              <Img src={u.avatar} label={u.name[0]} className="w-10 h-10 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#E68A3C] truncate">{u.name}</div>
                <div className="text-[11px] text-[#9A9A9A] truncate">粉丝数{fmtCount(u.fans)} {u.intro}</div>
              </div>
              <FollowBtn
                binding={bindTap({ kind: 'action', id: 'mine.recoFollow.toggle' }, {
                  params: { userId: u.id },
                  onTrigger: () => followUser(u.id),
                })}
              />
            </div>
          ))}
        </div>
      </div>
      {toastNode}
    </div>
  );
}
