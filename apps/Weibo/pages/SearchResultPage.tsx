import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, Img, fmtCount, FollowBtn, EmptyState, BottomSheet } from '../components/ui';
import { SEARCH_TABS } from '../constants';
import { IcBack, IcClose, IcMore, IcAi } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';

const FILTER_CHIPS = ['全部', '路径', '台风', '上海', '登陆', '杭州'];

export default function SearchResultPage() {
  const s = useStrings();
  const { bindTap, bindBack, go } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const statuses = useWeiboStore((st) => st.statuses);
  const users = useWeiboStore((st) => st.users);
  const hotWords = useWeiboStore((st) => st.hotWords);
  const supertopics = useWeiboStore((st) => st.supertopics);
  const followUser = useWeiboStore((st) => st.followUser);
  const recordRealtimeSearch = useWeiboStore((st) => st.recordRealtimeSearch);

  const q = searchParams.get('q') ?? '';
  const tab = searchParams.get('tab') ?? '综合';
  const shareOpen = searchParams.get('share') === 'open';
  const shareMode = searchParams.get('mode') ?? 'full';
  const [sortByTime, setSortByTime] = useState(false);
  const [filterChip, setFilterChip] = useState('全部');

  const isTopic = /^#.+#$/.test(q);
  const bare = q.replace(/^#|#$/g, '');
  const hot = hotWords.find((h) => h.word === bare);
  const tabs = SEARCH_TABS.filter((t) => (isTopic ? t !== '用户' : true));

  const kwHit = (text: string) =>
    !!bare && (text.includes(bare) || (bare.length >= 3 && text.includes(bare.slice(0, 3)))
      || bare.split(/\s+/).some((w) => w.length >= 2 && text.includes(w)));
  const matched = useMemo(() => {
    const pool = statuses.filter((x) => x.userId !== 'me' && !x.supertopicId);
    // ① 该话题专属帖(searchTopic 与查询词互为子串)——话题页内容全部相关(走查 #2)
    const topical = pool.filter(
      (x) => x.searchTopic
        && (x.searchTopic === bare || x.searchTopic.includes(bare) || (bare.length >= 2 && bare.includes(x.searchTopic))),
    );
    // ② 真实种子微博里「完整词组」命中(严格,避免"世界杯"混进"世界杯今晚焦点战")
    const strictHits = pool.filter((x) => !x.searchOnly && !!bare && x.text.includes(bare));
    const base = [...topical, ...strictHits];
    if (base.length) return base;
    // ③ 松散命中(短关键词的分词/首字匹配)
    const loose = pool.filter((x) => !x.searchOnly && kwHit(x.text));
    // ④ 兜底:仍无命中才回落热点新闻,绝不含本人/仅搜索帖
    return loose.length ? loose : pool.filter((x) => !x.searchOnly && (x.channel === '热点' || x.channel === '热门')).slice(0, 4);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, bare]);
  const matchedUsers = users.filter((u) => kwHit(u.name) || kwHit(u.intro ?? ''));

  const setTab = (t: string) => setSearchParams((p) => { t === '综合' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      {/* 顶栏 */}
      <div className="flex items-center gap-2 px-2 h-12 bg-white shrink-0">
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[#1A1A1A] p-1"><IcBack size={22} /></button>
        <div
          {...bindTap('searchResult.search-reopen')}
          className="flex-1 flex items-center h-9 bg-[#F5F5F5] rounded-full px-3 cursor-pointer"
        >
          <span className="flex-1 text-[14px] text-[#1A1A1A] truncate">{q}</span>
          <button
            {...bindTap('searchResult.query-clear', { stopPropagation: true })}
            className="bg-transparent border-none cursor-pointer text-[#BBBBBB] p-0"
          >
            <IcClose size={15} />
          </button>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.share.open' }, {
            onTrigger: () => setSearchParams((p) => { p.set('share', 'open'); p.set('mode', 'full'); return p; }, { replace: true }),
          })}
          className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-1"
        >
          <IcMore size={20} />
        </button>
      </div>

      {/* tab 条 */}
      <div className="flex items-center gap-4 px-3 h-10 bg-white border-t border-[#FAFAFA] overflow-x-auto shrink-0" data-scroll-container="result-tabs" data-scroll-direction="horizontal">
        {tabs.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'searchResult.tab.select.target' }, { params: { target: t }, onTrigger: () => setTab(t) })}
            className={`text-[14px] bg-transparent border-none cursor-pointer whitespace-nowrap relative pb-1 shrink-0 ${tab === t ? 'text-[#1A1A1A] font-bold' : 'text-[#7F7F7F]'}`}
          >
            {t}
            {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="search-result" data-scroll-direction="vertical">
        {/* 话题头卡 / 关键词窄条 */}
        {tab === '综合' && (isTopic ? (
          <div className="bg-white p-3 mb-2 flex gap-2.5">
            <Img src={matched[0]?.images[0]} label="题" className="w-14 h-14 rounded object-cover shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[16px] font-bold text-[#1A1A1A] truncate">{q}</span>
                <span className="text-[9px] text-white bg-[#FF8200] rounded px-1 leading-4 shrink-0">热搜</span>
              </div>
              <div className="text-[12px] text-[#7F7F7F] mt-0.5">
                阅读量{fmtCount(hot?.reads ?? 22415000)} 讨论量{fmtCount(hot?.discuss ?? 2935)} &gt;
              </div>
              {hot?.host && <div className="text-[12px] text-[#7F7F7F]">主持人:{hot.host}</div>}
              <div className="flex gap-1.5 mt-1">
                {(hot?.rank ? [hot.rank, '社会TOP7'] : ['热搜TOP5', '社会TOP7']).map((r) => (
                  <span key={r} className="text-[10px] text-[#FF8200] bg-[#FFF3E5] rounded-full px-2 py-0.5">{r} &gt;</span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white px-3 py-2 mb-2 text-[12px] text-[#7F7F7F]">
            <span className="text-[#FF8200] bg-[#FFF3E5] rounded px-1.5 py-0.5 mr-2">{hot?.rank ?? '生活TOP2'} &gt;</span>
            阅读量{fmtCount(hot?.reads ?? 87102000)}·讨论量{fmtCount(hot?.discuss ?? 9561)} &gt;
          </div>
        ))}

        {/* 筛选 chips(关键词态) */}
        {!isTopic && tab === '综合' && (
          <div className="flex gap-2 px-3 pb-2 overflow-x-auto" data-scroll-container="filter-chips" data-scroll-direction="horizontal">
            {FILTER_CHIPS.map((c) => (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'searchResult.filterChip.select.target' }, { params: { target: c }, onTrigger: () => setFilterChip(c) })}
                className={`shrink-0 text-[12px] rounded-full px-2.5 py-1 border-none cursor-pointer ${filterChip === c ? 'bg-[#FF8200] text-white' : 'bg-white text-[#5B5B5B]'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* 各 tab 内容 */}
        {tab === '综合' && (
          <>
            {/* 智搜 AI 卡 */}
            <div className="bg-white p-3 mb-2">
              <div className="flex items-center gap-1.5 mb-1.5">
                <IcAi size={16} className="text-[#5077BE]" />
                <span className="text-[14px] font-semibold text-[#E68A3C]">微博智搜</span>
                <span className="text-[11px] text-[#9A9A9A]">回答·深度思考(AI 生成)</span>
              </div>
              <div className="text-[14px] text-[#1A1A1A] leading-relaxed">
                关于「{bare}」:综合多方信息,该话题当前热度较高,相关讨论集中在最新进展与影响范围。以下博文供参考。
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'searchResult.aisearch.stub' }, { onTrigger: () => toast(s.notOpen) })}
                className="text-[13px] text-[#5077BE] bg-transparent border-none cursor-pointer mt-1"
              >
                查看更多 &gt;
              </button>
            </div>
            {matched.filter((x) => filterChip === '全部' || x.text.includes(filterChip)).map((st) => (
              <StatusCard key={st.id} status={st} openTransition="searchResult.status-open" userTransition="searchResult.user-open" />
            ))}
          </>
        )}
        {tab === '智搜' && (
          <div className="bg-white p-4 mb-2">
            <div className="flex gap-3 mb-3 text-[13px]">
              {['热点解读', '大众热议', '博主补充', '参考博文'].map((sub, i) => (
                <span key={sub} className={i === 0 ? 'text-[#1A1A1A] font-bold border-b-2 border-[#FF8200] pb-1' : 'text-[#7F7F7F]'}>{sub}</span>
              ))}
            </div>
            <div className="text-[16px] font-bold mb-2">{q}</div>
            <div className="text-[14px] leading-relaxed text-[#1A1A1A]">
              综合分析:「{bare}」相关信息正在持续更新中,主流观点集中于事件的最新进展、各方回应与后续影响。传统渠道与 AI 模型的研判存在一定分歧,最终走向将在近期见分晓。
            </div>
            <div className="text-[11px] text-[#9A9A9A] mt-3">内容由AI生成|参考92篇博文 &gt;</div>
            <button
              {...bindTap({ kind: 'action', id: 'searchResult.aisearch.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="mt-2 text-[13px] text-[#5077BE] bg-[#EEF3FB] rounded-full px-3 py-1.5 border-none cursor-pointer"
            >
              两条路径对浙江的风雨影响有何不同? 追问
            </button>
          </div>
        )}
        {tab === '实时' && (
          <>
            <div className="flex items-center bg-white px-3 h-9 mb-0.5">
              <span className="text-[12px] text-[#7F7F7F]">按最新{sortByTime ? '时间' : '互动'}排序</span>
              <span className="flex-1" />
              <button
                {...bindTap({ kind: 'action', id: 'searchResult.realtimeSort.toggle' }, { onTrigger: () => setSortByTime((v) => { const next = !v; recordRealtimeSearch(q, next ? 'time' : 'interaction'); return next; }) })}
                className="text-[12px] bg-[#F5F5F5] rounded-full px-2 py-0.5 border-none cursor-pointer"
              >
                <span className={!sortByTime ? 'text-[#FF8200] font-semibold' : 'text-[#7F7F7F]'}>互动</span>
                <span className="text-[#DDDDDD] mx-1">|</span>
                <span className={sortByTime ? 'text-[#FF8200] font-semibold' : 'text-[#7F7F7F]'}>时间</span>
              </button>
            </div>
            {[...matched].sort((a, b) => (sortByTime ? b.timestamp - a.timestamp : b.likes - a.likes)).map((st) => (
              <StatusCard key={st.id} status={st} openTransition="searchResult.status-open" userTransition="searchResult.user-open" />
            ))}
          </>
        )}
        {tab === '用户' && (
          matchedUsers.length ? matchedUsers.map((u) => (
            <div key={u.id} className="flex items-center gap-2.5 bg-white px-3 py-2.5 mb-0.5">
              <div {...bindTap('searchResult.user-open', { params: { id: u.id } })} className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                <Img src={u.avatar} label={u.name[0]} className="w-11 h-11 rounded-full object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-[14px] text-[#E68A3C] truncate">{u.name}</div>
                  <div className="text-[12px] text-[#9A9A9A] truncate">{u.intro} · 粉丝{fmtCount(u.fans)}</div>
                </div>
              </div>
              {!u.followedByMe && (
                <FollowBtn binding={bindTap({ kind: 'action', id: 'searchResult.follow.toggle' }, { params: { userId: u.id }, onTrigger: () => followUser(u.id) })} />
              )}
            </div>
          )) : <EmptyState text={s.emptySearch} />
        )}
        {tab === '视频' && matched.filter((x) => x.isVideo).map((st) => (
          <StatusCard key={st.id} status={st} openTransition="searchResult.status-open" userTransition="searchResult.user-open" />
        ))}
        {tab === '视频' && !matched.some((x) => x.isVideo) && <EmptyState text={s.emptySearch} />}
        {tab === '图片' && (
          <div className="grid grid-cols-2 gap-1 px-1">
            {matched.flatMap((x) => x.images).map((img, i) => (
              <Img key={i} src={img} label="图" className="w-full rounded object-cover aspect-[3/4]" />
            ))}
          </div>
        )}
        {(tab === '关注' || tab === '全网' || tab === '地点') && <EmptyState text={s.emptySearch} />}
        {tab === '热门' && matched.map((st) => (
          <StatusCard key={st.id} status={st} openTransition="searchResult.status-open" userTransition="searchResult.user-open" />
        ))}
        {tab === '话题' && (
          <button
            {...bindTap('searchResult.topic-open', { params: { q: isTopic ? q : `#${bare}#` } })}
            className="flex items-center gap-2.5 w-full bg-white px-3 py-3 border-none cursor-pointer text-left"
          >
            <Img src={matched[0]?.images[0]} label="题" className="w-12 h-12 rounded object-cover shrink-0" />
            <div className="min-w-0">
              <div className="text-[15px] text-[#1A1A1A] truncate">{isTopic ? q : `#${bare}#`}</div>
              <div className="text-[12px] text-[#9A9A9A]">{fmtCount(hot?.discuss ?? 2935)}讨论 {fmtCount(hot?.reads ?? 22415000)}阅读</div>
            </div>
          </button>
        )}
        {tab === '超话' && (
          supertopics.filter((t) => kwHit(t.name)).length
            ? supertopics.filter((t) => kwHit(t.name)).map((t) => (
              <button
                key={t.id}
                {...bindTap('searchResult.supertopic-open', { params: { id: t.id } })}
                className="flex items-center gap-2.5 w-full bg-white px-3 py-2.5 mb-0.5 border-none cursor-pointer text-left"
              >
                <Img src={t.cover} label={t.name[0]} className="w-11 h-11 rounded object-cover shrink-0" />
                <div className="min-w-0">
                  <div className="text-[14px] text-[#1A1A1A]">◇{t.name}</div>
                  <div className="text-[12px] text-[#9A9A9A]">{fmtCount(t.posts)}帖子 {fmtCount(t.fans)}{t.fanName}</div>
                </div>
              </button>
            ))
            : <EmptyState text={s.emptySearch} />
        )}
        <div className="h-4" />
      </div>

      {/* 底部栏 */}
      <div className="flex items-center gap-3 px-3 h-12 bg-white border-t border-[#F2F2F2] shrink-0">
        <div className="flex-1 flex items-center gap-1.5 text-[13px] text-[#9A9A9A]">
          <span className="w-6 h-6 rounded-full bg-[#F0F0F0] inline-block" />
          和当前{fmtCount(2642)}人一起讨论…
        </div>
        <button
          {...bindTap('searchResult.compose-open', { params: { topic: isTopic ? q : `#${bare}#` } })}
          className="flex flex-col items-center text-[#5B5B5B] bg-transparent border-none cursor-pointer"
        >
          <span className="text-[16px]">✏️</span>
          <span className="text-[10px]">{s.discuss}</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'searchResult.share.open' }, {
            onTrigger: () => setSearchParams((p) => { p.set('share', 'open'); p.set('mode', 'lite'); return p; }, { replace: true }),
          })}
          className="flex flex-col items-center text-[#5B5B5B] bg-transparent border-none cursor-pointer"
        >
          <span className="text-[16px]">📤</span>
          <span className="text-[10px]">{s.share}</span>
        </button>
      </div>

      {/* 分享面板 */}
      {shareOpen && (
        <BottomSheet
          onClose={() => setSearchParams((p) => { p.delete('share'); p.delete('mode'); return p; }, { replace: true })}
          closeBinding={bindTap({ kind: 'action', id: 'searchResult.share.close' }, {
            onTrigger: () => setSearchParams((p) => { p.delete('share'); p.delete('mode'); return p; }, { replace: true }),
          })}
        >
          <div className="p-4">
            <div className="text-center text-[14px] font-semibold mb-3">{s.share}</div>
            <div className="flex gap-4 overflow-x-auto pb-3 border-b border-[#F7F7F7]">
              {['微博', '好友圈', '私信和群', '微信好友', '朋友圈', 'QQ'].map((ch, i) => (
                <button
                  key={ch}
                  {...bindTap({ kind: 'action', id: 'searchResult.share.stub' }, {
                    onTrigger: () => {
                      const launched = sharePlainText('【微博】分享', { onResult: (r) => { if (r.resultCode === 'OK') toast('分享成功'); } });
                      if (!launched) toast(s.notOpen);
                    },
                  })}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer shrink-0"
                >
                  <span className={`w-11 h-11 rounded-full flex items-center justify-center text-[18px] ${['bg-[#FFEDD9]', 'bg-[#FFE3E3]', 'bg-[#FFF6D9]', 'bg-[#DFF5E3]', 'bg-[#E3F0FF]', 'bg-[#E8E3FF]'][i]}`}>
                    {['👁️', '❤️', '✉️', '💬', '🌐', '🐧'][i]}
                  </span>
                  <span className="text-[10px] text-[#5B5B5B]">{ch}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4 overflow-x-auto pt-3">
              {(shareMode === 'lite' ? ['复制链接', '分享话题', '分享智搜'] : ['复制链接', '听热搜', '分享话题', '分享智搜', '数据', '申请主持人', '我的话题', '热搜词条投诉']).map((f) => (
                <button
                  key={f}
                  {...(f === '复制链接'
                    ? bindTap({ kind: 'action', id: 'searchResult.share.copyLink' }, {
                      onTrigger: () => { toast(s.copied); setSearchParams((p) => { p.delete('share'); p.delete('mode'); return p; }, { replace: true }); },
                    })
                    : bindTap({ kind: 'action', id: 'searchResult.share.stub' }, { onTrigger: () => toast(s.notOpen) }))}
                  className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer shrink-0"
                >
                  <span className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[16px]">
                    {f === '复制链接' ? '🔗' : f === '听热搜' ? '🎧' : '⭐'}
                  </span>
                  <span className="text-[10px] text-[#5B5B5B]">{f}</span>
                </button>
              ))}
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'searchResult.share.close' }, {
                onTrigger: () => setSearchParams((p) => { p.delete('share'); p.delete('mode'); return p; }, { replace: true }),
              })}
              className="w-full h-10 mt-3 rounded-full bg-[#F5F5F5] text-[14px] text-[#1A1A1A] border-none cursor-pointer"
            >
              {s.cancel}
            </button>
          </div>
        </BottomSheet>
      )}
      {toastNode}
    </div>
  );
}
