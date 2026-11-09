// apps/Douban/components/DetailFive.tsx —— 5 子tab 详情页共享模板(FOUNDATION)。
// 覆盖 broadcast.detail / group.topic / discussion.detail / review.detail 四类同构页:
//   tab 计数条(回复N/赞N/转发N/收藏N/礼物) + 回复列表(热门/楼中楼引用/排序chips 作者|默认|最新)
//   + 赞/转发/收藏/礼物 tab 内容 + 底部操作栏(reply 形态=写回复输入条+纯图标;article 形态=图标+右侧计数)。
// 纯展示组件:所有 bind* 由页面侧用字面量 id 生成后传入(工厂函数在页面文件里定义,
// 内部仍是字面量,如 bindTab={(t) => bindTap({kind:'action',id:'broadcast.tab.select.target'},{params:{target:t},onTrigger:...})})。
import React from 'react';
import type {
  DoubanCollectRecord,
  DoubanGiftRecord,
  DoubanLikeRecord,
  DoubanReply,
  DoubanRepostRecord,
  DoubanUser,
} from '../types';
import { Avatar, C, EmptyState, MetaLine, TheEnd, fmtCount } from './ui';

export type DetailTab = 'reply' | 'like' | 'repost' | 'collect' | 'gift';
export type ReplySort = 'author' | 'default' | 'latest';

export const DETAIL_TABS: { id: DetailTab; label: string }[] = [
  { id: 'reply', label: '回复' },
  { id: 'like', label: '赞' },
  { id: 'repost', label: '转发' },
  { id: 'collect', label: '收藏' },
  { id: 'gift', label: '礼物' },
];

export const REPLY_SORTS: { id: ReplySort; label: string }[] = [
  { id: 'author', label: '作者' },
  { id: 'default', label: '默认' },
  { id: 'latest', label: '最新' },
];

export interface DetailFiveProps {
  /** 计数(礼物 tab 无计数,显示「礼物」) */
  counts: { reply: number; like: number; repost: number; collect: number };
  activeTab: DetailTab;
  /** 页面侧字面量绑定工厂 */
  bindTab: (tab: DetailTab) => object;

  // ---- 回复 tab ----
  replies: DoubanReply[];
  /** 排序后由页面传入已排好的列表;组件不做排序(判序逻辑归页面) */
  sort: ReplySort;
  bindSort: (sort: ReplySort) => object;
  userOf: (userId: string) => DoubanUser | undefined;
  authorId: string;
  /** 他人回复行 tap(弹引用/回复),自己的回复行 longPress(删除确认) */
  bindReplyRow?: (reply: DoubanReply) => object;
  bindOwnReplyRow?: (reply: DoubanReply) => object;
  /** 楼中楼「N 条回复 ›」 */
  bindThreadExpand?: (reply: DoubanReply) => object;
  /** 当前展开显示楼中楼的主楼回复 id(默认折叠;点「N 条回复 ›」展开、「收起回复 ∧」折叠);其子回复在该主楼下方缩进显示 */
  expandedThreadId?: string | null;
  /** 引用块查找 */
  replyById?: (id: string) => DoubanReply | undefined;
  /** 引用块中被引用回复不可用时的占位文案(默认「[该回复已被删除]」,可传「[该回复不可见]」) */
  quoteUnavailableText?: string;

  // ---- 其余 tab 数据 ----
  likes: DoubanLikeRecord[];
  reposts: DoubanRepostRecord[];
  collects: DoubanCollectRecord[];
  gifts: DoubanGiftRecord[];
  doulistTitleOf?: (doulistId: string) => string;
  bindUserOpen?: (userId: string) => object;
  /** 礼物空态「送礼物」按钮(打开 GiftSheet) */
  bindGiftOpen: object;

  // ---- 底部操作栏 ----
  likedByMe: boolean;
  collectedByMe: boolean;
  bindReplyBar: object;
  bindLike: object;
  bindRepost: object;
  bindCollect: object;
  replyBarPlaceholder?: string;
  /** 第2个子tab(like)显示文案:讨论=「赞」(默认),影评=「有用」;仅改显示,不改 subtab/action id */
  likeLabel?: string;
}

function relTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return `${Math.floor(d / 30)}个月前`;
}

/** tab 计数条(吸附在正文下方;由页面放进滚动流或 sticky) */
export function DetailTabStrip({
  counts,
  activeTab,
  bindTab,
  likeLabel = '赞',
}: Pick<DetailFiveProps, 'counts' | 'activeTab' | 'bindTab' | 'likeLabel'>) {
  const baseLabelOf = (t: DetailTab) =>
    t === 'like' ? likeLabel : DETAIL_TABS.find((x) => x.id === t)?.label;
  // 真机:计数为 0 时只显示 tab 文案(如「转发」「收藏」),不渲染数字;礼物 tab 永远无计数
  const countOf = (t: DetailTab) =>
    t === 'gift' ? 0 : (counts[t as keyof DetailFiveProps['counts']] ?? 0);
  return (
    <div className="flex border-b bg-white px-2" style={{ borderColor: C.border }}>
      {DETAIL_TABS.map((t) => {
        const active = activeTab === t.id;
        return (
          <button
            key={t.id}
            {...bindTab(t.id)}
            className="flex-1 py-3 bg-transparent border-none cursor-pointer text-sm relative"
            style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
          >
            {baseLabelOf(t.id)}
            {countOf(t.id) > 0 && (
              <span className="text-xs ml-0.5">{fmtCount(countOf(t.id))}</span>
            )}
            {active && (
              <span
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
                style={{ background: C.text }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

function QuoteBlock({
  quoted,
  userOf,
  unavailableText = '[该回复已被删除]',
}: {
  quoted: DoubanReply;
  userOf: DetailFiveProps['userOf'];
  unavailableText?: string;
}) {
  const name = userOf(quoted.authorId)?.name ?? '豆友';
  return (
    <div className="mt-1.5 px-2.5 py-1.5 rounded text-xs" style={{ background: '#F2F3F5', color: C.sub }}>
      {quoted.deleted ? unavailableText : `${name}：${quoted.text}`}
    </div>
  );
}

function ReplyRow({
  reply,
  props,
  now,
  isSelf,
}: {
  reply: DoubanReply;
  props: DetailFiveProps;
  now: number;
  isSelf: boolean;
}) {
  const { userOf, replyById, bindReplyRow, bindOwnReplyRow, bindThreadExpand, replies, authorId, expandedThreadId } = props;
  const user = userOf(reply.authorId);
  const childCount = replies.filter((r) => r.quoteReplyId === reply.id && !r.deleted).length;
  if (reply.deleted) {
    return (
      <div className="px-4 py-3 text-xs" style={{ color: '#B9BEC6' }}>
        [该回复已被删除]
      </div>
    );
  }
  const quoted = reply.quoteReplyId && replyById ? replyById(reply.quoteReplyId) : undefined;
  const bind = isSelf ? bindOwnReplyRow?.(reply) : bindReplyRow?.(reply);
  return (
    <div {...(bind ?? {})} className="flex gap-2.5 px-4 py-3">
      <Avatar src={user?.avatar ?? ''} size={32} />
      <div className="flex-1 min-w-0">
        {/* 第1行:名字(+徽章)后紧跟灰字「6天前·广东」(无「IP属地」前缀),行末右侧 数字+👍(0 不显示数字) */}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] truncate" style={{ color: C.sub }}>{user?.name ?? '豆友'}</span>
          {reply.authorId === authorId && (
            <span className="px-1 rounded text-[9px] shrink-0" style={{ background: C.greenSoft, color: C.green }}>作者</span>
          )}
          {reply.authorLiked && (
            <span className="px-1 rounded text-[9px] shrink-0" style={{ background: '#FFF4E5', color: C.gold }}>作者赞过</span>
          )}
          <span className="text-[11px] shrink-0" style={{ color: '#B9BEC6' }}>
            {[relTime(reply.createdAt, now), reply.ipLocation].filter(Boolean).join('·')}
          </span>
          <span className="ml-auto shrink-0 text-[11px] flex items-center gap-1" style={{ color: C.sub }}>
            {reply.likeCount > 0 ? fmtCount(reply.likeCount) : ''}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" />
            </svg>
          </span>
        </div>
        <div className="mt-1 text-sm leading-relaxed break-words" style={{ color: C.text }}>{reply.text}</div>
        {reply.images.length > 0 && (
          <div className="mt-1.5 flex gap-1">
            {reply.images.map((src, i) => (
              <img key={i} src={src} alt="" className="w-20 h-20 rounded object-cover" />
            ))}
          </div>
        )}
        {quoted && <QuoteBlock quoted={quoted} userOf={userOf} unavailableText={props.quoteUnavailableText} />}
        {childCount > 0 && bindThreadExpand && (
          <button
            {...bindThreadExpand(reply)}
            onClickCapture={(e) => e.stopPropagation()}
            className="mt-1.5 text-xs bg-transparent border-none cursor-pointer p-0"
            style={{ color: C.sub }}
          >
            {expandedThreadId === reply.id ? '收起回复 ∧' : `${childCount} 条回复 ›`}
          </button>
        )}
      </div>
    </div>
  );
}

/** tab 内容区(页面把它放进主滚动容器) */
export function DetailTabContent(props: DetailFiveProps & { currentUserId: string; now: number }) {
  const { activeTab, replies, sort, bindSort, likes, reposts, collects, gifts, userOf, bindUserOpen, doulistTitleOf, bindGiftOpen, currentUserId, now, expandedThreadId } = props;

  // 主楼回复 + 楼中楼子回复(默认折叠为「N 条回复 ›」;点开 = 把该主楼 id 记入 expandedThreadId 缩进展开)
  const renderThread = (r: DoubanReply) => {
    const expanded = expandedThreadId === r.id;
    const children = expanded ? replies.filter((c) => c.quoteReplyId === r.id && !c.deleted) : [];
    return (
      <React.Fragment key={r.id}>
        <ReplyRow reply={r} props={props} now={now} isSelf={r.authorId === currentUserId} />
        {children.length > 0 && (
          <div className="ml-11 mr-3 mb-1 pl-3 rounded-lg" style={{ borderLeft: `2px solid ${C.border}`, background: '#FAFBFC' }}>
            {children.map((c) => (
              <ReplyRow key={c.id} reply={c} props={props} now={now} isSelf={c.authorId === currentUserId} />
            ))}
          </div>
        )}
      </React.Fragment>
    );
  };

  if (activeTab === 'reply') {
    const hot = replies.filter((r) => r.isHot && !r.deleted && !r.quoteReplyId);
    const rest = replies.filter((r) => !r.isHot && !r.quoteReplyId);
    return (
      <div className="bg-white">
        {hot.length > 0 && (
          <>
            <div className="px-4 pt-3 text-sm font-bold" style={{ color: C.text }}>热门回复</div>
            {hot.map((r) => renderThread(r))}
          </>
        )}
        <div className="flex items-center justify-between px-4 pt-3">
          <div className="text-sm font-bold" style={{ color: C.text }}>全部回复</div>
          <div className="flex rounded-full overflow-hidden" style={{ background: '#F2F3F5' }}>
            {REPLY_SORTS.map((sOpt) => (
              <button
                key={sOpt.id}
                {...bindSort(sOpt.id)}
                className="px-2.5 py-1 text-[11px] border-none cursor-pointer"
                style={{
                  background: sort === sOpt.id ? '#fff' : 'transparent',
                  color: sort === sOpt.id ? C.text : C.sub,
                  margin: 2,
                  borderRadius: 999,
                  fontWeight: sort === sOpt.id ? 600 : 400,
                }}
              >
                {sOpt.label}
              </button>
            ))}
          </div>
        </div>
        {rest.length === 0 ? (
          <EmptyState text="还没有回复" icon="cat" />
        ) : (
          rest.map((r) => renderThread(r))
        )}
        {rest.length > 0 && <TheEnd />}
      </div>
    );
  }

  if (activeTab === 'like') {
    return (
      <div className="bg-white">
        {likes.length === 0 ? (
          <EmptyState text="还没有人点赞" icon="cat" />
        ) : (
          likes.map((l) => {
            const u = userOf(l.userId);
            return (
              <div key={l.id} {...(bindUserOpen ? bindUserOpen(l.userId) : {})} className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                <Avatar src={u?.avatar ?? ''} size={36} />
                <span className="text-sm" style={{ color: C.text }}>{u?.name ?? '豆友'}</span>
              </div>
            );
          })
        )}
        {likes.length > 0 && <TheEnd />}
      </div>
    );
  }

  if (activeTab === 'repost') {
    return (
      <div className="bg-white">
        {reposts.length === 0 ? (
          <EmptyState text="还没有转发" icon="cat" />
        ) : (
          reposts.map((r) => {
            const u = userOf(r.userId);
            return (
              <div key={r.id} className="flex gap-2.5 px-4 py-3">
                <Avatar src={u?.avatar ?? ''} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]" style={{ color: C.sub }}>{u?.name ?? '豆友'}</div>
                  <div className="mt-0.5 text-sm" style={{ color: C.text }}>{r.comment || '转发'}</div>
                  <div className="mt-1"><MetaLine time={relTime(r.createdAt, now)} /></div>
                </div>
              </div>
            );
          })
        )}
        {reposts.length > 0 && <TheEnd />}
      </div>
    );
  }

  if (activeTab === 'collect') {
    return (
      <div className="bg-white">
        {collects.length === 0 ? (
          <EmptyState text="还没有人收藏" icon="cat" />
        ) : (
          collects.map((cRec) => {
            const u = userOf(cRec.userId);
            return (
              <div key={cRec.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar src={u?.avatar ?? ''} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: C.text }}>{u?.name ?? '豆友'}</div>
                  <div className="text-xs mt-0.5" style={{ color: C.sub }}>
                    收藏到豆列 {doulistTitleOf?.(cRec.doulistId) ?? '豆列'}
                  </div>
                </div>
                <MetaLine time={relTime(cRec.createdAt, now)} />
              </div>
            );
          })
        )}
        {collects.length > 0 && <TheEnd />}
      </div>
    );
  }

  // gift tab
  return (
    <div className="bg-white">
      {gifts.length === 0 ? (
        <EmptyState
          text="还没收到礼物"
          icon="gift"
          action={
            <button
              {...bindGiftOpen}
              className="px-6 h-9 rounded-full text-sm text-white border-none cursor-pointer"
              style={{ background: C.green }}
            >
              送礼物
            </button>
          }
        />
      ) : (
        gifts.map((g) => {
          const u = userOf(g.userId);
          return (
            <div key={g.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar src={u?.avatar ?? ''} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: C.text }}>{u?.name ?? '豆友'} 送出礼物</div>
                {g.note && <div className="text-xs mt-0.5" style={{ color: C.sub }}>{g.note}</div>}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

/**
 * 底部操作栏,真机有两种形态:
 * - mode='reply'(默认,回复形态):「写回复」输入条 + 赞/转发/收藏/礼物 4 个纯图标(图标下方无任何文字/计数)
 * - mode='article'(文章/浏览形态):无输入条;💬/赞/转发/收藏/礼物 5 个图标平铺,计数在图标右侧(0 或无 → 不显示;礼物永远无计数)
 */
export function DetailBottomBar({
  counts,
  likedByMe,
  collectedByMe,
  bindReplyBar,
  bindLike,
  bindRepost,
  bindCollect,
  bindGiftOpen,
  replyBarPlaceholder = '写回复',
  mode = 'reply',
}: Pick<
  DetailFiveProps,
  'counts' | 'likedByMe' | 'collectedByMe' | 'bindReplyBar' | 'bindLike' | 'bindRepost' | 'bindCollect' | 'bindGiftOpen' | 'replyBarPlaceholder'
> & { mode?: 'article' | 'reply' }) {
  const likeSvg = (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={likedByMe ? C.green : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 013 3.88z" />
    </svg>
  );
  const repostSvg = (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17 1l4 4-4 4" />
      <path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4" />
      <path d="M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
  const collectSvg = (
    <svg width="21" height="21" viewBox="0 0 24 24" fill={collectedByMe ? C.gold : 'none'} stroke="currentColor" strokeWidth="1.8">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
  const giftSvg = (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 010-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 010 5" />
    </svg>
  );

  if (mode === 'article') {
    const commentSvg = (
      <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    );
    const rowCls = 'flex-1 flex items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer';
    const countText = (n: number) =>
      n > 0 ? <span className="text-xs" style={{ color: C.sub }}>{fmtCount(n)}</span> : null;
    return (
      <div
        className="shrink-0 flex items-center px-2 h-13 border-t bg-white py-2"
        style={{ borderColor: C.border }}
        data-hide-on-keyboard="true"
      >
        <button {...bindReplyBar} className={rowCls} style={{ color: C.text }}>
          {commentSvg}
          {countText(counts.reply)}
        </button>
        <button {...bindLike} className={rowCls} style={{ color: likedByMe ? C.green : C.text }}>
          {likeSvg}
          {countText(counts.like)}
        </button>
        <button {...bindRepost} className={rowCls} style={{ color: C.text }}>
          {repostSvg}
          {countText(counts.repost)}
        </button>
        <button {...bindCollect} className={rowCls} style={{ color: collectedByMe ? C.gold : C.text }}>
          {collectSvg}
          {countText(counts.collect)}
        </button>
        <button {...bindGiftOpen} className={rowCls} style={{ color: C.text }}>
          {giftSvg}
        </button>
      </div>
    );
  }

  const iconCls = 'flex items-center justify-center w-11 bg-transparent border-none cursor-pointer relative';
  return (
    <div
      className="shrink-0 flex items-center gap-2 px-3 h-13 border-t bg-white py-2"
      style={{ borderColor: C.border }}
      data-hide-on-keyboard="true"
    >
      <button
        {...bindReplyBar}
        className="flex-1 h-9 rounded-full text-left px-4 text-sm border-none cursor-pointer"
        style={{ background: '#F2F3F5', color: C.sub }}
      >
        {replyBarPlaceholder}
      </button>
      <button {...bindLike} className={iconCls} style={{ color: likedByMe ? C.green : C.text }}>
        {likeSvg}
      </button>
      <button {...bindRepost} className={iconCls} style={{ color: C.text }}>
        {repostSvg}
      </button>
      <button {...bindCollect} className={iconCls} style={{ color: collectedByMe ? C.gold : C.text }}>
        {collectSvg}
      </button>
      <button {...bindGiftOpen} className={iconCls} style={{ color: C.text }}>
        {giftSvg}
      </button>
    </div>
  );
}
