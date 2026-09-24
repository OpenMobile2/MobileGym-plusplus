import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSlackGestures } from '../hooks/useSlackGestures';
import { useI18n } from '../i18n';
import { useSlackStore, ME } from '../state';
import { SEARCH_TYPES } from '../constants';
import { NEUTRAL, PURPLE, HIGHLIGHT, GREEN } from '../res/colors';
import { IcSearch, IcClose, IcHome, IcChevronDown, IcDm, IcActivity, IcOverflow } from '../res/icons';
import { formatListTime } from '../utils/format';
import Avatar from '../components/Avatar';
import Sheet, { PopoverMenu } from '../components/Sheet';

const Highlighted: React.FC<{ text: string; term: string }> = ({ text, term }) => {
  if (!term) return <>{text}</>;
  const parts = text.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase() ? (
          <span key={i} style={{ backgroundColor: HIGHLIGHT }}>{p}</span>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        ),
      )}
    </>
  );
};

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

const SearchResultsPage: React.FC = () => {
  const { bindTap, bindBack, action, bindInput, back } = useSlackGestures();
  const { t, locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const term = params.get('q') ?? '';
  const type = params.get('type') ?? 'messages';
  const fromUser = params.get('from') ?? '';
  const inConv = params.get('in') ?? '';
  const myChannels = params.get('myChannels') === '1';
  const excludeBots = params.get('excludeBots') === '1';
  const sort = params.get('sort') ?? 'relevance';
  const sheet = params.get('sheet');
  const filterField = params.get('filterField') ?? 'from';
  const refKey = (params.get('ref') ?? 'home') as keyof typeof SEARCH_REF_TABS;
  const refTab = SEARCH_REF_TABS[refKey] ?? SEARCH_REF_TABS.home;
  const RefIcon = refTab.Icon;

  const backFromHome = bindTap('slack.searchresults.gohome');
  const backFromDms = bindTap('slack.searchresults.godms');
  const backFromActivity = bindTap('slack.searchresults.goactivity');
  const backFromMore = bindTap('slack.searchresults.gomore');
  const refBind =
    refKey === 'dms'
      ? backFromDms
      : refKey === 'activity'
        ? backFromActivity
        : refKey === 'more'
          ? backFromMore
          : backFromHome;

  const [query, setQuery] = useState(term);

  useEffect(() => {
    setQuery(term);
  }, [term]);

  const messages = useSlackStore((s) => s.messages);
  const users = useSlackStore((s) => s.users);
  const conversations = useSlackStore((s) => s.conversations);
  const pushSearchHistory = useSlackStore((s) => s.pushSearchHistory);

  const mergeParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === '') next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };

  const q = term.trim().toLowerCase();

  /** 消息命中：正文 / 人名 / handle / 来源会话名 */
  const hits = useMemo(() => {
    if (!q || type !== 'messages') return [];
    let list = messages.filter((m) => {
      if (m.deleted) return false;
      if (m.text.toLowerCase().includes(q)) return true;
      const u = users.find((x) => x.id === m.userId);
      if (u?.displayName.toLowerCase().includes(q) || u?.handle.toLowerCase().includes(q)) return true;
      const c = conversations.find((x) => x.id === m.convId);
      if (c?.name.toLowerCase().includes(q)) return true;
      return false;
    });
    if (fromUser) list = list.filter((m) => m.userId === fromUser);
    if (inConv) list = list.filter((m) => m.convId === inConv);
    if (myChannels) list = list.filter((m) => conversations.find((c) => c.id === m.convId)?.kind === 'channel');
    if (excludeBots) list = list.filter((m) => !users.find((u) => u.id === m.userId)?.isBot);
    if (sort === 'recent') {
      list.sort((a, b) => b.ts - a.ts);
    } else {
      // 最相关：人名/handle 命中 > 正文靠前命中 > 来源频道名 > 时间
      const score = (m: (typeof list)[number]) => {
        const u = users.find((x) => x.id === m.userId);
        const c = conversations.find((x) => x.id === m.convId);
        let s = 0;
        if (u?.displayName.toLowerCase().includes(q)) s += 100;
        if (u?.handle.toLowerCase().includes(q)) s += 80;
        const ti = m.text.toLowerCase().indexOf(q);
        if (ti >= 0) s += 40 - Math.min(ti, 30);
        if (c?.name.toLowerCase().includes(q)) s += 20;
        return s;
      };
      list.sort((a, b) => score(b) - score(a) || b.ts - a.ts);
    }
    return list;
  }, [q, type, messages, fromUser, inConv, myChannels, excludeBots, sort, conversations, users]);

  const peopleHits = useMemo(() => {
    if (!q || type !== 'people') return [];
    return users.filter(
      (u) =>
        !u.isBot &&
        (u.displayName.toLowerCase().includes(q) ||
          u.handle.toLowerCase().includes(q) ||
          u.title.toLowerCase().includes(q)),
    );
  }, [q, type, users]);

  const channelHits = useMemo(() => {
    if (!q || type !== 'channels') return [];
    return conversations.filter(
      (c) => c.kind === 'channel' && c.name.toLowerCase().includes(q),
    );
  }, [q, type, conversations]);

  const typeLabel = t(SEARCH_TYPES.find((x) => x.id === type)?.labelKey ?? 'search.type.messages');
  const fromUserName = users.find((u) => u.id === fromUser)?.displayName;
  const inConvName = conversations.find((c) => c.id === inConv)?.name;

  const openConvBind = (convId: string, messageId: string) => {
    const c = conversations.find((x) => x.id === convId);
    return c?.kind === 'channel'
      ? bindTap('slack.searchresults.openmessage', { params: { convId, msg: messageId } })
      : bindTap('slack.searchresults.opendm', { params: { convId, msg: messageId } });
  };

  // 弹层用 push 打开，关层走 back，与系统返回键一致（避免 replace 导致一次返回跳出结果页）
  const dismissSheet = action('slack.searchresults.closesheet', () => back());
  const headerClose = sheet ? dismissSheet : bindBack();
  const bottomClose = sheet ? dismissSheet : bindBack();

  const submitQuery = () => {
    const q = query.trim();
    if (!q) {
      inputRef.current?.focus();
      return;
    }
    pushSearchHistory(q);
    mergeParams({ q });
    inputRef.current?.focus();
  };

  const clearQuery = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setQuery('');
    mergeParams({ q: null });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const chipStyle = (on: boolean) => ({
    backgroundColor: on ? PURPLE.pill : '#F3F3F3',
    color: on ? '#FFFFFF' : NEUTRAL.textPrimary,
  });

  return (
    <div className="relative flex h-full flex-col bg-white">
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-[#EAEAEA] px-3 py-2 pt-11">
        <button
          {...headerClose}
          className="border-none bg-transparent p-2"
          style={{ color: NEUTRAL.textPrimary }}
        >
          <IcClose size={22} />
        </button>
        <span className="flex-1 truncate text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
          {term}
        </span>
      </div>

      <div
        className="flex flex-shrink-0 gap-2 overflow-x-auto px-3 py-2"
        data-scroll-direction="horizontal"
      >
        <button
          {...bindTap('slack.searchresults.opentypemenu')}
          className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] font-medium border-none"
          style={chipStyle(true)}
        >
          {typeLabel} ⌄
        </button>
        {type === 'messages' && (
          <>
            <button
              {...bindTap('slack.searchresults.openfilterpicker', { params: { filterField: 'from' } })}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] border-none"
              style={chipStyle(Boolean(fromUser))}
            >
              {fromUser ? fromUserName : t('search.filter.from')} ⌄
            </button>
            <button
              {...bindTap('slack.searchresults.openfilterpicker', { params: { filterField: 'in' } })}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] border-none"
              style={chipStyle(Boolean(inConv))}
            >
              {inConv ? (inConvName?.startsWith('#') ? inConvName : `#${inConvName}`) : t('search.filter.in')} ⌄
            </button>
            <button
              {...action('slack.searchresults.togglequickfilter', () =>
                mergeParams({ myChannels: myChannels ? null : '1' }),
              )}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] border-none"
              style={chipStyle(myChannels)}
            >
              {t('search.filter.myChannels')}
            </button>
            <button
              {...action('slack.searchresults.togglequickfilter', () =>
                mergeParams({ excludeBots: excludeBots ? null : '1' }),
              )}
              className="flex-shrink-0 rounded-full px-3 py-1.5 text-[14px] border-none"
              style={chipStyle(excludeBots)}
            >
              {t('search.filter.excludeBots')}
            </button>
          </>
        )}
      </div>

      {(type === 'messages' || type === 'people' || type === 'channels') && (
        <div className="flex flex-shrink-0 items-center justify-between px-4 py-2">
          <span className="text-[14px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('search.found', {
              count:
                type === 'people'
                  ? peopleHits.length
                  : type === 'channels'
                    ? channelHits.length
                    : hits.length,
            })}
          </span>
          {type === 'messages' && (
            <button
              {...action('slack.searchresults.select.sort', () =>
                mergeParams({ sort: sort === 'relevance' ? 'recent' : 'relevance' }),
              )}
              className="flex items-center gap-1 border-none bg-transparent text-[14px]"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {sort === 'relevance' ? t('search.sort.relevance') : t('search.sort.recent')}
              <IcChevronDown size={14} />
            </button>
          )}
        </div>
      )}

      <div
        className="min-h-0 flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {type === 'people' ? (
          peopleHits.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('search.noResultsTitle')}
            </p>
          ) : (
            peopleHits.map((u) => (
              <button
                key={u.id}
                {...bindTap('slack.searchresults.openprofile', { params: { userId: u.id } })}
                className="flex w-full items-center gap-3 border-b border-[#EAEAEA] bg-transparent px-4 py-3 text-left"
              >
                <Avatar user={u} size={40} rounded="rounded-md" />
                <span className="min-w-0">
                  <span className="block text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                    <Highlighted text={u.displayName} term={term} />
                  </span>
                  <span className="block text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                    @{u.handle}
                    {u.title ? ` · ${u.title}` : ''}
                  </span>
                </span>
              </button>
            ))
          )
        ) : type === 'channels' ? (
          channelHits.length === 0 ? (
            <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('search.noResultsTitle')}
            </p>
          ) : (
            channelHits.map((c) => (
              <button
                key={c.id}
                {...bindTap('slack.searchresults.openmessage', { params: { convId: c.id } })}
                className="flex w-full items-center gap-3 border-b border-[#EAEAEA] bg-transparent px-4 py-3 text-left"
              >
                <span className="text-[16px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                  #<Highlighted text={c.name} term={term} />
                </span>
              </button>
            ))
          )
        ) : type !== 'messages' ? (
          <p className="px-4 py-10 text-center text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
            {t('search.emptyType')}
          </p>
        ) : hits.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-[40px]">👍</p>
            <p className="mt-3 text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
              {t('search.noResultsTitle')}
            </p>
            <p className="mt-2 text-[15px]" style={{ color: NEUTRAL.textSecondary }}>
              {t('search.noResultsHint')}
            </p>
            <button
              {...action('slack.searchresults.editquery', () => inputRef.current?.focus())}
              className="mt-5 rounded-lg border-none px-6 py-2.5 text-[15px] font-bold text-white"
              style={{ backgroundColor: GREEN.primary }}
            >
              {t('search.editQuery')}
            </button>
          </div>
        ) : (
          hits.map((m) => {
            const u = users.find((x) => x.id === m.userId);
            const conv = conversations.find((c) => c.id === m.convId);
            return (
              <button
                key={m.id}
                {...openConvBind(m.convId, m.id)}
                className="flex w-full gap-3 border-b border-[#EAEAEA] bg-transparent px-4 py-3 text-left"
              >
                <Avatar user={u} size={34} rounded="rounded-md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px]" style={{ color: NEUTRAL.textSecondary }}>
                    {conv?.kind === 'channel' ? `#${conv.name}` : conv?.name} ·{' '}
                    {formatListTime(m.ts, locale)}
                  </p>
                  <p className="text-[15px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
                    <Highlighted text={u?.displayName ?? ''} term={term} />
                  </p>
                  <p className="line-clamp-3 text-[15px]" style={{ color: NEUTRAL.textPrimary }}>
                    <Highlighted text={m.text} term={term} />
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div
        className="flex flex-shrink-0 items-center gap-2 border-t border-[#EAEAEA] px-3 pb-2 pt-1"
        data-keep-keyboard="true"
      >
        <button
          {...refBind}
          aria-label={t(REF_LABEL_KEYS[refKey] ?? REF_LABEL_KEYS.home)}
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center border-none bg-transparent"
          style={{ color: NEUTRAL.textSecondary }}
        >
          <RefIcon size={22} />
        </button>
        <div
          className="flex min-h-[40px] flex-1 items-center gap-2 rounded-full border border-[#C9C9C9] px-3 py-2.5"
          style={{ backgroundColor: NEUTRAL.bgInput }}
        >
          <button
            type="button"
            {...action('slack.searchresults.submitquery', submitQuery)}
            aria-label={t('tab.search')}
            className="border-none bg-transparent p-0"
            style={{ color: NEUTRAL.textSecondary }}
          >
            <IcSearch size={17} />
          </button>
          <input
            ref={inputRef}
            {...bindInput('slack.searchresults.query.input')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                pushSearchHistory(query.trim());
                mergeParams({ q: query.trim() });
              }
            }}
            className="min-w-0 flex-1 border-none bg-transparent text-[15px] outline-none"
            style={{ color: NEUTRAL.textPrimary }}
          />
          {query && (
            <button
              type="button"
              {...action('slack.searchresults.clearquery', () => clearQuery())}
              onMouseDown={(e) => e.preventDefault()}
              className="border-none bg-transparent p-0"
              style={{ color: NEUTRAL.textSecondary }}
            >
              ⊗
            </button>
          )}
        </div>
        <button
          {...bottomClose}
          className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center border-none bg-transparent"
          style={{ color: NEUTRAL.textSecondary }}
        >
          <IcClose size={22} />
        </button>
      </div>

      {sheet === 'typeMenu' && (
        <PopoverMenu position="top-28 left-4" dismissBind={dismissSheet}>
          {SEARCH_TYPES.map((st) => (
            <button
              key={st.id}
              {...action(`slack.search.type.${st.id}`, () => {
                mergeParams({ type: st.id, sheet: null });
              })}
              className="flex w-full items-center gap-2 border-none bg-transparent px-4 py-2.5 text-left text-[16px]"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {type === st.id && <span>✓</span>}
              {t(st.labelKey)}
            </button>
          ))}
        </PopoverMenu>
      )}

      {sheet === 'filterPicker' && (
        <Sheet handle={false} className="max-h-[70%]" dismissBind={dismissSheet}>
          <h2 className="px-4 pb-2 pt-3 text-center text-[17px] font-bold" style={{ color: NEUTRAL.textPrimary }}>
            {filterField === 'from' ? t('search.filter.from') : t('search.filter.in')}
          </h2>
          <div className="max-h-[50vh] overflow-y-auto">
            <button
              {...action('slack.search.filter.clear', () =>
                mergeParams({
                  ...(filterField === 'from' ? { from: null } : { in: null }),
                  sheet: null,
                  filterField: null,
                }),
              )}
              className="flex w-full border-none bg-transparent px-4 py-3 text-left text-[16px]"
              style={{ color: NEUTRAL.textPrimary }}
            >
              {(filterField === 'from' ? !fromUser : !inConv) && <span>✓ </span>}
              {t('search.filter.clear')}
            </button>
            {filterField === 'from'
              ? users
                  .filter((u) => u.id !== ME)
                  .map((u) => (
                    <button
                      key={u.id}
                      {...action('slack.search.filter.select.user', () => {
                        mergeParams({ from: u.id, sheet: null, filterField: null });
                      })}
                      className="flex w-full items-center gap-3 border-none bg-transparent px-4 py-3 text-left"
                    >
                      <Avatar user={u} size={36} rounded="rounded-md" />
                      <span className="text-[16px]" style={{ color: NEUTRAL.textPrimary }}>
                        {u.displayName}
                      </span>
                    </button>
                  ))
              : conversations.map((c) => (
                  <button
                    key={c.id}
                    {...action('slack.search.filter.select.conv', () => {
                      mergeParams({ in: c.id, sheet: null, filterField: null });
                    })}
                    className="flex w-full border-none bg-transparent px-4 py-3 text-left text-[16px]"
                    style={{ color: NEUTRAL.textPrimary }}
                  >
                    {c.kind === 'channel' ? `#${c.name}` : c.name}
                  </button>
                ))}
          </div>
        </Sheet>
      )}
    </div>
  );
};

export default SearchResultsPage;
