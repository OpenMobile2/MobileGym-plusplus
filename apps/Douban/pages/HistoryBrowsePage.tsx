// 浏览历史(history.browse,/mine/history,IMG_0285-0288,frame:38a79c@t0025):
// 按日期分组(今天/更早)+ 混合实体行(小组/广播/帖子/用户/条目/话题/乐评…各自卡样式) +
// 右上「清除」→多选态(圆选框+底部全部清除|清除N)→确认弹窗(URL驱动)→删除→空态。
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, Img, RatingLine, C, EmptyState, fmtCount } from '../components/ui';
import type { DoubanHistoryItem } from '../types';
import { setImageViewerPayload } from './MediaImageviewerPage';

export default function HistoryBrowsePage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const history = useDoubanStore((s) => s.history);
  const clearHistory = useDoubanStore((s) => s.clearHistory);
  const subjects = useDoubanStore((s) => s.subjects);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const groups = useDoubanStore((s) => s.groups);
  const users = useDoubanStore((s) => s.users);
  const reviews = useDoubanStore((s) => s.reviews);
  const topics = useDoubanStore((s) => s.topics);

  const manage = searchParams.get('manage') === '1';
  const selectedRaw = searchParams.get('sel') ?? '';
  const selected = useMemo(() => new Set(selectedRaw ? selectedRaw.split(',') : []), [selectedRaw]);
  const confirm = searchParams.get('confirm'); // 'all' | 'selected' | null

  const now = TimeService.now();
  const dayStart = useMemo(() => {
    const d = TimeService.fromTimestamp(now);
    return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }, [now]);

  const subjById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const bcById = useMemo(() => new Map(broadcasts.map((b) => [b.id, b])), [broadcasts]);
  const gpById = useMemo(() => new Map(groupPosts.map((p) => [p.id, p])), [groupPosts]);
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const reviewById = useMemo(() => new Map(reviews.map((r) => [r.id, r])), [reviews]);
  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const albumImages = useMemo(
    () => broadcasts.flatMap((b) => b.images).filter(Boolean).slice(0, 8),
    [broadcasts],
  );

  const { today, earlier } = useMemo(() => {
    const t: DoubanHistoryItem[] = [];
    const e: DoubanHistoryItem[] = [];
    for (const h of history) (h.viewedAt >= dayStart ? t : e).push(h);
    return { today: t, earlier: e };
  }, [history, dayStart]);

  const setSel = (ids: Set<string>) =>
    setSearchParams(
      (p) => {
        if (ids.size === 0) p.delete('sel');
        else p.set('sel', [...ids].join(','));
        return p;
      },
      { replace: true },
    );

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSel(next);
  };

  const enterManage = () =>
    setSearchParams((p) => {
      p.set('manage', '1');
      return p;
    });

  const exitManage = () =>
    setSearchParams(
      (p) => {
        p.delete('manage');
        p.delete('sel');
        p.delete('confirm');
        return p;
      },
      { replace: true },
    );

  const openConfirm = (mode: 'all' | 'selected') =>
    setSearchParams((p) => {
      p.set('confirm', mode);
      return p;
    });

  const closeConfirm = () =>
    setSearchParams(
      (p) => {
        p.delete('confirm');
        return p;
      },
      { replace: true },
    );

  const doDelete = () => {
    if (confirm === 'all') clearHistory();
    else clearHistory([...selected]);
    exitManage();
  };

  /** 单条历史行内容(不含选择框外壳) */
  const renderInner = (h: DoubanHistoryItem): { node: React.ReactNode; tap: object } => {
    switch (h.kind) {
      case 'group': {
        const g = groupById.get(h.refId);
        return {
          tap: bindTap('history.group-open', { params: { groupId: h.refId } }),
          node: (
            <>
              <Img src={g?.icon ?? ''} className="w-11 h-11 rounded object-cover shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{g?.name ?? '小组'}</span>
                <span className="block mt-0.5 text-xs" style={{ color: C.sub }}>{fmtCount(g?.members ?? 0)}个成员</span>
              </span>
            </>
          ),
        };
      }
      case 'broadcast': {
        const b = bcById.get(h.refId);
        const u = b ? userById.get(b.authorId) : undefined;
        return {
          tap: bindTap('history.broadcast-open', { params: { id: h.refId } }),
          node: (
            <span className="flex-1 min-w-0">
              {/* 粗标题(正文)在上 */}
              <span className="block text-[15px] font-medium leading-snug line-clamp-2" style={{ color: C.text }}>{b?.text ?? '广播'}</span>
              {/* 来源行(小头像 + 来源名灰字)在下 */}
              <span className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: C.sub }}>
                <Avatar src={u?.avatar ?? ''} size={16} />
                <span className="truncate">{u?.name ?? '豆友'}的广播</span>
              </span>
            </span>
          ),
        };
      }
      case 'groupPost': {
        const p = gpById.get(h.refId);
        const g = p?.groupId ? groupById.get(p.groupId) : undefined;
        return {
          tap: bindTap('history.post-open', { params: { topicId: h.refId } }),
          node: (
            <span className="flex-1 min-w-0">
              {/* 标题 + 来源小组行(图标 + 名) */}
              <span className="block text-[15px] font-medium line-clamp-2" style={{ color: C.text }}>{p?.title ?? '帖子'}</span>
              <span className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: C.sub }}>
                {g?.icon && <Img src={g.icon} className="w-4 h-4 rounded object-cover" />}
                <span className="truncate">{g?.name ?? '小组'}</span>
              </span>
            </span>
          ),
        };
      }
      case 'user': {
        const u = userById.get(h.refId);
        return {
          tap: bindTap('history.user-open', { params: { userId: h.refId } }),
          node: (
            <>
              <Avatar src={u?.avatar ?? ''} size={44} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{u?.name ?? '豆友'}</span>
                {u?.signature && (
                  <span className="block mt-0.5 text-xs truncate" style={{ color: C.sub }}>{u.signature}</span>
                )}
                <span className="block mt-0.5 text-xs truncate" style={{ color: C.sub }}>
                  {fmtCount(u?.followers ?? 0)}人关注 {u?.ipLocation ?? ''}
                </span>
              </span>
            </>
          ),
        };
      }
      case 'review': {
        const r = reviewById.get(h.refId);
        return {
          tap: bindTap('history.review-open', { params: { reviewId: h.refId } }),
          node: (
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium line-clamp-1" style={{ color: C.text }}>{r?.title ?? '评论'}</span>
              <span className="block mt-0.5 text-[13px] line-clamp-1" style={{ color: C.sub }}>{r?.text ?? ''}</span>
            </span>
          ),
        };
      }
      case 'subject': {
        const s = subjById.get(h.refId);
        const type = s?.type ?? 'movie';
        const tap =
          type === 'book'
            ? bindTap('history.book-open', { params: { subjectId: h.refId } })
            : type === 'music'
              ? bindTap('history.music-open', { params: { subjectId: h.refId } })
              : type === 'podcast'
                ? bindTap('history.podcast-open', { params: { episodeId: h.refId } })
                : bindTap('history.movie-open', { params: { itemId: h.refId } });
        const square = type === 'podcast' || type === 'music';
        return {
          tap,
          node: (
            <>
              <Img src={s?.cover ?? ''} className="rounded object-cover shrink-0" style={square ? { width: 56, height: 56 } : { width: 44, height: 60 }} />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{s?.title ?? '条目'}</span>
                <span className="block mt-1"><RatingLine rating={s?.rating ?? null} /></span>
                {s?.info && <span className="block mt-0.5 text-xs truncate" style={{ color: C.sub }}>{s.info}</span>}
              </span>
            </>
          ),
        };
      }
      default:
        // 动态相册历史行(refId 前缀 album_ 时),否则按话题行渲染
        if ((h.kind as string) === 'album' || h.refId.startsWith('album_')) {
          return {
            tap: bindTap('history.album-open', { beforeTrigger: () => setImageViewerPayload({ images: albumImages.length > 0 ? albumImages : ['/@app-assets/Douban/images/bc_photo1.svg'], index: 0 }) }),
            node: (
              <>
                <Img src={albumImages[0] ?? ''} className="w-11 h-11 rounded object-cover shrink-0" />
                <span className="flex-1 text-[15px]" style={{ color: C.text }}>动态相册</span>
              </>
            ),
          };
        }
        return {
          tap: bindTap('history.topic-open', { params: { id: h.refId } }),
          node: <span className="flex-1 text-[15px]" style={{ color: C.text }}># {topicById.get(h.refId)?.name ?? '话题'}</span>,
        };
    }
  };

  const renderRow = (h: DoubanHistoryItem) => {
    const { node, tap } = renderInner(h);
    const checked = selected.has(h.id);
    if (manage) {
      return (
        <button
          key={h.id}
          {...bindTap({ kind: 'action', id: 'history.manage.item.toggle' }, {
            params: { itemId: h.id },
            onTrigger: () => toggleSel(h.id),
          })}
          className="w-full flex items-center gap-3 px-4 py-3 bg-white border-b text-left cursor-pointer"
          style={{ borderColor: '#F2F3F5' }}
        >
          <span
            className="w-5 h-5 rounded-full border shrink-0 flex items-center justify-center"
            style={{ borderColor: checked ? C.green : '#CBD2D9', background: checked ? C.green : 'transparent' }}
          >
            {checked && <span className="text-white text-[11px]">✓</span>}
          </span>
          {node}
        </button>
      );
    }
    return (
      <button
        key={h.id}
        {...tap}
        className="w-full flex items-center gap-3 px-4 py-3 bg-white border-b text-left cursor-pointer"
        style={{ borderColor: '#F2F3F5' }}
      >
        {node}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="浏览历史"
        right={
          history.length > 0 ? (
            manage ? (
              <button
                {...bindTap({ kind: 'action', id: 'history.manage.item.toggle' }, { params: { done: 1 }, onTrigger: exitManage })}
                className="text-sm bg-transparent border-none cursor-pointer"
                style={{ color: C.sub }}
              >
                取消
              </button>
            ) : (
              <button
                {...bindTap({ kind: 'action', id: 'history.manage.mode.enter' }, { onTrigger: enterManage })}
                className="text-sm px-3 py-1 rounded-full bg-transparent border-none cursor-pointer"
                style={{ color: C.text, background: '#F2F3F5' }}
              >
                清除
              </button>
            )
          ) : undefined
        }
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {history.length === 0 ? (
          <EmptyState text="暂无浏览历史" />
        ) : (
          <>
            {today.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold" style={{ color: C.sub }}>今天</div>
                {today.map(renderRow)}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold" style={{ color: C.sub }}>更早</div>
                {earlier.map(renderRow)}
              </>
            )}
          </>
        )}
      </div>

      {/* 多选态底部操作条 */}
      {manage && history.length > 0 && (
        <div className="flex items-center border-t bg-white shrink-0" style={{ borderColor: C.border }}>
          <button
            {...bindTap({ kind: 'action', id: 'history.manage.confirm.open' }, { params: { mode: 'all' }, onTrigger: () => openConfirm('all') })}
            className="flex-1 h-12 bg-transparent border-none cursor-pointer text-[15px]"
            style={{ color: C.text }}
          >
            全部清除
          </button>
          <span className="w-px h-6 self-center" style={{ background: C.border }} />
          <button
            {...bindTap({ kind: 'action', id: 'history.manage.confirm.open' }, {
              params: { mode: 'selected' },
              onTrigger: () => selected.size > 0 && openConfirm('selected'),
            })}
            disabled={selected.size === 0}
            className="flex-1 h-12 bg-transparent border-none cursor-pointer text-[15px] font-semibold"
            style={{ color: selected.size === 0 ? '#F2B5B7' : C.danger }}
          >
            清除{selected.size > 0 ? ` ${selected.size}` : ''}
          </button>
        </div>
      )}

      {/* 确认清除弹窗(URL驱动) */}
      {confirm && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-9">
          <button
            {...bindTap({ kind: 'action', id: 'history.manage.confirm.cancel' }, { onTrigger: closeConfirm })}
            className="absolute inset-0 border-none cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.4)' }}
            aria-label="关闭"
          />
          <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: C.surface }}>
            <div className="px-5 pt-6 pb-3 text-center text-[15px]" style={{ color: C.text }}>
              {confirm === 'all' ? '确定清除全部浏览历史吗?' : `确定清除选中的 ${selected.size} 条历史吗?`}
            </div>
            <div className="border-t flex" style={{ borderColor: C.border }}>
              <button
                {...bindTap({ kind: 'action', id: 'history.manage.confirm.cancel' }, { onTrigger: closeConfirm })}
                className="flex-1 h-12 bg-transparent cursor-pointer text-[15px] border-r"
                style={{ color: C.text, borderColor: C.border }}
              >
                取消
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'history.manage.confirm.delete' }, { onTrigger: doDelete })}
                className="flex-1 h-12 bg-transparent cursor-pointer text-[15px] font-semibold"
                style={{ color: C.danger }}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
