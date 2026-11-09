import defaults from './defaults.json';
import type {
  AutoReplyRule, BossUser, ChatSession, Company, ExpectItem, FaqItem,
  FeedComment, FeedPost, FullState, GreetSample, Job, QuickReply, RecordEntry, RecordsTab,
} from '../types';

export interface BossConfig {
  user: FullState['user'];
  expects: ExpectItem[];
  city: string;
  searchHistory: string[];
  searchDiscover: string[];
  companies: Company[];
  bosses: BossUser[];
  jobs: Job[];
  parttimeCategories: string[];
  feedPosts: FeedPost[];
  feedComments: FeedComment[];
  sessions: ChatSession[];
  systemCards: { id: string; title: string; sub: string; timeLabel: string; icon: string; unread?: number }[];
  quickReplies: QuickReply[];
  greetSampleTabs: string[];
  greetSamples: GreetSample[];
  autoReply: { maxRounds: number; rules: AutoReplyRule[]; fallback: string[] };
  records: Record<RecordsTab, RecordEntry[]>;
  recommendedJobIds: string[];
  faq: {
    quick: { id: string; label: string }[];
    tabs: string[];
    items: Record<string, FaqItem[]>;
  };
  resumeSections: Record<string, string>;
}

export const BOSS_CONFIG = defaults as unknown as BossConfig;
