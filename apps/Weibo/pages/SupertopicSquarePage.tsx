import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, Img } from '../components/ui';
import { IcClose, IcDiscover } from '../res/icons';

export default function SupertopicSquarePage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  const supertopics = useWeiboStore((st) => st.supertopics);
  const statuses = useWeiboStore((st) => st.statuses);
  const signAll = useWeiboStore((st) => st.signAllSupertopics);

  const mySts = supertopics.filter((t) => t.followed);
  const hasUnsigned = mySts.some((t) => !t.signedToday);
  const posts = statuses.filter((x) => x.supertopicId);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      <div className="flex items-center h-11 px-2 bg-white shrink-0">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[#1A1A1A] p-1"><IcClose size={22} /></button>
        <div className="flex-1 text-center text-[16px] font-semibold">超话社区</div>
        <button
          {...bindTap({ kind: 'action', id: 'supertopicSquare.create.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="text-[13px] text-[#5B5B5B] bg-transparent border-none cursor-pointer mr-2"
        >
          创建
        </button>
        <button {...bindTap('supertopicSquare.search-open')} className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-1">
          <IcDiscover size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="square-feed" data-scroll-direction="vertical">
        {/* 我的超话 */}
        <div className="bg-white p-3 mb-2">
          <div className="flex items-center mb-2">
            <span className="text-[14px] font-bold">我的超话</span>
            <span className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'supertopicSquare.signAll.submit' }, {
                onTrigger: () => { if (hasUnsigned) { signAll(); toast(s.signedToast); } else { toast('今天都签过啦'); } },
              })}
              className="text-[13px] text-[#FF8200] bg-transparent border-none cursor-pointer"
            >
              一键签到 &gt;
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto" data-scroll-container="my-supertopics" data-scroll-direction="horizontal">
            {(mySts.length ? mySts : supertopics.slice(0, 5)).map((t) => (
              <button
                key={t.id}
                {...bindTap('supertopicSquare.supertopic-open', { params: { id: t.id } })}
                className="shrink-0 w-16 bg-transparent border-none cursor-pointer p-0"
              >
                <div className="relative">
                  <Img src={t.cover} label={t.name[0]} className="w-16 h-16 rounded-lg object-cover" />
                  {!t.signedToday && t.followed && (
                    <span className="absolute top-0.5 right-0.5 text-[8px] text-white bg-[#FF8200] rounded px-1">待签</span>
                  )}
                </div>
                <div className="text-[11px] text-[#1A1A1A] truncate mt-1 text-center">{t.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 榜单/超友趣卡(wontfix壳) */}
        <div className="flex gap-2 px-2 mb-2">
          {['超话榜单 查看完整榜单>', '超友趣 组队活动找搭子>'].map((label) => (
            <button
              key={label}
              {...bindTap({ kind: 'action', id: 'supertopicSquare.rank.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="flex-1 h-16 rounded-xl bg-gradient-to-r from-[#EFE7FF] to-[#E3F0FF] text-[12px] text-[#5B5B5B] border-none cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>

        {/* 帖子流 */}
        {posts.map((st) => {
          const topic = supertopics.find((t) => t.id === st.supertopicId);
          return (
            <div key={st.id} className="relative">
              {topic && (
                <button
                  {...bindTap('supertopicSquare.postSupertopic-open', { params: { id: topic.id } })}
                  className="absolute left-3 top-3 z-10 flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0"
                  data-role="post-supertopic-entry"
                >
                  <Img src={topic.cover} label={topic.name[0]} className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-[13px] text-[#E68A3C] font-medium">{topic.name}超话</span>
                </button>
              )}
              <div className="pt-8 bg-white mb-2">
                <StatusCard status={st} openTransition="supertopicSquare.status-open" userTransition="home.user-open" showFollow={false} />
              </div>
            </div>
          );
        })}
        <div className="text-center text-[12px] text-[#BBBBBB] py-4">已经到底啦~</div>
      </div>
      {toastNode}
    </div>
  );
}
