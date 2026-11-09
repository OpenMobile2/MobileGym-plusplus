import React, { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast, useToast, BookCover } from '../components/ui';
import { READER_THEMES } from '../constants';
import {
  IcScan, IcSearch, IcNight, IcSun, IcMenu, IcArrowRight,
  IcNote, IcHistory, IcBell, IcEdit, IcBookmark,
  IcThumb, IcDownload, IcGift, IcUsers, IcMessage, IcCoin,
} from '../res/icons';

/** 功能宫格两页(视觉基准 90_4;仅浏览历史/我的消息真实可达) */
const GRID_PAGES = [
  [
    { id: 'orders', label: '我的订单', Icon: IcNote, badge: '待收货4' },
    { id: 'history', label: '浏览历史', Icon: IcHistory },
    { id: 'messages', label: '我的消息', Icon: IcBell, dot: 19 },
    { id: 'writer', label: '成为作家', Icon: IcEdit, badge: '福利' },
    { id: 'reserve', label: '我的预约', Icon: IcBookmark },
  ],
  [
    { id: 'likes', label: '我的点赞', Icon: IcThumb },
    { id: 'downloads', label: '我的下载', Icon: IcDownload },
    { id: 'game', label: '游戏中心', Icon: IcGift },
    { id: 'vip', label: '会员中心', Icon: IcUsers },
    { id: 'feedback', label: '反馈与帮助', Icon: IcMessage },
  ],
] as const;

type GridItem = (typeof GRID_PAGES)[number][number] & { badge?: string; dot?: number };

/** 侧边抽屉入口:navTo 有值→走该 transition;否则 toast 暂未开放 */
const DRAWER_ENTRIES = [
  { id: 'history', label: '浏览历史', Icon: IcHistory, navTo: 'mine.history-open' },
  { id: 'messages', label: '我的消息', Icon: IcBell, navTo: 'mine.messages-open' },
  { id: 'earnings', label: '我的收益', Icon: IcCoin, navTo: 'mine.earnings-open' },
  { id: 'pref', label: '阅读偏好', Icon: IcNote, navTo: undefined },
  { id: 'notes', label: '我的笔记', Icon: IcBookmark, navTo: undefined },
  { id: 'wallet', label: '我的钱包', Icon: IcGift, navTo: undefined },
  { id: 'guide', label: '番茄指南', Icon: IcMessage, navTo: undefined },
] as const;

export default function MinePage() {
  const { bindTap, bindBack } = useFanqieGestures();
  const str = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [toastNode, showToast] = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const drawerOpen = searchParams.get('drawer') === '1';

  const user = useFanqieStore((s) => s.user);
  const books = useFanqieStore((s) => s.books);
  const shelf = useFanqieStore((s) => s.shelf);
  const history = useFanqieStore((s) => s.history);
  const coins = useFanqieStore((s) => s.coins);
  const placeholderWords = useFanqieStore((s) => s.placeholderWords);
  // 夜间模式与阅读器共用同一档位(走查轮3 #2:两个入口读同一设置)
  const nightMode = useFanqieStore((s) => READER_THEMES[s.readerSettings.themeIdx]?.night ?? false);
  const setNightMode = useFanqieStore((s) => s.setNightMode);

  const gridPage = searchParams.get('grid') === '2' ? 2 : 1;

  // 最近阅读:history 中第一条真正读过正文的书
  const recent = history.find((h) => h.chapterIdx >= 0);
  const recentBook = recent ? books.find((b) => b.id === recent.bookId) : undefined;

  // 双列推荐流:不在书架的前 6 本
  const shelfIds = shelf.map((e) => e.bookId);
  const recommends = books.filter((b) => !shelfIds.includes(b.id)).slice(0, 6);

  const scrollGridTo = (page: number) => {
    const el = gridRef.current;
    if (el) el.scrollTo({ left: (page - 1) * el.clientWidth, behavior: 'smooth' });
  };

  const onGridScroll = () => {
    const el = gridRef.current;
    if (!el || el.clientWidth === 0) return;
    const page = Math.round(el.scrollLeft / el.clientWidth) + 1;
    if (page !== gridPage) {
      setSearchParams((p) => { p.set('grid', String(page)); return p; }, { replace: true });
    }
  };

  const renderGridItem = (item: GridItem) => {
    const inner = (
      <>
        <div className="relative">
          <item.Icon size={24} className="text-(--app-c-text-regular)" />
          {item.badge && (
            <span className="absolute -top-2 left-4 whitespace-nowrap text-[8px] leading-none text-white bg-(--app-c-brand) rounded-full rounded-bl-none px-1 py-0.5">
              {item.badge}
            </span>
          )}
          {item.dot !== undefined && (
            <span className="absolute -top-1.5 left-4 min-w-4 h-4 flex items-center justify-center text-[9px] leading-none text-white bg-(--app-c-badge-red) rounded-full px-1">
              {item.dot}
            </span>
          )}
        </div>
        <span className="text-[11px] text-(--app-c-text-regular) mt-1.5 whitespace-nowrap">{item.label}</span>
      </>
    );
    const cls = 'flex-1 flex flex-col items-center pt-3 pb-1 bg-transparent border-none cursor-pointer min-w-0';
    if (item.id === 'history') {
      return (
        <button key={item.id} {...bindTap('mine.history-open')} className={cls}>{inner}</button>
      );
    }
    if (item.id === 'messages') {
      return (
        <button key={item.id} {...bindTap('mine.messages-open')} className={cls}>{inner}</button>
      );
    }
    return (
      <button
        key={item.id}
        {...bindTap({ kind: 'action', id: 'mine.misc.disabled' }, { onTrigger: showNotOpen })}
        className={cls}
      >
        {inner}
      </button>
    );
  };

  return (
    <div className="relative h-full bg-(--app-c-bg-page-alt)">
      <div className="h-full overflow-y-auto pb-6" data-scroll-container="mine-body" data-scroll-direction="vertical">
        {/* ===== 顶栏:扫码 + 搜索胶囊 + 月亮 + ☰ ===== */}
        <div className="flex items-center gap-2 px-3 pt-2">
          <button
            {...bindTap({ kind: 'action', id: 'mine.misc.disabled' }, { onTrigger: showNotOpen })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            aria-label="扫码"
          >
            <IcScan size={20} className="text-(--app-c-text-regular)" />
          </button>
          <button
            {...bindTap('mine.search-open')}
            className="flex-1 h-8 rounded-full bg-(--app-c-bg-card) flex items-center px-3 gap-1.5 border-none cursor-pointer min-w-0"
          >
            <IcSearch size={14} className="text-(--app-c-text-quaternary) shrink-0" />
            <span className="text-[13px] text-(--app-c-text-quaternary) truncate">
              {placeholderWords[0] ?? str.searchPlaceholder}
            </span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'mine.nightmode.toggle' }, {
              onTrigger: () => {
                setNightMode(!nightMode);
                showToast(nightMode ? str.nightModeOff : str.nightModeOn);
              },
            })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            aria-label="夜间模式"
          >
            {nightMode
              ? <IcSun size={20} className="text-(--app-c-brand)" />
              : <IcNight size={20} className="text-(--app-c-text-regular)" />}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'mine.drawer.toggle' }, {
              onTrigger: () => setSearchParams((p) => { p.set('drawer', '1'); return p; }),
            })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            aria-label="菜单"
          >
            <IcMenu size={20} className="text-(--app-c-text-regular)" />
          </button>
        </div>

        {/* ===== 头像区(整行进个人主页) ===== */}
        <button
          {...bindTap('mine.profile-open')}
          className="w-full flex items-center gap-3 px-4 mt-3 bg-transparent border-none cursor-pointer text-left"
        >
          <img src={user.avatar} alt="" className="w-14 h-14 rounded-full bg-(--app-c-bg-fill) object-cover shrink-0" />
          <span className="flex-1 text-[17px] font-bold text-(--app-c-text-primary) truncate">{user.name}</span>
          <IcArrowRight size={18} className="text-(--app-c-text-disabled) shrink-0" />
        </button>
        <div className="flex items-center gap-4 px-4 mt-2.5">
          <span className="text-[12px] text-(--app-c-text-regular)">关注 <span className="text-(--app-c-text-secondary)">{user.follows}</span></span>
          <span className="text-[12px] text-(--app-c-text-regular)">粉丝 <span className="text-(--app-c-text-secondary)">{user.fans}</span></span>
          <span className="text-[12px] text-(--app-c-text-regular)">获赞 <span className="text-(--app-c-text-secondary)">{user.likes}</span></span>
          <span className="text-[12px] text-(--app-c-text-regular)">拯救书荒 <span className="text-(--app-c-text-secondary)">{user.rescued}</span></span>
        </div>

        {/* ===== 功能宫格(横滑2页 + 圆点) ===== */}
        <div className="bg-(--app-c-bg-card) rounded-xl mx-3 mt-3 pb-1.5">
          <div
            ref={gridRef}
            onScroll={onGridScroll}
            className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none]"
          >
            {GRID_PAGES.map((page, pi) => (
              <div key={pi} className="w-full shrink-0 snap-start flex">
                {page.map((item) => renderGridItem(item))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <button
              {...bindTap({ kind: 'action', id: 'mine.grid.select.target' }, {
                params: { target: '1' },
                onTrigger: () => {
                  setSearchParams((p) => { p.set('grid', '1'); return p; }, { replace: true });
                  scrollGridTo(1);
                },
              })}
              className="p-1 bg-transparent border-none cursor-pointer"
              aria-label="宫格第1页"
            >
              <span className={`block w-1.5 h-1.5 rounded-full ${gridPage === 1 ? 'bg-(--app-c-brand)' : 'bg-(--app-c-border)'}`} />
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'mine.grid.select.target' }, {
                params: { target: '2' },
                onTrigger: () => {
                  setSearchParams((p) => { p.set('grid', '2'); return p; }, { replace: true });
                  scrollGridTo(2);
                },
              })}
              className="p-1 bg-transparent border-none cursor-pointer"
              aria-label="宫格第2页"
            >
              <span className={`block w-1.5 h-1.5 rounded-full ${gridPage === 2 ? 'bg-(--app-c-brand)' : 'bg-(--app-c-border)'}`} />
            </button>
          </div>
        </div>

        {/* ===== 最近阅读卡 ===== */}
        {recent && recentBook && (
          <button
            {...bindTap('mine.reader-open', { params: { id: recentBook.id, ch: String(recent.chapterIdx) } })}
            className="w-[calc(100%-24px)] mx-3 mt-3 bg-(--app-c-bg-card) rounded-xl px-4 py-3 flex items-center border-none cursor-pointer text-left"
          >
            <div className="flex-1 min-w-0">
              <span className="text-[13px] text-(--app-c-text-regular) truncate block">
                {recentBook.title}<span className="text-(--app-c-text-tertiary)">/第{recent.chapterIdx + 1}章</span>
              </span>
            </div>
            <span className="shrink-0 flex items-center text-[13px] text-(--app-c-brand) font-medium">
              {str.continueReading}
              <IcArrowRight size={14} className="text-(--app-c-brand)" />
            </span>
          </button>
        )}

        {/* ===== 金币余额区 ===== */}
        <div className="bg-(--app-c-bg-card) rounded-xl mx-3 mt-3 overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <button
              {...bindTap('mine.earnings-open')}
              className="flex-1 flex items-center gap-5 bg-transparent border-none cursor-pointer text-left p-0 min-w-0"
            >
              <span className="text-(--app-c-text-primary)">
                <span className="text-[20px] font-bold">{coins}</span>
                <span className="text-[12px] text-(--app-c-text-secondary) ml-1">{str.myCoins}</span>
              </span>
              <span className="text-(--app-c-text-primary)">
                <span className="text-[20px] font-bold">0.00</span>
                <span className="text-[12px] text-(--app-c-text-secondary) ml-1">{str.balance}</span>
              </span>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'mine.misc.disabled' }, { onTrigger: showNotOpen })}
              className="shrink-0 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
            >
              <span className="w-4 h-4 rounded-full bg-[#2AAE67] flex items-center justify-center">
                <IcCoin size={10} className="text-white" />
              </span>
              <span className="text-[13px] text-(--app-c-text-regular)">{str.withdraw}</span>
              <IcArrowRight size={14} className="text-(--app-c-text-disabled)" />
            </button>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'mine.misc.disabled' }, { onTrigger: showNotOpen })}
            className="w-full flex items-center bg-(--app-c-brand-soft-alt) px-4 py-2.5 border-none cursor-pointer text-left"
          >
            <span className="text-[9px] text-white bg-(--app-c-brand) rounded-sm px-1 py-px mr-1.5 shrink-0">福利</span>
            <span className="flex-1 text-[12px] text-(--app-c-tag-warm-text) truncate">领取爱心晚餐补贴</span>
            <span className="shrink-0 flex items-center text-[12px] text-(--app-c-brand) font-medium">
              立即领取
              <IcArrowRight size={13} className="text-(--app-c-brand)" />
            </span>
          </button>
        </div>

        {/* ===== 双列推荐流 ===== */}
        <div className="grid grid-cols-2 gap-3 px-3 mt-3">
          {recommends.map((b) => (
            <button
              key={b.id}
              {...bindTap('mine.bookdetail-open', { params: { id: b.id } })}
              className="bg-(--app-c-bg-card) rounded-xl overflow-hidden border-none cursor-pointer text-left p-0 flex flex-col"
            >
              <div className="relative">
                <BookCover book={b} className="w-full aspect-[3/4] rounded-none" />
                <span className="absolute left-2 bottom-1.5 text-[13px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  {b.rating}分
                </span>
              </div>
              <div className="px-2.5 pt-2 pb-2.5">
                <div className="text-[14px] font-semibold text-(--app-c-text-primary) leading-5 line-clamp-2">{b.title}</div>
                <div className="text-[11px] text-(--app-c-text-tertiary) leading-4 mt-1 line-clamp-2">{b.intro}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ===== 右下羽毛笔悬浮钮 ===== */}
      <button
        {...bindTap({ kind: 'action', id: 'mine.misc.disabled' }, { onTrigger: showNotOpen })}
        className="absolute bottom-6 right-4 w-12 h-12 rounded-full bg-(--app-c-brand) flex items-center justify-center border-none cursor-pointer shadow-[0_4px_12px_rgba(250,110,61,0.4)]"
        aria-label="写点什么"
      >
        <IcEdit size={22} className="text-white" />
      </button>

      {/* ===== 右侧侧边抽屉 ===== */}
      {drawerOpen && (
        <div className="absolute inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" {...bindBack()} />
          <div className="w-64 h-full bg-(--app-c-bg-card) flex flex-col shadow-[-4px_0_16px_rgba(0,0,0,0.12)]">
            {/* 抽屉头:头像 + 昵称 */}
            <div className="flex items-center gap-3 px-4 pt-6 pb-4 shrink-0"
              style={{ background: 'linear-gradient(180deg, var(--app-c-brand-soft-alt), var(--app-c-bg-card))' }}>
              <img src={user.avatar} alt="" className="w-11 h-11 rounded-full bg-(--app-c-bg-fill) object-cover shrink-0" />
              <span className="flex-1 text-[15px] font-bold text-(--app-c-text-primary) truncate">{user.name}</span>
            </div>
            {/* 入口列表 */}
            <div className="flex-1 overflow-y-auto">
              {DRAWER_ENTRIES.map((e) => {
                const inner = (
                  <>
                    <e.Icon size={19} className="text-(--app-c-text-regular) shrink-0" />
                    <span className="flex-1 text-[14px] text-(--app-c-text-primary)">{e.label}</span>
                    <IcArrowRight size={15} className="text-(--app-c-text-disabled) shrink-0" />
                  </>
                );
                const cls = 'w-full flex items-center gap-3 px-4 py-3.5 bg-transparent border-none cursor-pointer text-left border-b border-(--app-c-divider)';
                return e.navTo ? (
                  <button key={e.id} {...bindTap(e.navTo)} className={cls}>{inner}</button>
                ) : (
                  <button
                    key={e.id}
                    {...bindTap({ kind: 'action', id: 'mine.drawer.entry.disabled' }, { onTrigger: showNotOpen })}
                    className={cls}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {notOpenNode}
      {toastNode}
    </div>
  );
}
