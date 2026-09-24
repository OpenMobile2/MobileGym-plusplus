import React, { useState } from 'react';
import { TopBar, Img, showToast, formatCount, formatDuration } from '../components/ui';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import {
  IcPlay, IcPause, IcLike, IcClose, IcCheck, IcTicket, IcChevronRight, IcUserCircle,
} from '../res/icons';

const SORTS = ['推荐', '最新', '时点'] as const;
const RATES = [
  { val: '推荐', color: '#FE4543' },
  { val: '一般', color: '#F5A623' },
  { val: '不行', color: '#999999' },
];
const VOTE_OPTIONS = ['太精彩了,追更!', '剧情一般', '弃了'];

export function CommentPage() {
  const { bindTap, back } = useXimalayaGestures();
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const comments = useXimalayaStore((st) => st.comments);
  const player = useXimalayaStore((st) => st.player);
  const user = useXimalayaStore((st) => st.user);
  const likedCommentIds = useXimalayaStore((st) => st.likedCommentIds);
  const togglePlay = useXimalayaStore((st) => st.togglePlay);
  const toggleLikeComment = useXimalayaStore((st) => st.toggleLikeComment);
  const addComment = useXimalayaStore((st) => st.addComment);

  const album = albums.find((a) => a.id === player.currentAlbumId) ?? albums[0];
  const track = tracks.find((t) => t.id === player.currentTrackId)
    ?? tracks.find((t) => t.albumId === album?.id) ?? tracks[0];
  const dur = track?.durationSec ?? 0;
  const remainMin = Math.max(1, Math.ceil((dur - player.progressSec) / 60));

  const albumComments = comments.filter((c) => c.albumId === album?.id);

  const [sort, setSort] = useState<(typeof SORTS)[number]>('推荐');
  const [rate, setRate] = useState<string | null>(null);
  const [voteOpen, setVoteOpen] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState(false);
  const [text, setText] = useState('');
  const [markTime, setMarkTime] = useState(true);

  const sorted = [...albumComments].sort((a, b) => {
    if (sort === '推荐') return b.likeCount - a.likeCount;
    if (sort === '最新') return b.createdAt - a.createdAt;
    return (a.timePoint ?? 1e9) - (b.timePoint ?? 1e9);
  });

  const send = () => {
    const v = text.trim();
    if (!v) { showToast('说点什么吧'); return; }
    addComment(album!.id, track?.id, v, markTime ? player.progressSec : undefined);
    setText('');
    setInputMode(false);
    showToast('评论已发布');
  };

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      <TopBar title={`评论 ${formatCount(albumComments.length * 1200 + albumComments.length)}`} />

      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 当前音源条 */}
        {album && track && (
          <div className="mx-3 mt-3 bg-white rounded-xl p-2.5 flex items-center gap-3">
            <Img src={album.cover} className="w-11 h-11 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#333] truncate">{track.title}</div>
              <div className="text-[11px] text-[#999]">剩余 {remainMin} 分钟</div>
            </div>
            <button onClick={() => togglePlay()} className="w-9 h-9 rounded-full bg-[#FE4543] text-white flex items-center justify-center" aria-label="播放/暂停">
              {player.playing ? <IcPause size={18} /> : <IcPlay size={18} />}
            </button>
          </div>
        )}

        {/* 投票卡 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3 flex items-center gap-3">
          <IcTicket size={20} className="text-[#FE4543]" />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-[#333]">你追这部作品到第几集了?</div>
            <div className="text-[11px] text-[#999]">2.3万人参与</div>
          </div>
          <button {...bindTap({ kind: 'action', id: 'comment.vote.open' }, { onTrigger: () => setVoteOpen(true) })} className="px-3 h-8 rounded-full bg-[#FE4543] text-white text-[13px]">去投票</button>
        </div>

        {/* 轻触可评价 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-3">
          <div className="text-[13px] text-[#666] mb-2">轻触评价这部作品</div>
          <div className="flex items-center gap-3">
            {RATES.map((r) => {
              const on = rate === r.val;
              return (
                <button
                  key={r.val}
                  {...bindTap({ kind: 'action', id: 'comment.rate.select.opt' }, { params: { val: r.val }, onTrigger: () => { setRate(r.val); showToast(`已评价「${r.val}」`); } })}
                  className="flex-1 h-9 rounded-full text-[14px] border"
                  style={on ? { background: r.color, color: '#fff', borderColor: r.color } : { color: '#666', borderColor: '#E5E5E5' }}
                >{r.val}</button>
              );
            })}
          </div>
        </div>

        {/* 排序 */}
        <div className="mx-3 mt-4 flex items-center gap-4 text-[14px]">
          {SORTS.map((so) => (
            <button key={so} {...bindTap({ kind: 'action', id: 'comment.sort.select.opt' }, { params: { sort: so }, onTrigger: () => setSort(so) })}
              className={sort === so ? 'text-[#333] font-semibold' : 'text-[#999]'}>{so}</button>
          ))}
        </div>

        {/* 评论列表 */}
        <div className="mt-2 pb-4">
          {sorted.map((c) => {
            const liked = likedCommentIds.includes(c.id);
            const isExpanded = expanded.includes(c.id);
            return (
              <div key={c.id} className="mx-3 py-3 border-b border-[#EEE] flex gap-2.5">
                {c.avatar ? <Img src={c.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" /> : <IcUserCircle size={36} className="text-[#CCC] shrink-0" />}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#999]">{c.userName}</span>
                    {c.timePoint !== undefined && (
                      <button {...bindTap({ kind: 'action', id: 'comment.jumptime.tap' }, { params: { sec: c.timePoint }, onTrigger: () => showToast(`已跳转到 ${formatDuration(c.timePoint!)}`) })}
                        className="text-[12px] text-[#FE4543]">{formatDuration(c.timePoint)}</button>
                    )}
                  </div>
                  <div className="text-[14px] text-[#333] mt-1 leading-relaxed">{c.content}</div>
                  <div className="flex items-center gap-4 mt-1.5 text-[12px] text-[#999]">
                    <span>{c.region}</span>
                    {c.replyCount > 0 && (
                      <button {...bindTap({ kind: 'action', id: 'comment.replies.toggle' }, { params: { cid: c.id }, onTrigger: () => setExpanded((p) => p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]) })}
                        className="text-[#576B95]">共{c.replyCount}条回复 {isExpanded ? '收起' : '›'}</button>
                    )}
                    <div className="flex-1" />
                    <button {...bindTap({ kind: 'action', id: 'comment.like.toggle' }, { params: { cid: c.id }, onTrigger: () => toggleLikeComment(c.id) })}
                      className={`flex items-center gap-1 ${liked ? 'text-[#FE4543]' : ''}`}>
                      <IcLike size={15} className={liked ? 'fill-[#FE4543]' : ''} />{c.likeCount + (liked ? 1 : 0)}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="mt-2 bg-[#F7F7F7] rounded-lg p-2 text-[12px] text-[#666] leading-relaxed">
                      听友回复:说得太对了,已经三刷这一段。
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {sorted.length === 0 && <div className="text-center text-[13px] text-[#BBB] py-16">还没有评论,快来抢沙发</div>}
        </div>
      </div>

      {/* 底部输入 */}
      {!inputMode ? (
        <div className="shrink-0 bg-white border-t border-[#EEE] p-2.5">
          <button {...bindTap({ kind: 'action', id: 'comment.inputopen.open' }, { onTrigger: () => setInputMode(true) })}
            className="w-full h-9 rounded-full bg-[#F2F2F2] text-[#999] text-[13px] flex items-center px-4">聊会儿天吧…</button>
        </div>
      ) : (
        <div className="shrink-0 bg-white border-t border-[#EEE] p-2.5 flex flex-col gap-2" data-keep-keyboard="true">
          <button onClick={() => setMarkTime((v) => !v)} className="self-start flex items-center gap-1 text-[12px] text-[#666]">
            <span className={`w-4 h-4 rounded-sm border flex items-center justify-center ${markTime ? 'bg-[#FE4543] border-[#FE4543] text-white' : 'border-[#CCC]'}`}>{markTime && <IcCheck size={12} />}</span>
            标记时间点 {formatDuration(player.progressSec)}
          </button>
          <div className="flex items-center gap-2">
            <input
              autoFocus value={text} onChange={(e) => setText(e.target.value)}
              placeholder="聊会儿天吧…" className="flex-1 h-9 bg-[#F2F2F2] rounded-full px-3 text-[14px] text-[#333]"
              data-keep-keyboard="true"
            />
            <button {...bindTap({ kind: 'action', id: 'comment.send.submit' }, { onTrigger: send })} className="px-4 h-9 rounded-full bg-[#FE4543] text-white text-[14px]" data-keep-keyboard="true">发送</button>
          </div>
        </div>
      )}

      {/* 投票弹窗(本地态) */}
      {voteOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setVoteOpen(false)} />
          <div className="relative bg-white rounded-t-2xl pb-3">
            <div className="h-12 flex items-center justify-center border-b border-[#F2F2F2] relative">
              <span className="text-[15px] font-medium text-[#333]">参与投票</span>
              <button onClick={() => setVoteOpen(false)} className="absolute right-3 text-[#999]"><IcClose size={20} /></button>
            </div>
            <div className="py-2">
              {VOTE_OPTIONS.map((o) => (
                <button key={o} onClick={() => { setVoteOpen(false); showToast('已投票,感谢参与'); }} className="w-full flex items-center px-4 py-3 text-left">
                  <span className="flex-1 text-[14px] text-[#333]">{o}</span>
                  <IcChevronRight size={16} className="text-[#CCC]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
