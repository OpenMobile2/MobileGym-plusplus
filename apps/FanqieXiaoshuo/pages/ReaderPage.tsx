import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import {
  ConfirmDialog, Stars, useFanqieStrings, useToast, BookCover,
} from '../components/ui';
import {
  COIN_CYCLE_REWARD, COIN_CYCLE_SECONDS, FONT_SIZE_MAX, FONT_SIZE_MIN, READER_THEMES, STAR_LABELS,
} from '../constants';
import {
  chapterParagraphs, chapterTitle, chapterWordCount, paginate,
} from '../utils/content';
import {
  IcBack, IcCatalog, IcDown, IcDownload, IcMore, IcNight, IcSettings, IcShare, IcStar, IcSun,
} from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';
import ClipboardService from '@/os/ClipboardService';

/** 阅读挽留弹窗的时长阈值(秒)——Q3:未加书架 + 达时长才弹 */
const EXIT_PROMPT_SECONDS = 0;

export default function ReaderPage() {
  const { id = '' } = useParams();
  const [sp, setSp] = useSearchParams();
  const s = useFanqieStrings();
  const { bindTap, bindBack, go, back } = useFanqieGestures();
  const [toastNode, showToast] = useToast();

  const book = useFanqieStore((st) => st.books.find((b) => b.id === id));
  const paraBank = useFanqieStore((st) => st.paraBank);
  const titleBank = useFanqieStore((st) => st.chapterTitleBank);
  const settings = useFanqieStore((st) => st.readerSettings);
  const inShelf = useFanqieStore((st) => st.shelf.some((e) => e.bookId === id));
  // ⚠️ 不能在 selector 里 .filter(返回新数组→无限重渲染);订阅原数组+useMemo 派生(AGENTS 状态规则/§5.2)
  const allReviews = useFanqieStore((st) => st.reviews);
  const reviews = useMemo(() => allReviews.filter((r) => r.bookId === id), [allReviews, id]);
  const authors = useFanqieStore((st) => st.authors);
  const saveProgress = useFanqieStore((st) => st.saveProgress);
  const recordHistory = useFanqieStore((st) => st.recordHistory);
  const addToShelf = useFanqieStore((st) => st.addToShelf);
  const setFontSize = useFanqieStore((st) => st.setFontSize);
  const setTheme = useFanqieStore((st) => st.setTheme);
  const setNightMode = useFanqieStore((st) => st.setNightMode);
  const setPageMode = useFanqieStore((st) => st.setPageMode);
  const creditReadingCoins = useFanqieStore((st) => st.creditReadingCoins);
  const addReadMinutes = useFanqieStore((st) => st.addReadMinutes);
  const recordTaskAudit = useFanqieStore((st) => st.recordTaskAudit);

  const ch = Math.max(0, Math.min((book?.chapters ?? 1) - 1, parseInt(sp.get('ch') ?? '0', 10) || 0));
  const menuOpen = sp.get('menu') === 'open';
  const panel = sp.get('panel'); // catalog | settings | rate
  const ctab = sp.get('ctab') ?? 'catalog';
  const dialog = sp.get('dialog'); // night | exit | rateconfirm
  const overlayActive = menuOpen || !!panel || !!dialog;

  const theme = READER_THEMES[settings.themeIdx] ?? READER_THEMES[1];
  const px = Math.round(settings.fontSize * 0.78);

  const [pageIdx, setPageIdx] = useState(0);
  // 金币周期倒计时(阅读奖励;归零自动入账 Q8)
  const [coinLeft, setCoinLeft] = useState(COIN_CYCLE_SECONDS);
  const readSecondsRef = useRef(0);

  const paragraphs = useMemo(
    () => (book ? chapterParagraphs({ paraBank }, book, ch) : []),
    [book, paraBank, ch],
  );
  const pages = useMemo(
    () => paginate(paragraphs, settings.fontSize, true),
    [paragraphs, settings.fontSize],
  );
  const curTitle = book ? chapterTitle({ chapterTitleBank: titleBank }, book, ch) : '';
  const totalPagesDisplay = book ? Math.max(1, book.chapters * pages.length) : 1;
  const pageDisplay = ch * pages.length + pageIdx + 1;

  // 进度/历史记录
  useEffect(() => {
    if (!book) return;
    saveProgress(book.id, ch);
    recordHistory(book.id, ch);
    recordTaskAudit({ readerView: { bookId: book.id, chapterIdx: ch } });
    setPageIdx(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.id, ch]);

  // 金币计时 + 阅读时长(每秒 tick;真实计时用途,非模拟时钟)
  useEffect(() => {
    const t = setInterval(() => {
      readSecondsRef.current += 1;
      setCoinLeft((left) => {
        if (left <= 1) {
          creditReadingCoins(COIN_CYCLE_REWARD);
          return COIN_CYCLE_SECONDS;
        }
        return left - 1;
      });
    }, 1000);
    return () => {
      clearInterval(t);
      const mins = Math.floor(readSecondsRef.current / 60);
      if (mins > 0) addReadMinutes(mins);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setSpReplace = (mutate: (p: URLSearchParams) => void) => {
    setSp((p) => { mutate(p); return p; }, { replace: true });
  };

  const gotoChapter = (idx: number) => {
    if (!book) return;
    const clamped = Math.max(0, Math.min(book.chapters - 1, idx));
    setSpReplace((p) => { p.set('ch', String(clamped)); });
    setPageIdx(0);
  };

  const turnPage = (dir: 1 | -1) => {
    if (!book || overlayActive) return;
    const next = pageIdx + dir;
    if (next < 0) {
      if (ch > 0) gotoChapter(ch - 1);
      return;
    }
    if (next >= pages.length) {
      if (ch < book.chapters - 1) gotoChapter(ch + 1);
      return;
    }
    setPageIdx(next);
    if (dir === 1) addReadMinutes(1);
  };

  /** 返回:未加书架 + 达阅读时长 → 挽留弹窗(Q3);否则直接退出 */
  const exitReader = () => {
    if (!inShelf && readSecondsRef.current >= EXIT_PROMPT_SECONDS) {
      setSp((p) => { p.delete('menu'); p.set('dialog', 'exit'); return p; });
    } else {
      back();
    }
  };
  const closeThenExit = () => {
    back(); // 关 dialog
    setTimeout(() => back(), 40); // 退出阅读器
  };

  // 进度条拖动(Q7:实时跳页,无浮层;Pointer 事件合同)
  const sliderRef = useRef<HTMLDivElement>(null);
  const seekTo = (clientX: number) => {
    const el = sliderRef.current;
    if (!el || !book) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const target = Math.round(ratio * (pages.length - 1));
    setPageIdx(target);
  };
  const draggingRef = useRef(false);

  // 覆盖模式:左右滑翻页(#3);滚动模式:顶部下拉回上一章(#6)。Pointer 合同。
  const swipeRef = useRef<{ x: number; y: number; scrollTop: number } | null>(null);
  const swipedRef = useRef(false);
  const onContentPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    swipedRef.current = false;
    swipeRef.current = { x: e.clientX, y: e.clientY, scrollTop: e.currentTarget.scrollTop };
  };
  const onContentPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = swipeRef.current;
    swipeRef.current = null;
    if (!st || overlayActive) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (settings.pageMode === 'cover') {
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
        swipedRef.current = true; // 抑制随后的点击翻页
        turnPage(dx < 0 ? 1 : -1);
      }
    } else if (st.scrollTop <= 0 && dy > 70 && Math.abs(dy) > Math.abs(dx) && ch > 0) {
      // 滚动模式:已在顶部且下拉 → 上一章
      gotoChapter(ch - 1);
    }
  };
  const suppressIfSwiped = (e: React.MouseEvent) => {
    if (swipedRef.current) { swipedRef.current = false; e.stopPropagation(); }
  };

  if (!book) {
    return (
      <div className="h-full flex items-center justify-center text-[#8A8A8A]">
        <button {...bindBack()} className="bg-transparent border-none text-[#FA6E3D] cursor-pointer">{s.cancel}</button>
      </div>
    );
  }
  const author = authors.find((a) => a.id === book.authorId);
  const mm = String(Math.floor(coinLeft / 60)).padStart(2, '0');
  const ss = String(coinLeft % 60).padStart(2, '0');
  const now = TimeService.getDate();
  const clock = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const myReview = reviews.find((r) => r.mine);

  const contentParas = settings.pageMode === 'cover' ? (pages[pageIdx] ?? []) : paragraphs;

  return (
    <div
      className="flex flex-col h-full relative"
      style={{ background: theme.bg, color: theme.text }}
      data-status-bar-foreground={theme.night ? 'light' : 'dark'}
    >
      {/* 状态栏安全区(沉浸,底色跟随主题) */}
      <div className="h-10 shrink-0" />

      {/* 顶部信息条:章名(点‹返回) + 金币胶囊 */}
      <div className="flex items-center justify-between px-4 h-7 shrink-0 text-[11px] opacity-70">
        <button
          onClick={exitReader}
          data-back-intent="true"
          className="truncate max-w-44 bg-transparent border-none cursor-pointer p-0 text-left"
          style={{ color: 'inherit', font: 'inherit' }}
          aria-label="exit-reader"
        >
          {`‹ ${pageIdx === 0 && ch === 0 ? book.title : curTitle}`}
        </button>
        <span className="px-2 py-0.5 rounded-full border" style={{ borderColor: theme.night ? '#444' : '#00000022' }}>
          {s.coinCapsule.replace('{time}', `${mm}:${ss}`).replace('{n}', String(COIN_CYCLE_REWARD))}
        </span>
      </div>

      {/* 正文区 */}
      {settings.pageMode === 'cover' ? (
        <div
          className="flex-1 relative overflow-hidden px-4"
          onPointerDown={onContentPointerDown}
          onPointerUp={onContentPointerUp}
        >
          {pageIdx === 0 && (
            <div className="font-bold mt-4 mb-3" style={{ fontSize: px + 6 }}>{curTitle}</div>
          )}
          <div style={{ fontSize: px, lineHeight: 1.8 }}>
            {contentParas.map((p, i) => (
              <p key={i} className="mb-3" style={{ textIndent: '2em' }}>{p}</p>
            ))}
          </div>
          {/* 三分区点击层:左翻/中菜单/右翻(左右滑翻页由外层 pointer 处理,swipe 后抑制点击) */}
          <div className="absolute inset-0 flex" onClickCapture={suppressIfSwiped}>
            <div
              {...bindTap({ kind: 'action', id: 'reader.page.prev' }, { onTrigger: () => turnPage(-1) })}
              className="w-1/4 h-full"
            />
            <div
              {...(menuOpen
                ? { onClick: () => back() }
                : bindTap('reader.menu-open', { params: { id: book.id } }))}
              className="flex-1 h-full"
            />
            <div
              {...bindTap({ kind: 'action', id: 'reader.page.next' }, { onTrigger: () => turnPage(1) })}
              className="w-1/4 h-full"
            />
          </div>
        </div>
      ) : (
        <div
          className="flex-1 overflow-y-auto px-4"
          data-scroll-container="reader-body"
          data-scroll-direction="vertical"
          onPointerDown={onContentPointerDown}
          onPointerUp={onContentPointerUp}
        >
          <div className="font-bold mt-4 mb-3" style={{ fontSize: px + 6 }}>{curTitle}</div>
          <div style={{ fontSize: px, lineHeight: 1.8 }}>
            {contentParas.map((p, i) => (
              <p key={i} className="mb-3" style={{ textIndent: '2em' }}>{p}</p>
            ))}
          </div>
          <div className="flex justify-center py-4">
            <button
              {...bindTap({ kind: 'action', id: 'reader.chapter.next' }, { onTrigger: () => gotoChapter(ch + 1) })}
              className="px-6 py-2 rounded-full border text-[13px] bg-transparent cursor-pointer"
              style={{ borderColor: theme.night ? '#444' : '#00000022', color: theme.text }}
            >
              {s.nextChapter}
            </button>
          </div>
          {/* 中央呼菜单热区(滚动模式下用固定按钮替代大热区,避免吞滚动) */}
          <div
            {...(menuOpen ? { onClick: () => back() } : bindTap('reader.menu-open', { params: { id: book.id } }))}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-40"
          />
        </div>
      )}

      {/* 页脚 */}
      <div className="flex items-center justify-between px-4 h-6 shrink-0 text-[10px] opacity-60 mb-1">
        <span>{`${pageDisplay}/${totalPagesDisplay}`}</span>
        <span className="flex items-center gap-1">
          {clock}
          <span className="inline-block w-5 h-2.5 border rounded-sm relative" style={{ borderColor: 'currentColor' }}>
            <span className="absolute left-px top-px bottom-px w-3 bg-current rounded-xs" />
          </span>
        </span>
      </div>

      {/* ===== 菜单浮层 ===== */}
      {menuOpen && (
        <>
          <div className="absolute top-0 left-0 right-0 pt-10 z-20 shadow-sm" style={{ background: theme.night ? '#1C1C1C' : '#FFFFFF' }}>
            <div className="flex items-center h-12 px-2 gap-1" style={{ color: theme.night ? '#CCC' : '#1A1A1A' }}>
              <button
                {...bindTap({ kind: 'action', id: 'reader.chapter.prev' }, { onTrigger: exitReader })}
                className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
                data-back-intent="true"
                aria-label="exit-reader"
                style={{ color: 'inherit' }}
              >
                <IcBack size={22} />
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'reader.shelf.add' }, {
                  onTrigger: () => { if (!inShelf) { addToShelf(book.id); showToast(s.addedShelf); } },
                })}
                className="text-[14px] bg-transparent border-none cursor-pointer px-2"
                style={{ color: inShelf ? (theme.night ? '#777' : '#AAAAAA') : 'inherit' }}
              >
                {inShelf ? s.addedShelf : s.addShelf}
              </button>
              <div className="flex-1" />
              <button {...bindTap({ kind: 'action', id: 'reader.download.disabled' }, { onTrigger: () => showToast(s.notOpen) })} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }}>
                <IcDownload size={19} />
              </button>
              <button {...bindTap({ kind: 'action', id: 'reader.share.submit' }, { onTrigger: () => {
                const text = `【番茄小说】${book.title}`;
                // 系统分享(ACTION_SEND);机上没有可接收的 App 时回落到系统剪贴板
                const launched = sharePlainText(text, { onResult: (r) => { if (r.resultCode === 'OK') showToast(s.shareOk); } });
                if (!launched) { ClipboardService.copyText(text, 'fanqiexiaoshuo'); showToast(s.copiedToClipboard); }
              } })} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }}>
                <IcShare size={19} />
              </button>
              <button {...bindTap('reader.ratepanel-open', { params: { id: book.id } })} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }}>
                <IcMore size={19} />
              </button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-20 pb-4" style={{ background: theme.night ? '#1C1C1C' : '#FFFFFF', color: theme.night ? '#CCC' : '#1A1A1A' }}>
            {/* 上一章 - 进度条 - 下一章 */}
            <div className="flex items-center px-4 h-12 gap-3">
              <button {...bindTap({ kind: 'action', id: 'reader.chapter.prev' }, { onTrigger: () => gotoChapter(ch - 1) })} className="text-[13px] bg-transparent border-none cursor-pointer shrink-0" style={{ color: 'inherit' }}>
                {s.prevChapter}
              </button>
              <div
                ref={sliderRef}
                {...bindTap({ kind: 'action', id: 'reader.progress.seek' }, { onTrigger: () => {} })}
                className="flex-1 h-8 flex items-center cursor-pointer"
                onPointerDown={(e) => { draggingRef.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekTo(e.clientX); }}
                onPointerMove={(e) => { if (draggingRef.current) seekTo(e.clientX); }}
                onPointerUp={() => { draggingRef.current = false; }}
                onPointerCancel={() => { draggingRef.current = false; }}
              >
                <div className="w-full h-1 rounded-full relative" style={{ background: theme.night ? '#3A3A3A' : '#EEEEEE' }}>
                  <div className="absolute left-0 top-0 bottom-0 rounded-full bg-[#FA6E3D]" style={{ width: `${pages.length > 1 ? (pageIdx / (pages.length - 1)) * 100 : 0}%` }} />
                  <div className="absolute w-4 h-4 rounded-full bg-white shadow -top-1.5" style={{ left: `calc(${pages.length > 1 ? (pageIdx / (pages.length - 1)) * 100 : 0}% - 8px)` }} />
                </div>
              </div>
              <button {...bindTap({ kind: 'action', id: 'reader.chapter.next' }, { onTrigger: () => gotoChapter(ch + 1) })} className="text-[13px] bg-transparent border-none cursor-pointer shrink-0" style={{ color: 'inherit' }}>
                {s.nextChapter}
              </button>
            </div>
            {/* 工具栏:目录/夜间/设置 */}
            <div className="flex items-center justify-around h-14">
              <button {...bindTap('reader.catalog-open', { params: { id: book.id } })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }}>
                <IcCatalog size={20} /><span className="text-[10px]">{s.catalog}</span>
              </button>
              {theme.night ? (
                <button
                  {...bindTap({ kind: 'action', id: 'reader.night.confirm' }, { onTrigger: () => { setNightMode(false); showToast(s.nightModeOff); } })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }}
                >
                  <IcSun size={20} /><span className="text-[10px]">{s.daytime}</span>
                </button>
              ) : (
                <button {...bindTap('reader.nightdialog-open', { params: { id: book.id } })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }}>
                  <IcNight size={20} /><span className="text-[10px]">{s.night}</span>
                </button>
              )}
              <button {...bindTap('reader.settings-open', { params: { id: book.id } })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer relative" style={{ color: 'inherit' }}>
                <IcSettings size={20} /><span className="text-[10px]">{s.settings}</span>
                <span className="absolute -top-1 -right-4 text-[8px] bg-[#E5453D] text-white rounded-full px-1">{s.newBackground}</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ===== 目录页(详情/目录/笔记) ===== */}
      {panel === 'catalog' && (
        <div className="absolute inset-0 z-30 flex flex-col pt-10" style={{ background: theme.night ? '#1C1C1C' : theme.bg, color: theme.text }}>
          <div className="flex items-center px-4 h-14 gap-3 shrink-0">
            <button {...bindBack()} className="bg-transparent border-none cursor-pointer" style={{ color: 'inherit' }} aria-label="close-catalog">
              <IcDown size={22} />
            </button>
            <BookCover book={book} className="w-8 h-11" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold truncate">{`${book.title} ›`}</div>
              <div className="text-[11px] opacity-60">{author?.name}</div>
            </div>
          </div>
          <div className="flex items-center gap-6 px-4 h-10 shrink-0 text-[14px]">
            {([['detail', s.detailTab], ['catalog', s.catalog], ['notes', s.notesTab]] as const).map(([key, label]) => (
              <button
                key={key}
                {...bindTap({ kind: 'action', id: 'readercatalog.tab.select.target' }, {
                  params: { target: key },
                  onTrigger: () => setSpReplace((p) => { p.set('ctab', key); }),
                })}
                className={`bg-transparent border-none cursor-pointer ${ctab === key ? 'font-bold' : 'opacity-60'}`}
                style={{ color: 'inherit' }}
              >
                {label}
              </button>
            ))}
          </div>
          {ctab === 'catalog' && (
            <CatalogTab
              book={book}
              ch={ch}
              theme={theme}
              onJump={(idx) => {
                // 目录点章:一次 replace 关闭目录/菜单并落到该章(不能先 gotoChapter 再 back——back 会把 ch 改动弹掉)
                const clamped = Math.max(0, Math.min(book.chapters - 1, idx));
                setSp((p) => { p.delete('menu'); p.delete('panel'); p.set('ch', String(clamped)); return p; }, { replace: true });
                setPageIdx(0);
              }}
            />
          )}
          {ctab === 'detail' && (
            <div className="flex-1 overflow-y-auto px-4 text-[13px] leading-6">
              <div className="opacity-70 mt-2">{s.readerDetailLine.replace('{cat}', book.category).replace('{readers}', String(book.readersWan)).replace('{words}', String(book.words)).replace('{status}', book.status)}</div>
              <div className="mt-3">{book.intro}</div>
              <div className="mt-4 font-semibold">{`${s.reviews} · ${s.ratingScore.replace('{n}', String(book.rating))}`}</div>
              {reviews.slice(0, 3).map((r) => (
                <div key={r.id} className="mt-2 opacity-80">
                  <Stars value={r.stars} />
                  <div className="mt-1">{r.text}</div>
                </div>
              ))}
            </div>
          )}
          {ctab === 'notes' && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-[13px] px-8 text-center">
              {s.emptyNotes.replace('|', '\n')}
            </div>
          )}
        </div>
      )}

      {/* ===== 设置面板 ===== */}
      {panel === 'settings' && (
        <>
          <div className="absolute inset-0 z-20" onClick={() => back()} />
          <div className="absolute bottom-0 left-0 right-0 z-30 pb-5 px-4 pt-4 rounded-t-2xl" style={{ background: theme.night ? '#1C1C1C' : '#FFFFFF', color: theme.night ? '#CCC' : '#1A1A1A' }}>
            {/* 字号 */}
            <div className="flex items-center gap-3 h-12">
              <span className="text-[12px] opacity-60 w-8">{s.fontSize}</span>
              <button
                {...bindTap({ kind: 'action', id: 'readersettings.fontsize.select.target' }, { params: { target: 'minus' }, onTrigger: () => setFontSize(-1) })}
                className="flex-1 h-9 rounded-full text-[15px] cursor-pointer border-none" style={{ background: theme.night ? '#2A2A2A' : '#F5F5F5', color: 'inherit' }}
                disabled={settings.fontSize <= FONT_SIZE_MIN}
              >
                A⁻
              </button>
              <span className="w-8 text-center text-[15px]">{settings.fontSize}</span>
              <button
                {...bindTap({ kind: 'action', id: 'readersettings.fontsize.select.target' }, { params: { target: 'plus' }, onTrigger: () => setFontSize(1) })}
                className="flex-1 h-9 rounded-full text-[15px] cursor-pointer border-none" style={{ background: theme.night ? '#2A2A2A' : '#F5F5F5', color: 'inherit' }}
                disabled={settings.fontSize >= FONT_SIZE_MAX}
              >
                A⁺
              </button>
            </div>
            {/* 颜色 7 档 */}
            <div className="flex items-center gap-3 h-12">
              <span className="text-[12px] opacity-60 w-8">{s.colors}</span>
              <div className="flex-1 flex items-center justify-between">
                {READER_THEMES.map((t, i) => (
                  <button
                    key={t.id}
                    {...bindTap({ kind: 'action', id: 'readersettings.theme.select.target' }, { params: { target: t.id }, onTrigger: () => setTheme(i) })}
                    className="w-8 h-8 rounded-full cursor-pointer"
                    style={{
                      background: t.bg,
                      border: settings.themeIdx === i ? '2px solid #FA6E3D' : '1px solid #00000022',
                    }}
                    aria-label={`theme-${t.id}`}
                  />
                ))}
              </div>
            </div>
            {/* 翻页(Q10:仅覆盖/上下两档) */}
            <div className="flex items-center gap-3 h-12">
              <span className="text-[12px] opacity-60 w-8">{s.pageMode}</span>
              {([['cover', s.pageModeCover], ['scroll', s.pageModeScroll]] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  {...bindTap({ kind: 'action', id: 'readersettings.pagemode.select.target' }, { params: { target: mode }, onTrigger: () => setPageMode(mode) })}
                  className="px-6 h-9 rounded-full text-[13px] cursor-pointer border-none"
                  style={{
                    background: settings.pageMode === mode ? '#FA6E3D' : (theme.night ? '#2A2A2A' : '#F5F5F5'),
                    color: settings.pageMode === mode ? '#FFF' : 'inherit',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* 其他(范围外统一 toast) */}
            <div className="flex items-center gap-3 h-11">
              <span className="text-[12px] opacity-60 w-8">{s.otherSettings}</span>
              {([s.brightness, s.systemFont, s.spacing, s.moreSettings] as const).map((label) => (
                <button
                  key={label}
                  {...bindTap({ kind: 'action', id: 'readersettings.misc.disabled' }, { onTrigger: () => showToast(s.notOpen) })}
                  className="px-3 h-8 rounded-full text-[12px] cursor-pointer border-none" style={{ background: theme.night ? '#2A2A2A' : '#F5F5F5', color: 'inherit' }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== 点评弹层(⋮,Q5) ===== */}
      {panel === 'rate' && (
        <>
          <div className="absolute inset-0 z-20 bg-black/40" onClick={() => back()} />
          <div className="absolute bottom-0 left-0 right-0 z-30 pb-6 px-4 pt-3 rounded-t-2xl bg-white text-[#1A1A1A]">
            <div className="w-9 h-1 rounded-full bg-[#E5E5E5] mx-auto mb-3" />
            <div className="flex items-center gap-3">
              <BookCover book={book} className="w-10 h-14" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold truncate">{book.title}</div>
                <div className="text-[11px] text-[#8A8A8A] truncate">{book.intro.slice(0, 18)}…›</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pb-3 border-b border-[#F0F0F0]">
              <div>
                <span className="text-[18px] font-bold">{s.ratingScore.replace('{n}', String(book.rating))}</span>
                <span className="text-[11px] text-[#8A8A8A] ml-2">{s.reviewCount.replace('{n}', String(reviews.length))}</span>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    {...bindTap({ kind: 'action', id: 'ratepanel.star.select.target' }, {
                      params: { target: String(i) },
                      onTrigger: () => {
                        recordTaskAudit({ readerRating: { bookId: book.id, stars: i } });
                        setSp((p) => { p.set('dialog', 'rateconfirm'); p.set('stars', String(i)); return p; });
                      },
                    })}
                    className="bg-transparent border-none cursor-pointer p-0"
                  >
                    <IcStar size={22} className={myReview && i <= myReview.stars ? 'text-[#FA6E3D] fill-[#FA6E3D]' : 'text-[#DDDDDD]'} />
                  </button>
                ))}
                <span className="text-[11px] text-[#8A8A8A] ml-1">{myReview ? s.addFollowUp : s.ratePrompt}</span>
              </div>
            </div>
            <div className="flex items-center justify-around mt-3">
              <button {...bindTap('reader.bookdetail-open', { params: { id: book.id } })} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-[#1A1A1A]">
                <IcCatalog size={20} /><span className="text-[10px]">{s.bookDetail}</span>
              </button>
              {([s.commentSettings, s.sendGift, s.bookCircle, s.addBookmark] as const).map((label) => (
                <button
                  key={label}
                  {...bindTap({ kind: 'action', id: 'ratepanel.misc.disabled' }, { onTrigger: () => showToast(s.notOpen) })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer text-[#1A1A1A]"
                >
                  <IcStar size={20} className="text-[#8A8A8A]" /><span className="text-[10px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== 弹窗:夜间确认 / 退出挽留 / 点评确认 ===== */}
      {dialog === 'night' && (
        <ConfirmDialog
          title={s.nightConfirmTitle}
          body={s.nightConfirmBody}
          cancelText={s.cancel}
          confirmText={s.confirm}
          onCancel={() => back()}
          onConfirm={() => { setNightMode(true); back(); }}
          confirmBinding={bindTap({ kind: 'action', id: 'reader.night.confirm' }, { onTrigger: () => {} })}
        />
      )}
      {dialog === 'exit' && (
        <ConfirmDialog
          title={s.exitAddShelf}
          body={s.exitShelfBody.replace('{n}', String(book.readersWan)).replace('{title}', book.title)}
          cancelText={s.exitLater}
          confirmText={s.addShelf}
          onCancel={closeThenExit}
          onConfirm={() => { addToShelf(book.id); closeThenExit(); }}
          cancelBinding={bindTap({ kind: 'action', id: 'reader.exit.decline' }, { onTrigger: () => {} })}
          confirmBinding={bindTap({ kind: 'action', id: 'reader.exit.addshelf' }, { onTrigger: () => {} })}
        />
      )}
      {dialog === 'rateconfirm' && (
        <ConfirmDialog
          title={s.rateConfirmTitle}
          body={s.rateConfirmBody}
          cancelText={s.rateConfirmCancel}
          confirmText={s.rateConfirmOk}
          onCancel={() => back()}
          onConfirm={() => go('ratepanel.write-open', { id: book.id, stars: sp.get('stars') ?? '5' })}
          confirmBinding={bindTap('ratepanel.write-open', { params: { id: book.id, stars: '5' } })}
        />
      )}

      {toastNode}
    </div>
  );
}

/* ---------------- 目录 tab ---------------- */
function CatalogTab({
  book, ch, theme, onJump,
}: {
  book: NonNullable<ReturnType<typeof pickBook>>;
  ch: number;
  theme: { night: boolean; bg: string; text: string };
  onJump: (idx: number) => void;
}) {
  const s = useFanqieStrings();
  const { bindTap } = useFanqieGestures();
  const titleBank = useFanqieStore((st) => st.chapterTitleBank);
  const recordTaskAudit = useFanqieStore((st) => st.recordTaskAudit);
  const [desc, setDesc] = useState(false);
  const total = book.chapters;
  const idxs = useMemo(() => {
    const arr = Array.from({ length: total }, (_, i) => i);
    return desc ? arr.reverse() : arr;
  }, [total, desc]);
  // 长目录只渲染当前章前后窗口 + 首尾(性能)
  const windowed = idxs.length > 120
    ? idxs.filter((i) => i < 30 || Math.abs(i - ch) < 30 || i > total - 10)
    : idxs;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 h-8 text-[12px] opacity-70 shrink-0">
        <span>{s.catalogTotal.replace('{n}', String(total)).replace('{status}', book.status)}</span>
        <button
          {...bindTap({ kind: 'action', id: 'readercatalog.order.toggle' }, {
            onTrigger: () => setDesc((d) => {
              const next = !d;
              recordTaskAudit({ catalogOrder: { bookId: book.id, order: next ? 'desc' : 'asc' } });
              return next;
            }),
          })}
          className="bg-transparent border-none cursor-pointer text-[12px]" style={{ color: 'inherit' }}
        >
          {desc ? s.orderAsc : s.orderDesc}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="reader-catalog" data-scroll-direction="vertical">
        {windowed.map((i) => (
          <button
            key={i}
            {...bindTap({ kind: 'action', id: 'readercatalog.chapter.select.target' }, {
              params: { target: String(i) },
              onTrigger: () => onJump(i),
            })}
            className="w-full text-left py-2.5 border-b bg-transparent cursor-pointer block"
            style={{ borderColor: theme.night ? '#2E2E2E' : '#00000012', color: i === ch ? '#FA6E3D' : 'inherit' }}
          >
            <div className="text-[14px] truncate">{chapterTitle({ chapterTitleBank: titleBank }, book, i)}</div>
            <div className="text-[10px] opacity-50 mt-0.5">{s.wordCount.replace('{n}', String(chapterWordCount(book, i)))}</div>
            {i === ch && <div className="text-[10px] text-[#FA6E3D]">{s.reading}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}

// 类型辅助(仅为 CatalogTab props 推导)
function pickBook() {
  const st = null as unknown as { books: import('../types').FanqieBook[] };
  return st?.books?.[0] ?? null;
}
