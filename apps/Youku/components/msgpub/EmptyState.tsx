import React from 'react';

/**
 * 通知/粉丝页空态(s215:深底插画 + 灰字文案)。
 * 素材清单暂无空态插画,先用内联 SVG 复刻「小岛露营」轮廓(帐篷+棕榈+吉祥物),
 * 保持深色基调,不出现裂图。
 */
export default function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center pt-32">
      <svg width="150" height="120" viewBox="0 0 150 120" fill="none" aria-hidden>
        <defs>
          <linearGradient id="ykEmptyIsland" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#B9A6E8" />
            <stop offset="1" stopColor="#7FB6E8" />
          </linearGradient>
          <linearGradient id="ykEmptyTent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#D8B8F0" />
            <stop offset="1" stopColor="#A98BD8" />
          </linearGradient>
        </defs>
        {/* 小岛 */}
        <ellipse cx="78" cy="98" rx="52" ry="14" fill="url(#ykEmptyIsland)" opacity="0.55" />
        {/* 帐篷 */}
        <path d="M62 92 L92 60 L118 92 Z" fill="url(#ykEmptyTent)" />
        <path d="M92 60 L100 92 L84 92 Z" fill="#8F6FC8" opacity="0.8" />
        {/* 棕榈树 */}
        <path d="M56 92 C54 70 50 58 42 46" stroke="#B9A6E8" strokeWidth="5" strokeLinecap="round" fill="none" />
        <path d="M42 46 C30 40 22 42 14 50 M42 46 C40 34 44 26 54 20 M42 46 C52 38 64 38 74 44"
          stroke="#CDB9F2" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9" />
        {/* 吉祥物(蓝头小猴) */}
        <circle cx="66" cy="80" r="9" fill="#4D7BE8" />
        <circle cx="63" cy="82" r="3.4" fill="#F5D9C8" />
        <circle cx="70" cy="82" r="3.4" fill="#F5D9C8" />
        <rect x="60" y="88" width="12" height="9" rx="4" fill="#E8506A" />
        {/* 漂流瓶 */}
        <rect x="26" y="100" width="14" height="6" rx="3" fill="#9FD2E8" opacity="0.8" transform="rotate(-18 26 100)" />
      </svg>
      <div className="mt-6 text-[15px] text-[#999999]">{text}</div>
    </div>
  );
}
