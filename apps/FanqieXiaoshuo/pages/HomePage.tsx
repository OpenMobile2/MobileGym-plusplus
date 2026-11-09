import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast, BookCover, Badge } from '../components/ui';
import { HOME_CHANNELS } from '../constants';
import { IcSearch, IcCategory, IcArrowRight } from '../res/icons';
import type { FanqieBook } from '../types';

/** 首页榜单卡子tab(视觉基准 82_4) */
// id 同时是 ?rtab= 取值与排序分支,保持不变;展示文案走 strings(i18n 合同)
const RANK_CARD_TABS = ['推荐榜', '完本榜', '巅峰榜', '新书榜'] as const;
const RANK_TAB_KEYS = {
  推荐榜: 'rankRecommend', 完本榜: 'rankFinished', 巅峰榜: 'rankPeak', 新书榜: 'rankNew',
} as const;

/** 子榜排序(推荐=热度 / 完本=已完结 / 巅峰=巅峰榜徽章优先 / 新书=章节少在前) */
function sortRankCard(list: FanqieBook[], sub: string): FanqieBook[] {
  const arr = [...list];
  switch (sub) {
    case '完本榜':
      return arr.filter((b) => b.status === '已完结').sort((a, b) => b.hotWan - a.hotWan);
    case '巅峰榜':
      return arr.sort(
        (a, b) => Number(b.badge === '巅峰榜') - Number(a.badge === '巅峰榜') || b.hotWan - a.hotWan,
      );
    case '新书榜':
      return arr.sort((a, b) => a.chapters - b.chapters);
    default:
      return arr.sort((a, b) => b.hotWan - a.hotWan);
  }
}

export default function HomePage() {
  const { bindTap } = useFanqieGestures();
  const str = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const books = useFanqieStore((s) => s.books);
  const shelf = useFanqieStore((s) => s.shelf);
  const progress = useFanqieStore((s) => s.progress);
  const placeholderWords = useFanqieStore((s) => s.placeholderWords);
  const recordTaskAudit = useFanqieStore((s) => s.recordTaskAudit);

  const channel = searchParams.get('channel') || 'recommend';
  const rtab = searchParams.get('rtab') || RANK_CARD_TABS[0];

  const selectChannel = (id: string) =>
    setSearchParams((p) => { p.set('channel', id); p.delete('rtab'); return p; }, { replace: true });
  const selectRtab = (t: string) => {
    recordTaskAudit({ rankView: { category: 'novel', sub: t } });
    setSearchParams((p) => { p.set('rtab', t); return p; }, { replace: true });
  };

  const novels = books.filter((b) => b.gender !== 'publish');
  const rankBooks = sortRankCard(novels, rtab).slice(0, 8);
  const feed = channel === 'newbook'
    ? [...novels].sort((a, b) => a.chapters - b.chapters).slice(0, 12)
    : novels;

  /** Q13:读过/在书架 → 直进阅读器续读;否则进书籍详情 */
  const bindBook = (b: FanqieBook) => {
    const read = !!progress[b.id] || shelf.some((e) => e.bookId === b.id);
    return read
      ? bindTap('home.reader-open', { params: { id: b.id, ch: String(progress[b.id] ?? 0) } })
      : bindTap('home.bookdetail-open', { params: { id: b.id } });
  };

  /* ---- 双列瀑布书卡 ---- */
  const FeedCard = ({ b }: { b: FanqieBook }) => (
    <div {...bindBook(b)} className="bg-(--app-c-bg-card) rounded-xl overflow-hidden cursor-pointer">
      <div className="relative">
        <BookCover book={b} className="w-full aspect-[3/4] rounded-none" />
        <span className="absolute bottom-1 left-1.5 text-white text-[14px] font-bold italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
          {str.ratingScore.replace('{n}', b.rating.toFixed(1))}
        </span>
      </div>
      <div className="px-2 pt-1.5 pb-2">
        <div className="text-[14px] font-semibold text-(--app-c-text-primary) truncate">{b.title}</div>
        <div className="text-[11px] text-(--app-c-text-secondary) mt-1 leading-4 line-clamp-2">{b.intro}</div>
        <div className="flex items-center mt-1.5 min-w-0">
          <Badge text={b.badge} />
          <span className="text-[10px] text-(--app-c-text-quaternary) truncate">{str.readersWan.replace('{n}', String(b.readersWan))}</span>
        </div>
      </div>
    </div>
  );

  const FeedGrid = ({ list }: { list: FanqieBook[] }) => (
    <div className="grid grid-cols-2 gap-2 px-3">
      {list.map((b) => <FeedCard key={b.id} b={b} />)}
    </div>
  );

  const recFirst = feed.slice(0, 4);
  const recRest = feed.slice(4);

  return (
    <div className="flex flex-col h-full">
      {/* ===== 顶部:淡橙渐变(搜索栏 + 分类入口 + 频道tab) ===== */}
      <div className="shrink-0"
        style={{ background: 'linear-gradient(180deg, var(--app-c-brand-soft-alt), var(--app-c-bg-card))' }}>
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <div
            {...bindTap('home.search-open')}
            className="flex-1 h-8.5 bg-(--app-c-bg-fill) rounded-full flex items-center px-3 gap-1.5 cursor-pointer min-w-0"
          >
            <IcSearch size={15} className="text-(--app-c-text-tertiary) shrink-0" />
            <span className="flex-1 text-[12px] text-(--app-c-text-tertiary) truncate">{placeholderWords[0]}</span>
            <span className="shrink-0 text-[10px] text-white bg-[#F53F3F] rounded px-1 py-px">{str.hotBook}</span>
          </div>
          <button
            {...bindTap('home.category-open')}
            className="shrink-0 flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
          >
            <IcCategory size={18} className="text-(--app-c-text-primary)" />
            <span className="text-[13px] text-(--app-c-text-primary)">{str.category}</span>
          </button>
        </div>
        {/* 频道tab横滑行 */}
        <div className="flex items-end overflow-x-auto no-scrollbar px-2 gap-1 pb-1.5">
          {HOME_CHANNELS.map((c) => {
            const on = c.id === channel;
            return c.enabled ? (
              <button
                key={c.id}
                {...bindTap(
                  { kind: 'action', id: 'home.channel.select.target' },
                  { params: { target: c.id }, onTrigger: () => selectChannel(c.id) },
                )}
                className={`shrink-0 px-2 bg-transparent border-none cursor-pointer ${
                  on ? 'text-[17px] font-bold text-(--app-c-text-primary)' : 'text-[14px] text-(--app-c-text-regular)'
                }`}
              >
                {c.label}
              </button>
            ) : (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'home.channel.disabled' }, { onTrigger: showNotOpen })}
                className="shrink-0 px-2 text-[14px] text-(--app-c-text-regular) bg-transparent border-none cursor-pointer"
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 内容滚动区 ===== */}
      <div className="flex-1 overflow-y-auto bg-(--app-c-bg-fill)" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {channel === 'recommend' ? (
          <>
            {/* 推荐榜白圆角卡 */}
            <div className="bg-(--app-c-bg-card) rounded-xl mx-3 mt-2 px-3 py-3">
              <div className="flex items-center">
                <div className="flex-1 flex items-center gap-3 overflow-x-auto no-scrollbar">
                  {RANK_CARD_TABS.map((t) => {
                    const on = t === rtab;
                    return (
                      <button
                        key={t}
                        {...bindTap(
                          { kind: 'action', id: 'home.rankcard.select.target' },
                          { params: { target: t }, onTrigger: () => selectRtab(t) },
                        )}
                        className={`shrink-0 bg-transparent border-none cursor-pointer p-0 ${
                          on ? 'text-[15px] font-bold text-(--app-c-text-primary)' : 'text-[13px] text-(--app-c-text-secondary)'
                        }`}
                      >
                        {str[RANK_TAB_KEYS[t]]}
                      </button>
                    );
                  })}
                </div>
                <button
                  {...bindTap('home.rank-open')}
                  className="shrink-0 flex items-center text-[12px] text-(--app-c-text-secondary) bg-transparent border-none cursor-pointer p-0"
                >
                  {str.fullRank}
                  <IcArrowRight size={13} className="text-(--app-c-text-quaternary)" />
                </button>
              </div>
              {/* 2列×4行(左列1~4,右列5~8) */}
              <div className="flex gap-3 mt-2">
                {[rankBooks.slice(0, 4), rankBooks.slice(4, 8)].map((col, ci) => (
                  <div key={ci} className="flex-1 min-w-0">
                    {col.map((b, i) => {
                      const rank = ci * 4 + i + 1;
                      return (
                        <div key={b.id} {...bindBook(b)} className="flex items-center gap-1.5 py-1.5 cursor-pointer">
                          <span className={`w-4 shrink-0 text-center text-[14px] font-bold italic ${rank <= 3 ? 'text-(--app-c-brand)' : 'text-(--app-c-text-disabled)'}`}>
                            {rank}
                          </span>
                          <BookCover book={b} className="w-9 h-12 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] text-(--app-c-text-primary) truncate">{b.title}</div>
                            <div className="text-[10px] text-(--app-c-text-quaternary) truncate mt-0.5">
                              {`${b.category}·${b.status}·`}{str.hotWan.replace('{n}', String(b.hotWan))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* 双列瀑布书卡(前4) */}
            <div className="mt-2">
              <FeedGrid list={recFirst} />
            </div>

            {/* 中插:书荒广场条(暂未开放) */}
            <button
              {...bindTap({ kind: 'action', id: 'home.shuhuang.disabled' }, { onTrigger: showNotOpen })}
              className="mx-3 mt-2 w-[calc(100%-24px)] bg-(--app-c-bg-card) rounded-xl px-3 py-2.5 flex items-center border-none cursor-pointer"
            >
              <span className="text-[14px] font-bold text-(--app-c-text-primary)">{str.bookSquare}</span>
              <span className="text-[11px] text-(--app-c-text-secondary) ml-2">{str.bookSquareSub}</span>
              <span className="flex-1" />
              <IcArrowRight size={14} className="text-(--app-c-text-quaternary)" />
            </button>

            {/* 双列瀑布书卡(其余) */}
            <div className="mt-2">
              <FeedGrid list={recRest} />
            </div>
          </>
        ) : (
          <div className="mt-2">
            <FeedGrid list={feed} />
          </div>
        )}
        <div className="h-3" />
      </div>
      {notOpenNode}
    </div>
  );
}
