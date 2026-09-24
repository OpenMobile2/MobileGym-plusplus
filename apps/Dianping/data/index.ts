import defaultsJson from './defaults.json';
import type { Shop, NoteCard, DpOrder, UserReviewRecord, UserProfile } from '../types';

const u = defaultsJson.user as {
  nickname: string;
  level: number;
  phone?: string;
  gender?: string;
  bio?: string;
  birthday?: string;
  hometown?: string;
  residence?: string;
  fans?: number;
  following?: number;
  likes?: number;
};

export const DIANPING_CONFIG = {
  city: defaultsJson.city as string,
  user: u,
  userProfile: {
    nickname: u.nickname,
    gender: u.gender ?? '女',
    bio: u.bio ?? '',
    birthday: u.birthday ?? '',
    hometown: u.hometown ?? '南京',
    residence: u.residence ?? '南京',
  } as UserProfile,
  shops: defaultsJson.shops as unknown as Shop[],
  notes: defaultsJson.notes as unknown as NoteCard[],
  favoriteShopIds: defaultsJson.favoriteShopIds as string[],
  favoriteDishIds: defaultsJson.favoriteDishIds as string[],
  browseHistory: defaultsJson.browseHistory as [],
  orders: (defaultsJson.orders ?? []) as unknown as DpOrder[],
  searchHistory: (defaultsJson.searchHistory ?? []) as string[],
  userReviews: ((defaultsJson as { userReviews?: unknown }).userReviews ?? []) as UserReviewRecord[],
};
