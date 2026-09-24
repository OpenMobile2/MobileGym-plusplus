import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, VipTag, showToast, formatCount } from '../components/ui';
import { IcNavBack, IcPencil, IcMedal, IcHeadphones, IcChevronRight, IcLike } from '../res/icons';

const WORK_TAB = '作品';
const FEED_TAB = '动态';
const FEED_SUBTABS = ['最近发布', '节目评论', '专辑评价'] as const;
const FEED_COMMENTS = ['哈哈哈,真好笑', '这一段讲得太透彻了,来回听了好几遍', '主播声音好治愈,睡前必听'];

export function ProfilePage() {
  const { bindTap, bindBack } = useXimalayaGestures();
  const user = useXimalayaStore((st) => st.user);
  const albums = useXimalayaStore((st) => st.albums);
  const [tab, setTab] = useState<string>(WORK_TAB);
  const [subtab, setSubtab] = useState<string>(FEED_SUBTABS[0]);

  const works = albums.slice(0, 4);
  const feed = albums.slice(0, 3);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 头图 + 返回 */}
      <div className="shrink-0 relative bg-gradient-to-b from-[#FE4543] to-[#C4302B] px-4 pb-4">
        <div className="h-9 flex items-center">
          <button {...bindBack()} aria-label="返回" className="w-9 h-9 -ml-2 flex items-center justify-center text-white">
            <IcNavBack size={26} />
          </button>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <Img src={user.avatar} className="w-16 h-16 rounded-full object-cover border-2 border-white/60" />
          <div className="flex-1 min-w-0 text-white">
            <div className="flex items-center gap-2">
              <span className="text-[18px] font-semibold truncate">{user.name}</span>
              <span className="text-[10px] px-1 rounded bg-white/25">LV{user.level}</span>
              {user.isVip && <VipTag />}
            </div>
            <div {...bindTap('profile.listen-open')} className="text-[12px] text-white/85 mt-1 inline-flex w-fit items-center">累计收听 {user.listenHours} 小时<IcChevronRight size={12} className="opacity-70" /></div>
          </div>
        </div>
        {/* 粉丝/关注/访客 */}
        <div className="flex items-center gap-6 mt-3 text-white">
          <button {...bindTap('profile.fans-open')}><span className="text-[16px] font-semibold">{formatCount(user.fans)}</span><span className="text-[12px] text-white/80 ml-1">粉丝</span></button>
          <button {...bindTap('profile.follows-open')}><span className="text-[16px] font-semibold">{formatCount(user.follows)}</span><span className="text-[12px] text-white/80 ml-1">关注</span></button>
          <div><span className="text-[16px] font-semibold">128</span><span className="text-[12px] text-white/80 ml-1">访客</span></div>
        </div>
        {/* 编辑资料 / 勋章 */}
        <div className="flex items-center gap-2 mt-3">
          <button {...bindTap('profile.edit-open')} className="flex items-center gap-1 h-8 px-3 rounded-full bg-white/20 text-white text-[13px]">
            <IcPencil size={14} />编辑资料
          </button>
          <button {...bindTap('profile.badges-open')} className="flex items-center gap-1 h-8 px-3 rounded-full bg-white/20 text-white text-[13px]">
            <IcMedal size={14} />勋章
          </button>
        </div>
      </div>

      {/* 相册(上传照片)wontfix */}
      <div className="shrink-0 bg-white px-4 py-2.5 flex items-center justify-between border-b border-[#F5F5F5]">
        <span className="text-[13px] text-[#666]">相册</span>
        <button
          {...bindTap({ kind: 'action', id: 'profile.upload.wontfix' }, { onTrigger: () => showToast('该功能暂未开放') })}
          className="text-[13px] text-[#999] flex items-center gap-0.5"
        >
          上传照片<IcChevronRight size={14} />
        </button>
      </div>

      {/* 作品/动态 Tab */}
      <div className="shrink-0 flex items-center gap-6 px-4 h-11 bg-white text-[15px] border-b border-[#F2F2F2]">
        {[WORK_TAB, FEED_TAB].map((t) => {
          const active = t === tab;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'profile.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTab(t) })}
              className={active ? 'text-[#333] font-semibold border-b-2 border-[#FE4543] h-11' : 'text-[#999] h-11'}
            >
              {t}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {tab === FEED_TAB && (
          <div className="flex items-center gap-4 px-4 py-2 bg-white text-[13px] overflow-x-auto" data-scroll-container data-scroll-direction="horizontal">
            {FEED_SUBTABS.map((st) => {
              const active = st === subtab;
              return (
                <button
                  key={st}
                  {...bindTap({ kind: 'action', id: 'profile.subtab.select.opt' }, { params: { tab: st }, onTrigger: () => setSubtab(st) })}
                  className={'shrink-0 px-2.5 h-7 rounded-full ' + (active ? 'bg-[#FFF0EF] text-[#FE4543]' : 'bg-[#F5F5F5] text-[#666]')}
                >
                  {st}
                </button>
              );
            })}
          </div>
        )}

        <div className="p-3 flex flex-col gap-3">
          {/* 作品:横向卡(封面左 + 标题右) */}
          {tab === WORK_TAB && works.map((a) => (
            <div key={a.id} {...bindTap('profile.card-open', { params: { id: a.id } })} className="bg-white rounded-xl p-2.5 flex gap-3">
              <Img src={a.cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0 flex flex-col">
                <div className="text-[14px] text-[#333] font-medium line-clamp-2">{a.title}</div>
                <div className="mt-auto flex items-center justify-between text-[11px] text-[#999]">
                  <span className="truncate">{a.anchorName}</span>
                  <span className="flex items-center gap-0.5"><IcHeadphones size={11} />{formatCount(a.playCount)}</span>
                </div>
              </div>
            </div>
          ))}

          {/* 动态/评论:评论文字在上,作品缩略图行在下 */}
          {tab === FEED_TAB && feed.map((a, i) => (
            <div key={a.id} {...bindTap('profile.card-open', { params: { id: a.id } })} className="bg-white rounded-xl p-3 flex flex-col gap-2.5">
              {/* 评论人头部 */}
              <div className="flex items-center gap-2">
                <Img src={user.avatar} className="w-7 h-7 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#333] truncate">{user.name}</div>
                  <div className="text-[11px] text-[#BBB] mt-0.5">{subtab}</div>
                </div>
                <IcLike size={16} className="text-[#CCC] shrink-0" />
              </div>
              {/* 评论文字(上方) */}
              <div className="text-[14px] text-[#333] leading-snug">{FEED_COMMENTS[i % FEED_COMMENTS.length]}</div>
              {/* 评论的作品(下方一行:小封面 + 作品名/主播/播放量) */}
              <div className="flex items-center gap-2.5 bg-[#F7F7F7] rounded-lg p-2">
                <Img src={a.cover} className="w-11 h-11 rounded-md object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#333] truncate">{a.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#999]">
                    <span className="truncate">{a.anchorName}</span>
                    <span className="flex items-center gap-0.5 shrink-0"><IcHeadphones size={11} />{formatCount(a.playCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
