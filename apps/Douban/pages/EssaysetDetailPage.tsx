// 文集详情(essaySet.detail,/essaySet/:essaySetId,IMG_0274/0275):
// 头图+标题+作者 + 更新时间/关注按钮/关注人数 + 篇数/排序 + 文章列表。
// 关注按钮:本地 toggle(文集不在 follows 模型内)+绿toast;文章行→广播详情。
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, C, TheEnd, SegRow, fmtCount } from '../components/ui';

/** 海报艺术字副标(数据无关地由标题派生;不再对任意文集写死 Lilith) */
const POSTER_SUBTITLE: Record<string, string> = {
  女性主义: 'WOMEN EMPOWERMENT',
};
const posterSubtitle = (title: string) => POSTER_SUBTITLE[title] ?? 'A CURATED ESSAY SET';

export default function EssaysetDetailPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const routeParams = useParams();
  const essaySets = useDoubanStore((s) => s.essaySets);
  const users = useDoubanStore((s) => s.users);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const follows = useDoubanStore((s) => s.follows);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);

  const essaySet = useMemo(
    () => essaySets.find((e) => e.id === routeParams.essaySetId) ?? essaySets[0],
    [essaySets, routeParams.essaySetId],
  );
  const author = useMemo(() => users.find((u) => u.id === essaySet?.ownerId), [users, essaySet]);

  const followed = !!(essaySet?.ownerId && follows.users.includes(essaySet.ownerId));
  const [sort, setSort] = useState<'默认' | '最早'>('默认');
  const sortNewest = sort === '默认';

  // 文集收录的文章:优先取作者的广播,回退用 essaySet.articles 元数据
  const authorBroadcasts = useMemo(
    () => broadcasts.filter((b) => b.authorId === essaySet?.ownerId && !b.isRepost),
    [broadcasts, essaySet],
  );

  if (!essaySet) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <TopBar title="文集详情" />
      </div>
    );
  }

  const articles = essaySet.articles.slice();
  if (!sortNewest) articles.reverse();

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="light">
      <TopBar
        dark
        bg="transparent"
        borderless
        title={
          <span className="inline-flex items-center gap-1">
            文集
            <span className="text-xs opacity-80">ⓘ</span>
          </span>
        }
        right={
          <button
            onClick={() => toast('该功能暂未开放')}
            className="relative w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer text-xl"
            style={{ color: C.darkText }}
            aria-label="更多"
          >
            ⋯
            <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 rounded-full text-[9px] text-white flex items-center justify-center" style={{ background: '#F0453E' }}>1</span>
          </button>
        }
      />
      <div
        className="flex-1 overflow-y-auto -mt-11"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 全幅装饰头图:标题/作者/更新时间/关注 叠加在暗红渐变海报上 */}
        <div
          className="relative w-full px-4 pt-14 pb-4"
          style={{
            minHeight: 300,
            backgroundColor: '#3A0A0E',
            backgroundImage: essaySet.cover
              ? `linear-gradient(180deg, rgba(58,10,14,0.35) 0%, rgba(58,10,14,0.55) 55%, rgba(58,10,14,0.9) 100%), url(${essaySet.cover})`
              : 'radial-gradient(120% 90% at 50% 22%, #7A1620 0%, #4A0C12 48%, #2A060A 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* 装饰性大字标题(海报艺术字,数据派生:作者名 + 标题 + 派生副标) */}
          <div className="flex flex-col items-center justify-center pt-4 pb-8">
            <div
              className="text-5xl font-black tracking-wide"
              style={{ color: '#C0303A', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              {author?.name ?? '豆友'}
            </div>
            <div
              className="mt-1 text-4xl font-black tracking-widest text-center"
              style={{ color: '#B22832', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              {essaySet.title}
            </div>
            <div className="mt-4 text-[11px] tracking-[0.35em] text-center" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {posterSubtitle(essaySet.title)}
            </div>
          </div>

          {/* 底部叠加:作者/更新时间(含时刻) + 关注按钮 */}
          <div className="relative flex items-center justify-between">
            <button
              {...bindTap('essaySet.author-open', { params: { userId: essaySet.ownerId } })}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
            >
              <Avatar src={author?.avatar ?? ''} size={26} />
              <span className="text-[13px]" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {author?.name ?? '豆友'} 2026-{essaySet.articles[0]?.date ?? '06-15'} 21:05更新
              </span>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'essaySet.follow.btn.toggle' }, {
                onTrigger: () => {
                  const uid = essaySet.ownerId;
                  if (!uid) return;
                  if (followed) { unfollowUser(uid); toast('已取消关注'); }
                  else { followUser(uid); toast('关注成功'); }
                },
              })}
              className="px-5 h-8 rounded-full text-sm cursor-pointer"
              style={followed
                ? { background: 'rgba(255,255,255,0.18)', color: 'rgba(255,255,255,0.9)', border: 'none' }
                : { background: C.green, color: '#fff', border: 'none' }}
            >
              {followed ? '已关注' : '+ 关注'}
            </button>
          </div>
          <div className="relative mt-3">
            <div className="text-lg font-bold" style={{ color: '#fff' }}>{essaySet.title}</div>
            <div className="mt-0.5 flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>
              <span>{followed ? 2 : 1} 人关注</span>
              <span>›</span>
            </div>
          </div>
        </div>

        {/* 篇数 + 默认/最早 分段控件 */}
        <div className="flex items-center justify-between px-4 py-2.5 mt-2 bg-white border-b" style={{ borderColor: '#F2F3F5' }}>
          <span className="text-sm font-semibold" style={{ color: C.text }}>{essaySet.articles.length} 篇内容</span>
          <SegRow
            options={['默认', '最早'] as const}
            value={sort}
            size="sm"
            bindFor={(v) => bindTap({ kind: 'action', id: 'essaySet.sort.select.target' }, {
              params: { target: v === '默认' ? 'newest' : 'oldest' },
              onTrigger: () => setSort(v as '默认' | '最早'),
            })}
          />
        </div>

        {/* 文章卡:头像+昵称+日期行、粗标题、多行正文+…全文、赞/回复/转发行、收藏于条 */}
        <div className="bg-white">
          {articles.map((a, i) => {
            const bc = authorBroadcasts[i];
            return (
              <button
                key={i}
                {...(bc
                  ? bindTap('essaySet.article-open', { params: { id: bc.id } })
                  : { onClick: () => toast('该文章暂无详情') })}
                className="w-full text-left px-4 py-3.5 border-b bg-transparent cursor-pointer"
                style={{ borderColor: '#F2F3F5' }}
              >
                {/* 作者行 */}
                <div className="flex items-center gap-2">
                  <Avatar src={author?.avatar ?? ''} size={26} />
                  <span className="text-[13px] font-medium" style={{ color: C.text }}>{author?.name ?? '豆友'}</span>
                  <span className="text-[11px]" style={{ color: '#B9BEC6' }}>2026-{a.date}</span>
                </div>
                {/* 粗标题 */}
                <div className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: C.text }}>{a.title}</div>
                {/* 多行正文 + …全文 */}
                {bc && (
                  <div className="mt-1 text-[13px] leading-relaxed" style={{ color: C.sub }}>
                    <span className="line-clamp-3">{bc.text}</span>
                    <span style={{ color: C.link }}>…全文</span>
                  </div>
                )}
                {/* 赞/回复/转发 图标行 */}
                <div className="mt-2.5 flex items-center gap-6 text-xs" style={{ color: C.sub }}>
                  <span className="inline-flex items-center gap-1">👍 {bc ? fmtCount(bc.likeCount) : 1}</span>
                  <span className="inline-flex items-center gap-1">💬 {bc ? fmtCount(bc.replyCount) : 2}</span>
                  <span className="inline-flex items-center gap-1">↗ 转发</span>
                </div>
                {/* 收藏于 灰条 */}
                <div className="mt-2 rounded-md px-2.5 py-1.5 text-[11px]" style={{ background: '#F5F6F8', color: C.sub }}>
                  收藏于 2026-{a.date} 21:05
                </div>
              </button>
            );
          })}
        </div>
        <TheEnd />
      </div>
    </div>
  );
}
