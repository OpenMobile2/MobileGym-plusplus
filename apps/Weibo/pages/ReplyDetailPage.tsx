import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { RichText, fmtTime } from '../components/StatusCard';
import { useStrings, Img, fmtCount } from '../components/ui';
import { IcClose, IcRefresh, IcLike } from '../res/icons';

export default function ReplyDetailPage() {
  const s = useStrings();
  const { id = '', cid = '' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();

  const statuses = useWeiboStore((st) => st.statuses);
  const users = useWeiboStore((st) => st.users);
  const me = useWeiboStore((st) => st.me);
  const toggleLikeComment = useWeiboStore((st) => st.toggleLikeComment);
  const addComment = useWeiboStore((st) => st.addComment);

  const status = statuses.find((x) => x.id === id);
  const parent = status?.commentList.find((c) => c.id === cid);
  const [sortHot, setSortHot] = useState(true);
  const [draft, setDraft] = useState('');
  const panelOpen = searchParams.get('panel') === 'reply';

  const replies = useMemo(() => {
    if (!parent) return [];
    const list = [...parent.replies];
    return sortHot ? list.sort((a, b) => b.likes - a.likes) : list.sort((a, b) => b.timestamp - a.timestamp);
  }, [parent, sortHot]);

  const userOf = (uid: string) => (uid === 'me' ? me : users.find((u) => u.id === uid));

  if (!status || !parent) return null;
  const pu = userOf(parent.userId);

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center h-11 px-2 shrink-0 border-b border-[#F7F7F7]">
        <IcRefresh size={16} className="text-[#7F7F7F] ml-1" />
        <div className="flex-1 text-center text-[15px] font-semibold">{parent.replies.length + 1}条回复</div>
        <button {...bindBack()} className="bg-transparent border-none cursor-pointer text-[#1A1A1A] p-1"><IcClose size={20} /></button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="reply-list" data-scroll-direction="vertical">
        {/* 父评论 */}
        <div className="flex gap-2 px-3 py-3 border-b border-[#F5F5F5]">
          <Img src={pu?.avatar} label={pu?.name?.[0] ?? '评'} className="w-9 h-9 rounded-full object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#E68A3C]">{pu?.name}</div>
            <RichText text={parent.text} className="block text-[15px] text-[#1A1A1A] mt-0.5" />
            <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9A9A9A]">
              <span>{fmtTime(parent.timestamp)} {parent.region}</span>
              <span className="flex-1" />
              <span className="flex items-center gap-0.5"><IcLike size={13} />{fmtCount(parent.likes)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center px-3 h-9">
          <span className="text-[13px] text-[#7F7F7F]">全部回复</span>
          <span className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'replyDetail.sort.toggle' }, { onTrigger: () => setSortHot((v) => !v) })}
            className="text-[12px] text-[#7F7F7F] bg-transparent border-none cursor-pointer"
          >
            按{sortHot ? '热度' : '时间'} ∨
          </button>
        </div>

        {replies.map((r) => {
          const u = userOf(r.userId);
          return (
            <div key={r.id} className="flex gap-2 px-3 py-2.5 border-b border-[#FAFAFA]">
              <Img src={u?.avatar} label={u?.name?.[0] ?? '评'} className="w-8 h-8 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#E68A3C]">{u?.name}</div>
                <RichText
                  text={r.replyTo ? `回复@${r.replyTo}:${r.text}` : r.text}
                  className="block text-[14px] text-[#1A1A1A] mt-0.5"
                />
                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9A9A9A]">
                  <span>{fmtTime(r.timestamp)} {r.region}</span>
                  <span className="flex-1" />
                  <button
                    {...bindTap({ kind: 'action', id: 'replyDetail.like.toggle' }, {
                      params: { commentId: r.id },
                      onTrigger: () => toggleLikeComment(id, r.id),
                    })}
                    className={`flex items-center gap-0.5 bg-transparent border-none cursor-pointer ${r.likedByMe ? 'text-[#FF6533]' : 'text-[#9A9A9A]'}`}
                  >
                    <IcLike size={13} fill={r.likedByMe ? '#FF6533' : 'none'} />
                    {r.likes > 0 ? fmtCount(r.likes) : ''}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部回复条 */}
      <div className="px-3 py-2 border-t border-[#F2F2F2] shrink-0" data-keep-keyboard="true">
        {panelOpen ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`回复@${pu?.name}`}
              className="flex-1 h-9 bg-[#F5F5F5] rounded-full px-3 text-[14px] border-none outline-none"
            />
            <button
              onClick={() => {
                if (!draft.trim()) return;
                addComment(id, draft.trim(), cid);
                setDraft('');
                setSearchParams((p) => { p.delete('panel'); return p; }, { replace: true });
              }}
              className={`h-8 px-4 rounded-full text-white text-[13px] border-none cursor-pointer ${draft.trim() ? 'bg-[#FF8200]' : 'bg-[#FFCC99]'}`}
            >
              {s.comment}
            </button>
          </div>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'replyDetail.replyPanel.open' }, {
              onTrigger: () => setSearchParams((p) => { p.set('panel', 'reply'); return p; }, { replace: true }),
            })}
            className="w-full h-9 rounded-full bg-[#F5F5F5] text-left px-3 text-[13px] text-[#9A9A9A] border-none cursor-pointer"
          >
            回复@{pu?.name}
          </button>
        )}
      </div>
    </div>
  );
}
