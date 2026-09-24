import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars, fmtCount } from '../components/ui';

// 节点: search.entry —— 搜索中间页(历史词/发现chips/三组横滑榜/联想面板)。
// evidence: IMG_F8cb08c_t0002/t0008/t0015/t0040/IMG_0395
// ?scope=mine → 「搜我发布的」引导空态(IMG_0395:UFO图标+「找回过往的记忆/搜索我发布过的内容」)。

/** 「发现」两行 chips(t0008 结构;文案为原创虚构,🔄 轮换下一组) */
const DISCOVER_CHIP_SETS: string[][] = [
  ['把冬天泡进热汤里', '路灯下的自行车', '独居也要好好吃饭', '阳台上的小森林', '旧书店寻宝地图', '夜航班机', '深夜厨房实验'],
  ['菜市场的颜色学', '一个人的美术馆', '手写信复兴计划', '楼下的猫认识我了', '雨天专用歌单', '票根收藏癖', '晚风散步指南'],
  ['重看童年动画片', '通勤路上的播客', '把周末过成假期', '窗台观察日记', '方言里的温柔', '纸质日历打卡', '给三年后的自己写信'],
];

/** 发现词条(evidence t0002「热门话题」区文案) */
const DISCOVER_WORDS: { word: string; views: string }[] = [
  { word: '一起看 2026 世界杯', views: '206.9万' },
  { word: '我擅长感受,却拙于表达', views: '450.9万' },
  { word: '原来真的有人一辈子做自己热爱的事', views: '54.3万' },
  { word: '恢复能量的绝佳方式', views: '162.4万' },
  { word: '普通人最简单的高效使用 AI 的方式', views: '2.6万' },
  { word: '到底谁能忍住不笑啊', views: '1856.8万' },
];

const PLACEHOLDER = '德国人没有味觉的程度令人震惊';

/** 小组成员称谓(t0008:数字 + 称谓;per-group 确定性选取,原创虚构) */
const MEMBER_NOUNS = ['成员', '小朋友', '穿搭博主', '书友', '影迷', '乐迷'];

const TYPE_TAG: Record<string, string> = {
  movie: '电影',
  tv: '电视剧',
  book: '图书',
  music: '音乐',
  podcast: '播客',
};

export default function SearchEntryPage() {
  const { bindBack, bindTap, go } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const searchQuery = useDoubanStore((s) => s.searchQuery);
  const setSearchQuery = useDoubanStore((s) => s.setSearchQuery);
  const addSearchHistory = useDoubanStore((s) => s.addSearchHistory);
  const clearSearchHistory = useDoubanStore((s) => s.clearSearchHistory);
  const searchHistory = useDoubanStore((s) => s.searchHistory);
  const subjects = useDoubanStore((s) => s.subjects);
  const topics = useDoubanStore((s) => s.topics);
  const groups = useDoubanStore((s) => s.groups);

  const [searchParams] = useSearchParams();
  /** 「搜我发布的」引导态(IMG_0395)，由 mine.selfSearch-open 携带 scope=mine 进入。 */
  const mineScope = searchParams.get('scope') === 'mine';
  /** 「发现」chips 当前组;🔄 轮换(无声明 id,untagged 本地刷新) */
  const [discoverSet, setDiscoverSet] = useState(0);

  const q = searchQuery.trim();
  const submitQuery = () => {
    if (q === '') return;
    addSearchHistory(q);
    go('search.entry.submit-open');
  };

  /** 实时热门书影音榜(取 tv/movie 热门项) */
  const hotSubjects = useMemo(
    () => ['tv1', 'tv2', 'm1'].map((id) => subjects.find((s) => s.id === id)).filter((s) => s != null),
    [subjects],
  );
  /** 联想:富条目卡(影视条目,落点 subject.movie) */
  const richMatches = useMemo(
    () =>
      q === ''
        ? []
        : subjects.filter((s) => (s.type === 'movie' || s.type === 'tv') && s.title.includes(q)).slice(0, 3),
    [subjects, q],
  );
  /** 联想:文字 sug 列表 */
  const wordSugs = useMemo(() => {
    if (q === '') return [];
    const titles = subjects.filter((s) => s.title.includes(q)).map((s) => s.title);
    const extra = topics.filter((t) => t.name.includes(q)).map((t) => t.name);
    return [q, ...titles, ...extra].filter((w, i, arr) => arr.indexOf(w) === i).slice(0, 10);
  }, [subjects, topics, q]);

  const hotTopics = useMemo(() => topics.filter((t) => t.id !== 'tp_test').slice(0, 4), [topics]);
  const hotGroups = useMemo(() => groups.slice(0, 4), [groups]);

  return (
    <div className="flex flex-col h-full bg-white" data-status-bar-foreground="dark">
      {/* 搜索框行(提交靠键盘「搜索」键 → 隐藏 submit 承载 submit-open,不再有独立搜索按钮) */}
      <form
        className="flex items-center gap-2 px-3 py-2 shrink-0 bg-white"
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery();
        }}
      >
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-lg" style={{ background: '#F2F3F5' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            {...bindTap({ kind: 'action', id: 'search.entry.input.type' }, { onTrigger: () => {} })}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              e.preventDefault();
              submitQuery();
            }}
            enterKeyHint="search"
            placeholder={PLACEHOLDER}
            className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
            style={{ color: C.text }}
          />
          {/* 键盘「搜索」提交键(隐藏 submit,承载 submit-open;t0015 右侧无独立搜索按钮) */}
          {q !== '' && (
            <button
              type="submit"
              {...bindTap('search.entry.submit-open', {
                preventDefault: true,
                beforeTrigger: () => addSearchHistory(q),
              })}
              aria-label="搜索"
              style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0 0 0 0)', border: 0 }}
            >
              搜索
            </button>
          )}
        </div>
        {/* 右侧恒为绿色「取消」(t0015:输入非空时仍是取消) */}
        <button type="button" {...bindBack()} className="text-[15px] bg-transparent border-none cursor-pointer shrink-0 px-1" style={{ color: C.green }}>
          取消
        </button>
      </form>

      {q !== '' ? (
        /* ---------------- 联想态(state.suggest) ---------------- */
        <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
          {richMatches.map((s) => (
            <div
              key={s.id}
              {...bindTap('search.entry.suggestItem-open', { params: { itemId: s.id, type: s.type } })}
              className="flex gap-3 items-start px-4 py-3 cursor-pointer border-b"
              style={{ borderColor: '#F5F6F7' }}
            >
              <Img src={s.cover} className="w-[54px] h-[76px] rounded object-cover shrink-0" />
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  {/* 标题左侧红色圆形播放图标(t0015「▶ 示例影片 (2003)」) */}
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E5484D' }}>
                    <svg width="7" height="7" viewBox="0 0 10 10"><path d="M2.5 1l6 4-6 4z" fill="#fff" /></svg>
                  </span>
                  <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
                    {s.title} {s.year ? `(${s.year})` : ''}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-1">
                  {s.rating == null ? (
                    <span className="text-xs" style={{ color: C.sub }}>暂无评分</span>
                  ) : (
                    <>
                      <Stars value={s.rating} size={13} color="#F5A623" />
                      <span className="text-sm font-semibold" style={{ color: '#FF9900' }}>{s.rating.toFixed(1)}</span>
                    </>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: C.sub }}>
                  <span className="px-1 rounded text-[10px]" style={{ background: '#F2F3F5' }}>{TYPE_TAG[s.type]}</span>
                  <span className="truncate">{s.info}</span>
                </div>
              </div>
            </div>
          ))}
          {wordSugs.map((w) => (
            <div
              key={w}
              {...bindTap('search.entry.suggestWord-open', {
                beforeTrigger: () => {
                  setSearchQuery(w);
                  addSearchHistory(w);
                },
              })}
              className="flex items-center gap-3 px-4 h-12 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C3C9D1" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
              </svg>
              <span className="text-[15px] truncate" style={{ color: C.text }}>{w}</span>
            </div>
          ))}
        </div>
      ) : (
        /* ---------------- 默认态(state.default) ---------------- */
        <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
          {/* 历史词行 */}
          {searchHistory.length > 0 && (
            <div className="flex items-center gap-2 px-4 pt-2 pb-1">
              <span className="text-sm shrink-0" style={{ color: C.text }}>历史</span>
              <div className="flex-1 flex gap-2 overflow-x-auto" data-scroll-container="history-words" data-scroll-direction="horizontal">
                {searchHistory.map((w) => (
                  <button
                    key={w}
                    {...bindTap('search.entry.history-open', {
                      beforeTrigger: () => {
                        setSearchQuery(w);
                        addSearchHistory(w);
                      },
                    })}
                    className="px-3 py-1.5 rounded-lg text-[13px] border-none cursor-pointer shrink-0"
                    style={{ background: '#F2F3F5', color: C.text }}
                  >
                    {w}
                  </button>
                ))}
              </div>
              {/* 竖分隔线(IMG_0395:历史 chips 与垃圾桶之间) */}
              <span className="shrink-0 w-px h-4 self-center" style={{ background: '#E4E7EB' }} />
              <button
                {...bindTap({ kind: 'action', id: 'search.entry.history.clear' }, { onTrigger: () => clearSearchHistory() })}
                className="shrink-0 w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
                aria-label="清空历史"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                  <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-9 0l1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          {mineScope ? (
            /* ---------------- state.mineEmpty:「搜我发布的」引导空态(IMG_0395) ---------------- */
            <div className="flex flex-col items-center pt-28 px-6">
              <div className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center" style={{ background: '#17181C' }}>
                <svg width="42" height="42" viewBox="0 0 40 40" fill="none">
                  <circle cx="8" cy="7" r="1.2" fill="#fff" />
                  <circle cx="33" cy="10" r="1" fill="#fff" />
                  <circle cx="30" cy="27" r="1.2" fill="#fff" />
                  <path d="M14 12.5a6 6 0 0 1 12 0" stroke="#fff" strokeWidth="1.8" />
                  <ellipse cx="20" cy="15" rx="11" ry="4.5" stroke="#fff" strokeWidth="1.8" />
                  <path d="M13 19.5l-4 11M20 20v12M27 19.5l4 11" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="2.5 3" />
                </svg>
              </div>
              <div className="mt-5 text-[17px] font-semibold" style={{ color: C.text }}>找回过往的记忆</div>
              <div className="mt-1.5 text-sm" style={{ color: C.sub }}>搜索我发布过的内容</div>
            </div>
          ) : (
          <>
          {/* 「发现」两行 chips + 🔄 刷新(t0008;刷新无声明 id → untagged 本地轮换) */}
          <div className="flex items-start gap-2 px-4 pt-2 pb-1">
            <span className="text-sm shrink-0 leading-8" style={{ color: C.text }}>发现</span>
            <div className="flex-1 flex flex-wrap gap-2">
              {DISCOVER_CHIP_SETS[discoverSet % DISCOVER_CHIP_SETS.length].map((w) => (
                <button
                  key={w}
                  {...bindTap('search.entry.discover-open', {
                    beforeTrigger: () => {
                      setSearchQuery(w);
                      addSearchHistory(w);
                    },
                  })}
                  className="px-3 py-1.5 rounded-lg text-[13px] border-none cursor-pointer"
                  style={{ background: '#F2F3F5', color: C.text }}
                >
                  {w}
                </button>
              ))}
            </div>
            <button
              onClick={() => setDiscoverSet((i) => i + 1)}
              className="shrink-0 w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
              aria-label="换一批发现词条"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.8">
                <path d="M20 11a8 8 0 10.6 4" strokeLinecap="round" />
                <path d="M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* 三组横滑榜卡 */}
          <div className="flex gap-3 px-4 pt-3 overflow-x-auto" data-scroll-container="rank-cards" data-scroll-direction="horizontal">
            {/* 实时热门书影音 Top20 */}
            <div className="w-[268px] shrink-0 rounded-xl overflow-hidden" style={{ background: '#FDF0F0' }}>
              <button
                {...bindTap({ kind: 'action', id: 'search.entry.rankMore.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="w-full flex items-center gap-1.5 px-3 py-2.5 border-none cursor-pointer text-left"
                style={{ background: '#FBE3E4' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C93B3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
                </svg>
                <span className="text-sm font-bold" style={{ color: '#C93B3B' }}>实时热门书影音</span>
                <span className="text-xs font-semibold" style={{ color: '#C93B3B' }}>Top20 ›</span>
              </button>
              <div className="px-3 py-2 space-y-2.5">
                {hotSubjects.map((s) => (
                  <div
                    key={s.id}
                    {...bindTap('search.entry.hotSubject-open', { params: { itemId: s.id, type: s.type } })}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <Img src={s.cover} className="w-[42px] h-[58px] rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{s.title}</div>
                      <div className="mt-0.5">
                        {s.rating == null ? (
                          <span className="text-[11px]" style={{ color: C.sub }}>暂无评分</span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Stars value={s.rating} size={10} color="#F5A623" />
                            <span className="text-xs font-semibold" style={{ color: '#FF9900' }}>{s.rating.toFixed(1)}</span>
                          </span>
                        )}
                      </div>
                      <span className="inline-block mt-1 px-1 rounded text-[10px]" style={{ background: '#F7E5E5', color: '#B06A6A' }}>
                        {s.type === 'tv' ? (s.genres?.includes('真人秀') ? '综艺' : '电视剧') : TYPE_TAG[s.type]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 实时热门讨论 Top15 */}
            <div className="w-[268px] shrink-0 rounded-xl overflow-hidden" style={{ background: '#FDF1EE' }}>
              <button
                {...bindTap({ kind: 'action', id: 'search.entry.rankMore.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="w-full flex items-center gap-1.5 px-3 py-2.5 border-none cursor-pointer text-left"
                style={{ background: '#FAE3DC' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#D2452E" stroke="none" className="shrink-0">
                  <path d="M12 2c1.5 3 4.5 4.5 4.5 8a4.5 4.5 0 0 1-9 0c0-1 .3-1.8.8-2.5C9 9 9.5 10 10.5 10c-.3-2 .5-5.5 1.5-8z" />
                </svg>
                <span className="text-sm font-bold" style={{ color: '#D2452E' }}>实时热门讨论</span>
                <span className="text-xs font-semibold" style={{ color: '#D2452E' }}>Top15 ›</span>
              </button>
              <div className="px-3 py-2 space-y-3">
                {hotTopics.map((t, i) => (
                  <div
                    key={t.id}
                    {...bindTap('search.entry.hotTopic-open', { params: { id: t.id } })}
                    className="flex items-start gap-2.5 cursor-pointer"
                  >
                    {/* 序号 + 正下方独立趋势箭头列(t0008) */}
                    <div className="w-4 flex flex-col items-center shrink-0">
                      <span
                        className="text-[15px] font-bold italic leading-none"
                        style={{ color: i === 0 ? '#E5484D' : i < 3 ? '#F57746' : '#B9BEC6' }}
                      >
                        {i + 1}
                      </span>
                      <span className="mt-0.5 text-[10px] leading-none" style={{ color: i < 3 ? '#3BA55D' : '#B9BEC6' }}>
                        {i < 3 ? '↓' : '—'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] leading-snug line-clamp-1" style={{ color: C.text }}>{t.name}</div>
                      <div className="mt-0.5 text-[11px]" style={{ color: C.sub }}>
                        {fmtCount(t.views)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 小组热门趋势榜 Top20 */}
            <div className="w-[268px] shrink-0 rounded-xl overflow-hidden" style={{ background: '#EEF6EF' }}>
              <button
                {...bindTap({ kind: 'action', id: 'search.entry.rankMore.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="w-full flex items-center gap-1.5 px-3 py-2.5 border-none cursor-pointer text-left"
                style={{ background: '#DFEEE1' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2E7D46" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <circle cx="9" cy="8" r="3" />
                  <path d="M3 20a6 6 0 0 1 12 0" />
                  <circle cx="17" cy="9" r="2.2" />
                  <path d="M15.5 20a5 5 0 0 1 6.5-4.5" />
                </svg>
                <span className="text-sm font-bold" style={{ color: '#2E7D46' }}>小组热门趋势榜</span>
                <span className="text-xs font-semibold" style={{ color: '#2E7D46' }}>Top20 ›</span>
              </button>
              <div className="px-3 py-2 space-y-2.5">
                {hotGroups.map((g) => (
                  <div
                    key={g.id}
                    {...bindTap('search.entry.hotGroup-open', { params: { groupId: g.id } })}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <Img src={g.icon} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{g.name}</div>
                      {/* 数字 + 成员称谓(t0008:小朋友/穿搭博主/成员,per-group 确定性) */}
                      <div className="text-[11px]" style={{ color: C.sub }}>
                        {g.members} {MEMBER_NOUNS[g.id.charCodeAt(g.id.length - 1) % MEMBER_NOUNS.length]}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* 分页圆点 */}
          <div className="flex justify-center gap-1.5 pt-2.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: i === 0 ? '#9CA3AF' : '#E4E7EB' }} />
            ))}
          </div>

          {/* 发现词条(热门话题) */}
          <div className="px-4 pt-5">
            <div className="text-base font-bold" style={{ color: C.text }}>热门话题</div>
            <div className="mt-1">
              {DISCOVER_WORDS.map((d) => (
                <div
                  key={d.word}
                  {...bindTap('search.entry.discover-open', {
                    beforeTrigger: () => {
                      setSearchQuery(d.word);
                      addSearchHistory(d.word);
                    },
                  })}
                  className="flex items-center gap-2.5 h-12 cursor-pointer"
                >
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: '#C3C9D1' }} />
                  <span className="flex-1 text-[15px] truncate" style={{ color: C.text }}>{d.word}</span>
                  <span className="text-xs shrink-0" style={{ color: '#B9BEC6' }}>{d.views}</span>
                </div>
              ))}
            </div>
          </div>
          </>
          )}
        </div>
      )}
    </div>
  );
}
