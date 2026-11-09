// 搜索联想(输入即时联想)。节点 search.suggest(spec v1.0.0,6 条交互)。
// 视觉证据:f_013(输入「kua」拼音联想:系列词条 = 缩略图 + 前缀红字 +「系列」灰标 +「共3部作品」;
// AI 词条 = 纯文本 + 绿色「AI搜索」标;其余为纯文本词条,前缀命中字红色)、
// f_014(输入「快」汉字联想:多一条带「电影」标的作品词条,副行「2016 林更新 张静初」)。
//
// 口径:本页是 hub 的 overlay 态(同一个搜索框),spec 把它单列成路由 /search/suggest。
// 清除 × 的 stateChange 是「清空输入,联想消失,回到 hub 界面」——本实现 = 清 store + 退回上一页。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { HighlightText, SearchTopBar, searchHasMatch } from '../components/search';
import { TvImg } from '../components/Img';
import { EmptyState } from '../components/ui';
import type { TvContent, TvSearchSuggest } from '../types';

/** 结构性标签(spec 未给种子,证据 f_013/f_014 逐字抄录) */
/** 联想类型口径(与 defaults.searchHub.suggests[].type 对齐) */
const TYPE_SERIES = '系列';
const TYPE_AI = 'AI搜索';
const TYPE_WORK = '作品';

export default function SearchSuggestPage() {
  const { bindTap, bindBack, go, back } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const searchHub = useTencentvideoStore((s) => s.searchHub);
  const contents = useTencentvideoStore((s) => s.contents);
  const series = useTencentvideoStore((s) => s.series);
  const search = useTencentvideoStore((s) => s.search);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);

  const toast = useTencentvideoStore((s) => s.toast);
  const setSearchInput = useTencentvideoStore((s) => s.setSearchInput);
  const submitSearch = useTencentvideoStore((s) => s.submitSearch);
  const clearSearchInput = useTencentvideoStore((s) => s.clearSearchInput);

  const word = search.input.trim();

  /**
   * 联想列表:优先命中种子 searchHub.suggests(键为拼音,如 douxuan);
   * 命中不了就按内容库现算(作品/人物),并补一条以原词为文本的 AI 搜索条 ——
   * 真机 f_013/f_014 的 AI 条永远跟着当前输入走。
   */
  const entries = useMemo<TvSearchSuggest[]>(() => {
    if (!word) return [];
    const key = word.toLowerCase();
    const seededKey = Object.keys(searchHub.suggests).find(
      (k) => k === key || k.startsWith(key) || key.startsWith(k),
    );
    if (seededKey) return searchHub.suggests[seededKey];

    const works: TvSearchSuggest[] = contents
      .filter((c) => c.title.toLowerCase().includes(key))
      .slice(0, 6)
      .map((c) => ({ text: c.title, type: c.category }));
    const people: TvSearchSuggest[] = [];
    for (const c of contents) {
      for (const m of c.cast ?? []) {
        if (m.name.includes(word) && !people.some((p) => p.text === m.name)) {
          people.push({ text: m.name, type: '人物' });
        }
      }
    }
    const ai: TvSearchSuggest = { text: word, type: TYPE_AI };
    // AI 条固定插在第 2 位(证据 f_013/f_014)
    return [...works.slice(0, 1), ai, ...works.slice(1), ...people.slice(0, 4)];
  }, [word, searchHub.suggests, contents]);

  /** 词条 → 内容(取被词条包含的最长片名,确定性),用于缩略图与副行 */
  const contentOf = useMemo(() => {
    return (text: string): TvContent | undefined => {
      let hit: TvContent | undefined;
      for (const c of contents) {
        if (!text.includes(c.title)) continue;
        if (!hit || c.title.length > hit.title.length) hit = c;
      }
      return hit;
    };
  }, [contents]);

  /** 「共N部作品」:先查 series 分组,查不到就按片名前缀归并(证据 f_013「共3部作品」) */
  const worksCount = (c: TvContent | undefined): number => {
    if (!c) return 1;
    const key = typeof c.seriesKey === 'string' ? c.seriesKey : '';
    if (key && series[key]) return series[key].ids.length;
    return contents.filter((x) => x.title.startsWith(c.title) || c.title.startsWith(x.title)).length;
  };

  const submit = () => {
    if (!word) return;
    submitSearch(word);
    // 库里查不到就去空结果页,别给一个空的结果页壳子
    if (searchHasMatch(contents, word)) go('search.result.open.fromSuggest');
    else go('search.empty.open.fromSuggest');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }} data-status-bar-foreground="dark">
      <SearchTopBar
        value={search.input}
        placeholder={searchHub.placeholder}
        onValueChange={setSearchInput}
        onSubmit={submit}
        inputActionId="search.suggest.refresh"
        clearBind={bindTap({ kind: 'action', id: 'search.hub.input.clear' }, {
          onTrigger: () => {
            clearSearchInput();
            back();
          },
        })}
        cancelBind={bindBack()}
        cancelLabel={s.searchCancel}
        autoFocus
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {entries.length === 0 ? (
          <EmptyState text={searchHub.noResult.text} />
        ) : (
          entries.map((e) => {
            const isAi = e.type === TYPE_AI;
            const c = isAi ? undefined : contentOf(e.text);
            const isSeries = e.type === TYPE_SERIES;
            // AI 词条是 wontfix(spec effect:none);其余词条以该词发起搜索
            const bind = isAi
              ? bindTap({ kind: 'action', id: 'search.suggest.ai.wontfix' }, {
                onTrigger: () => toast(s.notOpen),
              })
              : bindTap('search.result.open.fromSuggest', {
                beforeTrigger: () => submitSearch(e.text),
              });
            return (
              <button
                key={`${e.type}-${e.text}`}
                {...bind}
                className="flex items-center gap-2.5 w-full px-3 py-2 bg-transparent border-none text-left"
                style={{ borderBottom: `1px solid ${C.chipGray}`, color: C.text }}
              >
                {c && (
                  <div className="shrink-0 w-8 h-8 rounded overflow-hidden">
                    <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <HighlightText
                      text={e.text}
                      keyword={word}
                      className="text-[15px] truncate"
                    />
                    {e.type !== TYPE_WORK && e.type !== '人物' && (
                      <span
                        className="shrink-0 px-1 py-[1px] rounded text-[10px] leading-[13px]"
                        style={
                          isAi
                            ? { background: C.primaryBg, color: C.primary }
                            : { background: C.chipGray, color: C.textSub }
                        }
                      >
                        {e.type}
                      </span>
                    )}
                  </div>
                  {isSeries ? (
                    <div className="text-[11px] mt-0.5" style={{ color: C.textSub }}>
                      共{worksCount(c)}部作品
                    </div>
                  ) : (
                    c && (
                      <div className="text-[11px] mt-0.5 truncate" style={{ color: C.textSub }}>
                        {[c.year, (c.cast ?? []).map((m) => m.name).join(' ')]
                          .filter(Boolean)
                          .join(' ')}
                      </div>
                    )
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
