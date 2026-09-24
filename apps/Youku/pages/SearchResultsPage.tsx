import React, { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import { fmtDuration } from '../utils/appTime';
import {
  SORTS, type SortId, creatorName, progressText, searchCatalog, searchCreators, searchShorts,
  sortList, typeChar,
} from '../components/search/searchLib';
import {
  Hi, IcChevronDown, IcChevronUp, IcFlame, IcMic, IcPlaySolid, PosterBadge,
} from '../components/search/SearchBits';
import type { CatalogItem } from '../types';

type ResultTab = 'all' | 'video' | 'shorts' | 'user';
const RESULT_TABS: ResultTab[] = ['all', 'video', 'shorts', 'user'];

/**
 * spec 节点 search.results(route /search/results?keyword=)—— 搜索结果页(s229/s230/s231/s256)。
 * uiStates:tabAll(命中片名=影片主结果卡+相关作品;否则排序行+三列网格)/ tabVideo / tabShorts / tabUser。
 * s229/s231/s256 的"广告"角标卡按 spec 一律移除,用同类内容卡补齐。
 */
export default function SearchResultsPage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const { t } = useI18n();
  const [sp] = useSearchParams();
  const keyword = sp.get('keyword') ?? '';

  const followingCreators = useYoukuStore((s) => s.followingCreators);
  const addSearchHistory = useYoukuStore((s) => s.addSearchHistory);
  const fakeDownload = useYoukuStore((s) => s.fakeDownload);
  const toggleFollowCreator = useYoukuStore((s) => s.toggleFollowCreator);
  const showToast = useYoukuStore((s) => s.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<ResultTab>('all');
  const [sort, setSort] = useState<SortId>('mixed');
  const [expanded, setExpanded] = useState(false);
  const [, setRefreshSeq] = useState(0);

  const { exact, list } = useMemo(() => searchCatalog(keyword), [keyword]);
  const sorted = useMemo(() => sortList(list, sort), [list, sort]);
  const shorts = useMemo(() => searchShorts(keyword), [keyword]);
  const users = useMemo(() => searchCreators(keyword), [keyword]);

  /** 排序行(全部/影视 tab 内,s229/s230) */
  const sortRow = (
    <div className="flex gap-2 px-3 pt-3">
      {SORTS.map((s) => (
        <button
          key={s}
          {...action('search.results.select.sort', () => setSort(s), { params: { value: s } })}
          className={`cursor-pointer rounded-full border-none px-4 py-1.5 text-[14px] ${
            sort === s ? 'bg-(--app-c-chip-bg) font-bold text-(--app-c-text-primary)' : 'bg-transparent text-[#8A8A8A]'
          }`}
        >
          {t(`search.results.sort.${s}`)}
        </button>
      ))}
    </div>
  );

  /** 三列内容卡(全部tab网格 / 相关作品网格共用样式,绑定各自字面量处传入) */
  const gridCard = (item: CatalogItem) => (
    <div key={item.id} {...bindTap('search.results.player.open', { params: contentNavParams(item) })} className="cursor-pointer">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
        <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
        <PosterBadge text={item.badge} />
        <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
          {typeChar(String(item.type), t)}
        </span>
      </div>
      <div className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-(--app-c-text-primary)"><Hi text={item.title} kw={keyword} /></div>
      <div className="mt-0.5 line-clamp-1 text-[12px] text-[#999999]">{item.recTitle}</div>
    </div>
  );

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 + 搜索框(回显关键词,点击回入口改词) + 语音 + 搜索按钮 */}
      <div className="flex shrink-0 items-center gap-2 px-3 py-2">
        <button {...bindBack()} aria-label={t('common.back')} className="flex h-8 w-6 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent text-[22px] leading-none text-(--app-c-text-primary)">
          ‹
        </button>
        <div
          {...bindTap('search.results.entry.open', {
            params: { keyword },
            // 回到搜索入口时把本轮 entry+results 一并弹出,避免搜索页层层叠加(返回需多次)
            nav: { popTo: '/search', popToInclusive: true },
          })}
          className="flex h-9 min-w-0 flex-1 cursor-pointer items-center rounded-full bg-(--app-c-chip-bg) px-3.5"
        >
          <span className="min-w-0 flex-1 truncate text-[15px] text-(--app-c-text-primary)">{keyword}</span>
          <button
            {...action('search.entry.voice.wontfixToast', wontfix, { stopPropagation: true })}
            className="ml-2 shrink-0 cursor-pointer border-none bg-transparent p-0 text-[#999999]"
          >
            <IcMic size={18} />
          </button>
        </div>
        <button
          {...action('search.results.search.repeat', () => {
            addSearchHistory(keyword);
            setRefreshSeq((x) => x + 1);
            scrollRef.current?.scrollTo({ top: 0 });
          })}
          className="shrink-0 cursor-pointer border-none bg-transparent text-[17px] font-medium text-(--app-c-text-primary)"
        >
          {t('search.common.searchBtn')}
        </button>
      </div>

      {/* 结果tab行:全部/影视/短视频/用户 */}
      <div className="flex shrink-0 items-baseline gap-6 border-b border-(--app-c-border) px-4 pb-2.5 pt-1">
        {RESULT_TABS.map((tb) => (
          <button
            key={tb}
            {...action('search.results.select.tab', () => setTab(tb), { params: { value: tb } })}
            className={`cursor-pointer border-none bg-transparent p-0 ${
              tab === tb ? 'text-[19px] font-bold text-(--app-c-text-primary)' : 'text-[15px] text-[#8A8A8A]'
            }`}
          >
            {t(`search.results.tab.${tb}`)}
          </button>
        ))}
      </div>

      <div ref={scrollRef} data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {/* ---------------- 全部tab ---------------- */}
        {tab === 'all' && exact && (
          <div className="pt-3">
            {/* 影片主结果卡(s256):海报+片名+类型年份+导演演员 + 免费试看/下载VIP */}
            <div className="mx-3 rounded-xl bg-(--app-c-card-bg) p-3">
              <div {...bindTap('search.results.player.open', { params: contentNavParams(exact) })} className="flex cursor-pointer gap-3">
                <div className="relative w-24 shrink-0 overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                  <div className="aspect-[2/3]">
                    <Img src={exact.poster} label={exact.title} ratio="poster" className="h-full w-full object-cover" />
                  </div>
                  <PosterBadge text={exact.badge} />
                  <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                    {typeChar(String(exact.type), t)}
                  </span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <div className="truncate text-[20px] font-medium text-[#3D8BFF]">{exact.title}</div>
                  <div className="mt-2 truncate text-[13px] text-[#999999]">
                    {[...exact.tags.slice(0, 2), `${exact.year} ${exact.region}`].join(' / ')}
                  </div>
                  <div className="mt-2 truncate text-[13px] text-[#999999]">{t('search.results.director')} {exact.director}</div>
                  <div className="mt-1.5 truncate text-[13px] text-[#999999]">{t('search.results.actors')} {exact.actors.join(' ')}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2.5">
                <button
                  {...bindTap('search.results.player.open', { params: contentNavParams(exact) })}
                  className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border-none bg-white text-[16px] font-medium text-black"
                >
                  <IcPlaySolid size={14} />
                  {t('search.results.trial')}
                </button>
                <button
                  {...action('search.results.download.add', () => fakeDownload(exact.id, String(exact.type)))}
                  className="relative flex h-11 flex-1 cursor-pointer items-center justify-center rounded-lg border-none bg-(--app-c-chip-bg) text-[16px] text-(--app-c-text-primary)"
                >
                  {t('search.results.download')}
                  <span className="absolute right-0 top-0 rounded-bl-md rounded-tr-lg bg-black/45 px-1 py-0.5 text-[9px] font-semibold leading-none text-[#E8C87E]">VIP</span>
                </button>
              </div>
            </div>

            {/* 相关作品(原"广告"卡移除,用普通相关影片卡补位) */}
            <div className="mt-5 flex items-center px-3">
              <span className="text-[19px] font-bold">{t('search.results.related')}</span>
              <button
                {...action('search.results.related.expand', () => setExpanded((v) => !v))}
                className="ml-auto cursor-pointer border-none bg-transparent text-[14px] text-[#8A8A8A]"
              >
                {t('search.results.more')}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
              {list.slice(0, expanded ? 15 : 6).map(gridCard)}
            </div>
            <button
              {...action('search.results.related.expand', () => setExpanded((v) => !v))}
              className="mx-3 mt-4 flex h-10 w-[calc(100%-24px)] cursor-pointer items-center justify-center gap-1 rounded-lg border-none bg-(--app-c-card-bg) text-[14px] text-[#999999]"
            >
              {expanded ? t('search.results.collapse') : t('search.results.expand')}
              {expanded ? <IcChevronUp size={14} /> : <IcChevronDown size={14} />}
            </button>
          </div>
        )}
        {tab === 'all' && !exact && (
          <div>
            {sortRow}
            <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4 px-3">
              {sorted.slice(0, 12).map(gridCard)}
            </div>
          </div>
        )}

        {/* ---------------- 影视tab(s230):双列大卡 ---------------- */}
        {tab === 'video' && (
          <div>
            {sortRow}
            <div className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-5 px-3">
              {sorted.slice(0, 8).map((item) => (
                <div key={item.id} {...bindTap('search.results.player.open', { params: contentNavParams(item) })} className="cursor-pointer">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                    <Img src={item.poster} label={item.title} ratio="poster" className="h-full w-full object-cover" />
                    <PosterBadge text={item.badge} />
                    <span className="absolute bottom-1 right-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                      {typeChar(String(item.type), t)}
                    </span>
                    {progressText(item, t) && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
                        {progressText(item, t)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 truncate text-[16px] font-medium text-(--app-c-text-primary)"><Hi text={item.title} kw={keyword} /></div>
                  <div className="mt-1 flex items-center gap-1 text-[12px] text-[#999999]">
                    <IcFlame size={11} className="shrink-0 text-[#FF6000]" />
                    <span>{item.heat}</span>
                    <span>/ {item.year} {item.region}</span>
                  </div>
                  <div className="mt-1 truncate text-[12px] text-[#999999]">{t('search.results.director')} {item.director}</div>
                  <div className="mt-0.5 truncate text-[12px] text-[#999999]">{t('search.results.actors')} {item.actors.join(' ')}</div>
                  <div className="mt-0.5 truncate text-[12px] text-[#999999]">{item.recTitle}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- 短视频tab(s231):二创切片双列瀑布流 ---------------- */}
        {tab === 'shorts' && (
          <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 px-3 pt-3">
            {shorts.slice(0, 10).map((sv) => (
              <div key={sv.id} {...bindTap('search.results.shorts.open', { params: { shortId: sv.id } })} className="cursor-pointer">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-(--app-c-card-bg)">
                  <Img src={sv.cover} label={sv.title} ratio="landscape" className="h-full w-full object-cover" />
                  <span className="absolute bottom-1 right-1.5 text-[12px] font-medium text-(--app-c-text-primary) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                    {fmtDuration(sv.durationSec)}
                  </span>
                </div>
                <div className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-(--app-c-text-primary)"><Hi text={sv.title} kw={keyword} /></div>
                <div className="mt-1 truncate text-[12px] text-[#999999]">{creatorName(sv.creatorId)}</div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------- 用户tab(inferred):用户卡列表 ---------------- */}
        {tab === 'user' && (
          <div className="px-3 pt-2">
            {users.map((c) => {
              const followed = followingCreators.includes(c.id);
              return (
                <div
                  key={c.id}
                  {...action('search.results.userCard.wontfixToast', wontfix)}
                  className="flex cursor-pointer items-center gap-3 border-b border-(--app-c-border) py-3.5"
                >
                  <Img src={c.avatar} label={c.name} ratio="square" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-medium text-(--app-c-text-primary)"><Hi text={c.name} kw={keyword} /></div>
                    <div className="mt-1 truncate text-[12px] text-[#999999]">
                      {c.verify} · {t('search.results.fansText', { n: c.fansText })}
                    </div>
                  </div>
                  <button
                    {...action('search.results.userFollow.toggle', () => toggleFollowCreator(c.id), {
                      params: { userId: c.id },
                      stopPropagation: true,
                    })}
                    className={`shrink-0 cursor-pointer rounded-full border-none px-4 py-1.5 text-[13px] ${
                      followed ? 'bg-(--app-c-chip-bg) text-[#999999]' : 'bg-[#0C7BFF] text-(--app-c-text-primary)'
                    }`}
                  >
                    {followed ? t('search.results.followed') : t('search.results.follow')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
