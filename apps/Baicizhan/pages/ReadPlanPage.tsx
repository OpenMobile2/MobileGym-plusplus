import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArticleImage, PageHeader } from '../components/common';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { useBaicizhanStore } from '../state';
import { IcChevronRight } from '../res/icons';

export default function ReadPlanPage() {
  const s = useStrings();
  const { bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const option = st.readPlan?.option ?? sp.get('option') ?? '英语学习者';
  const minutes = st.readPlan?.minutes ?? Number(sp.get('minutes') ?? 15);
  const articles = (st.readPlan?.articleIds ?? st.articles.map((article) => article.id))
    .map((id) => st.articles.find((article) => article.id === id))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));

  return (
    <div className="flex h-full flex-col bg-[#F4FAF8]" data-status-bar-foreground="dark">
      <PageHeader title={s.planTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="overflow-hidden rounded-3xl bg-[#2C7A6B] p-5 text-white shadow-sm">
          <div className="text-xs text-white/70">计划已生成 · {option}</div>
          <div className="mt-2 text-xl font-bold">{s.planGoal}</div>
          <div className="mt-4 flex gap-5 text-xs text-white/80"><span>每天 {minutes} 分钟</span><span>3 篇文章</span><span>约 35 个核心词</span></div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[8%] rounded-full bg-white" /></div>
          <div className="mt-2 text-[10px] text-white/65">第 1 天 · 从今天的文章开始</div>
        </div>

        <div className="mt-5 text-base font-bold text-[#33405C]">{s.todayLearning}</div>
        <div className="mt-3 overflow-hidden rounded-2xl bg-white shadow-sm">
          {articles.map((article, index) => (
            <button key={article.id} {...bindTap('read.plan.article.open', { params: { articleId: article.id } })} className="flex w-full items-center gap-3 border-b border-[#EEF2F0] p-3 text-left last:border-0">
              <ArticleImage id={article.id} label={article.title} className="h-16 w-20 shrink-0" rounded={10} />
              <div className="min-w-0 flex-1"><div className="text-[10px] font-semibold" style={{ color: colors.readTeal }}>DAY {index * 2 + 1}</div><div className="line-clamp-2 text-sm font-semibold text-[#33405C]">{article.titleCn}</div><div className="mt-1 text-[10px] text-[#9AA5B1]">{article.wordCount} 词 · {article.level}</div></div>
              <IcChevronRight size={16} color="#C9CDD3" />
            </button>
          ))}
        </div>

        {articles[0] && <button {...bindTap('read.plan.article.open', { params: { articleId: articles[0].id } })} className="mt-5 w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: colors.readTeal }}>开始第 1 天</button>}
      </div>
    </div>
  );
}
