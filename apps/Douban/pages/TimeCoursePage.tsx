import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, TopBar } from '../components/ui';
import { payWithSystem } from '../capabilities';

// 节点: time.course —— 课程详情(P0)。三tab 详情/目录/留言;目录试听×2→startPlayer(假播放);
// 非试听集→toast「订阅后即可收听」;底栏 试听 + 订阅(0元直接订阅;付费走系统支付)。
// evidence: IMG_F1d5e43_t0007/t0035/t0040 · qa:Q2(假播放,进度不真走,跨页驻留)

type Tab = 'detail' | 'toc' | 'comments';

interface Episode {
  no: number;
  title: string;
  sub: string;
  duration: string;
  trial: boolean;
}

const STATIC_COMMENTS = [
  { name: '陈丹青', avatar: '/@app-assets/Douban/avatars/av_chendanqi.png', text: '讲得深入浅出,反复听了三遍,收获很大。', likes: 128 },
  { name: '金色梦乡', avatar: '/@app-assets/Douban/avatars/av_jinse.png', text: '第七讲关于叙事节奏的部分真是点睛之笔。', likes: 64 },
  { name: '桔梗', avatar: '/@app-assets/Douban/avatars/av_jiegeng.png', text: '主讲人声音很有磁性,通勤路上听刚刚好。', likes: 31 },
];

export default function TimeCoursePage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();
  const courseId = routeParams.courseId ?? 'crs_lian';

  const courses = useDoubanStore((s) => s.courses);
  const podcastSubscriptions = useDoubanStore((s) => s.podcastSubscriptions);
  const togglePodcastSubscription = useDoubanStore((s) => s.togglePodcastSubscription);
  const startPlayer = useDoubanStore((s) => s.startPlayer);
  const toast = useDoubanStore((s) => s.toast);

  const course = useMemo(
    () => courses.find((c) => c.id === courseId) ?? courses[0],
    [courses, courseId],
  );
  const isFree = course.price === 0;
  // 订阅态复用 podcastSubscriptions(通用订阅集合,持久化、跨页联动 time.mine)。
  const subscribed = podcastSubscriptions.includes(course.id);

  const [tab, setTab] = useState<Tab>('detail');
  const [reversed, setReversed] = useState(false);

  const episodes = useMemo<Episode[]>(() => {
    const list: Episode[] = [];
    for (let i = 1; i <= course.episodeCount; i++) {
      list.push({
        no: i,
        title: `第${i}讲`,
        sub: i === 1 ? '发刊词 · 我们为什么要听这门课' : `${course.title.slice(0, 6)}·${i}`,
        duration: `${18 + ((i * 7) % 25)}:0${i % 6}`,
        trial: i <= course.trialCount,
      });
    }
    return list;
  }, [course.episodeCount, course.trialCount, course.title]);

  const orderedEpisodes = useMemo(
    () => (reversed ? [...episodes].reverse() : episodes),
    [episodes, reversed],
  );

  const playEpisode = (ep: Episode) => {
    startPlayer({
      title: `${course.title} · ${ep.title}`,
      sub: ep.sub,
      cover: course.cover,
      remainingText: `剩余 ${ep.duration}`,
      playing: true,
      actions: {
        toggle: { id: 'time.course.miniPlayer.toggle' },
        close: { id: 'time.course.miniPlayer.close' },
      },
    });
  };

  const subscribeFree = () => {
    if (!subscribed) togglePodcastSubscription(course.id);
    toast('订阅成功');
  };

  const subscribePaid = () => {
    const launched = payWithSystem(
      { amount: course.price, orderId: `course-${course.id}`, subject: course.title },
      (result) => { if (result.resultCode === 'OK') subscribeFree(); },
    );
    if (!launched) toast('无法打开系统支付');
  };

  const giftPaidCourse = () => {
    const launched = payWithSystem(
      { amount: course.price, orderId: `course-gift-${course.id}`, subject: `赠送《${course.title}》` },
      (result) => { if (result.resultCode === 'OK') toast('赠送成功'); },
    );
    if (!launched) toast('无法打开系统支付');
  };

  const oldPrice = 299;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        right={
          <button
            {...bindTap({ kind: 'action', id: 'time.course.subscribePaid.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-lg"
            style={{ color: C.text }}
            aria-label="更多"
          >
            ⋯
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {/* hero 大图 + 热角标 */}
        <div className="relative w-full shrink-0" style={{ height: 200 }}>
          <Img src={course.cover} className="w-full h-full object-cover" />
          <span
            className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white flex items-center gap-0.5"
            style={{ background: '#E5484D' }}
          >
            🔥 热
          </span>
        </div>

        {/* 标题区 + 赠送好友礼物入口 */}
        <div className="bg-white px-4 pt-3 pb-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 text-[18px] font-bold leading-snug" style={{ color: C.text }}>
              {course.title}
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'time.course.subscribePaid.wontfix' }, { onTrigger: giftPaidCourse })}
              className="shrink-0 flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="4" y="9" width="16" height="11" rx="1" /><path d="M4 13h16M12 9v11" />
                <path d="M12 9c-1.5-3-6-2.5-6 0M12 9c1.5-3 6-2.5 6 0" />
              </svg>
              <span className="text-[10px]">赠送好友</span>
            </button>
          </div>
          {/* 福利价行 */}
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-[13px] px-1.5 py-0.5 rounded" style={{ background: '#FDECE2', color: '#E8702A' }}>
              安叔福利
            </span>
            <span className="text-[20px] font-bold" style={{ color: '#E8702A' }}>{isFree ? '0元' : `${course.price}元`}</span>
            <span className="text-[13px] line-through" style={{ color: '#B9BEC6' }}>{oldPrice}元</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: C.greenSoft, color: C.green }}>
              {course.kind === 'video' ? '视频专栏' : '音频专栏'}
            </span>
            <span className="text-xs" style={{ color: C.sub }}>共{course.episodeCount}期,已更新完毕</span>
          </div>
        </div>

        {/* 主讲人简介卡 */}
        <div className="bg-white mt-2 px-4 py-3.5 flex gap-3">
          <div
            className="w-12 h-12 rounded-full shrink-0 flex items-center justify-center text-lg font-bold text-white"
            style={{ background: '#B4A78F' }}
          >
            {course.author.slice(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold" style={{ color: C.text }}>{course.author}</div>
            <div className="mt-1 text-xs leading-relaxed" style={{ color: '#52616B' }}>
              知名学者、专栏作者。深耕相关领域多年,著有多部广受好评的作品,擅长将艰深的内容娓娓道来。
              <span style={{ color: C.green }}>展开简介›</span>
            </div>
          </div>
        </div>

        {/* 出品方行 */}
        <button
          {...bindTap({ kind: 'action', id: 'time.course.subscribePaid.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-full bg-white mt-2 px-4 h-12 flex items-center gap-2 text-left border-none cursor-pointer"
        >
          <span className="text-[13px]" style={{ color: C.sub }}>出品方</span>
          <span className="flex-1 text-[14px] truncate" style={{ color: C.text }}>豆瓣影人PRO</span>
          <span className="text-[13px]" style={{ color: C.green }}>豆瓣主页</span>
          <span className="text-base" style={{ color: '#C7CCD4' }}>›</span>
        </button>

        {/* 三tab(黑色下划线) */}
        <div className="flex bg-white mt-2 shrink-0 border-b sticky top-0 z-10" style={{ borderColor: C.border }}>
          {([
            ['detail', '详情'],
            ['toc', '目录'],
            ['comments', '留言'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              {...bindTap(
                { kind: 'action', id: 'time.course.tab.select.target' },
                { params: { tab: id }, onTrigger: () => setTab(id) },
              )}
              className="flex-1 h-11 relative bg-transparent border-none cursor-pointer text-sm"
              style={{ color: tab === id ? C.text : C.sub, fontWeight: tab === id ? 700 : 400 }}
            >
              {label}
              {tab === id && (
                <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded" style={{ background: C.text }} />
              )}
            </button>
          ))}
        </div>

        {tab === 'detail' && (
          <div className="p-4 space-y-3">
            <div className="text-sm leading-relaxed" style={{ color: C.text }}>{course.desc}</div>
            <div className="text-base font-bold pt-2" style={{ color: C.text }}>课程简介</div>
            <div className="text-sm leading-relaxed" style={{ color: '#52616B' }}>
              本课程由「{course.author}」倾力打造,共 {course.episodeCount} 期,带你系统梳理核心脉络。
              前 {course.trialCount} 期可免费试听,订阅后可解锁全部内容与离线下载。
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-lg"
                style={{
                  height: 160,
                  background: `linear-gradient(135deg, ${i % 2 ? '#EEF4EE' : '#F3EFE6'}, #FFFFFF)`,
                  border: `1px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        )}

        {tab === 'toc' && (
          <div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold" style={{ color: C.text }}>
                共{course.episodeCount}期(更新完毕)
              </span>
              <button
                {...bindTap({ kind: 'action', id: 'time.course.toc.sort.toggle' }, { onTrigger: () => setReversed((r) => !r) })}
                className="flex items-center gap-1 text-xs bg-transparent border-none cursor-pointer"
                style={{ color: C.green }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M7 4v16M7 20l-3-3M7 4l3 3M17 4v16M17 20l3-3M17 4l-3 3" />
                </svg>
                倒序
              </button>
            </div>
            <div className="bg-white">
              {orderedEpisodes.map((ep) => {
                const playable = ep.trial || course.purchased || subscribed;
                return (
                  <button
                    key={ep.no}
                    {...(playable
                      ? bindTap({ kind: 'action', id: 'time.course.trial.play' }, { params: { episode: ep.no }, onTrigger: () => playEpisode(ep) })
                      : bindTap({ kind: 'action', id: 'time.course.lockedEpisode.wontfix' }, { onTrigger: () => toast('订阅后即可收听') }))}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-transparent border-none cursor-pointer border-b"
                    style={{ borderColor: C.border }}
                  >
                    {/* 绿描边(锁定灰)播放圈 + 「试听」label 在图标下方 */}
                    <div className="flex flex-col items-center gap-0.5 shrink-0" style={{ width: 36 }}>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center border"
                        style={{
                          borderColor: playable ? C.green : '#D5D8DD',
                          color: playable ? C.green : '#B9BEC6',
                          background: 'transparent',
                        }}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </span>
                      {ep.trial && (
                        <span className="text-[9px]" style={{ color: C.green }}>试听</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate" style={{ color: C.text }}>{ep.title}</div>
                      <div className="text-xs truncate mt-0.5" style={{ color: C.sub }}>{ep.sub}</div>
                    </div>
                    <span className="text-[11px] shrink-0" style={{ color: '#B9BEC6' }}>{ep.duration}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'comments' && (
          <div className="bg-white mt-2">
            {STATIC_COMMENTS.map((c, i) => (
              <div key={i} className="flex gap-3 px-4 py-3 border-b" style={{ borderColor: C.border }}>
                <Img src={c.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs" style={{ color: C.sub }}>{c.name}</div>
                  <div className="text-sm mt-0.5 leading-relaxed" style={{ color: C.text }}>{c.text}</div>
                  <div className="text-[11px] mt-1" style={{ color: '#B9BEC6' }}>♡ {c.likes}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底栏:▶试听 纯文字 + 橙色大订阅按钮(免费课也橙色) */}
      <div className="absolute left-0 right-0 bottom-0 flex items-center gap-4 px-4 py-2.5 bg-white border-t shrink-0" style={{ borderColor: C.border }}>
        <button
          {...bindTap({ kind: 'action', id: 'time.course.trial.play' }, { onTrigger: () => playEpisode(episodes[0]) })}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-sm shrink-0"
          style={{ color: C.text }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          {course.kind === 'video' ? '试看' : '试听'}
        </button>
        {subscribed || course.purchased ? (
          <button
            disabled
            className="flex-1 h-10 rounded-full text-sm font-semibold cursor-default"
            style={{ background: '#F2F3F5', color: C.sub, border: 'none' }}
          >
            已订阅
          </button>
        ) : (
          <button
            {...(isFree
              ? bindTap({ kind: 'action', id: 'time.course.subscribe.free' }, { onTrigger: subscribeFree })
              : bindTap({ kind: 'action', id: 'time.course.subscribePaid.wontfix' }, { onTrigger: subscribePaid }))}
            className="flex-1 h-10 rounded-full text-sm font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            style={{ background: '#E8702A', color: '#fff', border: 'none' }}
          >
            <span>订阅 {isFree ? '0元' : `${course.price}元`}</span>
            <span className="line-through text-white/70 text-xs">{oldPrice}元</span>
          </button>
        )}
      </div>
    </div>
  );
}
