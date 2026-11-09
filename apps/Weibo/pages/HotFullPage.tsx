import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, TopBar, fmtCount } from '../components/ui';

const TAG_STYLE: Record<string, string> = {
  沸: 'bg-[#FF3852] text-white', 热: 'bg-[#FF8200] text-white', 新: 'bg-[#FF7EB6] text-white',
  娱: 'bg-[#FFB300] text-white', 荐: 'bg-[#41C468] text-white', 公益: 'bg-[#41C468] text-white',
};

export default function HotFullPage() {
  const s = useStrings();
  const { bindTap, bindBack } = useWeiboGestures();
  const hotWords = useWeiboStore((st) => st.hotWords);

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar backBinding={bindBack()} title={s.hotSearch} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="hot-list" data-scroll-direction="vertical">
        {hotWords.slice(0, 60).map((h, i) => (
          <button
            key={h.word}
            {...bindTap('hotFull.hotword-open', { params: { q: h.topic ? `#${h.word}#` : h.word } })}
            className="flex items-center gap-2.5 w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
          >
            <span className={`w-5 text-center text-[15px] font-bold shrink-0 ${i < 3 ? 'text-[#FF6533]' : 'text-[#FF9E4D]'}`}>{i + 1}</span>
            <span className="text-[15px] text-[#1A1A1A] truncate">{h.word}</span>
            {h.tag && <span className={`text-[9px] rounded px-1 leading-4 shrink-0 ${TAG_STYLE[h.tag]}`}>{h.tag}</span>}
            <span className="flex-1" />
            <span className="text-[12px] text-[#BBBBBB] shrink-0">{fmtCount(h.heat)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
