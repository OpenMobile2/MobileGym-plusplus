import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStrings } from '../hooks/useDoubanStrings';
import { useDoubanStore } from '../state';
import { C, Avatar, Img, Stars, TheEnd, MetaLine, fmtCount, fmtAbsDateTime, fmtShortDate } from '../components/ui';
import { Sheet, SheetRow } from '../components/Sheet';
import { markStatusLabel } from '../components/MarkSheetCore';
import { copyToClipboard, shareWithSystem } from '../capabilities';
import { setImageViewerPayload } from './MediaImageviewerPage';

// 节点: subject.movie —— 电影/电视条目详情页(全 spec 最核心节点,深色皮肤)。
// evidence: IMG_Ff60ef9_t0006/t0010/t0018/t0032/t0044/t0067/t0078/t0080

/**
 * 海报自适应深色皮肤:真机按海报取色(t0006 条目A=深蓝灰,t0067 条目B=金橄榄)。
 * mock 无取色管线 → 按条目 id charCode 哈希在 3 块精选深色板上确定性映射
 * (偏移 +1 使 m1→深蓝灰、m2→金橄榄,与 evidence 双态对齐)。
 */
const DARK_SKINS = [
  { bg: '#323947', card: '#3F4757', track: '#3A4150' }, // 深蓝灰条目A
  { bg: '#655A2C', card: '#746838', track: '#5A5027' }, // 金橄榄(t0067/t0070 )
  { bg: '#33373D', card: '#42474E', track: '#383D44' }, // 炭灰
] as const;

const SKIN_SHARED = {
  text: '#F2F3F5',
  sub: '#9BA1A8',
  faint: '#8E939B',
  orange: '#FF9900',
  gold: '#E8B04C',
} as const;

function skinFor(id: string): typeof SKIN_SHARED & (typeof DARK_SKINS)[number] {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return { ...SKIN_SHARED, ...DARK_SKINS[(sum + 1) % DARK_SKINS.length] };
}

/** 描边拇指 icon(真机短评点赞为 outline 👍,非 emoji) */
function ThumbIcon({ size = 13, color }: { size?: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M7 10v11" />
      <path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.6l-2.3 7A2 2 0 0 1 17.5 21H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h2.8a2 2 0 0 0 1.8-1.1L12 3a3.1 3.1 0 0 1 3 2.9Z" />
    </svg>
  );
}

const STILLS = [
  '/@app-assets/Douban/images/bc_photo1.svg',
  '/@app-assets/Douban/images/bc_photo2.svg',
  '/@app-assets/Douban/images/bc_photo3.svg',
  '/@app-assets/Douban/images/bc_photo4.svg',
  '/@app-assets/Douban/images/bc_photo5.svg',
];

const COMPLAINT_REASONS = ['违法违规', '色情低俗', '广告营销', '人身攻击', '剧透', '抄袭侵权', '其他'];

function fmtDateShort(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

function relTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}分钟前`;
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

export default function SubjectMoviePage() {
  const { bindBack, bindTap, back, go } = useDoubanGestures();
  const str = useDoubanStrings();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const followedUserIds = useDoubanStore((s) => s.follows.users);
  const comments = useDoubanStore((s) => s.comments);
  const reviews = useDoubanStore((s) => s.reviews);
  const discussions = useDoubanStore((s) => s.discussions);
  const users = useDoubanStore((s) => s.users);
  const celebrities = useDoubanStore((s) => s.celebrities);
  const follows = useDoubanStore((s) => s.follows);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const setComposeCtx = useDoubanStore((s) => s.setComposeCtx);
  const addHistory = useDoubanStore((s) => s.addHistory);

  const itemId = routeParams.itemId ?? 'm1';
  const subject = useMemo(
    () => subjects.find((s) => s.id === itemId) ?? subjects[0],
    [subjects, itemId],
  );

  // 供 /subject/markSheet overlay 读取来源条目(路由无参,约定取 history[0])
  useEffect(() => {
    addHistory('subject', subject.id);
  }, [addHistory, subject.id]);

  // 影评/剧评:电视=剧评,其余=影评(电影/纪录片等)
  const reviewWord = subject.type === 'tv' ? '剧评' : '影评';
  // 三种写入口:复用 subject.movie.compose-open 跳转,靠 setComposeCtx 决定编辑器形态(短评无标题 / 影评·剧评带标题 / 讨论)
  const openCompose = (kind: 'comment' | 'review' | 'discussion') =>
    bindTap('subject.movie.compose-open', { beforeTrigger: () => setComposeCtx({ kind, subjectId: subject.id }) });

  const [tab, setTab] = useState<'overall' | 'reviews' | 'discussions'>('overall');
  const [overallSort, setOverallSort] = useState<'hot' | 'new'>('hot');
  const [reviewSort, setReviewSort] = useState<'hot' | 'new' | 'friend'>('hot');
  const [discussSort, setDiscussSort] = useState<'new' | 'hot'>('hot');
  const [sameViewOpen, setSameViewOpen] = useState(false);
  const [complaintReason, setComplaintReason] = useState<string | null>(null);
  /** 顶栏双态:未滚动=居中「电影」;滚过头部=缩略图+片名+评分压缩态(t0006 vs t0010) */
  const [barCompact, setBarCompact] = useState(false);
  /** 内容 tab 条钉底态:白色抽屉尚未滚到 sticky 位时,tab 条钉在屏幕底缘(t0010/t0032/t0078) */
  const [sheetReached, setSheetReached] = useState(false);
  const mainRef = useRef<HTMLDivElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const sheet = searchParams.get('sheet'); // more | complaint(URL 驱动,返回键可关)

  const mark = useMemo(() => marks.find((m) => m.subjectId === subject.id), [marks, subject.id]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const subjectComments = useMemo(() => {
    const list = comments.filter((c) => c.subjectId === subject.id);
    return overallSort === 'hot'
      ? [...list].sort((a, b) => b.likes - a.likes)
      : [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [comments, subject.id, overallSort]);

  const subjectReviews = useMemo(() => {
    const list = reviews.filter((r) => r.subjectId === subject.id);
    if (reviewSort === 'friend') return list.filter((r) => followedUserIds.includes(r.authorId));
    return reviewSort === 'hot'
      ? [...list].sort((a, b) => b.useful - a.useful)
      : [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [reviews, subject.id, reviewSort, followedUserIds]);

  const subjectDiscussions = useMemo(() => {
    const list = discussions.filter((d) => d.subjectId === subject.id);
    return discussSort === 'hot'
      ? [...list].sort((a, b) => b.likeCount - a.likeCount)
      : [...list].sort((a, b) => b.createdAt - a.createdAt);
  }, [discussions, subject.id, discussSort]);

  const similar = useMemo(
    () => subjects.filter((s) => (s.type === 'movie' || s.type === 'tv') && s.id !== subject.id).slice(0, 6),
    [subjects, subject.id],
  );
  const credits = subject.credits ?? [];
  const friendUsers = useMemo(
    () => follows.users.map((id) => userById.get(id)).filter((u) => u != null).slice(0, 5),
    [follows.users, userById],
  );

  const counts = useMemo(() => {
    const cAll = comments.filter((c) => c.subjectId === subject.id).length;
    const rAll = reviews.filter((r) => r.subjectId === subject.id).length;
    const dAll = discussions.filter((d) => d.subjectId === subject.id).length;
    return { overall: cAll + rAll, reviews: rAll, discussions: dAll };
  }, [comments, reviews, discussions, subject.id]);

  const doneCount = useMemo(
    () => marks.filter((m) => m.status === 'done' && subjects.find((s) => s.id === m.subjectId && (s.type === 'movie' || s.type === 'tv'))).length,
    [marks, subjects],
  );

  const nowTs = TimeService.now();
  const unreleased = subject.rating == null;
  const markDays = mark ? Math.max(1, Math.ceil((nowTs - mark.createdAt) / 86400000)) : 0;

  /** 时间线记录:看过态回放「标记了看过 + 标记了想看」两条(evidence t0080) */
  const timelineRecords = useMemo(() => {
    if (!mark) return [];
    if (mark.status === 'done') {
      return [
        { key: 'done', label: '标记了看过', rating: mark.rating, comment: mark.comment, ts: mark.createdAt },
        { key: 'wish', label: '标记了想看', rating: null, comment: mark.comment, ts: mark.createdAt },
      ];
    }
    return [{ key: 'wish', label: '标记了想看', rating: null, comment: mark.comment, ts: mark.createdAt }];
  }, [mark]);

  const openSheet = (name: string) =>
    setSearchParams((p) => {
      p.set('sheet', name);
      return p;
    });

  const monthText = `${TimeService.fromTimestamp(nowTs).getMonth() + 1}月`;
  const yearText = String(TimeService.fromTimestamp(nowTs).getFullYear());

  /** 海报自适应深色皮肤(确定性 per-subject) */
  const D = useMemo(() => skinFor(subject.id), [subject.id]);
  const divider = 'rgba(255,255,255,0.08)';

  const STRIP_H = 58; // 抓手 + tab 行高度

  /** 滚动:更新顶栏压缩态 + 内容 tab 条是否已进入 sticky 停靠位。 */
  const onMainScroll = (el: HTMLDivElement) => {
    setBarCompact(el.scrollTop > 150);
    const sheetEl = sheetRef.current;
    if (sheetEl) {
      // 抽屉 tab 行顶部 <= 主容器底部 - STRIP_H 时,视为已「贴到」sticky 位。
      const delta = sheetEl.getBoundingClientRect().top - el.getBoundingClientRect().top;
      setSheetReached(delta <= el.clientHeight - STRIP_H + 1);
    }
  };

  /** 点击内容 tab:若白色抽屉尚未滚入视口(tab 条停靠页面底缘态),先滚到抽屉顶 */
  const jumpToSheet = () => {
    const main = mainRef.current;
    const sheetEl = sheetRef.current;
    if (!main || !sheetEl) return;
    const delta = sheetEl.getBoundingClientRect().top - main.getBoundingClientRect().top - STRIP_H;
    if (delta > 4) main.scrollTo({ top: main.scrollTop + delta });
  };

  return (
    <div className="flex flex-col h-full relative" style={{ background: D.bg }} data-status-bar-foreground="light">
      {/* 顶部条双态:初始=居中「电影」;滚过头部=缩略图+片名+评分(t0006 vs t0010) */}
      <div className="flex items-center h-11 px-1 shrink-0" style={{ background: D.bg }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: D.text }}>
          ‹
        </button>
        {barCompact ? (
          <div className="flex-1 flex items-center gap-2 min-w-0 px-1">
            <Img src={subject.cover} className="w-7 h-9 rounded-sm object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: D.text }}>{subject.title}</div>
              <div className="text-[10px]" style={{ color: D.sub }}>
                {subject.rating == null ? '暂无评分' : `${subject.rating.toFixed(1)}分`}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center text-base font-semibold truncate px-1" style={{ color: D.text }}>
            {subject.type === 'tv' ? '电视剧' : '电影'}
          </div>
        )}
        <button
          {...bindTap({ kind: 'action', id: 'subject.movie.more.complaint' }, { onTrigger: () => openSheet('more') })}
          className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-lg tracking-widest relative"
          style={{ color: D.text }}
        >
          ···
          <span
            className="absolute top-1.5 right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full flex items-center justify-center text-[9px] font-semibold not-italic tracking-normal"
            style={{ background: '#E5484D', color: '#fff' }}
          >
            2
          </span>
        </button>
      </div>

      <div
        ref={mainRef}
        onScroll={(e) => onMainScroll(e.currentTarget)}
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* ---------------- 头部卡 ---------------- */}
        <div className="flex gap-3.5 px-4 pt-2">
          <Img src={subject.cover} className="w-[96px] h-[134px] rounded-md object-cover shrink-0" />
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[20px] font-bold leading-tight" style={{ color: D.text }}>{subject.title}</div>
            {subject.year && <div className="mt-0.5 text-sm" style={{ color: D.sub }}>({subject.year})</div>}
            {subject.hotLabel && (
              <div className="mt-2 inline-flex items-center rounded overflow-hidden text-[11px]">
                <span className="px-1.5 py-0.5 font-semibold" style={{ background: '#4A4237', color: D.gold }}>{subject.hotLabel}</span>
                <span className="px-1.5 py-0.5" style={{ background: '#3D4149', color: D.sub }}>🔥 64.5万 ›</span>
              </div>
            )}
            <div className="mt-2 text-[11px] leading-relaxed" style={{ color: D.sub }}>
              {[subject.info, subject.year ? `${subject.year}(中国大陆) 上映` : null, subject.duration ? `片长${subject.duration} ›` : null]
                .filter(Boolean)
                .join(' / ')}
            </div>
          </div>
        </div>

        {/* ---------------- 标记区 ---------------- */}
        <div className="px-4 mt-3">
          {!mark ? (
            <div className="flex gap-2.5">
              <button
                {...bindTap('subject.movie.markWish-open', {
                  onTrigger: () => go('subject.movie.markWish-open', {}, { state: { status: 'wish' } }),
                })}
                className="flex-1 h-10 rounded-lg text-sm font-semibold border-none cursor-pointer"
                style={{ background: D.card, color: D.gold }}
              >
                ♡ {str.want}
              </button>
              <button
                {...bindTap('subject.movie.markSeen-open', {
                  onTrigger: () => go('subject.movie.markSeen-open', {}, { state: { status: 'done' } }),
                })}
                className="flex-1 h-10 rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center justify-center gap-1.5"
                style={{ background: '#F5F5F1', color: '#8A6D3B' }}
              >
                <Stars value={1} scale="star" size={14} color={SKIN_SHARED.orange} />
                {str.watched}
              </button>
            </div>
          ) : (
            <div className="flex gap-2.5">
              <button
                {...bindTap('subject.movie.markEdit-open')}
                className="flex-1 h-10 rounded-lg px-3 flex items-center justify-between border-none cursor-pointer"
                style={{ background: D.card }}
              >
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: D.gold }}>
                    已{markStatusLabel('movie', mark.status)}
                  </span>
                  {mark.status === 'done' && <Stars value={mark.rating ?? 0} scale="star" size={11} color={D.gold} />}
                  <span className="text-xs" style={{ color: D.faint }}>›</span>
                </span>
                <span className="text-xs" style={{ color: D.faint }}>{fmtDateShort(mark.createdAt).replace(/\./g, '.')}</span>
              </button>
              {mark.status === 'wish' && (
                <button
                  {...bindTap('subject.movie.markSeen-open', {
                    onTrigger: () => go('subject.movie.markSeen-open', {}, { state: { status: 'done' } }),
                  })}
                  className="w-24 h-10 rounded-lg text-sm font-semibold border-none cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                  style={{ background: '#F5F5F1', color: '#8A6D3B' }}
                >
                  <Stars value={1} scale="star" size={14} color={SKIN_SHARED.orange} />
                  看过
                </button>
              )}
            </div>
          )}
        </div>

        {/* ---------------- 豆瓣评分®卡 ---------------- */}
        <div className="mx-4 mt-3 rounded-xl px-4 py-3" style={{ background: D.card }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px]" style={{ color: D.sub }}>豆瓣评分®</span>
            <button
              {...bindTap({ kind: 'action', id: 'subject.movie.neighborRating.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="text-sm bg-transparent border-none cursor-pointer px-1"
              style={{ color: D.faint }}
            >
              ›
            </button>
          </div>
          {subject.rating == null ? (
            <div className="flex items-center justify-between mt-1 pb-1">
              <div>
                <div className="text-base" style={{ color: D.sub }}>暂无评分</div>
                <div className="mt-1 text-xs" style={{ color: D.faint }}>已看过?发布评分</div>
              </div>
              <div className="text-sm font-semibold" style={{ color: D.text }}>
                <span className="mr-1">🔥</span>{fmtCount(9979)}人想看
              </div>
            </div>
          ) : (
            <div className="mt-1">
              <div className="flex items-stretch gap-3">
                {/* 大字分数 */}
                <div className="shrink-0">
                  <div className="text-[40px] font-bold leading-none" style={{ color: D.text }}>
                    {subject.rating.toFixed(1)}
                  </div>
                  <div className="mt-1.5">
                    <Stars value={subject.rating} size={12} color={D.orange} />
                  </div>
                  <div className="mt-1 text-[10px]" style={{ color: D.faint }}>
                    {fmtCount(subject.ratingCount)}人评分
                  </div>
                </div>
                {/* 评分分布条 */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-[3px]">
                  {(subject.ratingDist ?? [0, 0, 0, 0, 0]).map((pct, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <Stars value={5 - i} scale="star" size={7} color={D.faint} />
                      <div className="flex-1 h-[7px] rounded-sm overflow-hidden" style={{ background: '#383D44' }}>
                        <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: D.orange }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* 友邻评分 */}
                <button
                  {...bindTap({ kind: 'action', id: 'subject.movie.neighborRating.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="shrink-0 pl-3 flex flex-col items-center justify-center gap-1 bg-transparent cursor-pointer"
                  style={{ border: 'none', borderLeft: `1px solid #50555C` }}
                >
                  <span className="text-[10px]" style={{ color: D.sub }}>友邻评分</span>
                  <span className="text-sm font-bold" style={{ color: D.text }}>
                    {subject.friendRating?.score != null ? `${subject.friendRating.score.toFixed(1)}分` : '—'}
                  </span>
                  <Avatar src={currentUser.avatar} size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: D.sub }}>
                  {fmtCount(subject.ratingCount * 2)}人看过  {fmtCount(Math.round(subject.ratingCount * 0.075))}人想看
                </span>
                {subject.friendRating && subject.friendRating.count > 0 && friendUsers.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span className="flex -space-x-1.5">
                      {friendUsers.slice(0, 3).map((u) => (
                        <Avatar key={u.id} src={u.avatar} size={16} className="border border-white/20" />
                      ))}
                    </span>
                    <span className="text-[11px]" style={{ color: D.faint }}>看过</span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---------------- 选座购票 / 播放源行 ---------------- */}
        {unreleased ? (
          <button
            {...bindTap({ kind: 'action', id: 'subject.movie.ticket.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="mx-4 mt-3 w-[calc(100%-32px)] h-11 rounded-lg px-3.5 flex items-center gap-2 border-none cursor-pointer"
            style={{ background: '#403B31' }}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{ background: D.gold }}>⚡</span>
            <span className="text-sm font-semibold flex-1 text-left" style={{ color: D.gold }}>选座购票</span>
            {/* 平台图标(t0006 猫眼红黑标) */}
            <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ background: '#191A1B', color: '#FFC933' }}>猫</span>
            <span className="text-xs" style={{ color: D.faint }}>›</span>
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'subject.movie.playSource.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="mx-4 mt-3 w-[calc(100%-32px)] h-11 rounded-lg px-3.5 flex items-center gap-2 border-none cursor-pointer"
            style={{ background: D.card }}
          >
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#E5484D' }}>
              <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2.5 1.5l6 3.5-6 3.5z" fill="#fff" /></svg>
            </span>
            <span className="text-sm font-semibold flex-1 text-left" style={{ color: D.text }}>播放源</span>
            {/* 平台图标(t0067 绿色播放平台标) */}
            <span className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: '#1DB954' }}>
              <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2.5 1.5l6 3.5-6 3.5z" fill="#fff" /></svg>
            </span>
            <span className="text-xs" style={{ color: D.faint }}>›</span>
          </button>
        )}

        {/* ---------------- 剧情简介(全文展示,t0010) ---------------- */}
        <div className="px-4 mt-5">
          <div className="text-base font-bold" style={{ color: D.text }}>剧情简介</div>
          <div
            {...bindTap('subject.movie.intro-open', { params: { itemId: subject.id } })}
            className="mt-2 text-sm leading-relaxed cursor-pointer"
            style={{ color: '#C9CDD2' }}
          >
            {subject.intro ?? '暂无简介'}
          </div>
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => toast('该功能暂未开放')}
              className="text-xs bg-transparent border-none cursor-pointer"
              style={{ color: D.faint }}
            >
              投诉简介
            </button>
          </div>
        </div>

        {/* ---------------- 演职员 ---------------- */}
        {credits.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between px-4">
              <span className="text-base font-bold" style={{ color: D.text }}>演职员</span>
              <button
                {...bindTap('subject.movie.celebrityAll-open', { params: { itemId: subject.id } })}
                className="text-xs bg-transparent border-none cursor-pointer"
                style={{ color: D.sub }}
              >
                全部{credits.length} ›
              </button>
            </div>
            <div className="mt-2.5 flex gap-3 px-4 overflow-x-auto" data-scroll-container="credits" data-scroll-direction="horizontal">
              {credits.map((cr) => {
                const celeb = celebrities.find((c) => c.id === cr.celebrityId);
                return (
                  <div
                    key={cr.name}
                    {...(cr.celebrityId
                      ? bindTap('subject.movie.celebrity-open', { params: { celebrityId: cr.celebrityId } })
                      : bindTap({ kind: 'action', id: 'subject.movie.celebrity.missing' }, { onTrigger: () => toast('暂无影人资料') })
                    )}
                    className="w-[84px] shrink-0 cursor-pointer"
                  >
                    <Img src={celeb?.avatar ?? cr.avatar ?? ''} className="w-[84px] h-[110px] rounded-md object-cover" />
                    <div className="mt-1.5 text-[13px] font-semibold truncate" style={{ color: D.text }}>{cr.name}</div>
                    <div className="text-[11px] truncate" style={{ color: D.faint }}>{cr.role}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- 视频 / 剧照 ---------------- */}
        <div className="mt-5">
          <div className="flex items-center justify-between px-4">
            <span className="text-base font-bold" style={{ color: D.text }}>视频 / 剧照</span>
            <button
              {...bindTap('subject.movie.photoAll-open', { params: { itemId: subject.id } })}
              className="text-xs bg-transparent border-none cursor-pointer"
              style={{ color: D.sub }}
            >
              全部{subject.photosCount ?? STILLS.length} ›
            </button>
          </div>
          <div className="mt-2.5 flex gap-2 px-4 overflow-x-auto" data-scroll-container="photos" data-scroll-direction="horizontal">
            {STILLS.map((src, i) => (
              <div
                key={src}
                {...bindTap('subject.movie.photo-open', {
                  params: { itemId: subject.id, photoIndex: i },
                  beforeTrigger: () => setImageViewerPayload({ images: STILLS, index: i }),
                })}
                className="relative shrink-0 cursor-pointer rounded-md overflow-hidden"
                style={{ width: i === 0 ? 200 : 168, height: 112 }}
              >
                <Img src={src} className="w-full h-full object-cover" />
                {i === 0 && (
                  <>
                    <span className="absolute top-1.5 left-1.5 px-1 rounded text-[10px] text-white" style={{ background: D.gold }}>预告片</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <svg width="12" height="12" viewBox="0 0 10 10"><path d="M2.5 1l6 4-6 4z" fill="#fff" /></svg>
                      </span>
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 text-[10px] text-white">01:32</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- 短评区 ---------------- */}
        <div className="mt-6 px-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-bold" style={{ color: D.text }}>短评 ⓘ</span>
            <button
              {...bindTap('subject.movie.shortReviews-open', { params: { subjectId: subject.id } })}
              className="text-xs bg-transparent border-none cursor-pointer"
              style={{ color: D.sub }}
            >
              全部短评 {fmtCount(subjectComments.length + 18000)} ›
            </button>
          </div>
          <div className="mt-1">
            {subjectComments.slice(0, 3).map((c) => {
              const author = userById.get(c.authorId);
              return (
                <div key={c.id} className="py-3" style={{ borderBottom: '1px solid #3D4149' }}>
                  <div className="flex items-center gap-2">
                    <Avatar src={author?.avatar ?? ''} size={26} />
                    <span className="text-[13px] font-semibold" style={{ color: '#C9CDD2' }}>{author?.name ?? '豆友'}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {c.rating != null && <Stars value={c.rating} scale="star" size={10} color={D.orange} />}
                    <span className="text-[10px]" style={{ color: D.faint }}>
                      {fmtDateShort(c.createdAt)} {c.ipLocation}
                    </span>
                  </div>
                  <div className="mt-1.5 text-sm leading-relaxed" style={{ color: '#DADDE0' }}>{c.text}</div>
                  <div className="mt-2 text-xs" style={{ color: D.faint }}>👍 {fmtCount(c.likes)}</div>
                </div>
              );
            })}
          </div>
          <button
            {...bindTap('subject.movie.shortReviews-open', { params: { subjectId: subject.id } })}
            className="mt-3 w-full h-10 rounded-lg text-sm cursor-pointer"
            style={{ background: 'transparent', color: D.sub, border: '1px solid #50555C' }}
          >
            查看全部短评
          </button>
        </div>

        {/* ---------------- 喜欢这部电影的人也喜欢 ---------------- */}
        <div className="mt-6">
          <div className="px-4 text-base font-bold" style={{ color: D.text }}>喜欢这部电影的人也喜欢</div>
          <div className="mt-2.5 flex gap-3 px-4 overflow-x-auto pb-1" data-scroll-container="similar" data-scroll-direction="horizontal">
            {similar.map((s) => (
              <div
                key={s.id}
                {...bindTap('subject.movie.similar-open', { params: { itemId: s.id } })}
                className="w-[84px] shrink-0 cursor-pointer"
              >
                <Img src={s.cover} className="w-[84px] h-[118px] rounded-md object-cover" />
                <div className="mt-1.5 text-[13px] truncate" style={{ color: D.text }}>{s.title}</div>
                <div className="text-[11px]" style={{ color: s.rating == null ? D.faint : D.orange }}>
                  {s.rating == null ? '暂无评分' : s.rating.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ---------------- 底部内容 tab(白色抽屉区) ---------------- */}
        <div ref={sheetRef} className="mt-5 rounded-t-2xl bg-white" style={{ minHeight: 480 }}>
          <div className="flex justify-center pt-1.5">
            <span className="w-9 h-1 rounded-full" style={{ background: '#D8DCE1' }} />
          </div>
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl flex items-center px-4 pt-1 pb-2 border-b" style={{ borderColor: '#F0F1F2' }}>
            {(
              [
                ['overall', `综合 ${counts.overall}`],
                ['reviews', `${reviewWord} ${counts.reviews}`],
                ['discussions', `讨论 ${counts.discussions}`],
              ] as const
            ).map(([id, label]) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  {...bindTap(
                    { kind: 'action', id: 'subject.movie.contentTab.select.target' },
                    { params: { target: id }, onTrigger: () => setTab(id) },
                  )}
                  className="mr-5 pb-1 bg-transparent border-none cursor-pointer relative text-[15px]"
                  style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
                >
                  {label}
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
                </button>
              );
            })}
            <div className="flex-1" />
            <Avatar src={currentUser.avatar} size={30} />
          </div>

          {/* -------- tab.overall -------- */}
          {tab === 'overall' && (
            <div className="px-4 pb-8">
              {/* 写短评入口:头像 + 灰底输入胶囊(无标题短输入,区别于影评/讨论) */}
              <button {...openCompose('comment')} className="w-full flex items-center gap-2.5 py-3 bg-transparent border-none cursor-pointer">
                <Avatar src={currentUser.avatar} size={30} />
                <span className="flex-1 h-8 rounded-full flex items-center px-3.5 text-[13px]" style={{ background: '#F2F3F5', color: C.sub }}>写条短评,分享你的感受…</span>
              </button>
              {/* 已标记时间线(state.markedTimeline) */}
              {mark && (
                <div className="pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[15px]" style={{ color: C.text }}>
                      <b>{mark.status === 'done' ? '已看过' : '想看'}</b>{' '}
                      <span className="text-[13px]" style={{ color: C.sub }}>
                        {mark.status === 'done' ? `历时${markDays}天` : `第${markDays}天`}
                      </span>
                    </span>
                    <button
                      onClick={() => toast('该功能暂未开放')}
                      className="px-2 py-1 rounded text-xs border-none cursor-pointer"
                      style={{ background: '#EAF3FC', color: '#4A90D9' }}
                    >
                      {mark.status === 'done' ? `🏅 看过的第${Math.max(doneCount, 1)}部 ›` : '📗 书影音档案 ›'}
                    </button>
                  </div>
                  {/* 年度时间轴 */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[11px]" style={{ color: '#4A90D9' }}>
                      <span className="px-1 rounded-sm" style={{ background: '#EAF3FC' }}>{monthText}</span>
                      <span style={{ color: C.sub }}>{yearText}</span>
                    </div>
                    <div className="mt-1 relative h-[3px] rounded-full" style={{ background: '#E8ECF0' }}>
                      <span className="absolute -left-0.5 -top-[3.5px] w-2.5 h-2.5 rounded-full" style={{ background: '#4A90D9' }} />
                    </div>
                    <div className="mt-1 text-[10px]" style={{ color: C.sub }}>
                      {fmtDateShort(mark.createdAt).slice(5)}{mark.status === 'done' ? '想看 · 看过' : '想看'}
                    </div>
                  </div>
                  {/* 书影音记录流水 */}
                  <div className="mt-3 relative pl-5">
                    <span className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: '#CFE0F0' }} />
                    <div className="relative mb-3">
                      <span className="absolute -left-5 top-1 w-3 h-3 rounded-full" style={{ background: '#4A90D9' }} />
                      <span className="text-[13px]" style={{ color: C.text }}>{timelineRecords.length}条书影音记录</span>
                    </div>
                    {timelineRecords.map((rec) => (
                      <div key={rec.key} className="relative mb-3 rounded-xl p-3" style={{ background: '#F0F6FC' }}>
                        <span className="absolute -left-[15px] top-4 w-[14px] h-[14px] rounded-full flex items-center justify-center" style={{ background: '#4A90D9' }}>
                          <svg width="8" height="8" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs" style={{ color: C.sub }}>{fmtAbsDateTime(rec.ts)}</span>
                          <button
                            {...bindTap('subject.movie.markEdit-open')}
                            className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer"
                            aria-label="编辑标记"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A8F99" strokeWidth="2">
                              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-[15px] font-bold" style={{ color: C.text }}>{rec.label}</span>
                          {rec.key === 'done' && rec.rating != null && rec.rating > 0 && (
                            <Stars value={rec.rating} scale="star" size={12} color={D.orange} />
                          )}
                        </div>
                        {rec.comment && <div className="mt-1 text-sm" style={{ color: C.text }}>{rec.comment}</div>}
                        {rec.key === (mark.status === 'done' ? 'done' : 'wish') && (
                          <div className="mt-2 flex justify-end">
                            <button
                              {...bindTap({ kind: 'action', id: 'subject.movie.timelineShare.wontfix' }, { onTrigger: () => {
                                const launched = shareWithSystem(`【豆瓣】${subject.title} · ${rec.label}`, (r) => { if (r.resultCode === 'OK') toast('分享成功'); });
                                if (!launched) toast('无法打开系统分享');
                              } })}
                              className="text-xs bg-transparent border-none cursor-pointer"
                              style={{ color: C.sub }}
                            >
                              ⇪ 分享到微信、微博
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {/* 有人所见略同 */}
                  <div className="rounded-xl border" style={{ borderColor: '#EDEFF2' }}>
                    <button
                      {...bindTap({ kind: 'action', id: 'subject.movie.sameView.toggle' }, { onTrigger: () => setSameViewOpen((v) => !v) })}
                      className="w-full flex items-center justify-between px-3.5 h-12 bg-transparent border-none cursor-pointer"
                    >
                      <span className="text-[15px] font-semibold" style={{ color: C.text }}>有人所见略同</span>
                      <span className="flex items-center gap-1.5">
                        <span className="flex -space-x-1.5">
                          {friendUsers.slice(0, 3).map((u) => (
                            <Avatar key={u.id} src={u.avatar} size={18} className="border border-white" />
                          ))}
                        </span>
                        <span className="text-xs" style={{ color: C.sub }}>{sameViewOpen ? '⌃' : '⌄'}</span>
                      </span>
                    </button>
                    {sameViewOpen && (
                      <div className="px-3.5 pb-3 flex flex-wrap gap-3">
                        {friendUsers.map((u) => (
                          <div key={u.id} className="flex flex-col items-center w-14">
                            <Avatar src={u.avatar} size={36} />
                            <span className="mt-1 text-[10px] truncate w-full text-center" style={{ color: C.sub }}>{u.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 排序 + 混排内容 */}
              <div className="flex items-center justify-between pt-4">
                <span className="text-[13px]" style={{ color: C.sub }}>全部内容</span>
                <div className="flex gap-1.5">
                  {([['hot', '热门'], ['new', '最新']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      {...bindTap(
                        { kind: 'action', id: 'subject.movie.overallSort.select.target' },
                        { params: { target: id }, onTrigger: () => setOverallSort(id) },
                      )}
                      className="px-2.5 py-0.5 rounded-full text-xs border-none cursor-pointer"
                      style={{ background: overallSort === id ? '#F2F3F5' : 'transparent', color: overallSort === id ? C.text : C.sub, fontWeight: overallSort === id ? 600 : 400 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {/* 热门影评卡 */}
              {subjectReviews.slice(0, 2).map((r) => {
                const author = userById.get(r.authorId);
                return (
                  <div key={r.id} {...bindTap('subject.movie.review-open', { params: { reviewId: r.id } })} className="py-3 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                    <div className="flex items-center gap-2">
                      <Avatar src={author?.avatar ?? ''} size={24} />
                      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name}</span>
                      <span className="px-1 rounded text-[10px]" style={{ background: '#F2F3F5', color: C.sub }}>看过</span>
                      <Stars value={r.rating} scale="star" size={10} color={D.orange} />
                    </div>
                    <div className="mt-1.5 text-[15px] font-bold" style={{ color: C.text }}>{r.title}</div>
                    <div className="mt-1 text-[13px] line-clamp-2" style={{ color: C.sub }}>{r.text}</div>
                    <div className="mt-1.5 text-xs" style={{ color: '#B9BEC6' }}>{r.replyCount}回复 · {r.useful}有用</div>
                  </div>
                );
              })}
              {/* 短评卡 */}
              {subjectComments.map((c) => {
                const author = userById.get(c.authorId);
                return (
                  <div key={c.id} className="py-3 border-b" style={{ borderColor: '#F5F6F7' }}>
                    <div className="flex items-center gap-2">
                      <Avatar src={author?.avatar ?? ''} size={24} />
                      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name}</span>
                      <span className="px-1 rounded text-[10px]" style={{ background: '#F2F3F5', color: C.sub }}>
                        {c.rating != null ? '看过' : '想看'}
                      </span>
                      {c.rating != null && <Stars value={c.rating} scale="star" size={10} color={D.orange} />}
                    </div>
                    <div className="mt-1.5 text-sm leading-relaxed" style={{ color: C.text }}>{c.text}</div>
                    <div className="mt-1.5 text-xs" style={{ color: '#B9BEC6' }}>
                      👍 {fmtCount(c.likes)} · {relTime(c.createdAt, nowTs)} · IP属地{c.ipLocation}
                    </div>
                  </div>
                );
              })}
              <TheEnd />
            </div>
          )}

          {/* -------- tab.reviews -------- */}
          {tab === 'reviews' && (
            <div className="px-4 pb-8">
              {/* 写影评/剧评入口:整块「写{影评|剧评}」按钮(带标题的长评,区别于短评) */}
              <button {...openCompose('review')} className="w-full flex items-center gap-2 mt-3 h-11 rounded-lg border-none cursor-pointer" style={{ background: C.greenSoft }}>
                <span className="ml-3.5 text-base" style={{ color: C.green }}>✎</span>
                <span className="text-sm font-medium" style={{ color: C.green }}>写{reviewWord}</span>
                <span className="flex-1 text-right mr-3.5 text-xs" style={{ color: C.green }}>发表你的长篇评论 ›</span>
              </button>
              <div className="flex items-center justify-between pt-3">
                <span className="text-[13px]" style={{ color: C.sub }}>{reviewWord}列表</span>
                <div className="flex gap-1.5">
                  {([['hot', '热门'], ['new', '最新'], ['friend', '友邻']] as const).map(([id, label]) => (
                    <button
                      key={id}
                      {...bindTap(
                        { kind: 'action', id: 'subject.movie.reviewSort.select.target' },
                        { params: { target: id }, onTrigger: () => setReviewSort(id) },
                      )}
                      className="px-2.5 py-0.5 rounded-full text-xs border-none cursor-pointer"
                      style={{ background: reviewSort === id ? '#F2F3F5' : 'transparent', color: reviewSort === id ? C.text : C.sub, fontWeight: reviewSort === id ? 600 : 400 }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {subjectReviews.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>
                  {reviewSort === 'friend' ? `关注的人还没有写过${reviewWord}` : `还没有${reviewWord},来写第一篇`}
                </div>
              ) : (
                subjectReviews.map((r) => {
                  const author = userById.get(r.authorId);
                  return (
                    <div key={r.id} {...bindTap('subject.movie.review-open', { params: { reviewId: r.id } })} className="py-3.5 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                      <div className="flex items-center gap-2">
                        <Avatar src={author?.avatar ?? ''} size={24} />
                        <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name}</span>
                        <span className="px-1 rounded text-[10px]" style={{ background: '#F2F3F5', color: C.sub }}>看过</span>
                        <Stars value={r.rating} scale="star" size={10} color={D.orange} />
                      </div>
                      <div className="mt-1.5 text-[15px] font-bold leading-snug" style={{ color: C.text }}>{r.title}</div>
                      <div className="mt-1 text-[13px] line-clamp-3" style={{ color: C.sub }}>{r.text}</div>
                      <div className="mt-1.5 text-xs" style={{ color: '#B9BEC6' }}>{r.replyCount}回复 · {r.useful}有用</div>
                    </div>
                  );
                })
              )}
              <TheEnd />
            </div>
          )}

          {/* -------- tab.discussions -------- */}
          {tab === 'discussions' && (
            <div className="px-4 pb-8">
              <div className="flex items-center justify-between pt-3">
                <span className="text-[13px]" style={{ color: C.sub }}>讨论列表</span>
                <div className="flex gap-1.5">
                  {([['new', '最新'], ['hot', '热门']] as const).map(([id, label]) => {
                    const active = discussSort === id;
                    return (
                      <button
                        key={id}
                        {...bindTap(
                          { kind: 'action', id: 'subject.movie.discussSort.select.target' },
                          { params: { target: id }, onTrigger: () => setDiscussSort(id) },
                        )}
                        className="px-2.5 py-0.5 rounded-full text-xs cursor-pointer"
                        style={
                          active
                            ? { background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontWeight: 600 }
                            : { background: 'transparent', border: '1px solid transparent', color: C.sub, fontWeight: 400 }
                        }
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {subjectDiscussions.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>还没有讨论</div>
              ) : (
                subjectDiscussions.map((d) => {
                  const author = userById.get(d.authorId);
                  return (
                    <div key={d.id} {...bindTap('subject.movie.discussion-open', { params: { discussionId: d.id } })} className="flex gap-3 py-3.5 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                      <span className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#F2F3F5', color: C.sub }}>
                        {d.replyCount}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>{d.title}</div>
                        <div className="mt-1 text-xs" style={{ color: '#B9BEC6' }}>
                          {author?.name} · {d.likeCount}赞 · {relTime(d.createdAt, nowTs)}更新
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <TheEnd />
            </div>
          )}
        </div>
      </div>

      {/* 内容 tab 条钉底(浏览上部区域时钉在屏幕底缘,t0010/t0032/t0078) */}
      {!sheetReached && (
        <div className="absolute left-0 right-0 bottom-0 z-10 bg-white flex items-center px-4 pt-1.5 pb-2 border-t shadow-[0_-1px_6px_rgba(0,0,0,0.06)]" style={{ borderColor: '#F0F1F2' }}>
          {(
            [
              ['overall', `综合 ${counts.overall}`],
              ['reviews', `${reviewWord} ${counts.reviews}`],
              ['discussions', `讨论 ${counts.discussions}`],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                {...bindTap(
                  { kind: 'action', id: 'subject.movie.contentTab.select.target' },
                  {
                    params: { target: id },
                    onTrigger: () => {
                      setTab(id);
                      jumpToSheet();
                    },
                  },
                )}
                className="mr-5 pb-1 bg-transparent border-none cursor-pointer relative text-[15px]"
                style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
              >
                {label}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
              </button>
            );
          })}
          <div className="flex-1" />
          <Avatar src={currentUser.avatar} size={30} />
        </div>
      )}

      {/* 写内容悬浮铅笔 FAB(仅讨论 tab 出现,t0044)→ 发起讨论(带标题) */}
      {tab === 'discussions' && (
        <button
          {...openCompose('discussion')}
          className="absolute right-4 bottom-8 w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer shadow-lg z-20"
          style={{ background: '#1A1A1A' }}
          aria-label="发起讨论"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}

      {/* ---------------- 更多菜单 sheet(URL 驱动 ?sheet=more) ---------------- */}
      {sheet === 'more' && (
        <Sheet>
          <SheetRow
            icon={<span>🚫</span>}
            label="投诉"
            bind={{
              onClick: () => {
                setComplaintReason(null);
                setSearchParams((p) => {
                  p.set('sheet', 'complaint');
                  return p;
                }, { replace: true });
              },
            }}
          />
          <SheetRow icon={<span>🔗</span>} label="复制链接" bind={{ onClick: () => {
            const copied = copyToClipboard(`https://www.douban.com/subject/${subject?.id ?? ''}`);
            toast(copied ? '链接已复制' : '无法访问剪切板');
            back();
          } }} />
          <SheetRow icon={<span>📤</span>} label="分享" bind={{ onClick: () => {
            const launched = shareWithSystem(`【豆瓣】${subject?.title ?? '影视作品'}`, (r) => { if (r.resultCode === 'OK') toast('分享成功'); });
            if (!launched) toast('无法打开系统分享');
            back();
          } }} />
        </Sheet>
      )}

      {/* ---------------- 投诉页(子 uiState,?sheet=complaint) ---------------- */}
      {sheet === 'complaint' && (
        <div className="absolute inset-0 z-50 flex flex-col bg-white" data-status-bar-foreground="dark">
          <div className="flex items-center h-11 px-1 border-b shrink-0" style={{ borderColor: C.border }}>
            <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
              ‹
            </button>
            <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>投诉</div>
            <div className="w-10" />
          </div>
          <div className="flex-1 overflow-y-auto px-4 pt-3" data-scroll-container="complaint" data-scroll-direction="vertical">
            <div className="text-sm" style={{ color: C.sub }}>请选择投诉《{subject.title}》的理由</div>
            <div className="mt-2">
              {COMPLAINT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setComplaintReason(r)}
                  className="w-full flex items-center justify-between h-12 bg-transparent border-none cursor-pointer border-b text-left"
                  style={{ borderBottom: `1px solid #F5F6F7` }}
                >
                  <span className="text-[15px]" style={{ color: C.text }}>{r}</span>
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ border: complaintReason === r ? 'none' : '1.5px solid #D8DCE1', background: complaintReason === r ? C.green : 'transparent' }}
                  >
                    {complaintReason === r && (
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="px-4 py-3 shrink-0">
            <button
              onClick={() => {
                if (!complaintReason) {
                  toast('请先选择投诉理由');
                  return;
                }
                toast('投诉已提交,我们会尽快处理');
                back();
              }}
              className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer"
              style={{ background: complaintReason ? C.green : '#C9E9CE', color: '#fff' }}
            >
              提交
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
