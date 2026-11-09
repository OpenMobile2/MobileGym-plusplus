import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { StatusCard } from '../components/StatusCard';
import { useStrings, useToast, Img } from '../components/ui';
import { DISCOVER_CHANNELS } from '../constants';
import { IcCamera, IcRight } from '../res/icons';

const TAG_STYLE: Record<string, string> = {
  沸: 'bg-[#FF3852] text-white',
  热: 'bg-[#FF8200] text-white',
  新: 'bg-[#FF7EB6] text-white',
  娱: 'bg-[#FFB300] text-white',
  荐: 'bg-[#41C468] text-white',
  公益: 'bg-[#41C468] text-white',
};

export default function DiscoverPage() {
  const s = useStrings();
  const { bindTap } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const hotWords = useWeiboStore((st) => st.hotWords);
  const statuses = useWeiboStore((st) => st.statuses);
  const channel = searchParams.get('channel') ?? '热点';

  const feed = statuses.filter((x) => !x.supertopicId && !x.searchOnly && (channel === '热点' ? true : x.channel === channel));

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2] relative">
      {/* 搜索框 */}
      <div className="px-3 py-2 bg-gradient-to-b from-[#FFE9D6] to-[#F2F2F2] shrink-0">
        <div className="flex items-center h-9 bg-white rounded-full px-3 gap-2">
          <div
            {...bindTap('discover.search-open')}
            className="flex-1 text-[13px] text-[#9A9A9A] cursor-pointer"
          >
            猜你想搜:{hotWords[4]?.word ?? '微博热搜'}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'discover.camera.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="bg-transparent border-none cursor-pointer text-[#7F7F7F] p-0"
          >
            <IcCamera size={17} />
          </button>
          <button
            {...bindTap('discover.search-open')}
            className="text-[14px] font-semibold text-[#FF8200] bg-transparent border-none cursor-pointer"
          >
            {s.search}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="discover-feed" data-scroll-direction="vertical">
        {/* 热搜榜卡 */}
        <div className="bg-white mx-2 rounded-xl p-3 mb-2">
          <div className="flex items-center mb-2">
            <span className="text-[15px] font-bold text-[#1A1A1A]">🔍 {s.hotSearch}</span>
            <span className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'discover.briefing.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="text-[12px] text-[#FF8200] bg-transparent border-none cursor-pointer"
            >
              {s.hotBrief} &gt;
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            {hotWords.slice(0, 10).map((h) => (
              <button
                key={h.word}
                {...bindTap('discover.hotword-open', { params: { q: h.topic ? `#${h.word}#` : h.word } })}
                className="flex items-center gap-1.5 py-1.5 bg-transparent border-none cursor-pointer text-left min-w-0"
              >
                <span className="text-[14px] text-[#1A1A1A] truncate">{h.word}</span>
                {h.tag && <span className={`text-[9px] rounded px-1 leading-4 shrink-0 ${TAG_STYLE[h.tag]}`}>{h.tag}</span>}
              </button>
            ))}
          </div>
          <button
            {...bindTap('discover.hotFull-open')}
            className="flex items-center justify-center gap-1 w-full mt-1 text-[13px] text-[#FF8200] bg-transparent border-none cursor-pointer"
          >
            {s.moreHot} <IcRight size={14} />
          </button>
        </div>

        {/* 广告 banner(静态 wontfix) */}
        <div className="mx-2 rounded-xl overflow-hidden mb-2 h-24">
          <Img src={statuses[1]?.images[0]} label="广告" className="w-full h-full object-cover" />
        </div>

        {/* 频道 chips */}
        <div className="flex items-center gap-4 px-4 h-10 bg-white sticky top-0 z-10">
          {DISCOVER_CHANNELS.map((ch) => (
            <button
              key={ch}
              {...bindTap({ kind: 'action', id: 'discover.channel.select.target' }, {
                params: { target: ch },
                onTrigger: () => setSearchParams((p) => { ch === '热点' ? p.delete('channel') : p.set('channel', ch); return p; }, { replace: true }),
              })}
              className={`text-[14px] bg-transparent border-none cursor-pointer relative pb-1 whitespace-nowrap ${channel === ch ? 'text-[#FF8200] font-bold' : 'text-[#5B5B5B]'}`}
            >
              {ch}
              {channel === ch && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-[#FF8200]" />}
            </button>
          ))}
          <span className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'discover.channelMore.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="text-[16px] text-[#5B5B5B] bg-transparent border-none cursor-pointer"
          >
            ☰
          </button>
        </div>

        {feed.map((st) => (
          <StatusCard key={st.id} status={st} openTransition="discover.status-open" userTransition="home.user-open" />
        ))}
        <div className="text-center text-[12px] text-[#BBBBBB] py-4">已经到底啦~</div>
      </div>
      {toastNode}
    </div>
  );
}
