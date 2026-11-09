// apps/Tencentvideo/data/index.ts —— 数据入口:defaults.json → TENCENTVIDEO_CONFIG(种子层)。
// 运行时字段在 state.ts 的 RUNTIME_DEFAULTS 中补齐;用户操作只写 store,不回写 defaults。
import defaults from './defaults.json';
import type { TencentvideoState } from '../types';

/** 种子配置(仅 defaults.json 覆盖的字段;运行时字段见 state.ts) */
export const TENCENTVIDEO_CONFIG = defaults as unknown as Omit<
  TencentvideoState,
  | 'lastToast'
  | 'loggedIn'
  | 'playback'
  | 'cast'
  | 'search'
  | 'cashier'
  | 'likedContentIds'
  | 'likedCommentIds'
  | 'likedDiscussionIds'
  | 'discussReactions'
  | 'followedAuthors'
  | 'recommendedIds'
  | 'wantIds'
  | 'findfilm'
  | 'dismissedFeedIds'
  | 'shuffleSeeds'
  | 'danmakuBlockWords'
  | 'downloadReserved'
  | 'downloadPausedAll'
  | 'downloadVipToastShown'
  | 'resume'
  | 'selectedPushTags'
  | 'ui'
>;
