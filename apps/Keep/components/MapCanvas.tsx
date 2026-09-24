import React from 'react';

/**
 * 模拟地图(风格化 SVG,对齐真机浅色高德底图观感):
 * 浅蓝灰底 + 白色路网 + 河流 + 可选绿色路线/起终点大头针/车辆。
 * 纯确定性渲染(无随机),供视觉比对稳定。
 */
export function MapCanvas({
  height = 220,
  route = false,
  car = false,
  pinStart,
  pinEnd,
  children,
  dim = false,
}: {
  height?: number;
  route?: boolean;
  car?: boolean;
  pinStart?: string;
  pinEnd?: string;
  children?: React.ReactNode;
  dim?: boolean;
}) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <svg
        viewBox="0 0 360 260"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full"
      >
        {/* 底色 */}
        <rect width="360" height="260" fill="#EAEDF4" />
        {/* 城市块 */}
        <rect x="18" y="20" width="70" height="46" rx="4" fill="#E1E6EF" />
        <rect x="110" y="12" width="88" height="58" rx="4" fill="#E4E9F1" />
        <rect x="226" y="26" width="64" height="44" rx="4" fill="#E1E6EF" />
        <rect x="26" y="96" width="60" height="52" rx="4" fill="#E4E9F1" />
        <rect x="120" y="104" width="74" height="44" rx="4" fill="#E1E6EF" />
        <rect x="224" y="100" width="70" height="50" rx="4" fill="#E4E9F1" />
        <rect x="40" y="180" width="80" height="52" rx="4" fill="#E1E6EF" />
        <rect x="150" y="186" width="66" height="48" rx="4" fill="#E4E9F1" />
        <rect x="244" y="178" width="72" height="54" rx="4" fill="#E1E6EF" />
        {/* 绿地 */}
        <ellipse cx="318" cy="60" rx="34" ry="22" fill="#DDEBD9" />
        <ellipse cx="60" cy="242" rx="40" ry="20" fill="#DDEBD9" />
        {/* 河流 */}
        <path
          d="M-10 158 C 60 138, 120 176, 190 160 S 320 130, 372 150 L 372 174 C 300 156, 250 186, 180 178 S 50 158, -10 178 Z"
          fill="#CFE0F5"
        />
        {/* 主干路 */}
        <path d="M0 88 H360" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M96 0 V260" stroke="#FFFFFF" strokeWidth="9" />
        <path d="M0 212 H360" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M232 0 V260" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M0 40 H360" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M170 0 V260" stroke="#FFFFFF" strokeWidth="5" />
        <path d="M300 0 V260" stroke="#FFFFFF" strokeWidth="5" />
        {/* 高架(淡黄) */}
        <path d="M0 128 C 90 118, 200 138, 360 118" stroke="#F6E7C8" strokeWidth="7" fill="none" />
        {/* 路线 */}
        {route && (
          <>
            <path
              d="M76 226 L96 212 L96 130 C 96 110, 130 96, 170 92 L232 88 L232 52"
              stroke="#04B578"
              strokeWidth="7"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 起点 */}
            <circle cx="76" cy="226" r="8" fill="#04B578" />
            <circle cx="76" cy="226" r="3.5" fill="#fff" />
            {/* 终点 */}
            <rect x="224" y="36" width="16" height="16" rx="8" fill="#FF7D41" />
            <circle cx="232" cy="44" r="3.5" fill="#fff" />
          </>
        )}
        {/* 车辆 */}
        {car && (
          <g transform="translate(150 96) rotate(-8)">
            <rect x="-11" y="-6" width="22" height="12" rx="4" fill="#2B2F36" />
            <rect x="-6" y="-4" width="12" height="8" rx="2" fill="#8FD8FF" />
          </g>
        )}
        {/* 定位点 */}
        {!route && (
          <>
            <circle cx="180" cy="150" r="12" fill="#3C7CFC" opacity="0.15" />
            <circle cx="180" cy="150" r="6" fill="#3C7CFC" stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
      {dim && <div className="absolute inset-0 bg-black/25" />}
      {/* 起终点气泡 */}
      {pinStart && (
        <div className="absolute left-3 bottom-3 max-w-[75%]">
          <div className="bg-white rounded-lg shadow px-2.5 py-1.5 text-[12px] text-app-text leading-tight">
            {pinStart}
          </div>
        </div>
      )}
      {pinEnd && (
        <div className="absolute right-3 top-3 max-w-[70%]">
          <div className="bg-white rounded-lg shadow px-2.5 py-1.5 text-[12px] text-app-text leading-tight">
            {pinEnd}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}
