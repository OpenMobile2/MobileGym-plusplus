import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore } from '../state';
import { NEUTRAL } from '../res/colors';
import { IcSearch, IcClose, IcHash, IcLock, IcClock, IcHome, IcDm, IcActivity, IcOverflow } from '../res/icons';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';

const REF_LABEL_KEYS = {
  home: 'tab.home',
  dms: 'tab.dms',
  activity: 'tab.activity',
  more: 'tab.more',
} as const;

const SEARCH_REF_TABS = {
  home: { Icon: IcHome },
  dms: { Icon: IcDm },
  activity: { Icon: IcActivity },
  more: { Icon: IcOverflow },
};

/** 搜索入口页（IMG_2394）：输入框贴底，上方是最近搜索与最近访问过的位置。 */
const SearchPage: React.FC = () => {
  const { bindTap, action, bindInput, go } = useSlackGestures();
  const { t } = useI18n();
  const [params] = useSearchParams();
  const [query, setQuery] = useState('');

  const history = useSlackStore((s) => s.searchHistory);
  const conversations = useSlackStore((s) => s.conversations);
  const users = useSlackStore((s) => s.users);
  const clearSearchHistory = useSlackStore((s) => s.clearSearchHistory);
  const pushSearchHistory = useSlackStore((s) => s.pushSearchHistory);

  const refKey = (params.get('ref') ?? 'home') as keyof typeof SEARCH_REF_TABS;
  const refTab = SEARCH_REF_TABS[refKey] ?? SEARCH_REF_TABS.home;
  const RefIcon = refTab.Icon;

  const backFromHome = bindTap('slack.tab.home');
  const backFromDms = bindTap('slack.tab.dms');
  const backFromActivity = bindTap('slack.tab.activity');
  const backFromMore = bindTap('slack.tab.more');
  const backBind =
    refKey === 'dms'
      ? backFromDms
      : refKey === 'activity'
        ? backFromActivity
        : refKey === 'more'
          ? backFromMore
          : backFromHome;

  const recent = [...conversations].sort((a, b) => b.lastActivityTs - a.lastActivityTs).slice(0, 5);

  const openLocationBind = (c: { id: string; kind: string }) =>
    c.kind === 'channel'
      ? bindTap('slack.search.openlocation', { params: { convId: c.id } })
      : bindTap('slack.search.opendm', { params: { convId: c.id } });

  const submitSearch = () => {
    if (!query.trim()) return;
    pushSearchHistory(query.trim());
    go('slack.search.submit', { q: query.trim() });
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <TopBar variant="title" title={t('search.title')} />

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {history.length > 0 && (
          <>
            <div className="flex items-center justify-between px-4 pb-1 pt-3">
              <h2 className="text-[15px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                {t('search.recent')}
              </h2>
              <button
                {...action('slack.search.history.clear', clearSearchHistory)}
                className="border-none bg-transparent p-0 text-[14px]"
                style={{ color: NEUTRAL.textSecondary }}
              >
                {t('search.clearHistory')}
              </button>
            </div>
            {history.map((term) => (
              <button
                key={term}
                {...bindTap('slack.search.submit', {
                  params: { q: term },
                  beforeTrigger: () => pushSearchHistory(term),
                })}
                className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
              >
                <IcClock size={18} style={{ color: NEUTRAL.textSecondary }} />
                <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                  {term}
                </span>
              </button>
            ))}
          </>
        )}

        <h2 className="px-4 pb-1 pt-4 text-[15px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {t('search.locations')}
        </h2>
        {recent.map((c) => {
          const peer = users.find((u) => u.id === c.memberIds.find((id) => id !== 'u_me'));
          return (
            <button
              key={c.id}
              {...openLocationBind(c)}
              className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-2.5 text-left"
            >
              {c.kind === 'channel' ? (
                <span style={{ color: NEUTRAL.textSecondary }}>
                  {c.isPrivate ? <IcLock size={17} /> : <IcHash size={19} />}
                </span>
              ) : (
                <Avatar user={peer} size={24} rounded="rounded-md" />
              )}
              <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                {c.name}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="flex flex-shrink-0 items-center gap-2 border-t border-[#EAEAEA] px-3 pb-2 pt-1"
        data-keep-keyboard="true"
      >
        <button
          {...backBind}
          aria-label={t(REF_LABEL_KEYS[refKey] ?? REF_LABEL_KEYS.home)}
          className="border-none bg-transparent p-2"
          style={{ color: NEUTRAL.textSecondary }}
        >
          <RefIcon size={22} />
        </button>
        <div
          className="flex flex-1 items-center gap-2 rounded-full border border-[#C9C9C9] px-3 py-2.5"
          style={{ backgroundColor: NEUTRAL.bgInput }}
        >
          <button
            type="button"
            {...action('slack.search.submit', submitSearch)}
            aria-label={t('tab.search')}
            className="border-none bg-transparent p-0"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcSearch size={18} />
          </button>
          <input
            {...bindInput('slack.search.query.input')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submitSearch();
            }}
            placeholder={t('search.placeholder')}
            className="min-w-0 flex-1 border-none bg-transparent text-[16px] outline-none"
            style={{ color: NEUTRAL.textPrimary }}
          />
          {query.trim() ? (
            <button
              {...action('slack.search.query.clear', () => setQuery(''))}
              aria-label="clear"
              className="border-none bg-transparent p-0"
              style={{ color: NEUTRAL.textSecondary }}
            >
              <IcClose size={18} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
