import React, { useState } from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import { IcSearch, IcClose, IcArrowRight } from '../res/icons';

/** 关键词联想 ×8(确定性模板,证据 n02「减脂」系列) */
function suggestionsOf(term: string): string[] {
  return [
    `腹部${term}燃脂`,
    `${term}燃脂全身`,
    `${term}全身免费`,
    `${term}燃脂男生`,
    `突击${term}训练`,
    `肚子${term}`,
    `下腹小肚子${term}`,
    `${term}平台期突破`,
  ];
}

/** 搜索中间页 —— 证据 n02 */
export default function CourseSearchPage() {
  const { bindTap, go, exitSearch } = useKeepGestures();
  const s = useKeepStrings();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const coaches = useKeepStore((st) => st.coaches);
  const searchState = useKeepStore((st) => st.searchState);
  const searchCommit = useKeepStore((st) => st.searchCommit);
  const savedTerm = useKeepStore((st) => st.current.searchTerm) ?? '';
  const [term, setTerm] = useState(savedTerm);

  const suggestions = term.trim() ? suggestionsOf(term.trim()) : [];

  const submit = (t: string, fromKeyboard: boolean) => {
    const v = t.trim();
    if (!v) return;
    searchCommit(v);
    if (fromKeyboard) go('search.results.open.fromKeyboard');
    else go('search.results.open');
  };

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      {/* 顶部搜索输入框 + AI + 取消 */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-2 shrink-0">
        <div className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-full" style={{ background: '#F2F3F6' }}>
          <IcSearch size={18} className="text-app-text-muted shrink-0" />
          <input
            data-action="course.search.input.type"
            data-action-type="input"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit(term, true);
            }}
            placeholder={searchState.hotwords[0]}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-[14px] text-app-text"
          />
          {term && (
            <button
              {...bindTap(
                { kind: 'action', id: 'course.search.clear' },
                { onTrigger: () => setTerm('') },
              )}
              className="shrink-0 w-4.5 h-4.5 rounded-full flex items-center justify-center border-none text-white"
              style={{ background: '#C6C9D0' }}
              aria-label="清空"
            >
              <IcClose size={12} />
            </button>
          )}
          <button
            {...bindTap({ kind: 'action', id: 'course.search.ai.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
            className="shrink-0 w-6 h-6 rounded-full border-none"
            style={{ background: 'conic-gradient(from 20deg, #7A5AF8, #B5A2FF, #7A5AF8)' }}
            aria-label="AI搜索"
          />
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'course.search.cancel' }, { onTrigger: () => exitSearch() })}
          className="shrink-0 bg-transparent border-none text-[15px] text-app-text px-1"
        >
          {s.cancel}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {term.trim() ? (
          <>
            {/* 点击搜索 */}
            <button
              {...bindTap('search.results.open', { params: { term }, beforeTrigger: () => searchCommit(term) })}
              className="flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none text-left"
            >
              <IcSearch size={16} className="text-app-text-muted" />
              <span className="text-[15px] text-app-text-muted">
                点击搜索 <span style={{ color: C.green }}>{term.trim()}</span>
              </span>
            </button>
            {/* 联想 ×3 */}
            {suggestions.slice(0, 3).map((sg) => (
              <button
                key={sg}
                {...bindTap('search.results.open', { params: { term: sg }, beforeTrigger: () => searchCommit(sg) })}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none text-left border-b border-app-border"
              >
                <IcSearch size={16} className="text-app-text-muted" />
                <span className="text-[15px] text-app-text">{sg}</span>
              </button>
            ))}
            {/* 账号结果：仅真实命中，禁止静默落到固定账号 */}
            {(() => {
              const q = term.trim();
              const matched = coaches.find((c) => c.name.includes(q) || q.includes(c.name));
              if (!matched) return null;
              return (
            <button
              {...bindTap('coach.profile.open.fromSearch', {
                params: { coachId: matched.id },
                beforeTrigger: () => setCurrent('coachId', matched.id),
              })}
              className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-left border-b border-app-border"
            >
              <Img id={matched.avatar} className="w-11 h-11 rounded-full object-cover shrink-0" alt={matched.name} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-app-text">
                  {matched.name}
                </div>
                <div className="text-[12px] text-app-text-muted mt-0.5">账号 · {matched.fans} 粉丝</div>
              </div>
            </button>
              );
            })()}
            {/* 话题结果 */}
            <button
              {...bindTap({ kind: 'action', id: 'course.search.topic.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
              className="flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none text-left border-b border-app-border"
            >
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] shrink-0" style={{ background: '#4C8DF6' }}>
                #
              </span>
              <span className="flex-1 text-[15px] text-app-text truncate">
                <span style={{ color: C.green }}>{term.trim()}</span>平台期该怎么破?
                <span className="ml-1.5 px-1 py-0.5 rounded text-[10px] border align-middle" style={{ color: C.greenDeep, borderColor: C.green }}>
                  官方
                </span>
              </span>
              <span className="text-[12px] text-app-text-muted shrink-0">4.8 万人围观</span>
              <IcArrowRight size={14} className="text-app-text-muted shrink-0" />
            </button>
            {/* 联想 ×5 */}
            {suggestions.slice(3).map((sg) => (
              <button
                key={sg}
                {...bindTap('search.results.open', { params: { term: sg }, beforeTrigger: () => searchCommit(sg) })}
                className="flex items-center gap-3 w-full px-4 py-3.5 bg-transparent border-none text-left border-b border-app-border"
              >
                <IcSearch size={16} className="text-app-text-muted" />
                <span className="text-[15px] text-app-text">{sg}</span>
              </button>
            ))}
          </>
        ) : (
          <>
            {/* 最近搜索 */}
            <div className="px-4 pt-2 text-[15px] font-semibold text-app-text">最近搜索</div>
            <div className="flex flex-wrap gap-2 px-4 pt-2">
              {searchState.recents.map((r) => (
                <button
                  key={r}
                  {...bindTap('search.results.open', { params: { term: r }, beforeTrigger: () => searchCommit(r) })}
                  className="px-3 py-1.5 rounded-full text-[13px] border-none"
                  style={{ background: '#F2F3F6', color: '#444' }}
                >
                  {r}
                </button>
              ))}
            </div>
            {/* 热门搜索 */}
            <div className="px-4 pt-5 text-[15px] font-semibold text-app-text">热门搜索</div>
            <div className="flex flex-col pt-1">
              {searchState.hotwords.map((h, i) => (
                <button
                  key={h}
                  {...bindTap('search.results.open', { params: { term: h }, beforeTrigger: () => searchCommit(h) })}
                  className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none text-left"
                >
                  <span className="w-5 text-[14px] font-bold" style={{ color: i < 3 ? '#F4526A' : '#B0B4BC' }}>{i + 1}</span>
                  <span className="text-[14px] text-app-text">{h}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
