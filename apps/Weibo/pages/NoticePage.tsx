import React from 'react';
import { useParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { fmtTime } from '../components/StatusCard';
import { useStrings, useToast, Img, EmptyState, TopBar } from '../components/ui';

export default function NoticePage() {
  const s = useStrings();
  const { type = 'atMe' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  const notices = useWeiboStore((st) => st.notices);
  const users = useWeiboStore((st) => st.users);
  const recordNoticeViewed = useWeiboStore((st) => st.recordNoticeViewed);
  React.useEffect(() => { recordNoticeViewed(type); }, [recordNoticeViewed, type]);
  const list = notices.filter((n) => n.type === type).sort((a, b) => b.timestamp - a.timestamp);

  const title = type === 'atMe' ? '所有微博 ▾' : type === 'comments' ? '所有评论 ▾' : s.like;
  const emptyText = type === 'atMe' ? s.emptyAtMe : type === 'comments' ? s.emptyComments : s.emptyLikes;

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar
        backBinding={bindBack()}
        center={
          <button
            {...bindTap({ kind: 'action', id: 'notice.filter.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="text-[15px] font-semibold bg-transparent border-none cursor-pointer"
          >
            {title}
          </button>
        }
        right={<span className="text-[13px] text-[#5B5B5B]">设置</span>}
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container="notice-list" data-scroll-direction="vertical">
        {list.length ? list.map((n) => {
          const u = users.find((x) => x.id === n.userId);
          return (
            <button
              key={n.id}
              {...bindTap('notice.status-open', { params: { id: n.statusId } })}
              className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b border-[#FAFAFA] cursor-pointer text-left"
            >
              <Img src={u?.avatar} label={u?.name?.[0] ?? '通'} className="w-11 h-11 rounded-full object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] text-[#E68A3C] truncate">{u?.name}</div>
                <div className="text-[13px] text-[#5B5B5B] truncate mt-0.5">{n.text}</div>
              </div>
              <span className="text-[11px] text-[#BBBBBB] shrink-0">{fmtTime(n.timestamp)}</span>
            </button>
          );
        }) : <EmptyState text={emptyText} />}
      </div>
      {toastNode}
    </div>
  );
}
