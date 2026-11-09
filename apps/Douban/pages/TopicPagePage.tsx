// 话题页(topic.page,IMG_0473/0474/0476/0478 对齐):
// 顶部 ‹ + 灰底搜索框(#话题名#,rounded-lg)+ ⋯;话题标题 + 绿色「+关注」;
// 「1.0万+篇内容 · 401.2万次浏览」(fmtCountPlus/fmtCount);热门/最新下划线 tab;
// 双列瀑布流:纯文字卡=奶油信纸横线底(约13行截断)/ 单封面卡 / ≥4图=四宫格卡(角标 名+👤数)/
// 最新tab 转发型=作者头行+正文+图+灰底引用条+标题+👍 / 热门左列插 1 张「广告」卡(深色简介面板+了解详情);
// FAB 双形态:未滚动+热门=中央「🖊 和 N 人一起讨论」胶囊(N 原始整数);滚动或最新tab=右下深色圆形笔钮(同 compose 绑定)。
import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, EmptyState, Img, TheEnd, fmtCount, fmtCountPlus } from '../components/ui';
import type { DoubanBroadcast } from '../types';

type TopicSort = 'hot' | 'new';

/** 纯文字卡奶油粉底(IMG_0473) */
const CARD_CREAM = '#F8ECE2';
/** 信纸横线色(奶油底上更深一档) */
const CARD_CREAM_LINE = '#EFDCCB';

/** 首行作标题、其余作正文预览 */
function splitCard(text: string): { title: string; body: string } {
  const idx = text.indexOf('\n');
  if (idx === -1) return { title: text, body: '' };
  return { title: text.slice(0, idx), body: text.slice(idx + 1).trim() };
}

/** 「25-8-6」短日期(YY-M-D,不补零,IMG_0478 作者头行) */
function fmtYmd(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear() % 100}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** 四宫格角标 👤 人数(载荷无该字段,按赞数确定性推导) */
function gridViewerCount(likeCount: number, i: number): number {
  return 100 + ((likeCount + 13) * (i + 3) * 37) % 4900;
}

export default function TopicPagePage() {
  const { bindTap, bindBack } = useDoubanGestures();
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const topics = useDoubanStore((s) => s.topics);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const users = useDoubanStore((s) => s.users);
  const followedTopics = useDoubanStore((s) => s.follows.topics);
  const toggleFollowTopic = useDoubanStore((s) => s.toggleFollowTopic);

  const topic = useMemo(() => topics.find((t) => t.id === id), [topics, id]);
  const followed = followedTopics.includes(id);
  const sort: TopicSort = searchParams.get('sort') === 'new' ? 'new' : 'hot';
  const [scrolled, setScrolled] = useState(false);

  const userOf = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u]));
    return (uid: string) => m.get(uid);
  }, [users]);

  const list = useMemo(() => {
    const arr = broadcasts.filter((b) => b.topicId === id);
    return [...arr].sort((a, b) =>
      sort === 'new' ? b.createdAt - a.createdAt : b.likeCount - a.likeCount,
    );
  }, [broadcasts, id, sort]);

  const colLeft = useMemo(() => list.filter((_, i) => i % 2 === 0), [list]);
  const colRight = useMemo(() => list.filter((_, i) => i % 2 === 1), [list]);

  const switchSort = (target: TopicSort) =>
    setSearchParams(
      (p) => {
        p.set('sort', target);
        return p;
      },
      { replace: true },
    );

  /** 卡脚:头像+昵称(user-open)+ 👍数(装饰) */
  const renderFoot = (b: DoubanBroadcast) => {
    const author = userOf(b.authorId);
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: C.surface }}>
        <div
          {...bindTap('topic.user-open', { params: { userId: b.authorId } })}
          className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
        >
          <Avatar src={author?.avatar ?? ''} size={18} />
          <span className="text-[11px] truncate" style={{ color: C.sub }}>{author?.name ?? '豆友'}</span>
        </div>
        <span className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: C.sub }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" />
          </svg>
          {b.likeCount > 0 ? fmtCount(b.likeCount) : ''}
        </span>
      </div>
    );
  };

  /** 广告推广卡(IMG_0474 左列:「广告」角标 + 深色简介面板 + 了解详情;全装饰不打标) */
  const renderAdCard = () => (
    <div key="__ad__" className="rounded-xl overflow-hidden" style={{ background: C.surface }} aria-hidden>
      {/* 视频帧占位 + 「了解详情」浮钮 + 「广告」角标 */}
      <div className="relative h-16" style={{ background: 'linear-gradient(135deg, #DDE3EA 0%, #C9D2DC 100%)' }}>
        <span
          className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[11px] text-white"
          style={{ background: '#4C9BF5' }}
        >
          了解详情
        </span>
        <span className="absolute bottom-1.5 left-1.5 px-1 rounded text-[9px]" style={{ background: 'rgba(0,0,0,0.35)', color: '#fff' }}>
          广告
        </span>
      </div>
      {/* 深色简介面板 */}
      <div className="px-2.5 py-2.5" style={{ background: '#141414' }}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-white">简介</span>
          <span className="text-[13px]" style={{ color: '#9AA0A6' }}>×</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="w-8 h-11 rounded flex items-center justify-center text-[10px] shrink-0"
            style={{ background: '#2A2A2A', color: '#B9BEC6' }}
          >
            栖云引
          </span>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-white truncate">栖云引</div>
            <div className="mt-0.5 text-[10px] truncate" style={{ color: '#9AA0A6' }}>中国 / 2026 / 爱情 古装 · 共36集</div>
          </div>
        </div>
        <div className="mt-2 text-[10px] leading-relaxed line-clamp-3" style={{ color: '#9AA0A6' }}>
          概述:传说中的栖云城里,落魄小姐与外冷内热的城主从彼此试探到相互信任,一路披荆斩棘为民谋利,最终收获友谊与爱情,携手打造繁荣九街。
        </div>
      </div>
      {/* 底部标题 + 卡脚(装饰) */}
      <div className="px-2.5 pt-2 pb-1 text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>
        《栖云引》6 集预告热度快 3000 了
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-2" style={{ background: C.surface }}>
        <span
          className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-[9px] text-white shrink-0"
          style={{ background: '#B9BEC6' }}
        >
          栖
        </span>
        <span className="text-[11px] truncate flex-1" style={{ color: C.sub }}>栖云引官方号</span>
        <span className="flex items-center gap-1 text-[11px] shrink-0" style={{ color: C.sub }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" />
          </svg>
          1
        </span>
      </div>
    </div>
  );

  const renderCard = (b: DoubanBroadcast) => {
    const author = userOf(b.authorId);
    const { title, body } = splitCard(b.text);
    const cover = b.images[0];

    // ---- 最新 tab 转发/动态型复合卡(IMG_0478 右列) ----
    if (sort === 'new' && b.isRepost) {
      const orig =
        b.origType === 'broadcast' && b.origId
          ? broadcasts.find((x) => x.id === b.origId)
          : undefined;
      const origAuthor = orig ? userOf(orig.authorId) : undefined;
      const quoteText = orig
        ? `${origAuthor?.name ?? '豆友'}: ${orig.text.replace(/\n+/g, ' ')}`
        : '该内容已不可见';
      return (
        <div key={b.id} className="rounded-xl overflow-hidden" style={{ background: C.surface }}>
          {/* 作者头行:头像+昵称+YY-M-D+折叠箭头(user-open) */}
          <div className="flex items-center gap-1.5 px-2.5 pt-2.5">
            <div
              {...bindTap('topic.user-open', { params: { userId: b.authorId } })}
              className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
            >
              <Avatar src={author?.avatar ?? ''} size={24} />
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium truncate" style={{ color: C.text }}>
                  {author?.name ?? '豆友'}
                </div>
                <div className="text-[10px]" style={{ color: '#B9BEC6' }}>{fmtYmd(b.createdAt)}</div>
              </div>
            </div>
            <span className="text-[12px] shrink-0" style={{ color: '#B9BEC6' }} aria-hidden>⌄</span>
          </div>
          <div {...bindTap('topic.broadcast-open', { params: { id: b.id } })} className="cursor-pointer">
            {body && (
              <div className="px-2.5 pt-1.5 text-[12px] leading-snug line-clamp-2" style={{ color: C.text }}>
                {body}
              </div>
            )}
            {cover && <Img src={cover} className="w-full h-32 object-cover block mt-1.5" />}
            {/* 灰底引用条 */}
            <div className="mx-2.5 mt-2 px-2 py-1.5 rounded flex items-center gap-1" style={{ background: '#F5F6F7' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B9BEC6" strokeWidth="1.8" className="shrink-0">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
              </svg>
              <span className="text-[11px] truncate" style={{ color: C.sub }}>{quoteText}</span>
            </div>
            <div className="px-2.5 pt-2 pb-1 text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>
              {title}
            </div>
          </div>
          {renderFoot(b)}
        </div>
      );
    }

    // ---- ≥4 图:四宫格图片卡(IMG_0474:每格角标 名+👤数,底部标题) ----
    if (b.images.length >= 4) {
      return (
        <div key={b.id} className="rounded-xl overflow-hidden" style={{ background: C.surface }}>
          <div {...bindTap('topic.broadcast-open', { params: { id: b.id } })} className="cursor-pointer">
            <div className="grid grid-cols-2 gap-px">
              {b.images.slice(0, 4).map((src, i) => (
                <div key={i} className="relative">
                  <Img src={src} className="w-full h-28 object-cover block" />
                  <span
                    className="absolute top-0 left-0 right-0 flex items-center justify-between px-1 py-0.5 text-[9px] text-white"
                    style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0))' }}
                  >
                    <span className="truncate">{author?.name ?? '豆友'}</span>
                    <span className="flex items-center gap-0.5 shrink-0">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="7.5" r="4" />
                        <path d="M4 20.5c.9-4 4.1-6.5 8-6.5s7.1 2.5 8 6.5z" />
                      </svg>
                      {gridViewerCount(b.likeCount, i)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="px-2.5 pt-2 pb-1 text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>
              {title}
            </div>
          </div>
          {renderFoot(b)}
        </div>
      );
    }

    // ---- 单封面图片卡 / 纯文字信纸卡 ----
    return (
      <div key={b.id} className="rounded-xl overflow-hidden" style={{ background: C.surface }}>
        <div {...bindTap('topic.broadcast-open', { params: { id: b.id } })} className="cursor-pointer">
          {cover ? (
            <>
              <Img src={cover} className="w-full h-40 object-cover block" />
              <div className="px-2.5 pt-2 pb-1 text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>
                {title}
              </div>
            </>
          ) : (
            <div
              className="px-3 pt-4 pb-3"
              style={{
                background: `repeating-linear-gradient(to bottom, ${CARD_CREAM} 0px, ${CARD_CREAM} 27px, ${CARD_CREAM_LINE} 27px, ${CARD_CREAM_LINE} 28px)`,
              }}
            >
              <div className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>
                {title}
              </div>
              {body && (
                <div
                  className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words overflow-hidden"
                  style={{ color: '#8C7F76', display: '-webkit-box', WebkitLineClamp: 13, WebkitBoxOrient: 'vertical' }}
                >
                  {body}
                </div>
              )}
            </div>
          )}
        </div>
        {renderFoot(b)}
      </div>
    );
  };

  /** 左列节点:热门 tab 在第 2 张位置插 1 张广告卡(IMG_0474) */
  const leftNodes = useMemo(() => {
    const nodes = colLeft.map(renderCard);
    if (sort === 'hot' && nodes.length > 0) nodes.splice(Math.min(1, nodes.length), 0, renderAdCard());
    return nodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colLeft, sort, users, broadcasts]);

  /** FAB 第二形态:滚动后或最新 tab → 右下深色圆形笔钮(IMG_0473) */
  const penFab = scrolled || sort === 'new';

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.surface }} data-status-bar-foreground="dark">
      {/* 顶栏:‹ + 灰底搜索框(#话题名#,大圆角矩形,装饰)+ ⋯(装饰) */}
      <div className="flex items-center h-12 pl-1 pr-2 gap-1 shrink-0" style={{ background: C.surface }}>
        <button
          {...bindBack()}
          className="w-9 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: C.text }}
        >
          ‹
        </button>
        <div className="flex-1 h-9 min-w-0 rounded-lg flex items-center gap-1.5 px-3" style={{ background: '#F2F3F5' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" className="shrink-0">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <span className="text-[14px] truncate" style={{ color: C.text }}>#{topic?.name ?? '话题'}#</span>
        </div>
        <span className="w-9 h-10 flex items-center justify-center text-xl shrink-0" style={{ color: C.text }}>⋯</span>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        onScroll={(e) => setScrolled((e.target as HTMLElement).scrollTop > 160)}
      >
        {/* 话题标题 + 绿色关注钮 + 数据行(1.0万+篇内容 · 401.2万次浏览) */}
        <div className="px-4 pt-2 pb-1">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 text-[22px] font-bold leading-snug" style={{ color: C.text }}>
              {topic?.name ?? '话题'}
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'topic.follow.toggle' }, {
                onTrigger: () => {
                  toggleFollowTopic(id);
                  toast(followed ? '已取消关注' : '关注成功');
                },
              })}
              className="px-3.5 h-9 rounded-lg text-[15px] font-medium cursor-pointer shrink-0"
              style={
                followed
                  ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
                  : { background: C.green, color: '#fff', border: 'none' }
              }
            >
              {followed ? '已关注' : '+关注'}
            </button>
          </div>
          <div className="mt-2 text-[13px]" style={{ color: C.sub }}>
            {(topic?.postCount ?? 0) >= 10000 ? fmtCountPlus(topic?.postCount ?? 0) : String(topic?.postCount ?? 0)}
            篇内容 · {fmtCount(topic?.views ?? 0)}次浏览
          </div>
        </div>

        {/* 热门 | 最新 下划线 tab */}
        <div className="sticky top-0 z-10 flex items-end gap-8 px-4 pt-4 pb-2" style={{ background: C.surface }}>
          <div
            {...bindTap({ kind: 'action', id: 'topic.sort.select.target' }, {
              params: { target: 'hot' },
              onTrigger: () => switchSort('hot'),
            })}
            className={`relative pb-1.5 cursor-pointer ${sort === 'hot' ? 'font-bold text-[17px]' : 'text-[16px]'}`}
            style={{ color: sort === 'hot' ? C.text : C.sub }}
          >
            热门
            {sort === 'hot' && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-7 h-[3px] rounded-full" style={{ background: C.text }} />
            )}
          </div>
          <div
            {...bindTap({ kind: 'action', id: 'topic.sort.select.target' }, {
              params: { target: 'new' },
              onTrigger: () => switchSort('new'),
            })}
            className={`relative pb-1.5 cursor-pointer ${sort === 'new' ? 'font-bold text-[17px]' : 'text-[16px]'}`}
            style={{ color: sort === 'new' ? C.text : C.sub }}
          >
            最新
            {sort === 'new' && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-7 h-[3px] rounded-full" style={{ background: C.text }} />
            )}
          </div>
        </div>

        {/* 双列瀑布流卡片 */}
        {list.length === 0 ? (
          <EmptyState text="还没有人参与这个话题" icon="cat" />
        ) : (
          <div className="px-3 pt-1 pb-24">
            <div className="flex items-start gap-2.5">
              <div className="flex-1 min-w-0 space-y-2.5">{leftNodes}</div>
              <div className="flex-1 min-w-0 space-y-2.5">{colRight.map(renderCard)}</div>
            </div>
            <TheEnd />
          </div>
        )}
      </div>

      {/* FAB:未滚动+热门=中央胶囊(和 N 人一起讨论,N 原始整数);滚动/最新=右下深色圆形笔钮 */}
      {penFab ? (
        <div className="absolute bottom-6 right-4 pointer-events-none" data-hide-on-keyboard="true">
          <button
            {...bindTap('topic.compose-open')}
            className="pointer-events-auto w-13 h-13 rounded-full flex items-center justify-center border-none cursor-pointer shadow-lg"
            style={{ background: '#1E1E1E', boxShadow: '0 4px 16px rgba(0,0,0,0.28)' }}
            aria-label="参与话题"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none" data-hide-on-keyboard="true">
          <button
            {...bindTap('topic.compose-open')}
            className="pointer-events-auto flex items-center justify-center gap-2 h-11 px-10 rounded-full border-none cursor-pointer shadow-lg text-[15px]"
            style={{ background: '#F5F6F7', color: C.text, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            和 {topic?.postCount ?? 0} 人一起讨论
          </button>
        </div>
      )}
    </div>
  );
}
