import React, { useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, fmtCount } from '../components/ui';
import { IcBack, IcClose, IcCamera, IcMic, IcTrash, IcRefresh, IcClock } from '../res/icons';

export default function SearchLandingPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  const history = useWeiboStore((st) => st.searchHistory);
  const hotWords = useWeiboStore((st) => st.hotWords);
  const users = useWeiboStore((st) => st.users);
  const clearSearchHistory = useWeiboStore((st) => st.clearSearchHistory);
  const submitSearch = useWeiboStore((st) => st.submitSearch);

  const [kw, setKw] = useState('');
  const suggestions = kw
    ? {
        history: history.filter((h) => h.includes(kw)),
        hot: hotWords.filter((h) => h.word.includes(kw)).slice(0, 2),
        words: [`${kw}台风`, `${kw}最新路径`, `${kw}实时`].filter(() => kw.length > 0),
        users: users.filter((u) => u.name.toLowerCase().includes(kw.toLowerCase())).slice(0, 2),
      }
    : null;

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* 搜索框 */}
      <div className="flex items-center gap-2 px-2 h-12 shrink-0">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[#1A1A1A] p-1"><IcBack size={22} /></button>
        <div className="flex-1 flex items-center gap-1 h-9 bg-[#F5F5F5] rounded-full px-3">
          <input
            autoFocus
            value={kw}
            onChange={(e) => setKw(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && kw.trim()) { submitSearch(kw.trim()); } }}
            placeholder=""
            data-action="search.input.type"
            data-action-type="input"
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
          />
          {kw && (
            <button onClick={() => setKw('')} className="bg-transparent border-none cursor-pointer text-[#BBBBBB]">
              <IcClose size={15} />
            </button>
          )}
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'search.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#7F7F7F]"
        >
          <IcCamera size={19} />
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'search.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="bg-transparent border-none cursor-pointer text-[#7F7F7F]"
        >
          <IcMic size={19} />
        </button>
        <button
          {...bindTap('search.submit-open', { params: { q: kw.trim() || (hotWords[0]?.word ?? '') }, beforeTrigger: () => submitSearch(kw.trim() || (hotWords[0]?.word ?? '')) })}
          className="h-8 px-3 rounded-full bg-[#FF8200] text-white text-[13px] border-none cursor-pointer shrink-0"
        >
          {s.search}
        </button>
      </div>

      {/* 智搜开关行 */}
      <div className="flex items-center gap-2 px-4 pb-2 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'search.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
          className="flex items-center gap-1 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2 py-1 border-none cursor-pointer"
        >
          <span className="w-6 h-3.5 rounded-full bg-[#DDDDDD] relative"><span className="absolute left-0.5 top-0.5 w-2.5 h-2.5 rounded-full bg-white" /></span>
          智搜
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {!suggestions ? (
          <>
            {/* 搜索历史 */}
            {history.length > 0 && (
              <div className="px-4 mt-1">
                <div className="flex items-center mb-2">
                  <span className="text-[14px] font-bold text-[#1A1A1A]">搜索历史</span>
                  <span className="text-[13px] text-[#BBBBBB] mx-2">|</span>
                  <span className="text-[14px] text-[#7F7F7F]">热搜历史</span>
                  <span className="flex-1" />
                  <button
                    {...bindTap({ kind: 'action', id: 'search.history.clear' }, { onTrigger: () => clearSearchHistory() })}
                    className="bg-transparent border-none cursor-pointer text-[#9A9A9A]"
                  >
                    <IcTrash size={15} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button
                      key={h}
                      {...bindTap('search.history-open', { params: { q: h }, beforeTrigger: () => submitSearch(h) })}
                      className="text-[13px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-3 py-1.5 border-none cursor-pointer max-w-[150px] truncate"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* 猜你想搜 */}
            <div className="px-4 mt-4">
              <div className="flex items-center mb-1">
                <span className="text-[14px] font-bold text-[#1A1A1A]">猜你想搜</span>
                <span className="flex-1" />
                <IcRefresh size={14} className="text-[#9A9A9A]" />
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                {hotWords.slice(0, 10).map((h) => (
                  <button
                    key={h.word}
                    {...bindTap('search.hotword-open', { params: { q: h.topic ? `#${h.word}#` : h.word }, beforeTrigger: () => submitSearch(h.word) })}
                    className="flex items-center gap-1.5 py-2 bg-transparent border-none cursor-pointer text-left min-w-0"
                  >
                    <span className="text-[14px] text-[#1A1A1A] truncate">{h.word}</span>
                    {h.tag === '热' && <span className="text-[9px] rounded px-1 leading-4 bg-[#FF8200] text-white shrink-0">热</span>}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* 联想列表 */
          <div>
            {suggestions.history.map((h) => (
              <button
                key={`h-${h}`}
                {...bindTap('search.submit-open', { params: { q: h }, beforeTrigger: () => submitSearch(h) })}
                className="flex items-center gap-2.5 w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
              >
                <IcClock size={16} className="text-[#BBBBBB] shrink-0" />
                <span className="text-[14px] text-[#1A1A1A] truncate">{h}</span>
              </button>
            ))}
            {suggestions.hot.map((h) => (
              <button
                key={`hot-${h.word}`}
                {...bindTap('search.submit-open', { params: { q: h.topic ? `#${h.word}#` : h.word }, beforeTrigger: () => submitSearch(h.word) })}
                className="flex items-center gap-2.5 w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
              >
                <span className="text-[15px]">🔥</span>
                <span className="text-[14px] text-[#E68A3C] truncate">{h.word}</span>
                <span className="flex-1" />
                <span className="text-[9px] rounded px-1 leading-4 bg-[#FF8200] text-white shrink-0">热搜</span>
              </button>
            ))}
            {suggestions.words.map((w) => (
              <button
                key={`w-${w}`}
                {...bindTap('search.submit-open', { params: { q: w }, beforeTrigger: () => submitSearch(w) })}
                className="flex items-center gap-2.5 w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
              >
                <span className="text-[#BBBBBB]">🔍</span>
                <span className="text-[14px] text-[#1A1A1A] truncate">{w}</span>
              </button>
            ))}
            {suggestions.users.map((u) => (
              <button
                key={`u-${u.id}`}
                {...bindTap('search.suggestUser-open', { params: { id: u.id } })}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
              >
                <Img src={u.avatar} label={u.name[0]} className="w-9 h-9 rounded-full object-cover shrink-0" />
                <span className="text-[14px] text-[#E68A3C]">{u.name}</span>
                <span className="flex-1" />
                <span className="text-[12px] text-[#9A9A9A]">粉丝: {fmtCount(u.fans)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {toastNode}
    </div>
  );
}
