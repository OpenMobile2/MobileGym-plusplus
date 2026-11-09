import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { useToast, WY, NOT_OPEN } from '../components/ui';
import { IcBack, IcSearch, IcTrash, IcMic } from '../res/icons';

const SUGGEST = ['心安之地', '心安之地 许嵩', '心安理得', '心安之地伴奏'];
const HOT_BOARDS = [
  ['甲乙丙丁', '玻璃', '手掌', '我不难过', '失眠'],
  ['心安之地', '南山南', '成都', '理想三旬', '平凡之路'],
  ['夜曲', '晴天', '七里香', '稻香', '青花瓷'],
];
export default function SearchLandingPage() {
  const { bindTap, bindBack, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [q, setQ] = React.useState('');
  const [boardIdx, setBoardIdx] = React.useState(0);
  const history = useWangyiyunStore((s) => s.searchHistory);
  const submitSearch = useWangyiyunStore((s) => s.submitSearch);
  const clear = useWangyiyunStore((s) => s.clearSearchHistory);

  const doSearch = (w: string) => { if (!w.trim()) return; submitSearch(w); go('search.go', { q: w.trim() }); };

  return (
    <div className="flex flex-col h-full" style={{ background: WY.pageBg }} data-status-bar-foreground="dark">
      {toast}
      <div className="h-10" />
      <div className="flex items-center gap-1 px-2 py-2 shrink-0">
        <button {...bindBack()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary }} aria-label="返回"><IcBack size={22} /></button>
        <div className="flex-1 flex items-center h-9 rounded-full px-3 gap-1.5" style={{ background: '#fff' }}>
          <IcSearch size={15} style={{ color: WY.textTertiary }} />
          <input value={q}
            {...bindTap({ kind: 'action', id: 'search.query.input' }, {
              params: { value: q },
              onTrigger: () => setQ(q),
            })}
            onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doSearch(q); }}
            placeholder="心安之地 许嵩" className="flex-1 text-[13px] border-none outline-none bg-transparent" />
        </div>
        <button onClick={() => q.trim() ? doSearch(q) : showToast('输入关键词')} className="text-[14px] px-2 bg-transparent border-none cursor-pointer" style={{ color: q.trim() ? WY.primary : WY.textTertiary }}>搜索</button>
      </div>
      <div className="flex justify-around py-2 shrink-0">
        {([
          { l: '歌手', fn: () => go('search.artists-open') },
          { l: '曲风', fn: () => go('search.styles-open') },
          { l: '专区', fn: () => go('search.zones-open') },
          { l: '识曲', fn: () => go('search.recognize-open') },
        ]).map(({ l, fn }) => (
          <button key={l} onClick={fn} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: WY.textSecondary }}>
            {l === '识曲' ? <IcMic size={20} /> : <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#fff' }}>{l[0]}</span>}
            <span className="text-[11px]">{l}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="search-landing" data-scroll-direction="vertical">
        {q.trim() ? (
          <div className="mt-2">
            {SUGGEST.map((w) => (
              <button key={w} onClick={() => doSearch(w)} className="flex items-center gap-2 w-full py-2.5 border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                <IcSearch size={14} style={{ color: WY.textTertiary }} /><span className="text-[14px]" style={{ color: WY.textPrimary }}>{w}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            {history.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center text-[13px] mb-2" style={{ color: WY.textSecondary }}>搜索历史
                  <button {...bindTap({ kind: 'action', id: 'search.history.clear' }, { onTrigger: clear })}
                    className="ml-auto bg-transparent border-none cursor-pointer" style={{ color: WY.textTertiary }} aria-label="清除"><IcTrash size={15} /></button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {history.map((w) => (
                    <button key={w} onClick={() => doSearch(w)} className="text-[13px] rounded-full px-3 py-1.5 border-none cursor-pointer" style={{ background: '#fff', color: WY.textPrimary }}>{w}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 text-[13px] mb-2" style={{ color: WY.textSecondary }}>热搜榜</div>
            <button {...bindTap({ kind: 'action', id: 'search.boards.swipe' }, {
              onTrigger: () => setBoardIdx((i) => (i + 1) % HOT_BOARDS.length),
            })} className="float-right -mt-7 text-[12px] bg-transparent border-none cursor-pointer"
              style={{ color: WY.primary }}>换一批</button>
            {HOT_BOARDS[boardIdx].map((w, i) => (
              <button key={w} onClick={() => doSearch(w)} className="flex items-center gap-3 w-full py-2 bg-transparent border-none cursor-pointer text-left">
                <span className="w-4 text-[13px]" style={{ color: i < 3 ? WY.primary : WY.textTertiary }}>{i + 1}</span>
                <span className="text-[14px]" style={{ color: WY.textPrimary }}>{w}</span>
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
