import React from 'react';
import { AVATARS, LOGOS } from '../assets';
import { COLORS } from '../res/colors';
import { useBossGestures } from '../hooks/useBossGestures';

const AVATAR_FALLBACK = ['#12ADA9', '#5B8DEF', '#F2994A', '#9B51E0', '#EB5757'];

/** 生成头像,缺图回落彩色圆 + 首字 */
export const Avatar: React.FC<{ imgKey?: string; name: string; size?: number; className?: string }> = ({
  imgKey, name, size = 40, className = '',
}) => {
  const url = imgKey ? AVATARS[imgKey] : undefined;
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size }} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  const bg = AVATAR_FALLBACK[name.charCodeAt(0) % AVATAR_FALLBACK.length];
  return (
    <div
      style={{ width: size, height: size, backgroundColor: bg, fontSize: size * 0.42 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${className}`}
    >
      {name.slice(0, 1)}
    </div>
  );
};

/** 公司 logo,缺图回落灰底首字 */
export const CompanyLogo: React.FC<{ logoKey: string; name: string; size?: number; className?: string }> = ({
  logoKey, name, size = 44, className = '',
}) => {
  const url = LOGOS[logoKey];
  if (url) {
    return <img src={url} alt="" style={{ width: size, height: size }} className={`shrink-0 rounded-lg border border-gray-100 bg-white object-cover ${className}`} />;
  }
  return (
    <div style={{ width: size, height: size, fontSize: size * 0.38 }} className={`flex shrink-0 items-center justify-center rounded-lg bg-gray-100 font-semibold text-gray-500 ${className}`}>
      {name.slice(0, 1)}
    </div>
  );
};

/**
 * 通用顶栏:grid 布局 + pt-12 预留状态栏(固定高度 h-12+pt-12 会得到 0 内容盒,
 * 且 pt-10 会被 OS 状态栏遮罩盖住按钮 —— 走查实锤过的坑,勿改)。
 */
export const PageHeader: React.FC<{
  title?: React.ReactNode;
  right?: React.ReactNode;
  transparent?: boolean;
  noBack?: boolean;
  onBeforeBack?: () => void;
  light?: boolean;
}> = ({ title, right, transparent, noBack, onBeforeBack, light }) => {
  const { bindBack } = useBossGestures();
  return (
    <div className={`grid grid-cols-[48px_1fr_48px] items-center px-1 pb-2 pt-12 ${transparent ? '' : 'bg-white'}`}>
      {noBack ? <span /> : (
        <button {...(onBeforeBack ? { onClick: onBeforeBack } : bindBack())} className={`flex h-10 w-10 items-center justify-center ${light ? 'text-white' : 'text-gray-800'}`} aria-label="返回">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      )}
      <div className={`min-w-0 truncate text-center text-[16px] font-semibold ${light ? 'text-white' : 'text-gray-900'}`}>{title}</div>
      <div className="flex justify-end pr-2">{right}</div>
    </div>
  );
};

/** 参数缺失或实体已被移除时的可返回空态，禁止静默回落到第一条固定数据。 */
export const MissingContent: React.FC<{ text?: string }> = ({ text = '内容不存在或已被移除' }) => (
  <div className="flex h-full flex-col bg-white">
    <PageHeader />
    <div className="flex flex-1 items-center justify-center px-8 text-center text-[14px] text-gray-500">{text}，请返回上一页重新选择。</div>
  </div>
);

/** BOSS 空态(纸箱小人示意) */
export const EmptyBox: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex flex-col items-center py-14">
    <svg width="120" height="86" viewBox="0 0 120 86" fill="none">
      <rect x="24" y="38" width="72" height="42" rx="4" fill="#EDEFF4" />
      <path d="M24 38l12-10h48l12 10-14 8H38l-14-8z" fill="#F5F6FA" />
      <circle cx="60" cy="26" r="10" fill="#D8DCE6" />
      <path d="M50 34c2-6 18-6 20 0l-4 8H54l-4-8z" fill="#E4E7EE" />
      <text x="86" y="76" fontSize="8" fill="#C3C8D4" fontFamily="Arial">BOSS</text>
    </svg>
    <div className="mt-3 text-sm text-gray-400">{text}</div>
  </div>
);

/** 灰底小 chip */
export const Chip: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span className={`rounded bg-[#F5F5F5] px-1.5 py-0.5 text-xs text-gray-600 ${className}`}>{children}</span>
);

/** 主行动胶囊按钮 */
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...rest }) => (
  <button
    {...rest}
    style={{ backgroundColor: COLORS.primaryBtn }}
    className={`w-full rounded-full py-3 text-center text-[16px] font-medium text-white active:opacity-90 ${className}`}
  >
    {children}
  </button>
);
