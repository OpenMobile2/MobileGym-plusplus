/** 搜索页(入口+结果)。spec: search.main。补拍 G1 */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, useToast } from '../components/ui';
import { PostCard } from '../components/PostCard';
import { IcNavBack, IcSearch, IcAI, IcArrowDown } from '../res/icons';

const RESULT_TABS = ['综合', '知识', '帖子', '用户'];

export default function SearchPage() {
  const { bindBack, bindTap } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') ?? '';

  const guess = useMeiyouStore((s) => s.searchGuess);
  const hot = useMeiyouStore((s) => s.searchHot);
  const posts = useMeiyouStore((s) => s.posts);
  const submitSearch = useMeiyouStore((s) => s.submitSearch);

  const [input, setInput] = React.useState(q);
  const [guessSeed, setGuessSeed] = React.useState(0);
  const [aiExpanded, setAiExpanded] = React.useState(false);

  const doSearch = (word: string) => {
    const w = word.trim();
    if (!w) return;
    submitSearch(w);
    setInput(w);
    setSp((p) => { p.set('q', w); return p; });
  };

  const shownGuess = [...guess].sort(() => 0).slice(guessSeed % 2, guessSeed % 2 + 4);
  const results = posts.filter((p) => !p.isAd && (q ? p.text.includes(q) : true));

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 顶栏搜索框 */}
      <div className="flex items-center h-12 px-2 gap-1 shrink-0">
        <button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcNavBack size={22} className="text-[#1A1A1A]" />
        </button>
        <div className="flex-1 flex items-center h-9 rounded-full bg-[#F2F2F4] px-3">
          <IcSearch size={16} className="text-[#999]" />
          <input
            {...bindTap({ kind: 'action' as const, id: 'search.query.input' }, { onTrigger: () => {} })}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="经期能吃芒果吗"
            className="flex-1 ml-2 bg-transparent border-none outline-none text-[14px] text-[#1A1A1A]"
          />
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'search.query.submit' }, { onTrigger: () => doSearch(input) })}
          className="px-3 h-9 text-[14px] bg-transparent border-none cursor-pointer"
          style={{ color: MY.primary }}
        >
          搜索
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-body" data-scroll-direction="vertical">
        {!q ? (
          <div className="px-4 py-2">
            {/* 猜你想搜 */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">猜你想搜</span>
              <button
                {...bindTap({ kind: 'action', id: 'search.guess.refresh' }, { onTrigger: () => setGuessSeed((s) => s + 1) })}
                className="text-[12px] text-[#999] bg-transparent border-none cursor-pointer"
              >
                换一换
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {shownGuess.map((w) => (
                <button
                  key={w}
                  {...bindTap({ kind: 'action', id: 'search.hotword.select.target' }, { params: { target: w }, onTrigger: () => doSearch(w) })}
                  className="h-9 rounded-lg bg-[#F7F7F9] text-[13px] text-[#666] border-none cursor-pointer truncate px-2"
                >
                  {w}
                </button>
              ))}
            </div>
            {/* 搜索热点 */}
            <div className="text-[14px] font-semibold text-[#1A1A1A] mt-5">搜索热点</div>
            <div className="mt-2">
              {hot.map((w, i) => (
                <button
                  key={w}
                  {...bindTap({ kind: 'action', id: 'search.hotword.select.target' }, { params: { target: w }, onTrigger: () => doSearch(w) })}
                  className="w-full flex items-center gap-3 h-10 bg-transparent border-none cursor-pointer text-left"
                >
                  <span className="text-[15px] font-bold w-4" style={{ color: i < 3 ? MY.primary : '#CCC' }}>{i + 1}</span>
                  <span className="text-[14px] text-[#1A1A1A]">{w}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* 结果 tab */}
            <div className="flex border-b border-[#EEE] px-2">
              {RESULT_TABS.map((t, i) => (
                <button
                  key={t}
                  {...(i === 0
                    ? {}
                    : bindTap({ kind: 'action', id: 'search.tab.disabled' }, { onTrigger: () => showToast(NOT_OPEN) }))}
                  className="px-3 h-10 bg-transparent border-none cursor-pointer text-[14px]"
                  style={{ color: i === 0 ? MY.primary : '#666', fontWeight: i === 0 ? 600 : 400 }}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* AI 搜索卡 */}
            <div className="m-3 rounded-xl p-3" style={{ border: '1px solid #E9D5F5', background: 'linear-gradient(135deg,#FFF5FB,#F6F0FF)' }}>
              <div className="flex items-center gap-1.5">
                <IcAI size={16} style={{ color: MY.ovulation }} />
                <span className="text-[13px] font-semibold" style={{ color: MY.ovulation }}>AI 生成</span>
              </div>
              <div className={`mt-2 text-[13px] text-[#444] leading-relaxed ${aiExpanded ? '' : 'line-clamp-3'}`}>
                关于「{q}」:每个人的身体情况不同,建议结合自身周期规律来判断。一般来说保持均衡饮食、规律作息有助于经期健康;
                如有明显不适或症状持续,应及时咨询专业医生。以上内容由 AI 综合社区经验生成,仅供参考,不能替代专业医疗诊断。
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'search.ai.expand.toggle' }, { onTrigger: () => setAiExpanded((v) => !v) })}
                className="mt-1 flex items-center text-[12px] bg-transparent border-none cursor-pointer"
                style={{ color: MY.ovulation }}
              >
                {aiExpanded ? '收起' : '查看更多'}<IcArrowDown size={13} />
              </button>
            </div>
            {/* 帖子结果 */}
            <div className="px-3 pb-4 flex flex-col gap-2.5">
              {results.map((p) => (
                <PostCard key={p.id} post={p} showToast={showToast} />
              ))}
            </div>
          </div>
        )}
      </div>
      {toast}
    </div>
  );
}
