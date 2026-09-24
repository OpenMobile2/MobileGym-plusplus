import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Stars, SegRow, fmtCount } from '../components/ui';
import { SheetRow } from '../components/Sheet';

// 节点: reviews.short —— 全部短评。热门/最新/友邻(空态)三档 + 状态筛选下拉。
// evidence: frame:f60ef9@t0028/t0029/t0030/t0031 / frame:8b7ecc@t0030
function fmtDateTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Sort = 'hot' | 'latest' | 'friends';

/** 描边拇指 👍 图标(替代 emoji) */
function ThumbIcon({ color, size = 13 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path d="M7 10v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3zm0 0 4.2-6.4a1.6 1.6 0 0 1 2.9 1.1L13.5 9H19a2 2 0 0 1 2 2.3l-1 6A2 2 0 0 1 18 19H7"
        stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

export default function ReviewsShortPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();

  const toast = useDoubanStore((s) => s.toast);
  const subjects = useDoubanStore((s) => s.subjects);
  const comments = useDoubanStore((s) => s.comments);
  const users = useDoubanStore((s) => s.users);
  const likes = useDoubanStore((s) => s.likes);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const toggleLike = useDoubanStore((s) => s.toggleLike);

  const subjectId = routeParams.subjectId ?? subjects[0]?.id ?? 'm1';
  const subject = useMemo(() => subjects.find((s) => s.id === subjectId) ?? subjects[0], [subjects, subjectId]);

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const subjectComments = useMemo(() => comments.filter((c) => c.subjectId === subject?.id), [comments, subject?.id]);

  const [sort, setSort] = useState<Sort>('hot');
  const [statusFilter, setStatusFilter] = useState<'看过' | '想看'>('看过');
  const [filterOpen, setFilterOpen] = useState(false);
  const likedIds = likes
    .filter((l) => l.targetType === 'comment' && l.userId === currentUser.id)
    .map((l) => l.targetId);

  const isBook = subject?.type === 'book';
  const statusLabel = isBook ? '读过' : '看过';

  const sorted = useMemo(() => {
    if (sort === 'friends') return []; // 友邻空态
    // 短评均来自「看过」的人;切到「想看」时为空态(想看的人不写短评,只标记)
    if (statusFilter === '想看') return [];
    return sort === 'hot'
      ? [...subjectComments].sort((a, b) => b.likes - a.likes)
      : [...subjectComments].sort((a, b) => b.createdAt - a.createdAt);
  }, [subjectComments, sort, statusFilter]);

  if (!subject) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>条目不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:居中「全部短评 ⓘ」+ 右 ⋯(红角标)(evidence t0029) */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>✕</button>
        <div className="flex-1 flex items-center justify-center gap-1 font-semibold text-base" style={{ color: C.text }}>
          全部短评
          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-normal" style={{ border: `1px solid ${C.sub}`, color: C.sub }}>?</span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'reviews.short.itemMenu.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          className="w-10 h-10 flex items-center justify-center relative bg-transparent border-none cursor-pointer"
          style={{ color: C.text }}
        >
          <span className="text-xl leading-none">⋯</span>
          <span className="absolute top-2 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 条目名(内容区左对齐大标题)+ 豆瓣评分®头部 */}
        <div className="bg-white px-4 pt-3 pb-4">
          <div className="text-[20px] font-bold leading-tight" style={{ color: C.text }}>{subject.title}</div>
          <div className="mt-3 text-xs" style={{ color: C.sub }}>豆瓣评分®</div>
          {subject.rating == null ? (
            /* 暂无评分:灰字 + 「已看过?发布评价」内联加粗 + 灰色直方图骨架(evidence t0029/t0030) */
            <div className="mt-1.5 flex items-stretch gap-4">
              <div className="shrink-0">
                <div className="text-base" style={{ color: C.sub }}>暂无评分</div>
                <button
                  {...bindTap('reviews.short.rate-open')}
                  className="mt-1 text-sm bg-transparent border-none cursor-pointer p-0 text-left"
                  style={{ color: C.sub }}
                >
                  已{statusLabel}?<span className="font-bold" style={{ color: C.text }}>发布评价</span>
                </button>
                <div className="mt-1.5"><Stars value={0} size={12} color="#D8DCE1" /></div>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => (
                  <div key={star} className="flex items-center gap-1.5 h-[9px]">
                    <span className="shrink-0 text-right leading-none" style={{ color: '#D8DCE1', fontSize: 8, width: 42, letterSpacing: 1 }}>
                      {'★'.repeat(star)}
                    </span>
                    <div className="flex-1 h-[5px] rounded-sm" style={{ background: '#F0F1F2' }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex items-stretch gap-4">
              <div className="shrink-0 text-center">
                <div className="text-[40px] font-bold leading-none" style={{ color: C.text }}>{subject.rating.toFixed(1)}</div>
                <div className="mt-1"><Stars value={subject.rating} size={12} color={C.orange} /></div>
                <div className="mt-1 text-[10px]" style={{ color: C.sub }}>{fmtCount(subject.ratingCount)}人评价</div>
              </div>
              {/* 直方图:行标为星星 glyph 列、无百分比文字(evidence t0010 同款) */}
              <div className="flex-1 flex flex-col justify-center gap-1.5">
                {(() => {
                  const dist = subject.ratingDist ?? [40, 30, 20, 6, 4];
                  const distMax = Math.max(1, ...dist);
                  return [5, 4, 3, 2, 1].map((star, i) => (
                    <div key={star} className="flex items-center gap-1.5 h-[9px]">
                      <span className="shrink-0 text-right leading-none" style={{ color: '#D8DCE1', fontSize: 8, width: 42, letterSpacing: 1 }}>
                        {'★'.repeat(star)}
                      </span>
                      <div className="h-[5px] rounded-sm" style={{ background: C.orange, width: `${((dist[i] ?? 0) / distMax) * 100}%` }} />
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>

        {/* 筛选行:左「看过 N」状态下拉(⌄),右 热门|最新|友邻 分段(evidence t0028/t0029) */}
        <div className="mt-2 bg-white">
          <div className="flex items-center justify-between px-4 py-2.5">
            <button
              {...bindTap({ kind: 'action', id: 'reviews.short.filter.select.status' }, { onTrigger: () => setFilterOpen(true) })}
              className="bg-transparent border-none cursor-pointer flex items-center gap-1 p-0"
            >
              <span className="text-sm font-semibold" style={{ color: C.text }}>{statusFilter === '看过' ? statusLabel : (isBook ? '想读' : '想看')}</span>
              <span className="text-xs" style={{ color: C.sub }}>{fmtCount(subjectComments.length)}</span>
              <span className="text-[10px]" style={{ color: C.sub }}>⌄</span>
            </button>
            <SegRow
              options={['热门', '最新', '友邻']}
              value={sort === 'hot' ? '热门' : sort === 'latest' ? '最新' : '友邻'}
              bindFor={(opt) => {
                const target: Sort = opt === '热门' ? 'hot' : opt === '最新' ? 'latest' : 'friends';
                const actionId = target === 'friends' ? 'reviews.short.sort.select.friends' : 'reviews.short.sort.select.latest';
                return bindTap({ kind: 'action', id: actionId }, { params: { target }, onTrigger: () => setSort(target) });
              }}
              size="sm"
            />
          </div>

          {/* 短评列表 / 友邻空态 */}
          {sort === 'friends' ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>关注的人还没有短评</div>
          ) : statusFilter === '想看' ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>「{isBook ? '想读' : '想看'}」的人还没有留下短评</div>
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>还没有短评</div>
          ) : (
            sorted.map((c) => {
              const author = userById.get(c.authorId);
              const liked = likedIds.includes(c.id);
              return (
                <div key={c.id} className="px-4 py-3.5 border-b relative" style={{ borderColor: '#F5F6F7' }}>
                  <div className="flex items-center gap-2">
                    <button {...bindTap('reviews.short.user-open', { params: { userId: c.authorId } })} className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0">
                      <Avatar src={author?.avatar ?? ''} size={28} />
                      <span className="text-[13px] font-semibold" style={{ color: C.text }}>{author?.name ?? '豆友'}</span>
                    </button>
                  </div>
                  {/* 第二行:★★★ + 状态词 + 日期时间 + 属地(裸地名,紧跟名字下方) */}
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]" style={{ color: '#B9BEC6' }}>
                    {c.rating != null && <Stars value={c.rating} scale="star" size={10} color={C.orange} />}
                    <span>{statusLabel}</span>
                    <span>{fmtDateTime(c.createdAt)}</span>
                    <span>{c.ipLocation}</span>
                  </div>
                  <div className="mt-2 text-sm leading-relaxed line-clamp-6" style={{ color: C.text }}>{c.text}</div>
                  <div className="mt-1 flex items-center">
                    <button
                      {...bindTap({ kind: 'action', id: 'reviews.short.like.toggle' }, { onTrigger: () => toggleLike('comment', c.id) })}
                      className="flex items-center gap-1 text-xs bg-transparent border-none cursor-pointer"
                      style={{ color: liked ? C.green : C.sub }}
                    >
                      <ThumbIcon color={liked ? C.green : C.sub} size={13} />
                      {fmtCount(c.likes)}
                    </button>
                  </div>
                  {/* 条目级 ⋯(右上角) */}
                  <span className="absolute top-3.5 right-4 text-base leading-none" style={{ color: '#C3C9D1' }}>⋯</span>
                </div>
              );
            })
          )}
          <div className="h-4" />
        </div>
      </div>

      {/* 状态筛选下拉(易失态,遮罩点击仅关闭本层) */}
      {filterOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div onClick={() => setFilterOpen(false)} className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <div className="rounded-t-2xl pb-6 pt-1 bg-white shrink-0">
            <div className="text-center py-2.5 text-sm font-semibold" style={{ color: C.text }}>筛选状态</div>
            <SheetRow label={statusLabel} bind={{ onClick: () => { setStatusFilter('看过'); setFilterOpen(false); } }} right={statusFilter === '看过' ? <span style={{ color: C.green }}>✓</span> : undefined} />
            <SheetRow label={isBook ? '想读' : '想看'} bind={{ onClick: () => { setStatusFilter('想看'); setFilterOpen(false); } }} right={statusFilter === '想看' ? <span style={{ color: C.green }}>✓</span> : undefined} />
            <div className="px-4 pt-1">
              <button onClick={() => setFilterOpen(false)} className="w-full h-11 rounded-full text-[15px] cursor-pointer" style={{ background: '#F2F3F5', color: C.text, border: 'none' }}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
