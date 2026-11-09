import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { shareWithSystem } from '../capabilities';
import { realNow } from '@/os/TimeService';
import { BottomSheet, CenterDialog } from '../components/Sheet';
import { WheelPicker } from '../components/WheelPicker';
import { Card, C, Chip, PrimaryBtn, Row, ToggleRow, TopBar } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { Img } from '../res/images';
import { useKeepStore } from '../state';
import type { KeepActionItem, KeepCourse } from '../types';
import { resolveKeepProfile } from '../store/profileHelpers';

const action = (id: string) => ({ kind: 'action' as const, id });

function WontfixButton({ id, children, className = '' }: { id: string; children: React.ReactNode; className?: string }) {
  const { bindTap } = useKeepGestures();
  const toast = useKeepStore((s) => s.toast);
  const strings = useKeepStrings();
  return (
    <button {...bindTap(action(id), { onTrigger: () => toast(strings.notOpen) })} className={className}>
      {children}
    </button>
  );
}

function selectedCourse(courses: KeepCourse[], id: string | null | undefined): KeepCourse | undefined {
  return courses.find((c) => c.id === id);
}

function TrainingSecondaryControls() {
  const { bindTap } = useKeepGestures();
  const [params, setParams] = useSearchParams();
  const toast = useKeepStore((s) => s.toast);
  const expanded = params.get('drawer') === '1';
  const landscape = params.get('orientation') === 'landscape';
  return <div className="absolute right-3 bottom-36 flex flex-col gap-2"><button {...bindTap(action('course.training.orientation.toggle'), { onTrigger: () => setParams((p) => { p.set('orientation', landscape ? 'portrait' : 'landscape'); return p; }, { replace: true }) })} className="px-2 py-1 rounded bg-black/45 border-none text-white text-xs">{landscape ? '竖屏' : '全屏'}</button><button {...bindTap(action('course.training.drawer.toggle'), { onTrigger: () => setParams((p) => { p.set('drawer', expanded ? '0' : '1'); return p; }, { replace: true }) })} className="px-2 py-1 rounded bg-black/45 border-none text-white text-xs">{expanded ? '收起数据' : '训练数据'}</button><button {...bindTap(action('course.training.quality.wontfix'), { onTrigger: () => toast('该功能暂未开放') })} className="px-2 py-1 rounded bg-black/45 border-none text-white text-xs">高清</button></div>;
}

function CoachAuxControls({ tab }: { tab: string }) {
  const { bindTap } = useKeepGestures();
  const [params, setParams] = useSearchParams();
  const toast = useKeepStore((s) => s.toast);
  const chip = params.get('chip') ?? '动态';
  if (tab === '课程') return <button {...bindTap(action('coach.profile.courseSearch.wontfix'), { onTrigger: () => toast('该功能暂未开放') })} className="w-full mb-3 px-4 py-2 rounded-full border-none bg-white text-left text-app-text-muted">⌕ 搜索他的课程</button>;
  if (tab === '动态') return <><div className="flex gap-2 mb-3 overflow-x-auto">{['动态','视频','相册','可跟练'].map((x) => <button key={x} {...bindTap(action('coach.profile.feedChips.switch'), { params: { chip: x }, onTrigger: () => setParams({ tab, chip: x }, { replace: true }) })} className={`px-3 py-1.5 rounded-full border-none ${chip === x ? 'bg-black text-white' : 'bg-white'}`}>{x}</button>)}</div><button {...bindTap(action('coach.profile.goalbook.wontfix'), { onTrigger: () => toast('该功能暂未开放') })} className="w-full mb-3 p-3 rounded-xl border-none bg-white text-left">目标记录本 ›</button></>;
  return null;
}

export function CourseDetailPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const courses = useKeepStore((st) => st.courses);
  const coaches = useKeepStore((st) => st.coaches);
  const current = useKeepStore((st) => st.current);
  const wishCourses = useKeepStore((st) => st.wishCourses) ?? [];
  const wishCourseIds = useKeepStore((st) => st.wishCourseIds) ?? [];
  const wished = Array.from(new Set([...wishCourses, ...wishCourseIds]));
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const courseWishToggle = useKeepStore((st) => st.courseWishToggle);
  const trainingStart = useKeepStore((st) => st.trainingStart);
  const toast = useKeepStore((st) => st.toast);
  const c = selectedCourse(courses, current.courseId);
  if (!c) {
    return (
      <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
        <TopBar title="课程详情" />
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-[15px] text-app-text font-medium">未找到该课程</div>
          <p className="text-[13px] text-app-text-muted mt-2">请返回列表重新选择</p>
        </div>
      </div>
    );
  }
  const coach = coaches.find((x) => x.id === c.coachId);
  const isWished = wished.includes(c.id);
  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      <TopBar
        right={<button
          {...bindTap(action('course.detail.share.submit'), {
            onTrigger: () => {
              const launched = shareWithSystem(
                `【Keep】${c.title}`,
                (result) => { if (result.resultCode === 'OK') toast('分享成功'); },
              );
              if (!launched) toast(s.notOpen);
            },
          })}
          aria-label="分享"
          className="w-9 h-9 rounded-full border-none bg-transparent text-xl"
        >↗</button>}
      />
      <div className="flex-1 overflow-y-auto pb-5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative h-64 mx-3 shrink-0 overflow-hidden bg-[#422465]">
          <Img id={c.cover} className="absolute inset-0 w-full h-full object-cover object-center" alt={c.title} />
          <div className="absolute inset-0 bg-[#4b2370]/25" />
          <WontfixButton id="course.detail.segments.wontfix" className="absolute inset-0 m-auto w-14 h-14 rounded-full border-none bg-white/25 text-white text-2xl">▶</WontfixButton>
          <WontfixButton id="course.detail.segments.wontfix" className="absolute right-3 bottom-3 px-3 py-2 rounded-full border-none bg-white/75 text-[#6f3f6b] text-xs font-semibold">课程分段</WontfixButton>
        </div>
        <div className="px-4 pt-3">
          <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#fff9e7] text-sm"><span className="text-amber-400">★</span>{c.rating.toFixed(1)} 分</div>
        </div>
        {c.isMember && (
          <button {...bindTap('member.center.open.fromCourse')} className="mx-4 mt-3 w-[calc(100%-2rem)] rounded-xl border-none bg-gradient-to-r from-violet-700 to-fuchsia-500 text-white px-4 py-3 text-left">
            学生专属，首月仅需 ¥4 <span className="float-right">立即开通 ›</span>
          </button>
        )}
        <div className="px-4 pt-3">
          <h1 className="text-[25px] font-bold text-app-text leading-tight">{c.title}</h1>
          <div className="grid grid-cols-[1fr_1fr_1.25fr_2fr] items-center mt-5">
            <div><b className="text-lg">{c.level}</b><small className="block text-app-text-muted">{c.level.includes('K2') ? '初学' : '强化'}</small></div>
            <div><b className="text-lg">{c.minutes}</b><small className="block text-app-text-muted">分钟</small></div>
            <div><b className="text-lg">{c.kcalRange.replace('千卡','')}</b><small className="block text-app-text-muted">千卡</small></div>
            <div className="justify-self-end px-2 py-2 bg-emerald-50 text-emerald-600 text-xs leading-5">⌚ Keep 手环<br/>精准测量消耗</div>
          </div>
          <button
            {...bindTap('coach.profile.open.fromCourse', {
              params: { coachId: coach?.id ?? 'coach_maoshu' },
              beforeTrigger: () => setCurrent('coachId', coach?.id ?? 'coach_maoshu'),
            })}
            className="flex items-center gap-2 mt-5 bg-transparent border-none p-0"
          >
            <Img id={coach?.avatar ?? 'coach_maoshu'} className="w-10 h-10 rounded-full object-cover" alt={c.coach} />
            <span className="text-sm font-medium text-app-text">{c.coach}</span><span className="text-app-text-muted">›</span>
          </button>
          <p className="text-sm leading-6 text-app-text-muted mt-4 line-clamp-2">{c.description} <b className="text-app-text">更多</b></p>
        </div>
        <div className="grid grid-cols-5 border-y border-app-border mt-4 py-4">
          <button {...bindTap(action('course.detail.wish.toggle'), { onTrigger: () => courseWishToggle(c.id) })} className="bg-transparent border-none text-xs text-emerald-500"><span className="text-2xl">≡</span><br />{isWished ? s.wished : s.wish}</button>
          <button {...bindTap('course.calendar.open')} className="bg-transparent border-none text-xs text-app-text"><span className="text-2xl">▣</span><br />{s.addCalendar}</button>
          <WontfixButton id="course.detail.cast.wontfix" className="bg-transparent border-none text-xs text-app-text"><span className="text-2xl">▰</span><br />投屏</WontfixButton>
          <button {...bindTap('course.comments.open')} className="bg-transparent border-none text-xs text-app-text"><span className="text-2xl">◔</span><br />评论{c.commentsCount > 999 ? '999+' : c.commentsCount}</button>
          <button {...bindTap('course.community.open')} className="bg-transparent border-none text-xs text-app-text"><span className="text-2xl">◴</span><br />练过{c.practiced}</button>
        </div>
        <button {...bindTap('team.list.open')} className="mx-4 my-4 w-[calc(100%-2rem)] flex items-center justify-between p-4 rounded-xl border-none bg-app-bg text-app-text"><span>和 Keepers 一起组队练</span><span>›</span></button>
      </div>
      <div className="relative h-20 px-4 border-t border-app-border bg-app-surface shrink-0 flex items-center justify-between">
        <WontfixButton id="course.detail.trainMode.wontfix" className="w-[35%] py-3 rounded-full border-none bg-app-bg text-app-text">⚙ 训练模式</WontfixButton>
        <button
          {...bindTap('course.training.open', { beforeTrigger: () => trainingStart(c.id) })}
          className="absolute left-1/2 -translate-x-1/2 -top-7 w-24 h-24 rounded-full border-[7px] border-app-surface text-white text-4xl italic font-black shadow-lg"
          style={{ background: C.green }}
        >GO</button>
        <WontfixButton id="course.detail.equip.wontfix" className="ml-auto w-[35%] py-3 rounded-full border-none bg-app-bg text-app-text">♟ 装备</WontfixButton>
      </div>
    </div>
  );
}

export function CourseCommentsPage() {
  const { bindTap } = useKeepGestures();
  const courses = useKeepStore((s) => s.courses);
  const current = useKeepStore((s) => s.current);
  const liked = useKeepStore((s) => s.likedComments) ?? [];
  const publish = useKeepStore((s) => s.commentPublish);
  const like = useKeepStore((s) => s.commentLikeToggle);
  const c = selectedCourse(courses, current.courseId);
  const [params, setParams] = useSearchParams();
  const [text, setText] = React.useState('');
  const sort = params.get('sort') ?? '推荐';
  if (!c) {
    return (
      <BottomSheet title="全部评论" heightClass="h-[86%]">
        <div className="py-16 text-center text-sm text-app-text-muted">未找到该课程评论</div>
      </BottomSheet>
    );
  }
  const comments = sort === '时间' ? [...c.comments].reverse() : c.comments;
  return (
    <BottomSheet title={`全部评论 ${c.commentsCount}`} heightClass="h-[86%]">
      <div className="flex gap-2 mb-3">
        {['推荐', '时间'].map((x) => <Chip key={x} active={sort === x} bind={bindTap(action('course.comments.sort.switch'), { params: { sort: x }, onTrigger: () => setParams({ sort: x }, { replace: true }) })}>按{x}</Chip>)}
      </div>
      <div className="space-y-4 pb-20">
        {comments.map((cm) => (
          <div key={cm.id} className="border-b border-app-border pb-4">
            <div className="flex gap-3">
              <Img id={cm.avatar} className="w-9 h-9 rounded-full object-cover" alt={cm.author} />
              <div className="flex-1"><div className="text-sm font-semibold text-app-text">{cm.author}</div><div className="text-xs text-app-text-muted">{cm.time} · {cm.region}</div></div>
              <button {...bindTap(action('course.comments.like.toggle'), { params: { commentId: cm.id }, onTrigger: () => like(cm.id) })} className="bg-transparent border-none text-xs text-app-text-muted">{liked.includes(cm.id) ? '♥' : '♡'} {cm.likes + (liked.includes(cm.id) ? 1 : 0)}</button>
            </div>
            <p className="ml-12 mt-2 text-sm leading-6 text-app-text">{cm.content}</p>
            {cm.replies.length > 0 && <button {...bindTap(action('course.comments.replies.expand'), { onTrigger: () => setParams({ sort, replies: cm.id }, { replace: true }) })} className="ml-12 p-2 w-[calc(100%-3rem)] text-left border-none rounded-lg bg-app-bg text-xs text-app-text-muted">{cm.replies.slice(0, params.get('replies') === cm.id ? undefined : 1).map((r) => `${r.author}：${r.content}`).join('\n')}<br />查看{cm.replies.length}条回复 ›</button>}
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 inset-x-0 p-3 bg-app-surface border-t border-app-border flex gap-2" data-keep-keyboard="true">
        <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 rounded-full bg-app-bg border-none px-4 text-sm" placeholder="说点什么" />
        <button {...bindTap(action('course.comments.publish'), { onTrigger: () => { publish(c.id, text); setText(''); } })} className="px-4 py-2 rounded-full text-white border-none" style={{ background: C.green }}>发布</button>
      </div>
    </BottomSheet>
  );
}

export function CourseCommunityPage() {
  const { bindTap } = useKeepGestures();
  const current = useKeepStore((s) => s.current);
  const courses = useKeepStore((s) => s.courses);
  const setCurrent = useKeepStore((s) => s.setCurrent);
  const followedUsers = useKeepStore((s) => s.followedUsers) ?? [];
  const followedNames = useKeepStore((s) => s.followedNames) ?? [];
  const followedCoaches = useKeepStore((s) => s.followedCoaches) ?? [];
  const follow = useKeepStore((s) => s.communityFollowToggle);
  const react = useKeepStore((s) => s.communityReactionTap);
  const counts = useKeepStore((s) => s.reactionCounts) ?? {};
  const course = selectedCourse(courses, current.courseId);
  const cards = [
    { id: 'coach_beibei', name: '北北今天也开练', avatar: 'avatar_beibei', text: '训练完成！今天状态比昨天更好。', time: '06:12', kcal: 32 },
    { id: 'coach_jinan', name: '济南小跑者', avatar: 'avatar_jinan', text: '低冲击训练对膝盖很友好，坚持打卡。', time: '14:02', kcal: 48 },
    { id: 'coach_xiaoa', name: '小A体验号', avatar: 'avatar_xiaoa', text: '跟着猫叔练完，出汗但不难受。', time: '08:36', kcal: 29 },
  ];
  const reactions = ['加油', '爱了', '加油鸭', '能量棒', '围观'];
  return (
    <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark">
      <TopBar title="跟练过的人" />
      <div className="px-4 py-3 bg-app-surface text-sm text-app-text-muted">{course?.practiced ?? '—'} 人次开练</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-scroll-container="main" data-scroll-direction="vertical">
        {cards.map((card, idx) => (
          <Card key={card.name} className="p-4">
            <div className="flex items-center gap-2">
              <button {...bindTap('coach.profile.open.fromCommunity', { params: { coachId: card.id }, beforeTrigger: () => setCurrent('coachId', card.id) })} className="border-none bg-transparent p-0"><Img id={card.avatar} className="w-10 h-10 rounded-full object-cover" alt={card.name} /></button>
              <div className="flex-1"><div className="font-semibold text-sm text-app-text">{card.name}</div><div className="text-xs text-app-text-muted">刚刚完成训练</div></div>
              <button {...bindTap(action('course.community.follow.toggle'), { params: { name: card.name }, onTrigger: () => follow(card.name) })} className="px-3 py-1 rounded-full border border-emerald-400 bg-white text-xs text-emerald-600">{followedUsers.includes(card.name) || followedNames.includes(card.name) || followedCoaches.includes(card.id) ? '已关注' : '+ 关注'}</button>
            </div>
            <p className="text-sm text-app-text my-3">{card.text}</p>
            <div className="rounded-xl bg-app-bg p-3 grid grid-cols-3 text-center"><div><b>{card.time}</b><small className="block text-app-text-muted">时长</small></div><div><b>{card.kcal}</b><small className="block text-app-text-muted">千卡</small></div><button {...(course ? bindTap('course.detail.open.fromCommunity', { params: { courseId: course.id }, beforeTrigger: () => setCurrent('courseId', course.id) }) : bindTap(action('course.community.course.missing'), { onTrigger: () => useKeepStore.getState().toast('未找到该课程') }))} className="border-none bg-transparent text-emerald-600">查看课程 ›</button></div>
            <div className="flex gap-1.5 overflow-x-auto mt-3">{reactions.map((r) => <button key={r} {...bindTap(action('course.community.reaction.tap'), { params: { reaction: r }, onTrigger: () => react(`${idx}:${r}`) })} className="px-2 py-1 rounded-full border-none bg-app-bg text-xs whitespace-nowrap">{r} {(counts[`${idx}:${r}`] ?? 0) + 2}</button>)}</div>
            {idx === 1 && <button {...bindTap('mall.detail.open.fromCommunity', { params: { productId: 'pr_watch' }, beforeTrigger: () => setCurrent('productId', 'pr_watch') })} className="mt-3 w-full rounded-lg border border-app-border bg-white p-2 text-left text-xs text-app-text">⌚ 作者使用：Keep 手环 B5 Lite ›</button>}
          </Card>
        ))}
      </div>
    </div>
  );
}

export function CourseCalendarPage() {
  const { bindTap, back } = useKeepGestures();
  const s = useKeepStrings();
  const selected = useKeepStore((s) => s.trainingDays) ?? [];
  const toggle = useKeepStore((s) => s.calendarDateToggle);
  const clear = useKeepStore((s) => s.calendarClear);
  const save = useKeepStore((s) => s.calendarSave);
  // s012：2026-07-14（今）起连续 30 天，跨 07/08 月。
  const days = Array.from({ length: 30 }, (_, offset) => {
    const julyDay = 14 + offset;
    const month = julyDay <= 31 ? 7 : 8;
    const day = julyDay <= 31 ? julyDay : julyDay - 31;
    return {
      value: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      day,
      month,
      // 2026-07-14 为周二；数组按周日=0排列。
      weekdayIndex: (2 + offset) % 7,
    };
  });
  const july = days.filter((day) => day.month === 7);
  const august = days.filter((day) => day.month === 8);
  const renderMonth = (monthDays: typeof days, month: number, offset: number) => (
    <section className="border-t border-app-border pt-4">
      <div className="text-center text-app-text-muted text-sm mb-2">{String(month).padStart(2, '0')}月</div>
      <div className="grid grid-cols-7 gap-y-2 text-center">
        {Array.from({ length: offset }, (_, index) => <span key={`blank-${month}-${index}`} />)}
        {monthDays.map((d, index) => {
          const chosen = selected.includes(d.value);
          return <button key={d.value} {...bindTap(action('course.calendar.date.toggle'), { params: { date: d.value }, onTrigger: () => toggle(d.value) })} className="h-11 border-none bg-transparent"><span className={`inline-flex w-10 h-10 items-center justify-center rounded-full text-sm font-semibold ${chosen ? 'text-emerald-500 border border-emerald-300 bg-emerald-50' : 'text-app-text'}`}>{month === 7 && index === 0 ? '今' : d.day}</span></button>;
        })}
      </div>
    </section>
  );
  return (
    <div className="h-full bg-white flex flex-col" data-status-bar-foreground="dark">
      <TopBar right={<button {...bindTap(action('course.calendar.clear'), { onTrigger: clear })} className="border-none bg-transparent whitespace-nowrap text-app-text-muted text-sm">清空已选</button>} />
      <div className="px-4 pt-5 text-center">
        <h1 className="text-[28px] font-bold m-0">选择训练日</h1>
        <p className="text-app-text-muted mt-3">建议每周练习 3~6 次，重复 3 周</p>
      </div>
      <div className="grid grid-cols-7 px-4 mt-9 mb-3 text-center text-sm text-app-text-muted">{['日','一','二','三','四','五','六'].map((x)=><span key={x}>{x}</span>)}</div>
      <div className="flex-1 overflow-y-auto px-4">{renderMonth(july, 7, 2)}{renderMonth(august, 8, 6)}<div className="text-center text-xs text-app-text-muted py-5">- 最多可安排从今日起 30 天的训练 -</div></div>
      <div className="px-7 py-4 border-t border-app-border">
        <PrimaryBtn
          bind={bindTap(action('course.calendar.save.submit'), {
            onTrigger: () => {
              save();
              back();
            },
          })}
        >
          {s.save}
        </PrimaryBtn>
      </div>
    </div>
  );
}

export function TeamListPage() {
  const { bindTap } = useKeepGestures();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? '进行中';
  const groups = tab === '进行中' ? ['晨起燃脂小队', '无跳跃训练营', '晚间六分钟打卡'] : ['猫叔六月小队', '大体重友好营', '毕业季燃脂组'];
  return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="组队练" /><div className="flex bg-app-surface">{['进行中','已失效'].map((t) => <button key={t} {...bindTap(action('team.list.tab.switch'), { params: { tab: t }, onTrigger: () => setParams({ tab: t }, { replace: true }) })} className={`flex-1 py-3 border-none bg-transparent ${tab === t ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-app-text-muted'}`}>{t}</button>)}</div><div className="p-3 space-y-3 overflow-y-auto">{groups.map((g, i) => <Card key={g} className="p-4"><div className="font-semibold text-app-text">{g}</div><div className="text-xs text-app-text-muted mt-1">{12 + i * 4} 位 Keepers 已组队 · 已进行 {18 + i * 9} 分钟</div><WontfixButton id={tab === '进行中' ? 'team.list.join.wontfix' : 'team.list.card.wontfix'} className="mt-3 w-full py-2 rounded-full border border-emerald-400 bg-white text-emerald-600">{tab === '进行中' ? '+ 加入' : '查看记录'}</WontfixButton></Card>)}</div></div>;
}

function elapsed(start: number, accum: number, running: boolean): number {
  return Math.max(0, Math.floor((accum + (running ? realNow() - start : 0)) / 1000));
}

export function CourseTrainingPage() {
  const { bindTap, go } = useKeepGestures();
  const [params, setParams] = useSearchParams();
  const session = useKeepStore((s) => s.trainingSession);
  const courses = useKeepStore((s) => s.courses);
  const pause = useKeepStore((s) => s.trainingPause);
  const resume = useKeepStore((s) => s.trainingResume);
  const seek = useKeepStore((s) => s.trainingSeek);
  const advance = useKeepStore((s) => s.trainingAdvanceSeg);
  const checkin = useKeepStore((s) => s.trainingCheckin);
  const danmaku = useKeepStore((s) => s.trainingDanmakuToggle);
  const finish = useKeepStore((s) => s.trainingFinish);
  const [, tick] = React.useState(0);
  React.useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 1000); return () => clearInterval(t); }, []);
  const c = selectedCourse(courses, session?.courseId);
  const running = session?.status === 'running';
  const seg = c ? c.segments[Math.min(session?.segIndex ?? 0, c.segments.length - 1)] : undefined;
  const sec = session ? elapsed(session.startedRealMs, session.accumMs, running) : 0;
  const segSec = session ? elapsed(session.segStartedRealMs, session.segAccumMs, running) : 0;
  React.useEffect(() => {
    if (!c || !session || !running || !seg || segSec < seg.seconds) return;
    if (session.segIndex >= c.segments.length - 1) {
      finish();
      go('course.complete.open');
    } else {
      advance();
    }
  }, [advance, c, finish, go, running, seg, segSec, session]);
  const controls = params.get('controls') !== '0';
  const landscape = params.get('orientation') === 'landscape';
  const remaining = Math.max(0, (seg?.seconds ?? 30) - segSec);
  if (!c) {
    return (
      <div className="h-full bg-app-bg flex flex-col items-center justify-center px-8 text-center" data-status-bar-foreground="dark">
        <TopBar title="训练" />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-[15px] font-medium text-app-text">训练会话已失效</div>
          <p className="text-[13px] text-app-text-muted mt-2">请返回课程详情重新开始</p>
        </div>
      </div>
    );
  }
  if (landscape) {
    return (
      <div className="h-full bg-black relative overflow-hidden" data-status-bar-foreground="light" data-navigation-bar-foreground="light">
        <div
          className="training-landscape-stage absolute overflow-hidden bg-black text-white"
          style={{ width: 800, height: 360, left: '50%', top: '50%', transform: 'translate(-50%, -50%) rotate(90deg)' }}
        >
          <Img id={c.cover} className="absolute inset-0 w-full h-full object-cover opacity-80" alt={c.title} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-transparent to-black/25" />
          <button {...bindTap(action('course.training.screen.toggleControls'), { onTrigger: () => setParams((p) => { p.set('controls', controls ? '0' : '1'); return p; }, { replace: true }) })} className="absolute inset-0 border-none bg-transparent" aria-label="显示训练控件" />
          <div className="absolute left-5 top-4 text-sm"><span className="opacity-70">运动时长</span><b className="block text-3xl">{String(Math.floor(sec / 60)).padStart(2,'0')}:{String(sec % 60).padStart(2,'0')}</b></div>
          <div className="absolute right-6 top-5 text-right"><div className="text-3xl font-black">{Math.min((session?.segIndex ?? 0) + 1, c.segments.length)}/{c.segments.length} {seg?.name}</div><div className="mt-1 text-sm opacity-80">保持呼吸，跟随教练完成动作</div></div>
          <div className="absolute right-7 bottom-7 w-20 h-20 rounded-full border-[8px] border-sky-400 bg-black/45 flex items-center justify-center text-3xl font-black">{remaining}</div>
          {session?.danmaku && <div className="absolute top-24 right-24 space-y-2 text-right"><div className="bg-black/45 rounded-full px-3 py-1 text-xs">花花 · 3 人组队练中</div><div className="bg-black/45 rounded-full px-3 py-1 text-xs">今天也要坚持 ✨</div></div>}
          <button {...bindTap(action('course.training.checkin'), { onTrigger: checkin })} className="absolute left-5 bottom-5 px-4 py-2 rounded-full border-none bg-emerald-500 text-sm z-10">戳我打卡 {session?.checkins ?? 0}</button>
          {controls && <><button {...bindTap('training.quit.open', { beforeTrigger: pause })} className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border-none bg-black/55 text-white text-xl z-10">×</button><div className="absolute inset-x-0 bottom-4 flex justify-center items-center gap-4 z-10"><button {...bindTap(action('course.training.prevAction'), { onTrigger: () => seek(-1) })} className="w-11 h-11 rounded-full border-none bg-black/45 text-white">⏮</button>{running ? <button {...bindTap(action('course.training.pause'), { onTrigger: pause })} className="w-14 h-14 rounded-full border-none bg-white text-black text-xl">⏸</button> : <><button {...bindTap('training.quit.open.fromStop')} className="w-12 h-12 rounded-full border-none bg-red-500 text-white">■</button><button {...bindTap(action('course.training.resume'), { onTrigger: resume })} className="w-14 h-14 rounded-full border-none bg-emerald-500 text-white">▶</button></>}<button {...bindTap(action('course.training.nextAction'), { onTrigger: () => seek(1) })} className="w-11 h-11 rounded-full border-none bg-black/45 text-white">⏭</button></div><div className="absolute left-5 top-28 flex gap-2 z-10"><button {...bindTap(action('course.training.danmaku.toggle'), { onTrigger: danmaku })} className="px-3 py-2 rounded-full border-none bg-black/45 text-white text-xs">弹幕</button><button {...bindTap('training.settings.open')} className="px-3 py-2 rounded-full border-none bg-black/45 text-white text-xs">设置</button></div><TrainingSecondaryControls /></>}
        </div>
      </div>
    );
  }
  return (
    <div className="h-full bg-[#efefef] text-white relative overflow-hidden" data-status-bar-foreground="dark" data-navigation-bar-foreground="light">
      <Img id={c.cover} className="absolute inset-x-0 top-0 w-full h-[66%] object-cover opacity-90" alt={c.title} />
      <div className="absolute inset-x-0 top-0 h-[66%] bg-gradient-to-b from-black/15 via-transparent to-black/10" />
      <button {...bindTap(action('course.training.screen.toggleControls'), { onTrigger: () => setParams({ controls: controls ? '0' : '1' }, { replace: true }) })} className="absolute inset-0 border-none bg-transparent" aria-label="显示训练控件" />
      <div className="absolute top-4 left-4 text-sm text-app-text"><b>{Math.min((session?.segIndex ?? 0) + 1, c.segments.length)}/{c.segments.length} {seg?.name}</b></div>
      <div className="absolute top-14 right-5 w-20 h-20 rounded-full border-[8px] border-sky-400 bg-black/45 flex items-center justify-center text-3xl font-bold">{remaining}</div>
      {session?.danmaku && <div className="absolute top-[48%] left-4 right-4"><div className="inline-block bg-black/45 rounded-full px-3 py-1 text-xs">花花 · 3 人组队练中</div></div>}
      <div className="absolute inset-x-0 bottom-0 h-[36%] rounded-t-3xl bg-[#302a39] px-5 pt-5 text-white"><div className="mx-auto w-10 h-1 rounded-full bg-white/25"/><div className="grid grid-cols-3 text-center mt-4"><div><b className="text-3xl">{remaining}<span className="text-sm">″</span></b><small className="block text-white/55">动作倒计时</small></div><div><b className="text-3xl">{String(Math.floor(sec / 60)).padStart(2,'0')}:{String(sec % 60).padStart(2,'0')}</b><small className="block text-white/55">运动时长</small></div><div><b className="text-3xl">{session?.checkins ?? 0}</b><small className="block text-white/55">打卡</small></div></div></div>
      {controls && <><button {...bindTap('training.quit.open', { beforeTrigger: pause })} className="absolute top-3 right-3 w-10 h-10 rounded-full border-none bg-black/45 text-white text-xl">×</button><div className="absolute bottom-5 inset-x-0 flex justify-center items-center gap-5 z-10"><button {...bindTap(action('course.training.prevAction'), { onTrigger: () => seek(-1) })} className="w-12 h-12 rounded-full border-none bg-white/15 text-white">⏮</button>{running ? <button {...bindTap(action('course.training.pause'), { onTrigger: pause })} className="w-16 h-16 rounded-full border-none bg-white text-black text-xl">⏸</button> : <><button {...bindTap('training.quit.open.fromStop')} className="w-14 h-14 rounded-full border-none bg-red-500 text-white">■</button><button {...bindTap(action('course.training.resume'), { onTrigger: resume })} className="w-16 h-16 rounded-full border-none bg-emerald-500 text-white">▶</button></>}<button {...bindTap(action('course.training.nextAction'), { onTrigger: () => seek(1) })} className="w-12 h-12 rounded-full border-none bg-white/15 text-white">⏭</button></div><button {...bindTap(action('course.training.checkin'), { onTrigger: checkin })} className="absolute left-4 bottom-24 px-3 py-2 rounded-full border-none bg-emerald-500 text-white text-xs z-10">戳我打卡</button><TrainingSecondaryControls /></>}
      <button {...bindTap('course.complete.open', { beforeTrigger: finish })} className="absolute right-3 top-1/2 px-2 py-1 rounded bg-black/45 border-none text-white text-xs">完成课程</button>
    </div>
  );
}

export function TrainingSettingsPage() {
  const { bindTap } = useKeepGestures();
  const settings = useKeepStore((s) => s.settings);
  const set = useKeepStore((s) => s.trainingSettingSet);
  return <BottomSheet title="训练设置" heightClass="h-[72%]"><Card><Row label="背景音乐" value="默认音乐" bind={bindTap(action('training.settings.music.wontfix'), { onTrigger: () => useKeepStore.getState().toast('该功能暂未开放') })} /><div className="px-4 py-3 border-b border-app-border"><div className="text-sm text-app-text mb-2">音乐音量</div><input type="range" value={settings.bgMusicVolume} onChange={(e) => set({ bgMusicVolume: Number(e.target.value) })} data-action="training.settings.volume.adjust" data-action-type="range" className="w-full accent-emerald-500" /></div><ToggleRow label="耳机控制" on={settings.headphoneControl} bind={bindTap(action('training.settings.headset.toggle'), { onTrigger: () => set({ headphoneControl: !settings.headphoneControl }) })} /><ToggleRow label="语音指导" on={settings.voiceGuide} bind={bindTap(action('training.settings.voice.toggle'), { onTrigger: () => set({ voiceGuide: !settings.voiceGuide }) })} />{settings.voiceGuide && <div className="px-4 py-3 border-b border-app-border"><input type="range" value={settings.voiceVolume} onChange={(e) => set({ voiceVolume: Number(e.target.value) })} data-action="training.settings.volume.adjust" data-action-type="range" className="w-full accent-emerald-500" /></div>}<ToggleRow label="组队运动" on={settings.teamMode} bind={bindTap(action('training.settings.team.toggle'), { onTrigger: () => set({ teamMode: !settings.teamMode }) })} /><ToggleRow label="后台训练" on={settings.backgroundTraining} bind={bindTap(action('training.settings.background.toggle'), { onTrigger: () => set({ backgroundTraining: !settings.backgroundTraining }) })} /><ToggleRow label="屏幕锁定" on={settings.screenLock} bind={bindTap(action('training.settings.lock.toggle'), { onTrigger: () => set({ screenLock: !settings.screenLock }) })} last /><Row label="意见反馈" bind={bindTap(action('training.settings.feedback.wontfix'), { onTrigger: () => useKeepStore.getState().toast('该功能暂未开放') })} /></Card></BottomSheet>;
}

export function TrainingQuitPage() {
  const { bindTap, back } = useKeepGestures();
  const abort = useKeepStore((s) => s.trainingAbort);
  const resume = useKeepStore((s) => s.trainingResume);
  return <CenterDialog title="训练时间过短，无法保存记录" footer={<><button {...bindTap('course.detail.open.fromQuit', { beforeTrigger: abort, onTrigger: () => back(2) })} className="flex-1 py-2.5 rounded-full border border-app-border bg-white text-app-text">结束训练</button><button {...bindTap(action('training.quit.continue'), { onTrigger: () => { resume(); back(); } })} className="flex-1 py-2.5 rounded-full border-none text-white" style={{ background: C.green }}>再练一会</button></>}><span>再坚持一下吧！完成训练才会计入运动记录。</span></CenterDialog>;
}

export function CourseCompletePage() {
  const { bindTap, back } = useKeepGestures();
  const s = useKeepStrings();
  const summary = useKeepStore((s) => s.lastComplete);
  const rate = useKeepStore((s) => s.completeFeelingRate);
  const feeling = summary?.feeling ?? null;
  // recordId 已在 trainingFinish 写入 current，发布动态可带运动数据卡
  return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="训练完成" /><div className="flex-1 overflow-y-auto p-4"><div className="text-center py-6"><div className="text-5xl">✓</div><h1 className="text-2xl font-bold text-app-text mt-3">完成得漂亮！</h1><p className="text-app-text-muted text-sm">每一次坚持都在让你更强</p></div><Card className="grid grid-cols-3 p-5 text-center"><div><b className="text-xl">{Math.max(1, Math.round((summary?.durationSec ?? 0)/60))}</b><small className="block text-app-text-muted">分钟</small></div><div><b className="text-xl">{summary?.kcal ?? 0}</b><small className="block text-app-text-muted">千卡</small></div><div><b className="text-xl">{summary?.actionCount ?? 0}</b><small className="block text-app-text-muted">动作</small></div></Card><Card className="mt-4 p-4"><div className="font-semibold text-app-text">这次训练感觉如何？</div><div className="flex justify-between mt-4">{['轻松','正好','有点累','很吃力'].map((x,i) => <button key={x} {...bindTap(action('course.complete.feeling.rate'), { params: { value: i+1 }, onTrigger: () => rate(i+1) })} className={`px-2 py-2 rounded-lg border-none text-xs ${feeling===i+1?'bg-emerald-500 text-white':'bg-app-bg text-app-text'}`}>{x}</button>)}</div></Card><button {...bindTap('post.compose.open.fromComplete')} className="mt-4 w-full py-3 rounded-full border border-emerald-500 bg-white text-emerald-600">{s.publish}</button></div><div className="p-3"><PrimaryBtn bind={bindTap('course.detail.open.fromComplete', { onTrigger: () => back(2) })}>完成</PrimaryBtn></div></div>;
}

export function ActionHubPage() {
  const { bindTap } = useKeepGestures();
  const actions = useKeepStore((s) => s.actionsLib);
  const setCurrent = useKeepStore((s) => s.setCurrent);
  return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="动作训练" /><div className="px-4 pb-5 overflow-y-auto"><div className="grid grid-cols-2 gap-3"><WontfixButton id="action.hub.custom.wontfix" className="h-24 rounded-2xl border-none bg-white p-4 text-left flex items-center gap-3"><span className="w-12 h-12 rounded-xl bg-orange-100 text-orange-500 flex items-center justify-center text-2xl">＋</span><span><b className="block text-app-text">自建编排</b><small className="text-app-text-muted">自由组合动作</small></span></WontfixButton><button {...bindTap('action.library.open')} className="h-24 rounded-2xl border-none bg-white p-4 text-left flex items-center gap-3"><span className="w-12 h-12 rounded-xl bg-sky-100 text-sky-500 flex items-center justify-center text-2xl">▦</span><span><b className="block text-app-text">全部动作</b><small className="text-app-text-muted">按部位查找</small></span></button></div><h2 className="text-lg font-bold mt-5 mb-3">入门动作推荐</h2><div className="flex gap-3 overflow-x-auto">{actions.slice(0,4).map((a) => <button key={a.id} {...bindTap('action.detail.open.fromHub', { params: { actionId: a.id }, beforeTrigger: () => setCurrent('actionId', a.id) })} className="w-36 shrink-0 rounded-xl border-none bg-white p-0 overflow-hidden text-left"><Img id={a.id} className="w-full h-24 object-cover" alt={a.name}/><div className="p-3"><b className="text-sm">{a.name}</b><small className="block text-app-text-muted mt-1">{a.practiced}练过</small></div></button>)}</div><h2 className="text-lg font-bold mt-5 mb-3">经典模板</h2>{['超级组模板','金字塔模板'].map((x,i)=><button key={x} {...bindTap('template.detail.open', { params:{templateId:String(i)}, beforeTrigger:()=>setCurrent('templateId',String(i)) })} className="w-full mb-3 rounded-2xl border-none bg-white text-left overflow-hidden p-0"><div className={`px-4 py-3 text-white flex items-center ${i?'bg-gradient-to-r from-sky-500 to-indigo-500':'bg-gradient-to-r from-orange-400 to-rose-400'}`}><b className="text-lg">{x}</b><span className="ml-auto text-xs">3 个动作 ›</span></div><div className="px-4 py-2">{actions.slice(i,i+3).map((a,index)=><div key={`${x}-${a.id}-${index}`} className={`flex items-center gap-3 py-2 ${index<2?'border-b border-app-border':''}`}><Img id={a.id} className="w-12 h-10 rounded-lg object-cover" alt={a.name}/><span className="text-sm font-medium">{a.name}</span><small className="ml-auto text-app-text-muted">{index+1} 组</small></div>)}</div></button>)}</div></div>;
}


function selectedAction(actions: KeepActionItem[], id: string | null | undefined): KeepActionItem | undefined {
  return actions.find((a) => a.id === id);
}

export function ActionDetailPage() {
  const { bindTap } = useKeepGestures();
  const actions = useKeepStore((s)=>s.actionsLib); const current=useKeepStore((s)=>s.current); const wish=useKeepStore((s)=>s.wishActions)??[]; const toggle=useKeepStore((s)=>s.actionWishToggle); const a=selectedAction(actions,current.actionId);
  if (!a) return <div className="h-full bg-white flex flex-col" data-status-bar-foreground="dark"><TopBar title="动作详情"/><div className="flex-1 flex items-center justify-center text-sm text-app-text-muted">未找到该动作</div></div>;
  return <div className="h-full bg-white flex flex-col" data-status-bar-foreground="dark"><TopBar/><div className="flex-1 overflow-y-auto pb-5"><div className="relative h-[290px] mx-3 overflow-hidden bg-[#eee]"><Img id={a.id} className="w-full h-full object-cover" alt={a.name}/><div className="absolute inset-0 bg-black/5"/><span className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-white/35 text-white text-2xl flex items-center justify-center">▶</span></div><div className="px-4 pt-3"><span className="inline-flex px-2 py-1 bg-amber-50 text-amber-500 text-sm">★ {a.rating.toFixed(1)} 分</span><h1 className="text-[26px] font-bold mt-3 mb-1">{a.name}</h1><div className="grid grid-cols-3 mt-4 py-3"><div><b>{a.muscle[0]??a.bodyPart}</b><small className="block text-app-text-muted">主要肌群</small></div><div><b>{a.practiced}</b><small className="block text-app-text-muted">练过</small></div><div className="px-2 py-2 bg-emerald-50 text-emerald-600 text-xs">⌚ 手环<br/>精准计次</div></div><p className="text-sm leading-6 text-app-text-muted">{a.steps.join('，')}</p></div><div className="flex justify-around py-4 border-y border-app-border mt-3"><button {...bindTap(action('action.detail.wish.toggle'),{onTrigger:()=>toggle(a.id)})} className="border-none bg-transparent"><span className="text-2xl">{wish.includes(a.id)?'♥':'♡'}</span><br/><small>{wish.includes(a.id)?'已想练':'想练'}</small></button><button {...bindTap('course.calendar.open.fromAction')} className="border-none bg-transparent"><span className="text-2xl">▣</span><br/><small>加日历</small></button><button {...bindTap('course.comments.open.fromAction')} className="border-none bg-transparent"><span className="text-2xl">◌</span><br/><small>评论999+</small></button><WontfixButton id="action.detail.equip.wontfix" className="border-none bg-transparent"><span className="text-2xl">♟</span><br/><small>装备</small></WontfixButton></div><div className="px-4"><h2 className="font-bold mt-5">动作要领</h2><ol className="space-y-3 text-sm text-app-text-muted">{a.steps.map((x,i)=><li key={x} className="flex gap-2"><span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-center leading-6 shrink-0">{i+1}</span>{x}</li>)}</ol></div></div><div className="h-20 border-t border-app-border bg-white relative"><button {...bindTap('action.goal.open')} className="absolute w-24 h-24 left-1/2 -translate-x-1/2 -top-7 rounded-full border-[7px] border-white text-white text-3xl font-black shadow-lg" style={{background:C.green}}>GO</button></div></div>;
}

export function ActionGoalPage() {
  const { bindTap }=useKeepGestures(); const actions=useKeepStore((s)=>s.actionsLib); const current=useKeepStore((s)=>s.current); const goal=useKeepStore((s)=>s.actionGoal)??{mode:'计次' as const,value:null,weightKg:null}; const mode=useKeepStore((s)=>s.actionGoalSetMode); const val=useKeepStore((s)=>s.actionGoalSetValue); const weight=useKeepStore((s)=>s.actionGoalSetWeight); const start=useKeepStore((s)=>s.actionTrainStart); const a=selectedAction(actions,current.actionId); const values=goal.mode==='计次'?[null,5,10,15,20,30]:[null,30,60,90,120,180];
  const unit=goal.mode==='计次'?'次':'秒';
  if (!a) return <div className="h-full bg-white flex flex-col" data-status-bar-foreground="dark"><TopBar title="训练目标"/><div className="flex-1 flex items-center justify-center text-sm text-app-text-muted">未找到该动作</div></div>;
  return <div className="h-full bg-white flex flex-col" data-status-bar-foreground="dark"><TopBar title={a.name}/><div className="flex-1 flex flex-col items-center px-4"><div className="flex mt-7 rounded-full bg-app-bg p-1">{(['计次','计时'] as const).map((m)=><button key={m} {...bindTap(action('action.goal.mode.switch'),{params:{mode:m},onTrigger:()=>mode(m)})} className={`px-9 py-2 rounded-full border-none ${goal.mode===m?'bg-black text-white':'bg-transparent text-app-text'}`}>{m}</button>)}</div><div className="mt-20 text-sm text-app-text-muted">设置本次目标</div><div className="mt-3 h-28 flex items-end justify-center"><strong className="text-[76px] leading-none tracking-tight">{goal.value??'∞'}</strong>{goal.value!=null&&<span className="text-lg text-app-text-muted mb-2 ml-2">{unit}</span>}</div><div className="w-full mt-10 overflow-hidden"><div className="flex items-end justify-center gap-0 h-14">{Array.from({length:31},(_,index)=><span key={index} className={`w-px bg-gray-400 mx-[5px] ${index===15?'h-12 bg-black':index%5===0?'h-7':'h-4'}`}/>)}</div><div className="h-px bg-gray-300"/><div className="flex justify-between text-xs text-app-text-muted mt-2"><span>{values[1]??5}</span><span>{goal.value??'不限'}</span><span>{values[values.length-1]}</span></div></div><div className="flex gap-2 mt-14"><button {...bindTap(action('action.goal.weight.pick'),{onTrigger:()=>weight(goal.weightKg?null:5)})} className="px-5 py-3 rounded-full border border-app-border bg-white text-app-text">重量 {goal.weightKg?`${goal.weightKg} kg`:'徒手'} ›</button>{values.slice(1,4).map((value)=><button key={value} {...bindTap(action('action.goal.scale.slide'),{params:{value:value??-1},onTrigger:()=>val(value)})} className="px-3 py-2 rounded-full border-none bg-app-bg text-sm">{value}{unit}</button>)}</div></div><div className="p-4"><PrimaryBtn bind={bindTap('action.training.open',{beforeTrigger:()=>start(a.id)})}>开始第1次训练</PrimaryBtn></div></div>;
}

export function ActionTrainingPage() {
  const { bindTap, back }=useKeepGestures(); const ses=useKeepStore((s)=>s.actionSession); const goal=useKeepStore((s)=>s.actionGoal); const actions=useKeepStore((s)=>s.actionsLib); const pause=useKeepStore((s)=>s.actionTrainPause); const resume=useKeepStore((s)=>s.actionTrainResume); const stop=useKeepStore((s)=>s.actionTrainStop); const [,tick]=React.useState(0); React.useEffect(()=>{const t=setInterval(()=>tick((x)=>x+1),1000);return()=>clearInterval(t)},[]); const a=selectedAction(actions,ses?.actionId); const sec=ses?elapsed(ses.startedRealMs,ses.accumMs,ses.status==='running'):0;
  const leaveToDetail = () => { stop(); back(2); };
  const completed = goal?.mode === '计时'
    ? Math.min(goal.value ?? sec, sec)
    : Math.min(goal?.value ?? Number.POSITIVE_INFINITY, Math.floor(sec / 2));
  if (!a) return <div className="h-full bg-black text-white flex flex-col items-center justify-center" data-status-bar-foreground="light"><TopBar transparent/><div className="text-sm text-white/80">训练会话已失效</div></div>;
  return <div className="h-full bg-black text-white flex flex-col" data-status-bar-foreground="light"><div className="h-[57%] relative overflow-hidden"><Img id={a.id} className="absolute inset-0 w-full h-full object-cover" alt={a.name}/><div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/35"/><div className="absolute top-1 left-0 right-0"><TopBar transparent/></div><span className="absolute top-16 left-4 px-3 py-1 rounded-full bg-black/35 text-xs">动作 1/1</span><span className="absolute bottom-5 left-4 text-2xl font-bold">{a.name}</span></div><div className="flex-1 bg-[#17151d] px-5 pt-5 text-center rounded-t-[28px] -mt-5 relative z-10"><div className="w-10 h-1 bg-white/20 rounded-full mx-auto"/><div className="grid grid-cols-3 mt-6"><div><b className="text-3xl">{String(Math.floor(sec/60)).padStart(2,'0')}:{String(sec%60).padStart(2,'0')}</b><small className="block text-white/50 mt-1">运动时长</small></div><div><b className="text-3xl">{goal?.value??'∞'}</b><small className="block text-white/50 mt-1">目标{goal?.mode==='计时'?'秒':'次数'}</small></div><div><b className="text-3xl">{Number.isFinite(completed)?completed:0}</b><small className="block text-white/50 mt-1">已完成</small></div></div><div className="flex justify-center items-center gap-5 mt-10">{ses?.status==='running'?<button {...bindTap(action('action.training.pause'),{onTrigger:pause})} className="w-18 h-18 rounded-full border-none bg-white text-black text-xl" style={{width:72,height:72}}>⏸</button>:<><button {...bindTap('action.detail.open.fromStop',{onTrigger:leaveToDetail})} className="w-14 h-14 rounded-full border-none bg-red-500 text-white">■</button><button {...bindTap(action('action.training.resume'),{onTrigger:resume})} className="w-18 h-18 rounded-full border-none bg-emerald-500 text-white text-xl" style={{width:72,height:72}}>▶</button></>}</div><div className="text-xs text-white/45 mt-5">保持呼吸 · 核心收紧 · 动作稳定</div></div></div>;
}

export function TemplateDetailPage(){const{bindTap}=useKeepGestures();const courses=useKeepStore((s)=>s.courses);const wished=useKeepStore((s)=>s.wishTemplates)??[];const toggle=useKeepStore((s)=>s.templateWishToggle);const setCurrent=useKeepStore((s)=>s.setCurrent);const current=useKeepStore((s)=>s.current);const isPyramid=current.templateId==='1';const id=isPyramid?'pyramid-set':'super-set';const title=isPyramid?'金字塔模板':'超级组模板';const description=isPyramid?'逐组递增再递减训练量，稳步突破力量上限':'连续完成三组动作，高效刺激目标肌群';return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title={title}/><div className="flex-1 overflow-y-auto"><div className={isPyramid?"p-5 bg-gradient-to-br from-sky-500 to-blue-700 text-white":"p-5 bg-gradient-to-br from-orange-400 to-red-500 text-white"}><h1 className="text-3xl font-bold">{title}</h1><p className="text-sm mt-2">{description}</p><button {...bindTap('coach.profile.open.fromTemplate',{params:{coachId:'coach_keepjun'},beforeTrigger:()=>setCurrent('coachId','coach_keepjun')})} className="mt-4 bg-white/20 border-none rounded-full text-white px-3 py-2">Keep君 · 官方训练师 ›</button></div><div className="p-4"><div className="flex gap-2"><button {...bindTap(action('template.detail.wish.toggle'),{onTrigger:()=>toggle(id)})} className="flex-1 py-3 rounded-full border border-emerald-500 bg-white text-emerald-600">{wished.includes(id)?'已想练':'一键想练'}</button><button {...bindTap('course.calendar.open.fromTemplate')} className="flex-1 py-3 rounded-full border border-app-border bg-white">+ 加日历</button></div><h2 className="font-bold mt-6">3 节课程</h2>{courses.slice(0,3).map((c)=><button key={c.id} {...bindTap('course.detail.open.fromTemplate',{params:{courseId:c.id},beforeTrigger:()=>setCurrent('courseId',c.id)})} className="mt-3 w-full flex gap-3 p-3 rounded-xl border-none bg-white text-left"><Img id={c.cover} className="w-24 h-16 rounded-lg object-cover" alt={c.title}/><div><b className="text-sm">{c.title}</b><small className="block text-app-text-muted">{c.level} · {c.minutes}分钟</small></div></button>)}</div></div></div>}

export function RouteListPage(){const{bindTap}=useKeepGestures();const[params,setParams]=useSearchParams();const routes=useKeepStore((s)=>s.routes);const setCurrent=useKeepStore((s)=>s.setCurrent);const filter=params.get('filter')??'附近';const visible=filter==='全部'?routes:routes.filter((r)=>filter==='附近'?r.distanceMe<10:r.type.includes(filter));return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="找路线"/><button {...bindTap(action('route.list.map.wontfix'),{onTrigger:()=>useKeepStore.getState().toast('该功能暂未开放')})} className="h-44 border-none p-0 relative"><MapCanvas height={176} route/><span className="absolute inset-x-0 bottom-4 text-sm font-semibold">周边 {routes.length}+ 条路线</span></button><div className="flex gap-2 px-3 py-3 overflow-x-auto">{['附近','跑步','骑行','全部'].map((f)=><Chip key={f} active={filter===f} bind={bindTap(action('route.list.filter.switch'),{params:{filter:f},onTrigger:()=>setParams({filter:f},{replace:true})})}>{f}</Chip>)}</div><div className="grid grid-cols-2 gap-3 px-3 overflow-y-auto">{visible.map((r)=><button key={r.id} {...bindTap('route.detail.open',{params:{routeId:r.id},beforeTrigger:()=>setCurrent('routeId',r.id)})} className="rounded-xl border-none bg-white p-0 overflow-hidden text-left"><Img id={r.cover} className="w-full h-24 object-cover" alt={r.name}/><div className="p-3"><b className="text-sm">{r.name}</b><small className="block text-app-text-muted">{r.km}km · 爬升{r.climb}m</small></div></button>)}</div></div>}

export function RouteDetailPage(){const{bindTap}=useKeepGestures();const[params,setParams]=useSearchParams();const routes=useKeepStore((s)=>s.routes);const current=useKeepStore((s)=>s.current);const setSport=useKeepStore((s)=>s.setSportType);const r=routes.find((x)=>x.id===current.routeId);const expanded=params.get('drawer')!=='small';if(!r)return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="路线详情"/><div className="flex-1 flex items-center justify-center text-sm text-app-text-muted">未找到该路线</div></div>;return <div className="h-full relative bg-app-bg" data-status-bar-foreground="dark"><div className="absolute inset-x-0 top-0"><MapCanvas height={expanded?350:540} route/></div><div className="absolute top-1 left-0 right-0"><TopBar transparent/></div><div className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl p-4 transition-all ${expanded?'h-[58%]':'h-[34%]'}`}><button {...bindTap(action('route.detail.drawer.drag'),{onTrigger:()=>setParams({drawer:expanded?'small':'large'},{replace:true})})} className="block mx-auto w-12 h-1.5 rounded-full border-none bg-gray-300 mb-4" aria-label="展开路线详情"/><div className="flex gap-2"><span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 text-xs">{r.shape}</span><span className="px-2 py-1 rounded bg-app-bg text-xs">{r.type}</span></div><h1 className="text-xl font-bold mt-3">{r.name}</h1><div className="text-sm text-app-text-muted mt-1">{r.km}km · 爬升{r.climb}m · 距离你{r.distanceMe}km</div><div className="grid grid-cols-4 gap-2 my-5">{[['去起点','route.detail.navigate.wontfix'],['收藏','route.detail.fav.wontfix'],['评论','route.detail.comment.wontfix'],['动态','route.detail.feed.wontfix']].map(([t,id])=><WontfixButton key={id} id={id} className="py-2 rounded-lg border-none bg-app-bg text-xs">{t}</WontfixButton>)}</div>{expanded&&<><div className="h-20 flex items-end gap-1">{[22,38,30,56,44,62,37,28,49,34,54].map((h,i)=><span key={i} className="flex-1 bg-emerald-300 rounded-t" style={{height:h}}/>)}</div><div className="text-xs text-app-text-muted mt-1">海拔变化</div></>}<PrimaryBtn bind={bindTap('run.home.open.fromRoute',{beforeTrigger:()=>setSport(r.type==='骑行'?'骑行':'户外跑步')})} className="mt-4">沿路线开始{r.type}</PrimaryBtn></div></div>}

export function CoachProfilePage(){
  const{bindTap}=useKeepGestures();
  const[params,setParams]=useSearchParams();
  const coaches=useKeepStore((s)=>s.coaches);
  const courses=useKeepStore((s)=>s.courses);
  const posts=useKeepStore((s)=>s.posts);
  const current=useKeepStore((s)=>s.current);
  const followedCoaches=useKeepStore((s)=>s.followedCoaches)??[];
  const followedUsers=useKeepStore((s)=>s.followedUsers)??[];
  const followedNames=useKeepStore((s)=>s.followedNames)??[];
  const setFollow=useKeepStore((s)=>s.coachFollowSet);
  const toggleFollowUser=useKeepStore((s)=>s.toggleFollowUser);
  const setCurrent=useKeepStore((s)=>s.setCurrent);
  const ensureThread=useKeepStore((s)=>s.ensureCoachThread);
  const recordCoachDynamicView=useKeepStore((s)=>s.recordCoachDynamicView);
  const c=resolveKeepProfile(coaches,posts,current.coachId);
  const catalog=Boolean(c&&coaches.some((x)=>x.id===c.id));
  const tab=params.get('tab')??'课程';
  const chip=params.get('chip')??'动态';
  if(!c)return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="dark"><TopBar title="个人主页"/><div className="flex-1 flex items-center justify-center text-sm text-app-text-muted">未找到该用户</div></div>;
  const ownPosts=posts.filter((p)=>p.authorId===c.id||p.author===c.name);
  const coachPosts=chip==='动态'?ownPosts:chip==='视频'?ownPosts.filter((p)=>p.type==='视频'):chip==='相册'?ownPosts.filter((p)=>p.images.length>0):ownPosts.filter((p)=>p.sportData);
  const on=followedCoaches.includes(c.id)||followedUsers.includes(c.name)||followedNames.includes(c.name);
  const chart=[14,22,18,30,28,42,37,53,49,62,66,78];
  const followToggle=()=>catalog?setFollow(c.id,!on):toggleFollowUser(c.name);
  return <div className="h-full bg-app-bg flex flex-col" data-status-bar-foreground="light">
    <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
      <div className="relative h-[238px] overflow-hidden bg-slate-800">
        <Img id={c.avatar} className="absolute inset-0 w-full h-full object-cover scale-110 blur-[1px]" alt={c.name}/>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/5 to-black/65"/>
        <div className="absolute top-1 left-0 right-0 z-10"><TopBar transparent/></div>
        <div className="absolute left-5 bottom-5 text-white"><small>{catalog?'Keep 签约运动达人':'Keep 用户'}</small><h1 className="text-3xl font-bold m-0 mt-1">{c.name}</h1></div>
      </div>
      <div className="mx-3 -mt-2 relative z-10 rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3"><Img id={c.avatar} className="w-20 h-20 rounded-full object-cover border-4 border-white -mt-12 shadow" alt={c.name}/><div className="flex-1"><p className="text-sm text-app-text-muted m-0">{c.bio}</p><div className="flex gap-1 mt-2">{c.certs.map((cert)=><span key={cert} className="px-2 py-1 rounded bg-emerald-50 text-emerald-600 text-[10px]">✓ {cert}</span>)}</div></div></div>
        <div className="grid grid-cols-4 text-center mt-4">{[[c.following,'关注'],[c.fans,'粉丝'],[c.cheers,'收获加油'],[c.monthly,'月跟练']].map(([value,label])=><div key={label}><b>{value}</b><small className="block text-app-text-muted">{label}</small></div>)}</div>
        <div className="flex gap-2 mt-4"><button {...bindTap(action(on?'coach.profile.follow.off':'coach.profile.follow.on'),{onTrigger:followToggle})} className={`flex-1 py-2.5 rounded-full border-none text-white ${on?'bg-gray-400':'bg-emerald-500'}`}>{on?'已关注':'+ 关注'}</button><button {...bindTap('chat.detail.open.fromCoach',{params:{threadId:c.id},beforeTrigger:()=>setCurrent('threadId',ensureThread(c.id,c.name,c.avatar))})} className="flex-1 py-2.5 rounded-full border border-app-border bg-white text-app-text">私信</button></div>
      </div>
      <div className="mx-3 mt-3 rounded-2xl bg-white p-4">
        <div className="flex items-center"><b>训练成果</b><small className="ml-auto text-app-text-muted">近 12 个月</small></div>
        <div className="grid grid-cols-3 gap-2 mt-3">{c.achievements.map((item)=><div key={item.label} className="rounded-xl bg-app-bg p-2 text-center"><b className="text-sm">{item.value}</b><small className="block text-app-text-muted">{item.label}</small></div>)}</div>
        <div className="h-20 flex items-end gap-1 mt-3">{chart.map((height,index)=><span key={index} className="flex-1 rounded-t bg-emerald-400" style={{height,opacity:.42+index/24}}/>)}</div>
        <div className="flex gap-2 mt-3 text-[11px] text-app-text-muted"><span>男 · 运动 9 年</span><span>北京</span><span>擅长跑步 / 减脂</span></div>
      </div>
      <div className="sticky top-0 z-10 flex bg-white mt-3 overflow-x-auto">{['主页','动态','课程','装备','运动圈'].map((t)=>{const wf=t==='装备'?'coach.profile.equipTab.wontfix':t==='运动圈'?'coach.profile.circleTab.wontfix':null;return wf?<WontfixButton key={t} id={wf} className="flex-1 min-w-16 py-3 border-none bg-white text-app-text-muted whitespace-nowrap">{t}</WontfixButton>:<button key={t} {...bindTap(action('coach.profile.tab.switch'),{params:{tab:t},onTrigger:()=>{setParams({tab:t},{replace:true});if(t==='动态')recordCoachDynamicView(c.id);}})} className={`flex-1 min-w-16 py-3 border-none bg-white whitespace-nowrap ${tab===t?'text-app-text border-b-2 border-black font-bold':'text-app-text-muted'}`}>{t}</button>})}</div>
      <div className="p-3"><CoachAuxControls tab={tab}/>{on&&<Card className="p-3 mb-3"><b>你可能想认识他们</b><div className="flex gap-3 mt-3">{coaches.slice(1,4).map((x)=><button key={x.id} {...bindTap(action('coach.profile.suggestFollow.toggle'),{onTrigger:()=>useKeepStore.getState().suggestFollowToggle(x.id)})} className="flex-1 border-none bg-transparent"><Img id={x.avatar} className="w-12 h-12 rounded-full object-cover mx-auto" alt={x.name}/><small>{x.name}</small></button>)}</div></Card>}
        {tab==='课程'&&courses.filter((x)=>c.courses.includes(x.id)).map((x)=><button key={x.id} {...bindTap('course.detail.open.fromCoach',{params:{courseId:x.id},beforeTrigger:()=>setCurrent('courseId',x.id)})} className="relative w-full h-40 mb-3 rounded-xl border-none bg-white text-left overflow-hidden p-0"><Img id={x.cover} className="absolute inset-0 w-full h-full object-cover" alt={x.title}/><span className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-4 text-white"><b className="text-base">{x.title}</b><small className="block text-white/75">{x.level} · {x.minutes}分钟 · {x.practiced}练过</small></div></button>)}
        {tab==='动态'&&coachPosts.slice(0,3).map((p)=><button key={p.id} {...bindTap('post.detail.open.fromCoach',{params:{postId:p.id},beforeTrigger:()=>setCurrent('postId',p.id)})} className="w-full p-0 mb-3 rounded-xl border-none bg-white text-left overflow-hidden"><div className="flex items-center gap-2 p-3 pb-2"><Img id={p.avatar} className="w-9 h-9 rounded-full object-cover" alt={p.author}/><div><b className="text-sm">{p.author}</b><small className="block text-app-text-muted">{p.time} · {p.region}</small></div></div><p className="text-sm px-3 mb-3 mt-0">{p.content}</p>{p.images[0]&&<div className="relative"><Img id={p.images[0]} className="w-full h-52 object-cover" alt={p.content}/>{p.type==='视频'&&<span className="absolute inset-0 flex items-center justify-center text-4xl text-white bg-black/15">▶</span>}</div>}</button>)}
        {tab==='主页'&&<Card className="p-4"><h2 className="font-bold m-0">达人认证</h2><p className="text-sm text-app-text-muted">Keep 优质创作者 · 专业减脂教练 · 跑步领域达人</p><WontfixButton id="coach.profile.showcase.wontfix" className="mt-2 w-full p-4 rounded-xl border-none bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-left">我的橱窗 · 会员名师课 ›</WontfixButton></Card>}
      </div>
    </div>
  </div>;
}
