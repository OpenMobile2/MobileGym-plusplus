import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Img, Stars, TheEnd, MarkBtn, SegRow, fmtAbsDateTime } from '../components/ui';
import { payWithSystem } from '../capabilities';

// 节点: doulist.detail —— 豆列详情(通用:豆列/片单/书单/播单)。
// evidence: frame:52270a@t0085 / IMG_0238-0241
// 由 subjectId 派生的稳定「其他版本」数量(真机 116 式真实数字,确定性派生非随机)。
function editionCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return 6 + (h % 250);
}

export default function DoulistDetailPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const routeParams = useParams();

  const toast = useDoubanStore((s) => s.toast);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const doulists = useDoubanStore((s) => s.doulists);
  const subjects = useDoubanStore((s) => s.subjects);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const reviews = useDoubanStore((s) => s.reviews);
  const users = useDoubanStore((s) => s.users);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const follows = useDoubanStore((s) => s.follows);
  const marks = useDoubanStore((s) => s.marks);
  const toggleFollowDoulist = useDoubanStore((s) => s.toggleFollowDoulist);

  const doulistId = routeParams.doulistId ?? doulists[0]?.id ?? 'dl_new1';
  const doulist = useMemo(() => doulists.find((d) => d.id === doulistId) ?? doulists[0], [doulists, doulistId]);

  const me = currentUser.id;
  const owner = users.find((u) => u.id === doulist?.ownerId);
  const isOwn = doulist?.ownerId === me;
  const followed = doulist ? follows.doulists.includes(doulist.id) : false;

  const [sort, setSort] = useState<'default' | 'earliest'>('default');
  const [buyableOnly, setBuyableOnly] = useState(false);
  const [introExpanded, setIntroExpanded] = useState(false);

  // subject-kind 条目(item-open→subject.book 单一落点)
  const items = useMemo(() => {
    if (!doulist) return [];
    const subjs = doulist.items
      .filter((it) => it.kind === 'subject')
      .map((it) => subjects.find((s) => s.id === it.refId))
      .filter((s): s is NonNullable<typeof s> => s != null);
    const ordered = sort === 'earliest' ? [...subjs].reverse() : subjs;
    return buyableOnly ? ordered.filter((s) => s.buyPrice != null) : ordered;
  }, [doulist, subjects, sort, buyableOnly]);

  // content-kind 条目(广播/小组帖/长评);收藏夹(IMG_0489)= 内容卡列表
  const hasContent = (doulist?.items ?? []).some((it) => it.kind !== 'subject');
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const contentCards = useMemo(() => {
    if (!doulist) return [] as { key: string; authorId: string; text: string; likeCount: number; replyCount: number; repostCount: number }[];
    const cards = doulist.items
      .map((it, i) => {
        if (it.kind === 'broadcast') {
          const b = broadcasts.find((x) => x.id === it.refId);
          return b ? { key: `b${i}`, authorId: b.authorId, text: b.text, likeCount: b.likeCount, replyCount: b.replyCount, repostCount: b.repostCount } : null;
        }
        if (it.kind === 'groupPost') {
          const p = groupPosts.find((x) => x.id === it.refId);
          return p ? { key: `p${i}`, authorId: p.authorId, text: p.content || p.title, likeCount: p.likeCount, replyCount: p.replyCount, repostCount: p.repostCount } : null;
        }
        if (it.kind === 'review') {
          const r = reviews.find((x) => x.id === it.refId);
          return r ? { key: `r${i}`, authorId: r.authorId, text: r.text, likeCount: r.likeCount, replyCount: r.replyCount, repostCount: r.repostCount } : null;
        }
        return null;
      })
      .filter((c): c is NonNullable<typeof c> => c != null);
    return sort === 'earliest' ? [...cards].reverse() : cards;
  }, [doulist, broadcasts, groupPosts, reviews, sort]);

  if (!doulist) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>豆列不存在</div>
      </div>
    );
  }

  const total = doulist.items.filter((it) => it.kind === 'subject').length;
  const contentTotal = doulist.items.length;

  // kind 派生:进度动词/单位、条目 icon、专属工具钮。
  const kind = doulist.kindLabel;
  const doneVerb = kind === '片单' ? '看过' : kind === '播单' ? '听过' : kind === '书单' || kind === '豆列' ? '读过' : '读过';
  const unit = kind === '片单' ? '部' : kind === '播单' ? '张' : '本';
  const markLabel = kind === '片单' ? '想看' : kind === '播单' ? '想听' : '想读';
  const playableCount = items.filter((s) => s.type === 'movie' || s.type === 'tv').length;
  const progressPct = total > 0 ? Math.min(100, (doulist.doneCount / total) * 100) : 0;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base truncate flex items-center justify-center gap-1" style={{ color: C.text }}>
          {doulist.kindLabel ?? '豆列'}
          <span className="w-4 h-4 rounded-full inline-flex items-center justify-center text-[10px]" style={{ border: `1px solid ${C.sub}`, color: C.sub }}>?</span>
        </div>
        {isOwn ? (
          <button
            {...bindTap('doulist.detail.edit-open')}
            className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
            aria-label="编辑"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 头部:①owner 行 ②双封面堆叠 + 大标题(灰底 hero) */}
        <div className="px-4 pt-3 pb-4" style={{ background: '#F2F3F5' }}>
          <div className="flex items-center gap-2">
            <Avatar src={owner?.avatar ?? ''} size={26} />
            <span className="text-xs" style={{ color: C.text }}>{owner?.name ?? '豆友'}</span>
            <span className="text-xs" style={{ color: C.sub }}>{fmtAbsDateTime(doulist.createdAt)} 更新</span>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="relative shrink-0" style={{ width: 68, height: 92 }}>
              <Img src={doulist.cover} className="absolute right-0 top-1 rounded object-cover" style={{ width: 58, height: 82, transform: 'rotate(4deg)', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
              <Img src={doulist.cover} className="absolute left-0 bottom-0 rounded object-cover" style={{ width: 60, height: 84, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="text-[20px] font-bold leading-tight" style={{ color: C.text }}>{doulist.title}</div>
            </div>
          </div>
          {doulist.intro && (
            <div
              {...bindTap({ kind: 'action', id: 'doulist.detail.intro.expand' }, { onTrigger: () => setIntroExpanded((v) => !v) })}
              className={`mt-2 text-sm leading-relaxed cursor-pointer ${introExpanded ? '' : 'line-clamp-2'}`}
              style={{ color: C.text }}
            >
              {doulist.intro}
              {!introExpanded && <span style={{ color: C.sub }}> …展开</span>}
            </div>
          )}
          {!isOwn && (
            <button
              {...bindTap({ kind: 'action', id: 'doulist.detail.follow.toggle' }, { onTrigger: () => { toggleFollowDoulist(doulist.id); toast(followed ? '已取消关注' : '关注成功'); } })}
              className="mt-3 px-5 h-8 rounded-full text-sm cursor-pointer"
              style={followed ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` } : { background: C.green, color: '#fff', border: 'none' }}
            >
              {followed ? '已关注' : '+ 关注'}
            </button>
          )}
        </div>

        {/* kind 专属工具钮:书单=🛒可购买、片单=▶可播放、播单/收藏夹=无 */}
        {!hasContent && (kind === '书单' || kind === '豆列') && (
          <div className="mt-2 bg-white px-4 pt-3">
            <button
              {...bindTap({ kind: 'action', id: 'doulist.detail.buyable.toggle' }, { onTrigger: () => setBuyableOnly((v) => !v) })}
              className="flex items-center gap-1 px-3 h-7 rounded-full text-xs border-none cursor-pointer"
              style={{ background: buyableOnly ? '#FDE7E7' : '#F2F3F5', color: C.danger }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 5h2l2 11h9l2-7H7" stroke={C.danger} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><circle cx="10" cy="20" r="1.4" fill={C.danger} /><circle cx="17" cy="20" r="1.4" fill={C.danger} /></svg>
              可购买
            </button>
          </div>
        )}
        {kind === '片单' && playableCount > 0 && (
          <div className="mt-2 bg-white px-4 pt-3">
            <button
              {...bindTap({ kind: 'action', id: 'doulist.detail.buy.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="flex items-center gap-1 px-3 h-7 rounded-full text-xs border-none cursor-pointer"
              style={{ background: '#FDE7E7', color: C.danger }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill={C.danger}><path d="M8 5v14l11-7z" /></svg>
              可播放
            </button>
          </div>
        )}

        {/* 进度行 + 默认|最早 段控 + 漏斗(收藏夹=「N个内容」无进度条/漏斗) */}
        <div className="mt-2 bg-white px-4 py-2.5 flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {hasContent ? (
              <span className="text-sm shrink-0" style={{ color: C.text }}>{contentTotal}个内容</span>
            ) : (
              <>
                <span className="text-sm shrink-0" style={{ color: C.text }}>{doneVerb} {doulist.doneCount}/{total}{unit}</span>
                <span className="w-14 h-1 rounded-full shrink-0" style={{ background: '#EDEDED' }}>
                  <span className="block h-full rounded-full" style={{ width: `${progressPct}%`, background: C.green }} />
                </span>
              </>
            )}
          </div>
          <div className="flex-1" />
          <SegRow
            options={['默认', '最早']}
            value={sort === 'default' ? '默认' : '最早'}
            size="sm"
            bindFor={(v) => bindTap({ kind: 'action', id: 'doulist.detail.sort.select.target' }, { params: { target: v === '默认' ? 'default' : 'earliest' }, onTrigger: () => setSort(v === '默认' ? 'default' : 'earliest') })}
          />
          {!hasContent && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke={C.sub} strokeWidth="1.8" strokeLinejoin="round" /></svg>
          )}
        </div>

        {/* 内容卡列表(收藏夹 IMG_0489:头像+名+日期 / 正文 / 👍💬↩ / 收藏于+铅笔) */}
        {hasContent && (
          <div className="mt-2">
            {contentCards.map((c) => {
              const u = userById.get(c.authorId);
              return (
                <div key={c.key} className="bg-white px-4 pt-3 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar src={u?.avatar ?? ''} size={32} />
                    <div className="min-w-0">
                      <div className="text-[13px] truncate" style={{ color: C.text }}>{u?.name ?? '豆友'}</div>
                      <div className="text-[11px]" style={{ color: '#B9BEC6' }}>{fmtAbsDateTime(doulist.createdAt)}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-[14px] leading-relaxed" style={{ color: C.text, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {c.text}
                  </div>
                  <div className="mt-2.5 flex items-center text-[13px]" style={{ color: C.sub }}>
                    <span className="flex items-center gap-1 flex-1">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="1.8"><path d="M7 10v11M2 12h5v9H2zM7 10l4-8a2 2 0 013 2l-1 5h6a2 2 0 012 2.3l-1.4 7A2 2 0 0116.6 21H7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      <span style={{ color: C.green }}>{c.likeCount}</span>
                    </span>
                    <span className="flex items-center gap-1 flex-1 justify-center">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 0121 11.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {c.replyCount}
                    </span>
                    <span className="flex items-center gap-1 flex-1 justify-end">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {c.repostCount > 0 ? c.repostCount : '转发'}
                    </span>
                  </div>
                  <div className="mt-2.5 rounded-md px-2.5 py-1.5 flex items-center gap-1 text-[11px]" style={{ background: '#F5F6F8', color: C.sub }}>
                    <span className="flex-1">收藏于 {fmtAbsDateTime(doulist.createdAt)}</span>
                    {isOwn && (
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="1.8"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </div>
                </div>
              );
            })}
            <TheEnd />
          </div>
        )}

        {/* 收藏项(subject) */}
        {!hasContent && (
        <div className="mt-2">
          {items.length === 0 ? (
            <div className="bg-white py-14 text-center text-sm" style={{ color: C.sub }}>没有可购买的条目</div>
          ) : (
            items.map((s) => {
              const marked = marks.some((m) => m.subjectId === s.id);
              return (
                <div key={s.id} className="px-4 pt-2 pb-3">
                  {/* 收藏组头:收藏于: 精确到分 + 行尾 ··· */}
                  <div className="flex items-center mb-1.5">
                    <span className="text-[11px]" style={{ color: '#B9BEC6' }}>收藏于: {fmtAbsDateTime(doulist.createdAt)}</span>
                    <span className="flex-1" />
                    <span className="text-sm tracking-widest" style={{ color: '#B9BEC6' }}>···</span>
                  </div>
                  <div className="flex gap-3 bg-white rounded-lg p-3" style={{ border: `1px solid ${C.border}` }}>
                    {/* 外层 div 避免 button 嵌套 button;内层按钮阻止冒泡 */}
                    <div {...bindTap('doulist.detail.item-open', { params: { subjectId: s.id, itemId: s.id, kind: s.type } })} role="button" className={`flex gap-3 flex-1 min-w-0 cursor-pointer text-left p-0 ${kind === '播单' ? 'items-center' : ''}`}>
                      <Img src={s.cover} className="rounded object-cover shrink-0" style={kind === '播单' ? { width: 84, height: 84 } : { width: 64, height: 88 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold truncate flex items-center gap-1" style={{ color: C.text }}>
                          {kind === '片单' ? (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill={C.danger} className="shrink-0"><path d="M8 5v14l11-7z" /></svg>
                          ) : kind === '书单' || kind === '豆列' ? (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" className="shrink-0"><path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4zM4 4v13" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          ) : null}
                          <span className="truncate">{s.title}{s.year ? `(${s.year})` : ''}</span>
                        </div>
                        <div className="mt-1"><Stars value={s.rating} size={11} /> {s.rating != null && <span className="text-xs" style={{ color: C.orange }}>{s.rating.toFixed(1)}</span>}</div>
                        <div className="mt-1 text-xs truncate" style={{ color: C.sub }}>{[s.author, s.press].filter(Boolean).join(' / ') || s.info}</div>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          {s.buyPrice != null && (
                            <button
                              {...bindTap({ kind: 'action', id: 'doulist.detail.buy.wontfix' }, { onTrigger: () => {
                                const launched = payWithSystem(
                                  { amount: s.buyPrice!, orderId: `subject-${s.id}`, subject: s.title },
                                  (result) => { if (result.resultCode === 'OK') toast('支付成功'); },
                                );
                                if (!launched) toast('无法打开系统支付');
                              } })}
                              onClickCapture={(e) => e.stopPropagation()}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs cursor-pointer border-none"
                              style={{ color: '#fff', background: C.danger }}
                            >
                              🛒¥{s.buyPrice.toFixed(1)} ›
                            </button>
                          )}
                          {(kind === '书单' || kind === '豆列') && (
                            <button
                              {...bindTap('doulist.detail.edition-open', { params: { subjectId: s.id, itemId: s.id, kind: s.type } })}
                              onClickCapture={(e) => e.stopPropagation()}
                              className="px-1.5 py-0.5 rounded text-[11px] cursor-pointer border-none"
                              style={{ color: C.sub, background: '#F2F3F5' }}
                            >
                              还有其他{editionCount(s.id)}个版本 ›
                            </button>
                          )}
                          {s.top250Rank != null && (
                            <span className="px-1.5 py-0.5 rounded text-[11px]" style={{ color: '#B8860B', background: '#FBF6EC' }}>{kind === '片单' ? '豆瓣电影' : '豆瓣图书'} Top250 ›</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <MarkBtn label={markLabel} marked={marked} markedLabel={`已${markLabel}`} bind={bindTap('doulist.detail.mark-open', { beforeTrigger: () => addHistory('subject', s.id) })} />
                  </div>
                </div>
              );
            })
          )}
          {items.length > 0 && <TheEnd />}
        </div>
        )}
      </div>
    </div>
  );
}
