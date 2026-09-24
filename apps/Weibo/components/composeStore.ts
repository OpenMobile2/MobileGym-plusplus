import { create } from 'zustand';

/** 发博/转发编辑器的易失草稿态(跨选择器子页共享;刷新即重置,不入持久化)。 */
interface ComposeSession {
  target: 'compose' | 'repost' | 'stcompose';
  text: string;
  images: string[];
  visibility: 'public' | 'fans' | 'friends' | 'private';
  location: string | null;
  supertopicName: string | null;
  set: (patch: Partial<Omit<ComposeSession, 'set' | 'reset' | 'append'>>) => void;
  append: (snippet: string) => void;
  reset: (target?: ComposeSession['target']) => void;
}

export const useComposeSession = create<ComposeSession>((set) => ({
  target: 'compose',
  text: '',
  images: [],
  visibility: 'public',
  location: null,
  supertopicName: null,
  set: (patch) => set(patch),
  append: (snippet) => set((s) => ({ text: s.text + snippet })),
  reset: (target = 'compose') => set({ target, text: '', images: [], visibility: 'public', location: null, supertopicName: null }),
}));

export const VISIBILITY_LABEL: Record<ComposeSession['visibility'], string> = {
  public: '公开', fans: '粉丝', friends: '好友圈', private: '仅自己可见',
};
