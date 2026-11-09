// apps/Douban/pages/settingsShared.tsx —— 设置簇(cluster 9)页面私有的共享基件。
// 1) useSettingsLocalStore:易失的本地演示状态(缓存量 250.42M 清零联动 settings.main、
//    性别选择、纯样式分类开关)。store.settings 之外的开关按 user rule「深层页=本地 toggle」,
//    不进 foundation store(state.ts 禁改)。刷新即重置,符合平台「UI/运行时状态不持久」约定。
// 2) Toggle / SettingRow / GroupHeader:设置行视觉基件(iOS 风格开关,evidence IMG_0292/0295/0296)。
import React from 'react';
import { create } from 'zustand';
import { C } from '../components/ui';

interface SettingsLocalState {
  /** 缓存量(M)。250.42 → 清理后 0(settings.main 行与 storage 页联动) */
  cacheM: number;
  /** 性别文案(资料与账号页,默认「保密」) */
  gender: string;
  /** 昵称(资料与账号页,默认取 currentUser 名;昵称子页本地更新) */
  nickname: string;
  /** 纯样式本地开关(推送分类扩展行/同步动态扩展行/实验室卡片开关) */
  extraToggles: Record<string, boolean>;
  clearCache: () => void;
  setGender: (g: string) => void;
  setNickname: (n: string) => void;
  toggleExtra: (key: string) => void;
}

const EXTRA_DEFAULTS: Record<string, boolean> = {
  // 推送分类扩展行(IMG_0296 全开)
  'push.repost': true,
  'push.mention': true,
  'push.groupHot': true,
  'push.subjectOnline': true,
  'push.movieRelease': true,
  'push.bookDiscount': true,
  // 同步到动态扩展行(IMG_0295:前两项关,豆列项开)
  'privacy.syncFollow': false,
  'privacy.syncJoinGroup': false,
  // 个性化内容推荐(真机默认开)
  'privacy.personalContent': true,
  // 实验室卡片开关(闪电直搜默认关)
  'lab.flashSearch': false,
};

export const useSettingsLocalStore = create<SettingsLocalState>((set) => ({
  cacheM: 250.42,
  gender: '保密',
  nickname: '豆友_墨鱼仔',
  extraToggles: EXTRA_DEFAULTS,
  clearCache: () => set({ cacheM: 0 }),
  setGender: (g) => set({ gender: g }),
  setNickname: (n) => set({ nickname: n }),
  toggleExtra: (key) =>
    set((s) => ({ extraToggles: { ...s.extraToggles, [key]: !s.extraToggles[key] } })),
}));

/** iOS 风格开关(纯展示,交互绑定 bind 由页面侧传入 spread 到按钮上) */
export function Toggle({ on, bind }: { on: boolean; bind?: object }) {
  return (
    <button
      {...(bind ?? {})}
      className="shrink-0 rounded-full border-none cursor-pointer p-0 relative"
      style={{
        width: 48,
        height: 29,
        background: on ? '#34C759' : '#E5E5EA',
        transition: 'background 0.2s',
      }}
    >
      <span
        className="absolute rounded-full"
        style={{
          top: 2,
          left: on ? 21 : 2,
          width: 25,
          height: 25,
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }}
      />
    </button>
  );
}

/** 分组小标题(账号设置/通用/个人信息保护…) */
export function GroupHeader({ label, topBorder }: { label: string; topBorder?: boolean }) {
  return (
    <div
      className={`px-4 pt-4 pb-1 text-[13px] ${topBorder ? 'border-t-8' : ''}`}
      style={{ color: '#B9BEC6', borderColor: '#FAFAFA' }}
    >
      {label}
    </div>
  );
}

/**
 * 设置行:标题 + 右侧值/自定义 + 可选箭头。bind 由页面侧传入(transition/action 均可)。
 * sub:标题下的灰色说明小字(如推送「回复」行)。
 */
export function SettingRow({
  label,
  value,
  sub,
  right,
  chevron = true,
  bind,
  tall,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
  chevron?: boolean;
  bind?: object;
  tall?: boolean;
}) {
  const inner = (
    <>
      <div className="flex-1 min-w-0">
        <div className="text-[16px] truncate" style={{ color: C.text }}>{label}</div>
        {sub && <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>{sub}</div>}
      </div>
      {value != null && (
        <span className="text-[15px] shrink-0 max-w-[55%] truncate" style={{ color: C.sub }}>{value}</span>
      )}
      {right}
      {chevron && <span className="text-lg shrink-0" style={{ color: '#C7CCD4' }}>›</span>}
    </>
  );
  const cls = `w-full flex items-center gap-2 px-4 text-left bg-white border-none ${tall ? 'py-3.5' : ''}`;
  const style: React.CSSProperties = tall ? {} : { height: 54 };
  if (bind) {
    return (
      <button {...bind} className={`${cls} cursor-pointer`} style={style}>
        {inner}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {inner}
    </div>
  );
}

/** 组间分隔(浅灰粗线,IMG_0292 分组之间) */
export function GroupGap() {
  return <div style={{ height: 8, background: '#F7F7F8' }} />;
}
