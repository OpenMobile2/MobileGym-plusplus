import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { ArticleImage } from '../components/common';
import { IcSearch } from '../res/icons';

const SHELF_TABS = [
  { key: 'default', id: 'read.shelf.select.default', label: '默认' },
  { key: 'books', id: 'read.shelf.select.books', label: '书籍' },
  { key: 'articles', id: 'read.shelf.select.articles', label: '文章' },
  { key: 'challenge', id: 'read.shelf.select.challenge', label: '挑战' },
] as const;

export default function ReadMinePage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [tab, setTab] = useState('default');
  const [query, setQuery] = useState('');
  const recommendationIds = st.articles.filter((article) => !st.shelf.includes(article.id)).map((article) => article.id);
  const [picked, setPicked] = useState<Record<string, boolean>>(() => Object.fromEntries(st.articles.map((article) => [article.id, true])));

  const tabIds = tab === 'articles'
    ? st.readArticleIds
    : tab === 'challenge'
      ? []
      : st.shelf;
  const visibleArticles = st.articles.filter((article) => tabIds.includes(article.id)
    && `${article.title}${article.titleCn}${article.tag}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-4 pt-12">
        <div className="flex flex-1 gap-4 text-sm">
          {SHELF_TABS.map((t) => (
            <button key={t.key} {...action(t.id, () => setTab(t.key))} style={{ color: tab === t.key ? colors.readTeal : '#9AA5B1', fontWeight: tab === t.key ? 700 : 400 }}>{t.label}</button>
          ))}
        </div>
        <label className="flex max-w-32 items-center gap-1 rounded-full bg-[#F2F3F5] px-2 py-1 text-[#9AA5B1]">
          <IcSearch size={13} color="#9AA5B1" />
          <input {...action('read.mine.search', () => {}, { params: { value: query } })} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜书架" className="min-w-0 flex-1 bg-transparent text-xs outline-none" />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {visibleArticles.length ? (
          <div className={tab === 'articles' ? 'mt-4' : 'mt-4 grid grid-cols-3 gap-3'}>
            {visibleArticles.map((article) => tab === 'articles' ? (
              <button key={article.id} {...bindTap('read.mine.book.open', { params: { articleId: article.id } })} className="mb-3 flex w-full items-center gap-3 text-left">
                <ArticleImage id={article.id} label={article.title} className="h-20 w-28" />
                <div><div className="text-sm font-semibold text-[#212121]">{article.titleCn}</div><div className="mt-1 text-xs text-[#2C7A6B]">已读完 ✓</div></div>
              </button>
            ) : (
              <button key={article.id} {...bindTap('read.mine.book.open', { params: { articleId: article.id } })} className="text-left">
                <ArticleImage id={article.id} label={article.title} className="h-28 w-full" />
                <div className="mt-1 line-clamp-2 text-xs text-[#33405C]">{article.titleCn}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-10 flex flex-col items-center">
            <div className="text-4xl opacity-40">📦</div>
            <div className="mt-3 text-sm text-[#9AA5B1]">{query ? '没有匹配内容' : tab === 'challenge' ? '暂时没有阅读挑战' : '喜欢的书籍、收藏的文章'}</div>
            {!query && tab !== 'challenge' && <div className="text-sm text-[#9AA5B1]">都会放在我读这里啦,查阅更方便哦</div>}
            <button {...bindTap('read.mine.explore')} className="mt-4 rounded-full px-8 py-2.5 text-sm font-semibold text-white" style={{ background: colors.readTeal }}>去找书</button>
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-[#F4F6F9] p-4">
          <div className="text-sm font-bold text-[#33405C]">为你推荐</div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {st.articles.filter((article) => recommendationIds.includes(article.id)).map((article) => (
              <button key={article.id} {...action('read.mine.pick', () => setPicked((p) => ({ ...p, [article.id]: !p[article.id] })), { params: { bookId: article.id } })} className="relative text-left">
                <ArticleImage id={article.id} label={article.title} className="h-24 w-full" />
                {picked[article.id] && <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#2C7A6B] text-xs text-white">✓</span>}
                <div className="mt-1 line-clamp-1 text-xs text-[#33405C]">{article.titleCn}</div>
              </button>
            ))}
          </div>
          {recommendationIds.length > 0 && <button {...action('read.mine.addall', () => { st.addToShelf(recommendationIds.filter((id) => picked[id])); st.showToast('已加入书架'); })}
            className="mt-3 w-full rounded-full py-2.5 text-sm font-semibold text-white" style={{ background: colors.readTeal }}>{s.oneClickAddRead}</button>}
        </div>
      </div>
    </div>
  );
}
