import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useNotOpenToast, BookCover } from '../components/ui';
import { RANK_SUBS_NOVEL, RANK_SUBS_PUBLISH } from '../constants';
import { IcBack } from '../res/icons';
import type { FanqieBook } from '../types';

/** 一级类目(小说/出版可用,其余 wontfix toast;视觉基准 83_4) */
const RANK_CATS = [
  { id: 'novel', label: '小说', enabled: true },
  { id: 'publish', label: '出版', enabled: true },
  { id: 'duanju', label: '短剧', enabled: false },
  { id: 'manju', label: '漫剧', enabled: false },
  { id: 'listen', label: '听书', enabled: false },
] as const;

/** 子榜排序:推荐/热门=热度,完本=已完结,新书=章节升序,巅峰=徽章优先,其余=评分 */
function sortRank(list: FanqieBook[], sub: string): FanqieBook[] {
  const arr = [...list];
  switch (sub) {
    case '推荐榜':
    case '热门榜':
      return arr.sort((a, b) => b.hotWan - a.hotWan);
    case '完本榜':
      return arr.filter((b) => b.status === '已完结').sort((a, b) => b.hotWan - a.hotWan);
    case '新书榜':
      return arr.sort((a, b) => a.chapters - b.chapters);
    case '巅峰榜':
      return arr.sort(
        (a, b) => Number(b.badge === '巅峰榜') - Number(a.badge === '巅峰榜') || b.hotWan - a.hotWan,
      );
    default:
      return arr.sort((a, b) => b.rating - a.rating);
  }
}

export default function RankPage() {
  const { bindTap, bindBack } = useFanqieGestures();
  const [notOpenNode, showNotOpen] = useNotOpenToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const books = useFanqieStore((s) => s.books);
  const recordTaskAudit = useFanqieStore((s) => s.recordTaskAudit);

  const cat = searchParams.get('cat') || 'novel';
  const subs = cat === 'publish' ? RANK_SUBS_PUBLISH : RANK_SUBS_NOVEL;
  const sub = searchParams.get('sub') || subs[0];

  const selectCat = (id: string) =>
    setSearchParams((p) => { p.set('cat', id); p.delete('sub'); return p; }, { replace: true });
  const selectSub = (v: string) => {
    recordTaskAudit({ rankView: { category: cat, sub: v } });
    setSearchParams((p) => { p.set('sub', v); return p; }, { replace: true });
  };

  const pool = cat === 'publish'
    ? books.filter((b) => b.gender === 'publish')
    : books.filter((b) => b.gender !== 'publish');
  const list = sortRank(pool, sub);

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-card)">
      {/* ===== 头部:米金渐变 + 返回 + 金色调榜名 + 灰副标 ===== */}
      <div className="shrink-0"
        style={{ background: 'linear-gradient(180deg, #FBEED3, var(--app-c-brand-soft-alt) 45%, var(--app-c-bg-card))' }}>
        <div className="flex items-center h-11 px-1">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
            <IcBack size={22} className="text-(--app-c-text-primary)" />
          </button>
          <div className="flex-1 text-center text-[19px] font-bold text-[#B7770D] tracking-wide">
            《{sub}》
          </div>
          <div className="w-10" />
        </div>
        <div className="text-center text-[11px] text-[#A89B85] pb-2">根据实时阅读热度排行</div>
        {/* 一级类目tab */}
        <div className="flex items-center px-4 gap-5 pb-1">
          {RANK_CATS.map((c) => {
            const on = c.id === cat;
            return c.enabled ? (
              <button
                key={c.id}
                {...bindTap(
                  { kind: 'action', id: 'rank.cat.select.target' },
                  { params: { target: c.id }, onTrigger: () => selectCat(c.id) },
                )}
                className={`bg-transparent border-none cursor-pointer p-0 ${
                  on ? 'text-[16px] font-bold text-(--app-c-text-primary)' : 'text-[14px] text-(--app-c-text-secondary)'
                }`}
              >
                {c.label}
                <span className={`block h-0.5 w-4 mx-auto mt-0.5 rounded-full ${on ? 'bg-(--app-c-brand)' : 'bg-transparent'}`} />
              </button>
            ) : (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'rank.cat.disabled' }, { onTrigger: showNotOpen })}
                className="text-[14px] text-(--app-c-text-secondary) bg-transparent border-none cursor-pointer p-0"
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===== 左竖栏子榜 + 右榜单列表 ===== */}
      <div className="flex-1 flex overflow-hidden">
        <div className="w-20 shrink-0 bg-(--app-c-bg-fill-weak) overflow-y-auto">
          {subs.map((s) => {
            const on = s === sub;
            return (
              <button
                key={s}
                {...bindTap(
                  { kind: 'action', id: 'rank.sub.select.target' },
                  { params: { target: s }, onTrigger: () => selectSub(s) },
                )}
                className={`w-full h-12 text-[13px] border-none cursor-pointer ${
                  on ? 'bg-(--app-c-bg-card) text-(--app-c-brand) font-semibold' : 'bg-transparent text-(--app-c-text-regular)'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto" data-scroll-container="rank-list" data-scroll-direction="vertical">
          {list.map((b, i) => (
            <div
              key={b.id}
              {...bindTap('rank.bookdetail-open', { params: { id: b.id } })}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            >
              <span className={`w-5 shrink-0 text-center text-[15px] font-bold italic ${i < 3 ? 'text-(--app-c-brand)' : 'text-(--app-c-text-disabled)'}`}>
                {i + 1}
              </span>
              <BookCover book={b} className="w-11 h-[60px] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-(--app-c-text-primary) truncate">{b.title}</div>
                <div className="text-[11px] text-(--app-c-text-quaternary) truncate mt-1">
                  {cat === 'publish'
                    ? `${b.category}·${b.rating.toFixed(1)}分·${b.readersWan}万人读过`
                    : `${b.category}·${b.status}·${b.hotWan}万热度`}
                </div>
              </div>
            </div>
          ))}
          {list.length === 0 && <div className="text-center text-[13px] text-(--app-c-text-secondary) py-10">暂无上榜书籍</div>}
          <div className="h-3" />
        </div>
      </div>
      {notOpenNode}
    </div>
  );
}
