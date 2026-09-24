import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { TopBar, BigTitle, SectionHeader, Artwork, fmtDate, showToast } from '../components/common';
import { EpisodeRow, RankTile, ShowTile } from '../components/cards';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { useBroadcastStore } from '../state';
import { ICON_REGISTRY, IcSearch, IcStar } from '../res/icons';
import { useBroadcastStrings } from '../hooks/useBroadcastStrings';
import { formatString, localizeGenre } from '../res/localize';

const ChevronRow: React.FC<{ label: string; detail?: string; tap: React.HTMLAttributes<HTMLButtonElement> }> = ({ label, detail, tap }) => (
  <button {...tap} className="flex items-center w-full min-h-12 px-4 bg-white border-b border-app-border text-left">
    <span className="flex-1 text-[16px] font-medium text-app-text">{label}</span>
    {detail && <span className="text-[13px] text-app-text-muted mr-2">{detail}</span>}
    <span className="text-[25px] leading-none text-app-text-muted">›</span>
  </button>
);

export const BrowsePage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  const shows = useBroadcastStore(s => s.shows);
  const featuredId = useBroadcastStore(s => s.featuredShowId);
  const newIds = useBroadcastStore(s => s.newShowIds);
  const topIds = useBroadcastStore(s => s.topShowIds);
  const featured = shows[featuredId];
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <BigTitle title={s.tab_browse} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {featured && (
          <button {...bindTap('broadcast.show-open', { params: { id: featured.id } })} className="mx-4 w-[calc(100%-2rem)] rounded-[20px] overflow-hidden text-left bg-white border border-app-border shadow-sm">
            <div className="px-4 pt-4 text-[11px] tracking-[.14em] font-bold text-app-primary">{s.browse_editor_pick}</div>
            <div className="flex items-center gap-4 p-4 pt-3">
              <Artwork showId={featured.id} color={featured.artworkColor} text={featured.artworkText} size={124} radius={14} className="shadow-md" />
              <div className="min-w-0"><div className="text-[21px] font-extrabold text-app-text leading-tight">{featured.title}</div><div className="mt-1 text-[13px] font-medium text-app-text-muted">{featured.author}</div><div className="mt-3 text-[13px] text-app-text-muted line-clamp-3 leading-relaxed">{featured.desc}</div></div>
            </div>
          </button>
        )}
        <SectionHeader title={s.new_shows} />
        <div className="flex gap-3 px-4 overflow-x-auto" data-scroll-container="carousel" data-scroll-direction="horizontal">
          {newIds.map(id => shows[id] && <ShowTile key={id} show={shows[id]} size={136} />)}
        </div>
        <SectionHeader title={s.top_shows_rankings} onMore={bindTap('broadcast.topShows-open')} />
        <div className="flex gap-3 px-4 overflow-x-auto">
          {topIds.slice(0, 6).map((id, i) => shows[id] && <RankTile key={id} show={shows[id]} rank={i + 1} size={128} />)}
        </div>
      </div>
    </div>
  );
};

export const LibraryPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  const shows = useBroadcastStore(s => s.shows);
  const followed = useBroadcastStore(s => s.followedShowIds);
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <BigTitle title={s.tab_library} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="border-y border-app-border">
          <ChevronRow label={s.shows} tap={bindTap('broadcast.libraryShows-open')} />
          <ChevronRow label={s.channels} tap={bindTap('broadcast.libraryChannels-open')} />
          <ChevronRow label={s.categories} tap={bindTap('broadcast.libraryCategories-open')} />
          <ChevronRow label={s.saved} tap={bindTap('broadcast.librarySaved-open')} />
          <ChevronRow label={s.downloaded} tap={bindTap('broadcast.libraryDownloaded-open')} />
          <ChevronRow label={s.latest_episodes} tap={bindTap('broadcast.libraryLatest-open')} />
        </div>
        <SectionHeader title={s.recently_updated} />
        <div className="flex gap-3 px-4 overflow-x-auto">
          {followed.slice(0, 6).map(id => shows[id] && <ShowTile key={id} show={shows[id]} size={136} />)}
        </div>
      </div>
    </div>
  );
};

export const SearchPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap, go } = useBroadcastGestures();
  const genres = useBroadcastStore(s => s.genres);
  const shows = useBroadcastStore(s => s.shows);
  const [query, setQuery] = useState('');
  const suggestions = query.trim()
    ? Object.values(shows).filter(show => `${show.title}${show.author}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4)
    : [];
  const submit = () => {
    const value = query.trim();
    if (value) go('broadcast.searchResults-open', { q: value });
  };
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <BigTitle title={s.tab_search} />
      <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="h-10 rounded-xl bg-[#eeeef2] flex items-center px-3 gap-2">
          <IcSearch size={18} className="text-app-text-muted shrink-0" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            data-action="broadcast.search.input"
            data-action-params={JSON.stringify({ value: query })}
            className="flex-1 min-w-0 bg-transparent outline-none text-[15px] text-app-text placeholder:text-app-text-muted"
            placeholder={s.search_placeholder}
            aria-label={s.search_placeholder}
          />
          {query && <button onClick={() => setQuery('')} className="text-[13px] text-app-primary">{s.clear}</button>}
        </div>
        {query && (
          <div className="mt-2 rounded-xl bg-white divide-y divide-app-border overflow-hidden">
            {suggestions.map(show => (
              <button key={show.id} {...bindTap('broadcast.searchResults-open', { params: { q: show.title }, onTrigger: () => setQuery(show.title) })} className="w-full px-3 py-3 flex items-center gap-3 text-left active:bg-black/5">
                <IcSearch size={16} className="text-app-text-muted" />
                <span className="flex-1 text-[15px] text-app-text">{show.title}</span>
                <span className="text-[12px] text-app-text-muted">{show.author}</span>
              </button>
            ))}
            <button onClick={submit} className="w-full px-3 py-3 text-left text-[15px] text-app-primary">{formatString(s.search_query, { query })}</button>
          </div>
        )}
        <div className="text-[20px] font-bold mt-5 mb-3 text-app-text">{s.browse_categories}</div>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(genres).map(g => {
            const Icon = ICON_REGISTRY[g.icon as keyof typeof ICON_REGISTRY] || IcSearch;
            return (
              <button key={g.id} {...bindTap('broadcast.category-open', { params: { id: g.id } })} className="h-[82px] rounded-xl p-3 text-left text-white overflow-hidden relative" style={{ background: `linear-gradient(135deg,${g.color},color-mix(in srgb,${g.color} 65%,#111))` }}>
                <div className="text-[17px] font-bold">{localizeGenre(g.id, g.name, s)}</div><Icon size={38} strokeWidth={1.8} className="absolute right-3 bottom-2 opacity-85" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ShowGridPage: React.FC<{ title: string; ids?: string[] }> = ({ title, ids }) => {
  const shows = useBroadcastStore(s => s.shows);
  const list = ids ?? Object.keys(shows);
  return <div className="flex flex-col h-full bg-app-bg"><TopBar title={title} /><div className="grid grid-cols-2 gap-4 p-4 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">{list.map(id => shows[id] && <ShowTile key={id} show={shows[id]} size={142} />)}</div></div>;
};

const EpisodeListPage: React.FC<{ title: string; ids: string[] }> = ({ title, ids }) => {
  const episodes = useBroadcastStore(s => s.episodes);
  return <div className="flex flex-col h-full bg-app-bg"><TopBar title={title} /><div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">{ids.map(id => episodes[id] && <EpisodeRow key={id} ep={episodes[id]} />)}</div></div>;
};

export const TopShowsPage: React.FC = () => { const s = useBroadcastStrings(); return <ShowGridPage title={s.top_shows} ids={useBroadcastStore(state => state.topShowIds)} />; };
export const LibraryShowsPage: React.FC = () => { const s = useBroadcastStrings(); return <ShowGridPage title={s.shows} ids={useBroadcastStore(state => state.followedShowIds)} />; };
export const CategoryPage: React.FC = () => { const s = useBroadcastStrings(); const { id = '' } = useParams(); const genre = useBroadcastStore(state => state.genres[id]); return <ShowGridPage title={genre ? localizeGenre(genre.id, genre.name, s) : s.categories} ids={genre?.showIds || []} />; };
export const SavedPage: React.FC = () => { const s = useBroadcastStrings(); return <EpisodeListPage title={s.saved} ids={useBroadcastStore(state => state.savedEpisodeIds)} />; };
export const DownloadedPage: React.FC = () => { const s = useBroadcastStrings(); return <EpisodeListPage title={s.downloaded} ids={useBroadcastStore(state => state.downloadedEpisodeIds)} />; };
export const LatestPage: React.FC = () => { const s = useBroadcastStrings(); return <EpisodeListPage title={s.latest_episodes} ids={Object.keys(useBroadcastStore(state => state.episodes)).slice(0, 12)} />; };
export const ShowEpisodesPage: React.FC = () => { const s = useBroadcastStrings(); const { id = '' } = useParams(); const show = useBroadcastStore(state => state.shows[id]); return <EpisodeListPage title={s.latest_episodes} ids={show?.episodeIds || []} />; };

const InfoPage: React.FC<{ title: string; body: React.ReactNode }> = ({ title, body }) => <div className="flex flex-col h-full bg-[#f2f2f7]"><TopBar title={title} /><div className="flex-1 overflow-y-auto p-4" data-scroll-container="main" data-scroll-direction="vertical">{body}</div></div>;
export const LibraryChannelsPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  return <InfoPage title={s.channels} body={<button {...bindTap('broadcast.channel-open', { params: { id: 'ch_shengdong' } })} className="w-full rounded-xl bg-white p-4 text-left text-app-text">JustPod <span className="float-right text-app-text-muted">›</span></button>} />;
};
export const ChannelPage: React.FC = () => <ShowGridPage title="JustPod" ids={['s_espresso', 's_whatsnext']} />;
export const LibraryCategoriesPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  const genres = useBroadcastStore(s => s.genres);
  const followed = useBroadcastStore(s => s.followedShowIds);
  const rows = Object.values(genres)
    .map(genre => ({ genre, count: genre.showIds.filter(id => followed.includes(id)).length }))
    .filter(item => item.count > 0);
  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <TopBar title={s.categories} right={<button {...bindTap('broadcast.accountCategories-open')} className="text-[14px] font-semibold text-app-primary">{s.manage}</button>} />
      <div className="flex-1 overflow-y-auto p-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-white divide-y divide-app-border overflow-hidden">
          {rows.map(({ genre, count }) => {
            const Icon = ICON_REGISTRY[genre.icon as keyof typeof ICON_REGISTRY] || IcSearch;
            return (
              <button key={genre.id} {...bindTap('broadcast.category-open', { params: { id: genre.id } })} className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-black/5">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: genre.color }}><Icon size={23} /></span>
                <span className="flex-1 min-w-0"><span className="block text-[16px] font-semibold text-app-text">{localizeGenre(genre.id, genre.name, s)}</span><span className="block text-[12px] text-app-text-muted mt-0.5">{formatString(s.followed_shows_count, { count })}</span></span>
                <span className="text-[24px] text-app-text-muted">›</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export const SearchResultsPage: React.FC = () => {
  const s = useBroadcastStrings();
  const [sp] = useSearchParams();
  const query = (sp.get('q') || '').trim().toLowerCase();
  const shows = useBroadcastStore(s => s.shows);
  const episodes = useBroadcastStore(s => s.episodes);
  const matchedShows = Object.values(shows).filter(show => !query || `${show.title}${show.author}${show.desc}`.toLowerCase().includes(query));
  const matchedEpisodes = Object.values(episodes).filter(ep => !query || `${ep.title}${ep.desc}${shows[ep.showId]?.title || ''}`.toLowerCase().includes(query));
  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={query ? `“${sp.get('q')}”` : s.search_results} />
      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4 pt-4 pb-2 text-[20px] font-bold text-app-text">{s.shows}</div>
        {matchedShows.length ? (
          <div className="grid grid-cols-2 gap-4 px-4">{matchedShows.slice(0, 10).map(show => <ShowTile key={show.id} show={show} size={142} />)}</div>
        ) : <div className="px-4 text-sm text-app-text-muted">{s.no_matching_shows}</div>}
        <div className="px-4 pt-6 pb-2 text-[20px] font-bold text-app-text">{s.latest_episodes}</div>
        {matchedEpisodes.slice(0, 12).map(ep => <EpisodeRow key={ep.id} ep={ep} />)}
      </div>
    </div>
  );
};

export const ReviewsPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { id = '' } = useParams();
  const { bindTap } = useBroadcastGestures();
  const show = useBroadcastStore(s => s.shows[id]);
  const reviews = useBroadcastStore(s => s.reviews).filter(review => review.showId === id);
  const myRating = useBroadcastStore(s => s.myRatings[id] || 0);
  const rateShow = useBroadcastStore(s => s.rateShow);
  if (!show) return <InfoPage title={s.ratings_reviews} body={<div className="text-app-text-muted">{s.show_not_found}</div>} />;
  const bars = [5, 4, 3, 2, 1].map(star => ({ star, count: reviews.filter(review => review.stars === star).length }));
  const maxCount = Math.max(1, ...bars.map(item => item.count));
  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <TopBar title={s.ratings_reviews} right={<button {...bindTap('broadcast.showWriteReview-open', { params: { id } })} className="text-[13px] font-semibold text-app-primary">{s.write_review}</button>} />
      <div className="flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-2xl bg-white p-4 mt-4">
          <div className="flex items-center gap-5">
            <div><div className="text-[46px] leading-none font-extrabold text-app-text">{show.rating}</div><div className="mt-1 text-[12px] text-app-text-muted">{formatString(s.ratings_count, { count: show.ratingCount })}</div></div>
            <div className="flex-1 space-y-1">
              {bars.map(({ star, count }) => <div key={star} className="flex items-center gap-2"><span className="w-2 text-[10px] text-app-text-muted">{star}</span><div className="h-1.5 flex-1 rounded-full bg-[#e5e5ea] overflow-hidden"><div className="h-full bg-app-primary" style={{ width: `${Math.max(8, count / maxCount * 100)}%` }} /></div></div>)}
            </div>
          </div>
          <div className="border-t border-app-border mt-4 pt-4">
            <div className="text-center text-[13px] text-app-text-muted mb-2">{myRating ? formatString(s.your_rating, { count: myRating }) : s.tap_to_rate}</div>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map(star => <button key={star} onClick={() => rateShow(id, star)} data-action="broadcast.show.rate" data-action-params={JSON.stringify({ showId: id, stars: star })}><IcStar size={30} className={star <= myRating ? 'text-app-primary' : 'text-[#c7c7cc]'} fill={star <= myRating ? 'currentColor' : 'none'} /></button>)}
            </div>
          </div>
        </div>
        <div className="mt-5 mb-2 text-[20px] font-bold text-app-text">{s.listener_reviews}</div>
        <div className="space-y-3">
          {reviews.map(review => (
            <article key={review.id} className="rounded-2xl bg-white p-4">
              <div className="flex items-center justify-between"><div className="font-semibold text-[15px] text-app-text">{review.title}</div><div className="flex">{[1,2,3,4,5].map(star => <IcStar key={star} size={12} className={star <= review.stars ? 'text-app-primary' : 'text-app-border'} fill={star <= review.stars ? 'currentColor' : 'none'} />)}</div></div>
              <div className="mt-1 text-[12px] text-app-text-muted">{review.author} · {fmtDate(review.date, s)}</div>
              <p className="mt-2 text-[14px] leading-relaxed text-app-text">{review.body}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export const WriteReviewPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { id = '' } = useParams();
  const { back } = useBroadcastGestures();
  const show = useBroadcastStore(s => s.shows[id]);
  const submitReview = useBroadcastStore(s => s.submitReview);
  const existingStars = useBroadcastStore(s => s.myRatings[id] || 0);
  const [stars, setStars] = useState(existingStars);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const submit = () => {
    if (!stars || !title.trim() || !body.trim()) { showToast(s.review_incomplete); return; }
    submitReview(id, title.trim(), body.trim(), stars);
    showToast(s.review_submitted);
    back();
  };
  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <TopBar title={s.write_review} right={<button onClick={submit} data-action="broadcast.review.submit" data-action-params={JSON.stringify({ showId: id })} className="text-[14px] font-semibold text-app-primary">{s.submit}</button>} />
      <div className="flex-1 overflow-y-auto px-4 pt-5" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-center text-[15px] font-semibold text-app-text">{show?.title}</div>
        <div className="flex justify-center gap-3 py-5">
          {[1,2,3,4,5].map(star => <button key={star} onClick={() => setStars(star)} data-action="broadcast.review.stars.set" data-action-params={JSON.stringify({ value: star })} aria-label={formatString(s.stars_label, { count: star })}><IcStar size={34} className={star <= stars ? 'text-app-primary' : 'text-[#c7c7cc]'} fill={star <= stars ? 'currentColor' : 'none'} /></button>)}
        </div>
        <div className="rounded-2xl bg-white overflow-hidden">
          <input value={title} onChange={e => setTitle(e.target.value)} data-action="broadcast.review.title.input" data-action-params={JSON.stringify({ value: title })} placeholder={s.review_title_placeholder} className="w-full px-4 py-3.5 text-[16px] outline-none border-b border-app-border placeholder:text-app-text-muted" />
          <textarea value={body} onChange={e => setBody(e.target.value)} data-action="broadcast.review.body.input" data-action-params={JSON.stringify({ value: body })} placeholder={s.review_body_placeholder} className="w-full min-h-[180px] px-4 py-3.5 text-[16px] leading-relaxed outline-none resize-none placeholder:text-app-text-muted" />
        </div>
        <p className="px-2 mt-3 text-[12px] leading-relaxed text-app-text-muted">{s.review_privacy_note}</p>
      </div>
    </div>
  );
};
export const AccountPage: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  return <InfoPage title={s.account} body={<div className="rounded-xl bg-white divide-y divide-app-border">
    <button {...bindTap('broadcast.accountNotifications-open')} className="w-full p-4 text-left text-app-text">{s.notifications}<span className="float-right text-app-text-muted">›</span></button>
    <button {...bindTap('broadcast.accountCategories-open')} className="w-full p-4 text-left text-app-text">{s.manage_favorite_categories}<span className="float-right text-app-text-muted">›</span></button>
    {[s.manage_subscriptions, s.redeem_gift_card].map(x => <button key={x} onClick={() => showToast(s.feature_unavailable)} className="w-full p-4 text-left text-app-text">{x}<span className="float-right text-app-text-muted">›</span></button>)}
    <button data-action="broadcast.settings.open" onClick={() => window.__OS__?.openApp('settings')} className="w-full p-4 text-left text-app-text">{s.podcast_settings}<span className="float-right text-app-text-muted">›</span></button>
  </div>} />;
};
export const NotificationsPage: React.FC = () => {
  const s = useBroadcastStrings();
  const followedShowIds = useBroadcastStore(s => s.followedShowIds);
  const shows = useBroadcastStore(s => s.shows);
  const notifications = useBroadcastStore(s => s.notifications);
  const toggleNotification = useBroadcastStore(s => s.toggleNotification);
  return (
    <InfoPage title={s.notifications} body={
      <>
        <div className="px-1 pb-3 text-[13px] text-app-text-muted">{s.notification_description}</div>
        <div className="rounded-xl bg-white divide-y divide-app-border overflow-hidden">
          {followedShowIds.map(showId => {
            const show = shows[showId];
            if (!show) return null;
            const enabled = Boolean(notifications[showId]);
            return (
              <button
                key={showId}
                type="button"
                data-action="broadcast.notifications.toggle"
                data-action-params={JSON.stringify({ showId })}
                onClick={() => toggleNotification(showId)}
                className="w-full min-h-16 px-4 py-2.5 flex items-center gap-3 text-left active:bg-black/5"
                aria-pressed={enabled}
                aria-label={formatString(s.new_episode_notification, { show: show.title })}
              >
                <Artwork showId={show.id} color={show.artworkColor} text={show.artworkText} size={42} radius={8} />
                <span className="flex-1 min-w-0 text-[15px] font-medium text-app-text truncate">{show.title}</span>
                <span className={`relative w-[46px] h-7 rounded-full transition-colors ${enabled ? 'bg-[#34c759]' : 'bg-[#d1d1d6]'}`}>
                  <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </span>
              </button>
            );
          })}
        </div>
      </>
    } />
  );
};
export const ManageCategoriesPage: React.FC = () => {
  const s = useBroadcastStrings();
  const genres = useBroadcastStore(s => s.genres);
  const favoriteGenreIds = useBroadcastStore(s => s.favoriteGenreIds);
  const toggleFavoriteGenre = useBroadcastStore(s => s.toggleFavoriteGenre);
  const all = Object.values(genres);
  const recommended = all.filter(genre => ['tech', 'business', 'career', 'leisure'].includes(genre.id));
  const popular = all.filter(genre => !recommended.some(item => item.id === genre.id));
  const renderRows = (items: typeof all) => (
    <div className="rounded-2xl bg-white divide-y divide-app-border overflow-hidden">
      {items.map(genre => {
        const Icon = ICON_REGISTRY[genre.icon as keyof typeof ICON_REGISTRY] || IcSearch;
        const selected = favoriteGenreIds.includes(genre.id);
        return (
          <button
            key={genre.id}
            data-action="broadcast.categories.toggle"
            data-action-params={JSON.stringify({ genreId: genre.id })}
            onClick={() => toggleFavoriteGenre(genre.id)}
            className="w-full min-h-14 px-4 py-2 flex items-center gap-3 text-left active:bg-black/5"
            aria-pressed={selected}
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: genre.color }}><Icon size={21} /></span>
            <span className="flex-1 text-[16px] font-medium text-app-text">{localizeGenre(genre.id, genre.name, s)}</span>
            <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selected ? 'bg-app-primary border-app-primary text-white' : 'border-[#c7c7cc]'}`}>{selected ? '✓' : ''}</span>
          </button>
        );
      })}
    </div>
  );
  return (
    <div className="flex flex-col h-full bg-[#f2f2f7]">
      <TopBar title={s.manage_favorite_categories} />
      <div className="flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="pt-4 pb-2 px-1 text-[13px] font-semibold text-app-text-muted">{s.recommended_for_you}</div>
        {renderRows(recommended)}
        <div className="pt-6 pb-2 px-1 text-[13px] font-semibold text-app-text-muted">{s.popular_categories}</div>
        {renderRows(popular)}
      </div>
    </div>
  );
};

export const UpNextPage: React.FC = () => { const s = useBroadcastStrings(); return <EpisodeListPage title={s.up_next} ids={useBroadcastStore(state => state.upNextIds)} />; };
export const HomePage: React.FC = () => null;
export const ShowPage: React.FC = () => null;
export const EpisodePage: React.FC = () => null;
export const NowPlayingPage: React.FC = () => null;
