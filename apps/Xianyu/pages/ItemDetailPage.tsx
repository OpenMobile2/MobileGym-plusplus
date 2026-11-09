import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useXianyuStrings } from '../hooks/useXianyuStrings';
import { ItemImage, Avatar } from '../components/ItemImage';
import { ItemCard } from '../components/ItemCard';
import { BottomSheet, usePanel, useToast, Price } from '../components/ui';
import { IcNavBack, IcShare, IcComment, IcHeart, IcShield } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';

export default function ItemDetailPage() {
  const { itemId = '' } = useParams();
  const { bindTap, bindBack } = useXianyuGestures();
  const s = useXianyuStrings();
  const [toast, showToast] = useToast();
  const panel = usePanel('panel');

  const item = useXianyuStore((s) => s.items.find((i) => i.id === itemId));
  const sellers = useXianyuStore((s) => s.sellers);
  const favorites = useXianyuStore((s) => s.favorites);
  const followedSellers = useXianyuStore((s) => s.followedSellers);
  const commentsMap = useXianyuStore((s) => s.comments);
  const items = useXianyuStore((s) => s.items);
  const toggleFavorite = useXianyuStore((s) => s.toggleFavorite);
  const toggleFollowSeller = useXianyuStore((s) => s.toggleFollowSeller);
  const addComment = useXianyuStore((s) => s.addComment);
  const toggleCommentLike = useXianyuStore((s) => s.toggleCommentLike);
  const recordFootprint = useXianyuStore((s) => s.recordFootprint);

  const [draft, setDraft] = useState('');

  useEffect(() => { if (itemId) recordFootprint(itemId); }, [itemId, recordFootprint]);

  if (!item) {
    return (
      <div className="flex flex-col h-full bg-white">
        <div className="h-11 flex items-center px-2 shrink-0"><button {...bindBack()} className="bg-transparent border-none"><IcNavBack size={26} /></button></div>
        <div className="flex-1 flex items-center justify-center text-[#999]">商品不存在或已下架</div>
      </div>
    );
  }

  const seller = sellers.find((s) => s.id === item.sellerId);
  const faved = favorites.includes(item.id);
  const followed = seller ? followedSellers.includes(seller.id) : false;
  const comments = commentsMap[item.id] ?? [];
  const recommend = items.filter((i) => i.id !== item.id && i.sellerId !== 'me').slice(0, 6);

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="dark">
      {/* 悬浮返回/分享 */}
      <div className="h-11 flex items-center justify-between px-2 shrink-0 bg-app-surface">
        <button {...bindBack()} aria-label="返回" className="bg-transparent border-none cursor-pointer"><IcNavBack size={26} className="text-app-text" /></button>
        <button {...bindTap({ kind: 'action', id: 'detail.share.open' }, { onTrigger: () => panel.open('share') })} aria-label="分享" className="bg-transparent border-none cursor-pointer">
          <IcShare size={20} className="text-app-text" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="ItemDetailPage-main" data-scroll-direction="vertical">
        {/* 价格与标题(首屏商品信息) */}
        <div className="bg-app-surface px-3 py-2">
          <div className="flex items-baseline gap-2">
            <Price value={item.price} size={26} />
            {item.originalPrice && <span className="text-app-text-muted text-[12px] line-through">¥{item.originalPrice}</span>}
            <span className="ml-auto text-[12px] text-app-text-muted">{item.wantCount}{s.wantCount} · {item.viewCount}浏览</span>
          </div>
          <div className="mt-1 flex gap-1 flex-wrap">
            {item.freeShipping && <span className="text-[10px] text-(--app-c-market-orange) bg-(--app-c-tag-bg) px-1.5 py-0.5 rounded">{s.freeShipping}</span>}
            {item.inspected && <span className="text-[10px] text-white bg-(--app-c-success) px-1.5 py-0.5 rounded inline-flex items-center gap-0.5"><IcShield size={10} />{s.guarantee}</span>}
          </div>
          <div className="mt-2 text-[15px] text-app-text leading-relaxed">{item.title}</div>
          <div className="mt-1 text-[13px] text-app-text-muted leading-relaxed">{item.desc}</div>
        </div>

        {/* 主图 */}
        <div className="w-full aspect-square bg-app-surface mt-2">
          <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-full h-full" />
        </div>

        {/* 参数 */}
        <div className="bg-app-surface mt-2 px-3 py-2 text-[13px]">
          <div className="text-[14px] font-semibold text-app-text mb-1">宝贝参数</div>
          {[['成色', item.condition], ['品牌', item.brand], ['型号', item.model], ['所在地', item.location]].filter(([, v]) => v).map(([k, v]) => (
            <div key={k} className="flex py-0.5"><span className="w-16 text-app-text-muted">{k}</span><span className="text-app-text">{v}</span></div>
          ))}
        </div>

        {/* 验货宝须知(Q11:买家侧仅展示) */}
        {item.inspected && (
          <div className="bg-app-surface mt-2 px-3 py-2 flex items-center gap-2 text-[12px] text-(--app-c-success)">
            <IcShield size={16} /> 该商品支持验货宝,平台质检后再发货,买家无需操作
          </div>
        )}

        {/* 卖家 */}
        {seller && (
          <div className="bg-app-surface mt-2 px-3 py-3 flex items-center gap-2">
            <Avatar seed={seller.id} name={seller.name} size={40} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-app-text font-medium truncate">{seller.name}</div>
              <div className="text-[11px] text-app-text-muted">{seller.isShop ? `鱼小铺 Lv.${seller.shopLevel}` : '个人闲置'} · 好评{seller.goodRate}%</div>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'detail.followSeller.toggle' }, { onTrigger: () => toggleFollowSeller(seller.id) })}
              className={`text-[12px] px-3 py-1 rounded-full border cursor-pointer ${followed ? 'bg-app-bg text-app-text-muted border-(--app-border)' : 'bg-app-surface text-(--app-c-market-orange) border-(--app-c-market-orange)'}`}
            >
              {followed ? '已关注' : '+关注'}
            </button>
          </div>
        )}

        {/* 逛了又逛 */}
        <div className="mt-2 px-2 pb-2">
          <div className="text-center text-[13px] text-app-text-muted py-2">— 逛了又逛 —</div>
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">{recommend.filter((_, i) => i % 2 === 0).map((it) => <ItemCard key={it.id} item={it} />)}</div>
            <div className="flex-1 min-w-0">{recommend.filter((_, i) => i % 2 === 1).map((it) => <ItemCard key={it.id} item={it} />)}</div>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="shrink-0 bg-app-surface border-t border-(--app-border) flex items-center px-2 py-2 gap-2" data-hide-on-keyboard>
        <button {...bindTap({ kind: 'action', id: 'detail.comments.open' }, { onTrigger: () => panel.open('comments') })} className="flex flex-col items-center bg-transparent border-none cursor-pointer px-1 text-app-text-muted">
          <IcComment size={20} /><span className="text-[10px]">{s.btnComment}</span>
        </button>
        <button {...bindTap({ kind: 'action', id: 'detail.favorite.toggle' }, { onTrigger: () => toggleFavorite(item.id) })} className="flex flex-col items-center bg-transparent border-none cursor-pointer px-1">
          <IcHeart size={20} className={faved ? 'text-(--app-c-price-red)' : 'text-app-text-muted'} fill={faved ? 'var(--app-c-price-red)' : 'none'} />
          <span className={`text-[10px] ${faved ? 'text-(--app-c-price-red)' : 'text-app-text-muted'}`}>{faved ? '已收藏' : s.btnFavorite}</span>
        </button>
        <button
          {...bindTap('detail.buy-open', { params: { itemId: item.id } })}
          className="flex-1 h-10 rounded-full text-white font-semibold text-[15px] border-none cursor-pointer"
          style={{ background: 'var(--app-c-buy-gradient)' }}
        >{s.btnBuy}</button>
        <button
          {...bindTap('detail.chat-open', { params: { chatId: `ch_${item.sellerId}`, itemId: item.id } })}
          className="flex-1 h-10 rounded-full font-semibold text-[15px] border border-app-primary cursor-pointer"
          style={{ background: 'var(--app-c-chat-btn-bg)', color: 'var(--app-c-chat-btn-text)' }}
        >{s.btnChat}</button>
      </div>

      {/* 留言弹层 */}
      {panel.value === 'comments' && (
        <BottomSheet title="留言" onClose={panel.close} closeBinding={bindBack()}>
          <div className="px-3 py-2">
            {comments.length === 0 && <div className="text-center text-[#999] text-[13px] py-6">还没有留言,来问问卖家吧</div>}
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 py-2 border-b border-[#F4F4F4]">
                <Avatar seed={c.id} name={c.user} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#999]">{c.user}</div>
                  <div className="text-[14px] text-[#1A1A1A]">{c.content}</div>
                </div>
                <button {...bindTap({ kind: 'action', id: 'detail.comment.like' }, { params: { commentId: c.id }, onTrigger: () => toggleCommentLike(item.id, c.id) })} className="flex flex-col items-center bg-transparent border-none cursor-pointer text-[11px]">
                  <IcHeart size={16} className={c.liked ? 'text-[#FF3B30]' : 'text-[#999]'} fill={c.liked ? '#FF3B30' : 'none'} />
                  <span className="text-[#999]">{c.likes}</span>
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-[#EEE]" data-keep-keyboard="true">
            <input
              {...bindTap({ kind: 'action', id: 'detail.comment.input' }, { onTrigger: () => {} })}
              value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder="我有话要说…" className="flex-1 h-9 rounded-full bg-[#F4F4F4] px-3 text-[13px] border-none outline-none"
            />
            <button
              {...bindTap({ kind: 'action', id: 'detail.comment.send' }, { onTrigger: () => { if (draft.trim()) { addComment(item.id, draft); setDraft(''); showToast('已发布'); } } })}
              className="text-[14px] text-[#111] font-semibold bg-[#FFE411] px-4 h-9 rounded-full border-none cursor-pointer"
            >发送</button>
          </div>
        </BottomSheet>
      )}

      {/* 分享面板 */}
      {panel.value === 'share' && (
        <BottomSheet title="分享" onClose={panel.close} closeBinding={bindBack()}>
          <div className="grid grid-cols-4 gap-3 px-4 py-4">
            {['微信', '朋友圈', '复制链接', '找相似', '举报', '不感兴趣'].map((a) => (
              <button
                key={a}
                onClick={() => {
                  if (a === '微信' || a === '朋友圈') {
                    const text = `${item?.title ?? '闲鱼宝贝'} ¥${item?.price ?? ''} https://xianyu.mock/item/${item?.id ?? ''}`;
                    const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } });
                    if (!launched) showToast('分享未就绪');
                    return;
                  }
                  showToast(a === '复制链接' ? '已复制' : `「${a}」暂未开放`);
                }}
                className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <span className="w-11 h-11 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[16px]">🔗</span>
                <span className="text-[11px] text-[#666]">{a}</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}
