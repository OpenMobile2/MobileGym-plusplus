import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Img, Stars, TheEnd, SegRow, fmtCount } from '../components/ui';
import { markStatusLabel } from '../components/MarkSheetCore';
import { payWithSystem } from '../capabilities';
import { setImageViewerPayload } from './MediaImageviewerPage';

// 节点: subject.book —— 图书条目详情。
// evidence: frame:8b7ecc@t0010/t0018/t0036/t0047
function fmtDate(ts: number): string {
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

type BottomTab = 'reviews' | 'discussions' | 'notes';
type ReviewSort = '热门' | '最新' | '友邻';

/** 想读=♡+ / 在读=⊙ / 读过=☆(橙色描边图标,evidence t0010) */
function MarkIcon({ status }: { status: 'wish' | 'doing' | 'done' }) {
  if (status === 'wish') {
    return (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path
          d="M12 20.5 C7.5 17 4 13.8 4 10.2 C4 7.6 6 5.7 8.4 5.7 C10 5.7 11.3 6.6 12 7.9 C12.7 6.6 14 5.7 15.6 5.7 C16.1 5.7 16.6 5.8 17 6"
          stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        />
        <path d="M19 3 v6 M16 6 h6" stroke={C.orange} strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (status === 'doing') {
    return (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <circle cx="12" cy="12" r="8.5" stroke={C.orange} strokeWidth="2" />
        <circle cx="12" cy="12" r="3" fill={C.orange} />
      </svg>
    );
  }
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 3.5l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.1 6.1-.7L12 3.5z"
        stroke={C.orange} strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function SubjectBookPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const reviews = useDoubanStore((s) => s.reviews);
  const discussions = useDoubanStore((s) => s.discussions);
  const comments = useDoubanStore((s) => s.comments);
  const users = useDoubanStore((s) => s.users);
  const follows = useDoubanStore((s) => s.follows);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);

  const books = useMemo(() => subjects.filter((s) => s.type === 'book'), [subjects]);
  const subjectId = routeParams.subjectId ?? books[0]?.id ?? 'bk1';
  const subject = useMemo(() => subjects.find((s) => s.id === subjectId) ?? books[0], [subjects, subjectId]);

  useEffect(() => {
    if (subject) addHistory('subject', subject.id);
  }, [addHistory, subject]);

  const [tab, setTab] = useState<BottomTab>('reviews');
  const [reviewSort, setReviewSort] = useState<ReviewSort>('热门');
  const [scrolled, setScrolled] = useState(false);
  const mark = useMemo(() => marks.find((m) => m.subjectId === subject?.id), [marks, subject?.id]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const nowTs = TimeService.now();

  const bookReviews = useMemo(() => reviews.filter((r) => r.subjectId === subject?.id), [reviews, subject?.id]);
  const sortedReviews = useMemo(() => {
    if (reviewSort === '友邻') return [];
    if (reviewSort === '最新') return [...bookReviews].sort((a, b) => b.createdAt - a.createdAt);
    return [...bookReviews].sort((a, b) => b.useful - a.useful);
  }, [bookReviews, reviewSort]);
  const bookDiscussions = useMemo(() => discussions.filter((d) => d.subjectId === subject?.id), [discussions, subject?.id]);
  const bookComments = useMemo(() => comments.filter((c) => c.subjectId === subject?.id), [comments, subject?.id]);

  const translator = userById.get('u_jiegeng');
  const translatorFollowed = translator ? follows.users.includes(translator.id) : false;

  if (!subject) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>图书不存在</div>
      </div>
    );
  }

  const hotSegs = subject.hotLabel ? subject.hotLabel.split('|') : null;
  const ratingDist = subject.ratingDist ?? [];
  const distMax = Math.max(1, ...ratingDist);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:未滚动=居中「图书」+⋯;滚动后=小封面+书名+星级分数(evidence t0010/t0036) */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        {scrolled ? (
          <div className="flex-1 flex items-center gap-2 min-w-0 px-1">
            <Img src={subject.cover} className="w-6 h-8 rounded-sm object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-[13px] font-semibold truncate leading-tight" style={{ color: C.text }}>{subject.title}</div>
              {subject.rating != null && (
                <div className="flex items-center gap-1 leading-none">
                  <Stars value={subject.rating} size={8} />
                  <span className="text-[11px] font-semibold" style={{ color: C.orange }}>{subject.rating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>图书</div>
        )}
        <div className="w-10 h-10 flex items-center justify-center relative">
          <span className="text-xl leading-none" style={{ color: C.text }}>⋯</span>
          <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 88)}
      >
        {/* 头部:封面 + 书名 + 热门榜章 + 作者出版社 */}
        <div className="bg-white flex gap-3.5 px-4 pt-3 pb-3">
          <div {...bindTap('subject.book.cover-open', { beforeTrigger: () => setImageViewerPayload({ images: [subject.cover], index: 0 }) })} className="cursor-pointer shrink-0">
            <Img src={subject.cover} className="w-[92px] h-[128px] rounded-md object-cover" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[18px] font-bold leading-tight" style={{ color: C.text }}>{subject.title}</div>
            {hotSegs && (
              <div className="mt-1.5 inline-flex items-center rounded overflow-hidden text-[10px]">
                <span className="px-1.5 py-0.5 font-bold" style={{ background: '#4A3B26', color: '#F0C078' }}>{hotSegs[0]}</span>
                <span className="px-1.5 py-0.5 font-semibold" style={{ background: '#FBEED9', color: '#B26A1F' }}>{hotSegs[1]} ›</span>
              </div>
            )}
            <div className="mt-2 text-xs leading-relaxed" style={{ color: C.sub }}>
              {[subject.author, subject.press, subject.year && `${subject.year}`].filter(Boolean).join(' / ')}
            </div>
          </div>
        </div>

        {/* 标记按钮行(浅底 + 橙色图标 ♡+/⊙/☆ + 橙字,evidence t0010) / 已标记深色半透明横条(t0047) */}
        <div className="bg-white px-4 pb-3">
          {!mark ? (
            <div className="flex gap-2.5">
              {(['wish', 'doing', 'done'] as const).map((status) => (
                <button
                  key={status}
                  {...bindTap('subject.book.mark-open', { params: { subjectId: subject.id, status } })}
                  className="flex-1 h-9 rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ background: '#FDF4E7', color: C.orange }}
                >
                  <MarkIcon status={status} />
                  {markStatusLabel('book', status)}
                </button>
              ))}
            </div>
          ) : (
            <button
              {...bindTap('subject.book.remark-open')}
              className="w-full h-9 rounded-md px-3 flex items-center justify-between border-none cursor-pointer"
              style={{ background: 'rgba(26,26,26,0.72)' }}
            >
              <span className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-white">已{markStatusLabel('book', mark.status)}</span>
                {mark.status === 'done' && mark.rating != null && <Stars value={mark.rating} scale="star" size={11} color={C.orange} />}
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.85)' }}>{fmtDate(mark.createdAt)} ›</span>
            </button>
          )}
        </div>

        {/* 书影音档案时间线(标记后出现,带编辑铅笔) */}
        {mark && (
          <div className="mt-2 bg-white px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold" style={{ color: C.text }}>书影音档案</span>
              <button
                {...bindTap('subject.book.timelineEdit-open')}
                className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer"
                style={{ color: C.sub }}
                aria-label="编辑标记"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="mt-2 rounded-lg p-3" style={{ background: '#F7F8FA' }}>
              <div className="text-xs" style={{ color: C.sub }}>{fmtDate(mark.createdAt)}</div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: C.text }}>标记了{markStatusLabel('book', mark.status)}</span>
                {mark.status === 'done' && mark.rating != null && <Stars value={mark.rating} scale="star" size={11} color={C.gold} />}
              </div>
              {mark.comment && <div className="mt-1 text-sm" style={{ color: C.text }}>{mark.comment}</div>}
            </div>
          </div>
        )}

        {/* 豆瓣评分卡:®标题 + 大字 + 星排 + 5行橙色直方图 + 淡字人评分 + 三态人数行(evidence t0010/t0036) */}
        <button
          {...bindTap('subject.book.shortReviews-open', { params: { subjectId: subject.id } })}
          className="mt-2 w-full bg-white px-4 py-3 border-none cursor-pointer text-left"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: C.sub }}>豆瓣评分®</span>
            <span className="text-sm" style={{ color: '#C3C9D1' }}>›</span>
          </div>
          {subject.rating == null ? (
            <div className="mt-1.5 flex items-center justify-between">
              <div>
                <div className="text-sm" style={{ color: C.sub }}>暂无评分</div>
                <div className="mt-0.5 text-sm" style={{ color: C.sub }}>
                  已读过?<span className="font-bold" style={{ color: C.text }}>发布评分</span>
                </div>
              </div>
              <span className="text-sm" style={{ color: C.text }}>{fmtCount(subject.wishCount ?? 0)}人想读</span>
            </div>
          ) : (
            <>
              <div className="mt-1.5 flex items-center gap-4">
                <div className="shrink-0">
                  <div className="text-[40px] font-bold leading-none" style={{ color: C.text }}>{subject.rating.toFixed(1)}</div>
                  <div className="mt-1"><Stars value={subject.rating} size={11} color={C.orange} /></div>
                </div>
                <div className="flex-1 min-w-0">
                  {[5, 4, 3, 2, 1].map((star, i) => (
                    <div key={star} className="flex items-center gap-1.5 h-[13px]">
                      <span
                        className="shrink-0 text-right leading-none"
                        style={{ color: '#D8DCE1', fontSize: 8, width: 42, letterSpacing: 1 }}
                      >
                        {'★'.repeat(star)}
                      </span>
                      <div
                        className="h-[5px] rounded-sm"
                        style={{ background: C.orange, width: `${((ratingDist[i] ?? 0) / distMax) * 62}%` }}
                      />
                    </div>
                  ))}
                  <div className="text-right text-[10px] leading-none mt-0.5" style={{ color: '#E0E2E6' }}>
                    #{fmtCount(subject.ratingCount)}人评分
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-4 text-xs" style={{ color: C.sub }}>
                <span>{fmtCount(subject.doneCount ?? 0)}人读过</span>
                <span>{fmtCount(subject.doingCount ?? 0)}人在读</span>
                <span>{fmtCount(subject.wishCount ?? 0)}人想读</span>
              </div>
            </>
          )}
        </button>

        {/* 京东购买卡:卡头 + 纸质版tag + 现价/划线原价 + 顿号meta(evidence t0010/t0036) */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: C.text }}>前往京东商城购买</span>
            <span className="px-1 py-px text-[10px] rounded-sm" style={{ border: '1px solid #C3C9D1', color: C.sub }}>纸质版</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Img src={subject.cover} className="w-11 h-14 rounded object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold" style={{ color: C.danger }}>¥{(subject.buyPrice ?? 38).toFixed(2)}</span>
                {subject.origPrice != null && (
                  <span className="text-xs line-through" style={{ color: '#B9BEC6' }}>¥{subject.origPrice.toFixed(2)}</span>
                )}
              </div>
              <div className="mt-1 text-xs truncate" style={{ color: C.sub }}>
                {[subject.press, subject.year && `${subject.year}出版`, '共392页'].filter(Boolean).join('、')}
              </div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'subject.book.jdBuy.wontfix' }, { onTrigger: () => {
                const launched = payWithSystem(
                  { amount: subject.buyPrice ?? 38, orderId: `book-${subject.id}`, subject: subject.title },
                  (result) => { if (result.resultCode === 'OK') toast('支付成功'); },
                );
                if (!launched) toast('无法打开系统支付');
              } })}
              className="px-3.5 h-8 rounded-md text-sm font-semibold text-white border-none cursor-pointer shrink-0"
              style={{ background: C.danger }}
            >
              立即购买
            </button>
          </div>
        </div>
        {/* 更多电子书/纸质版购买:卡片下方独立一行,右对齐(evidence t0010) */}
        <div className="px-4 py-2 flex justify-end">
          <button
            {...bindTap({ kind: 'action', id: 'subject.book.moreBuy.wontfix' }, { onTrigger: () => {
              const launched = payWithSystem(
                { amount: subject.buyPrice ?? 38, orderId: `book-${subject.id}`, subject: subject.title },
                (result) => { if (result.resultCode === 'OK') toast('支付成功'); },
              );
              if (!launched) toast('无法打开系统支付');
            } })}
            className="text-xs bg-transparent border-none cursor-pointer p-0"
            style={{ color: C.sub }}
          >
            更多电子书 / 纸质版购买 ›
          </button>
        </div>

        {/* 在线试读条:左绿色豆瓣阅读logo,右两个圆形第三方app小图标(evidence t0010/t0036) */}
        <button
          {...bindTap({ kind: 'action', id: 'subject.book.preview.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="mt-2 w-full bg-white px-4 py-3 flex items-center gap-2.5 border-none cursor-pointer"
        >
          <span className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: C.green }}>读</span>
          <span className="text-[15px] font-semibold flex-1 text-left" style={{ color: C.text }}>在线试读</span>
          <span className="flex items-center gap-1.5 shrink-0">
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#4A9FE8' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M4 17c5 1 9-1 11-5l3-6-6 3c-4 2-7 4-8 8z" /></svg>
            </span>
            <span className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F2611C' }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M6 4h9a3 3 0 013 3v13l-4-3H9a3 3 0 01-3-3V4z" /></svg>
            </span>
          </span>
        </button>

        {/* 简介 */}
        {subject.intro && (
          <div className="mt-2 bg-white px-4 py-3">
            <div className="text-base font-bold mb-1.5" style={{ color: C.text }}>简介</div>
            <div
              {...bindTap('subject.book.intro-open', { params: { itemId: subject.id } })}
              className="text-sm leading-relaxed line-clamp-2 cursor-pointer"
              style={{ color: C.text }}
            >
              {subject.intro}
              <span style={{ color: C.sub }}> …展开</span>
            </div>
          </div>
        )}

        {/* 作者 / 译者 横向照片卡区(evidence t0018/t0036,代表作为虚构) */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold" style={{ color: C.text }}>作者</div>
              <div className="mt-2 flex gap-2.5 items-start">
                <Img src="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{subject.author ?? '佚名'}</div>
                  <div className="mt-1 text-[11px] leading-snug line-clamp-2" style={{ color: C.sub }}>
                    代表作:{subject.title}、静水深流
                  </div>
                </div>
              </div>
            </div>
            {translator && (
              <div className="flex-1 min-w-0">
                <div className="text-base font-bold" style={{ color: C.text }}>译者</div>
                <div className="mt-2 flex gap-2.5 items-start">
                  <Img src={translator.avatar} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{translator.name}</div>
                    <div className="mt-1 text-[11px] leading-snug line-clamp-2" style={{ color: C.sub }}>
                      代表作:云端之上、把复杂说简单、独自远行
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 目录 / 摘录 双卡(区标题 + 目录4行 + 摘录正文 + 引自,evidence t0018) */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="text-base font-bold mb-2" style={{ color: C.text }}>目录 / 摘录</div>
          <div className="flex gap-3">
            <button
              {...bindTap('subject.book.toc-open', { params: { tab: '目录' } })}
              className="flex-1 min-w-0 rounded-lg p-3 border cursor-pointer text-left"
              style={{ borderColor: C.border, background: '#FAFBFC' }}
            >
              {(subject.toc && subject.toc.length > 0 ? subject.toc : ['暂无目录']).slice(0, 4).map((line, i) => (
                <div key={i} className="text-xs leading-5 truncate" style={{ color: C.text }}>{line}</div>
              ))}
              <div className="mt-1.5 text-xs" style={{ color: C.sub }}>完整目录 ›</div>
            </button>
            <button
              {...bindTap('subject.book.digest-open', { params: { tab: '摘录' } })}
              className="flex-1 min-w-0 rounded-lg p-3 border cursor-pointer text-left"
              style={{ borderColor: C.border, background: '#FAFBFC' }}
            >
              <div className="text-xs leading-5 line-clamp-4" style={{ color: C.text }}>
                我们习惯把乌托邦读成逃避,可它更像一次演习——在纸上把不同的社会分工试跑一遍。
              </div>
              <div className="mt-1.5 text-xs truncate" style={{ color: C.sub }}>引自 {(subject.toc ?? ['正文'])[Math.min(2, (subject.toc ?? ['正文']).length - 1)]}</div>
            </button>
          </div>
        </div>

        {/* 创作者在豆瓣卡 */}
        {translator && (
          <div className="mt-2 bg-white px-4 py-3">
            <div className="text-base font-bold mb-2" style={{ color: C.text }}>创作者在豆瓣</div>
            <div className="flex items-center gap-3">
              <button {...bindTap('subject.book.creator-open', { params: { userId: translator.id } })} className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left">
                <Avatar src={translator.avatar} size={40} />
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{translator.name}</div>
                  <div className="text-xs" style={{ color: C.sub }}>本书译者</div>
                </div>
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'subject.book.creatorFollow.toggle' }, { onTrigger: () => {
                  if (translatorFollowed) { unfollowUser(translator.id); toast('已取消关注'); }
                  else { followUser(translator.id); toast('关注成功'); }
                } })}
                className="px-3 h-7 rounded-full text-xs border-none cursor-pointer shrink-0"
                style={translatorFollowed ? { background: '#F2F3F5', color: C.sub } : { background: C.green, color: '#fff' }}
              >
                {translatorFollowed ? '已关注' : '+ 关注'}
              </button>
            </div>
          </div>
        )}

        {/* 底部粘性 tab 条 + 书评列表筛选行(evidence t0010) */}
        <div className="mt-2 bg-white" style={{ minHeight: 360 }}>
          <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: '#F0F1F2' }}>
            <div className="flex items-center px-4 pt-2 pb-2">
              {(
                [
                  ['reviews', '书评', bookReviews.length],
                  ['discussions', '讨论', bookDiscussions.length],
                  ['notes', '读书笔记', bookComments.length],
                ] as const
              ).map(([id, label, count]) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    {...bindTap({ kind: 'action', id: 'subject.book.bottomTab.select.target' }, { params: { target: id }, onTrigger: () => setTab(id) })}
                    className="mr-5 pb-1 bg-transparent border-none cursor-pointer relative text-[15px]"
                    style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
                  >
                    {label}
                    <span className="text-xs">{count}</span>
                    {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
                  </button>
                );
              })}
            </div>
            {tab === 'reviews' && (
              <div className="flex items-center gap-2 px-4 pb-2">
                <span className="text-[13px] flex-1" style={{ color: C.text }}>书评列表</span>
                <SegRow options={['热门', '最新', '友邻']} value={reviewSort} onChange={(v) => setReviewSort(v as ReviewSort)} size="sm" />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.8" className="shrink-0">
                  <path d="M4 5h16l-6 7v6l-4 2v-8L4 5z" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>

          {tab === 'reviews' && (
            <div className="px-4 pb-8">
              {sortedReviews.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>
                  {reviewSort === '友邻' ? '还没有友邻写过书评' : '还没有书评'}
                </div>
              ) : (
                sortedReviews.map((r) => {
                  const author = userById.get(r.authorId);
                  return (
                    <div key={r.id} {...bindTap('subject.book.review-open', { params: { reviewId: r.id } })} className="py-3.5 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                      <div className="flex items-center gap-2">
                        <Avatar src={author?.avatar ?? ''} size={24} />
                        <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name}</span>
                        <Stars value={r.rating} scale="star" size={10} color="#FF9900" />
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

          {tab === 'discussions' && (
            <div className="px-4 pb-8">
              {bookDiscussions.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>还没有讨论</div>
              ) : (
                bookDiscussions.map((d) => {
                  const author = userById.get(d.authorId);
                  return (
                    <div key={d.id} {...bindTap('subject.book.discussion-open', { params: { discussionId: d.id } })} className="flex gap-3 py-3.5 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                      <span className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold" style={{ background: '#F2F3F5', color: C.sub }}>{d.replyCount}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>{d.title}</div>
                        <div className="mt-1 text-xs" style={{ color: '#B9BEC6' }}>{author?.name} · {d.likeCount}赞 · {relTime(d.createdAt, nowTs)}更新</div>
                      </div>
                    </div>
                  );
                })
              )}
              <TheEnd />
            </div>
          )}

          {tab === 'notes' && (
            <div className="px-4 pb-8">
              {bookComments.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>还没有读书笔记</div>
              ) : (
                bookComments.map((c) => {
                  const author = userById.get(c.authorId);
                  return (
                    <div key={c.id} className="py-3.5 border-b" style={{ borderColor: '#F5F6F7' }}>
                      <div className="flex items-center gap-2">
                        <Avatar src={author?.avatar ?? ''} size={24} />
                        <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name}</span>
                      </div>
                      <div className="mt-1.5 text-sm leading-relaxed" style={{ color: C.text }}>{c.text}</div>
                      <button
                        {...bindTap({ kind: 'action', id: 'subject.book.noteOriginal.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                        className="mt-1.5 text-xs bg-transparent border-none cursor-pointer"
                        style={{ color: C.green }}
                      >
                        查看原文 ›
                      </button>
                    </div>
                  );
                })
              )}
              <TheEnd />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
