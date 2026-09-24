import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { ArticleImage, LearningCover } from '../components/common';
import { IcArrowLeft, IcMail, IcSearch } from '../res/icons';

const TTABS = [
  { key: 'recommend', id: 'read.ttab.select.recommend', label: '推荐' },
  { key: 'journal', id: 'read.ttab.select.journal', label: '外刊' },
  { key: 'fiction', id: 'read.ttab.select.fiction', label: '互动小说' },
  { key: 'booktalk', id: 'read.ttab.select.booktalk', label: '英文讲书' },
  { key: 'school', id: 'read.ttab.select.school', label: '初高中' },
] as const;

const SURVEY = ['上班族', '大学生', '自由工作', '退休', '其他'];

export default function ReadHomePage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [ttab, setTtab] = useState('recommend');
  const [senior, setSenior] = useState(true);
  const [surveyOption, setSurveyOption] = useState('');
  const [minutes, setMinutes] = useState(15);
  const [query, setQuery] = useState('');
  const searchResults = st.articles.filter((article) => `${article.title}${article.titleCn}${article.tag}`.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()} className="p-1" aria-label="back"><IcArrowLeft size={20} color="#9AA5B1" /></button>
        <label className="flex flex-1 items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-1.5 text-xs text-[#9AA5B1]"><IcSearch size={14} color="#9AA5B1" /><input {...action('read.search.open', () => {}, { params: { value: query } })} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文章" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
        <button {...bindTap('read.unavailable.open', { params: { feature: '阅读消息中心' } })}><IcMail size={20} color="#9AA5B1" /></button>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 py-2 text-sm">
        {TTABS.map((t) => (
          <button key={t.key} {...action(t.id, () => setTtab(t.key))} className="shrink-0" style={{ color: ttab === t.key ? colors.readTeal : '#9AA5B1', fontWeight: ttab === t.key ? 700 : 400 }}>{t.label}</button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {query.trim() ? (
          <div className="mt-3">
            <div className="text-sm font-semibold text-[#33405C]">搜索结果 · {searchResults.length}</div>
            {searchResults.map((article) => (
              <button key={article.id} {...bindTap('read.article.open', { params: { articleId: article.id } })} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#F4FAF8] p-3 text-left">
                <ArticleImage id={article.id} label={article.title} className="h-16 w-20 shrink-0" />
                <div><div className="text-sm font-semibold text-[#33405C]">{article.titleCn}</div><div className="mt-1 text-xs text-[#9AA5B1]">{article.tag} · {article.wordCount} 词</div></div>
              </button>
            ))}
            {searchResults.length === 0 && <div className="py-12 text-center text-sm text-[#9AA5B1]">没有匹配的文章</div>}
          </div>
        ) : ttab === 'recommend' && (
          <>
            <div className="mt-2 flex items-center rounded-2xl bg-[#E6F4EF] p-3"><div><div className="font-bold text-[#2C7A6B]">MintDaily</div><div className="text-xs text-[#5B9A8C]">每天更新 · 科学分级</div></div><button {...bindTap('read.unavailable.open', { params: { feature: 'MintDaily 往期' } })} className="ml-auto text-xs text-[#2C7A6B]">往期 ≡</button></div>
            {st.articles.slice(0, 2).map((a) => (
              <div key={a.id} className="mt-3 overflow-hidden rounded-2xl bg-[#F4FAF8]">
                <ArticleImage id={a.id} label={a.title} className="h-40 w-full" rounded={0} />
                <div className="p-3">
                  <div className="text-sm font-semibold text-[#212121]">{a.titleCn}</div>
                  <div className="mt-0.5 text-xs text-[#9AA5B1]">{a.title}</div>
                  <div className="mt-1 flex gap-2 text-[10px] text-[#9AA5B1]"><span>📖 {a.wordCount}词</span><span>{a.level}</span><span>{a.tag}</span></div>
                  <button {...bindTap('read.article.open', { params: { articleId: a.id } })} className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-white" style={{ background: colors.readTeal }}>{s.startReading}</button>
                </div>
              </div>
            ))}
          </>
        )}
        {!query.trim() && ttab === 'journal' && (
          <div className="mt-3">
            <div className="rounded-2xl bg-[#F2F3F5] p-3 text-sm text-[#33405C]">👋 Hi,同学!接下来花费15s定制专属外刊学习计划吧~</div>
            <div className="mt-3 text-sm text-[#33405C]">请问您现在是什么工作呢?</div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {SURVEY.map((option) => (
                <button key={option} {...action('read.survey.answer', () => setSurveyOption(option), { params: { option } })} className="rounded-xl border py-3 text-sm" style={{ borderColor: surveyOption === option ? colors.readTeal : '#E4E7EC', background: surveyOption === option ? '#E6F4EF' : '#fff', color: surveyOption === option ? colors.readTeal : '#33405C' }}>{option}</button>
              ))}
            </div>
            {surveyOption && (
              <div className="mt-5 rounded-2xl bg-[#F4FAF8] p-4">
                <div className="text-sm font-semibold text-[#33405C]">{s.dailyMinutes}</div>
                <div className="mt-3 flex gap-2">
                  {[10, 15, 20].map((value) => (
                    <button key={value} {...action('read.survey.minutes.select', () => setMinutes(value), { params: { minutes: value } })} className="flex-1 rounded-full py-2 text-sm" style={{ background: minutes === value ? colors.readTeal : '#fff', color: minutes === value ? '#fff' : '#5B6B85' }}>{value} 分钟</button>
                  ))}
                </div>
                <div className="mt-3 text-xs leading-5 text-[#7B88A0]">根据“{surveyOption}”和每日 {minutes} 分钟，为你安排 7 天、3 篇外刊精读。</div>
                <button {...bindTap('read.plan.generate', { params: { option: surveyOption, minutes }, beforeTrigger: () => st.generateReadPlan(surveyOption, minutes) })} className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: colors.readTeal }}>{s.generatePlan}</button>
              </div>
            )}
          </div>
        )}
        {!query.trim() && ttab === 'fiction' && (
          <div className="mt-3">
            <div className="rounded-2xl bg-[#2C3E50] p-4 text-white"><div className="text-lg font-bold">化身主角,改写剧情</div></div>
            <div className="mt-3 flex flex-wrap gap-2">{['名著', '短篇', '悬疑', '小说'].map((category) => <span key={category} className="rounded-full bg-[#F2F3F5] px-3 py-1 text-xs text-[#9AA5B1]">{category}</span>)}</div>
            <LearningCover id="interactive-fiction" title="互动小说内容筹备中" subtitle="开放后可选择剧情分支" icon="📚" className="mt-3 h-40 w-full rounded-2xl opacity-80" />
          </div>
        )}
        {!query.trim() && ttab === 'booktalk' && (
          <div className="mt-3">
            <div className="text-lg font-bold text-[#33405C]">每天10分钟,讲透全球社科好书</div>
            {['Day1-7 狗屁工作', 'Day8-14 工作、消费主义和新穷人', 'Day15-21 精英的傲慢'].map((title, index) => (
              <div key={title} className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-[#F4F6F9] p-3 text-left"><LearningCover id={`booktalk-${index}`} title={title} icon="📖" compact className="h-14 w-10 rounded" /><div><span className="text-sm text-[#33405C]">{title}</span><div className="text-[10px] text-[#9AA5B1]">音频内容筹备中</div></div></div>
            ))}
          </div>
        )}
        {!query.trim() && ttab === 'school' && (
          <div className="mt-3">
            <div className="flex items-center rounded-2xl bg-[#E6F4EF] p-4"><div><div className="font-bold text-[#2C7A6B]">薄荷 · 分级阅读</div><div className="text-xs text-[#5B9A8C]">Mint your mind</div></div>
              <button {...action('read.school.switch', () => setSenior((v) => !v))} className="ml-auto rounded-full bg-white px-3 py-1 text-xs text-[#2C7A6B]">切换至{senior ? '初中' : '高中'} ⇄</button></div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">{[['4000+', '真题题源'], ['200+', '双语书籍'], ['1200+', '考点讲解']].map(([n, l]) => <div key={l}><div className="text-lg font-bold text-[#2C7A6B]">{n}</div><div className="text-[10px] text-[#9AA5B1]">{l}</div></div>)}</div>
            {st.articles.slice(2, 3).map((a) => (
              <div key={a.id} className="mt-3 overflow-hidden rounded-2xl bg-[#F4FAF8]">
                <ArticleImage id={a.id} label={a.title} className="h-32 w-full" rounded={0} />
                <div className="p-3"><div className="text-sm font-semibold text-[#212121]">{a.titleCn}</div>
                  <button {...bindTap('read.article.open', { params: { articleId: a.id } })} className="mt-2 w-full rounded-full py-2.5 text-sm font-semibold text-white" style={{ background: colors.readTeal }}>{s.startReading}</button></div>
              </div>
            ))}
          </div>
        )}
        <button {...bindTap('read.unavailable.open', { params: { feature: '新用户 VIP 特权' } })} className="mt-4 w-full rounded-full bg-[#FBF0D8] py-2 text-xs text-[#8A6A2A]">新用户免费领VIP特权,仅限今日 · 立即领取</button>
      </div>
    </div>
  );
}
