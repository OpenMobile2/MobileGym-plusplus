import React from 'react';
import { IcStar } from '../res/icons';

export function Stars({
  score,
  size = 11,
  showScore = true,
}: {
  score: number;
  size?: number;
  showScore?: boolean;
}) {
  const full = Math.floor(score);
  const partial = score - full >= 0.25;
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${score}`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < full || (i === full && partial);
        return (
          <IcStar
            key={i}
            size={size}
            className={filled ? 'text-[#FF6633]' : 'text-[#E0E0E0]'}
          />
        );
      })}
      {showScore ? (
        <span className="ml-[3px] text-[12px] font-semibold leading-none text-[#FF6633]">
          {score.toFixed(1)}
        </span>
      ) : null}
    </span>
  );
}
