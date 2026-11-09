import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION, MAX_SEATS } from './constants';
import { MAOYAN_CONFIG } from './data';
import type { MaoyanState, MaoyanActions, Order, Review } from './types';

const initialState: MaoyanState = JSON.parse(JSON.stringify(MAOYAN_CONFIG));
initialState.taskAudit ??= {};

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

/** 取票码:从订单 id 确定性派生(禁止 Math.random 拼 id,pipeline §5.4 A-3) */
function deriveCode(orderId: string, phone: string) {
  let h = 7;
  for (const ch of orderId) h = (h * 31 + ch.charCodeAt(0)) % 1000000007;
  const d = (n: number) => String(h % 10 ** n).padStart(n, '0');
  return {
    qrToken: `MY-TICKET-${orderId}`,
    phone,
    verify: `${d(4)} ${String(h % 90 + 10)} ${h % 10} ${String(h % 9000 + 1000)} ${h % 10}`,
  };
}

export const useMaoyanStore = createAppStoreWithActions<MaoyanState, MaoyanActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 登录 ----------
    login: (phone) => set((s) => ({
      session: { ...s.session, loggedIn: true, phone: phone || s.session.phone },
    })),
    logout: () => set((s) => ({ session: { ...s.session, loggedIn: false } })),
    switchCity: (name) => set(() => ({ city: name })),

    // ---------- 想看 / 看过 / 评分 ----------
    toggleWishMovie: (movieId) => set((s) => {
      const wished = s.wishMovies.includes(movieId);
      return {
        wishMovies: wished ? s.wishMovies.filter((m) => m !== movieId) : [movieId, ...s.wishMovies],
        movies: s.movies.map((m) => m.id === movieId ? { ...m, wishCount: m.wishCount + (wished ? -1 : 1) } : m),
      };
    }),
    toggleWishShow: (showId) => set((s) => ({
      wishShows: s.wishShows.includes(showId)
        ? s.wishShows.filter((x) => x !== showId) : [showId, ...s.wishShows],
      shows: s.shows.map((sh) => sh.id === showId ? { ...sh, wished: !sh.wished } : sh),
    })),
    publishReview: (movieId, stars, text, tags) => set((s) => {
      const review: Review = {
        id: genId('rv'), movieId, user: s.session.nick, avatar: s.session.avatar,
        level: 2, stars, text, likes: 0, replies: 0, timestamp: TimeService.now(),
        region: '陕西', bought: true, mine: true,
      };
      return {
        reviews: [review, ...s.reviews.filter((r) => !(r.mine && r.movieId === movieId))],
        // qa:Q8 看过与想看互斥
        wishMovies: s.wishMovies.filter((m) => m !== movieId),
        watched: { ...s.watched, [movieId]: { stars, text, tags, timestamp: TimeService.now() } },
        orders: s.orders.map((o) => o.movieId === movieId ? { ...o, rated: true } : o),
      };
    }),
    toggleReviewLike: (reviewId) => set((s) => ({
      reviews: s.reviews.map((r) => r.id === reviewId
        ? { ...r, likes: r.likes + ((r as Review & { liked?: boolean }).liked ? -1 : 1), liked: !(r as Review & { liked?: boolean }).liked } as Review
        : r),
    })),
    followArtist: (showId) => set((s) => ({
      shows: s.shows.map((sh) => sh.id === showId ? { ...sh, artistFollowed: !sh.artistFollowed } : sh),
    })),
    recordSynopsisExpanded: (movieId) => set((s) => ({ taskAudit: { ...s.taskAudit, expandedSynopsisMovieId: movieId } })),
    recordCinemaBrowse: (patch) => set((s) => ({
      taskAudit: { ...s.taskAudit, cinemaBrowse: { sort: '', service: '', ...s.taskAudit.cinemaBrowse, ...patch } },
    })),
    recordCinemaSchedule: (cinemaId, movieId, dayOffset) => set((s) => ({
      taskAudit: { ...s.taskAudit, cinemaSchedule: { cinemaId, movieId, dayOffset } },
    })),
    recordShowNoticeViewed: (showId) => set((s) => ({ taskAudit: { ...s.taskAudit, viewedShowNoticeId: showId } })),

    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({ searchHistory: [word, ...s.searchHistory.filter((w) => w !== word)].slice(0, 12) }));
    },
    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    // ---------- 影院 ----------
    toggleCinemaFav: (cinemaId) => set((s) => ({
      cinemas: s.cinemas.map((c) => c.id === cinemaId ? { ...c, favorite: !c.favorite } : c),
    })),

    // ---------- 选座购票 ----------
    startSeatDraft: (sessionId) => set(() => ({
      seatDraft: { sessionId, seats: [], snackIds: [], agreed: false, cardId: '' },
    })),
    toggleSeat: (seat) => {
      const d = get().seatDraft;
      if (!d) return false;
      if (d.seats.includes(seat)) {
        set(() => ({ seatDraft: { ...d, seats: d.seats.filter((x) => x !== seat) } }));
        return true;
      }
      if (d.seats.length >= MAX_SEATS) return false; // qa:Q3 上限6
      set(() => ({ seatDraft: { ...d, seats: [...d.seats, seat] } }));
      return true;
    },
    applyRecommendSeats: (n, free) => {
      const d = get().seatDraft;
      if (!d) return;
      set(() => ({ seatDraft: { ...d, seats: free.slice(0, n) } })); // qa:Q12 自动选 N 个居中连座
    },
    clearSeats: () => {
      const d = get().seatDraft;
      if (!d) return;
      set(() => ({ seatDraft: { ...d, seats: [] } }));
    },
    setAgreed: (v) => {
      const d = get().seatDraft;
      if (!d) return;
      set(() => ({ seatDraft: { ...d, agreed: v } }));
    },
    toggleDraftSnack: (snackId) => {
      const d = get().seatDraft;
      if (!d) return;
      set(() => ({
        seatDraft: {
          ...d,
          snackIds: d.snackIds.includes(snackId)
            ? d.snackIds.filter((x) => x !== snackId) : [...d.snackIds, snackId],
        },
      }));
    },
    switchDraftSession: (sessionId) => {
      const d = get().seatDraft;
      if (!d) return;
      set(() => ({ seatDraft: { sessionId, seats: [], snackIds: d.snackIds, agreed: d.agreed, cardId: d.cardId } }));
    },

    // ---------- 演出购票 ----------
    startShowDraft: (showId) => {
      const show = get().shows.find((x) => x.id === showId);
      set((s) => ({
        showDraft: {
          showId, tierId: show?.tiers[0]?.id ?? '', qty: 1,
          viewerId: s.profiles[0]?.id ?? '', contact: s.session.phone.replace(/\s/g, ''),
        },
      }));
    },
    setShowDraft: (patch) => {
      const d = get().showDraft;
      if (!d) return;
      set(() => ({ showDraft: { ...d, ...patch } }));
    },

    // ---------- 支付 ----------
    setPayContext: (ctx) => set(() => ({ payContext: ctx })),
    setPayMethod: (m) => set(() => ({ payMethod: m })),
    confirmPay: () => {
      const s = get();
      const oid = genId('o');
      let order: Order | null = null;
      if (s.payContext === 'movie' && s.seatDraft) {
        const sess = s.sessions.find((x) => x.id === s.seatDraft!.sessionId);
        const movie = s.movies.find((m) => m.id === sess?.movieId);
        const cinema = s.cinemas.find((c) => c.id === sess?.cinemaId);
        if (sess && movie && cinema) {
          const snackTotal = s.seatDraft.snackIds
            .reduce((acc, id) => acc + (s.snacks.find((x) => x.id === id)?.price ?? 0), 0);
          // 随票加购影城卡:本单加卡费、减开卡立减
          const card = s.cinemaCards.find((c) => c.id === s.seatDraft!.cardId);
          const cardDelta = card ? card.price - card.discountPerOrder : 0;
          order = {
            id: oid, kind: 'movie', status: 'upcoming', title: movie.title, poster: movie.poster,
            cinemaOrVenue: cinema.name, movieId: movie.id,
            sessionDesc: `${['今天', '明天', '后天'][sess.dayOffset]} ${sess.start}-${sess.end} ${sess.lang}${sess.dim}`,
            hallSeats: `${sess.hall} ${s.seatDraft.seats.map((x) => x.replace('-', '排') + '座').join(' ')}`,
            count: s.seatDraft.seats.length,
            total: Math.round((sess.price * s.seatDraft.seats.length + snackTotal + cardDelta) * 100) / 100,
            code: deriveCode(oid, s.session.phone),
            snacks: s.seatDraft.snackIds, showId: '', tierDesc: '', viewerName: '',
            timestamp: TimeService.now(), rated: false, cardId: card?.id ?? '',
          };
        }
      } else if (s.payContext === 'show' && s.showDraft) {
        const show = s.shows.find((x) => x.id === s.showDraft!.showId);
        const tier = show?.tiers.find((t) => t.id === s.showDraft!.tierId);
        const viewer = s.profiles.find((p) => p.id === s.showDraft!.viewerId);
        if (show && tier) {
          order = {
            id: oid, kind: 'show', status: 'upcoming', title: show.title, poster: show.poster,
            cinemaOrVenue: `${show.city}·${show.venue}`, movieId: '',
            sessionDesc: show.sessionDesc, hallSeats: '', count: s.showDraft.qty,
            total: tier.price * s.showDraft.qty, code: deriveCode(oid, s.session.phone),
            snacks: [], showId: show.id, tierDesc: `${tier.name}${tier.price}元×${s.showDraft.qty}张`,
            viewerName: viewer?.name ?? '', timestamp: TimeService.now(), rated: false, cardId: '',
          };
        }
      }
      if (order) {
        const boughtCardId = order.cardId;
        set((st) => ({
          orders: [order!, ...st.orders], lastOrderId: oid,
          cinemaCards: boughtCardId
            ? st.cinemaCards.map((c) => c.id === boughtCardId
              ? { ...c, owned: true, autoRenew: false, suspended: false,
                expiryTs: TimeService.now() + c.periodMonths * 30 * 24 * 3600 * 1000 }
              : c)
            : st.cinemaCards,
          seatDraft: st.payContext === 'movie' ? null : st.seatDraft,
          showDraft: st.payContext === 'show' ? null : st.showDraft,
        }));
      }
      return oid;
    },

    // ---------- 影城卡 ----------
    buyCard: (cardId, autoRenew) => set((s) => ({
      cinemaCards: s.cinemaCards.map((c) => c.id === cardId
        ? {
          ...c,
          owned: true,
          autoRenew,
          suspended: false,
          // 已开卡则续期,未开卡从现在起算
          expiryTs: (c.owned && c.expiryTs > TimeService.now() ? c.expiryTs : TimeService.now())
            + c.periodMonths * 30 * 24 * 3600 * 1000,
        }
        : c),
    })),
    toggleCardAutoRenew: (cardId) => set((s) => ({
      cinemaCards: s.cinemaCards.map((c) => c.id === cardId ? { ...c, autoRenew: !c.autoRenew } : c),
    })),
    setDraftCard: (cardId) => {
      const d = get().seatDraft;
      if (!d) return;
      set(() => ({ seatDraft: { ...d, cardId: d.cardId === cardId ? '' : cardId } }));
    },

    // ---------- 观演人 ----------
    addProfile: (name, idNo) => set((s) => ({
      profiles: [...s.profiles, {
        id: genId('vp'),
        name: name.length > 1 ? `*${name.slice(1)}` : name,
        idMasked: idNo.length >= 6 ? `${idNo.slice(0, 3)}************${idNo.slice(-3)}` : idNo,
      }],
    })),
    removeProfile: (id) => set((s) => ({ profiles: s.profiles.filter((p) => p.id !== id) })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state as unknown as Record<string, unknown>)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<MaoyanState>;
    },
  },
);
