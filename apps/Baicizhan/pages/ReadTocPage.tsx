import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArticleImage, PageHeader } from '../components/common';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { useBaicizhanStore } from '../state';
import { IcChevronRight } from '../res/icons';

export default function ReadTocPage() {
  const s = useStrings();
  const { bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const currentId = sp.get('articleId');

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.articleCollection} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-[#E6F4EF] p-3 text-xs leading-5 text-[#2C7A6B]">选择另一篇即可切集，字号和朗读控制会在新文章中重新开始。</div>
        {st.articles.map((article, index) => {
          const active = article.id === currentId;
          return (
            <button key={article.id} {...bindTap('read.toc.article.open', { params: { articleId: article.id }, nav: { mode: 'replace' } })} className="mt-3 flex w-full items-center gap-3 rounded-2xl border p-3 text-left" style={{ borderColor: active ? '#2C7A6B' : '#EEF0F4', background: active ? '#F4FAF8' : '#fff' }}>
              <ArticleImage id={article.id} label={article.title} className="h-20 w-24 shrink-0" rounded={12} />
              <div className="min-w-0 flex-1"><div className="text-[10px] text-[#9AA5B1]">第 {index + 1} 集 {active ? '· 当前阅读' : ''}</div><div className="mt-1 line-clamp-2 text-sm font-semibold text-[#33405C]">{article.titleCn}</div><div className="mt-1 text-[10px] text-[#9AA5B1]">{article.wordCount} 词 · {article.level}</div></div>
              <IcChevronRight size={16} color="#C9CDD3" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
