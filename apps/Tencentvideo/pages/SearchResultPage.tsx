// 搜索结果页(全部/影视/用户/讨论/小说/话题)。节点 search.result(spec v1.0.0,14 条交互)。
// 视觉证据:f_020(全部 tab:词条框 + 六 tab + 右侧「反馈」;主命中大白卡 = 竖版海报(年份/VIP/全40集)
// + 红色片名 + 榜单/在追 chip + 「2026 电视剧 内地 普通话」+ 演员行 + 青色「立即播放」与「下载」
// 双键 + 选集 chips(末两集带 VIP 金标);其下「剩余 3 部作品 ∨」;再下「相关影视」= 关联 chips + 横排卡)、
// f_024(影视 tab:竖排列表卡,海报 + 片名 + 「电视剧 内地 普通话」+ 演员行)、
// f_028(话题 tab:「# 词-话题名」+ 阅读/讨论数 + 右侧缩略图)。
//
// spec note:用户/小说 tab 未实拍 → 通用空态;讨论 tab 实拍到切换瞬间的居中 loading。
import React, { useEffect, useMemo, useState } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { RANK_BOARD_BY_CATEGORY, TV_COLORS as C } from '../constants';
import {
  HighlightText,
  SearchTopBar,
  TextTabRow,
  findSearchHit,
  gridCornerNote,
} from '../components/search';
import { TvImg } from '../components/Img';
import { Badge, EmptyState, type BindProps } from '../components/ui';
import { IcArrowDown, IcDownload, IcFeedback, IcPlay } from '../res/icons';
import type { TvContent } from '../types';

const UI_TAB = 'search.result.tab';
const UI_MOREWORKS = 'search.result.moreWorks';
const UI_RELATED = 'search.result.relatedChip';

/** 结构性标签(spec 未给种子,证据 f_020/f_028 逐字抄录) */
/** 真机结果页统一在片名后跟「内地 普通话」这类信息行,语言字段种子里没有,用固定语种标注 */
const LABEL_LANGUAGE = '普通话';
/** 选集 chips 一次露出的头尾集数(证据 f_020:1 / 2 / … / 39 / 40) */
const EPISODE_HEAD = 2;
const EPISODE_TAIL = 2;
/** tab 切换的居中 loading 时长(证据 f_052 拍到切换瞬间的 loading 态) */
const TAB_LOADING_MS = 320;

/** 「2026 电视剧 内地 普通话」信息行(证据 f_020/f_024) */
function infoLine(c: TvContent, withYear: boolean): string {
  const board = RANK_BOARD_BY_CATEGORY[c.category] || c.category;
  return [withYear ? c.year : '', board, c.region, LABEL_LANGUAGE].filter(Boolean).join(' ');
}

function castLine(c: TvContent): string {
  return (c.cast ?? []).map((m) => m.name).join(' ');
}

export default function SearchResultPage() {
  const { bindTap, bindBack, go, back } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const searchHub = useTencentvideoStore((s) => s.searchHub);
  const contents = useTencentvideoStore((s) => s.contents);
  const series = useTencentvideoStore((s) => s.series);
  const discussions = useTencentvideoStore((s) => s.discussions);
  const search = useTencentvideoStore((s) => s.search);
  const ui = useTencentvideoStore((s) => s.ui);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);

  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const setSearchInput = useTencentvideoStore((s) => s.setSearchInput);
  const clearSearchInput = useTencentvideoStore((s) => s.clearSearchInput);

  // 匹配只用真实提交/输入词;placeholder 只做输入框占位,参与匹配会把空提交误当成有词
  const word = (search.submitted ?? search.input ?? '').trim();
  const displayWord = word || searchHub.placeholder;
  const activeTab = (ui[UI_TAB] as string) || searchHub.resultTabs[0];
  const moreWorksOpen = ui[UI_MOREWORKS] === true;
  const relatedIndex = Number(ui[UI_RELATED] ?? 0);

  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), TAB_LOADING_MS);
    return () => clearTimeout(t);
  }, [activeTab]);

  /** 主命中:与 hub/联想同一口径;无命中绝不回落 contents[0](否则乱码词落到「千芳劫」) */
  const main = useMemo<TvContent | undefined>(
    () => (word ? findSearchHit(contents, word) : undefined),
    [contents, word],
  );

  /** 「剩余 N 部作品」:同系列优先,其次同主演的其他作品(证据 f_020「剩余 3 部作品 ∨」) */
  const otherWorks = useMemo<TvContent[]>(() => {
    if (!main) return [];
    const key = typeof main.seriesKey === 'string' ? main.seriesKey : '';
    if (key && series[key]) {
      return series[key].ids
        .filter((id) => id !== main.id)
        .map((id) => contents.find((c) => c.id === id))
        .filter((c): c is TvContent => c !== undefined);
    }
    const lead = (main.cast ?? [])[0]?.name;
    if (!lead) return [];
    return contents
      .filter((c) => c.id !== main.id && (c.cast ?? []).some((m) => m.name === lead))
      .slice(0, 3);
  }, [main, series, contents]);

  /** 相关影视关联 chips(证据 f_020「与 逐玉 相关 / 与 … 相关」),按主命中题材派生 */
  const relatedChips = useMemo(() => {
    const tags = main?.tags ?? [];
    return [`与 ${word} 相关`, ...tags.slice(0, 2).map((t) => `与 ${word} ${t} 相关`)];
  }, [main, word]);

  /** 相关影视卡:同主演优先、其次同题材;按选中 chip 轮转切片(确定性) */
  const relatedItems = useMemo<TvContent[]>(() => {
    if (!main) return [];
    const leads = new Set((main.cast ?? []).map((m) => m.name));
    const pool = contents.filter(
      (c) =>
        c.id !== main.id &&
        ((c.cast ?? []).some((m) => leads.has(m.name)) ||
          c.tags.some((t) => main.tags.includes(t))),
    );
    const offset = relatedIndex * 2;
    return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, 6);
  }, [main, contents, relatedIndex]);

  /**
   * 「全部 / 影视」共用命中池：主结果 + 同系列/同主演作品。
   * 相关影视是同题材松散推荐，只出现在「全部」的相关楼层，不能算进影视 Tab。
   */
  const allResultPool = useMemo<TvContent[]>(() => {
    const map = new Map<string, TvContent>();
    [main, ...otherWorks].forEach((item) => {
      if (item) map.set(item.id, item);
    });
    return [...map.values()];
  }, [main, otherWorks]);

  /** 影视 tab:对「全部」的同一批命中仅过滤影视内容。 */
  const videoList = useMemo<TvContent[]>(() => {
    return allResultPool.filter((c) => c.category !== '短番').slice(0, 8);
  }, [allResultPool]);

  const relationNote = (c: TvContent): string => {
    const leads = new Set((main?.cast ?? []).map((m) => m.name));
    const sameLead = (c.cast ?? []).find((m) => leads.has(m.name));
    if (sameLead) return `同主演·${sameLead.name}`;
    const sameTags = c.tags.filter((t) => main?.tags.includes(t));
    return sameTags.length > 0 ? `同题材·${sameTags.join('')}` : c.tags.join('');
  };

  /**
   * 结果卡去向:剧场版/多集片类走 detail.special,其余走剧集详情(spec 两条 transition)。
   * 剧集那条按卡片所在区域分开申报(主命中卡 / 相关卡),剧场版共用一条。
   */
  const isSpecial = (c: TvContent) => c.title.includes('剧场版');
  const specialBind = (c: TvContent): BindProps =>
    bindTap('detail.special.open.fromResult', { params: { contentId: c.id } });

  const cardBind = (c: TvContent): BindProps =>
    isSpecial(c)
      ? specialBind(c)
      : bindTap('detail.series.open.fromSearchRelated', { params: { contentId: c.id } });

  const mainBind = (c: TvContent): BindProps =>
    isSpecial(c)
      ? specialBind(c)
      : bindTap('detail.series.open.fromSearchResult', { params: { contentId: c.id } });

  const episodeChips = useMemo(() => {
    const total = main?.episodes ?? 0;
    if (total <= 1) return [] as (number | null)[];
    if (total <= EPISODE_HEAD + EPISODE_TAIL + 1) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const head = Array.from({ length: EPISODE_HEAD }, (_, i) => i + 1);
    const tail = Array.from({ length: EPISODE_TAIL }, (_, i) => total - EPISODE_TAIL + 1 + i);
    return [...head, null, ...tail];
  }, [main]);

  /** 讨论/话题必须继续使用当前关键词召回，不能把全站固定八条塞进任意搜索结果。 */
  const discussionResults = useMemo(() => {
    const keyword = word.toLowerCase();
    if (!keyword) return [];
    return discussions.filter((discussion) => {
      const linked = contents.find((item) => item.id === discussion.contentId);
      const searchable = [
        discussion.title,
        discussion.content,
        discussion.author,
        linked?.title,
        ...(linked?.tags ?? []),
        ...(linked?.cast ?? []).map((member) => member.name),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(keyword);
    });
  }, [contents, discussions, word]);
  const topics = discussionResults.slice(0, 8);

  return (
    <div className="flex flex-col h-full" style={{ background: C.chipGray }} data-status-bar-foreground="dark">
      <SearchTopBar
        value={search.input || displayWord}
        placeholder={searchHub.placeholder}
        onValueChange={(v) => {
          setSearchInput(v);
          // 再次输入即回到联想态(spec:type → search.suggest.open.fromResult)
          if (v.trim()) go('search.suggest.open.fromResult');
        }}
        clearBind={bindTap({ kind: 'action', id: 'search.hub.input.clear' }, {
          onTrigger: () => {
            clearSearchInput();
            back();
          },
        })}
        cancelBind={bindBack()}
        cancelLabel={s.searchCancel}
      />

      <TextTabRow
        size="sm"
        tabs={searchHub.resultTabs}
        activeTab={activeTab}
        getTabBind={(t) =>
          bindTap({ kind: 'action', id: 'search.result.tab.switch' }, {
            onTrigger: () => setUi(UI_TAB, t),
          })
        }
        right={
          <button
            {...bindTap({ kind: 'action', id: 'search.result.feedback.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="flex items-center gap-0.5 bg-transparent border-none p-0 text-[13px]"
            style={{ color: C.textSub }}
          >
            <IcFeedback size={14} />
            {s.feedback}
          </button>
        }
      />

      <div
        className="flex-1 overflow-y-auto pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <span
              className="w-6 h-6 rounded-full animate-spin"
              style={{ border: `2px solid ${C.divider}`, borderTopColor: C.primary }}
            />
          </div>
        ) : activeTab === searchHub.resultTabs[0] && !main ? (
          /* ---------- 全部 tab · 无命中空态(与 search.empty 同文案,禁止回落库首条) ---------- */
          <EmptyState text={searchHub.noResult.text} />
        ) : activeTab === searchHub.resultTabs[0] && main ? (
          /* ---------- 全部 tab ---------- */
          <>
            {/* 主命中大卡 */}
            <div className="mx-3 mt-2 rounded-xl p-3" style={{ background: C.pageBg }}>
              <div className="flex gap-3">
                <div
                  {...mainBind(main)}
                  className="relative w-[76px] shrink-0 aspect-[3/4] rounded-lg overflow-hidden cursor-pointer"
                >
                  <TvImg id={main.poster} alt={main.title} className="w-full h-full object-cover" />
                  {main.year !== undefined && (
                    <span
                      className="absolute top-0 left-0 px-1 py-[1px] text-[10px] leading-[14px] text-white rounded-br-[6px]"
                      style={{ background: C.maskBadge }}
                    >
                      {main.year}
                    </span>
                  )}
                  {main.badge && (
                    <div className="absolute top-0 right-0">
                      <Badge text={main.badge} className="rounded-none rounded-bl-[6px]" />
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 inset-x-0 px-1 pb-0.5 pt-3 text-right text-[10px] leading-none text-white"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
                  >
                    {gridCornerNote(main)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    {...mainBind(main)}
                    className="text-[19px] font-bold truncate cursor-pointer"
                    style={{ color: C.text }}
                  >
                    {/* 主命中片名整条染品牌青(证据 f_020) */}
                    <HighlightText text={main.title} keyword={word} color={C.primary} />
                  </div>
                  <div className="flex items-center gap-1 mt-1 overflow-hidden">
                    {main.rankNote && (
                      <span
                        className="shrink-0 px-1 py-[1px] rounded text-[10px] leading-[14px]"
                        style={{ background: C.rankChipBg, color: C.rankChipText }}
                      >
                        {main.rankNote}
                      </span>
                    )}
                    {main.followText && (
                      <span
                        className="shrink-0 px-1 py-[1px] rounded text-[10px] leading-[14px]"
                        style={{ background: C.rankChipBg, color: C.rankChipText }}
                      >
                        {main.followText}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px] mt-1.5" style={{ color: C.textSub }}>
                    {infoLine(main, true)}
                  </div>
                  <div className="text-[12px] mt-1 truncate" style={{ color: C.textSub }}>
                    {castLine(main)}
                  </div>
                </div>
              </div>

              {/* 立即播放 / 下载 */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  {...bindTap('detail.series.open.fromSearchPlay', {
                    params: { contentId: main.id },
                  })}
                  className="flex-1 h-10 rounded-full border-none flex items-center justify-center gap-1 text-[15px] font-medium text-white"
                  style={{ background: C.primary }}
                >
                  <IcPlay size={15} />
                  {s.playNow}
                </button>
                <button
                  {...bindTap('download.select.open.fromSearch', {
                    params: { contentId: main.id },
                  })}
                  className="w-[110px] h-10 rounded-full flex items-center justify-center gap-1 text-[15px]"
                  style={{ background: C.pageBg, color: C.text, border: `1px solid ${C.divider}` }}
                >
                  <IcDownload size={15} />
                  {s.download}
                </button>
              </div>

              {/* 选集 chips(VIP 集右上贴金标) */}
              {episodeChips.length > 0 && (
                <div className="flex items-center gap-2 mt-2.5">
                  {episodeChips.map((ep) =>
                    ep === null ? (
                      <button
                        key="gap"
                        {...bindTap('detail.episodePanel.open.fromSearchResult', {
                          params: { contentId: main.id },
                        })}
                        className="flex-1 h-9 rounded-lg border-none flex items-center justify-center text-[14px]"
                        style={{ background: C.chipGray, color: C.textSub }}
                        aria-label={s.episodeSection}
                      >
                        …
                      </button>
                    ) : (
                      <button
                        key={ep}
                        {...bindTap('detail.series.open.fromSearchEpisode', {
                          params: { contentId: main.id },
                        })}
                        className="relative flex-1 h-9 rounded-lg border-none flex items-center justify-center text-[14px]"
                        style={{ background: C.chipGray, color: C.text }}
                      >
                        {ep}
                        {main.vipFrom !== undefined && ep >= main.vipFrom && (
                          <span
                            className="absolute top-0 right-0 px-[3px] text-[8px] leading-[11px] rounded-tr-[8px] rounded-bl-[4px]"
                            style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
                          >
                            VIP
                          </span>
                        )}
                      </button>
                    ),
                  )}
                </div>
              )}
            </div>

            {/* 剩余 N 部作品 ∨ */}
            {otherWorks.length > 0 && (
              <>
                <button
                  {...bindTap({ kind: 'action', id: 'search.result.moreWorks.expand' }, {
                    onTrigger: () => setUi(UI_MOREWORKS, !moreWorksOpen),
                  })}
                  className="mx-3 mt-2 w-[calc(100%-24px)] h-10 rounded-xl border-none flex items-center justify-center gap-1 text-[14px]"
                  style={{ background: C.pageBg, color: C.text }}
                >
                  剩余 {otherWorks.length} 部作品
                  <IcArrowDown size={14} />
                </button>
                {moreWorksOpen && (
                  <div
                    className="mx-3 mt-2 rounded-xl px-3 py-1"
                    style={{ background: C.pageBg }}
                  >
                    {otherWorks.map((c) => (
                      <div
                        key={c.id}
                        {...cardBind(c)}
                        className="flex items-center gap-2.5 py-2 cursor-pointer"
                      >
                        <div className="w-[46px] shrink-0 aspect-[3/4] rounded overflow-hidden">
                          <TvImg
                            id={c.poster}
                            alt={c.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[14px] font-medium truncate" style={{ color: C.text }}>
                            {c.title}
                          </div>
                          <div className="text-[11px] mt-0.5 truncate" style={{ color: C.textSub }}>
                            {infoLine(c, true)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* 相关影视 */}
            <div className="mt-3 px-3 text-[16px] font-semibold" style={{ color: C.text }}>
              {s.searchRelated}
            </div>
            <div
              className="flex gap-2 overflow-x-auto scrollbar-none px-3 pt-2"
              data-scroll-container="relatedChips"
              data-scroll-direction="horizontal"
            >
              {relatedChips.map((chip, i) => (
                <button
                  key={chip}
                  {...bindTap({ kind: 'action', id: 'search.result.relatedChip.switch' }, {
                    onTrigger: () => setUi(UI_RELATED, i),
                  })}
                  className="shrink-0 px-2.5 py-1 rounded-full text-[12px] border-none whitespace-nowrap"
                  style={
                    i === relatedIndex
                      ? { background: C.primaryBg, color: C.primary }
                      : { background: C.pageBg, color: C.textSub }
                  }
                >
                  {chip}
                </button>
              ))}
            </div>
            <div
              className="flex gap-2 overflow-x-auto scrollbar-none px-3 pt-2"
              data-scroll-container="relatedCards"
              data-scroll-direction="horizontal"
            >
              {relatedItems.map((c) => (
                <div key={c.id} {...cardBind(c)} className="shrink-0 w-[104px] cursor-pointer">
                  <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                    <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                    {c.badge && (
                      <div className="absolute top-0 right-0">
                        <Badge text={c.badge} className="rounded-none rounded-bl-[6px]" />
                      </div>
                    )}
                    <div
                      className="absolute bottom-0 inset-x-0 px-1 pb-0.5 pt-3 text-right text-[10px] leading-none text-white"
                      style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
                    >
                      {gridCornerNote(c)}
                    </div>
                  </div>
                  <div className="mt-1 text-[13px] font-medium truncate" style={{ color: C.text }}>
                    {c.title}
                  </div>
                  <div className="text-[11px] truncate" style={{ color: C.textSub }}>
                    {relationNote(c)}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : activeTab === searchHub.resultTabs[1] ? (
          /* ---------- 影视 tab:竖排列表 ---------- */
          videoList.length === 0 ? (
            <EmptyState text={searchHub.noResult.text} />
          ) : (
          <div className="mt-2" style={{ background: C.pageBg }}>
            {videoList.map((c) => (
              <div key={c.id} {...cardBind(c)} className="flex gap-3 px-3 py-2.5 cursor-pointer">
                <div className="relative w-[76px] shrink-0 aspect-[3/4] rounded-lg overflow-hidden">
                  <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                  {c.year !== undefined && (
                    <span
                      className="absolute top-0 left-0 px-1 py-[1px] text-[10px] leading-[14px] text-white rounded-br-[6px]"
                      style={{ background: C.maskBadge }}
                    >
                      {c.year}
                    </span>
                  )}
                  {c.badge && (
                    <div className="absolute top-0 right-0">
                      <Badge text={c.badge} className="rounded-none rounded-bl-[6px]" />
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 inset-x-0 px-1 pb-0.5 pt-3 text-right text-[10px] leading-none text-white"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}
                  >
                    {gridCornerNote(c)}
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <div className="text-[17px] font-semibold truncate" style={{ color: C.text }}>
                    <HighlightText text={c.title} keyword={word} color={C.primary} />
                  </div>
                  <div className="text-[12px] mt-2" style={{ color: C.textSub }}>
                    {infoLine(c, false)}
                  </div>
                  <div className="text-[12px] mt-1.5 truncate" style={{ color: C.textSub }}>
                    {castLine(c)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
        ) : activeTab === searchHub.resultTabs[3] ? (
          /* ---------- 讨论 tab ---------- */
          discussionResults.length === 0 ? (
            <EmptyState text={searchHub.noResult.text} />
          ) : (
          <div className="mt-2" style={{ background: C.pageBg }}>
            {discussionResults.map((d) => (
              <div
                key={d.id}
                {...bindTap('detail.series.open.fromSearchRelated', {
                  params: { contentId: d.contentId },
                })}
                className="px-3 py-2.5 cursor-pointer"
                style={{ borderBottom: `1px solid ${C.chipGray}` }}
              >
                <div className="text-[14px] font-medium" style={{ color: C.text }}>
                  {d.title}
                </div>
                <div className="text-[12px] mt-1 line-clamp-2" style={{ color: C.textSub }}>
                  {d.content}
                </div>
                <div className="text-[11px] mt-1" style={{ color: C.textTertiary }}>
                  {d.author} · {d.comments}讨论 · {d.shares}转发
                </div>
              </div>
            ))}
          </div>
          )
        ) : activeTab === searchHub.resultTabs[5] ? (
          /* ---------- 话题 tab ---------- */
          topics.length === 0 ? (
            <EmptyState text={searchHub.noResult.text} />
          ) : (
          <div className="mt-2" style={{ background: C.pageBg }}>
            {topics.map((d) => {
              const c = contents.find((x) => x.id === d.contentId);
              return (
                <div
                  key={d.id}
                  {...bindTap('search.topic.open.fromResult', {
                    params: { topicId: d.id },
                  })}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium truncate" style={{ color: C.text }}>
                      # {d.title}
                    </div>
                    <div className="text-[11px] mt-1" style={{ color: C.textSub }}>
                      {d.comments}讨论 · {d.shares}转发
                    </div>
                  </div>
                  <div className="w-[52px] h-[32px] rounded overflow-hidden shrink-0">
                    <TvImg id={c?.still ?? c?.poster} alt={d.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              );
            })}
          </div>
          )
        ) : (
          /* ---------- 用户 / 小说 tab:spec note 明确未实拍,给通用空态 ---------- */
          <EmptyState text={searchHub.noResult.text} />
        )}
      </div>
    </div>
  );
}
