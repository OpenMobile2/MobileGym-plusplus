import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, coverBg, WY } from '../components/ui';

const CATS = ['音乐', '情感', '知识', '商业', '娱乐', '生活', '历史', '科技'];
export default function PodcastMorePage() {
  const { bindTap } = useWangyiyunGestures();
  const [sp, setSp] = useSearchParams();
  const mode = sp.get('mode');
  const tab: 'cat' | 'rank' = mode === 'ranks' ? 'rank' : 'cat';
  const setTab = (t: 'cat' | 'rank') => {
    setSp((p) => {
      if (t === 'rank') p.set('mode', 'ranks');
      else p.set('mode', 'categories');
      return p;
    }, { replace: true });
  };
  const episodes = useWangyiyunStore((s) => s.episodes);
  return (
    <Screen>
      <TopBar title="播客" />
      <div className="flex gap-5 px-4 py-2 text-[14px]">
        <button onClick={() => setTab('cat')} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'cat' ? WY.primary : WY.textSecondary }}>全部分类</button>
        <button onClick={() => setTab('rank')} className="bg-transparent border-none cursor-pointer p-0" style={{ color: tab === 'rank' ? WY.primary : WY.textSecondary }}>榜单</button>
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        {tab === 'cat' ? (
          <div className="grid grid-cols-3 gap-2 py-2">
            {CATS.map((c) => (
              <button key={c} {...bindTap('podcastmore.episode-open', { params: { id: episodes[0]?.id || 'ep_001' } })} className="rounded-lg h-16 flex items-center justify-center text-white text-[13px] border-none cursor-pointer" style={{ background: coverBg(c) }}>{c}</button>
            ))}
          </div>
        ) : (
          episodes.map((e, i) => (
            <button key={e.id} {...bindTap('podcastmore.episode-open', { params: { id: e.id } })} className="flex items-center gap-3 w-full py-3 border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
              <span className="w-5 text-[15px]" style={{ color: WY.primary }}>{i + 1}</span>
              <div className="w-12 h-12 rounded" style={{ background: coverBg(e.seed) }} />
              <div className="text-[13px] flex-1 line-clamp-2" style={{ color: WY.textPrimary }}>{e.title}</div>
            </button>
          ))
        )}
      </div>
    </Screen>
  );
}
