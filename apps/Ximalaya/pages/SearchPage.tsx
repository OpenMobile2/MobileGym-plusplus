import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, VipTag, wontfix } from '../components/ui';
import { IcNavBack, IcSearch, IcClose, IcSparkles, IcTrash, IcPlay } from '../res/icons';
import { matchAlbumByKeyword, sortAlbumsByRelevance } from '../utils/search';

export function SearchPage() {
  const { bindTap, bindBack } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const [sp] = useSearchParams();
  const albums = useXimalayaStore((st) => st.albums);
  const hotSearch = useXimalayaStore((st) => st.hotSearch);
  const searchHistory = useXimalayaStore((st) => st.searchHistory);
  const playTrack = useXimalayaStore((st) => st.playTrack);
  const addSearchHistory = useXimalayaStore((st) => st.addSearchHistory);
  const clearSearchHistory = useXimalayaStore((st) => st.clearSearchHistory);

  const [q, setQ] = useState('');
  // 联想态:URL 无对应 transition,由输入内容本地驱动
  const suggesting = sp.get('mode') === 'suggest' || q.trim().length > 0;
  const kw = q.trim();

  // 使用统一搜索工具(支持拼音首字母 + 多关键词)
  const matchAlbums = kw
    ? sortAlbumsByRelevance(albums.filter((a) => matchAlbumByKeyword(a, kw)), kw)
    : [];
  const directAlbum = matchAlbums[0] ?? null;
  // 联想词:去重的前 6 个匹配专辑标题 + 拓展词
  const suggestWords = kw
    ? [
        ...matchAlbums.slice(0, 6).map((a) => a.title),
        `${q.trim()} 全集`, `${q.trim()} 免费专辑`, `${q.trim()} 主播`,
      ].filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 10)
    : [];

  const history = searchHistory;
  const submitSearch = (word: string) => { if (word.trim()) addSearchHistory(word.trim()); };

  return (
    <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
      {/* 顶栏:返回 + 搜索框 + 红搜索键 */}
      <div className="shrink-0 flex items-center gap-2 px-2 h-12">
        <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center text-[#333]">
          <IcNavBack size={26} />
        </button>
        <div className="flex-1 h-8 bg-[#F5F5F5] rounded-full flex items-center px-3 gap-1.5">
          <IcSearch size={16} className="text-[#999]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={s.search_placeholder}
            data-action="search.input.input"
            data-action-type="input"
            data-action-params={JSON.stringify({ value: q })}
            className="flex-1 bg-transparent text-[13px] text-[#333] outline-none"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="清除" className="text-[#BBB]">
              <IcClose size={15} />
            </button>
          )}
          <button
            {...bindTap({ kind: 'action', id: 'search.ai.wontfix' }, { onTrigger: wontfix })}
            aria-label="AI荐书"
            className="text-[#FE4543]"
          >
            <IcSparkles size={16} />
          </button>
        </div>
        <button
          {...bindTap('search.submit', { params: { q: q.trim() }, beforeTrigger: () => submitSearch(q) })}
          className="shrink-0 text-[14px] text-white bg-[#FE4543] rounded-full px-3.5 py-1.5"
        >
          {s.search}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {suggesting ? (
          /* —— 联想态 search.suggest —— */
          <div className="px-3 py-2">
            {directAlbum && (
              <div className="flex items-center gap-3 py-2.5 border-b border-[#F2F2F2]">
                <Img src={directAlbum.cover} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-[#FE4543]">搜索「{q.trim() || directAlbum.title}」</div>
                  <div className="text-[14px] text-[#333] font-medium truncate">{directAlbum.title}</div>
                  <div className="text-[11px] text-[#999] truncate">{directAlbum.anchorName} · {directAlbum.category}</div>
                </div>
                <button
                  {...bindTap('suggest.play', { beforeTrigger: () => { submitSearch(q.trim() || directAlbum.title); playTrack(directAlbum.id, directAlbum.trackIds[0]); } })}
                  className="shrink-0 w-9 h-9 rounded-full bg-[#FE4543] flex items-center justify-center text-white"
                  aria-label="播放"
                >
                  <IcPlay size={18} />
                </button>
              </div>
            )}
            {matchAlbums.length > 1 && (
              <div className="text-[12px] text-[#BBB] py-2">找到 {matchAlbums.length} 个相关专辑</div>
            )}
            {suggestWords.map((w) => (
              <div key={w} {...bindTap('search.result-open', { params: { q: w }, beforeTrigger: () => submitSearch(w) })} className="flex items-center gap-2 py-3 border-b border-[#F7F7F7]">
                <IcSearch size={16} className="text-[#BBB]" />
                <span className="flex-1 text-[14px] text-[#333] truncate">{w}</span>
              </div>
            ))}
            {kw && matchAlbums.length === 0 && (
              <div className="py-8 text-center text-[13px] text-[#999]">没有找到与「{q.trim()}」相关的内容</div>
            )}
            <button
              {...bindTap({ kind: 'action', id: 'suggest.ai.wontfix' }, { onTrigger: wontfix })}
              className="mt-3 w-full flex items-center gap-2 bg-[#FFF6F5] rounded-lg px-3 py-2.5 text-[13px] text-[#FE4543]"
            >
              <IcSparkles size={16} /> 让小雅 Ai 帮你找内容
            </button>
          </div>
        ) : (
          /* —— 入口态 search.entry —— */
          <div className="px-3 py-2">
            {/* 搜索历史 */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#333]">{s.search_history}</span>
              <button
                {...bindTap({ kind: 'action', id: 'search.clearhistory.tap' }, { onTrigger: () => clearSearchHistory() })}
                aria-label="清空搜索历史"
                className="text-[#BBB]"
              >
                <IcTrash size={16} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {history.length === 0 ? (
                <span className="text-[13px] text-[#BBB] py-1">暂无搜索历史</span>
              ) : (
                history.map((h) => (
                  <button key={h} {...bindTap('search.result-open', { params: { q: h }, beforeTrigger: () => submitSearch(h) })} className="px-3 py-1.5 rounded-full bg-[#F5F5F5] text-[13px] text-[#666]">
                    {h}
                  </button>
                ))
              )}
            </div>

            {/* 推荐搜索 / 热搜榜 */}
            <div className="mt-5 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#333]">{s.search_hot}</span>
            </div>
            <div className="mt-2 flex flex-col">
              {hotSearch.map((h, i) => (
                <button key={h} {...bindTap('search.result-open', { params: { q: h }, beforeTrigger: () => submitSearch(h) })} className="flex items-center gap-3 py-2.5 border-b border-[#F7F7F7] text-left">
                  <span className={'w-5 text-center text-[14px] font-semibold ' + (i < 3 ? 'text-[#FE4543]' : 'text-[#BBB]')}>{i + 1}</span>
                  <span className="flex-1 text-[14px] text-[#333] truncate">{h}</span>
                  {i < 2 && <VipTag label="热" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
