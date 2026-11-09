import React from 'react';
import { IcBack, IcRight, IcStar } from '../res/icons';
import { useQunaerGestures } from '../hooks/useQunaerGestures';

export const QN = {
  primary: '#22C7CB',
  primaryDark: '#08AEB4',
  orange: '#FF6A2B',
  orangeSoft: '#FFF1E8',
  green: '#00A870',
  blue: '#4A9CF8',
  bg: '#F3F6F7',
  text: '#202A2E',
  muted: '#7A868C',
} as const;

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 150'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop stop-color='#d8f6f5'/><stop offset='1' stop-color='#b7dff5'/></linearGradient></defs><rect width='200' height='150' fill='url(#g)'/><path d='M0 125L48 77l30 28 38-45 84 65z' fill='#75c8c5'/><circle cx='155' cy='34' r='17' fill='#fff5b7'/></svg>",
);

export function Img({
  src,
  className,
  alt = '',
}: {
  src: string;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src={src}
      className={className}
      alt={alt}
      onError={(event) => {
        const target = event.target as HTMLImageElement;
        if (target.src !== FALLBACK) target.src = FALLBACK;
      }}
    />
  );
}

export function TopBar({
  title,
  right,
  transparent = false,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  transparent?: boolean;
}) {
  const { bindBack } = useQunaerGestures();
  return (
    <div className={`h-11 shrink-0 px-1 flex items-center ${transparent ? 'bg-transparent' : 'bg-white border-b border-[#edf0f2]'}`}>
      <button
        {...bindBack()}
        className="w-10 h-10 flex items-center justify-center bg-transparent border-none text-[#263238] cursor-pointer"
        aria-label="返回"
      >
        <IcBack size={23} />
      </button>
      <div className="flex-1 text-center text-[16px] font-semibold text-[#202A2E] truncate">
        {title}
      </div>
      <div className="w-12 flex justify-end">{right}</div>
    </div>
  );
}

export function Price({ value, suffix = '起', large = false }: { value: number; suffix?: string; large?: boolean }) {
  return (
    <span className="font-semibold text-[#FF5B2D]">
      <span className="text-[10px]">¥</span>
      <span className={large ? 'text-[23px]' : 'text-[17px]'}>{value}</span>
      {suffix && <span className="text-[10px] font-normal">{suffix}</span>}
    </span>
  );
}

export function Score({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#00A3A8]">
      <span className="inline-flex items-center justify-center rounded bg-[#20C3C7] text-white px-1 py-0.5">{value.toFixed(1)}</span>
      <IcStar size={11} fill="currentColor" />
    </span>
  );
}

export function StaticChip({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-[11px] ${
      active ? 'bg-[#E5FAF9] text-[#08AEB4] border border-[#22C7CB]' : 'bg-[#F5F7F8] text-[#667177]'
    }`}>
      {children}
    </span>
  );
}

export function SectionTitle({ children, extra }: { children: React.ReactNode; extra?: string }) {
  return (
    <div className="flex items-center px-3 pt-3 pb-2">
      <h2 className="m-0 text-[16px] font-bold text-[#202A2E]">{children}</h2>
      {extra && (
        <span className="ml-auto inline-flex items-center text-[11px] text-[#8A9499]">
          {extra}<IcRight size={13} />
        </span>
      )}
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-[#edf0f2] ${className}`}>{children}</div>;
}
