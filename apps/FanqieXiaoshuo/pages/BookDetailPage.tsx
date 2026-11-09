import React, { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { saveImageToAlbum } from '@/os/albumBridge';
import * as TimeService from '@/os/TimeService';
import type { ActivityResult } from '@/os/types/manifest';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast, useToast, BookCover, Stars, fmtTime, Avatar } from '../components/ui';
import { PHYSICAL_BOOK_PRICE } from '../constants';
import { IcBack, IcListen, IcArrowRight } from '../res/icons';
import type { FanqieReview } from '../types';

export default function BookDetailPage() {
  const { id = '' } = useParams();
  const [searchParams] = useSearchParams();
  const { bindTap, bindBack, go } = useFanqieGestures();
  const s = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [toastNode, showToast] = useToast();

  // 整页左滑开始阅读(Q6/gate4#1:左滑与点击等效)。Pointer 合同。
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const book = useFanqieStore((st) => st.books.find((b) => b.id === id));
  const authors = useFanqieStore((st) => st.authors);
  const users = useFanqieStore((st) => st.users);
  const reviews = useFanqieStore((st) => st.reviews);
  const followed = useFanqieStore((st) => st.followedAuthors);
  const progress = useFanqieStore((st) => st.progress[id]);
  const purchased = useFanqieStore((st) => st.purchasedBooks.includes(id));
  const toggleFollow = useFanqieStore((st) => st.toggleFollowAuthor);
  const markBookPurchased = useFanqieStore((st) => st.markBookPurchased);

  const introOpen = searchParams.get('intro') === 'open';
  const coverOpen = searchParams.get('cover') === 'open';

  // 跨 App 收银台回执:支付宝走 setResult(startActivityForResult 回调),
  // 微信收银台不 setResult,按 source 广播 `fanqiexiaoshuo.PAY_RESULT`,两条路都要收。
  const payingBookIdRef = useRef<string | null>(null);
  useEffect(() => {
    const un = window.__OS__?.broadcast?.registerReceiver?.('fanqiexiaoshuo.PAY_RESULT', (intent) => {
      const bookId = payingBookIdRef.current;
      if (!bookId || intent?.data?.resultCode !== 'OK') return;
      payingBookIdRef.current = null;
      markBookPurchased(bookId);
      showToast(s.paySuccess);
    });
    return () => un?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!book) return null;

  const author = authors.find((a) => a.id === book.authorId);
  const isFollowed = author ? followed.includes(author.id) : false;
  const bookReviews = reviews.filter((r) => r.bookId === id).slice(0, 3);
  const isPublish = book.gender === 'publish';

  const nameOf = (r: FanqieReview) => users.find((u) => u.id === r.userId)?.name ?? s.bookFriend;
  const avatarOf = (r: FanqieReview) => users.find((u) => u.id === r.userId)?.avatar ?? '';

  /** 实体书购买:走系统收银台(ACTION_PAY),优先微信、回落支付宝;OK 才记账 */
  const payPhysicalBook = () => {
    if (purchased) { showToast(s.purchased); return; }
    const intentData = {
      amount: PHYSICAL_BOOK_PRICE,
      orderId: `fanqie-${book.id}-${TimeService.now()}`,
      merchantName: '番茄免费小说',
      subject: s.physicalBook.replace('{title}', book.title),
      source: 'fanqiexiaoshuo',
    };
    const onResult = (result: ActivityResult) => {
      if (result.resultCode !== 'OK') return;
      payingBookIdRef.current = null;
      markBookPurchased(book.id);
      showToast(s.paySuccess);
    };
    payingBookIdRef.current = book.id;
    const launched = window.__OS__?.startActivityForResult?.(
      'wechat', { action: 'ACTION_PAY', scheme: 'weixin', data: intentData }, onResult,
    ) || window.__OS__?.startActivityForResult?.(
      'alipay', { action: 'ACTION_PAY', scheme: 'alipays', data: intentData }, onResult,
    );
    if (!launched) { payingBookIdRef.current = null; showNotOpen(); } // 机上没有可收款的支付 App
  };

  /** 封面大图保存:写系统相册(albumBridge → MediaService + ContentResolver) */
  const saveCover = () => {
    void (async () => {
      const saved = await saveImageToAlbum(book.cover, {
        album: 'Saved',
        fileName: `fanqie_${book.id}_${TimeService.now()}.jpg`,
        mimeType: 'image/jpeg',
      });
      showToast(saved ? s.savedToAlbum : s.saveFailed);
    })();
  };

  const onPagePointerDown = (e: React.PointerEvent) => { swipeRef.current = { x: e.clientX, y: e.clientY }; };
  const onPagePointerUp = (e: React.PointerEvent) => {
    const st = swipeRef.current;
    swipeRef.current = null;
    if (!st || introOpen || coverOpen) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    // 明显左滑 → 开始阅读(与底部按钮 bookdetail.reader-open 等效)
    if (dx < -60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go('bookdetail.reader-open', { id, ch: String(progress ?? 0) });
    }
  };

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ background: 'linear-gradient(180deg, var(--app-c-bg-paper-top), var(--app-c-bg-page))' }}
      onPointerDown={onPagePointerDown}
      onPointerUp={onPagePointerUp}
    >
      {/* 顶栏:仅返回 + 右上听书胶囊(沉浸式,透明底) */}
      <div className="flex items-center h-11 px-1 shrink-0">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        {isPublish && (
          <div className="flex-1 flex justify-center gap-6">
            <button {...bindTap({ kind: 'action', id: 'bookdetail.tab.disabled' }, { onTrigger: showNotOpen })} className="text-[14px] text-(--app-c-text-secondary) bg-transparent border-none cursor-pointer">{s.adaptedDrama}</button>
            <span className="text-[14px] font-semibold text-(--app-c-text-primary)">{s.original}</span>
            <button {...bindTap({ kind: 'action', id: 'bookdetail.tab.disabled' }, { onTrigger: showNotOpen })} className="text-[14px] text-(--app-c-text-secondary) bg-transparent border-none cursor-pointer">{s.listenBook}</button>
          </div>
        )}
        <div className={isPublish ? 'w-10' : 'flex-1'} />
        <button
          {...bindTap({ kind: 'action', id: 'bookdetail.tab.disabled' }, { onTrigger: showNotOpen })}
          className="shrink-0 mr-2 flex items-center gap-1 h-7 px-2.5 rounded-full bg-black/5 border-none cursor-pointer"
        >
          <IcListen size={14} className="text-(--app-c-text-regular)" />
          <span className="text-[12px] text-(--app-c-text-regular)">{s.listenBook}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="book-detail" data-scroll-direction="vertical">
        {/* 封面 + 书名 + 作者 */}
        <div className="flex flex-col items-center px-4 pt-2">
          <button {...bindTap('bookdetail.cover-open', { params: { id } })} className="bg-transparent border-none cursor-pointer p-0">
            <BookCover book={book} className="w-[104px] h-[140px] shadow-md" />
          </button>
          <div className="text-[20px] font-bold text-(--app-c-text-primary) mt-3 text-center px-4">{book.title}</div>
          <div className="flex items-center gap-2 mt-1.5">
            <button
              {...bindTap('bookdetail.author-open', { params: { id: book.authorId } })}
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="text-[13px] text-(--app-c-tag-warm-text)">{author?.name ?? s.anonymousAuthor}</span>
              {author?.badge && <span className="text-[10px] text-[#B7770D] bg-[#FFF3E0] rounded px-1">{author.badge}</span>}
              <IcArrowRight size={12} className="text-(--app-c-text-quaternary)" />
            </button>
            {author && (
              <button
                {...bindTap({ kind: 'action', id: 'bookdetail.follow.toggle' }, { onTrigger: () => toggleFollow(author.id) })}
                className={`text-[11px] rounded-full px-2 py-0.5 border cursor-pointer ${isFollowed ? 'text-(--app-c-text-quaternary) border-(--app-c-text-disabled) bg-transparent' : 'text-(--app-c-brand) border-(--app-c-brand) bg-transparent'}`}
              >
                {isFollowed ? s.followed : s.follow}
              </button>
            )}
          </div>
        </div>

        {/* 数据行 */}
        <div className="flex items-center justify-around mx-6 mt-4 py-2">
          <div className="text-center">
            <div className="text-[15px] font-bold text-(--app-c-text-primary)">{book.badge || s.tabHome}</div>
            <div className="text-[11px] text-(--app-c-text-tertiary) mt-0.5">{s.hotDegreeWan.replace('{n}', String(book.hotWan))}</div>
          </div>
          <div className="w-px h-6 bg-(--app-c-border)" />
          <div className="text-center">
            <div className="text-[15px] font-bold text-(--app-c-text-primary)">{s.wanUnit.replace('{n}', String(book.readersWan))}</div>
            <div className="text-[11px] text-(--app-c-text-tertiary) mt-0.5">{s.nowReading}</div>
          </div>
          <div className="w-px h-6 bg-(--app-c-border)" />
          <div className="text-center">
            <div className="text-[15px] font-bold text-(--app-c-text-primary)">{s.wordsWan.replace('{n}', String(book.words))}</div>
            <div className="text-[11px] text-(--app-c-text-tertiary) mt-0.5">{book.status}</div>
          </div>
        </div>

        {/* 实体书购买(仅出版书):走系统收银台 ACTION_PAY */}
        {isPublish && (
          <button
            {...bindTap({ kind: 'action', id: 'bookdetail.buy.submit' }, { onTrigger: payPhysicalBook })}
            className="mx-4 mt-1 w-[calc(100%-32px)] flex items-center bg-(--app-c-bg-card)/70 rounded-lg px-3 py-2 border-none cursor-pointer"
          >
            <span className="text-[13px] text-(--app-c-text-primary)">{s.physicalBook.replace('{title}', book.title)}</span>
            <span className="flex-1" />
            <span className="text-[13px] text-white bg-(--app-c-brand) rounded-full px-3 py-1">{purchased ? s.purchased : s.buyPrice.replace('{n}', String(PHYSICAL_BOOK_PRICE))}</span>
          </button>
        )}

        {/* 简介(更多 → 弹层) */}
        <button
          {...bindTap('bookdetail.intro-open', { params: { id } })}
          className="mx-4 mt-3 w-[calc(100%-32px)] text-left bg-(--app-c-bg-card)/60 rounded-xl px-3 py-3 border-none cursor-pointer"
        >
          <div className="flex items-center">
            <span className="text-[15px] font-bold text-(--app-c-text-primary)">{s.intro}</span>
            <div className="flex-1 flex flex-wrap gap-1 ml-3">
              {book.tags.slice(0, 3).map((t) => (
                <span key={t} className="text-[10px] text-(--app-c-tag-warm-text) bg-(--app-c-tag-warm-bg) rounded px-1.5 py-px">{t}</span>
              ))}
            </div>
          </div>
          <div className="text-[13px] text-(--app-c-text-regular) leading-5 mt-2 line-clamp-2">
            {book.intro}<span className="text-(--app-c-brand) ml-1">{s.introMore}</span>
          </div>
        </button>

        {/* 书评区 */}
        <div className="mx-4 mt-3 bg-(--app-c-bg-card) rounded-xl px-4 py-3.5">
          <button
            {...bindTap('bookdetail.reviews-open', { params: { id } })}
            className="w-full flex items-center bg-transparent border-none cursor-pointer p-0"
          >
            <span className="text-[15px] font-bold text-(--app-c-text-primary)">{s.reviews}</span>
            <span className="text-[14px] font-bold text-(--app-c-brand) ml-2">{s.ratingScore.replace('{n}', String(book.rating))}</span>
            <span className="flex-1" />
            <span className="text-[12px] text-(--app-c-text-tertiary)">{s.moreReviews}</span>
            <IcArrowRight size={13} className="text-(--app-c-text-quaternary)" />
          </button>
          {bookReviews.map((r, i) => (
            <div key={r.id} className={`pt-3 ${i > 0 ? 'border-t border-(--app-c-divider) mt-3' : 'mt-2'}`}>
              <div className="flex items-center gap-2">
                <Avatar src={avatarOf(r)} className="w-6 h-6 shrink-0" />
                <span className="text-[12px] text-(--app-c-text-regular) truncate flex-1">{r.mine ? s.me : nameOf(r)}</span>
                <span className="text-[10px] text-(--app-c-text-disabled)">{fmtTime(r.timestamp)}</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Stars value={r.stars} size={11} />
                <span className="text-[11px] text-(--app-c-text-disabled)">{r.readNote}</span>
              </div>
              <div className="text-[13px] text-(--app-c-text-primary) leading-5 mt-1 line-clamp-3">{r.text}</div>
            </div>
          ))}
        </div>
        <div className="h-24" />
      </div>

      {/* 底部:左滑/点击开始阅读(Q6) */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
        <button
          {...bindTap('bookdetail.reader-open', { params: { id, ch: String(progress ?? 0) } })}
          className="pointer-events-auto w-64 h-12 rounded-full bg-(--app-c-brand) text-white text-[15px] font-semibold border-none cursor-pointer shadow-[0_4px_12px_rgba(250,110,61,0.4)]"
        >
          {progress !== undefined ? s.continueReading : s.startReading}
        </button>
      </div>

      {/* 简介半屏弹层 */}
      {introOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" {...bindBack()} />
          <div className="relative bg-(--app-c-bg-card) rounded-t-2xl max-h-[70%] flex flex-col z-10">
            <div className="flex items-center px-4 h-12 shrink-0">
              <button {...bindBack()} className="bg-transparent border-none cursor-pointer p-0" aria-label={s.collapse}>
                <IcArrowRight size={20} className="text-(--app-c-text-secondary) rotate-90" />
              </button>
              <span className="flex-1 text-center text-[16px] font-semibold text-(--app-c-text-primary) mr-6">{s.bookIntro}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4 text-[14px] text-(--app-c-text-regular) leading-6">{book.intro}</div>
            <div className="shrink-0 p-3">
              <button
                {...bindTap('bookdetail.introread-open', { params: { id, ch: String(progress ?? 0) } })}
                className="w-full h-11 rounded-full bg-(--app-c-btn-secondary) text-white text-[15px] font-semibold border-none cursor-pointer"
              >
                {s.readContent}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 封面全屏大图 */}
      {coverOpen && (
        <div className="absolute inset-0 z-40 bg-black flex flex-col" {...bindBack()}>
          <div className="flex-1 flex items-center justify-center">
            <BookCover book={book} className="w-[210px] h-[280px] rounded-lg" />
          </div>
          <div className="flex items-center justify-between px-6 pb-8 text-white text-[14px]">
            <span>1/1</span>
            <button
              {...bindTap({ kind: 'action', id: 'bookdetail.cover.save' }, { onTrigger: saveCover })}
              className="text-white bg-transparent border-none cursor-pointer"
            >
              {s.save}
            </button>
          </div>
        </div>
      )}

      {notOpenNode}
      {toastNode}
    </div>
  );
}
