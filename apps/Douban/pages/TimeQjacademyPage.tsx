import React, { useMemo, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Avatar, TopBar } from '../components/ui';
import { payWithSystem } from '../capabilities';

// 节点: time.qjacademy —— 青椒学院。头图 + 三tab 专栏/主讲人/学院;专栏rows→time.course;
// 底栏「订阅199元」+「赠送好友」→wontfix。evidence: IMG_0322/0323/0324

type Tab = 'columns' | 'lecturers' | 'academy';

const LECTURERS = [
  { name: '叶嘉莹', title: '南开大学中华古典文化研究所所长', avatar: '/@app-assets/Douban/avatars/av_chendanqi.png' },
  { name: '梁永安', title: '复旦大学中文系教授', avatar: '/@app-assets/Douban/avatars/av_god.png' },
  { name: '赖声川', title: '戏剧导演 · 表演工作坊创始人', avatar: '/@app-assets/Douban/avatars/av_jinse.png' },
  { name: '杨立华', title: '北京大学哲学系教授', avatar: '/@app-assets/Douban/avatars/av_jiegeng.png' },
];

export default function TimeQjacademyPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const courses = useDoubanStore((s) => s.courses);
  const podcastSubscriptions = useDoubanStore((s) => s.podcastSubscriptions);
  const togglePodcastSubscription = useDoubanStore((s) => s.togglePodcastSubscription);
  const [tab, setTab] = useState<Tab>('columns');

  const columnList = useMemo(() => courses, [courses]);

  const subscribeBundle = () => {
    const launched = payWithSystem(
      { amount: 199, orderId: 'qjacademy-bundle', subject: '青椒学院专栏包' },
      (result) => {
        if (result.resultCode !== 'OK') return;
        courses.forEach((course) => {
          if (!podcastSubscriptions.includes(course.id)) togglePodcastSubscription(course.id);
        });
        toast('订阅成功');
      },
    );
    if (!launched) toast('无法打开系统支付');
  };

  const giftBundle = () => {
    const launched = payWithSystem(
      { amount: 199, orderId: 'qjacademy-bundle-gift', subject: '赠送青椒学院专栏包' },
      (result) => { if (result.resultCode === 'OK') toast('赠送成功'); },
    );
    if (!launched) toast('无法打开系统支付');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="青椒学院"
        right={
          <span className="relative inline-flex items-center justify-center w-8 h-8 text-lg" style={{ color: C.text }}>
            ⋯
            <span className="absolute top-1 right-1 rounded-full" style={{ width: 6, height: 6, background: '#E5484D' }} />
          </span>
        }
      />

      {/* 头图 + 右上「赠送好友」浮钮 */}
      <div className="relative shrink-0" style={{ height: 96, background: 'linear-gradient(120deg,#2E7D46,#4CAF6E)' }}>
        <div className="absolute inset-0 flex flex-col justify-center px-5">
          <div className="text-white text-lg font-bold">青椒学院</div>
          <div className="text-white/80 text-xs mt-1">给青年学人的学术成长打包课</div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'time.qjacademy.gift.wontfix' }, { onTrigger: giftBundle })}
          className="absolute top-2 right-3 flex items-center gap-1 px-2.5 h-7 rounded-full text-[11px] cursor-pointer text-white border-none"
          style={{ background: 'rgba(255,255,255,0.22)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="9" width="16" height="11" rx="1" /><path d="M4 13h16M12 9v11" />
            <path d="M12 9c-1.5-3-6-2.5-6 0M12 9c1.5-3 6-2.5 6 0" />
          </svg>
          赠送好友
        </button>
      </div>

      {/* 权益条(hero 下方) */}
      <div className="shrink-0 flex items-center gap-2 px-4 h-9" style={{ background: '#FBF0E6' }}>
        <span className="text-xs font-medium" style={{ color: '#E8702A' }}>青椒联盟巨献</span>
        <span className="text-xs" style={{ color: '#C79A6E' }}>|</span>
        <span className="text-xs font-medium" style={{ color: '#E8702A' }}>4.7折畅听价</span>
      </div>

      {/* 三tab(黑下划线) */}
      <div className="flex bg-white shrink-0 border-b" style={{ borderColor: C.border }}>
        {([
          ['columns', '青椒专栏'],
          ['lecturers', '青椒主讲人'],
          ['academy', '青椒学院'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            {...bindTap(
              { kind: 'action', id: 'time.qjacademy.tab.select.target' },
              { params: { tab: id }, onTrigger: () => setTab(id) },
            )}
            className="flex-1 h-11 relative bg-transparent border-none cursor-pointer text-sm"
            style={{ color: tab === id ? C.text : C.sub, fontWeight: tab === id ? 700 : 400 }}
          >
            {label}
            {tab === id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-8 h-0.5 rounded" style={{ background: C.text }} />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'columns' && (
          <div className="p-3 space-y-3">
            {columnList.map((c) => {
              const free = c.price === 0;
              return (
                <div
                  key={c.id}
                  {...bindTap('time.qjacademy.course-open', { params: { courseId: c.id } })}
                  className="flex gap-3 bg-white rounded-lg p-3 cursor-pointer"
                >
                  <Img src={c.cover} className="rounded object-cover shrink-0" style={{ width: 60, height: 82 }} />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0 text-sm font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>{c.title}</div>
                      <div className="shrink-0 text-right leading-tight">
                        <span className="text-sm font-bold" style={{ color: '#E8702A' }}>{(free ? 0 : c.price).toFixed(2)}元</span>
                        {free && <div className="text-[10px] line-through" style={{ color: '#B9BEC6' }}>19.00元</div>}
                      </div>
                    </div>
                    <div className="mt-1 text-xs leading-snug line-clamp-1" style={{ color: C.sub }}>
                      16个佛系关键词,带你在喧嚣里安顿身心
                    </div>
                    <div className="mt-auto text-xs truncate" style={{ color: C.sub }}>主讲人 {c.author}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'lecturers' && (
          <div className="bg-white mt-2">
            {LECTURERS.map((l) => (
              <div key={l.name} className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: C.border }}>
                <Avatar src={l.avatar} size={44} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{l.name}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: C.sub }}>{l.title}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'academy' && (
          <div className="p-4 space-y-3">
            <div className="text-sm leading-relaxed" style={{ color: '#52616B' }}>
              青椒学院是豆瓣时间为青年学人打造的学术成长平台。从选题、文献综述到论文投稿,
              我们邀请一线学者拆解学术写作的每一个环节,陪你走过从入门到发表的完整旅程。
            </div>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="rounded-lg"
                style={{ height: 180, background: `linear-gradient(135deg,${i % 2 ? '#EAF6EC' : '#EAF0FA'},#FFFFFF)`, border: `1px solid ${C.border}` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底栏:左侧打包文案 + 橙色方角订阅按钮(带划线原价) */}
      <div className="absolute left-0 right-0 bottom-0 flex items-center gap-3 px-4 py-2.5 bg-white border-t" style={{ borderColor: C.border }}>
        <div className="flex-1 min-w-0 text-xs leading-snug" style={{ color: C.sub }}>
          共15个专栏,打包购买仅<span style={{ color: '#E8702A' }}>4.7折</span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'time.qjacademy.subscribePaid.wontfix' }, { onTrigger: subscribeBundle })}
          className="shrink-0 px-5 h-10 rounded-lg text-sm font-semibold cursor-pointer flex items-center gap-1.5"
          style={{ background: '#E8702A', color: '#fff', border: 'none' }}
        >
          <span>订阅199元</span>
          <span className="line-through text-white/70 text-xs">425元</span>
        </button>
      </div>
    </div>
  );
}
