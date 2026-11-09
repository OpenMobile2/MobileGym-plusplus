import defaults from './defaults.json';
import { manifest } from '../manifest';
import { DATA_VERSION } from '../constants';
import type {
  Address, Article, Book, CartItem, LearnState, MembershipState, Order, Product, Profile, ReadPlan, Settings, Word, Wordbook,
} from '../types';

/** 构建时种子(§10.3)。运行时新数据一律走 store action 写入,不回塞本文件。 */
export const BCZ_CONFIG = {
  appId: manifest.id,
  dataVersion: DATA_VERSION,
  profile: defaults.profile as Profile,
  words: defaults.words as Word[],
  learn: defaults.learn as Record<string, LearnState>,
  books: defaults.books as Book[],
  currentBookId: defaults.currentBookId as string,
  dailyGroups: defaults.dailyGroups as number,
  today: defaults.today as { newDone: number; reviewDone: number; newTarget: number; reviewTarget: number },
  coins: defaults.coins as number,
  streakDays: defaults.streakDays as number,
  protectEquipped: defaults.protectEquipped as number,
  stars: defaults.stars as number,
  claimedTasks: defaults.claimedTasks as string[],
  wordbooks: defaults.wordbooks as Wordbook[],
  products: defaults.products as Product[],
  cart: defaults.cart as CartItem[],
  addresses: defaults.addresses as Address[],
  order: defaults.order as Order,
  favoriteProductIds: defaults.favoriteProductIds as string[],
  memberships: defaults.memberships as MembershipState,
  courseProgress: defaults.courseProgress as Record<string, number[]>,
  articles: defaults.articles as Article[],
  shelf: defaults.shelf as string[],
  readChars: defaults.readChars as number,
  readArticleIds: defaults.readArticleIds as string[],
  readPlan: defaults.readPlan as ReadPlan | null,
  readCampLevel: defaults.readCampLevel as 'basic' | 'mid' | 'high' | null,
  settings: defaults.settings as Settings,
};
