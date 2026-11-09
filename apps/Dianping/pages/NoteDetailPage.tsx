import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcShare, IcHeart, IcStar, IcStarOutline, IcComment } from '../res/icons';
import { Stars } from '../components/Stars';
import { DpAvatar } from '../components/DpAvatar';
import { noteCoverUrl, shopCoverUrl } from '../assets';
import { sharePlainText } from '@/os/shareBridge';

const HASHTAGS = ['#南京美食', '#探店', '#必吃榜', '#宝藏小店'];
const CHIPS = ['有无生日优惠？', '有推荐菜吗？', '适合聚餐吗？', '有无烟区吗？'];

export default function NoteDetailPage() {
  const { noteId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const note = useDianpingStore((st) => st.notes.find((n) => n.id === noteId));
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === note?.shopId));
  const showToast = useDianpingStore((st) => st.showToast);
  const [liked, setLiked] = useState(false);
  const [faved, setFaved] = useState(false);

  if (!note) {
    return (
      <div className="p-4 pt-10">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  const likeCount = note.likes + (liked ? 1 : 0) + 74;

  return (
    <div className="relative flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex h-11 items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
            <IcBack size={22} />
          </button>
          <div className="flex items-center gap-2">
            <DpAvatar seed={note.author} size={32} className="rounded-full" />
            <span className="text-[14px] font-medium text-[#222]">{note.author}</span>
          </div>
        </div>
        <button
          type="button"
          className="border-none bg-transparent p-1.5 text-[#333] cursor-pointer"
          {...action('note.share.open', () => {
            const text = `【大众点评】${note.title} ${note.body || s.noteBodyFallback} https://dianping.mock/note/${note.id}`;
            const launched = sharePlainText(text, {
              onResult: (result) => {
                if (result.resultCode === 'OK') showToast('分享成功');
              },
            });
            if (!launched) showToast(s.notOpen);
          })}
        >
          <IcShare size={19} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-[56px]" data-scroll-container="note" data-scroll-direction="vertical">
        {/* 大图 */}
        <div className="h-[300px] w-full overflow-hidden" style={{ background: note.coverColor }}>
          {noteCoverUrl(note.id) ? (
            <img src={noteCoverUrl(note.id)} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>

        {/* 正文 */}
        <div className="px-4 py-3">
          <div className="text-[18px] font-bold leading-snug text-[#222]">{note.title}</div>
          <div className="mt-2.5 space-y-2.5 text-[14px] leading-6 text-[#333]">
            <p>{note.body || s.noteBodyFallback}</p>
            <p>真的是和朋友吃了无数次的藏在巷子里的宝藏小店，现炒的锅气很足～</p>
            <p>尤其是招牌菜，煎得香香脆脆，配茶清爽解腻，都吃到扶墙出～强烈推荐周末提早来。</p>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {HASHTAGS.map((t) => (
              <span key={t} className="text-[13px] text-[#3A6EA5]">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 关联店铺卡(直接显示店铺卡) */}
        {shop ? (
          <button
            type="button"
            className="mx-4 flex w-[calc(100%-32px)] items-center gap-2.5 rounded-[10px] border-none bg-[#F7F7F7] p-2.5 text-left cursor-pointer"
            {...bindTap('note.shop-open', { params: { shopId: shop.id } })}
          >
            <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: shop.coverColor }}>
              {shopCoverUrl(shop.id) ? <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded-[3px] bg-[#FF6633] px-1 py-[1px] text-[9px] font-bold text-white">必吃榜</span>
                <span className="truncate text-[14px] font-bold text-[#222]">{shop.name}</span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Stars score={shop.score} size={10} />
                <span className="text-[11px] text-[#999]">{shop.reviewCount}条 · {shop.category}</span>
              </div>
              {shop.deals[0] ? (
                <div className="mt-1 inline-flex items-center gap-1 rounded-[4px] bg-[#FFF1EA] px-1.5 py-0.5 text-[11px] text-[#FF6633]">
                  优惠 · {shop.deals[0].title} ¥{shop.deals[0].price}
                </div>
              ) : null}
            </div>
            <span className="shrink-0 text-[11px] text-[#999]">{(shop.distanceM / 1000).toFixed(1)}km ›</span>
          </button>
        ) : null}

        {/* 实探后评价 */}
        <div className="mt-3 px-4">
          <div className="text-[15px] font-bold text-[#222]">实探后评价 · 1</div>
          <div className="mt-2 flex gap-2">
            <DpAvatar seed="momo" size={28} className="shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="text-[12px] text-[#999]">momo</div>
              <div className="mt-0.5 text-[13px] leading-5 text-[#333]">推荐菜确实好吃，锅气很足很入味～</div>
              <div className="mt-1 text-[11px] text-[#BBB]">3月27日 · 江苏</div>
            </div>
          </div>
        </div>

        {/* 评论 */}
        <div className="mt-3 border-t-[8px] border-[#F5F5F5] px-4 pt-3">
          <div className="text-[15px] font-bold text-[#222]">评论 · 2</div>
          {[
            { u: 'nb2', t: '停车方便吗？', d: '06-10 江苏' },
            { u: '俊睿真心的小伍', t: '有优惠吗？', d: '06-24 安徽' },
          ].map((c, i) => (
            <div key={i} className="mt-3 flex gap-2">
              <DpAvatar seed={c.u} size={28} className="shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] text-[#999]">{c.u}</div>
                <div className="mt-0.5 text-[13px] text-[#333]">{c.t}</div>
                <div className="mt-1 text-[11px] text-[#BBB]">{c.d} · 回复</div>
              </div>
            </div>
          ))}
        </div>

        {/* 写评有奖 chips */}
        <div className="mt-3 flex flex-wrap gap-2 px-4 pb-3">
          {CHIPS.map((c) => (
            <button
              key={c}
              type="button"
              className="rounded-full border border-[#EEE] bg-white px-2.5 py-1 text-[12px] text-[#666] cursor-pointer"
              {...action('note.comment.open.disabled', () => showToast(s.notOpen))}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="absolute inset-x-0 bottom-0 flex h-[56px] items-center gap-2 border-t border-[#EEE] bg-white px-3">
        <button
          type="button"
          className="flex h-9 flex-1 items-center rounded-full border-none bg-[#F5F5F5] px-3 text-left text-[13px] text-[#999] cursor-pointer"
          {...action('note.comment.open.disabled', () => showToast(s.notOpen))}
        >
          真实发声，言之有物
        </button>
        <button
          type="button"
          className="flex flex-col items-center border-none bg-transparent text-[11px] text-[#666] cursor-pointer"
          {...action('note.like.toggle', () => setLiked((v) => !v))}
        >
          <IcHeart size={20} className={liked ? 'text-[#FF4B33]' : 'text-[#999]'} />
          {likeCount}
        </button>
        <button
          type="button"
          className="flex flex-col items-center border-none bg-transparent text-[11px] text-[#666] cursor-pointer"
          {...action('note.fav.toggle', () => setFaved((v) => !v))}
        >
          {faved ? <IcStar size={20} className="text-[#FFB000]" /> : <IcStarOutline size={20} />}
          {42 + (faved ? 1 : 0)}
        </button>
        <button
          type="button"
          className="flex flex-col items-center border-none bg-transparent text-[11px] text-[#666] cursor-pointer"
          {...action('note.comment.open.disabled', () => showToast(s.notOpen))}
        >
          <IcComment size={20} className="text-[#999]" />2
        </button>
      </div>
    </div>
  );
}
