import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Img, Stars, TheEnd, SegRow, fmtCount, fmtAbsDateTime } from '../components/ui';
import { markStatusLabel } from '../components/MarkSheetCore';
import { setImageViewerPayload } from './MediaImageviewerPage';

// 节点: subject.music —— 音乐条目详情(唱片)。锁定决策:全页无任何播放键/试听键;曲目行 tap → wontfix。
// evidence: frame:8b7ecc@t0058/t0075/t0080 / IMG_0236
type ReviewSort = '热门' | '最新' | '友邻';

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

/** 描边拇指 👍 图标(替代 emoji) */
function ThumbIcon({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M7 10v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4.2-6.4a1.6 1.6 0 0 1 2.9 1.1L13.5 9H19a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18 19H7"
        stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

/** 想听=♡+ / 在听=⊙ / 听过=☆(橙色描边图标,同 book) */
function MarkIcon({ status }: { status: 'wish' | 'doing' | 'done' }) {
  if (status === 'wish') {
    return (
      <svg width={15} height={15} viewBox="0 0 24 24" fill="none" className="shrink-0">
        <path d="M12 20.5 C7.5 17 4 13.8 4 10.2 C4 7.6 6 5.7 8.4 5.7 C10 5.7 11.3 6.6 12 7.9 C12.7 6.6 14 5.7 15.6 5.7 C16.1 5.7 16.6 5.8 17 6"
          stroke={C.orange} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
      <path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.1 6.1-.7L12 3.5z"
        stroke={C.orange} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function SubjectMusicPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const reviews = useDoubanStore((s) => s.reviews);
  const discussions = useDoubanStore((s) => s.discussions);
  const comments = useDoubanStore((s) => s.comments);
  const users = useDoubanStore((s) => s.users);
  const celebrities = useDoubanStore((s) => s.celebrities);
  const addHistory = useDoubanStore((s) => s.addHistory);

  const musics = useMemo(() => subjects.filter((s) => s.type === 'music'), [subjects]);
  const subjectId = routeParams.subjectId ?? musics[0]?.id ?? 'mu1';
  const subject = useMemo(() => subjects.find((s) => s.id === subjectId) ?? musics[0], [subjects, subjectId]);

  useEffect(() => {
    if (subject) addHistory('subject', subject.id);
  }, [addHistory, subject]);

  const [tab, setTab] = useState<'reviews' | 'discussions'>('reviews');
  const [reviewSort, setReviewSort] = useState<ReviewSort>('热门');
  const [tracksExpanded, setTracksExpanded] = useState(false);
  const mark = useMemo(() => marks.find((m) => m.subjectId === subject?.id), [marks, subject?.id]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const nowTs = TimeService.now();

  const musicReviews = useMemo(() => reviews.filter((r) => r.subjectId === subject?.id), [reviews, subject?.id]);
  const sortedReviews = useMemo(() => {
    if (reviewSort === '友邻') return [];
    if (reviewSort === '最新') return [...musicReviews].sort((a, b) => b.createdAt - a.createdAt);
    return [...musicReviews].sort((a, b) => b.useful - a.useful);
  }, [musicReviews, reviewSort]);
  const musicDiscussions = useMemo(() => discussions.filter((d) => d.subjectId === subject?.id), [discussions, subject?.id]);
  const musicComments = useMemo(() => comments.filter((c) => c.subjectId === subject?.id), [comments, subject?.id]);

  if (!subject) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>唱片不存在</div>
      </div>
    );
  }

  const tracks = subject.tracks ?? [];
  const shownTracks = tracksExpanded ? tracks : tracks.slice(0, 3);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>唱片</div>
        <div className="w-10 h-10 flex items-center justify-center relative">
          <span className="text-xl leading-none" style={{ color: C.text }}>⋯</span>
          <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部 */}
        <div className="bg-white flex gap-3.5 px-4 pt-3 pb-3">
          <div {...bindTap('subject.music.cover-open', { beforeTrigger: () => setImageViewerPayload({ images: [subject.cover], index: 0 }) })} className="cursor-pointer shrink-0">
            <Img src={subject.cover} className="w-[104px] h-[104px] rounded-md object-cover" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <div className="text-[18px] font-bold leading-tight" style={{ color: C.text }}>{subject.title}</div>
            {/* 单行斜杠串 meta:艺人 / 曲风 / 类型 / 发行,末尾 ›(evidence t0058) */}
            <button
              {...bindTap('subject.music.artist-open', { params: { celebrityId: celebrities.find((c) => c.name === subject.artist)?.id ?? subject.credits?.find((c) => c.celebrityId)?.celebrityId ?? celebrities[0]?.id ?? 'c1' } })}
              className="mt-2 text-xs leading-relaxed bg-transparent border-none cursor-pointer text-left p-0"
              style={{ color: C.sub }}
            >
              {[subject.info ?? subject.artist, subject.year && `${subject.year}发行`].filter(Boolean).join(' / ')} ›
            </button>
          </div>
        </div>

        {/* 标记按钮行 */}
        <div className="bg-white px-4 pb-3">
          {!mark ? (
            <div className="flex gap-2.5">
              {(['wish', 'doing', 'done'] as const).map((status) => (
                <button
                  key={status}
                  {...bindTap('subject.music.mark-open', { params: { subjectId: subject.id, status } })}
                  className="flex-1 h-9 rounded-lg text-sm font-semibold border-none cursor-pointer flex items-center justify-center gap-1.5"
                  style={{ background: '#FDF4E7', color: C.orange }}
                >
                  <MarkIcon status={status} />
                  {markStatusLabel('music', status)}
                </button>
              ))}
            </div>
          ) : (
            <button
              {...bindTap('subject.music.rate-open', { params: { tab: '听过' } })}
              className="w-full h-9 rounded-lg px-3 flex items-center justify-between border-none cursor-pointer"
              style={{ background: C.greenSoft }}
            >
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold" style={{ color: C.green }}>已{markStatusLabel('music', mark.status)}</span>
                {mark.status === 'done' && mark.rating != null && <Stars value={mark.rating} scale="star" size={11} color={C.gold} />}
              </span>
              <span className="text-xs" style={{ color: C.green }}>{fmtDate(mark.createdAt)} ›</span>
            </button>
          )}
        </div>

        {/* 豆瓣评分卡:®标题 + 暂无评分/发布评分 + N人想听(evidence t0058) */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="text-xs mb-1.5" style={{ color: C.sub }}>豆瓣评分®</div>
          {subject.rating == null ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base" style={{ color: C.sub }}>暂无评分</div>
                <button
                  {...bindTap('subject.music.rate-open', { params: { tab: '听过' } })}
                  className="mt-1 text-sm bg-transparent border-none cursor-pointer p-0"
                  style={{ color: C.sub }}
                >
                  已听过?<span className="font-bold" style={{ color: C.text }}>发布评分</span>
                </button>
              </div>
              <span className="text-sm" style={{ color: C.text }}>{fmtCount(subject.wishCount ?? 0)}人想听</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-[36px] font-bold leading-none" style={{ color: C.text }}>{subject.rating.toFixed(1)}</div>
              <div className="flex-1">
                <Stars value={subject.rating} size={13} color={C.orange} />
                <div className="mt-1 text-xs" style={{ color: C.sub }}>{fmtCount(subject.ratingCount)}人评价</div>
              </div>
            </div>
          )}
        </div>

        {/* 简介(约5行截断带 …,evidence t0080) */}
        {subject.intro && (
          <div className="mt-2 bg-white px-4 py-3">
            <div className="text-base font-bold mb-1.5" style={{ color: C.text }}>简介</div>
            <div className="text-sm leading-relaxed line-clamp-5" style={{ color: C.text }}>{subject.intro}</div>
          </div>
        )}

        {/* 曲目:圆角内嵌卡、卡头「≡ 曲目」、居中「展开更多 ⌄」(evidence t0080)。无播放键;行 tap → wontfix。 */}
        {tracks.length > 0 && (
          <div className="mt-2 bg-white px-4 py-3">
            <div className="rounded-xl overflow-hidden" style={{ background: '#F7F8FA' }}>
              <div className="flex items-center gap-1.5 px-3.5 pt-3 pb-1">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round" className="shrink-0">
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
                <span className="text-sm font-bold" style={{ color: C.text }}>曲目</span>
              </div>
              {shownTracks.map((t, i) => (
                <button
                  key={i}
                  {...bindTap({ kind: 'action', id: 'subject.music.track.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="w-full flex items-center gap-3 px-3.5 py-2 bg-transparent border-none cursor-pointer text-left"
                >
                  <span className="text-xs w-5 shrink-0" style={{ color: C.sub }}>{i + 1}</span>
                  <span className="text-sm" style={{ color: C.text }}>{t}</span>
                </button>
              ))}
              {!tracksExpanded && tracks.length > 3 && (
                <button
                  {...bindTap({ kind: 'action', id: 'subject.music.tracks.expand' }, { onTrigger: () => setTracksExpanded(true) })}
                  className="w-full py-2.5 text-sm bg-transparent border-none cursor-pointer text-center"
                  style={{ color: C.sub }}
                >
                  展开更多 ⌄
                </button>
              )}
            </div>
          </div>
        )}

        {/* 短评模块 */}
        <div className="mt-2 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-base font-bold" style={{ color: C.text }}>短评</div>
            <button
              {...bindTap('subject.music.shortReviews-open', { params: { subjectId: subject.id } })}
              className="text-xs bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              全部短评 {fmtCount(musicComments.length)} ›
            </button>
          </div>
          {musicComments.slice(0, 3).map((c) => {
            const author = userById.get(c.authorId);
            return (
              <div key={c.id} className="py-3 border-b relative" style={{ borderColor: '#F5F6F7' }}>
                <div className="flex items-center gap-2">
                  <Avatar src={author?.avatar ?? ''} size={22} />
                  <span className="text-[13px]" style={{ color: C.sub }}>{author?.name}</span>
                </div>
                {/* 第二行:星级 + 日期时间 + IP属地 */}
                <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: '#B9BEC6' }}>
                  {c.rating != null && <Stars value={c.rating} scale="star" size={9} color={C.orange} />}
                  <span>{fmtAbsDateTime(c.createdAt)}</span>
                  <span>{c.ipLocation}</span>
                </div>
                <div className="mt-1 text-sm" style={{ color: C.text }}>{c.text}</div>
                <div className="mt-1 flex items-center gap-1 text-xs" style={{ color: C.sub }}>
                  <ThumbIcon color={C.sub} size={13} />
                  <span>{fmtCount(c.likes)}</span>
                </div>
                {/* 右上角 ⋯ */}
                <span className="absolute top-3 right-0 text-base leading-none" style={{ color: '#C3C9D1' }}>⋯</span>
              </div>
            );
          })}
        </div>

        {/* 底部粘性 tab 条(乐评/讨论)+ 乐评列表筛选行(evidence t0058) */}
        <div className="mt-2 bg-white" style={{ minHeight: 320 }}>
          <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: '#F0F1F2' }}>
            <div className="flex items-center px-4 pt-2 pb-2">
              {(
                [
                  ['reviews', '乐评', musicReviews.length],
                  ['discussions', '讨论', musicDiscussions.length],
                ] as const
              ).map(([id, label, count]) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    {...bindTap({ kind: 'action', id: 'subject.music.bottomTab.select.target' }, { params: { target: id }, onTrigger: () => setTab(id) })}
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
                <span className="text-[13px] flex-1" style={{ color: C.text }}>乐评列表</span>
                <SegRow options={['热门', '最新', '友邻']} value={reviewSort} onChange={(v) => setReviewSort(v as ReviewSort)} size="sm" />
              </div>
            )}
          </div>

          {tab === 'reviews' && (
            <div className="px-4 pb-8">
              {sortedReviews.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>
                  {reviewSort === '友邻' ? '还没有友邻写过乐评' : '还没有乐评'}
                </div>
              ) : (
                sortedReviews.map((r) => {
                  const author = userById.get(r.authorId);
                  return (
                    <div key={r.id} {...bindTap('subject.music.review-open', { params: { reviewId: r.id } })} className="py-3.5 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                      <div className="flex items-center gap-2">
                        <Avatar src={author?.avatar ?? ''} size={24} />
                        <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name}</span>
                        <Stars value={r.rating} scale="star" size={10} color={C.orange} />
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
              {musicDiscussions.length === 0 ? (
                <div className="py-12 text-center text-sm" style={{ color: C.sub }}>还没有讨论</div>
              ) : (
                musicDiscussions.map((d) => {
                  const author = userById.get(d.authorId);
                  return (
                    <div key={d.id} {...bindTap('subject.music.discussion-open', { params: { discussionId: d.id } })} className="flex gap-3 py-3.5 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
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
        </div>
      </div>
    </div>
  );
}
