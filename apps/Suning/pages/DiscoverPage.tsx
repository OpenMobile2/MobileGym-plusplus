import React from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { IcSearch, IcUser, IcPlay, IcChevronRight } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { SUNING_CONFIG } from '../data';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import type { ContentCard, ContentChannel, Creator } from '../types';

type TopTab = 'follow' | 'featured';
type FeedTab = 'all' | ContentChannel;

const asTopTab = (v: string | null): TopTab => (v === 'follow' ? 'follow' : 'featured');
const asFeedTab = (v: string | null): FeedTab =>
  v === 'daily' || v === 'food' || v === 'trend' ? v : 'all';

/**
 * 发现Tab(spec discover.main,s294/s295;tabbar 第 2 格,无返回键)。
 * 顶部四 Tab 中 关注/精选 可切、直播/逛逛 toast(Q27=A / Q28=B,用户拍板的组内例外,勿按同组一致回改)。
 * tab / feed 两个离散态走 queryParam;promo.wanhuatong 与 creator.profile 已减范围,入口落合并 toast。
 */
export default function DiscoverPage() {
  const { action, bindTap } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = asTopTab(searchParams.get('tab'));
  const feed = asFeedTab(searchParams.get('feed'));
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);

  const TOP_TABS: Array<{ key: TopTab | 'guang' | 'live'; label: string }> = [
    { key: 'follow', label: S.discoverTabFollow },
    { key: 'guang', label: S.discoverTabGuang },
    { key: 'live', label: S.discoverTabLive },
    { key: 'featured', label: S.discoverTabFeatured },
  ];
  const FEED_TABS: Array<{ key: FeedTab; label: string }> = [
    { key: 'all', label: S.feedTabAll },
    { key: 'daily', label: S.feedTabDaily },
    { key: 'food', label: S.feedTabFood },
    { key: 'trend', label: S.feedTabTrend },
  ];

  const cards = SUNING_CONFIG.contentCards.filter((c) => feed === 'all' || c.channel === feed);
  const feedCreators = SUNING_CONFIG.creators.filter((c) => c.feed != null);

  return (
    <div className="flex h-full flex-col bg-[var(--app-bg)]">
      {/* 顶部四 Tab + 搜索 + 用户 */}
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {TOP_TABS.map((t) =>
            t.key === 'guang' || t.key === 'live' ? (
              <button
                key={t.key}
                {...action('discover.main.wontfix.toast', wontfix)}
                className="cursor-pointer border-none bg-transparent p-0 text-[15px] text-[var(--app-text-muted)]"
              >
                {t.label}
              </button>
            ) : (
              <button
                key={t.key}
                {...action('discover.main.topTab.switch', () => setSearchParams({ tab: t.key }, { replace: true }), {
                  params: { tab: t.key },
                })}
                className={`relative cursor-pointer border-none bg-transparent p-0 ${
                  tab === t.key ? 'text-[17px] font-bold text-[var(--app-text)]' : 'text-[15px] text-[var(--app-text-muted)]'
                }`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute -bottom-1 left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-[var(--app-primary)]" />
                )}
              </button>
            ),
          )}
        </div>
        <button
          {...bindTap('discover.main.search.open')}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcSearch size={19} />
        </button>
        <button
          {...action('discover.main.wontfix.toast', wontfix)}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcUser size={19} />
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-3"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === 'featured' ? (
          <>
            {/* 二级 Tab:内容广场 / 日用派 / 食享乐 / 潮玩汇 */}
            <div className="flex items-center gap-4 bg-[var(--app-surface)] px-3 pb-2">
              {FEED_TABS.map((f) => (
                <button
                  key={f.key}
                  {...action(
                    'discover.main.feedTab.switch',
                    () => setSearchParams({ tab: 'featured', feed: f.key }, { replace: true }),
                    { params: { feed: f.key } },
                  )}
                  className={`cursor-pointer border-none bg-transparent p-0 text-[13px] ${
                    feed === f.key ? 'font-bold text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* banner:海信超级品牌周 */}
            <button
              {...action('discover.main.wontfix.toast', wontfix)}
              className="mx-2 mt-2 block h-20 w-[calc(100%-1rem)] cursor-pointer overflow-hidden rounded-xl border-none bg-gradient-to-r from-[#2E4E9E] via-[#3B6BD6] to-[#15B7E8] p-0"
            >
              <span className="flex h-full flex-col items-center justify-center">
                <span className="text-[18px] font-black italic tracking-wide text-white">
                  {S.discoverBannerTitle}
                </span>
                <span className="mt-0.5 rounded-full bg-[#D8F65A] px-2 text-[11px] font-bold leading-5 text-[#2E4E9E]">
                  {S.discoverBannerDesc}
                </span>
              </span>
            </button>

            {/* 双列内容卡瀑布流 */}
            <div className="mt-2 px-2 [column-gap:0.5rem] columns-2">
              {cards.map((c) => (
                <FeedCard key={c.id} card={c} />
              ))}
            </div>
            <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.listEnd}</div>
          </>
        ) : (
          <>
            {/* 两入口横条:万花筒(已减范围)/ 苏宁 Friend(放弃清单) */}
            <div className="mt-2 flex gap-2 px-2">
              <EntryStrip title={S.discoverEntryWanhuatong} desc={S.discoverEntryWanhuatongDesc} />
              <EntryStrip title={S.discoverEntryFriend} desc={S.discoverEntryFriendDesc} />
            </div>

            {feedCreators.map((c) => (
              <FollowFeedItem key={c.id} creator={c} />
            ))}
            <div className="py-3 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.followNoMore}</div>
          </>
        )}
      </div>
    </div>
  );
}

/** 万花筒 / Friend 会员入口条:目标页均已减范围,整组一致 toast */
function EntryStrip({ title, desc }: { title: string; desc: string }) {
  const { action } = useSuningGestures();
  const showToast = useSuningStore((s) => s.showToast);
  const S = useStrings();
  return (
    <button
      {...action('discover.main.wontfix.toast', () => showToast(S.toastNotOpen))}
      className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 rounded-xl border-none bg-[var(--app-surface)] px-3 py-2.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-bold text-[var(--app-text)]">{title}</span>
        <span className="mt-0.5 block text-[11px] text-[var(--app-c-text-muted)]">{desc}</span>
      </span>
      <IcChevronRight size={14} className="shrink-0 text-[#CCC]" />
    </button>
  );
}

/**
 * 精选内容卡:封面/角标/标题/作者为静态内容区(scope 拍板:内容卡一律 toast);
 * 内嵌商品条是独立热区 → 商详(Q29=A),故与卡体做兄弟节点。
 */
function FeedCard({ card }: { card: ContentCard }) {
  const { bindTap, action } = useSuningGestures();
  const S = useStrings();
  const showToast = useSuningStore((s) => s.showToast);
  const creator = SUNING_CONFIG.creators.find((c) => c.id === card.creatorId);
  const product = card.productId ? productOf(card.productId) : undefined;

  return (
    <div className="mb-2 overflow-hidden rounded-xl bg-[var(--app-surface)] break-inside-avoid">
      <button
        {...action('discover.main.wontfix.toast', () => showToast(S.toastNotOpen))}
        className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
      >
        <span className="relative block aspect-[3/4] w-full bg-[var(--app-c-chip-bg)]">
          <Img src={card.cover} className="h-full w-full object-cover" />
          <span
            className={`absolute bottom-1.5 left-1.5 flex items-center gap-0.5 rounded px-1 text-[10px] leading-4 text-white ${
              card.type === 'live' ? 'bg-[var(--app-c-danger)]' : 'bg-black/50'
            }`}
          >
            {card.type === 'video' && <IcPlay size={9} />}
            {card.type === 'live' ? S.discoverLiveBadge : card.badge}
          </span>
        </span>
        <span className="block px-2 pt-2">
          <span className="line-clamp-2 block text-[13px] leading-[18px] text-[var(--app-text)]">{card.title}</span>
        </span>
      </button>

      {product && (
        <button
          {...bindTap('discover.main.product.open', { params: { productId: product.id } })}
          className="mx-2 mt-1.5 flex w-[calc(100%-1rem)] cursor-pointer items-center gap-1.5 rounded-lg border-none bg-[var(--app-c-chip-bg)] p-1 text-left"
        >
          <span className="h-8 w-8 shrink-0 overflow-hidden rounded bg-[var(--app-surface)]">
            <Img src={product.image} className="h-full w-full object-contain" />
          </span>
          <span className="min-w-0 flex-1 truncate text-[11px] text-[var(--app-text)]">{product.title}</span>
          <span className="shrink-0 pr-1 text-[12px] font-bold text-[var(--app-c-danger)]">¥{product.price}</span>
        </button>
      )}

      <div className="flex items-center gap-1 px-2 py-2">
        <span className="h-4 w-4 shrink-0 overflow-hidden rounded-full bg-[var(--app-c-chip-bg)]">
          {creator && <Img src={creator.avatar} className="h-full w-full object-cover" />}
        </span>
        <span className="min-w-0 flex-1 truncate text-[10px] text-[var(--app-c-text-muted)]">{creator?.name}</span>
        <span className="shrink-0 text-[10px] text-[var(--app-c-text-muted)]">{card.viewsText}</span>
      </div>
    </div>
  );
}

/** 关注流动态:头像/名(→creator.profile 已减范围 toast)+ [+关注]/[去看看] + 文案 + 直播封面卡 */
function FollowFeedItem({ creator }: { creator: Creator }) {
  const { action } = useSuningGestures();
  const S = useStrings();
  const followedCreators = useSuningStore((s) => s.followedCreators);
  const toggleFollowCreator = useSuningStore((s) => s.toggleFollowCreator);
  const showToast = useSuningStore((s) => s.showToast);
  const wontfix = () => showToast(S.toastNotOpen);
  const followed = followedCreators.includes(creator.id);
  const feed = creator.feed;
  if (!feed) return null;

  return (
    <div className="mt-2 bg-[var(--app-surface)] px-3 py-3">
      <div className="flex items-center gap-2">
        {/* 达人主页 creator.profile 已减范围,头像/昵称保留 toast 反馈 */}
        <button
          {...action('discover.main.wontfix.toast', wontfix)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
        >
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-[var(--app-c-chip-bg)]">
            <Img src={creator.avatar} className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold text-[var(--app-text)]">{creator.name}</span>
            {feed.cert && <span className="mt-0.5 block truncate text-[10px] text-[var(--app-c-text-muted)]">{feed.cert}</span>}
          </span>
        </button>
        {followed ? (
          // 「去看看」落点为直播间,直播整体 wontfix
          <button
            {...action('discover.main.wontfix.toast', wontfix)}
            className="shrink-0 cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-1 text-[12px] text-[var(--app-text-muted)]"
          >
            {S.discoverGoWatch}
          </button>
        ) : (
          <button
            {...action('discover.main.creator.followToggle', () => {
              toggleFollowCreator(creator.id);
              showToast(S.toastCreatorFollowed);
            }, { params: { creatorId: creator.id } })}
            className="shrink-0 cursor-pointer rounded-full border-none bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-dark)] px-3 py-1 text-[12px] font-bold text-white"
          >
            {S.discoverFollowBtn}
          </button>
        )}
      </div>

      <div className="mt-2 text-[13px] leading-5 text-[var(--app-text)]">{feed.text}</div>

      {feed.cover && (
        <button
          {...action('discover.main.wontfix.toast', wontfix)}
          className="mt-2 block w-full cursor-pointer overflow-hidden rounded-xl border-none bg-[var(--app-c-chip-bg)] p-0"
        >
          <span className="relative block aspect-[16/9] w-full">
            <Img src={feed.cover} className="h-full w-full object-cover" />
            {feed.live && (
              <span className="absolute left-2 top-2 rounded bg-[var(--app-c-danger)] px-1.5 text-[10px] leading-4 text-white">
                {S.discoverLiveBadge}
              </span>
            )}
          </span>
        </button>
      )}
    </div>
  );
}
