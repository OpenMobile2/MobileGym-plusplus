import React from 'react';
import { diamondIconUrl } from '../assets';

/** 首页金刚区：优先用 §5.3 生图 PNG，缺图时回退 SVG */
export function DiamondIcon({ id, size = 44 }: { id: string; size?: number }) {
  const url = diamondIconUrl(id);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-[12px] object-cover"
        draggable={false}
      />
    );
  }
  return <DiamondSvg id={id} size={size} />;
}

function DiamondSvg({ id, size = 44 }: { id: string; size?: number }) {
  const s = size;
  const common = { width: s, height: s, viewBox: '0 0 48 48' } as const;
  switch (id) {
    case 'food':
      return (
        <svg {...common} aria-hidden>
          <defs>
            <linearGradient id="gFood" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#FF9A5A" />
              <stop offset="1" stopColor="#FF5A2A" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="22" fill="url(#gFood)" />
          <ellipse cx="24" cy="28" rx="14" ry="8" fill="#FFF3E8" />
          <path d="M14 26c3-6 17-6 20 0" stroke="#FF7A3C" strokeWidth="2" fill="none" />
          <circle cx="20" cy="27" r="2" fill="#FF6633" />
          <circle cx="28" cy="26" r="1.6" fill="#FF8A4C" />
        </svg>
      );
    case 'waimai':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#FFB84D" />
          <rect x="13" y="18" width="22" height="14" rx="4" fill="#FFF8E8" />
          <path d="M17 18v-2a7 7 0 0 1 14 0v2" stroke="#F59E0B" strokeWidth="2.2" fill="none" />
        </svg>
      );
    case 'fun':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#6BCB77" />
          <path d="M16 30c2-8 14-8 16 0" fill="#E8FFE9" />
          <circle cx="19" cy="20" r="2" fill="#FFF" />
          <circle cx="29" cy="20" r="2" fill="#FFF" />
        </svg>
      );
    case 'scenic':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#4D96FF" />
          <path d="M10 32l8-12 6 8 4-6 10 10H10Z" fill="#E8F2FF" />
          <circle cx="33" cy="15" r="3.5" fill="#FFE08A" />
        </svg>
      );
    case 'movie':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#FF6B6B" />
          <rect x="12" y="15" width="24" height="18" rx="3" fill="#FFE8E8" />
        </svg>
      );
    case 'medical':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#C084FC" />
          <rect x="21" y="12" width="6" height="24" rx="2" fill="#F5E8FF" />
          <rect x="12" y="21" width="24" height="6" rx="2" fill="#F5E8FF" />
        </svg>
      );
    case 'photo':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#F472B6" />
          <rect x="12" y="16" width="24" height="18" rx="3" fill="#FFE8F4" />
          <circle cx="24" cy="25" r="5" stroke="#EC4899" strokeWidth="2" fill="none" />
        </svg>
      );
    case 'hotel':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#38BDF8" />
          <path d="M12 30V18l12-6 12 6v12" fill="#E8F8FF" />
          <rect x="20" y="22" width="8" height="8" fill="#7DD3FC" />
        </svg>
      );
    case 'massage':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#A78BFA" />
          <path d="M16 28c2-8 14-8 16 0" fill="#F0E8FF" />
          <circle cx="24" cy="18" r="4" fill="#F0E8FF" />
        </svg>
      );
    case 'beauty':
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#FB7185" />
          <path d="M18 14c0 6 6 8 6 14 0-6 6-8 6-14" fill="#FFE8EC" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden>
          <circle cx="24" cy="24" r="22" fill="#FF8A4C" />
        </svg>
      );
  }
}
